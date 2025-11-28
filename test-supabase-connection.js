// Простий скрипт для тестування підключення до Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Завантажуємо .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Перевірка підключення до Supabase...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials не налаштовані!');
  process.exit(1);
}

if (supabaseUrl === 'your-project-url.supabase.co' || supabaseKey === 'your-anon-key-here') {
  console.error('❌ Використовуються placeholder значення!');
  process.exit(1);
}

// Створюємо клієнт
const supabase = createClient(supabaseUrl, supabaseKey);

// Тестуємо підключення
async function testConnection() {
  try {
    console.log('\n📊 Завантаження рівнів з Supabase...\n');

    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('id');

    if (error) {
      console.error('❌ Помилка при завантаженні:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  Таблиця levels порожня!');
      console.log('\n📝 Запустіть міграцію:');
      console.log('   supabase/migrations/003_populate_levels.sql');
      process.exit(1);
    }

    console.log('✅ Успішно підключено до Supabase!');
    console.log(`\n📋 Знайдено ${data.length} рівнів:\n`);

    data.forEach((level, index) => {
      console.log(`${index + 1}. ${level.name} - ${level.hourly_rate} грн/год (ID: ${level.id})`);
    });

    console.log('\n✅ Все працює правильно!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  }
}

testConnection();
