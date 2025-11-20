# API 参数传递机制详解

## 问题现象

### 错误日志
```
2025-11-18 14:24:55.329 | ERROR | 请求异常: 请求参数非法: 
status 输入应为有效的整数，无法将字符串解析为整数，输入：
```

### 错误原因
后端收到：`/api/v1/sys/depts?name=&leader=&phone=&status=`
- `status=` 是空字符串
- 后端期望整数或不传该参数
- FastAPI/Pydantic 无法将空字符串解析为整数

---

## web-antd vs web-react 参数处理对比

### **web-antd 的处理方式**

#### 1. 环境配置
```typescript
// .env.development
VITE_GLOB_API_URL=http://localhost:8000

// vite.config.mts
proxy: {
  '/api': {
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
    target: 'http://localhost:5320/api',  // 代理到 mock 或实际后端
  },
}
```

#### 2. API 请求配置
```typescript
// request.ts
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});
```

- `apiURL` 从环境变量获取：`http://localhost:8000`
- baseURL 设置为完整的后端地址

#### 3. API 调用
```typescript
// dept.ts
export async function getSysDeptTreeApi(params: SysDeptTreeParams) {
  return requestClient.get<SysDeptTreeResult[]>('/api/v1/sys/depts', {
    params,
  });
}
```

#### 4. 表单值处理（关键）
```typescript
// index.vue
proxyConfig: {
  ajax: {
    query: async (_, formValues) => {
      return await getSysDeptTreeApi({ ...formValues });
    },
  },
}
```

**VXE Grid 的 formValues 特性**：
- ✅ 未填写的字段**不会包含**在 formValues 中
- ✅ 下拉框未选择时，值为 `undefined` 或不存在
- ✅ axios 会自动忽略 `undefined` 值

**实际发送的请求**：
```
GET http://localhost:8000/api/v1/sys/depts?name=xxx&leader=yyy
(只包含有值的参数，status 不会出现)
```

---

### **web-react 修复前的问题**

#### 1. 搜索参数初始化
```typescript
// ❌ 错误的方式
const [searchParams, setSearchParams] = useState({
  name: '',
  leader: '',
  phone: '',
  status: '',     // ❌ 空字符串
});
```

#### 2. 实际发送的请求
```
GET /api/v1/sys/depts?name=&leader=&phone=&status=
                                              ↑
                            空字符串，后端无法解析为整数
```

#### 3. 后端 Pydantic 模型验证失败
```python
# 后端代码（假设）
class SysDeptQuery(BaseModel):
    name: Optional[str] = None
    leader: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[int] = None  # 期望整数或 None
    
# 收到 status='' 时
# Pydantic 尝试 int('') → ValidationError ❌
```

---

## 修复方案

### **方案 1：使用 undefined（推荐）✅**

#### 1. 类型定义
```typescript
const [searchParams, setSearchParams] = useState<{
  name: string;
  leader: string;
  phone: string;
  status?: number;  // ✅ 可选的数字类型
}>({
  name: '',
  leader: '',
  phone: '',
  // ✅ status 不设置，默认为 undefined
});
```

#### 2. Select 组件处理
```typescript
<Select 
  value={searchParams.status?.toString() || ''} 
  onValueChange={(value) => setSearchParams(prev => ({ 
    ...prev, 
    status: value ? Number(value) : undefined  // ✅ 空值转为 undefined
  }))}
>
  <SelectItem value="">全部</SelectItem>
  <SelectItem value="1">正常</SelectItem>
  <SelectItem value="0">停用</SelectItem>
</Select>
```

#### 3. 重置处理
```typescript
<Button onClick={() => {
  setSearchParams({ name: '', leader: '', phone: '' });
  // ✅ status 不设置，保持 undefined
  setTimeout(fetchDepts, 0);
}}>
  重置
</Button>
```

#### 4. axios 自动过滤
```typescript
// axios 会自动忽略 undefined 值
const response = await ApiClient.get('/v1/sys/depts', {
  params: searchParams,  // { name: '', leader: '', phone: '', status: undefined }
});

// 实际请求：
// GET /api/v1/sys/depts?name=&leader=&phone=
// ✅ status 参数不会出现在 URL 中
```

---

### **方案 2：手动过滤参数**

```typescript
const fetchDepts = async () => {
  setLoading(true);
  try {
    // ✅ 过滤掉空字符串和 undefined
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== '' && value !== undefined)
    );
    
    const response = await ApiClient.get('/v1/sys/depts', {
      params: filteredParams,
    });
    setDepts(response.data || []);
  } catch (error) {
    toast({ title: "错误", description: "获取部门列表失败", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

---

## axios 参数处理机制

### **axios 如何处理 params**

```typescript
// 1. undefined 会被忽略
axios.get('/api', { params: { a: 1, b: undefined } })
// → GET /api?a=1

// 2. null 会被转为字符串 'null'
axios.get('/api', { params: { a: 1, b: null } })
// → GET /api?a=1&b=null

// 3. 空字符串会被保留
axios.get('/api', { params: { a: 1, b: '' } })
// → GET /api?a=1&b=

// 4. 数字会被转为字符串
axios.get('/api', { params: { a: 1, b: 2 } })
// → GET /api?a=1&b=2
```

### **最佳实践**

| 场景 | 推荐值 | 实际请求 |
|------|--------|----------|
| 未填写文本 | `''` | `?name=` |
| 未选择下拉 | `undefined` | 参数不出现 ✅ |
| 数字类型 | `number \| undefined` | `?status=1` 或不出现 ✅ |
| 布尔类型 | `boolean \| undefined` | `?active=true` 或不出现 |

---

## 完整的参数处理流程

### **1. 前端发起请求**
```typescript
ApiClient.get('/v1/sys/depts', {
  params: {
    name: '',
    leader: '',
    phone: '',
    status: undefined,  // ✅
  }
})
```

### **2. axios 处理**
```typescript
// axios 内部
URL: /v1/sys/depts
Query Params: { name: '', leader: '', phone: '' }
// status: undefined 被忽略
```

### **3. 浏览器发送**
```
GET /api/v1/sys/depts?name=&leader=&phone= HTTP/1.1
Host: localhost:5173
```

### **4. Vite 代理转发**
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
  },
}
```

### **5. 后端接收**
```
GET /api/v1/sys/depts?name=&leader=&phone= HTTP/1.1
Host: 127.0.0.1:8000
```

### **6. FastAPI 参数解析**
```python
@router.get("/sys/depts")
async def get_depts(
    name: Optional[str] = None,      # ✅ 接收到空字符串
    leader: Optional[str] = None,    # ✅ 接收到空字符串
    phone: Optional[str] = None,     # ✅ 接收到空字符串
    status: Optional[int] = None,    # ✅ 参数不存在 → None
):
    # status 为 None，验证通过 ✅
```

---

## 常见错误和解决方案

### **错误 1：空字符串传递给数字字段**
```typescript
// ❌ 错误
{ status: '' }

// ✅ 正确
{ status: undefined }  // 或不设置该字段
```

### **错误 2：字符串类型的数字**
```typescript
// ❌ 错误
{ status: '1' }  // 字符串

// ✅ 正确
{ status: 1 }    // 数字
```

### **错误 3：null 值**
```typescript
// ⚠️ 避免使用
{ status: null }  // 会被转为字符串 'null'

// ✅ 推荐
{ status: undefined }
```

---

## 总结

### **关键点**

1. ✅ **数字类型参数**使用 `number | undefined`
2. ✅ **未选择时**设置为 `undefined`，不要用空字符串
3. ✅ **axios 会自动忽略** `undefined` 值
4. ✅ **重置表单时**不设置可选参数

### **修复前后对比**

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| status 类型 | `string` | `number \| undefined` ✅ |
| 初始值 | `''` | `undefined` ✅ |
| 空值处理 | `''` | `undefined` ✅ |
| 实际请求 | `?status=` ❌ | status 不出现 ✅ |
| 后端验证 | 422 错误 ❌ | 验证通过 ✅ |

---

## 扩展：其他数字类型参数

这个修复方案同样适用于其他数字类型参数：

```typescript
const [searchParams, setSearchParams] = useState<{
  name?: string;
  page?: number;        // ✅ 分页
  size?: number;        // ✅ 每页数量
  status?: number;      // ✅ 状态
  sort?: number;        // ✅ 排序
  dept_id?: number;     // ✅ 部门ID
  role_id?: number;     // ✅ 角色ID
}>({
  // 所有可选字段都不设置，默认 undefined
});
```
