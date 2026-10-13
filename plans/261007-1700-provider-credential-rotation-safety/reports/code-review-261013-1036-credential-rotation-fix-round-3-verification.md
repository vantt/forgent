# Verification: credential rotation fix round 3

Reviewer: an independent code-reviewer. I am not the author and did no earlier review. Scope: `git show da7e71836` (base `1624180c9`), read against the [round-2 verification](code-review-261013-1010-credential-rotation-fix-round-2-verification.md) (M1, L1–L5) and the "Fix round 3" section of the [implement report](implement-261013-phase-01-credential-rotation.md). I edited no source, test or doc. I touched no real store and no real CLI; scratch scripts used fake tokens and temp dirs.

## Verdict

**Merge-ready: yes, with one Medium tracked as a follow-up.**

- The new `credential-home-kept` throw is safe. It cannot change a run's outcome. It cannot skip the lease release. It cannot crash the loop. It holds no lock. It only fires when the dispatch opted in.
- All six round-2 findings are addressed.
- One new gap is not a regression (base deleted the copy outright). The pending cap keeps the five newest copies by staging time. When nothing can be judged (no `node:sqlite`), five unrenewed copies push out the one renewed copy. So M1 is only partly closed.

## Verification run

- Focused suites at HEAD, all exit 0:
  - renewal, visibility-checks and the citation-drift guard: 117/117.
  - `dispatch-confinement-*`, provider-capacity and provider-credential-probe: 204/204.
- HEAD tests against base `src/` (`git archive 1624180c9`): 6 tests fail. They are the five new renewal tests and the doctor `$HOME` test.
- Tests that pass on base, as expected:
  - The malformed-copy test and both Codex fail-closed tests are characterization tests. The Codex behaviour already landed in round 2.
  - The rewritten applied/unchanged test also passes on base.
- Mutation checks at HEAD, each of which made the targeted test fail:
  - The rewritten test fails when the final status is forced to `applied`, or when the `existsSync(final)` → `staged` line is replaced.
  - The cap test fails when the surplus slice is changed to `names.slice(5)`.
  - So these tests pin the branches they name. Round-2 L3 is closed.
- Repro `scratchpad/repro-r3-cap.mjs`:
  - Setup: omp, `loadSqlite: () => null`, six write-backs. Home 0 holds the pane-renewed db. Homes 1 to 5 are byte copies of the source.
  - Result: all six `staged`, `credential-pending-dropped (1)`, five copies left, **renewed copy gone**.
- Repro `scratchpad/repro-r3-final.mjs`:
  - Setup: the finalizer runs with two resources, and staging is blocked.
  - First call: `retained` with reason `cleanup-failed: credential-home-kept`. The second resource was also left in place.
  - Second call: `retained`, with no retry (idempotent).
  - The reaper then removed both, once staging worked again.

## Answers to the checks

### 1. Write-back classification (`provider-credential-renewal.mjs:553-569`)

- `copyIsNewer` drops a copy only for `unreadable-json`, `unexpected-shape` and `unknown-layout`, or for `unreadable-file` where the store file does not exist.
  - A read error on an existing file is `undetermined`, as are `sqlite-unavailable` and `unreadable-db`, so those copies are staged.
  - Tests: `a copy that cannot be read for a reason…` and the omp sqlite test.
- **"No store file" counts as malformed.** I think this is acceptable.
  - The removal paths stop processes before they read: cleanup and the reaper go through `cleanupConfinementResource` with `stopProcesses: true` (`cleanup.mjs:206`). The finalizer only cleans on `exited` with process-group coverage (`authority.mjs:1796-1801`).
  - `rename(2)` replaces the file atomically, so it never leaves the name missing.
  - The only window is a CLI that does unlink-then-write. I could not verify pi's write pattern; see the questions at the end.
- **omp plain-copy fallback (`:453-467`).** It is consistent for a closed database: `agent.db` is required, and `-wal`/`-shm` are copied when present.
  - It can copy from a live process in one case, which is pre-existing. A pane-retained home is reaped on expiry when herdr cannot be asked (`cleanup.mjs:306-311`).
  - `stopProcessesInside` matches only exe or cwd under the home (`stop-processes-inside.mjs:40-48`). A pane's omp with `HOME=<home>`, a global binary and a worktree cwd is not stopped.
  - The plain copy may then be torn. A torn copy reads as `unreadable-db`, which is `apply-deferred`, so it is kept and never applied. It cannot reach the store.

### 2. `credential-home-kept` throw (`cleanup.mjs:172-180`). Every caller:

- **Driver cleanup** (`bwrap.mjs:548-552`, rollback `:568-574`): `cleanupConfinementResource` catches it (`cleanup.mjs:209-211`) and returns `{cleaned:false, reason:'removal-failed'}`. No caller reads that result. `authority.mjs:861` and `:1284` call `prepared.cleanup()`, which does not throw.
- **`finalizeConfinementResources`** (`authority.mjs:1836-1841`):
  - It catches the throw, sets `cleanupState: 'retained'`, and `break`s.
  - Its return is ignored by `settlement.mjs:850` and `:933`. `assignment-runner.mjs:2775-2777` wraps it in `try {} catch {}`, and `releaseSelectedProviderLease` (`:2779`) and `releaseRunControl` run after it in the same `finally`.
  - So the outcome, classification and lease release are unaffected (see Low L2 for side effects).
- **Reaper** (`cleanup.mjs:326-340`):
  - A kept home is pushed to `skipped` with `removal-failed`, and the loop continues, so other homes are still reaped. It cannot block them.
  - Callers: `run.mjs:159` and `registrations.mjs:5342` (doctor `--fix`) have a try or ignore the result; `loop.mjs:1430` only logs the reaped count.
  - The retry is unbounded but cheap: one stderr line per kept home per reap pass. A reap pass happens per `fgos run`, per runner start, and per doctor fix. That is not spam per tick.
- **Locks:** `keepHome` is only returned before `tryLock` (`renewal.mjs:836-848`) or from the outer catch while `safe === false`. No lock is held on either path.
- **Opt-in only:** the throw needs a valid `marker.credentialWriteBack`. That field is written only when `capacity.credentialWriteBack` is set (`bwrap.mjs:73-80`). An invalid marker returns failed without `keepHome`, and the home is removed as before.

### 3. Pending cap (`renewal.mjs:600-615`)

- **"Newest by staging time" is the wrong keep rule. This is Medium M1 below.**
- **The drop is not under the account lock.**
  - In `writeBackRenewedCredential` it runs before `tryLock` (`:849`).
  - In `renewInScratch` the caller holds the lock.
  - The race is harmless: an applier reads into memory first, and the cap only removes the oldest copies. But because the cap runs before the apply attempt, a copy the source could identify on this very call is dropped first.
- **Leftovers before the skipped return (`:698-709`):**
  - They are applied under `acquireAccountLock`, with release in `finally`, and no spawn happens there. The test asserts `starts.length === 0`.
  - New cost: that path can now wait up to `probeTimeoutMs + 30 s` for the lock, where before it returned at once. This only applies to an unidentified account that has leftovers. Acceptable.

### 4. Tests

- Six of the seven new or rewritten tests in the renewal file and the doctor test fail on base. The others pass on base, which is expected: the rewritten test pins round-2 code that L3 said was unexercised, and the mutations above prove it now is.
- Two weak spots in tests (Low L4).

### 5. Doctor, Codex and CHANGELOG

- **Doctor `expandHome`** (`registrations.mjs:4300`): `$HOME` is now added. It uses the `(?=\/|$)` guard, so `$HOMEX` is untouched. The test sets `HOME` and relies on `os.homedir()` honouring it, which is correct on POSIX.
- **Codex fail-closed tests:** they assert the error code and the message.
- **CHANGELOG:** both lines are accurate and user-facing.

### 6. Docs

- **Component-boundary row:** it now matches the code. It does not name the import of `expandCredentialHome` from the probe module (`bwrap.mjs:16`). That is minor.
- **Mismatches** in runner.md RUL75 items 3 and 4 and in confinement-authority §13.2: L1 and L3 below.
- **Citation guard:** passes.

## Findings

### Medium (M1): the cap can drop the only renewed copy and keep five stale ones. M1 is partly closed; not a regression.

- **Where:** `capPendingCopies` (`renewal.mjs:605-615`) keeps the last five names, sorted by staging time.
- **Trigger, reproduced:**
  - An opted-in omp account on a Node without unflagged `node:sqlite`. That covers Node 20 and Node 22 before 22.13; `package.json` declares `engines >=18`.
  - Every removal then reads as `undetermined` and is staged, renewed or not (`:563-565`). Nothing can ever be applied.
  - Five later unrenewed dispatches push out the one pane-renewed copy.
- **Same shape for a pi account whose entry cannot be identified:** after an owner rotation, each stale copy holds a refresh token the source lacks (`:572-575`).
- **Compared with base:** base deleted the home at once, so this is strictly better for up to five dispatches. The invariant ("never deleted unless proven malformed or proven not newer") still breaks on dispatch six.
- **The cap also runs before the apply attempt** (`:849` before `:851-858`), so it can drop a copy that the free lock would have applied on the same call.
- **Fix (follow-up item is fine):**
  - At provisioning, record a fingerprint of the copied store in the marker (sha256, never the value). A copy whose files still match it is proven not newer and is never staged. That removes the source of growth.
  - When over the cap, drop byte-identical duplicates first.
  - Run the cap after `applyLeftovers`, under the lock.

### Low (L1): pre-existing apply path vs this round's doc. A pending copy is deleted on a transient read error.

- `COPY_UNUSABLE_CODES` includes `unreadable-file` (`:513`). `applyLeftovers` therefore removes a staged copy whose `auth.json` read fails for any reason, including EMFILE, EIO or EACCES (`readJsonFile` `:80-86`, `:530-532`).
- runner.md item 3, as rewritten this round, says a "read error" keeps the copy. That holds only in `copyIsNewer`.
- **Fix:** mirror the write-back rule in apply: `unreadable-file` with the file present means `apply-deferred`.

### Low (L2): side effects of the new throw.

- **Finalizer.** The `break` at `authority.mjs:1839` skips the sibling temporary resources. The descriptor becomes `retained`, and later finalize calls never retry it (`:1782-1788`). The reaper picks both up, as the repro showed, but only once the runner pid is dead or after `maxAgeMs`.
- **Unbounded retention.** A staging failure that never clears (an unwritable runtime dir, a non-directory `pending`) keeps a login copy in the temp root forever. That defeats the reaper's "a credential copy cannot outlive `maxAgeMs`" rule (`cleanup.mjs:303-305`).
- **Doctor.** `countDeadOwnedConfinementDirs` (`registrations.mjs:5293-5330`) counts such a home and suggests `doctor --fix`, which cannot clear it.
- **Fix (consider):**
  - Continue the finalizer loop instead of `break` for this code.
  - Name a kept home in the doctor message.

### Low (L3): confinement-authority §13.2 contradicts itself.

- The unchanged sentence says "Lỗi ghi ngược … không bao giờ chặn việc xoá" ("a write-back error … never blocks the removal").
- Later in the same paragraph, a staging failure keeps the home.
- runner.md item 4 words it correctly ("Any other write-back problem…").

### Low (L4): test wording and coverage.

- **Wrong name.** `a copy that cannot be read for a reason that may pass is staged, not treated as not newer` asserts `failed` + `keepHome`, not `staged`. The pi read-error path to `staged` (unreadable at judge time, readable at stage time) is not tested.
- **Missing case.** The skipped-refresh-ahead test uses only a malformed leftover. Its comment mentions a second leftover that "cannot be told apart yet", but the test never writes one. No test shows a now-identifiable copy being applied on the skipped path.
- **Code naming.** Staging blocked by `mkdirSync` reports `write-back-failed` rather than `stage-failed` (`:838` is outside the inner try). The test accepts either.

## Regressions vs pre-existing

- Regressions: none found.
- New behaviour with costs: L2 (retention and finalizer skip). It is intended, and the cost is bounded.
- Pre-existing: L1, and the live-pane plain copy in check 1.
- Incomplete fix: M1.

## Unresolved questions

- Does pi (or omp) ever unlink its store before rewriting it? If so, the "no store file → malformed" rule (`:567-568`) could drop a copy taken mid-write. I could not check the CLI sources from here.
- Should a home kept by `credential-home-kept` get a time or attempt bound, after which it is surfaced by `fgos doctor` as needing a person, rather than retried silently forever?

Status: DONE_WITH_CONCERNS
Summary: Fix round 3 is merge-ready. The new keep-home throw is contained by every caller: run outcome, lease release, loop, locks and opt-in gating all check out. 321 focused tests pass. Six new tests fail on base, and mutations show the rewritten tests pin their branches.
Concerns/Blockers: Medium M1, reproduced and not a regression: the newest-five pending cap drops the only pane-renewed copy when nothing can be judged (no `node:sqlite`, or an unidentified pi entry), so round-2 M1 is only partly closed. Lows: the apply path still deletes on a transient read error, contrary to the new runner.md text; finalizer/retention side effects; a §13.2 self-contradiction; test naming.
