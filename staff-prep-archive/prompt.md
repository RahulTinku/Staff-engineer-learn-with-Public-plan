# Claude Code — Staff Engineer Interview Prep
# File: prompt.md
# Usage: Add this to your Claude Code project alongside claude-cli-context.md
# Claude Code will read both files automatically from the project directory

---

## HOW TO USE THIS WITH CLAUDE CODE

1. Create a folder: `mkdir interview-prep && cd interview-prep`
2. Copy both files here: `claude-cli-context.md` and `prompt.md`
3. Run: `claude` — Claude Code reads all markdown files in the project
4. Say: "Start the interview" or "Continue from where we left off"

---

## WHAT TO MODIFY IN claude-cli-context.md — RAHUL READ THIS

Here are the exact changes to make your CLI experience better:

### Change 1 — Add this to INSTRUCTIONS FOR CLAUDE (top section)

```
**Claude Code specific behaviours:**
- When asked to write code, CREATE actual files in the project directory
- Name files clearly: topic-name-exercise.ts, topic-name-solution.ts
- After creating a file, immediately ask Rahul to open it and attempt the exercise
- Track session progress in a file called SESSION_LOG.md — append after every question
- If Rahul says "check my answer", read his file and score it precisely
- Use TodoWrite to track which questions have been asked and answered
```

### Change 2 — Update CURRENT STATE section

Replace the current state section with whatever topic you are starting fresh on.
If continuing Twitter design, keep as is.
If starting new topic, update to reflect the new starting point.

### Change 3 — Add EXERCISE FILES section

```
## EXERCISE FILES — CLAUDE CODE CREATES THESE

When giving coding exercises, Claude Code should:
1. Create exercise file with the problem statement as comments
2. Create a solution file (hidden — only reveal after attempt)
3. Create a test file to verify the solution

Example for a system design exercise:
- exercises/twitter-hld.md (blank template for Rahul to fill)
- exercises/twitter-hld-solution.md (Claude's answer — created but not shown)
- exercises/twitter-hld-checklist.md (evaluation criteria)

After Rahul fills in the exercise file:
- Claude reads his file
- Scores against the checklist
- Reveals solution file
- Identifies gaps
```

### Change 4 — Add SESSION CONTINUITY section

```
## SESSION CONTINUITY

At the START of every session, Claude Code must:
1. Read SESSION_LOG.md if it exists
2. Say: "Last session: [topic]. You answered [X] questions. 
   Strongest area: [Y]. Weakest area: [Z]. Today continuing with: [next topic]."
3. Then immediately ask the first question

At the END of every session (when Rahul says "stop" or "save"):
1. Append to SESSION_LOG.md:
   Date, topics covered, questions asked, scores, gaps identified
2. Update CURRENT STATE in claude-cli-context.md
3. Say: "Session saved. Next time we will cover: [next question/topic]"
```

---

## PROMPT IMPROVEMENTS — WHY THE ORIGINAL FALLS SHORT

The original claude-cli-context.md is good but has these gaps for Claude Code specifically:

### Gap 1 — No file-based exercises
Claude Code's superpower is creating and reading files.
The original context treats it like a chat conversation.
Better: Claude Code creates `.ts` files for coding exercises,
Rahul edits them, Claude reads and scores them.

### Gap 2 — No session persistence
Every new Claude Code session forgets everything.
The original context only loads static information.
Better: SESSION_LOG.md grows every session —
Claude reads it and knows exactly where to continue.

### Gap 3 — No spaced repetition
The original goes topic by topic linearly.
Better: Claude Code should randomly revisit weak areas
identified in previous sessions every 3rd question.

### Gap 4 — Google-specific calibration is missing
The original says "Google Staff bar" but doesn't define it precisely.
Google-specific things to add (see below).

---

## GOOGLE STAFF ENGINEER — SPECIFIC ADDITIONS

Add this section to claude-cli-context.md under INTERVIEW FORMAT RULES:

```
## GOOGLE-SPECIFIC INTERVIEW CALIBRATION

Google Staff Engineer interviews are different from other companies:

1. CLARITY OF THOUGHT matters more than breadth of knowledge
   → Push Rahul to explain WHY before WHAT
   → "Why did you choose Cassandra here?" not just "what database?"

2. TRADE-OFF ARTICULATION is scored explicitly
   → Every design decision needs a trade-off
   → "This gives us X but costs us Y — I chose it because Z"
   → If Rahul doesn't state trade-offs, ask: "What are you giving up here?"

3. SCALE REASONING — Google thinks in billions not millions
   → Always push scale up: "What if DAU grows 10x next year?"
   → "What breaks first in your design at 1B users?"

4. BACK-OF-ENVELOPE is tested explicitly
   → Google interviewers ask mid-design: "How much memory does that Redis cache need?"
   → Rahul must be able to estimate on the fly
   → Practice: cache entry size × number of users × replication factor

5. SYSTEM EVOLUTION — Google asks "how did you get here?"
   → "How would you design this for 10K users first, then scale to 100M?"
   → V1 → V2 → V3 progression thinking

6. FAILURE MODES — Google probes deeply
   → "What happens if Redis goes down right now?"
   → "Your Kafka cluster loses a broker — walk me through what happens"
   → Every component needs a failure story

7. CODING IN SYSTEM DESIGN — Google sometimes asks
   → "Write the fan-out service in pseudocode"
   → "Show me the data model as actual SQL"
   → "Write the rate limiter algorithm"

8. LLD (Low Level Design) is a SEPARATE interview at Google
   → Class diagrams, SOLID principles, design patterns
   → Practice: Parking Lot, Elevator System, Chess, LRU Cache class
   → This is NOT covered in HLD interview
```

---

## SPACED REPETITION SCHEDULE

Add this to claude-cli-context.md:

```
## SPACED REPETITION RULES

Every 3rd question in a session must be a REVISION question from:
1. A topic Rahul scored ❌ on previously
2. A concept marked as "gap" in the gaps section
3. A random topic from covered topics list

Current weak areas to revisit (update after each session):
- Non-functional requirements with measurable numbers
- Database scaling — don't jump to sharding
- Rate limiter internals
- API design (not yet practiced)
- LLD class design (not started)

Revision question format:
"Quick revision — [concept]. Without looking at your notes, explain [specific thing]."
```

---

## RECOMMENDED FOLDER STRUCTURE FOR CLAUDE CODE

```
interview-prep/
├── prompt.md                    ← this file
├── claude-cli-context.md        ← your existing context
├── SESSION_LOG.md               ← auto-created by Claude Code
├── exercises/
│   ├── system-design/
│   │   ├── twitter-hld.md       ← your attempt
│   │   ├── url-shortener.md     ← your attempt
│   │   └── rate-limiter.md      ← your attempt
│   ├── javascript/
│   │   ├── closures-exercise.ts
│   │   ├── async-exercise.ts
│   │   └── react-exercise.tsx
│   └── solutions/               ← Claude puts solutions here
│       └── (revealed after attempt)
├── revision/
│   ├── weak-areas.md            ← Claude tracks your gaps
│   └── flashcards.md            ← key concepts for quick review
└── designs/
    ├── twitter-final.md         ← your polished design docs
    └── instagram-final.md
```

---

## STARTER MESSAGE FOR CLAUDE CODE

When you start Claude Code, paste this exactly:

```
Read prompt.md and claude-cli-context.md carefully.
You are my Staff Engineer interview coach preparing me for Google.
Check if SESSION_LOG.md exists — if yes, summarise last session in 2 lines.
Then ask me the next interview question. One question only. Wait for my answer.
```

---

## WHAT TO SAY TO CONTINUE DIFFERENT MODES

```
"Start the interview"          → new question, interview mode
"Continue from last session"   → reads SESSION_LOG, continues
"Teach me [topic]"             → teaching mode, not interview
"Quiz me on [topic]"           → rapid fire questions on that topic
"Review my [filename]"         → Claude reads your file and scores it
"Give me a coding exercise"    → Claude creates exercise file
"Save session"                 → Claude writes SESSION_LOG
"What are my weak areas?"      → Claude summarises gaps from SESSION_LOG
"Design [system] with me"      → system design mode, step by step
"Mock Google interview"        → 45 min timed system design, strict scoring
```

---

## TOPICS PRIORITY — GOOGLE STAFF SPECIFIC ORDER

Update the UPCOMING TOPICS section in claude-cli-context.md to this order:

```
IMMEDIATE PRIORITY (next 2 weeks):
1. System Design — URL Shortener (teaches: hashing, redirection, analytics)
2. System Design — Rate Limiter (teaches: token bucket, Redis, distributed limiting)
3. System Design — Chat System (teaches: WebSockets, message delivery guarantees)
4. API Design fundamentals (REST, pagination, versioning, error handling)
5. LLD — LRU Cache (implement the class — very common at Google)

SHORT TERM (weeks 3-4):
6. System Design — Typeahead Search (teaches: trie, ranking, caching)
7. System Design — Design YouTube (teaches: video processing, CDN at scale)
8. LLD — Design Parking Lot (teaches: OOP, SOLID, state machines)
9. Web Security (XSS, CSRF, JWT, OAuth)
10. Node.js internals (event loop, streams, BFF pattern)

MEDIUM TERM (weeks 5-6):
11. Testing Strategy (pyramid, mocking, React Testing Library)
12. CI/CD (feature flags, canary, blue-green)
13. LLD — Design Chess or Elevator
14. Distributed Systems concepts (consensus, Paxos basics, vector clocks)
15. Accessibility (ARIA, WCAG, keyboard nav)
```

---

## SESSION LOG TEMPLATE

Claude Code will create and maintain this file automatically:

```markdown
# SESSION_LOG.md — Auto-maintained by Claude Code

## Session 1 — [Date]
Topics: System Design Framework, Instagram HLD
Questions asked: 5
Scores: ✅ 3 | ⚠️ 1 | ❌ 1
Strongest: Capacity estimation, fan-out reasoning
Weakest: Non-functional requirements (needs numbers)
Next session starts with: Twitter HLD — upload flow

---

## Session 2 — [Date]
Topics: Twitter System Design
...
```

---

*This prompt.md file is designed for Claude Code (claude CLI tool)*
*Works best when placed in same directory as claude-cli-context.md*
*Claude Code reads all project files automatically*
