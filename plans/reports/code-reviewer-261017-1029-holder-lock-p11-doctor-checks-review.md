# Review: holder-lock P11 (doctor, setup, spec, changelog), 30e3c0c2d..HEAD

Branch holder-lock/p11-doctor-docs, worktree hl-p11. Nothing was edited or committed. The only file written is this report.

## Verified by running

| Run | Result |
|---|---|
| `node --test test/setup/holder-lock-checks.test.mjs` | 12/12 pass |
| `checks.test.mjs`, `checks-doctor-config.test.mjs` | 185 pass, 0 fail |
| `doctor-fresh-run`, `doctor-strict-exit`, `dir-resolution`, `provider-capacity.test.mjs` | 44 pass |
| `test/architecture.test.mjs` | 24 pass |
| Real `fgos doctor --json` in a scratch git repo (temp HOME, XDG_STATE_HOME, host built from this tree) | The six checks appear. Levels: semantics = warn (machine dir missing), vectors = pass, holders = pass, fences = warn "5 of 5 not fenced", kill-wait = pass (default), state-root = pass. |
| Real `fgos setup --json` in a scratch repo | `lock-dirs` created both dirs at 0700. `lock-fences` refused: "no readable activation". `lock` key written to project and to HOME/.fgos/config.json. |
| `twoProcessProbe` with PATH lacking `sleep` | Rejects with the named error. No hang, no leftover file, no leaked fd. |

## Acceptance criteria (a)

All met.

- Six checks are registered with the levels the phase asks for. The warn and info paths are covered by tests.
- Setup creates `<lockRoot>` and `<fgosDir>/locks` at 0700, but see M1.
- The config default `lock: {predecessorKillWaitMs: 2000}` is registered. `config-not-stale` tests were updated.
- `provider-capacity-lock-stale` and `inspectProviderCapacityLock` are gone.
  - Remaining hits are the `ProviderCapacityLockError.code` string and an old CHANGELOG entry. That is not the doctor check, and is fine.
- CHANGELOG has the Added, Changed and Removed lines the phase lists.
- `distribution.md` rows 5d/5g/7/7b, the reading-map and the architecture manifest are updated.

## Critical

None.

## High

None.

## Medium

**M1. The 0700 guarantee of `lock-dirs` is order-dependent, so it is not a guarantee.**
- Locations: `src/setup/holder-lock-checks.mjs:598-619` and `src/holder-lock/index.mjs:148`.
- `ensureLockFile` runs `fs.mkdirSync(lock.lockDir, {recursive: true})` with the default mode (umask) on the first acquire.
- `fixLockDirs` skips any directory that already exists (`isDirectory` then `continue`). It never chmods it.
- Verified: a plain `fgos doctor` (read-only) in a fresh repo created `.fgos/locks/sessions.lock`, with `.fgos/locks` at mode 775.
- Failure scenario:
  1. Any fgos command runs before the first `fgos setup`. The same applies to any workspace that has run fgos since the cutover.
  2. The lock dir exists with the default umask mode.
  3. `fgos setup` reports "lock directories present". The dir stays group-readable or world-readable, contrary to spec §13, distribution.md row 5g and the CHANGELOG ("mode 0700").
- On a fresh setup the mode is correct (verified), so this only bites already-used workspaces and the machine lockRoot.
- Impact is low in practice. The lock files hold no data, but the other users' lock-fd/holder scans are exactly what 0700 is meant to stop.
- Fix, either of:
  - Have `ensureLockFile` create the dir with `mode: 0o700`.
  - Have `fixLockDirs` chmod a lock directory that is looser than 0700 and owned by the current user, and report `changed`.
  - Alternatively, weaken the doc claim to "created with 0700 when setup creates it".

**M2. The `lock-fences` fix is gated on this workspace's activation only. The fences it places are machine-wide.**
- Location: `holder-lock-checks.mjs:459-520`.
- The provider ledgers it fences (`~/.fgos/runtime/provider-capacity/{state-lock,account-locks/*}`) are shared by every workspace on the machine.
- The scan covers only this workspace (`workspaces: [workspaceRoot]`). The spec asserts that "any fgOS process on the machine" counts as a blocker, because other sessions match every workspace by argv. I did not re-verify the Rust scan.
- Failure scenario:
  1. forgentX is activated on the new release.
  2. `fgos setup` or `doctor --fix` runs in forgentX while mdview is idle on the old release.
  3. The fence is placed. mdview's next lease or quarantine call fails with a raw "held by pid 1" error.
- This is the documented stop-everything intent. The CHANGELOG says "Activate this release in every workspace first".
- The unconditional `fgos setup` entry point means a casual setup can trigger it. The guard depends on the idle-process scan rather than on any record that other workspaces were upgraded.
- Recommendation: name this machine-wide effect in the fix message (`placed N fence(s)`). Optionally require that the fix was invoked via `doctor --fix` (an explicit flag) for the machine-scope ledgers. At minimum, keep the spec §12 wording.

**M3. In a workspace on an old release, `lock-fences` warns forever and points at a fix that does nothing.**
- Location: `holder-lock-checks.mjs:446-451`.
- The warning ends "stop every fgOS process of this workspace, then run fgos doctor --fix". `fixLockFences` then returns "fences not placed: the activated release ... still runs the old lock code".
- This holds for every freshly set-up project that has no legacy lock at all (5 of 5 reported unfenced in my scratch run).
- Doctor output is noisy on every fresh install until the activation is on the new release.
- Suggestion: make the check message conditional. If `activatedHolderLockRelease(repoRoot).release` is null, say "activate this release first" instead of "run --fix".

## Low

**L1. `lock-holders` classifier heuristics.**
- `holderOrigin`, `holder-lock-checks.mjs:339-353`.
- False negatives, a foreign holder passes as fgOS:
  - Any process whose environment carries `FGOS_STATE_ROOT` counts as `fgos-host`. The host exports it to the payload and dispatch pins it into every child, so any tool or shell started from an fgOS session that holds a lock with `flock` is exempt.
  - A leaked background git carrying `FGOS_LOCK_FD=<lock>:` is classified `borrowed`. A borrower-leak holder stays silent unless `lock-borrow-vectors` catches it.
  - Both are documented design choices in spec §13 and the phase file.
- False positives:
  - `/proc/<pid>/environ` is unreadable for another user's process and for a pid that dies between listing and read. A holder that died between listing and read prints `<unreadable>` and warns.
  - When `environ` is unreadable it falls through to the argv test.
  - Only own-user processes can hold the description anyway, since `descriptionHolders` skips other users, so the cross-user case is mostly moot.
- Partially unlistable sets are dropped silently. The `unlistable` info appears only when every file is unlistable (`unlistable.length === files`).
- Tests cover only the `flock` foreign case, a borrowed case and the predecessor case. There is no test for the `fgos-host` and `fgos-payload` branches.

**L2. `checkStateRoot` can false-fail on a non-canonical pin.**
- `holder-lock-checks.mjs:576`.
- Node `path.join(raw, 'locks')` normalizes. The Rust host uses `PathBuf::join` on the untrimmed pin (`state_root.rs`).
- A pin such as `/x/./y` gives different `lockRoot` strings, so doctor says "disagree" when both resolve the same directory.
- Realistic pins are absolute and canonical, so this is minor.
- Compare after `path.resolve` / normalization.

**L3. Probe file name uses only `process.pid`.**
- `holder-lock-checks.mjs:134`.
- Two concurrent `twoProcessProbe` calls in one process on the same dir would collide. The second reads "a fresh probe file answered held".
- Doctor runs checks sequentially, so there is no current caller. Add a counter or random suffix if a parallel doctor is ever introduced.

**L4. Doctor is not strictly read-only for the "does not exist yet" warning.**
- A prior check or any lock acquire creates `<fgosDir>/locks` (see M1).
- In my doctor run, `.fgos/locks` already existed by the time `lock-kernel-semantics` ran, but the machine lockRoot did not.
- The warn text depends on call order, not just on state.
- No action needed beyond M1.

**L5. Runtime vs doctor disagree on `lock.predecessorKillWaitMs`.**
- The runtime (`protocol.mjs` `readPredecessorKillWaitMs`) accepts any integer >= 1. Doctor fails above 60000. Doctor is stricter, which matches spec §13, but the runtime does not enforce the bound.
- A project `lock: "x"` (non-object) makes the runtime ignore the global value and use the default. Doctor falls through to the global value and reports `(global)`.
- Cosmetic, but doctor's reported source can differ from what the runtime used.

**L6. Spec §13 claim is unverified for old releases.**
- Claim: "older releases do not validate unknown top-level keys, so writing it to `~/.fgos/config.json` does not break them".
- Setup does write `lock` into the global config (verified in the scratch run).
- I found no top-level allowlist in the current tree. I cannot check old releases.
- A past incident (2026-10-13) broke other workspaces through a new key in the same file, but that was an inner `runner.providers` validator. State the evidence in the doc, or confirm against an activated old release.

**L7. `fgos doctor` with no host binary reports three failures.**
- On the compatibility channel (`node bin/fgos.mjs` with no activation and no `FGOS_HOST_BIN`), `lock-kernel-semantics`, `lock-borrow-vectors` and `state-root` all fail.
- That matches the stated rule that there is no Node fallback. It makes dev-only runs red.
- Tests set `FGOS_HOST_BIN`, so CI is green.

## Callers and touchpoints (b), (c), (d)

- **Registrations.** Async check handled: `bin/fgos.mjs` `doctor` awaits every `check`. `runFixes` is sync, and both new fixes catch their own errors. `fixLockFences` and `fixLockDirs` are fail-soft, as the "every registered fix is idempotent/fail-soft" rule requires.
- **Fences usage.** `fenceStatus`, `fenceCutover` and `defaultProviderRuntimeDir` are used per their documented signatures. `status.complete` short-circuits before the activation gate. Placement is only reachable after the activation gate. The test suite covers the no-activation, old-release and registry-present gates plus the blocker listing.
- **provider-capacity.** Removal is clean. `lockParams`, `firstHolderPid` and `resolveLock` are still used by `lockBusyError`. The test was migrated to `lockHolders(...)` and passes.
- **twoProcessProbe fd handling.** Both the fd and the child are cleaned in `finally`. Sequence verified: `--try` on the fd, `sleep` inherits it at slot 3, the parent closes its copy, then `--shared-try` must see held, then SIGKILL, then free within 500 ms. No fd leak path, no orphan child except when the parent itself is SIGKILLed (the child is `sleep 60`, and stale files are swept after 120 s). Spawn `ENOENT` has no hang, verified by running it.
- **Public contract.** No exported symbol removed except `inspectProviderCapacityLock` and `checkProviderCapacityLockStale`. Both are intentional and doc'd. Doctor ids change as listed in the CHANGELOG and distribution.md. The new config key is additive.
- **Patterns.** Matches the registry pattern (`registerCheck`/`registerFix`/`registerConfigDefault`) and the architecture manifest entry.

## Doc claims checked against code

- **RUL101 / `cwd-lock.mjs`.**
  - `dispatch-cwd` is rank 30, kind lease, repo scope, in the registry.
  - `reconcile` is rank 80.
  - The `dev-ino` file name is in `cwd-lock.mjs`.
  - A missing cwd throws `worker-spawn-fail` before the lock.
  - Busy throws `dispatch-in-flight` naming the holder pid.
  - `dispatchCwdHolder` reads holders first and falls back to `probe` only when unlistable.
  - A missing lock file reads as free (never taken), and any non-`free` probe counts as held.
- **RUL86.** `run.mjs:345` uses `dispatchCwdHolder` for the resume guard. Matches.
- **clear-cwd-lock.** `reconciliation-planner.mjs:86-87` only returns `refused` (held) or `blocked` (not held) and never clears. The doc wording matches. The `recover.mjs` file itself has no cwd-lock code.
- **spec §7/§12/§13.**
  - Registry rows, run-local `locks/` paths and the tombstone and blocking-generation fences match `fences.mjs` and the registry.
  - The doctor table matches `holder-lock-checks.mjs`, including "messages carry no timings".
  - Predecessor judging of another PID namespace as `unknown` matches `process-identity.mjs` `judge`.
- **spec §14.** The 4 h ttl and "reconcile clear" claims describe legacy behavior and are consistent with the runner.md edit that removes `dispatch--*` ttl writers.
- **runner.md RUL75/RUL96.** The lock text matches. The `workflow/runner.mjs` `advance` holders and probe fallback (`lockHolders('advance')`, `probe('advance')`) match the doc.
- **distribution.md 5d/5g/7/7b.** The check and fix lists match the registered ids. Row 5g's `<workflowRunDir>/locks/advance.lock` and `<runDir>/locks/recovery.lock` match `LOCK_FILES`.
- **CHANGELOG.** All phase-listed lines are present. The "mode 0700" claim is inaccurate for already-used workspaces (M1).
- **Not verified.** `fgos convention check` on the new docs, and the Rust `quiesce-scan` "any process on the machine" claim.

## Plan follow-ups

The phase's check/fix/docs work looks complete. Remaining recommended actions:
1. M1: make the 0700 claim true or soften it.
2. M3: conditional wording of the `lock-fences` warn.
3. Add tests for the `fgos-host` and `fgos-payload` classifier branches.

## Unresolved questions

- Should `fgos setup` run the machine-scope fence at all, or only `doctor --fix`? The fence is irreversible without hand work (spec §12 rollback).
- Is the 4.3 expansion of `LOCK_FILES` expected to stay in this module? The registry owner filter throws if a 4.2 row has no enumeration, which fails `lock-holders` loudly rather than silently.

Status: DONE_WITH_CONCERNS
Summary: All phase acceptance criteria are met, the targeted tests pass (12/12 new, 185/185 checks, 44 related, 24 architecture), and the doc claims I checked match the code. There are no Critical or High findings. Three Medium items remain: the 0700 mode is not enforced for dirs already created by a lock acquire, the fence fix is machine-wide although gated per workspace, and `lock-fences` warns forever in old-release workspaces.
