import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, DollarSign, Briefcase, Package, Building2 } from 'lucide-react';
import ExportMenu from '@/components/export/ExportMenu';

interface EmployeeObjectData {
  employeeId: string;
  employeeName: string;
  hours: number;
  hoursEarnings: number;
  processes: Array<{
    processName: string;
    volume: number;
    unit: string;
    earnings: number;
  }>;
  processesEarnings: number;
  materials: Array<{
    materialName: string;
    quantity: number;
    unit: string;
  }>;
  totalEarnings: number;
}

export default function ObjectReports() {
  const { objects, hours, processes, materials, users } = useData();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedObject, setSelectedObject] = useState<string>('');

  // Calculate object report data
  const objectData = useMemo(() => {
    if (!selectedObject) return [];

    const employeeMap = new Map<string, EmployeeObjectData>();

    // Process hours
    const objectHours = hours.filter(h =>
      h.object === selectedObject &&
      h.date &&
      h.date.startsWith(selectedMonth)
    );

    objectHours.forEach(h => {
      const user = users.find(u => u.id === h.userId);
      if (!user) return;

      if (!employeeMap.has(h.userId)) {
        employeeMap.set(h.userId, {
          employeeId: h.userId,
          employeeName: user.name,
          hours: 0,
          hoursEarnings: 0,
          processes: [],
          processesEarnings: 0,
          materials: [],
          totalEarnings: 0,
        });
      }

      const empData = employeeMap.get(h.userId)!;
      empData.hours += h.hours;
      empData.hoursEarnings += h.salary;
      empData.totalEarnings += h.salary;
    });

    // Process processes
    const objectProcesses = processes.filter(p =>
      p.object === selectedObject &&
      p.date &&
      p.date.startsWith(selectedMonth)
    );

    objectProcesses.forEach(p => {
      const user = users.find(u => u.id === p.userId);
      if (!user) return;

      if (!employeeMap.has(p.userId)) {
        employeeMap.set(p.userId, {
          employeeId: p.userId,
          employeeName: user.name,
          hours: 0,
          hoursEarnings: 0,
          processes: [],
          processesEarnings: 0,
          materials: [],
          totalEarnings: 0,
        });
      }

      const empData = employeeMap.get(p.userId)!;
      empData.processes.push({
        processName: p.processName,
        volume: p.volume,
        unit: p.unit,
        earnings: p.salary,
      });
      empData.processesEarnings += p.salary;
      empData.totalEarnings += p.salary;
    });

    // Process materials
    const objectMaterials = materials.filter(m =>
      m.object === selectedObject &&
      m.date &&
      m.date.startsWith(selectedMonth)
    );

    objectMaterials.forEach(m => {
      const user = users.find(u => u.id === m.userId);
      if (!user) return;

      if (!employeeMap.has(m.userId)) {
        employeeMap.set(m.userId, {
          employeeId: m.userId,
          employeeName: user.name,
          hours: 0,
          hoursEarnings: 0,
          processes: [],
          processesEarnings: 0,
          materials: [],
          totalEarnings: 0,
        });
      }

      const empData = employeeMap.get(m.userId)!;
      empData.materials.push({
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
      });
    });

    return Array.from(employeeMap.values()).sort((a, b) =>
      b.totalEarnings - a.totalEarnings
    );
  }, [selectedObject, selectedMonth, hours, processes, materials, users]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalHours: objectData.reduce((sum, emp) => sum + emp.hours, 0),
      totalEarnings: objectData.reduce((sum, emp) => sum + emp.totalEarnings, 0),
      totalProcesses: objectData.reduce((sum, emp) => sum + emp.processes.length, 0),
      totalMaterials: objectData.reduce((sum, emp) => sum + emp.materials.length, 0),
    };
  }, [objectData]);

  // Prepare export data
  const exportData = useMemo(() => {
    const data: any[] = [];

    objectData.forEach(emp => {
      // Main employee row
      data.push({
        Працівник: emp.employeeName,
        Години: emp.hours,
        'Заробіток за години': emp.hoursEarnings,
        'Кількість процесів': emp.processes.length,
        'Заробіток за процеси': emp.processesEarnings,
        'Кількість матеріалів': emp.materials.length,
        'Всього заробіток': emp.totalEarnings,
      });

      // Process details
      emp.processes.forEach(p => {
        data.push({
          Працівник: `  → Процес: ${p.processName}`,
          Години: '',
          'Заробіток за години': '',
          'Кількість процесів': `${p.volume} ${p.unit}`,
          'Заробіток за процеси': p.earnings,
          'Кількість матеріалів': '',
          'Всього заробіток': '',
        });
      });

      // Material details
      emp.materials.forEach(m => {
        data.push({
          Працівник: `  → Матеріал: ${m.materialName}`,
          Години: '',
          'Заробіток за години': '',
          'Кількість процесів': '',
          'Заробіток за процеси': '',
          'Кількість матеріалів': `${m.quantity} ${m.unit}`,
          'Всього заробіток': '',
        });
      });
    });

    return data;
  }, [objectData]);

  const selectedObjectName = objects.find(o => o.name === selectedObject)?.name || selectedObject;

  return (
    <div className="container-responsive space-y-3 sm:space-y-4 pb-20 sm:pb-24">
      {/* Header */}
      <div className="pt-3 sm:pt-4 pb-2 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
          📊 Звіти по Об'єктах
        </h2>
      </div>

      <Card className="p-3 sm:p-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Об'єкт
            </label>
            <Select value={selectedObject} onValueChange={setSelectedObject}>
              <SelectTrigger className="h-11 sm:h-12">
                <SelectValue placeholder="Оберіть об'єкт" />
              </SelectTrigger>
              <SelectContent>
                {objects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.name}>
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Місяць
            </label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-11 sm:h-12"
            />
          </div>
        </div>

        {!selectedObject ? (
          <Card className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-500">Оберіть об'єкт для перегляду звіту</p>
          </Card>
        ) : objectData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">Немає даних за обраний період</p>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <Clock className="w-4 h-4 mb-1 opacity-80" />
                <p className="text-xl sm:text-2xl font-bold">{totals.totalHours.toFixed(1)}</p>
                <p className="text-[10px] sm:text-xs opacity-80">Всього Годин</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-purple-500 to-pink-400 text-white">
                <Briefcase className="w-4 h-4 mb-1 opacity-80" />
                <p className="text-xl sm:text-2xl font-bold">{totals.totalProcesses}</p>
                <p className="text-[10px] sm:text-xs opacity-80">Процесів</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-amber-600 to-orange-500 text-white">
                <Package className="w-4 h-4 mb-1 opacity-80" />
                <p className="text-xl sm:text-2xl font-bold">{totals.totalMaterials}</p>
                <p className="text-[10px] sm:text-xs opacity-80">Матеріалів</p>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 text-white">
                <DollarSign className="w-4 h-4 mb-1 opacity-80" />
                <p className="text-xl sm:text-2xl font-bold">₴{totals.totalEarnings.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs opacity-80">Заробіток</p>
              </Card>
            </div>

            {/* Employee Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
                Розподіл по працівникам
              </h3>

              {objectData.map((emp) => (
                <Card key={emp.employeeId} className="p-3 sm:p-4">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                        {emp.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                          {emp.employeeName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                          <span>{emp.hours.toFixed(1)} год</span>
                          <span>•</span>
                          <span>{emp.processes.length} процесів</span>
                          <span>•</span>
                          <span>{emp.materials.length} матеріалів</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                        ₴{emp.totalEarnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">всього</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Hours */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Години
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                        <p className="text-sm font-semibold">{emp.hours.toFixed(1)} год</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          ₴{emp.hoursEarnings.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Processes */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        Процеси ({emp.processes.length})
                      </p>
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-2 rounded space-y-1 max-h-32 overflow-y-auto">
                        {emp.processes.length === 0 ? (
                          <p className="text-xs text-slate-500">Немає процесів</p>
                        ) : (
                          emp.processes.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              <p className="font-medium truncate">{p.processName}</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                {p.volume} {p.unit} • ₴{p.earnings}
                              </p>
                            </div>
                          ))
                        )}
                        {emp.processes.length > 0 && (
                          <div className="pt-1 border-t border-purple-200 dark:border-purple-800">
                            <p className="text-xs font-semibold">
                              Всього: ₴{emp.processesEarnings.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Матеріали ({emp.materials.length})
                      </p>
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded space-y-1 max-h-32 overflow-y-auto">
                        {emp.materials.length === 0 ? (
                          <p className="text-xs text-slate-500">Немає матеріалів</p>
                        ) : (
                          emp.materials.map((m, idx) => (
                            <div key={idx} className="text-xs">
                              <p className="font-medium truncate">{m.materialName}</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                {m.quantity} {m.unit}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Export Button */}
      {selectedObject && objectData.length > 0 && (
        <div className="flex justify-center sm:justify-end">
          <ExportMenu
            data={exportData}
            filename={`object-report-${selectedObjectName}-${selectedMonth}`}
            reportTitle={`Звіт по об'єкту "${selectedObjectName}" за ${selectedMonth}`}
            reportDate={selectedMonth}
            disabled={objectData.length === 0}
            includesSummary={true}
            summaryFields={['Години', 'Всього заробіток']}
          />
        </div>
      )}
    </div>
  );
}
