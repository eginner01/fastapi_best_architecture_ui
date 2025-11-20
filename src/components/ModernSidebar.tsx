import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Shield, Menu, Building2, Database, 
  Clock, FileText, Monitor, Server, Calendar, Settings, Book, Puzzle, Bell,
  ChevronDown, ChevronRight, Layers, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMenuStore } from '@/store/menu';

// 旧的静态菜单（作为备用）
const staticMenuItems = [
  {
    title: '仪表盘',
    icon: LayoutDashboard,
    children: [
      { title: '分析页', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: '系统管理',
    icon: Settings,
    children: [
      { title: '部门管理', path: '/system/dept', icon: Building2 },
      { title: '用户管理', path: '/system/user', icon: Users },
      { title: '角色管理', path: '/system/role', icon: Shield },
      { title: '菜单管理', path: '/system/menu', icon: Menu },
      { 
        title: '数据权限', 
        icon: Database,
        children: [
          { title: '数据范围', path: '/system/data-scope', icon: Layers },
          { title: '数据规则', path: '/system/data-rule', icon: Database },
        ]
      },
      { title: '插件管理', path: '/system/plugin', icon: Puzzle },
      { title: '参数设置', path: '/plugins/config', icon: Settings },
      { title: '字典管理', path: '/plugins/dict', icon: Book },
      { title: '通知公告', path: '/plugins/notice', icon: Bell },
      { title: '代码生成', path: '/plugins/code-generator', icon: FileText },
    ],
  },
  {
    title: '日志管理',
    icon: FileText,
    children: [
      { title: '登录日志', path: '/log/login', icon: Clock },
      { title: '操作日志', path: '/log/opera', icon: FileText },
    ],
  },
  {
    title: '系统监控',
    icon: Monitor,
    children: [
      { title: '在线用户', path: '/monitor/online', icon: Users },
      { title: 'Redis监控', path: '/monitor/redis', icon: Database },
      { title: '服务器监控', path: '/monitor/server', icon: Server },
    ],
  },
  {
    title: '任务调度',
    icon: Calendar,
    children: [
      { title: '任务管理', path: '/scheduler/manage', icon: Calendar },
      { title: '执行记录', path: '/scheduler/record', icon: FileText },
    ],
  },
];

export default function ModernSidebar() {
  const location = useLocation();
  const { menus, fetchMenus, loading } = useMenuStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['0', '1', '2', '3', '4']));

  // 获取菜单数据
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (menus.length === 0 && token && !loading) {
      console.log('[ModernSidebar] Fetching menus...');
      fetchMenus();
    }
  }, []);

  // 使用动态菜单数据，如果没有则使用静态菜单
  const menuItems = menus.length > 0 ? menus : staticMenuItems;

  // 国际化翻译映射 - 根据实际数据库key配置
  const i18nMap: Record<string, string> = {
    // Dashboard
    'page.dashboard.title': '仪表盘',
    'page.dashboard.analytics': '分析页',
    'page.dashboard.workspace': '工作台',
    'Dashboard': '仪表盘',
    
    // System
    'page.menu.system': '系统管理',
    'page.menu.sysDept': '部门管理',
    'page.menu.sysUser': '用户管理',
    'page.menu.sysRole': '角色管理',
    'page.menu.sysMenu': '菜单管理',
    'page.menu.sysDataPermission': '数据权限',  // 注意是 Permission 不是 Permi
    'page.menu.sysDataScope': '数据范围',
    'page.menu.sysDataRule': '数据规则',
    'page.menu.sysPlugin': '插件管理',
    'System': '系统管理',
    
    // Plugins
    'config.menu': '参数设置',
    'dict.menu': '字典管理',
    'notice.menu': '通知公告',
    'code_generator.menu': '代码生成',
    'PluginCodeGenerator': '代码生成',
    
    // Log
    'page.menu.log': '日志管理',
    'page.menu.login': '登录日志',
    'page.menu.opera': '操作日志',
    'Log': '日志管理',
    
    // Monitor
    'page.menu.monitor': '系统监控',
    'page.menu.online': '在线用户',
    'page.menu.redis': 'Redis监控',
    'page.menu.server': '服务监控',
    'Monitor': '系统监控',
    
    // Scheduler
    'page.menu.scheduler': '任务调度',
    'page.menu.schedulerManage': '任务管理',
    'page.menu.schedulerRecord': '执行记录',
    'Scheduler': '任务调度',
    
    // Profile/Project
    'page.menu.profile': '个人中心',
    'Profile': '个人中心',
    'Project': '项目',
    '文档': '文档',
    'Apifox': 'Apifox',
    
    // OAuth
    'Github': 'Github',
    'Google': 'Google',
    'Linuxdo': 'Linuxdo',
    
    // Approval (审批流)
    'Approval': '审批流',
    'Flow Management': '流程管理',
    'My Todo': '我的待办',
    'My Initiated': '我发起的',
  };
  
  // 统一获取菜单属性的helper函数
  const getMenuTitle = (item: any) => {
    const title = item.meta?.title || item.title;
    // 翻译标题
    return i18nMap[title] || title;
  };
  const getMenuIcon = (item: any) => {
    // 如果有meta.icon字符串，返回对应的图标组件
    if (item.meta?.icon) {
      const iconName = item.meta.icon;
      const iconMap: Record<string, any> = {
        'FileCheck': FileCheck,
        'LayoutDashboard': LayoutDashboard,
        'Users': Users,
        'Shield': Shield,
        'Menu': Menu,
        'Building2': Building2,
        'Database': Database,
        'Clock': Clock,
        'FileText': FileText,
        'Monitor': Monitor,
        'Server': Server,
        'Calendar': Calendar,
        'Settings': Settings,
        'Book': Book,
        'Puzzle': Puzzle,
        'Bell': Bell,
        'Layers': Layers,
        // 确保有默认值
        'default': FileText
      };
      const IconComponent = iconMap[iconName];
      // 确保返回的是有效的组件
      return IconComponent ? IconComponent : FileText;
    }
    // 如果是静态菜单，直接返回icon组件；确保不是undefined
    if (item.icon && typeof item.icon === 'function') {
      return item.icon;
    }
    // 最终默认返回FileText
    return FileText;
  };
  const shouldHideMenu = (item: any) => item.meta?.hideInMenu || false;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo Header */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-lg">U</span>
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-semibold text-base">uFBA</h1>
            <p className="text-sidebar-foreground/60 text-xs">shadcn/ui</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuItems.map((item: any, index: number) => {
            if (shouldHideMenu(item)) return null;
            const ItemIcon = getMenuIcon(item);
            const itemTitle = getMenuTitle(item);
            
            return (
            <div key={index}>
              {item.children && item.children.length > 0 ? (
                <div>
                  <button
                    onClick={() => toggleGroup(String(index))}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-sidebar-foreground/70 text-sm font-medium hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-all group",
                      expandedGroups.has(String(index)) && "text-sidebar-foreground bg-sidebar-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <ItemIcon className="w-[18px] h-[18px] flex-shrink-0" />
                      <span>{itemTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.children.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-sidebar-accent text-sidebar-foreground/60">
                          {item.children.length}
                        </Badge>
                      )}
                      {expandedGroups.has(String(index)) ? (
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform" />
                      )}
                    </div>
                  </button>
                  
                  {expandedGroups.has(String(index)) && (
                    <div className="mt-1 space-y-0.5 ml-3 pl-3 border-l-2 border-sidebar-border">
                      {item.children.map((child: any, childIndex: number) => {
                        if (shouldHideMenu(child)) return null;
                        
                        const ChildIcon = getMenuIcon(child);
                        const childTitle = getMenuTitle(child);
                        
                        // 处理嵌套子菜单
                        if (child.children && child.children.length > 0) {
                          const childKey = `${index}-${childIndex}`;
                          return (
                            <div key={childIndex}>
                              <button
                                onClick={() => toggleGroup(childKey)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-sidebar-foreground/60 text-sm hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-all",
                                  expandedGroups.has(childKey) && "text-sidebar-foreground bg-sidebar-accent/30"
                                )}
                              >
                                <div className="flex items-center gap-2.5">
                                  <ChildIcon className="w-4 h-4" />
                                  <span>{childTitle}</span>
                                </div>
                                {expandedGroups.has(childKey) ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {expandedGroups.has(childKey) && (
                                <div className="mt-0.5 space-y-0.5 ml-3">
                                  {child.children.map((subChild: any) => {
                                    if (shouldHideMenu(subChild)) return null;
                                    
                                    const SubChildIcon = getMenuIcon(subChild);
                                    const subChildTitle = getMenuTitle(subChild);
                                    const isActive = location.pathname === subChild.path;
                                    
                                    return (
                                      <Link
                                        key={subChild.path}
                                        to={subChild.path}
                                        className={cn(
                                          "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all relative",
                                          isActive
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                        )}
                                      >
                                        {isActive && (
                                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary-foreground rounded-r-full" />
                                        )}
                                        <SubChildIcon className="w-4 h-4" />
                                        <span>{subChildTitle}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // 普通菜单项
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path!}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all relative group",
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sidebar-primary-foreground rounded-r-full" />
                            )}
                            <ChildIcon className="w-4 h-4" />
                            <span>{childTitle}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <Users className="w-4 h-4 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">管理员</p>
            <p className="text-sidebar-foreground/60 text-xs truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
