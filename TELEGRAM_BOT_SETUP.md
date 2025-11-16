# Telegram Bot Setup Guide

This guide explains how to set up a Telegram Bot and configure it to use the Mini App.

## Prerequisites

- Telegram account
- BotFather bot (already available on Telegram)
- Your domain/hosting (for the Mini App URL)

## Step 1: Create a Bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Start the bot with `/start`
3. Send `/newbot` command
4. Follow the prompts:
   - Give your bot a name (e.g., "Time Tracker Bot")
   - Give your bot a username (e.g., "my_time_tracker_bot")

5. BotFather will respond with your bot token. **Save this securely**.

Example token format: `123456789:ABCDefGHIjklmnopqrsTUVwxyz`

## Step 2: Configure Bot Settings

### Set Bot Commands

In BotFather, send:

```
/setcommands
```

Then select your bot and provide commands as:

```
start - Start time tracking
help - Get help
hours - View your hours
sync - Sync data
logout - Remove your data
```

### Set Bot Menu Button

Send in BotFather:

```
/setmenubutton
```

Select your bot and choose "Web App", then provide:
- Button text: "Time Tracker"
- URL: `https://yourdomain.com/telegram`

## Step 3: Set Up the Mini App

### 1. Get Your App URL

Your Mini App will be available at:
```
https://yourdomain.com/telegram
```

### 2. Configure Bot for Mini App

In BotFather, send:

```
/newapp
```

Select your bot and provide:
- **Short name**: `time_tracker` (no spaces, lowercase)
- **Title**: `Time Tracker`
- **Description**: `Quick time logging for work hours`
- **App URL**: `https://yourdomain.com/telegram`
- **Search text**: Leave empty or use `time tracking hours work`

BotFather will confirm with your app's short name.

## Step 4: Environment Configuration

Create or update your `.env` file:

```env
VITE_TELEGRAM_BOT_TOKEN=123456789:ABCDefGHIjklmnopqrsTUVwxyz
VITE_TELEGRAM_BOT_USERNAME=my_time_tracker_bot
VITE_APP_URL=https://yourdomain.com
VITE_TELEGRAM_APP_SHORT_NAME=time_tracker
```

## Step 5: Test the Bot

### Direct Test

1. In Telegram, search for your bot by username (@my_time_tracker_bot)
2. Send `/start`
3. Look for the "Time Tracker" button (or use menu)
4. Click to open the Mini App

### Using Bot Link

Users can also access via:
- `https://t.me/my_time_tracker_bot/time_tracker`
- `https://t.me/my_time_tracker_bot?start=app`

## Step 6: Backend Configuration

Your backend needs to handle these endpoints:

### 1. User Registration

**Endpoint**: `POST /api/telegram/users`

```json
Request:
{
  "telegramId": 123456789,
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "languageCode": "en"
}

Response:
{
  "success": true,
  "userId": "internal-user-id",
  "message": "User registered"
}
```

### 2. Data Synchronization

**Endpoint**: `POST /api/telegram/sync`

```json
Request:
{
  "userId": "123456789",
  "entries": [
    {
      "date": "2024-11-14",
      "hours": 8,
      "synced": "pending",
      "id": "entry-uuid"
    }
  ],
  "timestamp": "2024-11-14T10:30:00Z"
}

Response:
{
  "success": true,
  "message": "Data synchronized",
  "syncedAt": "2024-11-14T10:30:00Z",
  "entries": [...]
}
```

### 3. Add Hours

**Endpoint**: `POST /api/telegram/hours/{userId}`

```json
Request:
{
  "hours": 8,
  "date": "2024-11-14"
}

Response:
{
  "success": true,
  "message": "Hours added",
  "entry": {
    "id": "entry-uuid",
    "date": "2024-11-14",
    "hours": 8,
    "createdAt": "2024-11-14T10:30:00Z"
  }
}
```

### 4. Get Hours

**Endpoint**: `GET /api/telegram/hours/{userId}?month=2024-11`

```json
Response:
{
  "success": true,
  "entries": [
    {
      "date": "2024-11-14",
      "hours": 8,
      "id": "entry-uuid"
    }
  ],
  "total": 40,
  "month": "2024-11"
}
```

## Step 7: Security Best Practices

### Verify Telegram Data

Always verify the data from Telegram Web App:

```typescript
import crypto from 'crypto';

function verifyTelegramData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  params.delete('hash');
  params.sort();

  const dataCheckString = Array.from(params.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}
```

### Rate Limiting

Implement rate limiting on your backend:
- Max 10 sync requests per minute per user
- Max 50 data requests per hour per user

### Data Privacy

1. **HTTPS Only**: Always use HTTPS for your Mini App URL
2. **Encrypted Storage**: Encrypt sensitive data at rest
3. **Access Control**: Only show users their own data
4. **Audit Logging**: Log all API access

## Step 8: Monitor Bot Health

### Check Bot Status

In BotFather, send:

```
/mybots
```

Select your bot to see:
- Bot token
- Current settings
- App URL
- Menu button status

### Monitor Errors

Enable error logging in your backend for:
- Sync failures
- Invalid user data
- API timeouts
- Authentication failures

## Troubleshooting

### Bot doesn't appear in search

- Wait 5 minutes after creation
- Check username is unique
- Verify bot is not already in groups

### Mini App not loading

- Check URL is HTTPS (not HTTP)
- Verify domain is accessible from Telegram servers
- Check CORS headers on your server
- Test with `/myapps` in BotFather

### Data not syncing

- Verify backend endpoints are responding
- Check network requests in browser DevTools
- Ensure Telegram user ID matches backend records
- Check server logs for errors

### Bot token compromised

In BotFather:
```
/mybots
[Select bot]
/revoke
```

Then:
```
/newbot
```

to get a new token.

## Advanced Configuration

### Webhook Setup (Optional)

For real-time updates, configure a webhook:

```typescript
// Backend example (Node.js)
const express = require('express');
const app = express();

app.post('/telegram/webhook', (req, res) => {
  const update = req.body;

  if (update.message) {
    handleMessage(update.message);
  }

  res.json({ ok: true });
});
```

### Bot Analytics

Track:
- Daily active users
- Average hours logged
- Sync success rate
- Most used time durations

## Support Resources

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#botfather)

## Maintenance Checklist

- [ ] Monitor sync failure rate
- [ ] Review error logs weekly
- [ ] Update bot commands based on usage
- [ ] Keep backend updated
- [ ] Test mini app monthly
- [ ] Review security practices
- [ ] Update documentation
