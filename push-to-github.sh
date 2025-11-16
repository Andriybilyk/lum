#!/bin/bash

# Telegram Mini App - GitHub Push Script
# Скрипт для завантаження проекту на GitHub

echo "🚀 Telegram Mini App - GitHub Push"
echo "=================================="
echo ""

# Перевірте git статус
echo "📊 Git Status:"
git status --short | head -10
echo ""

# Запитайте про GitHub Token
echo "🔐 Введіть ваші GitHub дані:"
read -p "GitHub Username: " USERNAME
read -sp "Personal Access Token: " TOKEN
echo ""
echo ""

# Побудуйте URL
REPO_URL="https://${USERNAME}:${TOKEN}@github.com/Andriybilyk/lum.git"

# Spush
echo "📤 Завантажую на GitHub..."
git push "$REPO_URL" main -v

# Перевірте результат
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Проект завантажено на GitHub!"
    echo ""
    echo "🔗 Repository: https://github.com/Andriybilyk/lum"
    echo "🚀 Наступний крок: Vercel deployment"
    echo "📖 Читайте: QUICK_DEPLOY_GUIDE.md"
else
    echo ""
    echo "❌ ERROR! Щось пішло не так."
    echo "📝 Перевірте:"
    echo "   - Username правильно введено"
    echo "   - Token правильно скопійовано"
    echo "   - Токен має權限на репо"
    exit 1
fi
