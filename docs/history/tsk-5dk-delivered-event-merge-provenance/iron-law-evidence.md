# Iron Law evidence — tsk-5dk

`classifyIronLaw` on this item's final committed diff (`844b9a5e`) returns:

```json
{
  "required": true,
  "matchedFlags": ["sự cố", "audit"],
  "matchedModules": ["bin/fgos.mjs", "src/runner/github-adapter.mjs", "src/state/store.mjs"]
}
```

All three matched modules are files this item's own diff genuinely changes
(`moveWork`'s new optional fields; `approve`'s real merge call sites;
`viewGitHubPRStatus`/`mergeGitHubPR`'s `mergeCommit` field) — not a
description-keyword false positive; the item's own description is itself
about an audit/incident gap (`sự cố`, `audit`), which is exactly the class
of change this gate exists to slow down.

## Failing-test-first proof

Two of this item's own touched surfaces, run RED before the implementing
change landed, GREEN after — both real command runs against this session's
own working tree at the time (not paraphrased or fabricated; these are the
actual transcripts produced during Execute, in order).

### RED — `test/state/store.test.mjs`, before `moveWork` gained `mergedSha`/`mergedInto`

```
$ node --test test/state/store.test.mjs

✖ moveWork stamps mergedSha and mergedInto onto the appended event payload for a doing -> delivered move that carries them (1.215907ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'deadbeefcafe'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5dk-iVeDBY/test/state/store.test.mjs:296:10)
```

The companion "omits when absent" test passed trivially at this point too
(both fields were always absent pre-fix) — the meaningful red is the
"carries them" assertion above: `mergedSha`/`mergedInto` did not yet exist
as `moveWork` params, so the event payload never carried them.

### GREEN — same file, after `store.mjs`'s additive destructure/stamp block landed

```
$ node --test test/state/store.test.mjs
ℹ tests 54
ℹ pass 54
ℹ fail 0
```

### RED — `test/cli/fgos-move.test.mjs`, before `case 'move'` gained the refusal check

```
$ node --test test/cli/fgos-move.test.mjs

✖ move --to delivered is REFUSED when fgw/<id> exists and is NOT reachable from trunk, no event written (375.120694ms)
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0
      operator: 'notStrictEqual'

✖ move --to delivered with --override-reason proceeds despite an unreachable branch, and logs the reason to the decision log (370.010335ms)
  AssertionError [ERR_ASSERTION]: override must be recorded to the decision log

✖ move --to delivered without --override-reason refuses even with an EMPTY --override-reason value (validation, not a silent bypass) (376.721564ms)
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0
      operator: 'notStrictEqual'
```

The other three tests in that same file (no-branch, already-reachable,
non-delivered-target) passed at this point already — expected, since they
describe behavior the refusal check was never meant to change.

### GREEN — same file, after the refusal check landed in `case 'move'`

```
$ node --test test/cli/fgos-move.test.mjs
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

### A real bug the RED/GREEN discipline itself caught mid-implementation

The first GREEN attempt at the leaf-into-root `mergedSha` (a risk row
`fgos-coding-validating` had already flagged medium, `plan.md`'s own
Validating addendum) used `resolveRefSha(repoRoot, rootBranch)` — this
passed its own isolated unit tests but broke an EXISTING test,
`test/cli/fgos-approve.test.mjs`'s leaf happy-path, once the real assertion
(added to that test) compared the recorded `mergedSha` against the branch's
real post-approve tip:

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ '2342933220e8bfd22ab619a0bd0d7d7010ae46e6'
- '11fe97f9707a05d1cbe4e0c1aa7ca9472afd5bdc'
```

Root cause: `withMergeEphemeralWorktree` (`src/runner/worktree.mjs:893`)
only force-moves the real branch ref AFTER the callback returns — reading
`rootBranch`'s ref from `repoRoot` INSIDE the callback (where the code sat)
still saw the pre-merge sha. Fixed to read the ephemeral worktree's own
`HEAD` instead (`currentHead(ephemeral.path)`), which is the just-created
merge commit in both the fresh-merge and idempotent-already-merged cases.
Left as a permanent, plain-language comment at the fix site in `bin/fgos.mjs`
(the `## Validating addendum` section of `plan.md` also carries the
original flagged risk this bug came from).

### Full suite, post-fix

```
$ npm test
ℹ tests 3116
ℹ pass 3111
ℹ fail 0
ℹ skipped 5
```

Two pre-existing e2e tests (`test/e2e/runner-loop.test.mjs`,
`test/e2e/synthetic-domain.test.mjs`) needed `--override-reason` added to
their own `move --to delivered` calls — both were moving a genuinely
branched, unmerged runner item straight to `delivered` to test FSM
lifecycle machinery, not merge mechanics; the new refusal check correctly
caught that as exactly the anti-pattern this item exists to close. Fixed by
using the override escape hatch with an honest reason, never by weakening
the check.

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES`/flag
  matching, confirming all three modules and both flags are real, not
  guessed.
- The RED/GREEN transcripts above — real `node --test` runs against this
  session's own working tree at each point in Execute, not paraphrased.
- `docs/history/tsk-5dk-delivered-event-merge-provenance/CONTEXT.md` D1/D2
  and `plan.md`'s risk map + Validating addendum — the decisions and proof
  points this evidence satisfies.
