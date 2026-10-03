# Acceptance — mutating-gate fallback and producer git grants

Date: 2026-10-03. Branch `fix/mutating-quota-fallback` (phase 2 merged in).

## Results

| Criterion | Result |
|---|---|
| Writing producer (`workspace-write`) hits `provider-limit` → next candidate runs and passes the mutating gate, via `runUnit` | **Pass.** `run-herdr.test.mjs`: "a writing producer that hits a provider limit falls back…". Without the gate change the same test fails with `binding mismatch: recomputed alpha … assignment beta` (reproduced). |
| Chain ≥ 2 steps (0 → 1 → 2) | **Pass.** [evidence](./evidence/fallback-chain-unit-record.json): `skipCandidateIndex/candidateIndex` = (-1,0) → (0,1) → (1,2); outcomes limit, limit, pass. |
| Gate still refuses forged bindings | **Pass.** 3 tests in `run.test.mjs`: predecessor not `provider-limit`; assignment not in the recorded chain; replay of the already-limited candidate. |
| No `Bash(git add`/`git commit` in defaults, config, skills, spec | **Not done — deliberate exception.** See below. |
| Real run, fake executors, runner commits on Unit branch | Run through the fake-herdr harness (real processes, real bwrap, real git): unit run `unit-run-1791034966301-4a69a877`, gamma attempt committed `43bb326c3` (`probe-worktree.txt`) in the Unit worktree. **Real herdr pane: NOT RUN** — a real pane needs a real agent REPL contract; the harness's fake agent only works under the fake herdr binary. |
| Full `npm test` | Full run: 6549 tests, 6468 pass, 5 fail, plus two files stalled ~58 min under load. Every failing/stalled file re-run alone on this branch: green (`run-herdr` 20/20, `herdr-spawn-adapter` 39/40 + 1 skipped, `dispatch-liveness` 20/20, `fgos-merge` 63/63, `rust-host/harness` 15/15, `dispatch` 380/380, `provider-capacity` 21/21). Not a clean single full-suite pass. |

## Why the git grants stay

`claude-cli`, `glm` and the default `runner.executor` (all unconfined) also run the Work-loop coding worker, which commits for itself under the worker contract (Layer 2 rule 3); `loop.mjs` has no runner-side commit. Dropping the grant makes that worker unable to commit (the contract's own history, tsk-1jt/tsk-1dsr, measured exactly this). Confined (bwrap) invocations never needed it. Recorded as decision 0051 in `docs/specs/runner.md`.

## Follow-up (not done)

- Move the Work loop to a runner commit; only then drop the grants everywhere. Needs its own work item (touches `loop.mjs`, CRITICAL blast radius).
- Flaky under load (not touched here): `merge next --no-wait … live-held lock`, `withFileLock` marker-file test, `R5 Node-against-Node`, two `herdr-spawn-adapter` idle/re-brief tests — all green alone.

## Unresolved questions

- Submit the Work-loop follow-up as a work item now?
