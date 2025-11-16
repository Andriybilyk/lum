# 📤 Завантаження проекту на GitHub

Ваш проект вже налаштований для GitHub репозиторію:
```
https://github.com/Andriybilyk/lum.git
```

## 🔐 Крок 1: Створіть Personal Access Token

1. Перейдіть на https://github.com/settings/tokens
2. Клікніть "Generate new token" → "Generate new token (classic)"
3. Назвіть токен: `Telegram Mini App Deploy`
4. Виберіть scopes:
   - ✅ repo (повний доступ до репозиторіїв)
   - ✅ admin:repo_hook (для webhook)
5. Клікніть "Generate token"
6. **Скопіюйте токен** (покажеться лише раз!)

## 🔧 Крок 2: Налаштуйте Git

Замініть `YOUR_TOKEN` на ваш токен:

```bash
git config --global credential.helper store
echo "https://YOUR_USERNAME:YOUR_TOKEN@github.com" > ~/.git-credentials
```

**Або:**

```bash
# Для одного разу:
git push https://YOUR_USERNAME:YOUR_TOKEN@github.com/Andriybilyk/lum.git main
```

## ✅ Крок 3: Завантажте на GitHub

```bash
git push origin main -v
```

## 📊 Що завантажиться

✅ Весь код проекту (~2000 строк)
✅ Документація (15+ файлів)
✅ Налаштування Vercel
✅ Тести та конфіг
✅ Git історія всіх змін

## 🎯 Після завантаження

На GitHub буде:
- 📁 Весь код готовий до Vercel
- 📚 Повна документація
- 🔧 Налаштування для боту
- ✅ Готово до продакшену

## ⚡ Швидко:

```bash
# Замініть параметри:
git push https://YOUR_USERNAME:YOUR_TOKEN@github.com/Andriybilyk/lum.git main

# Або встановіть глобально:
git config --global credential.helper store
# (введіть один раз, потім запам'ятається)
```

---

**Після push:**
✅ Йдіть на https://vercel.com/new
✅ Імпортуйте репозиторій з GitHub
✅ Vercel автоматично будуватиме та розгортатиме! 🚀
