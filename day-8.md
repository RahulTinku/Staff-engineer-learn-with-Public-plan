# JavaScript Deep Dive — Custom Hooks & Composition Patterns
**Date:** March 15, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What is a Custom Hook — and what separates it from a utility function?

**The one thing that separates them:**

> A custom hook **can call other hooks inside it.** A regular utility function cannot.

```javascript 
// ❌ regular utility function — cannot use hooks
function fetchData(url) {
  const [data, setData] = useState(null); // ILLEGAL — Rules of Hooks violated
  return data;
}

// ✅ custom hook — can use hooks freely
function useFetchData(url) {
  const [data, setData] = useState(null); // legal
  return data;
}
```

The `use` prefix tells React — and the linter — that this function follows hook rules.

---

### What custom hooks share vs what they don't

> Custom hooks share **logic** — not state.

```jsx
// Both components call useFetch('/api/config')
// They each get their OWN independent state
// Two separate fetch calls — not one shared one

const ComponentA = () => {
  const { data } = useFetch('/api/config'); // own state instance
};

const ComponentB = () => {
  const { data } = useFetch('/api/config'); // completely separate state
};
```

If teams want **shared state** → Context or state manager.
Custom hooks = shared logic. Not shared state.

---

### Where state lives in a custom hook

State always lives on the **calling component's Fiber node.**
The hook has no Fiber of its own.

```
ComponentA Fiber memoizedState:
  slot 0 → useState (loading) ← from useFetch
  slot 1 → useState (error)   ← from useFetch
  slot 2 → useState (data)    ← from useFetch
  slot 3 → useEffect          ← from useFetch
```

---

## Q2. useFetch — production-grade implementation

```javascript
import { useState, useEffect } from 'react';

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ define async inside — never make effect itself async
    // async effects return Promise — breaks cleanup mechanism
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // reset error on new fetch

        const res = await fetch(url, {
          signal: controller.signal // ✅ ties fetch to AbortController
        });

        // ✅ from Topic 4 — fetch doesn't throw on 4xx/5xx
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const json = await res.json(); // ✅ always await res.json()

        setData(json);
        setLoading(false);

      } catch (err) {
        // ✅ AbortError is expected on cleanup — not a real error
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
        // ✅ never re-throw from custom hook — expose via error state
      }
    };

    // ✅ AbortController — actually cancels the network request
    const controller = new AbortController();
    fetchData();

    // ✅ cleanup — cancels in-flight request on url change or unmount
    return () => controller.abort();

  }, [url]); // ✅ re-fetches when url changes

  return { data, loading, error };
};
```

---

### Why stale response cancellation matters

```
fetch('/api/v1') → slow, takes 500ms
fetch('/api/v2') → fast, takes 100ms

Without cancellation:
v2 resolves first → setData(v2data)
v1 resolves later → setData(v1data) ← overwrites! Wrong data shown

With AbortController:
url changes → cleanup runs → controller.abort()
v1 fetch cancelled → AbortError caught → ignored ✅
```

### cancelled flag alternative (simpler):
```javascript
let cancelled = false;
fetchData(); // inside fetchData: if(!cancelled) setData(json)
return () => { cancelled = true; };
```

### AbortController vs cancelled flag:

| | cancelled flag | AbortController |
|---|---|---|
| Cancels network request | ❌ No | ✅ Yes |
| Prevents state update | ✅ Yes | ✅ Yes |
| Production recommendation | Simple cases | Always preferred |

---

### How teams use useFetch:
```jsx
const ProductList = () => {
  const { data, loading, error } = useFetch('/api/products');

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <List items={data} />;
};
```

---

## Q3. useDebounce — implementation from scratch

**What debouncing is:**
> Wait until the user has stopped changing a value for X milliseconds before acting on it.

**Where it matters in platform work:**
- Search inputs — don't fire on every keystroke
- Filter/sort controls — wait until user finishes selecting
- Auto-save forms — wait until user stops typing
- Window resize handlers — don't recalculate on every pixel
- API-backed dropdowns — wait before fetching suggestions

```javascript
import { useState, useEffect } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // set timer to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // ✅ cleanup — THIS IS what makes it debounce
    // each value change clears previous timer and starts fresh
    return () => clearTimeout(timer);

  }, [value, delay]); // ✅ both in deps

  return debouncedValue;
};
```

---

### How cleanup creates the debounce effect:

```
User types 'w'    → timer starts (500ms)
User types 'wa'   → cleanup clears timer → new timer (500ms)
User types 'wal'  → cleanup clears timer → new timer (500ms)
User types 'walm' → cleanup clears timer → new timer (500ms)
User stops...
500ms passes      → setDebouncedValue('walm') → API fires ✅

Without cleanup:
'w'   → fires API after 500ms
'wa'  → fires API after 500ms
'wal' → fires API after 500ms
// 3 unnecessary API calls
```

> The cleanup function is not just good practice — **it IS the debounce mechanism.**

---

### useFetch + useDebounce composing together:

```jsx
const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // only updates 500ms after user stops typing
  const debouncedSearch = useDebounce(searchTerm, 500);

  // only fires when debouncedSearch changes
  const { data, loading, error } = useFetch(
    `/api/products?search=${debouncedSearch}`
  );

  return (
    <>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {data && <ProductList items={data} />}
    </>
  );
};
```

Each hook does one thing. They compose cleanly. This is the power of custom hooks.

---

## Q4. Compound Components Pattern

### The problem — props blob

Every new team requirement adds a new prop:
```jsx
// ❌ unmaintainable props blob
<Select
  options={options}
  onSelect={handleSelect}
  isDisabled={false}
  isSearchable={true}
  renderOption={...}
  triggerIcon={...}
  triggerLabel="Choose"
  maxHeight={300}
  placeholder="..."
/>
```

Adding one requirement = touching internals. Cannot predict every use case.

---

### The solution — compound components

```jsx
// ✅ family of components that compose freely
<Select>
  <Select.Trigger>Choose option</Select.Trigger>
  <Select.Options>
    <Select.Option value="a">Option A</Select.Option>
    <Select.Option value="b">Option B</Select.Option>
  </Select.Options>
</Select>
```

---

### Full implementation — Context powers shared state:

```jsx
import { createContext, useContext, useState } from 'react';

// Step 1 — shared state context
const SelectContext = createContext(null);

// Step 2 — parent owns state
const Select = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  return (
    <SelectContext.Provider value={{
      isOpen, setIsOpen,
      selectedValue, setSelectedValue
    }}>
      <div className="select-container">{children}</div>
    </SelectContext.Provider>
  );
};

// Step 3 — custom hook with error boundary
const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error(
      'Select sub-components must be used inside <Select>.\n' +
      'Did you forget to wrap with <Select>?'
    );
  }
  return context;
};

// Step 4 — sub-components read from context
Select.Trigger = ({ children }) => {
  const { isOpen, setIsOpen, selectedValue } = useSelect();
  return (
    <button onClick={() => setIsOpen(!isOpen)}>
      {selectedValue || children}
      <span>{isOpen ? '▲' : '▼'}</span>
    </button>
  );
};

Select.Options = ({ children }) => {
  const { isOpen } = useSelect();
  if (!isOpen) return null;
  return <ul className="select-options">{children}</ul>;
};

Select.Option = ({ value, children }) => {
  const { setSelectedValue, setIsOpen, selectedValue } = useSelect();
  return (
    <li
      onClick={() => { setSelectedValue(value); setIsOpen(false); }}
      className={selectedValue === value ? 'selected' : ''}
    >
      {children}
    </li>
  );
};
```

---

### Flexibility teams get for free:

```jsx
// Custom trigger with icon — zero changes to Select internals
<Select>
  <Select.Trigger>
    <SearchIcon /> Choose product
  </Select.Trigger>
  <Select.Options>
    <Select.Option value="p1">Product 1</Select.Option>
  </Select.Options>
</Select>

// Custom option rendering — zero changes to Select internals
<Select>
  <Select.Trigger>Choose</Select.Trigger>
  <Select.Options>
    {products.map(p => (
      <Select.Option key={p.id} value={p.id}>
        <img src={p.image} />
        <span>{p.name}</span>
        <Badge>{p.category}</Badge>
      </Select.Option>
    ))}
  </Select.Options>
</Select>
```

---

### Props Blob vs Compound Components:

| | Props Blob | Compound Components |
|---|---|---|
| Simple predictable usage | ✅ Great | ⚠️ Overkill |
| Flexible team-customized UI | ❌ Prop explosion | ✅ Perfect |
| Design system components | ❌ Unmaintainable | ✅ Industry standard |
| Extensibility | ❌ Touch internals | ✅ Compose externally |

**For platform design systems — compound components every time.**

---

## Q5. Context vs Props vs State Management

### Prop drilling — when it's fine and when it's not

```
✅ Fine:
- 1-2 levels deep
- Middle layers transform or use the data
- Data flows naturally through component tree

❌ Problem:
- 3+ levels of blind pass-through
- Components receive props they never use
- One layer forgetting to pass breaks everything
```

---

### Context performance problem

> Every component calling `useContext(MyContext)` re-renders whenever **ANY** value in that context changes — even if it only uses one property that didn't change.

```jsx
// ❌ one big context — everything re-renders on any change
const AppContext = createContext();
// value={{ user, theme, notifications }}

// Header only uses theme
// User logs in → user changes → Header re-renders unnecessarily

// ✅ split contexts by concern
const UserContext = createContext();        // changes on login
const ThemeContext = createContext();       // rarely changes
const NotificationContext = createContext(); // changes frequently

// Header subscribes to ThemeContext only
// User login doesn't cause Header to re-render
```

---

### Decision framework — when to use each:

```
Props (1-2 levels)
→ Simple, explicit, easy to trace
→ Use: data flows naturally, middle layers use it
→ Stop: passing through components that don't need it

Context
→ Use: 3+ levels, widely shared, slowly changing data
→ Best for: theme, locale, auth state, feature flags
→ Avoid: frequently updating data (cart, filters, search)
→ Split by concern — never one giant context

External State (Redux/Zustand/Jotai)
→ Use: complex update logic, frequent updates, cross-cutting concerns
→ Best for: cart, real-time data, complex forms
→ Bonus: fine-grained subscriptions — only re-renders for used data

Server State (React Query / SWR)
→ Use: API data — caching, refetching, stale data
→ Don't use Context or Redux for API responses
→ React Query is purpose-built for server state
```

---

## Q6. Notification System — everything combined

```jsx
import {
  createContext, useContext,
  useState, useEffect, useCallback
} from 'react';

// ── Context ───────────────────────────────────────────────────────
const NotificationContext = createContext(null);

// ── Provider — owns all notification state ────────────────────────
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // notify — teams call this, not setNotifications directly
  const notify = useCallback((message, type = 'info') => {
    const id = Date.now(); // unique ID per notification
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  // dismiss — remove by ID
  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      {/* overlay lives inside provider — always rendered */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
      />
    </NotificationContext.Provider>
  );
};

// ── Custom hook — teams use this ──────────────────────────────────
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used inside <NotificationProvider>.\n' +
      'Wrap your app root with <NotificationProvider>.'
    );
  }
  return context;
};

// ── Individual notification — owns its own auto-dismiss timer ─────
const NotificationItem = ({ notification, onDismiss }) => {
  const { id, message, type } = notification;

  useEffect(() => {
    // each notification manages its own 3s countdown
    const timer = setTimeout(() => onDismiss(id), 3000);
    // cleanup — if manually dismissed before 3s, clear timer
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const styles = {
    info:    { background: '#1a1a2e', border: '1px solid #64B5F6' },
    success: { background: '#0a2422', border: '1px solid #00FF9D' },
    error:   { background: '#2a0a0a', border: '1px solid #FF6B6B' },
    warning: { background: '#1a1400', border: '1px solid #FFD166' },
  };

  return (
    <div style={{
      ...styles[type],
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      color: '#E2E2F0',
      display: 'flex',
      justifyContent: 'space-between',
      minWidth: '300px',
    }}>
      <span>{message}</span>
      <button onClick={() => onDismiss(id)}>✕</button>
    </div>
  );
};

// ── Container — renders stacked notifications ─────────────────────
const NotificationContainer = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
      {notifications.map(n => (
        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
```

---

### How teams use it — minimal boilerplate:

```jsx
// App root — wrap once
const App = () => (
  <NotificationProvider>
    <Router><YourApp /></Router>
  </NotificationProvider>
);

// Any component anywhere
const ConfigLoader = () => {
  const { notify } = useNotification();

  const loadConfig = async () => {
    try {
      await fetchConfig();
      notify('Config loaded successfully', 'success');
    } catch (err) {
      notify('Config failed to load', 'error');
    }
  };

  return <button onClick={loadConfig}>Load Config</button>;
};
```

---

### Architecture decisions explained:

**Why notify is a function not exposed state:**
```jsx
// ❌ exposing setter — teams manipulate state incorrectly
value={{ notifications, setNotifications }}

// ✅ exposing function — clean controlled API
value={{ notify, dismiss }}
notify('message', 'success'); // teams call this
```

**Why auto-dismiss lives in NotificationItem not Provider:**
```
Each notification manages its own timer independently.
Adding new notification doesn't reset existing timers.
Dismissing one doesn't affect others.
```

**Full data flow:**
```
notify('Config loaded', 'success') called
    ↓
adds { id: 123, message, type } to notifications array
    ↓
NotificationContainer renders new NotificationItem
    ↓
NotificationItem mounts → useEffect starts 3s timer
    ↓
3 seconds → timer fires → dismiss(123) called
    ↓
filters out id 123 → NotificationItem unmounts
    ↓
useEffect cleanup → clearTimeout (belt and suspenders)
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Custom hook vs utility | Custom hook can call other hooks — utility cannot |
| Custom hooks share | Logic — not state. Each call = independent state |
| State location | Always on calling component's Fiber — never on hook |
| useFetch | Never async effect — define async inside. Always AbortController |
| useDebounce | Cleanup IS the debounce — clears timer on every value change |
| Compound components | Family of components sharing state via Context |
| Compound components use | Design systems — flexibility without props blob |
| Context performance | All consumers re-render on any value change — split by concern |
| Props | 1-2 levels, natural flow, middle layers use data |
| Context | 3+ levels, slowly changing — theme, auth, locale |
| State manager | Complex logic, frequent updates, cross-cutting concerns |
| Server state | React Query / SWR — not Context or Redux for API data |
| notify vs setNotifications | Always expose controlled functions — not raw state setters |
| Auto-dismiss in item | Each notification owns its timer — independent, no interference |

---

## Three Things to Drill

```jsx
// 1. async inside useEffect — never make effect async directly
useEffect(() => {
  const run = async () => { await something(); };
  run();
  return () => cleanup();
}, [deps]);

// 2. AbortController — cancel stale fetch requests
const controller = new AbortController();
fetch(url, { signal: controller.signal });
return () => controller.abort();

// 3. Split Context by concern — never one giant context
const ThemeContext = createContext();       // rarely changes
const UserContext = createContext();        // changes on login
const CartContext = createContext();        // changes frequently
```

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
