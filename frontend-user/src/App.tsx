import { useEffect, useState, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { TabLayout } from './components/TabLayout';
import { useInfectionStatus } from './hooks/useInfectionStatus';
import { useOnlineSync } from './hooks/useOnlineSync';
import { InfectionWarning } from './components/InfectionWarning';
import { offlineDB } from './utils/offlineDB';

// 代码分割：懒加载所有页面组件
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const DailyPractice = lazy(() => import('./pages/DailyPractice').then(m => ({ default: m.DailyPractice })));
const WrongQuestionBook = lazy(() => import('./pages/WrongQuestionBook').then(m => ({ default: m.WrongQuestionBook })));
const ExamTaking = lazy(() => import('./pages/ExamTaking').then(m => ({ default: m.ExamTaking })));
const ExamList = lazy(() => import('./pages/ExamList'));
const ExamResult = lazy(() => import('./pages/ExamResult'));
const OutbreakSimulation = lazy(() => import('./pages/OutbreakSimulation').then(m => ({ default: m.OutbreakSimulation })));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const LearningMaterials = lazy(() => import('./pages/LearningMaterials'));
const LearningMaterialDetail = lazy(() => import('./pages/LearningMaterialDetail'));

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
    },
    {
      element: (
        <ProtectedRoute>
          <LayoutWrapper />
        </ProtectedRoute>
      ),
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
