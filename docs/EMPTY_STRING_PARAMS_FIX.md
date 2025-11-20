# 空字符串参数导致查询结果为空的问题修复

## 问题现象

### 症状
- 数据库中有数据
- 后端返回：`{"code":200,"msg":"请求成功","data":[]}`
- 前端显示空列表

### 错误日志
```
GET /api/v1/sys/depts?name=&leader=&phone=
```

---

## 问题分析

### 当前代码（修复前）

```typescript
const [searchParams, setSearchParams] = useState({
  name: '',      // ❌ 空字符串
  leader: '',    // ❌ 空字符串
  phone: '',     // ❌ 空字符串
  status: undefined,
});

const fetchDepts = async () => {
  const response = await ApiClient.get('/v1/sys/depts', {
    params: searchParams,  // ❌ 发送所有参数，包括空字符串
  });
};
```

### 实际请求
```
GET /api/v1/sys/depts?name=&leader=&phone=
```

### 后端解析（FastAPI/Pydantic）

```python
@router.get("/sys/depts")
async def get_depts(
    name: Optional[str] = None,      # 接收到 '' (空字符串)
    leader: Optional[str] = None,    # 接收到 '' (空字符串)
    phone: Optional[str] = None,     # 接收到 '' (空字符串)
):
    # 后端可能这样处理：
    query = db.query(Department)
    
    if name is not None:  # ❌ '' 不是 None，条件成立
        query = query.filter(Department.name == name)  # ❌ 查找 name = ''
    
    if leader is not None:  # ❌ '' 不是 None，条件成立
        query = query.filter(Department.leader == leader)  # ❌ 查找 leader = ''
    
    return query.all()  # ❌ 没有记录匹配 name='' AND leader=''
```

### 问题根源

| 前端发送 | 后端接收 | 后端判断 | SQL 查询 | 结果 |
|---------|---------|---------|---------|------|
| `name=` | `''` (空字符串) | `is not None` ✅ | `WHERE name = ''` | 无匹配 ❌ |
| 不传 `name` | `None` | `is None` ✅ | 不加条件 | 正常查询 ✅ |

**结论**：空字符串被当作**有效的查询条件**，而不是"不查询"。

---

## 解决方案

### 方案 1：过滤空字符串参数（推荐）✅

```typescript
const fetchDepts = async () => {
  // ✅ 过滤掉空字符串和 undefined
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([_, value]) => 
      value !== '' && value !== undefined && value !== null
    )
  );
  
  const response = await ApiClient.get('/v1/sys/depts', {
    params: filteredParams,  // ✅ 只发送有值的参数
  });
};
```

**效果**：
- 初始加载时：`GET /api/v1/sys/depts` (无参数) ✅
- 搜索 name="技术部"：`GET /api/v1/sys/depts?name=技术部` ✅
- 搜索 name="技术部", status=1：`GET /api/v1/sys/depts?name=技术部&status=1` ✅

---

### 方案 2：使用 undefined 初始化（备选）

```typescript
const [searchParams, setSearchParams] = useState<{
  name?: string;
  leader?: string;
  phone?: string;
  status?: number;
}>({
  // 所有字段都不设置，默认 undefined
});
```

**缺点**：
- Input 组件需要处理 `undefined` 值
- 代码更复杂

---

## 修复前后对比

### 修复前 ❌

```typescript
// 初始状态
searchParams = { name: '', leader: '', phone: '', status: undefined }

// 实际请求
GET /api/v1/sys/depts?name=&leader=&phone=

// 后端 SQL
SELECT * FROM departments WHERE name = '' AND leader = '' AND phone = ''

// 结果
[] (空数组)
```

### 修复后 ✅

```typescript
// 初始状态
searchParams = { name: '', leader: '', phone: '', status: undefined }

// 过滤后
filteredParams = {}  // 所有空值都被过滤

// 实际请求
GET /api/v1/sys/depts

// 后端 SQL
SELECT * FROM departments  -- 无 WHERE 条件

// 结果
[{ id: 1, name: "总公司" }, { id: 2, name: "技术部" }, ...]  ✅
```

### 搜索场景（修复后）

```typescript
// 用户输入 name="技术部"
searchParams = { name: '技术部', leader: '', phone: '', status: undefined }

// 过滤后
filteredParams = { name: '技术部' }  // 只保留有值的参数

// 实际请求
GET /api/v1/sys/depts?name=技术部

// 后端 SQL
SELECT * FROM departments WHERE name LIKE '%技术部%'

// 结果
[{ id: 2, name: "技术部" }, { id: 3, name: "技术支持部" }]  ✅
```

---

## 其他需要修复的地方

这个问题**同样影响其他页面**，需要统一修复：

### 用户管理
```typescript
// UserManagementPage.tsx
const fetchUsers = async () => {
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([_, value]) => 
      value !== '' && value !== undefined && value !== null
    )
  );
  const response = await ApiClient.get('/v1/sys/users', {
    params: filteredParams,
  });
};
```

### 任务管理
```typescript
// SchedulerPage.tsx
const fetchTasks = async () => {
  const filteredParams = Object.fromEntries(
    Object.entries({ 
      page: pagination.current,
      size: pagination.pageSize,
      name: searchParams.name 
    }).filter(([_, value]) => 
      value !== '' && value !== undefined && value !== null
    )
  );
  const response = await ApiClient.get('/v1/tasks/schedulers', {
    params: filteredParams,
  });
};
```

---

## 最佳实践

### 1. 搜索参数初始化

```typescript
// ✅ 推荐：使用空字符串，在请求时过滤
const [searchParams, setSearchParams] = useState({
  name: '',
  leader: '',
  phone: '',
});

// 请求时过滤
const filteredParams = Object.fromEntries(
  Object.entries(searchParams).filter(([_, value]) => value !== '')
);
```

### 2. 创建通用过滤函数

```typescript
// utils/params.ts
export function filterEmptyParams<T extends Record<string, any>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => 
      value !== '' && value !== undefined && value !== null
    )
  ) as Partial<T>;
}

// 使用
import { filterEmptyParams } from '@/utils/params';

const fetchDepts = async () => {
  const response = await ApiClient.get('/v1/sys/depts', {
    params: filterEmptyParams(searchParams),
  });
};
```

### 3. 分页参数特殊处理

```typescript
const fetchTasks = async () => {
  const filteredParams = filterEmptyParams({
    page: pagination.current || 1,    // 分页参数保留 0
    size: pagination.pageSize || 10,  // 分页参数保留 0
    name: searchParams.name,
    status: searchParams.status,
  });
  
  const response = await ApiClient.get('/v1/tasks/schedulers', {
    params: filteredParams,
  });
};
```

---

## axios 参数传递机制

### axios 如何处理参数

```typescript
// 1. 正常值
axios.get('/api', { params: { name: '技术部' } })
// → GET /api?name=技术部

// 2. 空字符串（会保留）
axios.get('/api', { params: { name: '' } })
// → GET /api?name=

// 3. undefined（会忽略）
axios.get('/api', { params: { name: undefined } })
// → GET /api

// 4. null（会转为字符串）
axios.get('/api', { params: { name: null } })
// → GET /api?name=null

// 5. 数字 0（会保留）
axios.get('/api', { params: { page: 0 } })
// → GET /api?page=0
```

### 后端如何解析

```python
# FastAPI/Pydantic
@router.get("/api")
async def get_data(name: Optional[str] = None):
    # 前端传 name=
    # name = ''  (空字符串)
    
    # 前端不传 name
    # name = None
    
    # 建议后端也做处理
    if name == '':
        name = None  # 将空字符串转为 None
```

---

## 总结

### 问题根源
- ✅ 前端发送空字符串参数 `?name=&leader=`
- ✅ 后端将空字符串当作有效查询条件
- ✅ SQL: `WHERE name = '' AND leader = ''`
- ✅ 结果：无匹配记录

### 解决方案
- ✅ 前端过滤空字符串参数
- ✅ 只发送有值的参数
- ✅ 后端也可以做防御处理（将 `''` 转为 `None`）

### 修复效果
- ✅ 初始加载：无参数 → 查询全部
- ✅ 搜索时：只发送有值的参数
- ✅ 重置后：清空参数 → 查询全部
