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
  WorkPhoto,
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
      price: row.price ? Number(row.price) : undefined,
      totalCost: row.total_cost ? Number(row.total_cost) : undefined,
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
      price: material.price || null,
      // total_cost буде розраховано автоматично тригером в БД
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

export async function createLevel(level: Level): Promise<void> {
  try {
    const { error } = await supabase.from('levels').insert({
      id: level.id,
      name: level.name,
      hourly_rate: level.hourlyRate,
    });

    if (error) throw error;
    logger.debug('Level created:', level.id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createLevel');
  }
}

export async function updateLevel(id: string, updates: { name?: string; rate?: number }): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.rate !== undefined) updateData.hourly_rate = updates.rate;

    const { error } = await supabase
      .from('levels')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('Level updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateLevel');
  }
}

export async function deleteLevel(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('Level deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteLevel');
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

export async function createObject(object: ObjectType): Promise<void> {
  try {
    const { error } = await supabase.from('objects').insert({
      id: object.id,
      name: object.name,
      is_business_trip: object.isBusinessTrip,
    });

    if (error) throw error;
    logger.debug('Object created:', object.id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createObject');
  }
}

export async function updateObject(id: string, updates: Partial<Omit<ObjectType, 'id'>>): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isBusinessTrip !== undefined) updateData.is_business_trip = updates.isBusinessTrip;

    const { error } = await supabase
      .from('objects')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('Object updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateObject');
  }
}

export async function deleteObject(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('objects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('Object deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteObject');
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

export async function createProcessType(processType: ProcessType): Promise<void> {
  try {
    const { error } = await supabase.from('process_types').insert({
      id: processType.id,
      name: processType.name,
      object: processType.object || null,
      rate: processType.rate,
      unit: processType.unit,
      planned_volume: processType.plannedVolume || null,
    });

    if (error) throw error;
    logger.debug('ProcessType created:', processType.id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createProcessType');
  }
}

export async function updateProcessType(id: string, updates: Partial<Omit<ProcessType, 'id'>>): Promise<void> {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.object !== undefined) updateData.object = updates.object || null;
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.plannedVolume !== undefined) updateData.planned_volume = updates.plannedVolume || null;

    const { error } = await supabase
      .from('process_types')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('ProcessType updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateProcessType');
  }
}

export async function deleteProcessType(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('process_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('ProcessType deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteProcessType');
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

export async function createAssignment(assignment: Assignment & { createdAt: string; updatedAt: string }): Promise<void> {
  try {
    const { error } = await supabase.from('assignments').insert({
      id: assignment.id,
      employee_id: assignment.employeeId,
      manager_id: assignment.managerId,
      date: assignment.date,
      description: assignment.description,
      notes: assignment.notes || null,
      status: assignment.status,
      created_at: assignment.createdAt,
      updated_at: assignment.updatedAt,
    });

    if (error) throw error;
    logger.debug('Assignment created:', assignment.id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createAssignment');
  }
}

export async function updateAssignment(id: string, updates: { status?: string }): Promise<void> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('Assignment updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateAssignment');
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

export async function createAdditionalWork(work: AdditionalWork): Promise<void> {
  try {
    const { error } = await supabase.from('additional_works').insert({
      id: work.id,
      user_id: work.userId,
      manager_id: work.managerId,
      object_name: work.objectName,
      date: work.date,
      work_name: work.workName,
      description: work.description || null,
      unit: work.unit,
      volume: work.volume,
      rate: work.rate,
      salary: work.salary,
      status: work.status,
      created_at: work.createdAt,
      updated_at: work.updatedAt,
    });

    if (error) throw error;
    logger.debug('AdditionalWork created:', work.id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createAdditionalWork');
  }
}

export async function updateAdditionalWork(
  id: string,
  updates: Partial<Omit<AdditionalWork, 'id' | 'userId' | 'managerId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.objectName !== undefined) updateData.object_name = updates.objectName;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.workName !== undefined) updateData.work_name = updates.workName;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.volume !== undefined) updateData.volume = updates.volume;
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.salary !== undefined) updateData.salary = updates.salary;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('additional_works')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('AdditionalWork updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateAdditionalWork');
  }
}

// ============= WORK PHOTOS =============

export async function getAllWorkPhotos(): Promise<WorkPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('work_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      object: row.object,
      date: row.date,
      photoUrl: row.photo_url,
      description: row.description || undefined,
      photoType: row.photo_type as 'general' | 'progress' | 'issue' | 'completion',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    handleSupabaseError(error, 'getAllWorkPhotos');
    return [];
  }
}

export async function createWorkPhoto(photo: Omit<WorkPhoto, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const { error } = await supabase.from('work_photos').insert({
      user_id: photo.userId,
      object: photo.object,
      date: photo.date,
      photo_url: photo.photoUrl,
      description: photo.description || null,
      photo_type: photo.photoType,
    });

    if (error) throw error;
    logger.debug('WorkPhoto created', 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'createWorkPhoto');
  }
}

export async function updateWorkPhoto(id: string, updates: Partial<Omit<WorkPhoto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const updateData: Record<string, any> = {};

    if (updates.object !== undefined) updateData.object = updates.object;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.photoType !== undefined) updateData.photo_type = updates.photoType;

    const { error } = await supabase
      .from('work_photos')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    logger.debug('WorkPhoto updated:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'updateWorkPhoto');
  }
}

export async function deleteWorkPhoto(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('work_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    logger.debug('WorkPhoto deleted:', id, 'Supabase');
  } catch (error) {
    handleSupabaseError(error, 'deleteWorkPhoto');
  }
}
