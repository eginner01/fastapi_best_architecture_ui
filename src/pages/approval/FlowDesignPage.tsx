/**
 * 流程设计页面 - 创建/编辑流程
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, MoveUp, MoveDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createFlow, getFlow, updateFlow } from '@/api/approval';
import { getAllUsers, getAllRoles, getAllDepartments, type User, type Role, type Department } from '@/api/system';

interface FlowNode {
  node_no: string;
  name: string;
  node_type: 'START' | 'APPROVAL' | 'END';
  approval_type?: 'SINGLE' | 'MULTI_OR' | 'MULTI_AND';
  assignee_type?: 'USER' | 'ROLE' | 'DEPT';
  assignee_value?: string;
  order_num: number;
  is_first: boolean;
  is_final: boolean;
}

interface FlowLine {
  line_no: string;
  from_node_id: string;
  to_node_id: string;
  condition_type?: string;
  priority: number;
}

export default function FlowDesignPage() {
  const navigate = useNavigate();
  const { flowId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 选择器数据
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    flow_no: '',
    name: '',
    category: 'general',
    description: '',
    icon: 'FileCheck',
  });

  // 流程节点
  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      node_no: 'START',
      name: '开始',
      node_type: 'START',
      order_num: 0,
      is_first: true,
      is_final: false,
    },
    {
      node_no: 'END',
      name: '结束',
      node_type: 'END',
      order_num: 999,
      is_first: false,
      is_final: true,
    },
  ]);

  // 当前编辑的节点
  const [currentNode, setCurrentNode] = useState<FlowNode>({
    node_no: '',
    name: '',
    node_type: 'APPROVAL',
    approval_type: 'SINGLE',
    assignee_type: 'USER',
    assignee_value: '',
    order_num: 1,
    is_first: false,
    is_final: false,
  });

  // 加载流程数据（编辑模式）
  const loadFlowData = async () => {
    if (!flowId) return;
    
    console.log('[FlowDesign] 加载流程数据, flowId:', flowId);
    setLoading(true);
    
    try {
      const flow = await getFlow(parseInt(flowId));
      console.log('[FlowDesign] 加载的流程数据:', flow);
      
      // 设置基本信息
      setFormData({
        flow_no: flow.flow_no,
        name: flow.name,
        category: flow.category || 'general',
        description: flow.description || '',
        icon: flow.icon || 'FileCheck',
      });
      
      // 设置节点（过滤掉开始和结束节点，因为会自动添加）
      if (flow.nodes && flow.nodes.length > 0) {
        const approvalNodes = flow.nodes.filter(
          (n: any) => n.node_type === 'APPROVAL'
        );
        
        // 重建nodes列表（开始 + 审批节点 + 结束）
        const startNode: FlowNode = {
          node_no: 'START',
          name: '开始',
          node_type: 'START',
          order_num: 0,
          is_first: true,
          is_final: false,
        };
        
        const endNode: FlowNode = {
          node_no: 'END',
          name: '结束',
          node_type: 'END',
          order_num: approvalNodes.length + 1,
          is_first: false,
          is_final: true,
        };
        
        setNodes([startNode, ...approvalNodes, endNode]);
      }
      
      setIsEditMode(true);
      toast({
        title: '加载成功',
        description: '流程数据已加载',
      });
    } catch (error) {
      console.error('[FlowDesign] 加载流程失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载流程数据',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时检查是否为编辑模式
  useEffect(() => {
    if (flowId) {
      console.log('[FlowDesign] 检测到flowId，加载流程数据');
      loadFlowData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  // 加载选择器数据
  const loadOptions = async () => {
    console.log('[FlowDesign] 开始加载选择器数据...');
    setLoadingOptions(true);
    try {
      const [usersData, rolesData, deptsData] = await Promise.all([
        getAllUsers(),
        getAllRoles(),
        getAllDepartments(),
      ]);
      console.log('[FlowDesign] 用户数据:', usersData.length, '条');
      console.log('[FlowDesign] 角色数据:', rolesData.length, '条');
      console.log('[FlowDesign] 部门数据:', deptsData.length, '条');
      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(deptsData);
    } catch (error) {
      console.error('[FlowDesign] 加载选项失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载用户、角色和部门数据',
        variant: 'destructive',
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  // 当对话框打开时加载数据
  useEffect(() => {
    if (nodeDialogOpen && users.length === 0 && !loadingOptions) {
      console.log('[FlowDesign] 对话框打开，自动加载数据');
      loadOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeDialogOpen]);

  // 添加节点
  const handleAddNode = () => {
    console.log('[FlowDesign] 添加节点，当前用户数:', users.length);
    
    setEditingNodeIndex(null);
    setCurrentNode({
      node_no: `NODE_${Date.now()}`,
      name: '',
      node_type: 'APPROVAL',
      approval_type: 'SINGLE',
      assignee_type: 'USER',
      assignee_value: '',
      order_num: nodes.length - 1,
      is_first: false,
      is_final: false,
    });
    setNodeDialogOpen(true);
  };

  // 编辑节点
  const handleEditNode = (index: number) => {
    console.log('[FlowDesign] 编辑节点，当前用户数:', users.length);
    
    setEditingNodeIndex(index);
    setCurrentNode({ ...nodes[index] });
    setNodeDialogOpen(true);
  };
  
  // 获取选中的ID列表
  const getSelectedIds = (): number[] => {
    if (!currentNode.assignee_value) return [];
    return currentNode.assignee_value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  };
  
  // 切换选中状态
  const toggleSelection = (id: number) => {
    const selectedIds = getSelectedIds();
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    setCurrentNode({
      ...currentNode,
      assignee_value: newIds.join(','),
    });
  };

  // 保存节点
  const handleSaveNode = () => {
    if (!currentNode.name) {
      toast({
        title: '验证失败',
        description: '请填写节点名称',
        variant: 'destructive',
      });
      return;
    }

    if (editingNodeIndex !== null) {
      // 更新现有节点
      const newNodes = [...nodes];
      newNodes[editingNodeIndex] = currentNode;
      setNodes(newNodes);
    } else {
      // 插入新节点（在结束节点之前）
      const newNodes = [...nodes];
      newNodes.splice(nodes.length - 1, 0, currentNode);
      setNodes(newNodes);
    }

    setNodeDialogOpen(false);
  };

  // 删除节点
  const handleDeleteNode = (index: number) => {
    const node = nodes[index];
    if (node.node_type === 'START' || node.node_type === 'END') {
      toast({
        title: '无法删除',
        description: '开始和结束节点不能删除',
        variant: 'destructive',
      });
      return;
    }
    const newNodes = nodes.filter((_, i) => i !== index);
    setNodes(newNodes);
  };

  // 上移节点
  const handleMoveUp = (index: number) => {
    if (index <= 1) return;
    const newNodes = [...nodes];
    [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
    setNodes(newNodes);
  };

  // 下移节点
  const handleMoveDown = (index: number) => {
    if (index >= nodes.length - 2) return;
    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    setNodes(newNodes);
  };

  // 处理保存
  const handleSave = async () => {
    if (!formData.flow_no || !formData.name) {
      toast({
        title: '验证失败',
        description: '请填写必填项',
        variant: 'destructive',
      });
      return;
    }

    // 验证至少有一个审批节点
    const approvalNodes = nodes.filter(n => n.node_type === 'APPROVAL');
    if (approvalNodes.length === 0) {
      toast({
        title: '验证失败',
        description: '请至少添加一个审批节点',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // 生成流程线（顺序连接）
      const lines: FlowLine[] = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        lines.push({
          line_no: `LINE_${i}`,
          from_node_id: nodes[i].node_no,
          to_node_id: nodes[i + 1].node_no,
          priority: i,
        });
      }

      const flowData = {
        ...formData,
        nodes: nodes.map((node, index) => ({
          ...node,
          order_num: index,
        })),
        lines,
      };
      
      console.log('[FlowDesign] 保存流程数据:', flowData);

      // 调用API保存或更新流程
      if (isEditMode && flowId) {
        // 更新现有流程
        const result = await updateFlow(parseInt(flowId), flowData);
        console.log('[FlowDesign] 更新流程结果:', result);
        
        toast({
          title: '更新成功',
          description: '流程已更新',
        });
      } else {
        // 创建新流程
        const result = await createFlow(flowData);
        console.log('[FlowDesign] 创建流程结果:', result);
        
        toast({
          title: '创建成功',
          description: '流程已创建',
        });
      }
      
      console.log('[FlowDesign] 跳转到流程列表页');
      navigate('/approval/flow-manage', { state: { refresh: true, timestamp: Date.now() } });
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={flowId ? '编辑流程' : '新建流程'}
        description="设计审批流程模板"
      />

      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/approval/flow-manage')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>填写流程的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flow_no">流程编号 *</Label>
              <Input
                id="flow_no"
                placeholder="例如: LEAVE_001"
                value={formData.flow_no}
                onChange={(e) => setFormData({ ...formData, flow_no: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">流程名称 *</Label>
              <Input
                id="name"
                placeholder="例如: 请假审批"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">流程分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用</SelectItem>
                  <SelectItem value="hr">人事</SelectItem>
                  <SelectItem value="finance">财务</SelectItem>
                  <SelectItem value="purchase">采购</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">图标</Label>
              <Input
                id="icon"
                placeholder="图标名称"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">流程描述</Label>
            <Textarea
              id="description"
              placeholder="描述这个流程的用途..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 流程设计 */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>流程节点</CardTitle>
            <CardDescription>设计流程的审批节点和顺序</CardDescription>
          </div>
          <Button onClick={handleAddNode}>
            <Plus className="w-4 h-4 mr-2" />
            添加审批节点
          </Button>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              暂无节点，请添加审批节点
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((node, index) => (
                <div
                  key={node.node_no}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
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
                        审批人：
                        {node.assignee_type === 'USER' ? '指定用户' :
                         node.assignee_type === 'ROLE' ? '指定角色' :
                         '指定部门'}
                        {node.assignee_value && ` - ${node.assignee_value}`}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {node.node_type === 'APPROVAL' && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index <= 1}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index >= nodes.length - 2}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditNode(index)}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNode(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 节点配置对话框 */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNodeIndex !== null ? '编辑节点' : '添加审批节点'}</DialogTitle>
            <DialogDescription>配置审批节点的信息和审批人</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="node_name">节点名称 *</Label>
              <Input
                id="node_name"
                placeholder="例如：部门经理审批"
                value={currentNode.name}
                onChange={(e) => setCurrentNode({ ...currentNode, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approval_type">审批方式</Label>
                <Select
                  value={currentNode.approval_type}
                  onValueChange={(value: any) => setCurrentNode({ ...currentNode, approval_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">单人审批</SelectItem>
                    <SelectItem value="MULTI_OR">多人或签（任一通过）</SelectItem>
                    <SelectItem value="MULTI_AND">多人会签（全部通过）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignee_type">审批人类型</Label>
                <Select
                  value={currentNode.assignee_type}
                  onValueChange={(value: any) => setCurrentNode({ ...currentNode, assignee_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">指定用户</SelectItem>
                    <SelectItem value="ROLE">指定角色</SelectItem>
                    <SelectItem value="DEPT">指定部门</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee_value">
                审批人设置 *
                {getSelectedIds().length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    已选择 {getSelectedIds().length} 项
                  </span>
                )}
              </Label>
              
              {loadingOptions ? (
                <div className="text-center py-4 text-muted-foreground">加载中...</div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {currentNode.assignee_type === 'USER' && users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={getSelectedIds().includes(user.id)}
                          onCheckedChange={() => toggleSelection(user.id)}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <span>{user.nickname || user.username}</span>
                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                            {user.dept && (
                              <Badge variant="outline" className="text-xs">
                                {user.dept.name}
                              </Badge>
                            )}
                          </div>
                          {user.email && (
                            <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                          )}
                        </label>
                      </div>
                    ))}
                    
                    {currentNode.assignee_type === 'ROLE' && roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={getSelectedIds().includes(role.id)}
                          onCheckedChange={() => toggleSelection(role.id)}
                        />
                        <label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <span>{role.name}</span>
                            {role.code && (
                              <span className="text-xs text-muted-foreground">({role.code})</span>
                            )}
                          </div>
                          {role.remark && (
                            <div className="text-xs text-muted-foreground mt-0.5">{role.remark}</div>
                          )}
                        </label>
                      </div>
                    ))}
                    
                    {currentNode.assignee_type === 'DEPT' && departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={getSelectedIds().includes(dept.id)}
                          onCheckedChange={() => toggleSelection(dept.id)}
                        />
                        <label
                          htmlFor={`dept-${dept.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))}
                    
                    {currentNode.assignee_type === 'USER' && users.length === 0 && (
                      <div className="text-center text-muted-foreground">暂无用户</div>
                    )}
                    {currentNode.assignee_type === 'ROLE' && roles.length === 0 && (
                      <div className="text-center text-muted-foreground">暂无角色</div>
                    )}
                    {currentNode.assignee_type === 'DEPT' && departments.length === 0 && (
                      <div className="text-center text-muted-foreground">暂无部门</div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              <p className="text-xs text-muted-foreground">
                提示：支持多选，选中的审批人将并行或串行处理审批
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveNode}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/approval/flow-manage')}>
          取消
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </PageContainer>
  );
}
