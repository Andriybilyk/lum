import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

interface AnomaliesDetectionProps {
  open: boolean;
  onClose: () => void;
}

interface Anomaly {
  id: string;
  userId: string;
  userName: string;
  type: 'excessive_hours' | 'duplicate' | 'multiple_objects';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details: any;
  date: string;
}

export default function AnomaliesDetection({ open, onClose }: AnomaliesDetectionProps) {
  const { users, hours } = useData();

  const anomalies = useMemo(() => {
    const detected: Anomaly[] = [];

    // 1. Перевірка на занадто багато годин за день (>14)
    const hoursByDay: Record<string, any[]> = {};
    hours.forEach(h => {
      const key = `${h.userId}-${h.date}`;
      if (!hoursByDay[key]) hoursByDay[key] = [];
      hoursByDay[key].push(h);
    });

    Object.entries(hoursByDay).forEach(([key, dayHours]) => {
      const total = dayHours.reduce((sum, h) => sum + h.hours, 0);
      if (total > 14) {
        const user = users.find(u => u.id === dayHours[0].userId);
        detected.push({
          id: `excessive-${key}`,
          userId: dayHours[0].userId,
          userName: user?.name || 'Невідомий',
          type: 'excessive_hours',
          severity: 'high',
          description: `${total} годин за день - можлива помилка`,
          details: {
            date: dayHours[0].date,
            hours: total,
            entries: dayHours.length
          },
          date: dayHours[0].date
        });
      }
    });

    // 2. Дублікати (однакові записи в один день)
    const seen = new Set<string>();
    hours.forEach(h => {
      const signature = `${h.userId}-${h.date}-${h.object}-${h.hours}`;

      hours.forEach(h2 => {
        const signature2 = `${h2.userId}-${h2.date}-${h2.object}-${h2.hours}`;
        if (h.id !== h2.id && signature === signature2 && !seen.has(signature)) {
          const user = users.find(u => u.id === h.userId);
          detected.push({
            id: `duplicate-${h.id}-${h2.id}`,
            userId: h.userId,
            userName: user?.name || 'Невідомий',
            type: 'duplicate',
            severity: 'high',
            description: 'Можливий дублікат запису',
            details: {
              date: h.date,
              object: h.object,
              hours: h.hours,
              count: 2
            },
            date: h.date
          });
          seen.add(signature);
        }
      });
    });

    // 3. Робота на кількох об'єктах в один день
    Object.entries(hoursByDay).forEach(([key, dayHours]) => {
      const objects = new Set(dayHours.map(h => h.object));
      if (objects.size > 1) {
        const user = users.find(u => u.id === dayHours[0].userId);
        detected.push({
          id: `multiple-${key}`,
          userId: dayHours[0].userId,
          userName: user?.name || 'Невідомий',
          type: 'multiple_objects',
          severity: 'medium',
          description: `Робота на ${objects.size} об'єктах в один день`,
          details: {
            date: dayHours[0].date,
            objects: Array.from(objects),
            totalHours: dayHours.reduce((sum, h) => sum + h.hours, 0)
          },
          date: dayHours[0].date
        });
      }
    });

    return detected.sort((a, b) => {
      // Сортуємо за важливістю, потім за датою
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
  }, [hours, users]);

  const stats = useMemo(() => {
    const high = anomalies.filter(a => a.severity === 'high').length;
    const medium = anomalies.filter(a => a.severity === 'medium').length;
    const low = anomalies.filter(a => a.severity === 'low').length;

    return { high, medium, low, total: anomalies.length };
  }, [anomalies]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };

    const labels = {
      high: 'Висока',
      medium: 'Середня',
      low: 'Низька'
    };

    return (
      <Badge className={colors[severity as keyof typeof colors]}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Виявлення Аномалій
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-3 bg-slate-50 dark:bg-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Всього</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">виявлено</div>
            </Card>

            <Card className="p-3 bg-red-50 dark:bg-red-950/20">
              <div className="text-xs text-red-600 dark:text-red-400 mb-1">Висока</div>
              <div className="text-2xl font-bold text-red-600">{stats.high}</div>
              <div className="text-xs text-red-600 dark:text-red-400">термінові</div>
            </Card>

            <Card className="p-3 bg-yellow-50 dark:bg-yellow-950/20">
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Середня</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">перевірити</div>
            </Card>

            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Низька</div>
              <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">інфо</div>
            </Card>
          </div>

          {/* Список аномалій */}
          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-slate-500">
                  <Info className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold text-green-600">Аномалій не виявлено!</p>
                  <p className="text-sm mt-1">Всі записи виглядають коректно</p>
                </div>
              </Card>
            ) : (
              <>
                {stats.high > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Висока Важливість ({stats.high})
                    </h3>
                    {anomalies.filter(a => a.severity === 'high').map(anomaly => (
                      <Card key={anomaly.id} className="p-4 mb-2 border-l-4 border-red-500">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(anomaly.severity)}
                            <div>
                              <div className="font-semibold">{anomaly.userName}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(anomaly.date).toLocaleDateString('uk-UA')}
                              </div>
                            </div>
                          </div>
                          {getSeverityBadge(anomaly.severity)}
                        </div>

                        <div className="ml-8">
                          <p className="text-sm mb-2">{anomaly.description}</p>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs">
                            {anomaly.type === 'excessive_hours' && (
                              <>
                                <div>Дата: {new Date(anomaly.details.date).toLocaleDateString('uk-UA')}</div>
                                <div>Загальна кількість годин: {anomaly.details.hours}</div>
                                <div>Кількість записів: {anomaly.details.entries}</div>
                              </>
                            )}
                            {anomaly.type === 'duplicate' && (
                              <>
                                <div>Об'єкт: {anomaly.details.object}</div>
                                <div>Години: {anomaly.details.hours}</div>
                                <div>Знайдено записів: {anomaly.details.count}</div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            Переглянути записи
                          </Button>
                          <Button size="sm" variant="outline">
                            Виправити
                          </Button>
                          <Button size="sm" variant="ghost">
                            Ігнорувати
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {stats.medium > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Середня Важливість ({stats.medium})
                    </h3>
                    {anomalies.filter(a => a.severity === 'medium').map(anomaly => (
                      <Card key={anomaly.id} className="p-4 mb-2 border-l-4 border-yellow-500">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(anomaly.severity)}
                            <div>
                              <div className="font-semibold">{anomaly.userName}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(anomaly.date).toLocaleDateString('uk-UA')}
                              </div>
                            </div>
                          </div>
                          {getSeverityBadge(anomaly.severity)}
                        </div>

                        <div className="ml-8">
                          <p className="text-sm mb-2">{anomaly.description}</p>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded p-2 text-xs">
                            {anomaly.type === 'multiple_objects' && (
                              <>
                                <div>Об'єкти: {anomaly.details.objects.join(', ')}</div>
                                <div>Всього годин: {anomaly.details.totalHours}</div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            Детальніше
                          </Button>
                          <Button size="sm" variant="ghost">
                            ОК
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
