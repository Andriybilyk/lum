import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { isSupabaseConfigured } from '@/lib/supabase';
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
  WorkPhoto,
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
  workPhotos: WorkPhoto[];
  
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
  addWorkPhoto: (photo: Omit<WorkPhoto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorkPhoto: (id: string, updates: Partial<Omit<WorkPhoto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteWorkPhoto: (id: string) => Promise<void>;

  // Reports
  getTeamReport: (month: string) => TeamReport[];
  getEmployeeReport: (userId: string, month: string) => EmployeeReport;

  // State
  isLoading: boolean;
  isConfigured: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [hours, setHours] = useState<Hours[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [workPhotos, setWorkPhotos] = useState<WorkPhoto[]>([]);


  // Initialize and load data
  useEffect(() => {
    const init = async () => {
      try {
        // Check if Supabase is configured
        const supabaseConfigured = isSupabaseConfigured();
        setIsConfigured(supabaseConfigured);

        if (supabaseConfigured) {
          logger.info('Loading data from Supabase', 'DataContext');
          const startTime = performance.now();

          // Load all data using dataAdapter
          const data = await dataAdapter.loadAllData();

          // Set all data
          setUsers(data.users);
          setHours(data.hours);
          setProcesses(data.processes);
          setLevels(data.levels);
          setObjects(data.objects);
          setProcessTypes(data.processTypes);
          setAssignments(data.assignments);
          setAdditionalWorks(data.additionalWorks);
          setMaterials(data.materials || []);
          setWorkPhotos(data.workPhotos || []);

          const loadTime = performance.now() - startTime;
          logger.info(`Data loaded successfully in ${loadTime.toFixed(0)}ms`, 'DataContext');
        } else {
          logger.warn('Supabase not configured', 'DataContext');
        }
      } catch (error) {
        logger.error('Failed to initialize DataContext', error, 'DataContext');
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);


  const addUser = async (user: Omit<User, 'id'> | User) => {
    // If ID already exists, use it, otherwise generate new one
    const newUser = 'id' in user ? user : { ...user, id: Date.now().toString() };

    logger.info('Adding user:', newUser, 'DataContext');

    // Optimistic update
    setUsers([...users, newUser]);

    if (isConfigured) {
      try {
        await dataAdapter.createUser(newUser);
        logger.debug('User saved successfully', 'DataContext');
      } catch (error) {
        // Rollback on error
        setUsers(users);
        logger.error('Failed to save user:', error, 'DataContext');
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
        logger.debug('Hours saved successfully', 'DataContext');
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
        logger.debug('Hour entry updated successfully', 'DataContext');
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
        logger.debug('Hour entry deleted successfully', 'DataContext');
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
        logger.debug('Process saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcesses(prev => prev.filter(p => p.id !== newProcess.id));
        logger.error('Failed to save process:', error, 'DataContext');
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
        logger.debug('Process entry updated successfully', 'DataContext');
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
        logger.debug('Process entry deleted successfully', 'DataContext');
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

    // Optimistic update
    setAssignments([...assignments, newAssignment]);

    if (isConfigured) {
      try {
        await dataAdapter.createAssignment(assignment);
        logger.debug('Assignment saved successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setAssignments(assignments);
        logger.error('Failed to save assignment:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateAssignment = async (id: string, status: 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed') => {
    const previousAssignments = assignments;

    // Optimistic update
    setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a));

    if (isConfigured) {
      try {
        await dataAdapter.updateAssignment(id, status);
        logger.debug('Assignment updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setAssignments(previousAssignments);
        logger.error('Failed to update assignment:', error, 'DataContext');
        throw error;
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
        logger.debug('Level saved successfully', 'DataContext');
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
        logger.debug('Level updated successfully', 'DataContext');
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
        logger.debug('Level deleted successfully', 'DataContext');
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
        logger.debug('Object saved successfully', 'DataContext');
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
        logger.debug('Object updated successfully', 'DataContext');
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
        logger.debug('Object deleted successfully', 'DataContext');
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
        logger.debug('Process type saved successfully', 'DataContext');
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
        logger.debug('Process type updated successfully', 'DataContext');
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
        logger.debug('Process type deleted successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setProcessTypes(previousProcessTypes);
        logger.error('Failed to delete process type:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateUserLevel = async (userId: string, level: string, hourlyRate: number) => {
    const previousUsers = users;

    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, level, hourlyRate } : u));

    if (isConfigured) {
      try {
        await dataAdapter.updateUser(userId, { level, hourlyRate });
        logger.debug('User level updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setUsers(previousUsers);
        logger.error('Failed to update user level:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateUser = async (userId: string, updates: Partial<Omit<User, 'id'>>) => {
    const previousUsers = users;

    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));

    if (isConfigured) {
      try {
        await dataAdapter.updateUser(userId, updates);
        logger.debug('User updated successfully', 'DataContext');
      } catch (error) {
        // Rollback
        setUsers(previousUsers);
        logger.error('Failed to update user:', error, 'DataContext');
        throw error;
      }
    }
  };

  const getTeamReport = (month: string) => {
    // Include all users (both employees and managers)
    const allUsers = users;

    return allUsers.map(emp => {
      // Filter hours for the month
      const empHours = hours.filter(h =>
        h.userId === emp.id && h.date && h.date.startsWith(month)
      );

      // Filter processes for the month
      const empProcesses = processes.filter(p =>
        p.userId === emp.id && p.date && p.date.startsWith(month)
      );

      // Calculate total hours
      const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);

      // Calculate total earnings
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
    // Filter hours for the month
    const empHours = hours.filter(h =>
      h.userId === userId && h.date && h.date.startsWith(month)
    );

    // Filter processes for the month
    const empProcesses = processes.filter(p =>
      p.userId === userId && p.date && p.date.startsWith(month)
    );

    // Filter materials for the month
    const empMaterials = materials.filter(m =>
      m.userId === userId && m.date && m.date.startsWith(month)
    );

    // Format hours
    const formattedHours = empHours.map(h => ({
      id: h.id,
      date: h.date,
      object: h.object,
      hours: h.hours,
      businessTrip: h.isBusinessTrip,
      earnings: h.salary,
    }));

    // Format processes
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

    // Format materials
    const formattedMaterials = empMaterials.map(m => ({
      id: m.id,
      date: m.date,
      object: m.object,
      materialName: m.materialName,
      quantity: m.quantity,
      unit: m.unit,
      notes: m.notes,
    }));

    // Calculate total hours
    const totalHours = empHours.reduce((sum, h) => sum + h.hours, 0);

    // Calculate total earnings
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

    // Optimistic update
    setAdditionalWorks(prev => [...prev, newWork]);

    if (isConfigured) {
      try {
        await dataAdapter.createAdditionalWork(work);
        logger.debug('Additional work added successfully', 'DataContext');

        // If status is 'approved' (for manager), immediately convert to process
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

            logger.info('Creating new process from manager work:', newProcess, 'DataContext');
            await addProcess(newProcess);
            logger.info(`Converted to process: ${work.workName}`, 'DataContext');
          } catch (conversionError) {
            logger.error('Failed to convert manager work to process:', conversionError, 'DataContext');
            // Don't throw error so additional work is still saved
          }
        }
      } catch (error) {
        // Rollback
        setAdditionalWorks(prev => prev.filter(w => w.id !== id));
        logger.error('Failed to add additional work:', error, 'DataContext');
        throw error;
      }
    }
  };

  const updateAdditionalWork = async (id: string, updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>) => {
    const work = additionalWorks.find(w => w.id === id);
    if (!work) {
      logger.error('Additional work not found:', id, 'DataContext');
      return;
    }

    const updatedWork: AdditionalWork = {
      ...work,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const previousAdditionalWorks = additionalWorks;

    // Optimistic update
    setAdditionalWorks(prev => prev.map(w => w.id === id ? updatedWork : w));

    if (isConfigured) {
      try {
        await dataAdapter.updateAdditionalWork(id, updates);
        logger.debug('Additional work updated successfully', 'DataContext');

        // If status changed to 'approved', convert to process
        if (updates.status === 'approved' && work.status !== 'approved') {
          logger.debug('Converting approved additional work to process...', {
            userId: updatedWork.userId,
            date: updatedWork.date,
            workName: updatedWork.workName
          });

          // Check if process already exists
          const existingProcess = processes.find(p =>
            p.userId === updatedWork.userId &&
            p.date === updatedWork.date &&
            p.processName === updatedWork.workName
          );

          if (!existingProcess) {
            try {
              // Convert to process
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

              logger.info('Creating new process:', newProcess, 'DataContext');
              await addProcess(newProcess);
              logger.info(`Converted to process: ${updatedWork.workName}`, 'DataContext');
            } catch (conversionError) {
              logger.error('Failed to convert additional work to process:', conversionError, 'DataContext');
              // Don't throw error so approval is still saved
            }
          } else {
            logger.info('Process already exists, skipping conversion', 'DataContext');
          }
        }
      } catch (error) {
        // Rollback
        setAdditionalWorks(previousAdditionalWorks);
        logger.error('Failed to update additional work:', error, 'DataContext');
        throw error;
      }
    }
  };

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
        logger.debug('Material added successfully', 'DataContext');
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
        logger.debug('Material deleted successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to delete material:', error, 'DataContext');
        // Rollback on error
        setMaterials(prev => [...prev, materialToDelete]);
        throw error;
      }
    }
  };

  const addWorkPhoto = async (photo: Omit<WorkPhoto, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPhoto: WorkPhoto = {
      ...photo,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setWorkPhotos(prev => [newPhoto, ...prev]);

    if (isConfigured) {
      try {
        await dataAdapter.createWorkPhoto(photo);
        logger.debug('WorkPhoto added successfully', 'DataContext');
        // Reload to get actual ID from server
        const data = await dataAdapter.loadAllData();
        setWorkPhotos(data.workPhotos || []);
      } catch (error) {
        logger.error('Failed to add work photo:', error, 'DataContext');
        // Rollback on error
        setWorkPhotos(prev => prev.filter(p => p.id !== newPhoto.id));
        throw error;
      }
    }
  };

  const updateWorkPhoto = async (id: string, updates: Partial<Omit<WorkPhoto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const photoToUpdate = workPhotos.find(p => p.id === id);
    if (!photoToUpdate) {
      logger.error('WorkPhoto not found:', id, 'DataContext');
      return;
    }

    // Optimistic update
    setWorkPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );

    if (isConfigured) {
      try {
        await dataAdapter.updateWorkPhoto(id, updates);
        logger.debug('WorkPhoto updated successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to update work photo:', error, 'DataContext');
        // Rollback on error
        setWorkPhotos(prev =>
          prev.map(p => (p.id === id ? photoToUpdate : p))
        );
        throw error;
      }
    }
  };

  const deleteWorkPhoto = async (id: string) => {
    const photoToDelete = workPhotos.find(p => p.id === id);
    if (!photoToDelete) {
      logger.error('WorkPhoto not found:', id, 'DataContext');
      return;
    }

    // Optimistic update
    setWorkPhotos(prev => prev.filter(p => p.id !== id));

    if (isConfigured) {
      try {
        await dataAdapter.deleteWorkPhoto(id);
        logger.debug('WorkPhoto deleted successfully', 'DataContext');
      } catch (error) {
        logger.error('Failed to delete work photo:', error, 'DataContext');
        // Rollback on error
        setWorkPhotos(prev => [...prev, photoToDelete]);
        throw error;
      }
    }
  };

  const value: DataContextType = {
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
    workPhotos,
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
    addWorkPhoto,
    updateWorkPhoto,
    deleteWorkPhoto,
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