# 审批流系统实施文档

## 概述

本项目已成功实施完整的审批流系统，支持多级审批、会签/或签、条件分支等企业级功能。

## 后端实现

### 目录结构

```
backend/plugin/approval/
├── __init__.py
├── plugin.toml              # 插件配置
├── requirements.txt         # 依赖（simpleeval）
├── model/                   # 数据模型层
│   ├── __init__.py
│   ├── flow.py             # 流程模型
│   ├── flow_node.py        # 节点模型
│   ├── flow_line.py        # 流程线模型
│   ├── instance.py         # 实例模型
│   ├── step.py             # 步骤模型
│   └── opinion.py          # 意见模型
├── schema/                  # Schema层
│   ├── __init__.py
│   ├── flow.py
│   └── instance.py
├── crud/                    # CRUD数据访问层
│   ├── __init__.py
│   ├── flow.py
│   ├── instance.py
│   └── step.py
├── service/                 # 业务逻辑层
│   ├── __init__.py
│   ├── flow_engine.py      # 流程引擎核心
│   ├── flow_service.py     # 流程服务
│   └── instance_service.py # 实例服务
├── api/                     # API接口层
│   ├── __init__.py
│   └── router.py
└── sql/                     # 数据库迁移
    └── mysql/
        └── init.sql
```

### 核心功能

#### 1. 流程引擎（FlowEngine）
- ✅ 流程实例启动
- ✅ 节点流转控制
- ✅ 条件分支支持（表达式求值）
- ✅ 会签/或签支持
- ✅ 审批操作（同意/拒绝/转交/退回）

#### 2. 数据库模型
- ✅ 流程表（approval_flow）
- ✅ 流程节点表（approval_flow_node）
- ✅ 流程线表（approval_flow_line）
- ✅ 流程实例表（approval_instance）
- ✅ 流程步骤表（approval_step）
- ✅ 审批意见表（approval_opinion）

#### 3. API接口
- ✅ 流程管理API（/v1/approval/flows）
- ✅ 流程实例API（/v1/approval/instances）
- ✅ 我的任务API（/v1/approval/my）

## 前端实现

### 已实现页面

1. **FlowManagementPage** - 流程管理
   - 流程列表展示
   - 流程发布/取消发布
   - 流程编辑/删除
   
2. **TodoListPage** - 我的待办
   - 待办任务列表
   - 统计卡片
   - 任务处理入口

3. **InitiatedListPage** - 我发起的
   - 发起列表展示
   - 状态跟踪
   - 取消申请

### API调用层
- ✅ 完整的TypeScript类型定义
- ✅ 所有API方法封装

## 部署步骤

### 1. 后端部署

#### 安装依赖
```bash
cd backend
pip install simpleeval
```

#### 执行数据库迁移
```bash
# 使用项目自带的CLI工具
python cli.py

# 或手动执行SQL
mysql -u root -p database_name < backend/plugin/approval/sql/mysql/init.sql
```

#### 启动服务
```bash
# 插件会自动被加载
python run.py
```

### 2. 前端部署

#### 安装依赖（如需流程图可视化）
```bash
cd web-react
npm install reactflow  # 流程图编辑器
```

#### 添加路由配置
在 `web-react/src/main.tsx` 中添加：

```typescript
import FlowManagementPage from './pages/approval/FlowManagementPage';
import TodoListPage from './pages/approval/TodoListPage';
import InitiatedListPage from './pages/approval/InitiatedListPage';

// 在路由配置中添加
<Route path="approval/flow-manage" element={<FlowManagementPage />} />
<Route path="approval/todo" element={<TodoListPage />} />
<Route path="approval/initiated" element={<InitiatedListPage />} />
```

#### 启动开发服务器
```bash
npm run dev
```

## 配置说明

### 后端配置

在 `backend/plugin/approval/plugin.toml` 中：
```toml
[plugin]
summary = "可自定义审批流系统"
version = "1.0.0"
description = "支持多级审批、会签/或签、条件分支的企业级审批流系统"
author = "FBA Team"

[app]
router = ["v1"]
```

### 数据库配置

系统使用现有项目的数据库配置，无需额外设置。

## 使用指南

### 创建流程

1. 进入"流程管理"页面
2. 点击"新建流程"
3. 配置流程基本信息
4. 设计流程节点和连线
5. 发布流程

### 发起审批

1. 选择已发布的流程
2. 填写表单数据
3. 提交申请

### 处理审批

1. 进入"我的待办"
2. 点击"处理"按钮
3. 选择操作（同意/拒绝/转交/退回）
4. 填写意见并提交

## 技术特性

### 后端技术
- FastAPI 异步框架
- SQLAlchemy 2.0 ORM
- SimpleEval 表达式求值
- 插件化架构

### 前端技术
- React 19 + TypeScript
- Shadcn-ui 组件库
- TailwindCSS 样式
- React Router 路由

## 扩展开发

### 添加自定义节点类型

在 `backend/plugin/approval/service/flow_engine.py` 中的 `_move_to_next_node` 方法添加新的节点类型处理逻辑。

### 添加自定义审批人类型

在 `backend/plugin/approval/service/flow_engine.py` 中的 `_get_node_assignees` 方法添加新的审批人解析逻辑。

### 集成消息通知

可以在流程引擎的关键节点添加消息通知：
- 待办任务通知
- 审批结果通知
- 流程超时提醒

## 待完成功能

1. **流程设计器** - 可视化流程图编辑器（推荐使用ReactFlow）
2. **流程图展示** - 实例进度可视化
3. **表单设计器** - 动态表单配置
4. **消息通知** - 集成现有通知系统
5. **流程统计** - 报表和分析

## API文档

启动后端服务后，访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 故障排查

### 插件未加载
检查 `backend/plugin/approval/plugin.toml` 配置是否正确

### 数据库表未创建
手动执行 SQL 迁移脚本

### 依赖安装失败
确保 `simpleeval` 包已正确安装

## 许可证

本项目遵循 MIT 许可证
