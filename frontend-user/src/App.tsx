import { useEffect, useState, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { TabLayout } from './components/TabLayout';
import { useInfectionStatus } from './hooks/useInfectionStatus';
import { useOnlineSync } from './hooks/useOnlineSync';
import { InfectionWarning } from './components/InfectionWarning';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { lazyRetry } from './utils/lazyRetry';
import { offlineDB } from './utils/offlineDB';

// 代码分割：懒加载所有页面组件（带自动重试，防止部署后 chunk 失效导致白屏）
const Home = lazy(() => lazyRetry(() => import('./pages/Home'), 'Home'));
const Login = lazy(() => lazyRetry(() => import('./pages/Login'), 'Login'));
const DailyPractice = lazy(() => lazyRetry(() => import('./pages/DailyPractice').then(m => ({ default: m.DailyPractice })), 'DailyPractice'));
const WrongQuestionBook = lazy(() => lazyRetry(() => import('./pages/WrongQuestionBook').then(m => ({ default: m.WrongQuestionBook })), 'WrongQuestionBook'));
const ExamTaking = lazy(() => lazyRetry(() => import('./pages/ExamTaking').then(m => ({ default: m.ExamTaking })), 'ExamTaking'));
const ExamList = lazy(() => lazyRetry(() => import('./pages/ExamList'), 'ExamList'));
const ExamResult = lazy(() => lazyRetry(() => import('./pages/ExamResult'), 'ExamResult'));
const OutbreakSimulation = lazy(() => lazyRetry(() => import('./pages/OutbreakSimulation').then(m => ({ default: m.OutbreakSimulation })), 'OutbreakSimulation'));
const MyProfile = lazy(() => lazyRetry(() => import('./pages/MyProfile'), 'MyProfile'));
const LearningMaterials = lazy(() => lazyRetry(() => import('./pages/LearningMaterials'), 'LearningMaterials'));
const LearningMaterialDetail = lazy(() => lazyRetry(() => import('./pages/LearningMaterialDetail'), 'LearningMaterialDetail'));

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LayoutWrapper() {
  const { status } = useInfectionStatus();
  useOnlineSync();
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    if (status) {
      setShowWarning(true);
      // 5 秒后自动隐藏
      const timer = setTimeout(() => setShowWarning(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowWarning(false);
    }
  }, [status]);

  useEffect(() => {
    const initDB = async () => {
      await offlineDB.openDB();
    };
    initDB();
  }, []);

  return (
    <>
      {showWarning && status && (
        <InfectionWarning status={status} />
      )}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LazyPage><Login /></LazyPage>,
      errorElement: <RouteErrorBoundary />,
    },
    {
      element: (
        <ProtectedRoute>
          <LayoutWrapper />
        </ProtectedRoute>
      ),
      errorElement: <RouteErrorBoundary />,
      children: [
        // 带 TabBar 的页面
        {
          element: <TabLayout />,
          children: [
            { path: '/', element: <LazyPage><Home /></LazyPage> },
            { path: '/exams', element: <LazyPage><ExamList /></LazyPage> },
            { path: '/learning', element: <LazyPage><LearningMaterials /></LazyPage> },
            { path: '/learning/:id', element: <LazyPage><LearningMaterialDetail /></LazyPage> },
            { path: '/wrong-questions', element: <LazyPage><WrongQuestionBook /></LazyPage> },
            { path: '/profile', element: <LazyPage><MyProfile /></LazyPage> },
          ],
        },
        // 不带 TabBar 的页面
        { path: '/daily-practice', element: <LazyPage><DailyPractice /></LazyPage> },
        { path: '/exam/:id', element: <LazyPage><ExamTaking /></LazyPage> },
        { path: '/exam/result/:id', element: <LazyPage><ExamResult /></LazyPage> },
        { path: '/outbreak', element: <LazyPage><OutbreakSimulation /></LazyPage> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  // 初始化字体缩放（从 localStorage 读取，通过 data 属性控制）
  useEffect(() => {
    const savedScale = localStorage.getItem('fontScale') || '1';
    document.documentElement.setAttribute('data-font-scale', savedScale);
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
