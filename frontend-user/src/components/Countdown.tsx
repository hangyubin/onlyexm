import { useState, useEffect, useRef } from 'react';

interface CountdownProps {
  initialSeconds: number;
  onTimeUp: () => void;
}

export function Countdown({ initialSeconds, onTimeUp }: CountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  const triggeredRef = useRef(false);

  // 保持 onTimeUp 的最新引用，避免 effect 依赖它导致重建定时器
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    // 监听 seconds 归零，在 effect 中执行副作用（而非 setState 回调中）
    if (seconds <= 0 && !triggeredRef.current) {
      triggeredRef.current = true;
      onTimeUpRef.current();
    }
  }, [seconds]);

  useEffect(() => {
    // 重置触发标记，避免新倒计时被旧标记阻止
    triggeredRef.current = false;

    if (initialSeconds <= 0) {
      if (!triggeredRef.current) {
        triggeredRef.current = true;
        onTimeUpRef.current();
      }
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [initialSeconds]);

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
