import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTelegramApp } from '@/contexts/TelegramAppContext';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import EmployeeRegistration from '@/components/employee/EmployeeRegistration';
import ManagerRegistration from '@/components/manager/ManagerRegistration';
import EmployeeNav from '@/components/employee/EmployeeNav';
import EmployeeStats from '@/components/employee/EmployeeStats';
import EmployeeReports from '@/components/employee/EmployeeReports';
import Settings from '@/components/Settings';
import ManagerNav from '@/components/manager/ManagerNav';
import ManagerStats from '@/components/manager/ManagerStats';
import ManagerEmployees from '@/components/manager/ManagerEmployees';
import ManagerReports from '@/components/manager/ManagerReports';
import LoadingScreen from '@/components/LoadingScreen';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

type UserRole = 'employee' | 'manager' | null;

export default function TelegramMiniApp() {
  const { toast } = useToast();
  const {
    user: telegramUser,
    isInitialized,
  } = useTelegramApp();
  const { users, isLoading } = useData();
  const { user: appUser, setUser } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Перевіряємо чи користувач вже зареєстрований через Telegram ID
    if (isInitialized && telegramUser && users.length > 0 && !appUser) {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // @ts-ignore
        const webApp = window.Telegram.WebApp;
        // @ts-ignore
        const tgUser = webApp.initDataUnsafe?.user;
        if (tgUser) {
          const existingUser = users.find(u => u.telegramId === tgUser.id.toString());
          if (existingUser) {
            // Користувач знайдений - автоматично логінимо
            setUser(existingUser);
          }
        }
      }
    }
  }, [isInitialized, telegramUser, users, appUser, setUser]);

  useEffect(() => {
    const handleChangeTab = (event: any) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, []);

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
                    onClick={() => setSelectedRole('employee')}
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
                    onClick={() => setSelectedRole('manager')}
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
      return <EmployeeRegistration />;
    }

    if (selectedRole === 'manager') {
      return <ManagerRegistration />;
    }
  }

  // Показуємо повний дашборд залежно від ролі користувача
  if (appUser?.role === 'employee') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto pb-20">
          {activeTab === 'dashboard' && <EmployeeStats />}
          {activeTab === 'reports' && <EmployeeReports />}
          {activeTab === 'settings' && <Settings />}
          <EmployeeNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    );
  }

  if (appUser?.role === 'manager') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto pb-20">
          {activeTab === 'dashboard' && <ManagerStats />}
          {activeTab === 'employees' && <ManagerEmployees />}
          {activeTab === 'reports' && <ManagerReports />}
          {activeTab === 'settings' && <Settings />}
          <ManagerNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    );
  }

  return null;
}
