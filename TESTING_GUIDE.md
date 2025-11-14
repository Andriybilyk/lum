# 🧪 Testing Guide for HR System

**Date:** 2024-11-13
**Testing Framework:** Vitest
**Target Coverage:** 30%+ (current phase), 80% (final)

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Test Examples](#test-examples)
5. [Coverage Reports](#coverage-reports)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

---

## 🔧 Setup

### Installation

Testing dependencies have been added to `package.json`:
- **vitest** - Test runner
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - DOM matchers
- **jsdom** - DOM implementation for Node.js

### Configuration Files

1. **vitest.config.ts** - Main test configuration
   ```typescript
   export default defineConfig({
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: ['./src/tests/setup.ts'],
       coverage: {
         provider: 'v8',
         lines: 30,
         functions: 30,
       },
     },
   });
   ```

2. **src/tests/setup.ts** - Test environment setup
   - Configures DOM testing utilities
   - Mocks browser APIs (ResizeObserver, matchMedia)

---

## 🚀 Running Tests

### Basic Commands

```bash
npm run test                # Run all tests once
npm run test:watch         # Watch mode (re-run on changes)
npm run test:ui           # Interactive test UI
npm run test:coverage     # Generate coverage report
```

### Run Specific Tests

```bash
# Run tests for validation
npm run test -- validation.test.ts

# Run tests matching pattern
npm run test -- --grep "User Validation"

# Run single test file
npm run test src/utils/__tests__/validation.test.ts
```

### Watch Mode

```bash
# Watch all tests
npm run test:watch

# Watch specific file
npm run test:watch -- src/utils/__tests__/validation.test.ts
```

---

## ✍️ Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Assertion Examples

```typescript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ name: 'John' });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(3.14159);

// Strings
expect(message).toContain('error');
expect(message).toMatch(/error/i);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('value');
expect(array).toEqual([1, 2, 3]);

// Objects
expect(obj).toHaveProperty('name');
expect(obj).toMatchObject({ name: 'John' });

// Errors
expect(() => throwingFunction()).toThrow();
expect(() => throwingFunction()).toThrow(Error);
```

---

## 🧬 Test Examples

### 1. Validation Tests

**File:** `src/utils/__tests__/validation.test.ts`

```typescript
describe('User Validation', () => {
  it('should validate correct user data', () => {
    const { success, data } = validateData(UserSchema, {
      name: 'Іван Петренко',
      role: 'employee',
      level: 'Junior',
      hourlyRate: 150,
    });

    expect(success).toBe(true);
    expect(data?.name).toBe('Іван Петренко');
  });

  it('should reject invalid hourly rate', () => {
    const { success, error } = validateData(UserSchema, {
      name: 'Іван',
      role: 'employee',
      level: 'Junior',
      hourlyRate: -50,
    });

    expect(success).toBe(false);
    expect(error).toContain('більше 0');
  });
});
```

### 2. Logger Tests

**File:** `src/utils/__tests__/logger.test.ts`

```typescript
describe('Logger Utility', () => {
  it('should log debug messages', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    logger.debug('Test message');
    expect(consoleSpy).toHaveBeenCalled();
  });
});
```

### 3. Hook Tests

**File:** `src/hooks/__tests__/useEmployeeStats.test.ts`

```typescript
describe('useEmployeeStats Hook', () => {
  it('should calculate total hours correctly', () => {
    const { result } = renderHook(() => useEmployeeStats(['user1']), {
      wrapper: ContextWrapper,
    });

    expect(result.current.totalHours).toBe(expectedHours);
  });
});
```

### 4. Component Tests

**File:** `src/components/__tests__/MemoizedEmployeeCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import MemoizedEmployeeCard from '../memoized/MemoizedEmployeeCard';

describe('MemoizedEmployeeCard', () => {
  it('should render employee information', () => {
    const mockEmployee = {
      id: '1',
      name: 'Іван Петренко',
      role: 'employee',
      level: 'Junior',
      hourlyRate: 150,
    };

    render(
      <MemoizedEmployeeCard
        employee={mockEmployee}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Іван Петренко')).toBeInTheDocument();
    expect(screen.getByText('₴150.00/год')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const mockEmployee = { /* ... */ };
    const onSelect = vi.fn();

    render(
      <MemoizedEmployeeCard
        employee={mockEmployee}
        onSelect={onSelect}
      />
    );

    await userEvent.click(screen.getByText('Іван Петренко'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

---

## 📊 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage Report

```bash
# Generate HTML report
npm run test:coverage

# Open in browser
open coverage/index.html
```

### Coverage Goals

```
Target Coverage:  30% (current phase)
├─ Statements: 30%
├─ Branches: 30%
├─ Functions: 30%
└─ Lines: 30%

Final Target:     80%
├─ Statements: 80%
├─ Branches: 80%
├─ Functions: 80%
└─ Lines: 80%
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

Automatically runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Tests run on:
- Node 18.x
- Node 20.x

### Workflow Steps

1. **Test** - Run vitest
2. **Coverage** - Generate coverage report
3. **Upload** - Upload to Codecov
4. **Lint** - Run ESLint
5. **Type Check** - Run TypeScript compiler
6. **Build** - Build the project

### Viewing Results

```bash
# Check workflow status
gh workflow list

# View specific workflow
gh workflow view test.yml --web

# Check run status
gh run list --workflow test.yml
```

---

## 🏆 Best Practices

### DO ✅

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests independent
- ✅ Use setup/teardown for common logic
- ✅ Test error cases
- ✅ Mock external dependencies
- ✅ Test edge cases
- ✅ Aim for high coverage
- ✅ Run tests before committing
- ✅ Keep tests fast

### DON'T ❌

- ❌ Test implementation details
- ❌ Use generic test names
- ❌ Make tests dependent on order
- ❌ Hardcode test data
- ❌ Test multiple things in one test
- ❌ Ignore test failures
- ❌ Add unnecessary delays
- ❌ Test external libraries
- ❌ Mock everything
- ❌ Skip slow tests

### Naming Conventions

```typescript
// Good
it('should validate user with valid data', () => {});
it('should reject user with negative hourly rate', () => {});
it('should throw error when data is missing', () => {});

// Bad
it('test1', () => {});
it('validation works', () => {});
it('does stuff', () => {});
```

### Test Organization

```
src/
├── utils/
│   ├── logger.ts
│   └── __tests__/
│       └── logger.test.ts
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
└── hooks/
    ├── useMyHook.ts
    └── __tests__/
        └── useMyHook.test.ts
```

---

## 📈 Testing Progress

### Current Status
- **Setup:** ✅ Complete
- **Tests written:** ~50 (validation, logger)
- **Coverage:** ~5% (framework only)
- **CI/CD:** ✅ Configured

### Target Coverage by Phase

```
Phase 2 (This week):  5-10% (Framework setup)
Phase 3 (Next 2 weeks): 20-30% (Core utilities)
Phase 4 (Month 2): 50-60% (Components & hooks)
Final (Month 3): 80%+ (Comprehensive)
```

---

## 🔗 Useful Resources

### Documentation
- [Vitest Documentation](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

### Testing Patterns
- Test Pyramid: UI tests (10%) → Integration (30%) → Unit (60%)
- AAA Pattern: Arrange → Act → Assert
- BDD: Given → When → Then

---

## 💡 Tips & Tricks

### Run Tests in Watch Mode During Development

```bash
npm run test:watch
```

### Use Test UI for Better Developer Experience

```bash
npm run test:ui
```

### Filter Tests by Name

```bash
npm run test -- --grep "Validation"
```

### Run Only Failed Tests

```bash
npm run test -- --changed
```

### Update Snapshots

```bash
npm run test -- -u
```

---

## 🚀 Next Steps

1. **Write more tests** - Aim for 30% coverage this week
2. **Set up pre-commit hooks** - Run tests before commit
3. **Monitor CI/CD** - Check workflow results
4. **Code review** - Include tests in PR reviews
5. **Improve coverage** - Gradually increase to 80%

---

## 📞 Questions?

Refer to:
- Test files as examples: `src/utils/__tests__/`
- Vitest docs for advanced features
- Testing Library docs for component testing
- This guide for quick reference

---

**Testing Framework:** Vitest ✅
**Status:** Ready to use
**Next Review:** End of Phase 2
