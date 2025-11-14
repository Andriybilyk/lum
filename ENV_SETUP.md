# 🔧 Налаштування Environment Variables (Ключів API)

## ⚠️ Проблема

Ви бачите помилку:
```
❌ Network error: Could not connect to Google Sheets API
```

Це означає, що Google API ключі не були завантажені в додаток.

---

## ✅ Рішення

### Крок 1: Переконайтесь що файл `.env` або `.env.local` існує

1. Відкрийте проект в редакторі (VS Code, тощо)
2. Переконайтесь що у корені проекту (де `package.json`) є файл `.env` або `.env.local`

### Крок 2: Додайте необхідні змінні

Додайте наступні рядки в файл `.env` (або `.env.local`):

```
VITE_GOOGLE_API_KEY=AIzaSyAnxOV3tYdB4ZLJ5TSRmxorfx2Kt0RTqTc
VITE_SPREADSHEET_ID=1-VbmqakiMZZGQlDu0nhZYIYZZVN68EpZt4eeuKDnzDs
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec
```

### Крок 3: Перезапустіть Dev Server

Це **ДУЖЕ ВАЖЛИВО**! Dev сервер повинен бути перезапущений після додавання/зміни `.env` файлу:

1. Знайдіть термінал де запущений dev сервер
2. Натисніть **Ctrl+C** щоб зупинити його
3. Введіть `npm run dev` щоб запустити його заново

### Крок 4: Перезавантажте сторінку в браузері

1. Натисніть **F5** або **Ctrl+R**
2. Дивіться Console (F12) для логів
3. Повинні побачити:
   ```
   ✅ All required environment variables are set
   ```

---

## 🔍 Як перевірити що все працює

1. Відкрийте браузер
2. Натисніть **F12** → вкладка **Console**
3. Дивіться перший лог при завантаженні:
   ```
   📊 Google Sheets Configuration:
   Spreadsheet ID: 1-VbmqakiMZZGQlDu0nhZYIYZZVN68EpZt4eeuKDnzDs
   API Key: AIzaSyAnxOV...
   Script URL: ✅ SET
   ✅ All required environment variables are set
   ```

Якщо вже вижучи `NOT SET` - значит dev сервер не був перезапущений.

---

## ⚡ Швидке Рішення

Якщо у вас вже є файл `.env`:

1. VS Code: Натисніть **Ctrl+K Ctrl+0** (потім **Ctrl+Shift+P** → затип "Reload Window")
2. Термінал:
   ```bash
   # Зупинити dev сервер (Ctrl+C)
   # Потім запустити заново
   npm run dev
   ```
3. Браузер: **F5** для перезавантаження

---

## 📝 Що означають змінні

| Змінна | Значення | Де отримати |
|--------|---------|-------------|
| `VITE_GOOGLE_API_KEY` | API ключ Google | Google Cloud Console |
| `VITE_SPREADSHEET_ID` | ID Google Sheet | URL таблиці: `/spreadsheets/d/**{ID}**` |
| `VITE_GOOGLE_SCRIPT_URL` | URL Apps Script | Google Apps Script → Deploy → Web app URL |

---

## 🚨 Якщо проблема залишається

Якщо навіть після перезапуску dev сервера все ще бачите помилку:

1. Перевіримо конфіг:
   ```bash
   cat .env
   # або
   cat .env.local
   ```

2. Переконайтесь, що рядки **без пробілів**:
   ```
   ❌ VITE_GOOGLE_API_KEY = AIzaSy...  (пробіли!)
   ✅ VITE_GOOGLE_API_KEY=AIzaSy...    (без пробілів)
   ```

3. Перевіримо що dev сервер дійсно перезапущений:
   ```
   # Повинні бачити:
   ✅ All required environment variables are set
   ```

4. Якщо все ще не працює - можливо Google API ключ невалідний або таблиця не поділена публічно:
   - Перевіримо чи таблиця має доступ "Anybody with the link can view"
   - Перевіримо чи Google API включено в Google Cloud Console

---

## 💡 Порада

Для полегшення розробки, можна створити файл `.env.local` (замість `.env`):
- `.env` - комітиться в git (для прод)
- `.env.local` - не комітиться (для локальної розробки)

Git конфіг вже налаштований ігнорувати `.env.local` в `.gitignore`.
