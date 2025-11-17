# Інструкції по деплою

## Проблема
CORS помилка блокує запити до Google Apps Script. Виправлення вже зроблене (додано `mode: 'no-cors'`), але потрібен новий деплой.

## Рішення - Запушити зміни на GitHub

```bash
# Перевірте, що всі зміни закомічені
git status

# Запуште на GitHub (Vercel автоматично задеплоїть)
git push origin main
```

## Альтернатива - Локальне тестування

```bash
# Зібрати проект
npm run build

# Запустити локальний сервер
npm run dev
```

Потім відкрийте http://localhost:5173 у браузері.

## Що було виправлено

### 1. CORS помилка (КРИТИЧНО)
- Додано `mode: 'no-cors'` у `src/services/googleSheets.ts`
- Тепер запити до Google Apps Script не блокуються браузером

### 2. X-Frame-Options помилка
- Змінено з `DENY` на `SAMEORIGIN` у `src/utils/securityHeaders.ts`
- Додано `frame-ancestors` у CSP для Telegram домені
- Оновлено `vercel.json`

### 3. Логування для діагностики
- Додано детальне логування у `EmployeeRegistration.tsx`
- Додано детальне логування у `ManagerRegistration.tsx`
- Додано логування у `DataContext.tsx` та `googleSheets.ts`

## Що перевірити після деплою

1. Відкрийте Telegram мініапп
2. DevTools Console (F12)
3. Зареєструйте нового користувача
4. Перевірте консоль - має бути:
   ```
   ✅ Append request sent (no-cors mode - response not readable)
   ```
5. Перевірте Google Sheets - чи з'явився новий рядок з Telegram ID

## Якщо дані все ще не записуються

Проблема у Google Apps Script скрипті. Потрібно:

1. Перейти на https://script.google.com
2. Знайти скрипт (ID: AKfycbxyZ92BQIycYb97kcqcqHLeSK4Z33FYP-wUS0EMKUDEPgNHQpoakB2iuzcI_S0rd6r6)
3. Перевірити код скрипту
4. Переконатися що він обробляє `action: 'append'` правильно
5. Додати логування у скрипт

## Коміти для деплою

- 72e34f9 fix: Use no-cors mode for Google Apps Script requests
- 3dc99de debug: Add HTTP status and script URL logging
- d3680ae fix: Allow Telegram Mini App embedding by updating security headers
- 78c6ded debug: Add detailed Telegram ID acquisition logging
- 307c836 fix: Improve Google Apps Script integration and error handling
