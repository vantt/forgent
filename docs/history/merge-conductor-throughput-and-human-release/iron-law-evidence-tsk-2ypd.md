# Iron Law evidence: tsk-2ypd

`classifyIronLaw` on this item's real diff (`fgw/tsk-2ypd` vs its target
`fgw/tsk-51m`, computed with `changedFiles(repoRoot, item, {trunk:
'fgw/tsk-51m'})` against the real branch):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```

`matchedFlags` is empty — nothing in this item's title or description trips a
keyword. The gate fires purely on the module rule: `src/evolve/iron-law.mjs`'s
`MODULE_RULES` carries `{prefix: 'src/runner/'}`, and `:93` decides
`required = matchedModules.length > 0 || matchedFlags.length > 0`, so touching
a gated module is by itself enough. `plan-tsk-2ypd.md`'s own Iron Law section
predicted exactly this before any code was written.

Full changed-file set:

```
docs/history/merge-conductor-throughput-and-human-release/plan-tsk-2ypd.md
src/runner/merge.mjs
src/state/graph-harness.mjs
test/runner/merge.test.mjs
test/state/graph-harness.test.mjs
```

`src/state/graph-harness.mjs` is not itself a gated module; it appears here
because the pure classifier lives there, deliberately split from the git-facing
collector in `merge.mjs`.

## This was failing-test-first

Both test files were written and run **before** either source file was
touched, and both failed on the missing exports. Real output, in order.

`test/state/graph-harness.test.mjs`, before `src/state/graph-harness.mjs` was
edited:

```
file:///.../test/state/graph-harness.test.mjs:3
import { mergeReadiness, mergeTree, openLeavesSharingTarget, classifyPostLandDrift } from '../../src/state/graph-harness.mjs';
                                                             ^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/graph-harness.mjs' does not provide an export named 'classifyPostLandDrift'

✖ test/state/graph-harness.test.mjs (38.267665ms)
ℹ pass 0
ℹ fail 1
```

`test/runner/merge.test.mjs`, before `src/runner/merge.mjs` was edited (same
shape — the module provides no `detectPostLandDrift` export yet):

```
✖ test/runner/merge.test.mjs (33.521357ms)
ℹ pass 0
ℹ fail 1
```

A second, narrower red followed once the exports existed but the leaf filter
was wrong — `isResolvedStatus` takes the item, not the status string, so
resolved siblings were not being excluded:

```
    actual: [ 'dropped', 'finished', 'live', 'merged', 'parked' ],
    expected: [ 'live', 'parked' ],
    operator: 'deepStrictEqual',
```

The test caught a real defect that would have made every resolved sibling a
detection candidate forever.

## What the tests actually prove

The four numbered acceptance criteria, each with the test that proves it:

1. **No shared path ⇒ nothing happens.** `classifyPostLandDrift: a leaf
   sharing no path produces nothing at all -- no notification, no mark`
   asserts `{notify: [], stale: []}` on the whole result, so neither bucket
   can quietly gain an entry. `detectPostLandDrift: no shared path produces
   nothing at all` proves the same through real git diffs on a real repo.
2. **Shared path + live session ⇒ that exact session, branch untouched.**
   `detectPostLandDrift: a shared path with a live session notifies that
   exact session and leaves its branch untouched` asserts the notification
   names `sess-leaf` and not the unrelated `sess-elsewhere`, and reads the
   leaf branch tip SHA before and after, asserting equality — D2's "the
   owning session decides what happens to its own branch" is checked, not
   assumed.
3. **Shared path + no session ⇒ stale mark only.** `detectPostLandDrift: a
   shared path with no live session is marked stale only` asserts `notify`
   empty, `stale` holding exactly the leaf, and again an unchanged branch tip.
4. **O(open leaves), zero verify.** `detectPostLandDrift examines exactly the
   open leaves sharing the target` asserts `examined` equals `['live']` out of
   five candidate items — a resolved sibling, a sibling aimed at a different
   target, and an item with no branch are all excluded, so the cost is the
   count of genuinely open same-target leaves and nothing more.
   `detectPostLandDrift runs no verify at all` gives both items a `verify`
   command whose only observable effect is creating a sentinel file, runs
   detection, and asserts the sentinel does not exist. Since `runGoalCheck` is
   the only thing that ever executes an item's `verify`, an absent sentinel is
   direct evidence no verify ran on this path.

Catchup cannot be reached from here at all, structurally: `catchup` is a verb
case in `bin/fgos.mjs` with no export, so `merge.mjs` has no way to call it.
The risk this item was created to avoid is closed by construction, not by
discipline.

Two further tests guard the subtle part. `mergeRunnerItem attaches a postLand
report whose landed paths were captured BEFORE the merge` asserts the report
carries the real path set AND that `changedFiles` on the same item returns
empty immediately afterwards — once the merge lands, the target contains the
branch, so the three-dot diff is empty and a report computed after the fact
would silently find nothing to flag. `mergeRunnerItem attaches no postLand
report when the merge did not land` holds the boundary that detection only
follows a real land.

## Full suite

Run from this branch, clean tree, immediately before this evidence file was
written:

```
$ npm test
ℹ tests 3003
ℹ suites 0
ℹ pass 2998
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 101006.16786
```

(The 5 skips pre-exist this item's work and are unrelated to it.)

## Not acknowledged by this session

The acknowledgment itself is deliberately left to a person — `fgos approve
tsk-2ypd --acknowledge-iron-law` has not been run here. The Iron Law stop is a
real human judgment by design (§H.3 and the locked law); this file exists so
that judgment can be made quickly against real evidence rather than
reconstructed from scratch.
