import { logger } from '@/utils/logger';
import { Hours, Process } from '@/utils/validation';

export interface DailyStats {
  date: string;
  hours: number;
  salary: number;
  isBusinessTrip: boolean;
  object: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalSalary: number;
  businessTripHours: number;
  businessTripSalary: number;
  dailyStats: DailyStats[];
  averageHoursPerDay: number;
}

export interface MonthlyReport {
  month: string;
  totalHours: number;
  totalSalary: number;
  businessTripHours: number;
  businessTripSalary: number;
  overtimeHours: number;
  overtimeSalary: number;
  weeklyReports: WeeklyReport[];
}

export interface TeamProductivityMetrics {
  teamMemberId: string;
  memberName: string;
  totalHours: number;
  totalProcesses: number;
  averageHourlyRate: number;
  totalEarnings: number;
  processCompletionRate: number;
}

export class AdvancedReportingService {
  generateDailyStats(hours: Hours[]): DailyStats[] {
    const statsMap = new Map<string, DailyStats>();

    for (const hour of hours) {
      const existing = statsMap.get(hour.date);

      if (existing) {
        existing.hours += hour.hours;
        existing.salary += hour.salary;
        if (hour.isBusinessTrip) {
          existing.isBusinessTrip = true;
        }
      } else {
        statsMap.set(hour.date, {
          date: hour.date,
          hours: hour.hours,
          salary: hour.salary,
          isBusinessTrip: hour.isBusinessTrip || false,
          object: hour.object,
        });
      }
    }

    return Array.from(statsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  generateWeeklyReport(hours: Hours[], weekStart: string): WeeklyReport {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const weekEnd = weekEndDate.toISOString().split('T')[0];

    const weekHours = hours.filter((h) => h.date >= weekStart && h.date <= weekEnd);

    const dailyStats = this.generateDailyStats(weekHours);
    const totalHours = weekHours.reduce((sum, h) => sum + h.hours, 0);
    const totalSalary = weekHours.reduce((sum, h) => sum + h.salary, 0);
    const businessTripData = weekHours.filter((h) => h.isBusinessTrip);
    const businessTripHours = businessTripData.reduce((sum, h) => sum + h.hours, 0);
    const businessTripSalary = businessTripData.reduce((sum, h) => sum + h.salary, 0);

    return {
      weekStart,
      weekEnd,
      totalHours,
      totalSalary,
      businessTripHours,
      businessTripSalary,
      dailyStats,
      averageHoursPerDay: dailyStats.length > 0 ? totalHours / dailyStats.length : 0,
    };
  }

  generateMonthlyReport(hours: Hours[], month: string): MonthlyReport {
    const [year, monthNum] = month.split('-');
    const monthStart = `${year}-${monthNum}-01`;
    const monthEndDate = new Date(parseInt(year), parseInt(monthNum), 0);
    const monthEnd = monthEndDate.toISOString().split('T')[0];

    const monthHours = hours.filter((h) => h.date >= monthStart && h.date <= monthEnd);

    const weeklyReports: WeeklyReport[] = [];
    let currentWeekStart = new Date(monthStart);

    while (currentWeekStart.toISOString().split('T')[0] <= monthEnd) {
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];
      const weekReport = this.generateWeeklyReport(monthHours, weekStartStr);

      if (weekReport.totalHours > 0) {
        weeklyReports.push(weekReport);
      }

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    const totalHours = monthHours.reduce((sum, h) => sum + h.hours, 0);
    const totalSalary = monthHours.reduce((sum, h) => sum + h.salary, 0);
    const businessTripData = monthHours.filter((h) => h.isBusinessTrip);
    const businessTripHours = businessTripData.reduce((sum, h) => sum + h.hours, 0);
    const businessTripSalary = businessTripData.reduce((sum, h) => sum + h.salary, 0);

    const overtimeHours = Math.max(0, totalHours - 160);
    const overtimeSalary =
      overtimeHours > 0
        ? (totalSalary / totalHours) * overtimeHours * 1.5
        : 0;

    return {
      month,
      totalHours,
      totalSalary,
      businessTripHours,
      businessTripSalary,
      overtimeHours,
      overtimeSalary,
      weeklyReports,
    };
  }

  calculateTeamProductivityMetrics(
    processes: Process[],
    teamMemberId: string,
    memberName: string
  ): TeamProductivityMetrics {
    const memberProcesses = processes.filter((p) => p.userId === teamMemberId);

    const totalProcesses = memberProcesses.length;
    const completedProcesses = memberProcesses.filter(
      (p) => p.volume > 0 && p.rate > 0
    ).length;
    const totalEarnings = memberProcesses.reduce((sum, p) => sum + p.salary, 0);

    const totalVolume = memberProcesses.reduce((sum, p) => sum + p.volume, 0);
    const totalRate = memberProcesses.reduce((sum, p) => sum + p.rate, 0);
    const averageHourlyRate =
      completedProcesses > 0 ? totalRate / completedProcesses : 0;

    return {
      teamMemberId,
      memberName,
      totalHours: totalVolume,
      totalProcesses,
      averageHourlyRate,
      totalEarnings,
      processCompletionRate:
        totalProcesses > 0 ? (completedProcesses / totalProcesses) * 100 : 0,
    };
  }

  exportToCSV(data: any[], filename: string): string {
    if (data.length === 0) {
      logger.warn('Cannot export empty data');
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      })
    );

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    logger.info('CSV export generated', { filename, rowCount: data.length });

    return csv;
  }

  generateReportHTML(report: MonthlyReport): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monthly Report - ${report.month}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background-color: #f0f0f0; padding: 10px; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .total-row { font-weight: bold; background-color: #f9f9f9; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Monthly Report: ${report.month}</h1>
    <p>Total Hours: ${report.totalHours}</p>
    <p>Total Salary: ₴${report.totalSalary.toFixed(2)}</p>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Regular Hours</td>
        <td>${(report.totalHours - report.overtimeHours).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Overtime Hours</td>
        <td>${report.overtimeHours.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Business Trip Hours</td>
        <td>${report.businessTripHours.toFixed(2)}</td>
      </tr>
    </table>
  </div>
</body>
</html>
    `;

    return html;
  }
}

export const advancedReportingService = new AdvancedReportingService();
