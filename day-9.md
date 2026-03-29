# JavaScript Deep Dive — React Performance
**Date:** March 17, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. Measure First — Never Guess

**The most important performance principle:** 

> **Measure first. Never guess.**

```
❌ Wrong approach:
"This feels slow" → add useMemo → add useCallback → split bundles
→ app more complex but no faster
→ optimized the wrong thing

✅ Right approach:
"This feels slow" → measure → find bottleneck → fix that specific thing
→ measure again → verify improvement → repeat
```

**The systematic order:**
```
1. Reproduce the problem reliably
2. Measure — find where time is actually spent
3. Identify the bottleneck category
4. Fix only that bottleneck
5. Measure again — verify improvement
```

---

## Q2. Chrome DevTools — Performance Tab vs React Profiler

### Chrome DevTools Performance Tab
- Records **everything** the browser does — JS, rendering, painting, layout, network
- Shows **flame chart** of entire browser pipeline
- Use when: slow page load, janky interactions, dropped animation frames
- Answers: **"Where is the browser spending time overall?"**

```
What you see:
- Long Tasks (red bars)  → JS blocking main thread >50ms
- Layout/Paint bars      → rendering pipeline costs
- Network waterfall      → resource loading timing
- FPS chart              → dropped frames
```

### React DevTools Profiler Tab
- Records only **React's rendering work**
- Shows which components rendered, how long, and WHY
- Use when: UI slow after interactions, unnecessary re-renders suspected
- Answers: **"Which React components are slow and why?"**

```
What you see:
- Component render times
- Why each component re-rendered (prop/state/parent change)
- Flame chart of component tree
- Ranked chart — slowest components first
```

### When to use which:
```
Page load slow?           → Chrome Performance tab
Interaction feels laggy?  → Chrome Performance tab first,
                            then React Profiler for slow components
List scrolling janky?     → Chrome Performance tab (layout thrashing)
Button click feels slow?  → React Profiler (unnecessary re-renders)
```

---

## Q3. Three Categories of React Performance Problems

### Category 1 — Too much JavaScript (Bundle size)
```
Problem:  Too much JS downloaded and parsed on load
Symptoms: Slow initial load, high TTI (Time to Interactive)
Tools:    Lighthouse, webpack-bundle-analyzer
Fix:      Code splitting, React.lazy, tree shaking, dynamic imports
```

### Category 2 — Too much rendering (React re-renders)
```
Problem:  Components re-rendering unnecessarily
Symptoms: Interactions feel slow, UI lag after state changes
Tools:    React DevTools Profiler
Fix:      React.memo, useMemo, useCallback, state colocation
```

### Category 3 — Too much browser work (Layout/Paint)
```
Problem:  Browser doing expensive layout recalculations
Symptoms: Janky scrolling, dropped frames, slow animations
Tools:    Chrome Performance tab — look for purple/green bars
Fix:      CSS transforms, virtualisation, avoiding layout thrashing
```

### Why fixing one can make another worse:
```
Category 1 fix — code splitting
→ More network requests on navigation
→ Layout shifts as chunks load

Category 2 fix — React.memo everywhere
→ Every render does shallow comparison
→ Objects/functions without useMemo/useCallback → comparison always fails
→ More complex app, zero performance gain

Category 3 fix — reading DOM in loops
→ Forces layout recalculation on every read
→ Layout thrashing — worse than doing nothing
```

> Profile first → identify category → apply right fix → measure again.

---

## Q4. useMemo vs useCallback — When They Help vs Hurt

### When justified vs premature:

```jsx
// ✅ Scenario A — JUSTIFIED
// sorting is O(n log n) — genuinely expensive
const sorted = useMemo(() =>
  [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ❌ Scenario B — PREMATURE OPTIMIZATION
// string concatenation is trivial — useMemo is pure overhead
const label = useMemo(() => `User: ${userId}`, [userId]);

// ❌ Scenario C — PREMATURE (without React.memo on child)
// useCallback on function passed to native element = useless
const handleClick = useCallback(() => onSubmit(), [onSubmit]);
return <button onClick={handleClick}>Submit</button>;
// button is native — not wrapped in React.memo
// re-renders anyway — useCallback does nothing

// ✅ Scenario C — JUSTIFIED (with React.memo on child)
const handleClick = useCallback(() => onSubmit(), [onSubmit]);
return <ChildButton onClick={handleClick} />; // memo'd child
```

### The cost of useMemo itself:
- Storing memoized value in memory
- Running dependency comparison (`Object.is()`) on **every render**
- The comparison has a cost even when deps haven't changed

### The complete rule:

```
useMemo is worth it when:
✅ Computation is genuinely expensive (sort, filter large arrays)
✅ Result passed to React.memo child as prop
✅ Result is dependency of another useMemo/useCallback

useMemo is premature when:
❌ Computation is trivial (string concat, simple math)
❌ Result not passed to memoized children
❌ Component rarely re-renders anyway

useCallback is worth it when:
✅ Function passed as prop to React.memo child
✅ Function is a dependency of useEffect

useCallback is premature when:
❌ Function passed to native elements (div, button)
❌ Child not wrapped in React.memo
❌ Function not in any dependency array
```

**The one question to ask:**
> Is this computation expensive enough that the memoization cost is worth it? Is the result going to a memoized child or a useEffect dependency?

---

## Q5. React.lazy and Suspense — Code Splitting

### What code splitting does to your bundle:
```
Without code splitting:
app.bundle.js → 2MB → browser downloads all 2MB before app starts

With code splitting:
main.bundle.js     → 200KB → downloaded immediately
dashboard.chunk.js → 400KB → downloaded when /dashboard visited
analytics.chunk.js → 600KB → downloaded when /analytics visited

User visits dashboard → downloads 200KB + 400KB = 600KB total
Never visits analytics → never downloads that 600KB
```

### Exact moment the chunk downloads:
> The chunk downloads the **first time React tries to render that component** — not when the route is defined, not when the app loads.

```
User visits /analytics first time
    ↓
React tries to render <Analytics />
    ↓
React.lazy fires dynamic import()
    ↓
Browser downloads analytics.chunk.js
    ↓
During download — component throws a Promise (Suspense catches this)
    ↓
Suspense renders fallback UI
    ↓
Chunk finishes → React renders <Analytics />
```

### Correct implementation:

```jsx
import { lazy, Suspense } from 'react';

// ✅ lazy at TOP LEVEL — wraps dynamic import, not static import
const Dashboard  = lazy(() => import('./Dashboard'));
const Analytics  = lazy(() => import('./Analytics'));
const Settings   = lazy(() => import('./Settings'));
const AdminPanel = lazy(() => import('./AdminPanel'));

const App = () => {
  const { role } = useUser();

  return (
    <Router>
      {/* ✅ Suspense wraps lazy routes — provides fallback during load */}
      <Suspense fallback={<PageSpinner />}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings"  component={Settings} />

        {/* ✅ admin chunk never downloaded by non-admins */}
        {role === 'admin' && (
          <Route path="/admin" component={AdminPanel} />
        )}
      </Suspense>
    </Router>
  );
};
```

### Staff level enhancements:

```jsx
// Named chunks — easier debugging in DevTools
const Analytics = lazy(() =>
  import(/* webpackChunkName: "analytics" */ './Analytics')
);

// Preload on hover — feels instant when clicked
const preloadDashboard = () => import('./Dashboard');
<NavLink to="/dashboard" onMouseEnter={preloadDashboard}>
  Dashboard
</NavLink>
```

---

## Q6. Virtualisation — react-window

### Why 10,000 DOM nodes destroys performance:

**Reason 1 — Initial render cost:**
```
React creates 10,000 Fiber nodes
Browser calculates layout for all 10,000
Browser paints all 10,000 to screen
→ 500ms-2s on mid-range devices
→ Main thread blocked → UI completely frozen
```

**Reason 2 — Memory and ongoing cost:**
```
10,000 DOM nodes sit in memory permanently
Each node: styles, event listeners, Fiber node
Scrolling causes browser to check all 10,000 for visibility
→ Janky scroll — browser doing work for invisible elements
```

### What virtualisation does:
> Renders only items **visible in the viewport** plus a small buffer. Items leaving the viewport are recycled for items entering it.

```
10,000 items total → ~20 DOM nodes at any time
Scroll down → top items removed → bottom items added
Same ~20 nodes recycled continuously
```

### react-window implementation:

```jsx
import { FixedSizeList } from 'react-window';
import { memo, useMemo } from 'react';
import { areEqual } from 'react-window';

// ✅ memo prevents row re-renders when parent updates
const Row = memo(({ index, style, data }) => {
  const product = data.products[index];
  return (
    // ✅ style MUST be applied — react-window uses it
    // to absolutely position each row
    <div style={style}>
      <ProductItem product={product} />
    </div>
  );
}, areEqual);

const ProductListFast = ({ products }) => {
  // ✅ stable reference — prevents Row re-renders
  const itemData = useMemo(() => ({ products }), [products]);

  return (
    <FixedSizeList
      height={600}               // visible container height
      width="100%"
      itemCount={products.length} // total — 10,000
      itemSize={80}              // each row height px
      itemData={itemData}        // passed to each Row via data prop
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Why style must be applied:
```
react-window uses absolute positioning per row:
style = { position: 'absolute', top: 0 }    // row 0
style = { position: 'absolute', top: 80 }   // row 1
style = { position: 'absolute', top: 160 }  // row 2

Container: position: relative + total height (10,000 * 80 = 800,000px)
This creates the scrollbar representing all 10,000 items
Without style → all rows render at position 0 → broken layout
```

### FixedSizeList vs VariableSizeList:
```jsx
// FixedSizeList — all rows same height
// Use for: product lists, user lists, log entries
<FixedSizeList itemSize={80}>

// VariableSizeList — rows have different heights
// Use for: chat messages, comment threads, dynamic content
<VariableSizeList itemSize={index => itemHeights[index]}>
```

### Performance comparison:
```
Without virtualisation (10,000 items):
Initial render:  ~1200ms  |  Memory: ~180MB  |  Scroll: ~15fps

With react-window:
Initial render:  ~16ms    |  Memory: ~8MB    |  Scroll: ~60fps
DOM nodes: ~20 (not 10,000)
```

---

## Q7. Layout Thrashing

### How the browser renders:
```
JavaScript runs → DOM changes recorded → Style calculation
→ Layout (reflow) → Paint → Composite → Screen
```

Layout is expensive — 10-50ms. Browser batches layout calculations — once per frame. But reading a layout property **forces immediate recalculation.**

### What layout thrashing is:
> Forcing the browser to recalculate layout repeatedly within a single frame by **interleaving reads and writes.**

### The problematic pattern:

```javascript
// ❌ read-write inside loop — layout thrashing
function resizePanels(panels) {
  panels.forEach(panel => {
    const height = panel.offsetHeight;           // READ → forced layout recalc
    panel.style.height = height * 1.2 + 'px';   // WRITE → invalidates layout
  });
}

// 5 panels = 5 forced layout recalculations = ~50ms
// 100 panels = 100 recalculations = ~1 second frozen UI
```

### The fix — separate all reads from all writes:

```javascript
// ✅ all reads first, then all writes
function resizePanels(panels) {
  // Phase 1 — read all values (1 layout calculation)
  const heights = panels.map(panel => panel.offsetHeight);

  // Phase 2 — write all values (1 layout calculation at end)
  panels.forEach((panel, i) => {
    panel.style.height = heights[i] * 1.2 + 'px';
  });
}
// 5 panels = 2 layout calculations total (not 5)
// 100 panels = still just 2
```

### Properties that trigger forced layout — memorize:
```javascript
element.offsetHeight    element.offsetWidth
element.offsetTop       element.offsetLeft
element.scrollHeight    element.scrollWidth
element.getBoundingClientRect()
window.scrollY          window.innerHeight
```

### The golden rule:
```
✅ READ → READ → READ → WRITE → WRITE → WRITE  (1 layout calculation)
❌ READ → WRITE → READ → WRITE → READ → WRITE  (N layout calculations)
```

### How to spot in Chrome DevTools:
```
Performance tab → record interaction
→ Look for many small purple bars (Layout/Reflow) repeating rapidly
→ Chrome warning: "Forced reflow is a likely performance bottleneck"
```

---

## Q8. Staff-Level Code Review — SearchPage (All 5 Bugs Fixed)

```jsx
import { useState, useEffect, useMemo, memo } from 'react';

// ── useDebounce ───────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced; // ✅ must return value
};

// ── ListItem — memoized ───────────────────────────────────────────
const ListItem = memo(({ name }) => { // ✅ destructure from props object
  return <li>{name}</li>;
});

// ── SearchPage ────────────────────────────────────────────────────
const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // ✅ Fix 1 — debounce at top level, not inside event handler
  const debouncedQuery = useDebounce(query, 300);

  // ✅ Fix 2 — fetch on debouncedQuery, not raw query
  // ✅ Fix 3 — AbortController cancels stale requests
  useEffect(() => {
    if (!debouncedQuery) return;

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/search?q=${debouncedQuery}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(err);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedQuery]);

  // ✅ Fix 4 — useMemo (not memo) + spread to avoid mutation + return
  const sorted = useMemo(() =>
    [...results].sort((a, b) => a.name.localeCompare(b.name)),
    [results]
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)} // ✅ just update raw query
      />
      <ul>
        {sorted.map(item => (
          <ListItem
            key={item.id}   // ✅ Fix 5 — stable key from data, not index
            name={item.name}
          />
        ))}
      </ul>
    </div>
  );
};
```

### All 5 problems — before and after:

| Problem | Before | After |
|---|---|---|
| API on every keystroke | `useEffect([query])` | `useDebounce` + `useEffect([debouncedQuery])` |
| Stale requests | No cleanup | `AbortController` + `controller.abort()` |
| Sort on every render | `results.sort()` inline | `useMemo(() => [...results].sort(), [results])` |
| Mutating state | `results.sort()` | `[...results].sort()` — spread first |
| Unstable keys | `key={index}` | `key={item.id}` |

### The mutation bug — extra attention:
```jsx
// ❌ sort() mutates array IN PLACE
results.sort((a, b) => a.name.localeCompare(b.name))
// results state directly modified
// React may not detect change (same reference)

// ✅ spread creates new array first
[...results].sort((a, b) => a.name.localeCompare(b.name))
// original results unchanged — immutability preserved
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| First step | Measure first — never optimize by intuition |
| Performance tab | Browser-level — JS, layout, paint, network |
| React Profiler | React-level — component renders, why they fired |
| Three categories | Bundle size / Re-renders / Browser work |
| useMemo justified | Expensive computation or passed to memo'd child |
| useMemo premature | Trivial computation, no memo'd children |
| useCallback justified | Passed to memo'd child or useEffect dependency |
| Code splitting | React.lazy + dynamic import at top level + Suspense |
| Suspense | Catches Promise thrown by lazy — renders fallback |
| Chunk download timing | First time React tries to render the component |
| Virtualisation | ~20 DOM nodes regardless of list size |
| style prop | Must apply in react-window — positions rows absolutely |
| Layout thrashing | Read-write interleaving forces N layout recalculations |
| Fix layout thrashing | All reads first, then all writes |
| Sort mutation | Always spread before sort: `[...arr].sort()` |
| useDebounce call site | Always top level — never inside handlers or JSX |

---

## Three Things to Drill

```jsx
// 1. React.lazy — dynamic import at top level
const Dashboard = lazy(() => import('./Dashboard'));
// NOT: const App = () => { const D = lazy(() => import('./D')) }

// 2. useMemo — spread before sort to avoid mutation
const sorted = useMemo(() =>
  [...results].sort((a, b) => a.name.localeCompare(b.name)),
  [results]
);

// 3. useDebounce — call at top level, use debounced value in effect
const debouncedQuery = useDebounce(query, 300);
useEffect(() => { fetch(`/api?q=${debouncedQuery}`) }, [debouncedQuery]);
// NOT: onChange={e => useDebounce(e.target.value, 300)}
```

---
<img width="1257" height="1258" alt="Screenshot 2026-03-17 at 9 59 45 PM" src="https://github.com/user-attachments/assets/caf4d394-d8de-48d0-899a-c5554afd4c98" />

*Part of daily JS deep dive series — Staff Engineer interview prep*
