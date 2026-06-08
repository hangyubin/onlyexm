interface QuestionNavProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<number>;
  markedQuestions: Set<number>;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export function QuestionNav({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  markedQuestions,
  onSelectQuestion,
  onClose,
}: QuestionNavProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl transform transition-transform">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">题目导航</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600">已答</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-200 rounded-full" />
              <span className="text-gray-600">未答</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-500 rounded-full" />
              <span className="text-gray-600">当前</span>
            </div>
          </div>
        </div>
        <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 80px)' }}>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const isAnswered = answeredQuestions.has(index);
              const isMarked = markedQuestions.has(index);
              const isCurrent = index === currentIndex;

              return (
                <button
                  key={index}
                  onClick={() => {
                    onSelectQuestion(index);
                    onClose();
                  }}
                  className={`relative w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    isCurrent
                      ? 'bg-blue-500 text-white border-2 border-blue-600'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {index + 1}
                  {isMarked && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
