# Twitter System Design — New Vocabulary

> Learned during Staff Engineer interview prep session (March 28, 2026)

| # | Term | Description |
|---|---|---|
| 1 | **Polyglot Persistence** | Using different databases for different access patterns (Postgres for users, Cassandra for tweets) |
| 2 | **Junction Table** | A separate table for many-to-many relationships (follows, likes) instead of arrays in rows |
| 3 | **Composite Primary Key** | Two columns combined as PK to prevent duplicates (e.g., `follower_id + followee_id`) |
| 4 | **Hot Partition** | One Cassandra partition getting disproportionate data/traffic, causing node overload |
| 5 | **Time Bucketing** | Adding a time window to the partition key `(user_id, date)` to keep partition sizes bounded |
| 6 | **Snowflake ID** | Globally unique, time-sortable distributed ID — no auto-increment bottleneck |
| 7 | **Cursor-based Pagination** | Using the last seen item's ID to fetch the next page, instead of OFFSET |
| 8 | **Two-cursor Model** | `top_cursor` for pull-to-refresh (newer), `bottom_cursor` for scroll-down (older) |
| 9 | **Inverted Index** | Maps each word to a list of document IDs containing it (how Elasticsearch enables full-text search) |
| 10 | **search_after** | Elasticsearch's cursor-based pagination using `[score, doc_id]` composite for deep pagination |
| 11 | **Notification Aggregation** | Batching similar notifications ("X and 49,998 others liked your tweet") instead of sending one per event |
| 12 | **Priority Queue** | Queue where high-urgency notifications (mentions) are processed before low-urgency ones (new tweets) |
| 13 | **Circuit Breaker** | Pattern that detects cascading failures and stops requests, returning degraded responses instead |
| 14 | **Outbox Pattern** | Write event to DB alongside data; background job publishes to Kafka — guarantees zero event loss |
| 15 | **Consumer Offsets** | Kafka consumers track their position; on recovery they resume from exactly where they stopped |
| 16 | **Cache Warming** | Pre-building cache for top users before routing traffic, instead of waiting for cache misses |
| 17 | **Quorum** | Majority of replicas must agree for a read/write to succeed (2 out of 3 for RF=3) |
| 18 | **Hinted Handoff** | Cassandra temporarily stores writes for a dead node and replays them when it recovers |
| 19 | **Read Repair** | When replicas disagree during a read, Cassandra fixes the stale one automatically |
| 20 | **Degraded Response** | Serving stale/partial data instead of an error when a system component is down |
