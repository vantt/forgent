# Iron Law evidence — tsk-2cd

`classifyIronLaw` on this item's final diff (`ecbd7a7`, parent `e597084`)
returns:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/worktree.mjs"]}
```

Both `bin/fgos.mjs` and `src/runner/worktree.mjs` are on `MODULE_RULES`
(`src/evolve/iron-law.mjs`) as self-modifying-capable modules — the files
this item's own diff genuinely changes (`resyncClaimWorktree` and its two
helpers in `worktree.mjs`, wired into `createClaimWorktree`'s reattach
branch; the corrected stale comment in `bin/fgos.mjs`), no false positive.

## Failing-test-first proof

The guard (`resyncClaimWorktree`, `lastSyncedCommit`,
`isDirtyRelativeToSync`) is new code with no pre-fix equivalent to run the
new tests against — so RED here is the honest shape that produces: the new
tests fail to even load against the pre-fix module, because the export
they exercise did not exist yet.

### RED — new resync tests against pre-fix `src/runner/worktree.mjs`

Pre-fix content restored from `git show e597084:src/runner/worktree.mjs`
(the parent of this item's own implementation commit `ecbd7a7`), swapped
in for `src/runner/worktree.mjs` with the post-fix `test/runner/
worktree.test.mjs` (already committed) left in place:

```
$ node --test --test-name-pattern="resync" test/runner/worktree.test.mjs

file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2cd-zIrQDW/test/runner/worktree.test.mjs:17
  resyncClaimWorktree,
  ^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/worktree.mjs' does not provide an export named 'resyncClaimWorktree'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/runner/worktree.test.mjs (91.276133ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

A real, direct proof that the pre-fix code has no resync capability at
all — not a paraphrase.

### GREEN — same tests, post-fix `src/runner/worktree.mjs` restored

```
$ node --test --test-name-pattern="resync" test/runner/worktree.test.mjs

✔ resyncClaimWorktree is a no-op when the worktree is already at its branch tip (40.440802ms)
✔ createClaimWorktree auto-resyncs a clean reattach whose branch advanced via an external (merge-style) ref update (82.495304ms)
✔ createClaimWorktree refuses to resync (and never resets) a reattach that is both behind its branch AND has real uncommitted work (79.700945ms)
✔ createClaimWorktree refuses to resync a reattach whose last-synced commit is not an ancestor of the branch's current tip (a rewrite/divergence) (86.235236ms)
✔ createClaimWorktree still reattaches a DIRTY checkout whose branch never moved -- the resync guard is a no-op, not a new refusal (tsk-2cd) (49.038181ms)

ℹ tests 5
ℹ pass 5
ℹ fail 0
```

`git diff --stat src/runner/worktree.mjs` confirmed empty immediately
after restoring the post-fix file from a separate backup copy, before this
run — the GREEN run above is against the exact committed implementation,
not a re-edited approximation of it.

### Full suite, post-fix

```
$ node --test test/runner/worktree.test.mjs
ℹ tests 42
ℹ pass 42
ℹ fail 0

$ npm test
ℹ tests 2631
ℹ pass 2626
ℹ fail 0
ℹ skipped 5
```

(Baseline before this item's implementation, run during `fgos-coding-validating`:
`npm test` → 2621 pass / 0 fail / 5 skipped out of 2626. This item's 5 new
tests account for the full delta.)

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming both changed files are self-modifying-capable and trigger
  `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — real command runs against real file
  contents swapped in/out on disk (`git show e597084:...` extraction, a
  separate backup copy for the restore), not paraphrased or fabricated.
- `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md` D1-D3
  and `plan.md`'s risk map/Approach section — the decisions and proof
  points this evidence satisfies.
