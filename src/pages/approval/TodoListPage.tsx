/**
 * 待办任务页面
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Clock, User, Calendar, Zap, AlertTriangle, ArrowRight, Inbox, FileText } from 'lucide-react';
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
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { getMyTodo } from '@/api/approval';

interface TodoTask {
  step_id: number;
  instance_id: number;
  instance_no: string;
  title: string;
  flow_name: string;
  applicant_name: string;
  status: string;
  action?: string;  // 处理动作：APPROVE/REJECT/DELEGATE/RETURN
  urgency: string;
  started_at: string;
  is_read: boolean;
}

export default function TodoListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载待办任务
  const loadTasks = async () => {
    console.log('[TodoList] 加载待办任务, page:', page);
    setLoading(true);
    try {
      const response = await getMyTodo({ page, size: 10 });
      console.log('[TodoList] 待办任务响应:', response);
      // ApiClient已经解包响应，直接使用response
      setTasks(response.items || []);
      setTotal(response.total || 0);
      console.log('[TodoList] 待办任务数量:', response.items?.length || 0);
    } catch (error) {
      console.error('[TodoList] 加载失败:', error);
      toast({
        title: '加载失败',
        description: '获取待办任务失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[TodoList] 页面加载或page变化, page:', page);
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 监听路由状态，当从审批处理页面返回时自动刷新
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('[TodoList] 检测到刷新标志，时间戳:', location.state.timestamp);
      loadTasks();
      // 清除刷新标志
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.timestamp]);

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

  // 计算时长
  const getElapsedTime = (startedAt: string) => {
    const diff = Date.now() - new Date(startedAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}天前`;
    }
  };

  // 获取处理状态徽章
  const getStatusBadge = (status: string, action?: string) => {
    // 如果有 action，说明已处理
    if (action) {
      const actionMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
        APPROVE: { label: '已同意', variant: 'default' },
        REJECT: { label: '已拒绝', variant: 'destructive' },
        DELEGATE: { label: '已转交', variant: 'secondary' },
        RETURN: { label: '已退回', variant: 'outline' },
      };
      const config = actionMap[action] || { label: '已处理', variant: 'outline' };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }
    
    // 未处理状态
    if (status === 'PENDING' || status === 'PROCESSING') {
      return <Badge variant="outline" className="border-blue-500 text-blue-600">待处理</Badge>;
    }
    
    return <Badge variant="secondary">未知</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader
        title="审批流 - 我的待办"
        description="我的待办审批任务"
      />


      {/* 待办列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>实例编号</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>申请人</TableHead>
              <TableHead>处理状态</TableHead>
              <TableHead>紧急程度</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>待办时长</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无待办任务
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.step_id}>
                  <TableCell className="font-mono">{task.instance_no}</TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.applicant_name}</TableCell>
                  <TableCell>{getStatusBadge(task.status, task.action)}</TableCell>
                  <TableCell>{getUrgencyBadge(task.urgency)}</TableCell>
                  <TableCell>{new Date(task.started_at).toLocaleString('zh-CN')}</TableCell>
                  <TableCell>{getElapsedTime(task.started_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/approval/process/${task.step_id}?step=${task.step_id}&instance=${task.instance_id}`)}
                      disabled={!!task.action}
                    >
                      {task.action ? '已处理' : '处理'}
                    </Button>
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
    </PageContainer>
  );
}
