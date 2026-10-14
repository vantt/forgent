# Code review: fix round for the doctor staging sweep and private-home scan

- Branch: `fix/credential-phase-02-doctor-scan`, fix commit `480581d05` (parent `04c6859af`, base `59934a2d6`)
- Worktree: `~/projects/forgentX-worktrees/credential-phase-02-doctor-scan`
- Previous review: [code-review-261014-0935-doctor-tmp-staging-and-private-home-scan.md](code-review-261014-0935-doctor-tmp-staging-and-private-home-scan.md)
- Scope: 10 files, +361/-95. Source: `provider-credential-renewal.mjs`, `confinement/backend-registry.mjs`, `setup/registrations.mjs`.
- Focused tests: `env -u CLAUDE_CODE_SESSION_ID node --test` on the three named files. 144 passed, 0 failed, exit 0.
- Probes ran in the session scratchpad with placeholder bytes. No token values were printed, and `~/.fgos/config.json` was not touched.

## Verdict per finding

| Finding | Fixed? | Evidence |
|---------|--------|----------|
| M1: atomic claim plus an age floor | Yes | `provider-credential-renewal.mjs:739-762`. Claim, restore and leftover handling were probed (see below) |
| M2: `-shm`, judging against the source under the lock, no inventory, torn/ | Yes | `:719-733`, `:749-757`, `registrations.mjs:5481-5491`. See Low-1 for the lock scope |
| M3: reaper and chmod narrowed back | Yes | `defaultConfinementTempRoots` matches the base byte for byte, comment aside. The 5 dispatch call sites and the reaper/chmod (`registrations.mjs:5300, 5380`) still use it. The consequence the author accepted is stated wrongly, see Medium-1 |
| L1: stranded staging, one row, never swept | Yes | `registrations.mjs:5459`, `provider-credential-renewal.mjs:787`. Tested |
| L2: deadPid above pid_max | Yes | Both test files |
| L3: new tests | Mostly | Gaps listed in Low-3 |

### M1 probe results

**The claim covers every point where the writer can be.** The writer (`:1206-1219`) creates the staging once (`mkdirSync`, `:1208`). It never recreates it: `layout.stage` only calls `copyFileSync`/`snapshotSqliteFile` into the existing dir. So once the sweep claims the staging:
- the writer's next copy or rename fails with ENOENT, its catch returns `keepHome: true`, and the private home stays;
- the original name cannot reappear, so rename-back cannot collide with a writer's new dir.

**One benign race.** The sweep can restore the staging between the writer's failed rename and its `rmSync(staging, force)` (`:1215`). The writer then deletes the restored copy, but it has already chosen `keepHome`, so the login survives in the home.

**Rename-back failure (probed).** I made `pending/` read-only during the judgement:
- The staging stayed as `.sweep-<pid>-<id>`, and the sweep returned `kept: 1`.
- After that process exited, `inspectRetainedCredentialCopies` reported it as `staging`.
- A second sweep claimed it, kept it and restored it under the same `.sweep-` name.
- Nothing was deleted.

**Leftover `.sweep-*` dirs.** `STAGING_NAME` (`:690`) matches them. They are reported once their pid is dead and they are older than 10 minutes. They are removed only by the same three proofs as `.tmp-*`, never because of their name or age.

### M2 checks

**`judgeCopy` cannot turn an error into 'not-newer'.**
- The call is wrapped in `try`, and a throw sets `removable = false`.
- An unknown `layoutName` gives `LAYOUTS[x] === undefined`. The resulting TypeError is caught.
- An unreadable source returns `'undetermined'` (`:622`).
- `sqlite-unavailable`, `unreadable-db` and `unreadable-file` on the copy are not in `COPY_MALFORMED_CODES`, so they return `'undetermined'`.

**Malformed as proof is sound for stagings.** A staging is created only after `copyIsNewer` returned something other than `'not-newer'` for the home (`:1204`). A home holding torn JSON is therefore never staged. So a staging that reads `missing-file` or `unreadable-json` can only be a copy cut short. The writer died before the home could be removed, so the intact bytes are still in the home and the reaper or settle path still holds it. This matches the torn/ policy at `:1099-1108`, which applies to a torn source, not a torn copy.

**Busy lock.** `tryLock` returning null leaves `removable` false, and the staging is restored. Tested at `provider-credential-renewal.test.mjs` ("a busy account lock leaves a staging...").

**No inventory.** `stagingStoreResolver(undefined)` returns undefined, so `resolved` is null and the source is never consulted. Tested with `w2`.

**`-shm` exclusion.** It is safe: the `-wal` and `-journal` files are still part of the digest.

## Critical

None.

## High

None.

## Medium

### Medium-1: A kept home under a registry `privateHomeRoot` or `tempRoot` never reaches "held", so doctor passes with a false "retried by the reaper" line and `--fix` never settles it

`registrations.mjs:5445, 5462, 5465`; `cleanup.mjs:197-216, 296-301`.

**How a home gets stuck.** Attempts are counted only by `removeConfinementDir`, at least 15 minutes apart, and a home is held at 5 attempts.

| What could touch the home | Does it scan these roots? |
|---------------------------|---------------------------|
| The dispatch's own cleanup/finalizer | Yes. It runs about once, so the home reaches `attempts` 1 (perhaps 2) |
| Every reaper call (`run.mjs:159`, `loop.mjs:1430`, `cli.mjs:1637`, `registrations.mjs:5388`) | No. They use `resolveConfinementTempRoot()` or `defaultConfinementTempRoots()` |
| The dispatch settle (`cleanup.mjs:466`) | No. It uses `defaultConfinementTempRoots` and only settles held homes |
| `settleHeldCredentialHomes` from `--fix` | It scans `credentialScanRoots`, but skips homes that are not held (`cleanup.mjs:301`) |

**Failure scenario:**
1. A backend sets `privateHomeRoot: /srv/homes`.
2. A dispatch renews a login and staging fails (for example `sqlite-unavailable`). The home is kept with `attempts: 1`.
3. `fgos doctor` reports `xai/acct: 1 private home(s) kept after a staging failure, retried by the reaper` with `passed: true` (a warning). It names no dir.
4. No reaper ever retries the home, so it never becomes held and never FAILs. `doctor --fix` skips it.
5. The only good refresh token waits there indefinitely behind a passing doctor and a line that says the opposite of what happens.

**Answer to "does doctor still FAIL and name it":**
- Only for a home that is already held (attempts at or above 5). The FAIL row prints `home.dir`.
- A home under these roots reaches 5 only if the dispatch's own removal path runs five times, 15 minutes apart. In practice it does not.
- The author's accepted consequence ("a held home there is settled only by `doctor --fix`") is true, but almost no home there ever becomes held.

**Is this new?** At `59934a2d6` these roots were not scanned at all, so this is better than the base. But the new message makes a false claim, and the gap is reachable as soon as someone sets `privateHomeRoot`. Live impact today: none, because the machine registry declares neither key.

**Fix (smallest):**
- In the check, treat a kept home under a root that is in `credentialScanRoots()` but not in `defaultConfinementTempRoots()` as held: FAIL and name `home.dir`.
- Let `fixCredentialCopiesRetained` settle those homes regardless of the attempt count. `settleHeldCredentialHome` already proves safety from the source.
- Alternatively, keep the warning but replace "retried by the reaper" with "not retried automatically; `fgos doctor --fix` re-checks it", and widen the fix the same way.

## Low

### Low-1: The account lock covers the judgement but not the delete

`provider-credential-renewal.mjs:756` releases the lock. `:761` then runs `rmSync(claimed)` outside it.

The requirement asked for compare and delete under the lock. **Actual impact: none I can construct.**
- The claimed name is private to this sweep.
- Every fgOS writer moves the source forward only.
- The owner's own CLI never takes the lock (`:298-299`), so holding it longer would not exclude the one actor that could move the source backward, such as a logout.

Either move the `rmSync` inside the `try/finally`, or write down why that is not needed. Not blocking.

### Low-2: The inventory read paths that the forgentx-22 rebase must convert

`registrations.mjs:5516` (the check, from the base) and **`:5525` (the fix, new in this round)** both use `providerAccountInventory(loadRunnerConfigFromDir(cwd))`.

**The rebase must convert both.** Otherwise, run from a project whose config has no inventory, the fix sees no inventory: the sweep stays on the empty/identical proofs and stranded detection is off.

**`stagingStoreResolver` (`:5484, :5486`) also uses plain property lookups.** It must switch to `Object.hasOwn` together with forgentx-22's account lookup. Probe-free scenario:
1. An account was per-CLI and is now single-store, with a leftover `stores/constructor/pending/.tmp-<dead>-x` dir.
2. `layoutStoreDirs` (`Object.keys`) marks that store stranded, and the doctor row says it is "never applied or dropped automatically".
3. The resolver reads `credentialSources.constructor` as `Object`. `credentialWriteBackMarker` then returns null, so the result is `null`, not `'stranded'`.
4. `--fix` removes an empty or identical staging in a store that doctor called untouchable.

No login is lost, because only the empty and identical proofs apply. It is still a contradiction between the check and the fix.

A `__proto__` or `constructor` accountId resolves to `'stranded'` today (fail-safe), so there is no loss there.

### Low-3: Test gaps

- **No test creates a `.sweep-*` leftover or makes the rename-back fail.** The only proof is my probe above. Add one: chmod `pending/` to 0500 inside `tryLock`, then assert that the `.sweep-` dir survives and is reported once the pid is dead.
- **`credential-copies-retained-check.test.mjs:287` promises more than it checks.** Its title says "...one whose store has no source stays", but it asserts only the removal. No test drives the resolver's `null` branch (a store whose source has no layout, for example `credentialSource.kind` unknown).
- **The claim test checks only half the guarantee.** It asserts the staging is renamed during judgement. It does not exercise the writer side: a `writeBackRenewedCredential` whose staging is claimed mid-stage returns `keepHome: true`. That half is what makes the M1 guarantee hold.
- **The reaper-isolation test passes partly by shape.** `defaultConfinementTempRoots` reads `instance.config.tempRoot`, the registry shape the base already used, and the test registry sets top-level keys. The assertion is still meaningful (nothing under the registry root is touched), but it would not catch someone adding top-level reads back into the reaper list. Acceptable.

### Low-4: Pid reuse can hide a staging; nested roots double-count

- **Pid reuse.** A `.sweep-<doctor pid>` or `.tmp-<runner pid>` leftover is hidden from both report and sweep while an unrelated process reuses that pid (`:704-708`). It fails safe, so nothing is deleted. But the short-lived doctor pid makes reuse more likely for `.sweep-` names. A start-time check or a hostname in the name would close it. Same class as before, so not new.
- **Nested roots.** A `privateHomeRoot` inside the default root (for example `/tmp/fgos-confinement/homes`) makes `listKeptCredentialHomes` see the same home from both roots. Doctor then counts it twice, and `--fix` settles it twice; the second pass is a harmless miss.

## Checked and sound

- **`credentialScanRoots`:** it uses `path.resolve` and dedupes, and is used only at `registrations.mjs:5436, 5493`. The reaper, chmod and dispatch doors (`cli.mjs:1292/1471/1623`, `operation-choice.mjs:2220`, `execution/run.mjs:378`) are unchanged against the base.
- **Symlinks:**
  - A top-level symlinked staging is never deleted through its target: `lstat` keeps it out of the empty proof, and `rmSync` unlinks only the link.
  - A symlinked child makes `treeDigest` return null.
  - The test asserts that the target survives.
- **Digests:** `kept()` is computed lazily, once per store. This also resolves the old L4 cost note.
- **Docs and CHANGELOG** wording matches the code (ten minutes, claim by rename, torn/ comparison, registry roots scanned only by this check).

## Recommended actions

1. Medium-1: make kept homes under scan-only roots FAIL with their dir, and let `--fix` settle them; or at least stop calling them "retried by the reaper".
2. Low-2: on the rebase onto forgentx-22, convert both the check (`:5516`) and the new fix closure (`:5525`) to the global inventory, and switch the resolver's lookups to `Object.hasOwn`.
3. Low-3: add the `.sweep-`/rename-back-failure test, and either fix the title of test `:287` or add the assertion it promises.

## Unresolved questions

- Is a registry `privateHomeRoot` meant to be supported now? If not, Medium-1 drops to Low, but the "retried by the reaper" wording should still be corrected for those roots.

Status: DONE_WITH_CONCERNS
Verdict: M1, M2, M3, L1, L2 are genuinely fixed and probe-verified. One Medium remains: kept homes under registry roots can never reach "held", so doctor passes them with a false "retried by the reaper" line. The rebase must also convert the new fix-path inventory read.
