import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Types for database tables
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured (not placeholder values)
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  if (url === 'your-project-url.supabase.co') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  return true;
};

const isValidKey = (key: string): boolean => {
  if (!key) return false;
  if (key === 'your-anon-key-here') return false;
  if (key.length < 20) return false;
  return true;
};

const isConfigured = isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey);

if (!isConfigured) {
  logger.warn('Supabase not configured - using placeholder values. App will fallback to Google Sheets.', 'Supabase');
}

// Create Supabase client with fallback to dummy values if not configured
// This prevents errors during initialization
export const supabase = createClient<Database>(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
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
  return isConfigured;
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
