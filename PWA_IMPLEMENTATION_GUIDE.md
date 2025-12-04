# 📱 PWA Implementation Guide

## ✅ Що реалізовано

### 1. PWA Configuration

#### Vite PWA Plugin (`vite.config.ts`)
```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Time Tracker - Облік робочого часу',
    short_name: 'Tracker',
    description: 'Облік робочого часу, процесів та матеріалів',
    theme_color: '#ffffff',
    display: 'standalone',
    icons: [...]
  },
  workbox: {
    runtimeCaching: [
      // Supabase API - NetworkFirst
      // Telegram API - NetworkFirst
      // Images - CacheFirst
    ]
  }
})
```

**Стратегії кешування:**
- **NetworkFirst** - для API (Supabase, Telegram) - спочатку мережа, потім кеш
- **CacheFirst** - для зображень - спочатку кеш, потім мережа

---

### 2. Offline Sync (`useOfflineSync` hook)

#### Можливості:
- ✅ Автоматичне виявлення offline/online
- ✅ Черга для несинхронізованих дій
- ✅ Автоматична синхронізація при відновленні з'єднання
- ✅ Retry механізм (до 3 спроб)
- ✅ Збереження черги в localStorage

#### Підтримувані операції:
```typescript
type QueuedAction = {
  type: 'hours' | 'process' | 'material' | 'photo' | 'assignment' | 'additional_work';
  action: 'create' | 'update' | 'delete';
  data: any;
}
```

#### Використання:
```typescript
const { isOnline, queueSize, addToQueue, syncQueue } = useOfflineSync();

// Додати дію в чергу (якщо офлайн)
if (!isOnline) {
  addToQueue({
    type: 'hours',
    action: 'create',
    data: newHoursData
  });
}
```

---

### 3. Offline Indicator UI

#### `OfflineIndicator` компонент
Показує статус з'єднання і кількість несинхронізованих записів:

- 🔴 **Офлайн** - "Немає інтернету, дані зберігаються локально"
- 🟡 **Є несинхронізовані дані** - "N записів очікують синхронізації"
- 🔵 **Синхронізація...** - анімація
- 🟢 **З'єднання відновлено** - "Всі дані синхронізовані"

#### Використання:
```tsx
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

function App() {
  return (
    <>
      <OfflineIndicator />
      {/* Інший контент */}
    </>
  );
}
```

---

### 4. Telegram Native Features (`useTelegramFeatures` hook)

#### Haptic Feedback
```typescript
const { vibrate, notificationFeedback } = useTelegramFeatures();

// Легка вібрація при натисканні
vibrate('light');

// Вібрація для успіху/помилки
notificationFeedback('success');
notificationFeedback('error');
```

#### Dialogs
```typescript
const { showPopup, showAlert, showConfirm } = useTelegramFeatures();

// Показати popup
const result = await showPopup({
  title: 'Підтвердження',
  message: 'Ви впевнені?',
  buttons: [
    { id: 'yes', type: 'default', text: 'Так' },
    { id: 'no', type: 'cancel', text: 'Ні' }
  ]
});

// Показати alert
await showAlert('Дані збережено!');

// Показати confirm
const confirmed = await showConfirm('Видалити запис?');
```

#### QR Scanner
```typescript
const { scanQR } = useTelegramFeatures();

// Відкрити QR сканер
const qrData = await scanQR('Скануйте QR код об\'єкту');
if (qrData) {
  // Обробити дані з QR коду
  console.log('QR data:', qrData);
}
```

#### Request Permissions
```typescript
const { requestContact, requestLocation } = useTelegramFeatures();

// Запит контакту
const contact = await requestContact();
if (contact) {
  console.log('Phone:', contact.phone_number);
  console.log('Name:', contact.first_name);
}

// Запит локації
const location = await requestLocation();
if (location) {
  console.log('Lat:', location.latitude);
  console.log('Lon:', location.longitude);
}
```

#### UI Controls
```typescript
const {
  showBackButton,
  hideBackButton,
  showMainButton,
  hideMainButton
} = useTelegramFeatures();

// Показати кнопку "Назад"
showBackButton(() => {
  navigate(-1);
});

// Показати головну кнопку
showMainButton({
  text: 'Зберегти',
  color: '#3b82f6',
  onClick: handleSave
});
```

---

## 🎯 Приклади використання

### Приклад 1: Логування годин з offline support

```typescript
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useTelegramFeatures } from '@/hooks/useTelegramFeatures';

function LogHoursModal() {
  const { isOnline, addToQueue } = useOfflineSync();
  const { vibrate, notificationFeedback, showAlert } = useTelegramFeatures();

  const handleSubmit = async (data: HoursData) => {
    try {
      // Haptic feedback при натисканні
      vibrate('medium');

      if (isOnline) {
        // Онлайн - зберігти відразу
        await supabaseService.createHours(data);
        notificationFeedback('success');
        await showAlert('Години збережено!');
      } else {
        // Офлайн - додати в чергу
        addToQueue({
          type: 'hours',
          action: 'create',
          data
        });
        notificationFeedback('warning');
        await showAlert('Дані збережено локально і будуть синхронізовані пізніше');
      }
    } catch (error) {
      notificationFeedback('error');
      await showAlert('Помилка збереження даних');
    }
  };

  return (
    // ... форма
  );
}
```

### Приклад 2: QR код для швидкого вибору об'єкту

```typescript
import { useTelegramFeatures } from '@/hooks/useTelegramFeatures';

function ObjectSelector() {
  const { scanQR, vibrate } = useTelegramFeatures();
  const [selectedObject, setSelectedObject] = useState<string>('');

  const handleQRScan = async () => {
    vibrate('light');
    const qrData = await scanQR('Скануйте QR код об\'єкту');

    if (qrData) {
      // Припустимо, QR код містить ID об'єкту
      const objectId = parseQRData(qrData);
      setSelectedObject(objectId);
      vibrate('success');
    }
  };

  return (
    <div>
      <Button onClick={handleQRScan}>
        📷 Сканувати QR код
      </Button>
      {selectedObject && (
        <div>Вибрано об'єкт: {selectedObject}</div>
      )}
    </div>
  );
}
```

### Приклад 3: Геолокація для логування годин

```typescript
import { useTelegramFeatures } from '@/hooks/useTelegramFeatures';

function LogHoursWithLocation() {
  const { requestLocation, showAlert } = useTelegramFeatures();

  const handleLogWithLocation = async () => {
    const location = await requestLocation();

    if (location) {
      // Перевірити, чи користувач на об'єкті
      const isOnSite = checkIfOnSite(location.latitude, location.longitude);

      if (isOnSite) {
        // Дозволити логування
        await logHours({ ...data, location });
      } else {
        await showAlert('Ви не знаходитесь на об\'єкті');
      }
    }
  };

  return (
    // ... форма з кнопкою для логування з геолокацією
  );
}
```

---

## 📋 Чеклист інтеграції

### Для використання offline sync:

- [ ] Імпортувати `useOfflineSync` hook
- [ ] Перевіряти `isOnline` перед операціями
- [ ] Використовувати `addToQueue` для офлайн операцій
- [ ] Додати `OfflineIndicator` в layout
- [ ] Тестувати в режимі offline (DevTools → Network → Offline)

### Для використання Telegram features:

- [ ] Імпортувати `useTelegramFeatures` hook
- [ ] Додати haptic feedback для кнопок (vibrate)
- [ ] Використовувати нативні dialogs замість alert/confirm
- [ ] Додати QR сканер для швидкого вибору об'єктів
- [ ] Використовувати MainButton для головних дій

---

## 🚀 Наступні кроки

### Рекомендовані покращення:

1. **Push Notifications**
   ```typescript
   // Запит дозволу на notifications
   const permission = await Notification.requestPermission();

   // Показати notification
   new Notification('Нагадування', {
     body: 'Не забудьте залогувати години за сьогодні!',
     icon: '/pwa-192x192.png'
   });
   ```

2. **Background Sync API**
   ```typescript
   // Реєстрація background sync
   if ('serviceWorker' in navigator && 'SyncManager' in window) {
     const registration = await navigator.serviceWorker.ready;
     await registration.sync.register('sync-queued-data');
   }
   ```

3. **Periodic Background Sync**
   ```typescript
   // Періодична синхронізація (кожні 12 годин)
   if ('periodicSync' in registration) {
     await registration.periodicSync.register('periodic-sync', {
       minInterval: 12 * 60 * 60 * 1000 // 12 годин
     });
   }
   ```

4. **IndexedDB для великих даних**
   ```typescript
   // Використовувати IndexedDB замість localStorage
   import { openDB } from 'idb';

   const db = await openDB('time-tracker', 1, {
     upgrade(db) {
       db.createObjectStore('offline-queue');
       db.createObjectStore('cached-data');
     }
   });
   ```

---

## 🧪 Тестування

### Тестування offline режиму:

1. **Chrome DevTools:**
   - Відкрити DevTools (F12)
   - Network tab → Throttling → Offline
   - Спробувати залогувати години
   - Перевірити, що дані в черзі
   - Повернути Online
   - Перевірити автосинхронізацію

2. **Реальний offline:**
   - Вимкнути WiFi / мобільний інтернет
   - Відкрити додаток
   - Залогувати години
   - Увімкнути інтернет
   - Перевірити синхронізацію

### Тестування PWA install:

1. **Desktop:**
   - Chrome → Адресна строка → Іконка install
   - Встановити PWA
   - Перевірити, що відкривається як окремий додаток

2. **Mobile:**
   - Safari/Chrome → Share → Add to Home Screen
   - Перевірити іконку на домашньому екрані
   - Відкрити як standalone app

### Тестування Telegram features:

1. **В Telegram:**
   - Відкрити через Telegram bot
   - Натиснути кнопку → перевірити haptic
   - Спробувати QR сканер
   - Перевірити нативні dialogs

2. **В браузері:**
   - Перевірити fallback на browser API
   - alert/confirm замість Telegram dialogs
   - geolocation API замість Telegram location

---

## 📦 Пакети

```json
{
  "dependencies": {
    "@twa-dev/sdk": "^8.0.2",
    "workbox-window": "^7.4.0"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^1.2.0"
  }
}
```

---

## 🎨 PWA Icons

### Потрібні іконки:

- `public/pwa-192x192.png` - 192x192px
- `public/pwa-512x512.png` - 512x512px
- `public/apple-touch-icon.png` - 180x180px
- `public/favicon.ico` - 32x32px

### Генерація іконок:

Можна використовувати онлайн сервіси:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Або створити вручну з логотипу додатку.

---

**Дата:** 2024-12-04
**Версія:** 1.0.0
**Статус:** ✅ Готово до використання
