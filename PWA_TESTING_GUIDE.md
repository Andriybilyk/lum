# 🧪 PWA Testing Guide

## 📱 PWA Installation Testing

### Desktop (Chrome/Edge)
1. Open the application in Chrome/Edge
2. Look for the install icon (⊕) in the address bar
3. Click to install as PWA
4. Verify the app opens in standalone window (no browser chrome)
5. Check that the app icon appears in the taskbar/dock

### Mobile (iOS Safari)
1. Open the application in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Verify the icon appears on home screen with correct name "Tracker"
5. Open from home screen - should launch in standalone mode
6. Check status bar color matches theme (blue)

### Mobile (Android Chrome)
1. Open the application in Chrome
2. Look for "Add to Home Screen" prompt or menu option
3. Install the PWA
4. Verify icon on home screen
5. Open from home screen - should launch in standalone mode

---

## 🌐 Offline Functionality Testing

### Test 1: Basic Offline Detection
1. Open the application while online
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Verify the offline indicator appears at the top
5. Should show: 🔴 "Немає інтернету"

### Test 2: Offline Data Entry
1. While offline, try to log hours:
   - Fill in the hours form
   - Submit the form
   - Should see: "Дані збережено локально і будуть синхронізовані пізніше"
2. Check offline indicator - should show queued count
3. Verify data in localStorage:
   ```javascript
   localStorage.getItem('offline-sync-queue')
   ```

### Test 3: Automatic Sync on Reconnection
1. While offline with queued data
2. Switch network throttling to "Online"
3. Should see:
   - 🔵 "Синхронізація..." with spinner
   - Then: 🟢 "Всі дані синхронізовані"
4. Verify data appears in Supabase dashboard
5. Offline queue should be empty

### Test 4: Failed Sync Retry
1. While offline, queue multiple actions
2. Simulate a server error (block Supabase API in DevTools)
3. Go online - sync should fail
4. Verify retry mechanism kicks in (check console logs)
5. Unblock API
6. Wait for retry (up to 5 seconds)
7. Should sync successfully

---

## 📱 Telegram Native Features Testing

### Test 1: Haptic Feedback
**Only works in Telegram Mini App**

1. Open app in Telegram
2. Click various buttons (submit, cancel, etc.)
3. Should feel vibration/haptic feedback
4. Try different actions to test different vibration styles:
   - Light tap: light vibration
   - Form submit: medium vibration
   - Success action: success notification vibration
   - Error: error notification vibration

### Test 2: Native Dialogs
**Only works in Telegram Mini App**

1. Trigger an alert (e.g., save data)
   - Should see Telegram's native alert (not browser alert)
2. Trigger a confirm dialog (e.g., delete action)
   - Should see Telegram's native confirm dialog
3. Verify dialogs have Telegram styling

### Test 3: QR Scanner
**Only works in Telegram Mini App**

1. Find a QR code trigger button (if implemented)
2. Click to open scanner
3. Should see Telegram's native QR scanner
4. Scan a QR code
5. Verify data is captured and used

### Test 4: Location Request
**Works in both Telegram and browser**

1. Trigger location request (if implemented)
2. In Telegram: should use Telegram's location API
3. In browser: should use HTML5 Geolocation API
4. Verify permission prompt appears
5. Grant permission and verify coordinates are captured

### Test 5: Contact Request
**Only works in Telegram Mini App**

1. Trigger contact request (if implemented)
2. Should see Telegram's contact sharing prompt
3. Share contact
4. Verify phone number and name are captured

---

## 🔄 Service Worker & Caching Testing

### Test 1: Initial Cache Population
1. Open DevTools → Application → Service Workers
2. Verify SW is registered and running
3. Go to Cache Storage
4. Should see multiple caches:
   - `workbox-precache-v2-...` (app files)
   - `supabase-api-cache` (API responses)
   - `images-cache` (images)
   - `telegram-api-cache` (Telegram API)

### Test 2: API Caching (NetworkFirst)
1. Load data from Supabase (e.g., hours list)
2. Check Network tab - should see API request
3. Check Cache Storage → supabase-api-cache
4. Verify response is cached
5. Go offline
6. Reload data
7. Should load from cache (check Network tab - from cache)

### Test 3: Image Caching (CacheFirst)
1. Load page with images
2. Check Network tab - images should load
3. Check Cache Storage → images-cache
4. Reload page
5. Images should load from cache instantly
6. Network tab should show "(from cache)"

### Test 4: Service Worker Update
1. Make a code change and rebuild
2. Deploy new version
3. Open app in existing tab
4. Should see console log about new SW waiting
5. Refresh page
6. New SW should activate
7. Verify old cache is cleaned up

---

## 📊 Performance Testing

### Test 1: Load Time
1. Clear cache and hard reload (Cmd/Ctrl + Shift + R)
2. Open DevTools → Network
3. Measure load time (should be < 3s)
4. Check which resources are largest
5. Verify code splitting is working (multiple chunks)

### Test 2: Offline Load Time
1. Visit app while online
2. Wait for full load and cache population
3. Go offline
4. Close and reopen app
5. Should load instantly from cache (< 1s)

### Test 3: Sync Performance
1. Queue 10+ actions while offline
2. Go online
3. Measure sync time
4. Should complete within 5-10 seconds
5. Check console for any errors

---

## 🎨 UI/UX Testing

### Test 1: Offline Indicator States
1. **Online + No Queue**: Indicator should be hidden
2. **Offline**: Show red indicator "Немає інтернету"
3. **Online + Queue**: Show yellow "N записів очікують синхронізації"
4. **Syncing**: Show blue with spinner "Синхронізація..."
5. **Sync Complete**: Show green briefly "Всі дані синхронізовані"

### Test 2: Button States During Offline
1. While offline, buttons should still work
2. Forms should accept input
3. Submit should queue data, not show error
4. User should get feedback that data is queued

### Test 3: Dark Mode (if implemented)
1. Switch to dark mode
2. Verify offline indicator colors work in dark mode
3. Check PWA icons (should work with dark/light themes)

---

## 🔍 Browser DevTools Debugging

### Service Worker
```javascript
// Check SW status
navigator.serviceWorker.getRegistrations()

// Force SW update
navigator.serviceWorker.getRegistrations().then(regs => regs[0].update())

// Unregister SW (for testing)
navigator.serviceWorker.getRegistrations().then(regs => regs[0].unregister())
```

### Offline Queue
```javascript
// Check queue contents
JSON.parse(localStorage.getItem('offline-sync-queue'))

// Clear queue manually
localStorage.removeItem('offline-sync-queue')
```

### Cache Inspection
```javascript
// List all caches
caches.keys()

// Open specific cache
caches.open('supabase-api-cache').then(cache => cache.keys())

// Clear all caches
caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
```

---

## ✅ Test Checklist

### PWA Features
- [ ] App installs on desktop
- [ ] App installs on iOS
- [ ] App installs on Android
- [ ] Standalone mode works (no browser chrome)
- [ ] Correct app name shows
- [ ] App icon displays correctly
- [ ] Theme color applied

### Offline Functionality
- [ ] Offline detection works
- [ ] Offline indicator shows correct state
- [ ] Data can be entered offline
- [ ] Offline queue persists across sessions
- [ ] Auto-sync on reconnection works
- [ ] Retry mechanism works for failed syncs
- [ ] Queue clears after successful sync

### Service Worker
- [ ] SW registers correctly
- [ ] Precaching works
- [ ] API responses cached (NetworkFirst)
- [ ] Images cached (CacheFirst)
- [ ] Cache expires correctly
- [ ] SW updates automatically

### Telegram Features
- [ ] Haptic feedback works in Telegram
- [ ] Native dialogs work in Telegram
- [ ] QR scanner works (if implemented)
- [ ] Location request works
- [ ] Contact request works (Telegram only)
- [ ] Browser fallbacks work outside Telegram

### Performance
- [ ] Initial load < 3 seconds
- [ ] Offline load < 1 second
- [ ] Sync completes in reasonable time
- [ ] No memory leaks
- [ ] No console errors

### Cross-browser Testing
- [ ] Chrome desktop
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Edge desktop
- [ ] Firefox (limited PWA support)
- [ ] Telegram WebView

---

## 🐛 Common Issues & Solutions

### Issue: PWA not installable
**Solution**:
- Check manifest.json is served correctly
- Verify HTTPS is enabled (required for PWA)
- Ensure icons are correct size and format

### Issue: Service Worker not registering
**Solution**:
- Check console for errors
- Verify SW file is at root level
- Clear browser cache and try again
- Check CSP headers allow SW

### Issue: Offline sync not working
**Solution**:
- Check console for errors
- Verify localStorage is not full
- Check network event listeners are attached
- Verify Supabase endpoints are correct

### Issue: Telegram features not working
**Solution**:
- Ensure app is opened in Telegram (not regular browser)
- Check @twa-dev/sdk is loaded correctly
- Verify WebApp.ready() is called
- Check for CSP restrictions

### Issue: Cache not updating
**Solution**:
- Force refresh (Cmd/Ctrl + Shift + R)
- Update SW version in vite.config.ts
- Clear all caches in DevTools
- Check workbox configuration

---

## 📱 Testing in Production

1. Deploy to production URL
2. Open in Telegram via bot
3. Test all features in real Telegram environment
4. Monitor error logs (Sentry, LogRocket, etc.)
5. Check analytics for PWA install rate
6. Monitor offline usage patterns
7. Check sync success/failure rates

---

**Last Updated**: 2024-12-05
**Version**: 1.0.0
