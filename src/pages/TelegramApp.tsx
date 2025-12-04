import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import EmployeeRegistration from '@/components/employee/EmployeeRegistration';
import EmployeeStats from '@/components/employee/EmployeeStats';
import EmployeeReports from '@/components/employee/EmployeeReports';
import Settings from '@/components/Settings';
import LoadingScreen from '@/components/LoadingScreen';
import { BarChart3, FileText, Settings as SettingsIcon, LogOut } from 'lucide-react';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}


export default function TelegramApp() {
  const { isRegistered, setUser, logout } = useUser();
  const { isLoading } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeTelegram();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const initializeTelegram = () => {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const app = window.Telegram.WebApp;

        // Розширити на весь екран
        app.expand();
        app.ready();

        const tgUser = app.initDataUnsafe?.user;
        if (tgUser) {
          setTelegramUser(tgUser);
          const displayName = tgUser.last_name
            ? `${tgUser.first_name} ${tgUser.last_name}`
            : tgUser.first_name;
          setUser({
            id: tgUser.id.toString(),
            name: displayName,
            role: 'employee',
            level: 'junior',
            hourlyRate: 0,
            departmentId: 'facade',
          });
        }

        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Telegram initialization error:', error);
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Якщо користувач не зареєстрований, показати форму реєстрації
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto">
          <EmployeeRegistration />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-auto">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 sticky top-0 z-10 rounded-b-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Time Tracker</h1>
              {telegramUser && (
                <p className="text-sm opacity-90">{telegramUser.first_name}</p>
              )}
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">⏱️</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'dashboard' && <EmployeeStats />}
          {activeTab === 'reports' && <EmployeeReports />}
          {activeTab === 'settings' && <Settings />}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 max-w-md mx-auto">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 size={24} />
              <span className="text-xs mt-1">Статус</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText size={24} />
              <span className="text-xs mt-1">Звіти</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <SettingsIcon size={24} />
              <span className="text-xs mt-1">Налаштування</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center py-3 px-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut size={24} />
              <span className="text-xs mt-1">Вихід</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
