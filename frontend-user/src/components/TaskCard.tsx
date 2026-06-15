import { Task } from '../api/home';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStart?: (task: Task) => void;
  onStartLabel?: string;
}

const formatDeadline = (deadline: string | null): string => {
  if (!deadline) return '无截止';
  // 简单校验 YYYY-MM-DD 格式，符合就返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return '无截止';
    return d.toISOString().slice(0, 10);
  } catch (_e) {
    return '无截止';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, onStartLabel }) => {
  const defaultLabel = task.type === 'exam' ? '开始考试' : '开始学习';
  const label = onStartLabel || defaultLabel;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {task.type === 'exam' ? (
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-800 text-sm truncate">{task.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              截止时间：{formatDeadline(task.deadline)}
            </p>
          </div>
        </div>
        {task.status === 'pending' && (
          <button
            onClick={() => onStart?.(task)}
            className={
              'px-3 py-1.5 text-white text-xs rounded-full hover:opacity-90 transition-colors flex-shrink-0 ' +
              (task.type === 'exam' ? 'bg-blue-500' : 'bg-green-500')
            }
          >
            {label}
          </button>
        )}
        {task.status === 'not_started' && (
          <span className="text-xs text-orange-500 flex items-center gap-1 flex-shrink-0">
            未开始 <ChevronRight className="w-3 h-3" />
          </span>
        )}
        {task.status === 'ended' && (
          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
            考试结束 <ChevronRight className="w-3 h-3" />
          </span>
        )}
        {task.status === 'completed' && (
          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
            已完成 <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
};
