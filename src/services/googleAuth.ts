// Google OAuth 2.0 Service
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient: any = null;
let accessToken: string | null = null;

// Initialize Google Identity Services
export const initGoogleAuth = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set in requestAccessToken
      });
      resolve(true);
    };
    document.body.appendChild(script);
  });
};

// Request access token
export const requestAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(response);
        return;
      }
      accessToken = response.access_token;
      resolve(response.access_token);
    };

    // Check if already have valid token
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Get current access token
export const getAccessToken = () => accessToken;

// Revoke token (logout)
export const revokeToken = () => {
  if (accessToken) {
    // @ts-ignore
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
    });
  }
};

// Check if user is authenticated
export const isAuthenticated = () => !!accessToken;
