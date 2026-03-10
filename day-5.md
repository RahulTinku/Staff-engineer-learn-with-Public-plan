# JavaScript Deep Dive — TypeScript Generics & Advanced Types
**Date:** March 10, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What are Generics and why not just use `any`?

**The problem with `any`:**
`any` tells TypeScript to **stop checking.** You lose all type safety — TypeScript won't catch invalid property access, wrong method calls, or type mismatches.

**What Generics solve:**
Generics preserve the **relationship between input and output types** — resolved at compile time, enforced throughout.

```typescript
// ❌ any — type relationship lost
function identity(arg: any): any {
  return arg;
}
const result = identity('hello'); // result type: any
result.someNonsense();            // no error — TS gave up

// ✅ generic — type relationship preserved
function identity<T>(arg: T): T {
  return arg;
}
const result = identity('hello'); // result type: string
result.toUpperCase();             // ✅ TS knows this is valid
result.someNonsense();            // ❌ TS catches this immediately
```

**Key distinction:**
- `any` → "stop checking"
- `T` → "I don't know the type yet — track it and enforce it"

**Important:** Generics are resolved at **compile time** — not runtime. TypeScript is erased at runtime. There are no generics in the JavaScript that actually executes.

---

## Q2. Generic Constraints — `keyof` and indexed types

```typescript
// ❌ TypeScript errors — K has no relationship to T
function getProperty<T, K>(obj: T, key: K) {
  return obj[key]; // Error: Type 'K' cannot be used to index type 'T'
}
```

**Why it errors:** TypeScript has no idea if `K` is a valid key of `T`. K could be anything — a number, boolean, or string that doesn't exist on the object.

**Fix — `extends keyof` constraint:**

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // ✅ TypeScript is happy
}
```

**Breaking down each part:**
- `keyof T` → union of all keys of T
- `K extends keyof T` → K must be one of those keys
- `T[K]` → return type is the exact type of that property

```typescript
const platform = {
  env: 'production',
  version: 3,
  debug: true
};

const env     = getProperty(platform, 'env');     // type: string
const version = getProperty(platform, 'version'); // type: number
const debug   = getProperty(platform, 'debug');   // type: boolean

// ❌ compile-time error — caught before code runs
const missing = getProperty(platform, 'missing');
// Argument of type '"missing"' is not assignable to
// parameter of type '"env" | "version" | "debug"'
```

**Platform impact:** Teams literally cannot access a key that doesn't exist — caught at compile time, not runtime.

---

## Q3. Utility Types — the essential five

Think of utility types as **type transformers** — they take an existing type and produce a new modified version without rewriting the original.

```typescript
type PlatformConfig = {
  env: string;
  apiUrl: string;
  timeout: number;
  debug: boolean;
};
```

---

### Partial\<T> — makes ALL properties optional

```typescript
type PartialConfig = Partial<PlatformConfig>;
// { env?: string; apiUrl?: string; timeout?: number; debug?: boolean }
```

**When to use:** Config overrides — teams pass only what they want to change:
```typescript
function createConfig(overrides: Partial<PlatformConfig>): PlatformConfig {
  return {
    env: 'production',
    apiUrl: 'https://api.walmart.com',
    timeout: 5000,
    debug: false,
    ...overrides // team only passes what they want to change
  };
}

createConfig({ debug: true });                              // ✅ valid
createConfig({ apiUrl: 'https://api-staging.walmart.com'}); // ✅ valid
```

---

### Required\<T> — makes ALL properties required

```typescript
type RequiredConfig = Required<PlatformConfig>;
// { env: string; apiUrl: string; timeout: number; debug: boolean }
// no ? anywhere — all must be present
```

**When to use:** Post-merge validation — guarantee final object is fully populated:
```typescript
function validateConfig(config: Required<PlatformConfig>): void {
  // TypeScript guarantees every field exists — no undefined checks needed
  if (!config.apiUrl) throw new Error('apiUrl required');
}
```

---

### Readonly\<T> — makes ALL properties immutable

```typescript
type ReadonlyConfig = Readonly<PlatformConfig>;
// { readonly env: string; readonly apiUrl: string; ... }
```

**Critical for shared platform config:**
```typescript
// ❌ Without Readonly — any team can mutate shared config
const platformConfig: PlatformConfig = { env: 'production', ... };
platformConfig.env = 'staging'; // silent production bug — all teams hit staging!

// ✅ With Readonly — mutation is a compile-time error
const platformConfig: Readonly<PlatformConfig> = { env: 'production', ... };
platformConfig.env = 'staging';
// ❌ Cannot assign to 'env' because it is a read-only property
```

---

### Pick\<T, K> — keep only specified properties

```typescript
type PublicConfig = Pick<PlatformConfig, 'env' | 'apiUrl'>;
// { env: string; apiUrl: string }
// timeout and debug are gone
```

**When to use:** Exposing a public API surface — teams only see what they need:
```typescript
function getPublicConfig(config: PlatformConfig): Pick<PlatformConfig, 'env' | 'apiUrl'> {
  return { env: config.env, apiUrl: config.apiUrl };
}
```

---

### Omit\<T, K> — remove specified properties

```typescript
type ConfigWithoutDebug = Omit<PlatformConfig, 'debug'>;
// { env: string; apiUrl: string; timeout: number }
```

**When to use:** Hiding internal properties from consuming teams:
```typescript
type TeamConfig = Omit<PlatformConfig, 'debug' | 'timeout'>;
```

---

### Quick Reference:

| Utility Type | What it does | When to use |
|---|---|---|
| `Partial<T>` | All properties optional | Config overrides, default merging |
| `Required<T>` | All properties required | Post-merge validation |
| `Readonly<T>` | All properties immutable | Shared config, preventing mutation |
| `Pick<T, K>` | Keep only specified keys | Public API surface |
| `Omit<T, K>` | Remove specified keys | Hiding internal properties |

---

### Platform library pattern combining all five:
```typescript
type PlatformConfig = {
  env: string;
  apiUrl: string;
  timeout: number;
  debug: boolean;
};

// Teams provide overrides — everything optional
type ConfigOverrides = Partial<PlatformConfig>;

// Public facing — teams don't see internals
type PublicConfig = Readonly<Omit<PlatformConfig, 'debug' | 'timeout'>>;

// Final merged config — everything required, immutable
type FinalConfig = Readonly<Required<PlatformConfig>>;
```

---

## Q4. Typed EventEmitter — mapped types + generics

```typescript
type EventMap = {
  'config:loaded':  { env: string; version: number };
  'user:login':     { userId: string; timestamp: number };
  'error:critical': { message: string; code: number };
};
```

### Type-safe emit and on:

```typescript
// emit — payload type derived from event name
function emit<E extends keyof EventMap>(
  event: E,
  payload: EventMap[E]
): void {}

// on — handler receives exact payload type
function on<E extends keyof EventMap>(
  event: E,
  handler: (payload: EventMap[E]) => void
): void {}
```

### TypeScript enforcement:
```typescript
// ✅ correct payload shape
emit('config:loaded', { env: 'production', version: 3 });

// ❌ wrong payload shape
emit('config:loaded', { userId: '123' });
// Argument of type '{ userId: string }' is not assignable to
// parameter of type '{ env: string; version: number }'

// ✅ handler gets exact types + autocomplete
on('user:login', (payload) => {
  console.log(payload.userId);    // ✅ TS knows this exists
  console.log(payload.env);       // ❌ doesn't exist on user:login
});
```

### Full TypedEventEmitter class — mapped type for listeners:

```typescript
class TypedEventEmitter {
  private listeners: {
    [E in keyof EventMap]?: Array<(payload: EventMap[E]) => void>
  } = {};
  // ↑ mapped type — iterates every key in EventMap
  // creates correctly typed listener array for each event

  on<E extends keyof EventMap>(
    event: E,
    handler: (payload: EventMap[E]) => void
  ): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }

  off<E extends keyof EventMap>(
    event: E,
    handler: (payload: EventMap[E]) => void
  ): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(h => h !== handler);
  }

  emit<E extends keyof EventMap>(
    event: E,
    payload: EventMap[E]
  ): void {
    this.listeners[event]?.forEach(handler => handler(payload));
  }
}
```

**Key pattern — mapped type:**
```typescript
{ [E in keyof EventMap]?: Array<(payload: EventMap[E]) => void> }
// iterates every key → creates typed listener array per event
```

---

## Q5. Conditional Types + `infer`

### Conditional types — `extends` as a question:
```typescript
type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>;  // 'yes' — string extends string ✅
type B = IsString<number>;  // 'no'  — number does not extend string
type C = IsString<'hello'>; // 'yes' — literal 'hello' extends string ✅
```

### Two uses of `extends` — critical distinction:
```typescript
// extends in GENERIC CONSTRAINTS — a RULE
// "T must be a subtype of string — reject anything else"
function greet<T extends string>(arg: T): T { return arg; }
greet(42); // ❌ compile error

// extends in CONDITIONAL TYPES — a QUESTION
// "Is T a subtype of string? → branch on the answer"
type IsString<T> = T extends string ? 'yes' : 'no';
// does NOT restrict T — just evaluates
```

---

### `infer` — extract types from inside other types

Without `infer` → you can only **check** types.
With `infer` → you can **extract** types from inside other types.

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
// "Does T match Promise<something>?"
// "If yes — capture that something as U and return it"
// "If no — return T as-is"

type A = UnwrapPromise<Promise<string>>; // string — Promise unwrapped
type B = UnwrapPromise<number>;          // number — not a Promise, returned as-is
```

### Real platform utility — extract async function return type:
```typescript
type AsyncReturnType<T extends (...args: any[]) => Promise<any>> =
  T extends (...args: any[]) => Promise<infer R> ? R : never;

async function fetchConfig(): Promise<PlatformConfig> { ... }

type ConfigType = AsyncReturnType<typeof fetchConfig>;
// ConfigType = PlatformConfig (not Promise<PlatformConfig>)
// If fetchConfig return type changes → ConfigType updates automatically
```

### More `infer` patterns:
```typescript
// Extract return type of any function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract type inside an array
type UnwrapArray<T> = T extends Array<infer U> ? U : T;
type A = UnwrapArray<string[]>; // string
type B = UnwrapArray<number[]>; // number
```

### The mental model for `infer`:
> `infer` is TypeScript saying — "I'll figure out this type from context and let you use it." It's pattern matching on types — like destructuring but at the type level.

```typescript
// JavaScript destructuring — extract values
const { name, age } = person;

// TypeScript infer — extract types
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
//                                             ↑
//                           "extract whatever is inside Promise"
```

---

## Q6. Type-safe API Client — everything combined

```typescript
type ApiRoutes = {
  '/config':    { response: PlatformConfig };
  '/user/:id':  { response: User; params: { id: string } };
  '/features':  { response: FeatureFlag[] };
};
```

### Build it in layers — never all at once:

**Layer 1 — extract response type:**
```typescript
type RouteResponse<R extends keyof ApiRoutes> = ApiRoutes[R]['response'];

type A = RouteResponse<'/config'>;    // PlatformConfig
type B = RouteResponse<'/features'>;  // FeatureFlag[]
type C = RouteResponse<'/user/:id'>;  // User
```

**Layer 2 — conditionally require params:**
```typescript
type RouteParams<R extends keyof ApiRoutes> =
  ApiRoutes[R] extends { params: infer P }  // does this route have params?
    ? { params: P }                          // yes → require params
    : { params?: never };                    // no  → params not allowed
```

**Layer 3 — full options type:**
```typescript
type RequestOptions<R extends keyof ApiRoutes> =
  RouteParams<R> & {
    headers?: Record<string, string>;
    timeout?: number;
  };
```

**Layer 4 — the api client:**
```typescript
const api = {
  get<R extends keyof ApiRoutes>(
    route: R,
    options?: RequestOptions<R>
  ): Promise<RouteResponse<R>> {
    return fetch(route).then(res => res.json());
  }
};
```

### TypeScript enforcement:
```typescript
// ✅ /config — no params needed, response typed as PlatformConfig
const config = await api.get('/config');

// ✅ /user/:id — params required, response typed as User
const user = await api.get('/user/:id', { params: { id: '123' } });

// ❌ forgot params
const user = await api.get('/user/:id');
// Error: Property 'params' is missing

// ❌ params on route that doesn't have them
const config = await api.get('/config', { params: { id: '123' } });
// Error: params does not exist on this route

// ❌ wrong route
const data = await api.get('/nonexistent');
// Error: not assignable to keyof ApiRoutes

// ❌ wrong property on response
config.userId;
// Error: property does not exist on PlatformConfig
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Generics vs `any` | `any` stops checking. Generics track and enforce type relationships |
| Compile vs runtime | Generics resolved at compile time — erased at runtime |
| `keyof T` | Union of all keys of T |
| `K extends keyof T` | Constrain K to valid keys of T |
| `T[K]` | Type of property K on T |
| `Partial<T>` | All optional — use for config overrides |
| `Required<T>` | All required — use for post-merge validation |
| `Readonly<T>` | All immutable — use for shared platform config |
| `Pick<T, K>` | Keep only specified keys — public API surface |
| `Omit<T, K>` | Remove specified keys — hide internals |
| Mapped types | `[E in keyof T]` — iterate over keys, create typed property per key |
| Conditional types | `extends` as a question — branch on type shape |
| Generic constraints | `extends` as a rule — restrict what T can be |
| `infer` | Extract types from inside other types — pattern match at type level |
| Build complex types | Layer by layer — extract → conditionals → compose → wire |

---

## Interview Script — how to explain type-safe API client

> *"I build complex type signatures in layers — not all at once. First I identify what I know: the route is a key of ApiRoutes, so I can index into it for the response type. Then I handle the conditional case — params only exist on some routes, so I use a conditional type with `infer` to extract params when they exist and forbid them when they don't. Finally I compose everything into the options type and wire it into the function signature. The result is teams get full autocomplete on routes, params, and response types — with zero `any` anywhere."*

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
