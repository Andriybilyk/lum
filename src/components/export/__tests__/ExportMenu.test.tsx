import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExportMenu from '../ExportMenu';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/services/dataExport', () => ({
  exportToExcel: vi.fn(() => ({ success: true, message: 'Файл експортований' })),
  exportToCSV: vi.fn(() => ({ success: true, message: 'Файл експортований' })),
  exportToPDF: vi.fn(() => ({ success: true, message: 'Файл експортований' })),
  generateSummary: vi.fn(() => ({ sum: 100, avg: 50 })),
  exportMultiSheetExcel: vi.fn(() => ({ success: true, message: 'Файл експортований' })),
}));

describe('ExportMenu Component', () => {
  const mockData = [
    { id: '1', name: 'Item 1', value: 100 },
    { id: '2', name: 'Item 2', value: 200 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export button', () => {
    render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle="Test Report"
      />
    );

    expect(screen.getByRole('button', { name: /експортувати/i })).toBeInTheDocument();
  });

  it('should disable button when data is empty', () => {
    render(
      <ExportMenu
        data={[]}
        filename="test-report"
        reportTitle="Test Report"
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeDisabled();
  });

  it('should render with provided props', () => {
    const { container } = render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle="Test Report"
      />
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /експортувати/i })).toBeInTheDocument();
  });

  it('should display tooltip text', () => {
    render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle="Test Report"
        includesSummary={true}
        summaryFields={['value']}
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeVisible();
  });

  it('should disable button when disabled prop is true', () => {
    render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle="Test Report"
        disabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeDisabled();
  });

  it('should handle export with custom report title', () => {
    const customTitle = 'Custom Report Title';
    render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle={customTitle}
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should handle export with summary fields', () => {
    render(
      <ExportMenu
        data={mockData}
        filename="test-report"
        reportTitle="Test Report"
        includesSummary={true}
        summaryFields={['value', 'name']}
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should handle export with all options', () => {
    render(
      <ExportMenu
        data={mockData}
        filename="team-report-2024-11"
        reportTitle="Team Report November 2024"
        reportDate="2024-11"
        disabled={false}
        includesSummary={true}
        summaryFields={['value']}
      />
    );

    const button = screen.getByRole('button', { name: /експортувати/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
