# ⚡ Швидкий гайд розгортання (10 хвилин)

## 🎯 Мета
Розгорнути ваш Telegram Mini App на Vercel та налаштувати бот.

---

## 👉 КРОК 1: GitHub (2 хвилини)

Якщо ваш код на GitHub, пропустіть цей крок.

Якщо НІ:

```bash
# В папці проекту
git init
git add .
git commit -m "Telegram Mini App ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/telegram-time-tracker.git
git branch -M main
git push -u origin main
```

✅ **Результат:** Код на GitHub в репозиторії

---

## 👉 КРОК 2: Vercel (3 хвилини)

### 2.1 Відкрийте https://vercel.com/new

### 2.2 Клікніть "Import Git Repository"

### 2.3 Подключіться до GitHub
- Виберіть `telegram-time-tracker` (або ваше ім'я репо)
- Клікніть "Import"

### 2.4 Налаштування проекту

На сторінці "Configure Project":

**Environment Variables** (надайте ці значення):

```
VITE_TELEGRAM_BOT_TOKEN
→ 8193905051:AAEOmZai4yWSq80LZdnOLAfHsb9f8SdIlG4

VITE_TELEGRAM_BOT_USERNAME
→ luminexa_bot

VITE_APP_URL
→ (залишиться пустим на цей момент, виправимо після деплою)
```

Клікніть **"Deploy"**

⏳ **Чекайте 2-5 хвилин...**

✅ **Результат:** Vercel URL, наприклад `https://telegram-time-tracker.vercel.app`

---

## 👉 КРОК 3: Оновлення Vercel URL (1 хвилина)

Як отримали Vercel URL, поверніться в Vercel:

### 3.1 На дашборді проекту
- Settings
- Environment Variables
- Знайдіть `VITE_APP_URL`
- Змініть значення на ваш Vercel URL

**Приклад:**
```
VITE_APP_URL = https://telegram-time-tracker.vercel.app
```

- Клікніть Edit
- Save

⚠️ **ВАЖЛИВО:** Проект перебудується автоматично (2 хвилини)

✅ **Результат:** Vercel app готовий з правильним URL

---

## 👉 КРОК 4: Telegram Bot (2 хвилини)

### 4.1 Відкрийте Telegram та знайдіть @BotFather

### 4.2 Надіслідіть команду:
```
/setmenubutton
```

### 4.3 Виберіть **luminexa_bot**

### 4.4 Виберіть **Web App**

### 4.5 Введіть:
```
Text: Time Tracker
URL: https://telegram-time-tracker.vercel.app/telegram
```
(замініть на ваш Vercel URL)

### 4.6 Клікніть Done ✅

✅ **Результат:** Бот налаштований

---

## 👉 КРОК 5: Тестування (2 хвилини)

### 5.1 Відкрийте Telegram

### 5.2 Знайдіть **@luminexa_bot**

### 5.3 Клікніть кнопку **"Time Tracker"**

### 5.4 Перевірте:
- ✅ Сторінка завантажується
- ✅ Видно ваше ім'я (взяте з Telegram)
- ✅ Можна додавати години (+1h кнопка)
- ✅ Видно прогрес за місяць

🎉 **ГОТОВО!**

---

## 📱 Як користуватися

### Основний додаток (повна функціональність)
```
Клікніть кнопку "Time Tracker" в меню бота
URL: https://telegram-time-tracker.vercel.app/telegram
```

### Швидкий логер (тільки логування)
```
URL: https://telegram-time-tracker.vercel.app/telegram/quick
```

---

## 🔗 Посилання користувачам

Поділіться з командою:

```
Telegram: https://t.me/luminexa_bot
або
Клікніть кнопку "Time Tracker" в меню бота
```

---

## 🆘 Якщо щось не працює

### Помилка при деплою на Vercel?
1. Перейдіть на дашборд Vercel
2. Перейдіть на ваш проект
3. Клікніть "Deployments"
4. Натисніть на червоне X (помилку)
5. Прочитайте логи - шукайте помилку

### Telegram Mini App не завантажується?
1. F12 в браузері → Console
2. Перевірте на помилки (повинна бути порожня)
3. Перевірте Network tab - немає 404 помилок?
4. Перевірте, що URL в BotFather правильний

### Не видите кнопку Time Tracker?
1. Повторіть крок `/setmenubutton` в BotFather
2. Перезавантажте бота (напишіть `/start`)
3. Перезавантажте Telegram (закрийте і відкрийте знову)

---

## 📊 На що дивитись після розгортання

### Vercel Dashboard
https://vercel.com/dashboard

Там можна:
- ✅ Переглядати логи
- ✅ Переглядати Analytics
- ✅ Перебудовувати проект
- ✅ Налаштувати домен

### Логи додатку
```
Vercel → Your Project → Runtime Logs
```

---

## 🚀 Оновлення коду

Якщо потрібно щось змінити:

```bash
# Локально
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel автоматично:
1. Помітить зміни
2. Перебудує додаток
3. Розгорне нову версію

**Час оновлення:** 2-5 хвилин

---

## ✅ Контрольний список

- [ ] Код на GitHub
- [ ] Vercel проект створено
- [ ] Zminnі оточення додано
- [ ] Vercel URL готовий
- [ ] BotFather налаштовано
- [ ] Telegram кнопка працює
- [ ] Mini App завантажується
- [ ] Можна логувати час
- [ ] Дані синхронізуються
- [ ] Поділилися з командою

---

## 🎉 Готово!

Ваш Telegram Mini App живе! 🚀

**URL:** https://telegram-time-tracker.vercel.app
**Бот:** @luminexa_bot

Користувачи можуть тепер:
✅ Логувати робочі години
✅ Переглядати статус
✅ Дивитись звіти
✅ Все прямо в Telegram!

---

## 💡 Що далі?

1. **Розповсюджуйте:** Поділіться з командою
2. **Моніторьте:** Дивіться на Vercel Analytics
3. **Оновлюйте:** Git push → автоматичний deploy
4. **Розширяйте:** Додавайте нові функції
5. **Вдосконалюйте:** Слухайте feedback користувачів

---

**Питання?** Перевірте файли:
- `VERCEL_DEPLOYMENT.md` - детально
- `DEPLOYMENT_CHECKLIST.md` - контрольний список
- `TELEGRAM_SETUP_QUICK_START.md` - про саму app

🎯 **Успіхів!** 🎯
