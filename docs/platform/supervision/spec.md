# Supervision Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for coordinating the plans of a project with no person sitting by: a no-LLM watcher on a timer, an LLM supervisor woken through one door, one lead per plan, a lane pool, and one landing door
Design status: Settled by the owner (shaping report "SETTLED DESIGN", items 1-10) and decided inside that frame by the plan (PS-1..PS-24); owner answer Q1 recorded 2026-11-18
Implementation: Spec only. No crate, verb, timer unit, config key or doctor row exists yet; every verb below is planned
Canonical: Yes for the scope below, from the day the plan lands
Owner: Supervision component (proposed)
Source (planned): packages/supervision/rust (crate fgos-supervision), core/watcher/
Contracts (planned): packages/supervision/contracts/; config keys in core/config-standard/ and core/config-schema/
Provenance: plans/261118-1045-project-supervisor/plan.md and plans/reports/shaping-261118-1045-supervisor-owner-questions.md (2026-11-18)
Writer type: Agent draft writer
Canonical for: The supervision entities, the watcher tick, the supervisor wake and verbs, the lead, the lane pool, the landing use case, their refusals and their trust boundary
Use this when: Changing how plans are admitted, started, watched, parked or landed without a person
Do not use this for: Work items or the Work frontier (Work layer), Git mutation primitives (Git), starting a session (Session Host and head start), config storage (Config), the owner-question store (Questions), measurement (Observe)
Last reviewed: 2026-11-18
Related:
- plans/261118-1045-project-supervisor/plan.md
- docs/platform/questions/spec.md
- docs/platform/git/spec.md
- docs/platform/session-host/spec.md
- docs/platform/identity/spec.md
- docs/platform/holder-lock/spec.md
- docs/platform/run-supervisor/spec.md
- docs/platform/event-store/spec.md
- docs/platform/observe/spec.md
- docs/platform/packaging-distribution/spec.md
```

Planned/live legend: every verb, key, lock, file and crate named below is **planned** until the plan's integration phase lands. Verbs that the session-verb plan renames (`fgos head ...` becomes `fgos session start|stop|rotate`, PS-16) are written in the planned `session` form; that plan is on hold, so `fgos session ...` is also planned and the live name today is `fgos head ...`.

## 1. Overview and boundaries

fgOS coordinates the plans of the project it runs on with no person sitting by. Five parts, each with one job:

- **Watcher** (Rust, no LLM, a third per-project OS timer). Each tick fetches the trunk, runs the detection definitions listed in `watcher.definitions`, records each raised event once in the Event Store, and runs the configured action per row kind: wake the supervisor (default), notify through the mailbox, or none. It decides, starts and stops nothing.
- **Supervisor** (an LLM head session, persona `supervisor`, one per project). Woken through one door, `fgos supervisor wake`. It drains the event queue, admits `ready` plans by priority while leads are below `supervisor.maxLeads` and a lane is free, starts one lead per plan, restarts, parks or asks about a gone or stuck lead, resumes the asker of an answered owner question, closes done plans and starts the one planner of a settled discussion. It asks the owner only through `fgos questions ask` (five-part form, see [questions/spec.md](../questions/spec.md)).
- **Lead** (persona `lead`, confined). Drives one plan's waves through `fgos run`, reviews each phase, lands it with `fgos land`.
- **Lane pool** (worker seats pooled per machine). A lane is a held machine-scope lock taken where a top-level worker seat starts.
- **Landing door** (`fgos land`). The one Rust door that replaces the hand-run landing script and the hand census fix.

### Owns
- The portfolio reader: plans as read from frontmatter on the trunk tip (status, priority, blockedBy, footprint, source). Plan frontmatter itself is owned by the plan contract.
- The event queue and its `handled` flag, over the Event Store.
- The watcher tick, its definitions (`core/watcher/definitions/`) and pace rows (`core/watcher/pace/`).
- The wake door and the supervisor verbs.
- The discussion source (`discussion: <state>` marker, emitting `fgos.discussion.status`).
- The landing use case (`fgos land`), including the footprint bound and the generated-file regeneration.
- The lane pool read (`fgos slots`) and the lane count.

### Must not own
- Work items or the Work frontier (`fgos ready`, `schedule`). The portfolio is plan frontmatter only.
- Git mutation. `fgos land` composes the Git ports (Remote, Land, ScopedCommit); it adds no Git primitive and no rebase.
- Session start. Session Host and head start start the lead, planner and supervisor.
- Config storage. Keys live in `core/config-standard` and `core/config-schema`.
- The owner-question store and its answers ([questions/spec.md](../questions/spec.md)); this area only runs its `question-answered` definition and resumes the asker.
- Measurement. Observe records; this area registers kinds through `observe-kinds.json`.

## 2. Shared entities

| Entity | Meaning | Owner |
|---|---|---|
| Plan | A directory under `plans/` whose frontmatter carries `status`, `priority`, `blockedBy`, `footprint`, `source`. Admissible when `status` is `ready` and every `blockedBy` plan is `done`. | plan contract (this area reads it) |
| Event | One raised detection row, recorded once by a stable id, with a `handled` flag the supervisor sets (`supervisor handled`). | Supervision over Event Store |
| Lane | One held machine-scope lock `<lockRoot>/lane/<k>.lock` of a top-level worker seat. Lane count = held lane locks. | Supervision reads; run supervisor takes and releases |
| Lead | A confined head session, persona `lead`, one per admitted plan. Its footprint bound is the plan's `footprint` read from the trunk tip. | Session Host starts it; this area names it |
| Supervisor | The Identity role `head:supervisor-<project handle>` (handle from `fgos identity project`, cut to 32). The Identity directory is per OS user, so every head name carries the project handle; a holder whose resolve answer names another `projectId` is never this project's. | Identity (role), this area (rule) |
| Ticket | The answer of a long request verb (`land`, `run`): returned at once, read later with `fgos request result [<id>] [--wait]`. | Supervision with Session Host's head request |

Head names for lead and planner are at most 32 characters: the project handle cut to 8, `-`, then the plan or discussion directory cut to fill 32, resolved back by unique prefix among plans that are not `done` or `withdrawn`. The limits live in `packages/supervision/contracts/plan-vocabulary.v1.json` (planned) so Rust and Node read one source. A collision is flagged by the portfolio reader and the supervisor asks instead of starting.

## 3. Storage model

- Events live in the Event Store under a `supervision` consumer (planned entry in `packages/event-store/contracts/consumers.v1.json`); see [event-store/spec.md](../event-store/spec.md).
- Lanes are lock files under `<lockRoot>/lane/<k>.lock`; lock rows are registered in `packages/holder-lock/contracts/lock-registry.v1.json`. They are machine-wide, so the ceiling `workerSlots.ceiling` is a global-only key.
- The watcher tick takes the repo-scope lock `watcher`. There is no `supervisor` lock: a holder-lock is bound to one process and an LLM session spans many processes.
- Event kinds register in `packages/supervision/rust/observe-kinds.json` (planned).
- No second store of plans or questions: plans are read from git, questions from the `questions` consumer.

## 4. Commands and routing

All verbs are planned. Flags, defaults and contracts live in `packages/supervision/contracts/` and `core/config-standard/`, not here.

| Verb | Caller | Job |
|---|---|---|
| `fgos watcher tick` | OS timer | One watcher pass (fetch, detect, record, act). |
| `fgos supervisor wake` | watcher, anyone | Start the supervisor if none lives for this project; otherwise do nothing (delivery is the queue). |
| `fgos supervisor plans` | supervisor | The portfolio in admission order. |
| `fgos supervisor queue` | supervisor | The unhandled events. |
| `fgos supervisor handled` | supervisor | Mark an event handled. |
| `fgos supervisor done` | supervisor | Refuses while unhandled events exist; on an empty queue answers done and stops the caller's own session. |
| `fgos land` | lead (branch), others (`--paths` only) | Land a reviewed phase, or commit exact main-checkout paths. Answers with a ticket. |
| `fgos request result` | any head | Read a ticket's outcome. |
| `fgos session start\|stop\|rotate` | supervisor | Start, stop or replace a head (live name today: `fgos head ...`). |
| `fgos slots` | any | Lane pool: ceiling, live, free, seats. |
| `fgos questions ask` | supervisor | The owner channel ([questions/spec.md](../questions/spec.md)). |

A confined caller reaches every socket verb through one host rule: the host hands a confined (`FGOS_CONFINED=1`) call of a verb named in the head-request contract to the Node payload, whose one arm sends it through the head request (PS-20). Long verbs answer with a ticket because request verbs are bounded to 60 s and served one at a time.

Personas and grants: shaper gains writes `docs/discussions` and verb `land`; secretary, planner, supervisor and lead gain `land`. Only a lead lands a branch; every other persona lands `--paths` only, and only inside its grant writes. The lead's grant also holds `worktree create`.

## 5. Flows

**Tick to event to action.** Timer fires `watcher tick` (60 s while a `watcher-active` row exists, 900 s idle) -> take the `watcher` lock -> fetch the trunk -> run edge definitions over `lastTick - watcher.lookbackSec` and level definitions as current state -> record each raised event once (stable id) -> run the row's action: wake the supervisor, notify, or none. Pace definitions are read for pace and never raised.

**Wake to admission.** `supervisor wake` -> no live supervisor for this project: start one under `head:supervisor-<handle>`; a live one only sees the queue -> supervisor drains the queue -> admits `ready` plans by priority while leads < `supervisor.maxLeads` and a lane is free -> starts one lead per plan -> `supervisor done` on an empty queue ends its session.

**Lead to land.** Lead runs `fgos run --writes <footprint paths>` in a linked worktree -> reviews the phase -> `fgos land`: fetch, prepare (holding the target's merge slot, rank 20, across the gate), run `land.gates` and `land.regenerate` in the candidate, push the candidate's pin ref, publish (fast-forward of local main); retries 3 times when the remote moved. Land merges, never rebases. A conflict on a declared generated file is regenerated in the candidate and prepared again with a fresh operation id.

**Answered owner question.** `question-answered` raises an event -> supervisor wakes -> a busy live asker sees the answer through its own hooks; an idle or gone asker is stopped, and a successor is started under the asker's own `head:` role, which writes the answer back where the question was asked. The supervisor never acks or cancels.

**Settled discussion.** `discussion-settled` raises an event -> the supervisor starts the one planner for that discussion, unless a plan's `source` already names it or a planner for it is live. The secretary reports a settled discussion; it does not start a planner.

## 6. Failure modes

| Failure | Handling |
|---|---|
| No supervisor startable from a timer, or a head killed together with the tick's unit | Spike first (plan phase 2); the start is detached from the tick's unit. Until proven, wake reports `wake-failed` and the tick notifies. |
| Land onto a dirty main checkout | Refused (`main-checkout-dirty-mid-merge`); the lead's sandbox writes only its plan dir so it never dirties main itself. |
| A land killed mid-way | `fgos git recover`; the session is journalled by the Land port. |
| Lane leak | Lanes are kernel locks: a killed run supervisor frees its lane. `fgos slots` reads the OS state. |
| Two supervisors | The Identity role is unique per project; a second start for the same role refuses. |
| Stuck supervisor | A live supervisor leaving events unhandled for `watcher.stuckWakeLimit` ticks raises `supervisor-stuck` (notify). |
| Late or foreign commits, lost state | Each full tick fetches the trunk; edge windows reach back `watcher.lookbackSec`; a missing state uses `now - lookbackSec`; stable ids dedupe the overlap (PS-21). |
| Footprint escape | `land` refuses `land-outside-footprint`; a lead's `land --paths` that changes its own `footprint` is refused (PS-24). |
| Empty gate list | `land` refuses `land-gate-missing`. |
| Windows | No timer scheduler: supervision does not run there and the `watcher-timer` doctor row says so. |

## 7. Trust boundary (PS-19, decided)

`fgos land` runs `land.gates` and `land.regenerate` with `sh -c` in the candidate worktree, **unconfined, as the owner, on branch code**. The control is review (a lead lands only a phase its reviewer passed) and the trusted main checkout's config, the same trust as `runner.capabilities.<c>.verify`. Gate commands are project config, never constants of the fgOS repo. Confined gates are a separate backlog row (plan phase 19).

## 8. Lịch sử quyết định

Dated 2026-11-18, from [the plan](../../../plans/261118-1045-project-supervisor/plan.md), which holds each ground in full.

- PS-1: new area Supervision and one crate `fgos-supervision`; a new area gets a spec before code (L5 q2) and one crate keeps one door per job.
- PS-2: `fgos land` composes the existing Git ports and adds no `land` lock, because the Land port's rank-20 merge slot already serialises.
- PS-3: land merges and does not rebase, because Git has no rebase port and adding one is a new mechanism (RUL104).
- PS-4: generated-file conflicts are found by a read-only merge-tree, regenerated in the candidate, then prepared again with a fresh operation id at the same pinned target.
- PS-5: gates and regeneration are project config (`land.gates`, `land.regenerate`), never fgOS repo constants (mission #1).
- PS-6: `fgos land --paths` commits exact main-checkout edits of a confined head, the one way a portfolio edit reaches `main`.
- PS-7: the pre-commit census refusal applies only to main-checkout or trunk-checked-out commits; `fgos land` regenerates and gates the census.
- PS-8: one supervisor per project is the Identity role `head:supervisor-<project handle>`, not a lock; the watcher takes repo lock `watcher`.
- PS-9: delivery to a live supervisor is the queue; `supervisor done` refuses while events are unhandled; `supervisor-stuck` after `watcher.stuckWakeLimit` ticks.
- PS-10: long request verbs answer at once with a ticket read by `request result`.
- PS-11: head names stay within 32 characters by cutting handle and plan directory; limits live in one contract read by Rust and Node.
- PS-12: lane count is held machine-scope lane locks taken by a top-level worker seat; a head and a nested dispatch take none; the Work-item slot count is retired (L10).
- PS-13: the watcher timer fires at the active interval and a tick with no `watcher-active` row exits early until the idle interval passes; `watcher.enabled` is global-only.
- PS-14: shaper gains writes `docs/discussions` and verb `land`; secretary, planner, supervisor and lead gain `land`; only a lead lands a branch.
- PS-15: the discussion source reads the `discussion: <state>` marker from the trunk's git history and emits `fgos.discussion.status` on each flip.
- PS-16: verb names follow the session-verb plan (`session start|stop|rotate`), not `head ...`.
- PS-17: the lead's grant holds request verb `worktree create`, since `fgos run --writes` needs a linked worktree.
- PS-18: the lane ceiling reaches the seat-start gate as an envelope field written only for a top-level seat; an adopted worker domain takes a lane.
- PS-19: gates run branch code unconfined as the owner; the boundary is review (section 7).
- PS-20: a confined caller reaches every new socket verb through one host rule (section 4).
- PS-21: detection survives late commits, other machines and lost state (section 6).
- PS-22: pace definitions are never raised; doctor row `supervision-pace` reads them, because a stopped watcher cannot report itself.
- PS-23: one planner starter per settled discussion, the supervisor; the secretary hands over by reporting.
- PS-24: owner answer Q1 = (A): the lead's sandbox writes only its plan dir; the plan's footprint bounds `run --writes` and the branch diff of `land`. The plan first waited on Q1; the owner answered it the same day.

Three deliberate departures from the settled wording, reported to the owner: the landing door serialises through the Git Land port's merge slot instead of a `land` holder-lock (PS-2); the supervisor singleton is an Identity role instead of a holder-lock (PS-8); the supervisor, which the settled design says never lands, lands portfolio edits with `land --paths` only, never code (PS-6, PS-14). Item 4 of the settled design (the plan's footprint as sandbox writes) was amended by Q1 (PS-24).
