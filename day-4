# JavaScript Deep Dive — Async JavaScript
**Date:** March 10, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What problem did Promises solve and how do they work internally?

**The problem:**
JS is single threaded — no parallel execution. Web APIs and task queue were introduced to handle async behaviour. Before Promises, async code relied on callbacks — leading to deeply nested, unreadable, hard-to-debug code known as **callback hell.**

```javascript
// ❌ Callback hell — pyramid of doom
getUser(id, (user) => {
  getOrders(user, (orders) => {
    getItems(orders, (items) => {
      // deeply nested, error handling nightmare
    });
  });
});

// ✅ Promise chaining — flat and readable
getUser(id)
  .then(user => getOrders(user))
  .then(orders => getItems(orders))
  .then(items => console.log(items))
  .catch(err => console.error(err));
```

**Three states of a Promise:**
- `pending` — initial state, not yet settled
- `fulfilled` — resolved successfully with a value
- `rejected` — failed with a reason/error

**States are irreversible** — once a Promise settles to fulfilled or rejected, it can never change state again.

**Where does `.then` callback go?**
`.then` callbacks are queued in the **microtask queue** — given priority over the task queue as soon as the call stack is empty.

**async/await — important clarification:**
`await` does NOT block the call stack. It **suspends the current async function** and **frees the call stack entirely**. Other code runs while the operation is in flight. Execution resumes when the Promise resolves.

---

## Q2. Error handling — `.catch`, fetch trap, unhandled rejections

### `.catch` covers the ENTIRE chain above it

```javascript
fetch('/api/config')
  .then(res => res.json())    // error here → flows down
  .then(data => {
    throw new Error('oops');  // error here → flows down
  })
  .catch(err => console.log(err)); // catches ALL errors above
```

Think of `.catch` as a drain at the bottom of a pipe — any error thrown anywhere up the chain flows down to it automatically.

**One nuance — `.catch` returns a Promise, chain continues after it:**
```javascript
fetch('/api/config')
  .catch(err => console.log(err)) // handles error
  .then(data => console.log(data)); // still runs after catch!
```

---

### The fetch trap — most common async mistake

`fetch` only throws on **network failure** (no internet, DNS failure). It does **NOT** throw on HTTP error responses like `404`, `500`.

```javascript
// ❌ dangerous — assumes fetch throws on 404/500
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json(); // parses error HTML as JSON 😱
    console.log(data);
  } catch(err) {
    console.log('Error:', err); // never fires for 404/500!
  }
}

// ✅ always check res.ok explicitly
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    console.log(data);
  } catch(err) {
    console.log('Error:', err);
  }
}
```

---

### Unhandled Promise rejection — dangerous in platform libraries

When a Promise rejects and no `.catch` or `try/catch` handles it:

```javascript
// ❌ fire and forget — rejection goes nowhere
async function bootstrap() {
  const config = await fetch('/api/config'); // rejects silently
}
bootstrap(); // no await, no catch
```

In modern environments this **crashes the Node.js process entirely.**

**In a platform library used by many teams:**
- Team calls your bootstrap without `await` or `.catch`
- Internal fetch fails silently
- App initializes in broken state — auth, config, metrics missing
- No error, no log — just wrong behaviour in production

**Fix — always re-throw from platform code:**
```javascript
export async function initPlatform() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
    return await res.json();
  } catch(err) {
    console.error('[Platform] Critical init failure:', err);
    throw err; // re-throw — never swallow silently
  }
}
```

---

## Q3. Promise Combinators — all four, when to use each

```javascript
const p1 = Promise.resolve('config');
const p2 = Promise.reject(new Error('auth failed'));
const p3 = Promise.resolve('metrics');
```

### Promise.all — fails fast on ANY rejection
```javascript
Promise.all([p1, p2, p3])
// p2 rejects → immediately rejects, p1/p3 thrown away
// Result: Error('auth failed')
```
> "All must succeed — one failure kills everything"

**Use when:** All results are **required** to proceed. Critical bootstrap dependencies.

---

### Promise.allSettled — waits for ALL regardless of outcome
```javascript
Promise.allSettled([p1, p2, p3])
// Waits for every promise — resolved OR rejected
// Result: [
//   { status: 'fulfilled', value: 'config' },
//   { status: 'rejected',  reason: Error('auth failed') },
//   { status: 'fulfilled', value: 'metrics' }
// ]
```
> "Tell me what happened to everyone — I'll decide what to do"

**Use when:** Loading **independent optional resources** — inspect each result and apply per-resource fallback.

---

### Promise.race — first to SETTLE wins (resolve OR reject)
```javascript
Promise.race([p1, p2, p3])
// Whoever settles first wins — good or bad
```
> "First one across the line wins — no matter what"

**Use when:** Timeout patterns — race API call against a timer:
```javascript
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Request timed out')), 5000)
);
const result = await Promise.race([fetch('/api/config'), timeout]);
```

---

### Promise.any — first to RESOLVE wins (ignores rejections)
```javascript
Promise.any([p1, p2, p3])
// p2 rejects → ignored
// p1 resolves first → returns 'config'
// Only rejects if ALL promises reject → AggregateError
```
> "Give me the first success — failures don't matter unless everyone fails"

**Use when:** Fetching same data from **multiple redundant sources** — fastest success wins:
```javascript
const config = await Promise.any([
  fetch('https://cdn1.walmart.com/config'),
  fetch('https://cdn2.walmart.com/config'),
  fetch('https://cdn3.walmart.com/config'),
]);
```

---

### Quick Reference:

| Combinator | Resolves when | Rejects when | Returns |
|---|---|---|---|
| `Promise.all` | ALL resolve | ANY rejects | Array of values / first error |
| `Promise.allSettled` | ALL settle | Never rejects | Array of {status, value/reason} |
| `Promise.race` | FIRST settles | FIRST settles | First value or error |
| `Promise.any` | FIRST resolves | ALL reject | First value / AggregateError |

---

### Pattern to remember:
```
Required resources   → Promise.all        → fail fast, no partial state
Optional resources   → Promise.allSettled → inspect each, apply fallbacks
Redundant sources    → Promise.any        → first success wins
Timeout enforcement  → Promise.race       → race against a timer
```

---

## Q4. Platform Bootstrap Architecture — real world example

**Requirements:**
- `config` — required, app cannot start without it
- `featureFlags` — required, app cannot start without it
- `userPreferences` — optional, use defaults if fails
- `analytics` — optional, never block the app

```javascript
async function initPlatform() {

  // Step 1 — critical dependencies in parallel
  // Both required — one failure blocks everything
  let config, featureFlags;
  try {
    [config, featureFlags] = await Promise.all([
      fetchConfig(),
      fetchFeatureFlags()
    ]);
  } catch(err) {
    console.error('[Platform] Critical bootstrap failure:', err);
    throw err; // re-throw — app cannot start
  }

  // Step 2 — optional dependencies in parallel
  // Neither blocks the app — handle each independently
  const [preferencesResult, analyticsResult] = await Promise.allSettled([
    fetchUserPreferences(),
    fetchAnalytics()
  ]);

  const preferences = preferencesResult.status === 'fulfilled'
    ? preferencesResult.value
    : getDefaultPreferences(); // graceful fallback

  const analytics = analyticsResult.status === 'fulfilled'
    ? analyticsResult.value
    : null; // not a blocker

  return { config, featureFlags, preferences, analytics };
}
```

**Reasoning:**
- `Promise.all` for required — hard dependencies, fail fast, no partial state
- `Promise.allSettled` for optional — each has its own fallback strategy, never bubble up failures

---

## Q5. Sequential vs Parallel awaits — performance trap

```javascript
// ❌ Sequential — common mistake
async function loadDashboard() {
  const user = await getUser();
  const orders = await getOrders(user.id);           // waits for user
  const recommendations = await getRecommendations(user.id); // waits for orders
  return { user, orders, recommendations };
}
```

**Two problems:**
1. No error handling — failures surface unpredictably
2. `orders` and `recommendations` are **independent** — no reason to run sequentially

**Performance impact:**
```
❌ Sequential:  getUser(300ms) + getOrders(200ms) + getRecommendations(200ms) = 700ms
✅ Parallel:    getUser(300ms) + max(getOrders, getRecommendations)(200ms)    = 500ms
```

```javascript
// ✅ Fixed — parallel + error handling
async function loadDashboard() {
  try {
    const user = await getUser(); // required first — orders/recommendations need user.id

    const [orders, recommendations] = await Promise.all([
      getOrders(user.id),           // independent — run in parallel
      getRecommendations(user.id)   // independent — run in parallel
    ]);

    return { user, orders, recommendations };
  } catch(err) {
    console.error('[Dashboard] Load failed:', err);
    throw err; // re-throw — let caller decide recovery
  }
}
```

**Mental model:**
> Every sequential `await` — ask: "Does this line actually depend on the result above?" If no → run in parallel with `Promise.all`.

---

## Q6. Retry Logic — Exponential Backoff + Jitter

```javascript
// ❌ Naive retry — dangerous in production
async function fetchWithRetry(url, retries = 3) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch(err) {
    if (retries > 0) {
      return fetchWithRetry(url, retries - 1); // retries immediately!
    }
    throw err;
  }
}
```

**Execution trace — 3 failures:**
```
Call 1: fetchWithRetry(url, 3) → fails → retries=3>0 → calls fetchWithRetry(url, 2)
Call 2: fetchWithRetry(url, 2) → fails → retries=2>0 → calls fetchWithRetry(url, 1)
Call 3: fetchWithRetry(url, 1) → fails → retries=1>0 → calls fetchWithRetry(url, 0)
Call 4: fetchWithRetry(url, 0) → fails → retries=0   → throws err
// 4 total attempts — 1 original + 3 retries
```

---

### The production danger — Thundering Herd

All instances retry at **exactly the same time** — hammering an already struggling API:

```
API goes down at 10:00:00
All instances retry at 10:00:01 → 500 requests hit dying API
All instances retry at 10:00:02 → 500 more requests
All instances retry at 10:00:03 → 500 more requests
// You're preventing the API from recovering
```

---

### Fix — Exponential Backoff with Jitter

**Exponential Backoff** — wait progressively longer between retries:
```
Retry 1 → wait 200ms
Retry 2 → wait 400ms
Retry 3 → wait 800ms
```

**Jitter** — add randomness so instances don't retry simultaneously:
```
Retry 1 → wait 200ms + random(0-100ms)
Retry 2 → wait 400ms + random(0-100ms)
Retry 3 → wait 800ms + random(0-100ms)
```

```javascript
// ✅ Production-safe retry with backoff + jitter
async function fetchWithRetry(url, retries = 3, baseDelay = 200) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();

  } catch(err) {

    // not all errors should be retried
    const shouldRetry = ![400, 401, 403].includes(err.status);

    if (retries > 0 && shouldRetry) {
      const exponentialDelay = baseDelay * Math.pow(2, 3 - retries);
      const jitter = Math.random() * 100;
      const waitTime = exponentialDelay + jitter;

      console.log(`Retrying in ${Math.round(waitTime)}ms... ${retries} left`);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchWithRetry(url, retries - 1, baseDelay);
    }

    throw err;
  }
}
```

**Visualised — with vs without backoff:**
```
❌ Without — synchronized hammering:
Instance A: retry ─► retry ─► retry
Instance B: retry ─► retry ─► retry
Instance C: retry ─► retry ─► retry

✅ With backoff + jitter — staggered load:
Instance A: ──200ms──► ──400ms──► ──800ms──►
Instance B: ──240ms──► ──480ms──► ──850ms──►
Instance C: ──180ms──► ──420ms──► ──780ms──►
```

**Which errors to retry:**

| Status | Retry? | Reason |
|---|---|---|
| 400 Bad Request | ❌ No | Request is wrong — retrying won't help |
| 401 Unauthorized | ❌ No | Need new token first |
| 403 Forbidden | ❌ No | Permission issue — retrying won't help |
| 429 Too Many Requests | ✅ Yes | With longer delay |
| 500 Server Error | ✅ Yes | Server may recover |
| 503 Service Unavailable | ✅ Yes | Transient failure |

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Promise states | pending → fulfilled/rejected. **Irreversible** |
| `.catch` | Catches errors from **entire chain** above it |
| `fetch` trap | Never throws on 4xx/5xx — always check `res.ok` |
| Unhandled rejection | Silent in old environments, crashes process in modern Node |
| Re-throw pattern | Handle what you can — always surface errors to caller |
| `Promise.all` | All required — fail fast |
| `Promise.allSettled` | Independent optionals — inspect each result |
| `Promise.race` | Timeout enforcement |
| `Promise.any` | Redundant sources — first success wins |
| Sequential awaits | Always ask: are these independent? If yes → `Promise.all` |
| Thundering herd | Immediate retries hammer struggling APIs — use backoff |
| Exponential backoff | Delay doubles each retry — gives API time to recover |
| Jitter | Randomness prevents synchronized retry storms |
| Error-specific retry | 4xx = don't retry. 5xx = retry with backoff |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
