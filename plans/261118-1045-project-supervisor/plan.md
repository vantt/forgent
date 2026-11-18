---
contract: plan-v1
title: "Project supervisor: a no-LLM watcher on a timer wakes an LLM supervisor that admits ready plans into a lane pool, starts one lead per plan, and lands through one Rust door"
status: draft
priority: P1
blockedBy:
  - 261117-1856-secretary-session-spine
  - 261118-0947-session-verb-for-agent-sessions
  - 261118-0936-ops-metrics
  - 261115-2328-execution-read-door
  - 261118-1159-owner-question-store
footprint:
  - plans/261118-1045-project-supervisor/**
  - docs/platform/supervision/**
  - docs/platform/system-overview/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/run-supervisor/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/holder-lock/spec.md
  - docs/platform/packaging-distribution/spec.md
  - docs/reading-map.md
  - docs/backlog.md
  - CHANGELOG.md
  - Cargo.toml
  - Cargo.lock
  - package.json
  - .fgos/config.yaml
  - packages/supervision/**
  - packages/event-store/contracts/consumers.v1.json
  - packages/run-supervisor/rust/src/lanes.rs
  - packages/run-supervisor/rust/src/adopt.rs
  - packages/run-supervisor/contracts/envelope.v3.json
  - src/runner/dispatch/assignment-runner.mjs
  - src/run-supervisor/direct-launch.mjs
  - packages/run-supervisor/rust/src/supervise.rs
  - packages/run-supervisor/rust/src/lib.rs
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/**
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/holder-lock/contracts/lock-registry.v1.json
  - packages/distribution/rust/src/timer.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - apps/fgos/src/cli_projector.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/web/src/api/types.ts
  - docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml
  - packages/config/**
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/src/wiring/metrics_sources.rs
  - apps/fgos/src/wiring/doctor/**
  - apps/fgos/tests/supervision_*.rs
  - core/config-standard/**
  - core/config-schema/**
  - core/watcher/**
  - core/agents/**
  - core/skills/fgos-supervisor/**
  - core/skills/fgos-lead/**
  - core/skills/fgos-secretary/**
  - core/skills/fgos-fanout/**
  - core/task-specs/fgos-fanout.md
  - domains/coding/skills/fgos-coding-planning/**
  - .agents/skills/**
  - .claude/skills/**
  - .claude/agents/**
  - plugins/fgOS/skills/**
  - .githooks/pre-commit
  - scripts/plan-contract-check.mjs
  - bin/fgos.mjs
  - src/cli/command-registry.mjs
  - src/session-host/**
  - src/state/worker-slots.mjs
  - src/runner/claim-port.mjs
  - src/runner/loop.mjs
  - src/runner/fanout-batch.mjs
  - src/setup/**
  - test/**
  - docs/architecture-manifest.json
base: 7655f4f3e2c28fef3a1dec97174e7cf8fdadaded
source:
  - plans/reports/shaping-261118-1045-supervisor-owner-questions.md
  - plans/reports/draft-input-261118-1141-project-supervisor-plan.md
  - p-t55xjys4u5
  - p-dkkodseo63
created: 2026-11-18
---

# Project supervisor

Design input: [shaping report, section "SETTLED DESIGN"](../reports/shaping-261118-1045-supervisor-owner-questions.md#settled-design-the-planners-input-supersedes-the-earlier-rounds-where-they-differ)
plus its sections "Ops-metrics phase renumbering" and "Round 8" (authoritative; earlier rounds hold the owner quotes).
Ops-metrics phase numbers follow its 16-phase table in `plans/261118-0936-ops-metrics/plan.md`. The early draft
([draft input](../reports/draft-input-261118-1141-project-supervisor-plan.md)) was checked against the code at `base`
and reused with the changes listed under "Planner changes to the draft input". Revised 2026-11-18 after
[validation](reports/validate-261118-supervisor-plan.md) and [red team](reports/redteam-261118-supervisor-plan.md);
each report ends with a "Resolution" section mapping every finding to its fix.

## Outcome

fgOS coordinates the plans of the project it runs on with no person sitting by:

- A **watcher** (Rust, no LLM, third per-project OS timer) fetches the trunk, runs the detection definitions listed in
  `watcher.definitions` each tick, records each raised event once in the Event Store, and runs the configured action
  per row kind: wake the supervisor (default), notify through the mailbox, or none. It decides, starts and stops nothing.
- A **supervisor** (LLM head session, persona `supervisor`, one per project, named after the project handle) is woken
  through one door `fgos supervisor wake`. It drains the event queue: admits `ready` plans by priority while leads <
  `supervisor.maxLeads` and a lane is free, starts one **lead** per plan, restarts/parks/asks about a gone or stuck lead,
  resumes the asker of an answered owner question, closes done plans, and starts the one **planner** of a settled
  discussion. It asks the owner only through `fgos questions ask` (five-part form). `supervisor done` on an empty
  queue ends its own session.
- A **lead** (persona `lead`, confined) drives one plan's waves through `fgos run`, reviews each phase and lands it with
  **`fgos land`**, the one Rust landing door that replaces `land-branch.sh` and the hand census fix. The plan's
  footprint bounds what its runs may write and what its lands may carry.
- **Lanes** are worker seats pooled per machine (`workerSlots.ceiling`, global-only, armed at 4 when the work-item gate
  is retired, `fgos slots`), taken where a top-level worker seat starts. A lead, a head and a nested dispatch take none.

## Settled design and decisions

Settled by the owner (shaping report items 1-10): watcher/supervisor split, wake triggers, supervisor duties, lead
persona and grant, landing door, lane pool, portfolio = plan frontmatter only, planner door, observe kinds, Rust first.
Decided by the planner inside that frame (evidence-backed; say so if one is wrong):

| id | decision | ground |
|---|---|---|
| PS-1 | New area **Supervision** (`docs/platform/supervision/spec.md`) and one crate `packages/supervision/rust` (`fgos-supervision`): portfolio reader, event queue, watcher, wake door, supervisor verbs, discussion source, landing use case | a new product area gets a spec before code (L5 q2); one crate keeps one door per job; modules are file-disjoint so phases run in parallel |
| PS-2 | `fgos land` composes existing Git ports: Remote fetch, Land prepare (holds the target's merge slot, rank 20, across the gate), consumer gate on the candidate, Remote push of the candidate's pin ref, then Land publish (fast-forward of local main); retries 3 times when the remote moved. **No new `land` lock**: the merge slot already serialises | `packages/git/rust/src/land.rs:102` ("keeping this value alive keeps the target's rank-20 slot"); candidate pin ref `refs/fgos/git-operations/<id>/candidate` (`land.rs:733-735`); `RefMapping.source` must be a `refs/` name (`packages/git/rust/src/lib.rs:78-79`); one door (principle 1) |
| PS-3 | Land **merges**, it does not rebase | Git has no rebase port and adding one is a new mechanism (RUL104); existing plans' rollback assumes one merge commit per phase |
| PS-4 | Generated-file conflicts: a read-only `merge_tree` (`packages/git/rust/src/inspect.rs:1178`) names conflicted declared files; the first prepare declares the target side's bytes, regeneration runs in the candidate, and when its bytes differ the session is dropped and prepared again with a fresh operation id and the regenerated bytes at the same pinned target | a conflict outside `files` aborts and leaves no candidate (`land.rs:540-555`); one id with other `files` refuses `operation-id-reused` (`land.rs:351-366`); precedent `declareLandFiles` (`src/runner/merge.mjs:847-855`) |
| PS-5 | Gate and regeneration are project config (`land.gates: [{run, when?: [glob]}]`, `land.regenerate: {run, files}`), never fgOS-repo constants; an empty `land.gates` refuses `land-gate-missing`; a gate whose `run` holds `{tests}` receives `fgos land --test <path>...`. This repo's `land-branch.sh` list becomes its `.fgos/config.yaml` (phase 19) | mission #1 (D-ADR0035); precedent `runner.capabilities.<c>.verify` (`core/config-schema/runner.schema.yaml:489-495`); land-branch.sh lines 11, 19, 45-47 |
| PS-6 | `fgos land --paths <p>...` commits main-checkout edits of exact paths (ScopedCommit) after fast-forwarding to the fetched trunk, runs only the gates whose `when` matches the paths, and pushes: the one way a confined head's portfolio edit reaches `main`. Paths must lie inside the caller's grant writes | `fgos.plan.status` is read from git history (ops-metrics phase 11); confined heads cannot run git |
| PS-7 | Pre-commit census refusal applies only to commits made in the main checkout or with the trunk checked out; linked-worktree commits (branch or detached) pass and `fgos land` regenerates and gates the census. Retires p-t55xjys4u5 | `.githooks/pre-commit:424-455`; `fgos worktree create` defaults to detached (`src/cli/command-registry.mjs:128`) |
| PS-8 | One supervisor per project = the Identity role `head:supervisor-<project handle>` (handle from `fgos identity project`, cut to 32). A holder whose resolve answer names another `projectId` is never treated as this project's. The watcher tick takes a new repo lock `watcher`. No `supervisor` lock | the Identity directory is per OS user, shared by every project on the machine (`docs/platform/identity/spec.md` §5 "Local directory"); the resolve answer carries `projectId` (`packages/identity/rust/src/directory.rs:110`); a holder-lock is process-bound and an LLM session spans many processes |
| PS-9 | Delivery to a live supervisor = the queue. `supervisor done` refuses while unhandled events exist; on an empty queue it answers `{done:true}` and the request route stops the caller's own session (detached, after the reply). A live supervisor that leaves events unhandled for `watcher.stuckWakeLimit` ticks raises `supervisor-stuck` (notify) | no typed-input delivery into a mid-turn LLM pane; queue is Event Store truth (shaper round 4) |
| PS-10 | Long request verbs (`land`, `run`) answer at once with a ticket; `request result [<id>] [--wait]` reads the outcome (no id: the role's tickets). A `run` ticket keeps the `unitRunId` and reads the run's existing `.fgos/assignments/<unitRunId>/` record, never a copy | request verbs are bounded to 60 s and served one at a time (`head_request.rs:33,382`) |
| PS-11 | A head name is at most 32 chars (`head-start.mjs:21`): lead/planner name = the project handle cut to 8, `-`, the plan or discussion dir cut to fill 32; resolved back by unique prefix among plans that are not `done`/`withdrawn`. The limits live in `packages/supervision/contracts/plan-vocabulary.v1.json` (`headName`), read by Rust and Node. A collision is flagged by the portfolio reader and the supervisor asks instead of starting | plan dirs reach 43 chars (`261118-0947-session-verb-for-agent-sessions`); Convention `head-name` checks only the charset and 97 chars |
| PS-12 | Lane count = held machine-scope lane locks (`<lockRoot>/lane/<k>.lock`), taken by the run supervisor of a **top-level** worker seat before launch (bounded wait `workerSlots.laneWaitSec`), released with it. A head session and a nested dispatch (`FGOS_DISPATCH_DEPTH` > 0, `src/runner/dispatch/adapters.mjs:95-99`, set to depth+1 for every worker at `confinement/authority.mjs:763`) take none, so a seat that dispatches a child never waits on its own pool. The Work-item count of `worker-slots.mjs` and the `claimWork` gate are retired (L10); in the same change `workerSlots.ceiling` becomes `global-only` and its standard turns 4 | correctness from OS state (principle 5); `claimWork` reads the key today (`src/runner/claim-port.mjs:29-30,145`) and null means unarmed, so arming earlier would arm the old gate; lane locks are machine-wide (`state_root.rs:77`), so a per-project ceiling would split one pool unevenly (config spec §3 rule on machine keys) |
| PS-13 | The watcher's OS timer fires at `watcher.activeIntervalSec` (default 60; idle 900; both carried on the tick span as measure `fgos.watcher.interval`, which `watcher-overdue` compares against); a tick with no `watcher-active` row exits early until `watcher.idleIntervalSec` passed since the last full tick. `watcher.enabled` is global-only | timer schedules have one interval (`timer.rs:117-139`); config spec §3 rule on machine keys |
| PS-14 | Shaper grant gains writes `docs/discussions` and verb `land`; secretary, planner, supervisor, lead gain `land`. Only a lead may land a branch; every other persona lands `--paths` only | the `discussion-settled` trigger needs the marker on `main`; today a confined shaper writes nothing (`head-grants.mjs:26`) |
| PS-15 | The discussion source reads the `discussion: <state>` marker line in the head of `docs/discussions/*/DISCUSSION.md` and of `plans/reports/shaping-*.md`, from the trunk's git history, and emits `fgos.discussion.status` on each flip | both places carry the marker today (`docs/discussions/ops-metrics/DISCUSSION.md:3`, `plans/reports/shaping-261118-1045-supervisor-owner-questions.md:3`) |
| PS-16 | Verb names follow the session-verb plan: grants and skills use `session start|stop|rotate`, not `head ...` | that plan (a blocker) renames `fgos head` to `fgos session` in `head-grants.mjs` and the request contract |
| PS-17 | The lead's grant also holds the request verb `worktree create` (existing `fgos worktree create`, `--branch` required), since `fgos run --writes` needs a linked worktree and a confined head cannot create one | settled design item 4 names worktree create; `src/cli/command-registry.mjs:125-130` |
| PS-18 | The lane ceiling reaches the seat-start gate as an envelope field `lanes: {ceiling, waitMs}` written by the Node launchers only for a top-level seat; an adopted worker domain takes a lane in `adopt.rs` so `live` never undercounts | the run supervisor reads no config (`packages/run-supervisor/rust/Cargo.toml`); envelopes are built at `assignment-runner.mjs:1086` and `direct-launch.mjs:209` |
| PS-19 | **Gates run branch code unconfined, as the owner.** `fgos land` runs `land.gates` with `sh -c` in the candidate worktree outside any sandbox. The trust boundary is review: a lead lands only a phase its reviewer passed, and gate commands come from the trusted main checkout's config (as `verify`). Written in the supervision spec and the land phase; confined gates are a separate backlog row | p-dkkodseo63 is why gates leave the sandbox; red team D2 recommendation (a), decided without an owner question per AGENTS.md priority 2 |
| PS-20 | A confined caller reaches every new socket verb through one door: the host hands a confined (`FGOS_CONFINED=1`) call of a verb named in `head-request.v1.json` to the Node payload, whose one arm sends it through `requestHead` | today each verb has its own confined branch (`bin/fgos.mjs:3473-3487`, `src/session-host/head-request.mjs:20,32-48`); native verbs never reach Node otherwise |
| PS-21 | Detection survives late commits, other machines and lost state: each full tick fetches the trunk; edge definitions run `--since lastTick - watcher.lookbackSec`, and a missing state uses `now - lookbackSec`; the Event Store queue dedupes by stable id; level definitions (`plan-ready-waiting`) raise the current state once per status commit | edge-only windows lose a branch commit with an older time (red team H2); ops-metrics source ids are deterministic per commit (its phase 11 step 2), so overlap costs nothing |
| PS-22 | Pace definitions live in `core/watcher/pace/` and are never raised: the tick reads `watcher-active` for pace; doctor row `supervision-pace` runs `watcher-overdue` and `supervisor-idle-burn` read-only | a pace row in the raised set would wake the supervisor every tick (red team H3); a stopped watcher cannot report itself, so doctor does |
| PS-23 | One planner starter per settled discussion: the supervisor, on `discussion-settled`, unless a plan's `source` already names the discussion or a planner head for it is live. The secretary hands a settled discussion over (reports it) instead of starting a planner | Round 8 keeps the trigger as the long-term mechanism; two starters write two plans (validator M10, red team M5) |
| PS-24 | **Owner answer Q1 = (A), 2026-11-18.** The lead's sandbox writes only its plan dir; the plan's footprint, read from the trunk tip, bounds `run --writes` and the branch diff of `land` (refused `land-outside-footprint`) and is passed as `LandRequest.footprint`; a lead's `land --paths` that changes its own `footprint` is refused | footprint as sandbox writes can name `.`, `.git`, `.githooks` (`validateWorkspacePaths`, `src/runner/dispatch/confinement/workspace-paths.mjs:18-34`, denies only absolute, `..`, `.fgos` and globs) and dirties the main checkout, which makes the lead's own lands refuse `main-checkout-dirty-mid-merge` (`land.rs:262-271`) |

**Planner changes to the draft input.** (1) `blockedBy` adds `261115-2328-execution-read-door` and
`261118-1159-owner-question-store` (both write `main.rs`, `routing.rs`, `observe_declarations.rs`, the command
registry and contracts, the doctor registry, skills and CHANGELOG). (2) PS-15 to PS-24 added. (3) Round 8 moved the
shaper brief template fix to the secretary, so phase 18 does not edit `fgos-shaping`. (4) `base` moved to the plan's commit.

**Where the planner's decisions differ from the settled wording, and why (reported, not asked).** The settled design
says the landing door "holds holder-lock `land`" and "rebases". PS-2 keeps the intent (landings are serialized) through
the Git Land port's existing rank-20 merge slot instead of a second lock, and PS-3 merges instead of rebasing because
Git has no rebase port (RUL104). The settled "holder-lock, one per project" for the supervisor becomes the Identity role
(PS-8), since a holder-lock is bound to one process. Item 3 says the supervisor "never lands"; it lands portfolio edits
with `land --paths` only (PS-6, PS-14), never code. If a linear `main` is wanted, the Land port's `squash` flag gives
it without new code. Item 4 ("the plan's footprint as writes") was amended by the owner's answer to Q1 (A, PS-24). Phase 17
touches the Work layer only to delete the work-item slot count that `workerSlots.ceiling` no longer means (L10).

## Acceptance criteria

1. `cargo test -p fgos-supervision` green: portfolio order and admissibility, event raised once and handled, watcher
   pace, fetch and per-kind actions, wake starts or skips, land merge/regenerate/gate/push-then-publish/retry/footprint
   on a fixture remote.
2. `cargo test -p fgos-run-supervisor --test lanes` green: a top-level worker seat past the ceiling waits, then ends
   `abandoned-not-started` with `lane-pool-full`; a session attempt and a nested seat take no lane; a killed supervisor
   frees its lane.
3. `npm run fgos:dev -- slots --json` reports `{lanes:{ceiling,live,free,seats}}`;
   `rg -n "countWorkerSlots|hasWorkerSlotRoom" src bin test` finds nothing.
4. Each definition in `core/watcher/definitions/` and `core/watcher/pace/` gives exactly one row on its fixture and the
   same `ts` on a re-run (`cargo test -p fgos-supervision --test definitions`).
5. `npm run fgos:dev -- doctor --json` has rows `watcher-timer`, `supervisor-events-unhandled`, `supervision-pace` and
   `land-gates-configured`; `cargo test -p fgos-distribution timer` renders the watcher unit on Linux and macOS.
6. `apps/fgos/tests/supervision_verbs.rs` drives `watcher tick`, `supervisor wake|plans|queue|handled|done` and `land`
   once each through the host.
7. `test/session-host/head-request.test.mjs` proves a ticket verb answers at once, `request result` returns the
   outcome, a confined caller of each new verb goes through the socket, and `supervisor done` stops its caller;
   `test/session-host/head-start.test.mjs` (owner of `grantOf`) proves the new personas' writes and verbs.
8. Live (integration phase report): on the main checkout, with the combined tree built, staged and activated, a
   throwaway `ready` plan is admitted, its lead lands one phase with `fgos land`, the plan reaches `done` with a board
   line, and no person typed a command after `ready`.
9. `rg -n "land-branch" core domains docs/platform src` finds nothing and the script is deleted from the main checkout's
   `.fgos/runtime/tmp/`.
10. `npm test` and `cargo test --workspace` green on the combined tree; `cargo clippy --workspace -- -D warnings`;
    msvc and `aarch64-apple-darwin` compile checks; `node scripts/plan-contract-check.mjs --plan plans/261118-1045-project-supervisor` ok.

## Non-goals

- The Work layer (no work items read; `fgos ready`/`schedule` untouched) beyond retiring the slot count it no longer owns.
- External UI integration and the six ports (plan `261118-1117-external-ui-integration-multica`).
- Defining liveness detections `head-gone`, `plan-no-progress` (ops-metrics phase 14) and `question-answered` (owner
  question store); this plan only runs them.
- Notifier channels beyond the mailbox; automatic code review beyond the lead's brief; a rebase port in Git.
- Moving `landRunnerItem` (`src/runner/merge.mjs:870`) onto the landing use case: phase 19 opens a backlog row (L10 debt named, not hidden).
- Cross-machine supervision of one project: the watcher is enabled per machine (PS-13); `running` committed on `main`
  is the only cross-machine claim. Windows has no timer scheduler: supervision does not run there and the
  `watcher-timer` row says so.

**Handoffs (2026-11-18, agreed with the owner-questions shaper, recorded in its DISCUSSION.md on `shape/owner-questions`).**
The question plan owns the kinds `fgos.question.asked|answered` and the definition `question-answered`. The answered
event carries ref = question id and the attributes asker role + session id, persona, origin ref and `answeredAt`. The
pane key is not used. The question plan adds no action row: this plan's watcher runs the definition with the default
`wake-supervisor`. A live asker that is busy sees the answer through its own hooks at its next safe point. For an
asker that is idle or gone, the supervisor stops the idle holder (`session stop`), starts a successor
(`session start`), and the successor writes the answer back to the place where the question was asked. The skill
(phase 18) carries this rule. The watcher never types into a pane, and nothing here uses the mailbox (it is deferred).

**Handoff update (2026-11-18, agreed with plan `261118-1159-owner-question-store`).** The definition file is
`core/questions/definitions/question-answered.query.json`; `core/questions/definitions` is in the standard
`watcher.definitions` list (phase 4). Its event attrs are asker role, session id, handle, persona, origin ref,
`answeredAt` and an optional pane. That plan adds kind `fgos.question.cancelled`; ack and cancel are authorized by
role, with no `--for` flag (see handoff update 3). The supervisor passes the question id into the successor's start
(`session start ... --for-question <id>`, carried into its opening) only so the successor knows which question it
continues (phases 10, 12, 16, 18). The owner question verb is bare `fgos questions` (the `--open` flag is gone); the supervisor asks through
`fgos questions ask`.

**Handoff update 2 (2026-11-18, owner-question plan after its red team, 3300fcc1b).** A successor that the supervisor
starts for a gone asker is started under the asker's own `head:` role (`session start <persona> --name <name>` with
the asker's persona and name, so `head:<persona>-<name>` is the same role). **Handoff update 3 (2026-11-18, the
question plan's hand-off note, `plans/261118-1159-owner-question-store/reports/handoff-to-supervisor-plan.md`):**
there is no `answers:<question id>` role, because Identity accepts only `lead:`, `work:` and `head:` roles. Only
these may ack or cancel (the question spec's QP-4): the asker session, any session holding the same `head:` role, and
any head for a question whose asker held no `head:` role or which is `migrated`. The supervisor itself never acks or
cancels. The question store is an Event Store consumer `questions` (synced across machines), and
`question-answered` anti-joins `fgos.question.acked`, so an answer that was already taken never wakes the supervisor.
Heads ask, ack and cancel through the head-request verbs `questions ask|ack|cancel` that the question plan adds to
`head_request.rs`, `head-request.v1.json` and `head-grants.mjs`. Phases 9 and 10 edit those files after that plan
lands and keep its verbs.

## Leader rules (every phase)

- Step 0 re-greps every input: this plan was written on `base` before its blocking plans finished; a finding
  that changes a decision above stops the phase with `NEEDS_CONTEXT`.
- New code is Rust (owner 2026-11-18); a Node side stays a thin caller. Landed Node code is edited, not ported.
- One owning proof per behaviour at the lowest layer; the host gets one wiring proof per verb. A retired mechanism
  retires its tests in the same phase and names the test that now owns the behaviour (principle 8).
- Generated files (command manifest/routes, skill renders, census) are regenerated, never hand-merged.
- Config keys only through `core/config-standard` + `core/config-schema`; doctor rows only through
  `packages/distribution/contracts/doctor-registry.v1.json`.
- No plan ids or phase numbers in code comments, test names or commit messages.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Supervision area spec](phase-01-supervision-spec.md) | - | docs/platform/supervision/**, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/reading-map.md | 1 | done |
| 2 | [Spike: start a head from the timer environment](phase-02-spike-timer-head-start.md) | - | plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md | 1 | done |
| 3 | [Crate scaffold, portfolio reader, contracts](phase-03-crate-and-portfolio-reader.md) | - | Cargo.toml, Cargo.lock, package.json, packages/supervision/rust/Cargo.toml, packages/supervision/rust/src/**, packages/supervision/rust/tests/portfolio.rs, packages/supervision/contracts/**, packages/supervision/rust/observe-kinds.json, packages/event-store/contracts/consumers.v1.json, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | done |
| 4 | [Config keys: watcher, supervisor, land, lane wait](phase-04-config-keys.md) | - | core/config-standard/watcher.yaml, core/config-standard/supervisor.yaml, core/config-standard/land.yaml, core/config-standard/workerSlots.yaml, core/config-schema/watcher.schema.yaml, core/config-schema/supervisor.schema.yaml, core/config-schema/land.schema.yaml, core/config-schema/workerSlots.schema.yaml, packages/config/** | 1 | done |
| 5 | [Census refusal only in the main checkout or on the trunk](phase-05-census-hook-trunk-only.md) | - | .githooks/pre-commit, test/githooks/census-drift.test.mjs | 1 | done |
| 6 | [Lane pool at top-level worker seat start](phase-06-lane-pool.md) | 4 | packages/run-supervisor/rust/src/lanes.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/src/lib.rs, packages/run-supervisor/rust/src/adopt.rs, packages/run-supervisor/rust/tests/lanes.rs, packages/run-supervisor/rust/tests/envelope_digest_vectors.rs, packages/run-supervisor/contracts/envelope.v3.json, src/runner/dispatch/assignment-runner.mjs, src/run-supervisor/direct-launch.mjs, test/run-supervisor/direct-cutover.test.mjs, test/run-supervisor/contracts.test.mjs, packages/holder-lock/contracts/lock-registry.v1.json, docs/platform/holder-lock/spec.md, docs/platform/run-supervisor/spec.md | 2 | done |
| 7a | [Git: push inside a Land session, main-checkout catch-up](phase-07a-git-land-push-and-catch-up.md) | - | packages/git/rust/src/refs.rs, packages/git/rust/src/remote.rs, packages/git/rust/src/land.rs, packages/git/rust/tests/*land*, docs/platform/git/spec.md | 2 | ready |
| 7 | [Landing use case](phase-07-landing-use-case.md) | 3, 4, 7a | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 3 | ready |
| 8 | [Event queue in the Event Store](phase-08-event-queue.md) | 3 | packages/supervision/rust/src/queue.rs, packages/supervision/rust/tests/queue.rs | 2 | done |
| 10 | [Request transport: confined door, ticket verbs, session stop](phase-10-request-transport.md) | 3 | packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request*.rs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, src/session-host/head-stop.mjs, src/session-host/head-plan.mjs, src/session-host/head-start.mjs, test/session-host/head-request.test.mjs, test/session-host/head-stop.test.mjs, test/session-host/head-plan.test.mjs, docs/platform/session-host/spec.md | 2 | ready |
| 13 | [Trigger and pace definitions](phase-13-trigger-definitions.md) | 3, 4 | core/watcher/**, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/** | 2 | ready |
| 13b | [Watcher definitions on the extended query grammar](phase-13b-definitions-on-new-grammar.md) | 13 | core/watcher/**, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/** | 3 | ready |
| 9 | [Personas and grants](phase-09-personas-and-grants.md) | 3, 10 | src/session-host/head-grants.mjs, src/session-host/head-start.mjs, test/session-host/head-start.test.mjs, core/agents/supervisor.yaml, core/agents/lead.yaml, core/agents/planner.yaml, .claude/agents/** | 3 | ready |
| 11 | [Watcher tick and mailbox notifier](phase-11-watcher-tick.md) | 3, 4, 6, 8, 13, 13b | packages/supervision/rust/src/watcher.rs, packages/supervision/rust/src/notify.rs, packages/supervision/rust/tests/watcher.rs | 4 | ready |
| 12 | [Wake door and supervisor verbs](phase-12-wake-and-supervisor-verbs.md) | 2, 3, 8, 10 | packages/supervision/rust/src/wake.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/wake.rs | 3 | ready |
| 14 | [Discussion status source](phase-14-discussion-source.md) | 3 | packages/supervision/rust/src/discussion_source.rs, packages/supervision/rust/tests/discussion_source.rs | 3 | ready |
| 15 | [Watcher timer schedule and doctor row](phase-15-watcher-timer.md) | 2, 4 | packages/distribution/rust/src/timer.rs, apps/fgos/src/wiring/uninstall.rs, apps/fgos/src/wiring/doctor/mailbox.rs, apps/fgos/src/wiring/doctor/mod.rs, packages/distribution/contracts/doctor-registry.v1.json, docs/platform/packaging-distribution/spec.md, docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, test/setup/registrations.test.mjs | 3 | ready |
| 16 | [Host wiring of the new verbs](phase-16-host-wiring.md) | 6, 7, 8, 10, 11, 12, 13, 14, 15 | apps/fgos/Cargo.toml, Cargo.lock, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/doctor/supervision.rs, apps/fgos/src/wiring/doctor/mod.rs, apps/fgos/tests/supervision_verbs.rs, packages/distribution/contracts/doctor-registry.v1.json, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, apps/fgos/src/cli_projector.rs, apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/web/src/api/types.ts, docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml, bin/fgos.mjs, test/cli/** | 5 | ready |
| 17 | [Retire the work-item slot count, arm the lane pool](phase-17-retire-work-item-slots.md) | 16 | src/state/worker-slots.mjs, src/runner/claim-port.mjs, src/runner/loop.mjs, src/runner/fanout-batch.mjs, src/setup/**, core/config-standard/workerSlots.yaml, core/config-schema/workerSlots.schema.yaml, packages/config/contracts/fixtures/**, packages/distribution/contracts/doctor-registry.v1.json, docs/platform/component-boundary.md, docs/platform/packaging-distribution/spec.md, test/suite-baseline.json, test/state/worker-slots.test.mjs, test/state/report-verb.test.mjs, test/state/gate-bypass.test.mjs, test/event-store/v-auth-01.test.mjs, test/runner/claim-port.test.mjs, test/runner/claim-capacity-race.test.mjs, test/runner/loop.test.mjs, test/runner/dispatch.test.mjs, test/setup/checks-doctor-config.test.mjs, test/architecture.test.mjs, docs/architecture-manifest.json | 6 | ready |
| 18 | [Skills: supervisor, lead, planner no-item path, secretary handoff](phase-18-skills.md) | 9, 16 | core/skills/fgos-supervisor/**, core/skills/fgos-lead/**, core/skills/fgos-secretary/**, core/skills/fgos-fanout/**, core/task-specs/fgos-fanout.md, core/agents/supervisor.yaml, core/agents/lead.yaml, .claude/agents/**, domains/coding/skills/fgos-coding-planning/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/** | 6 | ready |
| 19 | [Integration, live run and full gate](phase-19-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 | CHANGELOG.md, docs/backlog.md, docs/platform/supervision/spec.md, docs/reading-map.md, .fgos/config.yaml, packages/git/contracts/mutation-census.v1.json, plans/261118-1045-project-supervisor/reports/integration.md | 7 | ready |

Q1 is answered (A), so every phase is `ready`
inside the plan's frame and may start once the plan's blockers are `done`.

**Ops-metrics waits** (its 16-phase table): phase 3 kinds file → ops 1; phase 10 `retired` signal → ops 11; phase 11 →
ops 4, 7, 14 (runs ops 14 definitions); phase 12 → ops 4; phase 13 → ops 5, 7, 8, 11; phase 14 → ops 1, 5; phase 16 →
ops 1, 7, 11 (`observe_declarations.rs`, `metrics_sources.rs`). Phases 1, 2, 4-9, 15 need nothing from ops-metrics.
**Owner-question-store waits:** phase 4 (definition dir), 10 and 12 (`--for` successor), 16 (shared host files), 18
(`fgos questions` verbs). All land before this plan is `ready` (blockedBy).

**Contract reading check (planner).** Every phase sits in a later wave than each dependency (9 moved to wave 3 because
it imports phase 10's plan resolver; 13 moved to wave 2, it needs only 3 and 4). Disjoint per wave: wave 1 docs /
report / crate+contracts+package.json / config / hook; wave 2 run-supervisor lanes+supervise+launchers vs
head_request+session-host files vs supervision `land.rs`, `queue.rs` vs `core/watcher`; wave 3 `head-grants.mjs`+
`head-start.mjs` vs four supervision module files vs distribution+doctor mailbox; waves 4-6 single or disjoint.
**Hot files, one writer per wave:** `Cargo.lock` 3 then 16; `doctor-registry.v1.json` 15, 16, 17; `doctor/mod.rs` 15 then 16; `head-start.mjs` 10
then 9; `packaging-distribution/spec.md` 15 then 17; `component-boundary.md` 1 then 17; `workerSlots` config files and
`packages/config/**` 4 then 17; `command-registry.mjs`, `bin/fgos.mjs` and generated command contracts 16 only; skill
renders 18 only, agent renders and `core/agents/{supervisor,lead}.yaml` 9 then 18; `docs/platform/supervision/spec.md`
and `docs/reading-map.md` 1 then 19; census, CHANGELOG, backlog and `.fgos/config.yaml` 19 only. `packages/supervision/rust/src/lib.rs` is written
once by 3 (declares every module) and never again. Checked by `node scripts/plan-contract-check.mjs --plan`.

## Owner questions

None open. Q1 (the lead's write grant) was answered by the owner on 2026-11-18: **(A)**. The lead's sandbox writes
only its plan dir; the plan's footprint, read from the trunk tip, bounds `run --writes` and `land` (PS-24). This
amends settled item 4 for the lead only.

Q2 (phase 7: Git refuses a push while the session's own Land chain holds the target, and refuses to fast-forward the
main checkout to the remote tip) was answered by the owner on 2026-11-18: **(A)**
(`reports/decision-261118-1431-p07-land-push-order.md`). A new phase 7a adds two narrow Git doors: a push of the Land's
own candidate from inside its session, and a main-checkout catch-up that is clean and fast-forward only. Phase 7 then
re-runs unchanged. No other path is exempted from `main-checkout-fast-forward-refused`. Phase 7a lands only after a
named Git reviewer has reviewed it. The owner reopened lead:OPC (`claude-36tm`) as this plan's Git reviewer on
2026-11-18, until the plan is done; send it every 7a diff and land gate.

**Approval.** Owner-approved 2026-11-18. The status stays `draft` until every `blockedBy` plan is `done`; then it turns
`ready` with no other change.

## Risks and rollback

- **A head cannot be started from a timer, or dies when the tick's unit exits** (no terminal in a systemd/launchd
  service; `Type=oneshot` with the default `KillMode=control-group`, `timer.rs:350-356`). Phase 2 proves the
  environment and that a head survives the unit by 2 minutes before phase 15 renders it (`KillMode=process` or a
  `systemd-run --user --scope` start, whichever the spike proves); if nothing works, the wake door notifies and the
  spike result becomes an owner question.
- **Land publishes into a main checkout with unrelated dirty edits.** Land passes the plan footprint as
  `LandRequest.footprint`, so only overlapping dirty paths refuse (`land.rs:262-271`); phase 7 tests both cases.
- **A land killed mid-way** leaves WAL intent; the next land passes `land-recovery-required` through and names
  `fgos git recover` (`apps/fgos/src/wiring/git_incidents.rs:71`, `land.rs:1145`); phase 7 tests it.
- **Lane locks leak on a crash.** A holder-lock dies with its process (principle 5); phase 6 proves a killed supervisor
  frees its lane.
- **Arming `workerSlots.ceiling: 4`** changes running projects; it happens only in phase 17 with the old gate's
  removal, the CHANGELOG line names it, and `fgos config set --global workerSlots.ceiling` raises it.
- **Footprint overlap with ops-metrics, session-verb, read-door, secretary spine and the owner-question store**
  (CHANGELOG, doctor registry, command registry and routes, `routing.rs`, `main.rs`, `observe_declarations.rs`,
  skills, `src/session-host`, `apps/fgos/src/wiring`): this plan turns `ready` only after all five blockers are `done`;
  the check does not read `blockedBy`.
- **Event Store queue growth.** The stream is read whole and never compacted (phase 8); with pace rows never raised
  (PS-22) and stable ids, growth is one row per real event. A measure that says otherwise opens an item.
- **Rollback.** Each phase lands as one merge commit; revert in reverse wave order. Reverting 16 removes the verbs
  while the crate stays inert (set `watcher.enabled` false first); reverting 17 needs 16 present; the timer of phase 15
  is removed by `fgos doctor --fix` once `watcher.enabled` is false. To land a fixed branch after a revert, revert the
  revert first: the Land port reports `land-already-merged` for the old commits.

## Prior art: reused / missing

Reused: OS timer schedule template and doctor rows (`timer.rs`, `doctor/mailbox.rs`); Git Land/Remote/ScopedCommit
ports, `merge_tree`, `diff`, the merge slot, the candidate pin ref and `fgos git recover`; Land declared files (as
`landRunnerItem`); head start, grants, request socket, `requestHead` and Identity role uniqueness (secretary plan);
process identity for ticket liveness (`src/native/process-identity.mjs`); `workerSlots.ceiling` key and `fgos slots`
verb; `FGOS_DISPATCH_DEPTH` to tell a nested seat; Event Store consumer registration (mailbox as template); Observe
write door, `metrics query --def`, kinds declaration (ops-metrics); `question-answered` (owner question store);
plan-contract vocabulary; the parked `plan-supervisor` prototype (`origin/plan-supervisor-prototype`, unmerged: lanes
by priority, no-LLM watchdog timer) and the hand brief `.fgos/runtime/tmp/supervisor-brief-secretary-plan.md`, both
folded into the lead skill. Missing and added: watcher process, wake door, event queue, landing door, lane locks,
supervisor/lead personas and skills, discussion status source, ticket request verbs, `session stop`, the confined
routing rule (PS-20).
