# S6a phase 02 Step 1 census (origin/main 929e198e4, src/runner/worktree.mjs 1437 lines)

## Function signatures, returns, throws (current bodies)

| Function (line) | Signature | Returns | Can throw |
|---|---|---|---|
| createWorktree (852) | (repoRoot, id, opts={worktreeDir, baseRef, startSha, scope, waitMs}) | `{path: realpath, branch, reused}` | HolderLockError('lock-held', from addWorktreeSync/repo-locks lockHeldError; code lock-held, holders, lock, timedOut) passes through; WorktreeError (errorClass/category 'worktree-fail', details {branch, worktreePath}) on add failure; relocateOrphanedCheckout WorktreeErrors (listing/dirty/move, details {branch,...}); finishWorktreeSetup errors (provisionWorktree: WorktreeError skill-copy, raw execFileSync npm error) after best-effort removeWorktree. Raw fs errors from mkdirSync/mkdtempSync (no wrapping). |
| createClaimWorktree (1213) | (repoRoot, id, opts same) | `{path, branch, reused}` on reattach; else createWorktree result + `refresh` (undefined unless opts.baseRef and branch existed w/o live checkout; shape `{target, ahead, behind, refreshed, reason|from,to, detail}`) | all of createWorktree + resyncClaimWorktree WorktreeErrors (1051/1068/1075) on reattach |
| createDispatchWorktree (1366) | (repoRoot, id, opts={}) | createWorktree result | same as createWorktree |
| createVerifyCheckout (1330) | (repoRoot, commit) | worktreePath string (NOT realpathed, tmpdir/fgos-worktrees/verify-*) | HolderLockError passthrough; WorktreeError `{worktreePath}` "git worktree add --detach failed"; provisioning error rethrown after force-remove. Always a fresh `createLockScope('worktree')`, no waitMs (default wait) |
| removeWorktree (1392) | (repoRoot, worktreePath, opts={force(ignored), deliveredTo, retainTo, custody, scope}) | `retained` = `{retainedRef, snapshot}` or undefined | WorktreeError 'git worktree remove failed...' (details {worktreePath, retainedRef?, snapshot?}) wraps EVERYTHING incl. HolderLockError('lock-held','worktree custody is held',{lock:'dispatch-cwd'}) from withCheckoutCustody (it is NOT rethrown as HolderLockError, it is wrapped); prune failure swallowed |
| removeDispatchWorktree (1371) | (repoRoot, worktreePath, log=()=>{}) | undefined | never throws (catch-all, logs `fgos-runner: worktree cleanup failed for "<path>": <msg>`); dirty -> resetDispatchWorktree (stays Node) then removeWorktree force |
| listLeftovers (1429) | (repoRoot, opts={base='HEAD', includeTip}) | `[{branch, aheadCount, tip?}]` | WorktreeError (no details) |
| reclaimOrphanedCheckout (607) | (repoRoot, branch, {callerCwd=process.cwd()}) | `{reclaimed:false,path:null}` or `{reclaimed:true,path:realpath}` | WorktreeError details {branch, orphanPath}: list fail, repoRoot guard, live-cwd guard, dirty guard, removal fail, prune fail |
| provisionDependencies (115) | (worktreePath) | boolean (true = npm installed) | raw JSON.parse / execFileSync (npm ci/install) errors, NOT WorktreeError |
| runWorktreeSetupCommands (147) | (worktreePath, repoRoot) | undefined | WorktreeError details {worktreePath, command}; config read errors from readConfig |

## Callers (excluding comments, tests listed separately)

| Function | Caller file:line | Args/options passed | Fields read | Errors caught/inspected |
|---|---|---|---|---|
| createClaimWorktree | src/runner/claim-port.mjs:293 | `{worktreeDir, baseRef, startSha: head, scope}` (JS LockScope, NO waitMs) | whole result spread into `claim.worktree` (path, branch, reused, refresh) | catch-all: releaseClaim then rethrow; no class/code inspected here. Upstream: bin/fgos.mjs:2885 pick catches only ClaimError (-> StoreError(err.category)); other errors go to the generic handler exit = EXIT_CODES[categoryOf(err)] (bin/fgos.mjs:3779) |
| createDispatchWorktree | src/runner/loop.mjs:382, 441 (stale-doing reap goal-check) | `{worktreeDir}` | `wt.path` | `err?.errorClass === 'worktree-fail'` -> worktreeFailed + log; else rethrow |
| createDispatchWorktree | src/runner/loop.mjs:848 (leaf), 850, 1396 | `{worktreeDir, baseRef: branchNameFor(rootId)}` / `{worktreeDir}` | `wt.path`, `wt.branch` (836/855/908/916/1037/1048), reused not read | loop catch ~1086: `typeof err.errorClass === 'string'` -> failure {errorClass, message}; recovery matrix maps 'worktree-fail' (loop.mjs:120); keepForResume uses wt.path |
| removeDispatchWorktree | loop.mjs:394, 453, 903, 938, 951, 973, 1122, 1490 | `(repoRoot, wt.path, log)` | none | none (never throws) |
| listLeftovers | loop.mjs:469 | `{includeTip: true}` | `branch, aheadCount, tip` | none locally |
| createVerifyCheckout | src/runner/merge.mjs:1202 (withTargetCheckout) | `(repoRoot, resolveRefSha(target))` | string path | no catch around create; callers of withTargetCheckout (merge.mjs:988) |
| createVerifyCheckout | bin/fgos.mjs:3048 (return verify) | `(repoRoot, branchHead)` | string path | none around create |
| createVerifyCheckout | scripts/test-select-mutate.mjs:60 | `(repoRoot, 'HEAD')` | string path | none |
| removeWorktree | merge.mjs:1206 | `{force:true}` | none | catch-all, stderr "verification checkout retained" |
| removeWorktree | bin/fgos.mjs:3074 | `{force:true}` | none | catch-all, stderr |
| removeWorktree | src/workflow/unit-handoff.mjs:352 (cleanupWorkflowWorktree) | `{deliveredTo?}` | none | none; "A refusal propagates" |
| removeWorktree | scripts/test-select-mutate.mjs:63 | no opts | none | catch-all, errFn |
| removeWorktree | loop.mjs | no direct call (only comment L18); goes via removeDispatchWorktree | | phase file lists loop.mjs as direct caller: DRIFT |
| reclaimOrphanedCheckout | src/runner/merge.mjs:610 (cleanupMergedBranch) | `(repoRoot, branch)` default callerCwd | none | catch-all -> warnings.push(err.message) |
| reclaimOrphanedCheckout | bin/fgos.mjs | NOT a caller (only comment 3043): DRIFT |
| provisionDependencies | merge.mjs:715 (catch-up, checkout), 953 (candidate.worktree) | `(path)` | return ignored | 715 uncaught (outer), 953 catch-all -> verify-fail with err.message |
| runWorktreeSetupCommands | merge.mjs:716, 954 | `(path, repoRoot)` | none | same as above |
| createWorktree | no src/bin/scripts caller outside worktree.mjs (itself called by createClaimWorktree/createDispatchWorktree) | | | |
| createWorktree | tests: test/runner/loop.test.mjs (many, `{worktreeDir}`), test/intake/plan.test.mjs:1355,1379, test/intake/discovery.test.mjs:255 (read `.path`), worktree-admin-multiprocess.test.mjs:158 (`{worktreeDir, scope, waitMs:150}`, expects err.code==='lock-held' && err.holders includes pid) | | | |
| createClaimWorktree tests | worktree-admin-multiprocess.test.mjs:134 (`{worktreeDir,startSha,scope}`), worktree-callsite-wrapper.test.mjs:44 | | | |
| other test importers | worktree.test.mjs (169 hits), worktree-callsite-wrapper.test.mjs (21), worktree-config-trust.test.mjs:41,50 (runWorktreeSetupCommands), test/scripts/test-select-mutate.test.mjs:337, loop.test.mjs (createWorktree/removeWorktree) | | | |
| listLeftovers (local) | src/runner/dispatch/provider-credential-renewal.mjs:768 | own function, not a caller | | |

## Lock / error-class facts

- HolderLockError (src/holder-lock/protocol.mjs:21): `code` e.g. 'lock-held', `category='precondition'`, message prefixed `holder-lock (lock-held): `; details {lock: WORKTREE_ADMIN, label, holders[pids], timedOut}. toMergeLockError (merge.mjs:414) relies on `err.code==='lock-held'`, `err.holders`, `err.lock`, and strips the message prefix; applied at merge.mjs:900 (not around createVerifyCheckout).
- bin/fgos.mjs:304-308 lockErrorToStoreError: only used at bin/fgos.mjs:3554 (main-checkout-reset). It is NOT on any D5 function path.
- WorktreeError: errorClass and category both 'worktree-fail'; read by loop.mjs (errorClass at 387/446/1086), store categoryOf (category).
- Lock-order check lives in repo-locks.mjs createWorktreeCheckoutSync:81 `scope.assertCanAcquire(WORKTREE_ADMIN, 40)`; waitMs default DEFAULT_WORKTREE_ADMIN_WAIT_MS. createWorktree/createVerifyCheckout take WORKTREE_ADMIN via addWorktreeSync; removeWorktree takes `dispatch-cwd` custody (scope default createLockScope('worktree-custody')), not worktree-admin.

## Crate API for the wrappers

Crate `fgos-checkout`, all re-exported from `lib.rs`. Every fn is synchronous and returns `fgos_checkout::Result<T>`
(`Error { kind, message, worktree_path, command, details }`). `Context { repo_root (trusted main), state_root, writer }`
is the first field of every request. Line numbers below are `src/runner/worktree.mjs` at `b430d015c`; the ported
bodies match them (re-checked). `details` is a JSON map keyed exactly as the Node error carries it; the addon does
`Object.assign(err, details)`.

### Error kind -> Node error

| `ErrorKind` | Node error |
|---|---|
| `Worktree` | `WorktreeError` (`errorClass` = `category` = `worktree-fail`), `message` verbatim, `details` assigned |
| `LockHeld` | `HolderLockError('lock-held', message, details)`; worktree-admin: `details` = `{lock:'worktree-admin', label:'worktree admin', holders:[pid..], timedOut}` and `message` is Node's text without the `holder-lock (lock-held): ` prefix. Only create fns return it bare; `remove_worktree` wraps a held custody lease inside a `Worktree` error (as Node does) |
| `Invalid` | `StoreError('validation', message)` (Node `resolveRefSha` failures: `reading ref X failed in "<repo>": ...`) |
| `Provision` | `command` set -> `WorktreeError` details `{worktreePath, command}` (setup command); `command` unset -> plain `Error` (dependency install: Node raw npm error), `worktree_path` is the checkout the failure left in place |
| `Git`, `Io` | plain `Error(message)` (Node raw fs / port errors) |

### Functions (`WorkCreate { ctx, id, worktree_dir: Option<PathBuf>, base_ref, start_sha: Option<String>, wait_ms: Option<u64> }`)

| fn | Node | returns | errors |
|---|---|---|---|
| `create_worktree(&WorkCreate) -> Result<WorkCreated>` | `createWorktree` :852 | `WorkCreated { path (realpath), branch, reused, refresh: None }` | `LockHeld` (admin held for `wait_ms`, default `DEFAULT_ADMIN_WAIT_MS` = 30000; `Some(0)` = one attempt), `Worktree` `git worktree add failed for branch "fgw/<id>": ...` `{branch, worktreePath}`, relocate/dirty refusals `{branch, orphanPath[, targetPath]}`, `Provision` after a best-effort forced removal, `Io` for the temp dir |
| `create_dispatch_worktree(&WorkCreate)` | `createDispatchWorktree` :1366 | same | same |
| `create_claim_worktree(&WorkCreate)` | `createClaimWorktree` :1213 | reattach: `{path, branch, reused:true, refresh:None}`; else create result plus `refresh: Option<Refresh>` (only when the branch existed without a live checkout and `base_ref` was given) | create errors + `resync_claim_worktree` `Worktree` errors |
| `create_verify_checkout(&Context, commit) -> Result<PathBuf>` | `createVerifyCheckout` :1330 | path in `<tmp>/fgos-worktrees/verify-*`, not realpathed; disposable record | `LockHeld`, `Worktree` `git worktree add --detach failed at <commit>: ...` `{worktreePath}`, `Provision` (checkout force-removed first) |
| `remove_worktree(&WorkRemove { ctx, path, delivered_to: Option<String>, retain_to: Option<String> }) -> Result<Option<Retained { retained_ref, snapshot }>>` | `removeWorktree` :1392 | `Some` only when `retain_to` moved the HEAD; prune failure swallowed | always `Worktree` `git worktree remove failed for "<path>": <cause>[; commit preserved at <ref>; snapshot <s>]`, `{worktreePath[, retainedRef, snapshot]}`; a held custody lease reads `holder-lock (lock-held): worktree custody is held` inside it. `force` is ignored in Node and has no field here |
| `remove_dispatch_worktree(&Context, &Path, &mut dyn FnMut(&str))` | `removeDispatchWorktree` :1371 | `()`; never fails, the log line is `fgos-runner: worktree cleanup failed for "<path>": <message>`. A dirty checkout is reset to its own HEAD under custody (an in-crate copy of Node `resetDispatchWorktree`, which stays Node for `loop.mjs:87`) | none |
| `list_leftovers(&Context, base: Option<&str>, include_tip: bool) -> Result<Vec<Leftover { branch, ahead_count, tip: Option }>>` | `listLeftovers` :1429 | order = ref order | `Worktree` `listing "fgw/" branches failed: ...` (no details) |
| `reclaim_orphaned_checkout(&Context, branch, caller_cwd: &Path) -> Result<Reclaimed { reclaimed, path: Option }>` | `reclaimOrphanedCheckout` :607 | `path` realpath when reclaimed | `Worktree` `{branch[, orphanPath]}`: list fail, repoRoot guard, live-cwd guard, dirty guard, removal fail, prune fail |
| `refresh_unstarted_branch(&Context, branch, target_ref, checkout: Option<&Path>) -> Result<Refresh>` | `refreshUnstartedBranch` :1267 | `Refresh { target, ahead, behind, refreshed, reason: Option<&str> (already-current / own-commits / refresh-refused), from, to, detail }` | `Invalid` (unknown ref) only; refusals are `refresh-refused` |
| `resync_claim_worktree(&Context, &Path, branch) -> Result<ClaimResynced { resynced, from, to }>` | `resyncClaimWorktree` :1051 | | `Worktree` `{branch, worktreePath[, lastSynced, branchTip]}` |
| `branch_name_for(id)` | `branchNameFor` | `fgw/<id>` | |

Notes for the wrapper:
- `finishWorktreeSetup` and `relocateOrphanedCheckout` are internal; no export. `provisionDependencies` and
  `runWorktreeSetupCommands` already exist from the earlier step (`provision_dependencies`, `run_setup_commands`).
- The worktree-admin hold is taken inside the crate with `wait_ms`; no caller-held handle crosses the addon (a Node
  `LockScope` cannot be borrowed by Rust). The wrapper keeps `scope.assertCanAcquire(WORKTREE_ADMIN, 40)` itself and
  maps `LockHeld`. `removeWorktree`'s `custody` and `scope` options have no caller in `src`/`bin`/`scripts`, so the
  request has no field for them; the lease is taken, never waited for.
- `createVerifyCheckout` and `createWorktree` take `wait_ms` default 30000 as `repo-locks.mjs` does.

### Fix round: one door for the worktree-admin lock
- `fgos_git::acquire_worktree_admin(repo, held, wait)` is now the single `pub` door (re-exported from lib.rs); the private `acquire_admin` takes the same `wait`. Every caller passes `Wait::Ms(5000)` (refs x3, land x7, remote x1) and the adopt path keeps 5000. A hold another process keeps for the whole wait is a `Busy` refusal `worktree-admin-held` whose detail carries `lock`, `holders` (pids) and `timedOut`; the checkout crate maps it to `LockHeld` with Node's wording.
- The checkout crate no longer seeds a LockScope or builds the lock path: `with_admin` calls the Git door with the caller's wait (default 30000 = `DEFAULT_WORKTREE_ADMIN_WAIT_MS` in repo-locks.mjs) and lends that hold to `create_worktree`. The hold must stay explicit: `create_worktree` takes it itself only with the fixed 5000 ms, so the caller's wait would be lost if it were dropped. The hold spans only the `create_worktree` call.
- `remote.rs` (outside the write scope) also called the old pub(crate) signature; its one call line was updated to compile (listed in needsWrites).

## Fix round: Node parity
- Reuse path: any driver/main/resolve/register failure removes the mkdtemp dir and raises Worktree `git worktree add failed for branch ...` with `{branch, worktreePath}`; a lock-held refusal passes through as before.
- Claim resync: an unreadable HEAD reflog or checkout facts now gives Node's `could not read its own HEAD reflog` Worktree refusal with `{branch, worktreePath}`.
- `orphan.rs`: the two duplicated lookups use one `checkout_in` that `checkout_path_for` also uses.
- The lock-held test asserts the holder pid is in `holders`.

## Backlog rows found (RUL104: ported as is)
- `createWorktree` cleanup-after-provision failure swallows a failing forced removal (kept; Node did too).
- The Rust copy of the dispatch reset duplicates Node `resetDispatchWorktree`; retire the Node one when S7 moves `loop.mjs:87`.
- Windows: the custody lease and the borrowed worktree-admin hold are unix-only in the Git port, so every create/remove here refuses on Windows exactly where `acquire_checkout_custody` already does; `cargo check` for both non-linux targets passes.

### Gates (this section's author)
`cargo test -p fgos-checkout` 36 pass (17 new in `tests/work.rs`, each owning one behaviour above; two checkout/remove
cases reuse the shared `around_removal`); `cargo clippy -p fgos-checkout --all-targets -- -D warnings` clean;
`cargo fmt --all --check` clean; `cargo check -p fgos-checkout --target x86_64-pc-windows-msvc` and
`--target aarch64-apple-darwin` pass. Tests were written after the port in this round, not red first (a deviation from
the lead rules; the reattach case failed first because its own fixture was wrong, not the code).

# Part B: addon, Node wrappers, doors

## What moved
- Addon namespace `checkout` (`packages/git/node-addon/src/checkout.rs`, registered in `lib.rs`, `versions().checkout` = 1, dependency on `fgos-checkout`; `cargo tree -p fgos-node-addon` lists it). Ten entries, one JSON request in, one JSON value out; a refusal is the crate error as JSON (`kind`, `message`, `worktreePath`, `command`, `details`). No change to the crate; no re-export was missing.
- `src/native/door.mjs` `combinedAbiMatches` requires `checkout >= 1`.
- `src/runner/worktree.mjs` 1437 -> 469 lines (93 added, 1061 deleted). Each of createWorktree, createClaimWorktree, createDispatchWorktree, createVerifyCheckout, removeWorktree, removeDispatchWorktree, listLeftovers, reclaimOrphanedCheckout, provisionDependencies, runWorktreeSetupCommands is one addon call plus mapping. Deleted: provisionSkillRoots, provisioningStateRoot, provisionWorktree, removeProvisioned (and the record helpers), resyncWorktree, resyncClaimWorktree, refreshUnstartedBranch, relocateOrphanedCheckout, finishWorktreeSetup, reattachableCheckout and the sync helpers, pruneWorktrees, ancestorOf, and the imports they alone used. Kept: branch/ref/trunk/dirty/path helpers, `resetDispatchWorktree`, `createBranchRef`, the two adapters named by the door rows.
- Error mapping (`checkoutError`): `worktree` -> `WorktreeError` (class and category `worktree-fail`, details assigned); `lock-held` -> `HolderLockError('lock-held')` with `lock`, `label`, `holders`, `timedOut`; `invalid` -> `StoreError('validation')`; `provision` with a command -> `WorktreeError {worktreePath, command}`, without -> plain `Error`; `io` -> plain `Error` carrying the errno `code` the fs call carried (claim-port reads `ENOTDIR`); `git` -> plain `Error`.
- Lock scope: createWorktree, createClaimWorktree, createDispatchWorktree and createVerifyCheckout call `scope.assertCanAcquire('worktree-admin', 40)` first (`opts.scope`, else a fresh `worktree` scope) and pass `waitMs`. `WORKTREE_ADMIN` is a local constant because `repo-locks.mjs` does not export it and is outside this scope. `removeWorktree` takes custody, not worktree-admin, as in the census.
- `runWorktreeSetupCommands` resolves the trusted main checkout from the root it is given before calling the crate (the crate reads config from the root it is handed; Node's config door did the resolution), so a worker's edit to its own checkout's config still never changes what runs (`worktree-config-trust.test.mjs`).
- Doors: new row "make, provision and remove a checkout" in `docs/architecture-manifest.json`. Patterns: `\bfgos_checkout\b`, `.create_worktree(`, `.remove_worktree(`, `.prune_worktree(`, `createGitWorktree(` (not the definition), `\bworktreeSetup\b`. Every hit enumerated: allowed = the crate, `apps/fgos/src/wiring/worktree.rs`, `node-addon/src/checkout.rs`, `node-addon/src/git/worktree.rs` (the Git port's Node carrier), `config/rust/src/bundle.rs` (section name); debt with reasons = `apps/fgos/src/wiring/session.rs` (session end removes through the port), `src/runner/repo-locks.mjs` and `src/runner/merge.mjs` (Land), `scripts/lib/git-ports.mjs` (launcher prune), `src/setup/model-pool-checks.mjs` and `src/cli/command-registry.mjs` (text that names `worktreeSetup`). Rows "resolve the invocation root" (debt) and "admit store access" (allowed) keep `src/runner/worktree.mjs`: both still match (`isMainWorktree`, `worktree-identity-unreadable`); no entry named a deleted symbol. Seeded caught/passed cases in `test/architecture.test.mjs`.

## Retired test -> owner now
Crate tests are `packages/execution/checkout/tests/work.rs` (W:) and `checkout.rs` (C:). The Node wiring test is "the Work creators and removers reach the Rust checkout door, ..." (N:).

| Retired test (test/runner/worktree.test.mjs unless noted) | Owner now |
|---|---|
| createWorktree makes a fresh branch fgw/<id> from HEAD | W: creating_a_work_checkout_forks_fgw_id_from_the_base_and_provisions_it; N: result shape |
| createWorktree with opts.baseRef forks from that ref's tip | same W test |
| createWorktree retried for the same id reuses the branch in a fresh directory | W: an_existing_clean_checkout_of_the_branch_is_moved_to_the_new_directory_never_destroyed |
| createWorktree reclaims a branch checked out at an orphaned path | same W test |
| createWorktree does not leak its directory when the reuse path is refused for a dirty checkout | W: a_dirty_checkout_of_the_branch_is_never_moved_and_the_refusal_names_branch_and_path |
| reclaimOrphanedCheckout: no-op, reclaimed, dirty refused, repoRoot refused, own cwd, nested cwd, unrelated cwd (7 cases) | W: a_crash_orphan_checkout_is_reclaimed_but_never_a_dirty_one_or_the_callers_own, a_branch_checked_out_at_the_main_checkout_is_never_reclaimed; N: no-op shape |
| listLeftovers: aheadCount 0, positive, empty (3 cases) | W: leftovers_list_every_fgw_branch_with_its_commits_ahead_and_optionally_its_tip; N: shape with tip |
| createVerifyCheckout checks out a root branch at its tip | W: a_verify_checkout_is_detached_at_the_commit_and_removal_takes_back_what_a_run_built_there; N |
| createClaimWorktree reattaches to the live checkout | W: a_claim_reattaches_to_its_standing_checkout_and_brings_it_to_the_branch_tip; N: reused true |
| refreshUnstartedBranch already-current; refreshUnstartedBranch with a live checkout (Node function deleted) | W: a_claim_moves_a_never_started_branch_onto_its_base..., a_branch_with_commits_of_its_own_is_not_refreshed. The live-checkout fast-forward variant: W: a_live_unstarted_checkout_is_fast_forwarded_with_its_branch_and_a_resync_after_it_does_nothing |
| a new checkout receives every ignored skill directory (called provisionSkillRoots) | C: provisioning_installs_copies_skills_runs_setup_with_the_main_root_and_records_it |
| createWorktree runs the configured worktreeSetup commands / runs nothing extra | C: same test; W: a_failed_setup_removes_the_registered_checkout_and_reports_the_failing_command |
| resyncClaimWorktree no-op at tip; resyncClaimWorktree re-strips .fgos/ | resync behaviour: C: resync_moves_a_branch_checkout_to_the_new_tip_and_carries_staged_work; no-op at tip: W: a_claim_resync_does_nothing_when_the_checkout_is_at_its_branch_tip; re-strip: W: a_claim_resync_leaves_no_fgos_directory_behind_when_the_new_tip_tracks_one |
| resyncWorktree x8 (no-op, diverged, nothing staged, reapply staged, real conflict, stray dirt, .fgos re-strip, orphaned patch, other branch's patch) | C: resync_moves_..., resync_refuses_stray_changes_beyond_what_is_staged; other branch: C: resync_with_nothing_staged_resets_cleanly_to_the_new_tip; diverged: C: resync_refuses_a_branch_rewritten_to_history_that_does_not_contain_the_checkout (claim form: W: a_claim_resync_refuses_a_branch_rewritten_to_history_that_does_not_contain_the_checkout); conflict with the patch kept: C: resync_refuses_a_staged_change_that_conflicts_with_the_new_tip_and_keeps_the_patch; orphaned patch and another branch's patch ignored: C: resync_refuses_while_a_patch_an_earlier_run_left_for_this_branch_is_unresolved; .fgos re-strip: C: resync_leaves_no_fgos_directory_behind_when_the_new_tip_tracks_one. The Node function had no caller |
| resyncWorktree without a branch refuses a detached checkout | behaviour removed with the Node function; its checkedOutBranch half is kept as a new Node test |
| worktree-callsite-wrapper: createClaimWorktree passthrough; createVerifyCheckout exact commit detached; createDispatchWorktree passthrough; removeDispatchWorktree silent; removeDispatchWorktree logs and swallows | W: a_claim_..., a_verify_checkout_is_detached..., a_dispatch_cleanup_resets_what_a_failed_round_left_then_removes_and_never_fails; N: log lines and the never-throw path. Kept in that file: the kept-open checkout case, which no crate test covers |

Changed, not retired: two cases (`worktree.test.mjs` broken-dependency cases) asserted a `SyntaxError` from a malformed `package.json`; the crate reports `Error: <path>/package.json is not valid JSON: ...`, so they now assert a plain `Error` with that message (no caller inspects the class, census). A raw npm install failure likewise becomes a plain `Error` (message kept, `status`/`stderr` fields no longer carried).

## Backlog rows found (RUL104: ported as is)
- `createClaimWorktree` now asserts the worktree-admin lock order up front, also on the reattach path that never takes it (Node asserted only on the create path). A scope already holding a higher-rank lock now fails earlier. No caller in `src` or `bin` passes such a scope.
- `test/runner/worktree-admin-multiprocess.test.mjs` still carries a single-process held-worktree-admin case that the new wiring test also owns; retire one when that file is in a scope.
- `repo-locks.mjs` still owns `addWorktreeSync` for the Land path (debt row), and the name `WORKTREE_ADMIN` is duplicated locally in `worktree.mjs`; both go when Land moves.

## Step 5: createWorktree wall time, before and after
Debug-profile addon, ext4 tmp, machine load average about 7, a fresh temp repo, 12 create+remove cycles per run, 3 runs interleaved, same fixture and script, base = the unchanged file copied before editing.
- Base: cold first call 333/293/322 ms; steady-state median 61 ms (per run medians 64/74/46).
- After: cold first call 323/357/285 ms; steady-state median 78 ms (per run medians 78/80/77).
- Cold call unchanged. Steady state is about 28% slower, over the 20% line, so this is reported. Both numbers come from the debug build under load; no release-profile measurement was made. The crate's added work per call is the config snapshot read for `worktreeSetup` and the provisioning record write, both in the debug profile.

## Gates (this section's author)
- `cargo build -p fgos-node-addon`, `cargo clippy -p fgos-node-addon --all-targets -- -D warnings` (only third-party warnings), `cargo fmt --all --check`, `node --check src/runner/worktree.mjs`: pass.
- Node, run from this checkout with the addon staged by `scripts/git-addon.mjs` and a private `FGOS_STATE_ROOT`: `test/runner/worktree.test.mjs`, `worktree-callsite-wrapper`, `worktree-config-trust`, `test/architecture.test.mjs`, `test/scripts/doc-health.test.mjs`: pass (135 of 136 across that run; the one failure is the census below). `claim-port`, `merge`, `merge-land`, `unit-handoff`, `intake/plan`, `intake/discovery`, `scripts/test-select-mutate`, `worktree-admin-multiprocess`: pass. `loop.test.mjs`: 68 of its cases fail here with `EROFS: mkdtemp '/var/tmp/fgos-machine-private-probe-XXXXXX'` from the confinement probe (the seat's read-only `/var/tmp`), before any worktree call; the lead should run it on a normal machine. One loop case ("the discovery sweep still runs normally...") fails on the same cause.
- `test/setup/git-mutation-census.test.mjs` fails by design until the lead regenerates the census: "mutation census was not built from this payload: src/native/door.mjs, src/runner/worktree.mjs". `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared sites.
- Not run: `cargo test --workspace`, Windows and macOS `cargo check`, the remaining importers of `worktree.mjs` (loop aside).

Status: DONE_WITH_CONCERNS
Summary: the addon namespace, the wrappers, the doors row and the wiring test are in; the Node cases the crate owns are retired with the table above.
Concerns: steady-state createWorktree is about 28% slower (debug build); the census needs regeneration; loop.test.mjs could not be run here (EROFS).
