# Review: Git phase 02 (9c8308897 against base 6b39f6179)

This review was read-only. I read the full diff (37 files) against the phase file, both lead reports, git spec §3/§5 (the R30 table)/§10/§16/§17, and the holder-lock spec §5 addition. I ran `cargo test -p fgos-git --test refs_remote --test inspect` (6 + 3 passed) and `cargo test -p fgos-holder-lock --test scope_rank` (5 passed), with the build directory in the session scratchpad. I also reproduced one finding with raw git 2.53.0 (H1). I did not run the Node tests. `git merge-tree` could not run because the object store is read-only, so conflict notes come from comparing diff hunks.

**Verdict:** the opaque handover and the Refs CAS/WAL core look sound. One High security gap needs a fix before merge (H1). There are also six Medium robustness and spec gaps.

## Critical
There are no Critical findings.

## High

**H1. `url.<base>.pushInsteadOf` sends a push to a URL that is not the pinned one.**
- Where: `packages/git/rust/src/driver.rs:1215` (`command_config`). It refuses only keys ending in `.insteadof`. The key `url.X.pushinsteadof` does not end in `.insteadof` (no dot before `insteadof`), so preflight lets it through.
- Effect: `remote.rs:23-50` pins the configured `remote.<name>.url` and then calls `git push -- <url>`. Git applies `pushInsteadOf` to explicit command-line URLs too.
- Reproduced: with `url.$S/evil.git.pushInsteadOf=$S/good.git` set in the repository config, `git -c protocol.allow=never -c protocol.file.allow=always push --porcelain -- $S/good.git HEAD:refs/heads/main` wrote to `evil.git` and left `good.git` untouched.
- Exposure: a worker can write repo-local config, so pushed commits can be sent to any host. The post-push `ls-remote` uses the fetch URL, so it records "unknown" rather than detecting the redirect.
- Spec: §3 Remote says the URL is pinned; §2/§7 say untrusted repository config refuses.
- Fix: refuse `url.*.pushinsteadof`, or every `url.*` key, in preflight, and add a regression test.
- Same fix, also worth closing: repo-local transport settings that Policy::Remote does not neutralize, such as `http.proxy`, `http.sslVerify`, `http.<url>.*` and `http.extraHeader`. Override them with `-c` in `transfer_call` or refuse them. I did not test these.

## Medium

**M1. A multi-ref push is not atomic, and partial success is recorded as "rejected".**
- Where: `remote.rs:373-381` and `remote.rs:487-488`.
- Without `--atomic`, one ref can update while another is rejected. `[rejected]` in stdout then sets `unknown=false`, so the outcome is Rejected even though one ref changed on the remote.
- Fix: pass `--atomic`, and classify from the per-target observations rather than from stdout.

**M2. Fetch leaves the operation pending for harmless conditions after TargetAttempt.**
- Where: `remote.rs:435-444`.
- An upstream force-push (`fetch-not-fast-forward`) or a destination that moved (`fetch-destination-stale`) returns recovery-required with no terminal outcome. Nothing local changed, yet that id now needs a person to recover it. With several mappings, a partial install also leaves the outcome without observations.
- Spec: §10 rule 4b, and product priority 2 (don't make a person wait).
- Fix: check ancestry and old values for every target before the first CAS, and record a terminal not-acknowledged `Transfer` with observations when no ref was changed.
- Owner decision: whether remote-tracking refs should accept forced updates the way git's default `+` refspec does.

**M3. `fastForwardCheckedOut` can update the main checkout's tree without `main-checkout` 50.**
- Where: `refs.rs:438-477` and `refs.rs:704-722`.
- Custody accepts any registered checkout whose `dispatch-cwd` lease is held, including the trusted main root.
- Spec: §5 needs the main authority for worktree effects (SafeRestore on main takes 50), and open item 2 keeps runner commits in linked worktrees only.
- Fix: refuse when `target.work_tree == repo.trusted_main_root()`.

**M4. Fast-forward moves the ref first and the tree second, and the tree step can fail on a predictable collision.**
- Where: `refs.rs:715-724`.
- `status(Untracked::All)` does not list ignored files, but `read-tree -m -u` refuses to overwrite an ignored file that the new tree tracks. The branch has then already advanced while the checkout stays at old, and the result is checkout-recovery-required.
- Fix: run `read-tree -m -n -u old next` (dry run) after `update-index --refresh` and before the WAL TargetAttempt.

**M5. The in-use check ignores worktrees in the middle of a rebase or bisect.**
- Where: `refs.rs:434-437`, which matches only the registered HEAD branch.
- During a rebase the worktree shows as detached, but git's own `find_shared_symref` treats that branch as in use. When the rebase finishes, git rewrites the branch with no CAS, which loses an `advanceRef`, or brings back a deleted branch.
- Spec: §3 says an in-use ref is refused.
- Fix: per registered admin dir, read `rebase-merge/head-name`, `rebase-apply/head-name` and `BISECT_START`, and count those branches as in use.

**M6. RUL104/L10: a second WAL kind for remote transfers.**
- Where: `wal.rs:80-95`. `RemoteTransfer` sits beside the existing `RemoteFetch`/`RemotePush` kinds that Publication uses (`publication.rs:165,1650,1732`).
- That gives two journal shapes for one effect class.
- Fix: either extend the existing kinds with per-target old/new and move Publication over in the same change, or record in the spec why the two must stay separate (owner decision).

## Low
- **L1.** `refs.rs:15-36`: `failure()` picks the result code by substring ("wal", "stale", "recovery"), which is fragile. Use typed causes.
- **L2.** `refs.rs:263`: any locked worktree, including a plain user `git worktree lock`, blocks every Refs operation in the repository. The spec names only the `locked initializing` residue as uncertain.
- **L3.** `driver.rs:~345-357`: with nested linked worktrees, the last matching admin in `read_dir` order wins. Pick the longest checkout prefix.
- **L4.** `remote.rs:469-473`: with no held lock, fetch runs `update-ref` under `Policy::Inspect` (adds `--no-optional-locks`), so a write is labelled as a read.
- **L5.** `handover.rs:9`: the capability flag is `thread_local`, so each `worker_thread` can take its own. Also, a module that `require`s the `.node` file before `native.mjs` does takes the capability first; the loader then fails closed. The in-process trust boundary should be stated in the holder-lock spec.
- **L6.** `remote.rs:37`: the `@` check refuses `ssh://git@host/...`, so ssh is unusable in practice.
- **L7.** `refs.rs:670-683`: any `update-ref` failure where the ref still reads old (for example a leftover `.lock`) is recorded as `Loss`/`compare-and-swap-stale`.
- **L8.** `docs/platform/git/spec.md` §16 checkpoint (~line 596) still says "Node descriptor handover, non-event Refs/Remote and their mutation proofs remain pending". This contradicts the header and the §3 checkpoint.

## Focus areas found clean
- **Handover:** `LockHandle` needs a private token and is frozen, and descriptions live only in the private WeakMap. Externals are type-tagged, consumed once, and closed in `finally` before the borrow count drops. Released, foreign and numeric handles are refused, and `release()` is refused while a borrow is active. The duplicate is CLOEXEC, which a test confirms. Rust `validate` checks the inode against the path, so a frozen name/path cannot be swapped onto another lock.
- **Refs:** CAS uses exact-old with `--no-deref`, followed by read-back. The pin is written before Prepared, there is exactly one TargetAttempt, and an unknown outcome is never replayed (`Begin::Existing` without an outcome means recovery-required).
- **Rank rule:** Rust `assert_can_acquire` uses the same `>=` rule as Node `lock-scope.mjs:30`, read from the same registry, and refuses duplicate seeded ranks. It matches the R30 rows for Refs (40) and Remote (below 60).
- **Inspect:** linked-worktree discovery checks the gitfile against the admin dir, commondir and backlink in both directions. Separate-git-dir is refused with `trusted-main-gitfile-unsupported`.

## Expected merge conflicts
- **`git/p04-custody`:**
  - `src/holder-lock/index.mjs`: both branches append at end of file (`registerNativeHandover` vs `predecessorState`), and p04 adds `clearDomain`/`domainEndpoint` next to p02's constructor change. p04's `clearDomain` refuses while `borrows > 0`, which works with handover borrows.
  - `packages/holder-lock/rust/src/port.rs`: p04 adds `Resource.predecessor_kinds`. p02's `from_acquired_description` and `LockScope::acquire` use `Resource::new`, so they compile, but locks taken through LockScope will carry no predecessor-kind policy. Check whether p04 needs one for worktree-admin.
  - Both branches also edit CHANGELOG and both specs.
- **`git/p01-landing-fixes`:**
  - `packages/git/node-addon/src/lib.rs:4`: a certain conflict on the same `pub use` line.
  - `packages/git/rust/src/lib.rs`: adjacent `pub use` lines.
  - `driver.rs`: hunks near the tests at about line 2390, and in `resolve_repo`.
  - `node-addon/src/git.rs`: the top-of-file `mod` lines next to p01's `inspect_git` signature change.
  - `test/git/native-load.test.mjs`, CHANGELOG and the spec.

## Unresolved questions
- Should remote-tracking refs accept forced (non-fast-forward) updates (M2)?
- Should `RemoteTransfer` be merged into `RemoteFetch`/`RemotePush` (M6)?
- Does Node always pass `<main root>/.fgos` as `fgosDir` for worktree-admin, so that Rust (`refs.rs:422-428`) and Node lock the same file?
