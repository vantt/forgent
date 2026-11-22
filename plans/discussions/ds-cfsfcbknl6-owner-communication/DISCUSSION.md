---
id: ds-cfsfcbknl6
title: "Tiêu chuẩn giao tiếp: one shared communication standard for how every agent talks to the owner"
status: settled
source:
  - p-wb6rkwpjsg
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

- **Outcome:** one shared standard, **tiêu chuẩn giao tiếp** (communication standard), always loaded by every head, lead and worker in every CLI, that gives the motive, the principle judged from the reader's side, its applications (before speaking, names and ids, language and length, decision questions, status and incident reports) and a few curated cases; an agent that sees its communication fell short records a friction so the system can improve; the question door makes answers cheap. Decisions OC-D1, OC-D3 to OC-D14 (OC-D2 superseded by OC-D8, OC-D7 item 1 by OC-D13).
- **Constraints:** the standard replaces `core/skills/_shared/decision-question.md` and `core/instructions/decision-question.md`; every caller moves and the old paths are removed in the same change (L10, design principle 1); generated copies are rebuilt with `npm run build:skills`, never edited; a new friction layer value goes into `packages/observe/rust/friction-kinds.json` only; a user-visible change gets a line in `CHANGELOG.md`; `npm test` and `cargo test --workspace` green.
- **Non-goals:** keeping information valid (OC-D1, its own item); the coach role (OC-D5, its own item); a check on the agent's outgoing messages (OC-D7, level 3); an automatic hook that scans the owner's messages (OC-D13, moved to the coach discussion); changing the approved-frame rule or the product priority order.
- **Acceptance criteria:** see each task in section 7.
- **Open points that block only part:** the T-signal list is provisional (section 6, step 3); task 1 writes it as is and the coach refines it later. The activated release refuses `friction record` to heads (`verb-not-granted`, seen 19:35) although `src/session-host/head-grants.mjs:29` grants it; until a newer release is activated, heads use the fallback in OC-D14.
- **Source ids:** `p-wb6rkwpjsg`; decisions OC-D1 to OC-D14.
- **Collision to resolve in planning:** draft plan `261122-0056-orchestration-skeleton` also lists `packages/questions/contracts/questions-input.v1.json` and `packages/questions/rust/src/*` in its footprint; task 3 touches the same files, so the planner either sequences task 3 after that plan or folds task 3 into it.
- **Separate items this discussion produced (not for this planner):**
  - Information freshness (OC-D1). Owner 17:53 asked whether it fits the running plan `261122-0118-heads-stable-and-able`. Shaper's reading: the idle-lead part (status resting on `leadLive`) is already folded there (`p-4uqiyjwrtd`, phases 7 and 9). The stale-question part goes to draft plan `261122-0056-orchestration-skeleton` (question recipients and notifier), OC-D12.
  - The coach as part of a complete observation cluster, plus the automatic capture of owner reactions (OC-D13). Owner 17:53: a separate discussion; observe metrics plus friction already give the data; extend the cluster into a whole with a coach that cares for it, and harden observe with ready-built harness and tools so the coach gets aggregated data fast, for example pre-built SQL views as in the owner's `vantt/pkm` project. Shaper notes: L3 already says truth in JSONL, the database is a view, so pre-built views fit the law; observe already has named query definitions (`fgos metrics query`, observe spec section 1), the nearest existing door to extend; `vantt/pkm` is the owner's GitHub repository (owner 19:35); not cloned on this machine, its pre-built SQL views are input for the coach discussion.

## Seed

Opened by the secretary (Miu) on the owner's order, 2026-11-22. The owner wants the lessons from today distilled into one common place so every agent (heads, leads, workers) talks to the human the same way: complete information, one clear action, low cognitive load.

- **Outcome:** one shared source, loaded by every agent, that covers questions, status reports and incident reports.
- **Input to read first:** `plans/reports/secretary-261122-1254-agent-human-communication.md` (what exists, seven gaps with evidence, open design points) and `core/skills/_shared/decision-question.md` (the existing five-part rule for questions).
- **Constraints:** extend or replace the existing source, never add a parallel one (design principle 1); change every caller and remove the old text in the same change (L10); rules a program can check go to `fgos questions ask`, the rest stays prose. The owner prefers that agents do read-only work first and bring findings plus a recommendation, so park owner questions in the store with a recommended option and a stated default instead of waiting.
- **Non-goals:** changing the approved-frame rule or the product priority order.
- **Open design points for the shaper:** one file or two; which checks are program-enforced; how a stale question is withdrawn (asker duty, or a watcher flagging a question whose plan is done).
- **Source ids:** `p-wb6rkwpjsg`.

## 1. Trạng thái hiện tại

Settled again, 2026-11-22 19:45. Domain: coding.

The **tiêu chuẩn giao tiếp** (communication standard) is defined: grounded in the owner's cognitive overload; three parts (A conduct, B presenting information in nine points, C when and where); seed cases; bad exchanges recorded as friction, by every agent that notices its own communication fell short, with a fallback when the door refuses (OC-D14); a coach learns from them (its own discussion).

**Output:** two tasks for one planner (section 7): write the standard and move every caller; cheap answers in the question door. Separate: stale questions go to draft plan `261122-0056-orchestration-skeleton` (OC-D12); the coach observation cluster, with automatic capture and pre-built views as in `vantt/pkm`, needs its own discussion. No owner question is open.

## 2. Mục tiêu & đề bài

Agents in fgOS speak to the owner many times a day, and the owner's attention is the scarcest and most expensive thing in the whole system. Today the only shared rule is the five-part decision question, and it covers one act (asking the owner to choose). Its guard only counts labels, so a question can pass it and still be hard to understand. Nothing tells an agent why it should communicate well, or what "well" means outside a question. On 2026-11-22 the owner spent turns asking permission back ("yes, just do it"), asking what a name meant ("who is OPC?"), re-reading long blocks and having a question rewritten; the shaper's own first messages in this discussion did the same (English, long, full of ids and file paths). The outcome is one shared standard, **tiêu chuẩn giao tiếp** (communication standard), always loaded by every head, lead and worker in every CLI. It gives the motive first, then a principle judged from the reader's side, then how the principle applies to each kind of message (before speaking, names and ids, decision questions, status and incident reports), then a growing set of real cases, good and bad, that agents learn from and that improve the standard over time. A program check is a last safety net, chosen at the end, never the reason an agent communicates well. The standard replaces the existing decision-question text rather than sitting beside it. Out of scope: keeping information valid (fresh data, stale questions, nudging the concerned agent), which belongs to the watchers and monitors and is a separate item.

## 3. Vấn đề rõ / chưa rõ

| Point | State | Evidence | Current answer |
|---|---|---|---|
| Name and purpose of the standard | **settled, OC-D2** | Owner 15:50 | "Thấu hiểu user". Purpose: the owner decides at once from what is on the screen, without asking back or looking anything up. |
| Order of work | **settled, OC-D3** | Owner 15:50 accepts the shaper's four steps | Why, then standard, then cases, then mechanism. |
| Information validity | **settled out of scope, OC-D1** | Owner 13:10; held unchallenged through rounds 3-5 | Separate item for watchers and monitors. Not yet in the backlog: the secretary could not be reached by mailbox (name `secretary` unknown); the owner was told at 13:15. |
| Where it is loaded so every agent sees it | clear | `core/instructions/*.md` with `appliesTo: ["*"]` is rendered into each project's `AGENTS.md` by `src/setup/instruction-projections.mjs`, which every agent CLI reads; `decision-question.md` is already one of them | The always-loaded instruction carries the motive and the principle in a few lines and points to the full standard. |
| One file or two | **settled, OC-D6** | The decision-question fragment is cited by about 20 source files and 4 code/test files | Default: one standard file that absorbs today's decision-question text as one of its applications; every caller moves in the same change (L10). Reverse if the file grows past what an agent will read, in which case the case log moves to a sibling file. |
| Case log: where, who adds, how it improves the standard | provisional (round 6) | Owner 15:50: "thu thập thêm các tình huống trao đổi không tốt và học rồi cải thiện"; owner 16:00: "bộ friction có ghi nhận được không?". Friction store (`docs/platform/observe/spec.md` lines 136-138; `core/skills/_shared/friction-capture.md`): one record has a subject, a stable signature (`class`), a kind (`awkward` fits), a detail text (capped), refs; `fgos friction rank` counts each signature's repeats with first and last seen. The layer list is closed (`skill`, `tool`, `runner`, ..., `context`, `task`) with no value for talking to the owner; a value is added by editing `packages/observe/rust/friction-kinds.json`, no code. `friction-capture.md`'s "record when" list has no owner-confusion trigger. | **Default: the friction store is the case log; no new file** (one door). Raw cases go to friction as records (the log); the standard keeps only a few curated examples (the state), matching L1. Needed: (1) a layer value for owner communication in `friction-kinds.json`; (2) a trigger in `friction-capture.md`: the signals listed in section 6, step 3 (owner 17:30 named emotion change, frustration and not following the agent's recommendation; the shaper added the rest); (3) one stable signature per kind of fault (for example permission-asking, unexplained id, too long or wrong language); (4) when `fgos friction rank` shows a signature repeating, it is proposed as a line of the standard, batched for the owner. Who watches the rank and proposes: **the coach** (owner 17:16), not the secretary. |
| Coach role | **settled for this standard, OC-D5; the coach itself is its own item** | Owner: "không nên là miu. là một người khác được bật bởi supervisor luôn. có thể là coach ... mọi thứ cần tối ưu, self-improve, self-learning đều nên cho coacher làm." Prior art: no coach persona in `core/agents/` and no `coach` in code, specs or git history; adjacent skills `instruction-audit` (periodic audit of the instruction surface) and `distill` exist; the supervisor already starts heads with `fgos session start`. | A coach head, started by the supervisor when the watcher sees the right moment, owns every optimisation, self-improvement and self-learning job of the system. This standard is one of its inputs: the coach reads the owner-communication friction, proposes new lines for the standard in a batch for the owner, and curates its examples. Defining the coach (persona, when it is started, its verbs) is a separate backlog item with its own shaper; this discussion only names the hand-off. Not yet in the backlog (shaper cannot write it; mailbox to the secretary refused from this sandbox). **Shaper's position (17:35):** agree that the learner must not be the secretary or any agent judging its own messages (C1 and S1-S2 went unnoticed by their authors; the secretary would grade her own cases). Disagree with "everything self-improving goes to the coach" as stated: (a) one role owning every kind of improvement becomes a bottleneck and a role without a boundary (RUL11); proposed boundary: the coach owns the learning loop (read signals, find repeats, propose, measure after), and the fix goes to the area that owns it; (b) every proposal adds to the owner's load, the opposite of this standard's goal, so the coach needs a threshold (a signature repeated, or a fixed rhythm) and a cap per batch; (c) the coach must also merge and delete rules, not only add (RUL104), or the always-loaded standard bloats; (d) a change is verified by the signature's count dropping afterwards (`fgos friction rank --bucket`); (e) self-reporting under-reports, so the coach may need to scan owner messages for the T-signals itself, which has a cost. **Round 8 (owner 17:37):** there are no standing area owners; work is done by starting the team whose setup fits the task. So the coach collects signals, finds the real problem, and hands it to a team set up for it. Shaper's additions, provisional: (f) the hand-off uses the existing intake, not a new dispatch path: the coach returns a well-evidenced problem (signature, count, examples, diagnosed cause, proposed outcome) to the supervisor that started it, which writes the backlog row and queues it, and the normal pipeline (shaper, planner, lead) assembles the team; (g) a change to the standard's own text (one line, one example) is too small for that pipeline: the coach drafts the exact wording, the owner approves it in a batch by letter, and one run lands it; (h) "finding the real problem" is the coach's core work: a repeated signal may come from a skill or prompt that produces the fault rather than a missing rule, so the coach diagnoses before it proposes. |
| Gaps 1 and 4 | in scope (owner 14:55) | Seed cases C1 and C4 in section 6 | Covered by the principle's applications "before you speak" and "names and ids". |
| Gaps 5, 6, 7 | provisional | Owner named 1 and 4 at 14:55 | 5 and 6 are applications of the principle (cheap answers, report shape). 7 is answered by the standard itself: the lesson lives in one shared place, not in one agent's memory. |
| Program support (step 4) | **OC-D7, item (1) under revision (owner 18:05)** | Existing guard checks labels only, on ask-tool calls only; Claude Code runs fgOS hooks on `UserPromptSubmit` (the questions row, `src/setup/agent-hooks.mjs:241`) and `Stop`; Codex on `Stop` | Ranked by value: (1) **capture the owner's reaction**: a hook on the owner's incoming message spots the T-signals ("là gì", "khoan", "không phải", "cứ làm đi", ...) and records a friction candidate with the owner's words and the agent's previous message; the coach judges it. It measures from the reader's side and fixes the coach's main risk, under-reporting. (2) **cheap answers in the question door**: options lettered A-D on display and a stated default field. (3) **checking the agent's own outgoing message**: not now; it invites writing for the check (step 1); the coach decides later from data. |
| Approved-frame rule, priority order | non-goal | Seed | Moved into the standard unchanged. |

## 4. Quyết định đã chốt

| D-ID | Decision | Source | Date |
|---|---|---|---|
| OC-D1 | Keeping information valid (fresh data, stale questions, status on an old flag) is not part of this standard; it belongs to the watchers and monitors and is a separate item. | Owner 13:10, unchallenged through 15:50 | 2026-11-22 |
| OC-D2 | The standard is named **thấu hiểu user**. Its core: the owner's attention is the scarcest resource; the agent does all of its own work before speaking; what it brings must let the owner decide at once without asking back or looking anything up. The motive is respect for the owner's attention and freeing the owner from waiting (product priority 2); a program check is a safety net, not the reason. | Shaper's reading at 15:44, owner confirmed at 15:50 | 2026-11-22 |
| OC-D3 | The work goes in four steps: why, standard, cases, mechanism. | Shaper proposal 15:44, owner accepted 15:50 | 2026-11-22 |
| OC-D4 | Bad exchanges are kept in the friction store, not a new file: raw cases are friction records (the log), the standard keeps only a few curated examples (the state). Needs a layer value for owner communication and an owner-signal trigger in the friction-capture rule. | Owner 16:00 asked; shaper scouted and proposed; unchallenged through 17:45 and built on by OC-D5 | 2026-11-22 |
| OC-D5 | A coach, not the secretary and not the agent that made the message, learns from those records. The supervisor starts it at the right moment. It owns the learning loop only: collect signals, diagnose the real cause, propose, measure the signature's count afterwards; it merges and deletes rules, not only adds; proposals are thresholded and capped per batch. Hand-off: a small text change to the standard is drafted by the coach and approved by the owner in a batch, then landed by one run; anything else goes back to the supervisor as a well-evidenced problem, becomes a backlog row and runs through the normal pipeline, which assembles a fitting team. There are no standing area owners. | Owner 17:16 (coach), 17:37 (no area owners, hand to a fitting team), 17:45 ("đồng ý" to the hand-off points) | 2026-11-22 |
| OC-D6 | One standard file, not two: the standard absorbs today's decision-question text as one of its applications; split the case examples out only if the file grows past what an agent will read. | Shaper default since 13:05, unchallenged through 17:46 | 2026-11-22 |
| OC-D7 | Program support, in order: (1) a hook on the owner's incoming message spots the T-signals and records a friction candidate with the owner's words and the agent's previous message; (2) the question door shows options lettered A-D and carries a stated default; (3) no check on the agent's outgoing message for now, the coach may propose it from data. | Shaper proposal 17:45, owner "đồng ý" 17:46 | 2026-11-22 |
| OC-D8 | Supersedes OC-D2's name and sharpens its principle. The standard is named **tiêu chuẩn giao tiếp** (communication standard). The understanding behind it: the owner is cognitively overloaded, with too much to handle, so every message must make taking in information as easy, as clear and as high in quality as possible; deciding at once is one case of that, reports and status included. Motive and safety-net role of checks unchanged from OC-D2. | Owner 18:00 | 2026-11-22 |
| OC-D9 | Conduct: the agent brings its own view and pushes back with evidence; the purpose is a better result and clearer information, not pleasing the owner; going along prolongs problems. Once the owner decides, the agent carries it out and reopens only with new evidence. | Case S3 (17:35), owner confirmed 18:20 | 2026-11-22 |
| OC-D10 | Sharpens OC-D9: the motive is to weigh everything the owner says and reflect on one's own view; agree plainly when the owner is right, push back only with a better-grounded view. Neither flattery nor contrarianism; a discussion exists to reach a better result, clearer information, or a lesson. | Owner 18:29 | 2026-11-22 |
| OC-D11 | The standard has three parts: A conduct, B presenting information (the nine points in section 6, the largest part), C when and where to speak. | Shaper draft 18:05, owner confirmed the nine points 19:35 | 2026-11-22 |
| OC-D12 | The stale-question part of information freshness goes to draft plan `261122-0056-orchestration-skeleton` (question recipients and notifier), not to `261122-0118-heads-stable-and-able`; the idle-lead part is already folded in the latter (`p-4uqiyjwrtd`). | Shaper recommendation 17:55, owner "theo đề nghị của em" 19:35 | 2026-11-22 |
| OC-D13 | Supersedes OC-D7 item 1: no automatic hook scanning the owner's messages is built in this work; the reaction signals are a rule for the agent itself (Part A). The automatic capture idea moves to the coach discussion. This leaves two tasks. | Shaper proposal 18:05, owner "đúng, đồng ý bỏ" 19:45 | 2026-11-22 |
| OC-D14 | An agent that sees its own communication or presentation fell short (from a reaction signal or by its own reflection) must find a way to record a friction, so the system has a chance to improve. Door: `fgos friction record`; a worker inside a run lists it under `frictions` in its result claim; if the door refuses, the agent writes the same facts into its own working file (discussion, plan report) and records it once the door works. Never lost, never blocking the work. | Owner 19:45 | 2026-11-22 |

## 5. Q&A log

- 2026-11-22 13:05 — Round 1. Shaper scouted `decision-question.md` (fragment and instruction), `questions-input.v1.json`, `refusals.v1.json`, questions spec §4-§5, the report sections of `fgos-lead`, `fgos-secretary`, `fgos-supervisor`, and `instruction-projections.mjs`. Wrote provisional answers for every point. Parked two owner questions (stale-question mechanism, program checks); the other points carry defaults that a planner can use if the owner does not object.

- 2026-11-22 13:10 — Owner (in the shaper session, after the two questions were explained in Vietnamese): "cần lưu ý, có 2 vấn đề 1) độ còn valid của thông tin, việc này không cover trong cách giao tiếp, mà là cách các hệ thống watcher, monitor phải luôn cung cấp dữ liệu mới và nhắc agent liên quan. 2) chổ này liên quan đến cách, hình thức giao tiếp và trao đổi với human. mục tiêu lớn giảm tải nhận thức, ra quyết định ngay, kịp thới với thông tin sẵn sàng, rõ ràng, dễ hiểu." Shaper: information validity leaves this discussion and becomes a separate item; q-von37r6ef6 cancelled; §2 rewritten around the cognitive-load goal; the status-report source/age rule and the "life of an open question" section dropped; §6 regenerated. q-xkrbp66xy6 still stands (form).

- 2026-11-22 14:55 — Owner, quoting the seven gaps: "câu 1 và câu 4 là các vấn đề cần xử lý tại đây. nó cũng giống như trước đây hình như cũng từng có lần xử lý hook gì đó mà mỗi lần hỏi phải ghi rõ là: chuyện gì đang xảy ra, tại sao, em advise thế nào, ..." Shaper: gaps 1 and 4 confirmed in scope. The recalled guard is `fgos hook decision-question` (commit 3d3d32648); it sees only ask-tool calls, never plain chat. Parked q-nfgvjge6zg on enforcing gaps 1 and 4 at turn end. Gaps 5-7 stay provisional.

- 2026-11-22 15:44 — Owner: "trước khi anh trả lời, anh muốn hỏi là em có hiểu ý của anh trong việc: trao đổi tốt hơn với người là như thế nào không. discussion này nhắm thiết lập một chuẩn mực cũng như động lực trao đổi tốt hơn với người." Shaper restated its understanding (attention is the scarcest resource; the agent does the heavy work; a good message is decided on in one read; standard judged from the reader's side; motive over checks), admitted it had jumped to mechanisms and that its own messages showed the same faults, and proposed four steps: why, standard, cases, mechanism.

- 2026-11-22 15:47 — Owner: "ví dụ như ở hook decision question, tại sao phải làm như vậy, nhằ mục đích gì". Shaper: no written rationale found beyond the commit (2026-10-08, "check owner questions against one decision-question template") and the template's own words ("the question is a narrow confirm on top of the analysis"). Read each of the five parts as answering a question the owner would otherwise ask back; the guard counts labels only, so a question can pass it and still be hard to read. Gaps 1 and 4 share the root: the agent pushes its own work onto the owner. Proposed the root principle.

- 2026-11-22 15:50 — Owner: "đúng và anh nghĩ em nên ghi rõ ràng cái hiểu như trên của em vào thảo luận để xem nó như là một tiêu chuẩn: `thấu hiểu user`. để xuất 4 bước của em cũng tốt. và bộ chuẩn mực này có thể thu thập thêm các tình huống trao đổi không tốt và học rồi cải thiện cách trao đổi vào đây." Shaper: minted OC-D1 to OC-D3; wrote steps 1-2 and seed cases into §6; cancelled q-xkrbp66xy6 and q-nfgvjge6zg as premature (step 4); case-log mechanics opened in §3.

- 2026-11-22 16:00 — Owner, after the shaper proposed a separate case file: "bộ friction có ghi nhận được không?" Shaper scouted the friction store: yes, with a data-only addition (a layer value) and a new trigger in the friction-capture rule; `fgos friction rank` already gives the repeat count that decides when a case becomes a rule. The separate case file is dropped; raw cases go to friction (log), curated examples stay in the standard (state).

- 2026-11-22 17:16 — Owner: "không nên là miu. là một người khác được bật bởi supervisor luôn. có thể là coach chẳn hạn. watcher/supervisor ở đúng thời điểm thì sẽ bật coach lên để tối ưu hệ thống. mọi thứ cần tối ưu, self-improve, self-learning đều nên cho coacher làm." Shaper: the curator of the case log is the coach, not the secretary. No coach exists today (scouted). The coach role is wider than this standard, so it becomes its own item; this discussion records only what the coach takes from it.

- 2026-11-22 17:30 — Owner: "việc kích hoạt ghi nhận friction thì để ý mấy lúc mà human bị thay đổi cảm xúc, bực tức hoặc không làm theo đề nghị của agent sẽ là các tín hiệu để theo dõi, em có thể liệt kê thêm các tín hiệu khác." Shaper: wrote the trigger list T1-T12 into §6 step 3 (T1-T2 from the owner, T3-T12 added with today's examples), with a caveat that T2 is friction only when the owner's reason shows missed context.

- 2026-11-22 17:35 — Owner: "em thấy coach hợp lý không. anh nói gì là em vuốt đuôi đi theo, không hề thảo luận, advise hay debate." Shaper: accepted the criticism (seed case S3, signals T1 and T4); gave its view on the coach in §3: agree on separating the learner, disagree with an unbounded scope; proposed the coach owns the learning loop with a threshold, a batch cap, rule deletion and before/after measurement, and the fix stays with the owning area.

- 2026-11-22 17:37 — Owner: "đồng ý, nhưng chưa rõ người sở hữu mảng là ai? hiện hệ thống không hề có ai sở hữu mảng. thực chất khi làm gì thật bật team liên quan và giao cho task phù hợp thì nó sẽ làm. vì vậy coach thu thập và xác định đúng vấn đề rồi giao cho một team có setup phù hợp để giải quyết?" Shaper: agreed that there are no standing owners; added that the hand-off should go through the existing intake (coach to supervisor to backlog row to the normal pipeline), a fast path for small text changes to the standard, and diagnosis before proposal.

- 2026-11-22 17:45 — Owner: "đồng ý" to the coach hand-off points (intake through the supervisor, fast path for small text changes, diagnosis before proposal). Shaper minted OC-D4 (friction store as case log) and OC-D5 (coach scope and hand-off), and opened step 4 with a ranked proposal: capture the owner's reaction first, cheap answers in the question door second, no check on outgoing messages for now.

- 2026-11-22 17:46 — Owner: "đồng ý. như vậy thảo luận này ra 2 việc phải làm?" Shaper minted OC-D6 (one file) and OC-D7 (program support levels); answered that the discussion yields three tasks for one planner plus two separate items (freshness, coach); wrote §7 and the hand-off block; marked the discussion settled.

- 2026-11-22 17:53 — Owner: "1-3 anh cần làm rõ thêm. watcher và monitor có thể nhét luôn và lead đang làm là : heads-stable-and-able không? Vai coach anh nghĩ cần một thảo luận thêm, như vậy đã có observation/metrics và friction để lấy dữ liệu, giờ chúng ta có thể mở rộng thêm một chút ở chổ cụm này thì có thể trở thành 1 cụm hoàn chỉnh bao gồm có 1 coach để lo chăm sóc và quản hệ này và anh nghĩ chắc cũng sẽ cần làm cứng thêm chổ observation/metrics, chủ yếu là build sẵn harness/tool để coach có thể nhanh chóng lấy dữ liệu quan sát đã được tổng hợp, ví dụ các dạng sql-view được build sẵn như project vantt/pkm đã làm ." Shaper scouted the heads-stable plan, the orchestration-skeleton draft and the observe spec; recorded the freshness split, the coach-cluster seed and the task 3 collision in the hand-off block; explained tasks 1-3 in plain words in chat.

- 2026-11-22 18:00 — Owner: "việc 1: tên gọi thấu hiểu user thì cũng không đúng lắm nhỉ. thật ra là tiêu chuẩn giao tiếp thì đúng hơn. sự thấu hiểu ở đây là hiểu user bị quá tải nhận thức, quá nhiều việc, nên hướng giao tiếp phải làm cho việc tiếp nhận thông tin dễ dàng nhất, rõ ràng và chất lượng nhất." Shaper agreed: the old name read as a general empathy rule while the scope is communication; the overload is the reason, not the name. Minted OC-D8 superseding OC-D2's name; widened the principle from deciding at once to taking in information easily, with deciding as one case; renamed throughout outside §4-§5.

- 2026-11-22 18:05 — Owner: "việc 2: chổ này anh chỉ hint là sử dụng một số phản ứng của anh như là một tín hiệu để nhận ra là cách trình bày thông tin của em chưa đạt. à, nói tới đây mới vỡ lẻ ra là việc số 1 chính xác là tiêu chuẩn trình bày thông tin là một vấn đề lớn trong tiêu chuẩn giao tiếp." Shaper: the reaction signals are for the agent to notice and re-present at once, not a hook to build here; proposed moving the automatic capture to the coach cluster and folding the rule into task 1 (two tasks left). Restructured step 2 into three parts (conduct, presenting information, when and where) and drafted presenting information in nine points. Discussion reopened until the owner confirms.

- 2026-11-22 18:15 — Owner: "à, cần làm rõ hơn nha, em lại vi phàm rồi đó. khi mà anh phát ra những tín hiệu khó chịu thì nhiệm vụ của em là phát hiện ra mình trình bày có vấn đề, việc của em là ghi nhận để tìm hiểu, không nên tự nhiên nhảy vảo trình bày lại, như vậy càng làm rối. khi anh bực thì chắc chắn ngay sau đó anh sẽ hỏi lại. lúc đó anh không hiểu mà em lại tự điều chỉnh thì càng làm rối hơn, và nên chờ để mà anh hỏi, khi đó em càng sớm hiểu là mình đang gặp vấn đề giao tiếp gì" Shaper: agreed; Part A rule rewritten to notice, record and wait for the owner's question; seed case S4 added.

- 2026-11-22 18:20 — Owner: "anh rất thích cách hành xử này nhé: có ý kiến riêng và dám phản biện. mục tiêu là để kết quả công việc tốt hơn và thông tin được rõ ràng hơn, không phải để làm hài lòng anh. việc giúp anh nhận ra vấn đề còn giúp sớm giảm tải cho anh, vuốt đuôi chỉ làm cho vấn đề kéo dài không được giải quyết." Shaper minted OC-D9 and wrote the purpose into Part A; added that once the owner decides, the agent carries it out and reopens only with new evidence.

- 2026-11-22 18:29 — Owner: "đương nhiên rồi, phản biện có nghĩa là cứ không phải là anh nói gì thì cũng phải cải. mà động lực của agent là bất cứ gì anh nói thì cũng phải suy xét, cũng phải tự phản tư, tự phản biện, nếu ý của anh đúng thì phản biện làm chi, còn nếu em có ý đúng hơn thì phải phản biện. mục tiêu là kết quả tốt hơn, mục tiêu không phải là em cứ luôn vuốt đuôi anh nịnh hót hoặc theo chiều ngược lại là cái gì cũng cải. chúng ta thảo luận để có kết quả tốt hơn, để làm rõ thông tin hơn hoặc để học được hoặc rút được bài học gì đó" Shaper agreed with nothing to add; minted OC-D10 sharpening OC-D9; Part A rewritten.

- 2026-11-22 19:35 — Owner: "xác nhận 9 điểm trình bày thông tin; gộp việc 2 vào tiêu chuẩn anh chưa hiểu. chọn chổ: theo đề nghị của em. project repo pkm: vantt/pkm;" Shaper minted OC-D11 (three parts, nine points) and OC-D12 (stale questions to the orchestration-skeleton plan); recorded the pkm pointer. "anh chưa hiểu" is signal T3: the shaper had written "gộp việc 2 vào tiêu chuẩn" with a task number as the only handle. Tried to record it as a friction; the running release refused `friction record` for this head (`verb-not-granted`), although `src/session-host/head-grants.mjs:29` already lists it in `HEAD_VERBS`, so the activated release lags the source. Answered the owner's question in plain words in chat.

- 2026-11-22 19:45 — After the shaper restated the question as one yes/no with a default, owner: "đúng, đồng ý bỏ. nhưng cũng làm rõ thêm là khi agent nhìn ra mình giao tiếp, hoặc trình bày chưa đạt nó phải tìm cách ghi nhận friction để còn có cơ hội tối ưu". Shaper minted OC-D13 (task 2 dropped) and OC-D14 (recording duty with a fallback, since the activated release refused this head's `friction record` at 19:35); marked the discussion settled with two tasks.

## 6. Thiết kế đã chốt {#design}

The standard **tiêu chuẩn giao tiếp** (communication standard), as it stands. Steps 1 and 2 are settled in substance (OC-D2), their wording is not final; step 3 holds seed cases; step 4 is not started.

### Bước 1 — Vì sao (động lực)

Of everything in the system, the owner's attention is the scarcest and the most expensive. Every message the owner reads costs some of it. An agent holds the full context and the owner does not, so the heavy work (reading, checking, comparing, weighing) is the agent's job, done before it speaks; the owner is left with only the decision. An agent communicates well because it understands this and respects the owner's attention, which is what frees the owner from sitting and waiting (product priority 2). A program check can catch a slip, but if the check becomes the reason, agents learn to write for the check: all five labels present and still hard to read.

### Bước 2 — Thế nào là tốt (chuẩn mực, đo từ phía người đọc)

**The understanding behind it.** The owner is overloaded: too much to think about, too many things at once. Every message competes for attention that is already spent. So the direction of all communication is to make taking in information as easy, as clear and as high in quality as possible.

**Principle.** The agent finishes its own work before it speaks, and what it brings is received with the least effort: clear, complete, accurate, in the owner's words. When a decision is needed, it is enough to decide at once, without asking back and without looking anything up.

**Test before sending.** Read the message as an overloaded person with no context: can that person take it in with one read, and decide if a decision is asked? If the person would ask "what is this?", "why?", "what do you suggest?" or "what happens if I say yes?", the message is not done.

**Three parts of the standard** (draft, round 12). Presenting information is the largest part, and the owner named it as the core (18:05).

**Part A. Conduct: what the agent does before and while it speaks.**

- Reading, checking and drafting are the agent's own work; never ask permission for them. Come with findings and a recommendation; ask only for what is the owner's to decide.
- Weigh everything the owner says, and reflect on your own view too. If the owner is right, agree plainly, with the reason in a line; pushing back for its own sake is as wrong as going along. If you hold a better-grounded view, push back with evidence; then the owner decides (case S3). The purpose is a better result, clearer information, or a lesson learned, never pleasing the owner and never always arguing: helping the owner see a problem early lowers the owner's load, while going along lets it drag on (owner 18:20, 18:29). Once the owner decides, carry it out; reopen only with new evidence.
- When the agent sees its communication fell short, from the owner's reaction or its own reflection, it must find a way to record a friction so the system can improve: `fgos friction record`, or `frictions` in a run's result claim, or, if the door refuses, the same facts in its own working file to record later (OC-D14).
- When the owner's reaction shows the presentation fell short (the signals in step 3: mood change, asking back, not following the recommendation, re-aiming, ...), the agent's job is to notice it and record a friction to learn from. It does **not** jump in to present again: a guessed rewrite is one more message for an overloaded reader and adds confusion. It waits for the owner's next question, which shows exactly where the communication broke, then answers that question, short (owner 18:15).

**Part B. Presenting information (trình bày thông tin), the largest part.**

1. **Outcome first.** The first sentence is the conclusion, or the decision needed.
2. **One item, one point.** Several items are numbered; each holds one fact or one decision.
3. **The owner's words.** The owner's language, plain words, no internal jargon. The first mention of a role, lane, id or term gets one plain phrase; a pointer to a numbered item names the item; an id is only a secondary handle.
4. **Concrete, not abstract.** Numbers with units, before and after, what the owner will see or feel.
5. **Certain, assumed, not checked.** Say which is which.
6. **Shape fits the content.** A table for three or more comparable items, a list for steps, a diagram for structure; never a wall of text.
7. **Shortest complete length.** Do not repeat what the owner already knows; detail goes to a linked file.
8. **A fixed shape per kind of message.**
   - Decision question: the five parts, each answering a question the owner would otherwise ask back (what is happening, cause, options with gain, harm and cost, recommendation, scope of the answer); options lettered, the recommended one first, a stated default.
   - Status or progress report: outcome; what was done, names explained; checked and not checked; the one decision needed, if any; at most 10 lines.
   - Incident report: impact now; what was done to contain it; what is still at risk; the one decision needed.
9. **End with the owner's action.** Exactly what the owner needs to do, or "nothing needed".

**Part C. When and where to speak.**

- Speak when there is a decision or a material change, not to show progress.
- Batch questions so each return of the owner answers as many as possible; questions go through the question store, long detail into a file, the message carries the link.

### Bước 3 — Tình huống (case log)

**How cases are kept (provisional).** Every bad exchange is recorded in the friction store, the same door agents already use for any obstacle: a signature naming the kind of fault, and a detail holding the situation, what the agent wrote, what it cost the owner, the part of the principle it broke and the better version. The trigger is the owner's reaction. Signals (provisional list; the first three from the owner, 17:30, the rest added by the shaper from 2026-11-22):

| # | Signal | What it usually means | Seen 2026-11-22 |
|---|---|---|---|
| T1 | The owner's mood changes: irritation, sharp tone, "!!", "đã nói rồi" | Something already said was ignored, or the message wasted attention | — |
| T2 | The owner does not follow the agent's recommendation | The agent missed context or intent; record it only when the owner's reason shows that, not for an ordinary disagreement | — |
| T3 | The owner asks back: "là gì", "ai", "cái nào", "khoan" | Unexplained name, id or term; the question itself was unclear | "OPC là ai", "khoan giờ câu hỏi là gì" |
| T4 | The owner pulls back or re-aims: "không phải", "cần lưu ý", "em có hiểu ý anh không" | The agent misread the goal and ran ahead | 13:10, 15:44 in this discussion |
| T5 | The owner has to repeat an earlier instruction or decision | The agent forgot or did not carry it | — |
| T6 | The owner answers "cứ làm đi", "ok làm luôn" to a request | The agent asked permission for its own work | the secretary's "do you want me to present it?" |
| T7 | The owner supplies the information or checks it personally (pastes text, opens a file, catches an error first) | The agent did not bring the information ready or overstated what it knew | the seven-gap list pasted at 14:55; `leadLive` caught twice |
| T8 | The owner rewrites or summarises the agent's message ("ý em là...") | The message was too long or too dense | — |
| T9 | The owner asks for simpler words or another language | Wrong level or language | first English question in this discussion |
| T10 | One decision takes more than one round trip | The message was not decidable in one read | the first two owner questions here |
| T11 | The owner ignores a question or answers a different point | The message did not land or did not look like a decision | — |
| T12 | The owner interrupts the agent or rejects a tool call | The agent was doing something the owner did not expect | — |

The agent that receives the owner's message is the one placed to see the signal, so it records the friction, quoting the owner's words and its own message; it never argues with the signal or waits to be sure. It does not rewrite its message on its own; the owner's follow-up question is the evidence of what went wrong, and is quoted in the friction. Some signals (T10, T11, T12) can be counted by a program; that belongs to step 4. `fgos friction rank` shows which faults repeat. The **coach** (a head the supervisor starts at the right moment; defined in its own item) reads them, finds the real cause, and either drafts a line of the standard for the owner to approve in a batch, or hands a well-evidenced problem back to the supervisor, which puts it through the normal pipeline so a fitting team solves it. The standard itself keeps only a few curated examples like the ones below. Seed cases from 2026-11-22:

| # | Situation | What the agent wrote | Cost to the owner | Broke | Better |
|---|---|---|---|---|---|
| C1 | Secretary presenting an owner question | "I have not read it closely, do you want me to present it in the five-part form?" | A turn spent saying "yes, just do it", no information gained | Before you speak | Read it, then present it in five parts with a recommendation |
| C4 | Supervisor line relayed to the owner | "Asked OPC to handle it, passed question 2 to the stability lead" | "Who is OPC?", "which question 2?" | Names and ids | "Asked OPC (the lead running the stability plan) to handle it; passed the question about X to that lead" |
| C5 | Several owner questions | Options unlettered, no default | The owner typed sentences where one letter would do | Decision question | Lettered options, recommended first, "no answer → I take A" |
| S1 | This shaper's first question to the owner | A long English question with ids (`q-…`), file paths and refusal codes | "What is the question?" — a full rewrite was needed | Language and length; names and ids | Short Vietnamese, plain words, no ids unless explained |
| S3 | Owner gave the coach direction | The shaper wrote it down and moved on, with no view of its own | "anh nói gì là em vuốt đuôi đi theo, không hề thảo luận, advise hay debate" | Before you speak: the agent's own analysis is part of its work | Weigh the proposal, say where it agrees and where it does not, with evidence, then let the owner decide |
| S4 | Shaper drafting the reaction-signal rule | "present it again now in a better form" | Owner: unprompted re-presenting confuses more; the follow-up question is what shows the problem | Part A conduct | Notice, record, wait for the owner's question, answer it short |
| S5 | Shaper asking the owner to confirm a change | "xác nhận việc gộp việc 2 vào tiêu chuẩn" | "anh chưa hiểu": a turn spent | Part B, point 3: a task number used as the only handle | Say what changes in plain words: no tool is built here; one rule is added to the standard |
| S2 | This shaper's first rounds | Jumped to hooks, validators and new required fields | The owner had to step back and ask whether the shaper understood the goal | Why before how | State the understanding first, check it with the owner, then the mechanism |

### Bước 4 — Hỗ trợ bằng chương trình

Proposal under discussion. A program helps where people are weakest, and never becomes the reason to communicate well:

1. **Capture the owner's reaction** (recommended first): the owner's incoming message is checked for the T-signals, and a match records a friction candidate with the owner's words and the agent's previous message. It measures from the reader's side and feeds the coach without relying on the agent to report on itself.
2. **Cheap answers in the question door**: options shown lettered A-D, and a stated default.
3. **No check on the agent's outgoing message for now**: it invites writing for the check; the coach can propose it later if the data shows a need.

```mermaid
flowchart TD
  W[1. Vì sao: sự chú ý của người là đắt nhất] --> P[2. Nguyên tắc: làm xong phần mình, đưa đủ để quyết ngay]
  P --> A[Ứng dụng: trước khi nói, tên và id, ngôn ngữ, câu hỏi quyết định, báo cáo]
  A --> C[3. Tình huống thật: tốt và xấu]
  F[Friction store: mỗi lần người phải hỏi lại, sửa, viết lại] --> C
  C -->|friction rank| K[Coach: supervisor bật đúng lúc]
  K -->|đề xuất quy tắc, người duyệt| P
  A -.-> M[4. Chương trình: lưới an toàn cuối]
```

## 7. Danh mục hạng mục / task {#tasks}

Two tasks for one planner (task 2 dropped, OC-D13). Task 1 lands first; task 3 follows it.

### Task 1 — Write the standard and move every caller {#task-standard}

- **Goal:** the communication standard exists as one shared fragment and one always-loaded instruction (suggested names `core/skills/_shared/owner-communication.md` and `core/instructions/owner-communication.md`), replacing both decision-question files; the friction store can hold owner-communication cases.
- **§6 excerpt:** steps 1-3 (motive, principle and test, applications, curated cases, how cases are kept and the T-signals).
- **D-IDs:** OC-D2, OC-D3, OC-D4, OC-D6.
- **Includes:** every caller of the old paths moved (about 20 source files: core and coding-domain skills, platform docs, reading map; code and test refs in `src/state/decision-question.mjs`, `src/state/status-fsm.mjs`, `test/docs/rul11-anchor-phrase.test.mjs`, `test/state/awaiting.test.mjs`); the "at most 10 lines" report lines in `fgos-lead`, `fgos-secretary`, `fgos-supervisor` replaced by a pointer; a friction layer value for owner communication in `packages/observe/rust/friction-kinds.json`; the owner-signal trigger and the recording duty with its fallback (OC-D14) in `core/skills/_shared/friction-capture.md`; generated copies rebuilt.
- **Siblings:** tasks 2 and 3 depend on it (the layer value, and the text they point to).
- **Draft verify:** `git grep -n -e "_shared/decision-question" -e "instructions/decision-question" -- ':!plans' ':!CHANGELOG.md'` prints nothing; `npm run build:skills` leaves no diff; `npm test` green.

### Task 2 — dropped {#task-reaction-capture}

OC-D13: no automatic capture hook in this work; the rule for agents lands with task 1, the automatic capture idea goes to the coach discussion.

### Task 3 — Cheap answers in the question door {#task-cheap-answers}

- **Goal:** every owner question shows its options lettered A-D with the recommended one marked, and states what the asker does, and when, if no answer comes.
- **§6 excerpt:** step 2, "Decision question" application; step 4 level 2.
- **D-IDs:** OC-D7.
- **Includes:** a required default field in `packages/questions/contracts/questions-input.v1.json` and its check; lettered options in `fgos questions` output and wherever the secretary shows questions; the skills that ask questions updated to fill the field.
- **Siblings:** after task 1, so the standard's text and the door agree.
- **Draft verify:** `fgos questions ask` without the default field is refused `question-unclear` naming it; `fgos questions` shows "A." to "D."; `cargo test --workspace` and `npm test` green.
