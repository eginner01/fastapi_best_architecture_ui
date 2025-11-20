/**
 * 我发起的审批页面
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { getMyInitiated, cancelInstance, deleteInstance } from '@/api/approval';
import type { Instance } from '@/api/approval';

export default function InitiatedListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  // 加载我发起的审批
  const loadInstances = async () => {
    console.log('[InitiatedList] 加载我发起的审批, page:', page);
    setLoading(true);
    try {
      const response = await getMyInitiated({ page, size: 10 });
      console.log('[InitiatedList] 我发起的响应:', response);
      // ApiClient已经解包响应，直接使用response
      setInstances(response.items || []);
      setTotal(response.total || 0);
      console.log('[InitiatedList] 我发起的数量:', response.items?.length || 0);
    } catch (error) {
      console.error('[InitiatedList] 加载失败:', error);
      toast({
        title: '加载失败',
        description: '获取发起列表失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[InitiatedList] 页面加载或page变化, page:', page);
    loadInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 监听路由状态，当从其他页面返回时自动刷新
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('[InitiatedList] 检测到刷新标志，时间戳:', location.state.timestamp);
      loadInstances();
      // 清除刷新标志
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.timestamp]);

  // 取消流程（撤销）
  const handleCancel = async () => {
    if (!selectedInstanceId) return;
    
    console.log('[InitiatedList] 取消流程, instanceId:', selectedInstanceId);
    
    try {
      await cancelInstance(selectedInstanceId);
      toast({
        title: '撤销成功',
        description: '流程已撤销，所有待办任务已同步取消',
      });
      loadInstances();
    } catch (error: any) {
      console.error('[InitiatedList] 撤销失败:', error);
      toast({
        title: '撤销失败',
        description: error.message || '撤销流程失败',
        variant: 'destructive',
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedInstanceId(null);
    }
  };

  // 删除流程
  const handleDelete = async () => {
    if (!selectedInstanceId) return;
    
    console.log('[InitiatedList] 删除流程, instanceId:', selectedInstanceId);
    
    try {
      await deleteInstance(selectedInstanceId);
      toast({
        title: '删除成功',
        description: '流程记录已删除',
      });
      loadInstances();
    } catch (error: any) {
      console.error('[InitiatedList] 删除失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '删除流程失败',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedInstanceId(null);
      setSelectedInstance(null);
    }
  };

  // 状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      PENDING: { label: '审批中', variant: 'default' },
      APPROVED: { label: '已通过', variant: 'outline' },
      REJECTED: { label: '已驳回', variant: 'destructive' },
      CANCELLED: { label: '已取消', variant: 'secondary' },
    };
    const config = statusMap[status] || statusMap.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader
        title="审批流 - 我发起的"
        description="我发起的审批申请"
      />

      {/* 审批列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>实例编号</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>紧急程度</TableHead>
              <TableHead>发起时间</TableHead>
              <TableHead>完成时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell className="font-mono">{instance.instance_no}</TableCell>
                  <TableCell className="font-medium">{instance.title}</TableCell>
                  <TableCell>{getStatusBadge(instance.status)}</TableCell>
                  <TableCell>
                    <Badge variant={instance.urgency === 'URGENT' ? 'destructive' : 'outline'}>
                      {instance.urgency === 'URGENT' ? '紧急' : instance.urgency === 'HIGH' ? '高' : '普通'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(instance.started_at).toLocaleString('zh-CN')}</TableCell>
                  <TableCell>
                    {instance.ended_at ? new Date(instance.ended_at).toLocaleString('zh-CN') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/approval/detail/${instance.id}`)}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {instance.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInstanceId(instance.id);
                            setCancelDialogOpen(true);
                          }}
                          title="撤销审批"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {instance.status !== 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInstanceId(instance.id);
                            setSelectedInstance(instance);
                            setDeleteDialogOpen(true);
                          }}
                          title="删除记录"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} 页，共 {Math.ceil(total / 10)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(Math.ceil(total / 10), page + 1))}
            disabled={page >= Math.ceil(total / 10)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 撤销确认对话框 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认撤销</AlertDialogTitle>
            <AlertDialogDescription>
              确定要撤销这个审批吗？所有待办任务将被取消，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-orange-600 hover:bg-orange-700">
              确定撤销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条审批记录吗？
              {selectedInstance && (
                <div className="mt-2 text-sm">
                  <div>实例编号：{selectedInstance.instance_no}</div>
                  <div>标题：{selectedInstance.title}</div>
                  <div className="text-red-600 mt-2">此操作不可恢复！</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
