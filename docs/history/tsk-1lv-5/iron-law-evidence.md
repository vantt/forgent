# Iron Law evidence: tsk-1lv-5

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit
`a670be68`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs",
    "src/state/store.mjs"
  ]
}
```

## Which matched modules are this item's own diff

Unlike `tsk-1lv-3`/`tsk-1lv-4` (where every matched module was inherited
from an earlier sibling), `bin/fgos.mjs` is genuinely part of THIS item's
own commit (the `retrospective` case wiring) — confirmed by
`git show --stat a670be68`. `src/runner/merge.mjs` and `src/state/
store.mjs` are still inherited from `tsk-1lv-1`/`tsk-1lv-2`; their own
proof is in `docs/history/tsk-1lv-1/iron-law-evidence.md` and
`docs/history/tsk-1lv-2/iron-law-evidence.md` (same `tsk-28o` precedent
the two prior siblings' own evidence already cites — not re-derived
here).

## Verify command

```
node --test test/state/retrospective-doors.test.mjs
```

## Failing-before / passing-after transcript (this item's own diff: bin/fgos.mjs)

**Before** (real transcript: checked out the pre-change `bin/fgos.mjs`
from the parent commit, with the new `src/state/retrospective-doors.mjs`
and its test file already present):

```
$ git checkout HEAD~1 -- bin/fgos.mjs
$ node --test test/state/retrospective-doors.test.mjs

ℹ tests 16
ℹ pass 15
ℹ fail 1

✖ CLI: retrospective logs advisory friction for a freshness-door gap but still transitions the item
```

(The 15 passing tests include all 12 pure door-function unit tests —
unaffected by `bin/fgos.mjs`'s own pre-change state, since they call
`src/state/retrospective-doors.mjs`'s exports directly, never the CLI —
plus the "clean item" CLI test, which incidentally still passes against
the pre-change `retrospective` case too: a clean item produces no
`doorFindings` either way, so it does not distinguish old from new
behavior. Only the "freshness gap" CLI test genuinely exercises the new
wiring, and it is the one that fails, exactly as expected: the
pre-change `retrospective` case never calls `runFourDoorChecks` at all.)

**After** (real transcript, restoring the post-change file and
re-running the identical command):

```
$ git checkout HEAD -- bin/fgos.mjs
$ node --test test/state/retrospective-doors.test.mjs

ℹ tests 16
ℹ pass 16
ℹ fail 0
```

## Real bug found and fixed during implementation (not scope creep)

The `doc-deferral` door's own regex originally wrapped the Vietnamese
phrases in `\b` word-boundary anchors (`/\b(để sau|...)\b/i`). JS regex
`\b` only recognizes ASCII `[A-Za-z0-9_]` as "word" characters — a
position immediately before "để"'s leading "đ" (a non-ASCII diacritic)
reads as non-word on BOTH sides (the preceding space and the "đ" itself),
so `\b` never actually matched there. Caught directly by running the
test against the real implementation (not assumed): the very first
"flags deferred-to-later prose" test failed with 0 findings instead of
1. Fixed by dropping the `\b` anchors specifically around the two
Vietnamese phrases, keeping them for the ASCII ones (`TODO`, `for
later`, etc.) where the boundary behaves correctly.
