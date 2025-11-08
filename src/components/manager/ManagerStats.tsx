import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Clock, Briefcase, Plus, LogOut } from 'lucide-react';
import AssignWorkModal from './AssignWorkModal';
import ManageObjectsModal from './ManageObjectsModal';
import ManageProcessesModal from './ManageProcessesModal';
import LogHoursModal from '../employee/LogHoursModal';
import LogProcessModal from '../employee/LogProcessModal';
import WorkReminders from '../employee/WorkReminders';

interface ManagerStatsProps {
  setActiveTab: (tab: string) => void;
}

export default function ManagerStats({ setActiveTab }: ManagerStatsProps) {
  const { user, logout } = useUser();
  const { users, hours, processes } = useData();
  const navigate = useNavigate();
  const [showAssignWork, setShowAssignWork] = useState(false);
  const [showManageObjects, setShowManageObjects] = useState(false);
  const [showManageProcesses, setShowManageProcesses] = useState(false);
  const [showLogHours, setShowLogHours] = useState(false);
  const [showLogProcess, setShowLogProcess] = useState(false);

  // Отримуємо реальні дані з таблиць
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  // Працівники команди (включаючи менеджера)
  const teamMembers = users.filter(u => u.managerId === user?.id || u.id === user?.id);
  
  // Активні сьогодні (хто подав години сьогодні)
  const activeToday = new Set(
    hours.filter(h => h.date === today).map(h => h.userId)
  ).size;
  
  // Загальні години за місяць
  const totalHoursThisMonth = hours
    .filter(h => h.date.startsWith(currentMonth) && teamMembers.some(tm => tm.id === h.userId))
    .reduce((sum, h) => sum + h.hours, 0);
  
  // Загальний заробіток команди
  const hoursEarnings = hours
    .filter(h => h.date.startsWith(currentMonth) && teamMembers.some(tm => tm.id === h.userId))
    .reduce((sum, h) => sum + h.salary, 0);
  
  const processEarnings = processes
    .filter(p => p.date.startsWith(currentMonth) && teamMembers.some(tm => tm.id === p.userId))
    .reduce((sum, p) => sum + p.salary, 0);
  
  const totalEarnings = hoursEarnings + processEarnings;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Вітаємо, {user?.name}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
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
              <span className="text-sm font-semibold">{activeToday}</span>
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
          <div className="text-3xl font-bold mb-1">{(totalEarnings / 1000).toFixed(0)}k грн</div>
          <div className="text-xs opacity-90">Заробіток Команди</div>
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 opacity-80" />
              <span className="text-sm font-semibold">{totalHoursThisMonth.toFixed(0)}</span>
              <span className="text-xs opacity-80">годин за місяць</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowLogHours(true)}
            className="h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl shadow-lg"
          >
            <Clock className="w-5 h-5 mr-2" />
            Подати Години
          </Button>

          <Button
            onClick={() => setShowLogProcess(true)}
            className="h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-2xl shadow-lg"
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Подати Процес
          </Button>
        </div>

        <Button
          onClick={() => setShowAssignWork(true)}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-2xl shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Призначити Роботу
        </Button>

        <Button
          onClick={() => setShowManageObjects(true)}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 rounded-2xl shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Керувати Об'єктами
        </Button>

        <Button
          onClick={() => setShowManageProcesses(true)}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 rounded-2xl shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Керувати Процесами
        </Button>
      </div>

      <AssignWorkModal open={showAssignWork} onClose={() => setShowAssignWork(false)} />
      <ManageObjectsModal open={showManageObjects} onClose={() => setShowManageObjects(false)} />
      <ManageProcessesModal open={showManageProcesses} onClose={() => setShowManageProcesses(false)} />
      <LogHoursModal open={showLogHours} onClose={() => setShowLogHours(false)} />
      <LogProcessModal open={showLogProcess} onClose={() => setShowLogProcess(false)} />
    </div>
  );
}