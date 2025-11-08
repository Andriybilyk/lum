import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  readSheet,
  appendSheet,
  writeSheet,
  updateHourEntry,
  deleteHourEntry,
  updateProcessEntry,
  deleteProcessEntry
} from '../services/googleSheets';

interface User {
  id: string;
  name: string;
  role: 'employee' | 'manager';
  level: string;
  hourlyRate: number;
  managerId?: string;
}

interface Hours {
  id: string;
  userId: string;
  date: string;
  hours: number;
  object: string;
  isBusinessTrip: boolean;
  salary: number;
}

interface Process {
  id: string;
  userId: string;
  date: string;
  processName: string;
  volume: number;
  unit: string;
  salary: number;
}

interface Assignment {
  id: string;
  employeeId: string;
  managerId: string;
  date: string;
  description: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed';
}

interface Level {
  id: string;
  name: string;
  hourlyRate: number;
}

interface ObjectType {
  id: string;
  name: string;
  isBusinessTrip?: boolean;
}

interface ProcessType {
  id: string;
  name: string;
  rate: number;
  unit: string;
  plannedVolume?: number;
}

interface DataContextType {
  // Data
  users: User[];
  hours: Hours[];
  processes: Process[];
  assignments: Assignment[];
  levels: Level[];
  objects: ObjectType[];
  processTypes: ProcessType[];
  
  // Actions
  addUser: (user: Omit<User, 'id'> | User) => Promise<void>;
  addHours: (hours: Omit<Hours, 'id'>) => Promise<void>;
  updateHours: (id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) => Promise<void>;
  deleteHours: (id: string) => Promise<void>;
  addProcess: (process: Omit<Process, 'id'>) => Promise<void>;
  updateProcess: (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => Promise<void>;
  addLevel: (level: Omit<Level, 'id'>) => Promise<void>;
  updateLevel: (id: string, updates: { name?: string; rate?: number }) => Promise<void>;
  deleteLevel: (id: string) => Promise<void>;
  addObject: (object: Omit<ObjectType, 'id'>) => Promise<void>;
  updateObject: (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  addProcessType: (processType: Omit<ProcessType, 'id'>) => Promise<void>;
  updateProcessType: (id: string, updates: Partial<Omit<ProcessType, 'id'>>) => Promise<void>;
  deleteProcessType: (id: string) => Promise<void>;
  updateUserLevel: (userId: string, level: string, hourlyRate: number) => Promise<void>;
  
  // Reports
  getTeamReport: (month: string) => Array<{
    employeeId: string;
    name: string;
    hours: number;
    earnings: number;
  }>;
  getEmployeeReport: (userId: string, month: string) => {
    hours: Array<{ id: string; date: string; object: string; hours: number; businessTrip: boolean; earnings: number }>;
    processes: Array<{ id: string; date: string; name: string; volume: number; unit: string; rate: number; earnings: number }>;
    totalHours: number;
    totalEarnings: number;
  };
  
  // Sync
  syncWithGoogleSheets: () => Promise<void>;
  loadFromGoogleSheets: () => Promise<void>;
  isSyncing: boolean;
  isLoading: boolean;
  isConfigured: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [hours, setHours] = useState<Hours[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);

  // Initialize and check configuration
  useEffect(() => {
    const init = async () => {
      try {
        // Check if Google Sheets is configured
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
        
        console.log('🔧 Configuration check:', {
          hasApiKey: !!apiKey,
          hasSpreadsheetId: !!spreadsheetId,
          hasScriptUrl: !!scriptUrl
        });
        
        if (apiKey && spreadsheetId && scriptUrl) {
          setIsConfigured(true);
          console.log('✅ Google Sheets configured, loading data...');
          // Викликаємо завантаження даних напряму, не через loadDataFromSheets
          await loadData();
        } else {
          console.warn('⚠️ Google Sheets not fully configured.');
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('❌ Failed to initialize:', error);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // Окрема функція для завантаження даних (без перевірки isConfigured)
  const loadData = async () => {
    setIsSyncing(true);
    try {
      // Load users
      try {
        const usersData = await readSheet('Users!A:F');
        if (usersData.length > 1) {
          const loadedUsers = usersData.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            role: row[2] as 'employee' | 'manager',
            level: row[3],
            hourlyRate: parseFloat(row[4]) || 0,
            managerId: row[5] || undefined,
          }));
          setUsers(loadedUsers);
          console.log('✅ Loaded users:', loadedUsers.length);
        }
      } catch (error) {
        console.warn('Could not load users:', error);
      }

      // Load hours
      try {
        const hoursData = await readSheet('Hours!A:G');
        if (hoursData.length > 1) {
          const loadedHours = hoursData.slice(1).map(row => ({
            id: row[0],
            userId: row[1],
            date: row[2],
            hours: parseFloat(row[3]) || 0,
            object: row[4],
            isBusinessTrip: row[5] === 'true',
            salary: parseFloat(row[6]) || 0,
          }));
          setHours(loadedHours);
          console.log('✅ Loaded hours:', loadedHours.length);
        }
      } catch (error) {
        console.warn('Could not load hours:', error);
      }

      // Load processes
      try {
        const processesData = await readSheet('Processes!A:G');
        if (processesData.length > 1) {
          const loadedProcesses = processesData.slice(1).map(row => ({
            id: row[0],
            userId: row[1],
            date: row[2],
            processName: row[3],
            volume: parseFloat(row[4]) || 0,
            unit: row[5],
            salary: parseFloat(row[6]) || 0,
          }));
          setProcesses(loadedProcesses);
          console.log('✅ Loaded processes:', loadedProcesses.length);
        }
      } catch (error) {
        console.warn('Could not load processes:', error);
      }

      // Load assignments
      try {
        const assignmentsData = await readSheet('Assignments!A:G');
        if (assignmentsData.length > 1) {
          const loadedAssignments = assignmentsData.slice(1).map(row => ({
            id: row[0],
            employeeId: row[1],
            managerId: row[2],
            date: row[3],
            description: row[4],
            notes: row[5],
            status: row[6] as 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed',
          }));
          setAssignments(loadedAssignments);
          console.log('✅ Loaded assignments:', loadedAssignments.length);
        }
      } catch (error) {
        console.warn('Could not load assignments:', error);
      }

      // Load levels - КРИТИЧНО: завантажуємо рівні з Google Sheets
      try {
        const levelsData = await readSheet('Levels!A:C');
        console.log('📊 Raw levels data from Google Sheets:', levelsData);
        
        if (levelsData.length > 1) {
          const loadedLevels = levelsData.slice(1)
            .filter(row => row[0] && row[1])
            .map(row => ({
              id: row[0],
              name: row[1],
              hourlyRate: parseFloat(row[2]) || 0,
            }));
          
          console.log('✅ Loaded levels from Google Sheets:', loadedLevels);
          setLevels(loadedLevels);
        } else {
          console.warn('⚠️ No levels found in Google Sheets (only headers or empty)');
        }
      } catch (error) {
        console.error('❌ Could not load levels:', error);
      }

      // Load objects
      try {
        const objectsData = await readSheet('Objects!A:C');
        if (objectsData.length > 1) {
          const loadedObjects = objectsData.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            isBusinessTrip: row[2] === 'true',
          }));
          setObjects(loadedObjects);
          console.log('✅ Loaded objects:', loadedObjects.length);
        }
      } catch (error) {
        console.warn('Could not load objects:', error);
      }

      // Load process types
      try {
        const processTypesData = await readSheet('ProcessTypes!A:E');
        if (processTypesData.length > 1) {
          const loadedProcessTypes = processTypesData.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            rate: parseFloat(row[2]) || 0,
            unit: row[3],
            plannedVolume: parseFloat(row[4]) || undefined,
          }));
          setProcessTypes(loadedProcessTypes);
          console.log('✅ Loaded process types:', loadedProcessTypes.length);
        }
      } catch (error) {
        console.warn('Could not load process types:', error);
      }

    } catch (error) {
      console.error('Failed to load data from sheets:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadDataFromSheets = async () => {
    if (!isConfigured) {
      console.warn('⚠️ Cannot load data: Google Sheets not configured');
      return;
    }
    await loadData();
  };

  const syncWithGoogleSheets = async () => {
    if (!isConfigured) {
      console.warn('Google Sheets not configured');
      return;
    }

    setIsSyncing(true);
    try {
      // Sync users
      const usersValues = users.map(u => [
        u.id, u.name, u.role, u.level, u.hourlyRate, u.managerId || ''
      ]);
      if (usersValues.length > 0) {
        await writeSheet('Users!A2:F', usersValues);
      }

      // Sync hours
      const hoursValues = hours.map(h => [
        h.id, h.userId, h.date, h.hours, h.object, h.isBusinessTrip.toString(), h.salary
      ]);
      if (hoursValues.length > 0) {
        await writeSheet('Hours!A2:G', hoursValues);
      }

      // Sync processes
      const processesValues = processes.map(p => [
        p.id, p.userId, p.date, p.processName, p.volume, p.unit, p.salary
      ]);
      if (processesValues.length > 0) {
        await writeSheet('Processes!A2:G', processesValues);
      }

      // Sync assignments
      const assignmentsValues = assignments.map(a => [
        a.id, a.employeeId, a.managerId, a.date, a.description, a.notes, a.status
      ]);
      if (assignmentsValues.length > 0) {
        await writeSheet('Assignments!A2:G', assignmentsValues);
      }

      // Sync levels - використовуємо HourlyRate як назву колонки
      const levelsValues = levels.map(l => [l.id, l.name, l.hourlyRate]);
      if (levelsValues.length > 0) {
        await writeSheet('Levels!A2:C', levelsValues);
      }

      // Sync objects
      const objectsValues = objects.map(o => [o.id, o.name, o.isBusinessTrip ? 'true' : 'false']);
      if (objectsValues.length > 0) {
        await writeSheet('Objects!A2:C', objectsValues);
      }

      // Sync process types
      const processTypesValues = processTypes.map(pt => [
        pt.id, pt.name, pt.rate, pt.unit, pt.plannedVolume || ''
      ]);
      if (processTypesValues.length > 0) {
        await writeSheet('ProcessTypes!A2:E', processTypesValues);
      }

    } catch (error) {
      console.error('Failed to sync with sheets:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const addUser = async (user: Omit<User, 'id'> | User) => {
    // Якщо ID вже є, використовуємо його, інакше генеруємо новий
    const newUser = 'id' in user ? user : { ...user, id: Date.now().toString() };
    
    console.log('👤 Adding user:', newUser);
    console.log('📊 Is configured:', isConfigured);
    
    setUsers([...users, newUser]);
    
    if (isConfigured) {
      // ��икористовуємо setTimeout щоб не блокув��ти UI
      setTimeout(() => {
        console.log('💾 Saving user to Google Sheets...');
        appendSheet('Users!A:F', [[
          newUser.id, newUser.name, newUser.role, newUser.level, newUser.hourlyRate, newUser.managerId || ''
        ]]);
        console.log('✅ User save request sent');
      }, 100);
    } else {
      console.warn('⚠️ Google Sheets not configured, user saved locally only');
    }
  };

  const addHours = async (hoursData: Omit<Hours, 'id'>) => {
    const newHours = { ...hoursData, id: Date.now().toString() };
    setHours([...hours, newHours]);
    
    if (isConfigured) {
      try {
        await appendSheet('Hours!A:G', [[
          newHours.id, newHours.userId, newHours.date, newHours.hours, 
          newHours.object, newHours.isBusinessTrip.toString(), newHours.salary
        ]]);
      } catch (error) {
        console.error('Failed to save hours to sheets:', error);
      }
    }
  };

  const updateHours = async (id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) => {
    const hourEntry = hours.find(h => h.id === id);
    if (!hourEntry) {
      console.error('Hour entry not found:', id);
      return;
    }

    const updatedEntry = { ...hourEntry, ...updates };
    setHours(hours.map(h => h.id === id ? updatedEntry : h));
    
    if (isConfigured) {
      try {
        await updateHourEntry(id, {
          date: updatedEntry.date,
          hours: updatedEntry.hours,
          object: updatedEntry.object,
          isBusinessTrip: updatedEntry.isBusinessTrip,
          salary: updatedEntry.salary
        });
        console.log('✅ Hour entry updated successfully');
      } catch (error) {
        console.error('Failed to update hours in sheets:', error);
      }
    }
  };

  const deleteHours = async (id: string) => {
    setHours(hours.filter(h => h.id !== id));
    
    if (isConfigured) {
      try {
        await deleteHourEntry(id);
        console.log('✅ Hour entry deleted successfully');
      } catch (error) {
        console.error('Failed to delete hours from sheets:', error);
      }
    }
  };

  const addProcess = async (process: Omit<Process, 'id'>) => {
    const newProcess = { ...process, id: Date.now().toString() };
    setProcesses([...processes, newProcess]);
    
    if (isConfigured) {
      try {
        await appendSheet('Processes!A:G', [[
          newProcess.id, newProcess.userId, newProcess.date, newProcess.processName,
          newProcess.volume, newProcess.unit, newProcess.salary
        ]]);
      } catch (error) {
        console.error('Failed to save process to sheets:', error);
      }
    }
  };

  const updateProcess = async (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => {
    const processEntry = processes.find(p => p.id === id);
    if (!processEntry) {
      console.error('Process entry not found:', id);
      return;
    }

    const updatedEntry = { ...processEntry, ...updates };
    setProcesses(processes.map(p => p.id === id ? updatedEntry : p));
    
    if (isConfigured) {
      try {
        await updateProcessEntry(id, {
          date: updatedEntry.date,
          processName: updatedEntry.processName,
          volume: updatedEntry.volume,
          unit: updatedEntry.unit,
          salary: updatedEntry.salary
        });
        console.log('✅ Process entry updated successfully');
      } catch (error) {
        console.error('Failed to update process in sheets:', error);
      }
    }
  };

  const deleteProcess = async (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
    
    if (isConfigured) {
      try {
        await deleteProcessEntry(id);
        console.log('✅ Process entry deleted successfully');
      } catch (error) {
        console.error('Failed to delete process from sheets:', error);
      }
    }
  };

  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment = { ...assignment, id: Date.now().toString() };
    setAssignments([...assignments, newAssignment]);
    
    if (isConfigured) {
      try {
        await appendSheet('Assignments!A:G', [[
          newAssignment.id, newAssignment.employeeId, newAssignment.managerId,
          newAssignment.date, newAssignment.description, newAssignment.notes, newAssignment.status
        ]]);
      } catch (error) {
        console.error('Failed to save assignment to sheets:', error);
      }
    }
  };

  const updateAssignment = async (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to update assignment in sheets:', error);
      }
    }
  };

  const addLevel = async (level: Omit<Level, 'id'>) => {
    const newLevel = { ...level, id: Date.now().toString() };
    setLevels([...levels, newLevel]);
    
    if (isConfigured) {
      try {
        await appendSheet('Levels!A:C', [[newLevel.id, newLevel.name, newLevel.hourlyRate]]);
      } catch (error) {
        console.error('Failed to save level to sheets:', error);
      }
    }
  };

  const updateLevel = async (id: string, updates: { name?: string; rate?: number }) => {
    setLevels(levels.map(l => {
      if (l.id === id) {
        return {
          ...l,
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.rate !== undefined && { hourlyRate: updates.rate })
        };
      }
      return l;
    }));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to update level in sheets:', error);
      }
    }
  };

  const deleteLevel = async (id: string) => {
    setLevels(levels.filter(l => l.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to delete level from sheets:', error);
      }
    }
  };

  const addObject = async (object: Omit<ObjectType, 'id'>) => {
    const newObject = { ...object, id: Date.now().toString() };
    setObjects([...objects, newObject]);
    
    if (isConfigured) {
      try {
        await appendSheet('Objects!A:C', [[newObject.id, newObject.name, newObject.isBusinessTrip ? 'true' : 'false']]);
      } catch (error) {
        console.error('Failed to save object to sheets:', error);
      }
    }
  };

  const updateObject = async (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => {
    setObjects(objects.map(o => o.id === id ? { ...o, ...updates } : o));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to update object in sheets:', error);
      }
    }
  };

  const deleteObject = async (id: string) => {
    setObjects(objects.filter(o => o.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to delete object from sheets:', error);
      }
    }
  };

  const addProcessType = async (processType: Omit<ProcessType, 'id'>) => {
    const newProcessType = { ...processType, id: Date.now().toString() };
    setProcessTypes([...processTypes, newProcessType]);
    
    if (isConfigured) {
      try {
        await appendSheet('ProcessTypes!A:E', [[
          newProcessType.id, newProcessType.name, newProcessType.rate, newProcessType.unit, newProcessType.plannedVolume || ''
        ]]);
      } catch (error) {
        console.error('Failed to save process type to sheets:', error);
      }
    }
  };

  const updateProcessType = async (id: string, updates: Partial<Omit<ProcessType, 'id'>>) => {
    setProcessTypes(processTypes.map(pt => pt.id === id ? { ...pt, ...updates } : pt));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to update process type in sheets:', error);
      }
    }
  };

  const deleteProcessType = async (id: string) => {
    setProcessTypes(processTypes.filter(pt => pt.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to delete process type from sheets:', error);
      }
    }
  };

  const updateUserLevel = async (userId: string, level: string, hourlyRate: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, level, hourlyRate } : u));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        console.error('Failed to update user level in sheets:', error);
      }
    }
  };

  const getTeamReport = (month: string) => {
    // Включаємо всіх користувачів (і працівників, і менеджерів)
    const allUsers = users;
    
    return allUsers.map(emp => {
      // Фільтруємо години за місяцем
      const empHours = hours.filter(h => 
        h.userId === emp.id && h.date.startsWith(month)
      );
      
      // Фільтруємо процеси за місяцем
      const empProcesses = processes.filter(p => 
        p.userId === emp.id && p.date.startsWith(month)
      );
      
      // Рахуємо загальні години
      const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);
      
      // Рахуємо загальний заробіток
      const hoursEarnings = empHours.reduce((sum, h) => sum + h.salary, 0);
      const processEarnings = empProcesses.reduce((sum, p) => sum + p.salary, 0);
      const totalEarnings = hoursEarnings + processEarnings;
      
      return {
        employeeId: emp.id,
        name: emp.name,
        hours: totalHours,
        earnings: totalEarnings,
      };
    });
  };

  const getEmployeeReport = (userId: string, month: string) => {
    // Фільтруємо години за місяцем
    const empHours = hours.filter(h => 
      h.userId === userId && h.date.startsWith(month)
    );
    
    // Фільтруємо процеси за місяцем
    const empProcesses = processes.filter(p => 
      p.userId === userId && p.date.startsWith(month)
    );
    
    // Форматуємо години
    const formattedHours = empHours.map(h => ({
      id: h.id,
      date: h.date,
      object: h.object,
      hours: h.hours,
      businessTrip: h.isBusinessTrip,
      earnings: h.salary,
    }));
    
    // Форматуємо процеси
    const formattedProcesses = empProcesses.map(p => ({
      id: p.id,
      date: p.date,
      name: p.processName,
      volume: p.volume,
      unit: p.unit,
      rate: p.salary / p.volume, // Розраховуємо ставку
      earnings: p.salary,
    }));
    
    // Рахуємо загальні години
    const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);
    
    // Рахуємо загальний заробіток
    const hoursEarnings = empHours.reduce((sum, h) => sum + h.salary, 0);
    const processEarnings = empProcesses.reduce((sum, p) => sum + p.salary, 0);
    const totalEarnings = hoursEarnings + processEarnings;
    
    return {
      hours: formattedHours,
      processes: formattedProcesses,
      totalHours,
      totalEarnings,
    };
  };

  const value: DataContextType = {
    syncWithGoogleSheets,
    loadFromGoogleSheets: loadDataFromSheets,
    isSyncing,
    isLoading,
    isConfigured,
    users,
    hours,
    processes,
    assignments,
    levels,
    objects,
    processTypes,
    addUser,
    addHours,
    updateHours,
    deleteHours,
    addProcess,
    updateProcess,
    deleteProcess,
    addAssignment,
    updateAssignment,
    addLevel,
    updateLevel,
    deleteLevel,
    addObject,
    updateObject,
    deleteObject,
    addProcessType,
    updateProcessType,
    deleteProcessType,
    updateUserLevel,
    getTeamReport,
    getEmployeeReport,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};