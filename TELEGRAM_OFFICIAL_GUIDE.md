# 📱 Офіційний гайд: Отримання Telegram ID в Mini App

Базовано на офіційній документації Telegram: https://core.telegram.org/bots/webapps

---

## 🎯 Як отримати Telegram ID користувача

### Крок 1: Додати Telegram WebApp SDK

В `index.html`, в секції `<head>`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

✅ **Ми маємо це!** Перевірте файл `/app/index.html`

---

### Крок 2: Ініціалізувати WebApp

Згідно документації, потрібно викликати `ready()` якомога раніше:

```javascript
// Після завантаження SDK
Telegram.WebApp.ready();
```

✅ **Ми робимо це!** Перевірте `/app/src/components/employee/EmployeeRegistration.tsx:50`

---

### Крок 3: Отримати User ID

Користувацькі дані доступні в `initDataUnsafe`:

```javascript
const userId = Telegram.WebApp.initDataUnsafe.user.id;
const firstName = Telegram.WebApp.initDataUnsafe.user.first_name;
const lastName = Telegram.WebApp.initDataUnsafe.user.last_name;
const username = Telegram.WebApp.initDataUnsafe.user.username;
```

✅ **Ми робимо це!** Перевірте `/app/src/components/employee/EmployeeRegistration.tsx:73`

---

## 📊 Структура даних WebAppUser

Згідно офіційної документації, `WebAppUser` об'єкт містить:

```typescript
interface WebAppUser {
  id: number;              // Унікальний ідентифікатор користувача
  is_bot?: boolean;        // True, якщо користувач є ботом
  first_name: string;      // Ім'я користувача
  last_name?: string;      // Прізвище (опційно)
  username?: string;       // Username (опційно)
  language_code?: string;  // IETF мовний тег (наприклад, "uk")
  is_premium?: boolean;    // True, якщо користувач має Telegram Premium
  photo_url?: string;      // URL фото профілю (опційно)
}
```

---

## ⚠️ Важливі застереження з документації

### 1. User ID може бути дуже великим числом

> "The user ID may have more than 32 significant bits, so use 64-bit integer or double-precision float for storage"

**Наше рішення:**
```typescript
const telegramId = user.id.toString(); // Зберігаємо як рядок
```

### 2. Не довіряйте initDataUnsafe на сервері

> "Data from this field should not be trusted. You should only use data from initData on the bot's server and only after it has been validated"

**Для клієнтської реєстрації (наш випадок):**
- `initDataUnsafe` підходить для UX (автозаповнення імені)
- Для критичних операцій потрібна валідація на сервері

---

## 🔍 Коли initDataUnsafe доступний?

Згідно документації:

### ✅ Доступний:
- Коли Mini App відкривається через Telegram Bot
- Посилання формату: `https://t.me/your_bot/app`
- Або через inline кнопку в чаті

### ❌ НЕ доступний:
- При прямому відкритті URL в браузері
- При відкритті через звичайне веб-посилання
- В режимі розробки (localhost)

---

## 🚀 Наш повний код згідно документації

### index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Облік Часу - Telegram Mini App</title>

    <!-- Telegram WebApp SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### EmployeeRegistration.tsx
```typescript
useEffect(() => {
  // Перевірка наявності Telegram WebApp
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;

    // 1. Ініціалізація (згідно документації)
    webApp.ready();

    // 2. Перевірка даних користувача
    if (webApp.initDataUnsafe?.user) {
      const user = webApp.initDataUnsafe.user;

      // 3. Отримання Telegram ID (як рядок для підтримки великих чисел)
      const telegramId = user.id.toString();
      const userName = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;

      // 4. Використання даних
      setTelegramId(telegramId);
      setFormData(prev => ({
        ...prev,
        name: userName
      }));
    }
  }
}, []);
```

---

## 📋 Чеклист згідно офіційної документації

- [x] SDK скрипт додано в `<head>` секцію
- [x] Виклик `Telegram.WebApp.ready()` при ініціалізації
- [x] Отримання user ID з `initDataUnsafe.user.id`
- [x] Конвертація ID в string для підтримки великих чисел
- [x] Використання `first_name` та `last_name` для автозаповнення
- [x] Перевірка наявності `window.Telegram.WebApp` перед використанням
- [x] Обробка випадку коли дані недоступні (не в Telegram)

---

## 🎓 Додаткова інформація з документації

### initData vs initDataUnsafe

Згідно документації є два поля:

1. **`initData`** (string) - Raw дані, підписані Telegram
   - Використовується для валідації на сервері
   - Формат: `user=...&auth_date=...&hash=...`
   - Можна перевірити підпис через bot token

2. **`initDataUnsafe`** (object) - Розпарсені дані
   - Зручно для клієнтського коду
   - **НЕ безпечно для критичних операцій на сервері**
   - Ідеально для UX (автозаповнення форм)

### Наш випадок використання:

Ми використовуємо `initDataUnsafe` для:
- ✅ Автоматичного заповнення імені користувача
- ✅ Отримання Telegram ID для зручності реєстрації
- ✅ Створення seamless UX без ручного введення

Для посиленої безпеки можна додати серверну валідацію `initData`.

---

## 🔗 Корисні посилання

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [WebApp API Reference](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- [Validating Data](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)

---

## ✅ Висновок

**Наш код повністю відповідає офіційній документації Telegram!**

1. ✅ SDK додано правильно
2. ✅ `ready()` викликається
3. ✅ User ID отримується з `initDataUnsafe.user.id`
4. ✅ ID зберігається як string (для підтримки 64-bit)
5. ✅ Ім'я автоматично заповнюється

**Коли додаток відкривається через Telegram Bot, реальний Telegram ID буде захоплений!** 🎯
