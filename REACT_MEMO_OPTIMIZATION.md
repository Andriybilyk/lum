# ⚡ React.memo Optimization Guide

**Date:** 2024-11-13
**Target:** 70% re-render reduction
**Status:** Implementation Guide Ready

---

## 🎯 Overview

React.memo prevents unnecessary re-renders by memoizing components. When props don't change, the component won't re-render.

### Expected Performance Improvement
```
Before: All children re-render when parent updates
After:  Only children with changed props re-render
Result: ~70% fewer unnecessary re-renders
```

---

## 📋 Components to Memoize

### Priority 1: List Items (High Impact)

These components are frequently rendered in lists and benefit most from memoization.

#### 1. Employee Card
**File:** `src/components/memoized/MemoizedEmployeeCard.tsx` ✅ Created

**Usage:**
```typescript
import MemoizedEmployeeCard from '@/components/memoized/MemoizedEmployeeCard';

<MemoizedEmployeeCard
  employee={employee}
  onSelect={handleSelect}
  onEdit={handleEdit}
  isSelected={isSelected}
/>
```

#### 2. Process Card
**File:** `src/components/memoized/MemoizedProcessCard.tsx` (TODO)

```typescript
export const MemoizedProcessCard = memo(
  function ProcessCard({ process, onEdit }: Props) {
    return (
      <Card>
        <h3>{process.processName}</h3>
        <p>{process.object}</p>
        <p>Vol: {process.volume} {process.unit}</p>
      </Card>
    );
  },
  (prev, next) => prev.process.id === next.process.id
);
```

#### 3. Hours Card
**File:** `src/components/memoized/MemoizedHoursCard.tsx` (TODO)

```typescript
export const MemoizedHoursCard = memo(
  function HoursCard({ hours, onEdit }: Props) {
    return (
      <Card>
        <p>{hours.date}: {hours.hours}h</p>
        <p>{hours.object}</p>
      </Card>
    );
  },
  (prev, next) => prev.hours.id === next.hours.id
);
```

---

### Priority 2: Modal Components (Medium Impact)

These are only rendered when opened, but benefit from proper memoization.

#### List of Modals to Memoize
- LogHoursModal
- LogProcessModal
- EmployeeDetailsModal
- ManagerEmployees
- ManagerReports

**Example Implementation:**
```typescript
interface LogHoursModalProps {
  open: boolean;
  onClose: () => void;
}

const MemoizedLogHoursModal = memo(
  function LogHoursModal({ open, onClose }: LogHoursModalProps) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        {/* Modal content */}
      </Dialog>
    );
  }
);

export default MemoizedLogHoursModal;
```

---

### Priority 3: Stats Components (Low Impact)

These calculate complex data and benefit from memoization.

#### EmployeeStats
```typescript
export const MemoizedEmployeeStats = memo(
  function EmployeeStats({ userId }: Props) {
    return (
      <Card>
        {/* Stats content */}
      </Card>
    );
  },
  (prev, next) => prev.userId === next.userId
);
```

---

## 🔧 Implementation Pattern

### Basic Pattern

```typescript
import React, { memo, useCallback } from 'react';

// Option 1: Simple memo
export const Component = memo(function Component({ prop1, prop2 }) {
  return <div>{prop1}: {prop2}</div>;
});

// Option 2: With custom comparison
export const Component = memo(
  function Component({ prop1, prop2 }) {
    return <div>{prop1}: {prop2}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.prop1 === nextProps.prop1 &&
           prevProps.prop2 === nextProps.prop2;
  }
);
```

### Advanced Pattern with useCallback

```typescript
interface Props {
  item: Item;
  onSelect: (id: string) => void;
  onEdit?: (item: Item) => void;
}

export const MemoizedItem = memo(
  function Item({ item, onSelect, onEdit }: Props) {
    // useCallback prevents new function creation on each render
    const handleSelect = useCallback(() => {
      onSelect(item.id);
    }, [item.id, onSelect]);

    const handleEdit = useCallback(() => {
      onEdit?.(item);
    }, [item, onEdit]);

    return (
      <Card onClick={handleSelect}>
        <div>{item.name}</div>
        <button onClick={handleEdit}>Edit</button>
      </Card>
    );
  },
  // Custom comparison: only re-render if item.id changes
  (prev, next) => prev.item.id === next.item.id
);
```

---

## 📊 Checklist: Memoization Implementation

### Step 1: Identify Components
- [ ] List item components
- [ ] Modal components
- [ ] Card components
- [ ] Stats/detail components

### Step 2: Implement Memoization

#### Example: Employee List Item
```typescript
// Before
export default function EmployeeCard({ employee, onSelect }) {
  return (
    <Card onClick={() => onSelect(employee.id)}>
      {employee.name}
    </Card>
  );
}

// After
const MemoizedEmployeeCard = memo(
  function EmployeeCard({ employee, onSelect }: Props) {
    const handleSelect = useCallback(() => {
      onSelect(employee.id);
    }, [employee.id, onSelect]);

    return (
      <Card onClick={handleSelect}>
        {employee.name}
      </Card>
    );
  },
  (prev, next) => prev.employee.id === next.employee.id
);

export default MemoizedEmployeeCard;
```

### Step 3: Use useCallback for Handlers

```typescript
// Handlers in parent component
const handleSelectEmployee = useCallback((id: string) => {
  setSelectedId(id);
}, []);

const handleEditEmployee = useCallback((employee: User) => {
  setEditingEmployee(employee);
}, []);

// Pass to memoized children
<MemoizedEmployeeCard
  employee={employee}
  onSelect={handleSelectEmployee}  // Stable reference
  onEdit={handleEditEmployee}      // Stable reference
/>
```

### Step 4: Update Imports

```typescript
// Update in parent components
import MemoizedEmployeeCard from '@/components/memoized/MemoizedEmployeeCard';

// Use in lists
{employees.map(employee => (
  <MemoizedEmployeeCard
    key={employee.id}
    employee={employee}
    onSelect={handleSelect}
  />
))}
```

---

## ⚠️ Common Mistakes

### ❌ Memoizing Everything

```typescript
// DON'T DO THIS - Overhead outweighs benefit
const Component = memo(function Small() {
  return <div>Small component</div>;
});
```

### ❌ Missing Dependencies

```typescript
// WRONG - Stale closure
const handleClick = useCallback(() => {
  doSomething(value); // Missing 'value' in dependencies
}, []);

// RIGHT
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### ❌ Creating Objects in Props

```typescript
// WRONG - New object every render
<MemoizedCard
  style={{ color: 'red' }}  // New object!
  config={{ key: 'value' }}
/>

// RIGHT - Create outside or useMemo
const style = { color: 'red' };
<MemoizedCard style={style} />
```

---

## 📈 Measuring Impact

### Using React DevTools Profiler

1. **Install React DevTools extension**
2. **Open DevTools → Profiler tab**
3. **Record renders**
4. **Check for yellow/red components** (unnecessary re-renders)

### Metrics to Track

```
Before Optimization:
├─ Mount time: 200ms
├─ Update time: 150ms
├─ Re-renders per action: 20+
└─ Yellow warnings: Many

After Optimization:
├─ Mount time: 180ms
├─ Update time: 50ms
├─ Re-renders per action: 5-6
└─ Yellow warnings: None
```

---

## 🚀 Implementation Order

### Week 1: Core Components

```
Monday:
  ├─ MemoizedEmployeeCard ✅
  └─ MemoizedProcessCard

Tuesday:
  ├─ MemoizedHoursCard
  └─ useCallback in parent components

Wednesday:
  ├─ Modal components
  └─ Stats components

Thursday-Friday:
  ├─ Test performance
  ├─ Fix issues
  └─ Document results
```

---

## 🔍 Verification Checklist

### Code Quality
- [ ] All list items are memoized
- [ ] useCallback used for handlers
- [ ] Custom comparisons where needed
- [ ] No unnecessary deps in callbacks
- [ ] Tests pass

### Performance
- [ ] React DevTools shows fewer re-renders
- [ ] LCP improved by 10-20%
- [ ] No memory leaks
- [ ] Bundle size not increased

### Documentation
- [ ] Code comments explain memoization
- [ ] README updated with pattern
- [ ] Examples provided
- [ ] Performance metrics documented

---

## 📚 Examples

### Example 1: Simple List Component

**Before:**
```typescript
function EmployeeList({ employees, onSelect }) {
  return (
    <div>
      {employees.map(emp => (
        <div key={emp.id} onClick={() => onSelect(emp.id)}>
          {emp.name}
        </div>
      ))}
    </div>
  );
}
```

**After:**
```typescript
const EmployeeListItem = memo(function Item({ employee, onSelect }) {
  const handleClick = useCallback(() => {
    onSelect(employee.id);
  }, [employee.id, onSelect]);

  return (
    <div onClick={handleClick}>
      {employee.name}
    </div>
  );
});

function EmployeeList({ employees, onSelect }) {
  const memoizedOnSelect = useCallback(onSelect, []);

  return (
    <div>
      {employees.map(emp => (
        <EmployeeListItem
          key={emp.id}
          employee={emp}
          onSelect={memoizedOnSelect}
        />
      ))}
    </div>
  );
}
```

### Example 2: Complex Component

**File:** `src/components/memoized/MemoizedEmployeeCard.tsx`

```typescript
import React, { useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface Props {
  employee: User;
  onSelect: (id: string) => void;
  onEdit?: (employee: User) => void;
  isSelected?: boolean;
}

export const MemoizedEmployeeCard = memo(
  function EmployeeCard({
    employee,
    onSelect,
    onEdit,
    isSelected,
  }: Props) {
    const handleSelect = useCallback(() => {
      onSelect(employee.id);
    }, [employee.id, onSelect]);

    const handleEdit = useCallback(() => {
      onEdit?.(employee);
    }, [employee, onEdit]);

    return (
      <Card
        className={isSelected ? 'ring-2 ring-blue-500' : ''}
        onClick={handleSelect}
      >
        <CardContent>
          <h3>{employee.name}</h3>
          <p>{employee.level}</p>
          <p>₴{employee.hourlyRate}/год</p>
          {onEdit && (
            <Button onClick={handleEdit}>Edit</Button>
          )}
        </CardContent>
      </Card>
    );
  },
  (prev, next) =>
    prev.employee.id === next.employee.id &&
    prev.isSelected === next.isSelected
);
```

---

## 📊 Results to Expect

### Performance Metrics

```
Metric                  Before    After    Improvement
─────────────────────────────────────────────────────
Mount Time             200ms     180ms     10%
Update Time            150ms     50ms      67%
Re-renders (add item)  20+       3-4       80%
Memory Usage           ~5MB      ~4.8MB    4%
Bundle Size            687KB     695KB     +8KB (worth it)
```

### User Experience

```
Interaction             Before      After
────────────────────────────────────────────
Scroll list            Noticeable lag  Smooth
Add item               Slight delay    Instant
Edit item              ~500ms render   ~100ms
Type in search         Jank           Responsive
```

---

## ✅ Final Checklist

- [ ] FeatureErrorBoundary created ✅
- [ ] MemoizedEmployeeCard created ✅
- [ ] useCallback patterns documented
- [ ] Testing infrastructure setup ✅
- [ ] Performance measured
- [ ] Results documented
- [ ] Code reviewed
- [ ] Ready for production

---

**Status:** Implementation in progress
**Priority:** High
**Effort:** 4-6 hours
**Expected ROI:** 70% re-render reduction

