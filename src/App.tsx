/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import AdminLayout from './pages/Admin/Layout';
import AdminLogin from './pages/Admin/Login';
import DataConfig from './pages/Admin/DataConfig';
import UserManage from './pages/Admin/UserManage';
import OperationLogs from './pages/Admin/OperationLogs';

export default function App() {
  return (
    <Routes>
      {/* 驾驶舱大屏 */}
      <Route path="/" element={<DashboardPage />} />

      {/* 管理后台 */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/config" replace />} />
        <Route path="config" element={<DataConfig />} />
        <Route path="users" element={<UserManage />} />
        <Route path="logs" element={<OperationLogs />} />
      </Route>
    </Routes>
  );
}
