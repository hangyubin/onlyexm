import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, AlertCircle, Calendar } from 'lucide-react';
import api from '../api/axios';

interface Paper {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  totalScore: number;
  passScore: number;
  questionCount: number;
  isActive: boolean;
  isPublished: boolean;
  examStartTime: string | null;
  examEndTime: string | null;
  userExamStatus: string | null;
  userExamRecordId: number | null;
  createdAt: string;
}

type ExamStatus = 'not_started' | 'in_progress' | 'ended' | 'late_entry' | 'completed' | 'resuming';

function getExamStatus(paper: Paper): ExamStatus {
  // 已交卷 → completed
  if (paper.userExamStatus && ['SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT'].includes(paper.userExamStatus)) {
    return 'completed';
  }
  // 考试进行中（重入）→ resuming
  if (paper.userExamStatus === 'IN_PROGRESS') {
    return 'resuming';
  }
  
  // 如果没有设置具体考试时间，使用创建时间+30天作为有效期
  if (!paper.examStartTime || !paper.examEndTime) {
    const createdAt = new Date(paper.createdAt);
    const deadline = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      return 'ended';
    }
    return 'in_progress';
  }
  
  const now = new Date();
  const start = new Date(paper.examStartTime);
  const end = new Date(paper.examEndTime);
  if (now < start) return 'not_started';
  if (now > end) return 'ended';
  // 开考30分钟后不允许进入
  const thirtyMinutesAfterStart = new Date(start.getTime() + 30 * 60 * 1000);
  if (now > thirtyMinutesAfterStart) return 'late_entry';
  return 'in_progress';
}

function CountdownTimer({ targetTime }: { targetTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  const updateCountdown = useCallback(() => {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('即将开始');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setTimeLeft(`${days}天${hours}时${minutes}分`);
    } else if (hours > 0) {
      setTimeLeft(`${hours}时${minutes}分${seconds}秒`);
    } else if (minutes > 0) {
      setTimeLeft(`${minutes}分${seconds}秒`);
    } else {
      setTimeLeft(`${seconds}秒`);
    }
  }, [targetTime]);

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [updateCountdown]);

  return <span className="font-mono font-bold text-orange-600 text-base">{timeLeft}</span>;
}

export default function ExamList() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await api.get('/papers', { params: { isActive: true } });
      const data = res.data.data || res.data;
      setPapers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6">
        <h1 className="text-xl font-bold">考试列表</h1>
        <p className="text-blue-100 text-sm mt-1">选择试卷开始考试</p>
      </div>

      <div className="px-4 mt-4">
        {error ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchPapers}
              className="px-6 py-2 bg-blue-500 text-white rounded-full text-sm"
            >
              重试
            </button>
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无考试安排</p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => {
              const status = getExamStatus(paper);
              const canEnter = status === 'in_progress' || status === 'resuming';

              return (
                <div
                  key={paper.id}
                  className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                    canEnter ? 'border-gray-100 active:scale-[0.98] cursor-pointer' : 'border-gray-200 opacity-80'
                  }`}
                  onClick={() => canEnter && navigate(`/exam/${paper.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-800 flex-1 mr-2">{paper.title}</h3>
                    {status === 'not_started' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600 shrink-0">
                        未开始
                      </span>
                    )}
                    {status === 'in_progress' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-600 shrink-0">
                        进行中
                      </span>
                    )}
                    {status === 'resuming' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600 shrink-0">
                        继续答题
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 shrink-0">
                        已完成
                      </span>
                    )}
                    {status === 'late_entry' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 shrink-0">
                        迟到
                      </span>
                    )}
                    {status === 'ended' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 shrink-0">
                        已结束
                      </span>
                    )}
                  </div>
                  {paper.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{paper.description}</p>
                  )}
                  {/* 考试时间 */}
                  {paper.examStartTime && paper.examEndTime && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2 bg-blue-50 rounded-lg px-3 py-2">
                      <Calendar className="w-4.5 h-4.5" />
                      <span>{formatTime(paper.examStartTime)} ~ {formatTime(paper.examEndTime)}</span>
                    </div>
                  )}
                  {/* 倒计时 */}
                  {status === 'not_started' && paper.examStartTime && (
                    <div className="text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5" />
                      <span>距离开考：</span>
                      <CountdownTimer targetTime={paper.examStartTime} />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {paper.questionCount}题
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {paper.durationMinutes}分钟
                    </span>
                    <span>满分{paper.totalScore}分</span>
                    <span>及格{paper.passScore}分</span>
                  </div>
                  <button
                    className={`w-full mt-3 py-2.5 rounded-xl font-medium transition-all text-sm ${
                      status === 'completed'
                        ? 'bg-green-100 text-green-600 cursor-pointer'
                        : status === 'ended'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : status === 'not_started'
                        ? 'bg-orange-100 text-orange-600 cursor-not-allowed'
                        : status === 'late_entry'
                        ? 'bg-red-100 text-red-500 cursor-not-allowed'
                        : status === 'resuming'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    disabled={!canEnter && status !== 'completed'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canEnter) navigate(`/exam/${paper.id}`);
                      else if (status === 'completed' && paper.userExamRecordId) navigate(`/exam/result/${paper.userExamRecordId}`);
                    }}
                  >
                    {status === 'completed' ? '查看结果' : status === 'ended' ? '考试已结束' : status === 'not_started' ? '考试未开始' : status === 'late_entry' ? '已超过入场时间' : status === 'resuming' ? '继续答题' : '开始考试'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
