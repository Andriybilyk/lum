import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, TrendingUp, Calendar, Briefcase } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

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
  const { getEmployeeReport } = useData();
  
  const report = getEmployeeReport(employeeId, month);
  
  const hoursEarnings = report.hours.reduce((sum, h) => sum + h.earnings, 0);
  const processEarnings = report.processes.reduce((sum, p) => sum + p.earnings, 0);

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];
  
  const [year, monthNum] = month.split('-');
  const monthName = monthNames[parseInt(monthNum) - 1];

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
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ₴{item.earnings.toLocaleString()}
                        </p>
                      </div>
                    </div>
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
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ₴{item.earnings.toLocaleString()}
                        </p>
                      </div>
                    </div>
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

          <Button variant="outline" onClick={onClose} className="w-full">
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
