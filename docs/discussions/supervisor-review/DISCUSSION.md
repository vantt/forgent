# Discussion: supervisor orchestration review

discussion: settled

## Hand-off

**Outcome.** A written review of the supervisor orchestration ([advice.md](advice.md)), and five decisions (SR-D1..SR-D5)
that set the direction for the follow-up work in §7. Each follow-up becomes its own backlog row (through Miu) and its
own plan (through a planner). Plan 261118-1045 is not changed: the follow-ups start after it lands.

**Constraints.** Laws L9 and L10 (one door; the old path is removed in the same change), RUL104 ("better, not
bigger"), new code in Rust, design principle 8 (one proof per behaviour), the AGENTS.md install/setup/doctor gate for
any new config key.

**Non-goals.** Cross-machine supervision of one project. Windows timers. Confined gates (already backlog `p-nqftk5hypy`).
The idle-mode detection delay (already backlog `p-xpeg4jshiu`).

**Acceptance criteria (for the follow-up plans, one per §7 task):**
1. Admission and lead start are code. The supervisor LLM wakes only for judgement.
2. Every head's start ritual is proven in a sandbox before its first turn.
3. Every branch, plan or not, reaches main only through one merge queue, with an independent review verdict bound to
   the head SHA.
4. Every refused merge has a named owner on the L0-L3 ladder, and no item sits unowned.
5. Every plan has an integration phase. New capability stays dormant behind a temporary switch until that phase, which
   switches it on, removes the switch and removes the old path in the same change.

**Open points that block only parts:** the values of N and X; the session L2 starts to fix code for a submitter that
cannot write code; whether grant-only `--paths` lands skip review; stacked submission of a dependent phase; reviewer
independence with only one provider. The planner of each task decides these.

Sources: §3 (V/I marks), [external-research.md](external-research.md).


Backlog: `p-dkiyey4ttl` (docs/backlog.md). Plan under review: `plans/261118-1045-project-supervisor`, live run
`plans/261119-1142-supervisor-live-run`. Area: `docs/platform/supervision/spec.md`. External sources with
VERIFIED/INFERENCE marks: [external-research.md](external-research.md) (round 0, 2026-11-19).

## 1. Trạng thái hiện tại

Round 10 (2026-11-19, reopened on `shape/supervisor-review-2`). Round 8 adopted the standard vocabulary (§3 T-VOCAB).
Round 9: owner chose A for the text switch (G8, provisional, feeds T5). Round 10: owner chose A on Q5 (G9): integration
has three layers (domain-free supervision with an integrate port, domain doctrine where agents decide, the domain door
in code); §6 and T3/T5 regenerated. SR-D2/SR-D3 get superseded once G8/G9 hold another round.
Round 11: issue 2 (queue throughput) is absorbed by G9 (review runs before submit; only path-scoped gates stay serial);
issue 4 becomes its own backlog row (G10). Next: confirm G8/G9, mint, send the T0-T5 and G10 rows to Miu, settle.

Round 7 (2026-11-19), settled. The owner agreed to Q4: the cycle in §6, the L0-L3 ladder, and per-phase merging under
three rules. In the owner's words: "a plan always has an integration step, with a temporary off switch that is removed
only at the last step". SR-D1..SR-D5 are minted in §4 (local ids, following the secretary-miu `SM-D*` precedent). The
written review is [advice.md](advice.md), and the follow-ups are in §7. This branch (`shape/supervisor-review`) itself
has no merger yet (M2); Miu is asked to land it.

## 2. Mục tiêu & đề bài

The owner asked whether fgOS's supervisor orchestration is sound, and what it should do differently from other
systems. The design: a no-LLM watcher on an OS timer records events and wakes one stateless LLM supervisor per project.
The supervisor drains the queue, admits `ready` plans within `supervisor.maxLeads` and the machine lane pool, starts one
confined lead per plan, restarts, parks or asks about a gone lead, closes done plans, starts the planner of a settled
discussion and resumes askers of answered owner questions. Leads land through one door, `fgos land`, bounded by the
plan footprint. Two live-run windows stopped before any lead started:
- window 1: the confined supervisor could not read its queue and plans;
- window 2: a held plan was still `ready`, and the start ritual hit failing commands.

The output of this discussion is written advice. It covers strengths, differences from other orchestrators, gaps with
evidence and source, and failure modes others hit, each claim marked verified or inference. Each follow-up becomes its
own backlog row. Code and the plan are not changed here.

## 3. Vấn đề rõ / chưa rõ

Sources: [ER] = external-research.md, the URL inside. [INT] = the tree at e0615cb82. V = verified (read in the
source). I = inference (my reasoning).

| # | Điểm | Trạng thái | Bằng chứng |
|---|------|------------|------------|
| S1 | State lives outside the LLM (git plan frontmatter, phase tables, Event Store queue). The supervisor is a stateless wake. This matches the Anthropic long-running harness (progress file, git and a feature list, with each fresh session re-reading them). | clear | V: `core/skills/fgos-supervisor/SKILL.md:13`; anthropic.com/engineering/effective-harnesses-for-long-running-agents [ER] |
| S2 | Worktree per worker, a lane cap, a footprint per plan (one file owner) and one merge door where workers never write main. This matches Gas Town (Refinery merge queue), claude-squad and the Claude Code agent-teams guidance (3-5 workers, one file owner each). | clear | V: spec §1, §5; github.com/steveyegge/gastown, code.claude.com/docs/en/agent-teams [ER] |
| S3 | Events are recorded once by a stable id with a `handled` flag, and `supervisor done` refuses while events are unhandled. This is the reconcile/at-least-once shape of Kubernetes controllers. | clear | V: spec PS-9, PS-21; kubernetes.io/docs/concepts/architecture/controller [ER] |
| S4 | Batched owner questions in five-part form through one front session (the secretary). The front door is common (agent-teams lead, Gas Town Mayor). The research found no published system that batches human questions across agents, so this looks ahead of common practice. | clear (the "ahead" part is I) | V: front door [ER]; I: batching uncommon |
| S5 | Per-persona confinement of every head, including the supervisor. Agent teams inherits the lead's permission mode downward, with no per-teammate mode. fgOS is stricter. | clear | V: agent-teams [ER]; `src/session-host/head-grants.mjs:56-62` |
| D1 | The decisions sit in the LLM. Kubernetes and Erlang/OTP put reconcile and restart decisions in deterministic code, and Gas Town keeps its daemon and Boot triage partly deterministic under LLM roles. In fgOS the watcher "decides, starts and stops nothing", and every admit, start, restart and close is an LLM turn. | clear (the fact). Its cost is Q1 | V: spec:38; [ER] §4 |
| G1 | (owner Q1 = A, provisional) Admission is mechanical: `ready`, all `blockedBy` done, `leadsLive < maxLeads`, `lanes.free > 0`, and no live role holding the head name. Both live windows failed on that ritual, not on judgement. Window 1 failed on reading the queue and plans; window 2 failed on the start-ritual commands and an admissible plan that was already held. Moving admit-and-start (and maybe restart of a gone lead, under a cap) into the watcher or the wake door would leave the LLM only judgement: park or ask, a stuck lead, close review. | owner: A + G2 preflight (round 2) | V: `fgos-supervisor/SKILL.md:25-36`; `reports/integration.md` windows 1-2. I: the move removes the failure class |
| G2 | No session-start preflight. Nothing proves, before the supervisor's first turn, that it can run its ritual under its grant (read the queue, plans and slots, start a session). The harness post does this with `init.sh` and a smoke check on every start. Window 2 already planned "a sandbox reproduction of the start ritual … as the owning proof". | owner: yes, for the LLM part that remains (round 2) | V: integration.md window 2; [ER] harness |
| G3 | No restart intensity cap. A gone lead is restarted with no "N restarts in T, then park and ask" limit. Wake has `backoff` for failed starts, but lead restarts have nothing like it. OTP supervisors have intensity limits (I, not read). Multi-agent token cost is about 15x chat (V). | open | V: `fgos-supervisor/SKILL.md:40-44` (no cap); phase-12 wake backoff; anthropic multi-agent-research-system [ER] |
| G4 | "Done" is the lead's say-so at plan level. Every phase lands through `land.gates`, so per-phase proof exists. Nothing checks plan-level acceptance before close, though agent-teams and the harness post both report early "done" claims. | open (size unclear) | V: `fgos-lead/SKILL.md:37-38`; [ER] §2 |
| G5 | "Held" is a convention. A plan run outside a head stays admissible unless hand-set `running` (window 2). The admit, mark `running`, start-lead order leaves a gap if the session crashes between the steps. | open | V: integration.md window 2; `fgos-supervisor/SKILL.md:33-34` |
| G6 | Detection latency up to 15 min in idle mode (measured about 14 min in window 1). Already backlog `p-xpeg4jshiu`. | known | V: integration.md window 1 |
| G7 | Enabling the watcher (`doctor --fix`) ran a tick that woke the supervisor as a side effect (window 2), so turning supervision on is also a start. | open | V: integration.md window 2 |
| F1 | `fgos-lead/SKILL.md:51` says "rebase onto the trunk tip" for `land-conflict-aborted`, but PS-3 says land merges and never rebases, and Git has no rebase port. | inconsistency | V |
| F2 | `core/agents/supervisor.yaml:3-4` still describes "runs one ready plan to done" (the old per-plan role), not the project-wide queue drain. | inconsistency | V |
| F3 | The spec header still says "Spec only. No crate, verb … exists yet", and the plan frontmatter is `draft` while phases 1-18 are done. | inconsistency | V: spec:8; plan.md:5 |
| M1 | On paper the merge authority is the lead. `fgos land <branch>` is lead-only (`land-branch-lead-only`), and every other head lands `--paths` inside its grant writes. The supervisor never merges code. | clear | V: spec §4, PS-14; `src/session-host/head-grants.mjs:49-62` |
| M2 | A branch that belongs to no plan has nobody who may merge it: a shaper worktree branch (this discussion, commit 726b68d39), a fix branch, an ad-hoc `fgos run` result. No lead exists for it, and every other persona has `--paths` only. | owner Q2 = A (queue, round 3); runner open: Q3 | V: grants table; this branch |
| M3 | The lead approves itself. It reviews its own unit's diff with a `code-reviewer` subagent and lands. Independent review lives only in lane convention (the Git reviewer lead:OPC as "Merge gate" in phase 7a), not in the model. Gas Town gives merging to a dedicated role (Refinery). | owner Q2 = A (independent review verdict, round 3) | V: `fgos-lead/SKILL.md:31-35`; phase-07a:6-7; gastown [ER] |
| M4 | The model's merge path has never run live. Every merge on main since 11-18 is a hand-run lane `land <branch>` (land-branch.sh). The script's removal (step 6) waits until every running lead lands with `fgos land`. Nobody arbitrates a refused land across plans (conflict, red gate, `land-recovery-required`): the lead parks or asks the owner. | clear | V: `git log origin/main --since=2026-11-18`; integration.md:49; `fgos-lead/SKILL.md:47-53` |
| M5 | Responsibility ladder for a failed merge (draft). The refusal codes are the ones `packages/supervision/rust/src` emits today.<br>**L0 code heals itself:** `land-target-changed`, `land-retries-exhausted` and `land-remote-diverged` (re-fetch and retry), regeneration of a generated-file conflict, and `land-recovery-required` / `land-remote-outcome-unknown` (run `fgos git recover`, then retry once).<br>**L1 submitter fixes its own branch:** `land-conflict-aborted` (merge the trunk into the branch, never rebase), `land-gate-failed`, a rejected review verdict, `land-outside-footprint` / `footprint-change-refused`, `land-regenerate-failed`. Capped at N attempts.<br>**L2 supervisor (queue owner):** the cap is exceeded; the submitter is gone, or is a persona that cannot fix code (shaper, secretary); two branches conflict across plans; the trunk itself fails the gate (not the author's fault: freeze the queue and open a fix item); an item has sat unhandled for X ticks.<br>**L3 owner, only through a supervisor question:** project config (`land-gate-missing`, `land-target-unknown`), widening a footprint, a recover that fails, a trunk that stays red. | **open: Q4** | V: refusal codes (grep of `packages/supervision/rust/src`); `fgos-lead/SKILL.md:45-53` (today every refusal goes to the lead or the owner, with no L0 and no L2). I: the ladder |
| M6 | Merge per phase or per plan. Per-phase merging is trunk-based development: small batches, branches that live short, and a main that stays green at every commit. Merging the plan at the end is a long-lived feature branch: main receives only finished work, at the cost of a large diff (review is weaker), conflicts with up to `maxLeads` = 4 parallel plans, and late integration. The owner's goal (main stays tidy) is right. Per phase has one real risk: a half-finished capability, or an old path left beside the new one, sits on main (L10). Live example: plan 1045 landed phases 1-18, yet `land-branch.sh` still lives beside `fgos land` (step 6 pending). Proposed middle: keep per-phase merging, and add three rules. (1) Each phase leaves main green and coherent. (2) The new capability stays dormant (not wired or enabled) until the plan's integration phase, which switches it on and removes the old path in the same change. (3) A withdrawn or parked plan does not close until its dormant code is finished or removed. | **open: Q4** | V: L9 (run ≠ merge ≠ durable, `platform-foundations.md:308`), L10; spec `config.maxLeads` 4; plan.md:120 and integration.md step 6. V (round 8): trunk-based development definition (trunkbaseddevelopment.com); I: the DORA/Accelerate finding that short-lived branches correlate with delivery performance. Terms: row T-VOCAB |
| G8 | (owner: A, round 9, provisional) SR-D5's switch for text. Prose (skills, specs, AGENTS.md) takes effect when it lands, so it has no switch: text that describes new behaviour lands in the same phase that switches the behaviour on (the integration phase). Prior art: the Git lane built native ports unwired and switched callers and `docs/platform/git/spec.md` in one commit, 82ca7102a. The plan declares `toggles:` and `retires:` in its frontmatter; each toggle carries a marker naming the plan; the close check (§6 step 9) runs `rg` and raises `plan-close-blocked` while a marker or a retired path remains; `plan-contract-check` requires the integration phase to state what it switches on and what it removes ("none" allowed). The agent decides where; code checks that it kept its word. | owner: A (round 9) | V: 82ca7102a; L10 prose did not stop `land-branch.sh` staying beside `fgos land` (integration.md step 6). I: Fowler's toggle "time bombs" (not fetched) |
| G9 | Merge is coding-domain mechanics inside the domain-free supervision layer. `packages/supervision/rust/src/land.rs` imports `fgos_git` and merges, gates and pushes; SR-D3 puts "code runs each merge" in the watcher tick. Plans and the portfolio are domain-free (domains/coding, domains/marketing, domains/council exist), and a marketing plan has no branch to merge. Owner (round 9): orchestration follows the portfolio and the plan, is domain-agnostic, and detailed work such as merging should be handled intelligently, not hard-coded. | owner: A (round 10, provisional): three layers, §6 | V: land.rs:1-12; `ls domains`; spec header "Canonical for … the landing use case". Owner round 9 |
| G10 | Implicit decisions between parallel agents (Cognition; advice.md "not addressed"), and its most visible case: a second door appears again and again and is cleaned up again and again. Only Git has a mechanical one-door guard (`scripts/git-one-door-scan.mjs`, `scripts/lib/git-one-door-declarations.v1.json`, `test/git/one-door.test.mjs`), and it catches the site at land time, after the work is done; the land gates gained the one-door scan today after S6A p05 landed an undeclared site (commit 19b10a0da). Since 2026-11-01, 132 commits mention the census and 37 mention one-door. I: the planner and the lead are not told which doors exist, so each plan decides its own way; prevention would sit at planning, detection at land. | owner: (a) separate backlog row, round 11 | V: the files named; `git log --since=2026-11-01 -i --grep=census` (132) and `--grep=one.door` (37); `.fgos/config.yaml` land.gates @fgos:why. Owner round 11 |
| G11 | Does a branch keep syncing with main (rebase or merge) while it is reviewed? No. (1) Rebase is out: PS-3, Git has no rebase port, and a rebase rewrites the SHA that units, worktrees and the verdict refer to. (2) A standing merge of main is not needed for correctness: the land door already builds the candidate as trunk tip + branch and runs the gates on that candidate (the merge queue's "test what will become main"). (3) Each sync costs a unit and, with a SHA-bound verdict, a new review. The branch syncs once, by merging main in, only when: the land refuses with a conflict (L1); the phase needs something landed after its base; or the reviewer finds a semantic clash with what main gained. The reviewer reads the author diff (`trunk...branch`) and is also given what main gained since the branch base in the paths next to the diff, so a semantic clash that gates miss is still seen. Phases are short (one to two days, plan contract), so drift stays small. | answered round 12 (agent decision, owner may revise) | V: spec PS-3 (`supervision/spec.md:142`); plan-contract.md "Size"; §6 step 4. I: semantic-clash risk |
| T-VOCAB | Vocabulary for SR-D2..SR-D5, adopted by the owner (round 8) for use in plans and specs. **Trunk-based development** (merge per phase, short branches, one trunk). **Merge queue** (SR-D2/D3: code tests trunk + branch before it becomes trunk; the "Not Rocket Science Rule"). **Release toggle** (SR-D5's temporary off switch; Fowler: transitional, "should generally not stick around much longer than a week or two"). **Dark launch** (code on main but not switched on). **Parallel change / expand–migrate–contract** (SR-D5's integration phase: add the new path, move callers, remove the old path and the toggle); **branch by abstraction** when the replaced thing is a live mechanism. **Stale review dismissal** (SR-D2: a verdict bound to the SHA). **Escalation ladder** (SR-D4 L0-L3). **Restart intensity** (SR-D4 restart cap, OTP). | clear | V (fetched round 8): trunkbaseddevelopment.com ("a single branch called 'trunk'"); martinfowler.com/articles/feature-toggles.html (Release Toggles); martinfowler.com/bliki/ParallelChange.html ("also known as expand and contract"); docs.github.com managing-a-merge-queue ("ensuring the branch is never broken"; PRs grouped into a `merge_group` with the PRs ahead). I: Not Rocket Science Rule (graydon2.dreamwidth.org/1597.html returned 403), Fowler BranchByAbstraction, GitHub stale review dismissal, OTP restart intensity (not fetched) |
| F4 | `event-store-end-trigger` faults are logged for verbs that succeed, which misled the window-1 diagnosis. | finding already in the tree | V: integration.md correction |

Not covered by the research (limits, [ER]): Temporal, OpenHands, Devin, AutoGen/Magentic-One, CrewAI, LangGraph
supervisor and the OTP restart-strategy docs were not read. No public postmortem of a sandboxed supervisor exists to
compare against.

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày | Nguồn |
|------|------------|------|-------|
| SR-D1 | Admission (`ready`, `blockedBy` done, `leadsLive < maxLeads`, a free lane, the head name unheld), marking the plan `running` and starting the lead are deterministic code in the wake door. The supervisor LLM wakes only for judgement: a gone or stuck lead, close review, the planner, owner answers. Every head proves its start ritual in a sandbox (preflight) before its first turn. | 2026-11-19 | Q1 = A (round 1), held through rounds 2-7; G1, G2, G5 |
| SR-D2 | Merge is a deterministic queue, not a role's privilege. Any head submits a branch. Code merges it only with an independent review verdict (a reviewer other than the author unit, bound to the head SHA), green gates, and a diff inside the plan footprint or the submitter's grant. | 2026-11-19 | Q2 = A (round 2), held through round 7; M1-M3 |
| SR-D3 | Code runs each merge (the watcher tick or the door, through `fgos land`). The supervisor owns the queue and arbitrates it: cross-plan conflicts, priority, orphan branches, a red trunk. | 2026-11-19 | Q3 = (a) (round 3), held through round 7 |
| SR-D4 | A refused merge follows the ladder: L0 code heals itself (retry, regenerate, `git recover`); L1 the submitter fixes its own branch, N attempts, merging the trunk in and never rebasing; L2 the supervisor (cap exceeded, submitter gone or unable to fix code, cross-plan conflict, a red trunk freezes the queue, an item stuck X ticks); L3 the owner, only through a supervisor question. A gone lead's restarts are capped the same way. | 2026-11-19 | M5 (round 4), Q4 (round 7); G3 |
| SR-D5 | Merge per phase. Every plan has an integration phase. New capability stays dormant behind a temporary off switch (or simply not wired) until that phase, which switches it on, removes the switch and removes the old path in the same change (L10). A plan closes only after a code close check (phases done, queue empty, branches in the trunk, plan verify green) and a supervisor acceptance review. A withdrawn or parked plan closes only once its dormant code is finished or removed. | 2026-11-19 | M6 (round 6), Q4 owner restatement (round 7); G4 |

## 5. Q&A log

- 2026-11-19 round 0: scouted the internal design (spec, plan, reports, skills) and external sources
  (external-research.md). No owner input yet.
- 2026-11-19 round 1, Q1 (admit and start out of the LLM?). Owner: "A, kèm preflight cho phần LLM còn lại. Với ai được
  phép merge. Cảm giác mô hình hiện tại không ai merge." Recorded as provisional on G1 and G2. The merge point was
  scouted as M1-M4, and Q2 was asked.
- 2026-11-19 round 2, Q2 (who may merge?). Owner: "đồng ý A, nhưng sẽ do supervisor thực hiện việc merge queue?"
  Q2 = A was recorded as provisional. Q3 was asked: the code runs each merge, and the supervisor owns the queue and
  arbitrates it.
- 2026-11-19 round 3, Q3 (does the supervisor run the queue?). Owner: "đồng ý a, nhưng merge fail thì sao, ai chịu
  trách nhiệm giải quyết". Q3 = (a) was recorded as provisional. The M5 ladder was drafted from the refusal codes, and Q4
  was asked.
- 2026-11-19 round 4. Owner: "vậy hãy mô tả lại rõ chi tiết chu trình khi lead dẫn dắt 1 plan sắp xong, tiến trình để
  merge như thế nào". §6 was drafted with the cycle (steps 1-10, a sequence diagram and the open points). Q4 now covers
  the ladder and the cycle.
- 2026-11-19 round 5. Owner: "merge từng phase có làm main bị không chỉnh chu (vì một plan theo lý thuyết phải xong
  hết thì vào main mới tốt) hay là cách nghĩ và cách làm của anh sai". Analysed as M6 (per phase, with a dormant
  capability and the switch-on happening in the integration phase).
- 2026-11-19 round 6, Q4. Owner: "ok, đồng ý, tức là plan luôn có bước tích hợp và có khóa tạm tắt cho tới bước cuối
  cùng mới gỡ bỏ." SR-D1..SR-D5 were minted, §6 was marked settled, §7 was filled, and the discussion was settled.

- 2026-11-19 round 8 (reopened, branch `shape/supervisor-review-2`). Owner: "anh muốn hỏi thuật ngữ chuyên môn cho cách
  tiếp cận merge em đề cập khi nãy là gì", then "ok, ghi nhận thuật ngữ để dùng". Recorded as §3 T-VOCAB; four of the
  sources were fetched and marked V. No decision changed.

- 2026-11-19 round 9. On issue 3 (switch for text), owner: "thực ra thì chổ này không thể có một cơ chế công tắc nào
  làm được, chỉ phụ thuộc sự thông minh của agent thôi … tại phase cuối cùng nó phải tự remove toggle kèm remove code
  cũ". Answered with declared toggles/retires checked at close; owner: "chọn A" (G8, provisional). Owner then: "việc
  điều phối là theo portfolio và plan là chủ đạo và cũng là domain agnostic. nên công việc chi tiết như merge cũng nên
  được handle thông minh chứ không phải hard code". Scouted as G9; Q5 asked. This reopens SR-D2/SR-D3.

- 2026-11-19 round 10, Q5 (three layers for integration). Owner: "A". G9 recorded as provisional; §6 regenerated with
  the integrate port, review before submit, no merge loop in the watcher; T3 and T5 rewritten.

- 2026-11-19 round 11, issue 4 (implicit decisions). Owner: "(a). Cùng một vấn đề là chúng ta muốn một cửa nhưng mãi
  vẫn phát sinh hoài và phải dọn hoài." Recorded as G10, a separate backlog row; scouted the one-door guard and its
  cleanup churn.

- 2026-11-19 round 12. Owner: "cho hỏi chô không còn nghẽn chổ merge, là do đổi như thế nào": answered (review moved
  out of the serial section; only the merge slot section stays serial, as today; new open point on verdict binding).
  Owner: "nhánh có nên liên tiếp rebase với main khi tiến hành review?": answered no, recorded as G11 and §6 step 6.

## 6. Thiết kế đã chốt {#design}

**Settled: SR-D1, SR-D4, SR-D5. Provisional (round 9, owner A, awaiting a second round): G8 (switch for text) and G9
(three layers for integration), which revise SR-D2/SR-D3.** Verb names marked *(new)* are placeholders for the plan to
name. Today's verbs are `fgos land`, `fgos run` and `fgos request result`.

### Three layers of integration (G9)

| Layer | Holds | Decides | Runs |
|---|---|---|---|
| Supervision (domain-free) | plan, phase, "a result to integrate", outcome events, the L0-L3 ladder, unowned-item detection | agents (lead, supervisor) | code keeps the state and raises events |
| Domain doctrine (`domains/<d>/AGENTS.md` + the domain's skills) | what integration means in the domain: for coding, review → merge → gates; for another domain, e.g. approve → publish | the agent reads it and decides when to submit, whether and by whom to review, how to fix a conflict, the order between plans, when to escalate | — |
| Domain door (coding: `fgos land`, Git ports) | the merge slot, the candidate, gates, push, publish, L0 self-heal | nothing beyond its refusals | code, because it must be exact |

Supervision talks to the domain door through one port, "integrate this result" *(new)*. `land.rs` moves out of the
supervision crate into the coding side behind that port (design principle 3). There is no merge loop in the watcher:
ordering comes from the agents, and the target's merge slot already keeps one merge at a time.

### Cycle of one coding phase, from unit done to landed

1. **Unit done.** The lead's `fgos run --writes <footprint paths> --worktree <wt>` finishes on branch `<plan>/pNN`.
   The lead reads `fgos request result`. A failed or blocked unit is handled by the lead, as today.
2. **Independent review (agent decision, per coding doctrine).** The lead has the diff `git diff <trunk>...<branch>`
   reviewed against the phase file by a reviewer other than the author unit (another executor where one is available).
   The verdict is bound to the head SHA; a new push needs a new verdict. Review runs in parallel with other phases, before
   the branch reaches the merge slot.
3. **Submit.** The lead calls the integrate port with the branch and its verdict. The coding adapter refuses a branch with
   no verdict for its exact SHA, a diff outside the plan footprint or the submitter's grant, and red gates.
4. **Land** (the `fgos land` door, unchanged inside): fetch; prepare the candidate (trunk tip + branch) under the rank-20
   merge slot; footprint check; regenerate generated files; `land.gates` plus the phase's tests; push; fast-forward
   local main. L0 failures (remote moved, generated-file conflict, crash needing recover) heal here.
5. **Outcome event.** `integrated` (trunk SHA) or `integration-refused` (code and ladder level). A busy lead sees it in
   its own result; an idle or gone lead is resumed by the supervisor, as an answered question resumes its asker.
6. **Lead records it.** On success the lead sets the phase `done` (a `--paths` land of its plan dir). On an L1 refusal
   it fixes the branch through another unit (for a conflict, merge the trunk into the branch, never rebase) and submits
   again, at most N attempts; then the item rises to L2.
   The branch never rebases and does not sync with main on a schedule; it merges main in only on a conflict, a needed
   newer trunk, or a semantic clash the reviewer found (G11).
7. **Branches with no plan** (a shaper branch, a fix branch, an ad-hoc `fgos run` result) are raised as events; the
   supervisor takes them through steps 2-6 itself.

### End of the plan

8. **Integration phase.** It switches on what the plan kept dormant, lands the text that describes the new behaviour in
   the same phase, removes every declared toggle and every retired path (G8).
9. **Last phase landed.** The lead sets the plan `done` and stops starting work. It never stops its own session.
10. **Close check, code first.** The flip to `done` raises `plan-done`. Before any LLM turn, code checks:
    - every phase row is `done` or parked with a reason;
    - no integration of this plan is pending;
    - for coding, every phase branch is an ancestor of the trunk (a domain check through the port);
    - the plan's verify command, if it has one, passes on the trunk tip;
    - no marker of a toggle the plan declared in `toggles:` remains, and no path in `retires:` still exists (`rg`).

    A failed check raises `plan-close-blocked`, which goes to L2.
11. **Supervisor close (judgement).** Reads the acceptance criteria against the evidence; writes one board line and a
    backlog update; stops the lead (`fgos session stop lead`); has the plan's worktrees removed and lanes released. If
    the evidence falls short, it reopens a phase or asks the owner (L3).

### Who resolves a failure (SR-D4 ladder, now domain policy)

L0 the domain door → L1 submitter (N attempts) → L2 supervisor (cap exceeded, submitter gone or unable to fix code,
cross-plan conflict, red trunk freezes integration, item stuck X ticks) → L3 owner, only through a supervisor question.
The levels are domain-free; which refusal falls on which level is written in the domain doctrine.

```mermaid
sequenceDiagram
  participant L as Lead (agent)
  participant R as Review unit
  participant P as Integrate port (supervision)
  participant D as Coding door: fgos land
  participant S as Supervisor (agent)
  L->>R: review diff @SHA (coding doctrine)
  R-->>L: verdict
  L->>P: integrate(branch, verdict)
  P->>D: land (merge slot, gates, push, publish; L0 heals inside)
  D-->>P: landed / refused (level)
  P-->>L: integrated or integration-refused L1
  P-->>S: L2 events only (cap, gone, cross-plan, red trunk, stuck, orphan branch)
  L->>L: phase done; integration phase removes toggles and old paths; plan done
  P->>P: plan-done close check (code)
  P-->>S: plan-done / plan-close-blocked
  S->>S: acceptance review, board + backlog, stop lead, clean worktrees
```

Open:
- whether grant-only `--paths` lands skip the review verdict;
- what session L2 starts to fix a branch whose submitter cannot fix code;
- the values of N and X;
- whether the lead may submit a dependent phase stacked on an unlanded one, or must wait;
- reviewer independence when only one provider is available;
- the integrate port's contract, and where the coding adapter lives (Git crate or a coding crate).
- what the verdict binds to: the branch head SHA forces a new review after every clean trunk merge into the branch;
  binding to the author's own diff (e.g. `git patch-id` of `trunk...branch` minus trunk merges) would keep a verdict
  across clean trunk merges, but a conflict resolution still needs a new review;
- throughput: only the merge slot section (fetch, candidate, path-scoped gates, push) stays serial, as today; batching
  in the GitHub `merge_group` style waits for a measured queue.

## 7. Danh mục hạng mục / task {#tasks}

Order: T0 can go at any time. T1 and T2 come after plan 261118-1045 lands, since they change what its live run proves.
T3 and T4 go together or in that order. T5 is independent.

### T0 Small corrections {#task-small-fixes}
- Goal: fix F1-F4 and G7.
  - F1: the lead skill `land-conflict-aborted` row says rebase; change it to merge the trunk into the branch.
  - F2: `core/agents/supervisor.yaml` still describes the per-plan role.
  - F3: the spec header and the plan status are stale.
  - F4: an `event-store-end-trigger` fault is logged when the verb succeeds.
  - G7: enabling the watcher must not wake the supervisor.
- D-IDs: none (corrections). Verify: `npm test` for the touched skills (render check), plus the owning test for F4 and G7.

### T1 Admission in code {#task-admission-in-code}
- Goal: the wake door admits, marks `running` and starts leads. The supervisor skill keeps only judgement.
- §6 excerpt: wake to admission. D-IDs: SR-D1. Sibling: T2.
- Verify: `cargo test -p fgos-supervision` (one owning test per admission rule); a live window confirms.

### T2 Head start preflight {#task-head-preflight}
- Goal: every head's start ritual and skill commands are proven in a sandbox before its first turn. A failing proof
  refuses the start with a named cause. This is window 2's planned owning proof, made general.
- D-IDs: SR-D1. Verify: a sandbox test per persona (supervisor and lead first).

### T3 Integrate port and independent review {#task-merge-queue}
- Goal: supervision gets a domain-free "integrate a result" port; `land.rs` moves to the coding side behind it. The
  coding doctrine and the lead skill carry the review-before-submit rule; the adapter refuses a branch without a verdict
  bound to its SHA. Branches with no plan reach the supervisor as events. `land-branch.sh` is retired in the same change
  (L10).
- §6 layers table and steps 2-7. D-IDs: SR-D2, SR-D3 (as revised by G9 once minted). Sibling: T4.
- Verify: `cargo test` of the adapter (refusal without a verdict, verdict bound to SHA, footprint); the architecture test
  proves the supervision crate no longer imports `fgos_git`; a live integration of a shaper branch.

### T4 Failure ladder and caps {#task-failure-ladder}
- Goal: L0 self-heal (auto `git recover`), the L1 attempt cap N, L2 events (cap, gone, cross-plan, red trunk freezes the
  queue, stuck X), L3 only through supervisor questions; the same cap for lead restarts.
- D-IDs: SR-D4. Open: N, X, the L2 fixer session.
- Verify: one owning test per ladder transition.

### T5 Integration phase, declared toggles and retirements {#task-integration-phase}
- Goal: `core/skills/_shared/plan-contract.md` requires an integration phase that states what it switches on and what it
  removes ("none" allowed), and frontmatter `toggles:` / `retires:`; `plan-contract-check` checks both. Text describing
  new behaviour lands in the integration phase. The close check refuses a plan while a declared toggle marker or a
  retired path remains.
- §6 steps 8-10. D-IDs: SR-D5 (with G8 once minted).
- Verify: `plan-contract-check` tests, plus a close-check test.

## Q1 {#Q1}

Answered in the tab (A + preflight, SR-D1); never entered the store, so nothing to ack. Originally asked in the owner's tab on 2026-11-19. The question store refused `discussion:supervisor-review#Q1` as
`ref-invalid`, because this file is not on main yet. The input is in `.fgos/runtime/tmp/q1-supervisor-review.json`;
re-ask it once the discussion lands. The question: should admit and start move from the LLM supervisor to the wake door
(A, recommended), stay with a preflight added (B), or move to a watcher with no LLM at all (C)?
