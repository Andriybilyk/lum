import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Clock, TrendingUp, Calendar, Briefcase, Edit2, Trash2, Check, X, Download } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { exportEmployeeReport } from '@/services/reportExport';

interface EmployeeReportDetailsModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  month: string;
}

export default function EmployeeReportDetailsModal({
  open,
  onClose,
  employeeId,
  employeeName,
  month
}: EmployeeReportDetailsModalProps) {
  const { getEmployeeReport, users, updateHours, updateProcess, deleteHours, deleteProcess } = useData();
  const { toast } = useToast();

  const employee = users.find(u => u.id === employeeId);

  const [editingHour, setEditingHour] = useState<string | null>(null);
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [editHourData, setEditHourData] = useState({ hours: 0 });
  const [editProcessData, setEditProcessData] = useState({ volume: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const report = getEmployeeReport(employeeId, month);

  const hoursEarnings = report.hours.reduce((sum, h) => sum + h.earnings, 0);
  const processEarnings = report.processes.reduce((sum, p) => sum + p.earnings, 0);

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const [year, monthNum] = month.split('-');
  const monthName = monthNames[parseInt(monthNum) - 1];

  const handleEditHour = (hourId: string, currentHours: number, date: string, object: string, hourlyRate: number, isBusinessTrip: boolean) => {
    setEditingHour(hourId);
    setEditHourData({ hours: currentHours });
  };

  const handleSaveHour = async (hourId: string, date: string, object: string, hourlyRate: number, isBusinessTrip: boolean) => {
    setIsLoading(true);
    try {
      const salary = editHourData.hours * hourlyRate * (isBusinessTrip ? 1.2 : 1);

      await updateHours(hourId, {
        date,
        hours: editHourData.hours,
        object,
        isBusinessTrip,
        salary
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditingHour(null);

      toast({
        title: 'Успішно',
        description: 'Запис годин оновлено та синхронізовано'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHour = async (hourId: string) => {
    setIsLoading(true);
    try {
      await deleteHours(hourId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Успішно',
        description: 'Запис видалено та синхронізовано'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProcess = (processId: string, currentVolume: number) => {
    setEditingProcess(processId);
    setEditProcessData({ volume: currentVolume });
  };

  const handleSaveProcess = async (processId: string, date: string, processName: string, object: string, unit: string, rate: number) => {
    setIsLoading(true);
    try {
      const salary = editProcessData.volume * rate;

      await updateProcess(processId, {
        date,
        processName,
        object,
        volume: editProcessData.volume,
        unit,
        rate,
        salary
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditingProcess(null);

      toast({
        title: 'Успішно',
        description: 'Запис процесу оновлено та синхронізовано'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProcess = async (processId: string) => {
    setIsLoading(true);
    try {
      await deleteProcess(processId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Успішно',
        description: 'Запис видалено та синхронізовано'
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити запис',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await exportEmployeeReport(
        {
          employeeId,
          employeeName,
          hourlyRate: employee?.hourlyRate || 0,
          hours: report.hours.map(h => ({
            date: h.date,
            object: h.object,
            hours: h.hours,
            businessTrip: h.businessTrip,
            earnings: h.earnings
          })),
          processes: report.processes.map(p => ({
            date: p.date,
            name: p.name,
            object: p.object || '',
            volume: p.volume,
            unit: p.unit,
            rate: p.rate,
            earnings: p.earnings
          }))
        },
        month
      );

      toast({
        title: 'Успішно',
        description: `Звіт "${employeeName}" експортовано в Google Sheets`
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося експортувати звіт',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Звіт: {employeeName} - {monthName} {year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Загальна статистика */}
          <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Загальний Заробіток</p>
                <p className="text-3xl font-bold">₴{report.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Розбивка по типах */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
              <Clock className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-xs opacity-80">Годин</p>
              <p className="text-2xl font-bold">{report.totalHours.toFixed(1)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-indigo-500 to-blue-400 text-white">
              <DollarSign className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-xs opacity-80">За Години</p>
              <p className="text-xl font-bold">₴{hoursEarnings.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
              <Briefcase className="w-4 h-4 mb-1 opacity-80" />
              <p className="text-xs opacity-80">За Процеси</p>
              <p className="text-xl font-bold">₴{processEarnings.toLocaleString()}</p>
            </Card>
          </div>

          {/* Деталі по годинах */}
          {report.hours.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Відпрацьовані Години ({report.hours.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.hours.map((item) => (
                  <Card key={item.id} className="p-3">
                    {editingHour === item.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Години</Label>
                            <Input
                              type="number"
                              value={editHourData.hours}
                              onChange={(e) => setEditHourData({ hours: parseFloat(e.target.value) })}
                              className="h-8 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Заробіток</Label>
                            <Input
                              type="text"
                              value={`₴${(editHourData.hours * (employee?.hourlyRate || 0) * (item.businessTrip ? 1.2 : 1)).toFixed(2)}`}
                              readOnly
                              className="h-8 mt-1 bg-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveHour(item.id, item.date, item.object, employee?.hourlyRate || 0, item.businessTrip)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Зберегти
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingHour(null)}
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Скасувати
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {item.object}
                            </p>
                            {item.businessTrip && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                                Відрядження
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.date).toLocaleDateString('uk-UA')}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.hours} год
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ₴{item.earnings.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditHour(item.id, item.hours, item.date, item.object, employee?.hourlyRate || 0, item.businessTrip)}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHour(item.id)}
                            disabled={isLoading}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Деталі по процесах */}
          {report.processes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Виконані Процеси ({report.processes.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.processes.map((item) => (
                  <Card key={item.id} className="p-3">
                    {editingProcess === item.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Обсяг</Label>
                            <Input
                              type="number"
                              value={editProcessData.volume}
                              onChange={(e) => setEditProcessData({ volume: parseFloat(e.target.value) })}
                              className="h-8 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Заробіток</Label>
                            <Input
                              type="text"
                              value={`₴${(editProcessData.volume * item.rate).toFixed(2)}`}
                              readOnly
                              className="h-8 mt-1 bg-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveProcess(item.id, item.date, item.name, item.object || '', item.unit, item.rate)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Зберегти
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingProcess(null)}
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Скасувати
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.date).toLocaleDateString('uk-UA')}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {item.volume} {item.unit} × ₴{item.rate.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              ₴{item.earnings.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProcess(item.id, item.volume)}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProcess(item.id)}
                            disabled={isLoading}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Якщо немає даних */}
          {report.hours.length === 0 && report.processes.length === 0 && (
            <Card className="p-6">
              <p className="text-center text-slate-500">
                Немає даних за обраний місяць
              </p>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleExportReport}
              disabled={isExporting || (report.hours.length === 0 && report.processes.length === 0)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Експортування...' : 'Експортувати'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Закрити
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
