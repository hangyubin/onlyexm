import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { lazyRetry } from './utils/lazyRetry';

// 代码分割：懒加载所有页面组件（带自动重试，防止部署后 chunk 失效导致白屏）
const Login = lazy(() => lazyRetry(() => import('./pages/Login'), 'Login'));
const Dashboard = lazy(() => lazyRetry(() => import('./pages/Dashboard'), 'Dashboard'));
const QuestionManage = lazy(() => lazyRetry(() => import('./pages/QuestionManage/QuestionManage'), 'QuestionManage'));
const PaperManage = lazy(() => lazyRetry(() => import('./pages/PaperManage/PaperManage'), 'PaperManage'));
const ExamMonitor = lazy(() => lazyRetry(() => import('./pages/ExamMonitor'), 'ExamMonitor'));
const InfectionDashboard = lazy(() => lazyRetry(() => import('./pages/InfectionDashboard'), 'InfectionDashboard'));
const UserManage = lazy(() => lazyRetry(() => import('./pages/UserManage'), 'UserManage'));
const Reports = lazy(() => lazyRetry(() => import('./pages/Reports'), 'Reports'));
const SystemConfig = lazy(() => lazyRetry(() => import('./pages/SystemConfig'), 'SystemConfig'));
const LearningMaterialManage = lazy(() => lazyRetry(() => import('./pages/LearningMaterialManage/LearningMaterialManage'), 'LearningMaterialManage'));

function PageLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary, #3b82f6)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

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
      element: <LazyPage><Login /></LazyPage>,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <LazyPage><Dashboard /></LazyPage>,
        },
        {
          path: 'question-manage',
          element: <LazyPage><QuestionManage /></LazyPage>,
        },
        {
          path: 'paper-manage',
          element: <LazyPage><PaperManage /></LazyPage>,
        },
        {
          path: 'exam-monitor',
          element: <LazyPage><ExamMonitor /></LazyPage>,
        },
        {
          path: 'infection-dashboard',
          element: <LazyPage><InfectionDashboard /></LazyPage>,
        },
        {
          path: 'user-manage',
          element: <LazyPage><UserManage /></LazyPage>,
        },
        {
          path: 'reports',
          element: <LazyPage><Reports /></LazyPage>,
        },
        {
          path: 'system-config',
          element: <LazyPage><SystemConfig /></LazyPage>,
        },
        {
          path: 'learning-material',
          element: <LazyPage><LearningMaterialManage /></LazyPage>,
        },
        {
          path: '*',
          element: <Navigate to="/dashboard" replace />,
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
