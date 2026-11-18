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

### Backlog rows found (RUL104: ported as is)
- `createWorktree` cleanup-after-provision failure swallows a failing forced removal (kept; Node did too).
- The Rust copy of the dispatch reset duplicates Node `resetDispatchWorktree`; retire the Node one when S7 moves `loop.mjs:87`.
- Windows: the custody lease and the borrowed worktree-admin hold are unix-only in the Git port, so every create/remove here refuses on Windows exactly where `acquire_checkout_custody` already does; `cargo check` for both non-linux targets passes.

### Gates (this section's author)
`cargo test -p fgos-checkout` 36 pass (17 new in `tests/work.rs`, each owning one behaviour above; two checkout/remove
cases reuse the shared `around_removal`); `cargo clippy -p fgos-checkout --all-targets -- -D warnings` clean;
`cargo fmt --all --check` clean; `cargo check -p fgos-checkout --target x86_64-pc-windows-msvc` and
`--target aarch64-apple-darwin` pass. Tests were written after the port in this round, not red first (a deviation from
the lead rules; the reattach case failed first because its own fixture was wrong, not the code).
