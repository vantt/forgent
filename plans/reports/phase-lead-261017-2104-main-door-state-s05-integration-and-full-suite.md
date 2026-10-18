# Wave S, S5: integration, full suite, review, smoke, landing readiness (state part)

Status: DONE_WITH_CONCERNS. Nothing merged to main, nothing activated, no fence placed in a real workspace. F10 held: no event format, `merge=union`, `.gitattributes`, strip rule or event store registry row touched.

## Integration
- Main had not moved (`eab4d617b` is already in `main-door-state/integration`); nothing to merge in. Branch is S1 to S4 plus this phase's one docs fix.
- Private build: `CARGO_TARGET_DIR=.fgos/runtime/phase-target`, `cargo build --release -p fgos -p fgctl` ok; this worktree's build link points at it; `node_modules` is a real dir. `FGOS_HOST_BIN` = that `fgos`.

## Evidence (session env vars unset)
- `cargo test --workspace`: 436 pass, 0 fail.
- Full `npm test`: 8149 tests, 8054 pass, 6 fail, 14 skipped, 75 todo. Each failure re-run alone:
  - `test/runner/herdr-reconciliation.test.mjs` 30/30, `test/runner/spawn-worker.test.mjs` 18/18, `test/rust-host/harness.test.mjs` 16/16, `test/state/hot-lock-multiprocess.test.mjs` 6/6 (incl. the fast-path 10% check): load flakes in the full run, green alone.
  - `test/scripts/check-decision-citation-drift.test.mjs`: real. `docs/specs/platform-foundations.md:66` and `docs/specs/work-state.md:1200` cited ADR0055 and ADR0003 with no gloss. The platform-foundations line is on main too; the work-state line carries both main's citation and this branch's note. Glossed in place; 31/31.
  - `test/setup/skill-wrappers.test.mjs`: environment, not code. The ignored render `.claude/skills/instruction-audit` was missing in this worktree. `npm run build:skills`; 127/127.
- Docs fix committed: `08d754c30`. The full suite was not repeated after it (docs-only; the two affected files re-run green).
- `rg` criterion 4 (`src bin scripts .githooks`, now incl. `withClaimsLock|withEventsLock|claims\.lock|CLAIMS_LOCK`): only `src/holder-lock/fences.mjs:43` (a comment naming the fenced old locks) and `src/runner/dispatch/adapters.mjs:102,115` (scrubs a leaked `FGOS_MAIN_LOCK_HOLDER_PID` from worker env, on purpose). `lock.rs`: no `read_to_string`.
- Benchmark (criterion 5), 50 rounds `take` then `return` on a fresh tiny repo with a release from each tree, p50: main 249 / 212 / 464 ms (take / return / total); branch 209 / 193 / 403 ms. Not slower (branch is faster; noise). A second main run is discarded: it reused item ids from the first. Fast-path micro check in `hot-lock-multiprocess` also green.

## Review (one Sonnet round, `main...main-door-state/integration`)
Clean on all eight points asked: invariants 1 to 5; no exec reachable inside any `withStateTx` body (store, claim-port, compaction, events, porting-store; `execFileSync` exports are guarded so a missed site throws); re-entry throws at once and `tx` use after release throws; rank order holds (claim path takes main only for the checkpoint and releases it before the state transaction); ceiling check and claim write are one transaction in one commit (`bbf7b7929`); reclaim only under `<resource>.reclaim.lock`, unreadable or `unknown` records never reclaimed; no event-format change; `readClaims` does one main lookup. Reviewer ran 78 tests, green.
Low, not fixed, no failing scenario today:
- The hot mutex is not registered in a `LockScope`, so a future state-then-main acquisition would not be caught by `assertCanAcquire`.
- A kill between temp write and `link` leaves a `locks/.hot.tmp-*` file nothing cleans (clutter).
- `withStateTx` increments depth and notes the lock before its `try`; no way to throw there today.
- `repairTruncatedLastLine` copies the backup through `fs` rather than `tx` (safe, inside the lock).
- `withMainState` locks `state` on the main `.fgos` while a bare `appendEvent(..., dir)` (`src/runner/loop.mjs:1017`) locks `dir`'s own `state.hot`; same shape as main had, no split when `dir` is the main `.fgos`.

## Smoke (scratch clone of this branch, release staged from it, `fgctl init --from`, scratch state home, real `HOME` for provider logins)
Clone-only setup: pin in `.fgos/distribution.json` repointed to the new digest; `core.hooksPath` set by hand; local `main` branch created (the clone's trunk lookup needs it).
- `doctor`: `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (0 held), `lock-record-unreadable` ("2 hot record(s) absent or judgeable"), `active-release-matches-checkout` (changed=0), `main-checkout-hook-wired` pass. `lock-fences` warns "13 of 17 not fenced" (expected: no fences placed).
- `doctor --fix` did not place fences: "fgOS processes still running, stop them first", it listed processes of other leads on this machine. Quiesce check works; fences are exercised by `test/holder-lock/fences-main-door.test.mjs` and the previous lead's clone run.
- Verbs, all exit 0: `add`, `edit`, `take` + `return` + `approve` (pull item, re-verify on main), `pick` + commit in the worktree + `return` + `approve` (merge, delivered), `move --to blocked`, `lock-status` (all free). First `approve smk-b` failed with exit 4 on `git rev-parse main` only because the clone had no `main` ref; rerun after creating it passed.
- Porting write: no CLI verb exists; `initStore`, `addPorting`, `movePorting` from the clone's source with `FGOS_HOST_BIN`: record `p-smoke` reached `planned` under `porting-events`.
- Runner: `fgos run` read-only unit (pass), `fgos run --writes docs/smoke-run.md --worktree <linked>` (pass, committed `0d2151ed8`, file content as asked), `fgos workflow start --units` one step with capability `execute` (pass). Capability `docs:write` was refused `headless-no-executor` (policy, not a lock).
- `exec-under-hot-lock`, `hot-lock-reentry`, `lock-order-violation`, `lock-held`, `state-tx-*`: none seen in any output.
- Cleanup: scratch worktree of main removed and pruned; scratch dir lives in the session scratchpad.

## Landing readiness (stop-everything, state part; owner chooses the hour; second machine lands on its own)
Prerequisite: the repo-lock landing (main `56f87bf5b`) is already active in the workspaces; this lands on top of it.
Fences to place: `state` (old `.fgos/events.lock` and `.fgos/runtime/claims.lock`) and `porting-events` (`.fgos/porting/events.lock`), as tombstone directories. `lock-fences` then covers 13 legacy paths in addition to the main door ones.
1. `which -a fgctl`: one path, the 4.4a build.
2. Stop every writer in forgentX, mdview, mcp-skill-hub: agent sessions, `fgos run`, workflow runner, `fgos gateway stop`, background runner, panes. No v1 holder alive: `ls` the three old lock files (and `fgos lock-status` of the old release); none held. The quiesce scan of `doctor --fix` refuses while any fgOS process of the machine matches (it did so in this smoke), so this also decides whether step 5 can run.
3. Merge main into `main-door-state/integration` again if main moved; re-run `test/holder-lock`, `test/setup/holder-lock-checks`, `test/state`, `test/architecture.test.mjs`; ff-merge into main from the main checkout (no branch switch).
4. Build, stage, activate in all three workspaces (`fgctl` first). The release must be the one that ships the registry rows for `state` and `porting-events`, or `doctor --fix` places no state fences.
5. Per workspace `fgos doctor --fix` for `lock-fences` (stopped check, tombstones, re-check).
6. `fgos doctor` through the shim in all three: pass `active-release-matches-checkout`, `lock-fences` (no "not fenced"), `lock-borrow-vectors`, `lock-kernel-semantics`, `lock-record-unreadable`, `main-checkout-hook-wired`; `lock-holders` shows no foreign holder.
7. Smoke per workspace: `fgos take` a test item, `return`, `fgos lock-status`, one `fgos add`.
8. Rebase open worktrees on the new main. Old releases get `EISDIR` on the tombstones, so none may run after step 5.
Rollback: before step 5 revert the merge and activate the previous release in the three workspaces. After step 5: stop writers, revert, activate the previous release, `rm -r` the tombstone directories listed by `fenceStatus` (`events.lock`, `runtime/claims.lock`, `porting/events.lock`, plus the main door ones if reverting those too), remove `.fgos/locks/state.hot` and `porting-events.hot` if present. Event log and claim files keep their format, nothing else to undo.
Windows: hot records fail closed; exit is `fgos lock fence state --attest-stopped`; the Windows judge is plan 4.4b P05.

## Impact
No production symbol edited in this phase (two doc lines). GitNexus index stale; reviewer cross-checked by grep. No HIGH/CRITICAL.

## Decisions
- Fixed the two doc citations in place and rebuilt the ignored skill render; did not touch flaky tests.
- Replaced the day of dogfood by the smoke above, per the re-cut.
- Did not fix the reviewer's Low items (no demonstrated failure; the unregistered `LockScope` rank is a design extension, not this phase).

## Concerns
- Full `npm test` not repeated after the docs-only commit.
- Fences not exercised live in this smoke (quiesce refusal from unrelated machine processes).
- `lock-fences` and the doctor/fence step need a quiet machine at landing.

## Unresolved questions
None.
