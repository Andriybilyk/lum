// Тест реєстрації користувача
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserRegistration() {
  console.log('🧪 Тестування реєстрації користувача...\n');

  const testUser = {
    id: 'test_' + Date.now(),
    name: 'Тестовий Користувач',
    role: 'employee',
    level: 'Стажер',
    hourly_rate: 150,
    telegram_id: 'test_' + Date.now(),
  };

  console.log('📝 Спроба створити користувача:', testUser.name);

  const { data, error } = await supabase
    .from('users')
    .insert(testUser)
    .select();

  if (error) {
    console.error('❌ Помилка:', error.message);
    console.error('Деталі:', error);
    return;
  }

  console.log('✅ Користувач успішно створений!');
  console.log('Дані:', data);

  // Видаляємо тестового користувача
  console.log('\n🗑️  Видаляємо тестового користувача...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', testUser.id);

  if (deleteError) {
    console.error('⚠️  Не вдалося видалити тестового користувача:', deleteError.message);
  } else {
    console.log('✅ Тестовий користувач видалений');
  }

  console.log('\n✅ Реєстрація працює коректно!');
}

testUserRegistration();
