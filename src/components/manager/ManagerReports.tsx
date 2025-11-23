import { useState, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, DollarSign, Eye } from 'lucide-react';
import { FeatureErrorBoundary } from '@/components/providers/FeatureErrorBoundary';
import EmployeeReportDetailsModal from './EmployeeReportDetailsModal';
import ExportMenu from '@/components/export/ExportMenu';

export default function ManagerReports() {
  const { user } = useUser();
  const { getTeamReport, users } = useData();

  // Встановлюємо поточний місяць за замовчуванням
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);

  const teamReport = useMemo(() => {
    const reportData = getTeamReport(selectedMonth);
    return reportData.filter(emp => {
      const empUser = users.find(u => u.id === emp.employeeId);
      return empUser && (empUser.managerId === user?.id || empUser.id === user?.id);
    });
  }, [getTeamReport, selectedMonth, users, user?.id]);

  const { totalTeamHours, totalTeamEarnings } = useMemo(() => ({
    totalTeamHours: teamReport.reduce((sum, emp) => sum + emp.hours, 0),
    totalTeamEarnings: teamReport.reduce((sum, emp) => sum + emp.earnings, 0),
  }), [teamReport]);

  const exportData = useMemo(() => {
    return teamReport.map((emp) => {
      const empUser = users.find(u => u.id === emp.employeeId);
      return {
        ПІБ: emp.name,
        Посада: empUser?.role === 'manager' ? 'Менеджер' : 'Працівник',
        Години: emp.hours,
        Заробіток: emp.earnings,
        Місяць: selectedMonth,
      };
    });
  }, [teamReport, selectedMonth, users]);


  return (
    <FeatureErrorBoundary featureName="ManagerReports">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          📊 Звіти Команди
        </h2>
        <ExportMenu
          data={exportData}
          filename={`team-report-${selectedMonth}`}
          reportTitle={`Звіт команди за ${selectedMonth}`}
          reportDate={selectedMonth}
          disabled={teamReport.length === 0}
          includesSummary={true}
          summaryFields={['Години', 'Заробіток']}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">Оберіть Місяць</h3>
          <Input
            id="manager-report-month-picker"
            name="manager-report-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white border-0">
            <Clock className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{totalTeamHours.toFixed(1)}</p>
            <p className="text-xs opacity-80">Всього Годин</p>
          </Card>
          <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 text-white border-0">
            <DollarSign className="w-4 h-4 mb-1 opacity-80" />
            <p className="text-2xl font-bold">{totalTeamEarnings.toLocaleString()} грн</p>
            <p className="text-xs opacity-80">Всього Заробіток</p>
          </Card>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Звіт по Працівникам
          </h4>
          {teamReport.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-slate-500">
                Немає даних за обраний місяць
              </p>
            </Card>
          ) : (
            teamReport.map((emp) => {
              const empUser = users.find(u => u.id === emp.employeeId);
              const isManager = empUser?.id === user?.id;
              
              return (
                <Card 
                  key={emp.employeeId} 
                  className={`p-3 ${
                    isManager 
                      ? 'border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isManager
                          ? 'bg-gradient-to-br from-purple-500 to-pink-400'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      }`}>
                        {emp.name ? emp.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 dark:text-white">{emp.name || 'Без імені'}</p>
                          {isManager && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                              Менеджер
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {emp.hours.toFixed(1)} год
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {emp.earnings.toLocaleString()} грн
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEmployee({ id: emp.employeeId, name: emp.name || 'Без імені' })}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Детальна інформація"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>

      {selectedEmployee && (
        <EmployeeReportDetailsModal
          open={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          month={selectedMonth}
        />
      )}
      </div>
    </FeatureErrorBoundary>
  );
}