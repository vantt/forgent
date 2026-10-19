# Counsel: native index.lock ownership — attribute, or stay inspection-only?

Scope: Rust Git component, Linux first. Worktree `.claude/worktrees/git-p06` at `5e512a829`.
Advisory only; nothing edited. Evidence cited as `file:line` was read in that tree on 2026-10-20.

## TL;DR

Keep native `index.lock` repair **inspection-only** for anything fgOS did not watch die, and
close the gap from the other side: make fgOS's own child-termination door cooperative
(SIGTERM, bounded grace, then SIGKILL). Git removes its own `index.lock` on SIGTERM, so the one
residue source fgOS controls disappears without any attribution machinery. The only *sound*
attribution mechanism on Linux is "freeze the child group, read its `/proc/<pid>/fd` table,
then kill" at that same door; it is small and layered correctly, but it only ever helps when a
hung Git ignores SIGTERM for the whole grace period. Build it later, only if that case is
observed. Do not build spawn-time pid/absence evidence, polling, inotify/fanotify, private
`GIT_INDEX_FILE`, mount-namespace, or `core.lockfilePid` schemes — each is unsound, out of
floor, or too big for the benefit.

## Reframed problem

The question is not "how do we prove ownership of a lock" but "which residue sources can
fgOS ever observe, and what is the cheapest way to make each one safe".

Residue (`index.lock` left behind) arises only when Git dies without running its cleanup.
Git's own contract (lockfile.h, verified): the lock is created with `O_CREAT|O_EXCL`, the fd
stays open while held, and `atexit` plus signal handlers remove it on normal exit, `die()`, and
catchable signals. Only SIGKILL, a crash, or power loss leaves residue. For fgOS children the
sources are:

| Source | Observable by fgOS? | Today |
|---|---|---|
| fgOS deadline/output-limit kill of its own child | yes — fgOS chooses the moment | SIGKILL at once: holder-lock `packages/holder-lock/rust/src/port.rs:1032` (`child.kill()` on `Deadline`), direct path `packages/git/rust/src/driver.rs:1086` (`kill_all(&mut domain, 0)`) |
| OOM killer / human `kill -9` / machine crash while a child holds the lock | no | residue, unowned |
| Foreign Git (human, IDE) outside cooperative exclusion | no | residue or live lock, unowned |

Requirements (spec §11, `docs/platform/git/spec.md:450`): quarantine only an exact owned
dead-child artifact, under exclusion, with operation identity and inode/state recheck;
unknown lock → inspected repair, never force; no `/proc` *write* as ownership test.
Goals: priority 2 (release humans) without violating priority 3 (DoD: no guessed data
mutation). Non-goal: adopting a lock by pathname, age, or pid alone (spec and lead agree).

## What is actually true about the candidate mechanisms

Verified against code and Git's primary source; "speculation" marked.

1. **Spawn-time pid + start time + pre-exec absence check (your original plan).** The lead is
   right (`plans/reports/phase-lead-261020-0250-...md:22-25`). Process identity attributes a
   *process*, not an *inode*. A foreign Git can win `O_EXCL` between the absence check and
   our child's create; our child then fails "File exists" and exits; the lock on disk is
   foreign. Nothing at spawn time can fix this because the inode does not exist yet.
   Additionally it needs a pre-exec boundary in `spawn_mapped`, which is deliberately
   `posix_spawn` with no pre-exec hook (`packages/process/rust/src/mapped.rs:1-14`). Dead.

2. **Observe the inode while our live child holds it open (`/proc/<pid>/fd`).** This is the
   only sound attribution. Reasoning: Git acquires the lock *only* via `O_CREAT|O_EXCL`; it
   never opens an existing `index.lock`. So if a process that is provably our unreaped child
   (pid pinned until `wait`, start time matched) has a writable descriptor whose target is
   `<git-dir>/index.lock` with `(dev, ino)`, that child created that inode. The lead's race
   is excluded by construction: a child that lost the `O_EXCL` race never holds the inode.
   The Process layer already has the exact primitive shape: `locked_fds` walks
   `/proc/<pid>/fd`, follows the magic link with `fs::metadata`, matches `(dev, ino)` and reads
   `fdinfo` (`packages/process/rust/src/platform/linux.rs`, `fn locked_fds`). A sibling
   `open_files(pid)` returning `(fd, target path, dev, ino, writable)` is ~40 lines beside it.
   Two correctness conditions:
   - **Freeze first.** Without SIGSTOP, `read_link` and `metadata` on `/proc/<pid>/fd/N` are
     two reads; the child can close N and reopen another file at N between them. `killpg(pgid,
     SIGSTOP)` on the borrow group (holder-lock sets `process_group = true` on Linux,
     `packages/holder-lock/rust/src/driver/flock.rs:214-217`) stops every thread; the fd table
     is then stable. SIGSTOP is also one of the two signals always delivered to a pid-namespace
     init from the parent namespace, so it works for the bwrap path too.
   - **Record after death, compare at repair.** `NativeLockArtifact.state` is a digest over
     mode/len/mtime/ctime/bytes (`packages/git/rust/src/native_lock.rs:63-100`). It can only be
     captured once the writer is dead (frozen then killed), otherwise it changes under us. This
     is why *polling while the child runs* is useless for the existing repair contract and why
     the existing `quarantine_owned_artifact` flow (`native_lock.rs:195-370`) fits
     freeze-observe-kill exactly and nothing else.
   - **Where it can run.** Only at the door that decides to kill: holder-lock
     `run_borrowed_io_posix` on `Deadline` (index-mutating children go through
     `checkout_call_borrowed`, `driver.rs:484-516`, with `Policy::HookContext`/`Publication`
     plus a loan → borrowed path). Git cannot observe the pid during a borrow; the evidence
     would have to come back on `BorrowIoOutcome` as "writable files the killed group held",
     and Git would map the one whose path is `<git-dir>/index.lock` to `NativeLockOwned`
     after a post-kill `stat` of the path agrees on `(dev, ino)`.
   Limitation: it helps **only** when fgOS itself kills the child. That is also the case
   where a cooperative SIGTERM makes the residue not exist in the first place.

3. **Polling `/proc/<pid>/fd` during the run with durable WAL append** (to cover parent death,
   OOM). Not unsound, but probabilistic (Git holds `index.lock` for milliseconds; a miss is
   fail-closed), needs an fsync per Git child, and the state digest cannot be captured while
   the writer lives. For parent death specifically: the borrowed path has no die-with-parent,
   so an orphaned Git child finishes and cleans its own lock; the bwrap `--die-with-parent`
   flag is only in `Terminal` mode (`packages/process/rust/src/containment/linux.rs:80-82,103-105`).
   Not worth it.

4. **inotify / fanotify.** inotify carries no pid. fanotify carries a pid but needs
   `CAP_SYS_ADMIN` (or restricted modes without pid). Both also yield only "someone created the
   path", not the open-description link to our child. No.

5. **Private `GIT_INDEX_FILE` and install by rename.** Tempting because residue would then be
   under an fgOS-owned directory. But `index.lock` on the real path is Git's *mutual exclusion*
   against foreign Git processes that are not under fgOS exclusion. A private index plus
   rename over `.git/index` removes that exclusion and creates lost-update races with a
   concurrent human `git add`. It also changes semantics of `reset --hard`, `read-tree -u`,
   `merge`. Rejected; it trades a rare manual step for a silent data-loss class.

6. **Mount namespace / O_EXCL sentinel / adopt by pathname.** Same objection as 5 (lock must
   be on the real path to exclude foreigners), or same objection as 1 (a sentinel we create
   is not the inode Git creates — H1 in the review proved Git fails "File exists" if we
   pre-create it).

7. **Git's `core.lockfilePid` (`index~pid.lock` with `pid <n>`).** Real, but merged to Git
   master 2026-02-17 after the 2.53.0 floor this repo measured (`spec.md:190,781`), defaults
   off, and under `bwrap --unshare-pid --as-pid-1` Git would write `pid 1`. At most a
   diagnostic line in the inspection report when present; never evidence.

## What to do (ordered)

1. **Make the kill door cooperative (this phase, small).**
   - holder-lock `run_borrowed_io_posix`: on `Deadline`, `killpg(pgid, SIGTERM)` (Linux group
     is pinned by the unreaped root), wait a bounded grace (2–5 s, a `BorrowIo` field or a
     handle constant beside `kill_wait_ms`), then the existing `child.kill()` + `end_leftovers`.
     Report which happened on `BorrowOutcome` (`terminated` vs `killed-after-grace`).
   - driver direct path: pass a non-zero `grace_ms` to `kill_all` for Git children
     (`driver.rs:1086,1091`); the trait already defines TERM-then-KILL semantics
     (`containment/mod.rs:196-198`). Audit which index-mutating children, if any, take the
     direct path (`Policy::LocalMutation`); Inspect children never hold `index.lock`
     (`--no-optional-locks`, `spec.md:113`).
   - Caveat to test, not assume: under bwrap `--as-pid-1` Git is the namespace init; the kernel
     delivers SIGTERM from the parent namespace to an init only if it has a handler. Git
     installs one once a lockfile is held, which is exactly when it matters — verify with the
     existing ptrace/kill harness rather than trusting this.
2. **Make the refusal honest and self-contained (M1).** Change the four refusal texts
   (`land.rs:168,1217,1341`, `restore.rs:287`, `scoped_commit.rs:537`, `sync.rs:521,560`) from
   "repairNativeIndexLock" (implies it can fix it) to a named refusal such as
   `native-index-lock-unowned: inspect with repairNativeIndexLock; follow the retained
   index.lock runbook (git spec §11)`. Keep `repairNativeIndexLock` as the **one inspection
   door**; it already returns dev/ino/state digest and preserves everything.
3. **Pre-digest the human's decision inside the report.** Extend `NativeLockReport.inspection`
   (Linux, read-only `/proc`): whether any visible process holds `(dev, ino)` open
   (`facts::lock_holders`-style walk by inode, report pid/exe/start time), the artifact's size,
   mtime and age, `index~pid.lock` content if present, and the exact manual steps
   (below). The human then makes one yes/no call; the system did everything else.
4. **Spec §11 wording.** State plainly: production `index.lock` residue is inspection-only;
   fgOS prevents its own residue by cooperative termination; attribution is possible only at
   fgOS's own kill door via frozen fd-table observation, and is deferred until a
   `killed-after-grace` with residue is observed. Remove "then resumes" unless ownership
   evidence exists (reviewer M1). Keep the `#[cfg(test)]` recorder only as the fixture for the
   shared quarantine path (that path is production for the ConfigChange staging artifact and
   is sound there, because fgOS creates that inode itself with `create_new`).
5. **Optional, gated on evidence: freeze-observe-kill.** If doctor/WAL ever shows
   `killed-after-grace` with an `index.lock` left behind, implement mechanism 2 exactly as
   described: Process `open_files(pid)` beside `locked_fds`; holder-lock SIGSTOP → observe group
   members (`relations()`/`members()` already exist) → SIGKILL → return held writable files;
   Git maps the `index.lock` entry to `NativeLockOwned` after post-kill `stat` agreement. No
   other code in `native_lock.rs` changes. Layers touched: Process (one read-only primitive +
   `docs/platform/process/spec.md` §3/§6), holder-lock (kill sequence + outcome field + spec),
   Git (mapping + spec §11). Strictly bottom-up: Process knows nothing of locks, holder-lock
   knows nothing of Git.

## Runbook the refusal should print (manual steps, in order)

1. Confirm no process uses the index: the report lists visible holders; additionally
   `fuser -v <git-dir>/index.lock` or `ls -l /proc/*/fd 2>/dev/null | grep index.lock`.
   If any live Git/IDE process holds it, stop; wait or close that tool. Keep the fgOS hold
   (main 50 / worktree custody 30) so no fgOS writer starts meanwhile.
2. Resolve the real path: `git rev-parse --path-format=absolute --git-path index.lock`.
3. Move, never delete: `mv <that path> <git-dir>/fgos/git/native-lock-quarantine/manual-<UTC ts>/`
   (or an operator directory outside the gitdir). Record the move in the operation's evidence.
4. Re-run observe-only recovery for the operation id named in the refusal
   (`fgos ... recover <operationId>`), inspect the recorded effect, then start a fresh
   operation id. Never repeat the old attempt.
5. If the content of the moved file matters (it is Git's partially written next index), keep
   it until the operation is acknowledged; `index.lock` bytes are never needed to rebuild a
   worktree whose real `index` and `HEAD` are intact.

## Does inspection-only conflict with "release humans"?

No. D-ADR0030 priority 2 is "decide inside the approved frame; ask only when really needed,
and ask in the decision-question template". An unowned `index.lock` is Git's own exclusion
artifact that may belong to a live human/IDE process; adopting it can corrupt a concurrent
index write (priority 3 loses, and §11/G-193 forbid it). Git upstream makes the same call: it
never auto-removes a stale lock, it only gained a *diagnostic* pid file in 2026. The correct
"release humans" levers are (a) prevention at fgOS's own kill door, which removes the only
case fgOS can cause, and (b) a refusal that already contains the diagnosis and the exact
steps, so the human's remaining decision is one move command. The human is asked only for a
decision only a human can make: "is this foreign process's lock abandoned?".

## What to avoid

- Any evidence recorded *before* the inode exists (pid, start time, absence check).
- Age/size/pid-text heuristics (`spec.md:450` forbids; Git's pid file is diagnostics).
- Private index or namespace tricks that take the lock off the real path.
- Leaving the current refusal text that names a repair which cannot succeed (M1): a dead end
  is worse than a runbook.
- Doing step 5 before step 1: attribution is only valuable in the residue case that step 1
  mostly eliminates.

## Alternatives and trade-offs

| Option | Cost | Benefit | Verdict |
|---|---|---|---|
| A. Cooperative kill + inspection-only + runbook (recommended) | ~small: grace in two kill doors, refusal text, report fields, spec | Removes fgOS-caused residue; honest refusal; zero unsound adoption | Do now |
| B. A + freeze-observe-kill | + ~150–250 lines across Process/holder-lock/Git + 3 spec updates + tests | Auto-quarantine when Git ignored SIGTERM for the whole grace (D-state hangs) | Defer until observed |
| C. Spawn-time pid/absence (original plan) | Process pre-exec boundary, loses `posix_spawn` | None — unsound (lead item C) | Reject |
| D. Private `GIT_INDEX_FILE` | Rewrites every index-mutating op | Residue lands in fgOS dir | Reject — removes Git's mutual exclusion vs foreign Git |

## Work checklist

- [ ] holder-lock: SIGTERM group → grace → SIGKILL on `Deadline`; outcome field; test with a
      child that installs a SIGTERM handler unlinking its `O_EXCL` lock, and one that ignores
      SIGTERM (asserts `killed-after-grace`, lock remains).
- [ ] driver: non-zero `grace_ms` for Git children on the direct path; test via existing
      ptrace harness that a `read-tree -u` child hit by the deadline leaves no `index.lock`
      (and the bwrap `--as-pid-1` SIGTERM delivery assumption is checked, not assumed).
- [ ] Git refusals: rename to `*-index-lock-unowned`, text points to inspection door + runbook.
- [ ] `NativeLockReport`: add live-holder facts (read-only `/proc` by inode), size/mtime/age,
      optional `index~pid.lock` line, runbook steps; extend
      `unknown_external_lock_has_inspection_report_and_is_never_moved`.
- [ ] Spec §11 + unit-10 notes: inspection-only stance, prevention door, deferred attribution
      design, M1 wording fix. CHANGELOG line (user-visible refusal text changed).
- [ ] Program board row for the lane; open a backlog item for option B with its trigger.

## Success metrics

- Zero `index.lock` residue from fgOS's own deadline kills in the kill-harness tests and in
  real runs (WAL/doctor count of `killed-after-grace` with residue stays 0).
- Every index-lock refusal names the runbook; `repairNativeIndexLock` on an unowned artifact
  never moves bytes (existing tests), and its report alone is enough to execute the runbook.
- No spec sentence promises a repair that has no production producer.

## Assumptions

- Index-mutating Git children all run via the borrowed path (`checkout_call_borrowed`,
  `driver.rs:484-516`) — high confidence from code; a `LocalMutation` audit confirms the rest.
- Hooks are disabled for non-HookContext children (`core.hooksPath=<fgOS empty dir>`,
  `driver.rs:900-904`), `gc.auto=0`, `maintenance.auto=false`, so the direct child is the
  lock creator in practice — high; freeze-observe-kill should still scan the whole group.
- Git ≥ 2.53.0 floor keeps `O_CREAT|O_EXCL` + signal cleanup for `index.lock` — high
  (lockfile.h verified on master 2026-10-20).
- Hung-Git-ignores-SIGTERM (D state) is rare on the owner's machines — medium; if observed,
  that is the trigger for option B.
- SIGTERM reaches a bwrap `--as-pid-1` Git from the host namespace while it holds a lock —
  medium (kernel delivers signals to a pid-ns init from ancestors only with a handler
  installed; Git installs one when a tempfile exists). Test it.

Sources consulted outside the repo: Git `lockfile.h` and `Documentation/config/core.adoc`
(master, raw.githubusercontent.com), Git mailing list / googlesource history for
`pc/lockfile-pid` (merged 2026-02-17).
