import { logger } from '@/utils/logger';
import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { getCurrentMonth, getCurrentDate } from '@/utils/calculations';

export const useTeamStats = (teamMemberIds: string[]) => {
  const { hours, processes } = useData();

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const today = useMemo(() => getCurrentDate(), []);

  const stats = useMemo(() => {
    const teamMemberSet = new Set(teamMemberIds);

    logger.info('=== TEAM STATS DEBUG ===');
    logger.info('📊 Team member IDs:', teamMemberIds);
    logger.info('📊 Today:', today);
    logger.info('📊 Current month:', currentMonth);
    logger.info('📊 All hours count:', hours.length);
    logger.info('📊 All processes count:', processes.length);

    // Перевірка кожної години
    if (hours.length > 0) {
      logger.info('🔍 Checking hours:');
      hours.forEach((h, idx) => {
        const inTeam = teamMemberSet.has(h.userId);
        const matchesMonth = h.date && h.date.startsWith(currentMonth);

        // Детальна перевірка ID
        if (idx === 0 && teamMemberIds.length > 0) {
          const firstTeamId = teamMemberIds[0];
          logger.info('🔍 ID Comparison (first hour vs first team member):');
          logger.info('  Hour userId comparison', { userId: h.userId, length: h.userId.length, charCodes: Array.from(h.userId).map(c => c.charCodeAt(0)) });
          logger.info('  Team ID comparison', { teamId: firstTeamId, length: firstTeamId.length, charCodes: Array.from(firstTeamId).map(c => c.charCodeAt(0)) });
          logger.info('  Exact match:', h.userId === firstTeamId);
        }

        logger.info(`  [${idx}] userId="${h.userId}", date=${h.date}, hours=${h.hours}, inTeam=${inTeam}, matchesMonth=${matchesMonth}`);
      });
    }

    if (processes.length > 0) {
      logger.info('🔍 Checking processes:');
      processes.forEach((p, idx) => {
        const inTeam = teamMemberSet.has(p.userId);
        const matchesMonth = p.date && p.date.startsWith(currentMonth);
        logger.info(`  [${idx}] userId=${p.userId}, date=${p.date}, process=${p.processName}, inTeam=${inTeam}, matchesMonth=${matchesMonth}`);
      });
    }

    const activeToday = new Set(
      hours.filter(h => h.date === today && teamMemberSet.has(h.userId)).map(h => h.userId)
    ).size;

    logger.info('👤 Active today:', activeToday);

    const monthHours = hours.filter(h =>
      h.date && h.date.startsWith(currentMonth) && teamMemberSet.has(h.userId)
    );

    const monthProcesses = processes.filter(p =>
      p.date && p.date.startsWith(currentMonth) && teamMemberSet.has(p.userId)
    );

    logger.info('📊 Filtered month hours', { count: monthHours.length, data: monthHours });
    logger.info('📊 Filtered month processes', { count: monthProcesses.length, data: monthProcesses });

    const totalHoursThisMonth = monthHours.reduce((sum, h) => sum + h.hours, 0);
    const hoursEarnings = monthHours.reduce((sum, h) => sum + h.salary, 0);
    const processEarnings = monthProcesses.reduce((sum, p) => sum + p.salary, 0);
    const totalEarnings = hoursEarnings + processEarnings;

    logger.info('💰 Calculated stats:', {
      activeToday,
      totalHoursThisMonth,
      totalEarnings,
      hoursEarnings,
      processEarnings
    });
    logger.info('======================');

    return {
      activeToday,
      totalHoursThisMonth,
      totalEarnings,
      hoursEarnings,
      processEarnings,
    };
  }, [hours, processes, teamMemberIds, currentMonth, today]);

  return {
    ...stats,
    currentMonth,
    today,
  };
};
