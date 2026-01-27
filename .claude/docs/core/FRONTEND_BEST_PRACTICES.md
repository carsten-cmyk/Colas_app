# Frontend Best Practices - React & Vite

## Overview

Best practices for React development in the Enterprise Strategy Platform project using React 19.2, Vite, and Supabase.

---

## React Component Patterns

### 1. Functional Components with Hooks

**Pattern:** Always use functional components with hooks (no class components)

```jsx
// ✅ GOOD: Functional component with hooks
function CapabilityCard({ capability }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Side effects here
  }, [capability.id]);

  return <div>{/* Component JSX */}</div>;
}

// ❌ BAD: Class component
class CapabilityCard extends React.Component {
  // Avoid class components
}
```

---

### 2. Props Destructuring

**Pattern:** Destructure props for clarity

```jsx
// ✅ GOOD: Clear destructuring
function GapCard({ gap, onEdit, onDelete }) {
  return (
    <div>
      <h3>{gap.title}</h3>
      <button onClick={() => onEdit(gap.id)}>Edit</button>
    </div>
  );
}

// ❌ BAD: Using props object
function GapCard(props) {
  return (
    <div>
      <h3>{props.gap.title}</h3>
      <button onClick={() => props.onEdit(props.gap.id)}>Edit</button>
    </div>
  );
}
```

---

### 3. Component File Structure

**Pattern:** One component per file, co-locate related code

```
src/
├── components/
│   ├── GapCard.jsx              // Single component
│   ├── AddGapDialog.jsx         // Single component
│   └── ui/
│       ├── Card.jsx             // Generic UI component
│       └── Dialog.jsx           // Generic UI component
├── pages/
│   ├── CapabilityDetailPage.jsx // Page component
│   └── GapManagementPage.jsx    // Page component
└── lib/
    ├── supabase.js              // Supabase client
    └── queries.js               // Query definitions
```

---

### 4. State Management

**Pattern:** Use local state for UI, context for shared state

```jsx
// ✅ GOOD: Local state for component-specific data
function GapManagementPage() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch and manage gaps
}

// ✅ GOOD: Context for shared auth state
// contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage
const { user } = useAuth();
```

---

### 5. useEffect Dependencies

**Pattern:** Always specify dependencies correctly

```jsx
// ✅ GOOD: Proper dependencies
useEffect(() => {
  fetchGaps(capabilityId);
}, [capabilityId]); // Re-run when capabilityId changes

// ❌ BAD: Missing dependencies (causes stale closure)
useEffect(() => {
  fetchGaps(capabilityId);
}, []); // capabilityId not in dependencies

// ❌ BAD: Missing dependency array (runs on every render)
useEffect(() => {
  fetchGaps(capabilityId);
});
```

---

### 6. Custom Hooks

**Pattern:** Extract reusable logic into custom hooks

```jsx
// ✅ GOOD: Custom hook for data fetching
function useGaps(capabilityId) {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('gaps')
          .select('*')
          .eq('capability_id', capabilityId)
          .is('deleted_at', null);

        if (error) throw error;
        setGaps(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [capabilityId]);

  return { gaps, loading, error };
}

// Usage
function GapList({ capabilityId }) {
  const { gaps, loading, error } = useGaps(capabilityId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render gaps */}</div>;
}
```

---

## Supabase Integration

### 1. Query Pattern

**Pattern:** Use consistent field selection with query constants

```javascript
// lib/queries.js
export const GAP_QUERY_FIELDS = `
  *,
  capability:capabilities(id, name),
  service:services(id, name),
  business_responsible:users!business_responsible_id(id, email, full_name),
  gap_actions(
    solution:solutions(id, name, status)
  )
`;

// Usage in component
const { data: gaps, error } = await supabase
  .from('gaps')
  .select(GAP_QUERY_FIELDS)
  .eq('capability_id', capabilityId)
  .is('deleted_at', null);
```

---

### 2. Error Handling

**Pattern:** Always handle Supabase errors gracefully

```jsx
async function createGap(gapData) {
  try {
    const { data, error } = await supabase
      .from('gaps')
      .insert(gapData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);

      // User-friendly error messages
      if (error.code === '23505') {
        alert('A gap with this title already exists');
      } else if (error.code === '23503') {
        alert('Invalid reference - related record not found');
      } else {
        alert('Failed to create gap. Please try again.');
      }
      return null;
    }

    alert('Gap created successfully');
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred');
    return null;
  }
}
```

---

### 3. Soft Delete Pattern

**Pattern:** Always filter out soft-deleted records

```jsx
// ✅ GOOD: Filter deleted records
const { data } = await supabase
  .from('gaps')
  .select('*')
  .eq('capability_id', capId)
  .is('deleted_at', null); // Critical filter

// ❌ BAD: Missing soft-delete filter
const { data } = await supabase
  .from('gaps')
  .select('*')
  .eq('capability_id', capId);
```

---

### 4. Optimistic Updates

**Pattern:** Update UI immediately, then sync with database

```jsx
async function toggleGapStatus(gapId) {
  // Optimistic update
  setGaps(gaps.map(gap =>
    gap.id === gapId
      ? { ...gap, status: 'Resolved' }
      : gap
  ));

  // Sync with database
  const { error } = await supabase
    .from('gaps')
    .update({ status: 'Resolved' })
    .eq('id', gapId);

  if (error) {
    // Revert on error
    alert('Failed to update status');
    fetchGaps(); // Re-fetch from database
  }
}
```

---

## Performance Optimization

### 1. Memoization

**Pattern:** Use useMemo for expensive calculations

```jsx
// ✅ GOOD: Memoize expensive computation
const prioritizedGaps = useMemo(() => {
  return gaps
    .filter(gap => gap.status !== 'Resolved')
    .sort((a, b) => b.priority_score - a.priority_score);
}, [gaps]);

// ❌ BAD: Recalculate on every render
const prioritizedGaps = gaps
  .filter(gap => gap.status !== 'Resolved')
  .sort((a, b) => b.priority_score - a.priority_score);
```

---

### 2. useCallback

**Pattern:** Use useCallback for event handlers passed as props

```jsx
// ✅ GOOD: Memoized callback
const handleDelete = useCallback((gapId) => {
  deleteGap(gapId);
}, [deleteGap]);

<GapCard gap={gap} onDelete={handleDelete} />

// ❌ BAD: New function on every render
<GapCard gap={gap} onDelete={(gapId) => deleteGap(gapId)} />
```

---

### 3. Lazy Loading

**Pattern:** Lazy load heavy components

```jsx
// ✅ GOOD: Lazy loaded route
const GapDetailPage = lazy(() => import('./pages/GapDetailPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/gaps/:id" element={<GapDetailPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

### 4. Debounce Search Input

**Pattern:** Debounce user input to reduce API calls

```jsx
import { useDebouncedCallback } from 'use-debounce';

function SearchBar({ onSearch }) {
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      onSearch(value);
    },
    300 // 300ms delay
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Code Organization

### 1. Consistent Imports

**Pattern:** Group imports logically

```jsx
// ✅ GOOD: Organized imports
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';

// 2. Internal modules
import { supabase } from '../lib/supabase';
import { GAP_QUERY_FIELDS } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';

// 3. Components
import Card from '../components/ui/Card';
import Dialog from '../components/ui/Dialog';

// 4. Styles
import { typography } from '../styles/designSystem';
```

---

### 2. Constants Definition

**Pattern:** Define constants at module level

```jsx
// ✅ GOOD: Constants defined at top
const STATUS_OPTIONS = ['Identified', 'Validated', 'Approved', 'InProgress', 'Resolved'];

const STATUS_COLORS = {
  'Identified': 'bg-slate-500/20 text-slate-400',
  'Approved': 'bg-blue-500/20 text-blue-400',
  'Resolved': 'bg-emerald-500/20 text-emerald-400',
};

function GapCard({ gap }) {
  return (
    <span className={STATUS_COLORS[gap.status]}>
      {gap.status}
    </span>
  );
}

// ❌ BAD: Defining objects inside component (creates new object on every render)
function GapCard({ gap }) {
  const statusColors = {
    'Identified': 'bg-slate-500/20 text-slate-400',
    // ...
  };
  return <span className={statusColors[gap.status]}>{gap.status}</span>;
}
```

---

### 3. Conditional Rendering

**Pattern:** Use early returns for clarity

```jsx
// ✅ GOOD: Early returns
function GapList({ gaps, loading, error }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (gaps.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {gaps.map(gap => <GapCard key={gap.id} gap={gap} />)}
    </div>
  );
}

// ❌ BAD: Nested ternaries
function GapList({ gaps, loading, error }) {
  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : gaps.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {gaps.map(gap => <GapCard key={gap.id} gap={gap} />)}
        </div>
      )}
    </>
  );
}
```

---

## Form Handling

### 1. Controlled Components

**Pattern:** Use controlled components for forms

```jsx
function AddGapForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Identified',
    estimated_effort: 'Medium',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || formData.title.length < 3) {
      alert('Title must be at least 3 characters');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Gap title"
      />

      <select
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        <option value="Identified">Identified</option>
        <option value="Approved">Approved</option>
      </select>

      <button type="submit">Create Gap</button>
    </form>
  );
}
```

---

### 2. Form Validation

**Pattern:** Validate before submission

```jsx
function validateGapForm(formData) {
  const errors = [];

  if (!formData.title) {
    errors.push('Title is required');
  }

  if (formData.title && formData.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!formData.capability_id) {
    errors.push('Capability is required');
  }

  return errors;
}

// Usage
const errors = validateGapForm(formData);
if (errors.length > 0) {
  alert(errors.join('\n'));
  return;
}
```

---

## Navigation

### 1. React Router Patterns

**Pattern:** Use useNavigate for programmatic navigation

```jsx
import { useNavigate } from 'react-router-dom';

function GapCard({ gap }) {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/gaps/${gap.id}`)}>
      <h3>{gap.title}</h3>
    </div>
  );
}
```

---

### 2. URL State Management

**Pattern:** Use URL params for shareable state

```jsx
// ✅ GOOD: Status filter in URL
function GapManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const handleFilterChange = (status) => {
    setSearchParams({ status });
  };

  return (
    <div>
      <select value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
        <option value="all">All</option>
        <option value="Approved">Approved</option>
      </select>
    </div>
  );
}
```

---

## Error Boundaries

### Pattern: Catch React errors gracefully

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-rose-600 mb-4">
            Something went wrong
          </h2>
          <p className="text-slate-400 mb-4">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.jsx
<ErrorBoundary>
  <Routes>
    {/* Routes */}
  </Routes>
</ErrorBoundary>
```

---

## Testing

### 1. Component Testing

**Pattern:** Test user interactions, not implementation details

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import GapCard from './GapCard';

test('calls onDelete when delete button is clicked', () => {
  const mockDelete = jest.fn();
  const gap = { id: '1', title: 'Test Gap', status: 'Identified' };

  render(<GapCard gap={gap} onDelete={mockDelete} />);

  const deleteButton = screen.getByLabelText('Delete');
  fireEvent.click(deleteButton);

  expect(mockDelete).toHaveBeenCalledWith('1');
});
```

---

### 2. Integration Testing

**Pattern:** Test complete user flows

```jsx
test('creates a new gap successfully', async () => {
  render(<AddGapDialog capabilityId="cap-1" onClose={mockClose} />);

  // Fill form
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'New Gap' },
  });

  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Gap description' },
  });

  // Submit
  fireEvent.click(screen.getByText('Create Gap'));

  // Wait for success
  await waitFor(() => {
    expect(screen.getByText('Gap created successfully')).toBeInTheDocument();
  });

  expect(mockClose).toHaveBeenCalled();
});
```

---

## Common Pitfalls to Avoid

❌ **Don't:**
- Mutate state directly (`gaps.push(newGap)` - use `setGaps([...gaps, newGap])`)
- Forget soft-delete filters in queries
- Use inline styles (use Tailwind classes)
- Create functions inside render (causes re-renders)
- Ignore Supabase errors
- Use `any` as prop type (be specific)
- Mix controlled and uncontrolled inputs
- Forget loading/error states

✅ **Do:**
- Use immutable state updates
- Always filter `deleted_at IS NULL`
- Use Tailwind utility classes
- Define constants outside components
- Handle errors gracefully
- Use TypeScript (optional but recommended)
- Use controlled components consistently
- Show loading/error feedback to users

---

## Code Review Checklist

Before submitting code:

- [ ] All Supabase queries include `.is('deleted_at', null)`
- [ ] Error handling implemented for async operations
- [ ] Loading states visible to users
- [ ] useEffect dependencies correct
- [ ] No console.log statements (use proper error logging)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Component follows existing patterns
- [ ] No hardcoded values (use constants)
- [ ] Accessibility attributes added (aria-label, etc.)
- [ ] Performance optimizations applied (useMemo, useCallback where needed)
