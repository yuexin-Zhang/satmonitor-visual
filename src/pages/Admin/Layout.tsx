import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Settings,
  Sun,
  FileText,
  Package,
  LogOut,
  Monitor,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const menuItems = [
  { path: '/admin/home', label: '首页', icon: Home },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/strategy', label: '策略配置', icon: Settings },
  { path: '/admin/sun-interference', label: '日凌管理', icon: Sun },
  { path: '/admin/logs', label: '日志管理', icon: FileText },
  { path: '/admin/ota', label: 'OTA模型管理', icon: Package },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || 'admin');
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const gotoDashboard = () => {
    navigate('/');
  };

  const activePath = location.pathname;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-2 h-2 bg-sky-500 rounded-full mr-2" />
          <span className="font-bold text-[clamp(18px,1.3vw,26px)] tracking-wide">管理后台</span>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[clamp(14px,1.05vw,20px)] transition-colors text-left ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 底部操作 */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={gotoDashboard}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[clamp(14px,1.05vw,20px)] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <Monitor className="w-4 h-4" />
            <span>返回大屏</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[clamp(14px,1.05vw,20px)] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-14 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="text-[clamp(14px,1.05vw,20px)] text-slate-500">
            {menuItems.find((m) => m.path === activePath)?.label || ''}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center">
              <span className="text-[clamp(14px,1.05vw,20px)] text-sky-400 font-medium">
                {username[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{username}</span>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto px-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
