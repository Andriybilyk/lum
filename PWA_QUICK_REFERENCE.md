# 🚀 PWA Quick Reference Card

Quick reference for using PWA and Telegram features in the Time Tracker application.

---

## 📱 Offline Sync

```typescript
import { useOfflineSync } from '@/hooks/useOfflineSync';

const {
  isOnline,      // boolean - current connection status
  queue,         // QueuedAction[] - pending actions
  queueSize,     // number - count of pending actions
  isSyncing,     // boolean - currently syncing
  addToQueue,    // function - add action to queue
  syncQueue,     // function - manually trigger sync
  clearQueue     // function - clear all queued actions
} = useOfflineSync();

// Add action when offline
addToQueue({
  type: 'hours',  // 'hours' | 'process' | 'material' | 'photo' | 'assignment' | 'additional_work'
  action: 'create', // 'create' | 'update' | 'delete'
  data: { /* your data */ }
});
```

---

## 🎯 Telegram Features

```typescript
import { useTelegramFeatures } from '@/hooks/useTelegramFeatures';

const telegram = useTelegramFeatures();

// Haptic feedback
telegram.vibrate('light');   // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
telegram.notificationFeedback('success'); // 'success' | 'warning' | 'error'

// Dialogs
await telegram.showAlert('Message');
const confirmed = await telegram.showConfirm('Are you sure?');
const result = await telegram.showPopup({
  title: 'Title',
  message: 'Message',
  buttons: [
    { id: 'ok', type: 'default', text: 'OK' },
    { id: 'cancel', type: 'cancel', text: 'Cancel' }
  ]
});

// QR Scanner (Telegram only)
const qrData = await telegram.scanQR('Scan QR code');
telegram.closeScanQR();

// Location & Contact (Telegram only)
const location = await telegram.requestLocation();
// { latitude: number, longitude: number }

const contact = await telegram.requestContact();
// { phone_number: string, first_name: string, last_name?: string, user_id?: number }

// UI Controls
telegram.showBackButton(() => navigate(-1));
telegram.hideBackButton();

telegram.showMainButton({
  text: 'Save',
  color: '#3b82f6',
  textColor: '#ffffff',
  isActive: true,
  onClick: handleSave
});
telegram.hideMainButton();

// Navigation
telegram.openLink('https://example.com');
telegram.openTelegramLink('https://t.me/username');
telegram.close(); // Close mini app

// Direct WebApp access
telegram.WebApp.ready();
telegram.WebApp.expand();
```

---

## 🎨 Offline Indicator

```typescript
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

// Add to layout
<OfflineIndicator />

// States:
// 🔴 Offline - "Немає інтернету"
// 🟡 Has queue - "N записів очікують синхронізації"
// 🔵 Syncing - "Синхронізація..." (animated)
// 🟢 Online & synced - Hidden
```

---

## 💾 Service Worker

```typescript
// Check SW status
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    console.log('SW ready:', reg);
  });
}

// Force update SW
const regs = await navigator.serviceWorker.getRegistrations();
regs[0]?.update();

// Unregister SW (testing only)
const regs = await navigator.serviceWorker.getRegistrations();
regs[0]?.unregister();
```

---

## 🗄️ Cache Management

```typescript
// List all caches
const keys = await caches.keys();
console.log('Caches:', keys);

// Open specific cache
const cache = await caches.open('supabase-api-cache');
const requests = await cache.keys();
console.log('Cached requests:', requests);

// Clear all caches
const keys = await caches.keys();
await Promise.all(keys.map(key => caches.delete(key)));

// Clear specific cache
await caches.delete('images-cache');
```

---

## 📦 localStorage Queue

```typescript
// Check offline queue
const queue = localStorage.getItem('offline-sync-queue');
console.log('Queue:', JSON.parse(queue || '[]'));

// Clear queue manually
localStorage.removeItem('offline-sync-queue');

// Monitor queue changes
window.addEventListener('storage', (e) => {
  if (e.key === 'offline-sync-queue') {
    console.log('Queue changed:', e.newValue);
  }
});
```

---

## 🔍 Debugging

### DevTools Console

```typescript
// Check connection status
console.log('Online:', navigator.onLine);

// Listen for connection changes
window.addEventListener('online', () => console.log('Connected'));
window.addEventListener('offline', () => console.log('Disconnected'));

// Check Telegram WebApp
console.log('Telegram:', window.Telegram?.WebApp);
console.log('User:', window.Telegram?.WebApp?.initDataUnsafe?.user);

// Check PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA installable', e);
});

window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
});
```

### Network Tab

- Throttling: Online/Offline/Slow 3G
- Filter: All/XHR/JS/CSS/Img/Media
- Check cache: "(from cache)" or "(from service worker)"

### Application Tab

- **Manifest**: Check PWA manifest
- **Service Workers**: Check SW status, update, unregister
- **Cache Storage**: Inspect cached resources
- **Local Storage**: Check offline queue
- **IndexedDB**: (not used currently)

---

## 🧪 Common Patterns

### Pattern 1: Save with Offline Support

```typescript
const { isOnline, addToQueue } = useOfflineSync();
const { vibrate, notificationFeedback, showAlert } = useTelegramFeatures();

const handleSave = async (data) => {
  vibrate('medium');

  try {
    if (isOnline) {
      await api.create(data);
      notificationFeedback('success');
      await showAlert('Збережено!');
    } else {
      addToQueue({ type: 'hours', action: 'create', data });
      notificationFeedback('warning');
      await showAlert('Збережено локально');
    }
  } catch (error) {
    notificationFeedback('error');
    await showAlert('Помилка збереження');
  }
};
```

### Pattern 2: QR Code Object Selection

```typescript
const { scanQR, vibrate } = useTelegramFeatures();

const handleScanQR = async () => {
  vibrate('light');
  const qrData = await scanQR('Scan object QR');

  if (qrData) {
    const objectId = extractObjectId(qrData);
    setSelectedObject(objectId);
    vibrate('success');
  }
};
```

### Pattern 3: Location-based Hours Logging

```typescript
const { requestLocation, showAlert } = useTelegramFeatures();

const handleLogWithLocation = async (data) => {
  const location = await requestLocation();

  if (!location) {
    await showAlert('Локація недоступна');
    return;
  }

  if (isOnSite(location)) {
    await logHours({ ...data, location });
  } else {
    await showAlert('Ви не на об\'єкті');
  }
};
```

### Pattern 4: Confirm Delete with Native Dialog

```typescript
const { showConfirm, notificationFeedback } = useTelegramFeatures();

const handleDelete = async (id) => {
  const confirmed = await showConfirm('Видалити запис?');

  if (confirmed) {
    await api.delete(id);
    notificationFeedback('success');
  }
};
```

---

## 📁 File Locations

```
/app
├── vite.config.ts                    # PWA configuration
├── index.html                        # PWA meta tags
├── public/
│   ├── icon.svg                      # Source icon
│   ├── pwa-192x192.png               # PWA icon
│   ├── pwa-512x512.png               # PWA icon
│   ├── apple-touch-icon.png          # iOS icon
│   ├── favicon.ico                   # Favicon
│   └── robots.txt                    # SEO
├── src/
│   ├── hooks/
│   │   ├── useOfflineSync.ts         # Offline sync logic
│   │   └── useTelegramFeatures.ts    # Telegram features
│   └── components/
│       └── common/
│           └── OfflineIndicator.tsx  # Offline UI
└── dist/                             # Build output
    ├── sw.js                         # Service Worker
    ├── manifest.webmanifest          # PWA manifest
    └── workbox-*.js                  # Workbox runtime
```

---

## 🔗 Quick Links

- **Implementation Guide**: `/app/PWA_IMPLEMENTATION_GUIDE.md`
- **Testing Guide**: `/app/PWA_TESTING_GUIDE.md`
- **Status Report**: `/app/PWA_STATUS_REPORT.md`

---

## 💡 Tips

1. **Always check `isOnline`** before making API calls
2. **Use haptic feedback** for better UX in Telegram
3. **Provide fallbacks** for browser (non-Telegram) usage
4. **Test offline scenarios** during development
5. **Monitor queue size** to avoid localStorage limits
6. **Clear caches** when debugging cache issues
7. **Force SW update** when deploying new versions

---

**Version**: 1.0.0
**Last Updated**: 2024-12-05
