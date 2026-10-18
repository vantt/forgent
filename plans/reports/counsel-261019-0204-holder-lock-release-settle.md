# Counsel: holder-lock release settle instead of full scans per borrow

Kongming (fable) counsel requested by the coordinator, 2026-10-19 02:04 Asia/Saigon, after E3 regressed from full process scans at every borrow end.

**TL;DR** — Keep `Reach::Since` (lagged floor) for every per-borrow drain and for admission, and move the one safety-deciding check to **release**, where the kernel can answer it exactly and cheaply: after closing the description, read the kernel lock table (`/proc/locks`, one ~22 µs read) for a FLOCK record on our inode whose *locker* is this process. The kernel stamps every flock record with the pid that called `flock()`, keeps that stamp across the locker's `close` and across a borrower's same-type re-lock, and a later legitimate acquirer carries its own pid — so "my old description still holds the lock" vs "someone else legitimately acquired" is decidable with no kcmp, no kept dup and no time reasoning. Only when that record exists does the machine-wide fd scan run, to find and kill the holders. Your probe variant (b) is correct but strictly dominated by this (it still needs the tag on EWOULDBLOCK, and its 1 µs EX hold can spuriously `held` a `Wait::Try` contender — Publication's own mode). Expected cost: back to the 00:18 numbers plus ~30 µs per release.

## Reframed problem

Decision: where a lock-freeing decision may be made and from what evidence, such that (1) a holder of our description that outlives us is always found and killed before the lock is considered released, (2) no legitimate acquirer or pre-exec child is ever killed, (3) the host-wide `/proc` walk disappears from the per-CAS path, (4) spec line 27's intent (no pid-reuse / TTL / start-time inference) holds. Non-goal: making every *intermediate* borrow drain exact against fd-passing — the hazard fd-passing creates is "lock outlives release", not an exclusion break (while we hold EX no other acquirer exists; a stray with a copy of our description cannot break exclusion against anyone but us, and git plumbing with hooks disabled never passes fds).

## Evidence (verified)

- Kernel (`fs/locks.c`, master; confirmed empirically on this host's 7.0 kernel): `flock_make_lock` sets `flc_pid = current->tgid`, `flc_owner = filp`; `flock_lock_inode` on an existing same-type lock for the same `struct file` does `goto out` (record untouched, pid stamp preserved); `locks_translate_pid` translates the stamp into the reader's pid ns (init ns shows the raw number); `/proc/locks` hides records whose locker is not visible in the reader's ns; `__show_fd_locks` filters `filp == flc_file` so every process holding a copy of our description shows the same `lock:` line in its fdinfo (this is what `holds_lock_on` already relies on, `packages/process/rust/src/platform/linux.rs:285-307`).
- Empirical (`python3 -I` test in `/tmp/fgos-work/km`): pre-existing `SCM_RIGHTS` recipient re-locked `LOCK_EX|LOCK_NB` → `/proc/locks` and its fdinfo still show *my* pid; after my `close` the line persists with my pid; fresh-description probe → EWOULDBLOCK; after killing the strays → probe FREE; a later legit acquirer's line shows *its* pid.
- Cost on this host (590 processes, 50 lock records): `/proc/locks` read 21.9 µs; fresh-description probe 1.0 µs; `/proc/self/fd` listdir 1.8 µs; one full host fd scan ≈5 ms (×~11 per CAS ≈ the 171→303 ms in-process regression in `plans/reports/experiment-261019-0052-git-e3-after-review-fixes.md`).
- Code: second `Everyone` pass per borrow `packages/holder-lock/rust/src/port.rs:716-731`; admission `Everyone` `port.rs:636-650` → `driver/flock.rs:236-238`; `drain_description` requires `me` in the holder list (`flock.rs:341-353`) so it cannot be reused verbatim after close; `Handle::drop` is a no-op close on POSIX (`port.rs:184-187`); Publication acquires per call with `Wait::Try` and releases explicitly (`packages/git/rust/src/driver.rs:2090,2161,2445`); `validate_quiescent` is called per blocking chain in `admit_pending` (`packages/git/rust/src/publication.rs:263-285`) — with `Everyone` that multiplies per CAS; guards in distribution/observe/event-store wrap `Handle` and rely on `Drop`; `probe()` already uses a fresh `LOCK_SH` description (`port.rs:1084-1103`); contract already names `lock-release-stuck` (`packages/holder-lock/contracts/holder-lock.port.v1.json` `/results/.../lock-release-stuck`).

## What to do

### Q1 — release-time settle (replaces the per-borrow and admission full scans)

Linux, `Mode::Ex` handles only (`Sh` stays a plain close: it never borrows, so no copies beyond pre-exec children exist).

1. **Before close**: `key = file_key(file)`; `token` = the `MAJ:MIN:INO` token of our own `/proc/self/fdinfo/<fd>` `lock:` line (exact kernel identity of this lock record, immune to the btrfs/overlay `st_dev` mismatch noted at `linux.rs:283`); `me` = `readlink("/proc/self")` parsed as pid (the pid as this `/proc` names us — same guard `created_since` uses at `linux.rs:113`). If any of these is unreadable → go to step 5 (full tagged scan) rather than claiming clean.
2. **Close** our only reference (drop the `File`).
3. **Lock-table read**: read `/proc/locks` in **one** `read()` into a buffer large enough to hold it all (grow and re-read if the result fills the buffer; seq_file is consistent within one read, not across reads). `tagged` = lines with type `FLOCK`, token == `token`, pid == `me`. If `tagged` is empty → **Released clean**. (Either the lock is free, or a later acquirer — another process, by its own pid — holds it; by EX exclusivity our old description then holds nothing, and with no `LOCK_UN` anywhere that means every copy is closed.)
4. **Own-handle check**: if `tagged` is non-empty, list our own locked fds on `key` (`lock_holders_among(key, &[me])`, ~2 µs). Non-empty means another live `Handle` of this process holds it now (same-process re-acquire); EX exclusivity again proves the old description is gone → **clean**. Keep these fds as `mine` for step 5's spare rule.
5. **Full tagged scan** (the only place `Reach::Everyone` remains besides `lock-fd --drain-child`): `lock_holders(key)` extended so each hit carries the lock line's pid; candidates = holders with stamp == `me`, pid ≠ `me`. Classify each candidate `(pid, fd)`:
   - **spare**: `kcmp(me, pid, KCMP_FILE, my_fd, fd) == 0` for any `my_fd` in `mine` (a copy of a live handle of this process — e.g. a borrowed child of T2 that acquired right after our close); kcmp unavailable → spare nothing but also kill nothing when `mine` is non-empty (step 4 already proved clean).
   - **wait, never kill**: direct child of `me` (`parent == me`) — the pre-exec child rule of §5.
   - **kill**: everything else, `signal_by_identity(SIGKILL)` pinned by pidfd + start time as today.
   Loop (1 ms) re-reading step 3 until `tagged` is empty or `kill_wait` passes; then return `Released { killed }` or `lock-release-stuck { killed, pids }` (reuse the contract's existing name).
6. **Where it lives**: one routine (`settle_release`) called from `Drop for Handle` (outcome discarded; it must not panic) *and* from `release(handle) -> Release` which returns it. That covers the `Drop`-based guards (`ActivationLockGuard`, `InstallLockGuard`, `StoreLockGuard`, `AppendGuard`, `SealGuard`) through the same door and lets Publication record the outcome. Lock-table parsing and the `(pid, token)` extension of `fdinfo_lock_inodes` belong in `fgos-process` facts (lowest layer that needs them, design principle 2); the kill/wait loop should be factored out of `drain_description` and shared, not copied.
7. **Per-borrow**: `finish_borrowed` keeps the single `Reach::Since` pass with the lagged floor (`port.rs:208-216` already correct); delete the second `None` pass (`port.rs:722-730`).
8. **Admission**: `validate_quiescent` → `validate()` + `wait_unborrowed(file, kill_wait, handle.since())` with `Reach::of(since)`; still never signals; still refuses `ForeignHolder`. Keep `lock-fd --drain-child` at `Everyone` (description of unknown history, Node facade path).

Why a legitimate new acquirer is never killed: another process → stamp ≠ `me`, never a candidate. Our own process → step 4 (clean) or step 5's kcmp spare. A legit acquirer's *borrowed child* → copy of the acquirer's description, stamp = acquirer's pid ≠ `me`. `lock-resource-replaced`: irrelevant to the settle — it keys on the description's own inode/token, never the path; a stray on an orphaned inode is still found and killed (it cannot block new acquirers, but it is a leftover of our borrow and §5 says kill it). NFS: refused at acquire already.

### Q2 — admission

Drop `Everyone`. While we hold EX no other acquirer exists; a copy-holder can only act concurrently with *us*, and the only such holders `Since` can miss are pre-existing fd-passing recipients, which hook-disabled git plumbing with `gc.auto=0`/`maintenance.auto=false` cannot create. The "minimal check" is `validate()` (identity + borrower check) plus the `Since` quiescence wait; nothing new. Note for the lead: because `validate_publication_borrow` runs once per blocking chain, keep it cheap or hoist it once per admission.

### Q3 — exact bounded per-borrow cleanup

Exists only with a kernel-defined domain: (a) run the borrowed child as init of a **pid namespace** — the kernel SIGKILLs every member when init exits and `waitpid(init)` returns only after the namespace is empty (`zap_pid_ns_processes`): a true O(1) kernel proof, no pid/time; but needs `CAP_SYS_ADMIN` or a user namespace (this sandbox denies userns; distros vary), costs ~1 ms+ per spawn via bwrap, and still misses an fd passed to an *outsider*. (b) a per-borrow **cgroup v2** leaf (`cgroup.procs` enumeration, `cgroup.kill` ≥5.14): exact for descendants and setsid escapees, ~100 µs, but requires a delegated writable subtree (systemd user sessions usually; containers often not) and again misses outsiders. kcmp does not help here — the problem is enumeration, not identity. Verdict: not now (RUL104 — adds a mechanism); the release settle already makes every lock-freeing decision exact, and `Since` already kills every fork-inherited escapee promptly. Record pidns as the primitive the run supervisor's containment may bring later (§8 already names "the attempt's namespace").

### Q4 — expected cost

Per changing CAS: 8–10 `Since` drains (tens of µs each via the pid-order probe) + admission `Since` + one settle (~5 µs fdinfo + ~22 µs `/proc/locks`; scales with host lock count — a host with 5,000 lock records would be ~1–2 ms, still far below a scan). Expect ≈ 00:18 numbers: CAS changing p95 ≈ 190 ms (fsync floor; still over the 60 ms budget, as the 00:18 report explains), no-op ≈ 2.4 ms, `writeBlob` existing ≈ 1.9 ms, push ≈ 135 ms, reconcile ≈ 5.6 s, `/proc` opens ≈ 16k per 10 iterations (+~40). The full scan (~5–15 ms per pass) runs only when a leak actually exists.

## What to avoid

- kcmp against a kept dup of our own description: the dup keeps the lock held, so any probe always fails; identity must come from the kernel's locker stamp.
- A probe that *creates* the lock file (`open_lock_file` has `create(true)`); if you keep a probe anyway, open without `O_CREAT`, treat ENOENT as "resource removed", and fstat-compare to `key`.
- Reading `/proc/locks` across several `read()` calls — a record can be skipped between reads; a skipped record is a silent false "clean".
- Matching lock-table lines on inode alone (collision on another filesystem → endless scan loop until `kill_wait`); match the full `MAJ:MIN:INO` token captured from our own fdinfo.
- Killing a direct child of this process at release (pre-exec copy); waiting is the rule.
- Leaving the settle only in `release()` while guards drop `Handle` — that is "alongside the door" (L10); put it in `Drop` and have `release()` return the outcome.
- Any test seam (env switch / test-only branch) to force the slow path; test the classification helpers and real process layouts instead.
- Letting the per-borrow drain regain any `Everyone` pass "just in case" — that is exactly the 00:52 regression.

## Alternatives & trade-offs

1. **Your (b) probe-first** (`LOCK_EX|LOCK_NB` on a fresh description, then tag check on failure): equally exact; common path involves no pid at all (a point for line 27's letter). Costs: the 1 µs EX hold can hand a colliding `Wait::Try` contender a false `held` (Publication and `fgctl` use `Wait::Try`), ENOENT/replaced handling, and the tag read is still needed on EWOULDBLOCK. Acceptable if the owner values a pid-free common path over zero interference; I recommend table-first.
2. **Keep the lead's full scans, revisit budgets**: correct but fails five budget lines and the Q1 reversal trigger (`e3-budgets.md`); the cost is pure process-table reading unrelated to durability. Weakest option.
3. **pidns/cgroup domain per borrow** (Q3): exact bounded cleanup for escapees, future-proof for hook-enabled Rust borrows; availability and ~1 ms/spawn today; still needs the release settle for outsiders. Defer.

## Q5 — spec text (holder-lock `docs/platform/holder-lock/spec.md`)

§1 line 27, append one sentence (record as a dated supersession in §20, do not silently edit): "The one pid the component reads is the locker identity the kernel itself stamps on a lock record (`flock` stores the calling process's pid on the description's lock); it is compared only against this live process's own pid, never used to infer liveness or ownership of a record."

§5, replace the 2026-10-19 paragraph beginning "These assumptions never decide admission or release" with:

"Clarified 2026-10-19 (supersedes the same-day paragraph above): the narrowed `Reach::Since` pass is the only drain of a borrow return and of non-spawning `validate_quiescent`; it kills fork-inherited escapees promptly and never decides that the lock is free. The lock-freeing decision is made once, at release, from the kernel's lock table: after the holder closes its description it reads `/proc/locks` in one read and looks for a FLOCK record carrying the exact `major:minor:inode` token of its own lock record and this process as locker. No such record: released (the lock is free, or a later acquirer holds its own description; two descriptions cannot both hold the exclusive lock, and nothing calls `LOCK_UN`, so the old description has no open copy). A record held by another live handle of this process: released, by the same exclusivity. Otherwise the old description outlives the holder: every process on the host is read, holders whose lock record names this process are killed by pinned identity, except a direct child of this process (waited, never killed) and a descriptor `kcmp`-equal to a live handle of this process (spared); the table is re-read until the record is gone or `killWaitMs` passes, which returns `lock-release-stuck` naming the pids. A dropped handle runs the same settle; `release` returns its outcome. Descriptor transfer to a pre-existing process is therefore found at release, not at borrow return: such a recipient runs until the holder releases, at most the length of the hold. Shared handles close without a settle. The Node facade's `lock-fd --drain-child` keeps reading every process (a description of unknown history)."

§8 step 0, append: "On Linux the holder's own release settles against the kernel lock table as §5 describes; the next holder's predecessor rule is unchanged."

§19 add: "A copy-holder that changes the lock type on the shared description (`LOCK_SH` on an exclusive copy) re-stamps the record with its own pid and briefly drops the lock; it is then indistinguishable from a later acquirer, is not killed, and shows in `lock-holders` as a non-fgOS holder until it exits."

Contract `/operations/release/rule`: "…Release closes every copy it owns, then proves from the kernel lock table that no copy of its description still holds the lock, killing escaped holders of it (direct children waited, copies of this process's live handles spared); unresolved within the bounded wait returns `lock-release-stuck`." Add `output: { released: true, leftoversKilled }`. `CHANGELOG.md` Unreleased: replace the "keeps full scans for quiescent admission and final borrow cleanup" clause.

## Work checklist

1. `fgos-process` facts: `lock_table_entries()` (single-read `/proc/locks` parser → `{type, pid, token}`), extend the fdinfo lock parser to yield `(pid, token)`, `own_lock_token(file)`, `kcmp_same_file(pid_a, fd_a, pid_b, fd_b)`; tests for parser and kcmp (dup vs independent open).
2. `fgos-holder-lock`: `settle_release` (steps 1–5) shared by `Drop for Handle` and `release() -> Release`; delete the second pass in `finish_borrowed`; `wait_unborrowed(file, kill_wait, since)`; factor the kill/wait loop out of `drain_description`.
3. Move every `release(handle)` caller (≈25: `driver.rs:2161`, `route/hold.rs:317,499,512`, tests) to the new return type; Publication records the outcome in its trace/provenance.
4. Tests (real behaviour, no seams):
   - Rewrite `descriptor_sent_to_a_preexisting_process_is_killed_before_release` (`tests/borrow_io.rs:~460`): borrow returns `leftovers_killed == 0`; `release()` returns `Released { killed ≥ 1 }`; recipient died by SIGKILL; next `acquire` Acquired.
   - Legit-contender race: process B loops `acquire(Try)`; A releases; 1,000 rounds; B always acquires, A always clean, B never signalled.
   - Same-process re-acquire: T2 polls `acquire` on the same resource while T1 releases; T1 clean; T2 then borrows a child and the child finishes normally.
   - Pre-exec direct child holding a copy at release (pattern of `unrelated_pre_exec_child_survives_borrowed_git`): release waits, never kills, clean once exec happens.
   - Lock file unlinked/recreated before release with a stray on the old inode: stray killed, clean.
   - Dropped-not-released handle with a pre-existing recipient: `drop(handle)` kills it (Drop door).
   - Shared handle: plain close, no table read (assert via strace-free means: timing or by observing no kill of a copy-holding `Sh` child — or simply unit-test the dispatch on `Mode`).
   - bwrap pidns variants of the recipient test, gated by the existing availability checks.
   - Existing `admission_refuses_escapee_and_borrow_cleanup_kills_it`, `refused_admission_keeps_finding_the_same_leaked_holder`, `setsid_escapee_after_an_earlier_proven_drain_is_still_killed`, `proof_boundary_…` must stay green with `Since` (their escapees are fork-inherited after the mark).
   - Borrow vectors (`lock-borrow-vectors`) green; `cargo check --target x86_64-pc-windows-msvc`.
5. Spec/contract/CHANGELOG edits above; §20 entry dated 2026-10-19.
6. Re-run E3 and the strace census; compare to the 00:18 report.

## Success metrics

- E3 within ±10 % of the 00:18 run on every line; `/proc` opens per 10 iterations ≈ 16k (not 473k); `compareAndSwap` changing remains the only failing line, attributable to the fsync floor.
- New release tests pass 1,000× (contender race) with zero false kills; the SCM_RIGHTS recipient is killed at release every run.
- `lock-borrow-vectors` doctor check green; `fgctl` activation gate green.
- No `Reach::Everyone` call site remains except `lock-fd --drain-child` and the release settle's leak path.

## Assumptions

- Nothing in fgOS or a borrowed git child calls `LOCK_UN` or changes lock type on a shared copy (spec rule 6; hooks disabled for Publication). Confidence high; if violated, the stray is not killed and surfaces in `lock-holders` (§19 text above).
- Publication holds one handle per call and releases explicitly (`driver.rs:2445`→release); `Wait::Try` acquire. Confidence high (read, not run).
- `/proc` mounted in the holder's own pid namespace or `readlink /proc/self` resolvable; otherwise the settle falls back to the full tagged scan. Confidence high.
- `kcmp(2)` available to same-uid processes (Yama restricts only ATTACH). Confidence medium-high; on failure the design spares nothing but also kills nothing when a live own handle exists, so the worst case is `lock-release-stuck`, never a wrong kill.
- `/proc/locks` not masked on target hosts (Docker's default mask list does not include it; bwrap `--proc` exposes it). Confidence medium; unreadable → full scan path, never "clean".
- Owner intent: a pre-existing fd-passing recipient may run until release rather than being killed at borrow return. Confidence medium; if the owner wants borrow-return promptness for that case too, the only exact answer is the pidns/cgroup domain of Q3, and that should then be a separate item.

## Unresolved questions (for the owner, defaults recommended)

1. Table-first (recommended) or probe-first common path — default table-first (zero interference).
2. Accept the "recipient lives until release" window — default yes (hooks disabled; §5 text records it).
3. `#[must_use]` on `Release` (forces ~25 call-site edits now) — default no; Publication consumes it explicitly.
