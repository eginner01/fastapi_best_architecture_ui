import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from './contexts/AuthContext'
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext'
import { setupGlobalErrorHandlers } from './utils/errorLogger'

import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';

import { AuthGuard } from './routes/AuthGuard';
import UserManagementPage from './pages/system/UserManagementPage';
import RoleManagementPage from './pages/system/RoleManagementPage';
import MenuManagementPage from './pages/system/MenuManagementPage';
import DeptManagementPage from './pages/system/DeptManagementPage';
import DataScopePage from './pages/system/DataScopePage';
import DataRulePage from './pages/system/DataRulePage';
import LoginLogPage from './pages/log/LoginLogPage';
import OperationLogPage from './pages/log/OperaLogPage';
import OnlineUsersPage from './pages/monitor/OnlineUsersPage';
import ServerMonitorPage from './pages/monitor/ServerMonitorPage';
import RedisMonitorPage from './pages/monitor/RedisMonitorPage';
import SchedulerPage from './pages/scheduler/SchedulerPage';
import TaskRecordPage from './pages/scheduler/TaskRecordPage';
import ConfigPage from './pages/plugins/ConfigPage';
import DictPage from './pages/plugins/DictPage';
import CodeGeneratorPage from './pages/plugins/CodeGeneratorPage';
import PluginManagementPage from './pages/system/PluginManagementPage';
import NoticePage from './pages/plugins/NoticePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgetPasswordPage from './pages/ForgetPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import GithubAuthPage from './pages/auth/GithubAuthPage';
import GmailAuthPage from './pages/auth/GmailAuthPage';
import LinuxdoAuthPage from './pages/auth/LinuxdoAuthPage';
import NotFoundPage from './pages/error/NotFoundPage';
import ForbiddenPage from './pages/error/ForbiddenPage';
import InternalErrorPage from './pages/error/InternalErrorPage';
import OfflinePage from './pages/error/OfflinePage';
import ComingSoonPage from './pages/error/ComingSoonPage';
import FlowManagementPage from './pages/approval/FlowManagementPage';
import FlowDesignPage from './pages/approval/FlowDesignPage';
import FlowDetailPage from './pages/approval/FlowDetailPage';
import StartApprovalPage from './pages/approval/StartApprovalPage';
import ProcessApprovalPage from './pages/approval/ProcessApprovalPage';
import TodoListPage from './pages/approval/TodoListPage';
import InitiatedListPage from './pages/approval/InitiatedListPage';
import InstanceDetailPage from './pages/approval/InstanceDetailPage';

// 初始化全局错误处理器
setupGlobalErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ConfirmDialogProvider>
        <BrowserRouter>
          <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forget-password" element={<ForgetPasswordPage />} />
          <Route path="/auth/github" element={<GithubAuthPage />} />
          <Route path="/auth/gmail" element={<GmailAuthPage />} />
          <Route path="/auth/linuxdo" element={<LinuxdoAuthPage />} />
          
          {/* 错误页面 */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/500" element={<InternalErrorPage />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/" element={<AuthGuard><MainLayout /></AuthGuard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          <Route path="system/user" element={<UserManagementPage />} />
          <Route path="system/role" element={<RoleManagementPage />} />
          <Route path="system/menu" element={<MenuManagementPage />} />
          <Route path="system/dept" element={<DeptManagementPage />} />
          <Route path="system/data-scope" element={<DataScopePage />} />
          <Route path="system/data-rule" element={<DataRulePage />} />
          <Route path="system/plugin" element={<PluginManagementPage />} />
          
          <Route path="log/login" element={<LoginLogPage />} />
          <Route path="log/opera" element={<OperationLogPage />} />
          
          <Route path="monitor/online" element={<OnlineUsersPage />} />
          <Route path="monitor/server" element={<ServerMonitorPage />} />
          <Route path="monitor/redis" element={<RedisMonitorPage />} />
          
          <Route path="scheduler/manage" element={<SchedulerPage />} />
          <Route path="scheduler/record" element={<TaskRecordPage />} />

          <Route path="plugins/config" element={<ConfigPage />} />
          <Route path="plugins/dict" element={<DictPage />} />
          <Route path="plugins/notice" element={<NoticePage />} />
          <Route path="plugins/code-generator" element={<CodeGeneratorPage />} />
          
          <Route path="approval/flow-manage" element={<FlowManagementPage />} />
          <Route path="approval/flow-design" element={<FlowDesignPage />} />
          <Route path="approval/flow-design/:flowId" element={<FlowDesignPage />} />
          <Route path="approval/flow-detail/:flowId" element={<FlowDetailPage />} />
          <Route path="approval/start" element={<StartApprovalPage />} />
          <Route path="approval/process/:stepId" element={<ProcessApprovalPage />} />
          <Route path="approval/todo" element={<TodoListPage />} />
          <Route path="approval/initiated" element={<InitiatedListPage />} />
          <Route path="approval/detail/:instanceId" element={<InstanceDetailPage />} />
          
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* 404 必须在最后 */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
        </BrowserRouter>
      </ConfirmDialogProvider>
    </AuthProvider>
  </StrictMode>,
)
