import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  Shield,
  LogOut,
  Monitor,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

interface SubMenuItem {
  label: string;
  anchor?: string;
  path?: string;
}

interface MenuGroup {
  title: string;
  icon: React.ElementType;
  items: SubMenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '数据配置',
    icon: Settings,
    items: [
      { label: '站点信息', anchor: 'site-info' },
      { label: '天线信息', anchor: 'antenna' },
      { label: '日凌信息', anchor: 'sun-interference' },
      { label: '实时监控', anchor: 'live-video' },
      { label: '运检提示', anchor: 'maintenance-tips' },
      { label: '气象融雪', anchor: 'environment' },
      { label: '电源信息', anchor: 'power' },
      { label: '运维记录', anchor: 'operations' },
    ],
  },
  {
    title: '系统管理',
    icon: Shield,
    items: [
      { label: '用户管理', path: '/admin/users' },
      { label: '操作日志', path: '/admin/logs' },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [activeAnchor, setActiveAnchor] = useState<string>('site-info');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '数据配置': true,
    '系统管理': true,
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ignoreObserverUntil = useRef<number>(0);

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

  // IntersectionObserver 监听锚点区域
  useEffect(() => {
    if (location.pathname !== '/admin/config') {
      setActiveAnchor('site-info');
      observerRef.current?.disconnect();
      return;
    }

    const timer = setTimeout(() => {
      const main = document.querySelector('main');
      const sections = menuGroups[0].items
        .map((item) => item.anchor)
        .filter(Boolean) as string[];

      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          // 手动滚动期间忽略 observer 更新
          if (Date.now() < ignoreObserverUntil.current) return;
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length > 0) {
            setActiveAnchor(visible[0].target.id);
          }
        },
        {
          root: main,
          rootMargin: '-70px 0px -55% 0px',
          threshold: [0, 0.25, 0.5, 1],
        }
      );

      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observerRef.current?.observe(el);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const gotoDashboard = () => {
    navigate('/');
  };

  const scrollToAnchor = useCallback(
    (anchor: string) => {
      setActiveAnchor(anchor);
      // 暂停 observer 900ms，防止滚动过程中覆盖高亮
      ignoreObserverUntil.current = Date.now() + 900;

      const doScroll = () => {
        const main = document.querySelector('main');
        const section = document.getElementById(anchor);
        if (main && section) {
          // 用 getBoundingClientRect 算 section 相对于 main 的精确位置
          const mainRect = main.getBoundingClientRect();
          const sectionRect = section.getBoundingClientRect();
          const stickyHeaderHeight = 64; // sticky header 约 64px
          const gap = 12; // 再留 12px 间距
          const scrollTop = main.scrollTop + sectionRect.top - mainRect.top - stickyHeaderHeight - gap;
          main.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
        } else if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      if (location.pathname !== '/admin/config') {
        navigate('/admin/config');
        requestAnimationFrame(() => {
          setTimeout(doScroll, 200);
        });
      } else {
        doScroll();
      }
    },
    [location.pathname, navigate]
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // 获取当前 breadcrumb
  const getBreadcrumb = () => {
    if (location.pathname === '/admin/config') {
      const activeItem = menuGroups[0].items.find((item) => item.anchor === activeAnchor);
      return activeItem ? `数据配置 > ${activeItem.label}` : '数据配置';
    }
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.path && location.pathname === item.path) {
          return `${group.title} > ${item.label}`;
        }
      }
    }
    return '';
  };

  const isConfigPage = location.pathname === '/admin/config';

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
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups[group.title];
            const isGroupActive =
              (group.title === '数据配置' && isConfigPage) ||
              (group.title === '系统管理' &&
                (location.pathname === '/admin/users' || location.pathname === '/admin/logs'));
            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => {
                    if (group.title === '数据配置') {
                      navigate('/admin/config');
                    } else {
                      toggleGroup(group.title);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[clamp(14px,1.05vw,20px)] transition-colors ${
                    isGroupActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <GroupIcon className="w-4 h-4" />
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-3 h-3 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        (item.anchor && isConfigPage && activeAnchor === item.anchor) ||
                        (item.path && location.pathname === item.path);
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.anchor) {
                              scrollToAnchor(item.anchor);
                            } else if (item.path) {
                              navigate(item.path);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[clamp(14px,1.05vw,20px)] transition-colors text-left ${
                            isActive
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
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
            当前位置：{getBreadcrumb()}
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
