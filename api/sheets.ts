import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  // Get SCRIPT_URL from environment (try both VITE_ prefixed and non-prefixed versions)
  const SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL ||
                     process.env.GOOGLE_SCRIPT_URL ||
                     'https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec';

  console.log('Using SCRIPT_URL:', SCRIPT_URL ? '✓ configured' : '✗ not configured');

  if (!SCRIPT_URL) {
    console.error('VITE_GOOGLE_SCRIPT_URL not configured');
    return res.status(500).json({
      error: 'GOOGLE_SCRIPT_URL not configured',
      message: 'VITE_GOOGLE_SCRIPT_URL environment variable is not set'
    });
  }

  try {
    console.log('Forwarding request to Google Apps Script');
    console.log('Payload:', JSON.stringify(req.body));

    // Forward the request to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);

    if (!response.ok) {
      console.error('Google Apps Script error:', response.status, responseText);
      return res.status(response.status).json({
        error: `Google Apps Script returned ${response.status}`,
        details: responseText,
      });
    }

    console.log('Successfully forwarded to Google Apps Script');
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
