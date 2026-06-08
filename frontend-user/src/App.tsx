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
      alert('解锁成功！');
    } else {
      alert(result.message);
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
            { path: '/profile', element: <MyProfile /> },
          ],
        },
        // 不带 TabBar 的页面
        { path: '/daily-practice', element: <DailyPractice /> },
        { path: '/wrong-questions', element: <WrongQuestionBook /> },
        { path: '/exam/:id', element: <ExamTaking /> },
        { path: '/exam/result/:id', element: <ExamResult /> },
        { path: '/learning/:id', element: <LearningMaterialDetail /> },
        { path: '/outbreak', element: <OutbreakSimulation /> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ],
  {
    basename: '/user',
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
