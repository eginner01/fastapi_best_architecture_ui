/**
 * 流程管理页面
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Power, PowerOff, Play, Search, Filter, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getFlowList, deleteFlow, publishFlow, unpublishFlow } from '@/api/approval';
import type { Flow } from '@/api/approval';

export default function FlowManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);

  // 加载流程列表
  const loadFlows = async () => {
    console.log('[FlowManagement] 开始加载流程列表, page:', page);
    setLoading(true);
    try {
      const response = await getFlowList({
        name: searchName || undefined,
        page,
        size: 10,
      });
      console.log('[FlowManagement] 加载流程列表成功:', response);
      // ApiClient已经解包响应，直接使用response
      setFlows(response.items || []);
      setTotal(response.total || 0);
      console.log('[FlowManagement] 流程数量:', response.items?.length || 0);
    } catch (error) {
      console.error('[FlowManagement] 加载流程列表失败:', error);
      toast({
        title: '加载失败',
        description: '获取流程列表失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面变化或组件挂载时加载数据
  useEffect(() => {
    console.log('[FlowManagement] 页面变化或组件挂载，page:', page);
    loadFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    loadFlows();
  };

  // 删除流程
  const handleDelete = async () => {
    if (!selectedFlowId) return;
    
    try {
      await deleteFlow(selectedFlowId);
      toast({
        title: '删除成功',
        description: '流程已删除',
      });
      loadFlows();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '删除流程失败',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFlowId(null);
    }
  };

  // 发布/取消发布
  const handleTogglePublish = async (flowId: number, isPublished: boolean) => {
    try {
      isPublished
        ? await unpublishFlow(flowId)
        : await publishFlow(flowId);
      
      toast({
        title: '操作成功',
        description: isPublished ? '流程已取消发布' : '流程已发布',
      });
      loadFlows();
    } catch (error) {
      toast({
        title: '操作失败',
        description: '发布状态更新失败',
        variant: 'destructive',
      });
    }
  };

  // 过滤流程
  const filteredFlows = flows.filter(flow => {
    const matchSearch = !searchQuery || 
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'published' && flow.is_published) ||
      (filterStatus === 'draft' && !flow.is_published);
    return matchSearch && matchStatus;
  });

  return (
    <PageContainer>
      <PageHeader
        title="审批流 - 流程管理"
        description="创建和管理审批流程模板"
      />

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <Button onClick={() => navigate('/approval/flow-design')}>
          <Plus className="w-4 h-4 mr-2" />
          创建流程
        </Button>
      </div>

      {/* 流程列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>流程编号</TableHead>
              <TableHead>流程名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
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
            ) : flows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="font-mono">{flow.flow_no}</TableCell>
                  <TableCell className="font-medium">{flow.name}</TableCell>
                  <TableCell>{flow.category || '-'}</TableCell>
                  <TableCell>v{flow.version}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {flow.is_published ? (
                        <Badge variant="default">已发布</Badge>
                      ) : (
                        <Badge variant="secondary">未发布</Badge>
                      )}
                      {flow.is_active ? (
                        <Badge variant="outline">激活</Badge>
                      ) : (
                        <Badge variant="destructive">停用</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(flow.created_time).toLocaleString('zh-CN')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {flow.is_published && flow.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/approval/start?flowId=${flow.id}`)}
                          title="发起审批"
                        >
                          <Play className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/approval/flow-detail/${flow.id}`)}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/approval/flow-design/${flow.id}`)}
                        title="编辑流程"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(flow.id, flow.is_published)}
                        title={flow.is_published ? "取消发布" : "发布流程"}
                      >
                        {flow.is_published ? (
                          <PowerOff className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Power className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlowId(flow.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="删除流程"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个流程吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确定删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
