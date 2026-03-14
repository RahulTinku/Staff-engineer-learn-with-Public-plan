# JavaScript Deep Dive — useState, useEffect, useRef Internals
**Date:** March 14, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. Why the Rules of Hooks exist — the linked list internals

Hook state is **not stored inside the component function.** Functions have no persistent memory between calls. React stores hook state on the **Fiber node** in a property called `memoizedState` — a **linked list of hook states:**

```
Fiber Node for <MyComponent>
{
  memoizedState: {          ← Hook 1 (useState)
    value: 0,
    next: {                 ← Hook 2 (useEffect)
      deps: [...],
      next: {               ← Hook 3 (useState)
        value: 'hello',
        next: null
      }
    }
  }
}
```

Every hook call appends to this linked list **in call order.**

---

### How React reads hooks on re-render — the cursor

React uses an internal **cursor** that starts at position 0 on every render:

```jsx
function MyComponent() {
  const [count, setCount] = useState(0);   // cursor → slot 0
  const [name, setName] = useState('');    // cursor → slot 1
  const [active, setActive] = useState(false); // cursor → slot 2
}
```

**First render — React BUILDS the list:**
```
slot 0: { value: 0 }
slot 1: { value: '' }
slot 2: { value: false }
```

**Re-renders — React READS the list by position:**
React identifies hooks purely by **position** — not by name or variable.

---

### Why conditional hooks break everything

```jsx
function MyComponent({ isLoggedIn }) {
  const [count, setCount] = useState(0);    // slot 0

  if (isLoggedIn) {
    const [name, setName] = useState('');   // slot 1 — sometimes
  }

  const [active, setActive] = useState(false); // slot 1 OR 2 — depends!
}
```

**Render 1 — isLoggedIn = true:**
```
slot 0: count = 0
slot 1: name = ''
slot 2: active = false
```

**Render 2 — isLoggedIn = false:**
```
slot 0: count = 0      ✅ correct
slot 1: active = false ❌ reads name's slot for active!
slot 2: empty          ❌ active's slot is now empty
```

React has no idea the condition changed — it just moves the cursor forward. Everything downstream is wrong.

**The mental model:**
> React identifies hooks like a **numbered queue ticket system** — by position, not name. Every render must hand out the same tickets in the same order.

---

## Q2. useState internals — batching and functional updates

### What setCount actually does

```
setCount(1) called
    ↓
React schedules a re-render (queues update on Fiber node)
    ↓
Current render continues UNCHANGED
    ↓
React processes the update queue
    ↓
Component re-renders → useState reads new value
```

`setCount` does **not** update the value immediately. It schedules a re-render.

---

### The batching trap

```jsx
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1); // schedules: 0 + 1 = 1
  setCount(count + 1); // schedules: 0 + 1 = 1 — count still 0!
  setCount(count + 1); // schedules: 0 + 1 = 1 — count still 0!
  console.log(count);  // prints 0 — state not updated yet!
};
// Result: count = 1, not 3
```

`count` is captured at render time as `0`. All three calls schedule the same update. React batches them — result is `1`.

**Fix — functional update form:**
```jsx
const handleClick = () => {
  setCount(c => c + 1); // c = 0, schedules: 1
  setCount(c => c + 1); // c = 1, schedules: 2
  setCount(c => c + 1); // c = 2, schedules: 3
};
// Result: count = 3 ✅
```

Each functional update receives the **result of the previous update** — not the stale closure value.

**The rule:**
> Whenever new state depends on previous state — **always use functional update form.**

```jsx
setCount(count + 1);    // ❌ risky — reads stale closure value
setCount(c => c + 1);  // ✅ safe — always gets latest value
```

---

## Q3. useEffect dependency array

### How React compares dependencies

React uses **`Object.is()`** for each dependency:
```javascript
Object.is(prevDep, nextDep)
// true  → skip effect
// false → run effect

Object.is(1, 1)           // true  → skip
Object.is(1, 2)           // false → run
Object.is({a:1}, {a:1})   // false → runs every time! (different references)
```

For object dependencies — use `useMemo` to stabilize the reference.

---

### Three cases — when effects run

```jsx
// Case A — no dependency array
useEffect(() => { console.log('A') });
// Runs after EVERY render
// Does NOT cause infinite loop by itself
// Only infinite loops if effect triggers state change:
useEffect(() => {
  setCount(c => c + 1); // ❌ THIS causes infinite loop
});

// Case B — empty dependency array
useEffect(() => { console.log('B') }, []);
// Runs after MOUNT only — never again

// Case C — with dependencies
useEffect(() => { console.log('C') }, [count]);
// Runs after mount + whenever count changes
```

---

## Q4. Stale Closures — the most common useEffect bug

### What a stale closure is

> A stale closure is when a `useEffect` callback **closes over a variable at render time** — but by the time the effect or a callback inside it executes, that variable is **outdated** because a re-render happened with a new value.

```jsx
const [count, setCount] = useState(0);

useEffect(() => {
  // closed over count = 0 at mount
  setTimeout(() => {
    console.log(count); // always prints 0 — STALE!
    // even if count has been updated to 5 by now
  }, 3000);
}, []); // empty deps — never re-runs, always holds count = 0
```

---

### Deliberately creating the stale closure bug

```jsx
import { useState, useEffect } from 'react';

// ❌ BUG — stale closure in interval
const CounterBug = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(counter); // always prints 0 — stale!
    }, 1000);

    return () => clearInterval(id);
  }, []); // empty deps — closes over counter = 0 forever

  return (
    <button onClick={() => setCounter(c => c + 1)}>
      Increment — {counter}
    </button>
  );
};
```

---

### Fixing with useRef — the Staff-level solution

```jsx
import { useState, useEffect, useRef } from 'react';

// ✅ FIX — useRef holds latest value without triggering re-render
const CounterFixed = () => {
  const [counter, setCounter] = useState(0);

  // ref always holds latest counter value
  const counterRef = useRef(counter);

  // keep ref in sync — silent update, no re-render
  useEffect(() => {
    counterRef.current = counter;
  }, [counter]);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(counterRef.current); // always latest ✅
    }, 1000);

    return () => clearInterval(id); // one interval, no leak
  }, []); // empty deps — interval created once

  return (
    <button onClick={() => setCounter(c => c + 1)}>
      Increment — {counter}
    </button>
  );
};
```

**Why useRef fixes it:**
```
useState  → new value + triggers re-render
useRef    → new value + NO re-render

counterRef.current always holds latest value
Interval reads counterRef.current → never stale
Interval created once → no memory leak
```

---

### Stale closure solutions — when to use which

| Approach | How | When |
|---|---|---|
| Add to deps array | `[counter]` | Short-lived effects — not intervals |
| `useRef` | Store latest value in ref | Intervals, event listeners, subscriptions |
| Cleanup + recreate | `return () => clearInterval` + deps | When recreating is acceptable |

---

## Q5. useRef — beyond DOM refs

### What useRef returns

```javascript
useRef(initialValue)
// returns: { current: initialValue }
// a plain JS object with one property
// same object persists across every render
```

---

### useRef vs useState — the fundamental difference

| | useState | useRef |
|---|---|---|
| Update mechanism | Async — queued to Fiber | Synchronous — direct mutation |
| Triggers re-render | ✅ Yes | ❌ No |
| Value timing | Available next render | Available immediately |
| Use for | Values that drive UI | Values that don't drive UI |

---

### Render counter — demonstrates the difference

```jsx
// ❌ useState version — BROKEN
// setCount triggers re-render → infinite loop
const RenderCounterState = () => {
  const [count, setCount] = useState(0);
  setCount(c => c + 1); // ❌ infinite loop — never do this in render body
  return <div>Renders: {count}</div>;
};
// useState cannot safely count renders
// because updating it CAUSES renders

// ✅ useRef version — CORRECT
// increments silently — no re-render triggered
const RenderCounterRef = () => {
  const count = useRef(0);
  count.current += 1; // silent increment during render
  return <div>Renders: {count.current}</div>;
};
```

**The key insight:**
```
useState  → "I need this value AND I want UI to update when it changes"
useRef    → "I need this value but I DON'T want UI to update when it changes"
```

---

### Three legitimate uses of useRef beyond DOM refs

```jsx
// 1. Render counter — silent tracking
const renderCount = useRef(0);
renderCount.current += 1;

// 2. Previous value tracker
const prevCount = useRef(count);
useEffect(() => {
  prevCount.current = count; // silently tracks previous value
}, [count]);
// prevCount.current = value from previous render

// 3. Interval/timeout ID storage
const intervalId = useRef(null);
intervalId.current = setInterval(() => {}, 1000);
clearInterval(intervalId.current); // access anytime, no re-render
```

---

## Q6. Custom Hook — WebSocket with two bugs

```jsx
// ❌ buggy version — two production bugs
const useWebSocket = (url) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setStatus('connected');
    ws.onmessage = (event) => {
      setMessages(messages => [...messages, event.data]);
    };
    ws.onerror = () => setStatus('error');
  }, []); // ❌ Bug 1: url not in deps  ❌ Bug 2: no cleanup

  return { messages, status };
};
```

**Bug 1 — url not in dependency array:**
```
url changes → effect never re-runs
Still connected to old URL → stale closure
Messages coming from wrong server — silent production bug
```

**Bug 2 — no cleanup function:**
```
Component unmounts → WebSocket stays open
Still receiving messages → calling setState on unmounted component
Memory leak + ghost connections in production
```

---

### ✅ Fixed version:

```jsx
const useWebSocket = (url) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen    = () => setStatus('connected');
    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]); // functional — depends on prev
    };
    ws.onerror   = () => setStatus('error');
    ws.onclose   = () => setStatus('disconnected');

    // Fix 1 — cleanup closes connection on unmount or url change
    return () => {
      ws.close();
    };

  }, [url]); // Fix 2 — reconnects when url changes

  return { messages, status };
};
```

---

### Custom hook rule — connects back to linked list

Custom hooks **must start with `use`** — React uses this prefix to enforce hook rules inside them.

```jsx
// ❌ React won't enforce hook rules inside this
function getWebSocket(url) {
  const [messages, setMessages] = useState([]); // no warning if used conditionally
}

// ✅ React enforces hook rules inside this
function useWebSocket(url) {
  const [messages, setMessages] = useState([]); // rules enforced
}
```

**Critical insight:** Custom hooks have **no Fiber of their own.** Every hook inside a custom hook adds to the **calling component's** Fiber linked list:

```
<MyComponent> Fiber memoizedState:
  slot 0 → useState (component directly)
  slot 1 → useState (from useWebSocket — still here!)
  slot 2 → useEffect (from useWebSocket — still here!)
  slot 3 → useState (component directly)
```

Calling a custom hook conditionally shifts slots in the parent's linked list — breaks everything.

---

## Production Rules to Memorize

### Always return cleanup from useEffect:
```jsx
useEffect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id); // always!
}, []);

useEffect(() => {
  const ws = new WebSocket(url);
  return () => ws.close(); // always!
}, [url]);
```

### Every value used inside effect goes in deps:
```jsx
useEffect(() => {
  doSomething(url, config); // both used → both in deps
}, [url, config]); // ✅
```

### Functional updates only when depending on previous state:
```jsx
setStatus('connected');              // ✅ not dependent on previous
setMessages(prev => [...prev, msg]); // ✅ dependent on previous
setCount(c => c + 1);               // ✅ dependent on previous
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Hook storage | Linked list on Fiber node — position based |
| Rules of hooks | Conditional/loop hooks shift positions → breaks cursor |
| useState update | Async — schedules re-render, value unchanged in current render |
| Batching | Multiple setStates in same handler → batched into one render |
| Functional updates | Use when new state depends on previous state |
| Object.is() | How React compares deps — reference comparison for objects |
| useEffect cases | No deps = every render, [] = mount only, [x] = mount + x changes |
| Stale closure | Effect captures variable at render time — outdated by next render |
| Stale closure fix | useRef to hold latest value — no re-render triggered |
| useRef | Plain object {current: value} — mutable, synchronous, silent |
| useRef vs useState | useState drives UI. useRef tracks silently |
| Cleanup | Always return cleanup — intervals, sockets, subscriptions |
| Missing deps | Stale closure bug — always add values used inside effect |
| Custom hooks | No own Fiber — hooks belong to calling component's linked list |
| use prefix | Required — tells React to enforce hook rules inside |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
