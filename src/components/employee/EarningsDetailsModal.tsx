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
    h.userId === user?.id && h.date.startsWith(monthStr)
  );
  const userProcesses = processes.filter(p =>
    p.userId === user?.id && p.date.startsWith(monthStr)
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Заробіток - {months[parseInt(month) - 1]} {year.padStart(4, '0')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Загальний заробіток */}
          <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Загальний Заробіток</p>
                <p className="text-3xl font-bold">₴{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Розбивка */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
              <p className="text-xs opacity-80">За Години</p>
              <p className="text-2xl font-bold">₴{hourlyTotal.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
              <p className="text-xs opacity-80">За Процеси</p>
              <p className="text-2xl font-bold">₴{processesTotal.toLocaleString()}</p>
            </Card>
          </div>

          {/* Деталі по годинах */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Заробіток за Години
            </h3>
            {userHours.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Немає записів годин</p>
            ) : (
              userHours.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {item.hours} год • {item.object}
                        {item.isBusinessTrip && (
                          <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                            Відрядження 1.2x
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
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
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Заробіток за Процеси
            </h3>
            {userProcesses.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Немає записів процесів</p>
            ) : (
              userProcesses.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {item.processName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.date} • {item.volume} {item.unit} × ₴{item.rate?.toFixed(2) || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
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
