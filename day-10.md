# JavaScript Deep Dive — Module Federation & Micro-Frontends
**Date:** March 18, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## Q1. What Problem Does Module Federation Solve? 

### The Monolith Problem at Scale

```
All 8 teams in one repo:
- One PR = full regression test of entire app
- Merge conflicts across teams for unrelated changes
- One team's bug takes down entire application
- Deployment frequency blocked by slowest team
- No independent ownership of features
- ~40% engineering time lost to coordination overhead
```

### What Module Federation Specifically Solves

> The ability to **share code at runtime across separately deployed applications** — without requiring a full rebuild or redeployment of consuming apps.

**Before Module Federation — npm package approach:**
```
Platform team updates platform-core v1.2 → v1.3
    ↓
Team A: update package.json → npm install → rebuild → deploy
Team B: update package.json → npm install → rebuild → deploy
Team C: stays on v1.2 (too busy)
    ↓
Version fragmentation in production
Coordinated deploys across 10 teams for one bug fix
```

**With Module Federation:**
```
Platform team updates platform-core v1.3 → deploys ONE endpoint
    ↓
All consuming apps load from that endpoint at RUNTIME
All teams get v1.3 simultaneously
Zero rebuilds. Zero coordinated deploys.
```

---

## Q2. Two Limitations of Monorepo Shared Packages

### Limitation 1 — Build-time Coupling
```
Monorepo shared package:
- Team A uses platform-core@1.2.0
- platform-core updates to 1.3.0
- Team A must rebuild and redeploy to get the update
- Coupled at BUILD TIME — not runtime

Module Federation:
- Host loads remote module at RUNTIME
- Platform deploys update once → all apps get it immediately
- Zero rebuilds required
```

### Limitation 2 — Bundle Duplication
```
npm packages:
- Team A bundles React 18 into their app
- Team B bundles React 18 into their app
- Team C bundles React 18 into their app
- User downloads React 18 THREE times on the same page

Module Federation shared: {}
- React 18 loaded ONCE by the host
- All remotes share the same instance
- User downloads React 18 exactly once
- Prevents multiple React instances → hooks work correctly
```

---

## Q3. Four Micro-Frontend Integration Patterns

### Pattern 1 — Build-time Integration

**What it does:**
Teams publish their features as npm packages. Shell installs and bundles them at build time.

```json
// Shell package.json
{
  "dependencies": {
    "team-checkout": "1.2.0",
    "team-search": "3.1.0"
  }
}
```

```
✅ Simple, familiar, type-safe, works with any bundler
✅ No runtime loading complexity
❌ Teams must rebuild shell to get any remote update
❌ Bundle grows with every new micro-frontend
❌ Version coordination required across all teams
❌ Defeats the purpose of independent deployment
```

**Use when:** Small teams, tight coupling acceptable, simple architecture.

---

### Pattern 2 — Runtime via iframe

**What it does:**
Shell embeds each micro-frontend as a separate browser context via `<iframe>`.

```html
<iframe src="https://checkout.walmart.com" />
```

```
✅ Perfect isolation — remote crash doesn't affect shell
✅ Teams can use ANY framework (React, Vue, Angular, vanilla)
✅ Security boundary — separate origin, cookies, DOM
✅ Best for: third-party widgets, payment forms, ads
❌ Communication only via postMessage — complex and fragile
❌ Duplicate downloads — each iframe loads own React, router, auth
❌ No shared state — auth tokens passed via URL/postMessage only
❌ UX problems — separate scroll, focus, history management
❌ Performance degrader — heavy DOM overhead
```

**Use when:** True isolation required — payment forms, third-party content, ads.

---

### Pattern 3 — Runtime via JavaScript / Module Federation ✅

**What it does:**
Remote builds `remoteEntry.js` manifest. Shell loads remote modules at runtime via webpack.

```javascript
// Shell webpack.config.js
new ModuleFederationPlugin({
  remotes: {
    checkout: 'checkout@https://checkout.walmart.com/remoteEntry.js'
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' }
  }
})

// Remote webpack.config.js
new ModuleFederationPlugin({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: {
    './CheckoutFlow': './src/CheckoutFlow'
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' }
  }
})
```

```
✅ Independent deployment — remote updates live immediately
✅ Shared dependencies — React loaded once, not per team
✅ Same DOM — full shell/remote communication via Context
✅ Automatic lazy loading — route-based, built into webpack
✅ Best for: same-framework large orgs (all React)
❌ Runtime failure — if remote URL down, feature breaks
❌ Version conflicts — shared lib version mismatches
❌ Debugging complexity — errors cross app boundaries
❌ Both teams need webpack/rspack
```

**Use when:** Same framework across teams, large org, independent deployment is priority.

---

### Pattern 4 — Runtime via Web Components

**What it does:**
Remote builds a Custom Element (native browser API). Shell loads via script tag and uses like HTML element.

```javascript
// Remote team — can be React, Vue, Angular internally
class CheckoutElement extends HTMLElement {
  connectedCallback() {
    ReactDOM.render(<CheckoutFlow />, this);
  }
  disconnectedCallback() {
    ReactDOM.unmountComponentAtNode(this);
  }
}
customElements.define('walmart-checkout', CheckoutElement);
```

```html
<!-- Shell index.html — loads remote script -->
<script src="https://checkout.walmart.com/checkout.js"></script>

<!-- Shell app — uses like any HTML element -->
<walmart-checkout user-id="123" cart-id="456" />
```

```
✅ True framework agnostic — shell React, remote Vue — doesn't matter
✅ Native browser API — no webpack config required
✅ Long-term stability — Web Components spec is permanent
✅ Shadow DOM provides CSS isolation
❌ Attribute-based communication only — complex objects painful
❌ Shared React instance impossible — two Reacts breaks hooks
❌ Poor SSR support — custom elements are browser-only
❌ Manual lazy loading required — more boilerplate
❌ React + Web Components interop is awkward
```

**Use when:** Mixed framework org, framework agnosticism is a hard requirement.

---

### Lazy Loading Web Components — it IS possible:

```javascript
// ❌ eager — loads on every page
<script src="https://checkout.walmart.com/checkout.js"></script>

// ✅ lazy — load on demand via dynamic script injection
const loadCheckout = () => new Promise((resolve) => {
  const script = document.createElement('script');
  script.src = 'https://checkout.walmart.com/checkout.js';
  script.onload = resolve;
  document.head.appendChild(script);
});

// Load when route is hit
useEffect(() => {
  loadCheckout().then(() => setLoaded(true));
}, []);
```

---

### Trade-off Matrix:

| Pattern | Isolation | Performance | Independence | Complexity | Use when |
|---|---|---|---|---|---|
| Build-time | Low | Best | ❌ Rebuild needed | Low | Small teams |
| iframe | Perfect | Worst | ✅ Full | Low | Third party, payment |
| JS/Module Fed | Medium | Good | ✅ Full | High | Same framework, large org |
| Web Components | Good | Good | ✅ Full | Medium | Mixed frameworks |

---

## Q4. Module Federation Internals

### What remoteEntry.js Actually Contains

`remoteEntry.js` is a **manifest/registry** — NOT the actual code:

```javascript
// What remoteEntry.js contains — simplified
var checkout = {
  // what modules are available and where
  './CheckoutFlow': {
    chunk: 'checkout_CheckoutFlow.js', // actual code lives here
    version: '1.2.0'
  },
  './CartSummary': {
    chunk: 'checkout_CartSummary.js',
    version: '1.2.0'
  },
  // what dependencies this remote needs
  shared: {
    react: { version: '18.3.0', singleton: true },
    'react-dom': { version: '18.3.0', singleton: true }
  }
};

// remoteEntry.js = ~2-5KB — always fetched
// checkout_CheckoutFlow.js = ~400KB — only fetched when needed
```

---

### What singleton: true Prevents — The Catastrophic Bug

```javascript
// Without singleton: true
// Shell loads React 18.0 → instance A
// Checkout loads React 18.3 → instance B

// Shell creates Context with instance A
// Checkout tries useContext with instance B
// Different instances → Context not found → silent undefined

// Error you see:
// "Invalid hook call. Hooks can only be called inside
//  a function component."
// Even though your code is correct — wrong React instance

// With singleton: true
shared: {
  react: { singleton: true, requiredVersion: '^18.0.0' }
}
// ONE React instance loaded — ever
// All hooks, Context, refs work correctly across all remotes
```

---

### Runtime Loading Steps — Full Sequence

```
User visits https://walmart.com/checkout
    ↓
1. React Router matches /checkout route
    ↓
2. Shell hits: import('checkout/CheckoutFlow')
   (dynamic import generated by webpack from remote config)
    ↓
3. Shell fetches remoteEntry.js from
   https://checkout.walmart.com/remoteEntry.js (~2-5KB)
    ↓
4. remoteEntry.js parsed:
   - CheckoutFlow lives in checkout_CheckoutFlow.js
   - Remote needs React 18.3
    ↓
5. Shared dependency negotiation:
   - Shell has React 18.0, remote wants 18.3
   - Both satisfy ^18.0.0 → highest version wins (18.3)
    ↓
6. Shell downloads checkout_CheckoutFlow.js chunk
    ↓
7. CheckoutFlow available — shell renders it
    ↓
8. React renders CheckoutFlow using shared single React instance
```

---

### Version Negotiation — Who Wins?

```javascript
// Shell: react@18.0.0
// Remote: react@18.3.0
// requiredVersion: '^18.0.0' (both satisfy)

// Rule: HIGHEST compatible version wins
// 18.3.0 > 18.0.0 → React 18.3 loaded
// Shell upgraded to 18.3 at runtime
// Remote and shell share same 18.3 instance ✅
```

**The dangerous edge case — major version mismatch:**
```javascript
// Shell on React 17, Remote on React 18
// React 17 and 18 are NOT compatible under ^18.0.0
// Module Federation cannot satisfy both
// Result: warning + potentially two React instances
// Hooks break — very hard to debug

// This is why version governance matters at platform level
```

---

## Q5. Versioning Strategy

### Breaking Change Policy

```
Week 0:   RFC published — all team leads comment within 2 weeks
Week 2:   RFC approved — migration guide + codemods published
Month 1:  platform-core-v2 released alongside platform-core v1
          Both versions available — no teams broken
Month 1-4: Teams migrate at own pace
Month 3:  console.warn added to v1 APIs — visible in dev
Month 5:  CI warning added — builds pass but flag v1 usage
Month 6:  v1 deprecated — removed from shared config
```

### Two-Version Coexistence in Module Federation

```javascript
// During migration window — different names = different singletons
shared: {
  'platform-core':    { singleton: true, requiredVersion: '^1.0.0' },
  'platform-core-v2': { singleton: true, requiredVersion: '^2.0.0' },
}
// Teams import from whichever they've migrated to
// No conflict — different module names = different registry entries
// Both run simultaneously during migration window
```

### Version Range Policy

```
^ (caret)  → ✅ always — compatible minor + patch updates
~ (tilde)  → ⚠️ only for known unstable libs — patch only
* (star)   → ❌ never — no stability guarantee
exact      → ❌ never — blocks teams from receiving bug fixes
```

### Governance — Platform Team Owns shared: {}

```javascript
// ❌ dangerous — teams control shared config independently
// Team A: react: { requiredVersion: '^17.0.0' }
// Team B: react: { requiredVersion: '^18.0.0' }
// → version negotiation fails → two React instances → hooks break silently

// ✅ platform team publishes canonical config as npm package
// @walmart/mf-config
// All teams EXTEND it — never override
```

---

## Q6. Micro-Frontend Design Document — Walmart

### Shell Responsibilities
- Application entry point — routing, global layout, header, footer
- Authentication — session, token refresh
- Global state — cart count, user identity, feature flags
- Shared Context providers — AuthContext, CartContext, ThemeContext
- Error boundaries — fallback UI per remote
- **Owns shared: {} webpack config exclusively**

### Remote Boundaries

| Remote | Route | Owns | Does NOT own |
|---|---|---|---|
| Search | `/search` | Search UI, filters | Auth, cart state |
| PDP | `/product/:id` | Product detail | Recommendations logic |
| Cart | `/cart` | Cart UI, items | Checkout flow |
| Checkout | `/checkout` | Checkout, order | Payment iframe |
| Account | `/account` | Profile, orders | Auth tokens |

### Non-Negotiable Rules
```
❌ No business logic crosses remote boundaries
❌ No direct remote-to-remote imports
❌ No remote modifies global CSS
❌ No remote manages auth
✅ Remotes communicate via shell-provided Context only
✅ Scoped CSS modules or CSS-in-JS only
```

### Migration Strategy — Incremental, Never Big Bang

```
Phase 0 (Month 1-2): Shell foundation
  - Top-level routing, AuthContext, CartContext
  - Error boundary per route
  - @walmart/mf-config published
  - Local dev setup, integration test suite

Phase 1 (Month 2-3): Reviews remote FIRST
  WHY: lowest risk, not in purchase path,
       self-contained, small team, fast feedback

Phase 2 (Month 3-5): Non-critical path
  Account → Recommendations → Search

Phase 3 (Month 5-8): Critical path
  PDP → Cart → Checkout (blue/green deployment)

Phase 4 (Month 9): Monolith decommission
```

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Remote down → feature broken | Error boundary + fallback UI per remote |
| Shell bad deploy → all remotes broken | Canary deployment, automated integration tests |
| Version mismatch breaks hooks | Platform team owns shared config, CI compatibility checks |
| Remote latency | CDN for remoteEntry.js, preload critical remotes |

### Emergency Rollback

```javascript
// Shell can pin specific remoteEntry.js version
remotes: {
  checkout: 'checkout@https://checkout.walmart.com/v1.2.0/remoteEntry.js'
}
// Normally points to latest — emergency pin only
```

### Success Metrics

| Metric | Before | Target |
|---|---|---|
| Deployment frequency | 2x/week | Daily per team |
| Time to production | 3 weeks | 3 days |
| Coordination overhead | 40% eng time | <5% |
| Incident ownership time | 30 min | <5 min |

---

## Key Takeaways

| Concept | Remember |
|---|---|
| MF vs npm packages | npm = build-time coupling. MF = runtime independence |
| Bundle duplication | npm = React downloaded per team. MF shared = once |
| remoteEntry.js | Manifest/lookup table — NOT the actual module code |
| singleton: true | One React instance — prevents hook failures across boundaries |
| Version negotiation | Highest compatible version wins |
| Who owns shared config | Platform team — exclusively. Never teams independently |
| Version range | Always ^ — never * or exact |
| Two-version coexistence | Different module names = different singleton scopes |
| Breaking changes | RFC → beta → warn → CI warn → deprecate → remove (6 months) |
| iframe use case | Payment, third-party, ads — where isolation > everything |
| Web Components use case | Mixed framework orgs — framework agnostic requirement |
| Migration sequence | Lowest risk first — prove pattern before critical path |
| Shell owns | Routing, auth, global state, error boundaries, shared config |
| Remote owns | Business logic for their domain — nothing crosses boundaries |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
