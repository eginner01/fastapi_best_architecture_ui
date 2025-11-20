# 确认对话框系统

一个基于 shadcn/ui AlertDialog 的统一确认对话框系统，用于替换浏览器原生的 `confirm()` 和 `alert()`。

## 特性

- ✅ **统一风格** - 与应用深色主题完美融合
- ✅ **类型丰富** - 支持警告、错误、信息、成功四种类型
- ✅ **Promise API** - 使用 async/await 语法，代码更清晰
- ✅ **可定制** - 支持自定义标题、描述、按钮文字
- ✅ **带图标** - 每种类型都有相应的图标提示
- ✅ **动画效果** - 平滑的进入和退出动画

## 快速开始

### 1. 使用 Hook

```tsx
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';

function MyComponent() {
  const { confirm, alert } = useConfirmDialog();
  
  // 使用确认对话框
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '删除确认',
      description: '确定要删除这条记录吗？',
      confirmText: '删除',
      type: 'error',
    });
    
    if (confirmed) {
      // 执行删除操作
    }
  };
  
  return <button onClick={handleDelete}>删除</button>;
}
```

## API 参考

### `confirm(options)`

显示一个确认对话框，返回 Promise<boolean>。

#### 参数

```typescript
interface ConfirmDialogOptions {
  title?: string;           // 对话框标题，默认 "确认操作"
  description: string;      // 对话框描述（必填）
  confirmText?: string;     // 确认按钮文字，默认 "确定"
  cancelText?: string;      // 取消按钮文字，默认 "取消"
  type?: 'warning' | 'info' | 'success' | 'error';  // 对话框类型，默认 'warning'
  onConfirm?: () => void | Promise<void>;  // 确认回调
  onCancel?: () => void;    // 取消回调
}
```

#### 返回值

- `Promise<boolean>` - 用户点击确定返回 `true`，点击取消返回 `false`

#### 示例

```tsx
// 基础用法
const confirmed = await confirm({
  description: '确认执行此操作吗？',
});

// 完整配置
const confirmed = await confirm({
  title: '删除用户',
  description: '确认删除该用户？此操作不可恢复！',
  confirmText: '删除',
  cancelText: '取消',
  type: 'error',
});
```

### `alert(title, description, type?)`

显示一个纯提示对话框（无取消按钮），返回 Promise<void>。

#### 参数

- `title: string` - 标题
- `description: string` - 描述
- `type?: 'info' | 'success' | 'error'` - 类型，默认 'info'

#### 示例

```tsx
// 成功提示
await alert('操作成功', '数据已成功保存', 'success');

// 错误提示
await alert('操作失败', '网络连接失败，请重试', 'error');
```

## 对话框类型

### Warning（警告）
- 图标：⚠️ 黄色警告图标
- 用途：一般性确认操作
- 确认按钮：主色调

### Error（错误/删除）
- 图标：❌ 红色错误图标
- 用途：删除、危险操作
- 确认按钮：红色 (destructive)

### Info（信息）
- 图标：ℹ️ 蓝色信息图标
- 用途：信息性确认
- 确认按钮：主色调

### Success（成功）
- 图标：✅ 绿色成功图标
- 用途：成功提示、继续操作
- 确认按钮：主色调

## 使用场景

### 1. 删除操作

```tsx
const handleDelete = async (id: number) => {
  const confirmed = await confirm({
    title: '删除数据',
    description: '确认删除该数据？此操作不可恢复！',
    confirmText: '删除',
    type: 'error',
  });
  
  if (!confirmed) return;
  
  try {
    await deleteApi(id);
    toast({ title: "成功", description: "删除成功" });
  } catch (error) {
    toast({ title: "错误", description: "删除失败", variant: "destructive" });
  }
};
```

### 2. 批量操作

```tsx
const handleBatchDelete = async (ids: number[]) => {
  const confirmed = await confirm({
    title: '批量删除',
    description: `确认删除选中的 ${ids.length} 项数据吗？`,
    confirmText: '批量删除',
    type: 'error',
  });
  
  if (!confirmed) return;
  
  // 执行批量删除
};
```

### 3. 表单提交前确认

```tsx
const handleSubmit = async (data: FormData) => {
  const confirmed = await confirm({
    title: '提交确认',
    description: '确认提交表单数据吗？提交后无法修改。',
    confirmText: '提交',
    type: 'warning',
  });
  
  if (!confirmed) return;
  
  // 提交表单
};
```

### 4. 状态切换确认

```tsx
const handleToggleStatus = async (id: number, currentStatus: boolean) => {
  const confirmed = await confirm({
    title: currentStatus ? '禁用插件' : '启用插件',
    description: `确认${currentStatus ? '禁用' : '启用'}该插件吗？`,
    confirmText: '确定',
    type: 'warning',
  });
  
  if (!confirmed) return;
  
  // 切换状态
};
```

### 5. 离开页面确认

```tsx
const handleLeave = async () => {
  const hasUnsavedChanges = true; // 检查是否有未保存的更改
  
  if (hasUnsavedChanges) {
    const confirmed = await confirm({
      title: '离开页面',
      description: '您有未保存的更改，确认离开吗？',
      confirmText: '离开',
      cancelText: '继续编辑',
      type: 'warning',
    });
    
    if (!confirmed) return;
  }
  
  // 离开页面
  navigate('/dashboard');
};
```

### 6. 成功后的下一步操作

```tsx
const handleSaveAndContinue = async () => {
  try {
    await saveData();
    
    const confirmed = await alert(
      '保存成功',
      '数据已成功保存，是否继续添加？',
      'success'
    );
    
    // 无论用户选择什么，都会继续
  } catch (error) {
    await alert('保存失败', '数据保存失败，请重试', 'error');
  }
};
```

## 迁移指南

### 从 `window.confirm()` 迁移

**之前：**
```tsx
const handleDelete = async (id: number) => {
  if (!confirm('确认删除吗？')) return;
  await deleteApi(id);
};
```

**之后：**
```tsx
const { confirm } = useConfirmDialog();

const handleDelete = async (id: number) => {
  const confirmed = await confirm({
    title: '删除确认',
    description: '确认删除该数据吗？',
    type: 'error',
  });
  
  if (!confirmed) return;
  await deleteApi(id);
};
```

### 从 `window.alert()` 迁移

**之前：**
```tsx
alert('操作成功！');
```

**之后：**
```tsx
const { alert } = useConfirmDialog();

await alert('操作成功', '您的操作已成功完成', 'success');
```

## 样式定制

对话框样式遵循应用的深色主题，关键样式类：

```tsx
// 对话框内容
className="bg-card border-border"

// 确认按钮（根据类型变化）
type === 'error' 
  ? 'bg-destructive hover:bg-destructive/90' 
  : 'bg-primary text-primary-foreground hover:bg-primary/90'

// 取消按钮
className="border-border text-sm"
```

## 最佳实践

1. **使用描述性标题** - 让用户清楚知道这个对话框的目的
2. **选择合适的类型** - 删除操作用 `error`，一般确认用 `warning`
3. **自定义按钮文字** - 使用具体的动作词，如"删除"、"提交"，而不是通用的"确定"
4. **添加详细描述** - 说明操作的后果，特别是不可逆操作
5. **结合 Toast** - 操作完成后使用 Toast 提示结果

## 示例组件

查看完整示例：`src/components/ConfirmDialogExample.tsx`

## 技术细节

- 基于 `@radix-ui/react-alert-dialog`
- 使用 React Context 管理全局状态
- Promise API 实现异步确认
- 支持同时显示多个对话框（队列管理）
- 深色主题适配
- 响应式设计
