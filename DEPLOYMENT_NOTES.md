# 📋 Deployment Notes - Telegram ID Implementation

## 🎯 Фінальний статус

**Telegram ID захоплюється коректно!** ✅

URL який ви надали показує:
```
user.id: 461103647          ← РЕАЛЬНИЙ Telegram ID!
first_name: "Андрій"
last_name: "Білик"
username: "belik_and"
```

---

## 🔧 Технічні виправлення зроблені

### 1. Додано Telegram WebApp SDK (index.html)
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2. Оновлено Content-Security-Policy (vercel.json)

**Було:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

**Стало:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:
```

Це дозволяє завантажувати Telegram SDK з HTTPS.

### 3. Додано детальне логування (EmployeeRegistration.tsx)

Користувач бачить в консолі:
```
✅ WebApp object found
✅ WebApp.ready() called
✅ REAL Telegram ID captured: 461103647
✅ Telegram user name: Андрій Білик
```

---

## 🚀 Як це працює

### Послідовність операцій:

```
1. Користувач відкриває міні-ап в Telegram
   ↓
2. Telegram передає дані в URL fragment:
   #tgWebAppData=query_id=...&user={id:461103647,...}
   ↓
3. Telegram WebApp SDK парсить URL
   ↓
4. SDK створює window.Telegram.WebApp.initDataUnsafe
   ↓
5. Наш код читає: webApp.initDataUnsafe.user.id
   ↓
6. telegramId = "461103647"
   ↓
7. При реєстрації зберігається в Google Sheets колонка A
```

---

## 🔍 Діагностика (якщо CSP помилка з'являється)

### Симптом:
```
Loading the script 'https://telegram.org/js/telegram-web-app.js'
violates the following Content Security Policy directive
```

### Рішення:

1. **Перевірте vercel.json:**
```bash
cat vercel.json | grep "script-src"
```

Повинно бути:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:
```

2. **Перевірте deployed headers:**
```bash
curl -I https://lum-two.vercel.app/
```

Повинен показувати:
```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; ...
```

3. **Якщо хедер старий:**
   - Vercel кешує дані
   - Зробіть redeploy:
     ```bash
     git push origin main
     # або змініть версію в vercel.json (CACHE_BUST)
     ```

---

## 📊 Структура даних при реєстрації

### Дані які Telegram передає:

```javascript
window.Telegram.WebApp.initDataUnsafe = {
  user: {
    id: 461103647,
    first_name: "Андрій",
    last_name: "Білик",
    username: "belik_and",
    language_code: "uk",
    is_premium: false,
    photo_url: "https://t.me/i/userpic/..."
  },
  query_id: "AAEf4nsbAAAAAB_iexuCFgw5",
  auth_date: 1763420976,
  hash: "8e12ab5cffae6a4c1fa078da56dced60fc322816d63280d7fd71c0c65251a143"
}
```

### Що наш код робить:

```typescript
const telegramId = webApp.initDataUnsafe.user.id.toString();
// → "461103647"

const userName = `${user.first_name} ${user.last_name}`;
// → "Андрій Білик"

// Записує в Google Sheets:
// Колонка A (ID): 461103647
// Колонка B (Name): Андрій Білик
// Колонка C (Role): employee
// ...
```

---

## ✅ Чеклист для перевірки

- [x] index.html містить Telegram SDK скрипт
- [x] vercel.json дозволяє HTTPS скрипти в CSP
- [x] EmployeeRegistration.tsx читає user.id
- [x] Логування показує реальний ID
- [x] Google Apps Script готовий до запису
- [x] Google Sheets таблиця структурована

---

## 🔐 Безпека

### Що Telegram передає:

1. **initData** (raw string) - підписана дані
2. **hash** - HMAC підпис для валідації на сервері
3. **auth_date** - час авторизації

### Наш підхід:

- ✅ Використовуємо `initDataUnsafe` для UX (быстро)
- ✅ Дозволяємо автозаповнення імені і ID
- ℹ️ Для критичних операцій (API) рекомендується валідація `initData` на сервері

### Валідація на сервері (додатково):

Якщо потрібна більша безпека, можна додати на серверній стороні:

```python
# Приклад для валідації initData
import hmac
import hashlib

bot_token = "YOUR_BOT_TOKEN"
init_data = "query_id=...&user=...&auth_date=...&hash=..."

# Обчислити очікуваний хеш
data_check_string = "\n".join([f"{k}={v}" for k, v in sorted_params.items()])
secret_key = hashlib.sha256(bot_token.encode()).digest()
computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

# Перевірити чи хеш збігається
if computed_hash == received_hash:
    print("✅ Дані підтверджені від Telegram")
else:
    print("❌ Дані не від Telegram!")
```

---

## 📱 Користувацький потік

### При першому відкритті:

1. Користувач натискає "Відкрити Mini App" в Telegram
2. Додаток завантажується
3. Telegram передає user ID в URL
4. SDK парсить дані
5. Форма автозаповнюється:
   - Name: "Андрій Білик" (з Telegram)
   - Роль: Користувач вибирає
6. Натискає "Реєстрація"
7. Данні зберігаються в Google Sheets

### При повторному відкритті (авто-логін):

1. Користувач натискає Mini App в Telegram
2. Додаток завантажується
3. WelcomeScreen отримує telegramId з WebApp
4. Шукає користувача в Google Sheets за ID
5. Знайшов → автоматично логіниться
6. Не знайшов → показує форму реєстрації

---

## 🔗 Посилання на рішення

| Компонент | Файл | Зміни |
|-----------|------|-------|
| HTML | `/app/index.html` | Додано Telegram SDK скрипт |
| Верхні рівні | `/app/vercel.json` | CSP дозволяє https: blob: |
| Реєстрація | `/app/src/components/employee/EmployeeRegistration.tsx` | Логування + читання user.id |
| Вхід | `/app/src/pages/WelcomeScreen.tsx` | Авто-логін за telegramId |
| Google | `/app/src/services/googleSheets.ts` | Запис ID як рядок |

---

## 🎯 Очікуваний результат

Коли користувач зареєструється:

**Google Sheets таблиця Users:**
```
| ID        | Name         | Role     | Level     | HourlyRate |
|-----------|--------------|----------|-----------|------------|
| 461103647 | Андрій Білик | employee | Рівень 1  | 175        |
```

**Не timeout ID!** ✅

---

## 📞 Підтримка

Якщо проблеми з:

1. **Телеграм ID не захоплюється**
   - Перевірте: чи відкривається через Telegram Bot
   - Перевірте консоль: F12 → Console → шукайте "REAL Telegram ID captured"

2. **CSP помилка**
   - Перевірте: vercel.json має `https: blob:` в script-src
   - Спробуйте: redeploy (git push origin main)

3. **Дані не записуються в Google Sheets**
   - Перевірте: Google Apps Script запущений
   - Перевірте: Таблиця має правильну структуру
   - Перевірте: Google Sheets в публічному доступі

---

## ✨ Готово до використання!

Система повністю функціональна для захоплення реальних Telegram ID користувачів при реєстрації в Mini App! 🚀
