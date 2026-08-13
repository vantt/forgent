# Iron Law evidence: tsk-4kw

`classifyIronLaw` on this item's real diff (`main...fgw/tsk-4kw`, computed the
same way `bin/fgos.mjs`'s `approve` verb computes it, against the COMMITTED
tree at `63c03a11` — not a pre-commit prediction):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Files in that diff:

```
CHANGELOG.md
bin/fgos.mjs
docs/history/tsk-4kw/RESEARCH.md
docs/history/tsk-4kw/plan.md
test/cli/fgos-merge.test.mjs
```

`matchedModules` is `bin/fgos.mjs`, matched by `MODULE_RULES`'
`{kind:'equals', value:'bin/fgos.mjs'}` — the whole entry file deliberately
stands in for "the evolve verb", and over-reporting on any `bin/fgos.mjs`
change is the safe direction (D13). That alone makes the gate required.

**`matchedFlags: ["audit"]` is weaker than it looks, and is recorded here
rather than quietly relied on.** `audit` is a literal entry in
`HEAVY_KEYWORDS` (`src/intake/risk-keywords.mjs`), and it matched this
item's *description text*, which contains the phrase "keeping the audit
record visible in fgos show" — words this session wrote when filing the
item. It is not evidence that the change touches audit or security
infrastructure. `plan.md`'s own lane analysis independently judged
`audit/security` NOT to apply, for the stated reason that the audit record
is preserved in full and only its classification changes; that judgment and
this keyword hit disagree, and the disagreement is real rather than
resolved by argument. The gate stands on the module match regardless, so
nothing here turns on which reading wins.

## The defect

`checkRetrospectiveContent` (`src/state/cleanup-harness.mjs:260`) gates
`cleanup → done` on real retrospective content and rejects engine
bookkeeping:

```js
const hasDecision = (view?.decisionsById?.[id] ?? []).some((d) => d?.kind !== 'engine');
```

`fgos sync-root` and `fgos promote-to-component` both recorded their merge
on the item via `addDecision` with no `kind`. That is not an absent field:
`addDecision` defaults it (`src/state/store.mjs:881`,
`kind: payload.kind ?? 'design'`), so the engine actively labelled a
mechanical branch merge as a **design decision** — a positive false claim,
not an omission. The gate then read it as someone's reflection and passed
the item through with no retrospective document behind it.

This is the same hole `tsk-qrs` closed for the driver's closing report,
still open through two other writers.

## Failing-test-first proof

The red tests were written and run BEFORE `bin/fgos.mjs` was touched. Both
drive the real verb end to end and read the decision it actually wrote —
deliberately not a hand-built `view` literal against
`checkRetrospectiveContent`, because that function was never the defective
half and such a test passes before the fix, proving nothing. (`plan.md`'s
Phase 1 originally called for exactly that weaker test; it was corrected at
implement time, and the correction is recorded in `plan.md` itself.)

### RED — `node --test test/cli/fgos-merge.test.mjs`, before the fix

```
✖ sync-root tags its decision as engine bookkeeping, so it cannot satisfy the retrospective gate (340.590969ms)
...
ℹ pass 57
ℹ fail 2

✖ failing tests:

test at test/cli/fgos-merge.test.mjs:241:1
✖ sync-root tags its decision as engine bookkeeping, so it cannot satisfy the retrospective gate (340.590969ms)
  AssertionError [ERR_ASSERTION]: a mechanical branch sync is engine bookkeeping, not a design decision

  'design' !== 'engine'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4kw-weyrTP/test/cli/fgos-merge.test.mjs:254:10)
```

```
  AssertionError [ERR_ASSERTION]: a mechanical component promotion is engine bookkeeping, not a design decision

  'design' !== 'engine'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4kw-weyrTP/test/cli/fgos-merge.test.mjs:499:10)
```

The `'design' !== 'engine'` in that output is what established the
defaulting behavior above — it was found by running the test, not by
reading `store.mjs` and assuming.

### GREEN — same command, after adding `kind: 'engine'` to both call sites

```
✔ sync-root tags its decision as engine bookkeeping, so it cannot satisfy the retrospective gate (319.275693ms)
✔ promote-to-component happy path (D1 new-item): creates a fresh root, merges both members into it, sets parent only after real success, records one decision (462.772787ms)
ℹ pass 59
ℹ fail 0
```

### Full suite — the item's own `verify`, `npm test`

```
ℹ tests 3117
ℹ suites 0
ℹ pass 3112
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 49380.822612
```

## Blast radius, measured rather than argued

Tightening a gate that decides whether work reaches `done` means items that
used to pass stop passing. That was measured against the live view before
any code was written, by simulating the tag over every real item:

```
total items      : 658
already failing  : 188
still ok after   : 467
FLIPPED ok->fail : 3
    tsk-25b [retrospective] :: no outcome docType/docPath or decision record found for this item
    tsk-2mt [delivered]     :: no outcome docType/docPath or decision record found for this item
    tsk-tku [retrospective] :: no outcome docType/docPath or decision record found for this item
```

Three of 658. None at `cleanup` or `done`, so nothing sitting at the gate
is newly blocked mid-flight. All three flip correctly: they carry no
`docType`/`docPath` and their only decision was a mechanical sync, so they
genuinely never ran a retrospective. They will now be held until real
synthesis happens, which is the intended effect and not a regression.

`impact-analysis: degraded` — `fgos tool query --capability
impact-analysis --status present` reports gitnexus `present`, but its index
is stale (last indexed `79fead3`, well behind this branch). Naming the gap
plainly rather than dropping it: no claim in this document rests on that
index. The call-site census, the test census, and the flip count above all
come from `rg` and from executing the real code.

## An error in this item's own research, corrected

`RESEARCH.md` round 1 claimed no test anywhere reads the decisions these two
verbs write, based on grepping the matching test files for
`decisions|decisionsById` and getting nothing. That was wrong: the real
tests use the singular `e.type === 'decision'` and a variable named
`decisionEvents`, neither containing the plural string searched for. Five
such tests exist. The conclusion (no existing test breaks) survived, but
only because those tests assert decision **count** and **text**, never the
full payload shape — a different reason than the one first recorded. The
correction is written into `RESEARCH.md` rather than silently patched, and
it is what located `fgos-merge.test.mjs:213` as the correct home for the
red-first test above.

## Provenance of the change itself

Found by a review sweep over the merged worker-slot batch (`tsk-2sj` and
its follow-ups `tsk-1oz`/`tsk-qrs`), filed as `tsk-4kw` with
`discoveredFrom: tsk-2sj`. Distinct from `tsk-37t`, which covers
`excludeId` past the ceiling and `fgos report` accepting an unknown id.

Both skill gates were approved by a real person (`planApprove` seq 15228,
`validateApprove` seq 15229, both `actor: human`), and the engine's own
heavy-risk gate parked the item at `awaiting-human` until a person answered
it (`ask` payload on the `work.move` at seq 15233; answered at seq 15263).
No gate on this item was auto-approved or bypassed.

`--acknowledge-iron-law` has NOT been run. This document exists so a person
can decide whether it should be.
