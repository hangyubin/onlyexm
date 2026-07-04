import { NavLink, Outlet } from 'react-router-dom';
import { Home, FileText, BookOpen, User, type LucideIcon } from 'lucide-react';

const tabs: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/exams', icon: FileText, label: '考试' },
  { to: '/learning', icon: BookOpen, label: '学习' },
  { to: '/profile', icon: User, label: '我的' },
];

export function TabLayout() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md xl:max-w-lg 2xl:max-w-xl mx-auto">
      <Outlet />
      <nav
        className="fixed bottom-0 w-full max-w-md xl:max-w-lg 2xl:max-w-xl fixed-center bg-white border-t border-gray-100 shadow-lg z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around py-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
