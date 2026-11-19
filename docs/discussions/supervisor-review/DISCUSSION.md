# Discussion: supervisor orchestration review

discussion: open

Backlog: `p-dkiyey4ttl` (docs/backlog.md). Plan under review: `plans/261118-1045-project-supervisor`, live run
`plans/261119-1142-supervisor-live-run`. Area: `docs/platform/supervision/spec.md`. External sources with
VERIFIED/INFERENCE marks: [external-research.md](external-research.md) (round 0, 2026-11-19).

## 1. Trạng thái hiện tại

Round 2 (2026-11-19). The owner answered Q1: A, with a preflight for the LLM part that remains (G1 and G2,
provisional until it holds one more round). The owner also raised a new point: "who is allowed to merge? The current
model feels like no one merges." It is scouted as M1-M4 in §3. Open: Q2 (the merge model). Window 3 of the live run
may be in progress, and this discussion stays read-only.

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
| M2 | A branch that belongs to no plan has nobody who may merge it: a shaper worktree branch (this discussion, commit 726b68d39), a fix branch, an ad-hoc `fgos run` result. No lead exists for it, and every other persona has `--paths` only. | **open: Q2** | V: grants table; this branch |
| M3 | The lead approves itself. It reviews its own unit's diff with a `code-reviewer` subagent and lands. Independent review lives only in lane convention (the Git reviewer lead:OPC as "Merge gate" in phase 7a), not in the model. Gas Town gives merging to a dedicated role (Refinery). | **open: Q2** | V: `fgos-lead/SKILL.md:31-35`; phase-07a:6-7; gastown [ER] |
| M4 | The model's merge path has never run live. Every merge on main since 11-18 is a hand-run lane `land <branch>` (land-branch.sh). The script's removal (step 6) waits until every running lead lands with `fgos land`. Nobody arbitrates a refused land across plans (conflict, red gate, `land-recovery-required`): the lead parks or asks the owner. | clear | V: `git log origin/main --since=2026-11-18`; integration.md:49; `fgos-lead/SKILL.md:47-53` |
| F4 | `event-store-end-trigger` faults are logged for verbs that succeed, which misled the window-1 diagnosis. | finding already in the tree | V: integration.md correction |

Not covered by the research (limits, [ER]): Temporal, OpenHands, Devin, AutoGen/Magentic-One, CrewAI, LangGraph
supervisor and the OTP restart-strategy docs were not read. No public postmortem of a sandboxed supervisor exists to
compare against.

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày | Nguồn |
|------|------------|------|-------|

## 5. Q&A log

- 2026-11-19 round 0: scouted the internal design (spec, plan, reports, skills) and external sources
  (external-research.md). No owner input yet.
- 2026-11-19 round 1, Q1 (admit and start out of the LLM?). Owner: "A, kèm preflight cho phần LLM còn lại. Với ai được
  phép merge. Cảm giác mô hình hiện tại không ai merge." Recorded as provisional on G1 and G2. The merge point was
  scouted as M1-M4, and Q2 was asked.

## 6. Thiết kế đã chốt {#design}

(not yet)

## 7. Danh mục hạng mục / task {#tasks}

(not yet; candidates after Q1: F1-F3 doc fixes, G2 preflight proof, G3 restart cap, G5 held-plan mechanism, G7
enable-without-start, G1 depending on Q1)

## Q1 {#Q1}

Open, asked in the owner's tab on 2026-11-19. The question store refused `discussion:supervisor-review#Q1` as
`ref-invalid`, because this file is not on main yet. The input is in `.fgos/runtime/tmp/q1-supervisor-review.json`;
re-ask it once the discussion lands. The question: should admit and start move from the LLM supervisor to the wake door
(A, recommended), stay with a preflight added (B), or move to a watcher with no LLM at all (C)?
