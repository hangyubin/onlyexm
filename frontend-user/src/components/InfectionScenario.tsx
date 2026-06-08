import { useState } from 'react';
import api from '../api/axios';

export interface ScenarioRisk {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface ScenarioAction {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  risks: ScenarioRisk[];
  actions: ScenarioAction[];
  expertAdvice: string;
}

interface InfectionScenarioProps {
  scenario: Scenario;
  onComplete: (result: ScenarioResult) => void;
}

export interface ScenarioResult {
  scenarioId: number;
  riskAnswers: number[];
  actionAnswer: number;
  riskScore: number;
  actionScore: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export function InfectionScenario({ scenario, onComplete }: InfectionScenarioProps) {
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const toggleRisk = (riskId: number) => {
    if (submitted) return;
    setSelectedRisks((prev) =>
      prev.includes(riskId) ? prev.filter((id) => id !== riskId) : [...prev, riskId]
    );
  };

  const calculateResult = (): ScenarioResult => {
    const correctRisks = scenario.risks.filter((r) => r.isCorrect).map((r) => r.id);
    const correctRiskCount = selectedRisks.filter((id) =>
      correctRisks.includes(id)
    ).length;
    const falsePositiveCount = selectedRisks.filter((id) =>
      !correctRisks.includes(id)
    ).length;
    const missedRiskCount = correctRisks.filter((id) => !selectedRisks.includes(id)).length;

    const riskScore = Math.round(
      (correctRiskCount / correctRisks.length) * 100
    );
    const actionScore = scenario.actions.find((a) => a.id === selectedAction)?.isCorrect ? 100 : 0;

    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (missedRiskCount >= 2 || falsePositiveCount >= 2) {
      riskLevel = 'high';
    } else if (missedRiskCount === 1 || falsePositiveCount === 1 || riskScore < 60) {
      riskLevel = 'medium';
    }

    return {
      scenarioId: scenario.id,
      riskAnswers: selectedRisks,
      actionAnswer: selectedAction || 0,
      riskScore,
      actionScore,
      riskLevel,
    };
  };

  const handleSubmit = async () => {
    if (selectedRisks.length === 0 || selectedAction === null) {
      alert('请完成所有问题');
      return;
    }

    const scenarioResult = calculateResult();
    setResult(scenarioResult);
    setSubmitted(true);

    try {
      await api.post('/api/infection/scenario/record', scenarioResult);
    } catch (err) {
      console.error('Save scenario record failed:', err);
    }

    onComplete(scenarioResult);
  };

  const getSelectedRiskClass = (risk: ScenarioRisk) => {
    if (!submitted) {
      return selectedRisks.includes(risk.id)
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
    }

    const isSelected = selectedRisks.includes(risk.id);
    if (risk.isCorrect && isSelected) {
      return 'border-green-500 bg-green-50';
    }
    if (risk.isCorrect && !isSelected) {
      return 'border-yellow-500 bg-yellow-50 border-dashed';
    }
    if (!risk.isCorrect && isSelected) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200';
  };

  const getSelectedActionClass = (action: ScenarioAction) => {
    if (!submitted) {
      return selectedAction === action.id
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
    }

    const isSelected = selectedAction === action.id;
    if (action.isCorrect && isSelected) {
      return 'border-green-500 bg-green-50';
    }
    if (!action.isCorrect && isSelected) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200';
  };

  const getRiskLevelInfo = () => {
    switch (result?.riskLevel) {
      case 'high':
        return { label: '高风险', color: 'text-red-600', bg: 'bg-red-100' };
      case 'medium':
        return { label: '中风险', color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { label: '低风险', color: 'text-green-600', bg: 'bg-green-100' };
    }
  };

  const riskLevelInfo = getRiskLevelInfo();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {scenario.imageUrl && (
          <div className="h-40 bg-gray-200">
            <img
              src={scenario.imageUrl}
              alt={scenario.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{scenario.title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {scenario.description}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          请勾选存在的院感风险点（多选）
        </h3>
        <div className="space-y-3">
          {scenario.risks.map((risk) => (
            <label
              key={risk.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${getSelectedRiskClass(risk)}`}
              onClick={() => toggleRisk(risk.id)}
            >
              <input
                type="checkbox"
                checked={selectedRisks.includes(risk.id)}
                onChange={() => {}}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={submitted}
              />
              <span className="text-gray-700 flex-1">{risk.text}</span>
              {submitted && (
                <span className={`text-sm font-medium ${risk.isCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                  {risk.isCorrect ? '风险点' : '非风险点'}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          请选择正确的处置方式（单选）
        </h3>
        <div className="space-y-3">
          {scenario.actions.map((action) => (
            <label
              key={action.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${getSelectedActionClass(action)}`}
              onClick={() => !submitted && setSelectedAction(action.id)}
            >
              <input
                type="radio"
                name="action"
                checked={selectedAction === action.id}
                onChange={() => {}}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                disabled={submitted}
              />
              <span className="text-gray-700 flex-1">{action.text}</span>
              {submitted && (
                <span className={`text-sm font-medium ${action.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {action.isCorrect ? '正确' : '错误'}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
        >
          提交答案
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">风险等级评估</span>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${riskLevelInfo.bg} ${riskLevelInfo.color}`}>
              {riskLevelInfo.label}
            </span>
          </div>

          <div className="mb-4">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              院感专员建议
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed bg-purple-50 p-3 rounded-lg">
              {scenario.expertAdvice}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-600">{result?.riskScore}%</p>
              <p className="text-sm text-gray-500">风险识别率</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{result?.actionScore}%</p>
              <p className="text-sm text-gray-500">处置正确率</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
