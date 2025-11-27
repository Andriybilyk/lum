import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { CONFIG } from '@/config/constants';
import { appendSheet } from '../services/googleSheets';
import * as dataAdapter from '../services/dataAdapter';
import type {
  User,
  Hours,
  Process,
  Assignment,
  Level,
  ObjectType,
  ProcessType,
  AdditionalWork,
  Material,
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
  materials: Material[];
  
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
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;

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
  const [materials, setMaterials] = useState<Material[]>([]);

  // LocalStorage helpers для швидкого кешування
  const CACHE_KEY = 'timetracker_data_cache';
  const CACHE_VERSION = '1.0';

  const loadFromLocalStorage = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if (parsed.version !== CACHE_VERSION) {
        logger.info('Cache version mismatch, clearing cache', 'DataContext');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      const cacheAge = Date.now() - parsed.timestamp;
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 години

      if (cacheAge > MAX_CACHE_AGE) {
        logger.info('Cache expired, clearing cache', 'DataContext');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      logger.info(`📦 Cache hit! Age: ${(cacheAge / 1000 / 60).toFixed(1)} minutes`, 'DataContext');
      return parsed.data;
    } catch (error) {
      logger.warn('Failed to load from localStorage', error, 'DataContext');
      return null;
    }
  };

  const saveToLocalStorage = (data: any) => {
    try {
      const cacheData = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: {
          users: data.users,
          levels: data.levels,
          objects: data.objects,
          processTypes: data.processTypes,
        }
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      logger.info('💾 Data cached to localStorage', 'DataContext');
    } catch (error) {
      logger.warn('Failed to save to localStorage', error, 'DataContext');
    }
  };

  // Initialize and check configuration
  useEffect(() => {
    const init = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

        if (apiKey && spreadsheetId && scriptUrl) {
          setIsConfigured(true);

          // 1. Спочатку завантажуємо з localStorage для миттєвого показу
          const cachedData = loadFromLocalStorage();
          if (cachedData) {
            logger.info('📦 Loading cached data from localStorage', 'DataContext');
            setUsers(cachedData.users || []);
            setLevels(cachedData.levels || []);
            setObjects(cachedData.objects || []);
            setProcessTypes(cachedData.processTypes || []);
            // Показуємо UI швидше з кешованими даними
            setIsLoading(false);
          }

          // 2. Потім завантажуємо свіжі дані у фоні
          logger.info('🚀 Starting fresh data load...', 'DataContext');
          const startTime = performance.now();

          await loadData(true).catch(error => {
            logger.warn('Failed to load data from Google Sheets, using cached state', error, 'DataContext');
            if (!cachedData) {
              setIsConfigured(false);
              setIsLoading(false);
            }
          });

          const loadTime = performance.now() - startTime;
          logger.info(`✅ Fresh data loaded in ${loadTime.toFixed(0)}ms`, 'DataContext');
          setIsLoading(false);
        } else {
          logger.warn('Google Sheets not configured', 'DataContext');
          setIsConfigured(false);
          setIsLoading(false);
        }
      } catch (error) {
        logger.warn('Failed to initialize DataContext', error, 'DataContext');
        setIsConfigured(false);
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

    const dataSource = dataAdapter.getActiveDataSource();
    logger.info(`Loading fresh data from ${dataSource}`, 'DataContext');
    setIsSyncing(true);
    setIsLoadingInProgress(true);
    try {
      // Use data adapter for automatic Supabase/Google Sheets selection
      const data = await dataAdapter.loadAllData();

      // Set all data at once
      setUsers(data.users);
      setHours(data.hours);
      setProcesses(data.processes);
      setLevels(data.levels);
      setObjects(data.objects);
      setProcessTypes(data.processTypes);
      setAssignments(data.assignments);
      setAdditionalWorks(data.additionalWorks);
      setMaterials(data.materials || []);

      // Зберігаємо в localStorage для наступного разу
      saveToLocalStorage(data);

      logger.info(`✅ All data loaded successfully from ${dataSource}`, 'DataContext');

      // OLD SEQUENTIAL LOADING CODE - Kept for reference, can be removed
      // This was taking 14+ seconds with delays, now takes 2-3 seconds with parallel loading
      /*
      // Load users
      try {
        const usersData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS);
        logger.debug('📊 Raw users data from sheet:', usersData, 'DataContext');
        logger.debug('📊 Users data length:', usersData.length, 'DataContext');
        if (usersData.length > 1) {
          logger.debug('📋 Processing users rows (excluding header)', 'DataContext');
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
              telegramId: cleanedId,
            };
            logger.info(`✅ Parsed user ${idx}:`, { id: parsedUser.id, name: parsedUser.name }, 'DataContext');
            return parsedUser;
          });
          logger.debug('✅ Loaded users (processed):', loadedUsers, 'DataContext');
          setUsers(loadedUsers);
          logger.debug('✅ Loaded users count:', loadedUsers.length, 'DataContext');
        } else {
          setUsers([]);
          logger.debug('ℹ️ Loaded users: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load users:', error, 'DataContext');
        setUsers([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load hours
      try {
        const hoursData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.HOURS);
        logger.debug('📊 Raw hours data from sheet:', hoursData, 'DataContext');
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
          logger.debug('✅ Loaded hours:', loadedHours.length, 'DataContext');
        } else {
          // Якщо немає даних (тільки заголовки), очищаємо state
          setHours([]);
          logger.debug('ℹ️ Loaded hours: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load hours:', error, 'DataContext');
        setHours([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load processes
      try {
        const processesData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESSES);
        logger.debug('📊 Raw processes data from sheet:', processesData, 'DataContext');
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
          logger.debug('✅ Loaded processes:', loadedProcesses.length, 'DataContext');
        } else {
          // Якщо немає даних (тільки заголовки), очищаємо state
          setProcesses([]);
          logger.debug('ℹ️ Loaded processes: 0 (sheet is empty or only has headers)', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Failed to load processes:', error, 'DataContext');
        setProcesses([]);
      }

      await delay(CONFIG.GOOGLE_SHEETS.DELAY_BETWEEN_REQUESTS);

      // Load levels
      try {
        const levelsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS);
        logger.debug('📊 Raw levels data from Google Sheets:', levelsData, 'DataContext');

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

          logger.debug('✅ Loaded levels from Google Sheets:', loadedLevels, 'DataContext');
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
        logger.info('📦 Loading objects from:', CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS, 'DataContext');
        const objectsData = await readSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS);
        logger.info('📦 Raw objects data:', objectsData, 'DataContext');
        logger.info('📦 Objects data length:', objectsData.length, 'DataContext');
        if (objectsData.length > 1) {
          const loadedObjects = objectsData.slice(1).map((row: string[]) => {
            const rawId = String(row[0]);
            const cleanedId = rawId.replace(/^['`]/, '').replace(/[\s,]/g, '').trim();
            const obj = {
              id: cleanedId,
              name: row[1],
              isBusinessTrip: row[2] === 'true',
            };
            logger.debug('📦 Parsed object:', obj, 'DataContext');
            return obj;
          });
          setObjects(loadedObjects);
          logger.info('✅ Loaded objects:', loadedObjects.length, 'DataContext');
          logger.info('✅ Objects:', loadedObjects, 'DataContext');
        } else {
          logger.warn('⚠️ Objects sheet is empty or has only header row', 'DataContext');
        }
      } catch (error) {
        logger.error('❌ Could not load objects:', error, 'DataContext');
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
          logger.debug('✅ Loaded process types:', loadedProcessTypes.length, 'DataContext');
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
          logger.debug('✅ Loaded assignments:', loadedAssignments.length, 'DataContext');
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
          logger.debug('✅ Loaded additional works:', loadedAdditionalWorks.length, 'DataContext');
        }
      } catch (error) {
        logger.warn('Could not load additional works:', error);
      }
      */
      // END OF OLD CODE

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
      setIsLoading(false);
      if (!lastLoadTime) {
        setLastLoadTime(Date.now());
      }
      logger.debug('✅ Data load completed', 'DataContext');
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

    // Optimistic update
    setUsers([...users, newUser]);

    if (isConfigured) {
      try {
        await dataAdapter.createUser(newUser);
        logger.debug('✅ User saved successfully', 'DataContext');
      } catch (error) {
        // Rollback on error
        setUsers(users);
        logger.error('❌ Failed to save user:', error, 'DataContext');
        throw error;
      }
    } else {
      logger.warn('Data source not configured, user saved locally only');
    }
  };

  const addHours = async (hoursData: Omit<Hours, 'id'>) => {
    const newHours = { ...hoursData, id: Date.now().toString() };

    // Optimistic update
    setHours([...hours, newHours]);

    if (isConfigured) {
      try {
        await dataAdapter.createHours(hoursData);
        logger.debug('✅ Hours saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setHours(hours);
        logger.error('Failed to save hours:', error, 'DataContext');
        throw error;
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

    // Optimistic update
    setHours(hours.map(h => h.id === id ? updatedEntry : h));

    if (isConfigured) {
      try {
        await dataAdapter.updateHours(id, updates);
        logger.debug('✅ Hour entry updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setHours(hours);
        logger.error('Failed to update hours:', error, 'DataContext');
        throw error;
      }
    }
  };

  const deleteHours = async (id: string) => {
    const previousHours = hours;

    // Optimistic update
    setHours(hours.filter(h => h.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteHours(id);
        logger.debug('✅ Hour entry deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setHours(previousHours);
        logger.error('Failed to delete hours:', error, 'DataContext');
        throw error;
      }
    }
  };

  const addProcess = async (process: Omit<Process, 'id'>) => {
    const newProcess = { ...process, id: Date.now().toString() };

    logger.info('Adding process:', newProcess.processName, 'DataContext');

    // Optimistic update
    setProcesses(prev => [...prev, newProcess]);

    if (isConfigured) {
      try {
        await dataAdapter.createProcess(process);
        logger.debug('✅ Process saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcesses(prev => prev.filter(p => p.id !== newProcess.id));
        logger.error('❌ Failed to save process:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateProcess = async (id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) => {
    const processEntry = processes.find(p => p.id === id);
    if (!processEntry) {
      logger.error('Process entry not found:', id, 'DataContext');
      return;
    }

    const updatedEntry = { ...processEntry, ...updates };

    // Optimistic update
    setProcesses(processes.map(p => p.id === id ? updatedEntry : p));

    if (isConfigured) {
      try {
        await dataAdapter.updateProcess(id, updates);
        logger.debug('✅ Process entry updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcesses(processes);
        logger.error('Failed to update process:', error, 'DataContext');
        throw error;
      }
    }
  };

  const deleteProcess = async (id: string) => {
    const previousProcesses = processes;

    // Optimistic update
    setProcesses(processes.filter(p => p.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteProcess(id);
        logger.debug('✅ Process entry deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcesses(previousProcesses);
        logger.error('Failed to delete process:', error, 'DataContext');
        throw error;
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

    // Optimistic update
    setLevels([...levels, newLevel]);

    if (isConfigured) {
      try {
        await dataAdapter.createLevel(level);
        logger.debug('✅ Level saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setLevels(levels);
        logger.error('Failed to save level:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateLevel = async (id: string, updates: { name?: string; rate?: number }) => {
    const previousLevels = levels;

    // Optimistic update
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
        await dataAdapter.updateLevel(id, updates);
        logger.debug('✅ Level updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setLevels(previousLevels);
        logger.error('Failed to update level:', error, 'DataContext');
        throw error;
      }
    }
  };

  const deleteLevel = async (id: string) => {
    const previousLevels = levels;

    // Optimistic update
    setLevels(levels.filter(l => l.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteLevel(id);
        logger.debug('✅ Level deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setLevels(previousLevels);
        logger.error('Failed to delete level:', error, 'DataContext');
        throw error;
      }
    }
  };

  const addObject = async (object: Omit<ObjectType, 'id'>) => {
    const newObject = { ...object, id: Date.now().toString() };

    // Optimistic update
    setObjects([...objects, newObject]);

    if (isConfigured) {
      try {
        await dataAdapter.createObject(object);
        logger.debug('✅ Object saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setObjects(objects);
        logger.error('Failed to save object:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateObject = async (id: string, updates: Partial<Omit<ObjectType, 'id'>>) => {
    const previousObjects = objects;

    // Optimistic update
    setObjects(objects.map(o => o.id === id ? { ...o, ...updates } : o));

    if (isConfigured) {
      try {
        await dataAdapter.updateObject(id, updates);
        logger.debug('✅ Object updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setObjects(previousObjects);
        logger.error('Failed to update object:', error, 'DataContext');
        throw error;
      }
    }
  };

  const deleteObject = async (id: string) => {
    const previousObjects = objects;

    // Optimistic update
    setObjects(objects.filter(o => o.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteObject(id);
        logger.debug('✅ Object deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setObjects(previousObjects);
        logger.error('Failed to delete object:', error, 'DataContext');
        throw error;
      }
    }
  };

  const addProcessType = async (processType: Omit<ProcessType, 'id'>) => {
    const newProcessType = { ...processType, id: Date.now().toString() };

    // Optimistic update
    setProcessTypes([...processTypes, newProcessType]);

    if (isConfigured) {
      try {
        await dataAdapter.createProcessType(processType);
        logger.debug('✅ Process type saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcessTypes(processTypes);
        logger.error('Failed to save process type:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateProcessType = async (id: string, updates: Partial<Omit<ProcessType, 'id'>>) => {
    const previousProcessTypes = processTypes;

    // Optimistic update
    setProcessTypes(processTypes.map(pt => pt.id === id ? { ...pt, ...updates } : pt));

    if (isConfigured) {
      try {
        await dataAdapter.updateProcessType(id, updates);
        logger.debug('✅ Process type updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcessTypes(previousProcessTypes);
        logger.error('Failed to update process type:', error, 'DataContext');
        throw error;
      }
    }
  };

  const deleteProcessType = async (id: string) => {
    const previousProcessTypes = processTypes;

    // Optimistic update
    setProcessTypes(processTypes.filter(pt => pt.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteProcessType(id);
        logger.debug('✅ Process type deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcessTypes(previousProcessTypes);
        logger.error('Failed to delete process type:', error, 'DataContext');
        throw error;
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
        h.userId === emp.id && h.date && h.date.startsWith(month)
      );

      // Фільтруємо процеси за місяцем
      const empProcesses = processes.filter(p =>
        p.userId === emp.id && p.date && p.date.startsWith(month)
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
      h.userId === userId && h.date && h.date.startsWith(month)
    );

    // Фільтруємо процеси за місяцем
    const empProcesses = processes.filter(p =>
      p.userId === userId && p.date && p.date.startsWith(month)
    );

    // Фільтруємо матеріали за місяцем
    const empMaterials = materials.filter(m =>
      m.userId === userId && m.date && m.date.startsWith(month)
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

    // Форматуємо матеріали
    const formattedMaterials = empMaterials.map(m => ({
      id: m.id,
      date: m.date,
      object: m.object,
      materialName: m.materialName,
      quantity: m.quantity,
      unit: m.unit,
      notes: m.notes,
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
      materials: formattedMaterials,
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
      logger.debug('✅ Additional work added:', newWork, 'DataContext');

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
      logger.debug('✅ Additional work updated:', updatedWork, 'DataContext');

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

  // @ts-ignore - Used for future conversion logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Materials functions
  const addMaterial = async (materialData: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newMaterial: Material = {
      ...materialData,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Optimistic update
    setMaterials(prev => [...prev, newMaterial]);

    if (isConfigured) {
      try {
        await dataAdapter.createMaterial(materialData);
        logger.debug('✅ Material added successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to save material:', error, 'DataContext');
        // Rollback on error
        setMaterials(prev => prev.filter(m => m.id !== id));
        throw error;
      }
    }
  };

  const deleteMaterial = async (id: string) => {
    const materialToDelete = materials.find(m => m.id === id);
    if (!materialToDelete) {
      logger.error('Material not found:', id, 'DataContext');
      return;
    }

    // Optimistic update
    setMaterials(prev => prev.filter(m => m.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteMaterial(id);
        logger.debug('✅ Material deleted successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to delete material from sheets:', error, 'DataContext');
        // Rollback on error
        setMaterials(prev => [...prev, materialToDelete]);
        throw error;
      }
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
    materials,
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
    addMaterial,
    deleteMaterial,
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