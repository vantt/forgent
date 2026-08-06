# tsk-5yp — Iron Law evidence

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork(process.argv[1] + '/.fgos').work[process.argv[2]];
const filesChanged = changedFiles(process.argv[1], item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description })));
" "$root" "tsk-5yp"
```

Result: `{"required":true,"matchedFlags":[],"matchedModules":["src/runner/worktree.mjs"]}`

## Test command

```
node --test test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
```

(the item's own recorded `verify`)

## Failing-before (new regression test added, fix not yet implemented)

```
Switched to branch 'root-branch'
Switched to branch 'master'
fatal: '/tmp/fgos-worktree-wrapper-test-dir-rxTmzR/dispatch-item-2-ZT7iIG' is not a working tree
✔ createClaimWorktree is a passthrough to createWorktree (branch, path, baseRef honored) (29.876778ms)
✔ withMergeEphemeralWorktree creates a worktree, runs fn, and removes the checkout on success (34.26367ms)
✔ withMergeEphemeralWorktree still removes the checkout when fn throws, and propagates the error (30.198304ms)
✖ withMergeEphemeralWorktree never touches a separate, kept-open checkout of the same branch (39.933963ms)
✔ createDispatchWorktree is a passthrough to createWorktree (worktreeDir/baseRef honored) (43.636048ms)
✔ removeDispatchWorktree removes a real checkout silently (no log call) (30.583679ms)
✔ removeDispatchWorktree never throws on a failed removal — it logs and swallows (30.552194ms)
ℹ tests 7
ℹ suites 0
ℹ pass 6
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 293.132555

✖ failing tests:

test at test/runner/worktree-callsite-wrapper.test.mjs:96:1
✖ withMergeEphemeralWorktree never touches a separate, kept-open checkout of the same branch (39.933963ms)
  AssertionError [ERR_ASSERTION]: kept-open worktree directory must survive the merge
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5yp-F1Vhky/test/runner/worktree-callsite-wrapper.test.mjs:118:10)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }
```

## Passing-after (fix implemented, both files committed)

```
✔ createClaimWorktree is a passthrough to createWorktree (branch, path, baseRef honored) (30.759849ms)
✔ withMergeEphemeralWorktree creates a worktree, runs fn, and removes the checkout on success (35.7805ms)
✔ withMergeEphemeralWorktree still removes the checkout when fn throws, and propagates the error (28.001609ms)
✔ withMergeEphemeralWorktree never touches a separate, kept-open checkout of the same branch (47.304659ms)
✔ createDispatchWorktree is a passthrough to createWorktree (worktreeDir/baseRef honored) (35.181402ms)
✔ removeDispatchWorktree removes a real checkout silently (no log call) (24.454472ms)
✔ removeDispatchWorktree never throws on a failed removal — it logs and swallows (28.169199ms)
✔ branchNameFor is deterministic per id (0.933425ms)
✔ createWorktree makes a fresh branch fgw/<id> from HEAD when none exists (24.684876ms)
✔ a worker commit on the worktree branch survives after removeWorktree, and removeWorktree runs safely from repoRoot (37.814721ms)
✔ createWorktree retried for the same id reuses the existing branch into a fresh directory (no self-collision) (49.451631ms)
✔ createWorktree reclaims a branch already checked out at an orphaned path still on disk (crash recovery), instead of throwing (39.7386ms)
✔ createWorktree reclaims a branch registered as checked out at a path that is already gone from disk (prune), instead of throwing (46.661835ms)
✔ createWorktree preserves the orphaned checkout when relocation itself fails (zero-destroy) (50.47708ms)
✔ reclaimOrphanedCheckout is a no-op when the branch is not checked out anywhere (40.780427ms)
✔ reclaimOrphanedCheckout reports reclaimed:true and force-removes the still-existing checkout directory (35.449568ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout with real uncommitted changes (data-loss guard) (42.564723ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that resolves to repoRoot itself (tsk-k8u D1) (15.080514ms)
✔ createWorktree does not leak its freshly-allocated directory when the reuse path is refused for a dirty checkout (40.410482ms)
✔ reclaimOrphanedCheckout still reclaims normally when the only "change" is the .fgos removal createWorktree itself performs (56.52989ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that is the calling session's own live cwd (tsk-1tm, exact-match) (43.855758ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout whose live session cwd is nested under it (tsk-1tm, defense-in-depth) (48.161576ms)
✔ reclaimOrphanedCheckout still reclaims normally when callerCwd is unrelated to the checkout (regression) (43.062802ms)
✔ listLeftovers reports aheadCount 0 for a branch with no commits beyond base (orphan) (30.937008ms)
✔ listLeftovers reports a positive aheadCount for a branch carrying a real proposal (36.187357ms)
✔ listLeftovers returns an empty array when no fgw/ branches exist (12.515423ms)
✔ removeWorktree throws worktree-fail for a path that is not an actual worktree (16.519256ms)
✔ createBranchRef creates a real branch ref pointed at baseRef, with zero worktree checkouts registered for it (22.266425ms)
✔ createBranchRef is idempotent: a second call on an existing branch is a no-op and does not move the branch (27.362861ms)
✔ createWorktree with opts.baseRef forks a new branch from that ref's tip, not from repoRoot's current HEAD (47.831439ms)
✔ createWorktree removes a git-tracked .fgos/ from the fresh worktree entirely — no stale copy, no symlink (ADR0020) (28.131297ms)
✔ createWorktree stays a no-op on .fgos/ removal when the repo never tracked .fgos/ at all (21.596907ms)
✔ createWorktree with opts.baseRef on an existing (reused) branch ignores baseRef and reuses as before (46.275688ms)
✔ createClaimWorktree reattaches to the live checkout of fgw/<id> instead of removing it, and reports reused:true (40.931038ms)
✔ createClaimWorktree reattaches a DIRTY checkout with its uncommitted work intact (where createWorktree refuses outright) (44.489003ms)
✔ createClaimWorktree ignores a checkout outside its own worktreeDir (a runner dispatch checkout is never reattached to) (55.352601ms)
✔ createClaimWorktree falls through to a fresh checkout when the registered path is gone from disk (54.886902ms)
✔ createDispatchWorktree still allocates a FRESH directory on a reused branch — the reattach never leaks to the runner retry path (46.194648ms)
✔ provisionDependencies no-ops when the worktree has no package.json at all (0.198239ms)
✔ provisionDependencies no-ops when package.json declares no dependencies or devDependencies (0.186137ms)
✔ provisionDependencies runs npm install (no lockfile) and the declared dependency ends up in this worktree's own node_modules (162.673964ms)
✔ provisionDependencies runs npm ci when package-lock.json is present (309.314366ms)
✔ createWorktree provisions a declared dependency into the fresh worktree automatically (188.33319ms)
✔ createWorktree stays byte-identical (no node_modules created) for a repo with no package.json — every existing zero-dependency caller unaffected (25.095168ms)
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1891.274227
```

Wider regression check also run (not part of the item's own `verify`, run
because the fix touches a primitive shared by every merge call site —
`plan.md`'s own risk map row 2): `test/runner/promote-engine.test.mjs` +
`test/runner/merge.test.mjs` — 66/66 pass, including `retargetMember`
exercising `withMergeEphemeralWorktree` end to end. `test/cli/fgos.test.mjs`
filtered to `--test-name-pattern="approve"` — 53/53 pass, including the
exact leaf-into-root-via-ephemeral-worktree scenario ("approve of a leaf
item with a clean merge lands the work on fgw/<root> ... via an ephemeral
worktree ... fgw/<root> survives").

## Method note

Same discovered pattern as `docs/history/tsk-2u9/iron-law-evidence.md`:
`classifyIronLaw` was first run during Implement, before committing —
`filesChanged` had nothing committed yet to see for `src/runner/
worktree.mjs`, so that run incorrectly reported `required: false` /
`matchedModules: []`. The classification above was re-run after
committing the implementation (`git commit`, `995098b`), which produced
the correct `required: true` result. The failing-before transcript was
captured before that commit (new test in place, fix not yet written); the
passing-after transcript was captured immediately after implementing the
fix, still pre-commit for the fix itself at that point, then reconfirmed
unchanged post-commit.
