/**
 * Centralized configuration constants
 * All app settings in one place for easy maintenance
 */

export const CONFIG = {
  // API Configuration
  API: {
    SUPABASE_URL_ENV: 'VITE_SUPABASE_URL',
    SUPABASE_ANON_KEY_ENV: 'VITE_SUPABASE_ANON_KEY',
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: import.meta.env.DEV ? 'debug' : 'info', // 'debug' | 'info' | 'warn' | 'error'
    ENABLE_GROUPING: true,
    ENABLE_TIMESTAMPS: true,
    PRODUCTION_ERRORS_ONLY: true, // Only log errors in production
  },

  // Business Logic Constants
  BUSINESS: {
    // Salary multipliers
    SALARY_MULTIPLIERS: {
      BUSINESS_TRIP: 1.2, // 20% increase for business trips
      STANDARD: 1.0,
    },

    // Statuses
    ASSIGNMENT_STATUSES: ['pending', 'confirmed', 'declined', 'employee_confirmed', 'manager_confirmed'] as const,
    ADDITIONAL_WORK_STATUSES: ['pending', 'approved', 'rejected'] as const,

    // Date formats
    DATE_FORMAT: 'YYYY-MM-DD',
    DISPLAY_DATE_FORMAT: 'dd.MM.yyyy',

    // Default values
    DEFAULTS: {
      MANAGER_ID: undefined as string | undefined,
      IS_BUSINESS_TRIP: false,
      ADDITIONAL_WORK_STATUS: 'pending',
    },
  },

  // UI Configuration
  UI: {
    // Toast duration
    TOAST_DURATION: 3000, // milliseconds

    // Modal defaults
    MODAL_DELAY: 200, // animation delay

    // Pagination
    ITEMS_PER_PAGE: 10,
    ITEMS_PER_PAGE_REPORT: 20,

    // Timeouts
    DEBOUNCE_DELAY: 300,
    SEARCH_DEBOUNCE: 500,
  },

  // Feature Flags
  FEATURES: {
    ENABLE_OFFLINE_MODE: false,
    ENABLE_BATCH_OPERATIONS: true,
    ENABLE_CACHING: true,
    ENABLE_AUTO_SYNC: true,
    ENABLE_ERROR_REPORTING: true,
  },

  // Error Messages
  ERRORS: {
    NETWORK: 'Помилка мережі. Перевірте з\'єднання з Інтернетом.',
    SUPABASE_NOT_CONFIGURED: 'Supabase не налаштований. Перевірте .env файл.',
    INVALID_DATA: 'Неправильні дані. Перевірте всі поля.',
    SAVE_FAILED: 'Не вдалося зберегти дані.',
    LOAD_FAILED: 'Не вдалося завантажити дані.',
    UNAUTHORIZED: 'Ви не мають доступу до цієї операції.',
  },

  // Success Messages
  SUCCESS: {
    USER_CREATED: 'Користувача успішно створено.',
    USER_UPDATED: 'Користувача успішно оновлено.',
    DATA_SAVED: 'Дані успішно збережені.',
    WORK_SUBMITTED: 'Роботу успішно подано на затвердження.',
    WORK_APPROVED: 'Роботу успішно затверджено.',
    ASSIGNMENT_CREATED: 'Завдання успішно створено.',
  },
};

// Environment-specific overrides
if (import.meta.env.PROD) {
  CONFIG.LOGGING.LEVEL = 'error';
  CONFIG.LOGGING.PRODUCTION_ERRORS_ONLY = true;
}

export type Config = typeof CONFIG;
