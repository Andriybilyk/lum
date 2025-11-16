# Telegram Mini App Implementation Guide

## Overview

This document describes the Telegram Mini App integration for the time tracking application. The Mini App provides a lightweight interface for employees to log work hours directly within Telegram.

## Architecture

### Components

1. **TelegramMiniApp.tsx** - Main UI component (`/src/pages/TelegramMiniApp.tsx`)
   - Mobile-optimized interface for Telegram WebView
   - Quick time logging with preset durations (0.5h, 1h, 4h, 8h)
   - Month progress tracking (160-hour target)
   - Recent entries display with sync status
   - Manual synchronization button

2. **TelegramAppContext.tsx** - State management (`/src/contexts/TelegramAppContext.tsx`)
   - Manages Telegram user authentication
   - Handles time entry data and monthly statistics
   - Manages auto-sync with backend
   - Provides hooks for component integration

3. **telegramSync.ts** - Data persistence service (`/src/services/telegramSync.ts`)
   - localStorage-based data storage
   - Offline-first synchronization
   - Time entry management (add, retrieve, mark sync status)
   - Auto-sync functionality with configurable intervals

4. **telegramApi.ts** - API client service (`/src/services/telegramApi.ts`)
   - HTTP client for backend communication
   - Endpoints for sync, add hours, and data retrieval
   - Error handling and logging

## Features

### 1. Quick Time Logging
Users can add hours with a single tap:
- **+30 min** - Half hour entry
- **+1h** - Single hour entry
- **+4h** - Half day entry
- **+8h** - Full day entry

### 2. Month Progress Tracking
- Visual progress bar showing hours logged vs. monthly target (160 hours)
- Percentage calculation
- Real-time updates

### 3. Recent Entries
- Display of last 7 work entries
- Sync status indicators:
  - ✅ **Synced** - Successfully synchronized with backend
  - ⏳ **Pending** - Awaiting synchronization
  - ❌ **Error** - Synchronization failed

### 4. Offline-First Architecture
- All data stored in browser's localStorage
- Works without internet connectivity
- Automatic sync when connection is restored
- 30-second auto-sync interval

### 5. Telegram Integration
- User authentication via Telegram Web App SDK
- Automatic user identification
- Telegram UI adaptation (expansion to full screen)

## Setup Instructions

### 1. Bot Configuration

Create a Telegram bot and add it as a Mini App:

```bash
# Using BotFather on Telegram
/newapp
# Provide app name and URL
# Example: https://yourdomain.com/telegram
```

### 2. Environment Variables

Add to your `.env` file:

```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_APP_URL=https://yourdomain.com
```

### 3. Backend Endpoint

The Mini App expects the following backend endpoints:

**POST /api/telegram/sync**
```json
Request:
{
  "userId": "123456789",
  "entries": [
    {
      "date": "2024-11-14",
      "hours": 8,
      "synced": "pending",
      "id": "entry-id"
    }
  ],
  "timestamp": "2024-11-14T10:30:00Z"
}

Response:
{
  "success": true,
  "message": "Data synchronized successfully",
  "syncedAt": "2024-11-14T10:30:00Z",
  "entries": [...]
}
```

**POST /api/telegram/hours/{userId}**
```json
Request:
{
  "hours": 8,
  "date": "2024-11-14"
}

Response:
{
  "success": true,
  "message": "Hours added successfully",
  "entries": [...]
}
```

**GET /api/telegram/hours/{userId}?month=2024-11**
```json
Response:
{
  "success": true,
  "entries": [...]
}
```

### 4. Access the Mini App

The Mini App is available at: `https://yourdomain.com/telegram`

Within Telegram, users can access it via:
1. Direct link to your bot with `/start`
2. Bot menu button (if configured)
3. Inline button in notifications

## Integration with Existing System

### Data Synchronization

The Telegram Mini App stores data independently in localStorage while maintaining sync capability with the main backend. Here's the sync flow:

```
User Action (Add Hours)
    ↓
Local Storage Update
    ↓
Sync Service (Pending)
    ↓
API Call to Backend
    ↓
Backend Processing
    ↓
Response (Success/Failure)
    ↓
Update Sync Status (Synced/Error)
```

### User Context Integration

Users can be identified through Telegram Web App's `initDataUnsafe.user` object:

```typescript
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}
```

This should be mapped to your internal user system via the `userId` field.

## Usage Example

### Adding Hours to the Mini App

```typescript
import { useTelegramApp } from '@/contexts/TelegramAppContext';

function MyComponent() {
  const { addHours, isSyncing } = useTelegramApp();

  const handleAddHours = async () => {
    try {
      await addHours(4); // Add 4 hours
    } catch (error) {
      console.error('Failed to add hours:', error);
    }
  };

  return (
    <button onClick={handleAddHours} disabled={isSyncing}>
      Add 4 Hours
    </button>
  );
}
```

### Accessing Mini App Data

```typescript
const {
  user,              // Current Telegram user
  todayHours,        // Hours logged today
  monthTotal,        // Total hours this month
  monthProgress,     // Percentage of 160-hour target
  recentEntries,     // Last 7 entries
  isSyncing,         // Sync in progress
  syncWithServer,    // Manual sync function
} = useTelegramApp();
```

## Performance Considerations

1. **localStorage Limits**: Typical ~5-10MB per domain
2. **Auto-sync Interval**: 30 seconds (configurable in `telegramSync.ts`)
3. **Network**: Minimal - only pending entries sent on sync
4. **Battery**: Auto-sync runs efficiently, can be disabled if needed

## Security Notes

1. **Data Validation**: All entries validated before storage
2. **User Isolation**: Data keyed by Telegram user ID
3. **localStorage**: Not encrypted (consider production security measures)
4. **API Authentication**: Include Telegram bot token verification on backend

## Testing

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Access at: `http://localhost:5173/telegram`

4. For Telegram testing, use [Telegram Bot Testing Tools](https://core.telegram.org/bots/testing)

### E2E Testing

```bash
npm run test:e2e
```

## Troubleshooting

### Mini App doesn't load
- Check Telegram Web App SDK is loaded
- Verify bot is properly configured in BotFather
- Check browser console for errors

### Data not syncing
- Verify backend endpoints are accessible
- Check network tab for API responses
- Ensure CORS headers are configured

### Offline mode not working
- Verify browser supports localStorage
- Check localStorage quota not exceeded
- Clear browser data and try again

## Future Enhancements

1. **Push Notifications**: Implement Telegram bot notifications for sync completion
2. **Advanced Analytics**: Daily/weekly hour summaries
3. **Multi-language Support**: Localization for different locales
4. **Biometric Auth**: Fingerprint/Face ID for quick logging
5. **Camera Integration**: Proof of work photo uploads
6. **Scheduling**: Set reminders to log hours
7. **Team Features**: Share hours summary with managers

## Support

For issues or questions, refer to:
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
- Project issue tracker

## Maintenance

### Regular Tasks

1. Monitor auto-sync reliability
2. Review localStorage usage patterns
3. Update Telegram SDK when new versions available
4. Test sync recovery after network outages

### Monitoring

Add monitoring for:
- Sync success/failure rates
- Average sync time
- localStorage quota usage
- User engagement metrics
