/**
 * 审批处理页面
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, X, UserPlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getInstance, processStep, getFlow } from '@/api/approval';
import { getAllUsers } from '@/api/system';

export default function ProcessApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stepId = searchParams.get('step');
  const instanceId = searchParams.get('instance');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [instance, setInstance] = useState<any>(null);
  const [opinion, setOpinion] = useState('');
  const [flow, setFlow] = useState<any>(null);
  
  // 转交对话框
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // 退回对话框
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // 加载审批实例详情
  useEffect(() => {
    if (instanceId) {
      loadInstance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const loadInstance = async () => {
    if (!instanceId) return;
    
    setLoading(true);
    try {
      const data = await getInstance(parseInt(instanceId));
      console.log('[ProcessApproval] 加载实例:', data);
      setInstance(data);
      
      // 加载流程信息（用于退回）
      if (data.flow_id) {
        const flowData = await getFlow(data.flow_id);
        console.log('[ProcessApproval] 加载流程:', flowData);
        setFlow(flowData);
      }
    } catch (error) {
      console.error('[ProcessApproval] 加载实例失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载审批详情',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 格式化字段标签
  const formatFieldLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      description: '申请描述',
      reason: '申请原因',
      amount: '申请金额',
      date: '申请日期',
      type: '申请类型',
      department: '申请部门',
      title: '标题',
      content: '内容',
      attachment: '附件',
      remark: '备注',
    };
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 格式化字段值
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (value === '') {
      return '-';
    }
    return String(value);
  };

  // 加载用户列表（用于转交）
  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers();
      console.log('[ProcessApproval] 加载用户列表:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('[ProcessApproval] 加载用户列表失败:', error);
    }
  };

  // 处理审批
  const handleProcess = async (action: string, extraParams?: any) => {
    if (!stepId) {
      toast({
        title: '参数错误',
        description: '缺少步骤ID',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await processStep(parseInt(stepId), {
        action,
        opinion: opinion || undefined,
        ...extraParams,
      });

      const actionText = 
        action === 'APPROVE' ? '同意' : 
        action === 'REJECT' ? '拒绝' : 
        action === 'DELEGATE' ? '转交' :
        action === 'RETURN' ? '退回' : '处理';
      
      toast({
        title: '操作成功',
        description: `审批已${actionText}`,
      });

      navigate('/approval/todo');
    } catch (error: any) {
      console.error('[ProcessApproval] 处理失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 打开转交对话框
  const handleOpenDelegateDialog = () => {
    loadUsers();
    setDelegateDialogOpen(true);
  };

  // 确认转交
  const handleConfirmDelegate = async () => {
    if (!selectedUserId) {
      toast({
        title: '请选择转交对象',
        variant: 'destructive',
      });
      return;
    }
    
    setDelegateDialogOpen(false);
    await handleProcess('DELEGATE', { delegate_to: selectedUserId });
  };

  // 打开退回对话框
  const handleOpenReturnDialog = () => {
    setReturnDialogOpen(true);
  };

  // 确认退回
  const handleConfirmReturn = async () => {
    if (!selectedNodeId) {
      toast({
        title: '请选择退回节点',
        variant: 'destructive',
      });
      return;
    }
    
    setReturnDialogOpen(false);
    await handleProcess('RETURN', { return_to_node: selectedNodeId });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </PageContainer>
    );
  }

  if (!instance) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">审批不存在</div>
        </div>
      </PageContainer>
    );
  }

  // 检查是否已撤销
  const isCancelled = instance.status === 'CANCELLED';

  // 紧急程度显示
  const getUrgencyBadge = (urgency: string) => {
    const urgencyMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      LOW: { label: '低', variant: 'secondary' },
      NORMAL: { label: '普通', variant: 'outline' },
      HIGH: { label: '高', variant: 'default' },
      URGENT: { label: '紧急', variant: 'destructive' },
    };
    const config = urgencyMap[urgency] || urgencyMap.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader
        title="审批处理"
        description={isCancelled ? "该审批已被撤销" : "查看并处理审批申请"}
      />

      {/* 撤销提示 */}
      {isCancelled && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-orange-800">
            <X className="w-5 h-5" />
            <div>
              <div className="font-semibold">该审批已被撤销</div>
              <div className="text-sm">申请人已取消此审批，无法继续处理</div>
            </div>
          </div>
        </div>
      )}

      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/approval/todo')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回待办
        </Button>
      </div>

      {/* 审批信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>审批信息</CardTitle>
          <CardDescription>查看审批申请的详细信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">实例编号</div>
              <div className="font-medium font-mono">{instance.instance_no}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">标题</div>
              <div className="font-medium">{instance.title}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">紧急程度</div>
              <div>{getUrgencyBadge(instance.urgency)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">发起时间</div>
              <div className="font-medium">{new Date(instance.started_at).toLocaleString('zh-CN')}</div>
            </div>
          </div>

          {instance.form_data && (
            <div>
              <div className="text-sm text-muted-foreground mb-3">申请内容</div>
              <div className="bg-muted/50 rounded-lg overflow-hidden">
                {typeof instance.form_data === 'object' && Object.keys(instance.form_data).length > 0 ? (
                  <div className="divide-y divide-border">
                    {Object.entries(instance.form_data).map(([key, value]) => (
                      <div key={key} className="px-4 py-3 hover:bg-muted/80 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="text-sm font-medium text-muted-foreground min-w-[100px] pt-0.5">
                            {formatFieldLabel(key)}
                          </div>
                          <div className="flex-1 text-sm">
                            {formatFieldValue(value)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无申请内容
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审批意见 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>审批意见</CardTitle>
          <CardDescription>填写您的审批意见（可选）</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="请输入审批意见..."
            rows={6}
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => handleProcess('APPROVE')} 
          disabled={submitting || isCancelled}
          className="bg-green-600 hover:bg-green-700"
          title={isCancelled ? "审批已撤销，无法处理" : ""}
        >
          <Check className="w-4 h-4 mr-2" />
          同意
        </Button>
        <Button 
          onClick={() => handleProcess('REJECT')} 
          disabled={submitting || isCancelled}
          variant="destructive"
          title={isCancelled ? "审批已撤销，无法处理" : ""}
        >
          <X className="w-4 h-4 mr-2" />
          拒绝
        </Button>
        <Button 
          variant="outline"
          disabled={submitting || isCancelled}
          onClick={handleOpenDelegateDialog}
          title={isCancelled ? "审批已撤销，无法处理" : "转交给其他人处理"}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          转交
        </Button>
        <Button 
          variant="outline"
          disabled={submitting || isCancelled}
          onClick={handleOpenReturnDialog}
          title={isCancelled ? "审批已撤销，无法处理" : "退回到上一节点"}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          退回
        </Button>
      </div>

      {/* 转交对话框 */}
      <Dialog open={delegateDialogOpen} onOpenChange={setDelegateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转交审批</DialogTitle>
            <DialogDescription>
              选择要转交的用户，该用户将接手此审批任务
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delegate-user">选择用户</Label>
              <select
                id="delegate-user"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
              >
                <option value="">请选择用户</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nickname || user.username} ({user.dept?.name || '无部门'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelegateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmDelegate}>
              确认转交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退回对话框 */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退回审批</DialogTitle>
            <DialogDescription>
              选择要退回到的节点，流程将从该节点重新开始
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="return-node">选择节点</Label>
              <select
                id="return-node"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedNodeId || ''}
                onChange={(e) => setSelectedNodeId(Number(e.target.value))}
              >
                <option value="">请选择节点</option>
                {flow?.nodes?.filter((node: any) => node.node_type === 'APPROVAL').map((node: any) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmReturn}>
              确认退回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
