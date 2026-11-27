# Supervision Component Specification

```txt
Document type: BA-grade area specification
Audience: Owner, maintainer, implementation agent
Purpose: One authority for coordinating the plans of a project with no person sitting by: a no-LLM watcher on a timer, an LLM supervisor woken through one door, one lead per plan, a lane pool, and one landing door
Design status: Settled by the owner (shaping report "SETTLED DESIGN", items 1-10) and decided inside that frame by the plan (PS-1..PS-24); owner answer Q1 recorded 2026-11-18
Implementation: Live. Crate fgos-supervision, the verbs of section 4, the watcher definitions and the config keys exist; the keeper, scheduling records and the periodic review (section 1.2) landed with the orchestration skeleton keeper plan
Canonical: Yes for the scope below, from the day the plan lands
Owner: Supervision component (proposed)
Source: packages/supervision/rust (crate fgos-supervision), core/watcher/
Contracts: packages/supervision/contracts/ (including scheduling-record.v1.json); config keys in core/config-standard/ and core/config-schema/
Provenance: plans/261118-1045-project-supervisor/plan.md and plans/reports/shaping-261118-1045-supervisor-owner-questions.md (2026-11-18)
Writer type: Agent draft writer
Canonical for: The supervision entities, the watcher tick, the supervisor wake and verbs, the lead, the lane pool, the landing use case, their refusals and their trust boundary
Use this when: Changing how plans are admitted, started, watched, parked or landed without a person
Do not use this for: Work items or the Work frontier (Work layer), Git mutation primitives (Git), starting a session (Session Host and `fgos session start`), config storage (Config), the owner-question store (Questions), measurement (Observe)
Last reviewed: 2026-11-27
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

Status: the verbs, keys, locks, files and crate named below are live unless a line says planned (the `(planned)` marks on entries in section 3 and elsewhere that still read so are historical and are not a gap). The session-verb plan renamed `fgos head ...` (dbd26eae6) to `fgos session start|stop|rotate|write` (PS-16); all are live (Session Host).

## 1. Overview and boundaries

fgOS coordinates the plans of the project it runs on with no person sitting by. Five parts, each with one job:

- **Watcher** (Rust, no LLM, a third per-project OS timer). Each tick fetches the trunk, runs the detection definitions listed in `watcher.definitions`, records each raised event once in the Event Store, and runs the configured action per row kind: wake the supervisor (default), notify through the mailbox, or none. It decides, starts and stops nothing.
- **Supervisor** (an LLM head session, persona `supervisor`, one per project). Woken through one door, `fgos supervisor wake`. The left hand: looks after every running agent that no lead watches (leads, shapers, planners, and any agent started without a lead; workers of a lead belong to that lead). It drains the event queue (including `coordination-help` requests from heads), admits `ready` plans by priority while leads are below `supervisor.maxLeads` and a lane is free, starts one lead per plan, restarts, parks or asks about a gone or stuck lead, resumes the asker of an answered owner question, closes done plans and starts the one planner of a settled discussion. It asks the owner only through `fgos questions ask` (five-part form, see [questions/spec.md](../questions/spec.md)).
- **Lead** (persona `lead`, confined). Drives one plan's waves through `fgos run`, reviews each phase, lands it with `fgos land`.
- **Lane pool** (worker seats pooled per machine). A lane is a held machine-scope lock taken where a top-level worker seat starts.
- **Landing door** (`fgos land`). The one Rust door that replaces the hand-run landing script and the hand census fix.

### Owns
- The portfolio reader: plans as read from frontmatter on the trunk tip (status, priority, blockedBy, footprint, source). Plan frontmatter itself is owned by the plan contract.
- The event queue and its `handled` flag, over the Event Store.
- The watcher tick, its definitions (planned: core/watcher/definitions/) and pace rows (planned: core/watcher/pace/).
- The wake door and the supervisor verbs.
- The discussion source (`discussion: <state>` marker, emitting `fgos.discussion.status`).
- The landing use case (`fgos land`), including the footprint bound and the generated-file regeneration.
- The widen door (`fgos supervisor widen`) and its edit of a plan's two footprint copies (section 4.2).
- The lane pool read (`fgos slots`) and the lane count.

### Must not own
- Work items or the Work frontier (`fgos ready`, `schedule`). The portfolio is plan frontmatter only.
- Git mutation. `fgos land` composes the Git ports (Remote, Land, ScopedCommit); it adds no Git primitive and no rebase.
- Session start. Session Host and `fgos session start` start the lead, planner and supervisor.
- Config storage. Keys live in `core/config-standard` and `core/config-schema`.
- The owner-question store and its answers ([questions/spec.md](../questions/spec.md)); this area only runs its `question-answered` definition and resumes the asker.
- Measurement. Observe records; this area registers kinds through `observe-kinds.json`.

### 1.1 Role charter for the two hands

The project operates through the owner's two hands, domain-free:

- **The supervisor (left hand):** Looks after every running agent that no lead watches: leads, shapers, planners and any pane or agent started by hand without a lead. Workers of a lead are that lead's. Its rhythm is owned by the keeper (the orchestration skeleton) and is not specified in this section.
- **The secretary (Miu, right hand):** Holds every power the supervisor holds and keeps it asleep. In peace she talks with the owner, clarifies and orders goals, and reduces load on the owner without meddling in routine operations. When no supervisor is alive or able to act, or a help request waits past the threshold, she runs the operation herself and wakes the machinery until it runs again.
- **One help channel:** Heads raise `coordination-help` to the supervisor; supervisor raise of the `coordination-help` kind is granted to every head persona (lead, supervisor and secretary also raise the other coordination kinds); the key `secretary.help.staleMinutes` (default 30, minimum 5) is how long a help event may stay unhandled before Miu takes over. Heads do not talk to Miu directly in peace; owner decisions go through the question store ([questions/spec.md](../questions/spec.md)), and Miu relays them to the owner.

### 1.2 Admission, the keeper and the periodic review

Admission lives in code (the wake door and `portfolio.rs`), not in the supervisor skill; the supervisor keeps only judgement. A plan that is not admitted carries one reason code in `supervisor plans`: `held-max-leads` (`leadsLive` reached `maxLeads`), `held-no-lane` (no free lane), `held-blocked` (a `blockedBy` plan is not `done`), a footprint problem (an unreadable or uncomparable footprint), or `publish-failed:<code>` (the `land --paths` commit of `status: running` was refused with that door code). Footprint overlap with a running plan no longer holds admission: the plans read view lists the overlaps as advice for the supervisor (plan `261126-2318-plan-footprint-overlap-warns`, phase 20), and the contract check `scripts/plan-contract-check.mjs` warns on a cross-plan overlap (phase 19); a conflict is met once, at land.

**Keeper** (`keeper.rs`, domain-neutral; wiring in `apps/fgos/src/wiring/supervision.rs`). It decides who acts next and when, within caps, and never acts itself: the wiring executes each decision (start, wake, hold, raise) through the existing doors. The decision function is pure over the scheduling records, the clock and the keeper's own past decisions in the Event Store (`supervision.keeper-*` events). A repeat of an unchanged open decision is not appended again. A keeper error raises one event for judgement, and the supervisor decision step still runs, so a broken keeper never stops admission.

**Scheduling records** (`packages/supervision/contracts/scheduling-record.v1.json`). One record per open step of a domain item, keyed by `item` and `step`: `waitingOn` (`actor`, `time`, `event` or `person`, with an optional `until`; expiry raises, it never clears the wait), `needs` (`role`, `actor` or `capability`, with `maxRounds`, the cap on how often the keeper may start the player of that need) and `outcome` (`done`, `withdrawn`, `wontfix`, `cancelled`), which closes it. Domains own the ids; the keeper reads the records and never edits them.

**Sources.** Records come from the sources listed in `watcher.schedulingSources` (default `plans`, `workflow-cases`), registered as data like `watcher.definitions`. `plans` is a Rust source over the portfolio reader: one `lead` step per running plan, and a sleeping lead's `wakeAt`, read from the Session Host head record, becomes `waitingOn.until`. `workflow-cases` calls `fgos workflow records --json` ([workflow/spec.md](../workflow/spec.md)). A source that fails reports one decision `source-unavailable`, its records are skipped and never guessed, and its next success reports recovery. Questions are not a source: a gate waiting on a person answers `waitingOn: person`.

**Starts.** A capability start runs the run door (`fgos run --case <item> --activity <step>`) detached through the process door, so the tick never waits on it. A player started within the start window reads `Unknown` (never free, never dead), so it is not started twice. The referee's resource claims are checked before any start; a held resource keeps the record waiting (`resource-held`).

**Periodic review.** The definition `review-due` raises when the newest `fgos.review.done` record is older than `watcher.reviewIntervalSec` (default 86400, minimum 3600), unless nothing is open and nothing happened since. Its action `start-review` runs one detached, read-only review Unit (`fgos run --capability review`, no `--writes`) with the fixed brief `core/watcher/briefs/periodic-review.md`; the reviewer reports findings through `supervisor raise` and never fixes. `fgos.review.done` is recorded once, when the Unit settles; a failed Unit records nothing, so the next tick retries.

## 2. Shared entities

| Entity | Meaning | Owner |
|---|---|---|
| Plan | A directory under `plans/` whose frontmatter carries `status`, `priority`, `blockedBy`, `footprint`, `source` and, once `running`, `lead` (the Identity role of its lead). Admissible when `status` is `ready` and every `blockedBy` plan is `done`. | plan contract (this area reads it) |
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

Flags, defaults and contracts live in `packages/supervision/contracts/` and `core/config-standard/`, not here.

| Verb | Caller | Job |
|---|---|---|
| `fgos watcher tick` | OS timer | One watcher pass (fetch, detect, record, act). |
| `fgos supervisor wake` | watcher, anyone | Start the supervisor if none lives for this project; otherwise do nothing (delivery is the queue). |
| `fgos supervisor plans` | supervisor | The portfolio in admission order, with `leadsLive`, `leadsWaiting` and `maxLeads`. A live lead of a plan that waits outside counts in `leadsWaiting`, not in `leadsLive`, so admission compares `leadsLive` with `maxLeads` and a waiting lead holds no slot. A running plan waits outside when every phase not `done` has an open owner question whose ref is `plan:<dir>#phase-NN` or `plan:<dir>`, read from the question store at each call; an unreadable store means not waiting (`a_live_lead_whose_every_open_phase_has_an_open_owner_question_holds_no_slot` and `a_plan_with_a_not_done_phase_lacking_an_open_question_does_not_wait` in `packages/supervision/rust/tests/wake.rs`; the store read in `a_live_lead_whose_only_open_phase_has_an_open_question_in_the_store_is_counted_waiting`, `apps/fgos/tests/supervision_verbs.rs`). The question store is the source because a lead parks by a `coordination-help` event and never lands a park in its plan file. Interim: plan `261122-0056-orchestration-skeleton` phase 6 (sleep) and phase 5 (`waitingOn`) replace this rule. |
| `fgos supervisor queue` | supervisor | The unhandled events. |
| `fgos supervisor handled <id>...` | supervisor | Mark one or more events handled. From a confined head, `handled`, `done`, `queue`, `plans` and `slots` go through its request socket (`session-host/spec.md` 8.9). |
| `fgos supervisor done` | supervisor | Refuses while unhandled events exist; on an empty queue answers done and stops the caller's own session. |
| `fgos supervisor widen <plan-dir> --phase <id> --path <p> [--path <p> ...] --criterion <n>` | supervisor for any plan, a lead for its own | Add paths to a ready or running plan's footprint for one numbered acceptance criterion, both copies in one landed `plan.md` (section 4.2). |
| `fgos land` | lead (branch), others (`--paths` only) | Land a reviewed phase, or commit exact main-checkout paths. Answers with a ticket. |
| `fgos request result` | any head | Read a ticket's outcome. |
| `fgos session start\|stop\|rotate` | supervisor | Start, stop or replace a head (Session Host; `stop` also takes `--reason sleep`, see [session-host/spec.md](../session-host/spec.md) 8.10). |
| `fgos slots` | any | Lane pool: ceiling, live, free, seats. |
| `fgos questions ask` | supervisor | The owner channel ([questions/spec.md](../questions/spec.md)). |

A confined caller reaches every socket verb through one host rule: the host hands a confined (`FGOS_CONFINED=1`) call of a verb named in the head-request contract to the Node payload, whose one arm sends it through the head request (PS-20). Long verbs answer with a ticket because request verbs are bounded to 60 s and served one at a time.

Personas and grants: shaper gains writes `plans/discussions` and verb `land`; secretary, planner, supervisor and lead gain `land`. A lead lands a plan branch and a shaper lands its own discussion branch `discussion/<dir>` (`land-branch-not-own` for any other branch); every other persona lands `--paths` only, and only inside its grant writes. The lead's grant also holds `worktree create`.

### 4.1 Coordination powers of the secretary and the supervisor

The owner's two hands (the secretary Miu and the supervisor) coordinate through the supervision queue, the portfolio files and a small set of request-socket verbs. Which persona holds which verb is `GRANTS` in `src/session-host/head-grants.mjs`, the only source (grant list: [agent-confinement/spec.md](../agent-confinement/spec.md) 13.5); the socket's arguments and refusals are `packages/run-supervisor/contracts/head-request.v1.json`. This section holds only what those cannot say.

| Verb | What it is for | Rule worth keeping |
|---|---|---|
| `fgos supervisor raise --kind --ref --reason [--next]` | A caller puts one coordination event (`coordination-handoff`, `coordination-chore` or `coordination-help`) on the queue. | One raise path in `packages/supervision/rust/src/queue.rs` (`COORDINATION_KINDS`); the supervisor closes it with `supervisor handled`. Decisions stay in portfolio files; the event only points at them. |
| `fgos supervisor wake` | Wake the supervisor after raising. | Served on the request socket too; no caller-role gate, it runs under the supervisor write operation. The watcher still wakes the supervisor by itself. |
| `fgos session read <target> [--lines N]` | Look at the last lines of a session's screen before acting. | Read-only; the target resolves through Identity, never a raw pane id; the answer is capped, so a very control-heavy screen can still be refused `reply-too-large`. |
| `fgos session type <target> --text` | Type into a stuck session's pane, once. | Refused `target-not-stuck` unless an open supervision event names the target; the one hands-on act, so it is recorded as coordination evidence. |
| `fgos watcher tune [<definition>] [--arm\|--disarm] [--set key=value]` | Arm or disarm a detection definition and change its thresholds. | A new definition kind stays a code change; `enabled`, `definitions`, `defaultAction`, `actions` (except through `--arm\|--disarm`) and `notifyTo` are never tunable; values are held to the config schema, which for the session thresholds states a minimum only. |
| `fgos run` by the supervisor | One urgent chore as one unit. | Same door and ceilings as the secretary's own run (`secretary.run.maxMinutes`, `secretary.run.tier` in `core/config-standard/secretary.yaml`; a request may ask for less, never more); read-only unless `--writes` names paths inside a linked worktree. |

Trust: every verb above is granted per persona and checked again by the route child, which treats its arguments as coming from the sandbox. Reach is every Identity session of the project to observe, ask and help, but a stop (`session stop`) reaches heads only: a session that holds no head grant (a hand-started one) is refused `stop-target-not-head`, and goes to the supervisor, which asks the owner through the question store. When both act on the same thing the owner wins over a direct Miu order, which wins over the supervisor's own choice. A power is granted only once its proof passes from the sandbox: proof pending live audit for the powers added here (screen read and type, tune from a confined caller, the `--override` tier of a run, wake from inside a sandbox).

### 4.2 The widen door

A plan's footprint is one planner's estimate of the files an approved acceptance criterion needs, and a phase regularly discovers that the estimate missed one or two of them. `fgos supervisor widen <plan-dir> --phase <id> --path <p> [--path <p> ...] --criterion <n>` is the one call that answers that: it adds the paths to that phase's footprint, writes both copies (the frontmatter `footprint:` list and the phase row's footprint cell), and lands `plans/<dir>/plan.md` alone. It is the one door through which a lead changes its own plan's footprint (PS-24, amended); every other lead footprint change stays `footprint-change-refused` at the land door.

- **Inputs and scope.** One plan directory (a single path segment), one phase id, one or more repo-relative paths, and a positive criterion number. The main checkout is caught up before reading; the plan must be `ready` or `running`, and the phase must exist and be neither `done` nor `withdrawn`. `<n>` must name an item of the plan's own Acceptance criteria numbered list. The commit names the phase, added paths, criterion number and the item's first line. This checks that the criterion exists, not that the path serves it: the lead judges that link. Without that link the widening is a scope change and goes to the owner in the five-part form.
- **Both copies.** Only the frontmatter footprint and the selected phase's footprint cell change; other bytes stay. A path already covered by the frontmatter is not added there again, but is still added to the phase cell if not already listed there. The edited plan and phase table are re-read before publication through the existing paths land and its gates; this door adds no separate plan-contract check. If neither copy changes, nothing is committed.
- **Overlap is advice.** Comparison with every other `ready` or `running` plan names shared paths in the answer, never refuses for overlap and never orders the plans.
- **Refusals.** `plan-not-found`; `plan-not-widenable` (not `ready` or `running`); `phase-not-found` (missing or ended phase); `criterion-not-found`; `footprint-entry-invalid` (a path rejected by write-scope, empty or starting with `-`). Malformed arguments are `bad-args`; unreadable frontmatter or an invalid edit is `plan-frontmatter-missing` or `plan-reread-failed`, and document-edit refusals retain their codes. Main-checkout, portfolio and publisher refusals pass through by code, including `write-branch-ahead`, `admission-path-dirty`, `admission-path-symlink`, `admission-path-unreadable`, `admission-write-failed`, `admission-restore-failed` and the land door's refusals. A failed land restores the original bytes only while the file is dirty and still equals this door's edit.
- **Answer (`--json`).** `{ plan, phase, criterion, added, unchanged, overlaps: [{ plan, paths }], commit }`: `added` names paths added to either copy, `unchanged` those already covered in frontmatter and listed in the phase, and `commit` is the landed commit or null for a no-op. Without `--json`, a no-op answers `unchanged <plan-dir>`.
- **Caller boundary.** The supervisor may widen any eligible plan; a lead only its own, through a ticket read by `request result` as for `land` ([session-host/spec.md](../session-host/spec.md) 8.9). The lead route resolves its plan from the caller's envelope and refuses `plan-not-own` for another plan; the supervisor's permission is a plain forward allow. The lead's sandbox write grant does not change: the host publishes the footprint edit.

Executable authority: `apps/fgos/src/wiring/supervision.rs` (arguments, publication and answer), `packages/supervision/rust/src/portfolio.rs` (eligibility, both copies and overlap).

## 5. Flows

**Tick to event to action.** Timer fires `watcher tick` (60 s while a `watcher-active` row exists, 900 s idle) -> take the `watcher` lock -> fetch the trunk -> run edge definitions over `lastTick - watcher.lookbackSec` and level definitions as current state -> record each raised event once (stable id) -> run the row's action: wake the supervisor, notify, or none. Pace definitions are read for pace and never raised.

**Wake to admission.** `supervisor wake` -> no live supervisor for this project: start one under `head:supervisor-<handle>`; a live one only sees the queue -> supervisor drains the queue -> admits `ready` plans by priority while leads < `supervisor.maxLeads` and a lane is free -> starts one lead per plan -> `supervisor done` on an empty queue ends its session.

**End of a head.** The host, not the head, says a head ended: a placement with no `retiredAt` whose `runDir` holds `closed.json` (written by the run supervisor on every attempt end) projects `fgos.head.state` `ended` at the file's instant (observe spec), and `lead-ended` fires on `retired` or `ended` with no head raising it (`an_ended_lead_over_an_empty_queue_records_one_lead_ended_event_and_the_next_tick_nothing_new`, `packages/supervision/rust/tests/definitions.rs`). `session-gone` and `head-gone` also match `ended`, only for roles prefixed `head:shaper-`, `head:planner-`, `head:secretary-` and `head:supervisor-`, so a finished lead belongs to `lead-ended` alone (`an_ended_head_raises_session_gone_and_head_gone_like_a_gone_one_unless_it_is_a_lead`). The query language has no negated prefix, so those prefixes list the non-lead personas: a new head persona must be added to both definitions.

**Wake close step.** On each wake the door stops, through the `StopSession` port, a planner whose plan has landed as `draft` or `ready` and a lead whose plan is `done`, under either role shape (`head:lead-*` or `lead:<LANE>`); it stops only an `Idle` head and leaves `Busy` and `Unknown` ones, as `stop_stuck` does. A lead role that still leads any plan not `done` (a lane session that moved on) is skipped. The span outcome is `stopped-finished`, or `stop-failed` carrying `fgos.supervisor.error`; a failed stop never blocks the start decision (`one_wake_stops_the_idle_heads_of_landed_and_done_work_and_leaves_a_busy_one_and_a_lead_of_another_plan`, `a_head_of_finished_work_whose_activity_is_unknown_is_left_alone`, `a_failed_close_never_blocks_the_start_decision`, `packages/supervision/rust/tests/wake.rs`). A lead with no run supervisor (started by hand) answers `session stop` `{stopped: false, reason: "no-supervisor"}`, which the wake records as `stop-failed`; the supervisor closes it by hand (`a_wake_stops_an_idle_finished_lead_through_the_real_adapter_and_session_stop_names_its_role`, `apps/fgos/tests/supervision_verbs.rs`; `test/session-host/head-stop.test.mjs`). `plan-drafted` (a plan landing as `draft`) is raised beside `plan-became-ready`; both are in the shipped definition list that `packages/supervision/rust/tests/definitions.rs` checks.

**Footprint widened.** A unit refused `write-outside-footprint` names a path the plan's footprint missed -> the lead calls `supervisor widen` for its own plan, that phase, the paths and the acceptance criterion they serve -> both copies are written and `plans/<dir>/plan.md` lands -> the same `run --writes` is accepted, and the answer's `overlaps` names any other active plan that shares a path; ordering the two plans is not this door's job.

**Lead to land.** Lead runs `fgos run --writes <footprint paths>` in a linked worktree -> reviews the phase -> `fgos land`: fetch, prepare (holding the target's merge slot, rank 20, across the gate), run `land.gates` and `land.regenerate` (which may carry `when` globs, like a gate, and then runs only if a landed path matches) in the candidate, push the candidate's pin ref, publish (fast-forward of local main); retries 3 times when the remote moved. A retry reuses the gates an earlier attempt passed when the trunk moved since only by paths that no gate's `when`, no `land.regenerate.when` and no regenerated file names; a gate without `when` names every path, so any move runs it again. Gates and regeneration build into one Cargo target under the main checkout, `.fgos/runtime/land/cargo-target`, unless the caller sets `CARGO_TARGET_DIR`; it outlives each candidate checkout, so a land builds only what changed. A refusal after prepare (gate, regeneration, conflict, push) settles the door's own Land operation through the Git ports (recover, then release the candidate and pins), so the next `fgos land` is not blocked, and the candidate checkout goes with it, ignored build output included (Git spec, retained Land candidates); a refusal always names its own code and detail first, and trouble releasing the candidate follows as a separate `cleanup note` line (`LandRefusal.cleanup_note`), never replacing it; only a crash leaves `fgos git recover` to run. A failed gate or regeneration keeps its full stdout+stderr in `.fgos/runtime/land/<operation id>.log`; the refusal names that path and shows the lines that name failures (`not ok`, `✖`, `ℹ fail`, `test ... FAILED`, `failures:`, `error[`), else the last 4 KiB. Land merges, never rebases. A conflict on a declared generated file is regenerated in the candidate and prepared again with a fresh operation id. A `--paths` land holds the same merge slot across its sync, gates, commit and push (a live Land of the target makes it wait, then refuse `merge-slot-busy`); its gates run in the main checkout before the commit and intentionally see other dirty files there. After a successful branch land, the land door resolves any worktree checking out the landed branch through GitDriver, calls the worktree removal port (`fgos worktree remove <path> --delivered-to <target> --discard-ignored`) when it is clean and no process stands in it, and reports `worktreesRemoved` and `worktreesKept` with refusal codes in the result JSON. Squash lands always keep their worktree (the door refuses `worktree-delivery-unproven` because the tip is not an ancestor of the target). The door's own refusals decide what is kept, and a refusal never fails the land. A paths land removes nothing.

**Answered owner question.** `question-answered` raises an event -> supervisor wakes -> a busy live asker sees the answer through its own hooks; an idle or gone asker is stopped, and a successor is started under the asker's own `head:` role, which writes the answer back where the question was asked. The supervisor never acks or cancels.

**Settled discussion.** `discussion-settled` raises an event -> the supervisor starts the one planner for that discussion, unless a plan's `source` already names it or a planner for it is live. The secretary reports a settled discussion; it does not start a planner.

## 6. Failure modes

| Failure | Handling |
|---|---|
| No supervisor startable from a timer, or a head killed together with the tick's unit | Spike first (plan phase 2); the start is detached from the tick's unit. Until proven, wake reports `wake-failed` and the tick notifies. |
| Land onto a dirty main checkout | Refused (`main-checkout-dirty-overlap`); the lead's sandbox writes only its plan dir so it never dirties main itself. |
| A land killed mid-way | `fgos git recover`; the session is journalled by the Land port. |
| A clone with no remote HEAD (`git remote set-head origin -a` never run) | The trunk is only the checkout's attached branch, which is not trusted: the discussion source emits nothing and `fgos land` without `--target` refuses `land-target-unknown`, naming the fix. Run `git remote set-head origin -a` once. |
| Lane leak | Lanes are kernel locks: a killed run supervisor frees its lane. `fgos slots` reads the OS state. |
| Two supervisors | The Identity role is unique per project; a second start for the same role refuses. |
| Stuck supervisor | A live supervisor leaving events unhandled for `watcher.stuckWakeLimit` ticks raises `supervisor-stuck` (notify); an idle one is then stopped (`session stop`, span outcome `stopped-stuck`) so the next tick wakes a fresh one, while a busy or unknown one (mid-turn, or a request ticket still `running`) is only notified. |
| Late or foreign commits, lost state | Each full tick fetches the trunk; edge windows reach back `watcher.lookbackSec`; a missing state uses `now - lookbackSec`; stable ids dedupe the overlap (PS-21). |
| A detection row with no subject or no instant (a definition that carries no `min:ts`, `max:end` or `max:ts` aggregate) | The watcher drops the row, counts it in `errors`, and names the definition and the missing field in the tick result (`problems`) and the tick span (`fgos.watcher.problem`); every shipped definition is proven to yield both. |
| Footprint escape | `land` refuses `land-outside-footprint`; a lead's `land --paths` that changes its own `footprint` is refused (PS-24), and the one door through which it widens that footprint is `supervisor widen` (section 4.2). |
| Empty gate list | `land` refuses `land-gate-missing`. |
| Unit drift | An installed watcher unit whose PATH cannot reach a wake tool (node, herdr, claude, codex, cargo) that the installing environment can reach reads `stale` in the `watcher-timer` row and the fix re-renders it; the other installed values stay pinned. |
| Answered question | A `question-answered` event is handled by the numbered procedure in `fgos-supervisor`: a live idle asker is stopped, then its successor is started with `--for-question`; a live busy asker is left; a gone one only gets the start. The stop route allows the asker of an answered question. |
| A finished lead stays live and idle (diagnosis `plans/261124-2143-head-lifecycle-events/reports/diagnosis.md`, candidate a) | The lead finished its plan but its session stayed up, so there was no `retiredAt` and no `lead-ended` row. The host now reads `ended` from `closed.json` (section 5) and the wake close step stops an idle lead of a `done` plan; a lead the step cannot stop is `stop-failed` and the supervisor closes it by hand. |
| Windows | No timer scheduler: supervision does not run there and the `watcher-timer` doctor row says so. |

### 6.1 Missed idle lead, 2026-11-22

The watcher was running, but a handled detection is not a recurring reminder. The project stream
(`.git/fgos/events/project/closed/2490-2491.jsonl`) raised `plan-no-progress` for
`261122-0118-heads-stable-and-able` and `261122-0800-red-tests-and-backlog-sweep` at 03:23Z; files
`2493-2493.jsonl` and `2492-2492.jsonl` handled them by 03:24Z. Miu's later `coordination-help` records
(`2512-2512.jsonl`, 03:40Z; `2602-2602.jsonl`, 05:28Z) report live idle leads and empty queues. The tick at
05:26:08Z (`.fgos/observe/records/pid-575373.jsonl` in that checkout) was active with 212 duplicates, zero
raised, zero wakes and zero errors/unmeasured rows. Thus “nothing raised” means no **fresh** event, not no prior alarm
or proof the watcher was disabled. The readable project `.fgos/config.yaml` contains no watcher override; the baseline's
resolved `enabled: false` is not proof that no timer tick ran.

The code explains the gap: `core/watcher/definitions/session-idle.query.json` tests activity **count**, not elapsed
silence (`watcher.sessionIdleLimit: 0` in `core/config-standard/watcher.yaml`). Observe's
`packages/observe/rust/src/sources/transcript_records.rs` emits the latest transcript/sidecar activity per session;
when activity stops, `max:ts` stops changing. `packages/supervision/rust/src/watcher.rs` derives the event id from
kind, subject and that instant; `packages/supervision/rust/src/queue.rs` deduplicates already-raised ids even after
handling, so silence creates no new idle edge.
`core/attention/definitions/plan-no-progress.query.json` uses the latest running-status timestamp, not a new
no-progress episode, and suppresses rows for recent commits, board entries or run attempts. Its standard threshold is
60 minutes (`core/config-standard/dispatch.yaml`), not the 20–24 minutes of unchanged plan files reported by the owner.
A live lead is neither gone nor retired, so `head-gone`/`lead-ended` do not fill the gap. Tick counters are aggregate;
they do not identify which individual session row was absent versus duplicate. The exact per-lead activity snapshot
at those ticks is not retained in these records. The earlier [baseline](../../../plans/261122-0118-heads-stable-and-able/reports/baseline-wake-and-idle.md)
counts false alarms (688/688), not missed episodes; it does not prove silence will raise again.

The supervisor therefore inspects every running plan on each wake, including an empty queue. For an idle lead with
unfinished phases and no verified ongoing wait, it raises `coordination-help` naming the head before `session type`,
keeps the event open until an answer or progress, and applies stop-then-start if idle again at the next wake. This uses
existing verbs only; it does not promise a wake when no new event exists. Automatic fresh detection and missed-alarm
measurement remain outside this skill correction.

## 7. Trust boundary (PS-19, decided)

`fgos land` runs `land.gates` and `land.regenerate` with `sh -c` in the candidate worktree, **unconfined, as the owner, on branch code**. The control is review (a lead lands only a phase its reviewer passed) and the trusted main checkout's config, the same trust as `runner.capabilities.<c>.verify`. Gate commands are project config, never constants of the fgOS repo. Confined gates are a separate backlog row (plan phase 19).

## 8. Lịch sử quyết định

Dated 2026-11-18, from [the plan](../../../plans/261118-1045-project-supervisor/plan.md), which holds each ground in full.

- PS-1: new area Supervision and one crate `fgos-supervision`; a new area gets a spec before code (L5 q2) and one crate keeps one door per job.
- PS-2: `fgos land` composes the existing Git ports and adds no `land` lock, because the Land port's rank-20 merge slot already serialises.
- PS-3: land merges and does not rebase, because Git has no rebase port and adding one is a new mechanism (RUL104 ("better, not bigger")).
- PS-4: generated-file conflicts are found by a read-only merge-tree, regenerated in the candidate, then prepared again with a fresh operation id at the same pinned target.
- PS-5: gates and regeneration are project config (`land.gates`, `land.regenerate`), never fgOS repo constants (mission #1).
- PS-6: `fgos land --paths` commits exact main-checkout edits of a confined head, the one way a portfolio edit reaches `main`.
- PS-7: the pre-commit census refusal applies only to main-checkout or trunk-checked-out commits; `fgos land` regenerates and gates the census.
- PS-8: one supervisor per project is the Identity role `head:supervisor-<project handle>`, not a lock; the watcher takes repo lock `watcher`.
- PS-9: delivery to a live supervisor is the queue; `supervisor done` refuses while events are unhandled; `supervisor-stuck` after `watcher.stuckWakeLimit` ticks; an idle stuck supervisor is stopped so the next tick wakes a fresh one, busy or unknown is notify only (2026-11-19: a head ended its turn without `supervisor done`, stranding its queue; the skill now ends every wake with `done`).
- PS-10: long request verbs answer at once with a ticket read by `request result`.
- PS-11: head names stay within 32 characters by cutting handle and plan directory; limits live in one contract read by Rust and Node.
- PS-12: lane count is held machine-scope lane locks taken by a top-level worker seat; a head and a nested dispatch take none; the Work-item slot count is retired (L10).
- PS-13: the watcher timer fires at the active interval and a tick with no `watcher-active` row exits early until the idle interval passes; `watcher.enabled` is global-only.
- PS-14: shaper gains writes `plans/discussions` and verb `land`; secretary, planner, supervisor and lead gain `land`; only a lead lands a branch.
- 2026-11-27 — Amends PS-14 (discussion ds-xb6hplcn2m): a shaper also lands a branch, but only its own `discussion/<dir>`, from its own worktree after saving rounds with `session save`; every other persona still lands `--paths` only.
- PS-15: the discussion source reads the `discussion: <state>` marker from the trunk's git history and emits `fgos.discussion.status` on each flip.
- PS-16: verb names follow the session-verb plan (`session start|stop|rotate`), not `head ...`.
- PS-17: the lead's grant holds request verb `worktree create`, since `fgos run --writes` needs a linked worktree.
- PS-18: the lane ceiling reaches the seat-start gate as an envelope field written only for a top-level seat; an adopted worker domain takes a lane.
- PS-19: gates run branch code unconfined as the owner; the boundary is review (section 7).
- PS-20: a confined caller reaches every new socket verb through one host rule (section 4).
- PS-21: detection survives late commits, other machines and lost state (section 6).
- PS-22: pace definitions are never raised; doctor row `supervision-pace` reads them, because a stopped watcher cannot report itself.
- PS-23: one planner starter per settled discussion, the supervisor; the secretary hands over by reporting.
- PS-24: owner answer Q1 = (A): the lead's sandbox writes only its plan dir; the plan's footprint bounds `run --writes` and the branch diff of `land`. The plan first waited on Q1; the owner answered it the same day. Amended 2026-11-27: the lead widens that footprint only through `supervisor widen` (section 4.2, entry below).
- PS-20 (delivery, 2026-11-19): the confined door moved into the Rust `head_client` through one host arm, following the `questions` precedent; `apps/fgos/src/wiring/questions.rs` still keys its confined routing on the socket variable and is a known follow-up.
- `run` through the request socket takes no `unit`: a unit file written by a sandboxed head cannot be bound by the supervisor, so only `--writes` runs are served.
- The commit-time footprint check reads only the frontmatter footprint of the tree being committed, before the push.
- The supervisor grant holds `session write` for its own backlog file, so a confined supervisor edits it through its supervisor and not through a shell.

- Secretary and supervisor powers (shaped with the owner 2026-11-19, in [the discussion](../../../plans/discussions/ds-nmk2mz6vkk-secretary-supervisor-powers/DISCUSSION.md), which holds each ground, the rejected options and the owner's words): Miu orders and stops sessions and raises work on the queue; the supervisor carries on and goes on site only on a watcher signal, with the pane as the last of three means; coordination acts are State on the queue and their evidence is Log in Observe, pruned when settled; defaults, ceilings and the winner order are settled there too. Section 4.1 holds the resulting verbs.

- At admission the supervisor writes `status: running`, `lead: head:lead-<headName>` (the role it starts) and `base: <trunk sha at admission>` (`git rev-parse <trunk>`) in one `land --paths` commit; `supervisor plans` reports `leadLive` from that role's live holder in this project, and holds a running plan with no `lead` (`leadUnnamed`, never restarted), because a non-head lead's role never matched the head name and the supervisor nearly started a second lead.

- Owner-approved 2026-11-21: the manual `lead:SUPERVISOR` session retires once the supervisor head runs one plan end to end alone (admitted, lead started, phases landed, plan closed), with no command typed by `lead:SUPERVISOR`. Evidence is the plan's commits and the supervision records.

- A plan widens its own footprint (plan `261127-0143-widen-running-plan-footprint`, the decision settled in [discussion ds-mzyircswox](../../../plans/discussions/ds-mzyircswox-widen-a-running-plan-footprint/DISCUSSION.md#4-quyết-định-đã-chốt), owner decision 2026-11-26 12:41 +07): a running plan widens its own footprint mid-run, inside the frame the owner approved and with no owner question, through one verb that names the phase, the paths and the acceptance criterion they serve and writes both footprint copies in one landed commit. PS-24 is amended, not dropped: that verb is the only way a lead changes its own footprint, and every other change stays `footprint-change-refused`; a widening the lead cannot tie to an approved criterion is a scope change and goes to the owner in the five-part form. Overlap with another active plan is advice that names that plan, never a refusal; ordering two overlapping plans is its own backlog item, not this door's job. Rules in section 4.2.

- A landed branch's worktree is removed by the land door (backlog `p-6sd4fslxv7`, owner-approved 2026-11-22 14:55): after a successful branch land, the land door resolves any worktree checking out the landed branch through GitDriver, calls the composition root's worktree removal port (`fgos worktree remove --delivered-to <target> --discard-ignored`), and reports `worktreesRemoved` and `worktreesKept` with refusal codes. Squash lands always keep their worktree (the door refuses `worktree-delivery-unproven` because the tip is not an ancestor of the target). A refusal never fails the land, and a paths land removes nothing. The lead skill reuses one worktree per phase and hands any kept worktree to the supervisor.

- Head end and close (2026-11-26, plan `261124-2143-head-lifecycle-events`): the host reports a head's end from `closed.json` and `lead-ended` fires on `retired` or `ended`, because a finished lead stayed live and idle and no head raised its end; the wake close step stops idle heads of landed or done work, because a lead never stops itself and the supervisor skipped it. Rules and proofs in section 5.
- Admission (2026-11-26): a live lead whose plan waits outside holds no lead slot (owner, `q-eoxlvo7i4r`: "a waiting lead does not hold a working slot"). "Waits outside" is read from the open owner-question store (owner answer `q-kikgj6qaiu`), not from the phase table, because since commit `19f91c530` a lead parks by a `coordination-help` event and never lands a park in its plan file. Interim until plan `261122-0056-orchestration-skeleton` phases 6 and 5 replace it.

- Orchestration skeleton keeper plan (`261122-0056-orchestration-skeleton`, integrated 2026-11-27), "Decided here":
  - Loop cap (where the loop cap lives): the cap is `needs.maxRounds`, declared by the domain from its frame; the keeper counts its own starts for (`item`, `step`) and raises "needs judgement" at the cap. The record contract fixes three items (`waitingOn`, `needs`, `outcome`), so the cap limits how often the keeper may start the player of a need and belongs to `needs`, not to a fourth item.
  - Handing records to the keeper: a source port in Supervision, with registered sources listed as data in `watcher.schedulingSources` (the `watcher.definitions` pattern). Plans are a native Rust source over the portfolio reader; workflow cases are the source verb `fgos workflow records --json` over the existing case projection; questions are not a record source and answer `waitingOn: person`. This keeps the keeper domain-agnostic and reuses each domain's read door with no second parser of the case ledger (design principle 1).
  - Work projector: not built. Work is frozen history (work-data-model); its open items are triaged under `p-jxwb7vi6a3`.
  - Split boundary (2026-11-25): the keeper plan holds the phases that make the keeper see and start players (admission, keeper core, sources and needs), the doors it calls (question recipients, resource claims), the sleep record its plan source reads, and the review that reads its output. Every phase of the players plan consumes one of these, so the players plan can be `blockedBy` this one without a cycle.
  - Periodic review depends on admission, the keeper core and the sources (2026-11-25): its fixed brief reviews oldest open records and open needs-judgement events, which exist only after those phases, and it shares `watcher.yaml`, its schema and `wiring/supervision.rs` with the sources phase, so the two cannot share a wave. Until the records read port (`fgos supervisor records --json`, players plan) lands, the brief reads the keeper's decision events from the event stream.
  - Order against `261124-2143-head-lifecycle-events` (2026-11-25): the whole keeper plan waited on 2143, not only the sleep phase, because 2143 also writes `wake.rs`, `portfolio.rs`, `supervisor.rs`, `wiring/supervision.rs`, the watcher tests and the supervisor skill; holding only one phase would have made the cross-plan overlap rule deadlock the two plans. Owner confirmed on 2026-11-25 13:15 (option A of three: 2143 first, the keeper second).
  - Component declaration before code: the plan's authority map was the plan-time declaration; integration records each row with `fgos authority declare` when the verb returns it missing. Every row lands under an existing component (`supervision`, `config`, `workflow`, `questions`, `resource-referee`, `session-host`, `session-rotation`).
  - Admission is no longer held by footprint overlap (plan `261126-2318-plan-footprint-overlap-warns`): overlap is advice in the plans read view and a warning in the contract check, because both plans run on their own branches and any conflict is met once, at land, where the land door already merges; the owner chose this (answer B to `q-kyzictpkf6`).

Three deliberate departures from the settled wording, reported to the owner: the landing door serialises through the Git Land port's merge slot instead of a `land` holder-lock (PS-2); the supervisor singleton is an Identity role instead of a holder-lock (PS-8); the supervisor, which the settled design says never lands, lands portfolio edits with `land --paths` only, never code (PS-6, PS-14). Item 4 of the settled design (the plan's footprint as sandbox writes) was amended by Q1 (PS-24).
