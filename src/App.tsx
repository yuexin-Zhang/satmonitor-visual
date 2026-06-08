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

function MonitorGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('monitor_token');
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
      </Route>
    </Routes>
  );
}
