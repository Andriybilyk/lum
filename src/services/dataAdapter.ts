/**
 * Data Adapter Service
 * Автоматично вибирає між Supabase та Google Sheets залежно від конфігурації
 */

import { logger } from '@/utils/logger';
import { isSupabaseConfigured } from '@/lib/supabase';
import * as supabaseService from './supabaseService';
import { loadAllDataParallel } from '@/utils/dataLoader';
import {
  appendSheet,
  writeSheet,
  updateHourEntry,
  deleteHourEntry,
  updateProcessEntry,
  deleteProcessEntry
} from './googleSheets';
import { CONFIG } from '@/config/constants';
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
} from '@/types';

export type DataSource = 'supabase' | 'googlesheets';

/**
 * Визначає активне джерело даних
 */
export function getActiveDataSource(): DataSource {
  const useSupabase = isSupabaseConfigured();
  logger.info(`Active data source: ${useSupabase ? 'Supabase' : 'Google Sheets'}`, 'DataAdapter');
  return useSupabase ? 'supabase' : 'googlesheets';
}

/**
 * Завантажує всі дані з активного джерела
 */
export async function loadAllData() {
  const source = getActiveDataSource();
  logger.info(`Loading all data from ${source}`, 'DataAdapter');

  if (source === 'supabase') {
    // Завантаження з Supabase
    const [
      users,
      hours,
      processes,
      levels,
      objects,
      processTypes,
      assignments,
      additionalWorks,
      materials
    ] = await Promise.all([
      supabaseService.getAllUsers(),
      supabaseService.getAllHours(),
      supabaseService.getAllProcesses(),
      supabaseService.getAllLevels(),
      supabaseService.getAllObjects(),
      supabaseService.getAllProcessTypes(),
      supabaseService.getAllAssignments(),
      supabaseService.getAllAdditionalWorks(),
      supabaseService.getAllMaterials(),
    ]);

    return {
      users,
      hours,
      processes,
      levels,
      objects,
      processTypes,
      assignments,
      additionalWorks,
      materials,
    };
  } else {
    // Завантаження з Google Sheets
    return await loadAllDataParallel();
  }
}

// ============= USERS =============

export async function createUser(user: Omit<User, 'id'> | User) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.createUser(user as User);
  } else {
    const id = 'id' in user ? user.id : Date.now().toString();
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS, [[
      parseInt(id),
      user.name,
      user.role,
      user.level,
      user.hourlyRate,
      user.managerId || '',
      user.telegramId || id,
    ]]);
  }
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateUser(userId, updates);
  } else {
    // Google Sheets implementation
    logger.warn('updateUser not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= HOURS =============

export async function createHours(hours: Omit<Hours, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();

  if (source === 'supabase') {
    await supabaseService.createHours({ ...hours, id });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.HOURS, [[
      parseInt(id),
      parseInt(hours.userId),
      hours.date,
      hours.hours,
      hours.object,
      hours.isBusinessTrip ? 'TRUE' : 'FALSE',
      hours.salary,
    ]]);
  }
}

export async function updateHours(id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateHours(id, updates);
  } else {
    await updateHourEntry(id, updates);
  }
}

export async function deleteHours(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteHours(id);
  } else {
    await deleteHourEntry(id);
  }
}

// ============= PROCESSES =============

export async function createProcess(process: Omit<Process, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();

  if (source === 'supabase') {
    await supabaseService.createProcess({ ...process, id });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESSES, [[
      parseInt(id),
      parseInt(process.userId),
      process.date,
      process.processName,
      process.object || '',
      process.volume,
      process.unit,
      process.rate,
      process.salary,
    ]]);
  }
}

export async function updateProcess(id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateProcess(id, updates);
  } else {
    await updateProcessEntry(id, updates);
  }
}

export async function deleteProcess(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteProcess(id);
  } else {
    await deleteProcessEntry(id);
  }
}

// ============= LEVELS =============

export async function createLevel(level: Omit<Level, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();

  if (source === 'supabase') {
    await supabaseService.createLevel({ ...level, id });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS, [[
      parseInt(id),
      level.name,
      level.rate,
    ]]);
  }
}

export async function updateLevel(id: string, updates: { name?: string; rate?: number }) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateLevel(id, updates);
  } else {
    logger.warn('updateLevel not fully implemented for Google Sheets', 'DataAdapter');
  }
}

export async function deleteLevel(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteLevel(id);
  } else {
    logger.warn('deleteLevel not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= OBJECTS =============

export async function createObject(object: Omit<ObjectType, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();

  if (source === 'supabase') {
    await supabaseService.createObject({ ...object, id });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS, [[
      parseInt(id),
      object.name,
      object.maxHours,
    ]]);
  }
}

export async function updateObject(id: string, updates: Partial<Omit<ObjectType, 'id'>>) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateObject(id, updates);
  } else {
    logger.warn('updateObject not fully implemented for Google Sheets', 'DataAdapter');
  }
}

export async function deleteObject(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteObject(id);
  } else {
    logger.warn('deleteObject not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= PROCESS TYPES =============

export async function createProcessType(processType: Omit<ProcessType, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();

  if (source === 'supabase') {
    await supabaseService.createProcessType({ ...processType, id });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESS_TYPES, [[
      parseInt(id),
      processType.name,
      processType.object,
      processType.unit,
      processType.rate,
    ]]);
  }
}

export async function updateProcessType(id: string, updates: Partial<Omit<ProcessType, 'id'>>) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateProcessType(id, updates);
  } else {
    logger.warn('updateProcessType not fully implemented for Google Sheets', 'DataAdapter');
  }
}

export async function deleteProcessType(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteProcessType(id);
  } else {
    logger.warn('deleteProcessType not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= ASSIGNMENTS =============

export async function createAssignment(assignment: Omit<Assignment, 'id'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  if (source === 'supabase') {
    await supabaseService.createAssignment({ ...assignment, id, createdAt: now, updatedAt: now });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.ASSIGNMENTS, [[
      parseInt(id),
      parseInt(assignment.userId),
      parseInt(assignment.managerId),
      assignment.status,
      now,
      now,
    ]]);
  }
}

export async function updateAssignment(id: string, status: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateAssignment(id, { status });
  } else {
    logger.warn('updateAssignment not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= ADDITIONAL WORKS =============

export async function createAdditionalWork(work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  if (source === 'supabase') {
    await supabaseService.createAdditionalWork({ ...work, id, createdAt: now, updatedAt: now });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.ADDITIONAL_WORKS, [[
      parseInt(id),
      parseInt(work.userId),
      parseInt(work.managerId),
      work.title,
      work.description || '',
      work.status,
      work.dueDate || '',
      now,
      now,
    ]]);
  }
}

export async function updateAdditionalWork(
  id: string,
  updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>
) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.updateAdditionalWork(id, updates);
  } else {
    logger.warn('updateAdditionalWork not fully implemented for Google Sheets', 'DataAdapter');
  }
}

// ============= MATERIALS =============

export async function createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
  const source = getActiveDataSource();
  const id = Date.now().toString();
  const now = new Date().toISOString();

  if (source === 'supabase') {
    await supabaseService.createMaterial({ ...material, id, createdAt: now, updatedAt: now });
  } else {
    await appendSheet(CONFIG.GOOGLE_SHEETS.RANGES.MATERIALS, [[
      parseInt(id),
      parseInt(material.userId),
      material.date,
      material.object,
      material.materialName,
      material.quantity,
      material.unit,
      material.notes || '',
      now,
    ]]);
  }
}

export async function deleteMaterial(id: string) {
  const source = getActiveDataSource();

  if (source === 'supabase') {
    await supabaseService.deleteMaterial(id);
  } else {
    // Google Sheets delete implementation
    logger.warn('deleteMaterial not fully implemented for Google Sheets', 'DataAdapter');
  }
}
