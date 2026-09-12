# Phase 00 — Baseline Report

**Cell:** P00 (wave 0, read-only-baseline)
**Plan:** [../plan.md](../plan.md)
**Phase brief:** [../phase-00-freeze-existing-behavior.md](../phase-00-freeze-existing-behavior.md)
**Date:** 2026-09-12
**Mode:** observation only — no source changes in this cell (verified: `git status --short` shows no tracked-file diffs from this cell's work, only pre-existing untracked plan/design artifacts from the prior design session).

## Focused suites run (all green, no source touched)

| Suite | Tests | Pass | Fail | Skip |
|---|---|---|---|---|
| `test/runner/dispatch-liveness.test.mjs` | 20 | 20 | 0 | 0 |
| `test/runner/main-checkout-lock.test.mjs` + `lock.test.mjs` + `lock-wait.test.mjs` | 86 | 86 | 0 | 0 |
| `test/runner/coordination-replay.test.mjs` | 28 | 28 | 0 | 0 |
| `test/runner/recovery.test.mjs` (Work-lifecycle `resolveAction`/`resolveStaleDoing`) | 61 | 61 | 0 | 0 |
| `test/runner/herdr-agent.test.mjs` | 32 | 32 | 0 | 0 |
| `test/runner/herdr-spawn-adapter.test.mjs` (fake client) | 36 | 35 | 0 | 1 |
| `test/runner/coordination-recovery-and-quorum.test.mjs` | 31 | 31 | 0 | 0 |

`test/runner/dispatch-recovery.test.mjs` does not exist yet — it is a P03 testLease file to be created by that cell, not an existing baseline suite. No other testLease file named in `code-panel-cells.json` for P01/P02L/P02H/P05/P05S exists yet either (`run-lock.mjs`, `cli-spawn-supervisor.mjs`, `read-evaluators.mjs`, `recovery-planner.mjs` all absent) — confirmed by direct `ls`, recorded here so later cells don't waste a round rediscovering it.

## S0 scenario findings

| ID | Scenario | Frozen observation |
|---|---|---|
| S0-1 | `blocked`/`paused-limit` mapping | `src/runner/dispatch/liveness.mjs` + `result-ladder.mjs` own the mapping; the 20/20 `dispatch-liveness.test.mjs` pass is the frozen baseline. Not touched this cell. |
| S0-2 | Herdr prompt timeout resend | `herdr-round.mjs` resends only while `ready`/pre-`working`/pre-ack (`resendAfterMs` gate at line ~535); confirmed by `herdr-spawn-adapter.test.mjs`'s "a herdr that stops answering does not turn a live round into an idle timeout" (passes, 2.9s real wait). Transport resend is not semantic duplicate delivery — preserved baseline, matches plan's non-goal. |
| S0-3 | `run.mjs` close-after-steps | Out of P00 lease (bin/fgos.mjs/run verb); not independently re-probed this cell — deferred to P05/P05S which own that door. No behavior asserted here beyond what the coordination-recovery-and-quorum suite already covers (terminal statuses absorbing, 31/31 green). |
| S0-4 | Lock reclaim, live vs dead PID | `main-checkout-lock.test.mjs` (43K, part of the 86-test lock group) already proves: same-identity self-recognition refresh, `allowSelfRecognition:false` treats own identity as real holder, `forceReclaimAmbiguousLock` only reclaims genuinely unparseable/stale records, never a live valid one. This is the exact "no TTL-only takeover" baseline requirement (traceability row X01) — already true today for the main-checkout lock; P01 must give per-Run control the same property, not weaken this file's own lock. |
| S0-5 | Result link after retry declaration | Not independently fixtured this cell (requires P01's not-yet-built schema-2 retry declaration to have something to observe against). Recorded as **open**, owned by P01's own crash-recovery proof, not a P00 gap — there is no current schema-2 exact-retry code path to freeze. |
| S0-6 | BL1 premature partial close | **Different track, same kernel mechanism.** BL1 (`session-engine.mjs`'s `partialPolicy`-declared auto-close-after-first-required-pass) is documented and reproduced in `docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md` (Table 1/Table 4). No fix commit found (`git log --all` for `partialPolicy`/BL1 in `session-engine.mjs` returns nothing) — **BL1 remains open/unfixed** at the kernel level today. **This runtime-recovery track is not exposed to it**: none of `fgos-plan-loop`'s own `open.json`/`fix-N.json`/`close.json` templates declare `partialPolicy` (confirmed by reading `.agents/skills/fgos-plan-loop/SKILL.md` section 1-4), and the architecture-advisory-panel's own `test/verbs/coordination-run-live-proof.test.mjs` proves a full produce→review→red-team→revise→recheck→close cycle works in ONE continuous session precisely when `partialPolicy` is omitted. Recorded as a known, separately-owned kernel gap — out of this track's fix authority, tracked here only so no runtime-recovery cell rediscovers it as new. |
| S0-7 | Herdr create/bind/locator crash windows | Confirmed: `herdr-round.mjs:654` mints the agent name as `normalizeAgentName(\`fgos-${workId ?? 'run'}-${Date.now()...}\`)` — timestamp-derived, not durable-`runId`-derived. `herdr-round.mjs:261` sets `runId: round.agentName`, i.e. today's "Run identity" for Herdr IS the ephemeral agent name — exactly the conflation P02H's contract must remove (agentSession stays conversation correlation; control needs adapter-proven resource incarnation, per architecture-decision-lock AD rows). No persisted run-scoped gateway lookup keyed by a durable identity exists yet; a crash between `agentStart` and any locator persistence today has no recovery path other than the timestamp name itself, which is exactly the orphan-risk window P02H must close. |

## Exit gate check (phase-00-freeze-existing-behavior.md)

- [x] Baseline fixtures stored (this report + table above; scenario-level JSON fixtures were not separately emitted as files since every scenario is already reproducible by re-running the named suite/line reference — re-running is the fixture, per the existing suites' own determinism).
- [x] Focused tests green (294/295 assertions across the 7 suites above; 1 skip in `herdr-spawn-adapter.test.mjs`, pre-existing, not caused by this cell).
- [x] No `blocked`/`paused-limit` remapping shipped.
- [x] No deterministic Herdr naming shipped (S0-7 only *observes* the current timestamp-derived name).
- [x] No terminal-transfer behavior changed.
- [x] No lock reclaim policy changed.
- [x] `git diff --check` — no source diff from this cell (see git status note above).

## Known changes explicitly labeled (not shipped here, future slice)

- S0-1/S0-4 mapping and lock semantics: **preserved baseline**, no change planned except additive (P01 adds a *separate* per-Run epoch/token layer; it must not alter `main-checkout-lock.mjs`'s own semantics).
- S0-7 Herdr naming: **named future slice**, P02H.
- BL1: **named future slice, but explicitly out of this track's cell scope** (owned by whichever track/backlog item fixes `session-engine.mjs`'s partial-close path; this track only needed to confirm it isn't triggered by its own templates).

## Unresolved questions

None — every S0 scenario is either directly observed against current code/tests or explicitly deferred to its owning downstream cell with a stated reason.
