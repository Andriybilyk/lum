import { Users, FileText, Settings, LogOut } from 'lucide-react';

interface ManagerNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function ManagerNav({ activeTab, setActiveTab, onLogout }: ManagerNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Панель', icon: Users },
    { id: 'employees', label: 'Працівники', icon: Users },
    { id: 'reports', label: 'Звіти', icon: FileText },
    { id: 'settings', label: 'Налаштування', icon: Settings },
    { id: 'logout', label: 'Вихід', icon: LogOut },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'logout' && onLogout) {
                    onLogout();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                    : tab.id === 'logout'
                    ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
