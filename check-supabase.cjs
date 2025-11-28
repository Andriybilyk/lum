#!/usr/bin/env node

/**
 * Supabase Configuration Checker
 * Перевіряє чи правильно налаштовано Supabase
 */

console.log('\n🔍 Перевірка налаштування Supabase...\n');

// Завантажити env змінні
const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

const env = loadEnvFile('.env.local');

// Перевірки
const checks = {
  supabaseUrl: {
    name: 'Supabase URL',
    check: () => {
      const url = env.VITE_SUPABASE_URL;
      if (!url) return { pass: false, message: 'Не знайдено VITE_SUPABASE_URL' };
      if (url === 'your-project-url.supabase.co') return { pass: false, message: 'Використовується placeholder' };
      if (!url.includes('.supabase.co')) return { pass: false, message: 'Неправильний формат URL' };
      return { pass: true, message: url };
    }
  },

  supabaseKey: {
    name: 'Supabase Anon Key',
    check: () => {
      const key = env.VITE_SUPABASE_ANON_KEY;
      if (!key) return { pass: false, message: 'Не знайдено VITE_SUPABASE_ANON_KEY' };
      if (key === 'your-anon-key-here') return { pass: false, message: 'Використовується placeholder' };
      if (!key.startsWith('eyJ')) return { pass: false, message: 'Неправильний формат ключа' };
      return { pass: true, message: `${key.substring(0, 20)}...` };
    }
  },

  googleSheets: {
    name: 'Google Sheets (Legacy)',
    check: () => {
      const hasGoogle = env.VITE_GOOGLE_API_KEY && env.VITE_SPREADSHEET_ID;
      return {
        pass: true,
        message: hasGoogle ? '✓ Налаштовано (fallback)' : '✗ Не налаштовано'
      };
    }
  }
};

console.log('📋 Результати перевірки:\n');

let allPassed = true;
Object.entries(checks).forEach(([key, { name, check }]) => {
  const result = check();
  const icon = result.pass ? '✅' : '❌';
  console.log(`${icon} ${name}: ${result.message}`);
  if (!result.pass) allPassed = false;
});

console.log('\n' + '─'.repeat(50) + '\n');

if (allPassed) {
  console.log('🎉 Всі перевірки пройдені успішно!');
  console.log('📝 Додаток буде використовувати Supabase як primary database\n');
  console.log('Наступні кроки:');
  console.log('1. Виконати SQL міграції в Supabase Dashboard');
  console.log('2. Перезапустити dev сервер: npm run dev');
  console.log('3. Перевірити console: повинно бути "Active data source: supabase"\n');
} else {
  console.log('⚠️  Деякі перевірки не пройдені\n');
  console.log('Інструкції:');
  console.log('1. Створити Supabase проект: https://app.supabase.com');
  console.log('2. Отримати credentials: Settings → API');
  console.log('3. Оновити файл .env.local');
  console.log('4. Запустити: node check-supabase.js\n');
  console.log('Детальна інструкція: QUICK_SUPABASE_SETUP.md\n');
}

// Додаткова інформація
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL !== 'your-project-url.supabase.co') {
  console.log('🔗 Корисні посилання:');
  const projectId = env.VITE_SUPABASE_URL.split('//')[1]?.split('.')[0];
  if (projectId) {
    console.log(`   Dashboard: https://app.supabase.com/project/${projectId}`);
    console.log(`   Table Editor: https://app.supabase.com/project/${projectId}/editor`);
    console.log(`   SQL Editor: https://app.supabase.com/project/${projectId}/sql`);
    console.log(`   API Settings: https://app.supabase.com/project/${projectId}/settings/api\n`);
  }
}

process.exit(allPassed ? 0 : 1);
