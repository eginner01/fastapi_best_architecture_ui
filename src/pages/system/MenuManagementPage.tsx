import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Plus, ChevronRight, ChevronDown, Edit, Trash2, FolderTree, Search, Shield, ExternalLink, Monitor } from "lucide-react";
import { Icon } from '@iconify/react';
import { useToast } from "@/components/ui/use-toast";
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { getMenuTreeApi, createMenuApi, updateMenuApi, deleteMenuApi } from '@/api/menu';
import type { MenuTreeItem } from '@/api/menu';

type Menu = MenuTreeItem;

// 菜单类型枚举
const MenuType = {
  DIRECTORY: 0,  // 目录
  MENU: 1,       // 菜单
  BUTTON: 2,     // 按钮
  IFRAME: 3,     // 内嵌
  LINK: 4        // 外链
} as const;

const MenuTypeLabels = {
  [MenuType.DIRECTORY]: '目录',
  [MenuType.MENU]: '菜单',
  [MenuType.BUTTON]: '按钮',
  [MenuType.IFRAME]: '内嵌',
  [MenuType.LINK]: '外链'
} as const;

const MenuTypeBadgeVariants = {
  [MenuType.DIRECTORY]: 'default',
  [MenuType.MENU]: 'secondary',
  [MenuType.BUTTON]: 'outline',
  [MenuType.IFRAME]: 'default',
  [MenuType.LINK]: 'default'
} as const;

const MenuTypeBadgeColors = {
  [MenuType.DIRECTORY]: 'bg-orange-500/20 text-orange-400',
  [MenuType.MENU]: 'bg-blue-500/20 text-blue-400',
  [MenuType.BUTTON]: 'bg-purple-500/20 text-purple-400',
  [MenuType.IFRAME]: 'bg-yellow-500/20 text-yellow-400',
  [MenuType.LINK]: 'bg-green-500/20 text-green-400'
} as const;

export default function MenuManagementPage() {
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Partial<Menu>>({});
  const fetchingRef = useRef(false);
  
  // 查询条件
  const [searchTitle, setSearchTitle] = useState('');
  const [searchStatus, setSearchStatus] = useState<number | 'all'>('all');

  const fetchMenus = async () => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params: any = {};
      if (searchTitle) params.title = searchTitle;
      if (searchStatus !== 'all') params.status = searchStatus;
      
      const response: any = await getMenuTreeApi(params);
      console.log('菜单树响应:', response);
      
      const menuList = Array.isArray(response) ? response : response?.data || [];
      
      setMenus(menuList);
      // 默认折叠所有节点
      setExpandedIds(new Set());
    } catch (error) {
      console.error('获取菜单失败:', error);
      toast({ 
        title: "错误", 
        description: error instanceof Error ? error.message : "获取菜单列表失败", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };
  
  const handleSearch = () => {
    fetchMenus();
  };
  
  const handleReset = () => {
    setSearchTitle('');
    setSearchStatus('all');
    fetchMenus();
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (items: Menu[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allIds.add(item.id);
          collectIds(item.children);
        }
      });
    };
    collectIds(menus);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleAdd = (parentId?: number) => {
    setCurrentMenu({ 
      parent_id: parentId || 0, 
      status: 1, 
      type: MenuType.MENU,
      display: 1,
      cache: 1,
      sort: 0
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (menu: Menu) => {
    setCurrentMenu(menu);
    setIsDialogOpen(true);
  };

  const handleDelete = async (menu: Menu) => {
    // 权限保护：系统关键菜单不可删除
    if (menu.name === 'System' || menu.name === 'Log') {
      toast({ 
        title: "警告", 
        description: "系统关键菜单不可删除", 
        variant: "destructive" 
      });
      return;
    }
    
    const confirmed = await confirm({
      title: '删除菜单',
      description: `确认删除菜单 "${translateTitle(menu.title)}" 吗？此操作不可恢复！`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'error'
    });
    
    if (!confirmed) return;
    
    try {
      await deleteMenuApi(menu.id);
      toast({ title: "成功", description: "删除菜单成功" });
      fetchMenus();
    } catch (error) {
      console.error('删除菜单失败:', error);
      toast({ 
        title: "错误", 
        description: "删除菜单失败", 
        variant: "destructive" 
      });
    }
  };

  const handleSave = async () => {
    try {
      // 验证必填字段
      if (!currentMenu.title || !currentMenu.name) {
        toast({ title: "错误", description: "菜单标题和名称不能为空", variant: "destructive" });
        return;
      }
      
      const menuType = currentMenu.type || MenuType.MENU;
      
      // 根据类型验证必填字段
      if (menuType === MenuType.MENU && !currentMenu.component) {
        toast({ title: "错误", description: "菜单类型必须填写组件路径", variant: "destructive" });
        return;
      }
      
      if (menuType === MenuType.BUTTON && !currentMenu.perms) {
        toast({ title: "错误", description: "按钮类型必须填写权限标识", variant: "destructive" });
        return;
      }
      
      if ((menuType === MenuType.IFRAME || menuType === MenuType.LINK) && !currentMenu.link) {
        toast({ title: "错误", description: "内嵌/外链类型必须填写链接地址", variant: "destructive" });
        return;
      }
      
      // 验证路径格式（目录、菜单、内嵌、外链需要路径）
      if ([MenuType.DIRECTORY, MenuType.MENU, MenuType.IFRAME, MenuType.LINK].includes(menuType as any)) {
        if (currentMenu.path && !/^\//.test(currentMenu.path)) {
          toast({ title: "错误", description: "路由地址必须以 \"/\" 开头", variant: "destructive" });
          return;
        }
      }
      
      // 验证链接格式
      if ((menuType === MenuType.IFRAME || menuType === MenuType.LINK) && currentMenu.link) {
        try {
          new URL(currentMenu.link);
        } catch {
          toast({ title: "错误", description: "链接地址格式不正确，请输入完整的URL", variant: "destructive" });
          return;
        }
      }
      
      const menuData: any = {
        title: currentMenu.title,
        name: currentMenu.name,
        path: currentMenu.path || '',
        parent_id: currentMenu.parent_id || 0,
        sort: currentMenu.sort || 0,
        icon: currentMenu.icon,
        type: menuType,
        status: currentMenu.status !== undefined ? currentMenu.status : 1,
        display: currentMenu.display !== undefined ? currentMenu.display : 1,
        cache: currentMenu.cache !== undefined ? currentMenu.cache : 1,
        component: currentMenu.component,
        perms: currentMenu.perms,
        remark: currentMenu.remark,
        link: currentMenu.link,
      };
      
      // 内嵌和外链自动设置组件为iframe
      if (menuType === MenuType.IFRAME || menuType === MenuType.LINK) {
        menuData.component = '/_core/fallback/iframe.vue';
      }

      if (currentMenu.id) {
        await updateMenuApi(currentMenu.id, menuData);
        toast({ title: "成功", description: "更新菜单成功" });
      } else {
        await createMenuApi(menuData);
        toast({ title: "成功", description: "新增菜单成功" });
      }
      setIsDialogOpen(false);
      setCurrentMenu({});
      fetchMenus();
    } catch (error) {
      console.error('保存菜单失败:', error);
      toast({ 
        title: "错误", 
        description: "保存菜单失败", 
        variant: "destructive" 
      });
    }
  };

  // 翻译国际化key为中文
  const translateTitle = (title: string): string => {
    // 简单的国际化key映射
    const i18nMap: Record<string, string> = {
      'page.dashboard.title': '工作台',
      'page.dashboard.analytics': '分析页',
      'page.dashboard.workspace': '工作空间',
      'page.menu.system': '系统管理',
      'page.menu.user': '用户管理',
      'page.menu.role': '角色管理',
      'page.menu.menu': '菜单管理',
      'page.menu.dept': '部门管理',
      'page.menu.data_rule': '数据权限',
      'page.menu.scheduler': '任务调度',
      'page.menu.manage': '任务管理',
      'page.menu.record': '执行记录',
      'page.menu.log': '日志管理',
      'page.menu.login': '登录日志',
      'page.menu.opera': '操作日志',
      'page.menu.monitor': '系统监控',
      'page.menu.online': '在线用户',
      'page.menu.server': '服务器监控',
      'page.menu.redis': 'Redis监控',
      'page.menu.profile': '个人中心',
      'code_generator.menu': '代码生成',
    };
    
    return i18nMap[title] || title;
  };

  // 渲染图标
  const renderIcon = (menu: Menu) => {
    if (!menu.icon) {
      return <FolderTree className="w-4 h-4 text-muted-foreground" />;
    }
    
    // 如果是URL（http或https开头）
    if (/^https?:\/\//.test(menu.icon)) {
      return <img src={menu.icon} alt="icon" className="w-4 h-4 object-contain" />;
    }
    
    // 使用 Iconify 渲染图标（如：ant-design:dashboard-outlined）
    return <Icon icon={menu.icon} className="w-4 h-4" />;
  };

  // 递归渲染菜单树
  const renderMenuTree = (items: Menu[], level: number = 0): React.ReactNode => {
    return items.map((menu) => (
      <>
        <TableRow key={menu.id} className="border-border">
          <TableCell className="text-sm">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {menu.children && menu.children.length > 0 && (
                <button
                  onClick={() => toggleExpand(menu.id)}
                  className="mr-2 hover:bg-accent rounded p-1 transition-colors"
                >
                  {expandedIds.has(menu.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}
              {!menu.children?.length && <span className="w-6 mr-2" />}
              <div className="flex items-center gap-2">
                {renderIcon(menu)}
                <span>{translateTitle(menu.title)}</span>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground text-sm text-center">{menu.sort}</TableCell>
          <TableCell>
            <Badge 
              variant="default"
              className={MenuTypeBadgeColors[menu.type as keyof typeof MenuTypeBadgeColors]}>
              {MenuTypeLabels[menu.type as keyof typeof MenuTypeLabels] || '未知'}
            </Badge>
          </TableCell>
          <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]" title={menu.perms}>
            {menu.perms || '-'}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">{menu.path || '-'}</TableCell>
          <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]" title={menu.component}>
            {menu.component || '-'}
          </TableCell>
          <TableCell>
            <Badge variant={menu.status === 1 ? "default" : "secondary"}
              className={menu.status === 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
              {menu.status === 1 ? '启用' : '禁用'}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              {[MenuType.DIRECTORY, MenuType.MENU].includes(menu.type as any) && (
                <Button variant="ghost" size="sm" onClick={() => handleAdd(menu.id)} className="hover:bg-accent h-7 w-7 p-0" title="新增子菜单">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleEdit(menu)} className="hover:bg-accent h-7 w-7 p-0" title="编辑">
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(menu)} 
                className="hover:bg-accent text-destructive h-7 w-7 p-0" 
                title={menu.name === 'System' || menu.name === 'Log' ? "系统关键菜单不可删除" : "删除"}
                disabled={menu.name === 'System' || menu.name === 'Log'}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {menu.children && menu.children.length > 0 && expandedIds.has(menu.id) && (
          renderMenuTree(menu.children, level + 1)
        )}
      </>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">菜单管理</h1>
          <p className="text-muted-foreground text-sm mt-1">系统菜单权限管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll} className="border-border hover:bg-accent text-sm">
            <FolderTree className="w-4 h-4 mr-2" />
            展开全部
          </Button>
          <Button variant="outline" onClick={collapseAll} className="border-border hover:bg-accent text-sm">
            <FolderTree className="w-4 h-4 mr-2" />
            折叠全部
          </Button>
          <Button variant="outline" onClick={fetchMenus} className="border-border hover:bg-accent text-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => handleAdd()} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            新增菜单
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card min-h-[calc(100vh-200px)]">
        <CardContent className="p-6 h-full">
          {/* 查询表单 */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-sm mb-2 block">菜单标题</Label>
                <Input
                  placeholder="请输入菜单标题"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">状态</Label>
                <Select value={searchStatus.toString()} onValueChange={(v) => setSearchStatus(v === 'all' ? 'all' : Number(v))}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="1">启用</SelectItem>
                    <SelectItem value="0">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
                  <Search className="w-4 h-4 mr-2" />
                  查询
                </Button>
                <Button variant="outline" onClick={handleReset} className="border-border">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="text-xs">菜单名称</TableHead>
                  <TableHead className="text-xs w-16 text-center">排序</TableHead>
                  <TableHead className="text-xs w-20">类型</TableHead>
                  <TableHead className="text-xs w-32">权限标识</TableHead>
                  <TableHead className="text-xs w-40">路由地址</TableHead>
                  <TableHead className="text-xs w-48">组件路径</TableHead>
                  <TableHead className="text-xs w-20">状态</TableHead>
                  <TableHead className="text-xs w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">加载中...</TableCell>
                  </TableRow>
                ) : menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  renderMenuTree(menus)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{currentMenu.id ? '编辑菜单' : '新增菜单'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 菜单类型 */}
            <div>
              <Label className="text-sm font-medium"><span className="text-destructive">*</span> 菜单类型</Label>
              <RadioGroup 
                value={currentMenu.type?.toString() || MenuType.MENU.toString()}
                onValueChange={(v) => setCurrentMenu(prev => ({ ...prev, type: Number(v) }))}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={MenuType.DIRECTORY.toString()} id="type-dir" />
                  <Label htmlFor="type-dir" className="font-normal cursor-pointer">目录</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={MenuType.MENU.toString()} id="type-menu" />
                  <Label htmlFor="type-menu" className="font-normal cursor-pointer">菜单</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={MenuType.BUTTON.toString()} id="type-btn" />
                  <Label htmlFor="type-btn" className="font-normal cursor-pointer">按钮</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={MenuType.IFRAME.toString()} id="type-iframe" />
                  <Label htmlFor="type-iframe" className="font-normal cursor-pointer">内嵌</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={MenuType.LINK.toString()} id="type-link" />
                  <Label htmlFor="type-link" className="font-normal cursor-pointer">外链</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 菜单标题 */}
              <div>
                <Label className="text-sm font-medium"><span className="text-destructive">*</span> 菜单标题</Label>
                <Input
                  value={currentMenu.title || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="page.dashboard.title"
                />
                <p className="text-xs text-muted-foreground mt-1">国际化key或显示文本</p>
              </div>

              {/* 菜单名称 */}
              <div>
                <Label className="text-sm font-medium"><span className="text-destructive">*</span> 菜单名称</Label>
                <Input
                  value={currentMenu.name || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="Dashboard"
                />
                <p className="text-xs text-muted-foreground mt-1">唯一标识，用于路由name</p>
              </div>
            </div>

            {/* 父级菜单（简化版，使用input，后续可改为树形选择） */}
            <div>
              <Label className="text-sm font-medium">父级菜单</Label>
              <Input
                type="number"
                value={currentMenu.parent_id || 0}
                onChange={(e) => setCurrentMenu(prev => ({ ...prev, parent_id: Number(e.target.value) || 0 }))}
                className="bg-background border-border mt-2"
                placeholder="0表示顶级菜单"
              />
              <p className="text-xs text-muted-foreground mt-1">0表示根菜单，其他为父级菜单ID</p>
            </div>

            {/* 路由地址 - 目录/菜单/内嵌/外链显示 */}
            {[MenuType.DIRECTORY, MenuType.MENU, MenuType.IFRAME, MenuType.LINK].includes(currentMenu.type as any) && (
              <div>
                <Label className="text-sm font-medium">路由地址</Label>
                <Input
                  value={currentMenu.path || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, path: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="/dashboard"
                />
                <p className="text-xs text-muted-foreground mt-1">必须以"/"开头</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* 排序 */}
              <div>
                <Label className="text-sm font-medium">排序</Label>
                <Input
                  type="number"
                  value={currentMenu.sort || 0}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, sort: Number(e.target.value) }))}
                  className="bg-background border-border mt-2"
                  placeholder="0"
                />
              </div>

              {/* 图标 - 目录/菜单/内嵌/外链显示 */}
              {[MenuType.DIRECTORY, MenuType.MENU, MenuType.IFRAME, MenuType.LINK].includes(currentMenu.type as any) && (
                <div>
                  <Label className="text-sm font-medium">图标</Label>
                  <Input
                    value={currentMenu.icon || ''}
                    onChange={(e) => setCurrentMenu(prev => ({ ...prev, icon: e.target.value }))}
                    className="bg-background border-border mt-2"
                    placeholder="lucide:home"
                  />
                </div>
              )}
            </div>

            {/* 组件路径 - 仅菜单类型显示且必填 */}
            {currentMenu.type === MenuType.MENU && (
              <div>
                <Label className="text-sm font-medium"><span className="text-destructive">*</span> 组件路径</Label>
                <Input
                  value={currentMenu.component || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, component: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="/src/pages/DashboardPage.tsx"
                />
                <p className="text-xs text-muted-foreground mt-1">页面组件文件路径</p>
              </div>
            )}

            {/* 权限标识 - 菜单/按钮/内嵌显示，按钮必填 */}
            {[MenuType.MENU, MenuType.BUTTON, MenuType.IFRAME].includes(currentMenu.type as any) && (
              <div>
                <Label className="text-sm font-medium">
                  {currentMenu.type === MenuType.BUTTON && <span className="text-destructive">*</span>} 权限标识
                </Label>
                <Input
                  value={currentMenu.perms || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, perms: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="sys:user:add"
                />
                <p className="text-xs text-muted-foreground mt-1">用于按钮级权限控制</p>
              </div>
            )}

            {/* 链接地址 - 内嵌/外链显示且必填 */}
            {[MenuType.IFRAME, MenuType.LINK].includes(currentMenu.type as any) && (
              <div>
                <Label className="text-sm font-medium"><span className="text-destructive">*</span> 链接地址</Label>
                <Input
                  value={currentMenu.link || ''}
                  onChange={(e) => setCurrentMenu(prev => ({ ...prev, link: e.target.value }))}
                  className="bg-background border-border mt-2"
                  placeholder="https://example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">完整的URL地址</p>
              </div>
            )}

            {/* 状态 */}
            <div>
              <Label className="text-sm font-medium"><span className="text-destructive">*</span> 状态</Label>
              <RadioGroup 
                value={currentMenu.status?.toString() || "1"}
                onValueChange={(v) => setCurrentMenu(prev => ({ ...prev, status: Number(v) }))}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="status-on" />
                  <Label htmlFor="status-on" className="font-normal cursor-pointer">启用</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="status-off" />
                  <Label htmlFor="status-off" className="font-normal cursor-pointer">禁用</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 是否显示 - 非按钮类型显示 */}
            {currentMenu.type !== MenuType.BUTTON && (
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <Switch 
                  checked={currentMenu.display === 1}
                  onCheckedChange={(checked) => setCurrentMenu(prev => ({ ...prev, display: checked ? 1 : 0 }))}
                  className="data-[state=checked]:bg-green-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">是否显示</p>
                  <p className="text-xs text-muted-foreground">控制菜单是否在侧边栏显示</p>
                </div>
              </div>
            )}

            {/* 是否缓存 - 仅菜单类型显示 */}
            {currentMenu.type === MenuType.MENU && (
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <Switch 
                  checked={currentMenu.cache === 1}
                  onCheckedChange={(checked) => setCurrentMenu(prev => ({ ...prev, cache: checked ? 1 : 0 }))}
                  className="data-[state=checked]:bg-green-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">是否缓存</p>
                  <p className="text-xs text-muted-foreground">页面切换时是否保持状态</p>
                </div>
              </div>
            )}

            {/* 备注 */}
            <div>
              <Label className="text-sm font-medium">备注</Label>
              <Textarea
                value={currentMenu.remark || ''}
                onChange={(e) => setCurrentMenu(prev => ({ ...prev, remark: e.target.value }))}
                className="bg-background border-border mt-2 resize-none"
                rows={3}
                placeholder="请输入备注信息..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setCurrentMenu({}); }} className="border-border">取消</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {currentMenu.id ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
