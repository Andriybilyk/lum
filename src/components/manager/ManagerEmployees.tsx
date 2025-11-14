import { logger } from '@/utils/logger';
import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import MemoizedTeamMemberCard from '@/components/memoized/MemoizedTeamMemberCard';
import SearchBar from '@/components/common/SearchBar';
import { useSearch } from '@/hooks/useSearch';
import EditEmployeeLevelModal from './EditEmployeeLevelModal';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import EditLevelsModal from './EditLevelsModal';
import ManageObjectsModal from './ManageObjectsModal';
import ManageProcessesModal from './ManageProcessesModal';
import AddEmployeeToTeamModal from './AddEmployeeToTeamModal';
import type { User as UserType } from '@/types';

export default function ManagerEmployees() {
  const { user } = useUser();
  const { users, hours, processes, levels } = useData();
  const [editingEmployee, setEditingEmployee] = useState<UserType | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<UserType | null>(null);
  const [showEditLevels, setShowEditLevels] = useState(false);
  const [showManageObjects, setShowManageObjects] = useState(false);
  const [showManageProcesses, setShowManageProcesses] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const teamMembers = useMemo(
    () => {
      if (!user?.id) return [];
      return users.filter(u => u.managerId === user.id || u.id === user.id);
    },
    [users, user?.id]
  );

  const { searchTerm, results: filteredTeamMembers, handleSearch, clear: clearSearch } = useSearch(
    teamMembers,
    { fields: ['name', 'level'] as (keyof UserType)[], debounce: 300 }
  );

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const employeeStats = useMemo(() => {
    const statsMap = new Map();

    teamMembers.forEach(employee => {
      const empHours = hours.filter(h =>
        h.userId === employee.id && h.date.startsWith(currentMonth)
      );

      const empProcesses = processes.filter(p =>
        p.userId === employee.id && p.date.startsWith(currentMonth)
      );

      const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);
      const hoursEarnings = empHours.reduce((sum, h) => sum + h.salary, 0);
      const processEarnings = empProcesses.reduce((sum, p) => sum + p.salary, 0);
      const totalEarnings = hoursEarnings + processEarnings;

      statsMap.set(employee.id, { totalHours, totalEarnings });

      // Debug logging
      if (empHours.length > 0 || empProcesses.length > 0) {
        logger.info('📊 ManagerEmployees stats debug:', {
          employeeId: employee.id,
          employeeName: employee.name,
          currentMonth,
          empHoursCount: empHours.length,
          empProcessesCount: empProcesses.length,
          stats: { totalHours, totalEarnings }
        });
      }
    });

    return statsMap;
  }, [teamMembers, hours, processes, currentMonth]);

  const getLevelLabel = useCallback((levelName: string) => {
    const level = levels.find(l => l.name === levelName);
    return level ? level.name : levelName;
  }, [levels]);

  const handleEditEmployee = useCallback((employee: UserType) => {
    setEditingEmployee(employee);
  }, []);

  const handleViewEmployee = useCallback((employee: UserType) => {
    setViewingEmployee(employee);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          👥 Команда
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setShowAddEmployee(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            ➕ Додати Працівника
          </Button>
          <Button
            onClick={() => setShowManageObjects(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            📦 Об'єкти
          </Button>
          <Button
            onClick={() => setShowManageProcesses(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            ⚙️ Процеси
          </Button>
          <Button
            onClick={() => setShowEditLevels(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Рівні
          </Button>
        </div>
      </div>

      {teamMembers.length > 3 && (
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Пошук за іменем або рівнем..."
          onClear={clearSearch}
        />
      )}

      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-slate-500">
              Немає працівників у команді
            </p>
          </Card>
        ) : filteredTeamMembers.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-slate-500">
              Результати не знайдені для "{searchTerm}"
            </p>
          </Card>
        ) : (
          filteredTeamMembers.map((employee) => {
            const isManager = employee.id === user?.id;
            const stats = employeeStats.get(employee.id) || { totalHours: 0, totalEarnings: 0 };

            return (
              <MemoizedTeamMemberCard
                key={employee.id}
                employee={employee}
                stats={stats}
                isManager={isManager}
                levelLabel={getLevelLabel(employee.level)}
                onEdit={handleEditEmployee}
                onView={handleViewEmployee}
              />
            );
          })
        )}
      </div>

      {editingEmployee && (
        <EditEmployeeLevelModal
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
        />
      )}

      {viewingEmployee && (
        <EmployeeDetailsModal
          open={!!viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          employee={viewingEmployee}
        />
      )}

      <EditLevelsModal
        open={showEditLevels}
        onClose={() => setShowEditLevels(false)}
      />

      <ManageObjectsModal
        open={showManageObjects}
        onClose={() => setShowManageObjects(false)}
      />

      <ManageProcessesModal
        open={showManageProcesses}
        onClose={() => setShowManageProcesses(false)}
      />

      <AddEmployeeToTeamModal
        open={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
      />
    </div>
  );
}