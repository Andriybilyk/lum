import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ObjectsQuickStatsProps {
  objects: any[];
  objectStats: Record<string, any>;
}

export default function ObjectsQuickStats({ objects, objectStats }: ObjectsQuickStatsProps) {
  const stats = useMemo(() => {
    let activeCount = 0;
    let overBudgetCount = 0;
    let nearDeadlineCount = 0;
    let totalBudget = 0;
    let totalSpent = 0;

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    objects.forEach(obj => {
      const objStats = objectStats[obj.name];
      const totalActivity = (objStats?.hoursCount || 0) + (objStats?.processCount || 0);

      if (totalActivity > 0) activeCount++;

      // Перевірка бюджету
      if (obj.plannedBudget) {
        const spent = (objStats?.earnings || 0) + (objStats?.materialsCost || 0);
        totalBudget += obj.plannedBudget;
        totalSpent += spent;
        if (spent > obj.plannedBudget) overBudgetCount++;
      }

      // Перевірка дедлайнів
      if (obj.endDate) {
        const deadline = new Date(obj.endDate);
        if (deadline > today && deadline <= weekFromNow) {
          nearDeadlineCount++;
        }
      }
    });

    return {
      totalObjects: objects.length,
      activeCount,
      overBudgetCount,
      nearDeadlineCount,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [objects, objectStats]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalObjects}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Всього об'єктів</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {stats.activeCount} активних
            </div>
          </div>
          <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.budgetUtilization.toFixed(0)}%
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Використано</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {stats.totalSpent.toFixed(0)} / {stats.totalBudget.toFixed(0)} грн
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 opacity-50" />
        </div>
      </Card>

      <Card className={`p-3 ${stats.overBudgetCount > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${stats.overBudgetCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
              {stats.overBudgetCount}
            </div>
            <div className={`text-xs ${stats.overBudgetCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              Перевищення бюджету
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {stats.overBudgetCount > 0 ? 'Потребує уваги!' : 'Все в порядку'}
            </div>
          </div>
          <AlertTriangle className={`w-8 h-8 ${stats.overBudgetCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} opacity-50`} />
        </div>
      </Card>

      <Card className={`p-3 ${stats.nearDeadlineCount > 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${stats.nearDeadlineCount > 0 ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-300'}`}>
              {stats.nearDeadlineCount}
            </div>
            <div className={`text-xs ${stats.nearDeadlineCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
              Дедлайн на тижні
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {stats.nearDeadlineCount > 0 ? 'Приcкорити!' : 'Час є'}
            </div>
          </div>
          <Clock className={`w-8 h-8 ${stats.nearDeadlineCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'} opacity-50`} />
        </div>
      </Card>
    </div>
  );
}
