# 📅 18-Month Day-by-Day Roadmap: Senior Staff / Principal Engineer
### *1 hour/day. Hands-on. Spaced repetition. AI-accelerated.*

---

> **The problem this solves:** You're forgetting what you learn. You couldn't code a simple React app in your last interview. That means the old approach (read → forget → cram before interview) is broken. This plan fixes it with: **(1)** daily hands-on coding (you code every single day — no "just reading" days), **(2)** spaced repetition via Anki so concepts stick permanently, **(3)** AI tools to 3x your preparation speed.

---

## 💰 Subscriptions & Tools (What to Buy)

### Must-Have (Total: ~$45/month)

| Tool | Cost | Why | When to Get |
|---|---|---|---|
| **NeetCode Pro** | $119/year (~$10/mo) | DSA roadmap (NeetCode 150), video explanations, pattern-based learning | Day 1 |
| **HelloInterview Premium** | ~$25/mo | System design at Staff+ level, AI mock interviews, behavioral prep — only platform with Staff/PE calibration | Month 2 |
| **Anki** (desktop) | Free | Spaced repetition — the science of not forgetting. Build cards from every failure | Day 1 |
| **AnkiWeb** (mobile sync) | Free | Review cards on phone during commute/waiting |  Day 1 |
| **Claude Pro / ChatGPT Plus** | $20/mo | AI mock interviewer, code review, concept explanation, flashcard generation | Day 1 |

### Nice-to-Have (Add When Needed)

| Tool | Cost | Why | When to Get |
|---|---|---|---|
| **LeetCode Premium** | $159/year (~$13/mo) | Company-tagged problems, frequency sort — useful in Phase 5-6 when targeting specific companies | Month 13 |
| **Educative.io** | $59/mo or $149/year | "Grokking System Design", "Grokking Coding Interview" — interactive, text-based | Month 4 (if HelloInterview isn't enough) |
| **Interviewing.io** | Free (AI) / $225+ (human) | Anonymous mock interviews with real FAANG engineers — 2-3 sessions before real interviews | Month 15 |
| **Cursor Pro** | $20/mo | AI-powered IDE — use daily at work to build AI fluency | Day 1 (if not already using) |
| **Excalidraw** | Free | Draw system designs — practice whiteboarding digitally | Day 1 |

### Free Resources (Use Heavily)

| Resource | Use For |
|---|---|
| [Google Interview Warmup](https://grow.google/certificates/interview-warmup/) | Free AI speech practice — talk through solutions out loud |
| [Andrej Karpathy YouTube](https://youtube.com/@AndrejKarpathy) | AI/LLM fundamentals |
| [ByteByteGo YouTube](https://youtube.com/@ByteByteGo) | System design visual explainers |
| [NeetCode YouTube](https://youtube.com/@NeetCode) | DSA pattern videos (free) |
| [DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/) | RAG, agents, prompt engineering (free) |
| [roadmap.sh/ai-agents](https://roadmap.sh/ai-agents) | AI agent learning path |
| Google SRE Book (online) | Reliability engineering |

---

## 🧠 The Anti-Forgetting System

> **Why you forget:** You study a topic, move on, never revisit it. By the time the interview comes, it's gone. The fix is **spaced repetition** — scientifically proven to move knowledge from short-term to long-term memory.

### How It Works (10 min/day, every day, no exceptions)

```
Every day:
├── First 10 min: Anki review (phone or desktop)
│   └── Review whatever cards Anki shows you (it knows the optimal timing)
└── Last 50 min: Main topic (see daily schedule below)

After EVERY study session:
└── Create 2-3 Anki cards from what you learned
    └── ONLY from things you got wrong or found surprising
    └── Never import pre-made decks — your own cards work 3x better
```

### Anki Card Rules (Quality > Quantity)

**Good card:** "What's the time complexity of BFS on a graph with V vertices and E edges?" → "O(V + E)"

**Bad card:** "Explain BFS" → (too vague, invites passive rereading)

**Good card:** "In React, why does `useEffect(() => { ... }, [])` with an empty array only run once?" → "Empty dependency array means 'no dependencies changed', so it only runs on mount"

**Bad card:** "What is useEffect?" → (too broad)

**Card categories to create:**
- 🟢 DSA: Pattern triggers, time/space complexity, edge cases
- 🔵 System Design: Component trade-offs, capacity formulas, failure modes
- 🟣 AI: Architecture patterns, when to use RAG vs fine-tune, agent concepts
- 🟡 React/Frontend: Hook behaviors, rendering rules, performance patterns
- 🔴 Behavioral: Your STAR story bullet points (rehearse from memory)

**Target:** 22-28 total cards in your coding deck. 30-40 in system design. 20-30 in AI. Add slowly. Review daily.

---

## 🗓️ The Daily Rotation (1 Hour/Day)

Every day follows this structure:
```
[10 min] Anki review (spaced repetition — non-negotiable)
[50 min] Main topic (rotates by day of week)
[After]  Create 2-3 new Anki cards from today's session
```

### Weekly Schedule

| Day | Main Topic (50 min) | Hands-On? | Tool |
|---|---|---|---|
| **Monday** | DSA Coding — solve 1-2 problems | ✅ Always code | NeetCode / LeetCode |
| **Tuesday** | System Design — study or practice 1 design | ✅ Draw + write | HelloInterview / Excalidraw |
| **Wednesday** | Hands-On Coding — build something real | ✅ Always code | VS Code / Cursor |
| **Thursday** | AI Skills — learn or build AI project | ✅ Code + build | DeepLearning.AI / LangChain |
| **Friday** | Technical Breadth — study new domain | 📖 Read + Anki | Books / ByteByteGo |
| **Saturday** | Behavioral + Mock Practice | 🎤 Speak out loud | Claude AI / Google Warmup |
| **Sunday** | Weekly Review + Plan | 📝 Reflect + plan | Anki heavy review day |

> **Key rule: Monday + Wednesday = ALWAYS code.** You will never again walk into an interview unable to code a React app. These two days are sacred hands-on coding days.

---

## 📆 Phase 1: Coding Recovery + AI Foundations (Months 1-3, Weeks 1-12)

> **Goal:** Rebuild coding confidence. Start AI learning. Establish Anki habit.
> **Problem being solved:** "I couldn't code a simple React app in my last interview."

### Week 1-2: Get Started

| Day | What to Do (50 min after Anki) |
|---|---|
| **Mon W1** | Setup: Install Anki, NeetCode Pro, Cursor. Solve 1 Easy (Two Sum). Code it, don't just read. |
| **Tue W1** | System Design intro: Watch ByteByteGo "System Design in 10 min" video. Draw URL Shortener on Excalidraw from memory. |
| **Wed W1** | Hands-on: Build a React counter app from scratch (no AI help). Then build a todo app. Time yourself. |
| **Thu W1** | AI: Watch Andrej Karpathy "Intro to LLMs" (first 50 min). Take notes. Make 3 Anki cards. |
| **Fri W1** | Read: DDIA Chapter 1 (Reliable, Scalable, Maintainable Applications). Make 3 Anki cards. |
| **Sat W1** | Write your first 3 STAR stories (rough draft). Speak each one out loud. Time them (target: 2-3 min each). |
| **Sun W1** | Review all Anki cards. Plan Week 2. Journal: what felt hard? what felt easy? |
| **Mon W2** | DSA: Two Pointers — Container With Most Water, Move Zeroes (NeetCode). Code both, explain approach out loud. |
| **Tue W2** | System Design: URL Shortener — do the full design on HelloInterview guided practice. |
| **Wed W2** | Hands-on: Build a React form with validation from scratch. No Copilot. Then rebuild with Copilot. Compare time. |
| **Thu W2** | AI: Finish Karpathy video. Start DeepLearning.AI "ChatGPT Prompt Engineering" short course (free). |
| **Fri W2** | Read: DDIA Chapter 2 (Data Models and Query Languages). Make Anki cards. |
| **Sat W2** | Practice 2 STAR stories out loud using Google Interview Warmup. Refine based on feedback. |
| **Sun W2** | Anki heavy review. Plan Week 3. Track: how many Anki cards total? |

### Week 3-4: DSA Patterns + React Fluency

| Day | What to Do |
|---|---|
| **Mon** | DSA: Sliding Window — Best Time to Buy/Sell Stock, Longest Substring Without Repeating (NeetCode) |
| **Tue** | System Design: Rate Limiter design (HelloInterview guided) |
| **Wed** | Hands-on: Build a data-fetching component with loading/error states. Use `useEffect`, `useState`, `AbortController`. No libraries. |
| **Thu** | AI: DeepLearning.AI "LangChain for LLM Application Development" short course (free) |
| **Fri** | Read: DDIA Chapter 3 (Storage and Retrieval — LSM trees, B-trees) |
| **Sat** | Write 2 more STAR stories. Practice all 5 out loud. Record yourself. |
| **Sun** | Anki review + plan. Track progress. |
| **Mon** | DSA: Stack — Valid Parentheses, Min Stack, Daily Temperatures (NeetCode) |
| **Tue** | System Design: Notification System design |
| **Wed** | Hands-on: Build a custom hook `useDebounce` from scratch. Then build `useFetch` with abort + cache. |
| **Thu** | AI: DeepLearning.AI "Building Systems with ChatGPT API" short course |
| **Fri** | Read: DDIA Chapter 4 (Encoding and Evolution) |
| **Sat** | Ask Claude: "Mock interview me on behavioral — Amazon Earn Trust LP". Practice 15 min. |
| **Sun** | Anki + weekly review. |

### Week 5-8: Binary Search, Trees, Linked Lists + System Design Depth

**Monday pattern:** NeetCode roadmap — Binary Search (W5), Linked List (W6), Trees (W7), Tries (W8). Always code, never just read.

**Tuesday pattern:** HelloInterview system designs — Chat System (W5), YouTube (W6), Google Drive (W7), Search Autocomplete (W8).

**Wednesday pattern — React + Frontend builds (the "never forget React" insurance):**
- W5: Build a real-time search with debounce + API call
- W6: Build an infinite scroll feed component
- W7: Build a modal system with portal + keyboard trap
- W8: Build a mini state management library (like a tiny Redux)

**Thursday pattern — AI skills:**
- W5: DeepLearning.AI "Building RAG Agents with LLMs"
- W6: Set up a local RAG pipeline (LangChain + ChromaDB + any PDF)
- W7: Add evaluation metrics to your RAG pipeline (relevance, faithfulness)
- W8: Build a simple AI chatbot with memory using LangChain

**Friday pattern — DDIA continues:**
- W5: Chapter 5 (Replication)
- W6: Chapter 6 (Partitioning)
- W7: Chapter 7 (Transactions)
- W8: Chapter 8 (The Trouble with Distributed Systems)

**Saturday pattern:** Refine 2 STAR stories per week. By W8 you should have 8 polished stories.

### Week 9-12: Heaps, Graphs, DP Intro + AI Production Skills

**Monday:** NeetCode — Heap (W9), Backtracking (W10), Graphs BFS/DFS (W11), DP intro (W12)

**Tuesday:** System designs — Design Twitter (W9), Design Uber (W10), Design Web Crawler (W11), Design a Developer Platform (W12 — YOUR EDGE)

**Wednesday — Full-stack builds (prove you can code end-to-end):**
- W9: Build a REST API with Node.js + Express from scratch
- W10: Build a simple CLI tool using the Anthropic/OpenAI API
- W11: Build a React + Node full-stack app (frontend fetches from your API)
- W12: Build a RAG chatbot UI (React frontend + your LangChain backend from W6-8)

**Thursday — AI production skills:**
- W9: DeepLearning.AI "Functions, Tools and Agents with LangChain"
- W10: Learn LLM serving concepts (caching, streaming, batching, cost)
- W11: Build an AI agent that can use tools (web search, calculator)
- W12: Deploy your RAG chatbot (simple — Vercel/Railway/Docker)

**Friday — DDIA finishes + start Google SRE Book:**
- W9: DDIA Ch 9 (Consistency and Consensus)
- W10: DDIA Ch 10-11 (Batch + Stream Processing) — skim
- W11: Google SRE Book Ch 1-4 (SLIs, SLOs, Error Budgets)
- W12: SRE Book Ch 5-7 (Incident Response)

**Saturday:** Mock behavioral with Claude AI. By W12, you have 8-10 STAR stories rehearsed.

### Phase 1 Checkpoint (End of Month 3)
- [ ] Can solve NeetCode Easy in 10 min, Medium in 25 min
- [ ] Can build a React app from scratch (form, fetch, hooks, error handling)
- [ ] Know 8 system designs at high level
- [ ] Have a working RAG chatbot you built yourself
- [ ] 8-10 STAR stories written and practiced
- [ ] Anki deck: ~60-80 cards, reviewed daily
- [ ] Read DDIA Chapters 1-9

---

## 📆 Phase 2: System Design Mastery + AI Depth (Months 4-6, Weeks 13-24)

> **Goal:** Reach Staff-level depth in system design. Build real AI projects. Start technical breadth.

### Monday (DSA): Continue NeetCode 150 — DP (W13-16), Graphs advanced (W17-20), Mixed hard problems (W21-24). Target: Medium in 20 min.

### Tuesday (System Design): Deep dives with HelloInterview
- W13-14: Design a RAG-based enterprise search (AI system design!)
- W15-16: Design an AI code review agent (AI + your domain!)
- W17-18: Design an AI-powered developer platform (YOUR UNFAIR ADVANTAGE)
- W19-20: Design ChatGPT / LLM serving system
- W21-22: Design a multi-agent workflow system
- W23-24: Redo your best 3 designs from scratch — timed 45 min

### Wednesday (Hands-On Coding): Real projects
- W13-14: Build a multi-agent system using LangGraph (2 agents collaborating)
- W15-16: Build an AI code review tool (reads a PR diff, gives feedback using LLM)
- W17-18: Build a Chrome extension with AI (e.g., summarize any webpage)
- W19-20: Contribute to an open-source AI project (LangChain, LlamaIndex — even docs)
- W21-22: Build a full-stack AI app: React + Node + LLM + vector DB
- W23-24: Polish your best project for portfolio / GitHub showcase

### Thursday (AI Skills): Production-level
- W13-14: Fine-tuning concepts (LoRA, QLoRA, when vs RAG vs prompt engineering)
- W15-16: AI evaluation frameworks (RAGAS, human eval, A/B testing AI)
- W17-18: AI governance & safety (guardrails, content moderation, audit logging)
- W19-20: Agent frameworks deep dive (LangGraph vs CrewAI vs AutoGen)
- W21-22: AI cost modeling (tokens × cost, caching strategies, batching)
- W23-24: Build-vs-buy analysis framework for AI solutions

### Friday (Technical Breadth): Backend + Infra + Security
- W13-14: Microservices patterns (saga, CQRS, event sourcing) — *Building Microservices* Ch 1-4
- W15-16: Kubernetes concepts (pods, services, deployments, scaling)
- W17-18: Security fundamentals (OWASP Top 10, threat modeling basics)
- W19-20: Data engineering basics (batch vs stream, CDC, data modeling)
- W21-22: Observability (metrics, logs, traces, SLOs in practice)
- W23-24: Cloud cost optimization (AWS Well-Architected cost pillar)

### Saturday (Behavioral): Deepen stories + start mock interviews
- W13-16: Add Amazon LP-specific stories (map each LP to a real experience)
- W17-20: Practice with AI mock: "Mock interview me for Google L7 leadership round"
- W21-24: Do 1 mock system design interview with a friend or Interviewing.io free AI

### Phase 2 Checkpoint (End of Month 6)
- [ ] Can design 12+ systems at Staff depth (including 4+ AI systems)
- [ ] Can solve NeetCode Medium in 20 min consistently
- [ ] Built 3+ AI projects (RAG chatbot, multi-agent system, AI code reviewer)
- [ ] Understand fine-tuning vs RAG vs prompt engineering trade-offs
- [ ] Read *Building Microservices* core chapters
- [ ] 12 Amazon LP stories ready
- [ ] Anki deck: ~120-150 cards, daily review taking ~10-12 min

---

## 📆 Phase 3: Advanced Topics + Business Acumen (Months 7-9, Weeks 25-36)

> **Goal:** Close technical breadth gaps. Build business acumen. Start executive communication practice.

### Monday (DSA): Hard problems + contest-style timing
- Solve 1 hard or 2 medium per session
- Practice in Google Docs (not IDE) — simulate interview conditions
- Narrate approach out loud before coding

### Tuesday (System Design): Advanced + cross-domain
- W25-26: Design a global payment system (Stripe-like)
- W27-28: Design a recommendation engine (ML + system design hybrid)
- W29-30: Design an observability platform (metrics, logs, traces, alerts)
- W31-32: Design a feature flag system (LaunchDarkly-like)
- W33-34: Design a real-time collaboration system (Google Docs-like)
- W35-36: Redo weakest 3 designs from all time — timed, no notes

### Wednesday (Hands-On): Full-stack + AI + open source
- W25-28: Build an AI-powered internal documentation search for your team (real work project!)
- W29-32: Contribute 2-3 meaningful PRs to an open-source AI project
- W33-36: Build your portfolio website showcasing all projects

### Thursday (AI + Business):
- W25-27: Read *Inspired* by Marty Cagan (product thinking) — 2 chapters/week
- W28-30: Read *An Elegant Puzzle* by Will Larson — 2 chapters/week
- W31-33: Study business metrics: P&L, CapEx vs OpEx, TCO, ROI frameworks
- W34-36: Practice framing technical decisions in business language with Claude AI

### Friday (Technical Breadth): Distributed systems + advanced
- W25-27: Consensus algorithms (Raft — read the paper, watch the visualization)
- W28-30: Distributed transactions (2PC, saga, eventual consistency patterns)
- W31-33: Performance engineering (profiling, load testing, capacity planning)
- W34-36: API design deep dive (REST vs gRPC vs GraphQL, versioning, pagination)

### Saturday: Mock interviews (ramp up frequency)
- W25-30: 1 mock per 2 weeks (alternating system design and behavioral)
- W31-36: 1 mock per week
- Use: Claude AI, HelloInterview AI, or peer engineers

### Phase 3 Checkpoint (End of Month 9)
- [ ] Can design 20+ systems including AI, payment, real-time, infra
- [ ] NeetCode 150 complete (or nearly)
- [ ] 5+ AI projects built
- [ ] Can frame any technical decision in business terms
- [ ] Read *Inspired* + *An Elegant Puzzle*
- [ ] Anki deck: ~180-200 cards, daily review ~12-15 min
- [ ] Doing weekly mock interviews

---

## 📆 Phase 4: Interview Polish + Company Targeting (Months 10-12, Weeks 37-48)

> **Goal:** Company-specific prep. System design at L7 depth. Leadership narratives polished.

### Monday (DSA): Company-tagged problems
- Get LeetCode Premium (Month 13 prep)
- Practice top 20 Google/Amazon/Meta tagged problems
- Always timed: 25 min medium, 40 min hard
- If stuck after 15 min, look at hint, implement, then redo next week

### Tuesday (System Design): Interview simulation
- Full 45-min timed designs, no notes
- Ask Claude: "Be a Google L7 system design interviewer. Ask me to design [X]. Probe my tradeoffs. Score me."
- 2 designs per week (one traditional, one AI)

### Wednesday (Hands-On): React + Node coding rounds
- Build from scratch: "Build Twitter's feed UI in 45 min" (React)
- Build from scratch: "Build a URL shortener backend in 45 min" (Node)
- Build from scratch: "Build a real-time chat with WebSocket in 45 min"
- Simulate actual coding interview conditions: no Copilot, timer running

### Thursday (AI System Design): Interview-specific
- Practice the 8 AI system design questions from the main plan
- Use HelloInterview AI system design practice
- Focus: RAG architecture, LLM serving, agent design, AI-powered platforms

### Friday: Technical deep dives on weak areas (based on mock interview feedback)

### Saturday: 2 mock interviews per week (1 system design, 1 behavioral)
- HelloInterview coaches (paid — worth it at this stage)
- Interviewing.io with real engineers (2-3 sessions)

### Phase 4 Checkpoint (End of Month 12)
- [ ] Can do a 45-min system design cold with L7-depth tradeoffs
- [ ] Can code any React app from scratch in 30 min
- [ ] Can code a backend service from scratch in 30 min
- [ ] AI system designs are as strong as traditional ones
- [ ] 8-10 STAR stories are automatic (can tell them in sleep)
- [ ] Passed 3+ mock interviews with positive feedback

---

## 📆 Phase 5: Active Interview Prep (Months 13-15, Weeks 49-60)

> **Goal:** Start applying. Company-specific drills. Peak performance.

### Daily Focus Shifts:

| Day | Activity |
|---|---|
| **Mon** | Company-tagged LeetCode problems (Google/Amazon/Meta top 30) |
| **Tue** | System design: redo the same 6-8 core designs until perfect |
| **Wed** | Live coding simulation: build a feature end-to-end in 45 min, no AI |
| **Thu** | AI system design + technical deep dives |
| **Fri** | Company research: read engineering blogs, understand their tech stack |
| **Sat** | Mock interview (human, not AI — HelloInterview coaches or Interviewing.io) |
| **Sun** | Anki (heavy review) + rest + confidence journaling |

### Company-Specific Prep Drills

**Google L7 (2 weeks):**
- [ ] Do 2 back-to-back system designs (stamina drill)
- [ ] Practice strategic vision narrative: "How I'd set frontend direction at Google scale"
- [ ] Research 3 Google teams you'd target
- [ ] Practice Googleyness: ambiguity comfort, emergent leadership stories

**Amazon L7 (2 weeks):**
- [ ] Map all 16 LPs to your stories (some stories cover 2-3 LPs)
- [ ] Practice 12 min per LP question: 2-3 min STAR + 8 min follow-up probing
- [ ] Write a 1-page design review (Amazon tests writing)
- [ ] Practice "Earn Trust" and "Have Backbone" stories until automatic

**Meta E7 (2 weeks):**
- [ ] Prepare 3 "technical retrospective" stories with company-changing impact
- [ ] Practice cross-functional partnership scenarios
- [ ] System design: practice going HTTP-status-code deep AND strategic-broad in one session

**Microsoft L67 (1 week):**
- [ ] Prepare growth mindset stories (failure → learning → improvement)
- [ ] Research Azure/GitHub/VS Code teams

---

## 📆 Phase 6: Interview Sprint (Months 16-18, Weeks 61-78)

> **Goal:** Execute interviews. Maintain peak. Adapt based on feedback.

### During Active Interviews:

| Day | Activity (1 hour) |
|---|---|
| **Before an interview** | Anki review + review the specific design/stories relevant to that company |
| **After an interview** | Write down every question asked. Identify gaps. Create Anki cards for gaps. |
| **Non-interview days** | Continue rotation but focus 100% on areas identified as weak in real interviews |

### If You Get Rejected:
1. Write down exactly what went wrong (be specific)
2. Create Anki cards for every concept you missed
3. Spend 2 weeks drilling that exact weakness
4. Apply to next company — you're now stronger

---

## 🔁 The Spaced Repetition Cycle (How to Never Forget Again)

```
Day 1: Learn concept → Create Anki card
Day 2: Anki shows card → You recall it (easy: moves to 4-day interval)
Day 6: Anki shows card again → You recall it (moves to 2-week interval)
Day 20: Anki shows card again → You recall it (moves to 2-month interval)
Day 80: Anki shows card again → You recall it (moves to 6-month interval)
Month 12: You still remember it. It's permanent.
```

### What to Put in Anki (By Category)

**DSA (target: 25-30 cards):**
```
Front: "When do you use a monotonic stack?"
Back: "When you need the next greater/smaller element for each item in an array. O(n) time."

Front: "What's the difference between Dijkstra's and BFS for shortest path?"
Back: "BFS = unweighted graphs (O(V+E)). Dijkstra's = weighted non-negative edges (O((V+E)logV) with min-heap)."
```

**System Design (target: 35-40 cards):**
```
Front: "When would you choose Cassandra over PostgreSQL?"
Back: "Cassandra: write-heavy, massive scale, partition-tolerant, eventual consistency OK. 
PostgreSQL: strong consistency needed, complex queries/JOINs, moderate scale."

Front: "What's the formula for estimating Redis memory for a cache?"
Back: "Entries × avg_entry_size × replication_factor. E.g., 100M entries × 500 bytes × 3 replicas = 150GB"
```

**AI (target: 25-30 cards):**
```
Front: "When should you use RAG vs fine-tuning?"
Back: "RAG: when knowledge changes frequently, you need citations, low upfront cost.
Fine-tuning: when you need specific behavior/style, knowledge is stable, RAG retrieval quality is poor."

Front: "What are the components of a production AI agent?"
Back: "Orchestrator + LLM + Tool interface + Memory (short/long-term) + Policy/guardrails engine + Observability. The LLM is ~20% of the system."
```

**React/Frontend (target: 15-20 cards):**
```
Front: "Why does `setCount(count + 1)` called 3 times only increment by 1?"
Back: "State updates are batched. All 3 read the same stale `count`. Fix: use functional update `setCount(c => c + 1)`"

Front: "What's the useEffect cleanup execution order?"
Back: "On re-render: cleanup of PREVIOUS effect runs FIRST, then new effect runs. On unmount: cleanup runs. Cleanup does NOT run on initial mount."
```

---

## 🤖 How to Use AI to 3x Your Prep Speed

### 1. AI as Mock Interviewer (Claude/ChatGPT)

**System Design mock:**
```
Prompt: "You are a Google L7 system design interviewer. Ask me to design 
[a notification system]. After I answer each part, probe my tradeoffs, 
ask follow-up questions, and score me (✅/⚠️/❌). Be strict — 
hold the L7 bar."
```

**Behavioral mock:**
```
Prompt: "You are an Amazon L7 interviewer. Ask me behavioral questions 
one at a time based on Amazon's Leadership Principles. After each answer, 
probe deeper with follow-ups for 5-8 minutes. Tell me if my stakes are 
too low for L7 level."
```

**Coding mock:**
```
Prompt: "Give me a LeetCode medium problem (graph or DP). Don't show the 
solution. Let me code it. After I submit, review my code like a Google 
interviewer: check correctness, time/space complexity, edge cases, 
code cleanliness."
```

### 2. AI as Anki Card Generator

```
Prompt: "I just learned about [the outbox pattern for guaranteed event delivery]. 
Create 3 Anki flashcards: 1 concept card, 1 'when to use' card, 
1 'what goes wrong without it' card. Format: Front: / Back:"
```

### 3. AI as Code Reviewer (Build Hands-On Muscle)

```
Prompt: "Review this React component. Tell me: 
1. Any bugs? 
2. Performance issues? 
3. What would a Google interviewer flag? 
4. How would a Staff Engineer improve this?"
```

### 4. AI as Concept Explainer

```
Prompt: "Explain [Raft consensus] like I'm a frontend engineer who 
understands JavaScript. Use analogies. Then give me a question to 
check my understanding."
```

### 5. AI as Study Planner

```
Prompt: "I just failed a mock system design interview on [designing 
a chat system]. My weak points were: [WebSocket scaling, message 
ordering guarantees]. Create a 1-week study plan (30 min/day) 
to fix these specific gaps."
```

---

## 📊 Progress Tracking

### Weekly Check (Every Sunday, 5 min)

```markdown
## Week [X] Review
- Anki cards total: ___
- Anki streak (days): ___
- Problems solved this week: ___
- Can I explain this week's system design from memory? Y/N
- What felt hardest this week?
- What do I need to revisit?
```

### Monthly Check

```markdown
## Month [X] Review
- NeetCode progress: ___/150
- System designs mastered: ___/20+
- AI projects built: ___
- STAR stories polished: ___/10
- Mock interviews done: ___
- Biggest gap right now: ___
- Next month focus: ___
```

### Confidence Score (Rate 1-5 Monthly)

| Skill | M1 | M3 | M6 | M9 | M12 | M15 | M18 |
|---|---|---|---|---|---|---|---|
| Can code React app from scratch | 1 | | | | | | |
| Can solve Medium in 20 min | 2 | | | | | | |
| Can design a system at L7 depth | 2 | | | | | | |
| Can design an AI system | 1 | | | | | | |
| Can tell 10 STAR stories cold | 1 | | | | | | |
| Can explain distributed systems | 2 | | | | | | |
| Can discuss AI architecture decisions | 1 | | | | | | |
| Can frame decisions in business terms | 1 | | | | | | |

---

## ⚡ Emergency Rules

**If you skip a day:** Just do Anki (10 min). Never break the Anki streak. A 10-min day is infinitely better than a 0-min day.

**If you're burning out:** Drop to 30 min/day for a week. Keep Anki. Drop the main topic to something fun (build a side project, watch a conference talk).

**If a mock interview goes badly:** This is the BEST thing that can happen during prep (not during a real interview). Create 5 Anki cards from the failure. That pain = permanent memory.

**If you forget something you studied:** That's PROOF the Anki system is working — it caught the forgetting before the interview did. Review the card, strengthen it, move on.

**If you can't code in an interview again:** Go back to Wednesday hands-on sessions. Build something from scratch EVERY week. No Copilot. No AI. Raw coding. The muscle memory will come.

---

## 📋 Quick Start Checklist (Do Today)

- [ ] Install [Anki](https://apps.ankiweb.net/) (desktop + mobile)
- [ ] Sign up for [NeetCode Pro](https://neetcode.io) ($119/year)
- [ ] Sign up for [Claude Pro](https://claude.ai) or [ChatGPT Plus](https://chat.openai.com) ($20/mo)
- [ ] Install [Cursor](https://cursor.sh) (AI-powered IDE)
- [ ] Bookmark [Excalidraw](https://excalidraw.com) (free whiteboard)
- [ ] Bookmark [Google Interview Warmup](https://grow.google/certificates/interview-warmup/)
- [ ] Solve Two Sum on LeetCode (your Day 1 problem)
- [ ] Create your first 3 Anki cards
- [ ] Set a daily alarm: "Interview prep — 1 hour" at your best focus time
- [ ] Start the Anki streak counter. Never break it.

---

*Total investment: ~$45/month + 1 hour/day + discipline*
*Total prep hours over 18 months: ~546 hours*
*That's more than enough to reach L7/E7 interview readiness if spent wisely.*

*Created: May 2026 | Companion to: Rahul_Principal_Engineer_Plan.md*
