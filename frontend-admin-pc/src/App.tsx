import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionManage from './pages/QuestionManage/QuestionManage';
import PaperManage from './pages/PaperManage/PaperManage';
import ExamMonitor from './pages/ExamMonitor';
import InfectionDashboard from './pages/InfectionDashboard';
import UserManage from './pages/UserManage';
import Reports from './pages/Reports';
import SystemConfig from './pages/SystemConfig';
import LearningMaterialManage from './pages/LearningMaterialManage/LearningMaterialManage';

// 可进入管理后台的角色
const ADMIN_ROLES = [
  'ADMIN',           // 系统管理员
  'INFECTION_OFFICER', // 院感专员
  'MEDICAL_AFFAIRS',   // 医务科
  'VICE_DEAN',         // 业务院长
  'DEPT_HEAD',         // 科室主任
];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // 未登录
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 非管理员角色，重定向到用户端
  if (!userRole || !ADMIN_ROLES.includes(userRole)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = `${window.location.origin}/user`;
    return null;
  }

  return children;
}

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          path: 'question-manage',
          element: <QuestionManage />,
        },
        {
          path: 'paper-manage',
          element: <PaperManage />,
        },
        {
          path: 'exam-monitor',
          element: <ExamMonitor />,
        },
        {
          path: 'infection-dashboard',
          element: <InfectionDashboard />,
        },
        {
          path: 'user-manage',
          element: <UserManage />,
        },
        {
          path: 'reports',
          element: <Reports />,
        },
        {
          path: 'system-config',
          element: <SystemConfig />,
        },
        {
          path: 'learning-material',
          element: <LearningMaterialManage />,
        },
      ],
    },
  ],
  {
    basename: '/admin',
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
