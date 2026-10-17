# Implementation report: fences and stop-everything check (holder-lock, phase 04)

Branch `holder-lock/p04-fences`, worktree `.claude/worktrees/hl-p04`. Phase file: `plans/261016-1104-holder-lock-kernel-lock-foundation/phase-04-fences-and-cutover-check.md`. Impact-analysis: inactive (new module, no existing symbol edited; `fgos tool query` could not be run in this sandbox, see "Tests").

## Files

| Action | File | What |
|---|---|---|
| create | `src/holder-lock/fences.mjs` | `checkStopped`, `placeFences`, `fenceStatus`, plus `fenceCutover` (the check -> place -> check order), `fenceTargets`, `ownPidChain`, constants `CUTOVER_RELEASE`, `FENCE_BY`, `TOMBSTONE_FILE`, `V1_LOCK_PRESENT`, `defaultProviderRuntimeDir` |
| create | `test/holder-lock/fixtures/extract-v1.mjs` | `extractV1Source({base = 'a9e48b67d'})` materializes `src/` of the base commit into a mkdtemp dir (`git archive <sha> src` piped to `tar -x`, the same bytes as `git show <sha>:<path>` per file, with a `node_modules` link so the old modules resolve `yaml`); `probeV1(handle, body, {timeoutMs, wrapper})` runs an old acquire in a child process with a hard timeout and reports `returned` / `threw` / `hung` |
| create | `test/holder-lock/fences-v1-tombstone.test.mjs` | tests 1, 3, 5 of the phase file plus half-written tombstone and `fenceStatus` |
| create | `test/holder-lock/fences-v1-ledger.test.mjs` | test 2 (incl. `bwrap --unshare-pid`), live/dead/released v1 holders, idempotency, no ledger without a runtime dir |
| create | `test/holder-lock/fences-stop-check.test.mjs` | test 4 through the real route `fgos internal quiesce-scan` (needs `FGOS_HOST_BIN` with the route, built by phase 02) |
| create | this report |

No other file touched. `bin/fgos.mjs`, `test/test-ownership.mjs`, registry, CHANGELOG untouched (the ownership manifest is opt-in: an unlisted source path falls through to the full-suite default, so no rule is needed).

## Behavior

### Which paths get a fence

`fenceTargets({fgosDir, workspaceRoot, providerRuntimeDir})` reads `packages/holder-lock/contracts/lock-registry.v1.json` and takes every row with `owner === "4.2"` and `fence` other than `none`/null. Rows owned by 4.3 (`main-checkout`, `merge-slot`, `state`, `porting-events`) also say `fence: tombstone` but their v1 locks are still the live locks of this release, so they are deliberately not fenced here; the owner filter is what keeps them out. A fenced 4.2 row this module cannot enumerate throws, so a registry edit cannot silently add an unfenced lock.

| Lock | Old path(s) fenced | How enumerated |
|---|---|---|
| gateway, runner, sessions, reconcile | `<fgosDir>/gateway.lock`, `runner.lock`, `sessions.lock`, `dispatch/reconcile.lock` | from the row's `v1Path` (`.fgos/...` relative to `fgosDir`) |
| advance | `<fgosDir>/workflow-runs/<id>/advance.lock` for every run dir present | `readdir` of `workflow-runs` |
| recovery | `<runDir>/.recovery.lock` for every assignment run present | `listAssignmentRuns(fgosDir)` (`src/runner/dispatch/assignment-layout.mjs`) |
| dispatch-cwd | `<fgosDir>/dispatch--<encodeURIComponent(cwd)>.lock` for the root and every linked worktree, each as `path.resolve` and as `realpath` | `git worktree list --porcelain` run in `workspaceRoot`; a non-git root yields only itself |
| provider-account | `<providerRuntimeDir>/account-locks/<p>/<a>/lock/` for every account dir present | `readdir` two levels down |
| provider-state | `<providerRuntimeDir>/state-lock/` | only if `providerRuntimeDir` exists (a home that never ran a provider gets nothing created) |

`providerRuntimeDir` defaults to `~/.fgos/runtime/provider-capacity` (the registry's `v1Path` root); tests pass a scratch dir so HOME is never touched.

### Tombstone

`mkdir` (exclusive) then write `TOMBSTONE` = `{"lock","at","by":"fgos 4.2"}`. `EEXIST` -> `lstat`: a directory with `TOMBSTONE` is skipped (idempotent); an empty directory (a crash between mkdir and write) is completed; anything else (file, symlink, non-empty dir) is `v1-lock-present`.

### Blocking generation

Highest ten-digit `NNNNNNNNNN.json` of the ledger is the current generation (same reader rule as the old `currentGeneration`). State: `absent` / `released` (`releasedAt` set) / `fenced` (`fence` field) / `dead` (holder pid and child pid both dead) / `v1-present` (either alive). Anything but `fenced` and `v1-present` gets epoch+1 published by fsynced temp + `link`; `EEXIST` re-reads and re-decides. Record: `{"holder":{"pid":1},"fence":"fgos 4.2","lock":<name>,"at":<iso>}` — no `processStartTime`, no `bootId`. Old code: `isPidAlive(1)` is true in every namespace (EPERM counts as alive), `resolveHolderLiveness` with no `processStartTime` returns `held`.

### `placeFences` never places half-way

`fenceStatus` runs first over every target; any `v1-present` path returns `{ok:false, error:'v1-lock-present', paths, placed:[], skipped:[]}` with nothing written. Only then are fences placed; a lock that appears in the window between check and write still stops the loop, with `placed` naming what landed before it. Second call: `placed: []`, every path in `skipped`.

### `checkStopped({workspaces, hostBin?, excludePids?, timeoutMs?})`

Per workspace: `<hostBin> internal quiesce-scan --protocol 1 --root <root> --exclude-pid <pid>...` (contract `packages/holder-lock/contracts/internal-route.quiesce-scan.v1.json`). `hostBin` defaults to `resolveHostBin()` (`FGOS_HOST_BIN`, then the activation). `excludePids` defaults to `ownPidChain()`: this pid and its ancestors via `/proc/<pid>/stat` (pid + ppid only off Linux). Exit 0/10/12 are parsed; 3 -> `host-version-mismatch`; anything else -> `quiesce-scan-failed` with stderr; stdout outside the contract -> `quiesce-scan-invalid-output`. Result `{status, blockers, scans, detail}`: every process is a blocker `{kind:'process', workspace, pid, startTime, cwd, cmdline, matched}`, `unreadable > 0` is a blocker `{kind:'unreadable', workspace, count}`; `blocked` beats `needs-attest` (any `unavailable` scan) beats `clean`. A `clean` result with processes listed is still treated as blocked.

### `fenceCutover({workspaces, fgosDir, workspaceRoot, providerRuntimeDir?, hostBin?, excludePids?, attested?, now?})`

`checkStopped` -> `placeFences` -> `checkStopped`. Blocked first scan: `{status:'blocked', before, fences:null, after:null}`, nothing placed. `needs-attest` without `attested: true`: same shape, nothing placed. `v1-lock-present`: `{status:'v1-lock-present', before, fences, after:null}`. Otherwise `placed`, or `placed-then-blocked` when the second scan finds a process that started during placement (it already fails against the fences; the list is for the person to stop it). Registering this as the `lock-fences` fix is phase 11's job.

## How each real v1 acquire fails on its fence (derived from the base-commit source; see "Tests" for what was not observed)

| v1 call (base `a9e48b67d`) | Path on tombstone | Expected failure | Hang risk |
|---|---|---|---|
| `acquireGatewayLock` (`src/runner/gateway-control.mjs`) | `link` -> EEXIST, `readFileSync(dir)` -> EISDIR not in its ENOENT/EPERM/EBUSY list | throws `EISDIR` at once | none (throws before its retry loop) |
| `acquireSessionsLock` (`src/runner/session.mjs`) | same shape | throws `EISDIR` | none |
| `acquireRunnerLock` (`src/runner/loop.mjs`) | same shape | throws `EISDIR` | none |
| `withAdvanceLock` via `resumeWorkflow` (`src/workflow/runner.mjs`) | `writeFileSync(wx)` -> EEXIST; `liveAdvanceHolder` swallows EISDIR -> null; `unlinkSync(dir)` swallowed; second attempt same | throws `RunnerConfigError` "already being advanced by another process" | none (two attempts, no sleep) |
| `withRunLock` via `recoverApplyUseCase` (`src/verbs/dispatch/recover.mjs`) | `openSync(wx)` -> EEXIST; `readLockHolderPid` swallows -> null | throws `RecoveryError` code `lock-busy` | none |
| `withLocalLock` via `applyReconciliation` (`src/runner/dispatch/reconciliation-planner.mjs`) | `openSync(wx)` -> EEXIST; `JSON.parse(readFileSync(dir))` throws, caught | returns `{outcome:'blocked', reason:'another reconcile apply is in progress'}` (a refusal, not an exception) | none |
| `acquireMainCheckoutLock({lockFile: dispatchLockFile(cwd)})` (`src/runner/main-checkout-lock.mjs`) | `writeAtomicCreate` link -> EEXIST; `readFileSync(dir)` -> EISDIR (only ENOENT handled) | throws `EISDIR` | none |
| `tryAcquireAccountLock` (`src/runner/dispatch/provider-capacity.mjs`) | blocking generation | returns `null` | none (non-waiting) |
| `withFileLock(state-lock)` | blocking generation | throws `ProviderCapacityLockError` "still held by a live process (pid 1)" after `waitMs` | its own `waitMs` (30 s default; the test passes 300 ms) |

`acquireGatewayLock`/`acquireSessionsLock` have retry loops with sleeps, but they never reach them: the EISDIR is thrown from the first attempt. Every probe still runs under `probeV1`'s 15 s hard timeout and `hung` is a failing outcome. For CHANGELOG (phase 11 owns the file): "an older fgOS binary run against a fenced workspace fails at its first lock with a raw `EISDIR`, `lock-busy`, `already being advanced`, or `ProviderCapacityLockError (pid 1)`; this is the intended loud failure, never delete a `TOMBSTONE` directory or a pid-1 generation by hand unless rolling back to a release before 4.2".

## Tests

### What each file covers

`fences-v1-tombstone.test.mjs`
- every old file-lock path of a workspace (root + one linked worktree, one workflow run, one assignment run) gets a tombstone, dispatch cwd in both `path.resolve` and `realpath` form; TOMBSTONE record shape; `fenceStatus.complete`.
- the seven real v1 acquires above, each in a child process with a 15 s ceiling: must not hang, must not acquire, must fail the expected way; tombstones untouched afterwards. Each observed failure is emitted as a test diagnostic.
- an old `gateway.lock` file present: `v1-lock-present`, nothing placed anywhere, file bytes unchanged; after removing it the same call places everything.
- idempotency: second `placeFences` places nothing, skips everything, records byte-identical.
- an empty tombstone directory (crash before the record) is completed, not refused.
- `fenceStatus` before/after.

`fences-v1-ledger.test.mjs`
- v1 `tryAcquireAccountLock` -> handle and `withFileLock` -> runs before the fence; after: `null` and `ProviderCapacityLockError` naming pid 1; the fence record has `holder: {pid: 1}`, no start time, no boot id; refusals leave the ledger unchanged.
- same `tryAcquireAccountLock` inside `bwrap --unshare-pid --dev-bind / / --proc /proc` -> `null`; skipped only when `bwrap` is absent or cannot create the namespace here (its own stderr is the skip reason).
- a live v1 holder (a child process that took the account lock with the v1 code): `v1-lock-present`, nothing placed in either ledger, holder's generation untouched; after SIGKILL the dead generation is superseded by the fence.
- a released v1 generation is superseded; second placement adds no generation.
- no runtime dir -> no ledger targets, nothing created.

`fences-stop-check.test.mjs` (asserts `FGOS_HOST_BIN`, as the rust-host tests do)
- `ownPidChain` shape.
- empty workspace -> `clean`, `unreadable == 0`.
- `node bin/fgos.mjs` (a payload that only stays alive) with cwd in the workspace -> `blocked` with its pid, `matched` in the contract enum; killed -> `clean`.
- `fenceCutover` with a running payload -> `blocked`, nothing placed.
- first scan clean -> payload starts -> `placeFences` -> second scan reports it (the mid-window case, built from the public pieces).
- `fenceCutover` on a clean workspace -> `placed`, `after.status === 'clean'`, `fenceStatus.complete`.
- `--exclude-pid`: a pid the caller declares is not counted; without it the same pid is.

### Commands and observed results

```
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build with quiesce-scan> node --test test/holder-lock/fences-v1-tombstone.test.mjs test/holder-lock/fences-v1-ledger.test.mjs test/holder-lock/fences-stop-check.test.mjs
```

**Not run: sandbox.** Every execution form was refused with "This command requires approval": `node --test <file>` (also on the pre-existing `test/holder-lock/registry-contract.test.mjs`), `env -u ... node --test`, `rtk proxy node --test`, `/home/vantt/.local/bin/node --test`, `npm test -- <file>`, `node --check <file>`, `node <script>`, `cargo --version`. Only `node --version`, `git show`/`git grep`/`git ls-files`, `mkdir`, `rm`, `ls -d`, `sed -n`, `which` ran. So there is **no observed pass count**; the failure-mode table above is derived by reading the base-commit source, not by running it, and the Lead's run is the first run. The first two files need only git, tar and node; the third needs a host binary with the `quiesce-scan` route, which is being built in phase 02 and is not on this branch, so it is expected to fail with "set FGOS_HOST_BIN ..." or an unknown-route error until phase 02 lands.

The v1 fixture extraction was also not exercised; the only risk I see is import-time side effects in the base `src/workflow/runner.mjs` graph (it is the entry for the `withAdvanceLock` probe). If a probe reports `threw` with an import error rather than the expected refusal, that is the fixture reaching too far, not the fence failing.

### Workflow note

`ak:cook` was not invoked: with no way to execute anything in this sandbox its test step could not run either, and its review/commit steps would have reached outside the owned files. Its implement -> test -> review sequence was followed by hand (test = the "not run" above; review = a desk pass over the four source files against the base-commit v1 code, recorded in the failure-mode table).

## Deviations from the phase file

1. **No `lockRoot` parameter.** Every old path is derived from `fgosDir`, `workspaceRoot` and the provider-capacity runtime dir; nothing v1 lives under the v3 lock root, so `placeFences({fgosDir, lockRoot, workspaceRoot})` became `placeFences({fgosDir, workspaceRoot, providerRuntimeDir})`. An extra `lockRoot` key passed by a caller is ignored harmlessly. `providerRuntimeDir` exists so the ledger fences can be tested without touching `~/.fgos`.
2. **Claims are not walked separately.** A claim's checkout is only ever found through `findCheckoutPath(git worktree list --porcelain, branch)`, so the worktree listing already contains every claim cwd; a separate claims pass could not add a path.
3. **Only `owner: "4.2"` rows are fenced** (reason above). The phase text says "every lock with `fence != none`"; taken literally that would tombstone `main-checkout.lock` and the hot locks, which this release still uses.
4. **`fenceCutover` added** as the body of the check -> place -> check order the phase describes for the `lock-fences` fix, so phase 11 registers it instead of re-deriving the order. `attested: true` is how a person's confirmation reaches it on a platform whose scan is `unavailable`; phase 11 decides how that confirmation is collected.
5. **Unexported v1 helpers** (`withAdvanceLock`, `withRunLock`, `withLocalLock`) are reached through their real public callers (`resumeWorkflow`, `recoverApplyUseCase`, `applyReconciliation`) with the minimal real state each needs (a `workflow.start` event, a `run.json`, a repair-projection plan).
6. **Route flags follow the contract file** (`--root`, `--exclude-pid`, exit 3 = mismatch), not the phase-02 prose (`--workspace`, `--state-root`, exit 4). If phase 02 ships the prose shape, `scanWorkspace` in `fences.mjs` is the one place to change.
7. `git archive` + `tar` instead of one `git show` per file: the old modules import their siblings, so the whole `src/` tree is needed; the bytes are identical.

## Open questions / risks for the Lead

- **Route semantics decide whether `clean` is ever reachable.** The contract counts every unreadable `/proc` entry; on a machine with processes of other users (root daemons), `environ`/`cwd` of those pids are unreadable for a normal user. If phase 02 counts them, `checkStopped` never returns `clean` and `fenceCutover` never places anything. Likewise "environ carrying `FGOS_STATE_ROOT`" read literally flags every fgOS process of every workspace on the machine, which would make the `clean` tests depend on what else the owner has open. Worth settling with phase 02 before acceptance.
- `TOMBSTONE.by` and the generation `fence` field carry the literal `fgos 4.2` the phase file prescribes (`FENCE_BY`); the registry `owner` value `"4.2"` is the same string, so `CUTOVER_RELEASE` is the one constant behind both.
- Rollback note for the phase-12 runbook: remove exactly the `TOMBSTONE` directories `fenceStatus` lists; leave blocking generations and publish one more generation with `releasedAt` on top.
