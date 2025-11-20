/**
 * 我发起的审批页面
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
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
import { getMyInitiated, cancelInstance } from '@/api/approval';
import type { Instance } from '@/api/approval';

export default function InitiatedListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

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
    loadInstances();
  }, [page]);

  // 取消流程
  const handleCancel = async () => {
    if (!selectedInstanceId) return;
    
    console.log('[InitiatedList] 取消流程, instanceId:', selectedInstanceId);
    
    try {
      await cancelInstance(selectedInstanceId);
      toast({
        title: '取消成功',
        description: '流程已取消，所有待办任务已同步撤销',
      });
      loadInstances();
    } catch (error: any) {
      console.error('[InitiatedList] 取消失败:', error);
      toast({
        title: '取消失败',
        description: error.message || '取消流程失败',
        variant: 'destructive',
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedInstanceId(null);
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
                        >
                          <X className="w-4 h-4 text-red-500" />
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

      {/* 取消确认对话框 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消</AlertDialogTitle>
            <AlertDialogDescription>
              确定要取消这个审批吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>确定取消</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
