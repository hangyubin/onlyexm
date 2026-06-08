import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  BookMarked,
  TrendingUp,
  FileQuestion,
  Flame
} from 'lucide-react';
import { homeApi, InfectionStatus, Task, WeakPoint } from '../api/home';
import { RadarChart } from '../components/RadarChart';
import { TaskCard } from '../components/TaskCard';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [infectionStatus, setInfectionStatus] = useState<InfectionStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [dailyDone, setDailyDone] = useState(false);
  const [pendingExamCount, setPendingExamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    checkDailyPractice();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [status, tasksRes, wrongRes, weakRes] = await Promise.all([
        homeApi.getInfectionStatus(),
        homeApi.getTasks(),
        homeApi.getWrongCount(),
        homeApi.getWeakPoints(),
      ]);
      setInfectionStatus(status);
      setTasks(tasksRes);
      const pendingExams = tasksRes.filter((t: Task) => t.type === 'exam' && t.status === 'pending');
      setPendingExamCount(pendingExams.length);
      setWrongCount(wrongRes.count);
      setWeakPoints(weakRes);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyPractice = () => {
    const today = new Date().toDateString();
    const lastPractice = localStorage.getItem('lastDailyPractice');
    setDailyDone(lastPractice === today);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const handleStartTask = async (task: Task) => {
    if (task.type === 'training' && task.status === 'pending') {
      try {
        await homeApi.completeTask(task.id);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id && t.type === 'training' ? { ...t, status: 'completed' } : t)),
        );
      } catch (err) {
        console.error('标记学习任务完成失败', err);
      }
    }
    navigate(task.type === 'exam' ? `/exam/${task.id}` : `/learning/${task.id}`);
  };

  const quickAccessItems = [
    { 
      icon: <FileText className="w-6 h-6" />, 
      label: '开始考试', 
      badge: pendingExamCount > 0 ? pendingExamCount : null,
      color: 'blue',
      path: '/exams'
    },
    { 
      icon: <CalendarCheck className="w-6 h-6" />, 
      label: '每日一练', 
      badge: dailyDone ? '已完成' : null,
      color: 'green',
      path: '/daily-practice',
      done: dailyDone
    },
    { 
      icon: <FileQuestion className="w-6 h-6" />, 
      label: '错题本', 
      badge: wrongCount > 0 ? wrongCount : null,
      color: 'orange',
      path: '/wrong-questions'
    },
    { 
      icon: <BookMarked className="w-6 h-6" />, 
      label: '学习资料', 
      badge: null,
      color: 'purple',
      path: '/learning'
    }
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {infectionStatus?.isLocked && (
        <div className="bg-red-500 text-white py-2 px-4 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>您尚未完成本月院感任务，请先完成练习</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6">
        <h1 className="text-xl font-bold">
            {getGreeting()}，{JSON.parse(localStorage.getItem('user') || '{}').realName || '用户'}
          </h1>
        <p className="text-blue-100 text-sm mt-1">欢迎回来，今天也要认真学习院感知识哦</p>
      </div>

      {infectionStatus && (
        <div className="mx-4 -mt-4 bg-white rounded-xl shadow-lg p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">本月院感任务完成情况</p>
              <p className="text-2xl font-bold text-gray-800">
                {infectionStatus.completedCount}
                <span className="text-gray-400 text-lg">/{infectionStatus.totalCount}题</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs mb-1">正确率</p>
              <p className="text-xl font-bold text-gray-800">
                {infectionStatus.correctRate}%
              </p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-xs mb-1">是否达标</p>
              {infectionStatus.isCompliant ? (
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-sm font-medium">达标</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500">
                  <XCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">未达标</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickAccessItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
            >
              <div className={`w-12 h-12 ${colorMap[item.color as keyof typeof colorMap].light} rounded-xl flex items-center justify-center ${colorMap[item.color as keyof typeof colorMap].text}`}>
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {item.badge && (
                <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full ${typeof item.badge === 'number' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          今日任务
        </h2>
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleStartTask}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无待办任务</p>
          </div>
        )}
      </div>

      {weakPoints.length > 0 && (
        <div className="px-4 mt-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            院感薄弱提醒
          </h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <RadarChart data={weakPoints} />
            <p className="text-xs text-gray-400 text-center mt-2">点击可查看详细分析</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;