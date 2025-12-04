/**
 * Data Adapter Service
 * Використовує Supabase як основну базу даних
 */

import { logger } from '@/utils/logger';
import * as supabaseService from './supabaseService';
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
  Department,
} from '@/types';

/**
 * Завантажує всі дані з Supabase з фільтрацією по підрозділу
 */
export async function loadAllData(departmentId?: string) {
  logger.info(`Loading data from Supabase${departmentId ? ` for department: ${departmentId}` : ''}`, 'DataAdapter');

  // Спочатку завантажуємо departments та users
  const departments = await supabaseService.getAllDepartments();
  const users = await supabaseService.getAllUsers(departmentId);

  // Створюємо список ID користувачів для фільтрації залежних даних
  const userIds = users.map(u => u.id);

  // Завантажуємо решту даних паралельно з фільтрацією
  const [
    hours,
    processes,
    levels,
    objects,
    processTypes,
    assignments,
    additionalWorks,
    materials,
    workPhotos
  ] = await Promise.all([
    supabaseService.getAllHours(userIds),
    supabaseService.getAllProcesses(userIds),
    supabaseService.getAllLevels(departmentId),
    supabaseService.getAllObjects(departmentId),
    supabaseService.getAllProcessTypes(departmentId),
    supabaseService.getAllAssignments(userIds),
    supabaseService.getAllAdditionalWorks(userIds),
    supabaseService.getAllMaterials(userIds),
    supabaseService.getAllWorkPhotos(userIds),
  ]);

  return {
    departments,
    users,
    hours,
    processes,
    levels,
    objects,
    processTypes,
    assignments,
    additionalWorks,
    materials,
    workPhotos,
  };
}

// ============= USERS =============

export async function createUser(user: Omit<User, 'id'> | User) {
  await supabaseService.createUser(user as User);
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>) {
  await supabaseService.updateUser(userId, updates);
}

// ============= HOURS =============

export async function createHours(hours: Omit<Hours, 'id'>) {
  await supabaseService.createHours(hours);
}

export async function updateHours(id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>) {
  await supabaseService.updateHours(id, updates);
}

export async function deleteHours(id: string) {
  await supabaseService.deleteHours(id);
}

// ============= PROCESSES =============

export async function createProcess(process: Omit<Process, 'id'>) {
  await supabaseService.createProcess(process);
}

export async function updateProcess(id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>) {
  await supabaseService.updateProcess(id, updates);
}

export async function deleteProcess(id: string) {
  await supabaseService.deleteProcess(id);
}

// ============= LEVELS =============

export async function createLevel(level: Omit<Level, 'id'>) {
  const id = Date.now().toString();
  await supabaseService.createLevel({ ...level, id });
}

export async function updateLevel(id: string, updates: { name?: string; rate?: number }) {
  await supabaseService.updateLevel(id, updates);
}

export async function deleteLevel(id: string) {
  await supabaseService.deleteLevel(id);
}

// ============= OBJECTS =============

export async function createObject(object: Omit<ObjectType, 'id'>) {
  const id = Date.now().toString();
  await supabaseService.createObject({ ...object, id });
}

export async function updateObject(id: string, updates: Partial<Omit<ObjectType, 'id'>>) {
  await supabaseService.updateObject(id, updates);
}

export async function deleteObject(id: string) {
  await supabaseService.deleteObject(id);
}

// ============= PROCESS TYPES =============

export async function createProcessType(processType: Omit<ProcessType, 'id'>) {
  const id = Date.now().toString();
  await supabaseService.createProcessType({ ...processType, id });
}

export async function updateProcessType(id: string, updates: Partial<Omit<ProcessType, 'id'>>) {
  await supabaseService.updateProcessType(id, updates);
}

export async function deleteProcessType(id: string) {
  await supabaseService.deleteProcessType(id);
}

// ============= ASSIGNMENTS =============

export async function createAssignment(assignment: Omit<Assignment, 'id'>) {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  await supabaseService.createAssignment({ ...assignment, id, createdAt: now, updatedAt: now });
}

export async function updateAssignment(id: string, status: string) {
  await supabaseService.updateAssignment(id, { status });
}

// ============= ADDITIONAL WORKS =============

export async function createAdditionalWork(work: Omit<AdditionalWork, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  await supabaseService.createAdditionalWork({ ...work, id, createdAt: now, updatedAt: now });
}

export async function updateAdditionalWork(
  id: string,
  updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>
) {
  await supabaseService.updateAdditionalWork(id, updates);
}

// ============= MATERIALS =============

export async function createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
  await supabaseService.createMaterial(material);
}

export async function deleteMaterial(id: string) {
  await supabaseService.deleteMaterial(id);
}


// ============= WORK PHOTOS =============

export async function createWorkPhoto(photo: Omit<WorkPhoto, 'id' | 'createdAt' | 'updatedAt'>) {
  await supabaseService.createWorkPhoto(photo);
}

export async function updateWorkPhoto(
  id: string,
  updates: Partial<Omit<WorkPhoto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) {
  await supabaseService.updateWorkPhoto(id, updates);
}

export async function deleteWorkPhoto(id: string) {
  await supabaseService.deleteWorkPhoto(id);
}
