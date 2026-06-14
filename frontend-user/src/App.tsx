import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import { DailyPractice } from './pages/DailyPractice';
import { WrongQuestionBook } from './pages/WrongQuestionBook';
import { ExamTaking } from './pages/ExamTaking';
import ExamList from './pages/ExamList';
import ExamResult from './pages/ExamResult';
import { OutbreakSimulation } from './pages/OutbreakSimulation';
import MyProfile from './pages/MyProfile';
import LearningMaterials from './pages/LearningMaterials';
import LearningMaterialDetail from './pages/LearningMaterialDetail';
import { TabLayout } from './components/TabLayout';
import { useInfectionStatus } from './hooks/useInfectionStatus';
import { useOnlineSync } from './hooks/useOnlineSync';
import { InfectionWarning } from './components/InfectionWarning';
import { offlineDB } from './utils/offlineDB';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LayoutWrapper() {
  const { status, checkUnlock } = useInfectionStatus();
  const { isOnline } = useOnlineSync();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (status) {
      setShowWarning(true);
    }
  }, [status]);

  useEffect(() => {
    const initDB = async () => {
      await offlineDB.openDB();
    };
    initDB();
  }, []);

  useEffect(() => {
    const syncQuestions = async () => {
      if (!isOnline) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // 在线同步逻辑：后续可在此处实现与服务器的数据同步
      } catch (error) {
        console.error('Failed to sync questions:', error);
      }
    };

    if (isOnline) {
      syncQuestions();
    }
  }, [isOnline]);

  const handleCheckUnlock = async () => {
    const result = await checkUnlock();
    if (result.success) {
      // 使用 DOM 方式显示解锁成功提示，避免引入额外依赖
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#52c41a;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;';
      el.textContent = '解锁成功！';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
    return result;
  };

  return (
    <>
      {showWarning && status && (
        <InfectionWarning status={status} onCheckUnlock={handleCheckUnlock} />
      )}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
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
            { path: '/', element: <Home /> },
            { path: '/exams', element: <ExamList /> },
            { path: '/learning', element: <LearningMaterials /> },
            { path: '/learning/:id', element: <LearningMaterialDetail /> },
            { path: '/wrong-questions', element: <WrongQuestionBook /> },
            { path: '/profile', element: <MyProfile /> },
          ],
        },
        // 不带 TabBar 的页面
        { path: '/daily-practice', element: <DailyPractice /> },
        { path: '/exam/:id', element: <ExamTaking /> },
        { path: '/exam/result/:id', element: <ExamResult /> },
        { path: '/outbreak', element: <OutbreakSimulation /> },
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
  // 初始化字体缩放
  useEffect(() => {
    const savedScale = localStorage.getItem('fontScale');
    if (savedScale) {
      document.documentElement.style.setProperty('--font-scale', savedScale);
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
