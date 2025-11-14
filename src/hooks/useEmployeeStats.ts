import { logger } from '@/utils/logger';
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { calculateMonthlyStats, getCurrentMonth, getCurrentDate, calculateDailyHours } from '@/utils/calculations';

export const useEmployeeStats = (userId: string) => {
  const { hours, processes } = useData();

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const today = useMemo(() => getCurrentDate(), []);

  const monthlyStats = useMemo(() => {
    const stats = calculateMonthlyStats(hours, processes, userId, currentMonth);

    // Debug logging
    if (hours.length > 0 || processes.length > 0) {
      logger.info('📊 useEmployeeStats debug:', {
        userId,
        currentMonth,
        totalHours: hours.length,
        totalProcesses: processes.length,
        userHours: hours.filter(h => h.userId === userId && h.date.startsWith(currentMonth)).length,
        userProcesses: processes.filter(p => p.userId === userId && p.date.startsWith(currentMonth)).length,
        stats
      });
    }

    return stats;
  }, [hours, processes, userId, currentMonth]);

  const todayHours = useMemo(() => {
    return calculateDailyHours(hours, userId, today);
  }, [hours, userId, today]);

  return {
    ...monthlyStats,
    todayHours,
    currentMonth,
    today,
  };
};
