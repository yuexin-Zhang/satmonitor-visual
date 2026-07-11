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
  Satellite,
  Cpu,
  BellRing,
  Menu as MenuIcon,
  Building2,
  BookMarked,
  Radio,
  Database,
  Bot,
  Camera,
  Snowflake,
  ShieldAlert,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { authApi } from '@/src/http/api';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '概览',
    items: [{ path: '/admin/home', label: '首页', icon: Home }],
  },
  {
    title: '业务管理',
    items: [
      { path: '/admin/stations', label: '台站管理', icon: Satellite },
      { path: '/admin/devices', label: '设备管理', icon: Cpu },
      { path: '/admin/antenna-config', label: '天线参数管理', icon: Radio },
      { path: '/admin/alarms', label: '告警管理', icon: ShieldAlert },
    ],
  },
  {
    title: '策略配置',
    items: [
      { path: '/admin/strategy', label: '阈值/策略配置', icon: Settings },
      { path: '/admin/storage-config', label: '存储配置', icon: Database },
      { path: '/admin/ai-config', label: 'AI配置', icon: Bot },
    ],
  },
  {
    title: '设备运维',
    items: [
      { path: '/admin/ota', label: 'OTA升级管理', icon: Package },
      { path: '/admin/cameras', label: '摄像头管理', icon: Camera },
      { path: '/admin/snow-exec-logs', label: '融雪执行日志', icon: Snowflake },
      { path: '/admin/sun-interference', label: '日凌管理', icon: Sun },
    ],
  },
  {
    title: '系统管理',
    items: [
      { path: '/admin/users', label: '用户管理', icon: Users },
      { path: '/admin/roles', label: '角色管理', icon: SlidersHorizontal },
      { path: '/admin/menus', label: '菜单管理', icon: MenuIcon },
      { path: '/admin/dept', label: '部门管理', icon: Building2 },
      { path: '/admin/dicts', label: '字典管理', icon: BookMarked },
    ],
  },
  {
    title: '运维工具',
    items: [
      { path: '/admin/logs', label: '日志管理', icon: FileText },
      { path: '/admin/notices', label: '通知公告', icon: BellRing },
      { path: '/admin/system-config', label: '系统配置', icon: Radio },
      { path: '/admin/profile', label: '个人中心', icon: UserCircle },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('管理员');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
        setUsername(user.nickname || user.username || '管理员');
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 即使退出接口失败也清除本地信息
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const gotoDashboard = () => {
    navigate('/');
  };

  const activePath = location.pathname;

  const toggleGroup = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // 当前页标题
  const allItems = menuGroups.flatMap((g) => g.items);
  const currentTitle = allItems.find((m) => activePath === m.path)?.label || '';

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="w-2 h-2 bg-sky-500 rounded-full mr-2 animate-pulse" />
          <span className="font-bold text-[clamp(18px,1.3vw,26px)] tracking-wide">管理后台</span>
        </div>

        {/* 分组菜单 */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {menuGroups.map((group) => {
            const isCollapsed = collapsed[group.title];
            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-600 uppercase tracking-wider hover:text-slate-400"
                >
                  <span>{group.title}</span>
                  <span className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>›</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePath === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[clamp(14px,1.05vw,20px)] transition-colors text-left ${
                            isActive
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部操作 */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0">
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
          <div className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{currentTitle}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/profile')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center">
                <span className="text-[clamp(14px,1.05vw,20px)] text-sky-400 font-medium">
                  {username[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{username}</span>
            </button>
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
