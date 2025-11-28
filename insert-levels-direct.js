// Скрипт для прямої вставки рівнів в Supabase
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

const levels = [
  { id: '1', name: 'Стажер', hourly_rate: 150 },
  { id: '2', name: 'Рівень 1', hourly_rate: 175 },
  { id: '3', name: 'Рівень 2', hourly_rate: 200 },
  { id: '4', name: 'Менеджер', hourly_rate: 260 },
  { id: '5', name: 'Рівень 3', hourly_rate: 225 },
  { id: '6', name: 'Рівень 4', hourly_rate: 250 },
];

async function insertLevels() {
  console.log('🚀 Вставка рівнів в Supabase...\n');

  for (const level of levels) {
    console.log(`Додаємо: ${level.name} (${level.hourly_rate} грн/год)...`);

    const { error } = await supabase
      .from('levels')
      .upsert(level, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Помилка при додаванні ${level.name}:`, error.message);
    } else {
      console.log(`✅ ${level.name} додано`);
    }
  }

  console.log('\n✅ Готово! Перевіряємо результат...\n');

  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Помилка при перевірці:', error.message);
    return;
  }

  console.log(`📊 Всього рівнів в базі: ${data.length}\n`);
  data.forEach((level, index) => {
    console.log(`${index + 1}. ${level.name} - ${level.hourly_rate} грн/год`);
  });
}

insertLevels();
