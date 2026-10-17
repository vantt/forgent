# Holder-lock 4.2, phase 12 part A: integration, full suite, review, landing readiness

Branch `holder-lock/integration`, worktree `.claude/worktrees/hl-integration`. Scope: phase 12 section A (A1–A5) only. Not done here (section B, big lead with owner): stop-everything, merge into main, activation, fences, `doctor --fix`.

## Status

DONE_WITH_CONCERNS. Section A acceptance met: main integrated, host built, full suite on the exact binary with every failure classified, two review rounds closed, findings fixed or recorded.

## What to land

- **Code head:** `4c7d6a6525ebfd63e379f0696b48395a85202698` (`4c7d6a652`). The branch tip after it carries only this report and the review report (docs). Land the branch tip with ff inside the main checkout (B2) — main must not move past `36d5bf66f` first, or merge main into the branch again.
- Main merged twice: `14a13bc3e` (main `70a9d1134`) and `86db4d092` (main `36d5bf66f`, the release-tree report rename).
- Conflicts resolved in `14a13bc3e` (both sides kept):
  - `CHANGELOG.md` Unreleased/Added: holder-lock lines + main's `instruction-audit` line.
  - `docs/specs/distribution.md` rows 7/7b: branch rows (new lock checks/fixes) + main's `domain-registry-compiled` wording.
  - `src/runner/execution/run.mjs` imports: main's `AgentNotFoundError`, `parseYaml`; branch's `dispatchCwdHolder`; main's `dispatchLockFile`/`parseCompositePidIdentity` import dropped (deleted by P10; no use left).
- Flag registry: `node scripts/export-command-selectors.mjs` after the merge produced no change; reviewer confirmed no lock verb/flag missing (`internal` never reaches the registry; `doctor --fix`, `dispatch reconcile plan --cwd` declared).

## Binaries

Built at `14a13bc3e` into private `CARGO_TARGET_DIR=.fgos/runtime/p12-target` (`CARGO_BUILD_JOBS=4`); worktree `target` symlink repointed there for the tests. No `*.rs`, `Cargo.toml`, `Cargo.lock` or `packages/*/contracts` change between `14a13bc3e` and `4c7d6a652`, so these are the head's binaries.

| Binary | sha256 |
|---|---|
| debug/fgos | `1cb3e26904a0341661950f43633ca0dfce0aef759600824c7a3fe0a7629d0391` |
| debug/fgctl | `122f6e728d0ca3b223128f25fa803b828701f235ef5691a2492725022a22d965` |
| release/fgos | `6202edcd0c2bb2e949d766d65ed7802040dfbbd435f325a6b4d03057666450ad` |
| release/fgctl | `4126c1005f28f382018c1f9db638d5fade5a196e1bdf850158b32175e81cec21` |

B3 builds/stages its own release; these hashes identify what was tested, not what activation will stage.

## Suite results

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p12-target>/debug/fgos`.

| Check | Head | Result |
|---|---|---|
| `cargo test --workspace` | `14a13bc3e` | 28 test binaries, 294 pass, 0 fail |
| `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc --target aarch64-apple-darwin` | `14a13bc3e` | exit 0 |
| full `npm test`, run 1 | `86d3ef5f4` | 8128 tests, 8036 pass, 4 fail, 13 skip |
| full `npm test`, run 2 (final) | `86db4d092` | 8130 tests, 8040 pass, 1 fail, 14 skip |
| `test/rust-host/release-tree.test.mjs` | `4c7d6a652` | 4/4 pass, R1 & R2 green (also green in both full runs) |
| `test/scripts/full-suite-queue.test.mjs` + `run-tests.test.mjs` | `4c7d6a652` | 43 tests, 42 pass, 1 skip (Windows-only case) |
| fresh clone outside any activation, no `FGOS_HOST_BIN`, `node scripts/run-tests.mjs` | old door `86d3ef5f4` / new door `4c7d6a652` | old: throws `lock-driver-unavailable (no-host-binary)`, exit 1; new: builds host, queues, 1/1 pass, exit 0 |
| `scripts/check-decision-citation-drift.mjs` + its tests | after doc edits | exit 0; 51/51 |

Run 2 started after the fixes for run 1's failures; the last commit `4c7d6a652` (queue door) came after run 2 and was verified by the narrow runs above.

### Failure classification

| Test | Run | Class | Evidence / action |
|---|---|---|---|
| `holder-lock/fences-stop-check` "clean workspace is fenced…" | 1 | **4.2 regression (test)**, fixed | Machine-wide scan saw parallel suite files' fgOS processes; 20 back-to-back retries (~2.5 s) never settled. Passed 6/6 alone. Fix `d159b9a37`: 60 s budget, 250 ms pauses, same foreign-only assertion. Then 3/3 green next to `spawn-worker` + `herdr-spawn-adapter`, green in run 2. |
| `setup/skill-wrappers` projection for `instruction-audit` | 1 | environment | `.claude/skills/*` is gitignored and generated; the worktree was not re-rendered after main added the skill. Copied the main checkout's generated wrapper; green in run 2. |
| `runner/herdr-spawn-adapter` "idle whose screen keeps changing" | 1 | load timing | 900 ms idle window; untouched by 4.2 (only the `workerBaseEnv` test in that file changed). P10 saw the same. 5/5 alone and alongside; green in run 2. |
| `runner/spawn-worker` "output budget" | 1 | load timing | Seen in P09 before the dispatch-cwd cutover (P10). 4/4 in a 4-way parallel stress; green in run 2. |
| `scripts/test-select-coverage-map` "a file that hangs…" | 2 | load timing | Short collection timeout hit the failing file too; files untouched by 4.2 (`git diff main...HEAD` empty); 3/3 alone. |

Not proven by a run on main for the three load-timing cases: a standalone run passes on both sides, so a main run proves nothing; the evidence is "code path untouched by 4.2 or flaky before the 4.2 change, green on rerun".

## Review (Opus, 2 rounds)

Report: `plans/reports/code-review-261017-1104-holder-lock-p12a-integration-review.md`.

Confirmed OK: description rule (close-on-exec everywhere; only route helper, `runBorrowed`, doctor's `sleep` probe pass a lock fd; git on a borrowed lock gets `gc.auto=0`/`maintenance.auto=false`; `workerBaseEnv` drops `FGOS_LOCK_FD`); stop-everything check (scan → place → scan, all paths checked before writing, fix only when the activated release ships `lock-registry.v1.json`); no v1 path for the 10 locks in `src/ scripts/ bin/ apps/` (left: fence code, 4.3 files, `run-lock.mjs`, the v1-extract test); merge resolutions; P10/P11 hand-offs (`runner.md` :21-23, RUL86, RUL96, :3352, RUL75, advance lock text).

| Finding | Fix |
|---|---|
| H1 `npm test` took the queue before any host binary existed; CI (no activation, no `FGOS_HOST_BIN`) would stop on every OS | `eaf88cd02` + `4c7d6a652`: `queueWithHostBin` builds a host before the queue only when none resolves; queue warns and runs unqueued on `unsupported-platform` (Windows) |
| N1 (round 2) building before the queue could swap a shared-target binary under another worktree's queued run | `4c7d6a652`: no build before the queue when a binary resolves (old order kept for every local worktree) |
| L3 runtime accepted `lock.predecessorKillWaitMs` > 60000 that doctor fails | `9f046b432`: one `MAX_KILL_WAIT_MS` in `protocol.mjs`, enforced at acquire, doctor imports it; test covers `'2s'`, 0, 60001 |
| L1 / L7 / M2 wording | `9b9f13d64`: CHANGELOG queue line, lock-order note (cross-door order not checked yet), ttl line no longer claims the dispatch lock; `runner.md:1238` |
| P10 stale comment `bin/fgos.mjs:2660` | `86d3ef5f4` |

Recorded, not fixed (reviewer agreed none blocks landing):

- **M1 (condition for B):** the `lock-fences` fix, also run by plain `fgos setup`, places machine-wide provider-ledger fences (pid-1 generations under `~/.fgos`). Before the first `setup`/`doctor --fix`, every workspace on the machine that uses provider capacity must run 4.2 — not only the three. Seen on disk: `mdview--wt--dogfood-agents` next to `mdview` and `mcp-skill-hub`; check it.
- **M2 code half → 4.3:** every lock door makes its own `LockScope`, so `lock-order-violation` never fires across doors in production.
- **M3 → 4.3:** `lock-holders` treats any process with `FGOS_LOCK_FD`/`FGOS_STATE_ROOT` as legitimate, so an orphaned borrowed daemon holding an account lock after its holder died stays green.
- L2 holder listing skips unreadable `/proc/<pid>/fd` (same-uid processes readable; fallback to `probe` would close it); L4 macOS cannot place fences through the CLI (scan unavailable → needs-attest, no attest command); L5 two concurrent borrows of one lock kill each other's child (no caller does it); L6 advance/recovery can recreate `<runDir>/locks/` of a run deleted in between; L8 CI related-tests job is shallow while fence tests read base commit `a9e48b67d`.
- Optional: `ci.yml` could set `FGOS_HOST_BIN=target/release/fgos` to skip the debug build.

## For section B

### Processes that must be stopped

P04: `lock-fences` refuses while any fgOS process of any session runs anywhere on the machine (argv match is machine-wide). Snapshot at 11:35:

- pid **1042700**: orphan from a deleted worktree `forgentX-worktrees/rununit-commit`, started 2026-10-14 17:32, parent 1, `node -e process.on('SIGTERM', () => {}) … fgos-gateway-test-ready …` — **ignores SIGTERM; needs `kill -9`**. A pre-4.2 gateway test leaked it.
- every Claude/Codex/omp/pi/agy session and herdr pane working on forgentX, mdview, mdview--wt--dogfood-agents, mcp-skill-hub (this lead pane closes itself after this report);
- `fgos gateway` per workspace (`fgos gateway stop`), background runner, any `fgos run` / `workflow` runner, any `npm test` (the full-suite queue holder);
- re-run `fgos doctor` `lock-fences`: its blocker list `{pid, cmdline, cwd, matched}` is the authority, not this snapshot.

### Order (P11 hand-off, A1)

1. Stop writers (list above).
2. ff-merge `holder-lock/integration` into main in the main checkout.
3. Install new `fgctl`; build/stage/activate **forgentX, mdview, mcp-skill-hub** (and any other workspace using provider capacity, M1). Activation runs the semantics probe + borrow vectors; a red one refuses.
4. Only after all activations: per workspace `fgos doctor --fix` (stop check → fences → re-check). A blocker → stop it, run again.
5. `fgos doctor` through the shim in all three: `active-release-matches-checkout`, `state-root`, `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-fences` pass; `lock-holders` no foreign holder. Expect `lock-fences` to warn in every workspace until step 4 (main: ~2253 legacy paths).
6. Rebase open worktrees; old branches meet fences and fail loudly (`EISDIR`, `lock-busy`, `already being advanced`, held by pid 1). Old branches also queue full suites separately from new ones.

### Rollback

- Before B4: revert the merge on main; activate the previous release in the three workspaces.
- After B4: stop every writer; revert the merge; activate the previous release; remove fences: `rm -r` each `TOMBSTONE` directory listed by `fenceStatus`, and in each provider ledger dir publish one more generation copying the blocking generation with `releasedAt` (or delete the ledger dir; owner accepted rebuilding that state). Record the commands run.

## Decisions taken

- Fence test settles on a time budget instead of a retry count (keeps the foreign-only assertion; no coverage lost).
- Full-suite queue on Windows: warn and run unqueued (the queue is a load-spreading convenience; plan A2 already says these locks are `unsupported` on Windows until 4.4). No-host-binary still stops loudly (P08 decision kept).
- Build-before-queue only when no host binary resolves (H1 without N1).
- Runtime kill-wait range aligned to doctor's (doctor and CHANGELOG already promised 1–60000).
- Worktree-only environment fix: generated `instruction-audit` wrapper copied from the main checkout (ignored path, not committed).

## Unresolved questions

None blocking. M1's condition (all provider-capacity workspaces on 4.2 before the first fence) is for the big lead/owner in section B.
