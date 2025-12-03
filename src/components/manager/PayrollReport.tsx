import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, DollarSign, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PayrollModalProps {
  open: boolean;
  onClose: () => void;
}

interface PayrollEntry {
  userId: string;
  userName: string;
  level: string;
  hourlyRate: number;

  // Деталі
  regularHours: number;
  businessTripHours: number;
  processEarnings: number;

  // Підсумки
  totalSalary: number;

  // Статус
  paymentStatus: 'pending' | 'paid';
}

export default function PayrollReport({ open, onClose }: PayrollModalProps) {
  const { users, hours, processes } = useData();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, 'pending' | 'paid'>>({});

  // Розрахунок зарплат
  const payrollData = useMemo(() => {
    const entries: PayrollEntry[] = [];
    const [year, month] = selectedMonth.split('-');
    const periodStart = `${year}-${month}-01`;
    const periodEnd = `${year}-${month}-31`;

    users.filter(u => u.role === 'employee').forEach(user => {
      // Години
      const userHours = hours.filter(h =>
        h.userId === user.id &&
        h.date >= periodStart &&
        h.date <= periodEnd
      );

      const regularHours = userHours
        .filter(h => !h.isBusinessTrip)
        .reduce((sum, h) => sum + h.hours, 0);

      const businessTripHours = userHours
        .filter(h => h.isBusinessTrip)
        .reduce((sum, h) => sum + h.hours, 0);

      // Процеси
      const userProcesses = processes.filter(p =>
        p.userId === user.id &&
        p.date >= periodStart &&
        p.date <= periodEnd
      );
      const processEarnings = userProcesses.reduce((sum, p) => sum + p.salary, 0);

      // Розрахунки (без податків і понаднормових - неофіційно)
      const regularPay = regularHours * user.hourlyRate;
      const businessTripPay = businessTripHours * user.hourlyRate * 1.2; // +20% за відрядження

      const grossSalary = regularPay + businessTripPay + processEarnings;
      const netSalary = grossSalary; // Без податків

      if (grossSalary > 0) {
        entries.push({
          userId: user.id,
          userName: user.name,
          level: user.level,
          hourlyRate: user.hourlyRate,
          regularHours,
          businessTripHours,
          processEarnings,
          totalSalary: netSalary,
          paymentStatus: paymentStatuses[user.id] || 'pending'
        });
      }
    });

    return entries.sort((a, b) => b.totalSalary - a.totalSalary);
  }, [users, hours, processes, selectedMonth, paymentStatuses]);

  // Підсумки
  const totals = useMemo(() => {
    return {
      totalSalary: payrollData.reduce((sum, e) => sum + e.totalSalary, 0),
      totalPaid: payrollData.filter(e => e.paymentStatus === 'paid').reduce((sum, e) => sum + e.totalSalary, 0),
      employeeCount: payrollData.length,
      paidCount: payrollData.filter(e => e.paymentStatus === 'paid').length
    };
  }, [payrollData]);

  const handleMarkAsPaid = (userId: string) => {
    setPaymentStatuses(prev => ({
      ...prev,
      [userId]: 'paid'
    }));
    toast({
      title: 'Успішно',
      description: 'Виплату позначено як виконану'
    });
  };

  const handleMarkAllAsPaid = () => {
    const newStatuses: Record<string, 'pending' | 'paid'> = {};
    payrollData.forEach(entry => {
      newStatuses[entry.userId] = 'paid';
    });
    setPaymentStatuses(newStatuses);
    toast({
      title: 'Успішно',
      description: `Всі виплати (${payrollData.length}) позначено як виконані`
    });
  };

  const exportToExcel = () => {
    const data = payrollData.map(entry => ({
      'ПІБ': entry.userName,
      'Рівень': entry.level,
      'Ставка': entry.hourlyRate,
      'Звичайні год': entry.regularHours,
      'Відрядж.': entry.businessTripHours,
      'Процеси': entry.processEarnings,
      'До виплати': entry.totalSalary,
      'Статус': entry.paymentStatus === 'paid' ? 'Виплачено' : 'Очікує'
    }));

    // Додаємо підсумки
    data.push({
      'ПІБ': 'РАЗОМ:',
      'Рівень': '',
      'Ставка': null as any,
      'Звичайні год': null as any,
      'Відрядж.': null as any,
      'Процеси': null as any,
      'До виплати': totals.totalSalary,
      'Статус': `${totals.paidCount}/${totals.employeeCount}`
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Зарплатна відомість');

    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('uk-UA', { month: 'long' });

    XLSX.writeFile(wb, `Зарплатна_відомість_${monthName}_${year}.xlsx`);

    toast({
      title: 'Експортовано',
      description: 'Файл Excel збережено'
    });
  };

  const exportPayslip = (entry: PayrollEntry) => {
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('uk-UA', { month: 'long' });

    const content = `
═══════════════════════════════════════════════════════
         РОЗРАХУНКОВИЙ ЛИСТ №${month}/${year}
═══════════════════════════════════════════════════════

Працівник: ${entry.userName}
Посада: ${entry.level}
Ставка: ${entry.hourlyRate} грн/год
Період: ${monthName} ${year}

───────────────────────────────────────────────────────
НАРАХУВАННЯ:
───────────────────────────────────────────────────────
${entry.regularHours > 0 ? `Звичайні години (${entry.regularHours} год × ${entry.hourlyRate} грн)
    ${(entry.regularHours * entry.hourlyRate).toFixed(2)} грн\n` : ''}${entry.businessTripHours > 0 ? `Відрядження (${entry.businessTripHours} год × ${(entry.hourlyRate * 1.2).toFixed(0)} грн)
    ${(entry.businessTripHours * entry.hourlyRate * 1.2).toFixed(2)} грн\n` : ''}${entry.processEarnings > 0 ? `Процеси (згідно актів)
    ${entry.processEarnings.toFixed(2)} грн\n` : ''}───────────────────────────────────────────────────────

═══════════════════════════════════════════════════════
ДО ВИПЛАТИ:                     ${entry.totalSalary.toFixed(2)} грн
═══════════════════════════════════════════════════════

Підпис працівника: _______________  Дата: ____________
Підпис роботодавця: _______________  Дата: ____________
═══════════════════════════════════════════════════════
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Розрахунковий_лист_${entry.userName}_${month}_${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Експортовано',
      description: `Розрахунковий лист для ${entry.userName}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Зарплатна Відомість
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Вибір періоду */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label>Період</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Експорт Excel
              </Button>
            </div>
          </div>

          {/* Підсумки */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Працівників</div>
              <div className="text-2xl font-bold text-blue-600">{totals.employeeCount}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Виплачено: {totals.paidCount}
              </div>
            </Card>

            <Card className="p-3 bg-green-50 dark:bg-green-950/20">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Всього</div>
              <div className="text-2xl font-bold text-green-600">{totals.totalSalary.toFixed(0)}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">грн до виплати</div>
            </Card>

            <Card className="p-3 bg-purple-50 dark:bg-purple-950/20">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Виплачено</div>
              <div className="text-2xl font-bold text-purple-600">{totals.totalPaid.toFixed(0)}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Залишок: {(totals.totalSalary - totals.totalPaid).toFixed(0)} грн
              </div>
            </Card>
          </div>

          {/* Список працівників */}
          <div className="space-y-3">
            {payrollData.length === 0 ? (
              <Card className="p-8">
                <p className="text-center text-slate-500">
                  Немає даних за обраний період
                </p>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">
                    Працівники ({payrollData.length})
                  </Label>
                  {totals.paidCount < totals.employeeCount && (
                    <Button onClick={handleMarkAllAsPaid} size="sm" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Позначити всі як виплачені
                    </Button>
                  )}
                </div>

                {payrollData.map((entry) => (
                  <Card key={entry.userId} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{entry.userName}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {entry.level}
                          </Badge>
                          <Badge
                            variant={entry.paymentStatus === 'paid' ? 'default' : 'outline'}
                            className={entry.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}
                          >
                            {entry.paymentStatus === 'paid' ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Виплачено
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Очікує
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Ставка: {entry.hourlyRate} грн/год
                        </div>
                      </div>
                    </div>

                    {/* Деталі нарахувань */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-3 text-sm space-y-1">
                      {entry.regularHours > 0 && (
                        <div className="flex justify-between">
                          <span>Звичайні: {entry.regularHours} год × {entry.hourlyRate} грн</span>
                          <span className="font-semibold">{(entry.regularHours * entry.hourlyRate).toFixed(0)} грн</span>
                        </div>
                      )}
                      {entry.businessTripHours > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Відрядження: {entry.businessTripHours} год × {(entry.hourlyRate * 1.2).toFixed(0)} грн (+20%)</span>
                          <span className="font-semibold">{(entry.businessTripHours * entry.hourlyRate * 1.2).toFixed(0)} грн</span>
                        </div>
                      )}
                      {entry.processEarnings > 0 && (
                        <div className="flex justify-between text-purple-600">
                          <span>Процеси</span>
                          <span className="font-semibold">{entry.processEarnings.toFixed(0)} грн</span>
                        </div>
                      )}
                      <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg text-green-600">
                          <span>ДО ВИПЛАТИ:</span>
                          <span>{entry.totalSalary.toFixed(0)} грн</span>
                        </div>
                      </div>
                    </div>

                    {/* Дії */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportPayslip(entry)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Розрахунковий лист
                      </Button>
                      {entry.paymentStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkAsPaid(entry.userId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Позначити виплаченим
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
