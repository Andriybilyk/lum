import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TimeEntry {
  date: string;
  hours: number;
  synced: 'synced' | 'pending' | 'error';
  id?: string;
}

interface SyncRequest {
  userId: string;
  entries: TimeEntry[];
  timestamp: string;
}

const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL ||
                          process.env.GOOGLE_SCRIPT_URL ||
                          'https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec';

async function appendToGoogleSheets(userId: string, entries: TimeEntry[]) {
  try {
    console.log(`[Telegram Sync] Forwarding ${entries.length} entries to Google Sheets for user ${userId}`);

    const payload = {
      action: 'append',
      spreadsheetId: process.env.VITE_SPREADSHEET_ID,
      range: 'Hours!A:F',
      values: entries.map(entry => [
        new Date().toISOString(),
        userId,
        entry.date,
        entry.hours,
        entry.id || `telegram_${Date.now()}`,
        'telegram'
      ])
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Telegram Sync] Google Sheets error: ${response.status}`);
      return false;
    }

    console.log(`[Telegram Sync] Successfully appended ${entries.length} entries to Google Sheets`);
    return true;
  } catch (error) {
    console.error('[Telegram Sync] Error appending to Google Sheets:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-User-ID');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, entries, timestamp } = req.body as SyncRequest;

    if (!userId || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        error: 'Missing or invalid required fields',
        required: ['userId (string)', 'entries (array)', 'timestamp (string)']
      });
    }

    const userIdHeader = req.headers['x-telegram-user-id'] as string;
    if (userIdHeader && userId !== userIdHeader) {
      console.warn(`[Telegram Sync] User ID mismatch: ${userId} !== ${userIdHeader}`);
      return res.status(403).json({
        error: 'Unauthorized: User ID mismatch'
      });
    }

    console.log(`[Telegram Sync] Syncing ${entries.length} entries for user ${userId}`);

    const validEntries = entries.filter(e =>
      e.date && typeof e.hours === 'number' && e.hours > 0
    );

    if (validEntries.length === 0) {
      console.log(`[Telegram Sync] No valid entries found for user ${userId}`);
      return res.status(200).json({
        success: true,
        message: 'No valid entries to sync',
        syncedAt: new Date().toISOString(),
        entriesSynced: 0,
        entries: []
      });
    }

    console.log(`[Telegram Sync] Processing ${validEntries.length} valid entries for user ${userId}`);

    const synced = await appendToGoogleSheets(userId, validEntries);

    if (!synced) {
      console.warn(`[Telegram Sync] Failed to append to Google Sheets, but returning success for offline fallback`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${validEntries.length} entries`,
      syncedAt: new Date().toISOString(),
      entriesSynced: validEntries.length,
      entriesProcessed: validEntries,
      googleSheetsSynced: synced
    });
  } catch (error) {
    console.error('[Telegram Sync Error]:', error);
    return res.status(500).json({
      error: 'Failed to process sync request',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
