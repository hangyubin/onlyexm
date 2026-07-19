import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, FileText, BookOpen, User, type LucideIcon } from 'lucide-react';

const tabs: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/exams', icon: FileText, label: '考试' },
  { to: '/learning', icon: BookOpen, label: '学习' },
  { to: '/profile', icon: User, label: '我的' },
];

export function TabLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
      <Outlet />
      {/* 底部导航栏 */}
      <nav
        className="fixed bottom-0 w-full max-w-md xl:max-w-lg 2xl:max-w-xl fixed-center bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-14">
          {tabs.map(({ to, icon: Icon, label }) => {
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive: linkActive }) => {
                  const active = linkActive || (to !== '/' && location.pathname.startsWith(to));
                  return `relative flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-[64px] transition-all duration-200 ${
                    active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-500'
                  }`;
                }}
              >
                {({ isActive: linkActive }) => {
                  const active = linkActive || (to !== '/' && location.pathname.startsWith(to));
                  return (
                    <>
                      {/* 活跃指示器（顶部小条） */}
                      {active && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                      )}
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          active ? 'scale-110' : 'scale-100'
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span className={`text-[10px] font-medium transition-all duration-200 ${
                        active ? 'opacity-100' : 'opacity-70'
                      }`}>
                        {label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}