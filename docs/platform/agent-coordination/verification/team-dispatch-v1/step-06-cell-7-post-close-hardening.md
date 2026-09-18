# Cell 6.7 — Post-close hardening (cross-cutting review findings)

Status: in-progress
Date opened: 2026-08-31

## Scope

Fix 3 coordinator-verified bugs found by a user-requested cross-cutting
review of the full Step 6 diff, after Step 6 was already declared done
(`485a5a56`). See `current-cell.md` for full contract and the other
9 review findings NOT fixed in this cell (tracked in Gaps below).

## Bug A — blocked short-circuit bypasses read-only fail-closed check

**Root cause.** `classifyRunEvidence` (`src/runner/dispatch/assignment-runner.mjs`)
checked `agentClaim?.status === 'blocked'` and returned `{status: 'blocked',
confidence: 'reported'}` *before* the `isReadOnlyOperation && hasExternalEvidence`
fail-closed check ran. A read-only worker that mutated a pre-existing dirty
file, then wrote `status: 'blocked'` to its own `agent-result.json`, could
choose which branch classified it — escaping the P1 read-only-contract guard
entirely by self-reporting `blocked` instead of `done`/`failed`.

**Fix.** Moved the `hasExternalEvidence` computation and the
`isReadOnlyOperation && hasExternalEvidence` fail-closed check to run before
the `blocked` short-circuit. The worker's self-reported status can no longer
route around the read-only contract check; a read-only op with external
evidence always settles `failed`/`failed` regardless of what the agent claims.

**Test evidence.** New test in `test/runner/assignment-runresult.test.mjs`:
`classifyRunEvidence: a self-reported "blocked" status must not escape the
read-only fail-closed check when the op mutated a pre-existing dirty file
(Cell 6.7 Bug A)`. Confirmed RED before the fix (asserted `failed`/`failed`,
got `blocked`/`reported`), GREEN after. Full file: 24/24 pass.

## Bug B — resolvedExecutorId record inconsistency

**Root cause.** In `executeAssignment`, `resolvedExecutorId` can become
`"claude-reviewer"` for a read-only assignment (Cell 6.3's executor-scoping
redirect), computed *after* the `dispatch-decide-mismatch` guard already
validated against `effectivePolicy.executorPreference[0]` (the raw/declared
preference, e.g. `"claude"`) — that guard is correct and untouched, it
validates a separate invariant. The persisted `result.json` then wrote
`executorId: resolvedExecutorId` (`"claude-reviewer"`) alongside
`policy: effectivePolicy` (`executorPreference: ["claude", ...]`) with no
field explaining the divergence, so the record reads as self-contradictory
to an auditor comparing the two.

**Investigation.** Grepped for consumers of `result.json`'s `policy` or
`executorId` fields (`operation-choice.mjs`, `loop.mjs`, and repo-wide):
no code path reads `runResult.policy` or `runResult.executorId` expecting
them to agree, or derives logic from their relationship — both are
persisted for audit/provenance only. `loop.mjs`'s own `worker.executorId`
usage is a different object from a different codepath (`spawnWorker`), not
this file's `runResult`. Confirmed no downstream breakage risk either way.

**Fix.** Kept `policy.executorPreference[0]` as the declared/raw preference
(correct semantics — it's what was preferred before read-only redirection)
and `executorId` as the actually-resolved executor, per the investigation
above. Added an explicit `executorRedirected: boolean` field to `result.json`
(`resolvedExecutorId !== defaultExecutorId`) plus inline comments at both the
computation site and the `runResult` object documenting that `policy` =
declared preference and `executorId` = actually-resolved executor are two
distinct, non-contradictory fields by design — so a redirect is now explicit
in the persisted record instead of something an auditor must infer by
diffing two fields.

**Test evidence.** Extended two existing `test/runner/assignment-dispatch.test.mjs`
tests: the Cell 6.3 Fix Round 1 reviewer-scope redirect test now asserts
`policy.executorPreference[0] === 'claude'`, `executorId === 'claude-reviewer'`,
`executorRedirected === true`; the mutating-assignment-unaffected test asserts
`executorRedirected === false` for the non-redirected case. Full file passes.

## Bug C — allowCrossProvider default removed

**Root cause investigation.** `git log -p -S"allowCrossProvider" --all -- src/`
around commit `d7c53107` shows no removal of a permissive default — the
cross-provider egress gate itself (`src/runner/dispatch/resolve.mjs:106-117,
396-402`, D2/D3 tsk-32n) is a deliberate, actively-documented governance
feature: a `kind: "cli"` executor whose resolved `command` is not in
`CLAUDE_CLI_COMMANDS` is `cross-provider` egress and requires
`executors.<id>.allowCrossProvider === true` explicitly, or
`resolveExecutorConfig` throws `RunnerConfigError` before dispatch (prompt
content would otherwise silently leave the Claude ecosystem). This is not
something that regressed — it's the intended shape of the D1/D2/D3 (tsk-32n)
work.

Confirming evidence: every other test file that spawns a non-Claude-CLI
executor (`process.execPath`/node, in-test mock scripts) already sets
`allowCrossProvider: true` explicitly on its own executor fixture —
`test/runner/assignment-dispatch.test.mjs`, `test/runner/assignment-runresult.test.mjs`,
`test/runner/dispatch.test.mjs`, `test/runner/loop.test.mjs`,
`test/runner/operation-choice.test.mjs`, `test/runner/egress-governance.test.mjs`,
`test/cli/fgos-stage.test.mjs`. `test/runner/mission-lite.test.mjs` was the
one outlier never updated to this pattern — its 4 `runnerConfig.executor`
fixtures (5 executor blocks across `workId:null assignment…`, `no Work item
is created or modified…`, `no-evidence role result…` [2 executors], and
`first business case debate mission…`) all spawn `process.execPath` with no
`allowCrossProvider` field, so they started failing once the gate began
being exercised for real callers.

**Fix direction chosen: update the test fixtures, not the runtime default.**
Restoring a permissive default in the runner config would silently defeat a
deliberate, actively-relied-on security gate that every other test in the
suite already respects by opting in per-fixture. The correct, consistent fix
is the same explicit opt-in every sibling test file already uses.

**Fix.** Added `allowCrossProvider: true` to all 5 `executor: { command:
process.execPath, ... }` blocks in `test/runner/mission-lite.test.mjs`
(lines ~87, ~218, ~327, ~337, ~420).

**Test evidence.**
- `node --test test/runner/mission-lite.test.mjs` — 6/6 pass (was 4 failing).
- Regression: `node --test test/runner/operation-choice.test.mjs
  test/runner/loop.test.mjs test/runner/assignment-runresult.test.mjs
  test/runner/assignment-dispatch.test.mjs test/e2e/runner-loop.test.mjs
  test/cli/fgos-stage.test.mjs` — 304/304 pass, 0 fail.

## Gaps (other review findings, not fixed in this cell)

- Architecture layering violation: `assignment-runner.mjs` imports
  `intake/plan.mjs` (infra importing use-case layer) — `test/architecture.test.mjs`
  red.
- `resolvePlan`'s `stateRoot` logic assumes `dir` is literally named
  `.fgos` — breaks `test/intake/plan.test.mjs` (4 tests) for any
  differently-named state dir.
- `hasDirtyBeforeMutation` hardcoded `false` in cross-pass re-derivation
  (`operation-choice.mjs:361`) — the one persistence gap Cell 6.2's own
  Gaps section already flagged; re-derivation cannot re-detect this one
  failure mode.
- `branchHeadAtReturn` now recorded on the primary worker's own
  awaiting-approval settle path, activating merge.mjs's "skip verify,
  already green at return" optimization there too — breaks
  `test/e2e/pr-gate.test.mjs` and `test/e2e/self-improve-loop.test.mjs`
  (real verify-skip at merge time, security-relevant).
- `verdictPayload` always `undefined` for `validate-plan`
  (`operation-choice.mjs:2069`) — coordinator's own review found this
  MAY be intentional (validate-plan's vocabulary is READY/NOT
  READY/READY WITH CONSTRAINTS, not decompose/need-human; NOT READY
  routing already happens via `nextOperation`, not `verdictPayload`) —
  needs product judgment, not a code fix, before deciding.
- `gitBefore`/`gitAfter` post-crash fallback captures both at the same
  post-crash instant, losing accurate before/after provenance for a
  worker that committed then crashed.
- 1 pre-existing unrelated flake ("ask/answer round-trip on a genuinely
  legacy durable-doing item") — confirmed failing at baseline `9235bbe1`
  too, not a Step 6 regression.

## Full `npm test` tallies

Before this cell (coordinator-run): 4494 tests, 4477 pass, **12 fail**, 5 skipped.

After this cell (coordinator-run, both fix branches merged): 4495 tests,
4481 pass, **9 fail**, 5 skipped. Net: Bug C's 4 `mission-lite.test.mjs`
failures gone (confirmed absent from the failing list). Bug A/B had no
pre-existing failing tests to remove (they were latent bugs proven by new
red→green tests, not causes of the original 12) — expected, matches the
cell's own scope.

Remaining 9 failures, all either already tracked in Gaps above or
independently confirmed unrelated to this diff:

- 1 pre-existing unrelated flake ("ask/answer round-trip...") — Gaps.
- 4 `resolvePlan`/`.fgos`-basename failures — Gaps.
- 1 architecture layering violation — Gaps.
- 2 `e2e pr-gate`/`e2e self-improve-loop` (`branchHeadAtReturn` verify-skip)
  — Gaps.
- 1 NEW-appearing but unrelated: `herdr-spawn adapter (LIVE): dispatch a
  real agy-herdr interactiveMode executor against real binaries` —
  passed (13.4s) in the coordinator's FIRST full run, failed (60s
  timeout) in the second and two further isolated re-runs. This test
  dispatches to a real external `agy` CLI/model
  (`gemini-3.6-flash-medium`) — none of Cell 6.7's diffs touch
  `transport.mjs`/`herdr-spawn-adapter` at all. Consistent with
  environmental flakiness (API/network/resource contention from the many
  concurrent agent processes this session has run), not a code
  regression from this cell. Recorded here rather than chased down;
  re-run in isolation under low system load before treating as a real
  bug.

## Status

done — Bug A (read-only fail-closed check now runs before the `blocked`
short-circuit, new red→green test), Bug B (`executorRedirected` field
makes the declared-vs-resolved executor divergence explicit and
non-contradictory), and Bug C (test fixtures fixed to opt into the
deliberate cross-provider egress gate, not a runtime default weakened)
all fixed and independently verified by the coordinator (diffs read line
by line, tests re-run directly). Full `npm test` improved from 12 to 9
failures, with the delta matching exactly what this cell was scoped to
fix and no new regression introduced. 9 other findings from the
cross-cutting review remain open in Gaps, requiring their own scoped
decision before any further fix work.
