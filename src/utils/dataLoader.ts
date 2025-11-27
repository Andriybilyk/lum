/**
 * Optimized data loading utilities for Google Sheets
 * Implements parallel loading with proper error handling
 */

import { logger } from '@/utils/logger';
import { CONFIG } from '@/config/constants';
import { readSheet } from '../services/googleSheets';
import { cleanId, cleanManagerId, parseFloatSafe, isDevelopment } from './dataHelpers';
import type {
  User,
  Hours,
  Process,
  Level,
  ObjectType,
  ProcessType,
  AdditionalWork,
  Assignment,
  Material
} from '../types';

/**
 * Load all data in parallel from Google Sheets
 * This is much faster than sequential loading
 */
export async function loadAllDataParallel() {
  logger.info('🚀 Loading data in parallel from Google Sheets', 'DataLoader');

  const startTime = Date.now();

  // Load all sheets in parallel using Promise.allSettled
  const [
    usersResult,
    hoursResult,
    processesResult,
    levelsResult,
    objectsResult,
    processTypesResult,
    assignmentsResult,
    additionalWorksResult,
    materialsResult
  ] = await Promise.allSettled([
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.HOURS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESSES),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.LEVELS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.OBJECTS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.PROCESS_TYPES),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.ASSIGNMENTS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.ADDITIONAL_WORKS),
    readSheet(CONFIG.GOOGLE_SHEETS.RANGES.MATERIALS),
  ]);

  const endTime = Date.now();
  logger.info(`⚡ Parallel loading completed in ${endTime - startTime}ms`, 'DataLoader');

  // Process results
  return {
    users: processUsers(usersResult),
    hours: processHours(hoursResult),
    processes: processProcesses(processesResult),
    levels: processLevels(levelsResult),
    objects: processObjects(objectsResult),
    processTypes: processProcessTypes(processTypesResult),
    assignments: processAssignments(assignmentsResult),
    additionalWorks: processAdditionalWorks(additionalWorksResult),
    materials: processMaterials(materialsResult),
  };
}

function processUsers(result: PromiseSettledResult<any[]>): User[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load users:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No users data', 'DataLoader');
    return [];
  }

  const users = data.slice(1).map((row: string[]) => {
    const telegramIdRaw = row[6];
    const telegramId = telegramIdRaw ? cleanId(telegramIdRaw) : undefined;

    return {
      id: cleanId(row[0]),
      name: row[1],
      role: row[2] as 'employee' | 'manager',
      level: row[3],
      hourlyRate: parseFloatSafe(row[4]),
      managerId: cleanManagerId(row[5]),
      telegramId: telegramId,
    };
  });

  logger.info(`✅ Loaded ${users.length} users`, 'DataLoader');
  return users;
}

function processHours(result: PromiseSettledResult<any[]>): Hours[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load hours:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No hours data', 'DataLoader');
    return [];
  }

  const hours = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    userId: cleanId(row[1]),
    date: row[2],
    hours: parseFloatSafe(row[3]),
    object: row[4],
    isBusinessTrip: row[5] === 'true',
    salary: parseFloatSafe(row[6]),
  }));

  logger.info(`✅ Loaded ${hours.length} hours`, 'DataLoader');
  return hours;
}

function processProcesses(result: PromiseSettledResult<any[]>): Process[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load processes:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No processes data', 'DataLoader');
    return [];
  }

  const processes = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    userId: cleanId(row[1]),
    date: row[2],
    processName: row[3],
    object: row[4] || undefined,
    volume: parseFloatSafe(row[5]),
    unit: row[6],
    rate: parseFloatSafe(row[7]),
    salary: parseFloatSafe(row[8]),
  }));

  logger.info(`✅ Loaded ${processes.length} processes`, 'DataLoader');
  return processes;
}

function processLevels(result: PromiseSettledResult<any[]>): Level[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load levels:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No levels data', 'DataLoader');
    return [];
  }

  const levels = data.slice(1)
    .filter((row: string[]) => row[0] && row[1])
    .map((row: string[]) => ({
      id: cleanId(row[0]),
      name: row[1],
      hourlyRate: parseFloatSafe(row[2]),
    }));

  logger.info(`✅ Loaded ${levels.length} levels`, 'DataLoader');
  return levels;
}

function processObjects(result: PromiseSettledResult<any[]>): ObjectType[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load objects:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No objects data', 'DataLoader');
    return [];
  }

  const objects = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    name: row[1],
    isBusinessTrip: row[2] === 'true',
  }));

  logger.info(`✅ Loaded ${objects.length} objects`, 'DataLoader');
  return objects;
}

function processProcessTypes(result: PromiseSettledResult<any[]>): ProcessType[] {
  if (result.status === 'rejected') {
    logger.error('❌ Failed to load process types:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    if (isDevelopment()) logger.debug('ℹ️ No process types data', 'DataLoader');
    return [];
  }

  const processTypes = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    name: row[1],
    object: row[2] || undefined,
    rate: parseFloatSafe(row[3]),
    unit: row[4],
    plannedVolume: parseFloatSafe(row[5]) || undefined,
  }));

  logger.info(`✅ Loaded ${processTypes.length} process types`, 'DataLoader');
  return processTypes;
}

function processAssignments(result: PromiseSettledResult<any[]>): Assignment[] {
  if (result.status === 'rejected') {
    if (isDevelopment()) logger.warn('Could not load assignments:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    return [];
  }

  const assignments = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    employeeId: cleanId(row[1]),
    managerId: cleanId(row[2]),
    date: row[3],
    description: row[4],
    notes: row[5],
    status: row[6] as 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed',
  }));

  if (isDevelopment()) logger.debug(`✅ Loaded ${assignments.length} assignments`, 'DataLoader');
  return assignments;
}

function processAdditionalWorks(result: PromiseSettledResult<any[]>): AdditionalWork[] {
  if (result.status === 'rejected') {
    if (isDevelopment()) logger.warn('Could not load additional works:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    return [];
  }

  const works = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    userId: cleanId(row[1]),
    managerId: cleanId(row[2]),
    objectName: row[3],
    date: row[4],
    workName: row[5],
    description: row[6],
    unit: row[7],
    volume: parseFloatSafe(row[8]),
    rate: parseFloatSafe(row[9]),
    salary: parseFloatSafe(row[10]),
    status: (row[11] || 'pending') as 'pending' | 'approved' | 'rejected',
    createdAt: row[12] || new Date().toISOString(),
    updatedAt: row[13] || new Date().toISOString(),
  }));

  if (isDevelopment()) logger.debug(`✅ Loaded ${works.length} additional works`, 'DataLoader');
  return works;
}

function processMaterials(result: PromiseSettledResult<any[]>): Material[] {
  if (result.status === 'rejected') {
    if (isDevelopment()) logger.warn('Could not load materials:', result.reason, 'DataLoader');
    return [];
  }

  const data = result.value;
  if (!data || data.length <= 1) {
    return [];
  }

  const materials = data.slice(1).map((row: string[]) => ({
    id: cleanId(row[0]),
    userId: cleanId(row[1]),
    date: row[2],
    object: row[3],
    materialName: row[4],
    quantity: parseFloatSafe(row[5]),
    unit: row[6],
    notes: row[7] || '',
    createdAt: row[8] || new Date().toISOString(),
    updatedAt: row[8] || new Date().toISOString(),
  }));

  if (isDevelopment()) logger.debug(`✅ Loaded ${materials.length} materials`, 'DataLoader');
  return materials;
}
