import { useState, useEffect, useCallback } from 'react';

export interface SuspiciousRecord {
  questionId: number;
  timeSpent: number;
  timestamp: string;
}

export interface ExamGuardState {
  tabSwitchCount: number;
  isAutoSubmit: boolean;
  suspiciousLog: SuspiciousRecord[];
  currentQuestionStartTime: number;
}

const MAX_TAB_SWITCH = 3;
const MIN_TIME_PER_QUESTION = 3000;

export function useExamGuard() {
  const [state, setState] = useState<ExamGuardState>({
    tabSwitchCount: 0,
    isAutoSubmit: false,
    suspiciousLog: [],
    currentQuestionStartTime: Date.now(),
  });

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setState((prev) => {
        const newCount = prev.tabSwitchCount + 1;
        if (newCount >= MAX_TAB_SWITCH) {
          return {
            ...prev,
            tabSwitchCount: newCount,
            isAutoSubmit: true,
          };
        }
        return {
          ...prev,
          tabSwitchCount: newCount,
        };
      });
    }
  }, []);

  const recordQuestionTime = useCallback((questionId: number) => {
    setState((prev) => {
      const timeSpent = Date.now() - prev.currentQuestionStartTime;
      
      if (timeSpent < MIN_TIME_PER_QUESTION && prev.currentQuestionStartTime > 0) {
        return {
          ...prev,
          currentQuestionStartTime: Date.now(),
          suspiciousLog: [
            ...prev.suspiciousLog,
            {
              questionId,
              timeSpent,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      
      return {
        ...prev,
        currentQuestionStartTime: Date.now(),
      };
    });
  }, []);

  const resetGuard = useCallback(() => {
    setState({
      tabSwitchCount: 0,
      isAutoSubmit: false,
      suspiciousLog: [],
      currentQuestionStartTime: Date.now(),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    ...state,
    recordQuestionTime,
    resetGuard,
  };
}
