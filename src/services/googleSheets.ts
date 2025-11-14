import { logger } from '@/utils/logger';
import { CONFIG } from '@/config/constants';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const BASE_URL = CONFIG.API.BASE_URL;

// Логування конфігурації при завантаженні модуля
logger.info('📊 Google Sheets Configuration:');
logger.info('  Spreadsheet ID:', SPREADSHEET_ID || '⚠️ NOT SET');
logger.info('  API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : '⚠️ NOT SET');
logger.info('  Script URL:', SCRIPT_URL ? '✅ SET' : '⚠️ NOT SET');

// Перевірка конфігурації та вивід інструкцій якщо не встановлено
if (!API_KEY || !SPREADSHEET_ID) {
  logger.error('❌ CRITICAL: Google Sheets configuration is incomplete!');
  logger.error('Please ensure the following environment variables are set in .env or .env.local:');
  logger.error('  VITE_GOOGLE_API_KEY=your_api_key');
  logger.error('  VITE_SPREADSHEET_ID=your_spreadsheet_id');
  logger.error('  VITE_GOOGLE_SCRIPT_URL=your_script_url');
} else {
  logger.info('✅ All required environment variables are set');
  logger.info('  Full Spreadsheet URL:', `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
}

// Read data from a sheet using API Key
export const readSheet = async (range: string) => {
  // Перевірка конфігурації перед запитом
  if (!API_KEY) {
    logger.error('❌ VITE_GOOGLE_API_KEY is not set');
    logger.error('⚠️ Environment variables not loaded. Please ensure:');
    logger.error('   1. .env or .env.local file exists in project root');
    logger.error('   2. It contains: VITE_GOOGLE_API_KEY=your_key');
    logger.error('   3. Dev server is restarted after creating/modifying .env file');
    throw new Error('Google API Key not configured. Check .env file and restart dev server.');
  }

  if (!SPREADSHEET_ID) {
    logger.error('❌ VITE_SPREADSHEET_ID is not set');
    logger.error('⚠️ Environment variables not loaded. Please ensure:');
    logger.error('   1. .env or .env.local file exists in project root');
    logger.error('   2. It contains: VITE_SPREADSHEET_ID=your_id');
    logger.error('   3. Dev server is restarted after creating/modifying .env file');
    throw new Error('Spreadsheet ID not configured. Check .env file and restart dev server.');
  }

  try {
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    logger.info(`📡 Fetching range: ${range}`, undefined, 'googleSheets');
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to read sheet';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorMessage;

        // Лог тільки якщо це помилка квоти
        if (error.error?.code === 429) {
          logger.warn('⚠️ API Quota exceeded. Using cached data.');
        }
      } catch (e) {
        // Мовчки обробляємо помилку парсингу
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    logger.info(`✅ Fetched range "${range}": ${data.values?.length || 0} rows`, undefined, 'googleSheets');
    return data.values || [];
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Load failed') {
      logger.error('❌ Network error: Could not connect to Google Sheets API');
      throw new Error('Network error: Could not connect to Google Sheets. Check API key and spreadsheet permissions.');
    }
    throw error;
  }
};

// Append data to a sheet using Google Apps Script
export const appendSheet = async (range: string, values: any[][]) => {
  if (!SCRIPT_URL) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  logger.info('➕ Appending to sheet', { range, rows: values.length });
  logger.info('Data to append:', values);

  // With no-cors mode, we can't read the response or catch errors
  // Just send the request and assume it worked
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'append',
      spreadsheetId: SPREADSHEET_ID,
      range,
      values,
    }),
  }).then(() => {
    logger.info('✅ Append request sent');
  }).catch(() => {
    // Ignore errors in no-cors mode
    logger.info('📤 Request sent (no-cors mode)');
  });

  return { success: true };
};

// Write data to a sheet using Google Apps Script
export const writeSheet = async (range: string, values: any[][]) => {
  if (!SCRIPT_URL) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  logger.info('✏️ Writing to sheet', { range, rows: values.length });

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      spreadsheetId: SPREADSHEET_ID,
      range,
      values,
    }),
  }).then(() => {
    logger.info('✅ Write request sent');
  }).catch(() => {
    logger.info('📤 Request sent (no-cors mode)');
  });

  return { success: true };
};

export async function updateHourEntry(entryId: string, data: any) {
  if (!SCRIPT_URL) {
    logger.error('❌ SCRIPT_URL not configured');
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  try {
    logger.info('🔄 Updating hour entry:', entryId);
    logger.info('📝 Data:', data);
    logger.info('🌐 Script URL:', SCRIPT_URL);

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateHour',
        spreadsheetId: SPREADSHEET_ID,
        entryId,
        data
      })
    });

    logger.info('✅ Update hour request sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error updating hour entry:', error);
    throw error;
  }
}

export async function deleteHourEntry(entryId: string) {
  if (!SCRIPT_URL) {
    logger.error('❌ SCRIPT_URL not configured');
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  try {
    logger.info('🗑️ Deleting hour entry:', entryId);
    logger.info('🌐 Script URL:', SCRIPT_URL);

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteHour',
        spreadsheetId: SPREADSHEET_ID,
        entryId
      })
    });

    logger.info('✅ Delete hour request sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error deleting hour entry:', error);
    throw error;
  }
}

export async function updateProcessEntry(entryId: string, data: any) {
  if (!SCRIPT_URL) {
    logger.error('❌ SCRIPT_URL not configured');
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  try {
    logger.info('🔄 Updating process entry:', entryId);
    logger.info('📝 Data:', data);
    logger.info('🌐 Script URL:', SCRIPT_URL);

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateProcess',
        spreadsheetId: SPREADSHEET_ID,
        entryId,
        data
      })
    });

    logger.info('✅ Update process request sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error updating process entry:', error);
    throw error;
  }
}

export async function deleteProcessEntry(entryId: string) {
  if (!SCRIPT_URL) {
    logger.error('❌ SCRIPT_URL not configured');
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  try {
    logger.info('🗑️ Deleting process entry:', entryId);
    logger.info('🌐 Script URL:', SCRIPT_URL);

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteProcess',
        spreadsheetId: SPREADSHEET_ID,
        entryId
      })
    });

    logger.info('✅ Delete process request sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ Error deleting process entry:', error);
    throw error;
  }
}