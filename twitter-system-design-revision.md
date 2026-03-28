# Twitter System Design — Revision Notes

## 1. Requirements & Capacity

- DAU: 100M
- Read RPS: ~8,100 (read-heavy)
- Write RPS: ~116
- Read:Write ratio: 70:1
- Storage: ~2TB/day
- P99 latency: < 200ms
- Durability: tweets never lost
- Cache (Redis): mandatory
- CDN: non-negotiable for media
- S3: required for images/videos
- Formula: RPS = DAU x requests/day / 86,400

---

## 2. Tweet Posting Flow

```
Client → Rate Limiter → LB → API Server → Tweet Service
  1. Media? → upload to S3 → get CDN URL
  2. Generate Tweet ID (Snowflake — time-sortable, globally unique)
  3. Write to Tweets DB (Cassandra)
  4. Return 200 to user (success BEFORE fan-out)
  5. Publish event to Kafka
       ├── Fan-out Service
       ├── Notification Service
       └── Search Indexing Service
```

- User gets success response before any downstream processing
- Kafka decouples the write path from distribution

---

## 3. Feed Reading Flow (Hybrid Fan-out)

- **Push (fan-out on write):** for normal users (< 1M followers)
  - When they post, tweet is written to every follower's timeline cache (Redis)
  - Followers open app → cache HIT → instant feed

- **Pull (fan-out on read):** for celebrities (> 1M followers)
  - Celebrity tweets are NEVER written to follower caches
  - Fetched on-demand when a follower opens their feed

- **The merge (Timeline Service does this every request):**
  1. GET pre-built timeline from Redis (pushed tweets from normal users)
  2. QUERY celebrity tweets from Celebrity Tweet Cache
  3. MERGE both lists by timestamp
  4. Return top 20 (paginated)

- Celebrity tweets are easy to cache — millions read them, near-100% hit rate
- Batch fetch with Redis MGET — one round trip for all celebrities
- Cap the set — only fetch recently-active celebrities

---

## 4. Database Schema

- **Never store arrays in rows** — use junction tables instead
- **Entities** get their own table (Users, Tweets)
- **Relationships** get their own table (Follows, Likes)

```
Users:    user_id (PK), username (unique), display_name, bio, is_celebrity
Tweets:   tweet_id (PK), user_id (FK), content, media_url, created_at
Follows:  follower_id + followee_id (composite PK) — prevents duplicate follows
Likes:    user_id + tweet_id (composite PK) — prevents double-likes
```

---

## 5. Database Choices (Polyglot Persistence)

- Use the RIGHT database for each access pattern, not one DB for everything

| Table | Database | Why |
|---|---|---|
| Users | PostgreSQL | ACID, stable schema, small scale |
| Follows | PostgreSQL | Relationship table, JOINs, uniqueness |
| Tweets | Cassandra | Time-series writes, partition by user_id, horizontal scaling |
| Likes | Cassandra | Write-heavy, simple key-value pattern |
| Cache | Redis | Timelines, like counts, celebrity tweets |

- SQL when: need JOINs, ACID, stable schema
- NoSQL when: write-heavy, key-value access, need horizontal scaling

---

## 6. Cassandra Hot Partition & Time Bucketing

- Partition key = user_id → celebrity with 500K tweets = one giant partition
- Cassandra partitions over ~100MB cause problems
- **Fix:** composite partition key = (user_id, time_bucket)
- One celebrity's tweets split across daily buckets — each bucket is small
- Query: start from today's bucket, go backwards until you have enough results
- Trade-off: may need 2-3 partition reads instead of 1

---

## 7. Feed Pagination (Cursor-based)

- **OFFSET is broken for real-time feeds** — new posts shift positions, causing duplicates and gaps
- **Cursor = last seen tweet_id** — "give me 20 tweets AFTER this one"
- Snowflake IDs are time-sortable, so cursor queries use indexes efficiently
- OFFSET scans and discards rows; cursor jumps directly — huge performance difference

**Two cursors for a feed:**

| Action | Cursor | Direction | Query |
|---|---|---|---|
| Pull-to-refresh | top_cursor | Newer tweets | tweet_id > top_cursor |
| Scroll down | bottom_cursor | Older tweets | tweet_id < bottom_cursor |

- Cursor never resets — user keeps scroll position
- New tweets prepended at top with "N new tweets" banner
- After refresh: update top_cursor to newest tweet received

---

## 8. Search (Elasticsearch)

- Cassandra can't do text search — only key-based lookups
- LIKE '%text%' on any DB at scale = full table scan = impossible

**Inverted Index:**
```
"world" → [T100, T200]
"cup"   → [T100, T200]
"2026"  → [T100, T300]

Search "World Cup 2026" → intersection → T100 ranked first
```

- Elasticsearch indexes tweets asynchronously via Kafka
- ES stores the index, not full tweet data — returns tweet IDs
- Fetch full tweets from Cassandra/cache using those IDs
- New tweet searchable in ~1-2 seconds (eventual consistency)

**Search pagination:**
- Shallow (< 10K results): `from + size` is fine — results are stable
- Deep: use `search_after` with `[relevance_score, tweet_id]` composite cursor

---

## 9. Notifications

**Pipeline: Detect → Parse → Store → Deliver**

```
Kafka event → Notification Parser → Aggregator → Store (Cassandra) → Delivery
```

1. **Parser:** extracts who to notify (@mentions, followers with notifications ON)
2. **Aggregator:** batches similar events ("X and 49,998 others liked your tweet")
3. **Store:** persist in Cassandra (user opens bell icon, sees history)
4. **Deliver:** parallel channels — push (APNs/FCM), in-app badge, email

**Priority Queue for delivery:**
- HIGH: mentions, DMs → immediate
- MEDIUM: likes, retweets → seconds
- LOW: "X posted a tweet" → batches, minutes OK

**Celebrity posts (10M notifications):**
- Wave 1: 10K most active users → immediate
- Wave 2: 100K in batches → within a minute
- Wave 3: remaining millions → background, minutes
- Offline users: stored in DB, delivered when they open app

---

## 10. Failure Handling

### Redis (Timeline Cache) crashes:
1. **Circuit breaker** activates — stops flooding the DB
2. **Degraded response** — serve stale data from CDN or show trending tweets
3. **Spin up new Redis** cluster
4. **Active cache warming** — pre-build timelines for top 1M users (they generate 80% traffic)
5. **Lazy fill** remaining users on cache miss

### Kafka goes down:
- Tweet posting STILL WORKS — tweet is saved in Cassandra first
- Fan-out, search, notifications stall (delayed, not lost)
- **Outbox Pattern:** write event to DB alongside tweet data; background job retries publishing to Kafka
- **Consumer Offsets:** when Kafka recovers, consumers resume from exact position — zero loss

### Cassandra node dies (RF=3):
- **User notices nothing** — 2 remaining replicas satisfy quorum (2/3)
- **Quorum:** majority must agree for read/write to succeed
- **Recovery:** dead node comes back → hinted handoff + read repair sync missed data
- Only fails if 2+ nodes die simultaneously

---

## Quick Reference — Key Patterns

| Pattern | When to use |
|---|---|
| Polyglot Persistence | Different data needs different DBs |
| Snowflake ID | Need globally unique, time-sortable IDs |
| Cursor Pagination | Any real-time feed with new data arriving |
| Inverted Index | Full-text search at scale |
| Circuit Breaker | Prevent cascading failures when a dependency is down |
| Outbox Pattern | Guarantee event delivery even if message queue fails |
| Time Bucketing | Prevent hot partitions in Cassandra |
| Cache Warming | Rebuild cache without overwhelming the DB |
| Notification Aggregation | Prevent spam when an action goes viral |
| Priority Queue | Different notification types need different urgency |
