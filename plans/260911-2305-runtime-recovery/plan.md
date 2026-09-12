# Runtime Recovery Implementation Plan

**Status:** CLI/HERDR/CONFINEMENT DESIGN READY — A01-A08 are closed; P02L
`cli-spawn` is technically ready after Astra re-review; P02H `herdr-spawn` is
architecture-ready with the explicit Herdr worker-command seam required.
Implementation handoff remains on human hold; do not call code panel yet.

**Architecture lock:** [architecture-decision-lock.md](architecture-decision-lock.md)

**Detailed design:** [detailed-design.md](detailed-design.md)  
**Design review/red-team:** [detailed-design-review.md](detailed-design-review.md)

**Concrete next steps:** [next-steps.md](next-steps.md)

**Implementation contracts:** [implementation-contract-catalog.md](implementation-contract-catalog.md)

The phase list below is the implementation decomposition. P06 and P07 are
long-horizon capability designs, not enabled first-profile work. Their
implementation must preserve disabled/refused outcomes until external proofs
and their own closeout pass.

## Objective

Ship the smallest Node-first runtime-recovery profile that can recover an
interrupted Assignment without duplicate admission or duplicate executor
resource, starting with the default `cli-spawn` adapter.
Preserve current CoordinationSession authority, replay, quorum and legacy
dispatch behavior unless a slice explicitly names a behavior change.

## Non-goals

- No rewrite of Agent Coordination or introduction of a fourth authority.
- No same-workspace writable takeover in the first profile.
- No terminal-parent transfer; CP §6 already refuses it in the first profile.
- No generic health store, distributed lease, checkpoint framework or effect
  ledger.
- No Rust writer until Node parity and recovery proofs are complete.

## Critical Path

```text
S0 freeze -> S1 Run admission/fencing -> S2L cli-spawn reconciliation
                                      |-> S2H Herdr reconciliation (B04)
                                      |-> S3 fallback/effect boundary
                                      |-> S4 read evaluator/planner
engine backlog ------------------------------------------------> S5 continuation
```

S3 and S4 may be planned in parallel after S1, but neither may advertise
automatic recovery for an adapter without its launch/reconciliation profile.

## Code-Panel Orchestration

This track is design-first. The earlier A01-A08 review passed. The P02L
default `cli-spawn` delta was refined through independent review and is now
technically ready. P02H is architecturally ready with one explicit implementation
seam: Herdr must start the Authority-prepared worker command. The coordinator
must not dispatch implementation until the person lifts the handoff hold.
Afterward it may dispatch only cells whose dependencies, status and external
gates are satisfied. P00 is documentation/baseline work only.

Every implementation cell is dispatched as one `fgos-code-panel` request. The
panel receives only the cell brief, its leased files, acceptance tests and
dependency artifacts; it must not rely on this chat history. Each panel returns
an implementation commit, focused test output, reviewer findings and red-team
findings. A cell is mergeable only when its reviewer and red-team are both
green, or the cell explicitly records a typed non-blocking residual.

Shared-file rule: no parallel cells may edit the same file. A later integration
cell owns files that combine earlier outputs. Each parallel wave is followed by
a read-only integration/recheck panel before the next wave.

### Waves

| Wave | Cells | Parallelism | Join gate |
|---|---|---|---|
| W0 | P00 baseline freeze | sequential | S0 fixtures and focused tests green |
| W1 | P01 Run admission/fencing; P04 read-side evaluator extraction | parallel, disjoint leases | both panels green; no shared-file conflict |
| W2 | Shared Authority seam + P02L default `cli-spawn` reconciliation | sequential after P01 | prepared invocation contract + parent-crash/binding/output/F-b/F-f pass |
| W3 | P02H Herdr bwrap reconciliation | sequential extension after shared seam/P02L | Herdr worker-command seam; observe/park proof; replacement stays gated |
| W4 | P03 fallback/effect boundary; P05 standalone recovery | parallel after prerequisites | focused tests green; no lease overlap |
| W5 | P05S session recovery integration | sequential after P01/P04/P05 | C-f, stale apply and driver rules pass |
| W6 | P06 writable profile; P07 continuation | independent capability-gated cells | each remains disabled until its own external gate passes |
| W7 | P08 conservative core regression/capability matrix | sequential after P00-P05S | npm test + docs/doctor audit; P06/P07 reported disabled unless separately closed |

P03 may implement pure pre-delivery logic before P02L, but public automatic
recovery is gated per adapter profile. P06 and P07 must never be
started merely because their schemas compile.

### Cell Brief Contract

The machine-readable cell manifest is
[`code-panel-cells.json`](code-panel-cells.json). Each panel prompt must include:

```text
Cell: <id>
Objective: one concrete behavior
Read first: plan.md, phase brief, named specs
Leased files: exact paths; do not edit outside them
Dependencies: completed cell ids and artifact paths
Acceptance: executable scenarios and expected typed outcomes
Non-goals: capabilities explicitly forbidden in this cell
Proof: focused tests, reviewer report, red-team report
Handoff: commit, changed symbols, residual risks, next cell
```

The coordinator reads repository state and panel artifacts after each cell; it
does not trust the panel's narration as proof. A failed cell is fixed in a new
code-panel round against the same lease, never patched by an unrelated cell.

The completion checklist is
[`requirements-traceability.md`](requirements-traceability.md); no capability is
advertised while its row is still `open`, `disabled` or blocked by a dependency.

## Slice Plan

### S0 — Freeze Existing Behavior

**Owner:** runner/coordination maintainers.

Capture fixtures for current retry matrix, blocked/paused-limit mapping, Herdr
resend-until-ack, close-after-steps, lock reclaim and result fencing. Record the
known behavior as baseline; do not silently change it in this slice.

**Exit evidence:** baseline Node suites green; fixtures can reproduce BL1 and
the current blocked/paused-limit behavior; no new recovery capability enabled.

### S1 — Run Admission And Fencing

**Owner:** `assignment-runner`, Run store/replay, lock module.

Add versioned Run admission, exact retry identity (`retryId`, predecessor and
destination Run ids, payload digest), strict result fencing and append-only
generation/token control. Keep admission and settlement ownership in Run; do not add
a recovery manager.

**Exit evidence:** concurrent admission has one winner; every pre-launch crash
window resumes or refuses deterministically; stale result cannot become current;
SIGKILL/release races do not delete a successor generation.

### S2 — Adapter-Profiled Launch Reconciliation

**Owner:** adapter lifecycle + RunHandle guard.

Shared Confinement Authority handoff for both adapters is defined in
[phase-designs/confinement-adapter-contract.md](phase-designs/confinement-adapter-contract.md).

P02L covers default `cli-spawn` using the canonical local contract in
[`phase-designs/cli-spawn-local-contract.md`](phase-designs/cli-spawn-local-contract.md).
It uses a Node supervisor that self-publishes process incarnation, durable
protected stdout/stderr capture and a protected immutable adapter receipt while executing
exactly the Confinement Authority-prepared launch envelope. The controller
persists evaluator baseline before launch and alone collects the receipt into
command outcome and Run settlement. P02H uses the same Confinement Authority/bwrap prepared invocation as P02L,
and implementation must add or prove the Herdr worker-command seam so Herdr
starts that prepared command inside its pane. A deterministic Herdr
agent name derived from `runId` is only a lookup aid. `agentSession` remains
conversation correlation; control requires adapter-proven resource incarnation.
Before any replacement launch, reconcile by launch identity; absent locator is
never proof of absent resource.

**Required tests:** retry-name collision; gateway restart; same conversation in
a new worker process; same `runId` with different resource incarnation;
crash between create and locator persistence; closed-resource no-resurrection;
F-b live-worker observe/conditional reattach; F-f no duplicate spawn.

**Capability boundary:** reattach/observe/reconcile, material capture after
quiescence, and read-only/isolated takeover only. Shared writable takeover
returns `workspace-authority-unavailable` until a workspace-grant issuer and
lineage-aware evaluator exist.

### S3 — Fallback And Effect Boundary

**Owner:** recovery resolver, DispatchPlan/compiler, confinement adapter.

Fallback candidates preserve original governance and enter the compiler through
scoped fallback provenance. `repeatMode` is explicit in review/red-team YAML.
Read-only effect scope derives provider allowlist from executor `DispatchPlan`;
unlisted sinks park unless their repeatability is declared and proven.

**Exit evidence:** pre-delivery fallback works. Post-delivery network allow,
undeclared sinks and unsupported filtered confinement all park. Provider-only
eligibility is advertised only after an adapter supplies positive filtered
coverage. Compiler mismatch remains park until scoped provenance compiles.

### S4 — Read Evaluators, Planner And Show

**Owner:** Coordination engine/read-model maintainers.

P04 extracts pure legal-next, authorization, visibility and completion
evaluators without touching write doors. P05 adds standalone Run planning/apply;
P05S later integrates the evaluator with CoordinationSession write doors.
Apply echoes expected snapshot, control epoch and single-use action key and
never unconditionally closes.

**Exit evidence:** planner is pure and deterministic; stale plans are refused;
schema-1 flows retain behavior; fresh driver without a replacement grant gets
typed `needs-input`.

### S5 — Continuation And Transfer (Deferred)

**Owner:** Coordination engine/store/replay.

CP §6 already refuses transfer from terminal parents. Implement one
protocol-declared prepared/gated-child/committed transfer with fresh authority,
single-use grant and exact replay semantics. Add `driver-replaced` only with
current operator authorization, provenance and anti-replay invocation key.

**Entry conditions:** engine backlog `tsk-5qj`, `tsk-40j`,
`tsk-296`, `tsk-1zu` addressed as applicable; S1-S4 proof suites green.

## Cell File Leases And Detailed Briefs

| Cell | Primary lease | Test lease | Must not touch |
|---|---|---|---|
| P00 | `plans/260911-2305-runtime-recovery/phase-00-freeze-existing-behavior.md`, phase report | existing focused suites only | source behavior |
| P01 | Assignment runner/Run lock plus coordination store/schema/replay/session retry caller | admission, exact-retry and control-token tests | Herdr policy, continuation semantics |
| P02L | Assignment runner/CLI/transport, Confinement Authority, local supervisor and visibility binding | cli-spawn parity/crash/reconciliation tests | Run admission semantics, Herdr behavior |
| P02H | Herdr round/transport/adapter, Confinement Authority prepared invocation, Authority hardgate and visibility binding | Herdr spawn/reconciliation/confinement tests | Run admission, local supervisor implementation details |
| P03 | `src/runner/dispatch/recovery.mjs`, `liveness.mjs`, `assignment-policy.mjs`, compiler policy seam | fallback/effect tests | Herdr resource lifecycle, continuation |
| P04 | new pure evaluator module | coordination read/evaluator tests | all existing write doors |
| P05 | `bin/fgos.mjs`, dispatch show/recover verbs and planner | dispatch/show/recovery recommendation tests | session store/events |
| P05S | `bin/fgos.mjs`, coordination recover verb, store/session-engine integration | coordination recovery/C-f tests | standalone Run admission, Herdr adapter |
| P06 | `confinement/authority.mjs`, operation recovery/evidence evaluator, workspace grant adapter | material/workspace/effect tests | terminal transfer, Rust |
| P07 | coordination schema/store/replay/session-engine continuation doors, protocol loader | continuation/replay tests | Herdr implementation, fallback policy |
| P08 | docs/setup/doctor and integration test manifests | full suite and capability matrix | new behavior beyond accepted residuals |

P01 and P04 are parallel because P04 creates/tests only the pure evaluator
module and never edits existing write doors. P05S owns their later session-door
integration. P02L consumes P01's committed identity/control contract; P02H
then consumes the adapter-neutral lifecycle proven by P02L.

## Panel Prompts By Cell

### P01 — Run Admission/Fencing

Implement one Assignment-owned Run identity path: atomic admission, schema-2
exact retry declaration, and separate per-Run control epoch/token. Preserve
schema-1 callers. Prove declaration/publication crash recovery, distinct
same-Run acquisitions, stale-token refusal and dead/live holder distinctions.

### P02L — Default CLI Spawn Reconciliation

Wrap only Assignment-owned `cli-spawn` in the local supervisor. Persist a
Confinement Authority launch envelope before submission; use a worker process
group distinct from the supervisor; persist incarnation, protected stdout/stderr capture and an immutable
adapter receipt. Only the current controller collects command outcome and
settles. Keep existing timeout/maxBuffer/chunking behavior. Pending without
binding parks rather than spawning again. Legacy ad-hoc dispatch remains
compatible.

### P02H — Herdr Spawn Bwrap Reconciliation (B04)

Thread durable `runId` only through Assignment-owned dispatch. Confinement
Authority prepares the worker command; implementation must add or prove the
Herdr worker-command seam so Herdr starts exactly that prepared command,
including bwrap argv when required confinement applies. Use deterministic
agent name as lookup aid for the current Node client; never treat it as
authority. Allow first submit only from the fresh not-requested-to-pending
transition. Treat `agentSession` as conversation correlation; control requires
an adapter-proven resource incarnation. Pre-bind ambiguity reconciles or parks;
automatic replacement remains gated on `absent-proven`. Prove prepared-command
argv digest, same-conversation/new-process, restart, no-resurrection and F-b/F-f.

### P03 — Fallback And Effect Boundary

Keep the existing ladder and make fallback provenance compiler-compatible. Add
explicit repeatMode for review/red-team operations. Derive provider allowlist
from DispatchPlan; park unlisted effects. Prove allow, undeclared sink and
unsupported-filtered branches. Positive provider-only eligibility requires a
future adapter coverage proof. No retry on unknown delivery/effects.

### P04 — Read Evaluator Extraction

Create legal-next, authorization, visibility and completion as pure evaluators
without editing write doors. Prove fixture determinism and schema-1 parity;
P05S owns integration.

### P05 — Recovery Planner And Public Read Door

Implement standalone `dispatch recover` planning/apply. Recommendation returns
snapshot, control epoch, expiry and single-use action key; apply must echo them.
It appends no session event and never closes implicitly.

### P05S — Coordination Session Recovery

Integrate P04 evaluators through the existing CoordinationSession write door.
Add `coordination recover` read/apply with snapshot, event-sequence, Run-control
epoch and action-key checks. Prove C-f, current-driver enforcement, no implicit
close and visible X11 premature-close hazard.

### P06 — Writable Profile (Deferred)

Implement workspace-grant issuer, quiescence/coverage and inherited-lineage
evaluation only after P02L/P02H/P04 are green. Default remains park. Prove X05 and
workspace collision refusal before advertising writable takeover.

### P07 — Continuation/Transfer (Deferred)

CP §6 already refuses terminal-parent transfer in the first profile. After the
engine backlog closes, implement one prepared/gated-child/committed transfer with fresh
authority and single-use grant. Add `driver-replaced` with current operator
authorization and anti-replay invocation key. Prove X08, C-f and C-g.

### P08 — Full Recheck/Closeout

Run the complete test suite, capability matrix, setup/doctor checks and docs
link audit. Verify every advertised capability maps to a passing proof and
every unsupported path returns typed park/refuse/needs-input.

## Cross-Slice Rules

- Runtime observations never certify acceptance or external effect by themselves.
- Missing/unknown launch, workspace or effect evidence parks or refuses; it does
  not trigger blind retry.
- Control critical sections release tokens in `finally` and write release
  evidence, but missing markers never prove holder death.
- A live PID remains unreclaimable in Node/R1-R2; heartbeat expiry alone is not
  takeover authority. Force-release is deferred to R3.
- Every capability claim must name its adapter, profile and executable proof.

## Definition Of Done

Implementation is complete only when each shipped slice has executable evidence,
updated architecture/spec references, setup/doctor registration for new runtime
dependencies, and no regression in the S0 baseline. Replacement launch,
post-delivery repeat, writable takeover and continuation remain disabled until
their named adapter/backlog proofs pass.

## Handoff Validation

## Product Gates — Cell Status

Implementation handoff hold lifted 2026-09-12 (explicit user authorization to
implement through completion). Driven via `fgos-plan-loop`'s unattended track
mode. One row per closed cell; a cell only gets a row once its merge commit
lands on `main` and its trace is written under
`docs/architect/agent-coordination/verification/runtime-recovery/`.

| Cell | Merge commit | Reviewer | Red-team | Deferred findings | Trace |
|---|---|---|---|---|---|
| P00 | `bb64e945` | PASS (2 fix rounds) | PASS on substantive finding (fix-1); final 2-line recheck not dispatched, `maxRounds` cap hit — reviewer's independent source-verified recheck accepted in its place | Citation-swap suggestion (cosmetic) | [p00.md](../../docs/architect/agent-coordination/verification/runtime-recovery/p00.md) |

## Design Gate Definition

Before implementation authorization, every phase brief must identify its
hexagonal ports and adapters, single mutation owner, normal and crash state
transitions, typed refusal/park outcomes, and proof scenarios. The brief must
also name what it deliberately does not solve and link back to the decision
lock. A code-panel cell without those artifacts is not ready, even when its
files and tests are already listed.

Validated 2026-09-12 after P02L/P02H/confinement contract refinement:

- `code-panel-cells.json` parses with 11 cells and no unknown cell dependencies.
- Parallel same-wave leases have no exact path overlap.
- No source or test changes are present from this design-only session.
- P00 baseline report is available before any implementation panel starts.
