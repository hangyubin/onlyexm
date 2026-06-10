import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { User, BookOpen, Clock, AlertCircle, Award, TrendingUp, CheckCircle, XCircle, LogOut, Settings, Type, Lock } from 'lucide-react';
import api from '../api/axios';
import { ProgressBar } from '../components/ProgressBar';
import { useDicts, DICT_CATEGORY } from '../hooks/useDict';

const FONT_SCALES = [
  { label: '小', value: '0.85' },
  { label: '标准', value: '1' },
  { label: '大', value: '1.15' },
  { label: '特大', value: '1.3' },
];

interface UserInfo {
  realName: string;
  department: string;
  role: string;
  hospitalName: string;
}

interface InfectionStatus {
  isQualified: boolean;
  completedCount: number;
  requiredCount: number;
  accuracyRate: number;
  remainingCount: number;
}

interface StudyStats {
  totalStudyHours: number;
  totalPracticeCount: number;
  monthlyInfectionProgress: {
    completed: number;
    total: number;
  };
}

interface PendingTasks {
  pendingExams: Array<{
    id: number;
    paperName: string;
    startTime: string;
  }>;
  pendingCourses: any[];
}

interface RadarDataItem {
  tag: string;
  label: string;
  value: number;
}

interface ExamTrendItem {
  id: number;
  paperName: string;
  score: number;
  date: string;
  isPassed: boolean;
}

interface HeatmapDataItem {
  category: string;
  label: string;
  wrongCount: number;
  accuracy: number;
  intensity: number;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { getName } = useDicts([DICT_CATEGORY.ROLE]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    realName: '',
    department: '',
    role: '',
    hospitalName: '',
  });
  const [infectionStatus, setInfectionStatus] = useState<InfectionStatus>({
    isQualified: false,
    completedCount: 0,
    requiredCount: 20,
    accuracyRate: 0,
    remainingCount: 20,
  });
  const [studyStats, setStudyStats] = useState<StudyStats>({
    totalStudyHours: 0,
    totalPracticeCount: 0,
    monthlyInfectionProgress: { completed: 0, total: 20 },
  });
  const [pendingTasks, setPendingTasks] = useState<PendingTasks>({
    pendingExams: [],
    pendingCourses: [],
  });
  const [radarData, setRadarData] = useState<RadarDataItem[]>([]);
  const [examTrend, setExamTrend] = useState<ExamTrendItem[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFontScale, setCurrentFontScale] = useState(() => localStorage.getItem('fontScale') || '1');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, radarRes, trendRes, heatmapRes] = await Promise.all([
        api.get('/user/profile/stats'),
        api.get('/user/profile/radar-data'),
        api.get('/user/profile/exam-trend'),
        api.get('/user/profile/wrong-heatmap'),
      ]);

      // axios拦截器已提取code===0响应中的data，直接读取数据
      const statsData = statsRes.data;
      if (statsData.user) {
        setUserInfo(statsData.user);
        setInfectionStatus(statsData.infectionStatus);
        setStudyStats(statsData.studyStats);
        setPendingTasks(statsData.pendingTasks);
      }

      if (radarRes.data?.radar || radarRes.data?.dimensions) {
        setRadarData(radarRes.data);
      }

      if (Array.isArray(trendRes.data)) {
        setExamTrend(trendRes.data);
      } else if (trendRes.data?.trend) {
        setExamTrend(trendRes.data.trend);
      }

      if (heatmapRes.data?.categories || heatmapRes.data?.heatmap) {
        setHeatmapData(heatmapRes.data);
      }
    } catch (error) {
      console.error('Fetch profile data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const radarOption = {
    radar: {
      indicator: radarData.map(item => ({ name: item.label, max: 100 })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#333',
        fontSize: 12,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)'],
        },
      },
      axisLine: {
        lineStyle: { color: '#e5e7eb' },
      },
      splitLine: {
        lineStyle: { color: '#e5e7eb' },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarData.map(item => item.value),
            name: '院感能力',
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#3b82f6', width: 2 },
            areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
            itemStyle: { color: '#3b82f6' },
          },
        ],
      },
    ],
  };

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      textStyle: { color: '#374151' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: examTrend.map(item => item.date),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        name: '成绩',
        type: 'line',
        smooth: true,
        data: examTrend.map(item => item.score),
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
        symbol: 'circle',
        symbolSize: 8,
      },
      {
        name: '及格线',
        type: 'line',
        data: examTrend.map(() => 60),
        lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
        symbol: 'none',
      },
    ],
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity >= 0.7) return 'bg-red-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    if (intensity > 0) return 'bg-orange-400';
    return 'bg-gray-300';
  };

  const handleFontScaleChange = (value: string) => {
    setCurrentFontScale(value);
    localStorage.setItem('fontScale', value);
    document.documentElement.style.setProperty('--font-scale', value);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      alert('请填写完整');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      alert('密码修改成功');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
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
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-8 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{userInfo.realName}</h1>
            <p className="text-blue-100 text-sm">{userInfo.department} · {getName(DICT_CATEGORY.ROLE, userInfo.role)}</p>
            <p className="text-blue-200 text-xs mt-1">{userInfo.hospitalName}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-blue-100 text-sm">院感达标状态</span>
            <div className="flex items-center gap-2">
              {infectionStatus.isQualified ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">已达标</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">未达标</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-200">
            {infectionStatus.isQualified 
              ? `正确率 ${infectionStatus.accuracyRate}%，已完成 ${infectionStatus.completedCount} 题`
              : `还需完成 ${infectionStatus.remainingCount} 道院感题目，当前正确率 ${infectionStatus.accuracyRate}%`}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            院感能力雷达图
          </h2>
          {radarData.length > 0 ? (
            <div className="h-64">
              <ReactECharts option={radarOption} style={{ height: '100%' }} notMerge={true} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              加载中...
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            考试成绩趋势
          </h2>
          {examTrend.length > 0 ? (
            <div className="h-48">
              <ReactECharts option={trendOption} style={{ height: '100%' }} />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              暂无考试记录
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" />
            错题热力图
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {heatmapData.map((item) => (
              <div 
                key={item.category}
                className="relative p-3 rounded-xl text-center"
                style={{ backgroundColor: `rgba(239, 68, 68, ${item.intensity * 0.2})` }}
              >
                <div className={`w-8 h-8 mx-auto rounded-full ${getHeatmapColor(item.intensity)} flex items-center justify-center text-white text-sm font-bold`}>
                  {item.wrongCount}
                </div>
                <p className="text-sm text-gray-700 mt-2">{item.label}</p>
                <p className="text-xs text-gray-500">正确率 {item.accuracy}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            学习统计
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-blue-600 text-2xl font-bold">{studyStats.totalStudyHours}</p>
              <p className="text-blue-600/70 text-sm">总学习时长(小时)</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-green-600 text-2xl font-bold">{studyStats.totalPracticeCount}</p>
              <p className="text-green-600/70 text-sm">总练习题目数</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>本月院感练习完成度</span>
              <span>{studyStats.monthlyInfectionProgress.completed}/{studyStats.monthlyInfectionProgress.total}</span>
            </div>
            <ProgressBar 
              progress={studyStats.monthlyInfectionProgress.completed}
              total={studyStats.monthlyInfectionProgress.total}
              color="bg-blue-500"
            />
          </div>
        </div>

        {(pendingTasks.pendingExams.length > 0 || pendingTasks.pendingCourses.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              待办事项
            </h2>
            
            {pendingTasks.pendingExams.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">未完成的考试</h3>
                <div className="space-y-2">
                  {pendingTasks.pendingExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                      <span className="text-sm text-gray-700">{exam.paperName}</span>
                      <span className="text-xs text-gray-500">进行中</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingTasks.pendingCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">未学习的课程</h3>
                <div className="space-y-2">
                  {pendingTasks.pendingCourses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-gray-700">{course.name}</span>
                      <span className="text-xs text-gray-500">待学习</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 设置区域 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            设置
          </h2>

          {/* 字体大小 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">字体大小</span>
            </div>
            <div className="flex gap-2">
              {FONT_SCALES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleFontScaleChange(item.value)}
                  className={`font-scale-btn flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentFontScale === item.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 修改密码 */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Lock className="w-4 h-4" />
            修改密码
          </button>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">修改密码</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="旧密码"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="password"
                placeholder="新密码（至少6位）"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="password"
                placeholder="确认新密码"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {passwordLoading ? '提交中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退出登录按钮 */}
      <div className="px-4 mt-6 mb-8">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            navigate('/login');
          }}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </div>
  );
}