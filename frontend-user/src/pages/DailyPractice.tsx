import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useDicts, DICT_CATEGORY } from '../hooks/useDict';

interface QuestionOption {
  id: number;
  optionKey: string;
  content: string;
}

interface PracticeQuestion {
  id: number;
  content: string;
  type: 'SINGLE' | 'MULTIPLE' | 'JUDGE';
  category: string;
  infectionTag?: string;
  options: QuestionOption[];
}

interface DailyPracticeData {
  id: number;
  date: string;
  questions: PracticeQuestion[];
  answers: Record<number, string | string[]>;
  score: number;
  isCompleted: boolean;
}

interface SubmitResult {
  success: boolean;
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  earnedBonus: boolean;
  message: string;
  results: { questionId: number; isCorrect: boolean; correctAnswer: string; userAnswer: string | string[] }[];
}

interface CalendarDay {
  date: string;
  isCompleted: boolean;
  score: number;
}

interface SubmitAnswer {
  questionId: number;
  answer: string | string[];
}

type AnswerType = string | string[];

export function DailyPractice() {
  const navigate = useNavigate();
  const { getName, getItems } = useDicts([DICT_CATEGORY.QUESTION_TYPE, DICT_CATEGORY.QUESTION_CATEGORY, DICT_CATEGORY.INFECTION_TAG]);
  const [practiceData, setPracticeData] = useState<DailyPracticeData | null>(null);
  const [answers, setAnswers] = useState<Map<number, AnswerType>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCompletedInfo, setShowCompletedInfo] = useState(false);
  const [showQuestionCountSelector, setShowQuestionCountSelector] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [customQuestionCount, setCustomQuestionCount] = useState('');
  const [needsQuestionCount, setNeedsQuestionCount] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 分类筛选
  const [selectedInfectionTags, setSelectedInfectionTags] = useState<string[]>([]); // 院感标签筛选

  const fetchTodayPractice = useCallback(async (questionCount?: number, category?: string, infectionTags?: string[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        return;
      }

      const params: any = {};
      if (questionCount) params.questionCount = questionCount;
      if (category && category !== 'ALL') params.category = category;
      if (infectionTags && infectionTags.length > 0) params.infectionTags = infectionTags.join(',');
      const response = await api.get('/daily-practice/today', { params });

      if (response.data.success) {
        setPracticeData(response.data);
        setLoading(false);
      } else {
        setError(response.data.message || '获取练习数据失败');
      }
    } catch (err) {
      setError('获取练习数据失败');
    }
  }, []);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const response = await api.get('/daily-practice/history');

        if (response.data.success) {
          setCalendarData(response.data.data);
        }
      } catch (err) {
        console.error('获取日历数据失败:', err);
      }
    };

    // 先检查是否已有进行中的练习
    const checkExistingPractice = async () => {
      try {
        const response = await api.get('/daily-practice/today');
        if (response.data.success) {
          setPracticeData(response.data);
          if (response.data.isCompleted) {
            setShowCompletedInfo(true);
          }
          setNeedsQuestionCount(false);
          setLoading(false);
        }
      } catch (err) {
        // 没有进行中的练习，显示题目数量选择
        setNeedsQuestionCount(true);
        setShowQuestionCountSelector(true);
        setLoading(false);
      }
    };

    checkExistingPractice();
    fetchCalendarData();
  }, [fetchTodayPractice]);

  useEffect(() => {
    if (practiceData?.isCompleted && !submitResult) {
      setShowCompletedInfo(true);
    }
  }, [practiceData, submitResult]);

  const handleAnswer = useCallback((questionId: number, answer: AnswerType) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!practiceData) return;

    setIsSubmitting(true);

    try {
      const answerArray: SubmitAnswer[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await api.post(
        '/daily-practice/submit',
        {
          practiceId: practiceData.id,
          answers: answerArray,
        }
      );

      if (response.data.success) {
        setSubmitResult(response.data);
        setShowResult(true);
        setPracticeData((prev) => prev ? { ...prev, isCompleted: true } : null);
      } else {
        alert('提交失败：' + response.data.message);
      }
    } catch (err: any) {
      console.error('提交错误:', err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || '请重试';
      alert('提交失败：' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, practiceData]);

  const nextQuestion = useCallback(() => {
    if (practiceData && currentIndex < practiceData.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, practiceData]);

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const getTypeLabel = (type: string) => getName(DICT_CATEGORY.QUESTION_TYPE, type);
  const getTypeColor = (type: string) => {
    const items = getItems(DICT_CATEGORY.QUESTION_TYPE);
    const item = items.find((x) => x.code === type);
    if (!item?.color) return 'bg-blue-100 text-blue-700';
    const tailwind: Record<string, string> = {
      '#1677ff': 'bg-blue-100 text-blue-700',
      '#531dab': 'bg-purple-100 text-purple-700',
      '#d48806': 'bg-yellow-100 text-yellow-700',
      '#d4380d': 'bg-orange-100 text-orange-700',
      '#389e0d': 'bg-green-100 text-green-700',
    };
    return tailwind[item.color] || 'bg-blue-100 text-blue-700';
  };

  const answeredCount = practiceData?.questions.filter((q) => answers.has(q.id)).length || 0;
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const renderLoading = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <p className="text-red-500 mb-4">{error || '加载失败'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-500 text-white rounded-full"
        >
          重试
        </button>
      </div>
    </div>
  );

  const renderCompletedInfo = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-lg text-gray-800">每日一练</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">今日练习已完成！</h2>
          <p className="text-gray-600 mb-4">得分：{practiceData!.score}分</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowQuestionCountSelector(true)}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors"
          >
            重新开始练习
          </button>

          <button
            onClick={async () => {
              setShowCompletedInfo(false);
              setLoading(true);
              try {
                const response = await api.get(`/daily-practice/result/${practiceData!.id}`);
                if (response.data.success) {
                  setSubmitResult(response.data);
                  setShowResult(true);
                }
              } catch (err) {
                alert('获取答题详情失败');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg hover:bg-blue-600 transition-colors"
          >
            查看答题详情
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            返回首页
          </button>
        </div>
      </main>
    </div>
  );

  const renderResult = () => {
    const getQuestionResult = (questionId: number) => {
      return submitResult!.results.find((r) => r.questionId === questionId);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
        <header className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="font-bold text-lg text-gray-800">练习结果</h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              submitResult!.accuracy >= 80 ? 'bg-green-100' : submitResult!.accuracy >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-4xl font-bold ${
                submitResult!.accuracy >= 80 ? 'text-green-600' : submitResult!.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {submitResult!.accuracy}%
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">今日练习完成！</h2>
            <p className="text-gray-600 mb-4">
              {submitResult!.correctCount} / {submitResult!.totalQuestions} 题正确
            </p>
            {submitResult!.earnedBonus && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full inline-block mb-4">
                🎁 获得额外奖励：完成次数 +5
              </div>
            )}
            <p className="text-lg font-medium text-gray-700">{submitResult!.message}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h3 className="font-bold text-gray-800 mb-4">答题详情</h3>
            <div className="space-y-4">
              {practiceData!.questions.map((question, index) => {
                const result = getQuestionResult(question.id);
                if (!result) return null;

                return (
                  <div
                    key={`result-${question.id}-${index}`}
                    className={`p-4 rounded-xl border-2 ${
                      result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800 text-base">{index + 1}.</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getTypeColor(question.type)}`}>
                        {getTypeLabel(question.type)}
                      </span>
                      {result.isCorrect ? (
                        <span className="text-green-600 text-sm">✓ 正确</span>
                      ) : (
                        <span className="text-red-600 text-sm">✗ 错误</span>
                      )}
                    </div>
                    <p className="text-gray-700 text-base mb-2">{question.content}</p>
                    {/* 显示选项 */}
                    {question.type !== 'JUDGE' && question.options && question.options.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {question.options.map((opt) => {
                          const isCorrectOption = result.correctAnswer.includes(opt.optionKey);
                          const isUserOption = Array.isArray(result.userAnswer)
                            ? result.userAnswer.includes(opt.optionKey)
                            : result.userAnswer === opt.optionKey;
                          return (
                            <div
                              key={opt.id}
                              className={`text-base px-2 py-1 rounded ${
                                isCorrectOption
                                  ? 'bg-green-100 text-green-700'
                                  : isUserOption && !isCorrectOption
                                  ? 'bg-red-100 text-red-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className="font-medium">{opt.optionKey}.</span> {opt.content}
                              {isCorrectOption && <span className="ml-1">✓</span>}
                              {isUserOption && !isCorrectOption && <span className="ml-1">✗</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {question.type === 'JUDGE' && (
                      <div className="flex gap-2 mb-2 text-base">
                        <span className={result.correctAnswer === 'true' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          正确{result.correctAnswer === 'true' && ' ✓'}
                        </span>
                        <span className={result.correctAnswer === 'false' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                          错误{result.correctAnswer === 'false' && ' ✓'}
                        </span>
                      </div>
                    )}
                    {!result.isCorrect && (
                      <div className="text-base">
                        <p className="text-red-500">你的答案：{Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer}</p>
                        <p className="text-green-600">正确答案：{result.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowQuestionCountSelector(true)}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors mb-3"
          >
            重新练习
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </button>
        </main>
      </div>
    );
  };

  const renderQuiz = () => {
    const currentQuestion = practiceData!.questions[currentIndex];
    const currentAnswer = answers.get(currentQuestion.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="font-bold text-lg text-gray-800">每日一练</h1>
              <button
                onClick={() => setShowCalendar(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-gray-600">{today}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                已完成 {answeredCount}/{practiceData!.questions.length}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6 pb-32">
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(currentQuestion.type)}`}>
                {getTypeLabel(currentQuestion.type)}
              </span>
              {currentQuestion.infectionTag && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {getName('INFECTION_TAG', currentQuestion.infectionTag)}
                </span>
              )}
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
                  onClick={() => handleAnswer(currentQuestion.id, 'A')}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                    currentAnswer === 'A'
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
                  onClick={() => handleAnswer(currentQuestion.id, 'B')}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                    currentAnswer === 'B'
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
                      key={`${currentQuestion.id}-${option.id}`}
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
                    key={`${currentQuestion.id}-${option.id}`}
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
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4">
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
              {currentIndex === practiceData!.questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || answeredCount < practiceData!.questions.length}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : '提交今日练习'}
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
            {answeredCount < practiceData!.questions.length && (
              <p className="text-center text-sm text-gray-500 mt-2">
                还有 {practiceData!.questions.length - answeredCount} 题未作答
              </p>
            )}
          </div>
        </footer>
      </div>
    );
  };

  const renderQuestionCountSelector = () => {
    const categoryItems = getItems(DICT_CATEGORY.QUESTION_CATEGORY);
    const infectionTagItems = getItems(DICT_CATEGORY.INFECTION_TAG);

    const toggleInfectionTag = (code: string) => {
      setSelectedInfectionTags((prev) => {
        if (prev.includes(code)) {
          return prev.filter((t) => t !== code);
        }
        return [...prev, code];
      });
    };

    const buildApiParams = () => {
      const params: any = {};
      params.questionCount = selectedQuestionCount;
      if (selectedCategory && selectedCategory !== 'ALL') {
        // 检查是否是院感标签
        const isInfectionTag = infectionTagItems.some((item) => item.code === selectedCategory);
        if (isInfectionTag) {
          params.infectionTags = [selectedCategory];
        } else {
          params.category = selectedCategory;
        }
      }
      if (selectedInfectionTags.length > 0) {
        const existing = params.infectionTags || [];
        params.infectionTags = [...existing, ...selectedInfectionTags.filter((t) => t !== selectedCategory)];
      }
      return params;
    };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">选择练习设置</h2>
        
        {/* 分类选择 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">题目分类：</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory('ALL'); setSelectedInfectionTags([]); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'ALL' && selectedInfectionTags.length === 0
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {categoryItems.map((item) => (
              <button
                key={item.code}
                onClick={() => { setSelectedCategory(item.code); setSelectedInfectionTags([]); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === item.code && selectedInfectionTags.length === 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* 院感标签细分（仅当选择院感知识时显示） */}
        {selectedCategory === 'INFECTION_KNOWLEDGE' && infectionTagItems.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 rounded-xl">
            <label className="text-sm font-medium text-gray-700 mb-2 block">院感标签（可多选，不选则全部院感题目）：</label>
            <div className="flex flex-wrap gap-2">
              {infectionTagItems.map((tag) => (
                <button
                  key={tag.code}
                  onClick={() => toggleInfectionTag(tag.code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedInfectionTags.includes(tag.code)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 题目数量 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">题目数量：</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15, 20, 25, 30].map((count) => (
              <button
                key={count}
                onClick={() => { setSelectedQuestionCount(count); setCustomQuestionCount(''); }}
                className={`py-3 rounded-xl font-bold text-base transition-all ${
                  selectedQuestionCount === count && !customQuestionCount
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {count}题
              </button>
            ))}
          </div>
          <div className="mt-2">
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={customQuestionCount}
                onChange={(e) => {
                  setCustomQuestionCount(e.target.value);
                  if (e.target.value) setSelectedQuestionCount(parseInt(e.target.value) || 10);
                }}
                placeholder="自定义数量"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const count = parseInt(customQuestionCount);
                  if (count > 0) setSelectedQuestionCount(count);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                确定
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {needsQuestionCount && (
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              返回
            </button>
          )}
          {!needsQuestionCount && (
            <button
              onClick={() => setShowQuestionCountSelector(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={async () => {
              try {
                setShowQuestionCountSelector(false);
                setLoading(true);
                const params = buildApiParams();
                if (needsQuestionCount) {
                  const response = await api.get('/daily-practice/today', { params });
                  if (response.data.success) {
                    setPracticeData(response.data);
                    setNeedsQuestionCount(false);
                    setLoading(false);
                  }
                } else {
                  const response = await api.post('/daily-practice/reset', {
                    questionCount: params.questionCount,
                    category: params.category,
                    infectionTags: params.infectionTags,
                  });
                  if (response.data.success) {
                    setPracticeData(response.data);
                    setShowCompletedInfo(false);
                    setAnswers(new Map());
                    setCurrentIndex(0);
                    setSubmitResult(null);
                    setShowResult(false);
                    setLoading(false);
                  }
                }
              } catch (err) {
                setLoading(false);
                alert('获取练习失败，请重试');
              }
            }}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            开始练习
          </button>
        </div>
      </div>
    </div>
  );
  };

  const renderCalendar = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowCalendar(false)} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">练习日历</h3>
          <button
            onClick={() => setShowCalendar(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const startDay = firstDay.getDay();
            const result: JSX.Element[] = [];

            for (let i = 0; i < startDay; i++) {
              result.push(<div key={`empty-${i}`} className="h-10" />);
            }

            for (let i = 1; i <= daysInMonth; i++) {
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
              const dayData = calendarData.find((d) => d.date === dateStr);
              const isToday = i === today.getDate();

              result.push(
                <div
                  key={i}
                  className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  } ${
                    dayData?.isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i}
                </div>
              );
            }

            return result;
          })()}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded" />
            <span className="text-gray-600">已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <span className="text-gray-600">未完成</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (loading) return renderLoading();
    if (error || !practiceData) return renderError();
    if (showCompletedInfo && !submitResult) return renderCompletedInfo();
    if (showResult && submitResult) return renderResult();
    return renderQuiz();
  };

  return (
    <>
      {renderMainContent()}
      {showCalendar && renderCalendar()}
      {showQuestionCountSelector && renderQuestionCountSelector()}
    </>
  );
}
