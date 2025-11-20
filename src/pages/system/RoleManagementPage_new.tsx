import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Plus, Search, Edit, Trash2, Shield, Users, CheckCircle, XCircle, Lock, Unlock, Calendar, FileText } from "lucide-react";
import { getRoleListApi, createRoleApi, updateRoleApi, deleteRoleApi } from '@/api/role';
import { useToast } from "@/components/ui/use-toast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Role {
  id: number;
  name: string;
  status: number;
  is_filter_scopes: boolean;
  remark: string | null;
  created_time: string;
  updated_time: string | null;
  menus?: any[];
  scopes?: any[];
}

export default function RoleManagementPage() {
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({});

  const fetchRoles = async () => {
    if (fetchingRef.current) {
      console.log('已有请求进行中，跳过本次请求');
      return;
    }
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response: any = await getRoleListApi({
        page: pagination.current,
        size: pagination.pageSize,
        name: searchQuery || undefined,
      });
      
      const roles = response?.items || response?.records || response?.data || [];
      const total = response?.total || response?.count || 0;
      
      setRoles(roles);
      setPagination(prev => ({ ...prev, total }));
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast({ 
        title: "错误", 
        description: error instanceof Error ? error.message : "获取角色列表失败", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [pagination.current]);

  // 统计数据
  const stats = useMemo(() => {
    const total = roles.length;
    const active = roles.filter(r => r.status === 1).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [roles]);

  // 过滤角色列表
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && role.status === 1) ||
        (filterStatus === 'inactive' && role.status === 0);
      
      return matchesStatus;
    });
  }, [roles, filterStatus]);

  const handleSave = async () => {
    try {
      if (!currentRole.name?.trim()) {
        toast({ title: "错误", description: "请输入角色名称", variant: "destructive" });
        return;
      }

      if (currentRole.id) {
        await updateRoleApi(currentRole.id, currentRole as any);
        toast({ title: "成功", description: "更新角色成功" });
      } else {
        await createRoleApi({ ...currentRole, status: currentRole.status ?? 1 } as any);
        toast({ title: "成功", description: "新增角色成功" });
      }
      setIsDialogOpen(false);
      setCurrentRole({});
      fetchRoles();
    } catch (error) {
      toast({ title: "错误", description: "保存角色失败", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirm({
      title: '删除角色',
      description: `确认删除角色 "${name}" 吗？此操作不可恢复！`,
      confirmText: '删除',
      type: 'error',
    });
    if (!confirmed) return;
    
    try {
      await deleteRoleApi(id);
      toast({ title: "成功", description: "删除角色成功" });
      fetchRoles();
    } catch (error) {
      toast({ title: "错误", description: "删除角色失败", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      const newStatus = role.status === 1 ? 0 : 1;
      await updateRoleApi(role.id, { ...role, status: newStatus });
      toast({ 
        title: "成功", 
        description: `角色已${newStatus === 1 ? "启用" : "禁用"}` 
      });
      fetchRoles();
    } catch (error) {
      toast({ title: "错误", description: "更新状态失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题区域 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            角色权限管理
          </h1>
          <p className="text-muted-foreground">
            管理系统角色和权限配置，控制不同角色的访问范围
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchRoles}
            className="border-border hover:bg-accent transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button 
            onClick={() => { setCurrentRole({ status: 1 }); setIsDialogOpen(true); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增角色
          </Button>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">总角色数</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">启用中</p>
                <p className="text-3xl font-bold text-green-500">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">已禁用</p>
                <p className="text-3xl font-bold text-muted-foreground">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选区域 */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRoles()}
                className="pl-10 bg-background border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className="transition-all duration-200"
              >
                全部
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                className="transition-all duration-200"
              >
                启用中
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                className="transition-all duration-200"
              >
                已禁用
              </Button>
              <Button
                onClick={fetchRoles}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Search className="w-4 h-4 mr-2" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 角色列表卡片网格 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {searchQuery || filterStatus !== 'all' ? '未找到匹配的角色' : '暂无角色'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== 'all' 
                    ? '尝试调整搜索条件或筛选器' 
                    : '点击"新增角色"按钮创建您的第一个角色'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <Card 
              key={role.id}
              className="border-border bg-card hover:shadow-xl transition-all duration-200 group overflow-hidden relative"
            >
              {/* 顶部装饰线 */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                role.status === 1 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-muted to-muted-foreground'
              }`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        role.status === 1 ? 'bg-green-500/10' : 'bg-muted/50'
                      }`}>
                        <Shield className={`w-5 h-5 ${role.status === 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">
                          {role.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-border text-xs">
                            ID: {role.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Switch 
                      checked={role.status === 1}
                      onCheckedChange={() => handleToggleStatus(role)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted-foreground/50"
                    />
                    <Badge 
                      variant={role.status === 1 ? "default" : "secondary"}
                      className={`${
                        role.status === 1 
                          ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" 
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {role.status === 1 ? (
                        <><Unlock className="w-3 h-3 mr-1" />启用</>
                      ) : (
                        <><Lock className="w-3 h-3 mr-1" />禁用</>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 描述信息 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {role.remark || '暂无备注信息'}
                    </p>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>创建于 {new Date(role.created_time).toLocaleDateString()}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setCurrentRole(role); setIsDialogOpen(true); }}
                    className="flex-1 border-border hover:bg-accent hover:border-primary/50 transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(role.id, role.name)}
                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {!loading && filteredRoles.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，当前第 {pagination.current} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="border-border hover:bg-accent"
                >
                  上一页
                </Button>
                <div className="flex items-center px-4 text-sm text-foreground">
                  {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="border-border hover:bg-accent"
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {currentRole.id ? '编辑角色' : '新增角色'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                角色名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={currentRole.name || ''}
                onChange={(e) => setCurrentRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入角色名称"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">备注说明</Label>
              <Textarea
                value={currentRole.remark || ''}
                onChange={(e) => setCurrentRole(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="请输入角色备注信息..."
                rows={3}
                className="bg-background border-border text-foreground resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">状态</Label>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-background">
                <Switch 
                  checked={currentRole.status === 1}
                  onCheckedChange={(checked) => setCurrentRole(prev => ({ ...prev, status: checked ? 1 : 0 }))}
                  className="data-[state=checked]:bg-green-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {currentRole.status === 1 ? '启用' : '禁用'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentRole.status === 1 ? '该角色处于激活状态' : '该角色已被禁用'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setIsDialogOpen(false); setCurrentRole({}); }}
              className="border-border"
            >
              取消
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {currentRole.id ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
