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
        return handleAppendWithSheetCreate(ss, sheetName, values);

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

function handleAppendWithSheetCreate(ss, sheetName, values) {
  Logger.log('handleAppendWithSheetCreate called');
  Logger.log('Sheet name: ' + sheetName);
  Logger.log('Values count: ' + values.length);

  let sheet = ss.getSheetByName(sheetName);

  // Якщо аркуша немає, створюємо новий
  if (!sheet) {
    Logger.log('Creating new sheet: ' + sheetName);
    sheet = ss.insertSheet(sheetName);
    Logger.log('Sheet created successfully');
  } else {
    Logger.log('Sheet already exists: ' + sheetName);
  }

  if (!values || values.length === 0) {
    Logger.log('No values to append');
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'No values provided'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    Logger.log('Appending ' + values.length + ' rows starting from ' + startRow);

    const range = sheet.getRange(startRow, 1, values.length, values[0].length);
    range.setValues(values);

    // Форматування звіту
    formatReportSheet(sheet, startRow, values);

    Logger.log('Data appended successfully');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      rowsAdded: values.length,
      startRow: startRow,
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error appending data: ' + error.toString());
    throw error;
  }
}

function formatReportSheet(sheet, startRow, values) {
  try {
    const endRow = startRow + values.length - 1;

    // Установити оптимальну ширину колонок
    sheet.setColumnWidth(1, 250);  // Збільшено для кращої читабельності
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 150);  // Для довших назв
    sheet.setColumnWidth(5, 120);
    sheet.setColumnWidth(6, 120);
    sheet.setColumnWidth(7, 120);
    sheet.setColumnWidth(8, 120);

    // Застосувати базове форматування до всієї області
    const fullRange = sheet.getRange(startRow, 1, values.length, values[0].length);
    fullRange.setFontFamily('Google Sans');  // Сучасний шрифт
    fullRange.setFontSize(10);

    // Форматування для кожного рядка
    for (let i = 0; i < values.length; i++) {
      const currentRow = startRow + i;
      const rowRange = sheet.getRange(currentRow, 1, 1, values[0].length);
      const rowData = values[i];
      const firstCell = rowData[0] ? rowData[0].toString() : '';

      // ═══════════════════════════════════════════════════════
      // ГОЛОВНІ ЗАГОЛОВКИ - Градієнтний синій стиль
      // ═══════════════════════════════════════════════════════
      if (firstCell.includes('ЗВІТ:') || firstCell.includes('ЗВІТ КОМАНДИ')) {
        sheet.setRowHeight(currentRow, 40);
        rowRange.merge();
        rowRange.setFontSize(16)
                .setFontWeight('bold')
                .setBackground('#1a73e8')  // Google Blue
                .setFontColor('#ffffff')
                .setVerticalAlignment('middle')
                .setHorizontalAlignment('center');
        rowRange.setBorder(true, true, true, true, false, false, '#1a73e8', SpreadsheetApp.BorderStyle.SOLID_THICK);
      }

      // ═══════════════════════════════════════════════════════
      // ЗАГОЛОВКИ ПРАЦІВНИКІВ - Темно-синій
      // ═══════════════════════════════════════════════════════
      else if (firstCell.includes('ПРАЦІВНИК:')) {
        sheet.setRowHeight(currentRow, 35);
        rowRange.merge();
        rowRange.setFontSize(13)
                .setFontWeight('bold')
                .setBackground('#174ea6')  // Darker blue
                .setFontColor('#ffffff')
                .setVerticalAlignment('middle')
                .setHorizontalAlignment('left');
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(16);
        rowRange.setBorder(true, true, true, true, false, false, '#174ea6', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }

      // ═══════════════════════════════════════════════════════
      // ЗАГОЛОВКИ ОБ'ЄКТІВ - Фіолетовий акцент
      // ═══════════════════════════════════════════════════════
      else if (firstCell.includes('ОБ\'ЄКТ:')) {
        sheet.setRowHeight(currentRow, 30);
        rowRange.setFontSize(11)
                .setFontWeight('bold')
                .setBackground('#8e24aa')  // Purple
                .setFontColor('#ffffff')
                .setVerticalAlignment('middle');
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(20);
        rowRange.setBorder(true, true, true, true, false, false, '#8e24aa', SpreadsheetApp.BorderStyle.SOLID);
      }

      // ═══════════════════════════════════════════════════════
      // ЗАГОЛОВКИ ТАБЛИЦЬ - Світло-сірий з іконками
      // ═══════════════════════════════════════════════════════
      else if (firstCell === 'Дата' || firstCell === 'Години' || firstCell === 'Процес' ||
               firstCell === 'Об\'єкт' || firstCell === 'Обсяг' || firstCell === 'Одиниця' ||
               firstCell === 'Ставка' || firstCell === 'Заробіток') {
        sheet.setRowHeight(currentRow, 28);
        rowRange.setFontSize(10)
                .setFontWeight('bold')
                .setBackground('#f1f3f4')  // Light gray
                .setFontColor('#202124')   // Almost black
                .setVerticalAlignment('middle');
        rowRange.setBorder(false, false, true, false, false, false, '#dadce0', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

        // Вирівнювання заголовків
        for (let col = 1; col <= values[0].length; col++) {
          const cell = sheet.getRange(currentRow, col);
          if (col === 1) {
            cell.setHorizontalAlignment('left').setPaddingLeft(12);
          } else {
            cell.setHorizontalAlignment('right').setPaddingRight(12);
          }
        }
      }

      // ═══════════════════════════════════════════════════════
      // РЯДКИ З ДАТАМИ - Блакитний акцент з карткою
      // ═══════════════════════════════════════════════════════
      else if (/^\d{4}-\d{2}-\d{2}$/.test(firstCell)) {
        sheet.setRowHeight(currentRow, 26);
        rowRange.setFontSize(11)
                .setFontWeight('bold')
                .setBackground('#e8f0fe')  // Light blue
                .setFontColor('#1967d2')   // Blue text
                .setVerticalAlignment('middle');
        rowRange.setBorder(false, false, true, false, false, false, '#aecbfa', SpreadsheetApp.BorderStyle.SOLID);
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(16);
      }

      // ═══════════════════════════════════════════════════════
      // ДЕТАЛІ ПІД ДАТОЮ - Відступ з іконкою
      // ═══════════════════════════════════════════════════════
      else if (firstCell.startsWith('  Звичайні')) {
        sheet.setRowHeight(currentRow, 24);
        rowRange.setFontSize(9)
                .setBackground('#f8f9fa')
                .setFontColor('#5f6368')
                .setVerticalAlignment('middle');
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setValue('   📋 ' + firstCell.trim()).setPaddingLeft(32);
        rowRange.setBorder(false, false, true, false, false, false, '#e8eaed', SpreadsheetApp.BorderStyle.DOTTED);
      }
      else if (firstCell.startsWith('  Понаднормові')) {
        sheet.setRowHeight(currentRow, 24);
        rowRange.setFontSize(9)
                .setBackground('#fef7e0')  // Light yellow
                .setFontColor('#e37400')   // Orange text
                .setVerticalAlignment('middle');
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setValue('   ⚡ ' + firstCell.trim()).setPaddingLeft(32);
        rowRange.setBorder(false, false, true, false, false, false, '#fdd663', SpreadsheetApp.BorderStyle.DOTTED);
      }

      // ═══════════════════════════════════════════════════════
      // ПІДСУМКОВІ РЯДКИ (РАЗОМ) - Зелений акцент
      // ═══════════════════════════════════════════════════════
      else if (firstCell === 'РАЗОМ:') {
        sheet.setRowHeight(currentRow, 30);
        rowRange.setFontSize(11)
                .setFontWeight('bold')
                .setBackground('#e6f4ea')  // Light green
                .setFontColor('#137333')   // Green text
                .setVerticalAlignment('middle');
        rowRange.setBorder(true, true, true, true, false, false, '#34a853', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(20);
      }

      // ═══════════════════════════════════════════════════════
      // СТАТИСТИКА - Помаранчевий градієнт
      // ═══════════════════════════════════════════════════════
      else if (firstCell.includes('СТАТИСТИКА ПО ОБ\'ЄКТАМ') ||
               firstCell.includes('ЗАГАЛЬНА СТАТИСТИКА')) {
        sheet.setRowHeight(currentRow, 35);
        rowRange.merge();
        rowRange.setFontSize(13)
                .setFontWeight('bold')
                .setBackground('#f57c00')  // Orange
                .setFontColor('#ffffff')
                .setVerticalAlignment('middle')
                .setHorizontalAlignment('center');
        rowRange.setBorder(true, true, true, true, false, false, '#f57c00', SpreadsheetApp.BorderStyle.SOLID_THICK);
      }

      // ═══════════════════════════════════════════════════════
      // ЗАГАЛЬНІ ПІДСУМКИ - Жовтий акцент з рамкою
      // ═══════════════════════════════════════════════════════
      else if (firstCell.includes('ЗАГАЛЬНИЙ') || firstCell === 'ЗАГАЛОМ:') {
        sheet.setRowHeight(currentRow, 32);
        rowRange.setFontSize(12)
                .setFontWeight('bold')
                .setBackground('#fff9c4')  // Light yellow
                .setFontColor('#f9ab00')   // Amber
                .setVerticalAlignment('middle');
        rowRange.setBorder(true, true, true, true, false, false, '#f9ab00', SpreadsheetApp.BorderStyle.DOUBLE);
        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(16);
      }

      // ═══════════════════════════════════════════════════════
      // ФІНАЛЬНІ ПІДСУМКИ - Виділений блок
      // ═══════════════════════════════════════════════════════
      else if (firstCell.includes('Всього годин') || firstCell.includes('ПІДСУМОК') ||
               firstCell.includes('ЗАГАЛОМ КОМАНДА')) {
        sheet.setRowHeight(currentRow, 36);
        rowRange.setFontSize(12)
                .setFontWeight('bold')
                .setBackground('#4285f4')  // Google Blue
                .setFontColor('#ffffff')
                .setVerticalAlignment('middle');
        rowRange.setBorder(true, true, true, true, false, false, '#1a73e8', SpreadsheetApp.BorderStyle.SOLID_THICK);

        // Центруємо підсумкові значення
        for (let col = 1; col <= values[0].length; col++) {
          const cell = sheet.getRange(currentRow, col);
          cell.setHorizontalAlignment('center');
        }
      }

      // ═══════════════════════════════════════════════════════
      // ЗВИЧАЙНІ РЯДКИ ДАНИХ - Чергування кольорів
      // ═══════════════════════════════════════════════════════
      else if (firstCell !== '') {
        sheet.setRowHeight(currentRow, 24);

        // Зебра-стиль для кращої читабельності
        if (i % 2 === 0) {
          rowRange.setBackground('#ffffff');
        } else {
          rowRange.setBackground('#f8f9fa');
        }

        rowRange.setFontColor('#202124')
                .setVerticalAlignment('middle');
        rowRange.setBorder(false, false, true, false, false, false, '#e8eaed', SpreadsheetApp.BorderStyle.SOLID);

        const firstColCell = sheet.getRange(currentRow, 1);
        firstColCell.setPaddingLeft(16);
      }
    }

    // ═══════════════════════════════════════════════════════
    // ФОРМАТУВАННЯ ЧИСЛОВИХ КОЛОНОК
    // ═══════════════════════════════════════════════════════
    for (let col = 2; col <= values[0].length; col++) {
      const colRange = sheet.getRange(startRow, col, values.length, 1);
      colRange.setHorizontalAlignment('right');
      colRange.setNumberFormat('#,##0.00 ₴');  // Додано символ гривні
      colRange.setPaddingRight(12);
    }

    // ═══════════════════════════════════════════════════════
    // ФОРМАТУВАННЯ ПЕРШОЇ КОЛОНКИ
    // ═══════════════════════════════════════════════════════
    const firstColRange = sheet.getRange(startRow, 1, values.length, 1);
    firstColRange.setHorizontalAlignment('left');

    // Заморожуємо перший рядок для зручності прокручування
    sheet.setFrozenRows(1);

    Logger.log('✨ Report formatting applied successfully with enhanced styling');
  } catch (error) {
    Logger.log('Error formatting report: ' + error.toString());
  }
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
    if (String(data[i][idColumn]) === String(entryId)) {
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
    // Processes: ID | UserID | Date | ProcessName | Object | Volume | Unit | Salary
    sheet.getRange(rowIndex + 1, 3).setValue(newData.date);
    sheet.getRange(rowIndex + 1, 4).setValue(newData.processName);
    sheet.getRange(rowIndex + 1, 5).setValue(newData.object || '');
    sheet.getRange(rowIndex + 1, 6).setValue(newData.volume);
    sheet.getRange(rowIndex + 1, 7).setValue(newData.unit);
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
    if (String(data[i][idColumn]) === String(entryId)) {
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

**Processes** (A1:H1):
- ID | UserID | Date | ProcessName | Object | Volume | Unit | Salary

**Assignments** (A1:G1):
- ID | EmployeeID | ManagerID | Date | Description | Notes | Status

**Levels** (A1:C1):
- ID | Name | HourlyRate

**Objects** (A1:C1):
- ID | Name | IsBusinessTrip

**ProcessTypes** (A1:F1):
- ID | Name | Object | Rate | Unit | PlannedVolume

✅ Після цього додаток буде працювати БЕЗ авторизації користувачів!