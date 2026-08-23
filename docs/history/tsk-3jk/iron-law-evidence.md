# Iron Law evidence: tsk-3jk

`classifyIronLaw` on this item's real diff (`fgw/tsk-3jk` vs its resolved root
branch, computed from the real main checkout via `changedFiles(repoRoot,
item)`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/claim-port.mjs",
    "src/runner/loop.mjs"
  ]
}
```

`matchedFlags` is empty: nothing in this item's title or description trips a
risk keyword, checked directly rather than assumed.

## One of the three matched modules is this item's own

Unlike T2 (`tsk-1zq`), where every matched path was inherited, this item
genuinely owns one of them.

`changedFiles` diffs the branch against the trunk, and `fgw/tsk-3jk` is forked
from `fgw/tsk-2sj`, which already carries T1 (`tsk-3dt`), T2 (`tsk-1zq`) and
T3 (`tsk-3ac`) merged — so the classified diff spans all four items.
`bin/fgos.mjs` and `src/runner/claim-port.mjs` are T1's (the `slots` verb and
the ceiling gate inside `claimWork`), and T1 wrote its own evidence for exactly
those two paths (`docs/history/tsk-3dt/iron-law-evidence.md`).

`src/runner/loop.mjs` is this item's. This item's own diff, in full:

```
$ git diff --name-only fgw/tsk-2sj...HEAD
.agents/skills/fgos-fanout/SKILL.md
.claude/skills/fgos-fanout/SKILL.md
CHANGELOG.md
docs/history/tsk-3jk/iron-law-evidence.md
docs/history/tsk-3jk/plan.md
src/runner/loop.mjs
test/runner/loop.test.mjs
```

(captured after the evidence commit itself landed, so this file appears in
its own listing — the classification above was computed one commit earlier,
on the implementation commit, which is the diff `approve` will re-classify.)

`MODULE_RULES`'s `{kind:'prefix', value:'src/runner/'}` matches that file, so
the requirement is fired by this item's own new code, not only by inherited
history.

## This one WAS failing-test-first

Stated plainly because the two sibling records above could not claim it: here
the three tests were written and run BEFORE `src/runner/loop.mjs` was touched
at all, and two of them failed for the feature's own reason.

Red, before any implementation line existed:

```
$ node --test test/runner/loop.test.mjs
✔ no workerSlots ceiling configured leaves the drain-run exactly as it was — occupancy is not a ceiling on its own (90.352843ms)
✖ the drain-run asks for worker-slot room before dispatching: a full ceiling ends the run cleanly instead of halting on a claim refusal (19.40072ms)
✖ an overshooting batch lands soft: the member the ceiling gate refuses is left for a later poll, and the drain-run neither halts nor exits non-zero (80.797711ms)
```

Both reds are load-bearing, and each pins a different half of D6.

The first failed on the pre-check's absence — the drain-run dispatched into a
lane the engine had already declared full, so the run reported work done
instead of stopping:

```
✖ the drain-run asks for worker-slot room before dispatching: a full ceiling ends the run cleanly instead of halting on a claim refusal
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  'drained' !== 'idle'

      at TestContext.<anonymous> (file:///.../test/runner/loop.test.mjs:707:10)
```

The second failed on the refusal landing — and this is the one that proves the
change is a real fix rather than a tidy-up. With exactly one free slot and a
two-member wave, the tail member's `worker-slot-ceiling` refusal was routed
through `categoryOf`'s `validation` category and became a HALT, taking the
whole drain-run down with a non-zero exit:

```
✖ an overshooting batch lands soft: the member the ceiling gate refuses is left for a later poll, and the drain-run neither halts nor exits non-zero
  AssertionError [ERR_ASSERTION]: a ceiling refusal mid-batch is not a halt

  4 !== 0

      at TestContext.<anonymous> (file:///.../test/runner/loop.test.mjs:724:10)
```

`4` is the store's `validation` exit code. That is the exact overshoot case D8
is designed to permit ("if ≥1 slot is free, take the whole batch"), so before
this item the design's own intended path was the path that broke the runner.

The third test — the inert-by-default one — passed on both sides on purpose.
It is a regression guard, not a feature test: an absent `workerSlots.ceiling`
must leave the drain-run byte-for-byte as it was, and it asserts that with 20
items already at `doing`. A test that only went green after the change would
not have proven that.

Green, after the implementation:

```
$ node --test test/runner/loop.test.mjs
✔ no workerSlots ceiling configured leaves the drain-run exactly as it was — occupancy is not a ceiling on its own (89.998829ms)
✔ the drain-run asks for worker-slot room before dispatching: a full ceiling ends the run cleanly instead of halting on a claim refusal (14.853308ms)
✔ an overshooting batch lands soft: the member the ceiling gate refuses is left for a later poll, and the drain-run neither halts nor exits non-zero (148.368298ms)
ℹ tests 64
ℹ pass 64
ℹ fail 0
```

## What was actually proven

The item's own verify command, all three parts, run from the implementation
branch with a clean tree:

```
$ npm test && grep -q 'worker-slot' .claude/skills/fgos-fanout/SKILL.md && ! grep -q 'At most 5 Agents in flight at once' .claude/skills/fgos-fanout/SKILL.md
ℹ tests 2993
ℹ pass 2988
ℹ fail 0
ℹ skipped 5
VERIFY EXIT=0
```

One real failure surfaced mid-run and was fixed rather than worked around:
`test/skills/fgos-mirror.test.mjs` caught that `.claude/skills/fgos-fanout/
SKILL.md` and its `.agents/skills/` counterpart had diverged after the prose
edit (`docs/specs/runner.md` D4 requires them byte-identical). The mirror was
re-synced; the test was not touched.

## Honest gap: D8's whole-batch rule is not re-proven end-to-end here

Named rather than glossed, because the plan's assumption A-1 depends on it.

The launcher side is proven: the runner offers the whole pre-computed wave as
one batch and reads only `allowed`, never `free`. The engine side was already
proven at the unit level by T1 (`test/state/worker-slots.test.mjs:113-116`, "a
pre-computed batch is never split by the ceiling").

What is NOT proven — and cannot be, without touching `claim-port.mjs`, which
is outside this item's footprint and against T1's own accepted-race decision —
is that a granted batch always lands whole. `claimWork` counts per item with
`batchSize` defaulting to 1, so the tail of an overshooting batch can still be
refused. The overshoot test above documents exactly that: it asserts the
refusal is soft and the refused member is picked up on a later poll, not that
it went out in the first wave. D8's bound on overshoot is therefore an upper
bound, not a guarantee — and the refusal landing exists precisely so the gap
costs a deferred item instead of a halted run.

## Blast radius, cross-checked

`impact-analysis: degraded`. `fgos tool query --capability impact-analysis
--status present` reports one provider (`gitnexus`, `present`), but it produced
a measured false negative on this very file — the same class RESEARCH F-G
recorded for `claimWork`, and the reason the plan refused to lean on it:

```
impact({target: 'runOnce', direction: 'upstream'})
  -> impactedCount: 0, risk: LOW, epistemic: "exact"

$ rg -l 'runOnce' src bin test
  -> 13 files, including the real production caller bin/fgos-runner.mjs
```

`epistemic: "exact"` on a zero result that grep contradicts thirteen times over
is why every blast-radius claim in this item is grepped first. The one query
that did agree was checked too and matched exactly: `impact({target:
'selectWave'})` returned `impactedCount: 1, direct: 1`, and `rg 'selectWave'`
finds precisely one call site (`loop.mjs`'s own drain-run).

The grep-sourced radius: `selectWave`, `resolveParallel`, `DEFAULT_MAX_ROOTS`
and `DEFAULT_MAX_LEAVES_PER_ROOT` appear in `src/runner/loop.mjs` and nowhere
else in `src/`, `bin/` or `test/` — the two exported constants have no reader
outside their own file. No HIGH or CRITICAL rating was returned by either
query, so none was passed over.

The layering was checked rather than assumed: `docs/architecture-manifest.json`
puts `src/runner/loop.mjs` at `use-case` and both new imports
(`src/state/worker-slots.mjs`, `src/config/shared-config-file.mjs`) at
`domain`, so the two added imports point downward, and
`test/architecture.test.mjs` passes in the full run above.

## Not yet accepted

This evidence file is written and committed on the item's own branch. The
`--acknowledge-iron-law` decision belongs to a human and has NOT been taken
here: `fgos approve` was deliberately not run by the implementing session.
