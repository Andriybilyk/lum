import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config/constants';
import {
  readSheet,
  appendSheet,
  writeSheet,
  updateHourEntry,
  deleteHourEntry,
  updateProcessEntry,
  deleteProcessEntry
} from '../services/googleSheets';
import type {
  User,
  Hours,
  Process,
  Assignment,
  Level,
  ObjectType,
  ProcessType,
  AdditionalWork,
  TeamReport,
  EmployeeReport
} from '../types';

interface DataContextType {
  // Data
  users: User[];
  hours: Hours[];
  processes: Process[];
  assignments: Assignment[];
  levels: Level[];
  objects: ObjectType[];
  processTypes: ProcessType[];
  additionalWorks: AdditionalWork[];
  
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
  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  addAdditionalWork: (work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAdditionalWork: (id: string, updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;

  // Reports
  getTeamReport: (month: string) => TeamReport[];
  getEmployeeReport: (userId: string, month: string) => EmployeeReport;
  
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
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [isLoadingInProgress, setIsLoadingInProgress] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [hours, setHours] = useState<Hours[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);

  // Initialize and check configuration
  useEffect(() => {
    const init = async () => {
      try {
        // Check if Google Sheets is configured
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
        
        logger.debug('Configuration check', {
          hasApiKey: !!apiKey,
          hasSpreadsheetId: !!spreadsheetId,
          hasScriptUrl: !!scriptUrl
        }, 'DataContext');

        if (apiKey && spreadsheetId && scriptUrl) {
          setIsConfigured(true);
          logger.info('Google Sheets configured, loading data', 'DataContext');
          // Викликаємо завантаження даних напряму, не через loadDataFromSheets
          await loadData();
        } else {
          logger.warn('Google Sheets not fully configured', 'DataContext');
          setIsConfigured(false);
        }
      } catch (error) {
        logger.error('Failed to initialize', error, 'DataContext');
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // Окрема функція для завантаження даних (без перевірки isConfigured)
  const loadData = async (forceReload: boolean = false) => {
    const now = Date.now();
    const timeSinceLastLoad = lastLoadTime ? (now - lastLoadTime) / 1000 : Infinity;

    logger.debug('loadData called', {
      forceReload,
      lastLoadTime: lastLoadTime ? new Date(lastLoadTime).toLocaleTimeString() : 'never',
      timeSinceLastLoad: timeSinceLastLoad !== Infinity ? `${timeSinceLastLoad.toFixed(1)}s` : 'never',
      currentState: {
        users: users.length,
        hours: hours.length,
        processes: processes.length
      }
    }, 'DataContext');

    // Якщо вже йде завантаження, не запускаємо нове
    if (isLoadingInProgress) {
      logger.debug('Loading already in progress, skipping', 'DataContext');
      return;
    }

    // Перевірка кешу - не завантажувати якщо останнє завантаження було менше 15 хвилин тому
    const CACHE_DURATION = CONFIG.GOOGLE_SHEETS.CACHE_DURATION; // 15 хвилин
    if (!forceReload && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
      logger.debug('Using cached data (last load was less than 15 minutes ago)', 'DataContext');
      return;
    }

    logger.info('Loading fresh data from Google Sheets', 'DataContext');
    setIsSyncing(true);
    setIsLoadingInProgress(true);
    try {
      // Функція затримки для уникнення перевищення квоти API (60 запитів/хв = мін 2 сек між запитами)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Load users
      try {
        const usersData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS);
        logger.info('📊 Raw users data from sheet:', usersData, 'DataContext');
        logger.info('📊 Users data length:', usersData.length, 'DataContext');
        if (usersData.length > 1) {
          logger.info('📋 Processing users rows (excluding header)', 'DataContext');
          const loadedUsers = usersData.slice(1).map((row: string[], idx: number) => {
            logger.info(`📌 Processing user row ${idx}:`, row, 'DataContext');
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            const rawManagerId = row[5] ? String(row[5]) : '';
            const cleanedManagerId = rawManagerId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim() || undefined;

            // Показуємо приклад обробки для першого рядка
            if (idx === 0) {
              logger.debug(' User ID processing (first row):', {
                'raw id': rawId,
                'cleaned id': cleanedId,
                'name': row[1],
                'role': row[2],
                'level': row[3],
                'hourlyRate': row[4],
                'raw managerId': rawManagerId,
                'cleaned managerId': cleanedManagerId
              });
            }

            const parsedUser = {
              id: cleanedId,
              name: row[1],
              role: row[2] as 'employee' | 'manager',
              level: row[3],
              hourlyRate: parseFloat(row[4]) || 0,
              managerId: cleanedManagerId,
            };
            logger.info(`✅ Parsed user ${idx}:`, { id: parsedUser.id, name: parsedUser.name }, 'DataContext');
            return parsedUser;
          });
          logger.info('✅ Loaded users (processed):', loadedUsers, 'DataContext');
          setUsers(loadedUsers);
          logger.info('✅ Loaded users count:', loadedUsers.length, 'DataContext');
        } else {
          setUsers([]);
          logger.info('ℹ️ Loaded users: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load users:', error, 'DataContext');
        setUsers([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load hours
      try {
        const hoursData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.HOURS);
        logger.info('📊 Raw hours data from sheet:', hoursData, 'DataContext');
        if (hoursData.length > 1) {
          const loadedHours = hoursData.slice(1).map((row: string[], idx: number) => {
            const rawUserId = String(row[1]);
            const cleanedUserId = rawUserId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();

            // Показуємо приклад обробки для першого рядка
            if (idx === 0) {
              logger.debug(' Hours ID processing (first row):', {
                'raw userId': rawUserId,
                'cleaned userId': cleanedUserId,
                'raw id': rawId,
                'cleaned id': cleanedId,
                'date': row[2],
                'full row': row
              });
            }

            return {
              id: cleanedId,
              userId: cleanedUserId,
              date: row[2],
              hours: parseFloat(String(row[3]).replace(/[\s,]/g, '')) || 0,
              object: row[4],
              isBusinessTrip: row[5] === 'true',
              salary: parseFloat(String(row[6]).replace(/[\s,]/g, '')) || 0,
            };
          });
          setHours(loadedHours);
          logger.info('✅ Loaded hours:', loadedHours.length, 'DataContext');
        } else {
          // Якщо немає даних (тільки заголовки), очищаємо state
          setHours([]);
          logger.info('ℹ️ Loaded hours: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load hours:', error, 'DataContext');
        setHours([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load processes
      try {
        const processesData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESSES);
        logger.info('📊 Raw processes data from sheet:', processesData, 'DataContext');
        if (processesData.length > 1) {
          const loadedProcesses = processesData.slice(1).map((row: string[], idx: number) => {
            const rawUserId = String(row[1]);
            const cleanedUserId = rawUserId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();

            // Показуємо приклад обробки для першого рядка
            if (idx === 0) {
              logger.debug(' Process ID processing (first row):', {
                'raw userId': rawUserId,
                'cleaned userId': cleanedUserId,
                'raw id': rawId,
                'cleaned id': cleanedId,
                'date': row[2],
                'full row': row
              });
            }

            return {
              id: cleanedId,
              userId: cleanedUserId,
              date: row[2],
              processName: row[3],
              object: row[4] || undefined,
              volume: parseFloat(String(row[5]).replace(/[\s,]/g, '')) || 0,
              unit: row[6],
              rate: parseFloat(String(row[7]).replace(/[\s,]/g, '')) || 0,
              salary: parseFloat(String(row[8]).replace(/[\s,]/g, '')) || 0,
            };
          });
          setProcesses(loadedProcesses);
          logger.info('✅ Loaded processes:', loadedProcesses.length, 'DataContext');
        } else {
          // Якщо немає даних (тільки заголовки), очищаємо state
          setProcesses([]);
          logger.info('ℹ️ Loaded processes: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load processes:', error, 'DataContext');
        setProcesses([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load levels
      try {
        const levelsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS);
        logger.info('📊 Raw levels data from Google Sheets:', levelsData, 'DataContext');

        if (levelsData.length > 1) {
          const loadedLevels = levelsData.slice(1)
            .filter((row: string[]) => row[0] && row[1])
            .map((row: string[]) => {
              const rawId = String(row[0]);
              const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
              return {
                id: cleanedId,
                name: row[1],
                hourlyRate: parseFloat(row[2]) || 0,
              };
            });

          logger.info('✅ Loaded levels from Google Sheets:', loadedLevels, 'DataContext');
          setLevels(loadedLevels);
        } else {
          logger.warn('No levels found in Google Sheets (only headers or empty)');
        }
      } catch (error) {
        logger.error('❌ Could not load levels:', error, 'DataContext');
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load objects
      try {
        const objectsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS);
        if (objectsData.length > 1) {
          const loadedObjects = objectsData.slice(1).map((row: string[]) => {
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            return {
              id: cleanedId,
              name: row[1],
              isBusinessTrip: row[2] === 'true',
            };
          });
          setObjects(loadedObjects);
          logger.info('✅ Loaded objects:', loadedObjects.length, 'DataContext');
        }
      } catch (error) {
        logger.warn('Could not load objects:', error);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load process types
      try {
        const processTypesData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESS_TYPES);
        if (processTypesData.length > 1) {
          const loadedProcessTypes = processTypesData.slice(1).map((row: string[]) => {
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            return {
              id: cleanedId,
              name: row[1],
              object: row[2] || undefined,
              rate: parseFloat(row[3]) || 0,
              unit: row[4],
              plannedVolume: parseFloat(row[5]) || undefined,
            };
          });
          setProcessTypes(loadedProcessTypes);
          logger.info('✅ Loaded process types:', loadedProcessTypes.length, 'DataContext');
        }
      } catch (error) {
        logger.warn('Could not load process types:', error);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load assignments (optional - last priority)
      try {
        const assignmentsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.ASSIGNMENTS);
        if (assignmentsData.length > 1) {
          const loadedAssignments = assignmentsData.slice(1).map((row: string[]) => ({
            id: String(row[0]).replace(/[\s,]/g, '').trim(),
            employeeId: String(row[1]).replace(/[\s,]/g, '').trim(),
            managerId: String(row[2]).replace(/[\s,]/g, '').trim(),
            date: row[3],
            description: row[4],
            notes: row[5],
            status: row[6] as 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed',
          }));
          setAssignments(loadedAssignments);
          logger.info('✅ Loaded assignments:', loadedAssignments.length, 'DataContext');
        }
      } catch (error) {
        logger.warn('Could not load assignments:', error);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load additional works
      try {
        const additionalWorksData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.ADDITIONAL_WORKS);
        if (additionalWorksData.length > 1) {
          const loadedAdditionalWorks = additionalWorksData.slice(1).map((row: string[]) => ({
            id: String(row[0]).replace(/[\s,]/g, '').trim(),
            userId: String(row[1]).replace(/[\s,]/g, '').trim(),
            managerId: String(row[2]).replace(/[\s,]/g, '').trim(),
            objectName: row[3],
            date: row[4],
            workName: row[5],
            description: row[6],
            unit: row[7],
            volume: parseFloat(row[8]) || 0,
            rate: parseFloat(row[9]) || 0,
            salary: parseFloat(row[10]) || 0,
            status: (row[11] || 'pending') as 'pending' | 'approved' | 'rejected',
            createdAt: row[12] || new Date().toISOString(),
            updatedAt: row[13] || new Date().toISOString(),
          }));
          setAdditionalWorks(loadedAdditionalWorks);
          logger.info('✅ Loaded additional works:', loadedAdditionalWorks.length, 'DataContext');
        }
      } catch (error) {
        logger.warn('Could not load additional works:', error);
      }

    } catch (error) {
      logger.error('Failed to load data from sheets:', error, 'DataContext');
      // Якщо помилка quota exceeded, встановлюємо lastLoadTime щоб не повторювати запити
      if (error && typeof error === 'object' && 'message' in error) {
        const errMsg = String(error.message);
        if (errMsg.includes('429') || errMsg.includes('Quota exceeded')) {
          logger.warn('API quota exceeded, will retry after cache expires');
          setLastLoadTime(Date.now()); // Встановлюємо час для кешу
        }
      }
    } finally {
      setIsSyncing(false);
      setIsLoadingInProgress(false);
      if (!lastLoadTime) {
        setLastLoadTime(Date.now());
      }
      logger.info('✅ Data load completed', 'DataContext');
    }
  };

  const loadDataFromSheets = async (forceReload: boolean = false) => {
    if (!isConfigured) {
      logger.warn('Cannot load data: Google Sheets not configured');
      return;
    }
    await loadData(forceReload);
  };

  const syncWithGoogleSheets = async () => {
    if (!isConfigured) {
      logger.warn('Google Sheets not configured', 'DataContext');
      return;
    }

    setIsSyncing(true);
    try {
      // Sync users
      const usersValues = users.map(u => [
        parseInt(u.id), u.name, u.role, u.level, u.hourlyRate, u.managerId ? parseInt(u.managerId) : ''
      ]);
      if (usersValues.length > 0) {
        await writeSheet('Users!A2:F', usersValues);
      }

      // Sync hours
      const hoursValues = hours.map(h => [
        parseInt(h.id), parseInt(h.userId), h.date, h.hours, h.object, h.isBusinessTrip.toString(), h.salary
      ]);
      if (hoursValues.length > 0) {
        await writeSheet('Hours!A2:G', hoursValues);
      }

      // Sync processes
      const processesValues = processes.map(p => [
        parseInt(p.id), parseInt(p.userId), p.date, p.processName, p.object || '', p.volume, p.unit, p.rate, p.salary
      ]);
      if (processesValues.length > 0) {
        await writeSheet('Processes!A2:I', processesValues);
      }

      // Sync assignments
      const assignmentsValues = assignments.map(a => [
        parseInt(a.id), parseInt(a.employeeId), parseInt(a.managerId), a.date, a.description, a.notes, a.status
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
        pt.id, pt.name, pt.object || '', pt.rate, pt.unit, pt.plannedVolume || ''
      ]);
      if (processTypesValues.length > 0) {
        await writeSheet('ProcessTypes!A2:F', processTypesValues);
      }

    } catch (error) {
      logger.error('Failed to sync with sheets:', error, 'DataContext');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const addUser = async (user: Omit<User, 'id'> | User) => {
    // Якщо ID вже є, використовуємо його, інакше генеруємо новий
    const newUser = 'id' in user ? user : { ...user, id: Date.now().toString() };
    
    logger.info('👤 Adding user:', newUser, 'DataContext');
    logger.info('📊 Is configured:', isConfigured, 'DataContext');
    
    setUsers([...users, newUser]);
    
    if (isConfigured) {
      // ��икористовуємо setTimeout щоб не блокув��ти UI
      try {
        logger.info('💾 Saving user to Google Sheets...', 'DataContext');
        await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS, [[
          parseInt(newUser.id), newUser.name, newUser.role, newUser.level, newUser.hourlyRate, newUser.managerId ? parseInt(newUser.managerId) : ''
        ]]);
        logger.info('✅ User saved to Google Sheets', 'DataContext');
      } catch (error) {
        logger.error('❌ Failed to save user to Google Sheets:', error, 'DataContext');
        throw error;
      }
    } else {
      logger.warn('Google Sheets not configured, user saved locally only');
    }
  };

  const addHours = async (hoursData: Omit<Hours, 'id'>) => {
    const newHours = { ...hoursData, id: Date.now().toString() };
    setHours([...hours, newHours]);
    
    if (isConfigured) {
      try {
        await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.HOURS, [[
          parseInt(newHours.id), parseInt(newHours.userId), newHours.date, newHours.hours,
          newHours.object, newHours.isBusinessTrip.toString(), newHours.salary
        ]]);
      } catch (error) {
        logger.error('Failed to save hours to sheets:', error, 'DataContext');
      }
    }
  };

  const updateHours = async (id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) => {
    const hourEntry = hours.find(h => h.id === id);
    if (!hourEntry) {
      logger.error('Hour entry not found:', id, 'DataContext');
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
        logger.info('✅ Hour entry updated successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to update hours in sheets:', error, 'DataContext');
      }
    }
  };

  const deleteHours = async (id: string) => {
    setHours(hours.filter(h => h.id !== id));
    
    if (isConfigured) {
      try {
        await deleteHourEntry(id);
        logger.info('✅ Hour entry deleted successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to delete hours from sheets:', error, 'DataContext');
      }
    }
  };

  const addProcess = async (process: Omit<Process, 'id'>) => {
    const newProcess = { ...process, id: Date.now().toString() };

    logger.info('Adding process to memory and Google Sheets:', {
      id: newProcess.id,
      userId: newProcess.userId,
      date: newProcess.date,
      processName: newProcess.processName,
      object: newProcess.object,
      volume: newProcess.volume,
      unit: newProcess.unit,
      rate: newProcess.rate,
      salary: newProcess.salary
    });

    // Одразу додаємо в пам'ять, щоб UI оновився
    setProcesses(prev => [...prev, newProcess]);

    if (isConfigured) {
      try {
        await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESSES, [[
          parseInt(newProcess.id), parseInt(newProcess.userId), newProcess.date, newProcess.processName,
          newProcess.object || '', newProcess.volume, newProcess.unit, newProcess.rate, newProcess.salary
        ]]);
        logger.info('✅ Process saved to Google Sheets:', newProcess.processName, 'DataContext');
      } catch (error) {
        logger.error('❌ Failed to save process to sheets:', error, 'DataContext');
        // Видаляємо з пам'яті, якщо не вдалося зберегти
        setProcesses(prev => prev.filter(p => p.id !== newProcess.id));
        throw error;
      }
    } else {
      logger.warn('Google Sheets not configured, process saved only in memory');
    }
  };

  const updateProcess = async (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => {
    const processEntry = processes.find(p => p.id === id);
    if (!processEntry) {
      logger.error('Process entry not found:', id, 'DataContext');
      return;
    }

    const updatedEntry = { ...processEntry, ...updates };
    setProcesses(processes.map(p => p.id === id ? updatedEntry : p));
    
    if (isConfigured) {
      try {
        await updateProcessEntry(id, {
          date: updatedEntry.date,
          processName: updatedEntry.processName,
          object: updatedEntry.object,
          volume: updatedEntry.volume,
          unit: updatedEntry.unit,
          rate: updatedEntry.rate,
          salary: updatedEntry.salary
        });
        logger.info('✅ Process entry updated successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to update process in sheets:', error, 'DataContext');
      }
    }
  };

  const deleteProcess = async (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
    
    if (isConfigured) {
      try {
        await deleteProcessEntry(id);
        logger.info('✅ Process entry deleted successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to delete process from sheets:', error, 'DataContext');
      }
    }
  };

  const addAssignment = async (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment = { ...assignment, id: Date.now().toString() };
    setAssignments([...assignments, newAssignment]);
    
    if (isConfigured) {
      try {
        await appendSheet('Assignments!A:G', [[
          parseInt(newAssignment.id), parseInt(newAssignment.employeeId), parseInt(newAssignment.managerId),
          newAssignment.date, newAssignment.description, newAssignment.notes, newAssignment.status
        ]]);
      } catch (error) {
        logger.error('Failed to save assignment to sheets:', error, 'DataContext');
      }
    }
  };

  const updateAssignment = async (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to update assignment in sheets:', error, 'DataContext');
      }
    }
  };

  const addLevel = async (level: Omit<Level, 'id'>) => {
    const newLevel = { ...level, id: Date.now().toString() };
    setLevels([...levels, newLevel]);
    
    if (isConfigured) {
      try {
        await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS, [[parseInt(newLevel.id), newLevel.name, newLevel.hourlyRate]]);
      } catch (error) {
        logger.error('Failed to save level to sheets:', error, 'DataContext');
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
        logger.error('Failed to update level in sheets:', error, 'DataContext');
      }
    }
  };

  const deleteLevel = async (id: string) => {
    setLevels(levels.filter(l => l.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to delete level from sheets:', error, 'DataContext');
      }
    }
  };

  const addObject = async (object: Omit<ObjectType, 'id'>) => {
    const newObject = { ...object, id: Date.now().toString() };
    setObjects([...objects, newObject]);
    
    if (isConfigured) {
      try {
        await appendSheet('Objects!A:C', [[parseInt(newObject.id), newObject.name, newObject.isBusinessTrip ? 'true' : 'false']]);
      } catch (error) {
        logger.error('Failed to save object to sheets:', error, 'DataContext');
      }
    }
  };

  const updateObject = async (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => {
    setObjects(objects.map(o => o.id === id ? { ...o, ...updates } : o));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to update object in sheets:', error, 'DataContext');
      }
    }
  };

  const deleteObject = async (id: string) => {
    setObjects(objects.filter(o => o.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to delete object from sheets:', error, 'DataContext');
      }
    }
  };

  const addProcessType = async (processType: Omit<ProcessType, 'id'>) => {
    const newProcessType = { ...processType, id: Date.now().toString() };
    setProcessTypes([...processTypes, newProcessType]);

    if (isConfigured) {
      try {
        await appendSheet('ProcessTypes!A:F', [[
          parseInt(newProcessType.id), newProcessType.name, newProcessType.object || '', newProcessType.rate, newProcessType.unit, newProcessType.plannedVolume || ''
        ]]);
      } catch (error) {
        logger.error('Failed to save process type to sheets:', error, 'DataContext');
      }
    }
  };

  const updateProcessType = async (id: string, updates: Partial<Omit<ProcessType, 'id'>>) => {
    setProcessTypes(processTypes.map(pt => pt.id === id ? { ...pt, ...updates } : pt));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to update process type in sheets:', error, 'DataContext');
      }
    }
  };

  const deleteProcessType = async (id: string) => {
    setProcessTypes(processTypes.filter(pt => pt.id !== id));
    
    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to delete process type from sheets:', error, 'DataContext');
      }
    }
  };

  const updateUserLevel = async (userId: string, level: string, hourlyRate: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, level, hourlyRate } : u));

    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to update user level in sheets:', error, 'DataContext');
      }
    }
  };

  const updateUser = async (userId: string, updates: Partial<Omit<User, 'id'>>) => {
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));

    if (isConfigured) {
      try {
        await syncWithGoogleSheets();
      } catch (error) {
        logger.error('Failed to update user in sheets:', error, 'DataContext');
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
      object: p.object || '',
      volume: p.volume,
      unit: p.unit,
      rate: p.rate,
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

  const addAdditionalWork = async (work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newWork: AdditionalWork = {
      ...work,
      id,
      createdAt: now,
      updatedAt: now
    };

    try {
      await appendSheet('AdditionalWorks!A:K', [
        [parseInt(id), parseInt(work.userId), parseInt(work.managerId), work.objectName, work.date, work.workName, work.description, work.unit, work.volume, work.rate, work.salary, work.status, now]
      ]);

      setAdditionalWorks(prev => [...prev, newWork]);
      logger.info('✅ Additional work added:', newWork, 'DataContext');

      // Якщо статус 'approved' (для менеджера), одразу конвертуємо у процес
      if (work.status === 'approved') {
        try {
          logger.debug('Manager submitted work - Converting to process immediately...', {
            userId: work.userId,
            date: work.date,
            workName: work.workName
          });

          const newProcess: Omit<Process, 'id'> = {
            userId: work.userId,
            date: work.date,
            processName: work.workName,
            object: work.objectName,
            volume: work.volume,
            unit: work.unit,
            rate: work.rate,
            salary: work.salary
          };

          logger.info('📝 Creating new process from manager work:', newProcess, 'DataContext');
          await addProcess(newProcess);
          logger.info(`✅ Converted to process: ${work.workName}`, 'DataContext');
        } catch (conversionError) {
          logger.error('❌ Failed to convert manager work to process:', conversionError, 'DataContext');
          // Не кидаємо помилку, щоб додаткові роботи все ж таки були записані
        }
      }
    } catch (error) {
      logger.error('❌ Failed to add additional work:', error, 'DataContext');
      throw error;
    }
  };

  const updateAdditionalWork = async (id: string, updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const work = additionalWorks.find(w => w.id === id);
      if (!work) throw new Error('Additional work not found');

      const updatedWork: AdditionalWork = {
        ...work,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await writeSheet(`AdditionalWorks!A${additionalWorks.findIndex(w => w.id === id) + 2}:K${additionalWorks.findIndex(w => w.id === id) + 2}`, [
        [parseInt(updatedWork.id), parseInt(updatedWork.userId), parseInt(updatedWork.managerId), updatedWork.objectName, updatedWork.date, updatedWork.workName, updatedWork.description, updatedWork.unit, updatedWork.volume, updatedWork.rate, updatedWork.salary, updatedWork.status, updatedWork.updatedAt]
      ]);

      setAdditionalWorks(prev => prev.map(w => w.id === id ? updatedWork : w));
      logger.info('✅ Additional work updated:', updatedWork, 'DataContext');

      // Якщо статус змінено на 'approved', конвертуємо у процес
      if (updates.status === 'approved' && work.status !== 'approved') {
        logger.debug('Converting approved additional work to process...', {
          userId: updatedWork.userId,
          date: updatedWork.date,
          workName: updatedWork.workName
        });

        // Перевіримо чи вже існує процес
        const existingProcess = processes.find(p =>
          p.userId === updatedWork.userId &&
          p.date === updatedWork.date &&
          p.processName === updatedWork.workName
        );

        logger.debug(' Existing process check', {
          status: existingProcess ? 'Found' : 'Not found',
          totalProcesses: processes.length,
          matchedProcess: existingProcess ? {
            id: existingProcess.id,
            userId: existingProcess.userId,
            date: existingProcess.date,
            processName: existingProcess.processName
          } : null
        }, 'DataContext');

        if (!existingProcess) {
          try {
            // Конвертуємо у процес
            const newProcess: Omit<Process, 'id'> = {
              userId: updatedWork.userId,
              date: updatedWork.date,
              processName: updatedWork.workName,
              object: updatedWork.objectName,
              volume: updatedWork.volume,
              unit: updatedWork.unit,
              rate: updatedWork.rate,
              salary: updatedWork.salary
            };

            logger.info('📝 Creating new process:', newProcess, 'DataContext');
            await addProcess(newProcess);
            logger.info(`✅ Converted to process: ${updatedWork.workName}`, 'DataContext');
          } catch (conversionError) {
            logger.error('❌ Failed to convert additional work to process:', conversionError, 'DataContext');
            // Не кидаємо помилку, щоб затвердження все ще було записане
          }
        } else {
          logger.info('⏭️ Process already exists, skipping conversion', 'DataContext');
        }
      }
    } catch (error) {
      logger.error('❌ Failed to update additional work:', error, 'DataContext');
      throw error;
    }
  };

  const convertApprovedAdditionalWorksToProcesses = async () => {
    try {
      // Знаходимо затверджені додаткові роботи, які ще не були конвертовані
      // Перевіримо чи вже існує процес з такою інформацією
      const approvedWorks = additionalWorks.filter(w => w.status === 'approved');

      for (const work of approvedWorks) {
        // Перевіримо чи вже цей процес існує (за ID або за комбінацією користувача+дати+назви)
        const existingProcess = processes.find(p =>
          p.userId === work.userId &&
          p.date === work.date &&
          p.processName === work.workName
        );

        // Якщо процес вже існує, пропускаємо
        if (existingProcess) {
          logger.info(`⏭️ Process already exists for work: ${work.workName}`, 'DataContext');
          continue;
        }

        // Конвертуємо додаткові роботи у процес
        const newProcess: Omit<Process, 'id'> = {
          userId: work.userId,
          date: work.date,
          processName: work.workName,
          object: work.objectName,
          volume: work.volume,
          unit: work.unit,
          rate: work.rate,
          salary: work.salary
        };

        // Додаємо як процес
        await addProcess(newProcess);
        logger.info(`✅ Converted additional work to process: ${work.workName}`, 'DataContext');
      }
    } catch (error) {
      logger.error('❌ Failed to convert additional works:', error, 'DataContext');
      throw error;
    }
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
    additionalWorks,
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
    updateUser,
    addAdditionalWork,
    updateAdditionalWork,
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