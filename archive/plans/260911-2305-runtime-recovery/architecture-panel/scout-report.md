Role: Context Investigator
Author: claude-bwrap / claude / sonnet / standard
Dispatch: prompts/context-investigator.md -> runs/asgn_..._op_004/01
Reads: all 16 assigned docs/plan files (reading-map through intake.md) plus
direct Read of 9 real source files (events.mjs, plan.mjs, herdr-round.mjs,
recovery.mjs, liveness.mjs, assignment-runner.mjs, session-engine.mjs
lines 1-1000 of 4744). Bash grep/wc/ls required approval unavailable in
this headless run — all citations are from direct file Reads, not shell
search; enumeration used phase-designs/README.md's own table instead of ls.
Revision: v1
Written: 2026-09-11T17:12Z (Run settled; transcribed by coordinator 2026-09-12)

Full advisor output: `.fgos/assignments/asgn_runtime_recovery_panel_coordinator_op_004/runs/01/agent-report.md`
(this file curates it; the run artifact is the primary record).

## Hypothesis (written before inspection)

The detailed-design.md + phase-designs/*.md package faithfully
operationalizes the 15 locked baseline decisions, and every phase's claims
about "existing" code are accurate, not aspirational.

**Verdict: survives partially.** Several specific claims are directly
confirmed by source; two are directly contradicted with real file:line
evidence.

## Evidence FOR (confirmed against real source)

1. **Lock semantics (generation/fencing, never TTL-only) are real** —
   `src/state/events.mjs:279-353` implements link-atomic-create + pid
   liveness probe + dead-pid-only reclaim, matching S1's design exactly.
   `withEventsLock`/`appendEventLocked` (`events.mjs:404-465`) are real,
   exported, and already used by `store.mjs`.
2. **`DispatchPlan.providerModel` is real** — `plan.mjs:346`.
3. **`blocked`/`paused-limit` genuinely both map to `worker-timeout` today**
   — `herdr-round.mjs:55-61`'s own comment says so verbatim; `recovery.mjs`'s
   `RECOVERY` table has no `blocked`/`paused-limit` entry. S3's "park before
   retry matrix" is a real, named behavior change against a real current
   path.
4. **Ladder order/rules match `liveness.mjs:136-207` line for line**
   (result-file-first, blocked-beats-timeout, death threshold 3, ceiling
   unaffected by blind time, blind subtracted from idle).
5. **`runId` construction is genuinely deterministic** —
   `assignment-runner.mjs:852`, pure function of (assignmentId, attempt).
6. **Some pure, I/O-free read evaluators already exist in
   `session-engine.mjs`** — `resolveLiveSpecialistBindings` (979-990),
   `resolveCurrentSessionRound` (942-944) — supporting S4's premise that
   extraction is possible in principle.

## Evidence AGAINST (real contradictions, not strawmen)

1. **S2's "deterministic Herdr agent name derived from `runId`" is false of
   the code that dispatches today — a missing wire, not a naming detail.**
   `herdr-round.mjs:654`: `` normalizeAgentName(`fgos-${workId ?? 'run'}-
   ${Date.now().toString(36)}`) `` — built from `workId` + timestamp, the
   exact identity source the baseline decisions forbid as authority.
   `runId` is never passed into `runHerdrRound`/`driveRound` at all
   (signature only destructures `workId, tier, model`). The S2 phase
   design's premise (naming is already runId-shaped, only the gateway
   contract for `absent-proven` is missing) **understates the real gap**:
   before any gateway work, S2 needs new plumbing threading `runId` from
   `assignment-runner.mjs`/`session-engine.mjs` through `dispatch/cli.mjs`
   into `herdr-round.mjs`'s agent-name construction — not named as a
   dependency anywhere in `launch-reconciliation.md`'s Ordering or Crash
   sections.
2. **"Reuse `withEventsLock`/`appendEventLocked`, no second lock" is
   accurate only for the CoordinationSession-owned path — silent about the
   standalone Team-Dispatch-V1 path, which has NO admission lock at all
   today.** `assignment-runner.mjs:810-827` computes the next Run attempt
   by `fs.readdirSync` + max + `fs.mkdirSync` guarded only by a prior
   `existsSync` check — no lock, no exclusive-create, no fencing. Two
   concurrent `executeAssignment` calls for the same assignmentId can race
   this with zero serialization. The contract doc's "Standalone runtime
   persists equivalent supersession intent with the new Run's atomic
   admission record" is aspirational for this file — nothing makes that
   atomic today. The distinction between the two paths is not drawn
   anywhere in the reviewed documents.

## Magnitudes and trends (counted, not estimated)

- **7 of 7 named phase-design files exist with substantive content**,
  despite `phase-designs/README.md`'s status column marking three
  ("pending"/blank) as if unwritten — the README status table is stale,
  not a real content gap.
- **18 distinct named ports** across S1-S4+P06, counted from
  `detailed-design.md`'s own "Ports:" lines (S1: 5, S2: 5, S3: 4, S4: 4,
  P06: +1) — larger than the summary table's 6-row canonical/collapsed
  view suggests. Whether `Clock`/`EventLog`/`ProcessEvidence` are genuine
  external-authority boundaries or wrappers around `Date.now()`/the
  existing event log is unresolved against the simplicity budget's own
  "no port wrapping pure functions" rule.
- **New durable identities**: `runId` (exists), `generation` (new),
  `incarnation` (new), `invocationKey` (exists, reused), `retryId`/
  `admissionKey` (new names on the existing `run-retried` concept).

## Absences

1. No document names the `runId`-into-Herdr-agent-name plumbing gap as a
   dependency; S2's crash/race table assumes `runId` is already the naming
   input.
2. `S3/fallback-and-effect-boundary.md` is the one phase brief with no
   dedicated crash-window/timing table (siblings all have one under
   different names).
3. No single `legalNext`-shaped pure evaluator function was found in the
   first 1000 of 4744 lines of `session-engine.mjs` (not read in full —
   tooling caveat). What exists instead: narrower pure helpers plus logic
   embedded inline in the mutating write doors. S4's "extraction" framing
   may understate this as lifting an existing thing when it looks more
   like synthesizing a new function out of interleaved logic — flagged as
   could-not-fully-determine, not a confirmed contradiction.

## Could-not-determine

- Whether a `legalNext`-shaped function exists beyond line 1000 of
  `session-engine.mjs` (not read in full this pass).
- Whether CLI-layer callers (`run.mjs` etc.) already thread `runId`/
  `agentSession` toward Herdr in a way `herdr-round.mjs` doesn't show.
- Real live-gateway `agentGet(name)` behavior on a never-created vs.
  raced-with name (code shows only a named `HerdrError` on lookup miss,
  `herdr-agent.mjs:292-301`; AD-06/R-02's `absent-proven` claim is
  plausible from code shape but not verified live).
- Full content of `store.mjs`, `replay.mjs`, `assignment-normalizer.mjs`,
  `execution-contract.mjs` — cited by the design, not opened this pass.

## What this means for the framing

The panel's framed question is still the right question, but there is a
more load-bearing sub-question the reviewed documents never state
explicitly: **there are two distinct, non-integrated Run/Assignment
identity-and-locking mechanisms in the current codebase**, not one — the
CoordinationSession-owned path (`store.mjs`/`session-engine.mjs`, genuinely
lock-protected) and the standalone Team-Dispatch-V1 path
(`assignment-runner.mjs` + `herdr-round.mjs`, unlocked attempt numbering,
timestamp-based Herdr naming, no `runId` plumbed to Herdr at all). S1's
admission/fencing design and S2's "deterministic name from `runId`"
premise read as true of the first path and not-yet-true of the second —
and the second is the one that actually calls Herdr today. No phase brief
or the 15 baseline decisions state, for each of these two paths, whether
it is retrofitted, replaced, or left alone.
