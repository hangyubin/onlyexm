import { ArrowRight, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InfectionStatus } from '../hooks/useInfectionStatus';

interface InfectionWarningProps {
  status: InfectionStatus;
}

export function InfectionWarning({ status }: InfectionWarningProps) {
  const navigate = useNavigate();
  if (status.isCompliant) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-3 print:hidden">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-green-500" />
            <span className="text-green-700 text-sm font-medium">
              院感学习已达标
            </span>
          </div>
          <div className="text-green-600 text-xs">
            已完成 {status.completedCount}/{status.requiredCount} 题 · 正确率 {status.currentAccuracy}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3 print:hidden">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2 flex-1">
          <Lock className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-red-700 text-sm font-medium">
              院感学习未达标
            </p>
            <p className="text-red-500 text-xs truncate">
              还需完成 {status.needCount} 道题 · 当前正确率 {status.currentAccuracy}%
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/learning')}
          className="ml-3 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-full flex items-center gap-1 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          去学习
        </button>
      </div>
    </div>
  );
}
