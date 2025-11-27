import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Types for database tables
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase URL or Anon Key not configured', 'Supabase');
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'time-tracker-telegram-mini-app',
      },
    },
  }
);

// Helper function to set current user context for RLS
export async function setCurrentUserContext(userId: string) {
  try {
    const { error } = await supabase.rpc('set_current_user_id', {
      user_id: userId,
    });

    if (error) {
      logger.error('Failed to set user context:', error, 'Supabase');
      throw error;
    }

    logger.debug('User context set:', userId, 'Supabase');
  } catch (error) {
    logger.error('Error setting user context:', error, 'Supabase');
    throw error;
  }
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Helper for error handling
export function handleSupabaseError(error: any, context: string) {
  logger.error(`Supabase error in ${context}:`, error, 'Supabase');

  if (error?.code === 'PGRST116') {
    throw new Error('Запис не знайдено');
  }

  if (error?.code === '23505') {
    throw new Error('Запис з такими даними вже існує');
  }

  if (error?.code === '23503') {
    throw new Error('Помилка зв\'язку з іншими записами');
  }

  throw new Error(error?.message || 'Невідома помилка бази даних');
}

export default supabase;
