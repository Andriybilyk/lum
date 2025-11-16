# Telegram Mini App Configuration

Детальні інструкції для налаштування додатку як Telegram Mini App.

## Посилання для доступу

### Основний додаток (повна функціональність)
```
https://yourdomain.com/telegram
```
- Повний функціонал (статус, звіти, налаштування)
- Навігація внизу екрану
- Реєстрація користувачів
- Темна тема

### Швидкий логер (лише логування годин)
```
https://yourdomain.com/telegram/quick
```
- Швидкий додавання часу (+0.5h, +1h, +4h, +8h)
- Офлайн-синхронізація
- Мінімальний інтерфейс

---

## Крок 1: Налаштування BotFather

### Стандартні команди

В BotFather виконайте:

```
/setcommands
[Select your bot]
```

Приклад команд:
```
start - Запустити додаток
help - Отримати допомогу
hours - Переглянути мої години
sync - Синхронізувати дані
logout - Видалити мої дані
```

### Налаштування кнопки меню

В BotFather:
```
/setmenubutton
[Select your bot]
Type: Web App
Button text: Time Tracker
App URL: https://yourdomain.com/telegram
```

### Реєстрація додатку

В BotFather:
```
/newapp
[Select your bot]
```

Заповніть:
- **Short Name**: `time_tracker_main` (тільки латиниця і підкреслення)
- **Title**: Time Tracker
- **Description**: Логування робочих годин прямо у Telegram
- **App URL**: `https://yourdomain.com/telegram`

BotFather відповість з кодом додатку.

---

## Крок 2: Конфігурація Telegram SDK

SDK вже інтегрований у `/src/pages/TelegramApp.tsx` та `/src/pages/TelegramMiniApp.tsx`.

### Автоматична ініціалізація

При запуску додатку в Telegram:

```typescript
// Автоматично запускає:
- app.expand() - розширити на весь екран
- app.ready() - сповістити про готовність
- Отримує користувача: window.Telegram.WebApp.instance.initDataUnsafe.user
```

### Функції Telegram API

Доступні функції в контексті:

```typescript
// Розширення на весь екран
app.expand()

// Показати кнопку "Назад"
app.BackButton?.show()
app.BackButton?.onClick(() => { /* ... */ })

// Закрити додаток
app.close()

// Основна кнопка
app.MainButton?.text = "Save"
app.MainButton?.show()
app.MainButton?.onClick(() => { /* ... */ })
```

---

## Крок 3: Середовищні змінні

Додайте в `.env`:

```env
# Telegram Bot Configuration
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=https://yourdomain.com
VITE_TELEGRAM_APP_SHORT_NAME=time_tracker_main

# For development
VITE_TELEGRAM_DEV_MODE=false
```

---

## Крок 4: Теми та стилізація

### Автоматична адаптація до теми користувача

Додаток автоматично адаптується до теми Telegram:

```typescript
// Отримати тему користувача
const isDarkMode = window.Telegram?.WebApp?.instance?.colorScheme === 'dark'

// У CSS використовується dark: префікс
<div className="bg-white dark:bg-slate-900">
```

---

## Крок 5: Безпека

### Верифікація користувача

Всі дані приходять через `initDataUnsafe`:

```typescript
interface TelegramUser {
  id: number                    // Унікальний ID користувача
  is_bot: boolean              // Чи користувач - бот
  first_name: string           // Ім'я
  last_name?: string           // Прізвище (опціонально)
  username?: string            // Username (опціонально)
  language_code?: string       // Мова користувача
  is_premium?: boolean         // Чи преміум користувач
}
```

### Зберігання даних

- Дані користувача зберігаються в контексті
- localStorage для офлайн синхронізації
- Всі операції мають логування

---

## Крок 6: Тестування

### Локальний розвиток

```bash
npm run dev
# Доступ: http://localhost:5173/telegram
```

### Тестування у Telegram

#### Через посилання:
```
https://t.me/your_bot_username/time_tracker_main
```

#### Через кнопку меню:
1. Відкрити бота у Telegram
2. Клікнути на кнопку "Time Tracker"

#### За допомогою Telegram Bot Testing:
- Інформація: https://core.telegram.org/bots/testing

---

## Архітектура

### Структура маршрутів

```
/                      - Welcome Screen
├── /employee          - Employee Dashboard (web)
├── /manager           - Manager Dashboard (web)
├── /telegram          - Full Telegram App
│   ├── Registration   - Реєстрація (якщо потрібна)
│   ├── Stats          - Статус з графіками
│   ├── Reports        - Детальні звіти
│   └── Settings       - Налаштування
└── /telegram/quick    - Quick Time Logger
    ├── Quick Add      - Швидкі кнопки (+0.5h, +1h, +4h, +8h)
    ├── Progress       - Прогрес за місяць
    ├── Sync Button    - Ручна синхронізація
    └── Recent         - Останні записи
```

### Шари додатку

```
TelegramApp.tsx
├── User Authentication (TelegramUser)
├── Navigation (4 tabs)
│   ├── Dashboard (Stats)
│   ├── Reports
│   ├── Settings
│   └── Logout
└── EmployeeStats / EmployeeReports / Settings components

TelegramMiniApp.tsx
├── Quick Actions (+hours buttons)
├── Month Progress
├── Recent Entries
└── Sync Management
```

---

## Функціональність

### Основний додаток (/telegram)

#### 1. Статус (Dashboard)
- Загальні години за місяць
- Прогрес до цільки (160 годин)
- Графіки та статистика
- Останні записи

#### 2. Звіти (Reports)
- Детальні звіти по днях/тижнях/місяцях
- Аналіз по типам робіт
- Статистика по проектах
- Експорт (PDF, Excel, CSV)

#### 3. Налаштування (Settings)
- Профіль користувача
- Налаштування сповіщень
- Оцінки та рейтинги
- Видалення аккаунту

#### 4. Вихід (Logout)
- Закриття додатку в Telegram

### Швидкий логер (/telegram/quick)

#### Основні функції
- **+30 хв** - 0.5 години
- **+1h** - 1 година
- **+4h** - Половина дня
- **+8h** - Повний робочий день

#### Офлайн-синхронізація
- Автоматична синхронізація кожні 30 сек
- Можливість ручної синхронізації
- Статус кожного запису (Synced/Pending/Error)
- Кешування на клієнті

---

## Доступні endpointy API

### Для синхронізації часу

**POST /api/telegram/sync**
```json
{
  "userId": "123456789",
  "entries": [
    {
      "date": "2024-11-14",
      "hours": 8,
      "synced": "pending"
    }
  ]
}
```

**POST /api/telegram/hours/{userId}**
```json
{
  "hours": 4,
  "date": "2024-11-14"
}
```

**GET /api/telegram/hours/{userId}?month=2024-11**
```json
{
  "entries": [...],
  "total": 40,
  "month": "2024-11"
}
```

---

## Налагодження

### Включення режиму розробника

```typescript
// У TelegramApp.tsx
const DEBUG = true;  // Включити логування

if (DEBUG) {
  console.log('Telegram User:', telegramUser);
  console.log('Init Data:', window.Telegram?.WebApp?.instance?.initDataUnsafe);
}
```

### Перевірка підключення

```javascript
// У браузерній консолі
window.Telegram?.WebApp?.instance?.initDataUnsafe?.user
```

### Логування подій

```typescript
// Всі подій записуються у localStorage
localStorage.getItem('telegram_user_id')
localStorage.getItem('telegram_user_name')
```

---

## Типові проблеми

### Проблема: Mini App не завантажується
**Рішення:**
- Перевірити HTTPS (обов'язково!)
- Перевірити URL у BotFather
- Перевірити консоль браузера на помилки
- Очистити кеш браузера

### Проблема: Користувач не визначається
**Рішення:**
- Перевірити `initDataUnsafe`
- Переконатися, що відкрито в Telegram WebView
- Перевірити, чи дані приходять правильно

### Проблема: Офлайн синхронізація не працює
**Рішення:**
- Перевірити localStorage квоту
- Перевірити бекенд endpoint
- Переконатися, що backend повертає 200 OK

---

## Моніторинг

### Метрики для відстеження

1. **Користувачі**
   - Кількість активних користувачів
   - Нові користувачі на день
   - Утримання (retention)

2. **Синхронізація**
   - Success rate (%)
   - Середній час синхронізації (ms)
   - Помилки синхронізації

3. **Перформанс**
   - Середній час завантаження
   - Помилки на клієнті
   - Utilization (uso localStorage)

### Google Analytics інтеграція

```typescript
// Можна додати простий tracking
gtag('event', 'telegram_app_opened', {
  user_id: telegramUser?.id,
  username: telegramUser?.username
});
```

---

## Майбутні поліпшення

- [ ] Push-сповіщення для синхронізації
- [ ] Офлайн режим з більш розширеними можливостями
- [ ] Telegram Payments для преміум функцій
- [ ] Голосові команди
- [ ] Фото/доказ роботи
- [ ] Інші мови підтримки

---

## Посилання

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [BotFather Documentation](https://core.telegram.org/bots#botfather)
- [Mini App Design Guide](https://core.telegram.org/bots/webapps#recommendations)

---

## Контакти підтримки

Для проблем та питань:
1. Перевірте документацію: TELEGRAM_MINIAPP_GUIDE.md
2. Перевірте логи браузера (F12)
3. Перевірте логи сервера
4. Зв'яжіться з командою розробки
