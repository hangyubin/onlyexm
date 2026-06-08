import { NavLink, Outlet } from 'react-router-dom';
import { Home, FileText, BookOpen, User } from 'lucide-react';

export function TabLayout() {

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">首页</span>
          </NavLink>
          <NavLink
            to="/exams"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm">考试</span>
          </NavLink>
          <NavLink
            to="/learning"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-sm">学习</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <User className="w-6 h-6" />
            <span className="text-sm">我的</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
