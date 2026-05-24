# Staff Engineer Refresher Interview — All 10 Topics
### Date: March 19–20, 2026 | Candidate: Rahul Kumar

---

> **Format:** 20 questions, one at a time, Staff-level bar, no hints, honest feedback.
> **Result:** 5 Pass | 6 Partial | 7 Fail | 1 Skipped | 1 Not Studied

---

## Scorecard

| # | Topic | Verdict | Key Takeaway |
|---|---|---|---|
| 1 | Event Loop — `.then` chain scheduling | ❌ | `.then()` chains are lazy — second `.then` scheduled only after first completes |
| 2 | Closures — memory model | ✅ | Closures live on the heap, not the stack |
| 3 | `this` binding — arrow vs regular | ⚠️ | Arrow `this` = lexical scope, NOT the enclosing object |
| 4 | Async/await — what happens at `await` | ✅ | `await` suspends the function, returns control to caller |
| 5 | TypeScript `infer` | ✅ | `infer` = pattern matching variable in conditional types |
| 6 | useEffect cleanup lifecycle | ❌ | Cleanup runs BEFORE the new effect, NOT on initial mount |
| 7 | React keys — reconciliation | ⚠️ | Missing keys = incorrect DOM reuse + state leaks, not full repaint |
| 8 | Custom hook — useDebounce cleanup | ✅ | Without cleanup, old timeouts pile up and debounce is defeated |
| 9 | Performance debugging workflow | ❌ | Staff = systematic isolation, not "open DevTools and poke around" |
| 10 | Module Federation — remoteEntry.js | ⚠️ | remoteEntry.js = manifest file, NOT the actual code |
| 11 | Shallow copy — spread operator | ❌ | Primitives copied by value, objects copied by reference |
| 12 | Race condition in fetch | ⚠️ | The bug is a RACE CONDITION — name it precisely |
| 13 | Prototype chain — hasOwnProperty | ❌ | Methods live on prototype, not on instances |
| 14 | Promise.allSettled | ✅ | Status is `'fulfilled'`, NOT `'resolved'` |
| 15 | Shared hook code review | ❌ | Must check: deps, SSR, error handling, cross-tab sync, cleanup |
| 16 | React.memo — unstable props | ⚠️ | `useState` preserves references — functions are the problem |
| 17 | System Design | ⏭️ | Skipped — not studied yet |
| 18 | useRef vs useState | ✅ | useRef = mutable box, no re-render. useState = immutable per render |
| 19 | Object.create vs new | ⚠️ | Object.create skips the constructor entirely |
| 20 | useDeferredValue | ❌ | React scheduler primitive — not a debounce |

---

## Question 1: Event Loop — `.then()` Chain Scheduling

### Code
```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve()
  .then(() => console.log('C'))
  .then(() => console.log('D'));
queueMicrotask(() => console.log('E'));
console.log('F');
```

### My Answer
`A, F, C, D, E, B`

### Correct Answer
`A, F, C, E, D, B`

### What I Got Wrong
I said `D` runs before `E`. Wrong. When C runs, it **schedules** D at the END of the microtask queue. But E was already in the queue before D was added.

### The Rule
> `.then()` chains are **lazy**. The second `.then` is NOT scheduled when `Promise.resolve()` is called — it's scheduled only after the first `.then` callback completes.

### Step-by-Step

| Step | Action | Microtask Queue | Macrotask Queue |
|---|---|---|---|
| Sync | A, F printed | `[C, E]` | `[B]` |
| Microtask 1 | C runs → schedules D | `[E, D]` | `[B]` |
| Microtask 2 | E runs | `[D]` | `[B]` |
| Microtask 3 | D runs | `[]` | `[B]` |
| Macrotask | B runs | `[]` | `[]` |

### Event Loop Order
> Engine **always drains the entire microtask queue first**, then picks ONE task from the macrotask queue, then drains microtasks again. It's a loop, not a one-time check.

---

## Question 2: Closures — Memory Model

### Code
```javascript
function makeMultiplier(x) {
  return function (y) {
    return x * y;
  };
}
const double = makeMultiplier(2);
const triple = makeMultiplier(3);
console.log(double(5));   // 10
console.log(triple(5));   // 15
console.log(double === triple); // false
```

### My Answer
`10, 15, false` — 2 closure environments. ✅ Correct.

### What I Missed — The Memory Model

Each call to `makeMultiplier` creates a **new execution context**. When it returns, the inner function holds a **reference to the scope/environment object** on the heap, keeping it alive via GC.

```
Heap:
  Closure env #1 → { x: 2 }  ← referenced by `double`
  Closure env #2 → { x: 3 }  ← referenced by `triple`

double → function(y) { return x * y }  // x resolved via env #1
triple → function(y) { return x * y }  // x resolved via env #2
```

Same function body — but two different **environment bindings**. That's why `double === triple` is `false`.

### Key Concept
> Closures live on the **heap**, not the stack. That's why they survive after the outer function returns.

> If `x` were an object (not a primitive), both closures sharing the same reference would see mutations. Primitives are safe — objects are not.

---

## Question 3: `this` Binding — Arrow vs Regular

### Code
```javascript
const obj = {
  name: 'Rahul',
  greet: function () { return `Hello, ${this.name}`; },
  greetArrow: () => { return `Hello, ${this.name}`; }
};
const fn = obj.greet;
console.log(obj.greet());       // "Hello, Rahul"
console.log(obj.greetArrow());  // "Hello, undefined"
console.log(fn());              // "Hello, undefined" (non-strict)
```

### My Answer
Output was close, but I said: *"arrow function takes `this` of obj"* — **WRONG.**

### The Correct Rule
Arrow functions capture `this` from their **lexical enclosing scope at definition time** — NOT from the object they're written inside. Object literals do **NOT** create a new `this` context.

- In a browser (non-strict): `this` = `window`
- In Node.js module: `this` = `{}` (module exports)
- In strict mode: `this` = `undefined` → TypeError

### `this` Reference Table

| Call Style | `this` Value |
|---|---|
| `obj.method()` | `obj` |
| `fn()` (detached) | `global` / `undefined` in strict |
| Arrow function | Lexical `this` — wherever it was **defined** |
| `fn.call(obj)` | `obj` explicitly |

---

## Question 4: Async/Await — What Happens at `await`

### Code
```javascript
function fetchData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve('data'), 1000);
  });
}
async function run() {
  try {
    const result = await fetchData();
    console.log(result);
  } catch (e) {
    console.log('error:', e);
  }
}
run();
console.log('after run');
```

### My Answer
`"after run"`, then `"data"` — ✅ Correct.

### What I Missed — The Mechanism

When the engine hits `await`:

1. `run()` is called → starts executing
2. `fetchData()` returns a **pending Promise**
3. Engine hits `await` → async function is **suspended**
4. `run()` is paused and removed from the call stack — state saved on heap
5. `run()` returns a **pending Promise** to its caller immediately
6. `console.log('after run')` runs synchronously
7. 1000ms later → Promise resolves → continuation of `run()` scheduled as **microtask**
8. `result = 'data'` → `console.log('data')`

### The Key Mental Model
> `await` is syntactic sugar over `.then()`. The engine splits the async function at every `await` point into continuation callbacks — scheduled as microtasks when the awaited Promise resolves.

> That's why `await` doesn't block the main thread — the function suspends itself, hands control back, and resumes only via the microtask queue.

---

## Question 5: TypeScript `infer`

### Code
```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Result = UnwrapPromise<Promise<string>>; // string
```

### My Answer
`Result` = `string` ✅. But explanation was vague.

### How `infer` Actually Works

`infer` is a **pattern matching variable** inside conditional types.

Read `T extends Promise<infer U> ? U : T` as:
> "If `T` matches the shape `Promise<something>`, capture that `something` as `U` and return `U`. Otherwise, return `T` unchanged."

### Real Platform Use Cases

1. **API layer utilities** — unwrap Promise types automatically:
```typescript
type ApiReturn<T> = UnwrapPromise<T>;
// useFetch<Promise<User>> → User
// useFetch<User> → User
```

2. **Plugin systems** — extract return types from handler functions:
```typescript
type HandlerReturn<T> = T extends (...args: any[]) => infer R
  ? UnwrapPromise<R>
  : never;
```

3. **Design system prop inference** — extracting generic types from component configs.

### Staff-Bar Framing
> Don't say "when you have doubt in output type." Say: **"When your platform needs to normalize types across sync and async boundaries."**

---

## Question 6: useEffect Cleanup Lifecycle

### Code
```jsx
function App() {
  const [count, setCount] = useState(0);
  console.log('render');
  useEffect(() => {
    console.log('effect');
    return () => console.log('cleanup');
  }, [count]);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### My Answer
Initial mount: `render, effect, cleanup, 0` — ❌ WRONG
Click: `effect, cleanup, 2` — ❌ WRONG

### Correct Answer

**Initial mount:** `render`, `effect`
- Cleanup does NOT run on initial mount (nothing to clean up)
- `0` is a rendered UI value, not a console.log

**After one click:** `render`, `cleanup`, `effect`
- Component re-renders → `"render"`
- Browser paints
- Previous effect's cleanup runs → `"cleanup"`
- New effect runs → `"effect"`

### The Lifecycle Rule (MEMORIZE THIS)

```
Mount:       render → paint → effect
Re-render:   render → paint → cleanup(previous) → effect(new)
Unmount:     cleanup(last)
```

> Cleanup always belongs to the **previous** effect. It runs right before the new effect fires. "Tear down the old world before setting up the new one."

---

## Question 7: React Keys — Reconciliation

### Code
```jsx
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => <li>{user.name}</li>)}
    </ul>
  );
}
```

### My Answer
"key is missing, React Fiber will repaint the whole screen" — ⚠️ Wrong consequence.

### What Actually Happens

React does NOT repaint the whole screen. Without keys, React **falls back to index-based diffing**, causing:

**1. Unnecessary DOM mutations**
Adding a user at the beginning shifts all indices → React updates every node's content.

**2. State leaks (the real production bug)**
If `<li>` elements contained inputs/checkboxes, state **sticks to the index, not the item**. Delete first user → second user inherits first user's state.

**3. Performance**
More DOM nodes touched than necessary.

### Index as Key
Index as key is fine **only when:**
- List is static (never reordered, filtered, or modified)
- Items have no state

### Staff-Bar Answer
> *"Missing key. React falls back to index-based reconciliation — incorrect DOM reuse on list mutations, stale state in stateful children, unnecessary DOM updates. Use stable unique ID."*

---

## Question 8: Custom Hook — useDebounce Cleanup

### Code
```jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

### My Answer ✅
Without cleanup, old timeouts pile up. Each keystroke creates a new setTimeout but never cancels the previous one → debounce behavior defeated → multiple state updates, flickering, redundant API calls.

### Additional Learning — Removing `delay` from Deps

If `delay` is removed from the dependency array:
- Effect only re-runs when `value` changes
- If parent changes `delay` (e.g., from 300 → 1000), the effect does NOT re-run
- Old timer with old `delay` is still active via closure — **stale closure bug**

> Every external value your effect reads must be in the dependency array.

---

## Question 9: Performance Debugging Workflow

### Scenario
Team reports 2s page load regression after upgrading your shared library from v2 to v3.

### My Answer
"Open Chrome DevTools, check Performance tab, React Profiler, Network tab" — ❌ Senior-level, not Staff.

### The Staff-Level Workflow

**Step 1: Reproduce & Isolate (15 min)**
- Reproduce with v2 → record baseline
- Switch to v3 → record page load
- Confirmed delta? Good — it's your library.

**Step 2: Check What Changed (10 min)**
- Read the v2 → v3 git diff / changelog
- New dependency? Changed imports? New initialization? A polyfill?

**Step 3: Identify WHICH Metric Regressed (10 min)**
Run Lighthouse or check Core Web Vitals:

| Metric | Points To |
|---|---|
| **LCP** increased | Larger bundle blocking render |
| **TBT** increased | Heavy JS execution on main thread |
| **FCP** delayed | New blocking CSS/JS in critical path |
| **CLS** shift | Layout shifts from late-loading components |

**Step 4: Bundle Analysis (15 min)**
```bash
npx webpack-bundle-analyzer stats-v2.json
npx webpack-bundle-analyzer stats-v3.json
```
- Did v3 add a large dependency?
- Did tree-shaking break?
- Did chunk splitting change?

**Step 5: Targeted DevTools (15 min)**
NOW open DevTools with a specific hypothesis.

**Step 6: Communicate Findings**
> *"v3 added X dependency (+180KB gzipped), causing LCP regression of ~2s. Fix: lazy-load X. Patch in v3.0.1."*

### The Lesson
> A Senior debugs by poking. A Staff debugs by **narrowing the search space systematically** — version isolation → metric identification → targeted tooling → root cause → fix → communication.

---

## Question 10: Module Federation — remoteEntry.js

### Scenario
Host app upgraded, remote didn't. Users see white screen on remote's section.

### My Answer
Identified shared dependency mismatch ✅. But got `remoteEntry.js` wrong again.

### What remoteEntry.js Actually Is

**remoteEntry.js is a manifest/bootstrap file — NOT the actual code.**

```
remoteEntry.js tells the host:
├── What modules this remote exposes ("./Button", "./Header")
├── What shared dependencies it needs (react@18.2)
├── Where to fetch the actual code chunks (chunk URLs)
└── How to negotiate shared dependency versions at runtime
```

**The flow:**
1. Host loads `remoteEntry.js` from remote's URL
2. Reads manifest — learns what's available and what's needed
3. Negotiates shared dependencies
4. Lazy-loads the actual component chunk only when needed

### Technical Prevention

**1. Error boundaries around every remote (non-negotiable):**
```jsx
<ErrorBoundary fallback={<FallbackUI />}>
  <Suspense fallback={<Loading />}>
    <RemoteComponent />
  </Suspense>
</ErrorBoundary>
```

**2. Shared dependency strategy:**
```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0',  // range, not exact
    strictVersion: false,         // warn, don't crash
  }
}
```

**3. Runtime fallbacks:**
```javascript
const RemoteApp = React.lazy(() =>
  loadRemote('teamB/App').catch(() => import('./FallbackApp'))
);
```

**4. Contract tests in CI** — host + remote integration tests catch breaks before deploy.

---

## Question 11: Shallow Copy — Spread Operator

### Code
```javascript
const obj = { a: 1, b: { c: 2 } };
const copy = { ...obj };
copy.a = 10;
copy.b.c = 20;
console.log(obj.a);    // ?
console.log(obj.b.c);  // ?
```

### My Answer
`10, 2` — ❌ Both wrong. Got it completely backwards.

### Correct Answer
`1, 20`

### Why

```
obj.a  → 1 (primitive — COPIED by value)
obj.b  → { c: 2 } (object — REFERENCE copied)

copy.a = 10;    → changes copy's own primitive — obj.a UNTOUCHED → 1
copy.b.c = 20;  → copy.b IS obj.b (same ref) — mutation bleeds → obj.b.c = 20
```

### The Rule
> Spread copies **one level deep**. Primitives get their own copy. Objects get a shared reference.

### Deep Copy
```javascript
// Old way (breaks with Date, Map, Set, undefined, circular refs)
const deep = JSON.parse(JSON.stringify(obj));

// Modern way (use this)
const deep = structuredClone(obj);
```

### React State Bug This Causes
```jsx
const toggleTodo = (id) => {
  const updated = [...todos];           // shallow copy of array
  const todo = updated.find(t => t.id === id);
  todo.completed = true;                // MUTATES original state
  setTodos(updated);                    // React may skip re-render
};

// Fix — immutable update:
const toggleTodo = (id) => {
  setTodos(todos.map(t =>
    t.id === id ? { ...t, completed: true } : t
  ));
};
```

---

## Question 12: Race Condition in Fetch

### Code
```jsx
useEffect(() => {
  fetch(`/api/search?q=${query}`)
    .then(res => res.json())
    .then(data => setResults(data));
}, [query]);
```

### My Answer
No debounce, no AbortController — ⚠️ Right direction, but didn't name the bug precisely.

### The Precise Bug: Race Condition

```
User types: R → Ra → Rah

Fetch #1: /api/search?q=R    → resolves at t=800ms
Fetch #2: /api/search?q=Ra   → resolves at t=400ms
Fetch #3: /api/search?q=Rah  → resolves at t=500ms

Responses arrive: #2, #3, #1
```

Result: User sees results for `"Rah"` briefly, then results for `"R"` overwrite them. **Stale results for a query the user didn't ask for.**

### Debounce Doesn't Fix This
Debounce reduces requests but two requests can still race. It's an optimization, not a fix.

### Fix Option 1: Ignore Flag (React-recommended)
```jsx
useEffect(() => {
  let ignore = false;
  fetch(`/api/search?q=${query}`)
    .then(res => res.json())
    .then(data => { if (!ignore) setResults(data); });
  return () => { ignore = true; };
}, [query]);
```

### Fix Option 2: AbortController (Better)
```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setResults(data))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
  return () => controller.abort();
}, [query]);
```

### Production-Grade: Debounce + AbortController + Error Handling.

---

## Question 13: Prototype Chain — hasOwnProperty

### Code
```javascript
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return `Hi, I'm ${this.name}`; };
const p1 = new Person('Rahul');
const p2 = Object.create(Person.prototype);

console.log(p1.greet());                          // "Hi, I'm Rahul"
console.log(p2.greet());                          // "Hi, I'm undefined"
console.log(p1.constructor === p2.constructor);    // true
```

### My Answer
Only got `p1.greet()` right.

### `Object.create` vs `new`

| | `new Person('Rahul')` | `Object.create(Person.prototype)` |
|---|---|---|
| Creates empty object | ✅ | ✅ |
| Links `[[Prototype]]` | ✅ | ✅ |
| Runs constructor | ✅ `this.name = name` | ❌ Skipped entirely |
| Has own properties | ✅ `{ name: 'Rahul' }` | ❌ `{}` empty |

`p2.greet()` → engine finds `greet` on prototype ✅ → `this.name` → `p2` has NO `name` property → `undefined` → `"Hi, I'm undefined"`.

### `hasOwnProperty` vs `in`

| Check | What It Does |
|---|---|
| `d.hasOwnProperty('speak')` | Only checks the object itself |
| `'speak' in d` | Checks object + entire prototype chain |

### Memory Layout
```
p1 (instance)
├── name: 'Rahul'              ← OWN property
├── [[Prototype]] → Person.prototype
                    ├── greet: function
                    ├── constructor: Person
                    ├── [[Prototype]] → Object.prototype
```

---

## Question 14: Promise.allSettled

### Code
```javascript
const promise1 = new Promise((resolve) => setTimeout(() => resolve('one'), 3000));
const promise2 = new Promise((_, reject) => setTimeout(() => reject('two failed'), 1000));
const promise3 = new Promise((resolve) => setTimeout(() => resolve('three'), 2000));
Promise.allSettled([promise1, promise2, promise3]).then(results => console.log(results));
```

### My Answer
Structure correct ✅. But said `status: resolved` — wrong.

### Correct Output
```javascript
[
  { status: 'fulfilled', value: 'one' },
  { status: 'rejected', reason: 'two failed' },
  { status: 'fulfilled', value: 'three' }
]
```

### The Status is `'fulfilled'`, NOT `'resolved'`
If you write `result.status === 'resolved'`, it **never matches**. Silent logic bug.

### Promise Combinators Reference

| Combinator | Behavior | Use When |
|---|---|---|
| `Promise.all` | Fails fast on first rejection | All must succeed or nothing matters |
| `Promise.allSettled` | Waits for all, reports each | Need partial results, independent tasks |
| `Promise.race` | Returns first settled (fulfilled OR rejected) | Timeout patterns |
| `Promise.any` | Returns first fulfilled, ignores rejections | Fallback sources |

---

## Question 15: Shared Hook Code Review

### Code
```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);
  return [value, setValue];
}
```

### My Answer
"No idea" — ❌

### The 6 Issues

**1. `key` missing from useEffect deps** — stale closure bug. If key changes, writes to wrong key.

**2. `key` change doesn't re-initialize state** — `useState` initializer runs ONCE on mount. Key changes don't re-read localStorage.

**3. SSR crash** — `localStorage` doesn't exist on the server. Need `typeof window !== 'undefined'` check.

**4. No try/catch on `JSON.parse`** — corrupted data in localStorage crashes the component.

**5. No try/catch on `localStorage.setItem`** — throws on quota exceeded or some private browsing modes.

**6. No cross-tab sync** — need to listen for the `storage` event.

### Production-Ready Version
```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch { return initialValue; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn(`useLocalStorage: failed to set "${key}"`, e); }
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        try { setValue(e.newValue !== null ? JSON.parse(e.newValue) : initialValue); }
        catch { setValue(initialValue); }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue]);

  return [value, setValue];
}
```

### 6 Checks for Any Shared Hook Review (MEMORIZE)
1. Deps array complete?
2. SSR safe?
3. Error handling on external APIs?
4. Stale closure risks?
5. Cross-context sync (tabs, windows)?
6. Cleanup on unmount?

---

## Question 16: React.memo — Unstable Props

### Code
```jsx
const MemoizedList = React.memo(({ items, onClick }) => {
  return items.map(item => (
    <div key={item.id} onClick={() => onClick(item.id)}>{item.name}</div>
  ));
});

function App() {
  const [items] = useState([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  const [count, setCount] = useState(0);
  const handleClick = (id) => { console.log('clicked', id); };
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedList items={items} onClick={handleClick} />
    </>
  );
}
```

### My Answer
"items is an object, new reference generated, React.memo fails" — ⚠️ Blamed the wrong prop.

### The Real Problem

`items` comes from `useState` — React **preserves the same reference** across re-renders. `items` is NOT the problem.

`handleClick` is a regular function recreated on every render → new reference every time → defeats `React.memo`.

### The Fix
```jsx
const handleClick = useCallback((id) => {
  console.log('clicked', id);
}, []);
```

### Prop Stability Reference

| Prop Type | Stable Across Re-renders? |
|---|---|
| Primitives | ✅ Yes |
| `useState` values (not set) | ✅ Yes — same reference |
| Inline functions | ❌ No — new function every render |
| Inline objects `{{ color: 'red' }}` | ❌ No — new object every render |
| `useMemo` / `useCallback` results | ✅ Yes — memoized |

> **`React.memo` is only as good as the stability of the props you pass.** One unstable prop defeats the entire optimization.

---

## Question 17: System Design
⏭️ **Skipped** — not studied yet.

---

## Question 18: useRef vs useState

### Code
```jsx
function App() {
  const ref = useRef(0);
  const [count, setCount] = useState(0);
  const handleClick = () => {
    ref.current += 1;
    setCount(count + 1);
    console.log('ref:', ref.current);
    console.log('state:', count);
  };
  return <button onClick={handleClick}>Click</button>;
}
```

### My Answer
`ref: 1, state: 0` — ✅ Correct.

### The Key Reason — Closure, Not Just Batching

`count` logs `0` because `handleClick` **closed over** `count = 0` from the current render. Even if setState were synchronous, `count` in this function scope would still be `0`.

`ref.current` shows `1` because you're reading from a **mutable object** — always the latest value.

### useRef vs useState

| | `useRef` | `useState` |
|---|---|---|
| Storage | Mutable `.current` on persistent object | Immutable value per render |
| Read timing | Always latest | Always the value from the render that created the closure |
| Re-render | ❌ No | ✅ Yes |

### When to Use `useRef` in Shared Hooks
1. **Values that affect logic but not UI** — timer IDs, previous values, render counts, abort controllers
2. **Breaking stale closures:**
```jsx
function useLatestCallback(fn) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args) => ref.current(...args), []);
}
```
3. **DOM references** — focus management, measurements

### Consequence of Choosing Wrong
- `useRef` where you needed `useState` → value changes, UI never updates
- `useState` where you needed `useRef` → unnecessary re-renders on every change (performance death for high-frequency updates)

---

## Question 19: Object.create vs new

### Code
```javascript
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return `Hi, I'm ${this.name}`; };
const p1 = new Person('Rahul');
const p2 = Object.create(Person.prototype);

console.log(p1.greet());                        // "Hi, I'm Rahul"
console.log(p2.greet());                        // "Hi, I'm undefined"
console.log(p1.constructor === p2.constructor);  // true
```

### My Answer
Only got `p1.greet()` right.

### What I Learned

**`Object.create(Person.prototype)` does only one thing:** Creates a new empty object and sets its `[[Prototype]]` to whatever you pass in. **No constructor runs.** No `this.name = name`.

`p2` has no own properties. `p2.greet()` finds `greet` on prototype but `this.name` is `undefined`.

Both `p1.constructor` and `p2.constructor` resolve to `Person` via the same prototype chain → `true`.

### When `Object.create` is Used
1. **Pre-ES6 inheritance:** `Dog.prototype = Object.create(Animal.prototype)`
2. **Clean maps:** `Object.create(null)` — no toString, no hasOwnProperty
3. **Prototype-based delegation** in library internals

---

## Question 20: useDeferredValue

### My Answer
"No idea" — ❌

### What I Learned

### The Problem
User types in search → every keystroke triggers expensive list re-filter and re-render → input feels laggy.

### What `useDeferredValue` Does
```jsx
const deferredText = useDeferredValue(text);
```

React gives you two versions of the value:
- `text` — always current (for the input, keeps it responsive)
- `deferredText` — lower-priority copy, updated when React has free time

```
Keystroke 1: text = 'S'     deferredText = ''     ← deferred lags behind
Keystroke 2: text = 'Sh'    deferredText = ''     ← still lagging
Keystroke 3: text = 'Sho'   deferredText = ''     ← still lagging
(browser idle)               deferredText = 'Sho'  ← catches up
```

React does **two renders:**
1. **Urgent render** — updates `text` → input responsive
2. **Deferred render** — updates `deferredText` → heavy list re-filters in background

### useDeferredValue vs Debounce

| | `useDeferredValue` | Debounce |
|---|---|---|
| Who controls timing? | React scheduler — adapts to device | You — fixed delay |
| Drops input? | Never | Yes — intermediate keystrokes swallowed |
| Adapts to device? | ✅ Fast device = less lag | ❌ Same delay everywhere |
| Cancelable render? | ✅ React interrupts stale deferred renders | ❌ Just delays the call |

### Why `useMemo` Is Essential With It

```jsx
const filteredList = useMemo(() => {
  return list.filter(item =>
    item.toLowerCase().includes(deferredText.toLowerCase())
  );
}, [deferredText, list]);
```

Without `useMemo`: filter runs on **every render** — including the urgent render where `deferredText` hasn't changed → new array reference → HeavyList re-renders → defeats the entire purpose.

With `useMemo`: urgent render returns cached list → HeavyList gets same reference → skipped ✅.

### The Mental Model
```
User types 'S':
  ├── Urgent render:   text='S', deferredText='' (stale)
  │   └── useMemo: deps unchanged → cached list → HeavyList skipped ✅
  │   └── Input shows 'S' instantly ✅
  └── Deferred render: deferredText='S' (caught up)
      └── useMemo: deps changed → recalculates → HeavyList updates
```

---

## Weak Areas — Must Revisit

### Priority 1 (Interview Killers)
- [ ] **useEffect cleanup lifecycle** — wrong on mount vs re-render order
- [ ] **`this` in arrow functions** — confused "lexical scope" with "enclosing object"
- [ ] **Shallow vs deep copy tracing** — know the concept, failed the code output
- [ ] **Prototype chain / hasOwnProperty** — methods live on prototype, not instances

### Priority 2 (Knowledge Gaps)
- [ ] **Shared hook code review patterns** — the 6-check framework
- [ ] **useDeferredValue + useMemo pairing** — React 18 concurrent features
- [ ] **Object.create vs new** — when constructor runs vs doesn't
- [ ] **remoteEntry.js** — it's a manifest, not the code

### Priority 3 (Sharpen Framing)
- [ ] **Performance debugging** — systematic workflow, not "open DevTools"
- [ ] **Race conditions** — name the bug precisely, explain ignore flag pattern
- [ ] **React.memo** — identify which prop is unstable, not guess

---

## Key Rules to Memorize

1. **Event Loop:** Microtask queue drains completely before any macrotask runs.
2. **`.then()` chains:** Lazy — next `.then` scheduled only after previous completes.
3. **Arrow `this`:** Lexical enclosing SCOPE, not the enclosing object.
4. **`await`:** Suspends function, returns control — syntactic sugar over `.then()`.
5. **Spread:** One level deep. Primitives copied. Objects shared.
6. **useEffect cleanup:** Previous cleanup → new effect. Never on initial mount.
7. **React keys:** Missing = index fallback = state leaks on mutation.
8. **`useState` refs:** Stable across re-renders. Functions are not.
9. **`hasOwnProperty`:** Only checks the object itself, not the chain.
10. **`Promise.allSettled`:** Status is `'fulfilled'`, not `'resolved'`.
11. **`useDeferredValue`:** React scheduler primitive, not a debounce.
12. **`remoteEntry.js`:** Manifest file, not actual code.

---

*Generated from Rahul's Staff Engineer refresher interview — March 2026*
