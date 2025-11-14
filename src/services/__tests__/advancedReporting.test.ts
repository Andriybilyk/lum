import { describe, it, expect } from 'vitest';
import { AdvancedReportingService } from '../advancedReporting';
import { Hours, Process } from '@/utils/validation';

describe('AdvancedReportingService', () => {
  const service = new AdvancedReportingService();

  const mockHours: Hours[] = [
    {
      id: '1',
      userId: 'user1',
      date: '2024-11-11',
      hours: 8,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    },
    {
      id: '2',
      userId: 'user1',
      date: '2024-11-12',
      hours: 10,
      object: 'Project B',
      isBusinessTrip: true,
      salary: 1500,
    },
    {
      id: '3',
      userId: 'user1',
      date: '2024-11-13',
      hours: 8,
      object: 'Project A',
      isBusinessTrip: false,
      salary: 1200,
    },
  ];

  const mockProcesses: Process[] = [
    {
      id: '1',
      userId: 'user1',
      date: '2024-11-11',
      processName: 'Feature Development',
      object: 'Project A',
      volume: 100,
      unit: 'lines of code',
      rate: 50,
      salary: 5000,
    },
    {
      id: '2',
      userId: 'user2',
      date: '2024-11-12',
      processName: 'Bug Fixes',
      object: 'Project B',
      volume: 50,
      unit: 'lines of code',
      rate: 40,
      salary: 2000,
    },
  ];

  describe('daily stats generation', () => {
    it('should generate daily statistics from hours', () => {
      const stats = service.generateDailyStats(mockHours);

      expect(stats).toHaveLength(3);
      expect(stats[0].date).toBe('2024-11-11');
      expect(stats[0].hours).toBe(8);
      expect(stats[0].salary).toBe(1200);
    });

    it('should aggregate multiple entries for same day', () => {
      const sameDay: Hours[] = [
        {
          id: '1',
          userId: 'user1',
          date: '2024-11-11',
          hours: 4,
          object: 'Project A',
          isBusinessTrip: false,
          salary: 600,
        },
        {
          id: '2',
          userId: 'user1',
          date: '2024-11-11',
          hours: 4,
          object: 'Project B',
          isBusinessTrip: false,
          salary: 600,
        },
      ];

      const stats = service.generateDailyStats(sameDay);

      expect(stats).toHaveLength(1);
      expect(stats[0].hours).toBe(8);
      expect(stats[0].salary).toBe(1200);
    });

    it('should mark business trip if any entry is business trip', () => {
      const stats = service.generateDailyStats(mockHours);
      const nov12 = stats.find((s) => s.date === '2024-11-12');

      expect(nov12?.isBusinessTrip).toBe(true);
    });
  });

  describe('weekly report generation', () => {
    it('should generate weekly report', () => {
      const report = service.generateWeeklyReport(mockHours, '2024-11-11');

      expect(report.weekStart).toBe('2024-11-11');
      expect(report.totalHours).toBe(26);
      expect(report.totalSalary).toBe(3900);
    });

    it('should calculate business trip data', () => {
      const report = service.generateWeeklyReport(mockHours, '2024-11-11');

      expect(report.businessTripHours).toBe(10);
      expect(report.businessTripSalary).toBe(1500);
    });

    it('should calculate average hours per day', () => {
      const report = service.generateWeeklyReport(mockHours, '2024-11-11');

      expect(report.averageHoursPerDay).toBeCloseTo(26 / 3, 1);
    });
  });

  describe('monthly report generation', () => {
    it('should generate monthly report', () => {
      const report = service.generateMonthlyReport(mockHours, '2024-11');

      expect(report.month).toBe('2024-11');
      expect(report.totalHours).toBe(26);
      expect(report.totalSalary).toBe(3900);
    });

    it('should calculate overtime', () => {
      const longHours: Hours[] = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        userId: 'user1',
        date: `2024-11-${String((i % 30) + 1).padStart(2, '0')}`,
        hours: 8,
        object: 'Project',
        isBusinessTrip: false,
        salary: 1200,
      }));

      const report = service.generateMonthlyReport(longHours, '2024-11');

      expect(report.overtimeHours).toBeGreaterThan(0);
    });

    it('should include weekly reports', () => {
      const report = service.generateMonthlyReport(mockHours, '2024-11');

      expect(Array.isArray(report.weeklyReports)).toBe(true);
    });
  });

  describe('team productivity metrics', () => {
    it('should calculate team productivity metrics', () => {
      const metrics = service.calculateTeamProductivityMetrics(
        mockProcesses,
        'user1',
        'John Doe'
      );

      expect(metrics.teamMemberId).toBe('user1');
      expect(metrics.memberName).toBe('John Doe');
      expect(metrics.totalProcesses).toBe(1);
      expect(metrics.totalEarnings).toBe(5000);
    });

    it('should calculate completion rate', () => {
      const metrics = service.calculateTeamProductivityMetrics(
        mockProcesses,
        'user1',
        'John Doe'
      );

      expect(metrics.processCompletionRate).toBe(100);
    });
  });

  describe('CSV export', () => {
    it('should export data to CSV format', () => {
      const data = [
        { name: 'John', hours: 8, salary: 1200 },
        { name: 'Jane', hours: 10, salary: 1500 },
      ];

      const csv = service.exportToCSV(data, 'report.csv');

      expect(csv).toContain('name,hours,salary');
      expect(csv).toContain('John');
      expect(csv).toContain('Jane');
    });

    it('should handle CSV with commas in values', () => {
      const data = [{ name: 'Smith, John', project: 'Project A' }];

      const csv = service.exportToCSV(data, 'report.csv');

      expect(csv).toContain('"Smith, John"');
    });

    it('should return empty string for empty data', () => {
      const csv = service.exportToCSV([], 'report.csv');

      expect(csv).toBe('');
    });
  });

  describe('HTML export', () => {
    it('should generate HTML report', () => {
      const report = service.generateMonthlyReport(mockHours, '2024-11');
      const html = service.generateReportHTML(report);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('2024-11');
      expect(html).toContain('Total Hours');
    });

    it('should include summary data in HTML', () => {
      const report = service.generateMonthlyReport(mockHours, '2024-11');
      const html = service.generateReportHTML(report);

      expect(html).toContain('Regular Hours');
      expect(html).toContain('Overtime Hours');
      expect(html).toContain('Business Trip Hours');
    });
  });
});
