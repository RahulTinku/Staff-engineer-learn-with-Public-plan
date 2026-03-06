# JavaScript Deep Dive — Closures & Scope
**Date:** March 06, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What is Lexical Scope and when is it determined?

**Answer:**
- Scope inside a function is its **lexical scope** — determined at **compile time**, not runtime
- There is one **global/window scope** where all top-level variables and functions live
- Every function instantiation creates its own **function scope**
- `var` is **function scoped** — hoisted to the top of the function with value `undefined`
- `let` and `const` are **block scoped** — hoisted but sit in a **Temporal Dead Zone (TDZ)** until the declaration line. Accessing before declaration throws `ReferenceError`

**Key distinction — var vs let block scope:**
```javascript
if (true) {
  var x = 10;
}
console.log(x); // 10 — leaks out of block!

if (true) {
  let y = 10;
}
console.log(y); // ReferenceError — stays inside block
```

---

## Q2. Classic for loop closure trap — what does this print?

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 1000);
}
```

**Answer: Prints `3 3 3`**

**Why:**
- `var i` is function scoped — hoisted to the top, one shared binding
- Each `setTimeout` closes over the **same `i` reference**
- By the time setTimeout fires (after 1000ms), the loop is done and `i = 3`
- All three callbacks read the same `i` — which is now `3`

**Fix 1 — use `let`:**
```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Prints: 0 1 2
// let creates a new block-scoped binding per iteration
```

**Fix 2 — IIFE closure to capture current value:**
```javascript
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 1000);
  })(i);
}
// Prints: 0 1 2
// Each IIFE creates a new scope, capturing i as j at that moment
```

---

## Q3. What exactly do closures capture — value or reference?

```javascript
function makeCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = makeCounter();
counter.increment();
counter.increment();
counter.decrement();
console.log(counter.getCount()); // 1
```

**Answer: Prints `1`**

**The key insight:**
> Closures capture a **live reference to the variable binding** — not a snapshot of the value.

- All three returned functions share the **same `count` binding** in memory
- They are not working with copies — they all point to the same memory location
- `count` lives on even after `makeCounter()` has returned — kept alive by the closures

---

## Q4. Module Pattern + Shared Mutable State Bug

```javascript
// platform-core.js
const createConfig = () => {
  const config = {};
  return {
    set: (key, value) => config[key] = value,
    get: (key) => config[key]
  };
};

export const platformConfig = createConfig();
```

**Pattern:** Module Pattern (Singleton) — `createConfig()` called once, exported as a shared instance

**Closure role:** `config` object is private — enclosed inside `createConfig`. Teams can only `get`/`set` but never directly access or delete `config`

**Memory implication:**
- `config` object lives for the **entire SPA lifetime** — GC cannot collect it as long as `platformConfig` is referenced anywhere in the app
- In long-running SPAs, this can grow large if unchecked

**Hard-to-debug production bug — shared mutable state:**
```javascript
// Team A sets at bootstrap
platformConfig.set('apiUrl', 'https://api-prod.walmart.com');

// Team B, unaware, overwrites it
platformConfig.set('apiUrl', 'https://api-staging.walmart.com');

// Team A's components now silently hit staging
// No error thrown — just wrong behaviour in production
```
This is the **shared mutable state trap** — invisible, no errors, only wrong behaviour.

---

## Q5. Live reference trap — what does this print?

```javascript
function outer() {
  let x = 10;

  function inner() {
    console.log(x);
  }

  x = 20;
  return inner;
}

const fn = outer();
fn(); // ?
```

**Answer: Prints `20`**

**Why — trace the reference:**
```
1. outer() executes
2. let x = 10       → x binding created, value = 10
3. inner defined    → closes over x's REFERENCE (not value 10)
4. x = 20           → same x binding updated to 20
5. inner returned
6. fn() executes    → looks up x reference → finds 20
```

`inner` never took a snapshot of `x = 10`. It holds a **live reference** — by the time it runs, `x` is already 20.

**Real platform bug this maps to:**
```javascript
let config = null;

const getHandler = () => {
  return () => config; // closes over config reference
};

export const handler = getHandler();

config = await loadConfig(); // mutates config after handler created
```
If any team calls `handler()` before `loadConfig()` resolves → silently returns `null`. No error, just wrong behaviour.

---

## Q6. Memoize — memory dangers and fixes

```javascript
// Naive memoize — memory leak risk
function memoize(fn) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) return cache[key];
    cache[key] = fn(...args);
    return cache[key];
  };
}
```

**How closure powers this:**
- `cache` is enclosed inside `memoize` — lives as long as the returned function exists
- GC cannot collect `cache` — it's always referenced by the closure
- In a platform library used by many teams, this grows unbounded → memory degrades over time

---

### Fix 1 — WeakMap (for object arguments)

```javascript
function memoize(fn) {
  const cache = new WeakMap();
  return function(arg) {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}
```

**Why WeakMap works:**
- Holds **weak references** to keys — doesn't prevent GC
- When the object passed as argument is dereferenced elsewhere → GC collects it → cache entry disappears automatically
- **Zero manual cleanup needed**
- Limitation: keys must be **objects** — primitives not allowed. Not iterable, no `.size`

**Analogy:** A regular Map is a parking garage that keeps your car even after you've lost the ticket. A WeakMap lets go the moment you stop caring about it.

---

### Fix 2 — LRU Cache (for primitive arguments)

**LRU = Least Recently Used** — when cache is full, evict the entry used least recently.

**Implementation using Map's insertion order:**
```javascript
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // re-insert = move to most recent
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey); // evict least recently used
    }
    this.cache.set(key, value);
  }
}
```

**Using LRU in memoize:**
```javascript
function memoize(fn, maxSize = 100) {
  const lru = new LRUCache(maxSize);
  return function(...args) {
    const key = JSON.stringify(args);
    const cached = lru.get(key);
    if (cached !== null) return cached;
    const result = fn(...args);
    lru.set(key, result);
    return result;
  };
}
```

---

### WeakMap vs LRU — Quick Reference

| Scenario | Use |
|---|---|
| Args are **objects** (DOM nodes, config objects) | **WeakMap** — GC driven, zero cleanup |
| Args are **primitives** (strings, IDs, numbers) | **LRU** — bounded size, explicit eviction |
| Need **bounded memory** with explicit limit | **LRU** |
| Caching tied to React component instances | **WeakMap** |
| Platform utility memoizing API calls by URL string | **LRU** |

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Lexical scope | Determined at **compile time**, not runtime |
| `var` | Function scoped, hoisted as `undefined` |
| `let`/`const` | Block scoped, hoisted but in **TDZ** — `ReferenceError` if accessed early |
| Closures | Capture **live variable references**, not value snapshots |
| `for var` trap | All callbacks share the same `var` binding — use `let` or IIFE |
| Module pattern | Singleton — shared mutable state across teams is dangerous |
| Memoize memory leak | Plain `{}` or `Map` = unbounded growth, GC blocked |
| WeakMap | Weak references — GC can collect, keys must be objects |
| LRU Cache | Bounded size, evicts least recently used, works with primitives |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
