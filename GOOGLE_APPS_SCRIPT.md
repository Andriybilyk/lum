# Google Apps Script - Налаштування для публічної таблиці

## Крок 1: Зробіть таблицю публічною

1. Відкрийте вашу Google Таблицю
2. Натисніть **Share** (Поділитися)
3. Змініть доступ:
   - **General access:** `Anyone with the link`
   - **Role:** `Editor`
4. Натисніть **Done**

## Крок 2: Створіть Apps Script

1. У таблиці: **Extensions** → **Apps Script**
2. Видаліть весь код
3. Вставте код нижче:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, spreadsheetId, range, values, entryId } = data;
    
    // Логування для дебагу
    Logger.log('Action: ' + action);
    Logger.log('Entry ID: ' + entryId);
    Logger.log('Data: ' + JSON.stringify(data));
    
    // Відкриваємо таблицю за ID
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = range ? range.split('!')[0] : null;
    
    // Обробка різних дій
    switch(action) {
      case 'append':
        return handleAppend(ss, sheetName, values);
      
      case 'update':
        return handleUpdate(ss, sheetName, range, values);
      
      case 'updateHour':
        return handleUpdateEntry(ss, 'Hours', entryId, data.data);
      
      case 'deleteHour':
        return handleDeleteEntry(ss, 'Hours', entryId);
      
      case 'updateProcess':
        return handleUpdateEntry(ss, 'Processes', entryId, data.data);
      
      case 'deleteProcess':
        return handleDeleteEntry(ss, 'Processes', entryId);
      
      default:
        throw new Error('Unknown action: ' + action);
    }
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAppend(ss, sheetName, values) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    rowsAdded: values.length,
    startRow: lastRow + 1
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdate(ss, sheetName, range, values) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const startRow = parseInt(range.match(/\d+/)[0]);
  const lastRow = sheet.getLastRow();
  
  // Очищаємо старі дані (крім заголовків)
  if (lastRow >= startRow) {
    sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn()).clear();
  }
  
  // Записуємо нові дані
  if (values.length > 0) {
    sheet.getRange(startRow, 1, values.length, values[0].length).setValues(values);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    rowsUpdated: values.length
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateEntry(ss, sheetName, entryId, newData) {
  Logger.log('handleUpdateEntry - Sheet: ' + sheetName + ', ID: ' + entryId);
  Logger.log('New data: ' + JSON.stringify(newData));
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  // Знаходимо рядок з цим ID
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  Logger.log('Headers: ' + JSON.stringify(headers));
  Logger.log('ID column index: ' + idColumn);
  
  if (idColumn === -1) {
    throw new Error('ID column not found');
  }
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumn] === entryId) {
      rowIndex = i;
      Logger.log('Found entry at row: ' + (i + 1));
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error('Entry not found: ' + entryId);
  }
  
  // Оновлюємо дані
  if (sheetName === 'Hours') {
    // Hours: ID | UserID | Date | Hours | Object | IsBusinessTrip | Salary
    sheet.getRange(rowIndex + 1, 3).setValue(newData.date);
    sheet.getRange(rowIndex + 1, 4).setValue(newData.hours);
    sheet.getRange(rowIndex + 1, 5).setValue(newData.object);
    sheet.getRange(rowIndex + 1, 6).setValue(newData.isBusinessTrip);
    sheet.getRange(rowIndex + 1, 7).setValue(newData.salary);
    Logger.log('Updated Hours entry');
  } else if (sheetName === 'Processes') {
    // Processes: ID | UserID | Date | ProcessName | Volume | Unit | Rate | Salary
    sheet.getRange(rowIndex + 1, 3).setValue(newData.date);
    sheet.getRange(rowIndex + 1, 4).setValue(newData.processName);
    sheet.getRange(rowIndex + 1, 5).setValue(newData.volume);
    sheet.getRange(rowIndex + 1, 6).setValue(newData.unit);
    sheet.getRange(rowIndex + 1, 7).setValue(newData.rate);
    sheet.getRange(rowIndex + 1, 8).setValue(newData.salary);
    Logger.log('Updated Processes entry');
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    entryId: entryId
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteEntry(ss, sheetName, entryId) {
  Logger.log('handleDeleteEntry - Sheet: ' + sheetName + ', ID: ' + entryId);
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  // Знаходимо рядок з цим ID
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColumn = headers.indexOf('ID');
  
  if (idColumn === -1) {
    throw new Error('ID column not found');
  }
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColumn] === entryId) {
      rowIndex = i;
      Logger.log('Found entry to delete at row: ' + (i + 1));
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error('Entry not found: ' + entryId);
  }
  
  // Видаляємо рядок
  sheet.deleteRow(rowIndex + 1);
  Logger.log('Deleted row: ' + (rowIndex + 1));
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    entryId: entryId
  })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'API is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

## Крок 3: Збережіть і Deploy

1. **File** → **Save** (Ctrl+S)
2. Назва: `Luminexa API`
3. **Deploy** → **New deployment**
4. Іконка ⚙️ → **Web app**
5. Налаштування:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← ВАЖЛИВО!
6. **Deploy**
7. **Authorize access** → дозвольте доступ

## Крок 4: Скопіюйте URL

Скопіюйте **Web app URL** (виглядає як `https://script.google.com/macros/s/.../exec`)

## Крок 5: Додайте URL в проект

Перейдіть в налаштування проекту і оновіть `VITE_GOOGLE_SCRIPT_URL`

## Перевірка

Відкрийте URL в браузері - повинні побачити:
```json
{"status":"API is running","timestamp":"2024-..."}
```

## Структура таблиці

Переконайтесь що у вас є такі аркуші з заголовками:

**Users** (A1:F1):
- ID | Name | Role | Level | HourlyRate | ManagerID

**Hours** (A1:G1):
- ID | UserID | Date | Hours | Object | IsBusinessTrip | Salary

**Processes** (A1:G1):
- ID | UserID | Date | ProcessName | Volume | Unit | Salary

**Assignments** (A1:G1):
- ID | EmployeeID | ManagerID | Date | Description | Notes | Status

**Levels** (A1:C1):
- ID | Name | HourlyRate

**Objects** (A1:B1):
- ID | Name

**ProcessTypes** (A1:D1):
- ID | Name | Rate | Unit

✅ Після цього додаток буде працювати БЕЗ авторизації користувачів!