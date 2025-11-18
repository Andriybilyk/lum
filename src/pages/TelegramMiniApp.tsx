import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Plus, RotateCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTelegramApp } from '@/contexts/TelegramAppContext';
import EmployeeRegistration from '@/components/employee/EmployeeRegistration';

export default function TelegramMiniApp() {
  const { toast } = useToast();
  const {
    user,
    isInitialized,
    todayHours,
    monthProgress,
    recentEntries,
    isSyncing,
    addHours,
    syncWithServer,
  } = useTelegramApp();
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    // Якщо ініціалізація закінчена, але немає користувача,
    // показуємо реєстрацію
    if (isInitialized && !user) {
      setShowRegistration(true);
    }
  }, [isInitialized, user]);

  const handleAddHours = async (hours: number) => {
    try {
      await addHours(hours);
      toast({
        title: 'Успішно',
        description: `Додано ${hours} годин`,
      });
    } catch {
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати години',
        variant: 'destructive',
      });
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  // Показуємо реєстрацію, якщо користувача немає
  if (!user || showRegistration) {
    return <EmployeeRegistration />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">📊 Мій Статус</h1>
        {user && (
          <p className="text-sm text-slate-600 mt-1">
            Привіт, {user.first_name}!
          </p>
        )}
      </div>

      {/* Today's Hours */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white border-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Сьогодні</p>
            <p className="text-4xl font-bold">{todayHours.toFixed(1)}h</p>
          </div>
          <Clock className="w-12 h-12 opacity-50" />
        </div>
        <p className="text-xs opacity-80">
          {monthProgress}% від місячного плану (160 годин)
        </p>
      </Card>

      {/* Month Progress */}
      <Card className="p-4 mb-4">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Прогрес за місяць</span>
            <span className="font-bold">{monthProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(monthProgress, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Button
          onClick={() => handleAddHours(0.5)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          +30 хв
        </Button>
        <Button
          onClick={() => handleAddHours(1)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          +1h
        </Button>
        <Button
          onClick={() => handleAddHours(4)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          +4h
        </Button>
        <Button
          onClick={() => handleAddHours(8)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          +8h
        </Button>
      </div>

      {/* Recent Entries */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Останні записи
        </h3>
        <div className="space-y-2">
          {recentEntries.map((entry) => (
            <Card key={entry.date} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {new Date(entry.date).toLocaleDateString('uk-UA', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                <p className="text-xs text-slate-500">{entry.hours} годин</p>
              </div>
              <div className="text-right">
                {entry.synced === 'synced' && (
                  <span className="text-green-600 text-xs">✅ Синхр.</span>
                )}
                {entry.synced === 'pending' && (
                  <span className="text-yellow-600 text-xs">⏳ Чекаємо</span>
                )}
                {entry.synced === 'error' && (
                  <span className="text-red-600 text-xs">❌ Помилка</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sync Status */}
      <Button
        onClick={() => syncWithServer()}
        disabled={isSyncing}
        className="w-full bg-slate-500 hover:bg-slate-600"
      >
        <RotateCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Синхронізація...' : 'Синхронізувати'}
      </Button>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-slate-500">
        <p>
          ✅ Додаток онлайн. Дані синхронізуються автоматично.
        </p>
      </div>
    </div>
  );
}
