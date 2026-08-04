# Iron Law evidence — tsk-3id

## Classification (from `approve`'s own refusal, `classifyIronLaw` at merge time)

```
required: true
matchedFlags: []
matchedModules: [
  src/evolve/iron-law.mjs,
  src/runner/anti-loop.mjs,
  src/runner/loop.mjs,
  src/state/store.mjs,
  src/state/workflow-stage-graphs.mjs
]
```

This is a genuine trip, not a false positive: this item's own diff edits
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — the self-modification rule list
Iron Law itself is built from — retargeting its `src/state/fsm.mjs` literal
to `src/state/status-fsm.mjs` after the rename. A diff that touches the
gate's own rule list is exactly the shape Iron Law exists to catch.

## Nature of the fix

Pure rename + stale-comment cleanup (`docs/history/tsk-3id-status-fsm-
stage-fsm-rename/plan.md`) — no behavior bug being reproduced. The
failing-test-first proof here is the test/implementation co-evolution
pair: `test/evolve/iron-law.test.mjs`'s fixtures (updated in this same
commit to assert the new path) fail against the pre-rename rule list, and
pass against the post-rename one.

## Failing-test-first proof

**Before** — post-rename `test/evolve/iron-law.test.mjs` fixtures
(asserting `'src/state/status-fsm.mjs'`) run against the **pre-rename**
`src/evolve/iron-law.mjs` (`git show HEAD~1:src/evolve/iron-law.mjs`,
`MODULE_RULES` still lists `'src/state/fsm.mjs'`):

```
$ node --test test/evolve/iron-law.test.mjs

✖ classifyIronLaw trips required for every self-modifying module path via filesChanged
  AssertionError [ERR_ASSERTION]: path "src/state/status-fsm.mjs" should trip required
  ... expected: true, actual: false ...

✖ classifyIronLaw lists every matching filesChanged entry in matchedModules
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    [
      'src/runner/loop.mjs',
  -   'src/state/status-fsm.mjs'
    ]
```

**After** — same test file, this item's actual (post-rename)
`src/evolve/iron-law.mjs` restored:

```
$ node --test test/evolve/iron-law.test.mjs

ℹ tests 19
ℹ pass 19
ℹ fail 0
```

Full suite (`npm test`, the item's own recorded verify command) also
passed clean beforehand: 2456 pass, 0 fail (see `fgos return tsk-3id`
output, `passed: true`).

## Why no fix, just a rename

`src/evolve/iron-law.mjs`'s own logic (`classifyIronLaw`, `MODULE_RULES`
matching, `HEAVY_KEYWORDS` flagging) is untouched — only the literal path
string it matches against moved, in lockstep with the file it names. No
new behavior, no weakened rule: the same file (now `status-fsm.mjs`) is
still covered, byte-for-byte the same protection, just under its current
name.
