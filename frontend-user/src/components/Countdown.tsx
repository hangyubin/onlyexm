import { useState, useEffect } from 'react';

interface CountdownProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

export function Countdown({ initialSeconds, onTimeUp }: CountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onTimeUp]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds < 300;
  const isCritical = seconds < 60;

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
        isCritical
          ? 'bg-red-500 text-white animate-pulse'
          : isWarning
          ? 'bg-orange-100 text-orange-600'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-mono font-bold text-sm">
        {formatNumber(minutes)}:{formatNumber(secs)}
      </span>
    </div>
  );
}
