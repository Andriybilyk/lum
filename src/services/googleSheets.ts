const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Логування конфігурації при завантаженні модуля
console.log('📊 Google Sheets Configuration:');
console.log('  Spreadsheet ID:', SPREADSHEET_ID);
console.log('  API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('  Script URL:', SCRIPT_URL);
console.log('  Full Spreadsheet URL:', SPREADSHEET_ID ? `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}` : 'N/A');

// Read data from a sheet using API Key
export const readSheet = async (range: string) => {
  // Перевірка конфігурації перед запитом
  if (!API_KEY) {
    console.error('❌ VITE_GOOGLE_API_KEY is not set');
    throw new Error('Google API Key not configured');
  }
  
  if (!SPREADSHEET_ID) {
    console.error('❌ VITE_SPREADSHEET_ID is not set');
    throw new Error('Spreadsheet ID not configured');
  }

  try {
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    
    console.log('📖 Reading from sheet:', range);
    
    const response = await fetch(url);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Read error response:', errorText);
      
      let errorMessage = 'Failed to read sheet';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorMessage;
        console.error('❌ Parsed error:', error);
        
        // Додаткові підказки для типових помилок
        if (error.error?.code === 403) {
          console.error('💡 Hint: Make sure the spreadsheet is shared publicly (Anyone with the link can view)');
        } else if (error.error?.code === 400) {
          console.error('💡 Hint: Check if the API key is valid and the sheet name is correct');
        }
      } catch (e) {
        console.error('❌ Could not parse error response');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Read success:', range, 'rows:', data.values?.length || 0);
    return data.values || [];
  } catch (error) {
    // Детальніше логування помилок
    if (error instanceof TypeError && error.message === 'Load failed') {
      console.error('❌ Network error: Could not connect to Google Sheets API');
      console.error('💡 Possible causes:');
      console.error('   1. Invalid API key');
      console.error('   2. Spreadsheet not shared publicly');
      console.error('   3. Network/CORS issues');
      console.error('   4. Spreadsheet ID is incorrect');
      throw new Error('Network error: Could not connect to Google Sheets. Check API key and spreadsheet permissions.');
    }
    
    console.error('❌ Exception in readSheet:', error);
    throw error;
  }
};

// Append data to a sheet using Google Apps Script
export const appendSheet = async (range: string, values: any[][]) => {
  if (!SCRIPT_URL) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  console.log('➕ Appending to sheet:', range, 'rows:', values.length);
  console.log('Data to append:', values);

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
    console.log('✅ Append request sent');
  }).catch(() => {
    // Ignore errors in no-cors mode
    console.log('📤 Request sent (no-cors mode)');
  });

  return { success: true };
};

// Write data to a sheet using Google Apps Script
export const writeSheet = async (range: string, values: any[][]) => {
  if (!SCRIPT_URL) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL not configured');
  }

  console.log('✏️ Writing to sheet:', range, 'rows:', values.length);

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
    console.log('✅ Write request sent');
  }).catch(() => {
    console.log('📤 Request sent (no-cors mode)');
  });

  return { success: true };
};

export async function updateHourEntry(entryId: string, data: any) {
  try {
    console.log('🔄 Updating hour entry:', entryId, data);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateHour',
        spreadsheetId: SPREADSHEET_ID,
        entryId,
        data  // Передаємо дані напряму
      })
    });

    console.log('✅ Update hour request sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating hour entry:', error);
    throw error;
  }
}

export async function deleteHourEntry(entryId: string) {
  try {
    console.log('🗑️ Deleting hour entry:', entryId);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteHour',
        spreadsheetId: SPREADSHEET_ID,
        entryId
      })
    });

    console.log('✅ Delete hour request sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting hour entry:', error);
    throw error;
  }
}

export async function updateProcessEntry(entryId: string, data: any) {
  try {
    console.log('🔄 Updating process entry:', entryId, data);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateProcess',
        spreadsheetId: SPREADSHEET_ID,
        entryId,
        data  // Передаємо дані напряму
      })
    });

    console.log('✅ Update process request sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating process entry:', error);
    throw error;
  }
}

export async function deleteProcessEntry(entryId: string) {
  try {
    console.log('🗑️ Deleting process entry:', entryId);
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteProcess',
        spreadsheetId: SPREADSHEET_ID,
        entryId
      })
    });

    console.log('✅ Delete process request sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting process entry:', error);
    throw error;
  }
}