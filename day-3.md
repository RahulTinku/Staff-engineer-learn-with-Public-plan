# JavaScript Deep Dive — Prototypes & `this` Binding
**Date:** March 08, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. How does JavaScript share methods between objects under the hood?

**Answer:**
Methods are stored **once on the prototype object** — not copied to each instance. All instances share them via reference.

```javascript
function Person(name) {
  this.name = name; // stored on the INSTANCE
}

Person.prototype.sayHello = function() {
  console.log(this.name); // stored ONCE on prototype
};

const rahul = new Person('Rahul');
const john = new Person('John');

rahul.sayHello === john.sayHello // true — same function in memory!
```

**Prototype chain lookup:**
When you call `rahul.sayHello()`:
1. JS looks for `sayHello` on `rahul` instance → not found
2. Walks up to `Person.prototype` → found, executes it
3. If not found anywhere → reaches `Object.prototype` → then `null` → throws error

---

## Q2. Four rules of `this` binding (in order of precedence)

### Rule 1 — Default Binding (lowest priority)
Standalone function call → `this` = `window` (or `undefined` in strict mode)
```javascript
function sayHello() {
  console.log(this); // window / undefined
}
sayHello();
```

### Rule 2 — Implicit Binding
Method called on object → `this` = that object
```javascript
const rahul = {
  name: 'Rahul',
  greet() { console.log(this.name); } // 'Rahul'
};
rahul.greet();

// ⚠️ Classic trap — implicit binding lost
const greet = rahul.greet;
greet(); // undefined — this is now window!
```

### Rule 3 — Explicit Binding
Manually set `this` via `.call()`, `.apply()`, `.bind()`
```javascript
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}
const rahul = { name: 'Rahul' };

greet.call(rahul, 'Hello');         // Hello, Rahul — args individually
greet.apply(rahul, ['Hello']);      // Hello, Rahul — args as array
const bound = greet.bind(rahul);    // returns NEW permanently bound function
bound('Hello');                     // Hello, Rahul
```

### Rule 4 — new Binding (highest priority)
Called with `new` → `this` = newly created object
```javascript
function Person(name) {
  this.name = name; // this = brand new object
}
const rahul = new Person('Rahul');
```

### Priority Order:
```
new > explicit (.call/.apply/.bind) > implicit (obj.method()) > default
```

### Arrow functions — special case:
Arrow functions have **no own `this`**. They inherit `this` **lexically** from the enclosing scope at definition time — regardless of how they are called.

---

## Q3. Classic `this` lost in setTimeout — and three fixes

```javascript
class PlatformLogger {
  constructor() {
    this.prefix = '[Platform]';
  }
  log(message) {
    console.log(`${this.prefix}: ${message}`);
  }
  init() {
    setTimeout(this.log, 1000); // ❌ this.log detaches from instance
  }
}
```

**Bug:** `this.log` is passed as a bare function reference — detached from `PlatformLogger`. When setTimeout fires, `this` = `window` → `this.prefix` is `undefined` → error.

### Fix 1 — Arrow function wrapper (most readable)
```javascript
init() {
  setTimeout(() => this.log('hello'), 1000);
}
// Arrow captures this lexically from init's context = logger instance
```

### Fix 2 — .bind() at call site (explicit intention)
```javascript
init() {
  setTimeout(this.log.bind(this), 1000);
}
```

### Fix 3 — Bind in constructor (React class pattern — bind once)
```javascript
constructor() {
  this.prefix = '[Platform]';
  this.log = this.log.bind(this); // permanently bound
}
// Now this.log is safe to pass anywhere
```

| Fix | Tradeoff |
|---|---|
| Arrow wrapper | New function each call — clean and readable |
| `.bind()` at call site | New function each call — explicit binding intention |
| Bind in constructor | Created once — method moves from prototype to instance |

---

## Q4. Object.create vs new — and property shadowing

```javascript
const animal = {
  type: 'Animal',
  describe() { return `I am a ${this.type}`; }
};

const dog = Object.create(animal);
dog.type = 'Dog';

const cat = Object.create(animal);

dog.describe(); // 'I am a Dog'
cat.describe(); // 'I am a Animal'
```

### Object.create vs new:
```
Object.create(proto)          new Person()
─────────────────────         ────────────────────
Creates empty object          Creates empty object
Sets [[Prototype]] = proto    Sets [[Prototype]] = Person.prototype
No constructor runs           Runs constructor function
No this initialization        Binds this to new object
Pure prototype wiring         Prototype wiring + initialization
```

### Property Shadowing:
`dog.type = 'Dog'` does NOT modify `animal.type`. It creates a **new own property** on `dog` that **shadows** the prototype property:

```
dog  { type: 'Dog' }  →  [[Prototype]]  →  animal { type: 'Animal' }
cat  {}               →  [[Prototype]]  →  animal { type: 'Animal' }
```

```javascript
dog.hasOwnProperty('type')    // true — own property
cat.hasOwnProperty('type')    // false — lives on prototype
animal.hasOwnProperty('type') // true — untouched
```

### `this` rule firing in `dog.describe()`:
**Rule 2 — Implicit Binding.** `describe` lives on `animal` prototype but is called on `dog` → `this` = `dog`. Method is shared, `this` is always dynamic.

---

## Q5. delete & prototype fallback — platform config trap

```javascript
const baseConfig = {
  env: 'production',
  getEnv() { return this.env; }
};

const teamConfig = Object.create(baseConfig);
teamConfig.env = 'staging';

teamConfig.getEnv();   // 'staging'  — own property
baseConfig.getEnv();   // 'production'

delete teamConfig.env; // deletes OWN property only

teamConfig.getEnv();   // 'production' — falls back to prototype!
```

**`delete` only removes own properties — never touches prototype.**

### Real platform bug:
```javascript
// Team thinks they're resetting config
delete teamConfig.env;

// Silently falls back to baseConfig.env = 'production'
// No error, no warning — wrong environment in production
```

### Fix:
```javascript
// Explicitly set to null instead of delete
teamConfig.env = null;

// Or freeze base config entirely
const baseConfig = Object.freeze({ env: 'production' });
```

---

## Q6. ES6 Classes — syntactic sugar over prototypes

```javascript
class Animal {
  constructor(type) { this.type = type; }
  describe() { return `I am a ${this.type}`; }
}

class Dog extends Animal {
  constructor(name) {
    super('Dog');
    this.name = name;
  }
  describe() { return `${super.describe()}, my name is ${this.name}`; }
}

const dog = new Dog('Bruno');
dog.describe(); // 'I am a Dog, my name is Bruno'
```

### Full prototype chain:
```
dog instance
  { type: 'Dog', name: 'Bruno' }       ← own properties
        ↓ [[Prototype]]
Dog.prototype
  { describe: fn }                      ← Dog's describe
        ↓ [[Prototype]]
Animal.prototype
  { describe: fn, constructor: Animal } ← Animal's describe
        ↓ [[Prototype]]
Object.prototype
  { hasOwnProperty, toString... }
        ↓
null
```

### super() is mandatory in derived class constructors:
In a derived class, **parent constructor creates the `this` object.** Child has no `this` until `super()` runs.

```javascript
class TeamApp extends PlatformBase {
  constructor(config) {
    // this.config = config; ❌ ReferenceError — no this yet!
    super(); // ✅ must be first — creates this, runs base init
    this.config = config;
  }
}
```

**If team forgets `super()`** → all base class services (logger, auth, metrics) never initialized → silently undefined → crashes when actually used.

---

## Q7. EventEmitter — instance vs prototype state + memory leaks

```javascript
class EventEmitter {
  constructor() {
    this.listeners = {}; // ✅ MUST be in constructor — per-instance state
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}
```

### Full prototype chain:
```
platform instance
  { config: {}, listeners: {} }        ← own properties (from constructors)
        ↓ [[Prototype]]
PlatformCore.prototype
  { constructor: PlatformCore }
        ↓ [[Prototype]]
EventEmitter.prototype
  { on: fn, emit: fn }                 ← shared methods
        ↓ [[Prototype]]
Object.prototype
```

### Catastrophic bug — listeners on prototype:
```javascript
// ❌ junior engineer moves listeners to prototype
EventEmitter.prototype.listeners = {};

const platform1 = new PlatformCore();
const platform2 = new PlatformCore();

platform1.on('config:loaded', callbackA);
platform2.on('config:loaded', callbackB);

// platform1.listeners === platform2.listeners → TRUE — shared!
platform1.emit('config:loaded', data);
// Fires BOTH callbackA and callbackB — cross-instance contamination!
```

**Rule:** State that should be per-instance → always initialize in constructor via `this`. Behaviour shared across instances → lives on prototype.

### Memory leak with on():
```javascript
class TeamComponent {
  init(platform) {
    platform.on('config:loaded', (data) => {
      this.handleConfig(data); // closes over 'this'
    });
  }
}

component = null; // "destroyed"
// BUT platform.listeners still holds callback
// Callback closes over old TeamComponent instance
// GC cannot collect it → memory leak
```

### Fix — off() + cleanup:
```javascript
class EventEmitter {
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]
      .filter(cb => cb !== callback);
  }
}

class TeamComponent {
  init(platform) {
    this.handleConfig = (data) => this.processConfig(data);
    platform.on('config:loaded', this.handleConfig);
  }
  destroy(platform) {
    platform.off('config:loaded', this.handleConfig); // cleanup!
  }
}
```

### once() — for single-fire bootstrap events (auto-cleanup):
```javascript
once(event, callback) {
  const wrapper = (data) => {
    callback(data);
    this.off(event, wrapper); // removes itself after first fire
  };
  this.on(event, wrapper);
}
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Prototype chain | Methods stored once on prototype, shared by all instances via reference |
| Property shadowing | Assignment creates own property — never mutates prototype |
| `delete` | Only removes own properties — silently falls back to prototype |
| `this` — 4 rules | new > explicit > implicit > default |
| Arrow functions | No own `this` — inherit lexically from enclosing scope |
| `this` in callbacks | Always lost when function detached from object — use arrow/bind/constructor bind |
| Object.create | Pure prototype wiring — no constructor, no this init |
| new | Prototype wiring + constructor + this binding |
| super() | Mandatory first line in derived constructor — creates this |
| Instance vs prototype state | State → constructor. Behaviour → prototype |
| EventEmitter leak | Always implement off() — call it on component destroy |
| once() | Auto-cleanup for single-fire events |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
