# Review: `harden/recheck-fixes` (HARDEN re-check, batch A)

Reviewer: code-reviewer subagent. Read only. Range `origin/main..HEAD`: 14 commits, `9e36152fc`..`6088b3fc0`, branched from `984ee3d91`. `origin/main` has since moved to `45a4bc624`, which changes only board and plan files, so nothing overlaps.

## Verdict: CHANGES

The Windows lock probe (R2) is the headline fix of the batch, and it does not work where the hook really runs. It is fail-closed, so nothing becomes unsafe. But Windows commits are still refused every time, now with a different message. It also brings in a side effect (predecessor cleanup) that the Unix probe does not have. The other twelve items are correct, apart from one missed L10 leftover and one weakened proof caused by the `import-legacy` deletion.

## Findings

### High

**H1. The Windows probe needs the in-process process door, and that door refuses inside the hook, so every Windows commit is still refused.**
`src/holder-lock/hold-transport.mjs:207-218` (`probeSharedSync`), used from `.githooks/pre-commit:171-173`.
- **Cause.** `probeSharedSync` polls the helper through `waitReadySync` → `pollReady` → `helperAlive` → `observe(pid)` (`src/runner/dispatch/process-identity.mjs:19`, which goes to `nativeDoor().process`). It releases through `terminateSync` → `helperAlive`, which takes the same path.
- **Why the door refuses.** The hook runs from the source checkout (`../src/...` imports). The hook's own header says the in-process door refuses there (`.githooks/pre-commit:109-112`). AGENTS.md says the same: `process-door-not-shipped` from a checkout.
- **Scenario.** On Windows, the first poll finds no `ready.json` yet, because a process start takes milliseconds. `helperAlive` then throws `process-door-not-shipped`, and the hook answers `kind: 'error'` and refuses: "the main-checkout lock could not be checked (process-door-not-shipped ...)". If the helper does answer `acquired` first, `releaseHold` → `terminateSync` throws in the same way. Only a `held` answer avoids the door. So R2's goal (a real free/held answer on Windows) is not met.
- **Reproduced on Linux.** Run from the worktree with the hook's environment (no `FGOS_ACTIVE_MANIFEST_PATH` or `FGOS_HOST_BIN`). A stand-in helper that answers `acquired` after 30 ms gives `THROW process-door-not-shipped`. `observe(process.pid)` throws the same error from both the worktree and the main checkout.
- **Why the new test passes.** `test/holder-lock/hold-transport-borrow.test.mjs:185-200` runs under `run-tests.mjs`, which stages a door through `FGOS_ACTIVE_MANIFEST_PATH` (`scripts/run-tests.mjs:120-122`). The hook never has that door. The proof covers an environment the hook never runs in.
- **Fix shape.** Do what the audit asked for: "a route that probes by path".
  - Give the Windows build of `fgos internal lock-fd --shared-try` a `--path <lockFile>` form. Today `packages/holder-lock/rust/src/route.rs:240` answers `unsupported-platform`. The new form opens the file and calls `port::lock_description(&file, Mode::Sh, Wait::Try)`, exactly like the Unix `shared_try` at `route.rs:245-260`.
  - The hook calls it through `runLockRouteSync` with no fd. That is a pure process boundary, with no in-process door, no helper lifecycle and no `ROUTE_SLACK_MS` bound.
  - Delete `probeSharedSync`, the `mode` argument it added to `startHold` (no other caller passes `mode`), and its three stand-in tests.
  - Proof: a Rust route test, `cargo check --target x86_64-pc-windows-msvc`, and one Node wiring test that runs the hook's verdict under `lockTransport('hold')` without `FGOS_ACTIVE_MANIFEST_PATH`.

**H2. The probe takes a full `lock-hold` acquire, so a `git commit` runs predecessor admission. That kills a dead holder's leftover domain and deletes its record. The Unix probe does neither.**
`packages/holder-lock/rust/src/port.rs:761-770` and `packages/holder-lock/rust/src/predecessor.rs:272-291`, reached through `lock-hold --mode sh --try`.
- **What admission does.** `port::acquire` runs `predecessor::admit_with_trace` after it takes the lock, in shared mode too. When `<lock>.predecessor.json` names a domain that is not empty, it calls `kill_all` (up to `--kill-wait-ms`, 2000 ms) and `remove_record`. When the record is unreadable or has an unknown kind, it answers `held` with `predecessor-domain-not-empty`.
- **Why it matters for main-checkout.** The main-checkout lock creates a `windows-job` domain whenever it lends the lock to a borrowed child (`packages/holder-lock/contracts/main-checkout-borrow.v1.json`). So this case is real.
- **Scenario A.** A land's helper dies abnormally and leaves its borrowed job running. The user's next manual `git commit` on Windows now kills that job and clears the record. That recovery used to belong to the next fgOS holder.
- **Scenario B.** A malformed or newer-version predecessor record makes every Windows commit refuse with "fgOS is writing the main checkout right now", which is untrue. On Unix the same commit goes through.
- The hook comment that "it never obstructs a holder ... a millisecond, not a Node start" (`.githooks/pre-commit:141-146`) is false for this path.
- **Fix shape.** The same as H1. A bare `lock_description` try runs no admission.

### Medium

**M1. On Windows the hook never asks the borrower check, so fgOS's own borrowed commit would be refused once H1 is fixed.** (This was there before the branch, but it is part of R2.)
`.githooks/pre-commit:150` checks for a borrower only when `process.env[LOCK_FD_ENV]` is set. Windows borrowers carry `FGOS_LOCK_JOB` (`src/holder-lock/protocol.mjs:15`; `checkBorrowedJob`, `src/holder-lock/index.mjs:635,663-671`).
- **Scenario.** A land on Windows borrows `git commit` into its helper job. The hook skips the borrower check and probes. The holder holds the lock exclusively, so the probe answers `held` and the hook refuses fgOS's own commit.
- **Fix shape.** Gate on `process.env[LOCK_FD_ENV] || process.env[LOCK_JOB_ENV]`, or always call `checkBorrowedDescription`, which already answers `not-borrower` when neither variable is set. Add it to the R2 fix, or record it as a separate item.

**M2. Deleting `import-legacy` left the imported-time path of `tx.append` without a caller (L10), and its only proof went with the deleted test.**
`src/state/hot-lock.mjs:238-271` (`isExactIsoTime` and the `opts.ts` override in `tx.append`).
- **History.** The override was added for the import verb (`db00088c0`, `d86c80c15`, `4962c15ad`). No production call to `tx.append` passes `ts` any more: I checked every call in `src/state/store.mjs`, `porting-store.mjs` and `runner/loop.mjs`, and every FSM raw event carries only `{type, payload}`.
- **Lost proof.** The only proof that `append` refuses a time that is not an exact ISO time was in the deleted `test/event-store/import-legacy.test.mjs` ("has ts 2026-10-21, which is not an exact ISO time"). So a behaviour that still exists in code lost its proof.
- **Fix shape.** In the same change, delete the `ts` override and `isExactIsoTime`, so `append` always stamps `new Date().toISOString()`, and fix the comment at `hot-lock.mjs:266`. If some other consumer is meant to keep imported times, keep the path and move one proof into `test/state/hot-lock-tx.test.mjs`.

### Low

**L1. The new dev-host test re-proves a case another test owns, and leaves the new prune rule unproven.**
`test/scripts/run-rust-dev-host-staging.test.mjs:93-102`.
- The second half (`pruneRunDirs(base)` keeps a young directory) repeats "an unused staged host is removed at once, and a young one is never pruned" in the same file.
- The new rule (with an `unsupported` scan, a stale directory is removed) has no proof. The lead's report admits this.
- **Fix shape.** `pruneRunDirs` already takes `{ now, staleMs }`. Add the same `views` input that `releaseRunDir` takes, which is the caller's scan and not a test-only flag. Then assert `pruneRunDirs(base, { now: Date.now() + STALE_RUN_DIR_MS + 1, views: 'unsupported' })` removes the directory. Drop the repeated half.

**L2. On Windows and macOS, the stale-directory removal does not catch errors and can remove a host that is still running.**
`scripts/run-rust-dev-host.mjs:80`.
- On Windows, `fs.rmSync` of a directory whose `fgos.exe` is still running (a detached supervisor older than 10 minutes) throws `EPERM`/`EBUSY` and aborts the dev invocation.
- On macOS the unlink succeeds and removes the files from under that supervisor.
- This is not a regression: before the branch the directory was removed at once. **Fix shape:** catch errors around each directory's removal. Whether the 10-minute age floor is right for long detached runs on unscannable platforms is an open question for the owner.

**L3. One comment overstates the saving.**
`src/setup/git-checks.mjs:29-32` says "five rows cost one `inspectGit`". `git-repository-config` still runs a second `inspectGit(..., 'origin')` when the remote is not `origin` (`git-checks.mjs:58`), and the worktree-recovery view is a separate inspection. Cosmetic.

## Per-commit check

| Commit | Item | Result |
|---|---|---|
| `9e36152fc` | R2 Windows probe | **CHANGES** (H1, H2; M1 is adjacent). It is fail-closed: `held`, `unavailable`, `error`, no answer within the bound (helper killed through `abandon`), and a stuck release all end as `error` or `held`, and the hook refuses. The bound is 3000 ms (`DEFAULT_KILL_WAIT_MS` + `ROUTE_SLACK_MS`), against 2000 ms before. |
| `66028cc47` | One scan per prune | OK. The scan is taken lazily at the first stale directory. A process cannot newly start inside a directory older than 10 minutes, except as a child of a holder the scan already lists. |
| `6088b3fc0` | Keep when the scan is `unsupported` | OK as behaviour (strictly better than the old "remove at once"). See L1 and L2. Not keeping on `unreadable` views goes against the audit's fix shape, but I accept it: the detached child runs as the same user, so its view is readable, and 440 of 612 views are unreadable. |
| `af594ca3a` | Test comments | OK. `test/process/process-facts-vectors.test.mjs` exists. |
| `9d1fb1632` | Remove the `native-addon.json` route | OK. Nothing outside `docs/` and `plans/` produces or reads that file. The refusal (`git-addon-not-shipped`, `process-door-not-shipped`) is asserted. The removed assertions cover behaviour that was removed. `fs`, `path` and `OWN_PAYLOAD_ROOT` are still used by `ownRelease`. |
| `8635bd18b` | `uniqueTmpTag` | OK, both sites. |
| `3121e5992` | Mint reuses `door()` | OK. Same message and code (`host-missing`). |
| `af4a4712c` | `routeEnv` to the leaf | OK. Every import moved; no import from `driver.mjs` remains; the only `delete …FGOS_INVOCATION_RECORD_PATH` left is in `host-bin-path.mjs:103`; one owning test was added. (`terminal-control-checks.mjs:38` has a local variable named `routeEnv`, which is unrelated.) |
| `b767694b3` | Delete `next-doc-id` | OK. No references outside `docs/` and `archive/`. The retired exclude test belongs to the removed exclusion. |
| `226cbaa03` | One `inspectGit` per run | OK. `bin/fgos.mjs:4171-4176` runs `runFixes` before `createDoctorRun()`, so `--fix` never sees a cached pre-fix inspection. A throw is cached inside `checkGit`'s `try`, so each row still reports the error itself. The key includes `cwd`. There is no other `DOCTOR_CHECKS` iterator. See L3. |
| `c8fb19bf7` | Delete `import-legacy` | The verb, route, registry entry, use case, test, baseline row and CHANGELOG entry are all handled. **M2** remains. `docs/architecture-manifest.json:352` is left as stated. |
| `1eb5130ce` | Wording | OK. Comments and the contract `protocolNote` only. Rust change is comment-only. |
| `27476e80d` | One proof of the hook refusal | OK. It names its owner, `test/e2e/main-checkout-activity-beacon.test.mjs:96`, which exists and asserts the refusal and its message. The land test keeps its own reference-transaction proof. |
| `5a2069645` | Report | n/a |

## Checks 2 to 5

- **L10:** clean apart from M2. Searched `src bin scripts packages apps test .githooks` for `routeEnv`, `FGOS_INVOCATION_RECORD_PATH`, `native-addon.json`, `next-doc-id`, `import-legacy`, `importLegacy`, `isExactIsoTime` and the `tx.append` callers.
- **One proof:** each retired test names its owner or removed behaviour, except M2 (an existing behaviour lost its only proof). L1 is a repeated assertion.
- **No test-only switches:** the diff adds no `process.env.*` read to `src`, `bin`, `scripts` or `.githooks`. The new seams (`views`, `env`, `run`) are ordinary caller inputs.
- **`docs/`:** untouched (`git diff --stat origin/main...HEAD -- docs` is empty).
- **Architecture:** in the branch run, `test/architecture.test.mjs` fails exactly two tests ("file .mjs on disk vs manifest row" and "one-way imports"). Both are caused by row 352 (`src/verbs/events/import-legacy.mjs`). The import-direction test stops at the first `ENOENT`, so I removed row 352 in a `git archive` copy and re-ran the file. The import-direction and manifest tests then pass. The only remaining failures were the two tests that need a Git checkout and the addon (`git ls-files` and the A4 literal guard), and both pass in the real worktree. So row 352 is the only architecture failure.

## What I verified and how

- Read every commit diff (`git show`), plus the surrounding code: `hold-transport.mjs`, `driver.mjs`, `index.mjs` (borrower checks), Rust `route.rs` `shared_try` and `lock_hold`, `port.rs` `acquire_traced`, `predecessor.rs` `judge`, the contracts `internal-route.lock-hold.v1.json` and `predecessor.v1.json`, `process-identity.mjs`, `stop-processes-inside.mjs`, `git-checks.mjs`, `createDoctorRun`, the doctor loop in `bin/fgos.mjs`, and `hot-lock.mjs` `tx.append`.
- Ran the H1 reproduction described above.
- Focused tests through `runChosenTests` (`CARGO_TARGET_DIR=.../harden-recheck-review-target`, now deleted). I ran 16 files: hold-transport-borrow, run-rust-dev-host-staging, git-checks, host-bin-path, native-load, checks-setup-rc-line, triggers, land-vs-manual-commit, architecture, check-decision-codes, session-identity, main-checkout-activity-beacon, store-hardening, e3-census, one-door and command-registry.
  - Result: 168 tests, 164 pass, 2 fail (both from row 352), 2 skipped.
  - No stray processes, worktrees or `.fgos` leaks were reported.
- Nothing was run on Windows. H1 and H2 come from reading the code, plus the Linux reproduction of the door refusal.

## Unresolved questions

1. Is predecessor recovery from a user's `git commit` ever wanted? I assumed not, because the Unix probe never does it.
2. Is a 10-minute age floor safe for detached dev-host runs on macOS and Windows (L2)? That is a decision for the owner.

Status: DONE_WITH_CONCERNS
Summary: CHANGES. Twelve of the thirteen fix items are correct, but the Windows probe (R2) needs the in-process process door, which refuses inside the hook, so Windows commits are still refused; it also runs predecessor admission that the Unix probe does not. The `import-legacy` deletion also left the imported-time path of `tx.append` with no caller and no proof.
Concerns/Blockers: Nothing was verified on Windows. H1 is proven by reading the code and by a Linux reproduction of the door refusal.

---

## Re-review (2026-10-28): fix commits `958812a82`, `e9bbc7687`, `ca3716d5d`, `a72db9996` and `95cd1aac4`

### Verdict: APPROVE

Each finding is fixed in the shape the first review proposed. I found no new defect. One thing must still happen at landing: delete row 352 of `docs/architecture-manifest.json`.

| Finding | Commit | Result |
|---|---|---|
| H1: Windows probe needs the in-process door | `958812a82` | **Fixed.** On Windows the hook now calls `runLockRouteSync({ args: ['--shared-try-path', lockPath] })` (`.githooks/pre-commit:168-171`). That is a plain process boundary with no fd, no in-process door and no helper. `probeSharedSync`, the `mode` argument it added to `startHold`, and its three stand-in tests are gone (`rg probeSharedSync` finds nothing). `runLockRouteSync` with `fd === undefined` passes no slot 3 (`driver.mjs`). The route answers `free`, `held`, `unavailable` or `error`, and the hook still treats anything other than `free` or `held` as an error and refuses. The bound is back to `ROUTE_CALL_TIMEOUT_MS` (2000 ms). |
| H2: predecessor admission runs on a commit | `958812a82` | **Fixed.** `shared_try_path` (`route.rs`) opens the existing file read-only, which never creates or truncates it. It calls only `port::lock_description(Sh, Try)` and never `port::acquire`, so no predecessor admission and no kill can happen. It unlocks and closes before it answers. The Unix fd form now shares `shared_probe` with it, and its behaviour is unchanged. The `lock-fd` contract documents the new flag and says the Windows `--shared-try` still answers `unsupported-platform`. |
| M1: Windows borrower check skipped | `e9bbc7687` | **Fixed.** The gate is now `process.env[LOCK_FD_ENV] \|\| process.env[LOCK_JOB_ENV]` (`pre-commit:150`). `LOCK_JOB_ENV` is exported from `src/holder-lock/index.mjs:57`. On Linux, a stray `FGOS_LOCK_JOB` makes the facade answer `not-borrower` (`fd-missing`), so the probe still decides. |
| M2: orphaned `ts` path and lost proof | `ca3716d5d` | **Fixed.** `isExactIsoTime` and the `opts.ts` override are deleted, and `append` always stamps now. No reference is left in `src bin scripts packages apps test .githooks`. The `hot-lock-tx` test now proves the stamping that remains: a time the caller names is ignored and the stamp is exact ISO. Nothing that still exists lost its proof. |
| L1: test repeat and missing proof | `a72db9996` | **Fixed.** `pruneRunDirs` takes `views` as an ordinary input, as `releaseRunDir` already does; it defaults to the real scan and is not a test switch. The test now proves that a stale directory is removed when the scan is `unsupported`. The repeated young-directory half is gone; the earlier test in the file still owns that rule. |
| L2: unguarded removal | `a72db9996` | **Fixed.** A failed removal is caught for each directory and left for the next prune. The catch covers everything, but with a supplied `views` the only thing that can throw there is `rmSync`, so I accept it. The question about the age floor stays with the owner. |
| L3: comment | `95cd1aac4` | **Fixed.** The comment now states the extra `inspectGit` when the remote is not `origin`. |

#### Residual (not blocking)

- **No Linux proof of the hook's Windows wiring.** The one Node test that runs the path form, `windows-borrow.test.mjs`, "the shared try by path ...", skips on Linux. On Linux the route behaviour is proven in Rust by `apps/fgos/tests/internal_lock_routes.rs`, "shared_try_path_answers_free_or_held_without_creating_or_obstructing". What stays unproven on Linux is only the hook's choice by `lockTransport()`, which is one line. Nothing was run on a real Windows machine.

#### Verified, and how

- **Rust**
  - `cargo test -p fgos --test internal_lock_routes`: 8 passed, including the new path-form test (free, held without waiting, owner's lock untouched, missing file refused and not created).
  - `cargo clippy -p fgos-holder-lock -- -D warnings`: exit 0.
  - `cargo check -p fgos-holder-lock --target x86_64-pc-windows-msvc`: exit 0.
- **Node** (focused, through `runChosenTests`): hot-lock-tx, run-rust-dev-host-staging, hold-transport-borrow, windows-borrow, main-checkout-activity-beacon, architecture, e3-census, one-door and git-checks.
  - Result: 97 tests, 90 pass, 5 skipped, 2 fail.
  - The 2 failures are only the two architecture tests caused by row 352, as before.
  - No stray processes, worktrees or `.fgos` leaks.
- **Cleanup:** the private target dir is deleted, and the worktree is clean (`git status` is empty).

Status: DONE
Summary: Re-review APPROVE. H1, H2, M1, M2 and L1 to L3 are all fixed as proposed: the Windows hook now probes through a by-path route with no in-process door and no predecessor admission. Focused Rust and Node tests, clippy and the msvc check are green, apart from the known row-352 architecture failure.
Concerns/Blockers: Row 352 of `docs/architecture-manifest.json` must be deleted at landing. Nothing was run on a real Windows machine.
