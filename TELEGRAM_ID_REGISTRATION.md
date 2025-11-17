# Telegram ID Registration Guide

## Overview

The application now uses **real Telegram user IDs** for registration and automatic login. This eliminates the need for manual username entry and provides seamless authentication.

## How It Works

### 1. Telegram User Data Retrieval

When a user launches the app through Telegram Mini App, the following data is automatically captured:

```typescript
// From Telegram WebApp API
window.Telegram.WebApp.initDataUnsafe.user = {
  id: 123456789,           // Real Telegram user ID (NOT a timestamp)
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  is_bot: false,
  language_code: "en"
}
```

### 2. Registration Flow

#### Employee Registration
1. User clicks "Я Працівник" on welcome screen
2. App calls `getTelegramUserId()` and `getTelegramUserName()` from `src/utils/telegramWebApp.ts`
3. Telegram ID is captured and stored as the primary user ID
4. Name is auto-filled from Telegram profile
5. User selects level and manager
6. Data is saved to Google Sheets with Telegram ID as the `id` column (column A)

#### Manager Registration
1. User clicks "Я Менеджер" on welcome screen
2. Same Telegram data capture process
3. User enters manager password (6323)
4. Data is saved with Telegram ID as primary ID

### 3. Auto-Login Flow

When returning users open the app:

```
1. WelcomeScreen mounts
2. getTelegramUserId() retrieves the user's Telegram ID
3. Search in Google Sheets for user with matching telegramId
4. If found: Automatically navigate to employee/manager dashboard
5. If not found: Show registration screen
```

### 4. Data Storage

In Google Sheets, users are stored with this structure:

```
Column A: Telegram ID (e.g., 123456789)
Column B: Name
Column C: Role (employee/manager)
Column D: Level
Column E: Hourly Rate
Column F: Manager ID (if employee)
```

The Telegram ID is **not** stored in a separate column - it **is** the primary ID in column A.

## Key Files

- **`src/utils/telegramWebApp.ts`** - Core utility functions
  - `getTelegramWebApp()` - Get WebApp instance
  - `getTelegramUser()` - Get full user object
  - `getTelegramUserId()` - Get user's numeric Telegram ID as string
  - `getTelegramUserName()` - Get formatted user name

- **`src/components/employee/EmployeeRegistration.tsx`** - Uses utilities to capture Telegram ID
- **`src/components/manager/ManagerRegistration.tsx`** - Uses utilities for manager registration
- **`src/pages/WelcomeScreen.tsx`** - Auto-login logic

## Important Notes

### Development vs. Production

- **In Telegram Mini App**: Real Telegram ID is automatically available from `initDataUnsafe`
- **In Development/Browser**: `initDataUnsafe` is not available (WebApp object exists but no user data)
  - This is expected and normal
  - App gracefully handles this by showing null for Telegram ID
  - Falls back to other registration methods

### Debugging

Enable console logs to see Telegram data flow:

```javascript
// In browser console
localStorage.debug = '*'  // Enable all debug logging

// Look for messages like:
// "✅ Telegram user data retrieved: {id: 123456789, first_name: 'John', ...}"
```

### API Quota Management

The app now uses request queuing and caching to prevent API quota exceeded errors:

- **Requests are throttled**: 2.1 seconds between Google Sheets API calls
- **Results are cached**: 15-minute cache for read operations
- **Cache invalidates**: After write operations to ensure data freshness

This allows the app to work reliably even with many users.

## Testing Registration

### To test in Telegram Mini App:

1. Create a Telegram bot with your Telegram Bot API
2. Set up the mini app URL in Bot Manager
3. Open the mini app in Telegram
4. Register as employee or manager
5. Check Google Sheets - Telegram ID should be visible in column A

### To test locally:

1. Open app in browser
2. Try to register - Telegram ID will be unavailable (this is normal)
3. Manual name entry will be required
4. Data will still be saved correctly

## Error Handling

If Telegram user data is not available:
- **Log**: "⚠️ Telegram user data not available in mini app context"
- **App State**: `telegramId = null`
- **User Experience**: Name field becomes editable instead of auto-filled
- **Data Saving**: Still works normally

This ensures the app functions correctly both in and out of Telegram context.

## Security Considerations

- Telegram IDs are numeric and permanent for each user
- Cannot be spoofed (verified by Telegram servers)
- Much more secure than manual name-based identification
- No separate password needed for employees (managers still use password for security)

## Future Improvements

- Sync with Telegram API for real-time profile updates
- Use Telegram ID for automatic manager assignment
- Display Telegram profile picture instead of placeholder
