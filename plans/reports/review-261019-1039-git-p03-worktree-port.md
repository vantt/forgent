# Code review: Git phase 03 (Worktree port, worktree-admin wrap set, public create verb)

Scope: `git diff 0f5bc8694..8a8362712` (one commit, 33 files) in `.claude/worktrees/git-p03-review`. I read the phase file, the lead report, git spec §3/§5/§10/§11/§12, holder-lock §16/§19, and all of `packages/git/rust/src/worktree.rs`, the addon binding, the Node facade, the verb, the doctor row and the tests. I made no workspace changes and ran no builds or tests. Builds would write into the workspace `target/`, and the lead's run is already on record. Each finding below rests on source reading plus one live check: `/proc` cwd readability in this sandbox.

**Verdict: no Critical findings. There are three High findings: H1 and H2 should be fixed before phase 07 relies on the port, and H3 before the public verb is widely used.** The safety core holds. Nothing forces, nothing falls back to a recursive delete, every destroy or move has a durable TargetAttempt first, a replay never repeats an effect, and every admin mutation runs under one rank-40 hold. The failures are on the liveness side: correct preconditions that refuse, or stay stuck, far more often than they should.

## Critical
None.

## High

**H1. Live-cwd guard refuses every remove and relocate on a normal multi-user Linux host.** `packages/git/rust/src/worktree.rs:358-380`. `worktree_not_live` scans all processes. Any process whose cwd is unreadable but which is still alive raises `recovery("worktree-cwd-unknown")`. For another user's process, including PID 1 and kernel threads, `readlink /proc/<pid>/cwd` fails with EACCES (`view_of` records `cwd: permission denied`, `packages/process/rust/src/platform/linux.rs:410-417`). `observe()` reads the world-readable `stat` and reports Live. So as a non-root user, remove and relocate always refuse. The tests pass only because this sandbox runs in a private PID namespace: here `/proc/1/cwd` is our own process. Fix: judge unreadable cwds only for processes owned by the effective uid. Another user's process cannot hold a cwd in a 0700 user-owned checkout without root, so either treat root as outside the guarantee and say so in the spec, or check the process uid against the checkout owner. Add a test that does not depend on a PID namespace, for example by injecting a scan row.

**H2. A clean Git refusal after TargetAttempt leaves a WAL chain that can never be reconciled.** `worktree.rs:654-733` (create), `:827-841` (remove), `:940-961` (relocate), `:1149-1220` (repair). `Outcome::Worktree { completed: false }` is defined but never written; `grep "completed: false"` finds no hits in `src/`. Four concrete cases:
- `git worktree add` fails, for example from a destination race, disk full, or a branch taken by raw Git. Repair calls `worktree_handle(path)`, which returns `worktree-registration-missing` forever.
- The G-033 strip-failure rollback succeeds (`:711-719`). The checkout is gone, but the chain still has no outcome, so the same stuck state follows.
- remove of a worktree the user locked with `git worktree lock`, or one that contains submodules. Git refuses both without `-f -f`, and `worktree_clean` checks for neither before TargetAttempt. Repair then returns `worktree-remove-outcome-unknown` forever.
- relocate refused by Git. The source is intact and the destination absent, so repair returns `worktree-move-outcome-unknown` forever.

In every case `admission` (`refs.rs:74-95`) then blocks the `worktree:<path>` resource, and for create the `refs/heads/<branch>` resource, permanently. `git-worktree-recovery` stays red, and the candidate pin ref leaks. Fix: in repair, classify the states that observably show the effect did not happen and append `Outcome::Worktree{completed:false}`, then release the pin:
- create: no `worktrees/<registration>` entry, and the path is absent or empty and owned.
- move: the admin inode is unchanged, the backlink still points at the source, the source is present and the destination absent.
- remove: the path is present and the admin inode and backlink are unchanged.

Also check the `locked` file and submodules (`.gitmodules` or gitlink entries) before TargetAttempt in remove and relocate. Add tests that make Git refuse after TargetAttempt.

**H3. Nesting refusal treats the main checkout as "another worktree", so the conventional `.claude/worktrees/<name>` location is refused.** `worktree.rs:226-239`. `git worktree list` always includes the main worktree row, so any path under the main checkout fails with `worktree-nested-path-refused`. `pick` claims use `.claude/worktrees` (`src/runner/worktree.mjs:808-813`), this review lane lives there, and so does the phase's own planned worktree. The skill text now sends agents to `fgos worktree create`. Every test uses sibling paths such as `../named`, so none of them catch this. The legacy session check also lists main, but sessions allocate under tmpdir, and the claim door never had this restriction. Fix: compare nesting only against linked rows, and keep a separate refusal for a path equal to the main root or an ancestor of it. Add a test under a gitignored directory inside main. If refusing paths inside main is intended, that is an owner decision; the skill text and the verb examples should then say "outside the main checkout", and phase 07 must move claim checkouts.

## Medium

**M1. The delivery proof can be satisfied by the caller alone.** `worktree.rs:793-799`. `ancestry(tip, delivered_to)` with `delivered_to == tip` passes, and the tests do exactly that. The evidence digest is any 64 hex characters. For a detached worktree, removing it and then releasing the pin (`finish_worktree`) can leave unpushed commits unreachable. The spec calls the proof "consumer-supplied", but the port should still check that `delivered_to` is reachable from a named non-`refs/fgos` ref (`for-each-ref --contains`), or that the tip is reachable from one. Otherwise "never destroy unpushed work" depends entirely on caller honesty.

**M2. The custody probe races with a new custody holder.** `worktree.rs:791` probes `dispatch-cwd` as Free, but the remove only happens at `:837`, after status, proof and WAL work. Rank 40 does not exclude a rank-30 acquirer, so Execution can take custody and start a producer in between. Git cannot take 30 (spec §5 line 188), so the race cannot be closed completely. It can be narrowed: re-probe custody, and re-run `worktree_not_live`, immediately before TargetAttempt and again before `worktree_call(remove|move)`. That matches the spec's "again before the irreversible boundary". Record the remaining window in holder-lock §19.

**M3. The ignored-bytes rule makes every provisioned worktree unremovable and the doctor row permanently red.** `worktree.rs:287-302` and `:1013-1015`; `src/setup/git-checks.mjs:20-26`. Execution provisions `node_modules` and `target/` after create, so `worktree_clean` refuses removal. `inspect_worktree_orphans` then reports every linked checkout as `dirty-or-stale-checkout-preserved`, and `passed` is false. Legacy session worktrees with a `.fgos` symlink are flagged the same way. `ls-files --others --ignored` without `--directory` also lists every file under `node_modules` on each doctor run. §11 names staged, unstaged and untracked state; the ignored rule was added to the spec by this phase (spec line 136). This needs an owner decision on whether ignored build output counts as valuable bytes. At minimum, use `--directory` with a cap, and grade the doctor row: a preserved dirty checkout is a warning or info, and only pending operations or partial admin entries fail.

**M4. Duplication with Refs.** The worktree-admin scope setup (seed, `assert_can_acquire`, acquire with the `fgosDir` param) and the `dispatch-cwd--<dev>-<ino>.lock` path are copied between `refs.rs:466-480/524-534` and `worktree.rs:167-191/326-332`. The create branch-in-use check (`worktree.rs:612-622`) is a weaker copy of the Refs in-use routine (`refs.rs:482-505`) and misses rebase `head-name` and `BISECT_START`. Git itself still refuses those cases, but the Rust preflights now differ. Fix: extract `acquire_worktree_admin(repo, held)`, `custody_lock_path(repo, root)` and a shared `branch_in_use(...)`, and call them from both ports. The pin installer extraction (`install_pin`) is good and needs no change.

## Low

- **L1.** `bin/fgos.mjs:3782-3801`: the `worktree` case was inserted between the session verb's doc comment and `case 'session'`, so that comment now sits above `worktree`. Move the case above the comment.
- **L2.** `Wal::open` runs twice in each mutation (`:550/637`, `:745/808`, `:865/923`). Session-id validation is written twice (`:486-492` and `:541-548`) next to `wal::valid_id`. `resources()` (`:77-102`) repeats the resource derivation in the WAL intent validation; expose one function from `wal.rs`.
- **L3.** `publication.rs:591` returns early for `Outcome::Worktree`, so the `Outcome::Worktree` arms added below it are unreachable. Keep one of the two.
- **L4.** `inspect_worktree_orphans` (`:988-990`) fails the whole diagnostic on a single non-directory entry in `.git/worktrees`. Report that entry as an issue instead.
- **L5.** `prune_owned_registration` has an unused `_repo` parameter. `wal.rs` carries a rustfmt reflow of code the phase did not touch, which inflates the review diff.
- **L6.** Untested paths: the strip-failure rollback, a Git refusal after TargetAttempt (H2), remove or relocate of a user-locked worktree, and a path inside the main checkout (H3).

## The six focus questions

1. **Never destroy, never force, TargetAttempt first, no replay.** Confirmed. There is no `--force`, no `move -f -f`, and no recursive delete of a checkout. `remove_dir_all` only touches a fresh checkout's own non-symlink `.fgos` during the strip (G-029). TargetAttempt is durably appended before `worktree add`, `remove` and `move`. A same-id replay without an outcome returns `worktree-operation-recovery-required` and never re-runs the effect. Uncommitted work is protected by full status, ignored files, worker state and in-progress Git state. Unpushed work is only as safe as M1 allows.
2. **Rollback and residue recovery.** Pre-registration rollback removes only the empty `mkdtemp` directory, and registered rollback uses non-force remove. The four §11 residue shapes have real-Git ptrace kill fixtures (`packages/git/rust/tests/worktree.rs:297-443`). Prune removes only a fully validated admin remainder, checks the inode and backlink, and never runs global prune. The gap is H2: clean refusals leave chains that cannot be settled.
3. **One hold, no raw paths.** Every admin effect goes through `worktree_call`, which requires the `worktree-admin` handle and borrows it to the Git child; the admin-file removals in prune run after `scope.validate()`. The Node facade spawns no Git. The legacy runner, session and integrate callers remain by plan for phase 07.
4. **Verb and skill text.** The route table, `bin/fgos.mjs` dispatch, the command registry and the architecture manifest are all registered. The skill source and both generated surfaces carry identical lines, consistent with a regeneration; I did not re-run `build:skills`. The lead's earlier blocker on the `MULTI` list in the CLI test is resolved in this commit.
5. **Doctor row and phase 04.** The row is read-only and lists raw admin entries plus pending Worktree WAL chains. Phase 04 can add a `custody` field to the native `inspect_git_worktree_recovery` result and AND it into `passed` in `git-checks.mjs`, as the code comment says. M3 makes the row noisy before that happens.
6. **DRY with Refs pins and WAL doors.** Pins and admission are reused properly; see M4 and L2 for the remaining copies.

## Open questions for the owner
- Should paths inside the main checkout be allowed for create (H3)?
- Do ignored build outputs block removal and fail the doctor row (M3)?
- Must the delivery proof be ref-reachable (M1)?
