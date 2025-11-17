import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SCRIPT_URL) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
  }

  try {
    // Forward the request to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Google Apps Script returned ${response.status}`,
        details: responseText,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request forwarded to Google Apps Script',
      details: responseText,
    });
  } catch (error) {
    console.error('Error forwarding to Google Apps Script:', error);
    return res.status(500).json({
      error: 'Failed to forward request',
      details: String(error),
    });
  }
}
