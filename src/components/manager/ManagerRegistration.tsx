import { logger } from '@/utils/logger';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function ManagerRegistration() {
  const { setUser } = useUser();
  const { users, levels, addUser, isLoading } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<'select' | 'create'>('select');
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    selectedUserId: '',
    name: '',
    level: '',
    hourlyRate: '',
    password: ''
  });

  useEffect(() => {
    logger.info('📱 Initializing Telegram registration (Manager)');

    // Спочатку ініціалізуємо Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // @ts-ignore - Telegram WebApp API
      const webApp = window.Telegram.WebApp;
      logger.info('🔍 Telegram WebApp object:', webApp);

      // Викликаємо ready() щоб повідомити Telegram що додаток готовий
      // @ts-ignore
      if (typeof webApp.ready === 'function') {
        // @ts-ignore
        webApp.ready();
        logger.info('✅ WebApp.ready() called');
      }

      // Перевіряємо initDataUnsafe
      // @ts-ignore
      logger.info('🔍 initDataUnsafe:', webApp.initDataUnsafe);
      // @ts-ignore
      logger.info('🔍 initDataUnsafe.user:', webApp.initDataUnsafe?.user);

      // @ts-ignore
      if (webApp.initDataUnsafe?.user) {
        // @ts-ignore
        const tgUserId = webApp.initDataUnsafe.user.id.toString();
        // @ts-ignore
        const tgUserName = `${webApp.initDataUnsafe.user.first_name}${webApp.initDataUnsafe.user.last_name ? ' ' + webApp.initDataUnsafe.user.last_name : ''}`;

        logger.info('✅ REAL Telegram ID captured (Manager):', tgUserId);
        logger.info('✅ Telegram user name:', tgUserName);

        setTelegramId(tgUserId);
        setFormData(prev => ({
          ...prev,
          name: tgUserName
        }));
      } else {
        logger.warn('⚠️ Telegram user data NOT found in WebApp.initDataUnsafe');
        logger.warn('⚠️ This means app is NOT running inside Telegram Mini App');
      }
    } else {
      logger.warn('⚠️ window.Telegram.WebApp not available');
      logger.warn('⚠️ App must be opened through Telegram Mini App to get real Telegram ID');
    }
  }, []);

  const managerUsers = useMemo(() => {
    return users.filter(u => u.role === 'manager');
  }, [users]);

  const handleLevelChange = (value: string) => {
    const selectedLevel = levels.find(l => l.name === value);

    setFormData({
      ...formData,
      level: value,
      hourlyRate: selectedLevel ? selectedLevel.hourlyRate.toString() : ''
    });
  };

  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      logger.info('👤 Selected existing manager:', user);
      setUser(user);
      navigate('/manager');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Перевірка пароля
    if (formData.password !== '6323') {
      toast({
        title: 'Помилка',
        description: 'Невірний пароль для реєстрації менеджера',
        variant: 'destructive'
      });
      return;
    }

    const userId = telegramId || Date.now().toString();
    const user = {
      id: userId,
      name: formData.name,
      role: 'manager' as const,
      level: formData.level,
      hourlyRate: parseFloat(formData.hourlyRate),
      telegramId: telegramId || undefined
    };

    logger.info('Manager registration - telegramId: ' + telegramId + ', userId: ' + user.id, 'ManagerRegistration');
    logger.info('Before addUser - User object:', { ...user, telegramId }, 'ManagerRegistration');
    await addUser(user);
    setUser(user);
    navigate('/manager');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-400 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Завантаження даних...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-400 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👔</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Реєстрація Менеджера</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Введіть свої дані для початку роботи
            </p>
          </div>

          {managerUsers.length > 0 && authMode === 'select' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Оберіть менеджера</Label>
                <div className="mt-3 space-y-2">
                  {managerUsers.map((manager) => (
                    <Button
                      key={manager.id}
                      onClick={() => handleSelectUser(manager.id)}
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl"
                    >
                      <span className="mr-2">👤</span>
                      {manager.name} (₴{manager.hourlyRate}/год)
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-gray-500">або</span>
                </div>
              </div>

              <Button
                onClick={() => setAuthMode('create')}
                variant="ghost"
                className="w-full text-purple-600 dark:text-purple-400"
              >
                Створити нового менеджера
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Повне Ім'я</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Марія Коваль"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="level" className="text-slate-700 dark:text-slate-300">Рівень</Label>
                <Select value={formData.level} onValueChange={handleLevelChange}>
                  <SelectTrigger id="level" className="mt-1.5 h-12 rounded-xl">
                    <SelectValue placeholder="Оберіть свій рівень" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.name}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rate" className="text-slate-700 dark:text-slate-300">Погодинна Ставка (₴)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="400"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Введіть пароль"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
                <p className="text-xs text-slate-500 mt-1">Пароль для доступу до панелі менеджера</p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-xl mt-6"
              >
                Завершити Реєстрацію
              </Button>

              {managerUsers.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setAuthMode('select')}
                  variant="ghost"
                  className="w-full text-slate-600 dark:text-slate-400"
                >
                  ← Назад
                </Button>
              )}
            </form>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full mt-4 text-slate-600 dark:text-slate-400"
          >
            Назад на Головну
          </Button>
        </div>
      </motion.div>
    </div>
  );
}