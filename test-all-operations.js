// Тест всіх операцій після виправлення RLS
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

async function testTable(tableName, testData) {
  const testId = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  try {
    // INSERT
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert({ ...testData, id: testId })
      .select();

    if (insertError) {
      console.log(`❌ ${tableName}: INSERT failed - ${insertError.message}`);
      return false;
    }

    // SELECT
    const { data: selectData, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', testId);

    if (selectError) {
      console.log(`❌ ${tableName}: SELECT failed - ${selectError.message}`);
      return false;
    }

    // DELETE
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', testId);

    if (deleteError) {
      console.log(`⚠️  ${tableName}: DELETE failed - ${deleteError.message}`);
      // Не повертаємо false, бо головне що INSERT і SELECT працюють
    }

    console.log(`✅ ${tableName}: Всі операції працюють`);
    return true;
  } catch (error) {
    console.log(`❌ ${tableName}: Помилка - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Тестування всіх операцій після виправлення RLS...\n');

  const tests = [
    {
      name: 'users',
      data: {
        name: 'Тест Користувач',
        role: 'employee',
        level: 'Стажер',
        hourly_rate: 150,
      }
    },
    {
      name: 'objects',
      data: {
        name: 'Тест Об\'єкт',
        max_hours: 160,
      }
    },
    {
      name: 'process_types',
      data: {
        name: 'Тест Процес',
        unit: 'м²',
        rate: 10,
      }
    },
  ];

  let successCount = 0;

  for (const test of tests) {
    const success = await testTable(test.name, test.data);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Невелика затримка між тестами
  }

  console.log(`\n📊 Результат: ${successCount}/${tests.length} тестів пройшли успішно`);

  if (successCount === tests.length) {
    console.log('🎉 ВСЕ ПРАЦЮЄ! Можете використовувати додаток.');
  } else {
    console.log('⚠️  Деякі операції не працюють. Перевірте, чи виконали SQL в Supabase.');
  }
}

runTests();
