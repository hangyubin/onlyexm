import { useState, useEffect } from 'react';
import { offlineDB, type Question } from '../utils/offlineDB';

interface OfflinePracticeProps {
  userId: number;
}

export function OfflinePractice({ userId }: OfflinePracticeProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const allQuestions = await offlineDB.getAllQuestions();
        setQuestions(allQuestions.slice(0, 5));
      } catch (error) {
        console.error('Failed to load offline questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    const userAnswers = Object.entries(answers);

    for (const [questionId, userAnswer] of userAnswers) {
      const question = questions.find((q) => q.id === Number(questionId));
      if (!question) continue;

      const correctOptions = question.options.filter((opt) => opt.isCorrect);
      const correctAnswer = correctOptions.map((opt) => opt.optionKey).sort().join(',');
      const answerStr = Array.isArray(userAnswer)
        ? userAnswer.sort().join(',')
        : userAnswer;

      if (answerStr === correctAnswer) {
        correctCount++;
        await offlineDB.savePractice(userId, question.id, true);
      } else {
        await offlineDB.savePractice(userId, question.id, false);
      }
    }

    const totalQuestions = questions.length;
    const newScore = Math.round((correctCount / totalQuestions) * 100);
    setScore(newScore);
    setShowResult(true);
  };

  const resetPractice = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResult(false);
    setScore(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载离线题目...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">暂无离线题目，请先同步题目库</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8 max-w-md mx-auto">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-4">
            <h1 className="font-bold text-lg text-gray-800 text-center">离线练习结果</h1>
          </div>
        </header>
        <main className="px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-4xl font-bold ${
                score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {score}%
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">练习完成！</h2>
            <p className="text-gray-600 mb-4">
              {score >= 80 ? '太棒了！继续保持！🎉' : score >= 60 ? '还不错，再接再厉！💪' : '加油！多多练习会更好！📚'}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              答案已保存，待网络恢复后自动同步
            </p>
            <button
              onClick={resetPractice}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              继续练习
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 max-w-md mx-auto">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-gray-800">离线练习</h1>
            <span className="text-sm text-gray-500">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              离线模式
            </span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              已保存进度
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 pb-32">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-gray-800 leading-relaxed">
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
                  answers[currentQuestion.id] === 'true'
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
                  answers[currentQuestion.id] === 'false'
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
                const selectedAnswers = (answers[currentQuestion.id] as string[]) || [];
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
                    <span className="font-medium text-gray-700">{option.optionKey}.</span>
                    <span className="text-gray-600 flex-1">{option.content}</span>
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
                    answers[currentQuestion.id] === option.optionKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id] === option.optionKey}
                    onChange={() => handleAnswer(currentQuestion.id, option.optionKey)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">{option.optionKey}.</span>
                  <span className="text-gray-600 flex-1">{option.content}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md fixed-center bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                currentIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              上一题
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
              >
                提交练习
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
              >
                下一题
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
