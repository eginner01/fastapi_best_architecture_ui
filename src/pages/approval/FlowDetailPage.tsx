/**
 * 流程详情页面
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { getFlow, deleteFlow, publishFlow, unpublishFlow } from '@/api/approval';
import type { Flow } from '@/api/approval';

export default function FlowDetailPage() {
  const navigate = useNavigate();
  const { flowId } = useParams();
  const { toast } = useToast();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载流程详情
  const loadFlow = async () => {
    if (!flowId) return;
    
    setLoading(true);
    try {
      const response = await getFlow(parseInt(flowId));
      console.log('[FlowDetail] 加载流程详情:', response);
      setFlow(response);
    } catch (error) {
      console.error('[FlowDetail] 加载失败:', error);
      toast({
        title: '加载失败',
        description: '获取流程详情失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  // 删除流程
  const handleDelete = async () => {
    if (!flow) return;
    
    if (!confirm('确定要删除这个流程吗？')) return;
    
    try {
      await deleteFlow(flow.id);
      toast({
        title: '删除成功',
        description: '流程已删除',
      });
      navigate('/approval/flow-manage');
    } catch (error) {
      toast({
        title: '删除失败',
        description: '删除流程失败',
        variant: 'destructive',
      });
    }
  };

  // 发布/取消发布
  const handleTogglePublish = async () => {
    if (!flow) return;
    
    try {
      flow.is_published
        ? await unpublishFlow(flow.id)
        : await publishFlow(flow.id);
      
      toast({
        title: '操作成功',
        description: flow.is_published ? '流程已取消发布' : '流程已发布',
      });
      loadFlow();
    } catch (error) {
      toast({
        title: '操作失败',
        description: '发布状态更新失败',
        variant: 'destructive',
      });
    }
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

  if (!flow) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">流程不存在</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="流程详情"
        description="查看流程的完整配置信息"
      />

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" onClick={() => navigate('/approval/flow-manage')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        <Button variant="outline" onClick={() => navigate(`/approval/flow-design/${flow.id}`)}>
          <Edit className="w-4 h-4 mr-2" />
          编辑流程
        </Button>
        <Button variant="outline" onClick={handleTogglePublish}>
          {flow.is_published ? (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              取消发布
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              发布流程
            </>
          )}
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          删除流程
        </Button>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>流程的基本配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">流程编号</div>
              <div className="font-medium">{flow.flow_no}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">流程名称</div>
              <div className="font-medium">{flow.name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">分类</div>
              <div className="font-medium">{flow.category || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">版本</div>
              <div className="font-medium">v{flow.version}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">状态</div>
              <div className="flex items-center gap-2">
                {flow.is_active ? (
                  <Badge>激活</Badge>
                ) : (
                  <Badge variant="secondary">未激活</Badge>
                )}
                {flow.is_published ? (
                  <Badge variant="default">已发布</Badge>
                ) : (
                  <Badge variant="outline">未发布</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">创建时间</div>
              <div className="font-medium">{new Date(flow.created_time).toLocaleString('zh-CN')}</div>
            </div>
          </div>

          {flow.description && (
            <div>
              <div className="text-sm text-muted-foreground">流程描述</div>
              <div className="font-medium">{flow.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 流程节点 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>流程节点</CardTitle>
          <CardDescription>审批流程的节点配置</CardDescription>
        </CardHeader>
        <CardContent>
          {flow.nodes && flow.nodes.length > 0 ? (
            <div className="space-y-3">
              {flow.nodes.map((node, index) => (
                <div
                  key={node.node_no}
                  className="flex items-center gap-3 p-4 border rounded-lg"
                >
                  {/* 节点序号 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>

                  {/* 节点信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{node.name}</span>
                      <Badge variant={
                        node.node_type === 'START' ? 'default' :
                        node.node_type === 'END' ? 'secondary' :
                        'outline'
                      }>
                        {node.node_type === 'START' ? '开始' :
                         node.node_type === 'END' ? '结束' :
                         node.approval_type === 'SINGLE' ? '单人审批' :
                         node.approval_type === 'MULTI_OR' ? '多人或签' :
                         '多人会签'}
                      </Badge>
                    </div>
                    {node.node_type === 'APPROVAL' && (
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const assigneeNames = (node as any).assignee_names;
                          console.log('[FlowDetail] 节点审批人信息:', {
                            node_id: (node as any).id,
                            assignee_type: node.assignee_type,
                            assignee_value: node.assignee_value,
                            assignee_names: assigneeNames
                          });
                          
                          const typeLabel = node.assignee_type === 'USER' ? '指定用户' :
                                          node.assignee_type === 'ROLE' ? '指定角色' :
                                          '指定部门';
                          
                          if (assigneeNames) {
                            return `审批人：${typeLabel} - ${assigneeNames}`;
                          } else if (node.assignee_value) {
                            return `审批人：${typeLabel} (ID: ${node.assignee_value})`;
                          } else {
                            return `审批人：${typeLabel}`;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              暂无节点配置
            </div>
          )}
        </CardContent>
      </Card>

      {/* 表单配置 */}
      {flow.form_schema && (
        <Card>
          <CardHeader>
            <CardTitle>表单配置</CardTitle>
            <CardDescription>流程的表单字段定义</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(flow.form_schema, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
