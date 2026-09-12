Author: coordinator (driver synthesis of the mandatory outputs
design-panel-prompt.md requires — no protocol operation produces a
contract table/readiness matrix/simplicity audit; this is bookkeeping of
the same kind as `dispositions.md`, built from the real ledger only, no
new claim introduced).
Written: 2026-09-12.

Full session ledger, in reading order: `intake.md`, `decision-request.md`,
`interpretation.md`, `scout-report.md`, `proposals/system-shaper.md`,
`proposals/alternative-shaper.md`, `proposals/specialist-long-horizon.md`
(with correction note), `proposals/constraint-advocate-phase5.md`,
`critiques/architecture-critic.md`, `proposals/constraint-advocate-phase6.md`,
`synthesis.md` (with correction note), `redteam.md`, and the lead advisor's
explanation (`.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_013/runs/01/agent-report.md`).

## 1. Verdict, one line

**Adopt baseline-conservative (system-shaper's S1'/S2'/S3'/S4' + D-std) for
P00-P04.** One product decision required before P01's contract is written
(generation/incarnation, §4). No other decision request.

## 2. Alternatives, with designated loser

| Candidate | Role | Verdict |
|---|---|---|
| Baseline conservative | system-shaper | **Recommended.** Only candidate with both a commitment to close the shared admission gap and a critic-verified precondition (C1). |
| Gateway-change | alternative-shaper | **Designated loser.** Does not close the shared gap (no Node admission migration named); carries an unrebutted HIGH finding (Herdr becomes stateful authority, no split-brain repair); overturns a locked baseline decision ("Herdr is evidence, never authority") with zero contradicting evidence; zero checked falsifiers. |
| Long-horizon writable/continuation | specialist (bounded question) | **Not a competitor.** Additive reserved-fields layer over whichever mechanism wins; its central deferral-cost claim is unverified; states no falsification criteria. Values choice, not an architecture decision (§6 below). |

## 3. Contract table

| Contract | Owner | Inputs | Outputs | Unknown | Mutation | Replay |
|---|---|---|---|---|---|---|
| Run admission (`admitRunAttempt` inside `executeAssignment`) | `assignment-runner.mjs` (existing symbol, no new port) | `assignmentId`, caller-supplied `supersedesRunId?` | `run.json` with `phase`, `supersedesRunId`, `delivery: not-sent` | **F7** — does any current reader branch on field absence? Unchecked, load-bearing (constraint advocate: HIGH if it controls settlement/admission authority) | Writes `run.json` under `withEventsLock` scoped to `assignments/<id>/`; non-recursive `mkdirSync`, EEXIST -> typed `admission-conflict` | No event log for this contract (local filesystem state only); crash matrix in `proposals/system-shaper.md` §2 P01' (5 rows) is the closest thing to a replay guarantee |
| Launch reconciliation (`runHerdrRound`/`driveRound`) | `herdr-round.mjs` (existing symbol; no new port, one client method only if Herdr exposes an unwrapped lookup) | `runId`-derived `agentName`, prior `handle.json` on resume | `handle.json` (`agentName`, `agentSession`, `paneId`, `boundAt`); `phase: launching → bound`; `delivery: sent\|unknown` | **F3** — what does `herdr agent start <existing-name>` do (reuse/replace/reject)? Needs a live probe, cannot be settled statically | Writer-only: runner writes `handle.json`, never the worker | None — a resume re-derives from `agentGet` + `handle.json` on disk, no event replay |
| Fallback/effect boundary (`assessRepeat`) | `recovery.mjs`'s `RECOVERY` table + `herdr-round.mjs`'s `ERROR_CLASS_FOR_OUTCOME` | `repeatMode`, `delivery`, `providerModel`, confinement facts already in `run.json`/`dispatch-plan.json`/operation YAML | `eligible \| park(reason)` | **F8** — does `paneClose` destroy the gateway record so a settled Run's lookup miss looks identical to never-created? | None — pure function | N/A (stateless decision) |
| Recovery door (`show`/`recover`) | `src/verbs/coordination/{run,show}.mjs` | `coordinationId` | `runs[]` projection (pure read); `recover` intent triggers result-scan → reattach/observe → park, or `run-retried` + P01 admission when eligible | **F6** — can the existing `coordination run` vocabulary address an already-admitted, un-settled (parked) Assignment at all? Statically checkable, unchecked | `show` never writes; `recover` mutates only through the existing `run-retried` + P01 admission doors, idempotent under lock | Existing schema-1 session event log, unchanged — no new event kind |

Four contracts, zero new ports, zero new durable identities beyond fields
added to the existing `run.json` (per system-shaper's explicit count in
`proposals/system-shaper.md` §3: 14 named ports in the original package
collapse to zero new ones here).

## 4. Phase readiness matrix

| Phase | Label | Why |
|---|---|---|
| S0 (freeze + concurrency fixture) | **READY FOR IMPLEMENTATION** | No production behavior change; the fixture itself (two concurrent `executeAssignment` calls, stub executor) is the first reversible step named in `proposals/system-shaper.md` §6. Owner, crash path and proof are all named. |
| P01/S1' (Run admission) | **DESIGN BLOCKED** | Blocked on: (a) the person's decision on `generation`/`incarnation` (§4 of `final` explanation — a real product decision, not yet answered); (b) F7 unchecked and load-bearing. Cannot be labeled READY while a locked baseline decision's status is unresolved and the one falsifier that decides the storage format is unread. |
| P02/S2' (launch reconciliation) | **READY WITH EXTERNAL DEPENDENCY** | Dependency: F3 (live Herdr probe) — "the material operational gate" per the constraint advocate. Automatic replacement launch is explicitly not shipped by any candidate (no gateway `absent-proven`); reattach/observe/park is the shipped scope, and that scope's safety depends on the F3 probe. Never unqualified READY per the synthesis's own §5 finding 5. |
| P03/S3' (fallback/effect) | **READY WITH EXTERNAL DEPENDENCY** | Depends on P01/P02 landing first (park-instead-of-retry for blocked/paused-limit is an S0-frozen behavior change that must ship with S0). No new ports; the effect-boundary logic itself is a pure function with no external dependency of its own, but its inputs come from P01/P02's records. |
| P04/S4' (recover door, `show` projection) | **DESIGN BLOCKED** | Blocked on F6 (can the existing request vocabulary reach a parked Assignment at all?). If F6 fails, P04's existence — not just its shape — becomes part of the minimum set ahead of P03 per the system-shaper's own §7 ranking. Cannot be graded READY until F6 is read. |
| P05 (misc S5/P06/P07/P08 closeout items not touched by this recommendation) | **NOT APPLICABLE** | Out of scope for baseline-conservative; terminal transfer stays refused (B01, unchanged), writable takeover stays disabled (B02/B03, unchanged) — no phase-design work is authorized here. |
| P06 (writable takeover) | **DISABLED PROFILE** | Unchanged from the locked baseline decisions (writable takeover optional, disabled by default). Not attacked, not advanced by this panel. |
| S5/P07 (continuation/terminal transfer) | **DISABLED PROFILE** | Unchanged — B01 (terminal-parent transfer refusal) still blocks this; CP §6 contract work is a prerequisite this panel did not undertake. |
| Long-horizon reserved fields (specialist's answer, if adopted) | **NOT APPLICABLE unless the person opts in (§6)** | Not a phase with its own readiness — a layering decision on top of whichever phase lands, deferred to the person, default is "do not add" per the synthesis. |

No phase above P00 is unqualified READY. This is a finding, not an
oversight: `design-panel-prompt.md`'s own conclusion rule ("Không gọi
ready nếu owner, port, crash path hoặc proof còn mơ hồ") is met by naming
every phase's real blocker rather than rounding up.

## 5. Simplicity audit

Answers grounded in the real ledger, per `design-panel-prompt.md`'s ten
questions:

1. **New application use cases:** one — the `recover` intent on the
   existing `coordination run` door (P04). Everything else extends an
   existing symbol (`executeAssignment`, `runHerdrRound`, the `RECOVERY`
   table).
2. **Components that are only a wrapper around a pure function:** none in
   the recommended candidate. The package's original `EffectGuaranteePort`
   is replaced by a bare pure function (`assessRepeat`) — an explicit
   simplification, not a new wrapper.
3. **Ports not at a real external-authority boundary:** zero new ports in
   P01-P03 (system-shaper's own count: 14 named ports in the original
   package all either duplicate an existing seam or solve a problem the
   scout did not find — `proposals/system-shaper.md` §3). One possible new
   port in P02 only if Herdr exposes a lookup the existing client doesn't
   already wrap — conditional, not committed.
4. **New authority outside CoordinationSession/Run write door:** none.
   Gateway-change's Herdr-as-authority proposal is exactly what was
   rejected for this reason (§2).
5. **Events that record observation instead of a state transition:** none
   introduced. `run.json`'s two new fields are admission-state fields
   (`phase`, `supersedesRunId`), not observations; `handle.json` is
   explicitly diagnostic/binding state, never treated as evidence.
6. **Abstractions deletable with no correctness loss:** the original
   package's `ControlLock`, `Clock`, `ProcessEvidence`, `EventLog`,
   `RunStore`, `LaunchRegistry`, `LocatorStore`, `IncarnationProbe`,
   `PlanTokenStore`, `SessionReadModel`, `AuthorizationFacts`,
   `VisibilityFacts`, `WorkspacePort`, `EffectGuaranteePort` — all deleted
   in the recommended candidate; none of the four remaining contracts (§3)
   needs them.
7. **Phases understanding too much of another phase's rules:** none
   flagged by the critic or constraint advocate. P01-P04 each own one
   contract (§3); P02/P03/P04 read facts P01 wrote, they don't reach into
   P01's internals.
8. **Name/timestamp/process identity used as authority:** exactly the
   defect being fixed (`herdr-round.mjs:654`'s `workId`+`Date.now()`
   naming) — the recommendation replaces it with `runId`-derived naming,
   explicitly "an aid, never authority" (specialist's own phrasing, kept).
9. **Hidden retry or hidden close:** none found. `blocked`/`paused-limit`
   moving from retry-as-timeout to park is a named, S0-frozen behavior
   change, not hidden. `recover`'s retry path goes through the existing
   `run-retried` declaration, not a silent retry.
10. **Can a fresh agent trace a read snapshot to the write door without
    chat history?** Partially provable today: `show`'s `runs[]` projection
    is a pure read of `run.json`/`handle.json`; `recover`'s write path is
    the existing `run-retried` + P01 admission doors. Not provable until
    F6 is checked (§4) — this is precisely why P04 is DESIGN BLOCKED
    rather than READY.

Each answer's disposition: (1) keep — one new use case is proportionate to
the fixed real defects; (2)-(7) keep as designed — no abstraction to
delete beyond what's already cut; (8) fixed by the recommendation itself;
(9) keep — no hidden mechanism found; (10) add contract — F6 must be
answered and stated in P04's own contract before it can claim question 10
is satisfied.

## 6. Final recommendation

Adopt baseline-conservative for P00-P04, exactly as system-shaper
specified with D-std, subject to:

1. **The person answers the `generation`/`incarnation` question** before
   P01's contract is written (full explanation in the lead advisor's
   output, `.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_013/runs/01/agent-report.md`
   §4; also correction note atop `synthesis.md`).
2. **F7, F6 (static) and F3 (live probe) are read** before P01/P04/P02
   respectively can be relabeled READY FOR IMPLEMENTATION.
3. **Migration/profile gate ownership is assigned** (constraint advocate,
   both passes) before any phase ships — no candidate's text currently
   owns it.
4. **Long-horizon reserved fields**: default do-not-add unless the person
   opts in; does not block P00-P04 either way.

No further product decision is requested beyond item 1. Everything else
above is a probe/ownership assignment the phase-design authors can execute
without returning to the person.

### Zero further decision requests

Per Scout Before Ask: item 1 above is the only thing that is (a)
user-exclusive (only the person can decide whether to overturn their own
locked decision) and (b) material now (it changes what P01's contract
literally says). Items 2-4 are engineering work, not decisions requiring
the person's judgment, and are named as prerequisites rather than escalated.
