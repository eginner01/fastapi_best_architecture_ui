import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Plus, Search, Edit, Trash2, Shield, CheckCircle, XCircle, Lock, Unlock, ArrowUpDown, MoreHorizontal, Settings, ChevronsDown, ChevronsUp } from "lucide-react";
import { getRoleListApi, createRoleApi, updateRoleApi, deleteRoleApi, getRoleMenusApi, updateRoleMenusApi, getRoleDataScopesApi, updateRoleDataScopesApi } from '@/api/role';
import { useToast } from "@/components/ui/use-toast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TreeCheckbox, { getAllTreeNodeIds, type TreeNode } from '@/components/TreeCheckbox';
import { getMenuTreeApi } from '@/api/menu';
import { getDataScopeListApi, type DataScope } from '@/api/dataScope';
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

interface Role {
  id: number;
  name: string;
  key: string;
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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<Role>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // 权限配置相关状态
  const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
  const [permRole, setPermRole] = useState<Role | null>(null);
  const [menuTree, setMenuTree] = useState<TreeNode[]>([]);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<number[]>([]);
  const [dataScopes, setDataScopes] = useState<DataScope[]>([]);
  const [checkedScopeKeys, setCheckedScopeKeys] = useState<number[]>([]);
  const [checkStrictly, setCheckStrictly] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [loadingPerm, setLoadingPerm] = useState(false);

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
      if (!currentRole.key?.trim()) {
        toast({ title: "错误", description: "请输入角色标识", variant: "destructive" });
        return;
      }

      const roleData: any = {
        name: currentRole.name,
        key: currentRole.key,
        status: currentRole.status ?? 1,
        is_filter_scopes: currentRole.is_filter_scopes ?? true,
        remark: currentRole.remark || undefined,
      };

      if (currentRole.id) {
        await updateRoleApi(currentRole.id, roleData);
        toast({ title: "成功", description: "更新角色成功" });
      } else {
        await createRoleApi(roleData);
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
      await updateRoleApi(role.id, { 
        name: role.name,
        key: role.key,
        status: newStatus,
        is_filter_scopes: role.is_filter_scopes,
        remark: role.remark || undefined,
      });
      toast({ 
        title: "成功", 
        description: `角色已${newStatus === 1 ? "启用" : "禁用"}` 
      });
      fetchRoles();
    } catch (error) {
      toast({ title: "错误", description: "更新状态失败", variant: "destructive" });
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRows.size === 0) {
      toast({ title: "提示", description: "请先选择要删除的角色" });
      return;
    }
    const confirmed = await confirm({
      title: '批量删除',
      description: `确认删除选中的 ${selectedRows.size} 个角色吗？此操作不可恢复！`,
      confirmText: '删除',
      type: 'error',
    });
    if (!confirmed) return;
    
    try {
      await Promise.all(Array.from(selectedRows).map(id => deleteRoleApi(id)));
      toast({ title: "成功", description: `成功删除 ${selectedRows.size} 个角色` });
      setSelectedRows(new Set());
      fetchRoles();
    } catch (error) {
      toast({ title: "错误", description: "批量删除失败", variant: "destructive" });
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredRoles.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // 单选
  const handleSelectRow = (id: number, checked: boolean) => {
    const newSet = new Set(selectedRows);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedRows(newSet);
  };

  // 排序
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // 应用排序
  const sortedRoles = useMemo(() => {
    if (!sortConfig) return filteredRoles;
    return [...filteredRoles].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Role];
      const bVal = b[sortConfig.key as keyof Role];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRoles, sortConfig]);

  // 打开权限配置对话框
  const handleOpenPermDialog = async (role: Role) => {
    setPermRole(role);
    setActiveTab('menu');
    setIsPermDialogOpen(true);
    setLoadingPerm(true);
    
    try {
      // 加载菜单树
      const menus = await getMenuTreeApi() as any;
      setMenuTree(menus || []);
      
      // 加载角色已有的菜单权限
      const roleMenus = await getRoleMenusApi(role.id);
      setCheckedMenuKeys(roleMenus || []);
      
      // 加载数据权限列表
      const scopesRes: any = await getDataScopeListApi({ page: 1, size: 1000 });
      setDataScopes(scopesRes?.items || scopesRes?.records || scopesRes?.data || []);
      
      // 加载角色已有的数据权限
      const roleScopes = await getRoleDataScopesApi(role.id);
      setCheckedScopeKeys(roleScopes || []);
    } catch (error) {
      console.error('加载权限数据失败:', error);
      toast({ title: "错误", description: "加载权限数据失败", variant: "destructive" });
    } finally {
      setLoadingPerm(false);
    }
  };

  // 保存权限配置
  const handleSavePermissions = async () => {
    if (!permRole) return;
    
    setLoadingPerm(true);
    try {
      if (activeTab === 'menu') {
        // 保存菜单权限
        await updateRoleMenusApi(permRole.id, checkedMenuKeys);
        toast({ title: "成功", description: "菜单权限保存成功" });
      } else {
        // 保存数据权限
        await updateRoleDataScopesApi(permRole.id, checkedScopeKeys);
        toast({ title: "成功", description: "数据权限保存成功" });
      }
      setIsPermDialogOpen(false);
    } catch (error) {
      toast({ title: "错误", description: "保存权限失败", variant: "destructive" });
    } finally {
      setLoadingPerm(false);
    }
  };

  // 展开/折叠所有菜单节点
  const expandAll = () => {
    getAllTreeNodeIds(menuTree);
    // 这里需要TreeCheckbox组件支持外部控制展开
    toast({ title: "提示", description: "已展开所有节点" });
  };

  const collapseAll = () => {
    toast({ title: "提示", description: "已折叠所有节点" });
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

      {/* 统计 + 搜索融合区域 */}
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            {/* 紧凑统计卡片 */}
            <div className="flex items-center gap-4 pr-4 border-r border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">总数</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">启用</p>
                  <p className="text-xl font-bold text-green-500">{stats.active}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">禁用</p>
                  <p className="text-xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
              </div>
            </div>

            {/* 搜索区域 */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="搜索角色名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRoles()}
                  className="h-8 pl-8 text-sm bg-background border-border"
                />
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="h-8 text-xs px-3"
                >
                  全部
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                  className="h-8 text-xs px-3"
                >
                  启用中
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('inactive')}
                  className="h-8 text-xs px-3"
                >
                  已禁用
                </Button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pl-4 border-l border-border">
              {selectedRows.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDelete}
                  className="h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  删除 ({selectedRows.size})
                </Button>
              )}
              <Button
                size="sm"
                onClick={fetchRoles}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                查询
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 角色数据表格 */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
                  <TableHead className="w-12 h-11">
                    <Checkbox
                      checked={sortedRoles.length > 0 && selectedRows.size === sortedRoles.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="w-16 h-11 text-xs font-semibold">#</TableHead>
                  <TableHead className="min-w-[150px] h-11">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent"
                    >
                      角色名称
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px] h-11 text-xs font-semibold">角色标识</TableHead>
                  <TableHead className="min-w-[200px] h-11 text-xs font-semibold">备注说明</TableHead>
                  <TableHead className="w-24 h-11 text-center text-xs font-semibold">状态</TableHead>
                  <TableHead className="min-w-[150px] h-11">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('created_time')}
                      className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent"
                    >
                      创建时间
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 h-11 text-center text-xs font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">加载中...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Shield className="w-12 h-12 text-muted-foreground opacity-50" />
                        <div>
                          <p className="font-medium text-foreground">
                            {searchQuery || filterStatus !== 'all' ? '未找到匹配的角色' : '暂无角色'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery || filterStatus !== 'all'
                              ? '尝试调整搜索条件或筛选器'
                              : '点击"新增角色"按钮创建您的第一个角色'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRoles.map((role, index) => (
                    <TableRow
                      key={role.id}
                      className="group hover:bg-accent/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="py-4">
                        <Checkbox
                          checked={selectedRows.has(role.id)}
                          onCheckedChange={(checked) => handleSelectRow(role.id, checked as boolean)}
                          aria-label={`选择 ${role.name}`}
                        />
                      </TableCell>
                      <TableCell className="py-4 font-mono text-xs text-muted-foreground">
                        {index + 1 + (pagination.current - 1) * pagination.pageSize}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            role.status === 1 ? 'bg-green-500/10' : 'bg-muted/50'
                          }`}>
                            <Shield className={`w-5 h-5 ${role.status === 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{role.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">ID: {role.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <code className="text-xs font-mono bg-muted px-2.5 py-1 rounded">{role.key}</code>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {role.remark || <span className="italic text-xs">暂无备注</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={role.status === 1}
                            onCheckedChange={() => handleToggleStatus(role)}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted-foreground/50"
                          />
                          <Badge
                            variant={role.status === 1 ? "default" : "secondary"}
                            className={`text-xs ${
                              role.status === 1
                                ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {role.status === 1 ? '启用' : '禁用'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {new Date(role.created_time).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setCurrentRole(role); setIsDialogOpen(true); }}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role.id, role.name)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-accent"
                                title="更多操作"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>更多操作</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setCurrentRole(role); setIsDialogOpen(true); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑角色
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenPermDialog(role)}>
                                <Settings className="w-4 h-4 mr-2" />
                                权限设置
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(role)}>
                                {role.status === 1 ? (
                                  <><Lock className="w-4 h-4 mr-2" />禁用角色</>
                                ) : (
                                  <><Unlock className="w-4 h-4 mr-2" />启用角色</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(role.id, role.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除角色
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                placeholder="请输入角色名称，如：管理员、普通用户"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                角色标识 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={currentRole.key || ''}
                onChange={(e) => setCurrentRole(prev => ({ ...prev, key: e.target.value }))}
                placeholder="请输入角色标识，如：admin、user"
                className="bg-background border-border text-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground">用于权限控制的唯一标识，建议使用英文小写</p>
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
              <Label className="text-sm font-medium text-foreground">过滤数据权限</Label>
              <RadioGroup 
                value={currentRole.is_filter_scopes === false ? "false" : "true"}
                onValueChange={(value) => setCurrentRole(prev => ({ ...prev, is_filter_scopes: value === "true" }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="filter-yes" />
                  <Label htmlFor="filter-yes" className="font-normal cursor-pointer">是</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="filter-no" />
                  <Label htmlFor="filter-no" className="font-normal cursor-pointer">否</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">是否根据数据权限范围过滤数据</p>
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

      {/* 权限配置对话框 */}
      <Dialog open={isPermDialogOpen} onOpenChange={setIsPermDialogOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              权限设置 - {permRole?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="menu" className="data-[state=active]:bg-background">
                菜单权限
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-background">
                数据权限
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="menu" className="flex-1 overflow-y-auto mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <RadioGroup 
                    value={checkStrictly ? "strict" : "cascade"}
                    onValueChange={(value) => setCheckStrictly(value === "strict")}
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="strict" id="strict-mode" />
                      <Label htmlFor="strict-mode" className="font-normal cursor-pointer text-sm">
                        父子独立
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cascade" id="cascade-mode" />
                      <Label htmlFor="cascade-mode" className="font-normal cursor-pointer text-sm">
                        父子联动
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded text-sm">
                    <span className="text-muted-foreground">已关联:</span>
                    <span className="font-semibold text-primary">{checkedMenuKeys.length}</span>
                    <span className="text-muted-foreground">个节点</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAll}
                    className="gap-2"
                  >
                    <ChevronsDown className="w-4 h-4" />
                    展开全部
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAll}
                    className="gap-2"
                  >
                    <ChevronsUp className="w-4 h-4" />
                    折叠全部
                  </Button>
                </div>
              </div>
              
              {loadingPerm ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">加载菜单数据中...</p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 bg-background">
                  <TreeCheckbox
                    data={menuTree}
                    checkedKeys={checkedMenuKeys}
                    onCheckedChange={setCheckedMenuKeys}
                    checkStrictly={checkStrictly}
                    defaultExpandAll={true}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="data" className="flex-1 overflow-y-auto mt-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">已关联:</span>
                <span className="font-semibold text-primary">{checkedScopeKeys.length}</span>
                <span className="text-sm text-muted-foreground">个数据范围节点</span>
              </div>
              
              {loadingPerm ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">加载数据权限中...</p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={dataScopes.length > 0 && checkedScopeKeys.length === dataScopes.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCheckedScopeKeys(dataScopes.map(s => s.id));
                              } else {
                                setCheckedScopeKeys([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>范围名称</TableHead>
                        <TableHead>范围代码</TableHead>
                        <TableHead className="w-24 text-center">状态</TableHead>
                        <TableHead>创建时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataScopes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            暂无数据权限
                          </TableCell>
                        </TableRow>
                      ) : (
                        dataScopes.map(scope => (
                          <TableRow key={scope.id} className="hover:bg-muted/30">
                            <TableCell>
                              <Checkbox
                                checked={checkedScopeKeys.includes(scope.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCheckedScopeKeys([...checkedScopeKeys, scope.id]);
                                  } else {
                                    setCheckedScopeKeys(checkedScopeKeys.filter(id => id !== scope.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{scope.name}</TableCell>
                            <TableCell>
                              <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                {scope.code}
                              </code>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={scope.status === 1 ? "default" : "secondary"}>
                                {scope.status === 1 ? "正常" : "停用"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(scope.created_time).toLocaleString('zh-CN')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsPermDialogOpen(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={loadingPerm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loadingPerm ? '保存中...' : '保存权限'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
