import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Clock, Briefcase, Plus, LogOut } from 'lucide-react';
import { FeatureErrorBoundary } from '@/components/providers/FeatureErrorBoundary';
import AssignWorkModal from './AssignWorkModal';
import ManageObjectsAndProcessesModal from './ManageObjectsAndProcessesModal';
import CopyProcessesModal from './CopyProcessesModal';
import AdditionalWorksModal from './AdditionalWorksModal';
import LogHoursModal from '../employee/LogHoursModal';
import LogProcessModal from '../employee/LogProcessModal';
import WorkReminders from '../employee/WorkReminders';
import PhotoReportsModal from './PhotoReportsModal';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useAnomaliesDetection } from '@/hooks/useAnomaliesDetection';

interface ManagerStatsProps {
  setActiveTab: (tab: string) => void;
}

export default function ManagerStats({ setActiveTab }: ManagerStatsProps) {
  const { user, logout } = useUser();
  const { users, additionalWorks } = useData();
  const navigate = useNavigate();
  const [showAssignWork, setShowAssignWork] = useState(false);
  const [showManageObjectsAndProcesses, setShowManageObjectsAndProcesses] = useState(false);
  const [showCopyProcesses, setShowCopyProcesses] = useState(false);
  const [showLogHours, setShowLogHours] = useState(false);
  const [showLogProcess, setShowLogProcess] = useState(false);
  const [showAdditionalWorks, setShowAdditionalWorks] = useState(false);
  const [showPhotoReports, setShowPhotoReports] = useState(false);

  const teamMembers = useMemo(
    () => {
      return users.filter(u => u.managerId === user?.id || u.id === user?.id);
    },
    [users, user?.id]
  );

  const teamMemberIds = useMemo(() => {
    return teamMembers.map(tm => tm.id);
  }, [teamMembers]);

  const stats = useTeamStats(teamMemberIds);

  // Автоматична перевірка аномалій (надсилає сповіщення при виявленні проблем)
  useAnomaliesDetection();

  // Забезпечуємо значення за замовчуванням для stats
  const safeStats = {
    activeToday: stats?.activeToday ?? 0,
    totalEarnings: stats?.totalEarnings ?? 0,
    totalHoursThisMonth: stats?.totalHoursThisMonth ?? 0,
    hoursEarnings: stats?.hoursEarnings ?? 0,
    processEarnings: stats?.processEarnings ?? 0,
  };

  const pendingAdditionalWorks = useMemo(() => {
    return additionalWorks.filter(w => w.managerId === user?.id && w.status === 'pending').length;
  }, [additionalWorks, user?.id]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <FeatureErrorBoundary featureName="ManagerStats">
      <div className="p-4 space-y-4">
        <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
            Вітаємо, {user?.name}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Панель керування командою
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <WorkReminders />

      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-95"
          onClick={() => setActiveTab('employees')}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{teamMembers.length}</div>
          <div className="text-xs opacity-90">Працівників у Команді</div>
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 opacity-80" />
              <span className="text-sm font-semibold">{safeStats.activeToday}</span>
              <span className="text-xs opacity-80">активних сьогодні</span>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-95"
          onClick={() => setActiveTab('reports')}
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{(safeStats.totalEarnings / 1000).toFixed(0)}k грн</div>
          <div className="text-xs opacity-90">Заробіток Команди</div>
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 opacity-80" />
              <span className="text-sm font-semibold">{safeStats.totalHoursThisMonth.toFixed(0)}</span>
              <span className="text-xs opacity-80">годин за місяць</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowLogHours(true)}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl shadow-lg"
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-base">Подати Години</span>
          </Button>

          <Button
            onClick={() => setShowLogProcess(true)}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-2xl shadow-lg"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-base">Подати Процес</span>
          </Button>
        </div>

        <Button
          onClick={() => setShowAssignWork(true)}
          className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-2xl shadow-lg"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Призначити Роботу
        </Button>

        <Button
          onClick={() => setShowManageObjectsAndProcesses(true)}
          className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 rounded-2xl shadow-lg"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Об'єкти та Процеси
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowCopyProcesses(true)}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 rounded-2xl shadow-lg"
          >
            <span className="text-xs sm:text-base">📋 Копіювати Процеси</span>
          </Button>

          <Button
            onClick={() => setShowAdditionalWorks(true)}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 rounded-2xl shadow-lg relative"
          >
            <span className="text-xs sm:text-base">⭐ Додаткові Роботи</span>
            {pendingAdditionalWorks > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendingAdditionalWorks}
              </span>
            )}
          </Button>
        </div>

        <Button
          onClick={() => setShowPhotoReports(true)}
          className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 rounded-2xl shadow-lg"
        >
          <span>📸 Фото Робіт</span>
        </Button>
      </div>

      <AssignWorkModal open={showAssignWork} onClose={() => setShowAssignWork(false)} />
      <ManageObjectsAndProcessesModal open={showManageObjectsAndProcesses} onClose={() => setShowManageObjectsAndProcesses(false)} />
      <CopyProcessesModal open={showCopyProcesses} onClose={() => setShowCopyProcesses(false)} />
      <AdditionalWorksModal open={showAdditionalWorks} onClose={() => setShowAdditionalWorks(false)} />
      <PhotoReportsModal open={showPhotoReports} onClose={() => setShowPhotoReports(false)} />
      <LogHoursModal open={showLogHours} onClose={() => setShowLogHours(false)} />
      <LogProcessModal open={showLogProcess} onClose={() => setShowLogProcess(false)} />
      </div>
    </FeatureErrorBoundary>
  );
}