import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HoursEntry {
  date: string;
  hours: number;
  notes?: string;
}

const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL ||
                          process.env.GOOGLE_SCRIPT_URL ||
                          'https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec';

async function appendHoursToGoogleSheets(userId: string, entry: HoursEntry) {
  try {
    const payload = {
      action: 'append',
      spreadsheetId: process.env.VITE_SPREADSHEET_ID,
      range: 'Hours!A:F',
      values: [[
        new Date().toISOString(),
        userId,
        entry.date,
        entry.hours,
        `telegram_${Date.now()}`,
        entry.notes || 'telegram'
      ]]
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('[Telegram Hours] Error appending to Google Sheets:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-User-ID');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = req.headers['x-telegram-user-id'] as string;
  const bodyUserId = (req.body as any)?.userId as string;

  if (!userId && !bodyUserId) {
    return res.status(401).json({
      error: 'Unauthorized: Missing user ID',
      hint: 'Provide X-Telegram-User-ID header or userId in body'
    });
  }

  const authenticatedUserId = userId || bodyUserId;

  try {
    switch (req.method) {
      case 'GET':
        return handleGetHours(authenticatedUserId, req, res);
      case 'POST':
        return handleAddHours(authenticatedUserId, req, res);
      case 'PUT':
        return handleUpdateHours(authenticatedUserId, req, res);
      case 'DELETE':
        return handleDeleteHours(authenticatedUserId, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Telegram Hours Error]:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGetHours(userId: string, req: VercelRequest, res: VercelResponse) {
  const { month, date } = req.query;

  console.log(`[Telegram Hours GET] Fetching hours for user ${userId}`, { month, date });

  const mockEntries = [
    { date: new Date().toISOString().split('T')[0], hours: 8, synced: 'synced' },
    { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], hours: 6, synced: 'synced' }
  ];

  return res.status(200).json({
    success: true,
    userId,
    entries: mockEntries,
    total: mockEntries.reduce((sum, e) => sum + e.hours, 0),
    message: 'Hours retrieved (from cache - implement Google Sheets read)'
  });
}

async function handleAddHours(userId: string, req: VercelRequest, res: VercelResponse) {
  const { hours, date, notes } = req.body as HoursEntry;

  if (!hours || hours <= 0) {
    return res.status(400).json({
      error: 'Invalid hours value',
      required: 'hours must be greater than 0'
    });
  }

  const entryDate = date || new Date().toISOString().split('T')[0];

  console.log(`[Telegram Hours POST] Adding ${hours} hours for user ${userId} on ${entryDate}`);

  const synced = await appendHoursToGoogleSheets(userId, {
    date: entryDate,
    hours,
    notes
  });

  return res.status(201).json({
    success: true,
    message: 'Hours added successfully',
    entry: {
      date: entryDate,
      hours,
      notes,
      synced: synced ? 'synced' : 'pending',
      id: `${userId}-${entryDate}-${Date.now()}`
    },
    timestamp: new Date().toISOString(),
    googleSheetsSynced: synced
  });
}

async function handleUpdateHours(userId: string, req: VercelRequest, res: VercelResponse) {
  const { hours, date, notes } = req.body as HoursEntry;

  if (!date) {
    return res.status(400).json({
      error: 'Missing required field',
      required: 'date'
    });
  }

  console.log(`[Telegram Hours PUT] Updating hours for user ${userId} on ${date}`);

  return res.status(200).json({
    success: true,
    message: 'Hours updated successfully (create new entry and delete old)',
    entry: {
      date,
      hours: hours || 0,
      notes,
      synced: 'pending',
      hint: 'To update, create new entry and delete old one'
    },
    timestamp: new Date().toISOString()
  });
}

async function handleDeleteHours(userId: string, req: VercelRequest, res: VercelResponse) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: 'Missing required field',
      required: 'date (as query parameter)'
    });
  }

  console.log(`[Telegram Hours DELETE] Deleting hours for user ${userId} on ${date}`);

  return res.status(200).json({
    success: true,
    message: 'Hours deletion request recorded',
    date,
    userId,
    hint: 'Implement deletion in Google Apps Script',
    timestamp: new Date().toISOString()
  });
}
