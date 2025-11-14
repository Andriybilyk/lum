# Implementation Guide: Priority 2 Features

## ✅ Completed Features

### 1. Enhanced Input Validation (`src/utils/validation.ts`)
Input sanitization and validation with Zod schemas.

**Features:**
- `sanitizeInput()` - Removes HTML tags and limits length
- `validateFormData()` - Validates and sanitizes form data
- `getErrorMessage()` - Extract error messages

**Usage Example:**
```typescript
import { validateFormData, UserSchema } from '@/utils/validation';

const result = validateFormData(UserSchema, formData);
if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation error:', result.error);
}
```

---

### 2. Retry Service (`src/services/retry.ts`)
Automatic retry logic with exponential backoff for API calls.

**Features:**
- `retry()` - Generic retry with customizable options
- `retryWithExponentialBackoff()` - Exponential backoff helper
- `retryWithLinearBackoff()` - Linear backoff helper
- `isNetworkError()` - Check if error is network-related
- `isServerError()` - Check if error is server error (5xx)

**Usage Example:**
```typescript
import { retry, isNetworkError } from '@/services/retry';
import { logger } from '@/utils/logger';

const data = await retry(
  () => readSheet(CONFIG.GOOGLE_SHEETS.RANGES.USERS),
  {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => isNetworkError(error) || isServerError(error),
    onRetry: (attempt, error) => {
      logger.warn(`Retry attempt ${attempt}/3`, { error: error.message });
    },
  }
);
```

---

### 3. Notification System (`src/contexts/NotificationContext.tsx`)
Centralized notification management for user feedback.

**Components:**
- `NotificationProvider` - Context provider
- `useNotification()` - Hook to access notification methods
- `NotificationContainer` - UI component to display notifications

**Features:**
- `show()` - Show custom notification
- `success()` - Show success notification
- `error()` - Show error notification
- `warning()` - Show warning notification
- `info()` - Show info notification
- `dismiss()` - Dismiss specific notification
- `dismissAll()` - Dismiss all notifications

**Usage Example:**
```typescript
import { useNotification } from '@/contexts/NotificationContext';

function MyComponent() {
  const { success, error, warning } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      success('Успішно', 'Дані збережені');
    } catch (err) {
      error('Помилка', 'Не вдалося зберегти дані');
    }
  };

  return <button onClick={handleSave}>Зберегти</button>;
}
```

**Advanced Usage with Action:**
```typescript
const notificationId = info(
  'Інформація',
  'Дані завантажуються...',
  Infinity // infinite duration
);

// Later, dismiss with action
const { dismiss } = useNotification();
dismiss(notificationId);
```

---

## 🔄 Integration Examples

### Combining Retry + Validation + Notifications

```typescript
import { retry, retryWithExponentialBackoff } from '@/services/retry';
import { validateFormData, UserSchema } from '@/utils/validation';
import { useNotification } from '@/contexts/NotificationContext';
import { logger } from '@/utils/logger';

function UserForm() {
  const { success, error, warning } = useNotification();

  const handleSubmit = async (formData) => {
    try {
      // Step 1: Validate and sanitize
      const validation = validateFormData(UserSchema, formData);
      if (!validation.success) {
        error('Помилка валідації', validation.error);
        return;
      }

      // Step 2: Save with retry
      await retryWithExponentialBackoff(
        () => saveUser(validation.data),
        3
      );

      // Step 3: Show success
      success('Успішно', 'Користувача збережено');
    } catch (err) {
      error('Помилка', 'Не вдалося зберегти користувача');
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Retry with Google Sheets Integration

```typescript
import { retry, isNetworkError } from '@/services/retry';
import { readSheet } from '@/services/googleSheets';
import { logger } from '@/utils/logger';

export const loadUsersWithRetry = async () => {
  return retry(
    () => readSheet('Users!A:E'),
    {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
      shouldRetry: (error) => {
        // Only retry on network errors, not on auth errors
        return isNetworkError(error) ||
               error.message.includes('quota');
      },
      onRetry: (attempt, error) => {
        logger.warn(`Retry ${attempt}/3 for loading users`, {
          error: error.message
        });
      }
    }
  );
};
```

### Validation in Form Component (Real Example)

```typescript
// From src/components/employee/LogHoursModal.tsx
import { validateFormData, HoursSchema } from '@/utils/validation';
import { useNotification } from '@/contexts/NotificationContext';

function LogHoursModal() {
  const { success, error } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      userId: user?.id || '',
      date: formData.date,
      hours: parseFloat(formData.hours),
      object: formData.object,
      isBusinessTrip: isBusinessTrip,
      salary: earnings.total
    };

    // Validate form data
    const validation = validateFormData(HoursSchema, formData);
    if (!validation.success) {
      error('Помилка валідації', validation.error);
      return;
    }

    try {
      await addHours(validation.data);
      success('Успішно', 'Записано ' + formData.hours + ' годин');
    } catch (err) {
      error('Помилка', 'Не вдалося зберегти');
    }
  };
}
```

---

### 4. Search & Filter Hook (`src/hooks/useSearch.ts`)
Powerful search functionality for any data array with debouncing.

**Features:**
- `useSearch()` - Generic search hook with configurable fields
- Debounced search to optimize performance
- Case-sensitive/insensitive search
- Match types: `includes`, `startsWith`, `exact`
- Results count tracking

**Usage Example:**
```typescript
import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/common/SearchBar';

function EmployeeList() {
  const { searchTerm, results, handleSearch, clear } = useSearch(
    employees,
    {
      fields: ['name', 'level', 'email'],
      debounce: 300,
      matchType: 'includes',
    }
  );

  return (
    <>
      <SearchBar
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Пошук..."
        onClear={clear}
      />
      <div>
        {results.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
      </div>
    </>
  );
}
```

**Real Implementation (ManagerEmployees):**
```typescript
const { searchTerm, results: filteredTeamMembers, handleSearch } = useSearch(
  teamMembers,
  {
    fields: ['name', 'level'] as (keyof UserType)[],
    debounce: 300,
  }
);

// Show search bar only if there are multiple team members
{teamMembers.length > 3 && (
  <SearchBar
    value={searchTerm}
    onChange={handleSearch}
    placeholder="Пошук за іменем або рівнем..."
    onClear={clearSearch}
  />
)}

// Use filtered results
{filteredTeamMembers.map(employee => (
  <MemoizedTeamMemberCard
    key={employee.id}
    employee={employee}
    // ...
  />
))}
```

---

## 📋 Migration Checklist

### For Existing Forms
- [ ] Import `validateFormData` and relevant schema
- [ ] Replace inline validation with `validateFormData()`
- [ ] Update error messages to use `result.error`
- [ ] Add `useNotification` for user feedback

### For API Calls
- [ ] Wrap API calls with `retry()`
- [ ] Configure appropriate number of attempts
- [ ] Set `backoff` strategy (exponential for APIs)
- [ ] Add `onRetry` logging

### For User Feedback
- [ ] Replace `toast()` calls with `useNotification()`
- [ ] Map error messages to appropriate notification types
- [ ] Consider notification duration (5000ms default)
- [ ] Add action buttons for critical notifications

### For Search & Filter
- [ ] Import `useSearch` hook
- [ ] Import `SearchBar` component
- [ ] Add search hook to components with lists
- [ ] Configure search fields appropriately
- [ ] Wrap SearchBar with conditional rendering (show only if > 3 items)
- [ ] Use filtered results in rendering instead of original array

---

## 🎯 Best Practices

### Input Validation
```typescript
// ✅ Good: Validate before use
const validation = validateFormData(UserSchema, formData);
if (validation.success) {
  // Use validation.data safely
}

// ❌ Avoid: Using unsanitized data
const user = formData as User; // Unsafe!
```

### Retry Strategy
```typescript
// ✅ Good: Exponential backoff for APIs
const data = await retry(apiCall, {
  backoff: 'exponential',
  delay: 1000,
  attempts: 3,
});

// ❌ Avoid: Too many retries
const data = await retry(apiCall, {
  attempts: 10, // Too much!
});
```

### Notifications
```typescript
// ✅ Good: Clear, actionable messages
error('Не вдалося завантажити', 'Перевірте з\'єднання та спробуйте ще раз');

// ❌ Avoid: Technical error messages
error('ERR_NETWORK_TIMEOUT: Connection refused at TCP/IP level');
```

---

## 🚀 Next Steps

### Priority 2 (Remaining)
- [ ] Testing Infrastructure (vitest setup - already partially done)
- [ ] Write comprehensive unit tests
- [ ] Integration tests for retry + validation

### Priority 3
- [ ] Offline support (IndexedDB)
- [ ] Search & Filter functionality
- [ ] Advanced reporting features

---

## 📞 Support

For questions or issues with these features, refer to:
- `src/utils/validation.ts` - Input validation
- `src/services/retry.ts` - Retry logic
- `src/contexts/NotificationContext.tsx` - Notifications
- `src/components/providers/NotificationContainer.tsx` - UI rendering
