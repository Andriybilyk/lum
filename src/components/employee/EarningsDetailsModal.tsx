import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';

interface EarningsDetailsModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  year: string;
}

export default function EarningsDetailsModal({ open, onClose, month, year }: EarningsDetailsModalProps) {
  // Mock data - в реальному додатку це буде з Google Sheets
  const earningsData = {
    hourly: {
      total: 8400,
      items: [
        { date: '15.01.2024', hours: 8, rate: 50, earnings: 400 },
        { date: '16.01.2024', hours: 8, rate: 60, earnings: 480 },
        { date: '17.01.2024', hours: 9, rate: 50, earnings: 450 },
        { date: '18.01.2024', hours: 7.5, rate: 60, earnings: 450 },
      ]
    },
    processes: {
      total: 3600,
      items: [
        { date: '15.01.2024', name: 'Монтаж', earnings: 1500 },
        { date: '18.01.2024', name: 'Фарбування', earnings: 1440 },
        { date: '22.01.2024', name: 'Сантехніка', earnings: 540 },
      ]
    }
  };

  const totalEarnings = earningsData.hourly.total + earningsData.processes.total;

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
            Заробіток - {months[parseInt(month)]} {year}
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
              <p className="text-2xl font-bold">₴{earningsData.hourly.total}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
              <p className="text-xs opacity-80">За Процеси</p>
              <p className="text-2xl font-bold">₴{earningsData.processes.total}</p>
            </Card>
          </div>

          {/* Деталі по годинах */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Заробіток за Години
            </h3>
            {earningsData.hourly.items.map((item, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {item.hours} год × ₴{item.rate}/год
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ₴{item.earnings}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Деталі по процесах */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Заробіток за Процеси
            </h3>
            {earningsData.processes.items.map((item, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ₴{item.earnings}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
