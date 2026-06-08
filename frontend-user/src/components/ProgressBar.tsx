interface ProgressBarProps {
  progress: number;
  total: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  progress, 
  total, 
  color = 'bg-green-500',
  showLabel = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass[size]}`}>
        <div 
          className={`${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{progress}/{total}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}