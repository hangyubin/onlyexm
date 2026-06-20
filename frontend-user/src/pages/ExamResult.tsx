import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, RotateCcw, Printer, Download } from 'lucide-react';
import api from '../api/axios';

interface QuestionResult {
  questionId: number;
  content: string;
  type: 'SINGLE' | 'MULTIPLE' | 'JUDGE' | 'CASE';
  options: { optionKey: string; content: string; isCorrect: boolean }[];
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  score: number;
  earnedScore: number;
}

interface ExamResultData {
  id: number;
  paperName: string;
  totalScore: number;
  earnedScore: number;
  passed: boolean;
  passScore: number;
  duration: number;
  submittedAt: string;
  questionResults: QuestionResult[];
  userName: string;
  department: string;
  hospitalName: string;
}

export default function ExamResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/exam/records/${id}`);
      if (res.data.success || res.data.code === 0) {
        setResult(res.data.data || res.data);
      } else {
        setError(res.data.message || '获取考试结果失败');
      }
    } catch (err) {
      setError('获取考试结果失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SINGLE: '单选题',
      MULTIPLE: '多选题',
      JUDGE: '判断题',
      CASE: '案例分析',
    };
    return map[type] || type;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/exam/records/${id}/print`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result?.paperName || '试卷'}_${result?.userName || '考生'}_答题卡.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('下载PDF失败:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || '未找到考试结果'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-full"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const correctCount = result.questionResults.filter((q) => q.isCorrect).length;
  const totalQuestions = result.questionResults.length;

  // 按题型分组
  const typeOrder = ['SINGLE', 'MULTIPLE', 'JUDGE', 'CASE'];
  const groupedByType = new Map<string, QuestionResult[]>();
  for (const q of result.questionResults) {
    const list = groupedByType.get(q.type) || [];
    list.push(q);
    groupedByType.set(q.type, list);
  }
  const sortedTypeKeys = [
    ...typeOrder.filter(t => groupedByType.has(t)),
    ...Array.from(groupedByType.keys()).filter(t => !typeOrder.includes(t)),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-20 print:min-h-0 print:pb-0 print:bg-white max-w-md mx-auto">
      {/* 屏幕显示的结果头部 - 打印时隐藏 */}
      <div className="print:hidden">
        <div className={`px-4 py-8 text-center text-white ${result.passed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
          <div className="mb-4">
            {result.passed ? (
              <CheckCircle className="w-16 h-16 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {result.passed ? '恭喜通过！' : '未通过'}
          </h1>
          <p className="text-lg opacity-90">{result.paperName}</p>
        </div>

        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.earnedScore}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                  满分 {result.totalScore}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{correctCount}/{totalQuestions}</p>
                <p className="text-xs text-blue-600/70">答对题数</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-600">{result.passScore}</p>
                <p className="text-xs text-green-600/70">及格分</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{formatDuration(result.duration)}</p>
                <p className="text-xs text-purple-600/70">用时</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 打印区域 - 标准试卷样式 */}
      <div ref={printRef} className="px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 print:shadow-none print:rounded-none print:p-0 print:mb-0">
          <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Printer className="w-4 h-4" />
              打印试卷
            </button>
          </div>

          {/* 打印专用试卷头部 - 紧凑排版 */}
          <div className="hidden print:block" style={{ marginBottom: '8px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: '6px' }}>
              {result.hospitalName && (
                <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{result.hospitalName}</p>
              )}
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>{result.paperName}</h1>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px', fontSize: '12px' }}>
                <span>姓名：{result.userName}</span>
                <span>科室：{result.department}</span>
                <span>得分：<b>{result.earnedScore}</b></span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sortedTypeKeys.map(type => {
              const questions = groupedByType.get(type)!;
              const typeTotal = questions.reduce((sum, q) => sum + q.score, 0);
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b print:border-b-0 print:pb-0 print:mb-1">
                    <span className="font-bold text-gray-800 print:text-sm" style={{ fontSize: 'inherit' }}>
                      {getTypeLabel(type)}
                    </span>
                    <span className="text-sm text-gray-500 print:text-sm">
                      （共{questions.length}题，{typeTotal}分）
                    </span>
                  </div>
                  <div className="space-y-3 print:space-y-0">
                    {questions.map((q, index) => {
                      const userAnswerStr = Array.isArray(q.userAnswer) ? q.userAnswer.join(',') : q.userAnswer || '';
                      const displayAnswer = q.type === 'JUDGE'
                        ? (userAnswerStr === 'true' ? '✓' : userAnswerStr === 'false' ? '✗' : userAnswerStr)
                        : userAnswerStr;
                      return (
                      <div
                        key={q.questionId}
                        className={`rounded-xl p-4 border-2 print:rounded-none print:border-0 print:p-1 print:py-0.5 ${
                          q.isCorrect ? 'border-green-200 bg-green-50 print:bg-white' : 'border-red-200 bg-red-50 print:bg-white'
                        }`}
                      >
                        {/* 序号+题干+用户答案 在一行 */}
                        <div className="flex items-start justify-between mb-2 print:mb-0">
                          <p className="text-sm text-gray-700 print:text-sm flex-1">
                            <span className="font-medium">{index + 1}.</span>
                            {q.content}
                            <span className="ml-1 text-gray-500 print:text-xs">（{displayAnswer || '未作答'}）</span>
                            <span className="hidden print:inline ml-1 font-bold">{q.isCorrect ? '✓' : '✗'}</span>
                          </p>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 print:hidden">
                              {getTypeLabel(q.type)}
                            </span>
                            <span className="text-xs text-gray-500 print:hidden">{q.earnedScore}/{q.score}分</span>
                            {q.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-500 print:hidden" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 print:hidden" />
                            )}
                          </div>
                        </div>
                        {/* 选项显示 - 屏幕上显示，打印时不显示正确答案标记 */}
                        {q.type !== 'JUDGE' && q.options && q.options.length > 0 && (
                          <div className="space-y-1 mb-2 print:mb-0 print:flex print:flex-wrap print:gap-x-4 print:items-baseline">
                            {q.options.map((opt) => {
                              const isUserAnswer = Array.isArray(q.userAnswer)
                                ? q.userAnswer.includes(opt.optionKey)
                                : q.userAnswer === opt.optionKey;
                              return (
                                <div
                                  key={opt.optionKey}
                                  className={`text-xs px-2 py-1 rounded print:px-0 print:py-0 print:text-sm ${
                                    opt.isCorrect
                                      ? 'bg-green-100 text-green-700 print:bg-transparent print:text-gray-700'
                                      : isUserAnswer && !opt.isCorrect
                                      ? 'bg-red-100 text-red-700 print:bg-transparent print:text-gray-700'
                                      : 'text-gray-600 print:text-gray-700'
                                  }`}
                                >
                                  <span className="font-medium">{opt.optionKey}.</span> {opt.content}
                                  {opt.isCorrect && <span className="ml-1 print:hidden">✓</span>}
                                  {isUserAnswer && !opt.isCorrect && <span className="ml-1 print:hidden">✗</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* 判断题显示 - 打印时隐藏选项，只保留题干中的答案标记 */}
                        {q.type === 'JUDGE' && (
                          <div className="flex gap-3 mb-2 text-xs print:hidden">
                            <span className={q.correctAnswer === 'true' ? 'text-green-600 font-bold' : 'text-gray-500'}>
                              正确
                            </span>
                            <span className={q.correctAnswer === 'false' ? 'text-green-600 font-bold' : 'text-gray-500'}>
                              错误
                            </span>
                          </div>
                        )}
                        {/* 屏幕上显示答案详情，打印时隐藏 */}
                        {!q.isCorrect && (
                          <div className="text-xs space-y-1 print:hidden">
                            <p className="text-red-600">
                              你的答案：{userAnswerStr || '未作答'}
                            </p>
                            <p className="text-green-600">
                              正确答案：{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                            </p>
                          </div>
                        )}
                        {q.isCorrect && q.type === 'JUDGE' && (
                          <div className="text-xs text-green-600 print:hidden">
                            答案：{q.correctAnswer === 'true' ? '正确' : '错误'}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部按钮 - 打印时隐藏 */}
      <div className="print:hidden flex gap-4 px-4 pb-6">
        <button
          onClick={() => navigate('/exams')}
          className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          返回考试列表
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          返回首页
        </button>
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 8mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 13px !important;
          }
          #root {
            max-width: 100% !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:inline {
            display: inline !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:p-1 {
            padding: 2px 4px !important;
          }
          .print\\:py-0\\.5 {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }
          .print\\:mb-0 {
            margin-bottom: 0 !important;
          }
          .print\\:mb-1 {
            margin-bottom: 2px !important;
          }
          .print\\:ml-2 {
            margin-left: 8px !important;
          }
          .print\\:mr-2 {
            margin-right: 8px !important;
          }
          .print\\:border-0 {
            border-width: 0 !important;
          }
          .print\\:border-b {
            border-bottom-width: 1px !important;
          }
          .print\\:border-gray-300 {
            border-color: #ddd !important;
          }
          .print\\:border-b-0 {
            border-bottom: none !important;
          }
          .print\\:pb-0 {
            padding-bottom: 0 !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:bg-transparent {
            background: transparent !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:text-xs {
            font-size: 12px !important;
          }
          .print\\:text-sm {
            font-size: 13px !important;
          }
          .print\\:space-y-0 > * + * {
            margin-top: 0 !important;
          }
          .print\\:flex {
            display: flex !important;
          }
          .print\\:flex-wrap {
            flex-wrap: wrap !important;
          }
          .print\\:gap-x-4 {
            column-gap: 16px !important;
          }
          .print\\:items-baseline {
            align-items: baseline !important;
          }
          .print\\:min-h-0 {
            min-height: 0 !important;
          }
          .print\\:pb-0 {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
