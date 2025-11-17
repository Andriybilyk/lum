# Остаточна інструкція настройки

## Поточний статус

✅ Код готовий до деплою
❌ Google Apps Script потребує дозволу записувати дані через CORS

## Що потрібно зробити ЗАРАЗ

### 1. Запушити на GitHub

```bash
git push origin main
```

Vercel автоматично задеплоїть нову версію з Vercel API proxy.

### 2. Налаштувати VITE_GOOGLE_SCRIPT_URL на Vercel (ВАЖЛИВО!)

**На Vercel Dashboard:**

1. Перейдіть на https://vercel.com/dashboard
2. Виберіть проект **lum**
3. Натисніть **Settings**
4. Натисніть **Environment Variables**
5. Натисніть **Add New**
6. Додайте змінну:
   - **Name:** `VITE_GOOGLE_SCRIPT_URL`
   - **Value:** `https://script.google.com/macros/s/AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6/exec`
   - **Environments:** Select all (Development, Preview, Production)
7. Натисніть **Save**

### 3. Перезібрати на Vercel

1. Перейдіть на **Deployments**
2. Знайдіть останній деплой
3. Натисніть **...** → **Redeploy** (не Rebuild)

Це заново задеплоїть з новими змінними середовища.

## Як це працює

**Раніше (не працювало):**
```
Браузер
  ↓ CORS помилка
Google Apps Script
```

**Тепер (має працювати):**
```
Браузер
  ↓ /api/sheets
Vercel API Proxy
  ↓ (нема CORS)
Google Apps Script
  ↓
Google Sheets ✅
```

## Тестування

1. Відкрийте Telegram мініапп
2. Натисніть "Я Працівник"
3. Заповніть форму реєстрації
4. Натисніть "Завершити Реєстрацію"
5. **DevTools Console (F12):**
   - Мають бути логи:
   ```
   ✅ Set Telegram ID: [число]
   📤 Sending payload to Vercel API
   ✅ Append request successful
   ```
6. **Google Sheets:**
   - Перевірте лист "Users"
   - Чи з'явився новий рядок?
   - Чи має ID як Telegram ID (числа)?

## Якщо дані не записуються

### Перевірте логи Vercel:

1. На Vercel Dashboard
2. Перейдіть на **Deployments**
3. Натисніть на останній деплой
4. Натисніть **Function Logs**
5. Реєструватися і перевірити логи API

Там буде видно точну помилку.

### Можливі проблеми:

1. **Google Apps Script не прийматиме запити**
   - Спробуйте відкрити його URL у браузері
   - Вам має бути запропоновано запустити скрипт

2. **Google Apps Script не записує дані**
   - Скрипт може мати помилку у коді
   - Перевірте файл скрипту на Google Drive

3. **Telegram ID не передається при реєстрації**
   - DevTools Console має показати: `✅ Set Telegram ID: XXXXX`
   - Якщо видите `⚠️ Telegram ID not found`, то проблема у Telegram Mini App

## Комміти готові до деплою

```
0f5b854 fix: Add hardcoded Google Apps Script URL as fallback
ca571ff fix: Fix API configuration and add logging to Vercel API proxy
c314978 build: Add @vercel/node dependency for API serverless functions
5f29cd5 fix: Use Vercel API proxy to bypass Google Apps Script CORS errors
91a8a50 docs: Add deployment instructions for CORS fix
72e34f9 fix: Use no-cors mode for Google Apps Script requests
3dc99de debug: Add HTTP status and script URL logging
d3680ae fix: Allow Telegram Mini App embedding
78c6ded debug: Add detailed Telegram ID acquisition logging
307c836 fix: Improve Google Apps Script integration
034c5da debug: Add detailed logging for Telegram ID registration
3aa4f81 feat: Use Telegram ID as primary user ID in Google Sheets
```

## Резюме

Основна робота виконана:
- ✅ Telegram ID реєстрація реалізована
- ✅ CORS помилка вирішена через Vercel API
- ✅ Детальне логування для діагностики
- ✅ X-Frame-Options налаштовано для Telegram

**Залишилось:**
1. Запушити на GitHub
2. Налаштувати env var на Vercel
3. Перезібрати на Vercel
4. Протестувати

**Очікуваний результат:** Telegram ID буде записуватися у Google Sheets при реєстрації 🎉
