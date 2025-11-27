import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';

interface EarningsDetailsModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  year: string;
}

export default function EarningsDetailsModal({ open, onClose, month, year }: EarningsDetailsModalProps) {
  const { user } = useUser();
  const { hours, processes } = useData();

  const monthStr = `${year}-${month}`;
  const userHours = hours.filter(h =>
    h.userId === user?.id && h.date && h.date.startsWith(monthStr)
  );
  const userProcesses = processes.filter(p =>
    p.userId === user?.id && p.date && p.date.startsWith(monthStr)
  );

  const hourlyTotal = userHours.reduce((sum, h) => sum + h.salary, 0);
  const processesTotal = userProcesses.reduce((sum, p) => sum + p.salary, 0);
  const totalEarnings = hourlyTotal + processesTotal;

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
            <span className="truncate">💰 Заробіток - {months[parseInt(month) - 1]} {year.padStart(4, '0')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Загальний заробіток */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm opacity-80">Загальний Заробіток</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">₴{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Розбивка */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
              <p className="text-[10px] sm:text-xs opacity-80">За Години</p>
              <p className="text-xl sm:text-2xl font-bold">₴{hourlyTotal.toLocaleString()}</p>
            </Card>
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
              <p className="text-[10px] sm:text-xs opacity-80">За Процеси</p>
              <p className="text-xl sm:text-2xl font-bold">₴{processesTotal.toLocaleString()}</p>
            </Card>
          </div>

          {/* Деталі по годинах */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              ⏰ Заробіток за Години
            </h3>
            {userHours.length === 0 ? (
              <p className="text-center text-slate-500 text-sm sm:text-base py-6 sm:py-8">Немає записів годин</p>
            ) : (
              userHours.map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white flex-1 min-w-0">
                          {item.hours} год • {item.object}
                        </p>
                        {item.isBusinessTrip && (
                          <span className="flex-shrink-0 text-xs sm:text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg font-medium">
                            🛫 1.2x
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">📅 {item.date}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                        ₴{item.salary.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Деталі по процесах */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              📋 Заробіток за Процеси
            </h3>
            {userProcesses.length === 0 ? (
              <p className="text-center text-slate-500 text-sm sm:text-base py-6 sm:py-8">Немає записів процесів</p>
            ) : (
              userProcesses.map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1">
                        {item.processName}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        📅 {item.date} • {item.volume} {item.unit} × ₴{item.rate?.toFixed(2) || 0}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                        ₴{item.salary.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
