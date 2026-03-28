# URL Shortener System Design — Revision Notes

## 1. Requirements & Capacity

- DAU: 100M (people clicking short URLs)
- New URLs created: 3.3M/day
- Read RPS: ~3,800 (redirects)
- Write RPS: ~38 (URL creation)
- Read:Write ratio: 100:1
- Storage: ~1.6GB/day (~600GB/year)
- P99 latency: < 50ms for redirects
- Availability: 99.99% (~52 min downtime/year)
- Consistency: non-negotiable (same short URL must always resolve to same destination)
- This is a CP system (consistency over availability during partitions)
- Cache: mandatory (Redis) — 100:1 read-heavy, same URLs clicked millions of times

---

## 2. CAP Theorem — The Real Meaning

- CAP does NOT say "pick 2 out of 3 always"
- CAP says: "When a network PARTITION happens, choose between Consistency and Availability"
- Normal operation: you get BOTH consistency and availability — no contradiction
- URL Shortener during partition: choose consistency — wrong redirect is worse than brief downtime
- Twitter during partition: choose availability — stale feed is better than no feed

---

## 3. P99 / P50 / P95 Explained

- P99 = 99% of requests are faster than this number
- P50 (median) = typical user experience
- P99 = worst realistic experience (excludes extreme outliers)
- Average HIDES pain — one 5-second request can hide behind a 54ms average
- P99 exposes it — Google, Amazon, Twitter all use P99

| System | P99 target |
|---|---|
| URL redirect | < 50ms |
| Feed loading | < 200ms |
| Search results | < 200ms |
| File upload | < 1s |

---

## 4. Key Generation — Three Approaches

### Approach 1: Hash the long URL
- MD5/SHA-256 → take first 7 characters
- Same input = same hash (deterministic)
- Problem: collision risk with truncation, need retry loop

### Approach 2: Counter + Base62
- Global auto-increment counter → Base62 encode
- Zero collisions
- Problem: single counter = single point of failure, sequential = guessable

### Approach 3: KGS (Pre-Generated Key Service) — BEST
- Separate service pre-generates millions of unique 7-char Base62 keys
- Stores in keys_available table, moves to keys_used on assignment
- Zero collisions, zero computation at write time, non-guessable
- 7 chars of Base62 = 62^7 = 3.5 TRILLION unique URLs

### Base62 Encoding
- Characters: a-z (26) + A-Z (26) + 0-9 (10) = 62 characters
- 7 characters = 3.5 trillion combinations

---

## 5. Custom Alias Handling

- Custom alias and KGS keys must share the SAME table (single namespace)
- If separate tables: KGS generates "sale2026", user requests "sale2026" as alias → collision
- Single url_mappings table with short_key as primary key → enforces uniqueness across both
- Custom alias flow: check url_mappings → exists? → 409 Conflict → doesn't exist? → insert

---

## 6. Database Lookups — Not All Queries Are Expensive

- Primary key lookup: O(1) hash or O(log n) B-tree — fast even with 10B rows
- B-tree with 10B rows: only 3-4 disk reads (~3ms)
- Index scan: O(log n + k) — moderately fast
- Full table scan: O(n) — expensive, this is why Elasticsearch exists for text search
- "Search by primary key" = never a concern

---

## 7. Write Flow

```
Client → LB → API Server
  1. Custom alias? → check url_mappings → exists? → 409 Conflict
  2. No custom alias → get key from KGS
  3. Write to DB (url_mappings table)
  4. Write to Redis cache (same request, not via Kafka)
  5. Return 201 Created + short URL
```

- No Kafka needed for write flow — it's one URL, one DB write, one cache write
- Deduplication (same long URL → reuse existing short URL) is optional, not mandatory

---

## 8. Read Flow (Redirect)

```
Client → LB → Redirect Server
  1. Extract key from URL (short.ly/abc123 → "abc123")
  2. Check Redis → HIT → 302 redirect
  3. MISS → Check DB → found → write to Redis → 302 redirect
  4. Not in DB → 404 Not Found
```

---

## 9. HTTP 301 vs 302 — Critical Decision

| Code | Name | Browser behavior | Consequence |
|---|---|---|---|
| 301 | Moved Permanently | Caches redirect, never asks server again | Lose all click data after first visit |
| 302 | Found (Temporary) | Asks server every time | Every click hits server → analytics possible |

- Use 302 because:
  1. Analytics — every click hits your server, you can count them
  2. Flexibility — can change destination URL later
  3. Latency difference is negligible (< 50ms P99 anyway)

---

## 10. Analytics Pipeline (Click Tracking)

- Must NOT slow down redirects — async via Kafka

```
Click → Redirect Server
  ├── Extract from HTTP headers:
  │     User-Agent → device type, browser
  │     X-Forwarded-For → IP → country (GeoIP)
  │     Referer → where they clicked from
  │
  ├── Publish to Kafka (async, non-blocking, ~1ms)
  │     { short_key, timestamp, country, device, browser, referrer }
  │
  └── Return 302 redirect (user doesn't wait for analytics)

Kafka consumers:
  ├── Analytics Consumer → Cassandra (raw events, detailed reports)
  └── Counter Consumer → Redis INCR (real-time dashboard)
        ├── abc123:total_clicks
        ├── abc123:clicks:IN
        └── abc123:clicks:iPhone
```

- Two consumers on same Kafka topic: raw storage + real-time counters
- Redirect latency overhead: ~1ms (Kafka publish is non-blocking)

---

## 11. Handling Viral URLs (Hot Key Problem)

- Rate limiting is WRONG — these are legitimate users, not attackers
- Rate limiting = protect from abuse. Caching layers = protect from legitimate load.

### Defense layers (each absorbs traffic for the next):

| Layer | What it does | Impact |
|---|---|---|
| Local cache (app server memory) | 0ms lookup, no network hop | Absorbs 99%+ of requests |
| Redis read replicas | Distribute read load across replicas | Handles remaining misses |
| Horizontal scaling (more app servers) | More servers behind LB | Distributes connections |
| CDN edge caching | Serve redirect from nearest edge globally | Absorbs global spikes |

### Local cache (most candidates miss this):
- In-memory HashMap on each app server
- Short TTL (5 seconds) — URL mappings are immutable, safe to cache
- 10 app servers × local cache = Redis goes from 1,700 RPS to ~10 RPS

### CDN caching trade-off:
- CDN caches redirect → most users never reach your server → analytics lost
- Options: short TTL on CDN, tracking pixel, or skip CDN and rely on local cache + Redis replicas

---

## Quick Reference — Key Patterns

| Pattern | What it means |
|---|---|
| KGS (Key Generation Service) | Pre-generate unique keys offline, assign at write time |
| Base62 encoding | 62 characters (a-z, A-Z, 0-9), 7 chars = 3.5T combinations |
| Single namespace | KGS keys + custom aliases in same table prevents collisions |
| 302 over 301 | Temporary redirect preserves analytics and flexibility |
| Async analytics via Kafka | Fire event to Kafka, don't block the redirect |
| Local cache | App-server memory cache for immutable hot data |
| Hot key problem | One key gets disproportionate traffic — solve with cache layers, not rate limiting |
| CP system | Choose consistency over availability during partitions |
