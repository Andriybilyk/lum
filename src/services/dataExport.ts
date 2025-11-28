/**
 * Data Export Service
 * Handles exporting data to PDF, Excel, and CSV formats
 */

import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

if (pdfFonts && (pdfFonts as any).pdfMake) {
  pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
}

export interface ReportData {
  title: string;
  date: string;
  data: Array<Record<string, any>>;
  columns?: string[];
}

/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = (
  data: Array<Record<string, any>>,
  options: ExportOptions
) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

    // Auto-fit column widths
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.min(
        maxWidth,
        Math.max(key.length, ...(data.map((row) => String(row[key] || '').length) || []))
      ),
    }));
    worksheet['!cols'] = colWidths;

    const filename = `${options.filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return { success: true, message: `Файл ${filename} експортований успішно` };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: 'Помилка при експорті в Excel' };
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (
  data: Array<Record<string, any>>,
  options: ExportOptions
) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const filename = `${options.filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: `Файл ${filename} експортований успішно` };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: 'Помилка при експорті в CSV' };
  }
};

/**
 * Export data to PDF
 */
export const exportToPDF = (
  reportData: ReportData,
  options: ExportOptions
) => {
  try {
    const formatDate = (date: string | Date) => {
      return format(new Date(date), 'dd MMMM yyyy', { locale: uk });
    };

    // Підрахунок підсумків
    const totals: Record<string, number> = {};
    if (reportData.data.length > 0) {
      const numericFields = Object.keys(reportData.data[0]).filter(key => {
        const value = reportData.data[0][key];
        return typeof value === 'number' || (!isNaN(parseFloat(value)) && key !== 'Дата');
      });

      numericFields.forEach(field => {
        totals[field] = reportData.data.reduce((sum, row) => {
          const value = parseFloat(row[field]);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
      });
    }

    const documentDefinition: any = {
      content: [
        {
          text: options.title || reportData.title,
          style: 'header',
        },
        {
          text: `Дата експорту: ${formatDate(new Date())}`,
          style: 'subheader',
          margin: [0, 0, 0, 15],
        },
        {
          text: `Період: ${reportData.date}`,
          style: 'info',
          margin: [0, 0, 0, 20],
        },
        createTable(reportData.data, reportData.columns),
        // Додаємо підсумки якщо є числові поля
        Object.keys(totals).length > 0 && {
          text: 'Підсумки:',
          style: 'summaryHeader',
          margin: [0, 20, 0, 10],
        },
        Object.keys(totals).length > 0 && {
          ul: Object.entries(totals).map(([field, value]) =>
            `${field}: ${value.toLocaleString('uk-UA', { maximumFractionDigits: 2 })}`
          ),
          style: 'summaryBody',
        },
        {
          text: `Експортовано: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`,
          style: 'footer',
          margin: [0, 20, 0, 0],
        },
      ].filter(Boolean),
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          color: '#1e40af',
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          color: '#6b7280',
        },
        info: {
          fontSize: 11,
          color: '#6b7280',
        },
        summaryHeader: {
          fontSize: 14,
          bold: true,
          color: '#1e40af',
        },
        summaryBody: {
          fontSize: 11,
          color: '#374151',
        },
        footer: {
          fontSize: 9,
          color: '#9ca3af',
          alignment: 'right',
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: '#ffffff',
          fillColor: '#1e40af',
          alignment: 'center',
          margin: [5, 5, 5, 5],
        },
        tableBody: {
          fontSize: 10,
          margin: [5, 5, 5, 5],
        },
      },
      defaultStyle: {
        font: 'Helvetica',
      },
      pageMargins: [40, 60, 40, 60],
      pageSize: 'A4',
      pageOrientation: 'landscape', // Змінено на альбомну для кращого відображення таблиць
      footer: function(currentPage: number, pageCount: number) {
        return {
          text: `Сторінка ${currentPage} з ${pageCount}`,
          alignment: 'center',
          fontSize: 9,
          color: '#9ca3af',
          margin: [0, 10, 0, 0],
        };
      },
    };

    const filename = `${options.filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdfMake.createPdf(documentDefinition).download(filename);

    return { success: true, message: `Файл ${filename} експортований успішно` };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: 'Помилка при експорті в PDF' };
  }
};

/**
 * Create PDF table from data
 */
function createTable(data: Array<Record<string, any>>, columns?: string[]): any {
  if (!data || data.length === 0) {
    return {
      table: {
        headerRows: 1,
        widths: ['*'],
        body: [[{ text: 'Немає даних для експорту', style: 'tableBody', alignment: 'center' }]],
      },
      layout: 'lightHorizontalLines',
    };
  }

  const keys = columns || Object.keys(data[0]);
  const headerRow = keys.map((key) => ({
    text: formatHeaderName(key),
    style: 'tableHeader',
  }));

  const bodyRows = data.map((row, index) =>
    keys.map((key) => ({
      text: formatCellValue(row[key]),
      style: 'tableBody',
      fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff', // Альтернативний колір рядків
    }))
  );

  // Автоматичне визначення ширини колонок
  const widths = keys.map((key) => {
    const maxLength = Math.max(
      formatHeaderName(key).length,
      ...data.map((row) => String(formatCellValue(row[key])).length)
    );
    // Обмежуємо ширину від 50 до 120
    return Math.min(Math.max(maxLength * 6, 50), 120);
  });

  return {
    table: {
      headerRows: 1,
      widths: widths.length <= 5 ? widths : Array(keys.length).fill('auto'), // Для великих таблиць використовуємо auto
      body: [headerRow, ...bodyRows],
    },
    layout: {
      hLineWidth: function(i: number, node: any) {
        return i === 0 || i === 1 || i === node.table.body.length ? 2 : 1;
      },
      vLineWidth: function() {
        return 0.5;
      },
      hLineColor: function(i: number) {
        return i === 0 || i === 1 ? '#1e40af' : '#e5e7eb';
      },
      vLineColor: function() {
        return '#e5e7eb';
      },
      paddingLeft: function() { return 8; },
      paddingRight: function() { return 8; },
      paddingTop: function() { return 6; },
      paddingBottom: function() { return 6; },
    },
  };
}

/**
 * Format header names (convert camelCase to readable format)
 */
function formatHeaderName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Format cell values for display
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Так' : 'Ні';
  }

  if (value instanceof Date) {
    return format(value, 'dd.MM.yyyy');
  }

  if (typeof value === 'number') {
    return value.toLocaleString('uk-UA');
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
}

/**
 * Generate summary statistics for reports
 */
export const generateSummary = (
  data: Array<Record<string, any>>,
  numericFields: string[]
) => {
  const summary: Record<string, any> = {};

  numericFields.forEach((field) => {
    const sum = data.reduce((acc, row) => {
      const value = parseFloat(row[field] || 0);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);

    const avg = sum / data.length;
    const max = Math.max(
      ...data.map((row) => {
        const value = parseFloat(row[field] || 0);
        return isNaN(value) ? 0 : value;
      })
    );

    const min = Math.min(
      ...data.map((row) => {
        const value = parseFloat(row[field] || 0);
        return isNaN(value) ? Infinity : value;
      })
    );

    summary[field] = {
      sum: parseFloat(sum.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      count: data.length,
    } as any;
  });

  return summary;
};

/**
 * Export multiple sheets to Excel
 */
export const exportMultiSheetExcel = (
  sheets: Array<{ name: string; data: Array<Record<string, any>> }>,
  filename: string
) => {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);

      // Auto-fit column widths
      const maxWidth = 50;
      const colWidths = Object.keys(sheet.data[0] || {}).map((key) => ({
        wch: Math.min(
          maxWidth,
          Math.max(key.length, ...(sheet.data.map((row) => String(row[key] || '').length) || []))
        ),
      }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    const fullFilename = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fullFilename);

    return { success: true, message: `Файл ${fullFilename} експортований успішно` };
  } catch (error) {
    console.error('Error exporting multi-sheet Excel:', error);
    return { success: false, error: 'Помилка при експорті в Excel' };
  }
};
