/**
 * 发起审批页面
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { getFlow, createInstance } from '@/api/approval';

export default function StartApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get('flowId');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flow, setFlow] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'NORMAL',
  });

  // 加载流程信息
  useEffect(() => {
    if (flowId) {
      loadFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  const loadFlow = async () => {
    if (!flowId) return;
    
    setLoading(true);
    try {
      const data = await getFlow(parseInt(flowId));
      console.log('[StartApproval] 加载流程:', data);
      setFlow(data);
    } catch (error) {
      console.error('[StartApproval] 加载流程失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载流程信息',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 提交审批
  const handleSubmit = async () => {
    if (!formData.title) {
      toast({
        title: '验证失败',
        description: '请填写审批标题',
        variant: 'destructive',
      });
      return;
    }

    if (!flowId) {
      toast({
        title: '参数错误',
        description: '缺少流程ID',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        flow_id: parseInt(flowId),
        title: formData.title,
        form_data: {
          description: formData.description,
        },
        urgency: formData.urgency,
      };
      
      console.log('[StartApproval] 提交审批:', data);
      const result = await createInstance(data);
      console.log('[StartApproval] 提交结果:', result);

      toast({
        title: '提交成功',
        description: '审批已提交，等待处理',
      });

      navigate('/approval/initiated');
    } catch (error: any) {
      console.error('[StartApproval] 提交失败:', error);
      toast({
        title: '提交失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
        title={`发起审批 - ${flow.name}`}
        description="填写审批申请信息"
      />

      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/approval/flow-manage')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>

      {/* 表单 */}
      <Card>
        <CardHeader>
          <CardTitle>审批信息</CardTitle>
          <CardDescription>请填写审批申请的相关信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">审批标题 *</Label>
            <Input
              id="title"
              placeholder="例如：请假申请"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">申请说明</Label>
            <Textarea
              id="description"
              placeholder="请描述申请的具体内容"
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">紧急程度</Label>
            <select
              id="urgency"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            >
              <option value="LOW">低</option>
              <option value="NORMAL">普通</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? '提交中...' : '提交审批'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/approval/flow-manage')}>
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
