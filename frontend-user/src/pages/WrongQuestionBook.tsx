import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { systemApi, DictItem } from '../api/system';

interface QuestionOption {
  id: number;
  optionKey: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  content: string;
  type: string;
  category: string;
  infectionTag?: string;
  analysis: string;
  standardSource?: string;
  options: QuestionOption[];
}

interface WrongQuestionItem {
  id: number;
  userId: number;
  questionId: number;
  wrongCount: number;
  correctCount: number;
  status: string;
  question: Question;
}

interface PracticeResult {
  isCorrect: boolean;
  autoRemoved: boolean;
  message: string;
  newCorrectCount: number;
  newWrongCount: number;
}

interface DictMap {
  TYPE_MAP: Record<string, string>;
  CATEGORY_MAP: Record<string, string>;
  INFECTION_TAG_MAP: Record<string, string>;
  TYPE_OPTIONS: { value: string; label: string }[];
  CATEGORY_OPTIONS: { value: string; label: string }[];
  INFECTION_TAG_OPTIONS: { value: string; label: string }[];
  CATEGORY_TREE: { value: string; label: string; children?: { value: string; label: string }[] }[];
}

const DEFAULT_DICT_MAP: DictMap = {
  TYPE_MAP: { SINGLE: '单选题', MULTIPLE: '多选题', JUDGE: '判断题', CASE: '案例题' },
  CATEGORY_MAP: { 
    BASIC_THEORY: '三基综合', 
    BASIC_KNOWLEDGE: '三基综合', 
    BASIC_SKILL: '三基综合',
    INFECTION_KNOWLEDGE: '院感知识',
    PUBLIC: '公共卫生',
    TRADITIONAL_CHINESE: '中医药学'
  },
  INFECTION_TAG_MAP: {
    HAND_HYGIENE: '手卫生',
    MEDICAL_WASTE: '医疗废物',
    EXPOSURE: '职业暴露',
    DISINFECTION: '消毒灭菌',
    MDRO: '多重耐药菌',
    AIR_QUALITY: '空气质量',
    ISOLATION: '隔离防护',
    STERILIZATION: '无菌操作',
  },
  TYPE_OPTIONS: [],
  CATEGORY_OPTIONS: [],
  INFECTION_TAG_OPTIONS: [],
  CATEGORY_TREE: [],
};

function PracticeModal({
  question,
  wrongCount,
  correctCount,
  onClose,
  onSuccess,
  dictMap,
  serialMode,
  serialIndex,
  serialTotal,
  onNextSerial,
}: {
  question: Question;
  wrongCount: number;
  correctCount: number;
  onClose: () => void;
  onSuccess: (result: PracticeResult) => void;
  dictMap: DictMap;
  serialMode?: boolean;
  serialIndex?: number;
  serialTotal?: number;
  onNextSerial?: () => void;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);

  const toggleOption = (optionKey: string) => {
    if (submitted) return;
    
    if (question.type === 'SINGLE' || question.type === 'JUDGE') {
      setSelectedAnswers([optionKey]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(optionKey)
          ? prev.filter((key) => key !== optionKey)
          : [...prev, optionKey]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) {
      alert('请选择答案');
      return;
    }

    const correctAnswers = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.optionKey);
    
    const isCorrect =
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((ans) => correctAnswers.includes(ans));

    setSubmitted(true);
    setResult({
      isCorrect,
      autoRemoved: false,
      message: '',
      newCorrectCount: correctCount,
      newWrongCount: wrongCount,
    });

    try {
      const response = await api.post(
        '/wrong-questions/practice',
        { questionId: question.id, isCorrect }
      );
      if (response.data.success) {
        setResult({
          isCorrect,
          autoRemoved: response.data.autoRemoved,
          message: response.data.message,
          newCorrectCount: response.data.correctCount,
          newWrongCount: response.data.wrongCount,
        });
        onSuccess({
          isCorrect,
          autoRemoved: response.data.autoRemoved,
          message: response.data.message,
          newCorrectCount: response.data.correctCount,
          newWrongCount: response.data.wrongCount,
        });
      }
    } catch (err) {
      console.error('Practice failed:', err);
    }
  };

  const getOptionClass = (option: QuestionOption) => {
    if (!submitted) {
      return selectedAnswers.includes(option.optionKey)
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
    }

    const isSelected = selectedAnswers.includes(option.optionKey);
    if (option.isCorrect && isSelected) {
      return 'border-green-500 bg-green-50';
    }
    if (option.isCorrect && !isSelected) {
      return 'border-yellow-500 bg-yellow-50 border-dashed';
    }
    if (!option.isCorrect && isSelected) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">练习本题</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {dictMap.TYPE_MAP[question.type] || question.type}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {dictMap.CATEGORY_MAP[question.category] || question.category}
            </span>
            {question.infectionTag && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {dictMap.INFECTION_TAG_MAP[question.infectionTag] || question.infectionTag}
              </span>
            )}
          </div>

          <div className="flex gap-4 mb-4">
            <span className="text-sm text-red-500">
              答错 {wrongCount} 次
            </span>
            <span className="text-sm text-green-500">
              连续正确 {correctCount}/3 次
            </span>
          </div>

          <p className="text-gray-800 mb-6 leading-relaxed">{question.content}</p>

          <div className="space-y-3 mb-6">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${getOptionClass(option)}`}
                onClick={() => toggleOption(option.optionKey)}
              >
                {question.type === 'MULTIPLE' ? (
                  <input
                    type="checkbox"
                    checked={selectedAnswers.includes(option.optionKey)}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={submitted}
                  />
                ) : (
                  <input
                    type="radio"
                    name="answer"
                    checked={selectedAnswers.includes(option.optionKey)}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    disabled={submitted}
                  />
                )}
                <span className="font-bold w-6">{option.optionKey}.</span>
                <span className="text-gray-700 flex-1">{option.content}</span>
                {submitted && (
                  <span className={`text-sm font-medium ${option.isCorrect ? 'text-green-600' : ''}`}>
                    {option.isCorrect ? '✓ 正确答案' : ''}
                  </span>
                )}
              </label>
            ))}
          </div>

          {submitted && (
            <div className={`p-4 rounded-xl mb-6 ${result?.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xl ${result?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {result?.isCorrect ? '✓' : '✗'}
                </span>
                <span className={`font-bold ${result?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {result?.isCorrect ? '回答正确' : '回答错误'}
                </span>
              </div>
              {result?.message && (
                <p className="text-sm text-gray-600">{result.message}</p>
              )}
            </div>
          )}

          {submitted && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-bold text-blue-800 mb-2">答案解析</h4>
              <p className="text-blue-700 text-sm leading-relaxed">{question.analysis}</p>
              {question.standardSource && (
                <p className="text-blue-600 text-xs mt-2">规范出处：{question.standardSource}</p>
              )}
            </div>
          )}

          <button
            onClick={submitted ? (serialMode && serialIndex !== undefined && serialTotal !== undefined && serialIndex < serialTotal - 1 ? (onNextSerial || onClose) : onClose) : handleSubmit}
            disabled={!submitted && selectedAnswers.length === 0}
            className="w-full py-4 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {submitted
              ? (serialMode && serialIndex !== undefined && serialTotal !== undefined && serialIndex < serialTotal - 1)
                ? '下一题'
                : '关闭'
              : '提交答案'}
          </button>
          {serialMode && submitted && (
            <div className="text-center mt-2 text-sm text-gray-500">
              {((serialIndex || 0) + 1)} / {serialTotal}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WrongQuestionBook() {
  const [searchParams] = useSearchParams();
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState(searchParams.get('tag') || '');
  
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null);
  const [practiceStats, setPracticeStats] = useState({ wrongCount: 0, correctCount: 0, questionId: 0 });
  const [dictMap, setDictMap] = useState<DictMap>(DEFAULT_DICT_MAP);
  const [practiceMode, setPracticeMode] = useState<'single' | 'serial'>('single');
  const [serialIndex, setSerialIndex] = useState(0);

  useEffect(() => {
    loadDictData();
  }, []);

  const loadDictData = async () => {
    try {
      const [types, categories] = await Promise.all([
        systemApi.getDict('QUESTION_TYPE'),
        systemApi.getDict('QUESTION_CATEGORY'),
      ]);
      
      const typeMap = types.reduce((acc: Record<string, string>, item: DictItem) => ({ ...acc, [item.code]: item.name }), {});
      const categoryMap = categories.reduce((acc: Record<string, string>, item: DictItem) => ({ ...acc, [item.code]: item.name }), {});
      
      // 从 QUESTION_CATEGORY 的子分类中构建 INFECTION_TAG_MAP
      const tagMap: Record<string, string> = {};
      const tagOptions: { value: string; label: string }[] = [];
      categories.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.forEach(child => {
            tagMap[child.code] = child.name;
            tagOptions.push({ value: child.code, label: child.name });
          });
        }
      });

      const threeBaseCategories = ['BASIC_THEORY', 'BASIC_KNOWLEDGE', 'BASIC_SKILL'];
      threeBaseCategories.forEach(code => {
        categoryMap[code] = '三基综合';
      });

      // 构建分类树
      const categoryTree = categories.map(item => ({
        value: item.code,
        label: item.name,
        children: item.children?.map(child => ({
          value: child.code,
          label: child.name,
        })),
      }));

      setDictMap({
        TYPE_MAP: { ...DEFAULT_DICT_MAP.TYPE_MAP, ...typeMap },
        CATEGORY_MAP: { ...DEFAULT_DICT_MAP.CATEGORY_MAP, ...categoryMap },
        INFECTION_TAG_MAP: { ...DEFAULT_DICT_MAP.INFECTION_TAG_MAP, ...tagMap },
        TYPE_OPTIONS: types.map((item: DictItem) => ({ value: item.code, label: item.name })),
        CATEGORY_OPTIONS: categories.map((item: DictItem) => ({ value: item.code, label: item.name })),
        INFECTION_TAG_OPTIONS: tagOptions,
        CATEGORY_TREE: categoryTree,
      });
    } catch (error) {
      console.error('加载字典数据失败:', error);
    }
  };

  const fetchWrongQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (filterTag) params.infectionTag = filterTag;
      params.page = page.toString();
      params.pageSize = pageSize.toString();

      const response = await api.get('/wrong-questions', { params });
      if (response.data.success) {
        setWrongQuestions(response.data.data);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Fetch wrong questions failed:', err);
      setError('加载错题本失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCategory, filterTag, pageSize]);

  useEffect(() => {
    fetchWrongQuestions();
  }, [fetchWrongQuestions]);

  const handlePractice = (item: WrongQuestionItem) => {
    setPracticeMode('single');
    setPracticeQuestion(item.question);
    setPracticeStats({
      wrongCount: item.wrongCount,
      correctCount: item.correctCount,
      questionId: item.questionId,
    });
  };

  const handleSerialPractice = () => {
    if (wrongQuestions.length === 0) return;
    setPracticeMode('serial');
    setSerialIndex(0);
    const first = wrongQuestions[0];
    setPracticeQuestion(first.question);
    setPracticeStats({
      wrongCount: first.wrongCount,
      correctCount: first.correctCount,
      questionId: first.questionId,
    });
  };

  const handleNextSerial = () => {
    const nextIdx = serialIndex + 1;
    if (nextIdx < wrongQuestions.length) {
      setSerialIndex(nextIdx);
      const next = wrongQuestions[nextIdx];
      setPracticeQuestion(next.question);
      setPracticeStats({
        wrongCount: next.wrongCount,
        correctCount: next.correctCount,
        questionId: next.questionId,
      });
    } else {
      setPracticeQuestion(null);
      fetchWrongQuestions();
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const response = await api.delete(`/wrong-questions/${id}`);
      if (response.data.success) {
        fetchWrongQuestions();
      }
    } catch (error) {
      console.error('Remove failed:', error);
    }
  };

  const handlePracticeSuccess = (result: PracticeResult) => {
    if (result.autoRemoved) {
      setWrongQuestions((prev) =>
        prev.filter((q) => q.questionId !== practiceStats.questionId)
      );
      setTotal((prev) => prev - 1);
    } else {
      // 实时更新 correctCount 和 wrongCount
      setWrongQuestions((prev) =>
        prev.map((q) =>
          q.questionId === practiceStats.questionId
            ? {
                ...q,
                correctCount: result.newCorrectCount,
                wrongCount: result.newWrongCount,
              }
            : q
        )
      );
    }
  };

  const getProgressPercent = (correctCount: number) => {
    return Math.round((correctCount / 3) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto px-4 py-6 pb-safe-20">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWrongQuestions}
            className="mt-2 px-4 py-1 bg-red-500 text-white rounded-lg text-sm"
          >
            重试
          </button>
        </div>
      )}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-xl font-bold text-center mb-2">错题本</h1>
        <p className="text-center text-orange-100">共 {total} 道错题待练习</p>
        {wrongQuestions.length > 0 && (
          <button
            onClick={handleSerialPractice}
            className="mt-3 w-full py-2 bg-white/20 rounded-xl font-medium hover:bg-white/30 transition-all"
          >
            连续练习全部错题
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="space-y-3">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="w-full p-3 border border-gray-200 rounded-xl"
          >
            <option value="">全部题型</option>
            {dictMap.TYPE_OPTIONS.length > 0 ? (
              dictMap.TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))
            ) : (
              Object.entries(dictMap.TYPE_MAP).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))
            )}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="w-full p-3 border border-gray-200 rounded-xl"
          >
            <option value="">全部分类</option>
            {dictMap.CATEGORY_OPTIONS.length > 0 ? (
              dictMap.CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{dictMap.CATEGORY_MAP[item.value] || item.label}</option>
              ))
            ) : (
              Object.entries(dictMap.CATEGORY_MAP).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))
            )}
          </select>

          <select
            value={filterTag}
            onChange={(e) => {
              setFilterTag(e.target.value);
              setPage(1);
            }}
            className="w-full p-3 border border-gray-200 rounded-xl"
          >
            <option value="">全部标签</option>
            {dictMap.INFECTION_TAG_OPTIONS.length > 0 ? (
              dictMap.INFECTION_TAG_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))
            ) : (
              Object.entries(dictMap.INFECTION_TAG_MAP).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>加载中...</p>
          </div>
        ) : wrongQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600">暂无错题，继续保持！</p>
          </div>
        ) : (
          wrongQuestions.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                    {dictMap.TYPE_MAP[item.question.type] || item.question.type}
                  </span>
                  {item.question.infectionTag && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">
                      {dictMap.INFECTION_TAG_MAP[item.question.infectionTag]}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  错{item.wrongCount}次
                </div>
              </div>

              <p className="text-gray-800 mb-4 line-clamp-2">{item.question.content}</p>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>掌握进度</span>
                  <span>{item.correctCount}/3</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                    style={{ width: `${getProgressPercent(item.correctCount)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePractice(item)}
                  className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
                >
                  练习本题
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  标记已掌握
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {total > pageSize && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => page > 1 && setPage(page - 1)}
            disabled={page === 1}
            className="px-6 py-2 rounded-xl border border-gray-300 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-gray-500 self-center">
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            onClick={() => page < Math.ceil(total / pageSize) && setPage(page + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-6 py-2 rounded-xl border border-gray-300 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {practiceQuestion && (
        <PracticeModal
          question={practiceQuestion}
          wrongCount={practiceStats.wrongCount}
          correctCount={practiceStats.correctCount}
          onClose={() => { setPracticeQuestion(null); if (practiceMode === 'serial') fetchWrongQuestions(); }}
          onSuccess={handlePracticeSuccess}
          dictMap={dictMap}
          serialMode={practiceMode === 'serial'}
          serialIndex={serialIndex}
          serialTotal={wrongQuestions.length}
          onNextSerial={handleNextSerial}
        />
      )}
    </div>
  );
}