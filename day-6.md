# JavaScript Deep Dive — React Rendering & Reconciliation
**Date:** March 13, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What is the Virtual DOM — and the biggest misconception about it

**What it is:**
The Virtual DOM is a **plain JavaScript object tree** that mirrors the real DOM structure. React creates a new Virtual DOM tree on every state change, diffs it against the previous tree, then applies only the minimum necessary changes to the real DOM.

```
State changes
    ↓
React renders → produces NEW Virtual DOM tree
    ↓
Diffing — new tree vs old tree (reconciliation)
    ↓
Minimum real DOM changes applied (commit phase)
```

**Why not update the real DOM directly:**
Real DOM operations are expensive — layout recalculations, repaints, reflows. Batching and minimizing these operations via Virtual DOM diffing is far more efficient than touching the real DOM on every change.

---

### The biggest misconception — Virtual DOM is NOT why React is fast

> ❌ "React is fast because of the Virtual DOM"

This is **wrong.** The Virtual DOM is actually extra work — creating a JS object tree on every render, diffing it, then updating the DOM is *more* work than a surgical direct DOM update.

> ✅ "React is fast because it **minimises expensive real DOM operations** by computing the minimum set of changes needed via Virtual DOM diffing"

The Virtual DOM is a **strategy** — not a performance feature in itself. A perfectly written vanilla JS app that surgically updates only what changed would be faster than React.

---

## Q2. Fiber — React's reconciler rewrite

### The problem with the old reconciler

The old React reconciler was **synchronous and unstoppable:**

```
User types in input
    ↓
State change triggers reconciliation
    ↓
React diffs entire component tree (could take 50-100ms)
    ↓ CANNOT BE PAUSED
Browser cannot process ANY other work
    ↓
User's keystrokes ignored — UI appears frozen then jumps
```

Browser runs on **16ms budget per frame (60fps).** If reconciliation takes 50ms → 3 dropped frames → visible jank.

---

### What Fiber changes — cooperative scheduling

Fiber rewrote reconciliation as a **linked list of units of work** — each unit being one component. React can now:

- Process **one Fiber node at a time**
- **Pause** after each node — check if browser needs control
- **Resume** where it left off
- **Prioritize** urgent updates (user typing) over non-urgent ones (background fetch)
- **Abandon and restart** work if something more important arrives

This is **cooperative scheduling** — React cooperates with the browser instead of blocking it.

---

### What a Fiber node is

A Fiber node is a **plain JavaScript object** representing one unit of work — one component instance:

```javascript
{
  type: 'div' | MyComponent | null,
  key: null | string,

  // Tree structure
  child: Fiber | null,      // first child
  sibling: Fiber | null,    // next sibling
  return: Fiber | null,     // parent

  // State
  pendingProps: {},
  memoizedProps: {},
  memoizedState: {},

  // Work to do
  effectTag: 'PLACEMENT' | 'UPDATE' | 'DELETION',

  // Two tree pointers
  alternate: Fiber | null   // pointer to old/new fiber
}
```

---

### Two trees React always maintains

```
Current Tree              workInProgress Tree
(what's on screen)        (what React is building)

    [App]            ←→       [App]
      ↓                          ↓
   [Header]         ←→       [Header]
      ↓                          ↓
    [Nav]            ←→        [Nav]
```

- **Current** — currently rendered on screen
- **workInProgress** — new tree being built during reconciliation
- Each Fiber node has `alternate` pointer connecting both versions
- When reconciliation finishes → workInProgress becomes current (**double buffering**)

---

### Two phases of Fiber reconciliation

```
Phase 1 — Render/Reconcile (INTERRUPTIBLE)
  → Build workInProgress tree
  → Diff old vs new
  → Mark changes as effectTags
  → Browser can reclaim control here

Phase 2 — Commit (SYNCHRONOUS — cannot pause)
  → Apply all DOM changes
  → Run useEffect cleanups and callbacks
  → Must finish in one go → DOM updates appear atomic
```

---

### Why this matters for platform work

React 18 concurrent features are all built on Fiber scheduling:
- `useTransition` → keeps UI responsive during heavy renders
- `useDeferredValue` → defers non-urgent updates
- `Suspense` → pauses rendering mid-tree

Without understanding Fiber you can't reason about these APIs.

---

## Q3. Reconciliation heuristics — how React achieves O(n) diffing

Naive tree diffing = **O(n³)** — for 1000 nodes = 1 billion operations. React uses two assumptions to bring this to **O(n).**

---

### Assumption 1 — Different types = different trees

If a node changes type — React **tears down the entire subtree** and rebuilds from scratch:

```jsx
// Before
<div><Counter /></div>

// After
<span><Counter /></span>  // type changed div → span
```

React destroys everything under `div` and rebuilds under `span`.
`Counter` is **unmounted and remounted** — loses all local state.

```jsx
// ❌ switching container type — Counter unmounts every time
function App() {
  return isLoggedIn
    ? <div><Dashboard /></div>
    : <section><Dashboard /></section>
}

// ✅ keep same type
function App() {
  return (
    <div>
      {isLoggedIn ? <Dashboard /> : <Login />}
    </div>
  );
}
```

---

### Assumption 2 — Keys identify stable elements across renders

Without keys React matches by **position:**

```jsx
// Before              After (new item added at top)
<li>Rahul</li> [0]    <li>NEW</li>   [0]
<li>John</li>  [1]    <li>Rahul</li> [1]
<li>Sara</li>  [2]    <li>John</li>  [2]
                      <li>Sara</li>  [3]
```

React compares position 0→0, 1→1, 2→2:
```
"Rahul" → "NEW"   UPDATE
"John"  → "Rahul" UPDATE
"Sara"  → "John"  UPDATE
nothing → "Sara"  CREATE
// 4 DOM operations for what should be 1 insertion
```

With stable keys — React matches by identity:
```
key "rahul" → same, no change
key "john"  → same, no change
key "sara"  → same, no change
key "new"   → CREATE
// 1 DOM operation ✅
```

---

### The one thing that breaks both assumptions — index as key

```jsx
// ❌ index as key — breaks reconciliation
{items.map((item, index) => (
  <ListItem key={index} item={item} />
))}
```

On add/remove/reorder — keys shift with positions:
- React thinks existing elements changed
- Components get wrong props
- Local state attaches to wrong components
- Input fields lose values
- Animations fire on wrong items

```jsx
// ✅ always use stable identity from data
{items.map(item => (
  <ListItem key={item.id} item={item} />
))}
```

> Keys are not for suppressing React warnings.
> **Keys are React's identity system for reconciliation.**

---

## Q4. React.memo — preventing unnecessary re-renders

```jsx
import { useState, memo } from 'react';

// Without memo — re-renders every time parent re-renders
const ChildComponent = (props) => {
  console.log('ChildComponent rendered');
  return <div>{props.name}</div>;
};

// ✅ With memo — skips re-render if props haven't changed
const ChildComponent = memo((props) => {
  console.log('ChildComponent rendered'); // only logs once now
  return <div>{props.name}</div>;
});

const ParentComponent = () => {
  const [counter, setCounter] = useState(0);

  return (
    <>
      <button onClick={() => setCounter(c => c + 1)}>Increment</button>
      <span>{counter}</span>
      <ChildComponent name="Rahul" /> {/* memo: "Rahul" === "Rahul" → skip */}
    </>
  );
};
```

**`React.memo` wraps the component DEFINITION — never the JSX instance.**

---

### Why React.memo breaks with objects and functions

`React.memo` does **shallow comparison** of props. For primitives this works. For objects and functions — every render creates a **new reference:**

```jsx
const ParentComponent = () => {
  // ❌ new object reference every render
  const config = { theme: 'dark' };

  // ❌ new function reference every render
  const handleClick = () => console.log('clicked');

  return <ChildComponent config={config} onClick={handleClick} />;
};
```

```
Render 1: config → reference 0x001
Render 2: config → reference 0x002
0x001 === 0x002 → FALSE → React.memo re-renders anyway
```

Values are identical — references are not. Shallow comparison fails.

---

### Two hooks that fix this

**`useMemo` — memoizes objects:**
```jsx
// ✅ same reference across renders
const config = useMemo(() => ({ theme: 'dark' }), []);
// only recreates if dependencies change
```

**`useCallback` — memoizes functions:**
```jsx
// ✅ same function reference across renders
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // empty deps — never recreates
```

---

### Memoization trinity:

| Tool | Memoizes | Use when |
|---|---|---|
| `React.memo` | Component render | Child receives same props — skip re-render |
| `useMemo` | Object/computed value | Expensive computation or object passed as prop |
| `useCallback` | Function | Function passed as prop to memoized child |

> `React.memo` without `useMemo`/`useCallback` for object/function props = **false sense of security.**

---

## Q5. Why mutating state directly breaks React

```jsx
const [user, setUser] = useState({ name: 'Rahul', age: 30 });

// ❌ direct mutation — React does NOT re-render
user.name = 'John';
setUser(user); // same reference → React sees no change

// ✅ new reference — React re-renders
setUser({ ...user, name: 'John' });
```

**Why React doesn't re-render on direct mutation:**

React uses **`Object.is()`** to compare old and new state:
```javascript
Object.is(user, user)   // true — same reference → no re-render
Object.is({...user}, user) // false — new reference → re-render
```

Direct mutation doesn't create a new reference. React's comparison returns `true` → no reconciliation triggered → Fiber node not marked for update → no DOM repaint.

**Connection to React.memo:**
Same principle — shallow comparison checks references, not values. Mutating directly = same reference = no update detected anywhere in React's system.

---

## Q6. Staff-level code review — all issues combined

```jsx
// ❌ problematic code
const ItemList = ({ searchTerm }) => {
  const [items, setItems] = useState(initialItems);

  const filtered = items.filter(item =>
    item.name.includes(searchTerm)
  );

  return (
    <ul>
      {filtered.map((item, index) => (
        <ListItem
          key={index}
          item={item}
          config={{ theme: 'dark' }}
          onSelect={() => setItems(prev =>
            prev.map(i => ({ ...i, selected: i.id === item.id }))
          )}
        />
      ))}
    </ul>
  );
};
```

**Four problems:**

1. `key={index}` → breaks reconciliation on reorder/insert/delete
2. `config={{ theme: 'dark' }}` → new object reference every render → memo fails
3. `onSelect={() => ...}` → new function reference every render → memo fails
4. `filter()` not memoized → recomputes over 500 items on every render

---

### ✅ Fully fixed version:

```jsx
import { useState, useMemo, useCallback, memo } from 'react';

// Wrap with memo — skips re-render if props unchanged
const ListItem = memo(({ item, config, onSelect }) => {
  console.log('ListItem rendered:', item.id);
  return (
    <li style={config} onClick={onSelect}>
      {item.name}
    </li>
  );
});

const ItemList = ({ searchTerm }) => {
  const [items, setItems] = useState(initialItems);

  // Fix 1 — memoize filtered result
  const filteredItems = useMemo(() =>
    items.filter(item => item.name.includes(searchTerm)),
    [items, searchTerm]
  );

  // Fix 2 — memoize config object
  const config = useMemo(() => ({ theme: 'dark' }), []);

  // Fix 3 — memoize onSelect function
  const onSelect = useCallback((itemId) => {
    setItems(prev =>
      prev.map(i => ({ ...i, selected: i.id === itemId }))
    );
  }, []);

  return (
    <ul>
      {filteredItems.map(item => (
        <ListItem
          key={item.id}                      // Fix 4 — stable key
          item={item}
          config={config}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </ul>
  );
};
```

---

## Golden Rules — memorize these

### Hooks must always be at top level:
```jsx
// ❌ illegal — hook inside JSX
<Child config={useMemo(() => {}, [])} />

// ❌ illegal — hook inside loop
items.map(item => {
  const cb = useCallback(() => {}, []); // NEVER
});

// ❌ illegal — hook inside condition
if (isLoggedIn) {
  const [state] = useState(0); // NEVER
}

// ✅ always at component top level
const MyComponent = () => {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  const handleClick = useCallback(() => {}, []);
  return <Child config={config} onClick={handleClick} />;
};
```

### Keys always from data:
```jsx
// ❌ never
key={index}

// ✅ always
key={item.id}
```

### Component syntax to memorize:
```jsx
// Arrow function component
const MyComponent = (props) => {
  return <div>{props.name}</div>;
};

// Props syntax
<MyComponent name="Rahul" count={42} config={{ theme: 'dark' }} />

// React.memo — wraps definition
const MyComponent = memo((props) => {
  return <div>{props.name}</div>;
});

// useCallback
const fn = useCallback(() => {}, [deps]);

// useMemo
const value = useMemo(() => ({ key: 'value' }), [deps]);
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Virtual DOM | JS object tree — strategy to minimize real DOM ops, not inherently fast |
| Fiber | Linked list of work units — pauseable, resumeable, prioritizable |
| Two trees | Current + workInProgress — double buffering |
| Two phases | Render (interruptible) → Commit (synchronous) |
| Reconciliation O(n) | Two assumptions: same type = reuse, keys = identity |
| Different type | Entire subtree torn down and rebuilt |
| Index as key | Breaks reconciliation — always use stable id from data |
| Keys | React's identity system — not just for warning suppression |
| React.memo | Shallow comparison — breaks with objects/functions |
| useMemo | Memoize objects and computed values |
| useCallback | Memoize functions |
| State mutation | Direct mutation = same reference = no re-render |
| Object.is() | How React compares old vs new state |
| Hooks rule | Always at top level — never in JSX, loops, or conditions |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
