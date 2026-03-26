# System Design — The Framework & Instagram Deep Dive
**Date:** March 26, 2026
**Context:** Staff Engineer Interview Prep — One question at a time format

---

## The Four-Step Framework

Every Staff Engineer system design answer follows this structure. Never skip steps. Never reorder them.

```
Step 1 — Requirements Clarification (5 min)
Step 2 — Capacity Estimation (5 min)
Step 3 — High-Level Design (15-20 min)
Step 4 — Deep Dive (15-20 min)
Total: ~45 min
```

**Why jumping to solution fails:**
If you design the wrong system brilliantly — you score zero. Without clarifying, you might spend 40 minutes designing the wrong thing with perfect architecture. Interviewers watch whether you drive the conversation, not wait to be told what to build.

---

## Step 1 — Requirements Clarification

### Functional Requirements
What the system DOES. Core user journeys.

```
Format: "User should be able to..."
- What features are in scope?
- What is explicitly OUT of scope?
- Read heavy or write heavy?
- Who are the users?
```

### Non-Functional Requirements
How WELL the system does it. Must have NUMBERS — not vague statements.

```
❌ Vague: "the system should be fast"
✅ Measurable: "feed load < 200ms P99 latency"

❌ Vague: "the system should be available"
✅ Measurable: "99.9% uptime (8.7 hours downtime/year acceptable)"

Standard non-functional requirements:
Availability:    99.9% | 99.99% | 99.999%
Consistency:     Strong | Eventual (within X seconds)
Latency:         P50 / P99 response time
Durability:      Data must never be lost (eleven nines for storage)
Scale:           Must handle Nx traffic spikes
Geo:             Single region | Multi-region | Global
```

---

## Step 2 — Capacity Estimation

Numbers drive architecture decisions. A system for 1,000 users looks nothing like one for 100 million.

### Key Numbers to Memorize

```
1 day = 86,400 seconds ≈ 100,000 seconds (round for estimation)

Read from cache (Redis):    ~0.1 milliseconds
Read from database (SSD):   ~1-10 milliseconds
Network round trip:         ~100 milliseconds

1 KB = 1,000 bytes
1 MB = 1,000,000 bytes
1 GB = 1,000,000,000 bytes
1 TB = 1,000,000,000,000 bytes
1 PB = 1,000,000,000,000,000 bytes

1M requests/day  = ~12 RPS
1B requests/day  = ~12,000 RPS
```

### The Formulas

```
RPS = DAU × requests per user per day / 86,400

Storage per day = DAU × % who upload × average file size

Bandwidth = RPS × average response size
```

### Instagram Estimation Example

```
Given:
- 100M DAU
- Users open app 7 times/day
- 10% upload a photo/day
- Average photo: 100KB (after compression)

READ RPS:
100M × 7 = 700M reads/day
700M / 86,400 = ~8,100 reads/second

WRITE RPS:
100M × 10% = 10M uploads/day
10M / 86,400 = ~116 writes/second

READ:WRITE RATIO: 8,100:116 = 70:1 → READ HEAVY

STORAGE PER DAY:
10M photos × 2 images × 100KB = 2TB/day
After 5 years: 2TB × 365 × 5 = ~3.6PB total

BANDWIDTH:
8,100 RPS × 100KB = 810MB/second outbound

ARCHITECTURE IMPLICATIONS:
→ 70:1 read heavy = aggressive caching essential
→ 810MB/s = CDN non-negotiable
→ 3.6PB = object storage (S3), not database
→ 116 writes/sec = manageable, async processing
→ Eventual consistency acceptable = AP system
```

---

## The Building Blocks — Every System Uses These

### Load Balancer
Distributes requests across multiple servers.
```
                    ┌→ Server A
User → Load Balancer├→ Server B
                    └→ Server C
```

### Cache (Redis)
Fast in-memory storage. Returns data in microseconds vs database milliseconds.
```
Request → Check Redis cache
    HIT → return in 0.1ms
    MISS → query DB → store in Redis → return in ~10ms
```

### Database
```
SQL (PostgreSQL, MySQL):
- Tables, relationships, ACID transactions
- Good for: user accounts, financial data, relationships
- Bad for: massive unstructured scale

NoSQL (MongoDB, DynamoDB, Cassandra):
- Flexible schema, horizontal scaling
- Good for: massive scale, high write throughput
- Bad for: complex relationships, strong consistency
```

### Message Queue (Kafka)
Decouples services. Producer drops message, returns immediately. Consumer processes asynchronously.
```
API Server → drops message in Kafka → returns to user ✅

SIMULTANEOUSLY and INDEPENDENTLY:
Fan-out Service   → reads from Kafka → updates feeds
Notification Svc  → reads from Kafka → sends alerts
Thumbnail Svc     → reads from Kafka → resizes photos
Analytics Svc     → reads from Kafka → records stats

Benefits:
✅ User gets instant response
✅ Services are independent — one crash doesn't affect others
✅ Crash-safe — messages persist in Kafka, retried automatically
✅ Add new consumers without changing producer
```

### Object Storage (S3)
Stores files — images, videos, documents. Infinite hard drive.
```
Photo uploaded → stored in S3
URL stored in database
CDN serves actual file from S3 to users
```

### CDN (Content Delivery Network)
Servers globally distributed. Cache static content close to users.
```
Without CDN: User in India → Server in US → 200ms
With CDN:    User in India → CDN in Mumbai → 10ms

CDN caches: images, videos, CSS, JS — anything not per-user
CDN sits between CLIENT and S3 — not between servers
API calls still go through Load Balancer
```

---

## How Cache Misses Work — Three Reasons

### Reason 1 — Cold Start
```
New server starts → Redis is empty
First request → MISS → query DB → store in Redis
Second request → HIT → served instantly
```

### Reason 2 — TTL Expiry (most important)
```javascript
// Store with expiry
redis.set("feed:user_123", feedData, "EX", 300)
//                                         ^^^
//                                   expires in 300s (5 min)
```

```
10:00 — user opens feed → MISS → DB query → cached for 5 min
10:02 — user scrolls → HIT → served from Redis
10:03 — someone posts new photo → cache has OLD data (TTL not expired)
        user doesn't see it yet → EVENTUAL CONSISTENCY
10:05 — TTL expires → Redis deletes "feed:user_123"
10:05:30 — user refreshes → MISS → fresh DB query → sees new post ✅

TTL IS HOW EVENTUAL CONSISTENCY IS IMPLEMENTED
```

### Reason 3 — Cache Invalidation
```javascript
// When user posts new photo — explicitly delete stale caches
redis.del("feed:user_456") // follower 1 — will get fresh data next request
redis.del("feed:user_789") // follower 2 — will get fresh data next request
```

```
Comparison:
TTL approach:          simple, eventual consistency (minutes)
Cache invalidation:    complex, faster consistency (seconds)
```

---

## How Kafka Works

Think of Kafka as YouTube for messages:

```
Kafka Topic: "new-post-events"
┌─────────────────────────────────────────────────┐
│ msg1: {post_id:1, user_id:A, time: 10:00}       │
│ msg2: {post_id:2, user_id:B, time: 10:01}       │
│ msg3: {post_id:3, user_id:C, time: 10:02}       │
│ msg4: {post_id:4, user_id:D, time: 10:03}       │
└─────────────────────────────────────────────────┘
         ↑                    ↑                  ↑
   Fan-out service    Notification        Analytics
   (at position 3)   (at position 4)    (at position 2)

Each consumer reads at its OWN pace
Each consumer remembers where it left off (offset)
Messages stored for 7 days — never lost on crash
If fan-out crashes at msg3 → restarts → continues from msg3
```

---

## Fan-out Service — What It Is

Fan-out is YOUR code — a worker process that listens to Kafka. Not a third-party product.

```javascript
// Fan-out service — Node.js worker
async function fanOutWorker() {
  while (true) {
    const job = await kafka.consume('new-post-topic');
    // job = { post_id: 123, user_id: 456 }

    const followerCount = await db.getFollowerCount(job.user_id);

    if (followerCount < 1_000_000) {
      // Regular user — PUSH model
      const followers = await db.getFollowers(job.user_id);
      for (const followerId of followers) {
        await redis.lpush(`feed:${followerId}`, job.post_id);
      }
    } else {
      // Celebrity — PULL model (too expensive to push to 5M caches)
      await db.insertCelebrityPost({
        post_id: job.post_id,
        user_id: job.user_id
      });
      // Followers fetch this when they open their feed
    }
  }
}
```

---

## Instagram — Complete High-Level Design

### Component Map

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                            │
│              (mobile / web)                          │
└──────────────┬──────────────────┬───────────────────┘
               │ API calls        │ Static files (photos)
               ▼                  ▼
        ┌──────────┐        ┌──────────┐
        │  Load    │        │   CDN    │◄── S3
        │ Balancer │        │          │   (photo files)
        └────┬─────┘        └──────────┘
             │
    ┌────────▼────────┐
    │   API Servers   │ (horizontally scaled)
    └───┬─────────┬───┘
        │         │
   ┌────▼───┐ ┌───▼──────┐
   │ Redis  │ │PostgreSQL│
   │ Cache  │ │    DB    │
   └────────┘ └──────────┘
                    ↓
              ┌──────────┐
              │  Kafka   │ (message queue)
              └────┬─────┘
                   │
         ┌─────────▼──────────┐
         │   Fan-out Service  │
         │                    │
         │ <1M followers      │──► write to Redis (push)
         │ >1M followers      │──► mark available (pull)
         └────────────────────┘
```

### Upload Flow
```
User uploads photo
    ↓
API Server:
  1. Save photo → S3
  2. Save metadata → PostgreSQL
     { post_id, user_id, s3_url, caption, timestamp }
  3. Post message → Kafka { post_id, user_id }
  4. Return success to user IMMEDIATELY ✅

Kafka → Fan-out Service (async):
  - Regular user → update follower Redis caches (push)
  - Celebrity (>1M) → mark in celebrity_posts table (pull)

Kafka → Notification Service (async):
  - Send push notifications to followers

Kafka → Thumbnail Service (async):
  - Resize to 3 sizes → store in S3
```

### Read Flow (opening feed)
```
User opens Instagram
    ↓
API call → Load Balancer → API Server
    ↓
Check Redis: "feed:user_123"
    HIT (TTL not expired) → return feed metadata instantly
    MISS (TTL expired or cold start):
        → Query PostgreSQL
        → Merge pre-computed feed + celebrity_posts
        → Store in Redis with TTL
        → Return feed metadata
    ↓
Client fetches actual photos → CDN (not API)
    CDN HIT → served from edge server near user
    CDN MISS → CDN fetches from S3 → caches → serves
```

---

## Celebrity Post Problem — The Deep Dive

### The Problem
```
Celebrity with 5M followers posts photo
Fan-out service tries to update 5M Redis caches
→ 5M write operations simultaneously
→ Takes too long, too expensive
→ Does not scale
```

### The Solution — Hybrid Model
```
Regular users (<1M followers):
→ PUSH model: fan-out writes to each follower's feed cache
→ Feed reads are instant — pre-computed in Redis

Celebrity users (>1M followers):
→ PULL model: don't write to 5M caches
→ Just store post in celebrity_posts table
→ When follower opens feed:
    - Fetch pre-computed feed from Redis
    - Fetch latest from celebrity_posts
    - Merge → return combined feed
→ Slightly slower read but saves millions of writes
```

### The Thundering Herd Problem
```
Celebrity posts → 5M push notifications sent
→ 5M users open Instagram simultaneously
→ 5M cache MISSES at the same time
→ 5M database queries hit simultaneously
→ Database collapses 💥

Solutions:
1. Cache warming: pre-populate cache for most active followers
2. Request coalescing: 1000 users request same post →
   first request hits DB → 999 wait → all get cached result
3. Staggered notifications: send in batches of 500K,
   30 seconds apart → traffic spread over minutes
```

---

## Database Scaling — The Correct Progression

**Never jump to sharding. Exhaust cheaper options first.**

### Step 1 — Add Indexes (free, do first)
```sql
-- Without index: scans 500M rows = slow
-- With index: jumps directly to result = fast

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_followers_user_id ON followers(user_id);

Most "slow database" problems are missing indexes.
```

### Step 2 — Read Replicas
```
                    ┌─► Read Replica 1
Primary DB (writes) ├─► Read Replica 2
                    └─► Read Replica 3

Writes → Primary only
Reads  → Any replica (load balanced)

70:1 read heavy → 70% of DB load moves off primary
Replication lag: ~100ms → acceptable for eventual consistency
```

### Step 3 — Caching Layer
```
Add Redis in front of database
80% of reads served from cache
Only 20% (cache misses) hit database
Database load drops 80% — often solves the problem entirely
```

### Step 4 — Vertical Scaling
```
Upgrade to larger database instance
64 vCPUs, 512GB RAM
Simple, no code changes, buys time
Has limits — last resort before sharding
```

### Step 5 — Sharding (last resort)
```
Split data across multiple PRIMARY databases

SHARDING BY user_id:
user_id 0-100M    → Shard 1
user_id 100M-200M → Shard 2
user_id 200M-300M → Shard 3

Query for user_id=150M:
→ Shard router: 150M → Shard 2
→ Query goes only to Shard 2
→ Other shards untouched

CONSISTENT HASHING (smarter sharding):
→ Shards own ranges on virtual ring
→ Adding new shard → only move ~1/N of data
→ Minimal rebalancing vs naive range sharding
→ Used by Instagram, Discord, DynamoDB
```

### Sharding Trade-offs
```
✅ Virtually unlimited write scale
✅ Each shard smaller → faster queries
❌ Cross-shard queries expensive and complex
❌ Resharding is painful and risky
❌ Application must know which shard to query
→ Need shard router / routing layer
```

### The Interview Answer for DB Scaling
```
"My database is slowing down. Here's my approach:

1. Check indexes first — missing indexes cause most slowdowns
2. Add read replicas — move reads off primary (70:1 ratio helps)
3. Add Redis caching — 80% of reads from cache, not DB
4. Vertical scale — bigger instance buys time
5. Only if all above insufficient — horizontal sharding
   by user_id using consistent hashing

I implement in this order — each step is cheaper
and simpler than the next. Only shard when necessary."
```

---

## The Four Key Properties — Every Architecture Decision Is a Trade-off

```
SCALABILITY:
Vertical: bigger server → has limits, expensive
Horizontal: more servers → unlimited, industry standard

AVAILABILITY:
99.9%   = 8.7 hours downtime/year   (three nines)
99.99%  = 52 minutes downtime/year  (four nines)
99.999% = 5 minutes downtime/year   (five nines)
Achieved by: redundancy, no single point of failure, failover

CONSISTENCY:
Strong: all users see same data immediately
Eventual: all users see same data within seconds
Instagram: eventual (post visible within 5s is fine)
Banking: strong (account balance must be exact)

LATENCY:
Think in percentiles — not averages
P50: 50% of requests faster than this
P99: 99% of requests faster than this
Average hides worst user experiences
```

## CAP Theorem
```
In distributed systems — can only guarantee 2 of 3:
C — Consistency: all nodes see same data
A — Availability: system always responds
P — Partition Tolerance: works even if network splits

P is non-negotiable (networks DO fail)
Real choice: CP vs AP

Instagram → AP (availability over consistency)
Banking   → CP (consistency over availability)
```

---

## Key Takeaways

| Concept | Remember |
|---|---|
| Framework order | Clarify → Estimate → Design → Deep dive. Never skip. |
| Non-functional reqs | Always measurable numbers — not vague statements |
| Cache miss | TTL expiry, cold start, explicit invalidation |
| TTL = eventual consistency | Cache expires → fresh DB query → new data visible |
| Kafka | Decouples services. Producer returns immediately. Consumers async. |
| Fan-out service | YOUR code — worker listening to Kafka. Not a vendor product. |
| Push vs Pull | Regular users: push to cache. Celebrities: pull on read. |
| Thundering herd | Stagger notifications, cache warming, request coalescing |
| DB scaling order | Indexes → replicas → cache → vertical → sharding (last) |
| Consistent hashing | Add shards without rebalancing all data. Used at scale. |
| Read:Write ratio | Drives caching strategy. 70:1 = aggressive cache + CDN |
| S3 vs Database | S3 = file storage. DB = metadata about the file. Both required. |
| CDN position | Between CLIENT and S3 — not between servers |
| Sharding trade-off | Unlimited write scale BUT cross-shard queries are expensive |

---

*Part of daily JS deep dive series — Staff Engineer interview prep*
