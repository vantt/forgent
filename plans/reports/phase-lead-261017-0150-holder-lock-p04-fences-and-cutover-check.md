# Phase lead report: holder-lock P04 — fences for old binaries + stop-everything check

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-04-fences-and-cutover-check.md`
- Branch `holder-lock/p04-fences`, merged into `holder-lock/integration` as `7f833f937` (`--no-ff`)
- Starting point: draft `67c65627e` + `96d4c9b9f` written before P02 existed and **never executed** (see `implementation-261016-1308-holder-lock-p04-fences.md`; its behavior description, failure-mode table and "Deviations" 1–7 stay valid and are accepted by this lead). First step here: merged `holder-lock/integration` (`1b5aed534`, P00–P03) into the phase branch, then ran everything against the real P02 host.
- Impact analysis: GitNexus index stale (last `b334695`, before this track). Grep cross-check: `quiesce::scan` is called only from the `quiesce-scan` route dispatch (`route.rs`); its only consumer is `src/holder-lock/fences.mjs` (`checkStopped`). Risk LOW. No HIGH/CRITICAL.

## What changed in this round

| Change | Why |
|---|---|
| `route.rs` `could_be_fgos`: an own-uid process with unreadable cwd/environ counts as `unreadable` only when its argv is unreadable or argv[0] names node (`node`, `nodejs`, `node<version>`), `bun`, `deno` or a fgOS binary | **Real product bug found by the first run.** systemd's `(sd-pam)` is an own-uid process whose cwd/environ are unreadable for its own user. It is there on every systemd machine, so the old rule could never give `clean`, and `fenceCutover` would never place a fence. Negative control: the unpatched host fails 4/7 stop-check tests with `{"kind":"unreadable","count":1}`. Argv stays readable without ptrace access, so this keeps the fail-closed rule for anything that could run fgOS code |
| Contract `internal-route.quiesce-scan.v1.json` `unreadableEntries` states the argv exemption | The route behavior and the contract text must match (review finding) |
| `fences.mjs` `highestGenerationEpoch`: a new ledger generation goes above the highest *named* epoch, readable or not | Review finding (High): when a corrupt file sat on top of the ledger, the publish loop picked the same epoch every time and failed `link` forever. The old reader ignores corrupt files, so a fence above one is still authoritative. New test proves it with the real v1 `withFileLock` |
| `fences-stop-check.test.mjs`: `foreignPids()` + `settledScan()` | The scan treats any `fgos` argv as a blocker for every workspace, by P02 design. That is right for a cutover, but this machine always has other sessions' `fgos doctor` and test processes running. The tests declare the processes that are already running, read from a probe workspace where the test starts nothing, through the real `excludePids` API, and remove the test's own children from that list. Each test still asserts that its own payload pid blocks. A scan blocked only by processes that appeared later is retried (at most 20 times) |
| `docs/architecture-manifest.json`: `src/holder-lock/fences.mjs` → `infra` | `architecture.test.mjs` requires one row per module |

## Evidence

| # | Phase test group | Result |
|---|---|---|
| 1 | Tombstones vs real v1 code (base `a9e48b67d`): gateway/sessions/runner → `EISDIR`; advance → "already being advanced"; recovery → `lock-busy`; reconcile → `{outcome:'blocked'}`; dispatch cwd → `EISDIR`. None hangs (15 s probe ceiling, each < 600 ms total) | pass |
| 2 | Blocking generation vs real v1: `tryAcquireAccountLock` handle → `null` after; `withFileLock(state-lock)` → `ProviderCapacityLockError` (300 ms waitMs); also inside `bwrap --unshare-pid` → `null` | pass |
| 3 | v1 file present → `v1-lock-present`, nothing placed, file unchanged; live v1 ledger holder → refused, generation kept | pass |
| 4 | Stop check through the real `fgos internal quiesce-scan`: payload with cwd in the workspace → blocker; gone → clean; late starter seen by the second scan; blocked first scan → nothing placed; clean → `placed` and clean after | pass |
| 5 | Idempotent: second `placeFences` places nothing; half-written tombstone completed; corrupt top generation handled | pass |

Commands (`FGOS_HOST_BIN` = phase-private build `CARGO_TARGET_DIR=.fgos/runtime/tmp/cargo-p04` of this branch, `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`):
- `node --test test/holder-lock/fences-*.test.mjs`: **19/19 pass** (phase branch).
- `node --test test/holder-lock/*.test.mjs test/rust-host/internal-routes.test.mjs test/architecture.test.mjs`: 97 tests, 95 pass, 0 fail, 2 skipped (NFS mount absent; Windows vector). Same result on integration `7f833f937`, whose tree is identical to the phase branch.
- `cargo test --no-fail-fast -p fgos-holder-lock -p fgos-process -p fgos`: 102 passed, 0 failed (incl. new `an_unreadable_process_counts_only_when_its_argv_could_be_fgos`).
- Full `npm test` not run (P12 gate, RAM constraint). The "S1 live probe" failure from the brief did not come up in these suites.

## Decisions (lead)

1. Fix the `unreadable` rule in the P02 route instead of exempting it in Node. Node only gets a count, and the fault is in how the route counts. The rule is: when argv can be read and does not name a runtime that can run fgOS code, the process is not counted.
2. Accept every deviation in the draft report: no `lockRoot` parameter; only `owner: "4.2"` rows are fenced (the 4.3 rows are still live locks); claims come from `git worktree list`; `fenceCutover` (check → place → check, with `attested`) is the body P11 registers; route flags follow the contract.
3. Leave the CHANGELOG line to P11, which owns `CHANGELOG.md`. Proposed text: "an older fgOS binary run against a fenced workspace fails at its first lock with `EISDIR`, `lock-busy`, `already being advanced`, or `ProviderCapacityLockError (pid 1)`; never delete a `TOMBSTONE` directory or a pid-1 generation by hand unless rolling back to a release before 4.2". No v1 acquire hangs. `withFileLock` waits its own `waitMs` (30 s by default) before it throws.
4. Leave `tombstoneState` as it is: any directory holding a `TOMBSTONE` file counts as fenced. The reviewer rated this Low; v1 lock paths are files, so it only matters for state someone built by hand.
5. Skip the journal; the controller owns `plan.md` status.

## Concerns

- The scan is deliberately broad: any `fgos` argv on the machine blocks every workspace. On a busy machine, `lock-fences` will refuse until every fgOS process of every session has stopped. That is the A1 intent. P11's fix message should list the blockers, and it does get them as `{pid, cmdline, cwd, matched}`.
- Not covered by the argv rule: an unreadable fgOS process started through some other runtime name (`tsx`, `electron`, `npx` wrappers). This only applies when the process's cwd and environ are also unreadable, which is rare for a same-uid process. The contract records the rule.
- Not measured on macOS: the scan answers `unavailable`, so the result is `needs-attest`.

## Unresolved questions

None.
