## Outcome

Cells served only by another declared pool (glm and deepseek on `openrouter`) now resolve everywhere.

## Cause

`resolveTierModel` returned the first cell entry served by the pool named after the family and threw otherwise. That is the pre-walk rule (RUL102). Under RUL106 every entry is a candidate; `bind()` already expands them and drops the ones whose pool is unusable. Five non-bind callers still held the old rule.

## Per-caller decision

One door: `resolveTierModel` stays and now returns the model of the cell's first entry, whichever pool serves it (the primary candidate of the walk). It throws only when the family has no cell at the tier.

| Caller | Needs | Decision |
|---|---|---|
| `assignment-policy.mjs` (legacy dispatch policy) | one model for a family | first entry |
| `assignment-runner.mjs` (read-only executor redirect) | one model | first entry |
| `dispatch/cli.mjs` fallback model | one model | first entry |
| `loop.mjs` dry-run plan | one model to print | first entry |
| `setup/model-pool-checks.mjs` doctor message | model to print | first entry |
| `bind.mjs` in-process / tool seat (no lease) | model label | first entry |
| `bind.mjs` leasing seat | pool + usability | unchanged: uses `resolveTierCandidates` |

No caller needed the pool, so none moved. `supportsPolicyTier` is true for any cell with at least one entry (it mirrored the old pool filter).

## Changes

- Commit 1: `.fgos/config.json` flip (z-ai nano/standard `z-ai/glm-5.3-flash@openrouter`, advanced/flagship/frontier `z-ai/glm-5.3@openrouter`; every deepseek cell `@openrouter`).
- Commit 2: `src/runner/dispatch/resolve.mjs` (resolveTierModel, doc comments), `src/runner/dispatch/config.mjs` (supportsPolicyTier), `docs/specs/runner.md` (one sentence in RUL106 Candidates), tests.

## Test changes

- `bind-committed-config.test.mjs`: the committed config plus a `runner.llmAccounts.openrouter` fixture, as the machine-global inventory supplies it. No production branch.
- `tier-cell.test.mjs`: resolveTierModel contract (first entry; refuses only a missing tier); supportsPolicyTier on an other-pool-only cell is true; two bind test titles corrected to what they assert.
- `herdr-claude-invocations.test.mjs`: z-ai standard cell asserts the new committed value.
- `dispatch-policy-baseline-snapshot.test.mjs` fixture, row by row:
  - `glm-cli [light]`: `model` and `--model` arg `z-ai/glm-5.3` to `z-ai/glm-5.3-flash` (light maps to nano; nano is now flash, intended).
  - `glm-cli [standard]`: same change (standard is now flash, intended).
  - `glm-cli [heavy]`: unchanged (advanced stays `glm-5.3`).
  - Deepseek rows: unchanged (models unchanged; `@openrouter` is the pool, not part of the model).
  - No other row changed. The diff is 4 lines.

## Verification

- Targeted run (baseline snapshot, bind-committed-config, assignment-policy, tier-cell): 95/95 pass.
- Full `npm test` (private CARGO_TARGET_DIR, session env unset): 8666 tests, 8451 pass, 118 fail on first run. Reruns:
  - Runner failures (run, run-provider-failover, loop, loop-rununit, operation-choice, spawn-worker, hot-lock, dir-resolution): all pass alone. Only real failure was herdr-claude-invocations (z-ai standard assertion), fixed; passes.
  - Remaining failures are environmental (no built `fgctl` / `libfgos_node_addon.so` in this worktree's cargo target): rust-host/*, holder-lock/fences-rust-locks, fences-v1-tombstone (known), event-store/migrate, run-supervisor crash matrices, run-supervisor-checks, active-release-drift-check, skill-wrappers (known), release-tree. None touch tier resolution.
- Not done: CHANGELOG (no user-visible change beyond the committed config).
