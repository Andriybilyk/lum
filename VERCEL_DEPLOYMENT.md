# Розгортання на Vercel

Інструкція для розміщення вашого Telegram Mini App на Vercel.

## 🚀 Крок 1: Підготовка GitHub репозиторію

### Якщо ви ще не завантажили на GitHub:

```bash
# Інціалізуйте Git (якщо потрібно)
git init

# Додайте всі файли
git add .

# Зробіть перший commit
git commit -m "Initial commit: Telegram Mini App"

# Додайте remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Завантажте на GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 Крок 2: Зареєструйтеся на Vercel

1. Перейдіть на https://vercel.com
2. Клікніть "Sign Up"
3. Виберіть "Continue with GitHub"
4. Авторизуйтеся

---

## 📦 Крок 3: Імпортуйте проект

1. На дашборді Vercel клікніть "New Project"
2. Виберіть ваш репозиторій з GitHub
3. Клікніть "Import"

---

## ⚙️ Крок 4: Налаштування змінних оточення

На сторінці "Configure Project":

### Додайте ці змінні в "Environment Variables":

```
VITE_TELEGRAM_BOT_TOKEN = 8193905051:AAEOmZai4yWSq80LZdnOLAfHsb9f8SdIlG4
VITE_TELEGRAM_BOT_USERNAME = luminexa_bot
VITE_APP_URL = https://your-project.vercel.app
VITE_GOOGLE_API_KEY = (ваш Google API key)
VITE_SPREADSHEET_ID = (ваш Spreadsheet ID)
VITE_GOOGLE_SCRIPT_URL = (ваш Google Apps Script URL)
```

**⚠️ ВАЖЛИВО:**
- VITE_TELEGRAM_BOT_TOKEN видимий у браузері (це нормально для цього типу токену)
- Переконайтеся, що URL_ПРИЛОЖЕНИЯ буде `https://your-project.vercel.app`

---

## 🔧 Крок 5: Налаштування побудови

Vercel повинен автоматично визначити:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

Якщо ні, встановіть вручну.

---

## ✅ Крок 6: Розгортання

1. Клікніть "Deploy"
2. Чекайте завершення побудови (зазвичай 2-5 хвилин)
3. Отримаєте URL: `https://your-project.vercel.app`

---

## 📱 Крок 7: Налаштування Telegram Bot

Тепер оновіть налаштування в BotFather:

### В Telegram:
```
@BotFather
/setmenubutton
[Вибрати luminexa_bot]
Web App
Text: Time Tracker
URL: https://your-project.vercel.app/telegram
```

### Або для швидкого логера:
```
URL: https://your-project.vercel.app/telegram/quick
```

---

## 🧪 Крок 8: Тестування

### Локально перед розгортанням:
```bash
npm run dev
# Перейти на http://localhost:5173/telegram
```

### На Vercel:
1. Знайдіть `@luminexa_bot` в Telegram
2. Клікніть кнопку "Time Tracker"
3. Дивіться, чи завантажується додаток

---

## 🔄 Крок 9: Обновлення коду

Після розгортання, щоб оновити код:

```bash
# Зробіть зміни локально
git add .
git commit -m "Update: description of changes"
git push origin main
```

Vercel автоматично перебудує і розгорне нову версію!

---

## 📊 Моніторинг розгортання

На дашборді Vercel ви можете:
- Переглядати логи побудови
- Перевіряти статус розгортання
- Використовувати Analytics для моніторингу
- Налаштувати Domain (custom domain)

---

## 🌍 Додавання custom домену (опціонально)

1. На дашборді проекту → Settings → Domains
2. Додайте ваш домен
3. Слідуйте інструкціям для DNS налаштування
4. Чекайте верифікації (зазвичай <1 хвилини)

---

## 🆘 Розв'язання проблем

### Проблема: Build failed

**Рішення:**
1. Перевірте консоль на помилки
2. Переконайтеся, що `npm install` проходить локально
3. Перевірте версії Node.js (Vercel підтримує 18+)

```bash
# Локально
npm install
npm run build
```

### Проблема: Mini App не завантажується

**Рішення:**
1. Перевірте консоль браузера (F12)
2. Перевірте NetworkTab для помилок API
3. Переконайтеся, що змінні оточення встановлені

### Проблема: Дані не синхронізуються

**Рішення:**
1. Переконайтеся, що бекенд endpoints доступні
2. Перевірте CORS налаштування
3. Перевірте логи на Vercel → Runtime Logs

---

## 📈 Оптимізація для Vercel

### Вже налаштовано в vercel.json:
- ✅ Правильний build command
- ✅ Правильна output directory
- ✅ Rewrites для SPA маршрутизації
- ✅ Security headers
- ✅ Кешування для статичних файлів

### Додаткова оптимізація:
```bash
# Перевірте розмір build
npm run build

# Очистіть node_modules якщо потрібно
rm -rf node_modules
npm install
```

---

## 🔐 Безпека

### Уже налаштовано:
- ✅ HTTPS обов'язковий
- ✅ Security headers
- ✅ X-Frame-Options (SAMEORIGIN)
- ✅ XSS Protection
- ✅ Content-Type sniffing prevention

### Додаткові рекомендації:
1. Не комітьте секрети в Git
2. Використовуйте Vercel Environment Variables
3. Регулярно оновлюйте залежності
4. Моніторьте логи на помилки

---

## 📞 Корисні посилання

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

---

## ✅ Контрольний список

- [ ] GitHub репозиторій готовий
- [ ] Vercel проект створено
- [ ] Змінні оточення додано
- [ ] Build успішний
- [ ] Deploy завершено
- [ ] BotFather оновлено з новим URL
- [ ] Тестування в Telegram успішно
- [ ] Custom домен налаштовано (опціонально)
- [ ] Моніторинг включено
- [ ] Документація оновлена

---

## 🎉 Готово!

Ваш Telegram Mini App тепер живе на Vercel!

**URL додатку:** `https://your-project.vercel.app`
**Telegram Bot:** `@luminexa_bot`

Користувачі можуть тепер використовувати ваш додаток прямо з Telegram! 🚀
