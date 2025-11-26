import { Clock, FileText, Settings, LogOut } from 'lucide-react';
import { logger } from '@/utils/logger';
import { memo } from 'react';

interface EmployeeNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const EmployeeNav = memo(function EmployeeNav({ activeTab, setActiveTab, onLogout }: EmployeeNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Панель', icon: Clock },
    { id: 'reports', label: 'Звіти', icon: FileText },
    { id: 'settings', label: 'Налаштування', icon: Settings },
    { id: 'logout', label: 'Вихід', icon: LogOut },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50 safe-bottom">
      <div className="max-w-screen-lg mx-auto flex justify-around items-center h-14 sm:h-16 px-2 sm:px-4">
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
                  logger.info('🔴 Employee Nav: Logout button clicked');
                  logger.info('🔴 onLogout function exists?', !!onLogout);
                  if (onLogout) {
                    logger.info('🔴 Calling onLogout...');
                    onLogout();
                  } else {
                    logger.warn('⚠️ onLogout is not defined!');
                  }
                } else {
                  logger.info('Employee Nav: Switching to tab:', tab.id);
                  setActiveTab(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : tab.id === 'logout'
                  ? 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default EmployeeNav;