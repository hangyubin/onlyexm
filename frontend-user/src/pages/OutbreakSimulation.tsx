import { useState } from 'react';
import api from '../api/axios';

interface StepOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Step {
  id: number;
  title: string;
  question: string;
  type: 'single' | 'multiple';
  options: StepOption[];
  explanation: string;
}

interface StepResult {
  stepId: number;
  answers: string[];
  isCorrect: boolean;
}

interface DrillReport {
  score: number;
  totalSteps: number;
  correctSteps: number;
  wrongSteps: StepResult[];
  comments: string;
}

const DRILL_STEPS: Step[] = [
  {
    id: 1,
    title: '第1步：判断',
    question: '是否构成疑似医院感染暴发？',
    type: 'single',
    options: [
      { id: 'A', text: '是', isCorrect: true },
      { id: 'B', text: '否', isCorrect: false },
    ],
    explanation: '正确答案：是。根据医院感染暴发定义，短时间内（3天内）出现2例及以上同种同源的感染病例，应判定为疑似医院感染暴发。',
  },
  {
    id: 2,
    title: '第2步：上报',
    question: '应该向谁上报？多久内上报？',
    type: 'single',
    options: [
      { id: 'A', text: '先报告科主任 → 院感科 → 分管院长，2小时内', isCorrect: true },
      { id: 'B', text: '直接报告卫健委，24小时内', isCorrect: false },
      { id: 'C', text: '不报告，先自行处理', isCorrect: false },
    ],
    explanation: '正确答案：A。医院感染暴发应在2小时内上报，上报流程为：科主任 → 院感科 → 分管院长 → 卫健委。',
  },
  {
    id: 3,
    title: '第3步：控制措施',
    question: '应立即采取哪些措施？（多选）',
    type: 'multiple',
    options: [
      { id: 'isolation', text: '隔离患者（接触隔离）', isCorrect: true },
      { id: 'disinfection', text: '加强环境消毒', isCorrect: true },
      { id: 'restrict', text: '限制患者转出', isCorrect: true },
      { id: 'close', text: '关闭病房', isCorrect: false },
      { id: 'training', text: '手卫生培训', isCorrect: true },
    ],
    explanation: '正确答案：隔离患者、加强环境消毒、限制患者转出、手卫生培训。关闭病房是暴发持续扩大且无法控制时才考虑的极端措施。',
  },
];

const getExpertComments = (correctCount: number): string => {
  if (correctCount === 3) {
    return '优秀！您对院感暴发的判断、上报流程和控制措施都非常熟悉，具备良好的院感防控意识。';
  } else if (correctCount === 2) {
    return '良好！您基本掌握了院感暴发的处置流程，但在某些环节还需要加强学习，建议复习相关规范。';
  } else if (correctCount === 1) {
    return '及格！您对院感暴发处置有初步认识，但还需要系统学习相关知识，建议参加院感培训课程。';
  } else {
    return '需要加强！院感暴发处置是医疗安全的重要环节，建议认真学习《医院感染暴发报告及处置管理规范》。';
  }
};

export function OutbreakSimulation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [report, setReport] = useState<DrillReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = DRILL_STEPS[currentStep];

  const toggleAnswer = (optionId: string) => {
    if (showFeedback) return;
    
    if (step.type === 'single') {
      setSelectedAnswers([optionId]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const checkAnswers = () => {
    const correctAnswers = step.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);
    
    const isCorrect =
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((ans) => correctAnswers.includes(ans));

    const result: StepResult = {
      stepId: step.id,
      answers: selectedAnswers,
      isCorrect,
    };

    setStepResults((prev) => [...prev, result]);
    setShowFeedback(true);
  };

  const nextStep = () => {
    if (currentStep < DRILL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswers([]);
      setShowFeedback(false);
    } else {
      generateReport();
    }
  };

  const generateReport = () => {
    // 使用函数式更新确保读取最新状态
    setStepResults((prevStepResults) => {
      const correctSteps = prevStepResults.filter((r) => r.isCorrect).length;
      const wrongSteps = prevStepResults.filter((r) => !r.isCorrect);
      const score = Math.round((correctSteps / DRILL_STEPS.length) * 100);

      const reportData: DrillReport = {
        score,
        totalSteps: DRILL_STEPS.length,
        correctSteps,
        wrongSteps,
        comments: getExpertComments(correctSteps),
      };

      setReport(reportData);
      return prevStepResults;
    });
  };

  const submitReport = async () => {
    if (!report) return;

    setIsSubmitting(true);
    try {
      await api.post('/infection/drill/submit', {
        drillId: 1,
        stepsResult: stepResults,
        score: report.score,
        reportText: report.comments,
      });
    } catch (err) {
      console.error('Submit drill report failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDrill = () => {
    setCurrentStep(0);
    setSelectedAnswers([]);
    setShowFeedback(false);
    setStepResults([]);
    setReport(null);
  };

  const getOptionClass = (option: StepOption) => {
    if (!showFeedback) {
      return selectedAnswers.includes(option.id)
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
    }

    const isSelected = selectedAnswers.includes(option.id);
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

  if (report) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <h1 className="text-xl font-bold text-center mb-2">院感暴发模拟演练报告</h1>
            <p className="text-purple-100 text-center text-sm">演练完成时间：{new Date().toLocaleString()}</p>
          </div>

          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${
                    report.score >= 80 ? 'text-green-600' :
                    report.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {report.score}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                  {report.score >= 80 ? '优秀' : report.score >= 60 ? '良好' : '需加强'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{report.totalSteps}</p>
                <p className="text-sm text-gray-500">总步骤</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{report.correctSteps}</p>
                <p className="text-sm text-green-600">正确</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{report.totalSteps - report.correctSteps}</p>
                <p className="text-sm text-red-600">错误</p>
              </div>
            </div>

            {report.wrongSteps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  错误环节分析
                </h3>
                <div className="space-y-3">
                  {report.wrongSteps.map((wrongStep) => {
                    const wrongStepData = DRILL_STEPS.find((s) => s.id === wrongStep.stepId);
                    if (!wrongStepData) return null;
                    return (
                      <div key={wrongStep.stepId} className="bg-orange-50 rounded-xl p-4">
                        <p className="font-medium text-orange-800 mb-2">{wrongStepData.title}</p>
                        <p className="text-sm text-orange-700">{wrongStepData.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
                院感专员评语
              </h3>
              <p className="text-purple-700">{report.comments}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetDrill}
                className="flex-1 py-4 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                重新演练
              </button>
              <button
                onClick={submitReport}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '提交报告'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
          <h1 className="text-xl font-bold text-center mb-2">院感暴发模拟演练</h1>
          <p className="text-red-100 text-center text-sm">内科病房CRKP感染暴发处置</p>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          {DRILL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{step.title}</h2>
          <span className="text-sm text-gray-500">
            {currentStep + 1}/{DRILL_STEPS.length}
          </span>
        </div>

        <div className="bg-red-50 rounded-xl p-4 mb-6">
          <p className="text-gray-700 text-sm">
            <strong>演练场景：</strong>某内科病房，3天内出现2例痰培养结果为耐碳青霉烯类肺炎克雷伯菌（CRKP）的患者。
          </p>
        </div>

        <h3 className="font-bold text-gray-800 mb-4">{step.question}</h3>

        <div className="space-y-3">
          {step.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${getOptionClass(option)}`}
              onClick={() => toggleAnswer(option.id)}
            >
              {step.type === 'multiple' ? (
                <input
                  type="checkbox"
                  checked={selectedAnswers.includes(option.id)}
                  onChange={() => {}}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={showFeedback}
                />
              ) : (
                <input
                  type="radio"
                  name="answer"
                  checked={selectedAnswers.includes(option.id)}
                  onChange={() => {}}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  disabled={showFeedback}
                />
              )}
              <span className="text-gray-700 flex-1">{option.text}</span>
              {showFeedback && (
                <span className={`text-sm font-medium ${
                  option.isCorrect ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {option.isCorrect ? '正确答案' : ''}
                </span>
              )}
            </label>
          ))}
        </div>

        {showFeedback && (
          <div className="mt-6 bg-blue-50 rounded-xl p-4">
            <h4 className="font-bold text-blue-800 mb-2">解析</h4>
            <p className="text-blue-700 text-sm">{step.explanation}</p>
          </div>
        )}

        <button
          onClick={showFeedback ? nextStep : checkAnswers}
          disabled={!showFeedback && selectedAnswers.length === 0}
          className="w-full mt-6 py-4 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
        >
          {showFeedback ? '下一步' : '确认答案'}
        </button>
      </div>
    </div>
  );
}
