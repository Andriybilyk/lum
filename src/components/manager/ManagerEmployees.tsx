import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Clock, DollarSign, Edit, Trash2, Settings } from 'lucide-react';
import EditEmployeeLevelModal from './EditEmployeeLevelModal';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import EditLevelsModal from './EditLevelsModal';
import ManageObjectsModal from './ManageObjectsModal';
import ManageProcessesModal from './ManageProcessesModal';

export default function ManagerEmployees() {
  const { user } = useUser();
  const { users, hours, processes, levels } = useData();
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);
  const [showEditLevels, setShowEditLevels] = useState(false);
  const [showManageObjects, setShowManageObjects] = useState(false);
  const [showManageProcesses, setShowManageProcesses] = useState(false);
  
  // Завантажуємо працівників з таблиці Users
  const teamMembers = users.filter(u => u.managerId === user?.id || u.id === user?.id);

  // Функція для розрахунку статистики працівника
  const getEmployeeStats = (employeeId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const empHours = hours.filter(h => 
      h.userId === employeeId && h.date.startsWith(currentMonth)
    );
    
    const empProcesses = processes.filter(p => 
      p.userId === employeeId && p.date.startsWith(currentMonth)
    );
    
    const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);
    const hoursEarnings = empHours.reduce((sum, h) => sum + h.salary, 0);
    const processEarnings = empProcesses.reduce((sum, p) => sum + p.salary, 0);
    const totalEarnings = hoursEarnings + processEarnings;
    
    return { totalHours, totalEarnings };
  };

  // Отримуємо назву рівня
  const getLevelLabel = (levelName: string) => {
    const level = levels.find(l => l.name === levelName);
    return level ? level.name : levelName;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          👥 Команда
        </h2>
        <div className="flex gap-2">
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

      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-slate-500">
              Немає працівників у команді
            </p>
          </Card>
        ) : (
          teamMembers.map((employee) => {
            const isManager = employee.id === user?.id;
            const stats = getEmployeeStats(employee.id);
            
            return (
              <Card 
                key={employee.id} 
                className={`overflow-hidden ${
                  isManager 
                    ? 'border-2 border-purple-300 dark:border-purple-700' 
                    : ''
                }`}
              >
                <CardHeader className={`pb-3 ${
                  isManager
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    : 'bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        isManager
                          ? 'bg-gradient-to-br from-purple-500 to-pink-400'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      }`}>
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          {isManager && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                              Менеджер
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {getLevelLabel(employee.level)} • ₴{employee.hourlyRate}/год
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {!isManager && (
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Годин</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          {stats.totalHours.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Заробіток</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          ₴{stats.totalEarnings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => setViewingEmployee(employee)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Детальна Інформація
                  </Button>
                </CardContent>
              </Card>
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
    </div>
  );
}