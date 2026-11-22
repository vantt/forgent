---
id: ds-abplbwphmm
title: "A coach agent started by the supervisor, fed by observe metrics, friction and owner reactions"
status: settled
source:
  - p-kmavlfevvu
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

- **Outcome:** a coach head that the supervisor starts at the right moment, which reads ready-made observe views, session transcripts and memory stores, finds the problems that hurt the highest goals, diagnoses their cause, and proposes fixes as reviewable new versions: small instruction text to the owner in one batch, anything else to the supervisor as an evidenced problem that becomes a backlog row. Decisions CA-D1 to CA-D6, inheriting OC-D4 and OC-D5 from `ds-cfsfcbknl6`.
- **Constraints:** one door: views in the existing named-query door, trigger through the watcher and supervisor, intake through `fgos friction` and `fgos metrics record`, no new query mechanism (CA-D3). Private text never in a git-tracked file or an external service, for every producer (CA-D4); the managed Dreams service is not used (CA-D6). The coach never writes goals or edits live rules in place (CA-D5, CA-D6). Thresholds and budgets are config keys in `core/config-standard` and `core/config-schema`.
- **Non-goals:** the communication standard itself (`ds-cfsfcbknl6`); a SQLite projection with SQL views (reopened only on `coach-query-gap` evidence, CA-D3); reviving the work-item retrospective loop; Codex and other CLI hooks for owner reactions (later, through their own adapters).
- **Acceptance criteria:** (1) a fixture store with one signature at the threshold makes the watcher raise `coach-due` once and the supervisor start exactly one coach head; (2) every new view of section 6 answers on a fixture store and is held by a contract test on name, version and row shape; every reused definition answers or returns a named `unmeasured`; (3) a friction recorded with private detail leaves no detail text under `.fgos/observe/records/`, and `git check-ignore` matches the private store; (4) a coach run on a fixture writes one report whose every proposal cites the goal and source line it serves, at most 3 proposals, within its budget; (5) the owner-reaction hook records one friction for "khoan, cái này là gì" with no owner words in the tracked store.
- **Open points that block only part:** trigger thresholds and budget numbers are provisional defaults (section 3); how U14 finds the transcripts and records that cite a rule cheaply is for the planner to design (task `transcript-and-memory-curation` only); the `owner-communication` friction layer comes from the communication-standard plan (task `owner-reaction` only).
- **For another session:** the communication-standard plan's OC-D14 duty quotes the owner's words into `friction record --detail`, which lands in a store git does not ignore; its planner should point that text at the private store of CA-D4.
- **Source ids:** `p-kmavlfevvu`; decisions CA-D1 to CA-D6.

discussion: settled

## Seed

Opened by the secretary (Miu) on the owner's order relayed by the owner-communication shaper, 2026-11-22 19:50.

- **Owner's goal:** a coach agent that the supervisor starts at the right moment and that learns from the observe metrics and the friction records. Observe is hardened with ready-made views built for the coach, in the manner of the owner's repository `vantt/pkm`. Automatic capture of the owner's reactions to agent messages (OC-D13, dropped from the communication standard plan) belongs here.
- **To shape:** when the supervisor starts the coach (trigger and budget); which observe views and friction records it reads; what it produces, for whom, and where; how owner-reaction capture works and is stored privately; what a first increment is.
- **Read first:** `plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md` (decisions OC-D11 to OC-D14), the observe area spec, and prior art by `git log -S` on friction and observe symbols.
- **Constraints:** one door, hexagonal and pluggable; the owner's reactions are private data and are not sent to an external service; bring owner decisions as five-part questions with a recommendation and a default.
- **Non-goals:** writing the coach; the communication standard itself (`ds-cfsfcbknl6`).
- **Source ids:** `p-kmavlfevvu`.

## 1. Trạng thái hiện tại

Settled 2026-11-22 21:10 and handed to the planner (block at the top). The generic loop, the trigger door, the private-detail rule and the use-case views held from rounds 1-3 through round 5 without revision; the goal compass and the Dreams lessons met no revision when the owner moved on at 21:06 ("tiếp theo là gì"). Minted CA-D1 to CA-D6. No owner question is open for this discussion. Open points that block only part are listed in the hand-off block.

## 2. Mục tiêu & đề bài

fgOS already writes two kinds of learning material: metrics records and friction records (`fgos metrics`, `fgos friction`, both in `packages/observe/rust`), and more producers will come (the owner's reactions to agent messages, question wait times, verify misses, review findings). Nobody reads them on a schedule: the friction store's top classes are from August and September, and no session owns "look at what keeps going wrong and fix the cause". OC-D5 named that job the coach: a head the supervisor starts, which collects signals, diagnoses the real cause, proposes a fix capped per batch, measures the signature's count afterwards, and deletes or merges rules as readily as it adds them; a small text change to the standard goes to the owner in a batch, anything else goes back to the supervisor as an evidenced problem that becomes a backlog row. This discussion settles what OC-D5 left open: the moment and budget of a coach run, the ready-made views the coach reads so it gets aggregated data fast (the owner's model is `vantt/pkm`'s versioned agent views), what the coach writes and where, how a new producer of learning events plugs in without changing the coach (the owner-reaction hook is the first such producer, not a special case), how private detail is kept off git, and the smallest first increment.

## 3. Vấn đề rõ / chưa rõ

| Point | State | Evidence | Current reading |
|---|---|---|---|
| Coach scope and hand-off | **settled, inherited (OC-D5)** | `ds-cfsfcbknl6` DISCUSSION.md, OC-D5 row; owner 17:37 and 17:45 | Not reopened here. The coach owns the learning loop only; there are no standing area owners; hand-off goes through the supervisor to a backlog row, with a fast path for small standard text. |
| Case log | **settled, inherited (OC-D4)** | OC-D4 row | Raw cases are friction records; curated examples live in the standard. |
| Prior art | **clear** | `git log -S coach`: only the two discussions of today, no code, no persona in `core/agents/`. The nearest ancestor is the retrospective loop of tsk-1lv (`a670be686`, 2026-08-17: a "4-door check" inside a retrospective batch loop that recorded frictions), with `fgos-coding-knowledge` triggered on the work-item status `retrospective`. Its frictions are the top of `fgos friction rank` today (`retrospective-door-docDeferral` 64, `-routing` 29), last seen 2026-09-11, so that loop stopped producing when work moved from work items to heads and plans. Adjacent skills: `instruction-audit` (read-only periodic audit of the instruction surface) and `distill`. | The coach is new, but it should reuse: `instruction-audit` as one of its tools for rule changes, `fgos friction rank`/`resolve --reason filed:<id>` as its intake and close, and the watcher's definition-to-event-to-supervisor door for its start. The retrospective loop is not revived: it was tied to work-item statuses that no longer drive work. |
| When the supervisor starts the coach | **shaper decision on the door; numbers provisional** | `docs/platform/supervision/spec.md` lines 38, 121, 129: the watcher (Rust, no LLM) runs detection definitions each tick, records raised events, and the supervisor acts per row kind; `discussion-settled` already starts a planner this way. Definitions are `*.query.json` files run through `fgos metrics query` (`core/attention/definitions/`). | A watcher definition `coach-due` raises an event; the supervisor starts one coach head (`head:coach-<handle>`), never two. Provisional rule: raise when an unsettled friction signature reaches **3** records, or **5** new owner-communication frictions have arrived since the last coach run, or, as a floor, **7 days** passed with any unsettled friction. Reversal trigger: the coach's own report shows runs with nothing worth proposing (raise the thresholds) or a repeated fault that waited too long (lower them). |
| Coach budget | **provisional** | OC-D5 "thresholded and capped per batch" | One run handles at most **3** signatures and makes at most **3** proposals; it stops after its report. Numbers go to config (`coach.*` keys in `core/config-standard`), not code. |
| Coach views | **shaper decision inside the frame after owner 20:55** | Owner 20:55: the point is only that observe prepares views ready for the coach, so it does not have to work out how to fetch; brainstorm the coach's use cases. `vantt/pkm` (`docs/agent-views.md`, `plans/261115-2230-agent-setup-support/phase-03-views.md`): versioned views listed in `agent_views(name, version)`, held by contract tests on names and columns. Observe already has the named-query door (`*.query.json`, `packages/observe/rust/src/definition/`) and 21 definitions in `core/attention/definitions/` and `domains/coding/observe/definitions/`. | One view per use case (section 6), written as versioned named definitions under `core/coach/definitions/`, reusing the existing definitions where they already answer. Each use case in section 6 is a fixed-shape count or list the query grammar can express, so no SQLite projection is needed. Reversal trigger: the coach records `coach-query-gap` frictions for questions the views cannot answer; enough of those reopen the pkm-style SQL projection as a decision question. |
| Goal compass | **shaper draft after owner 21:05** | Owner 21:05: how does the coach recognise the vision and the goals to aim at, accurately, while it works. Written sources exist: the product priority order and mission boundary (`AGENTS.md`, D-ADR0030, D-ADR0035), `docs/platform/vision.md` (last reviewed 2026-09-13), `docs/platform/intent-preservation-ledger.md` (direction only partly built), area `vision.md` files, the locked laws, 63 D-ADR rows in `docs/decisions/index.md`, settled discussions. | (1) The coach takes goals only from these written sources, never from its own guess. (2) Each goal is tied to the views that measure it (Ship Faster: lead and phase time, waits; Release con người: owner wait, interventions, round trips, owner-communication friction; DoD: first pass, verify misses), and the coach ranks a problem by which goal it hurts and how high that goal sits in the fixed priority order, not by raw count. U1 changes accordingly. (3) Accuracy is checked three ways: every proposal cites the goal and source line it serves, or it is not made; the owner's rejection or re-aim of a proposal is recorded as evidence that the coach misread a goal; when recent owner decisions contradict a vision document, the coach does not pick a side and raises a batched owner question to update the document. (4) The coach never writes or changes a goal itself. |
| Lessons from Claude Dreams | **shaper reading after owner 21:10** | `platform.claude.com/docs/en/managed-agents/dreams` (research preview: an async job reads a memory store plus 1-100 session transcripts and writes a **new** store, duplicates merged, stale or contradicted entries replaced, new insights surfaced; the input is never modified; the result is reviewed, then used or discarded). Anthropic's "components of agent memory": a note is "a prediction about what the future will need"; the transcript is "a ground truth to validate its memory against"; the always-loaded layer must stay small because "an incorrect note can be carried into every session"; telling the model what memory is for worked better than fixed rules. Cookbook "dreaming with a dynamic workflow": nightly window since the last run; one analyzer per transcript in parallel, then one organizer; conflicts written as `CONFLICT: A says...; B says...`, never guessed; transcripts are untrusted data; secrets never copied; hard budget cap. | Take the pattern, not the service: the managed API stores sessions on Anthropic's platform (not eligible for zero data retention), which breaks the privacy constraint, and fgOS runs local CLIs. Lessons folded in: (1) the coach's output is a proposed new version (a diff or draft), never an in-place edit of live rules; the owner adopts or discards it, matching OC-D5. (2) Rules and memories are predictions; the coach checks them against transcripts and run records, and a rule that never fires or is contradicted is proposed for deletion (new use case U14). (3) The coach reads session transcripts, not only friction counts, because friction depends on agents reporting themselves. (4) Keep the always-loaded layer small; the coach measures its size and moves detail down, leaving a link (matches L8). (5) Conflicts are marked with both sources and dates, never guessed (matches the goal compass rule). (6) Give the coach the purpose (the goal compass) and let it judge what matters; fixed thresholds only decide when it starts. (7) Analyze each transcript separately, then one consolidating pass; a hard budget per run. (8) The coach also curates the heads' auto-memory stores: duplicates, stale and contradicted entries (new use case U13). |
| What the coach reads | **clear in outline** | Friction records of every layer, run and unit records (`fgos.run.attempt`, `fgos.unit.verify`), plan activity, question records (`fgos.question.*`, declared but not yet produced) | Exact view list follows Q1; draft list in section 6. |
| What the coach produces | **shaper draft** | OC-D5 hand-off | One report per run (path from `fgos convention path --kind report`), at most 3 proposals; a batched owner question for standard text; a supervisor event per evidenced problem (the supervisor files the backlog row; the coach does not write the backlog); `friction resolve --class <sig> --reason filed:<backlog-id>` once filed; a before/after count per signature in the next run's report. |
| Learning producers | **shaper reading after owner 20:43** | Owner 20:43: his reactions are one learning event among countless others. Existing producers: agents (`fgos friction record`), run settle (`frictions` in a result claim), run/unit/verify records, plan activity, head state; declared but not yet produced: `fgos.question.*`. | Every producer writes through an existing door: a friction record (kind, layer, signature, refs) or a metrics record. The coach never knows a producer by name; it reads signatures and records through the views. A new producer is a new writer plus, at most, a new layer value or record kind declared beside its owner; no coach change. |
| Owner-reaction hook | **one producer among many** | Dropped phase-02 plan (`c61de4c1c`): a Claude Code `UserPromptSubmit` hook matching text-detectable signals and recording one friction per signature. | Kept as one small producer task, ranked after the coach and its views; it gets no special store, view or coach logic. |
| Privacy of detail | **shaper decision inside the frame; one item for another session** | `git check-ignore` matches nothing under `.fgos/observe/`; a friction shard and eval shards are committed; `records/` is untracked but not ignored; `.fgos` sync chores have committed `.fgos` trees before (`fbb52c64c`, `c3b0de893`); the remote is GitHub. | General rule, not owner-specific: a record whose detail may hold private text (the owner's words, transcript excerpts, credentials in output) keeps only ids and signature in the tracked store and puts the text in a git-ignored local store (draft `.fgos/observe/private/<writerId>.jsonl`). **Another session:** the communication-standard plan's OC-D14 duty quotes the owner's words in `friction record --detail`; its planner should point that text at the private store. |
| First increment | **shaper draft** | — | Section 7: coach head and its start first (reads today's friction with no new views), then the views, then producers one by one, the owner-reaction hook being one of them. |

## 4. Quyết định đã chốt

| ID | Decision | Source | Date |
|---|---|---|---|
| CA-D1 | One generic learning loop: many producers (agents, run settle, runner, plans, questions, the owner-reaction hook) write learning events through the existing doors (friction records, metrics records); the coach never knows a producer by name; adding a producer adds a writer and at most a declared layer value or record kind, never a coach change. The owner's reactions are one producer among many. | Owner 20:43; shaper reshape round 2, unrevised through 21:06 | 2026-11-22 |
| CA-D2 | The coach starts through the watcher: a `coach-due` definition raises an event and the supervisor starts one coach head (`head:coach-<handle>`), never two. Default rule: an unsettled signature reaches 3 records, or 7 days passed with any unsettled friction; a run handles at most 3 signatures and makes at most 3 proposals. Numbers are config keys, provisional, reversed by the coach's own reports. | Shaper round 1, unrevised through 21:06 | 2026-11-22 |
| CA-D3 | Observe prepares ready views so the coach never works out how to fetch data. Views follow from the coach's use cases (section 6) and are versioned named definitions under `core/coach/definitions/` in the existing named-query door, held by contract tests on name, version and row shape; existing definitions are reused. A SQLite projection with SQL views is reopened only when the coach records enough `coach-query-gap` frictions. | Owner 20:55; shaper round 3, unrevised through 21:06 | 2026-11-22 |
| CA-D4 | Private text (people's words, transcript excerpts, credentials in output) never enters a git-tracked file or an external service: tracked records keep ids and signatures only, and the text goes to a git-ignored local store (draft `.fgos/observe/private/<writerId>.jsonl`). It holds for every producer. | Seed constraint; shaper rounds 1-2, unrevised through 21:06 | 2026-11-22 |
| CA-D5 | Goal compass: the coach takes goals only from written sources (product priority order, mission boundary, platform and area visions, intent-preservation ledger, locked laws, D-ADR decisions, settled discussions); each goal is tied to the views that measure it; problems are ranked by the goal they hurt and its place in the fixed priority order, then by count; every proposal cites its goal and source line; an owner rejection or re-aim is recorded as evidence of a misread goal; a conflict between recent owner decisions and a vision document is raised as a batched owner question with both sources and dates; the coach never writes or changes a goal. | Owner 21:05; shaper round 4, unrevised at 21:06 | 2026-11-22 |
| CA-D6 | Take the dreaming pattern, not the managed Dreams service (it stores sessions on Anthropic's platform, not zero-retention): the coach's output is a proposed new version, never an in-place edit; rules and memories are predictions checked against transcripts and run records, and one that never fires or is contradicted is proposed for deletion; the coach reads transcripts, not only friction counts; the always-loaded layer stays small, detail moves down with a link (L8); each transcript is analysed separately, then one consolidating pass, under a hard budget; the coach also curates the heads' memory stores. | Owner 21:10; shaper round 5, unrevised at 21:06 | 2026-11-22 |

Inherited and not re-minted: OC-D4, OC-D5 (`ds-cfsfcbknl6`).

## 5. Q&A log

- 2026-11-22 20:10 — Round 1, shaper. Read the seed, OC-D4/OC-D5/OC-D11-D14, the observe spec, the supervision spec, the dropped phase-02 plan, `fgos friction rank` and `vantt/pkm/docs/agent-views.md`. Found OC-D5 already settles scope and hand-off, the retrospective loop as the nearest ancestor (stopped 2026-09-11), and that owner words in friction detail would land in a store git does not ignore. Wrote the provisional shape. Asked Q1 (coach views: named definitions or pkm-style SQL projection) through the question store.
- 2026-11-22 20:38 — Owner: "hãy trình bày lại mục tiêu của thảo luận này". Signals T8/T9: the round-1 report was in English and dense with ids. Shaper restated the goal in plain Vietnamese in chat. Friction to record (OC-D14 fallback, `friction record` refused this head with `verb-not-granted` at 20:38): kind `awkward`, layer `docs` (no `owner-communication` layer yet), class `owner-restate-too-dense-english`, ref `backlog:p-kmavlfevvu`.
- 2026-11-22 20:43 — Owner: "4. phản ửng của anh chỉ là một sự việc cần học trong muôn vàng sự việc khác, em đang treat nó quá đặc biệt". Shaper agreed: round 1 gave the owner's reactions their own hook, store, view and coach input, when they are one producer among many. Reshaped section 6 around one generic loop with pluggable producers; the privacy rule stays but covers any private detail; the owner-reaction view was removed and the hook ranked last. Signal T4 (re-aim). Friction to record once the door works (OC-D14 fallback; `friction record` refused this head at 20:38): kind `awkward`, layer `spec`, class `shaping-overweights-one-input`, ref `backlog:p-kmavlfevvu`.
- 2026-11-22 20:50 — Owner: "em xem pkm dựng sẵn view chưa?" Shaper re-read pkm's `docs/agent-views.md` and `phase-03-views.md`: pkm's views are a stable, versioned table layer the agent writes its own SQL over, not pre-answered queries, so `q-6yhs63ru4i` had described pkm wrongly. Asked a corrected question, `q-kml4ipaweg`, superseding it.
- 2026-11-22 20:55 — Owner: "thực chất là ý của anh chỉ đơn thuần là thay vì coach phải suy nghĩ cách để lấy thì bộ đo cũng đã chuẩn bị sẵn các view rồi. việc này em brainstorm use cases của coach". Shaper agreed: the owner's need is ready answers, not a query mechanism. Cancelled `q-kml4ipaweg`, brainstormed 12 use cases with their views (section 6), and decided inside the frame to build the views in the existing named-query door. Signal T4 for the second time today (the shaper turned an outcome into a mechanism choice). Friction to record once the door works (OC-D14 fallback): kind `awkward`, layer `spec`, class `shaping-asks-mechanism-before-use-cases`, ref `backlog:p-kmavlfevvu`.
- 2026-11-22 21:05 — Owner: "có một ý là làm sao coach nhận ra, vision, mục tiêu cần được hướng tới, làm sao coach tự nhận ra các điều đó một cách chính xác trong quá trình làm việc." Shaper drafted the goal compass (section 3): goals only from written sources, each tied to its views, problems ranked by the goal they hurt, three accuracy checks, no goal written by the coach. Put to the owner as an open prose question.
- 2026-11-22 21:10 — Owner: "à, anh nhớ là claude có một khái niệm gọi là Dream/Dreaming, em thử reseach thêm về nó xem có học gì được từ đó không" with the Dreams doc link. Shaper read the doc, Anthropic's "components of agent memory" article and the cookbook's do-it-yourself dreaming workflow; recorded eight lessons in section 3, added U13 and U14, and decided not to use the managed service (privacy).
- 2026-11-22 21:06 — Owner: "tiếp theo là gì". Shaper: the shape had held across rounds without revision, so minted CA-D1 to CA-D6, regenerated sections 6 and 7, wrote the hand-off block and marked the discussion settled.

## 6. Thiết kế đã chốt {#design}

Settled by CA-D1 to CA-D6.

**Goal compass (CA-D5).** The coach reads goals from the written sources, ties each to the views that measure it, and ranks problems by the goal they hurt. Every proposal names its goal and source line; a conflict between sources is raised to the owner, never resolved by guessing.

**One generic loop (CA-D1, CA-D2).** Many producers write learning events through the doors that already exist: agents and run settle write friction records, the runner and other components write metrics records, and small producers such as the owner-reaction hook write friction like anyone else. The coach does not know producers by name. Each watcher tick runs the `coach-due` definition over all unsettled friction. When it raises, the supervisor starts one coach head. The coach reads the coach views, picks at most 3 problems ranked by the goal compass, diagnoses each from the views, the transcripts (one analysis per transcript, then one consolidating pass) and the memory stores, and writes one report. Every change it proposes is a reviewable new version, never an in-place edit (CA-D6): a small change to an instruction text or a memory store becomes one batched owner question; anything else becomes a supervisor event that the supervisor turns into a backlog row for the normal pipeline. The coach settles the frictions it filed and, on its next run, reports each signature's count before and after the fix.

**Adding a producer** means a writer plus, at most, a layer value or record kind declared beside its owner. The coach, its views and its trigger do not change.

**Coach use cases and the view each needs.** The coach should open a view and read the answer, never compose a query to find it. Brainstormed from the coach's job (OC-D5: collect, diagnose, propose, measure after) plus the loop's own health.

| # | Use case: the coach wants to... | View (ready answer) | Status |
|---|---|---|---|
| U1 | pick what to work on: unsettled problems ranked by the goal they hurt (goal compass, section 3), then by count | `friction-hot`: signature, layer, count, distinct refs, first and last seen, weekly trend | new |
| U2 | diagnose one problem: every case of a signature with its context | `friction-cases`: one row per record of a signature, with producer, plan, phase, run, session, time, detail pointer | new |
| U3 | find a shared cause: problems that cluster on one plan, phase, executor or provider | `friction-by-ref`: signatures grouped by ref kind and id | new |
| U4 | check a fix worked: the signature's count before and after its `filed:` resolve | `fix-effect` | new |
| U5 | catch a regression: a settled signature that came back | `friction-returned`: signatures with a record after their last resolve | new |
| U6 | see run health: failures, fallbacks and verify findings by provider, model, account, executor, plan | `failure-rate-by-*`, `plan-failure-rate`, `m7-first-pass` (coding domain) | reuse |
| U7 | see waste: tokens on failed or retried runs, per plan and per run | `token-waste` (new), beside `plan-tokens`, `run-tokens` | new + reuse |
| U8 | see where time goes and what stalls | `phase-time`, `plan-lead-time`, `plan-no-progress` | reuse |
| U9 | see the owner's load: how long questions wait, how often the owner steps in, round trips per decision | `m2-owner-wait`, `m3-interventions` (both `unmeasured` until `fgos.question.*` is produced) | reuse, blocked on producer |
| U10 | notice a blind spot: a producer or layer that went silent (the retrospective loop stopped on 2026-09-11 and nobody noticed) or a write door that rejects | `producer-silence`: last record per layer and kind against its usual rate, plus `fgos.observe.health` | new |
| U11 | judge itself: proposals made, accepted, filed, and their fix effect | `coach-outcomes` (needs the coach to record its proposals as records) | new |
| U12 | check the instruction surface it may change: duplicates, rules with no check | not a view: the `instruction-audit` skill | tool |
| U13 | curate the heads' memory stores (Claude Code auto memory and similar): merge duplicates, mark stale or contradicted entries, as a proposed new version | not a view: memory files plus transcripts | new, from Dreams |
| U14 | test each rule and memory against what actually happened: rules that never fire, rules contradicted by transcripts or run records | `rule-evidence`: per rule or memory, the transcripts and records that cite or contradict it (needs a cheap way to find citations; to be designed) | new, from Dreams |

**Private detail.** Any detail that may hold private text stays in a git-ignored local store; tracked records carry ids and signatures only. This holds for every producer.

```mermaid
flowchart LR
  P1[agents] --> F[(friction records, tracked)]
  P2[run settle] --> F
  P3[owner-reaction hook] --> F
  P4[runner, plans, questions] --> M[(metrics records)]
  F -. private text .-> X[(private store, git-ignored)]
  F --> W{watcher tick: coach-due}
  W -- raised --> S[supervisor]
  S -- session start --> C[coach head]
  F --> V[coach views]
  M --> V
  V --> C
  X --> C
  C --> R[report per run]
  C -- instruction text --> Q[batched owner question]
  C -- evidenced problem --> S
  S --> B[backlog row, normal pipeline]
  C -- resolve filed --> F
```

## 7. Danh mục hạng mục / task {#tasks}

Order: `coach-head` first; `coach-views` and `private-detail` next, independent of each other; `transcript-and-memory-curation` after `private-detail`; `owner-reaction` last.

### Coach head and its start {#task-coach-head}

- **Goal:** a `coach` persona and skill carrying the goal compass, the hand-off rules of OC-D5 and the new-version rule; the `coach-due` watcher definition; the supervisor's action for it; `coach.*` config keys for thresholds and budget; the coach works from today's `friction rank` and `metrics query` before the new views exist.
- **Design excerpt:** section 6, "Goal compass" and "One generic loop".
- **D-IDs:** CA-D1, CA-D2, CA-D5; inherits OC-D5.
- **Siblings:** first; the others add inputs.
- **Draft verify:** a fixture store with one signature at the threshold raises `coach-due` once and the supervisor starts exactly one coach head; a fixture coach run writes one report with at most 3 proposals, each citing a goal and its source line.

### Coach views {#task-coach-views}

- **Goal:** the new views of section 6's use-case table (U1-U5, U7, U10, U11) as versioned named definitions under `core/coach/definitions/`, and the list of reused definitions (U6, U8, U9) in the coach skill.
- **Design excerpt:** section 6, "Coach use cases and the view each needs".
- **D-IDs:** CA-D3.
- **Siblings:** after `coach-head`; independent of `private-detail`.
- **Draft verify:** a contract test asserts each view's name, version and row shape on a fixture store; every reused definition answers on the same fixture or returns a named `unmeasured`.

### Private detail store {#task-private-detail}

- **Goal:** a git-ignored local store for record detail that may hold private text, used by any producer; the friction door writes detail there when asked and keeps only ids in the tracked record.
- **Design excerpt:** section 6, "Private detail".
- **D-IDs:** CA-D4.
- **Siblings:** before `transcript-and-memory-curation` and `owner-reaction`.
- **Draft verify:** a friction recorded with private detail leaves no detail text under `.fgos/observe/records/`; `git check-ignore` matches the private store path.

### Transcript and memory curation {#task-transcript-and-memory-curation}

- **Goal:** U13 and U14: the coach analyses session transcripts one by one and then consolidates, checks rules and memories against them, and proposes a new version of a memory store or rule set (merges, stale or contradicted entries marked, unused rules proposed for deletion), under a hard budget.
- **Design excerpt:** section 6, use cases U13 and U14; section 3 row "Lessons from Claude Dreams".
- **D-IDs:** CA-D6.
- **Siblings:** after `private-detail` (excerpts are private text). Open point for the planner: a cheap way to find the transcripts and records that cite or contradict a rule.
- **Draft verify:** on fixture transcripts and a fixture memory store with one duplicate and one contradicted entry, the coach's proposed version merges the duplicate, marks the contradiction with both sources and dates, and leaves the input store unchanged.

### Owner-reaction hook, one producer {#task-owner-reaction}

- **Goal:** the `UserPromptSubmit` hook from the dropped phase-02 plan (`c61de4c1c`), as one ordinary producer of friction.
- **Design excerpt:** section 3 rows "Learning producers" and "Owner-reaction hook".
- **D-IDs:** CA-D1, CA-D4.
- **Siblings:** after `private-detail`; needs the `owner-communication` friction layer from the communication-standard plan. Last.
- **Draft verify:** `cargo test -p fgos --test owner_reaction_hook`: "khoan, cái này là gì" records one friction whose tracked record has no owner words.
