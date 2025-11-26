import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useTelegramApp } from '@/contexts/TelegramAppContext';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

// Lazy load компонентів для швидшого початкового завантаження
const EmployeeRegistration = lazy(() => import('@/components/employee/EmployeeRegistration'));
const ManagerRegistration = lazy(() => import('@/components/manager/ManagerRegistration'));
const EmployeeNav = lazy(() => import('@/components/employee/EmployeeNav'));
const EmployeeStats = lazy(() => import('@/components/employee/EmployeeStats'));
const EmployeeReports = lazy(() => import('@/components/employee/EmployeeReports'));
const Settings = lazy(() => import('@/components/Settings'));
const ManagerNav = lazy(() => import('@/components/manager/ManagerNav'));
const ManagerStats = lazy(() => import('@/components/manager/ManagerStats'));
const ManagerEmployees = lazy(() => import('@/components/manager/ManagerEmployees'));
const ManagerReports = lazy(() => import('@/components/manager/ManagerReports'));

type UserRole = 'employee' | 'manager' | null;

// Компонент завантаження
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin mb-4 mx-auto">
        <Clock className="w-8 h-8" />
      </div>
      <p>Завантаження...</p>
    </div>
  </div>
);

export default function TelegramMiniApp() {
  const {
    user: telegramUser,
    isInitialized,
  } = useTelegramApp();
  const { users, isLoading } = useData();
  const { user: appUser, setUser } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    // Перевіряємо чи користувач вже зареєстрований через Telegram ID
    // НЕ логінимо автоматично якщо:
    // - користувач вийшов вручну (hasLoggedOut)
    // - користувач вибрав роль і дивиться на екран реєстрації (selectedRole !== null)
    if (isInitialized && telegramUser && users.length > 0 && !appUser && !hasLoggedOut && !selectedRole) {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // @ts-ignore
        const webApp = window.Telegram.WebApp;
        // @ts-ignore
        const tgUser = webApp.initDataUnsafe?.user;
        if (tgUser) {
          const existingUser = users.find(u => u.telegramId === tgUser.id.toString());
          if (existingUser) {
            logger.info('🔄 Auto-login: Found existing user, logging in automatically:', existingUser.name);
            // Користувач знайдений - автоматично логінимо
            setUser(existingUser);
          } else {
            logger.info('ℹ️ Auto-login: No existing user found for Telegram ID:', tgUser.id);
          }
        }
      }
    }
  }, [isInitialized, telegramUser, users, appUser, hasLoggedOut, selectedRole, setUser]);

  const handleChangeTab = useCallback((event: any) => {
    setActiveTab(event.detail);
  }, []);

  useEffect(() => {
    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, [handleChangeTab]);

  const handleLogout = useCallback(() => {
    logger.info('🚪🚪🚪 LOGOUT TRIGGERED');
    logger.info('Current state:', { appUser, selectedRole, hasLoggedOut });

    setUser(null as any);
    setSelectedRole(null);
    setActiveTab('dashboard');
    setHasLoggedOut(true);

    logger.info('✅ Logout complete - hasLoggedOut set to true');
  }, [setUser, appUser, selectedRole, hasLoggedOut]);

  if (!isInitialized || isLoading) {
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

  // Якщо користувача немає, показуємо вибір ролі або реєстрацію
  if (!appUser) {
    // Якщо роль ще не вибрана - показуємо меню вибору
    if (!selectedRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  ⏰
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Облік Часу
                </h1>
                <p className="text-white/80 text-sm">
                  Керуйте робочими годинами та процесами
                </p>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={() => {
                      setSelectedRole('employee');
                      setHasLoggedOut(false);
                    }}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <span className="mr-2">👤</span>
                    Я Працівник
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={() => {
                      setSelectedRole('manager');
                      setHasLoggedOut(false);
                    }}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <span className="mr-2">👔</span>
                    Я Менеджер
                  </Button>
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-white/60 text-xs mt-8"
              >
                Оберіть свою роль для початку роботи
              </motion.p>
            </div>
          </motion.div>
        </div>
      );
    }

    // Якщо роль вибрана - показуємо відповідну реєстрацію
    if (selectedRole === 'employee') {
      logger.info('🔵🔵🔵 TelegramMiniApp: Rendering EmployeeRegistration with telegramUser:', telegramUser);
      return (
        <Suspense fallback={<LoadingScreen />}>
          <EmployeeRegistration onBack={() => setSelectedRole(null)} isTelegramMiniApp={true} telegramUser={telegramUser} />
        </Suspense>
      );
    }

    if (selectedRole === 'manager') {
      logger.info('🔵🔵🔵 TelegramMiniApp: Rendering ManagerRegistration with telegramUser:', telegramUser);
      return (
        <Suspense fallback={<LoadingScreen />}>
          <ManagerRegistration onBack={() => setSelectedRole(null)} isTelegramMiniApp={true} telegramUser={telegramUser} />
        </Suspense>
      );
    }
  }

  // Показуємо повний дашборд залежно від ролі користувача
  if (appUser?.role === 'employee') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-md mx-auto pb-20">
            {activeTab === 'dashboard' && <EmployeeStats />}
            {activeTab === 'reports' && <EmployeeReports />}
            {activeTab === 'settings' && <Settings onLogout={handleLogout} />}
            <EmployeeNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          </div>
        </div>
      </Suspense>
    );
  }

  if (appUser?.role === 'manager') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-4xl mx-auto pb-20">
            {activeTab === 'dashboard' && <ManagerStats setActiveTab={setActiveTab} />}
            {activeTab === 'employees' && <ManagerEmployees />}
            {activeTab === 'reports' && <ManagerReports />}
            {activeTab === 'settings' && <Settings onLogout={handleLogout} />}
            <ManagerNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          </div>
        </div>
      </Suspense>
    );
  }

  return null;
}
