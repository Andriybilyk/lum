import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Clock, Briefcase, DollarSign } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import ExportMenu from '@/components/export/ExportMenu';

export default function EmployeeReports() {
  const { user } = useUser();
  const { getEmployeeReport } = useData();
  const [selectedMonth, setSelectedMonth] = useState('2024-01');

  const report = useMemo(() => {
    return user ? getEmployeeReport(user.id, selectedMonth) : { hours: [], processes: [], totalHours: 0, totalEarnings: 0 };
  }, [user, selectedMonth, getEmployeeReport]);

  const hourEarnings = report.hours.reduce((sum, h) => sum + h.earnings, 0);
  const processEarnings = report.processes.reduce((sum, p) => sum + p.earnings, 0);

  const exportData = useMemo(() => {
    return [
      ...report.hours.map(h => ({
        Дата: h.date,
        Об_єкт: h.object,
        Тип: 'Години',
        Кількість: h.hours,
        Відрядження: h.businessTrip ? 'Так' : 'Ні',
        Заробіток: h.earnings,
      })),
      ...report.processes.map(p => ({
        Дата: p.date,
        Об_єкт: p.name,
        Тип: 'Процес',
        Кількість: p.volume,
        Одиниця: p.unit,
        Ставка: p.rate,
        Заробіток: p.earnings,
      })),
    ];
  }, [report]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          📊 Звіти
        </h2>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">Оберіть Місяць</h3>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
            <Clock className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{report.totalHours.toFixed(1)}</p>
            <p className="text-xs opacity-80">Годин</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
            <Briefcase className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{report.processes.length}</p>
            <p className="text-xs opacity-80">Процесів</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
            <DollarSign className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-2xl font-bold">₴{(report.totalEarnings / 1000).toFixed(1)}k</p>
            <p className="text-xs opacity-80">Заробіток</p>
          </Card>
        </div>

        <Tabs defaultValue="hours" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hours">Години</TabsTrigger>
            <TabsTrigger value="processes">Процеси</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Відпрацьовані Години
              </h4>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₴{hourEarnings.toFixed(2)}
              </p>
            </div>
            {report.hours.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-slate-500">Немає записів за цей місяць</p>
              </Card>
            ) : (
              report.hours.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {entry.object}
                        {entry.businessTrip && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            Відрядження 1.2x
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                        {entry.hours} год
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₴{entry.earnings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="processes" className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Виконані Процеси
              </h4>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₴{processEarnings.toFixed(2)}
              </p>
            </div>
            {report.processes.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-slate-500">Немає за��исів за цей місяць</p>
              </Card>
            ) : (
              report.processes.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{entry.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                        {entry.volume} {entry.unit} × ₴{entry.rate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₴{entry.earnings}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex gap-2">
        <ExportMenu
          data={exportData}
          filename={`employee-report-${selectedMonth}`}
          reportTitle={`Звіт ${user?.name || 'Працівника'} за ${selectedMonth}`}
          reportDate={selectedMonth}
          disabled={exportData.length === 0}
          includesSummary={true}
          summaryFields={['Кількість', 'Заробіток']}
        />
      </div>
    </div>
  );
}