import { Users, FileText, Settings, LogOut } from 'lucide-react';
import { logger } from '@/utils/logger';
import { memo } from 'react';

interface ManagerNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const ManagerNav = memo(function ManagerNav({ activeTab, setActiveTab, onLogout }: ManagerNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Панель', icon: Users },
    { id: 'employees', label: 'Працівники', icon: Users },
    { id: 'reports', label: 'Звіти', icon: FileText },
    { id: 'settings', label: 'Налаштування', icon: Settings },
    { id: 'logout', label: 'Вихід', icon: LogOut },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50 safe-bottom">
      <div className="max-w-screen-lg mx-auto px-1 sm:px-2 py-1.5 sm:py-2">
        <div className="flex items-center justify-around gap-0.5 sm:gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (tab.id === 'logout') {
                    logger.info('🔴 Manager Nav: Logout button clicked');
                    logger.info('🔴 onLogout function exists?', !!onLogout);
                    if (onLogout) {
                      logger.info('🔴 Calling onLogout...');
                      onLogout();
                    } else {
                      logger.warn('⚠️ onLogout is not defined!');
                    }
                  } else {
                    logger.info('Manager Nav: Switching to tab:', tab.id);
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 min-w-0 flex-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                    : tab.id === 'logout'
                    ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] sm:text-[10px] md:text-xs font-medium truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

export default ManagerNav;
