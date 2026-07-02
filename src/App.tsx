import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import AdminLayout from './pages/Admin/Layout';
import AdminLogin from './pages/Admin/Login';
import MonitorLogin from './pages/Monitor/Login';
import AdminHome from './pages/Admin/Home';
import UserManage from './pages/Admin/UserManage';
import StrategyConfig from './pages/Admin/StrategyConfig';
import SunInterferenceManage from './pages/Admin/SunInterferenceManage';
import LogManage from './pages/Admin/LogManage';
import OTAManage from './pages/Admin/OTAManage';
import Stations from './pages/Admin/Stations';
import Devices from './pages/Admin/Devices';
import Alarms from './pages/Admin/Alarms';
import Roles from './pages/Admin/Roles';
import Menus from './pages/Admin/Menus';
import DeptManage from './pages/Admin/DeptManage';
import Dicts from './pages/Admin/Dicts';
import Notices from './pages/Admin/Notices';
import SystemConfig from './pages/Admin/SystemConfig';
import StorageConfig from './pages/Admin/StorageConfig';
import AIConfig from './pages/Admin/AIConfig';
import Cameras from './pages/Admin/Cameras';
import SnowExecLogs from './pages/Admin/SnowExecLogs';
import Profile from './pages/Admin/Profile';

function MonitorGuard({ children }: { children: React.ReactNode }) {
  // 与请求拦截器（client.ts）保持一致：dashboard 页面允许 monitor_token 或 admin_token
  const token =
    localStorage.getItem('monitor_token') || localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* 监管端登录 */}
      <Route path="/login" element={<MonitorLogin />} />

      {/* 驾驶舱大屏 — 需要监管端登录 */}
      <Route
        path="/"
        element={
          <MonitorGuard>
            <DashboardPage />
          </MonitorGuard>
        }
      />

      {/* 管理后台 */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/home" replace />} />
        <Route path="home" element={<AdminHome />} />
        <Route path="users" element={<UserManage />} />
        <Route path="strategy" element={<StrategyConfig />} />
        <Route path="sun-interference" element={<SunInterferenceManage />} />
        <Route path="logs" element={<LogManage />} />
        <Route path="ota" element={<OTAManage />} />
        <Route path="stations" element={<Stations />} />
        <Route path="devices" element={<Devices />} />
        <Route path="alarms" element={<Alarms />} />
        <Route path="roles" element={<Roles />} />
        <Route path="menus" element={<Menus />} />
        <Route path="dept" element={<DeptManage />} />
        <Route path="dicts" element={<Dicts />} />
        <Route path="notices" element={<Notices />} />
        <Route path="system-config" element={<SystemConfig />} />
        <Route path="storage-config" element={<StorageConfig />} />
        <Route path="ai-config" element={<AIConfig />} />
        <Route path="cameras" element={<Cameras />} />
        <Route path="snow-exec-logs" element={<SnowExecLogs />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
