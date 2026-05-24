# LinkedIn Post — URL Shortener System Design

---

🔗 How does bit.ly turn a long URL into a short one? And what happens when millions click it at once?

𝗧𝗵𝗲 𝗽𝗿𝗼𝗯𝗹𝗲𝗺 𝘀𝗼𝘂𝗻𝗱𝘀 𝘀𝗶𝗺𝗽𝗹𝗲. The depth is not.

5 things most engineers miss:

𝟭. 𝟯𝟬𝟭 𝘃𝘀 𝟯𝟬𝟮 — 𝗧𝗵𝗶𝘀 𝗼𝗻𝗲 𝗱𝗲𝗰𝗶𝘀𝗶𝗼𝗻 𝗰𝗵𝗮𝗻𝗴𝗲𝘀 𝗲𝘃𝗲𝗿𝘆𝘁𝗵𝗶𝗻𝗴.
→ 301 (permanent) = browser caches the redirect. You lose ALL click analytics after the first visit.
→ 302 (temporary) = every click hits your server. You can count clicks, change destinations, and track everything.
→ Always use 302. The latency difference is negligible.

𝟮. 𝗗𝗼𝗻'𝘁 𝗴𝗲𝗻𝗲𝗿𝗮𝘁𝗲 𝗸𝗲𝘆𝘀 𝗮𝘁 𝘄𝗿𝗶𝘁𝗲 𝘁𝗶𝗺𝗲.
→ Hashing has collisions. Counters are guessable.
→ Use a Key Generation Service (KGS) — pre-generate millions of unique Base62 keys offline.
→ Zero collisions. Zero computation at request time. 7 chars = 3.5 trillion URLs.

𝟯. 𝗔𝗻𝗮𝗹𝘆𝘁𝗶𝗰𝘀 𝗺𝘂𝘀𝘁 𝗯𝗲 𝗮𝘀𝘆𝗻𝗰.
→ Every click publishes to Kafka → consumers write to Cassandra + Redis counters.
→ The redirect returns in <5ms. Analytics happen in the background.
→ Never make the user wait for YOUR bookkeeping.

𝟰. 𝗩𝗶𝗿𝗮𝗹 𝗨𝗥𝗟𝘀 ≠ 𝗥𝗮𝘁𝗲 𝗟𝗶𝗺𝗶𝘁.
→ 500K clicks in 5 minutes? That's legit traffic, not abuse.
→ Rate limiting = protect from attackers. Caching layers = handle real load.
→ Local cache (app server memory) + Redis replicas + CDN edge = each layer absorbs traffic for the next.

𝟱. 𝗖𝗔𝗣 𝘁𝗵𝗲𝗼𝗿𝗲𝗺 𝗱𝗼𝗲𝘀𝗻'𝘁 𝗺𝗲𝗮𝗻 𝘄𝗵𝗮𝘁 𝘆𝗼𝘂 𝘁𝗵𝗶𝗻𝗸.
→ It's NOT "pick 2 out of 3 always."
→ It's "when a partition happens, choose C or A."
→ Normal operation? You get both. The trade-off only kicks in during failures.

The best system design answers aren't about knowing components.
They're about knowing what BREAKS at scale — and why.

---

#SystemDesign #StaffEngineer #SoftwareEngineering #InterviewPrep #DistributedSystems #Backend #URLShortener
