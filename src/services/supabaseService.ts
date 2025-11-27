import { supabase, handleSupabaseError, setCurrentUserContext } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type {
  User,
  Hours,
  Process,
  Material,
  Assignment,
  Level,
  ObjectType,
  ProcessType,
  AdditionalWork,
} from '@/types';

// Initialize context for current user
export async function initializeUserContext(userId: string) {
  await setCurrentUserContext(userId);
}

// ============= USERS =============

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      role: row.role as 'employee' | 'manager',
      level: row.level,
      hourlyRate: Number(row.hourly_rate),
      managerId: row.manager_id || undefined,
      telegramId: row.telegram_id || undefined,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllUsers');
    return [];
  }
}

export async function createUser(user: Omit<User, 'id'> | User): Promise<void> {
  try {
    const id = 'id' in user ? user.id : Date.now().toString();

    const { error } = await supabase.from('users').insert({
      id,
      name: user.name,
      role: user.role,
      level: user.level,
      hourly_rate: user.hourlyRate,
      manager_id: user.managerId || null,
      telegram_id: user.telegramId || null,
    });

    if (error) throw error;
    logger.debug('User created:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createUser');
  }
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.level !== undefined) updateData.level = updates.level;
    if (updates.hourlyRate !== undefined) updateData.hourly_rate = updates.hourlyRate;
    if (updates.managerId !== undefined) updateData.manager_id = updates.managerId || null;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
    logger.debug('User updated:', userId, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateUser');
  }
}

// ============= HOURS =============

export async function getAllHours(): Promise<Hours[]> {
  try {
    const { data, error } = await supabase
      .from('hours')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      hours: Number(row.hours),
      object: row.object,
      isBusinessTrip: row.is_business_trip,
      salary: Number(row.salary),
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllHours');
    return [];
  }
}

export async function createHours(hours: Omit<Hours, 'id'>): Promise<void> {
  try {
    const id = Date.now().toString();

    const { error } = await supabase.from('hours').insert({
      id,
      user_id: hours.userId,
      date: hours.date,
      hours: hours.hours,
      object: hours.object,
      is_business_trip: hours.isBusinessTrip,
      salary: hours.salary,
    });

    if (error) throw error;
    logger.debug('Hours created:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createHours');
  }
}

export async function updateHours(id: string, updates: Partial<Omit<Hours, 'id' | 'userId'>>): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.hours !== undefined) updateData.hours = updates.hours;
    if (updates.object !== undefined) updateData.object = updates.object;
    if (updates.isBusinessTrip !== undefined) updateData.is_business_trip = updates.isBusinessTrip;
    if (updates.salary !== undefined) updateData.salary = updates.salary;

    const { error } = await supabase
      .from('hours')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('Hours updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateHours');
  }
}

export async function deleteHours(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('hours')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('Hours deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteHours');
  }
}

// ============= PROCESSES =============

export async function getAllProcesses(): Promise<Process[]> {
  try {
    const { data, error } = await supabase
      .from('processes')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      processName: row.process_name,
      object: row.object || undefined,
      volume: Number(row.volume),
      unit: row.unit,
      rate: Number(row.rate),
      salary: Number(row.salary),
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllProcesses');
    return [];
  }
}

export async function createProcess(process: Omit<Process, 'id'>): Promise<void> {
  try {
    const id = Date.now().toString();

    const { error } = await supabase.from('processes').insert({
      id,
      user_id: process.userId,
      date: process.date,
      process_name: process.processName,
      object: process.object || null,
      volume: process.volume,
      unit: process.unit,
      rate: process.rate,
      salary: process.salary,
    });

    if (error) throw error;
    logger.debug('Process created:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createProcess');
  }
}

export async function updateProcess(id: string, updates: Partial<Omit<Process, 'id' | 'userId'>>): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.processName !== undefined) updateData.process_name = updates.processName;
    if (updates.object !== undefined) updateData.object = updates.object || null;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.salary !== undefined) updateData.salary = updates.salary;

    const { error } = await supabase
      .from('processes')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('Process updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateProcess');
  }
}

export async function deleteProcess(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('processes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('Process deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteProcess');
  }
}

// ============= MATERIALS =============

export async function getAllMaterials(): Promise<Material[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      object: row.object,
      materialName: row.material_name,
      quantity: Number(row.quantity),
      unit: row.unit,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllMaterials');
    return [];
  }
}

export async function createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const id = Date.now().toString();

    const { error } = await supabase.from('materials').insert({
      id,
      user_id: material.userId,
      date: material.date,
      object: material.object,
      material_name: material.materialName,
      quantity: material.quantity,
      unit: material.unit,
      notes: material.notes || null,
    });

    if (error) throw error;
    logger.debug('Material created:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createMaterial');
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('Material deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteMaterial');
  }
}

// ============= LEVELS, OBJECTS, PROCESS TYPES =============
// These will be similar patterns - I'll add the key ones

export async function getAllLevels(): Promise<Level[]> {
  try {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      hourlyRate: Number(row.hourly_rate),
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllLevels');
    return [];
  }
}

export async function getAllObjects(): Promise<ObjectType[]> {
  try {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      isBusinessTrip: row.is_business_trip,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllObjects');
    return [];
  }
}

export async function getAllProcessTypes(): Promise<ProcessType[]> {
  try {
    const { data, error } = await supabase
      .from('process_types')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      object: row.object || undefined,
      rate: Number(row.rate),
      unit: row.unit,
      plannedVolume: row.planned_volume ? Number(row.planned_volume) : undefined,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllProcessTypes');
    return [];
  }
}

export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      managerId: row.manager_id,
      date: row.date,
      description: row.description,
      notes: row.notes || '',
      status: row.status as Assignment['status'],
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllAssignments');
    return [];
  }
}

export async function getAllAdditionalWorks(): Promise<AdditionalWork[]> {
  try {
    const { data, error } = await supabase
      .from('additional_works')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      managerId: row.manager_id,
      objectName: row.object_name,
      date: row.date,
      workName: row.work_name,
      description: row.description || '',
      unit: row.unit,
      volume: Number(row.volume),
      rate: Number(row.rate),
      salary: Number(row.salary),
      status: row.status as AdditionalWork['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllAdditionalWorks');
    return [];
  }
}
