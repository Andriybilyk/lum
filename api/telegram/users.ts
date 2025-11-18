import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  createdAt: string;
  lastActivity: string;
}

const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL ||
                          process.env.GOOGLE_SCRIPT_URL ||
                          'https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec';

async function saveUserToGoogleSheets(user: TelegramUser) {
  try {
    const payload = {
      action: 'append',
      spreadsheetId: process.env.VITE_SPREADSHEET_ID,
      range: 'Users!A:F',
      values: [[
        user.id,
        user.firstName,
        user.lastName || '',
        user.username || '',
        user.createdAt,
        'telegram'
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
    console.error('[Telegram Users] Error saving to Google Sheets:', error);
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
  const bodyUserId = (req.body as any)?.id as string;

  if (!userId && !bodyUserId) {
    return res.status(401).json({
      error: 'Unauthorized: Missing user ID',
      hint: 'Provide X-Telegram-User-ID header or id in body'
    });
  }

  const authenticatedUserId = userId || bodyUserId;

  try {
    switch (req.method) {
      case 'GET':
        return handleGetUser(authenticatedUserId, req, res);
      case 'POST':
        return handleCreateUser(authenticatedUserId, req, res);
      case 'PUT':
        return handleUpdateUser(authenticatedUserId, req, res);
      case 'DELETE':
        return handleDeleteUser(authenticatedUserId, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Telegram Users Error]:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGetUser(userId: string, req: VercelRequest, res: VercelResponse) {
  console.log(`[Telegram Users GET] Fetching user profile for ${userId}`);

  const mockUser: TelegramUser = {
    id: userId,
    firstName: 'User',
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    user: mockUser,
    message: 'User profile retrieved (implement Google Sheets read)'
  });
}

async function handleCreateUser(userId: string, req: VercelRequest, res: VercelResponse) {
  const { firstName, lastName, username, telegramId } = req.body;

  if (!firstName) {
    return res.status(400).json({
      error: 'Missing required field',
      required: 'firstName'
    });
  }

  console.log(`[Telegram Users POST] Creating user ${userId}`);

  const newUser: TelegramUser = {
    id: userId,
    firstName,
    lastName,
    username,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  const synced = await saveUserToGoogleSheets(newUser);

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: newUser,
    googleSheetsSynced: synced,
    timestamp: new Date().toISOString()
  });
}

async function handleUpdateUser(userId: string, req: VercelRequest, res: VercelResponse) {
  const { firstName, lastName, username } = req.body;

  console.log(`[Telegram Users PUT] Updating user ${userId}`);

  const updatedUser: TelegramUser = {
    id: userId,
    firstName: firstName || 'User',
    lastName,
    username,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: 'User updated successfully (implement in Google Apps Script)',
    user: updatedUser,
    hint: 'Use Google Apps Script to find and update user row',
    timestamp: new Date().toISOString()
  });
}

async function handleDeleteUser(userId: string, req: VercelRequest, res: VercelResponse) {
  console.log(`[Telegram Users DELETE] Deleting user ${userId}`);

  return res.status(200).json({
    success: true,
    message: 'User deletion request recorded',
    userId,
    hint: 'Implement deletion in Google Apps Script',
    timestamp: new Date().toISOString()
  });
}
