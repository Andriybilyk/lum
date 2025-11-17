// Google Apps Script для записування даних у Google Sheets
// Вставте цей код у Google Apps Script редактор

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const spreadsheetId = payload.spreadsheetId;
    const range = payload.range;
    const values = payload.values;
    const action = payload.action;

    Logger.log('Received request: ' + JSON.stringify(payload));

    const sheet = SpreadsheetApp.openById(spreadsheetId);

    if (action === 'append') {
      // Append data to sheet
      const targetRange = sheet.getRange(range);
      const lastRow = sheet.getLastRow();
      const insertRange = range.split('!')[0] + '!' + (lastRow + 1) + ':' + (lastRow + values.length);

      const targetSheet = sheet.getSheetByName(range.split('!')[0]);
      targetSheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);

      Logger.log('Appended ' + values.length + ' rows');
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Data appended successfully',
        rows: values.length
      })).setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'update') {
      // Update data in sheet
      const targetSheet = sheet.getSheetByName(range.split('!')[0]);
      targetSheet.getRange(range.split('!')[1]).setValues(values);

      Logger.log('Updated range ' + range);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Data updated successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown action: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

// Для тестування - закомментуйте doPost вище і розкомментуйте це
/*
function testAppend() {
  const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // Замініть на ваш ID
  const payload = {
    spreadsheetId: spreadsheetId,
    range: 'Users!A:F',
    values: [['123456', 'Test User', 'employee', 'Level1', '150', '']],
    action: 'append'
  };

  const response = doPost({
    postData: {
      contents: JSON.stringify(payload)
    }
  });

  Logger.log('Response: ' + response.getContent());
}
*/
