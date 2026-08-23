# Iron Law evidence — tsk-3ik-2

## Classification

Result: `{"required":true,"matchedModules":["src/runner/dispatch.mjs"]}`

Same false-positive shape as `docs/history/tsk-3ik-4/iron-law-evidence.md`:
this item's branch forked from `fgw/tsk-3ik`'s tip after `tsk-3ik-1`
(a real `src/runner/dispatch.mjs` change) had already merged into it, and
`main` has not yet absorbed `fgw/tsk-3ik`. `changedFiles` diffs against
`main`, so it still shows that already-delivered sibling's file, not
anything this item's own commit touches.

This item's own commit adds exactly one file:

```
docs/history/tsk-3ik-2/CONTEXT.md
```

No code, no test change — closed pass-through per the human answer
recorded on the item (`fgos answer tsk-3ik-2`).

## No failing-test-first story applies

This item makes no code change — nothing to demonstrate red-before-green
against. Same shape `docs/history/tsk-3ik-4/iron-law-evidence.md` already
established for a doc-only, pass-through diff.

## Item's own verify command

```
node --test test/intake/discovery.test.mjs test/intake/plan.test.mjs
```

```
ℹ tests 152
ℹ pass 152
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Unaffected by this item's diff — expected, since no code was touched.
