import { Clock, FileText, Settings } from 'lucide-react';

interface EmployeeNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EmployeeNav({ activeTab, setActiveTab }: EmployeeNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Панель', icon: Clock },
    { id: 'reports', label: 'Звіти', icon: FileText },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}