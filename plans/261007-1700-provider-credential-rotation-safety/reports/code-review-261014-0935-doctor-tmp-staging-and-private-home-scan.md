# Code review: doctor interrupted-staging sweep and private-home root scan

- Branch: `fix/credential-phase-02-doctor-scan`, commit `04c6859af` on `59934a2d6`
- Worktree: `~/projects/forgentX-worktrees/credential-phase-02-doctor-scan`
- Scope: 12 files, +253/-30. Source: `provider-credential-renewal.mjs`, `confinement/backend-registry.mjs`, `setup/registrations.mjs`.
- Focused tests: `env -u CLAUDE_CODE_SESSION_ID node --test` on the three named files. 136 passed, 0 failed, exit 0.
- No token values were printed. Probes used placeholder bytes in the scratchpad only.

## Verdict per item

| Item | Delivered | Notes |
|------|-----------|-------|
| Q8: report and sweep `.tmp-*` | Yes, with gaps | See M1, M2, L1 |
| Q9: `privateHomeRoot` in the scanned roots | Yes | It also feeds the orphan reaper and the 0700 chmod, which goes beyond Q9. See M3 |
| L1: name the store in the over-limit row | Yes | `registrations.mjs:5455`, tested |
| L2: docs say the cap is per store and that torn/ is retained | Yes | runner.md and distribution.md word-diff checked |
| L3: do not stage `-shm` | Yes | Probe: a copy with db+wal and no shm reads the newest row once SQLite rebuilds the index (writable dir). Pending dirs are 0700 and writable, so this is safe |
| L4: `-journal` comment | Yes | `provider-credential-renewal.mjs:402-405` |

## Critical

None.

## High

None.

## Medium

### M1: The sweep's liveness proof is just the pid in the name, with no atomic claim. A writer judged dead by mistake can lose the only login

`provider-credential-renewal.mjs:694-699, 744-749` vs the writer at `:1155-1178`.

**What the code relies on.** The writer stages without the account lock: mkdir, stage, `syncTree`, rename, then `tryLock`. Because of that, taking the lock in the sweep would not help. The answer to "does the sweep take the lock?" is no, and the lock would not protect this anyway. The only guard against a live writer is `process.kill(pid, 0)`.

**What has to go wrong.** The pid must read as ESRCH while the writer is alive. That happens when:
- the runtime dir is shared between hosts (NFS home); or
- doctor runs in a different pid namespace from the runner. Blind bwrap uses `--unshare-pid` (`drivers/bwrap.mjs:511`), but it also masks the fgOS dirs, so this path is unlikely today.

**Failure sequence (writer misjudged as dead):**
1. Sweep `readdirSync` sees an empty staging, or one byte-equal to a kept copy (for example omp `agent.db` written, `-wal` not yet copied).
2. The writer finishes staging and `syncTree`.
3. Sweep `rmSync(recursive)` unlinks the children.
4. The writer's `renameSync` moves the now-empty dir to `pending/<ts>-…`, and `safe = true`.
5. `applyLeftovers` reads `missing-file` and drops it as unreadable. `existsSync(final)` is false, so the writer returns `unchanged`.
6. The caller deletes the private home. The WAL that held the newest login is gone.

**Why it matters.** Same-host, same-namespace use is safe. The invariant still depends on an environment assumption that the code does not state.

**Fix:**
- First claim the staging atomically: `renameSync(staging, pending/.sweep-<pid>-<id>)`. If the writer already renamed it, this fails. If the sweep wins, the writer's own rename fails with ENOENT and the writer returns `keepHome`.
- Then compare and delete the claimed name only.
- Optionally add an mtime floor (for example older than the account-lock TTL) as defence in depth.
- Record the hostname in the staging name, or refuse to sweep when it does not match.

### M2: In practice the "identical to a kept copy" proof almost never fires, so content-bearing stagings stay as permanent warnings

`provider-credential-renewal.mjs:717-722, 747`.

**Case 1: the identical copy is already gone.** A writer that crashed after `syncTree` leaves a complete `.tmp-*`. The home survives, so the reaper re-stages it and a dispatch usually applies that copy at once and removes it from `pending/`. By the time `doctor --fix` runs, no identical kept copy is left. The staging is then reported forever with "stays for hand recovery", even though its login is already in the source.

**Case 2: omp never compares equal.** `treesIdentical` compares the whole tree. A read-only SQLite open of a kept omp copy creates `agent.db-shm` inside it (probe confirmed: a read in a writable dir writes `-shm`). A staging without `-shm` (L3) therefore never matches a kept omp copy that has been read once.

**Effect.** Owners learn that this warning never clears and that they have to delete things by hand. That is the habit the invariant is meant to prevent.

**Fix.** Add the proofs the invariant already permits, under the account lock (try-lock, skip if busy):
- `judgeCopy(...) === 'not-newer'` with a readable source, which reuses `copyIsNewer` at `:613-617`;
- or, failing that, `COPY_MALFORMED_CODES`.

Exclude `-shm` from `treeBytes`.

### M3: The Q9 root change also turns on the orphan reaper and the root chmod for registry roots

`backend-registry.mjs:355-356`.

**Scope is wider than the retained-copy scan.** `defaultConfinementTempRoots()` also feeds:
- `checkConfinementOrphanedResourcesReaped` and `fixConfinementOrphanedResourcesReaped` (`registrations.mjs:5299, 5379`);
- `createConfinementCredentialRenewal` at five dispatch doors (`cli.mjs:1292/1471/1623`, `operation-choice.mjs:2220`, `execution/run.mjs:378`).

**This turns on dead code.** Before this commit the registry roots were never read (`instance.config.tempRoot` never existed). The commit makes them live for:
- `reapOrphanedConfinementResources`, which removes any empty direct subdir past grace with no marker needed (`cleanup.mjs:380-384`);
- `looseConfinementRoots` and `chmodSync(root, 0o700)`.

**Failure scenario.** A user sets `privateHomeRoot` to a shared directory. Validation only requires a non-empty string (`backend-registry.mjs:94`). Doctor then FAILs on that directory's unrelated empty subdirs and on its mode, and `doctor --fix` rmdirs those subdirs and chmods the shared dir to 0700.

**Also:** a relative `privateHomeRoot` is resolved against the doctor's cwd, not the runner's. Roots are not normalised, so `/x` and `/x/` are both scanned and held homes are counted twice.

**Live impact here: none.** The machine registry has no `tempRoot` or `privateHomeRoot` (checked: roots = `[/tmp/fgos-confinement]`).

**Fix:**
- `path.resolve` and dedupe the roots; or reject non-absolute values in validation.
- State in CHANGELOG/spec that registry roots are now also reaped and tightened. Alternatively, pass a scan-only root list to the credential check and keep the reaper on the old list until a decision is made.

No false FAIL on live homes from the credential check itself: `listKeptCredentialHomes` only counts markers that carry `credentialKept.attempts >= 1`, and a live dispatch home has none.

## Low

### L1: A stranded staging is reported twice, and the two rows contradict each other

`registrations.mjs:5441, 5458`.

`stranded` excludes only `torn`, so a dead-writer staging in a stranded store appears in two rows:
- the stranded row, which says "never applied or dropped automatically";
- the staging row, which says "`--fix` removes one that is empty or identical".

The sweep does walk stranded stores (`:735`). Probe-confirmed: an `openai/acct` staging at the account root under a codex-only inventory produced both rows and FAIL.

59934a2d6's stranded naming still works, so the store dir is still named (item d is satisfied).

**Fix:** exclude `kind === 'staging'` from `stranded` and add the stranded dir to the staging row; or exclude stranded stagings from the staging row.

### L2: The test helper `deadPid()` can flake

`test/runner/provider-credential-renewal.test.mjs:1958` and the same pattern in `credential-copies-retained-check.test.mjs`.

The pid of a child that has just exited can be reused at once. When that happens the test sees "alive" and fails. It fails safe, but it is noise. A pid above `/proc/sys/kernel/pid_max` is deterministic.

### L3: Missing negative tests

Nothing covers:
- a symlinked `.tmp-*` or symlinked children (the code handles these safely: symlink children make `treeBytes` return null and are kept; a top-level symlink is unlinked, never followed by `rmSync`);
- the stranded-store staging (L1);
- comparison against `torn/`;
- an omp staging against a kept copy that already carries `-shm` (M2).

### L4: Cost of the sweep

`treesIdentical` re-reads the staging in full for every kept copy: O(stagings × copies × db size) of synchronous reads in doctor. Hash the staging once.

## Checked and sound

- **Kept copy disappears between compare and `rmSync`.** It can only leave `pending/` as applied or unchanged (the source holds it or something newer), as unreadable (then the identical staging is malformed too), or by dedupe (its twin stays). `torn/` is never auto-dropped. The identity branch does not need the lock.
- **A staging newer than both the source and pending:** not empty and not identical, so kept. An unreadable source is irrelevant, because the sweep never consults the source.
- **Live writer in the same namespace:** skipped. EPERM and an unparsable pid count as alive. Pid reuse fails safe.
- **WAL/journal sidecars** in a staging are part of the compared tree. Any difference keeps the staging.
- **Pending cap (c):** the count logic is unchanged apart from the `store` field. `.tmp-*` stays excluded by the hidden-name filter. No regression.
- **Interaction with the upcoming global-config + `Object.hasOwn` fix:**
  - No textual overlap. The `interrupted` line at `:784` is two unchanged lines below the `readStoreDirs` line. The `registerCheck` inventory loader (`registrations.mjs:5498-5503`) is untouched.
  - Behavioural dependency: only through `stranded`, which this branch reads without changing it. Once that fix lands, an `accountId` of `constructor` will turn stranded, and its stagings will hit L1's double row.
- **Dependency direction:** no new imports. `registrations.mjs` → `provider-credential-renewal.mjs` already existed.

## Recommended actions

1. M1: make the sweep claim the staging by atomic rename before it compares, and add a minimum mtime.
2. M2: add the lock-guarded "source proves not-newer" and "proven malformed" removals, and ignore `-shm` in tree identity.
3. M3: normalise and absolutise the roots, and either document or narrow the expansion of the reaper and chmod onto registry roots.
4. L1: report a stranded staging once.

## Unresolved questions

- Is a runtime dir shared across hosts or pid namespaces a supported setup? If not, state it next to `stagingWriterAlive` and M1 drops to Low.
- Should the orphan reaper and the 0700 tightening cover registry `tempRoot`/`privateHomeRoot`? This is an owner decision. The code now does it without saying so.

Status: DONE_WITH_CONCERNS
Verdict: The deliverables are present and the tests are green. The sweep is safe on one host in one pid namespace. It does not claim the staging atomically (M1), its identity proof rarely clears real leftovers (M2), and Q9 quietly extends the reaper and chmod to registry roots (M3).
