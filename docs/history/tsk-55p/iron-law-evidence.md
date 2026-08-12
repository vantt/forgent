# Iron Law evidence: tsk-55p

`classifyIronLaw` on this item's real diff (`fgw/tsk-55p` vs its target
`fgw/tsk-51m`, computed with `changedFiles(repoRoot, item, {trunk:
'fgw/tsk-51m'})` against the real branch):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/worktree.mjs"]
}
```

`matchedFlags` is empty — nothing in this item's title or description trips
a keyword. The gate fires purely on the module rule: `src/evolve/
iron-law.mjs`'s `MODULE_RULES` carries `{prefix: 'src/runner/'}`, and `:93`
decides `required = matchedModules.length > 0 || matchedFlags.length > 0`,
so touching a gated module is by itself enough.

Full real diff (`fgw/tsk-51m...HEAD`):

```
src/runner/worktree.mjs
test/runner/worktree.test.mjs
```

## Honest gap: this was not failing-test-first development

Same disclosure as this batch's sibling items
(`docs/history/tsk-xyr/iron-law-evidence.md`,
`docs/history/merge-conductor-throughput-and-human-release/
iron-law-evidence-tsk-2ypd.md`): `refreshUnstartedBranch` and its wiring
into `createClaimWorktree` were implemented first, then covered with tests
in the same pass and verified green — not proven red-before-green. Stated
plainly rather than dressed up as something it was not.

## What was actually proven

The three numbered acceptance criteria from this item's own design, each
with the test that proves it:

1. **A white branch created long ago stands on the target's current tip
   once picked.** `createClaimWorktree refreshes a branch with no commits
   of its own onto the target tip` — creates a branch, advances its base
   externally (a real detached-checkout + `git branch -f`, the same
   mechanism a real merge lands with), then asserts the resulting claim's
   branch ref AND its checkout's `HEAD` both land on the new tip, and the
   new tip's own content is actually present on disk.
2. **A branch that already has its own commits is never touched — only
   drift is reported.** `createClaimWorktree never touches a branch
   carrying its own commits, and reports drift instead` — asserts the
   branch is byte-identical (same SHA) before and after the claim, with
   `refresh: {refreshed: false, reason: 'own-commits', ahead: 1, behind:
   1}`. This is the row `plan.md` names as the real risk (mistaking
   "white" for "started" or vice versa is real lost work) — the test
   asserts on the SHA staying fixed, not on an absence of a thrown error.
3. **No path here ever rewrites branch history.** `the refresh only ever
   fast-forwards — the pre-refresh tip survives as an ancestor of the
   post-refresh tip` — asserts `git merge-base --is-ancestor
   <pre-refresh-tip> <post-refresh-tip>` succeeds, which a rebase could not
   satisfy (a rebase drops the original commit from history entirely,
   replacing it with a new one carrying different parents).

Plus: `createClaimWorktree with no baseRef supplied` (regression guard —
`refresh` is `undefined`, byte-identical to every test of this function
that predates this item, none of which pass `baseRef`); two direct
`refreshUnstartedBranch` unit tests (`already-current` short-circuit; a
live-checkout refresh via a real `git merge --ff-only`, followed by
`resyncClaimWorktree` confirming it then sees nothing left to do).

`createWorktree` itself — deliberately never touched, per its own docblock
and this item's design (shared byte-identical with the runner's own
retry-without-self-collision dispatch path) — is proven unmodified by the
full pre-existing suite for it passing unchanged (`createWorktree with
opts.baseRef on an existing (reused) branch ignores baseRef and reuses as
before`, among others).

## Full suite

Run from this branch, clean tree, immediately before this evidence file was
written:

```
$ npm test
ℹ tests 2991
ℹ suites 0
ℹ pass 2986
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 69940.368767
```

(The 5 skips pre-exist this item's work and are unrelated to it. Total
count is lower than sibling items in this batch because this branch was
never caught up onto `fgw/tsk-51m`'s later children — its own diff against
`fgw/tsk-51m` above is exactly its own two files, nothing borrowed.)

## Not acknowledged by this session

The acknowledgment itself is deliberately left to a person — `fgos approve
tsk-55p --acknowledge-iron-law` has not been run here. The Iron Law stop is
a real human judgment by design; this file exists so that judgment can be
made quickly against real evidence rather than reconstructed from scratch.
