import { useState, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, DollarSign, Eye, Users, Building2 } from 'lucide-react';
import { FeatureErrorBoundary } from '@/components/providers/FeatureErrorBoundary';
import EmployeeReportDetailsModal from './EmployeeReportDetailsModal';
import ObjectReports from './ObjectReports';
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
      <div className="container-responsive space-y-3 sm:space-y-4 pb-20 sm:pb-24">
        {/* Заголовок по центру */}
        <div className="pt-3 sm:pt-4 pb-2 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            📊 Звіти
          </h2>
        </div>

        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Команда
            </TabsTrigger>
            <TabsTrigger value="objects" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Об'єкти
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team"  className="mt-0">

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">Оберіть Місяць</h3>
          <Input
            id="manager-report-month-picker"
            name="manager-report-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-40 h-11 sm:h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white border-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 opacity-80" />
            <p className="text-xl sm:text-2xl font-bold">{totalTeamHours.toFixed(1)}</p>
            <p className="text-[10px] sm:text-xs opacity-80">Всього Годин</p>
          </Card>
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-400 text-white border-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2 opacity-80" />
            <p className="text-xl sm:text-2xl font-bold">₴{totalTeamEarnings.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs opacity-80">Всього Заробіток</p>
          </Card>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Звіт по Працівникам
          </h4>
          {teamReport.length === 0 ? (
            <Card className="p-6 sm:p-8">
              <p className="text-center text-slate-500 text-sm sm:text-base">
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
                  className={`p-3 sm:p-4 ${
                    isManager
                      ? 'border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg sm:text-xl ${
                        isManager
                          ? 'bg-gradient-to-br from-purple-500 to-pink-400'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      }`}>
                        {emp.name ? emp.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">{emp.name || 'Без імені'}</p>
                          {isManager && (
                            <span className="text-xs sm:text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-medium flex-shrink-0">
                              Менеджер
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {emp.hours.toFixed(1)} год
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                          ₴{emp.earnings.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEmployee({ id: emp.employeeId, name: emp.name || 'Без імені' })}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                        title="Детальна інформація"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>

      {/* Кнопка експорту внизу */}
      <div className="flex justify-center sm:justify-end">
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

          {selectedEmployee && (
            <EmployeeReportDetailsModal
              open={!!selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
              employeeId={selectedEmployee.id}
              employeeName={selectedEmployee.name}
              month={selectedMonth}
            />
          )}
          </TabsContent>

          <TabsContent value="objects" className="mt-0">
            <ObjectReports />
          </TabsContent>
        </Tabs>
      </div>
    </FeatureErrorBoundary>
  );
}