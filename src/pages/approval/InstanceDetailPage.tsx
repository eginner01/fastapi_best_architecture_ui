/**
 * 审批实例详情页面（只读）
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { getInstance } from '@/api/approval';

export default function InstanceDetailPage() {
  const navigate = useNavigate();
  const { instanceId } = useParams<{ instanceId: string }>();
  const { toast } = useToast();
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 加载实例详情
  useEffect(() => {
    if (instanceId) {
      loadInstance();
    }
  }, [instanceId]);

  const loadInstance = async () => {
    if (!instanceId) return;
    
    setLoading(true);
    try {
      const data = await getInstance(parseInt(instanceId));
      console.log('[InstanceDetail] 加载实例:', data);
      setInstance(data);
    } catch (error) {
      console.error('[InstanceDetail] 加载实例失败:', error);
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

  // 状态显示
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      PENDING: { label: '审批中', icon: Clock, variant: 'outline' },
      APPROVED: { label: '已通过', icon: CheckCircle, variant: 'default' },
      REJECTED: { label: '已拒绝', icon: XCircle, variant: 'destructive' },
      CANCELLED: { label: '已取消', icon: AlertCircle, variant: 'secondary' },
    };
    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

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
          <div className="text-muted-foreground">未找到审批实例</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="审批详情"
        description="查看审批实例的详细信息"
      />

      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/approval/initiated')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>审批实例的基本信息</CardDescription>
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
              <div className="text-sm text-muted-foreground">状态</div>
              <div>{getStatusBadge(instance.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">紧急程度</div>
              <div>{getUrgencyBadge(instance.urgency)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">发起时间</div>
              <div className="font-medium">{new Date(instance.started_at).toLocaleString('zh-CN')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">完成时间</div>
              <div className="font-medium">
                {instance.ended_at ? new Date(instance.ended_at).toLocaleString('zh-CN') : '-'}
              </div>
            </div>
          </div>

          {/* 申请内容 */}
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

      {/* 审批历史 */}
      {instance.steps && instance.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>审批历史</CardTitle>
            <CardDescription>查看审批流转记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {instance.steps.map((step: any, index: number) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                      step.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      step.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {step.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> :
                       step.status === 'REJECTED' ? <XCircle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    {index < instance.steps.length - 1 && (
                      <div className="w-0.5 h-16 bg-border my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{step.node_name}</span>
                      <Badge variant={
                        step.status === 'APPROVED' ? 'default' :
                        step.status === 'REJECTED' ? 'destructive' :
                        step.status === 'CANCELLED' ? 'secondary' :
                        'outline'
                      }>
                        {step.status === 'APPROVED' ? '已通过' :
                         step.status === 'REJECTED' ? '已拒绝' :
                         step.status === 'CANCELLED' ? '已取消' :
                         '待处理'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      审批人: {step.assignee_name || '-'}
                    </div>
                    {step.opinion && (
                      <div className="text-sm mt-2 text-muted-foreground">
                        意见: {step.opinion}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.completed_at ? new Date(step.completed_at).toLocaleString('zh-CN') : '待处理'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
