# План оптимізації продуктивності для мультитенантності

## Поточна ситуація
- Завантажуються всі дані з усіх підрозділів
- Фільтрація відбувається на клієнті через useMemo
- RLS політики спрощені (public access)

## Проблеми продуктивності

### 1. Масштабування
- **Малий масштаб** (10-50 записів на підрозділ): Вплив мінімальний
- **Середній масштаб** (100-500 записів на підрозділ): Помітне уповільнення
- **Великий масштаб** (1000+ записів на підрозділ): Значний вплив

### 2. Ризики безпеки
- Дані інших підрозділів доступні в браузері
- Можна перехопити через DevTools
- Не відповідає кращим практикам безпеки

## Рішення (по пріоритету)

### 🔥 Критично (якщо багато даних або важлива безпека)

#### Варіант 1: Фільтрація на рівні API (НАЙКРАЩИЙ)
**Переваги:**
- ✅ Максимальна продуктивність
- ✅ Максимальна безпека
- ✅ Менше трафіку

**Реалізація:**
```typescript
// 1. Додати departmentId у всі API виклики
export async function getAllObjects(departmentId: string): Promise<ObjectType[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('department_id', departmentId);
  // ...
}

// 2. Передавати departmentId з UserContext
const data = await dataAdapter.loadAllData(user.departmentId);
```

**Час реалізації:** 2-3 години

---

#### Варіант 2: Впровадити Supabase Auth (НАЙБЕЗПЕЧНІШИЙ)
**Переваги:**
- ✅ Автентифікація на рівні бази даних
- ✅ RLS політики працюють правильно
- ✅ JWT токени з departmentId

**Реалізація:**
1. Налаштувати Supabase Auth з Telegram Mini App
2. Зберігати departmentId в метаданих користувача
3. Використовувати auth.uid() в RLS політиках
4. Додати custom claims для departmentId

**Час реалізації:** 6-8 годин

---

### ⚠️ Важливо (покращення поточного рішення)

#### Варіант 3: Ліниве завантаження (Lazy Loading)
**Переваги:**
- ✅ Швидше початкове завантаження
- ✅ Менше пам'яті

**Реалізація:**
```typescript
// Завантажувати тільки критичні дані спочатку
const initialData = await loadCriticalData(user.departmentId);
// Завантажувати решту в фоні
setTimeout(() => loadSecondaryData(user.departmentId), 1000);
```

---

#### Варіант 4: Кешування з TTL
**Переваги:**
- ✅ Менше запитів до бази
- ✅ Швидше повторне завантаження

**Реалізація:**
```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 хвилин
const cache = new Map();

export async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

### 💡 Опціонально (додаткові оптимізації)

#### Варіант 5: Віртуалізація списків
Для великих списків використовувати react-window або react-virtualized

#### Варіант 6: Web Workers
Виконувати фільтрацію у фоновому потоці

#### Варіант 7: IndexedDB
Зберігати дані локально для офлайн роботи

---

## Рекомендований план дій

### Фаза 1: Швидке покращення (1-2 години)
1. ✅ **ЗРОБЛЕНО**: Додано useMemo фільтрацію
2. Додати логування розміру даних:
```typescript
useEffect(() => {
  console.log('📊 Data size:', {
    users: users.length,
    objects: objects.length,
    hours: hours.length,
    filtered: {
      users: filteredUsers.length,
      objects: filteredObjects.length,
      hours: filteredHours.length,
    }
  });
}, [users, objects, hours, filteredUsers, filteredObjects, filteredHours]);
```

### Фаза 2: Середньострокове рішення (2-4 години)
Якщо логи показують >500 записів:
- Впровадити **Варіант 1** (фільтрація на рівні API)
- Це найпростіше і найефективніше

### Фаза 3: Довгострокове рішення (6-8 годин)
Якщо важлива безпека або масштаб >1000 записів:
- Впровадити **Варіант 2** (Supabase Auth)
- Це найбезпечніше і найстабільніше

---

## Вимірювання продуктивності

### Додати метрики:
```typescript
// В DataContext.tsx
const startTime = performance.now();
const data = await dataAdapter.loadAllData();
const loadTime = performance.now() - startTime;
console.log(`⏱️ Data loaded in ${loadTime.toFixed(0)}ms`);

// Розмір даних
const dataSize = new TextEncoder().encode(JSON.stringify(data)).length;
console.log(`📦 Data size: ${(dataSize / 1024).toFixed(2)} KB`);
```

### Критичні порогі:
- ⚠️ Час завантаження >2 секунд - потрібна оптимізація
- ⚠️ Розмір даних >500 KB - потрібна оптимізація
- ⚠️ Фільтрація займає >100ms - потрібна оптимізація

---

## Висновок

**Поточне рішення прийнятне для:**
- ✅ Малого бізнесу (до 100 записів на підрозділ)
- ✅ MVP / прототипу
- ✅ Швидкого запуску

**Потрібна оптимізація для:**
- ❌ Середнього/великого бізнесу (>500 записів)
- ❌ Критичної безпеки даних
- ❌ Повільного інтернету

**Найкращий наступний крок:**
Впровадити **Варіант 1** (фільтрація на рівні API) - це дасть 90% користі за 20% зусиль.
