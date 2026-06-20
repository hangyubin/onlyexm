import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Countdown } from '../components/Countdown';
import { QuestionNav } from '../components/QuestionNav';
import { useExamGuard } from '../hooks/useExamGuard';

interface QuestionOption {
  id: number;
  optionKey: string;
  content: string;
}

interface ExamQuestion {
  id: number;
  content: string;
  type: 'SINGLE' | 'MULTIPLE' | 'JUDGE' | 'CASE';
  category: string;
  options: QuestionOption[];
  score: number;
}

interface ExamData {
  success: boolean;
  paperName: string;
  durationMinutes: number;
  examRecordId: number;
  questions: ExamQuestion[];
  remainingSeconds: number;
  reentryCount: number;
  maxReentry: number;
  isResuming: boolean;
  savedAnswers?: Record<number, string>;
}

type AnswerType = string | string[];

export function ExamTaking() {
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, AnswerType>>(new Map());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showNav, setShowNav] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorRecordId, setErrorRecordId] = useState<number | null>(null);
  const [showStartNotice, setShowStartNotice] = useState(false);

  const {
    tabSwitchCount,
    isAutoSubmit,
    suspiciousLog,
    recordQuestionTime,
  } = useExamGuard();

  const { id: paperId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const initExam = async () => {
      try {
        const response = await api.get(`/exam/start/${paperId}`);

        if (response.data.success) {
          const data = response.data as ExamData;
          setExamData(data);

          // 恢复已保存的答案
          if (data.savedAnswers) {
            const restored = new Map<number, AnswerType>();
            for (const [qId, ans] of Object.entries(data.savedAnswers)) {
              try {
                const parsed = JSON.parse(ans);
                restored.set(Number(qId), parsed);
              } catch {
                restored.set(Number(qId), ans);
              }
            }
            setAnswers(restored);
          }

          setLoading(false);
          // 显示开考提示弹窗
          setShowStartNotice(true);
        } else {
          setError(response.data.message || '获取考试数据失败');
          if (response.data.examRecordId) {
            setErrorRecordId(response.data.examRecordId);
          }
          setLoading(false);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.response?.data?.error || '获取考试数据失败';
        setError(msg);
        if (err.response?.data?.examRecordId) {
          setErrorRecordId(err.response.data.examRecordId);
        }
        setLoading(false);
      }
    };

    initExam();
  }, [paperId]);

  // 防止误操作：浏览器关闭/刷新提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examData && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '考试仍在进行中，确定离开吗？';
        return '考试仍在进行中，确定离开吗？';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examData, isSubmitting]);

  // 组件卸载时清理防抖定时器，避免内存泄漏和卸载后异步请求
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  // 防作弊：禁止复制、粘贴、右键
  useEffect(() => {
    if (!examData) return;

    const handleCopy = (e: Event) => { e.preventDefault(); };
    const handlePaste = (e: Event) => { e.preventDefault(); };
    const handleContextMenu = (e: Event) => { e.preventDefault(); };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examData]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAnswer = useCallback(async (questionId: number, answer: AnswerType) => {
    if (!examData) return;

    // 防抖：清除之前的定时器，只保留最新的
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api.post('/exam/save-answer', {
          examRecordId: examData.examRecordId,
          questionId,
          answer,
        });
      } catch (err) {
        console.error('答案保存失败:', err);
      }
    }, 300);
  }, [examData]);

  const handleAnswer = useCallback(
    (questionId: number, answer: AnswerType) => {
      setAnswers((prev) => {
        const newAnswers = new Map(prev);
        newAnswers.set(questionId, answer);
        return newAnswers;
      });

      saveAnswer(questionId, answer);
    },
    [saveAnswer]
  );

  const toggleMark = useCallback(() => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  }, [currentIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (examData && index >= 0 && index < examData.questions.length) {
      recordQuestionTime(examData.questions[currentIndex].id);
      setCurrentIndex(index);
    }
  }, [currentIndex, examData, recordQuestionTime]);

  const nextQuestion = useCallback(() => {
    if (examData && currentIndex < examData.questions.length - 1) {
      recordQuestionTime(examData.questions[currentIndex].id);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, examData, recordQuestionTime]);

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      recordQuestionTime(examData?.questions[currentIndex].id || 0);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, examData, recordQuestionTime]);

  const handleSubmit = useCallback(async () => {
    if (!examData) return;

    setIsSubmitting(true);

    try {
      const answerArray = Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await api.post('/exam/submit', {
        examRecordId: examData.examRecordId,
        answers: answerArray,
        tabSwitchCount,
        suspiciousLog,
      });

      if (response.data.success) {
        navigate(`/exam/result/${examData.examRecordId}`);
      } else {
        alert('提交失败：' + (response.data.message || '未知错误'));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '提交失败，请重试';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, examData, tabSwitchCount, suspiciousLog, navigate]);

  // 自动提交（倒计时结束后触发）
  useEffect(() => {
    if (isAutoSubmit && examData && !isSubmitting) {
      handleSubmit();
    }
  }, [isAutoSubmit, examData, handleSubmit, isSubmitting]);

  const confirmSubmit = () => {
    const unanswered = examData?.questions.filter((q) => !answers.has(q.id)).length || 0;
    if (unanswered > 0) {
      setShowSubmitConfirm(true);
    } else {
      handleSubmit();
    }
  };

  // 返回确认
  const handleBack = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    navigate('/exams');
  };

  const unansweredCount = examData?.questions.filter((q) => !answers.has(q.id)).length || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4 text-lg">{error || '加载失败'}</p>
          {errorRecordId && (
            <button
              onClick={() => navigate(`/exam/result/${errorRecordId}`)}
              className="px-6 py-2 bg-blue-500 text-white rounded-full mb-2"
            >
              查看考试结果
            </button>
          )}
          <br />
          <button
            onClick={() => navigate('/exams')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full mt-2"
          >
            返回考试列表
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion.id);

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: '单选题',
      MULTIPLE: '多选题',
      JUDGE: '判断题',
      CASE: '案例分析',
    };
    return map[type] || type;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: 'bg-blue-100 text-blue-700',
      MULTIPLE: 'bg-purple-100 text-purple-700',
      JUDGE: 'bg-green-100 text-green-700',
      CASE: 'bg-orange-100 text-orange-700',
    };
    return map[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto">
      <header className="fixed top-0 w-full max-w-md fixed-center bg-white shadow-sm z-40 header-safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-lg text-gray-800 truncate flex-1 text-center mx-4">
              {examData.paperName}
            </h1>
            <div className="flex items-center gap-2">
              <Countdown
                initialSeconds={examData.remainingSeconds}
                onTimeUp={handleSubmit}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              切屏 <span className={`font-bold ${tabSwitchCount >= 3 ? 'text-red-500' : 'text-gray-700'}`}>
                {tabSwitchCount}/3
              </span>
            </span>
            <span className="text-gray-500">
              重入 <span className={`font-bold ${examData.reentryCount >= examData.maxReentry ? 'text-red-500' : 'text-gray-700'}`}>
                {examData.reentryCount}/{examData.maxReentry}
              </span>
            </span>
            <button
              onClick={() => setShowNav(true)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              第 {currentIndex + 1} 题 / 共 {examData.questions.length} 题
            </button>
          </div>
        </div>
      </header>

      <main className="pt-safe-20 pb-safe-32 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(currentQuestion.type)}`}>
              {getTypeLabel(currentQuestion.type)}
            </span>
            <span className="text-sm text-gray-400">{currentQuestion.score}分</span>
          </div>
          <p className="text-gray-800 leading-relaxed text-lg">
            <span className="font-bold mr-2">{currentIndex + 1}.</span>
            {currentQuestion.content}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          {currentQuestion.type === 'JUDGE' ? (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswer(currentQuestion.id, 'true')}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                  currentAnswer === 'true'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span className="font-medium">正确</span>
                </div>
              </button>
              <button
                onClick={() => handleAnswer(currentQuestion.id, 'false')}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                  currentAnswer === 'false'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span className="font-medium">错误</span>
                </div>
              </button>
            </div>
          ) : currentQuestion.type === 'MULTIPLE' ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const selectedAnswers = (currentAnswer as string[]) || [];
                const isSelected = selectedAnswers.includes(option.optionKey);

                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const newAnswers = isSelected
                          ? selectedAnswers.filter((k) => k !== option.optionKey)
                          : [...selectedAnswers, option.optionKey].sort();
                        handleAnswer(currentQuestion.id, newAnswers);
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700 text-base">{option.optionKey}.</span>
                  <span className="text-gray-600 flex-1 text-base">{option.content}</span>
                </label>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    currentAnswer === option.optionKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={currentAnswer === option.optionKey}
                    onChange={() => handleAnswer(currentQuestion.id, option.optionKey)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700 text-base">{option.optionKey}.</span>
                  <span className="text-gray-600 flex-1 text-base">{option.content}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={toggleMark}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              markedQuestions.has(currentIndex)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {markedQuestions.has(currentIndex) ? '已标记' : '标记'}
          </button>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md fixed-center bg-white border-t border-gray-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                currentIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              上一题
            </button>
            {currentIndex === examData.questions.length - 1 ? (
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '提交试卷'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
              >
                下一题
              </button>
            )}
          </div>
          {unansweredCount > 0 && (
            <p className="text-center text-sm text-orange-500 mt-2">
              还有 {unansweredCount} 题未作答
            </p>
          )}
        </div>
      </footer>

      {showNav && (
        <QuestionNav
          totalQuestions={examData.questions.length}
          currentIndex={currentIndex}
          answeredQuestions={new Set(
            examData.questions
              .map((q, i) => (answers.has(q.id) ? i : -1))
              .filter((i) => i >= 0)
          )}
          markedQuestions={markedQuestions}
          onSelectQuestion={goToQuestion}
          onClose={() => setShowNav(false)}
        />
      )}

      {/* 开考提示弹窗 */}
      {showStartNotice && examData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{examData.paperName}</h3>
              <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">考试时长：</span>{examData.durationMinutes}分钟
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">题目数量：</span>{examData.questions.length}题
                </p>
                {examData.isResuming && (
                  <p className="text-amber-600 font-medium">
                    您是第{examData.reentryCount}次重入，最多{examData.maxReentry}次
                  </p>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-gray-500 text-sm font-medium mb-1">考试须知：</p>
                  <ul className="text-gray-500 text-sm space-y-1">
                    <li>• 答案会自动保存，退出后可重新进入</li>
                    <li>• 重入次数最多{examData.maxReentry}次，超过将强制交卷</li>
                    <li>• 切换应用超过3次将自动交卷</li>
                    <li>• 考试时间到将自动提交试卷</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowStartNotice(false)}
                className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all text-base"
              >
                开始答题
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提交确认弹窗 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确认提交</h3>
              <p className="text-gray-600 mb-6">
                还有 <span className="font-bold text-orange-500">{unansweredCount}</span> 题未作答，确定提交吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  继续答题
                </button>
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleSubmit();
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 离开确认弹窗 - 防止误操作 */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确认离开考试？</h3>
              <p className="text-gray-600 mb-2">
                考试仍在进行中，您的答案已自动保存。
              </p>
              <p className="text-sm text-amber-600 mb-6">
                您还可以重新进入考试，但重入次数有限（已用{examData.reentryCount}次/最多{examData.maxReentry}次）
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600"
                >
                  继续答题
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  确认离开
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
