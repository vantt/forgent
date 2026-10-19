# Review: operation-local Git preflight (c8e8b1f14..5f29974d2)

**Verdict:** no Critical or High findings. One Medium: config written by a concurrent process is now trusted for the rest of the call. I recommend fixing it before merge. The fix is small and reuses an existing mechanism. If the owner accepts that window as residual risk, the change is otherwise merge-ready.

## What I checked

I read the full diff, the lead report, Git spec §7 (the new 2026-10-19 paragraph), the `invoke_context` policy code, `command_config`, the existing publication config cache, and every `checkout_call` site. I ran `cargo test --locked -p fgos-git` with a scratch target directory: all suites passed (112 passed, 1 existing ignored). The `fgos-node-addon` build also compiled. I could not run the Node tests (`test/git/scoped-commit.test.mjs`, which includes the census test). The workspace is read-only, and `test/helpers/git-addon.mjs` must create `.fgos/runtime/git-addon` inside it (ENOENT/EROFS). The 213 → 37 census therefore rests on the lead report, not on my run.

## Answers to the focus questions

- **Hook coverage is complete.** Only two children run with `Policy::HookContext`: the ScopedCommit `commit` (`packages/git/rust/src/scoped_commit.rs:1173`) and the Sync `commit` (`packages/git/rust/src/sync.rs:685`). Both pass `hooks=true`, so both get the post-hook invalidate-and-recheck. Every other child (`add`/`reset` via `stage_paths`, `merge` at `sync.rs:194`, rev-parse/ls-files/write-tree) runs under Publication or Inspect. Those policies force `core.hooksPath` to the driver's own `git-empty-hooks`, which is checked empty on every spawn (`driver.rs:223`, `driver.rs:816`, `driver.rs:862`). Clean/smudge/process filters, merge drivers, textconv, `diff.external`, `include.path` and `includeIf.*` are refused outright by `command_config` (`driver.rs:1551`). So while the cached trust decision is valid, checkout, add and merge cannot run any program defined in config. No other hook-bearing command is missed.
- **Entry points are all covered.** All eight public ScopedCommit/Sync entries call `checkout_repository` first: `recover_scoped_commit`, `preflight_commit`, `scoped_commit`, `checkpoint_tracked_files`, `start_sync`, `inspect_sync`, `continue_sync` and `abort_sync`. A `pub(crate)` helper reached with an ordinary handle has `checkout_config = None`. It falls back to re-reading config before every child, which is the safe default.
- **No fact outlives the port call.** `operation_repo` is a local variable. `RepoHandle` is not `Clone`. The long-lived port handle built by `resolve_repo` has `checkout_config: None`. The manual `Debug` impl leaves config out (`packages/git/rust/src/lib.rs:100`).
- **A post-hook refresh failure fences the rest of the call.** The cache is set to `None` before the recheck. A failed recheck leaves it `None`, so every later `preflight`/`config` call is refused (`checkout-facts-invalidated`). The refresh also runs when the hook child returned a transport `Err`. Both behaviours are covered by the new success and rejection tests.
- **Format changes are handled at least as well as before.** Formats are compared at entry and after hooks. The old per-child `resolve_repo` re-read formats but compared only `git_dir`/`work_tree`, so this is stricter. The topology check now also compares `common_dir`.
- **Trust checks that must hold at each child still do.** `safe.directory` is enforced by Git itself on every exec. Ownership, reciprocal registration and custody are still checked per child (`resolve_topology` plus the custody path check at `scoped_commit.rs:587-604`). Include paths are refused, so no include trust decision is cached.
- **The `scoped-census` mode has no production branch.** It puts a logging `git` wrapper first on `PATH`. The driver, containment and Node loan are unchanged, and the mode exists only in `scripts/git/e3-bench.mjs` and its test.

## Findings

### Critical
None.

### High
None.

### Medium

**M1. Config written by a concurrent process after entry is now trusted for the whole call.**
- **Where:** `packages/git/rust/src/driver.rs:694-701` (`preflight` returns `Ok` from the snapshot) and `packages/git/rust/src/scoped_commit.rs:587`.
- **What changed:** before, every child re-read effective config and re-ran `check_config`. Now the trust decision is made once at entry and again only after hook-bearing commands.
- **Failure scenario:** a process outside cooperative exclusion writes `filter.x.clean`/`filter.x.process`, `merge.x.driver` or similar after entry. That could be a worker in a sibling linked worktree writing the shared `.git/config`, or a global/system config writer. A `.gitattributes` line then makes later children (`add` in `stage_paths`, `merge` at `sync.rs:194`, `reset`) run that program. The old per-child check would have refused it.
- **How bad:** this is not a new class of problem; the old check was never atomic with the exec. But the window grows from about one child to every child before the hook, or the whole call for Sync's merge path.
- **Fix:** reuse the existing `ConfigStamp` door that publication already uses (`publication_preflight`, `driver.rs:565-632`).
  1. Store a stamp with the operation snapshot: global/system paths from the already-cached `config_paths`, `common_dir/config`, `config.worktree`, and the origin files.
  2. In `preflight`, stat those paths before each child. This costs no execs.
  3. On mismatch, re-read and re-check config.
- **Why this fix:** it restores per-child protection at almost no cost. It also removes the second config-cache mechanism (see L1), as design principle 1 and RUL104 ask.

### Low

**L1. Two caches for one fact.**
- **Where:** `driver.rs:185` (`publication_config`, stamp-validated) and the new `RepoHandle::checkout_config` (snapshot plus explicit invalidation).
- **Problem:** these are two caching doors with different staleness rules for the same fact, which goes against principle 1 ("one door"). The lead report says no new cache service was added, but a second cache mechanism was.
- **Fix:** the M1 fix merges them.

**L2. Production `expect` and driver-internal locking inside `scoped_commit.rs`.**
- **Where:** `scoped_commit.rs:621-631`.
- **Problem:** `checkout_call` locks the driver-owned Mutex directly. It builds a whole new `RepoHandle` only to take its config, through `.expect("operation config")`. The invariant holds today, but this is a panic path in production code, and cache ownership leaks out of `driver.rs`.
- **Fix:** add a `driver.rs` method, for example `refresh_checkout_facts(&self, repo: &RepoHandle) -> Result<()>`, that invalidates, rechecks and refills, and call it from `checkout_call`.

**L3. The post-hook refresh drops derived facts other than config.**
- **Where:** `scoped_commit.rs:626` and `driver.rs:729`.
- **Problem:** `read_repository_facts` recomputes `layout.promisor`, but `checkout_repository` compares only object and ref formats. A hook that enables `extensions.partialClone` or `remote.*.promisor` is neither refused nor reflected in the operation handle. This is not a regression: the old per-child resolve also threw `current` away. It does fall short of the spec's "reads/checks them once again".
- **Fix:** also compare `layout.promisor` (refuse on change), or say in the spec that only config trust and formats are rechecked.

**L4 (optional performance idea, owner's choice under RUL104).** The two format probes could be a single exec: `git rev-parse --show-object-format --show-ref-format`. That saves two execs per entry plus two per hook. It is not needed for correctness.

## Layering
Mostly sound. Topology, config, formats and the cache live in `driver.rs`, and the ports only call `checkout_repository`. The exceptions are the Mutex handling inside `scoped_commit.rs` (L2) and the second cache (L1).

## Unresolved questions
- Does the owner accept the widened concurrent-config window (M1) as residual risk under "raw external Git remains outside cooperative exclusion", or should per-child stamp revalidation land before merge? I recommend landing it.
- The Node census and fence tests were not run by me because the workspace is read-only; the host coordinator should run them with E3.

Status: DONE_WITH_CONCERNS
Summary: No Critical or High findings. Hook coverage, entry points and fact lifetime are correct, and Rust tests pass. One Medium (config written concurrently is trusted for the rest of the call; fix by reusing the existing ConfigStamp revalidation) should be fixed or explicitly accepted before merge.
