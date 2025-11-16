import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, Sheet, Table } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  generateSummary,
  exportMultiSheetExcel,
} from '@/services/dataExport';

interface ExportMenuProps {
  data: Array<Record<string, any>>;
  filename: string;
  reportTitle?: string;
  reportDate?: string;
  disabled?: boolean;
  includesSummary?: boolean;
  summaryFields?: string[];
}

export default function ExportMenu({
  data,
  filename,
  reportTitle,
  reportDate,
  disabled = false,
  includesSummary = false,
  summaryFields = [],
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = exportToExcel(data, {
        filename,
        sheetName: 'Звіт',
      });
      if (result.success) {
        toast({
          title: 'Успішно',
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося експортувати в Excel',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = exportToCSV(data, { filename });
      if (result.success) {
        toast({
          title: 'Успішно',
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося експортувати в CSV',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = exportToPDF(
        {
          title: reportTitle || 'Звіт',
          date: reportDate || new Date().toLocaleDateString('uk-UA'),
          data,
        },
        {
          filename,
          title: reportTitle || 'Звіт',
        }
      );
      if (result.success) {
        toast({
          title: 'Успішно',
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося експортувати в PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMultiSheet = async () => {
    setIsExporting(true);
    try {
      const sheets: Array<{ name: string; data: Array<Record<string, any>> }> = [
        { name: 'Дані', data },
      ];

      if (includesSummary && summaryFields.length > 0) {
        const summary = generateSummary(data, summaryFields);
        sheets.push({
          name: 'Підсумок',
          data: [summary],
        });
      }

      const result = exportMultiSheetExcel(sheets, filename);
      if (result.success) {
        toast({
          title: 'Успішно',
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося експортувати Excel',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isExporting || data.length === 0}
          className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Експортування...' : 'Експортувати'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Формат експорту</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
          <Sheet className="w-4 h-4 mr-2" />
          <span>Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <Table className="w-4 h-4 mr-2" />
          <span>CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
          <FileText className="w-4 h-4 mr-2" />
          <span>PDF</span>
        </DropdownMenuItem>
        {includesSummary && summaryFields.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportMultiSheet} disabled={isExporting}>
              <Sheet className="w-4 h-4 mr-2" />
              <span>Excel + Підсумок</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
