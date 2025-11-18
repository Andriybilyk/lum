import { WORK_HOURS } from './constants';
import type { Hours, Process } from '../types';

export interface EarningsCalculationParams {
  hours: number;
  hourlyRate: number;
  hoursWorkedToday: number;
  isBusinessTrip: boolean;
}

export interface EarningsCalculationResult {
  total: number;
  normalHours: number;
  overtimeHours: number;
  baseCoefficient: number;
}

export const calculateEarnings = ({
  hours,
  hourlyRate,
  hoursWorkedToday,
  isBusinessTrip,
}: EarningsCalculationParams): EarningsCalculationResult => {
  if (isNaN(hours) || hours <= 0) {
    return {
      total: 0,
      normalHours: 0,
      overtimeHours: 0,
      baseCoefficient: 1,
    };
  }

  const baseCoefficient = isBusinessTrip ? WORK_HOURS.BUSINESS_TRIP_MULTIPLIER : 1.0;
  const totalHoursToday = hoursWorkedToday + hours;

  let normalHours = hours;
  let overtimeHours = 0;

  if (totalHoursToday > WORK_HOURS.NORMAL_HOURS_LIMIT) {
    const normalLimit = Math.max(0, WORK_HOURS.NORMAL_HOURS_LIMIT - hoursWorkedToday);
    normalHours = Math.min(hours, normalLimit);
    overtimeHours = hours - normalHours;
  }

  const normalEarnings = normalHours * hourlyRate * baseCoefficient;
  const overtimeEarnings =
    overtimeHours * hourlyRate * baseCoefficient * WORK_HOURS.OVERTIME_MULTIPLIER;

  return {
    total: normalEarnings + overtimeEarnings,
    normalHours,
    overtimeHours,
    baseCoefficient,
  };
};

export const calculateMonthlyStats = (
  hours: Hours[],
  processes: Process[],
  userId: string,
  month: string
) => {
  const userHours = hours.filter((h) => h.userId === userId && h.date && h.date.startsWith(month));
  const userProcesses = processes.filter(
    (p) => p.userId === userId && p.date && p.date.startsWith(month)
  );

  const totalHours = userHours.reduce((sum, h) => sum + h.hours, 0);
  const hoursEarnings = userHours.reduce((sum, h) => sum + h.salary, 0);
  const processEarnings = userProcesses.reduce((sum, p) => sum + p.salary, 0);
  const totalEarnings = hoursEarnings + processEarnings;

  return {
    totalHours,
    hoursEarnings,
    processEarnings,
    totalEarnings,
    completedProcesses: userProcesses.length,
  };
};

export const calculateDailyHours = (hours: Hours[], userId: string, date: string): number => {
  return hours
    .filter((h) => h.userId === userId && h.date === date)
    .reduce((sum, h) => sum + h.hours, 0);
};

export const validateHoursInput = (
  hours: number,
  hoursWorkedToday: number
): { valid: boolean; error?: string } => {
  if (hours <= 0) {
    return { valid: false, error: 'Кількість годин має бути більше 0' };
  }

  if (hours % WORK_HOURS.HOUR_STEP !== 0) {
    return { valid: false, error: `Години мають бути кратні ${WORK_HOURS.HOUR_STEP}` };
  }

  const totalHours = hoursWorkedToday + hours;
  if (totalHours > WORK_HOURS.MAX_DAILY_HOURS) {
    return {
      valid: false,
      error: `Максимум ${WORK_HOURS.MAX_DAILY_HOURS} годин на день`,
    };
  }

  return { valid: true };
};

export const formatCurrency = (amount: number): string => {
  return `₴${amount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)} год`;
};

export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().slice(0, 10);
};
