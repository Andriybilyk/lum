import { logger } from '@/utils/logger';
import { UserSchema, validateData } from '@/utils/validation';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface EmployeeRegistrationProps {
  onBack?: () => void;
  isTelegramMiniApp?: boolean;
  telegramUser?: TelegramUserData | null;
}

export default function EmployeeRegistration({ onBack, isTelegramMiniApp = false, telegramUser: propTelegramUser }: EmployeeRegistrationProps = {}) {
  const { setUser } = useUser();
  const { users, levels, addUser, isLoading, isConfigured } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<'select' | 'create'>('select');
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    selectedUserId: '',
    name: '',
    level: '',
    hourlyRate: '',
    managerId: 'none'
  });

  // Отримати Telegram ID при завантаженні
  useEffect(() => {
    logger.info('📱 ========== TELEGRAM REGISTRATION START ==========');
    logger.info('📱 propTelegramUser:', propTelegramUser);

    // Якщо передано telegramUser через пропси (Telegram Mini App контекст)
    if (propTelegramUser) {
      const tgUserId = propTelegramUser.id.toString();
      const tgUserName = `${propTelegramUser.first_name}${propTelegramUser.last_name ? ' ' + propTelegramUser.last_name : ''}`;

      logger.info('✅✅✅ Telegram ID from props: ' + tgUserId);
      logger.info('✅✅✅ Telegram user name from props: ' + tgUserName);

      setTelegramId(tgUserId);
      setFormData(prev => ({
        ...prev,
        name: tgUserName
      }));
      return;
    }

    // Fallback: отримуємо дані напряму з window.Telegram
    logger.info('📱 Current URL:', window.location.href);
    logger.info('📱 window.Telegram exists?', typeof window.Telegram !== 'undefined');

    // Спочатку ініціалізуємо Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // @ts-ignore - Telegram WebApp API
      const webApp = window.Telegram.WebApp;
      logger.info('✅ WebApp object found');
      // @ts-ignore
      logger.info('🔍 WebApp version:', webApp.version || 'unknown');
      // @ts-ignore
      logger.info('🔍 WebApp platform:', webApp.platform || 'unknown');

      // Викликаємо ready() щоб повідомити Telegram що додаток готовий
      // @ts-ignore
      if (typeof webApp.ready === 'function') {
        // @ts-ignore
        webApp.ready();
        logger.info('✅ WebApp.ready() called');
      }

      // Перевіряємо initData (raw string)
      // @ts-ignore
      logger.info('🔍 initData (raw):', webApp.initData || 'EMPTY');

      // Перевіряємо initDataUnsafe
      // @ts-ignore
      const initDataUnsafe = webApp.initDataUnsafe;
      logger.info('🔍 initDataUnsafe:', initDataUnsafe);

      if (initDataUnsafe) {
        logger.info('🔍 initDataUnsafe keys:', Object.keys(initDataUnsafe));
        logger.info('🔍 initDataUnsafe.user:', initDataUnsafe.user);

        if (initDataUnsafe.user) {
          const user = initDataUnsafe.user;
          logger.info('🔍 User object:', user);
          logger.info('🔍 User ID type:', typeof user.id);
          logger.info('🔍 User ID value:', user.id);

          const tgUserId = user.id.toString();
          const tgUserName = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;

          logger.info('✅✅✅ REAL Telegram ID captured: ' + tgUserId);
          logger.info('✅✅✅ Telegram user name: ' + tgUserName);

          setTelegramId(tgUserId);
          setFormData(prev => ({
            ...prev,
            name: tgUserName
          }));
        } else {
          logger.error('❌ initDataUnsafe.user is NULL or UNDEFINED');
          logger.error('❌ initDataUnsafe content:', JSON.stringify(initDataUnsafe));
        }
      } else {
        logger.error('❌ initDataUnsafe is NULL or UNDEFINED');
        logger.error('❌ This means Telegram did NOT pass user data');
        logger.error('❌ App MUST be opened via Telegram Bot URL');
      }
    } else {
      logger.error('❌ window.Telegram.WebApp NOT AVAILABLE');
      logger.error('❌ Telegram SDK not loaded or not running in Telegram');
      logger.error('❌ Check: 1) Telegram SDK script in index.html');
      logger.error('❌ Check: 2) App opened through Telegram Mini App URL');
    }

    logger.info('📱 ========== TELEGRAM REGISTRATION END ==========');
  }, [propTelegramUser]);

  const employeeUsers = useMemo(() => {
    return users.filter(u => u.role === 'employee');
  }, [users]);

  const managerUsers = useMemo(() => {
    return users.filter(u => u.role === 'manager');
  }, [users]);

  useEffect(() => {
    logger.info('🔍 EmployeeRegistration - isLoading:', isLoading);
    logger.info('🔍 EmployeeRegistration - isConfigured:', isConfigured);
    logger.info('🔍 EmployeeRegistration - levels:', levels);
    logger.info('🔍 EmployeeRegistration - employeeUsers:', employeeUsers);
  }, [isLoading, levels, isConfigured, employeeUsers]);

  const handleLevelChange = (value: string) => {
    const selectedLevel = levels.find(l => l.name === value);
    setFormData({
      ...formData,
      level: value,
      hourlyRate: selectedLevel ? selectedLevel.hourlyRate.toString() : formData.hourlyRate
    });
  };

  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      logger.info('👤 Selected existing employee:', user);
      setUser(user);
      if (!isTelegramMiniApp) {
        navigate('/employee');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      name: formData.name,
      role: 'employee' as const,
      level: formData.level,
      hourlyRate: parseFloat(formData.hourlyRate),
      managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined
    };

    const { success, data: validatedUser, error } = validateData(UserSchema, userData);

    if (!success) {
      logger.warn('Employee registration validation failed', { error });
      toast({
        title: 'Помилка валідації',
        description: error,
        variant: 'destructive'
      });
      return;
    }

    try {
      const userId = telegramId || Date.now().toString();
      const user = {
        id: userId,
        ...validatedUser!,
        telegramId: telegramId || undefined,
      };

      logger.info('Employee registration - telegramId: ' + telegramId + ', userId: ' + user.id, 'EmployeeRegistration');
      logger.info('Before addUser - User object:', { ...user, telegramId }, 'EmployeeRegistration');
      await addUser(user as any);
      setUser(user as any);
      if (!isTelegramMiniApp) {
        navigate('/employee');
      }
    } catch (err) {
      logger.error('Failed to add employee', err);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати працівника',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Завантаження даних...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Реєстрація Працівника</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Введіть свої дані для початку роботи
            </p>
          </div>

          {employeeUsers.length > 0 && authMode === 'select' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Оберіть працівника</Label>
                <div className="mt-3 space-y-2">
                  {employeeUsers.map((employee) => (
                    <Button
                      key={employee.id}
                      onClick={() => handleSelectUser(employee.id)}
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl"
                    >
                      <span className="mr-2">👤</span>
                      {employee.name} (₴{employee.hourlyRate}/год)
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
                className="w-full text-blue-600 dark:text-blue-400"
              >
                Створити нового працівника
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {telegramId && (
                <div>
                  <Label htmlFor="telegramId" className="text-slate-700 dark:text-slate-300">ID Telegram</Label>
                  <Input
                    id="telegramId"
                    type="text"
                    value={telegramId}
                    readOnly
                    className="mt-1.5 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ідентифікатор отримано з Telegram</p>
                </div>
              )}

              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Повне Ім'я</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Іван Петренко"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="level" className="text-slate-700 dark:text-slate-300">Рівень</Label>
                <Select value={formData.level} onValueChange={handleLevelChange}>
                  <SelectTrigger id="level" className="mt-1.5 h-12 rounded-xl">
                    <SelectValue placeholder={levels.length === 0 ? "Немає доступних рівнів" : "Оберіть свій рівень"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        Немає доступних рівнів. Додайте рівні в Google Sheets.
                      </div>
                    ) : (
                      levels.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          {level.name} (₴{level.hourlyRate}/год)
                        </SelectItem>
                      ))
                    )}
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
                  placeholder="150"
                  required
                  className="mt-1.5 h-12 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="manager" className="text-slate-700 dark:text-slate-300">Менеджер (опційно)</Label>
                <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                  <SelectTrigger id="manager" className="mt-1.5 h-12 rounded-xl">
                    <SelectValue placeholder="Оберіть менеджера або не обирайте" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без менеджера</SelectItem>
                    {managerUsers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={levels.length === 0}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl mt-6 disabled:opacity-50"
              >
                Завершити Реєстрацію
              </Button>

              {employeeUsers.length > 0 && (
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
            onClick={() => onBack ? onBack() : navigate('/')}
            className="w-full mt-4 text-slate-600 dark:text-slate-400"
          >
            Назад на Головну
          </Button>
        </div>
      </motion.div>
    </div>
  );
}