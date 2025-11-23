/**
 * Centralized configuration constants
 * All app settings in one place for easy maintenance
 */

export const CONFIG = {
  // Google Sheets Configuration
  GOOGLE_SHEETS: {
    // API limits and performance
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    DELAY_BETWEEN_REQUESTS: 2100, // 2.1 seconds to respect rate limit (60 req/min)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second between retries

    // Sheet ranges - all sheets and their column ranges
    RANGES: {
      USERS: 'Users!A:G',
      HOURS: 'Hours!A:G',
      PROCESSES: 'Processes!A:I',
      LEVELS: 'Levels!A:C',
      OBJECTS: 'Objects!A:C',
      PROCESS_TYPES: 'ProcessTypes!A:F',
      ASSIGNMENTS: 'Assignments!A:G',
      ADDITIONAL_WORKS: 'AdditionalWorks!A:M',
    },

    // Sheet row indexes (0-based)
    COLUMN_INDEXES: {
      USERS: { ID: 0, NAME: 1, ROLE: 2, LEVEL: 3, HOURLY_RATE: 4, MANAGER_ID: 5, TELEGRAM_ID: 6 },
      HOURS: { ID: 0, USER_ID: 1, DATE: 2, HOURS: 3, OBJECT: 4, IS_BUSINESS_TRIP: 5, SALARY: 6 },
      PROCESSES: { ID: 0, USER_ID: 1, DATE: 2, PROCESS_NAME: 3, OBJECT: 4, VOLUME: 5, UNIT: 6, RATE: 7, SALARY: 8 },
      LEVELS: { ID: 0, NAME: 1, HOURLY_RATE: 2 },
      OBJECTS: { ID: 0, NAME: 1, IS_BUSINESS_TRIP: 2 },
      PROCESS_TYPES: { ID: 0, NAME: 1, OBJECT: 2, RATE: 3, UNIT: 4, PLANNED_VOLUME: 5 },
      ASSIGNMENTS: { ID: 0, EMPLOYEE_ID: 1, MANAGER_ID: 2, DATE: 3, DESCRIPTION: 4, NOTES: 5, STATUS: 6 },
      ADDITIONAL_WORKS: { ID: 0, USER_ID: 1, MANAGER_ID: 2, OBJECT_NAME: 3, DATE: 4, WORK_NAME: 5, DESCRIPTION: 6, UNIT: 7, VOLUME: 8, RATE: 9, SALARY: 10, STATUS: 11, CREATED_AT: 12 },
    },
  },

  // API Configuration
  API: {
    RATE_LIMIT: 60, // requests per minute
    BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
    API_KEY_ENV: 'VITE_GOOGLE_API_KEY',
    SPREADSHEET_ID_ENV: 'VITE_SPREADSHEET_ID',
    SCRIPT_URL_ENV: 'VITE_GOOGLE_SCRIPT_URL',
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
    API_KEY: 'Google API ключ не налаштований. Перевірте .env файл.',
    SPREADSHEET_ID: 'ID таблиці не налаштований. Перевірте .env файл.',
    QUOTA_EXCEEDED: 'Перевищений ліміт API Google. Спробуйте пізніше.',
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
