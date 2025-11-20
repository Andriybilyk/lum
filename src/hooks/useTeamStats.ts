import { logger } from '@/utils/logger';
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { getCurrentMonth, getCurrentDate } from '@/utils/calculations';
import { isDevelopment } from '@/utils/dataHelpers';

export const useTeamStats = (teamMemberIds: string[]) => {
  const { hours, processes } = useData();

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const today = useMemo(() => getCurrentDate(), []);

  // Memoize team member set to avoid recreating on every render
  const teamMemberSet = useMemo(() => new Set(teamMemberIds), [teamMemberIds]);

  const stats = useMemo(() => {
    // Only log in development mode
    if (isDevelopment()) {
      logger.debug('📊 Team stats calculation', {
        teamCount: teamMemberIds.length,
        hoursCount: hours.length,
        processesCount: processes.length,
      });
    }

    // Filter hours and processes for team members in current month
    const monthHours = hours.filter(h =>
      h.date && h.date.startsWith(currentMonth) && teamMemberSet.has(h.userId)
    );

    const monthProcesses = processes.filter(p =>
      p.date && p.date.startsWith(currentMonth) && teamMemberSet.has(p.userId)
    );

    // Calculate active today (unique user IDs who logged hours today)
    const activeToday = new Set(
      hours.filter(h => h.date === today && teamMemberSet.has(h.userId)).map(h => h.userId)
    ).size;

    // Calculate totals
    const totalHoursThisMonth = monthHours.reduce((sum, h) => sum + h.hours, 0);
    const hoursEarnings = monthHours.reduce((sum, h) => sum + h.salary, 0);
    const processEarnings = monthProcesses.reduce((sum, p) => sum + p.salary, 0);
    const totalEarnings = hoursEarnings + processEarnings;

    if (isDevelopment()) {
      logger.debug('💰 Team stats results:', {
        activeToday,
        totalHoursThisMonth,
        totalEarnings,
      });
    }

    return {
      activeToday,
      totalHoursThisMonth,
      totalEarnings,
      hoursEarnings,
      processEarnings,
    };
  }, [hours, processes, teamMemberSet, currentMonth, today]);

  return {
    ...stats,
    currentMonth,
    today,
  };
};
