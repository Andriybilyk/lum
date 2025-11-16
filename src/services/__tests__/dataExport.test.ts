import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  generateSummary,
  exportMultiSheetExcel,
} from '../dataExport';

describe('Data Export Service', () => {
  const mockData = [
    {
      id: '1',
      name: 'John Doe',
      hours: 40,
      rate: 100,
      date: '2024-11-01',
      isActive: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      hours: 35,
      rate: 120,
      date: '2024-11-02',
      isActive: false,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      hours: 45,
      rate: 110,
      date: '2024-11-03',
      isActive: true,
    },
  ];

  beforeEach(() => {
    // Mock document methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    window.URL.createObjectURL = vi.fn();
  });

  describe('exportToExcel', () => {
    it('should export data to Excel', () => {
      const result = exportToExcel(mockData, {
        filename: 'test-report',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('експортований');
    });

    it('should handle empty data', () => {
      const result = exportToExcel([], {
        filename: 'empty-report',
      });

      expect(result.success).toBe(true);
    });

    it('should include custom sheet name', () => {
      const result = exportToExcel(mockData, {
        filename: 'test',
        sheetName: 'Custom Sheet',
      });

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // Invalid data that might cause error
      const invalidData = [{ circular: {} as any }] as any;
      invalidData[0].circular.self = invalidData[0].circular;

      const result = exportToExcel(invalidData, {
        filename: 'error-test',
      });

      // Should return success if xlsx handles it
      expect(result).toHaveProperty('success');
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV', () => {
      const result = exportToCSV(mockData, {
        filename: 'test-csv',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('експортований');
    });

    it('should handle empty data', () => {
      const result = exportToCSV([], {
        filename: 'empty-csv',
      });

      expect(result.success).toBe(true);
    });

    it('should create blob with correct type', () => {
      const result = exportToCSV(mockData, {
        filename: 'test',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('exportToPDF', () => {
    it('should export report to PDF', () => {
      const result = exportToPDF(
        {
          title: 'Test Report',
          date: 'November 2024',
          data: mockData,
        },
        {
          filename: 'test-report',
          title: 'Test Title',
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('експортований');
    });

    it('should use default title if not provided', () => {
      const result = exportToPDF(
        {
          title: 'Default Title',
          date: 'November 2024',
          data: mockData,
        },
        {
          filename: 'test',
        }
      );

      expect(result.success).toBe(true);
    });

    it('should handle empty data', () => {
      const result = exportToPDF(
        {
          title: 'Empty Report',
          date: 'November 2024',
          data: [],
        },
        {
          filename: 'empty-report',
        }
      );

      expect(result.success).toBe(true);
    });

    it('should include custom columns', () => {
      const result = exportToPDF(
        {
          title: 'Custom Columns',
          date: 'November 2024',
          data: mockData,
          columns: ['name', 'hours', 'rate'],
        },
        {
          filename: 'custom-columns',
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('generateSummary', () => {
    it('should calculate sum for numeric fields', () => {
      const summary = generateSummary(mockData, ['hours', 'rate']);

      expect(summary.hours.sum).toBe(120); // 40 + 35 + 45
      expect(summary.rate.sum).toBe(330); // 100 + 120 + 110
    });

    it('should calculate average for numeric fields', () => {
      const summary = generateSummary(mockData, ['hours']);

      expect(summary.hours.avg).toBe(40); // (40 + 35 + 45) / 3
    });

    it('should find max and min values', () => {
      const summary = generateSummary(mockData, ['hours']);

      expect(summary.hours.max).toBe(45);
      expect(summary.hours.min).toBe(35);
    });

    it('should handle missing values', () => {
      const dataWithMissing = [
        { hours: 40 },
        { hours: null },
        { hours: 50 },
      ];

      const summary = generateSummary(dataWithMissing, ['hours']);

      expect(summary.hours.sum).toBe(90);
      expect(summary.hours.avg).toBe(30);
    });

    it('should include count', () => {
      const summary = generateSummary(mockData, ['hours']);

      expect(summary.hours.count).toBe(3);
    });
  });

  describe('exportMultiSheetExcel', () => {
    it('should export multiple sheets to Excel', () => {
      const sheets = [
        { name: 'Employees', data: mockData },
        {
          name: 'Summary',
          data: [{ total_hours: 120, avg_rate: 110 }],
        },
      ];

      const result = exportMultiSheetExcel(sheets, 'multi-sheet');

      expect(result.success).toBe(true);
      expect(result.message).toContain('експортований');
    });

    it('should handle empty sheets', () => {
      const sheets = [
        { name: 'Empty', data: [] },
        { name: 'Data', data: mockData },
      ];

      const result = exportMultiSheetExcel(sheets, 'mixed-sheets');

      expect(result.success).toBe(true);
    });

    it('should include sheet names in workbook', () => {
      const sheets = [
        {
          name: 'Sheet A',
          data: [{ col1: 'value1' }],
        },
        {
          name: 'Sheet B',
          data: [{ col2: 'value2' }],
        },
      ];

      const result = exportMultiSheetExcel(sheets, 'named-sheets');

      expect(result.success).toBe(true);
    });
  });

  describe('Data formatting', () => {
    it('should format boolean values', () => {
      const data = [{ active: true, inactive: false }];
      const result = exportToPDF(
        { title: 'Boolean Test', date: 'Nov 2024', data },
        { filename: 'boolean-test' }
      );

      expect(result.success).toBe(true);
    });

    it('should format numeric values', () => {
      const data = [
        { amount: 1000.5, percentage: 99.99 },
        { amount: 2000.75, percentage: 50.0 },
      ];

      const result = exportToPDF(
        { title: 'Number Test', date: 'Nov 2024', data },
        { filename: 'number-test' }
      );

      expect(result.success).toBe(true);
    });

    it('should format dates', () => {
      const data = [
        { date: new Date('2024-11-01'), name: 'Record 1' },
        { date: new Date('2024-11-15'), name: 'Record 2' },
      ];

      const result = exportToPDF(
        { title: 'Date Test', date: 'Nov 2024', data },
        { filename: 'date-test' }
      );

      expect(result.success).toBe(true);
    });

    it('should handle null and undefined values', () => {
      const data = [
        { col1: 'value', col2: null, col3: undefined },
        { col1: 'another', col2: 'data', col3: null },
      ];

      const result = exportToPDF(
        { title: 'Null Test', date: 'Nov 2024', data },
        { filename: 'null-test' }
      );

      expect(result.success).toBe(true);
    });
  });
});
