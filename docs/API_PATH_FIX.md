# API 路径问题修复说明

## 问题描述

前端请求部门列表时，URL 出现路径重复：
```
❌ 错误：http://localhost:5173/api/api/v1/sys/depts
✅ 正确：http://localhost:5173/api/v1/sys/depts
```

返回 **404 Not Found** 错误。

---

## 问题原因

### 1. axios 客户端配置

**`src/api/client.ts`** (第4行)
```typescript
const apiClient = axios.create({
  baseURL: '/api',  // ✅ 设置了基础路径
  timeout: 10000,
});
```

### 2. API 调用方式

**错误写法** ❌
```typescript
// 在 DeptManagementPage.tsx 中
const response = await ApiClient.get('/api/v1/sys/depts', {
  params: searchParams,
});
```

### 3. axios 拼接逻辑

```
baseURL ('/api') + 请求路径 ('/api/v1/sys/depts') 
= '/api/api/v1/sys/depts'  ❌
```

---

## 解决方案

### 方案选择

| 方案 | baseURL | API 调用路径 | 推荐 |
|------|---------|-------------|------|
| 方案1 | `''` (空) | `/api/v1/...` | ❌ 不推荐 |
| 方案2 | `/api` | `/v1/...` | ✅ **推荐** |

### 采用方案2

**保持** `baseURL: '/api'`，**修改**所有 API 调用路径：

```typescript
// ✅ 正确写法
const response = await ApiClient.get('/v1/sys/depts', {
  params: searchParams,
});
```

---

## 修复的文件

### 1. 部门管理 (DeptManagementPage.tsx)

```typescript
// ❌ 修复前
await ApiClient.get('/api/v1/sys/depts')
await ApiClient.post('/api/v1/sys/depts', data)
await ApiClient.put(`/api/v1/sys/depts/${id}`, data)
await ApiClient.delete(`/api/v1/sys/depts/${id}`)

// ✅ 修复后
await ApiClient.get('/v1/sys/depts')
await ApiClient.post('/v1/sys/depts', data)
await ApiClient.put(`/v1/sys/depts/${id}`, data)
await ApiClient.delete(`/v1/sys/depts/${id}`)
```

### 2. 任务管理 (SchedulerPage.tsx)

```typescript
// ✅ 修复后
await ApiClient.get('/v1/tasks/schedulers')
await ApiClient.post('/v1/tasks/schedulers', data)
await ApiClient.put(`/v1/tasks/schedulers/${id}`, data)
await ApiClient.put(`/v1/tasks/schedulers/${id}/status`)
await ApiClient.post(`/v1/tasks/schedulers/${id}/executions`)
await ApiClient.delete(`/v1/tasks/schedulers/${id}`)
```

### 3. 执行记录 (TaskRecordPage.tsx)

```typescript
// ✅ 修复后
await ApiClient.get('/v1/tasks/results')
await ApiClient.delete(`/v1/tasks/results/${id}`)
await ApiClient.delete(`/v1/tasks/${taskId}/cancel`)
```

---

## 请求流程

### 1. 前端调用
```typescript
ApiClient.get('/v1/sys/depts', { params: { name: '', leader: '' } })
```

### 2. axios 拼接
```
baseURL: '/api' + 路径: '/v1/sys/depts' + 参数
= '/api/v1/sys/depts?name=&leader='
```

### 3. 浏览器请求
```
http://localhost:5173/api/v1/sys/depts?name=&leader=
```

### 4. Vite 代理转发

**vite.config.ts** 配置：
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',  // 后端地址
      changeOrigin: true,
    },
  },
}
```

### 5. 最终请求
```
http://127.0.0.1:8000/api/v1/sys/depts?name=&leader=
```

---

## API 路径规范

### ✅ 正确的做法

```typescript
// client.ts
const apiClient = axios.create({
  baseURL: '/api',  // 代理前缀
});

// 页面中调用
ApiClient.get('/v1/sys/depts')       // ✅ 只写业务路径
ApiClient.get('/v1/tasks/schedulers') // ✅ 只写业务路径
```

### ❌ 错误的做法

```typescript
// client.ts
const apiClient = axios.create({
  baseURL: '/api',
});

// 页面中调用
ApiClient.get('/api/v1/sys/depts')  // ❌ 重复了 /api
```

---

## 对比 web-antd

### web-antd 的方式

**request.ts**
```typescript
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});
```

- `apiURL` 从环境变量获取（可能是完整后端地址或空）
- API 调用使用完整路径 `/api/v1/...`
- 如果 `apiURL` 是 `http://backend.com`，则不会重复
- 如果 `apiURL` 是空，则正常工作

### web-react 的方式

- `baseURL` 硬编码为 `/api`（开发环境代理前缀）
- API 调用只写业务路径 `/v1/...`
- 通过 Vite 代理转发到后端

---

## 验证方法

### 1. 浏览器开发者工具

**Network 标签** 查看请求：
```
✅ 正确：http://localhost:5173/api/v1/sys/depts
❌ 错误：http://localhost:5173/api/api/v1/sys/depts
```

### 2. 响应状态

```
✅ 200 OK - 请求成功
❌ 404 Not Found - 路径错误
```

---

## 注意事项

1. **所有新增 API 调用都要遵循规范**
   - 使用 ApiClient 时只写 `/v1/...` 路径
   - 不要包含 `/api` 前缀

2. **baseURL 统一管理**
   - 开发环境：`/api`（通过 Vite 代理）
   - 生产环境：可能需要配置为完整后端地址

3. **其他文件检查**
   - 如有新增页面使用 ApiClient
   - 记得检查 API 路径是否正确

---

## 快速检查

搜索项目中的所有 API 调用：

```bash
# 查找可能有问题的调用
grep -r "ApiClient.get('/api/" src/
grep -r "ApiClient.post('/api/" src/
grep -r "ApiClient.put('/api/" src/
grep -r "ApiClient.delete('/api/" src/

# 应该返回空结果（表示已全部修复）
```

---

## 总结

- ✅ 问题已修复：所有 API 路径去掉 `/api` 前缀
- ✅ 规范已建立：baseURL + 业务路径
- ✅ 三个主要页面已修复：部门管理、任务管理、执行记录
- ✅ 请求现在正常：`/api/v1/...` 而不是 `/api/api/v1/...`
