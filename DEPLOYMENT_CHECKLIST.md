# 🚀 Розгортання на Vercel - Контрольний список

## ✅ Ваші дані (уже маємо)

```
🤖 Telegram Bot: luminexa_bot
🔑 Bot Token: 8193905051:AAEOmZai4yWSq80LZdnOLAfHsb9f8SdIlG4
📝 App Name: Time Tracker
```

---

## 📋 Контрольний список розгортання

### Фаза 1: Підготовка GitHub (5 хвилин)

- [ ] У вас є GitHub аккаунт
- [ ] Репозиторій з кодом створено
- [ ] Код завантажено на GitHub (`main` гілка)

**Команди:**
```bash
git init
git add .
git commit -m "Telegram Mini App - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/telegram-mini-app.git
git push -u origin main
```

---

### Фаза 2: Vercel Setup (10 хвилин)

#### 2.1 Реєстрація
- [ ] Перейти на https://vercel.com
- [ ] Sign Up через GitHub
- [ ] Авторизація

#### 2.2 Імпорт проекту
- [ ] На дашборді: "New Project"
- [ ] Вибрати репозиторій: `telegram-mini-app`
- [ ] Клікнути "Import"

#### 2.3 Налаштування змінних
На сторінці "Configure Project" додати під "Environment Variables":

```
VITE_TELEGRAM_BOT_TOKEN
Value: 8193905051:AAEOmZai4yWSq80LZdnOLAfHsb9f8SdIlG4
✅ Add

VITE_TELEGRAM_BOT_USERNAME
Value: luminexa_bot
✅ Add

VITE_APP_URL
Value: https://your-project-name.vercel.app
✅ Add
```

**Для Google Sheets (опціонально):**
```
VITE_GOOGLE_API_KEY = (ваш ключ)
VITE_SPREADSHEET_ID = (ваш ID)
VITE_GOOGLE_SCRIPT_URL = (ваш URL)
```

#### 2.4 Build settings (мають встановитися автоматично)
- [ ] Framework: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

#### 2.5 Deploy
- [ ] Клікнути "Deploy"
- [ ] Чекати завершення (2-5 хвилин)
- [ ] Отримати URL: `https://your-project-name.vercel.app`

---

### Фаза 3: Telegram Bot Налаштування (5 хвилин)

#### 3.1 Оновлення меню-кнопки
В Telegram:
```
@BotFather
/setmenubutton
[Вибрати luminexa_bot]
Type: Web App
Button text: Time Tracker
App URL: https://your-project-name.vercel.app/telegram
```

#### 3.2 Оновлення App URL (якщо раніше був /newapp)
```
@BotFather
/myapps
[Вибрати time_tracker]
Edit App URL: https://your-project-name.vercel.app/telegram
```

---

### Фаза 4: Тестування (10 хвилин)

#### 4.1 Локальне тестування
```bash
npm install
npm run dev
# Перейти на http://localhost:5173/telegram
# Перевірити статус, звіти, логування часу
```

#### 4.2 Тестування на Vercel
1. Знайти `@luminexa_bot` в Telegram
2. Клікнути кнопку "Time Tracker"
3. Перевірити:
   - [ ] Сторінка завантажується
   - [ ] Логування часу працює
   - [ ] Дані синхронізуються
   - [ ] Темна/світла тема працює

#### 4.3 Тестування маршрутів
- [ ] `/telegram` - основний додаток ✅
- [ ] `/telegram/quick` - швидкий логер ✅
- [ ] `/` - welcome screen ✅
- [ ] `/employee` - employee dashboard ✅

---

### Фаза 5: Моніторинг (постійно)

#### 5.1 Vercel Analytics
На дашборді проекту:
- [ ] Переглянути Analytics
- [ ] Налаштувати alerts на помилки

#### 5.2 Перевірити логи
```
Vercel Dashboard
→ Project Settings
→ Runtime Logs
→ View recent logs
```

#### 5.3 Статус сторінка
```
https://www.vercelstatus.com/
```

---

## 🔗 Посилання для швидкого доступу

**Ваш додаток:** `https://your-project-name.vercel.app/telegram`

**Vercel Dashboard:** https://vercel.com/dashboard

**Telegram Bot:** https://t.me/luminexa_bot

**BotFather:** https://t.me/BotFather

---

## 📝 Нотатки для розгортання

### URL який використовуємо:
```
VERCEL_URL = https://your-project-name.vercel.app
```

### Telegram посилання для користувачів:
```
Основний додаток:
https://t.me/luminexa_bot/time_tracker

Швидкий логер:
https://your-project-name.vercel.app/telegram/quick
```

### Часта помилка:
❌ **НЕ забувайте оновити URL в BotFather**

Якщо вы розгорнули на `https://my-app.vercel.app`, то в BotFather має бути саме цей URL, а не `localhost` або старий URL.

---

## 🆘 Швидке розв'язання проблем

### "Build failed"
```bash
# Локально:
npm install
npm run build
# Якщо проходить локально - скопіюйте точну помилку з Vercel логів
```

### "Mini App doesn't load"
1. Перевірте консоль браузера (F12)
2. Перевірте Network tab на помилки
3. Переконайтеся, що URL в BotFather правильний
4. Спробуйте incognito режим

### "Data not syncing"
1. Перевірте бекенд endpoint `/api/telegram/sync`
2. Перевірте CORS налаштування
3. Перевірте localStorage в консолі (F12 → Application)

---

## 📊 Очікувані результати

### Після успішного розгортання:

✅ Vercel URL активний
✅ Mini App завантажується у Telegram
✅ Користувачі можуть логувати час
✅ Дані синхронізуються
✅ Звіти доступні
✅ Темна тема працює
✅ Мобільний UI адаптований

---

## 🎯 Наступні кроки

Після розгортання:

1. **Розповсюджуйте:**
   - Поділіться посиланням: `https://t.me/luminexa_bot`
   - Розповсюджуйте серед команди

2. **Моніторьте:**
   - Слідкуйте за логами на Vercel
   - Збирайте feedback від користувачів

3. **Оновлюйте:**
   - Git push → Vercel автоматично перебудує
   - Тестуйте кожне оновлення

4. **Розширяйте:**
   - Додавайте нові функції
   - Оптимізуйте performance
   - Збирайте аналітику

---

## ✨ Поздоровлення!

Коли ви закінчите всі кроки, напишіть:

```
✅ Розгортання завершено!
✅ Telegram Mini App активний!
✅ Користувачі можуть використовувати!
```

🎉 **Готово! Ваш додаток живе в Telegram!** 🎉
