# 开发文档

## 🏗️ 项目架构

### 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.6.2 | 类型系统 |
| Vite | 6.0.1 | 构建工具 |
| TailwindCSS | 3.4.17 | CSS 框架 |
| shadcn/ui | Latest | UI 组件 |
| React Router | 7.0.2 | 路由管理 |
| Axios | 1.7.9 | HTTP 客户端 |

### 目录结构说明

```
src/
├── api/                    # API 层
│   ├── client.ts          # HTTP 客户端配置
│   └── *.ts               # 各模块 API 定义
├── components/            # 组件层
│   ├── ui/               # shadcn/ui 组件
│   └── *.tsx             # 业务组件
├── contexts/              # Context 状态
├── layouts/               # 布局组件
├── pages/                 # 页面组件
│   ├── auth/             # 认证相关
│   ├── system/           # 系统管理
│   ├── log/              # 日志管理
│   ├── monitor/          # 系统监控
│   ├── scheduler/        # 任务调度
│   └── plugins/          # 插件功能
├── routes/                # 路由配置
├── types/                 # 类型定义
├── lib/                   # 工具函数
└── main.tsx              # 入口文件
```

## 🔧 开发工具配置

### VSCode 推荐插件

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

### VSCode 设置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 📐 设计规范

### 主题色彩

```css
/* 主色调 */
--primary: oklch(0.646 0.222 41.116);      /* 橙色 */
--primary-foreground: oklch(0.98 0.016 73.684);

/* 背景色 */
--background: oklch(1 0 0);                /* 白色 */
--foreground: oklch(0.141 0.005 285.823);  /* 深灰 */

/* 卡片 */
--card: oklch(1 0 0);
--card-foreground: oklch(0.141 0.005 285.823);

/* 边框 */
--border: oklch(0.92 0.004 286.32);
```

### 间距系统

遵循 8px 基准网格：

- 4px (0.5) - 最小间距
- 8px (1) - 紧凑间距
- 16px (2) - 标准间距
- 24px (3) - 中等间距
- 32px (4) - 大间距
- 48px (6) - 超大间距

### 字体大小

```css
text-xs: 12px
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px
```

## 🎯 最佳实践

### 组件设计

#### 1. 单一职责原则

```tsx
// ✅ 好的做法 - 职责单一
function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar>
      <AvatarImage src={user.avatar} />
      <AvatarFallback>{user.name[0]}</AvatarFallback>
    </Avatar>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <UserAvatar user={user} />
      <UserInfo user={user} />
      <UserActions user={user} />
    </Card>
  );
}
```

#### 2. Props 接口定义

```tsx
// ✅ 使用 interface 定义 Props
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export default function UserCard({ user, onEdit, onDelete, className }: UserCardProps) {
  // ...
}
```

#### 3. 使用 Composition

```tsx
// ✅ 使用组合而非继承
function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

// 使用
<PageHeader
  title="用户管理"
  description="管理系统用户"
  actions={<Button>添加用户</Button>}
/>
```

### 状态管理

#### 1. 本地状态

```tsx
// ✅ 使用 useState 管理本地状态
const [loading, setLoading] = useState(false);
const [data, setData] = useState<User[]>([]);
```

#### 2. 全局状态

```tsx
// ✅ 使用 Context 管理全局状态
import { useAuth } from '@/contexts/AuthContext';

const { user, logout } = useAuth();
```

### API 调用

#### 1. 错误处理

```tsx
const fetchUsers = async () => {
  setLoading(true);
  try {
    const response = await ApiClient.get('/v1/sys/users');
    setUsers(response.data);
  } catch (error) {
    toast({
      title: '错误',
      description: '获取用户列表失败',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};
```

#### 2. 请求封装

```typescript
// api/user.ts
export interface User {
  id: number;
  username: string;
  nickname: string;
}

export const getUserListApi = (params: PageParams) => {
  return ApiClient.get<PageResult<User>>('/v1/sys/users', { params });
};

export const createUserApi = (data: Partial<User>) => {
  return ApiClient.post('/v1/sys/users', data);
};
```

### 表单处理

```tsx
function UserForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证
    if (!formData.username) {
      toast({ title: '错误', description: '请输入用户名', variant: 'destructive' });
      return;
    }

    // 提交
    try {
      await createUserApi(formData);
      toast({ title: '成功', description: '用户创建成功' });
    } catch (error) {
      toast({ title: '错误', description: '创建失败', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <Button type="submit">提交</Button>
    </form>
  );
}
```

## 🚀 性能优化

### 1. 代码分割

```tsx
// 使用动态导入
const UserManagement = lazy(() => import('./pages/system/UserManagementPage'));

// 使用 Suspense
<Suspense fallback={<Loading />}>
  <UserManagement />
</Suspense>
```

### 2. 避免不必要的渲染

```tsx
// 使用 memo
export default memo(UserCard, (prev, next) => prev.user.id === next.user.id);

// 使用 useCallback
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// 使用 useMemo
const filteredUsers = useMemo(() => {
  return users.filter(u => u.status === 1);
}, [users]);
```

### 3. 图片优化

```tsx
// 使用懒加载
<img loading="lazy" src={user.avatar} alt={user.name} />

// 使用合适的尺寸
<img src={`${user.avatar}?w=100&h=100`} alt={user.name} />
```

## 🐛 调试技巧

### React DevTools

1. 安装 React Developer Tools 扩展
2. 使用 Components 面板查看组件树
3. 使用 Profiler 分析性能

### Console 调试

```typescript
// 条件断点
if (import.meta.env.DEV) {
  console.log('Debug:', data);
}

// 性能测量
console.time('fetch-users');
await fetchUsers();
console.timeEnd('fetch-users');
```

### Network 调试

在浏览器 DevTools 的 Network 面板中：
- 查看请求/响应
- 检查请求头
- 分析请求时间

## 📚 参考资源

- [React 官方文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Vite 文档](https://vitejs.dev/)

---

更新时间: 2024-11-18
