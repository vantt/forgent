# Unit I14 Implementation Report: Remove Automatic Close from DAG Requests

Verdict: **PASS**

## Identity

- **Branch**: `coordination-skill-harness-i14-explicit-dag-close`
- **Base SHA**: `dc05f7586b78483d569bc25b929b988dc56a374c` (Unit I13 merge on main)
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i14-explicit-dag-close`
- **Capability**: `code:implement`

## Files Changed

1. `src/verbs/coordination/run.mjs`
   - Gated DAG `shouldAttemptClose` and `closeAttempted` behind `explicitCloseRequested = Boolean(request.close === true || (request.steps ?? []).some((s) => s.type === 'close'))`.
   - Preserved `closeRefusalReason` reporting for shared-cwd caveats (`recheck-required: concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats`).
   - Retained existing non-DAG explicit-close behavior unchanged.
2. `test/runner/coordination-dag-explicit-close.test.mjs`
   - Added comprehensive 7-case test suite verifying:
     1. DAG session without `close: true` stays active upon full settlement (`result.closed === false`, `result.closeAttempted === false`, `result.status === 'running'`, `manifest.status === 'active'`).
     2. DAG session with `close: true` closes cleanly upon full settlement (`result.closed === true`, `result.closeAttempted === true`, `result.status === 'completed'`, `manifest.status === 'completed'`, `session-completed` event logged).
     3. DAG session left open can be subsequently closed explicitly via `closeCoordinationUseCase`.
     4. DAG session with concurrent read-only shared-cwd caveats reports `recheck-required` `closeRefusalReason` and does not close, with or without `close: true`.
     5. DAG session with partial outcome (deferred) does not close even with `close: true`.
     6. Non-DAG requests maintain unchanged explicit-close semantics (without close -> running, with `close: true` -> completed, with `close` step -> completed).
     7. Legacy session replay remains byte-for-byte compatible and active.
3. `plans/260919-coordination-skill-harness-simplification/plan.md`
   - Updated header status and Unit I13/I14 status rows to `IMPLEMENTED/VERIFIED`.
4. `CHANGELOG.md`
   - Documented explicit close behavior alignment for DAG coordination requests under `## [Unreleased]`.

## Behavior Changed

- **Before**: `runCoordinationUseCase` automatically attempted `closeSessionByQuorum` for any DAG request when work settled without partial outcomes or caveats, even if `request.close` was absent or false.
- **After**: Aligned with the locked platform law **"Explicit close is the sole normal close action"** (owner decision 2026-09-26). DAG sessions never auto-close merely because DAG work settled. Close is attempted only when explicitly requested via `close: true` (or a `close` step), or through the dedicated `closeCoordinationUseCase` door.
- **Invariant preservation**:
  - Non-DAG close semantics remain untouched.
  - Shared-cwd caveat detection and refusal reporting remain active.
  - Corrupt or deferred outcomes suppress close even if `close: true` is provided.
  - Session replay and ledger durability are 100% deterministic and backward-compatible.

## Impact Analysis Summary

- **GitNexus Query**: `impact runCoordinationUseCase --summary-only`
- **Blast Radius**:
  - Direction: upstream
  - Impacted Count: 48 symbols across 45 direct callers in runner/cli/verbs/tests.
  - Risk Level: CRITICAL (public coordination execution entry point).
- **Mitigation & Boundary Adherence**:
  - Change was restricted strictly to the DAG branch of `shouldAttemptClose` and `closeAttempted` in `executeCoordinationRunKernel`.
  - Quorum classification (`pureClassifySessionQuorum`, `classifySessionQuorum`), session state transitions (`transitionSessionStatusLocked`), and manifest schemas were preserved untouched.
  - All existing 11 DAG / coordination / runner test suites passed without a single failure or regression.

## Exact Commands and Exit Codes

```sh
# 1. Capability dispatch preflight
node src/runner/dispatch.mjs decide --for code:implement
# Exit code: 0

# 2. GitNexus impact analysis
node .gitnexus/run.cjs impact runCoordinationUseCase --summary-only
# Exit code: 0

# 3. New I14 test suite
node --test test/runner/coordination-dag-explicit-close.test.mjs
# Exit code: 0 (7 passed, 0 failed)

# 4. Focused test matrix (12 suites)
node --test \
  test/runner/coordination-dag-explicit-close.test.mjs \
  test/runner/coordination-dag-migration-matrix.test.mjs \
  test/runner/coordination-dag-cold-resume.test.mjs \
  test/runner/coordination-dag-concurrency.test.mjs \
  test/runner/coordination-dag-corrupt-evidence.test.mjs \
  test/runner/coordination-dag-deferred-probes.test.mjs \
  test/runner/coordination-replay.test.mjs \
  test/runner/coordination-legacy-schema-compatibility.test.mjs \
  test/verbs/coordination-run-driver-steps.test.mjs \
  test/verbs/coordination-chain.test.mjs \
  test/runner/coordination-p07-migration-and-adversarial.test.mjs \
  test/skills/coordination-dag-driver-skill-contract.test.mjs
# Exit code: 0 (210 passed, 0 failed)

# 5. Whitespace / git diff check
git diff --check
# Exit code: 0

# 6. Full repository test suite
env -u CLAUDE_CODE_SESSION_ID npm test
# Exit code: 0 (7684 passed, 0 failed, 8 skipped, 65 todo; 27 suites)
```

## Test Counts Summary

| Scope | Passed | Failed | Skipped | Todo | Total |
|---|---|---|---|---|---|
| I14 New Suite (`coordination-dag-explicit-close.test.mjs`) | 7 | 0 | 0 | 0 | 7 |
| Focused Matrix (12 suites) | 210 | 0 | 0 | 0 | 210 |
| Full Test Suite (`npm test`) | 7684 | 0 | 8 | 65 | 7757 |

## Phase 4 Readiness

- **Unit I14 Entry Gate**: "Unit I14 is integrated: a DAG-declared request no longer closes a session unless the request carries an explicit close. The driver discipline states 'explicit close is the sole close action' with no exception (owner decision 2026-09-26)."
- **Verdict**: **Phase 4 may open** once Unit I14 branch is merged to main.
