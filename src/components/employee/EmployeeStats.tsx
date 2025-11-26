import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, DollarSign, Briefcase, LogOut } from 'lucide-react';
import LogHoursModal from './LogHoursModal';
import LogProcessModal from './LogProcessModal';
import WorkReminders from './WorkReminders';
import HoursDetailsModal from './HoursDetailsModal';
import ProcessDetailsModal from './ProcessDetailsModal';
import EarningsDetailsModal from './EarningsDetailsModal';
import { useEmployeeStats } from '@/hooks/useEmployeeStats';

export default function EmployeeStats() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [showLogHours, setShowLogHours] = useState(false);
  const [showLogProcess, setShowLogProcess] = useState(false);
  const [showHoursDetails, setShowHoursDetails] = useState(false);
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  const [showEarningsDetails, setShowEarningsDetails] = useState(false);

  const stats = useEmployeeStats(user?.id || '');

  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear().toString();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container-responsive space-y-3 sm:space-y-4 pb-20 sm:pb-24">
      <div className="pt-3 sm:pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-white truncate">
            Вітаємо, {user?.name}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Ось огляд вашої активності
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      <WorkReminders />

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card
          className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer active:scale-95 transition-transform"
          onClick={() => setShowHoursDetails(true)}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{stats.todayHours.toFixed(1)}год</div>
          <div className="text-[10px] sm:text-xs opacity-90">Годин Сьогодні</div>
          <div className="text-[9px] sm:text-xs opacity-70 mt-0.5 sm:mt-1 hidden sm:block">Натисніть для деталей</div>
        </Card>

        <Card
          className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer active:scale-95 transition-transform"
          onClick={() => setShowEarningsDetails(true)}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">₴{stats.totalEarnings.toLocaleString()}</div>
          <div className="text-[10px] sm:text-xs opacity-90">Заробіток за Місяць</div>
          <div className="text-[9px] sm:text-xs opacity-70 mt-0.5 sm:mt-1 hidden sm:block">Натисніть для деталей</div>
        </Card>

        <Card
          className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg col-span-2 cursor-pointer active:scale-95 transition-transform"
          onClick={() => setShowProcessDetails(true)}
        >
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{stats.completedProcesses}</div>
          <div className="text-[10px] sm:text-xs opacity-90">Завершених Процесів Цього Місяця</div>
          <div className="text-[9px] sm:text-xs opacity-70 mt-0.5 sm:mt-1 hidden sm:block">Натисніть для деталей</div>
        </Card>
      </div>

      <div className="space-y-2 sm:space-y-3 pt-2">
        <Button
          onClick={() => setShowLogHours(true)}
          className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          Записати Робочі Години
        </Button>

        <Button
          onClick={() => setShowLogProcess(true)}
          className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-xl sm:rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          Записати Процес
        </Button>
      </div>

      <LogHoursModal open={showLogHours} onClose={() => setShowLogHours(false)} />
      <LogProcessModal open={showLogProcess} onClose={() => setShowLogProcess(false)} />
      <HoursDetailsModal 
        open={showHoursDetails} 
        onClose={() => setShowHoursDetails(false)}
        month={currentMonth}
        year={currentYear}
      />
      <ProcessDetailsModal 
        open={showProcessDetails} 
        onClose={() => setShowProcessDetails(false)}
        month={currentMonth}
        year={currentYear}
      />
      <EarningsDetailsModal 
        open={showEarningsDetails} 
        onClose={() => setShowEarningsDetails(false)}
        month={currentMonth}
        year={currentYear}
      />
    </div>
  );
}