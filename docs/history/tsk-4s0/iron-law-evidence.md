# Iron Law evidence — tsk-4s0

`classifyIronLaw` against the real committed diff (`bin/fgos.mjs`,
`src/state/graph-harness.mjs`, `test/cli/fgos.test.mjs`,
`test/state/graph-harness.test.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is a gated module (the runner/core CLI) — this is a
self-modifying diff, so failing-test-first proof is required before it can
land.

## Test command

```
node --test --test-name-pattern="strandedByResolvedRoot|own root is delivered|own root is wontfix|resolved-root guard|resolved root is unaffected|resolved root" test/state/graph-harness.test.mjs test/cli/fgos.test.mjs
```

## Failing before (production code reverted to the parent commit,
`git checkout HEAD^ -- bin/fgos.mjs src/state/graph-harness.mjs`, test
files kept at their new HEAD state)

```
✖ approve of a leaf whose own root is delivered refuses, exit 4, item stays awaiting-approval, no merge attempted (612.306657ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:6711:10)

✖ approve of a leaf whose own root is wontfix ALSO refuses (D2 — wontfix blocks too, not just delivered/retrospective/cleanup/done) (546.932797ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:6726:10)

✖ approve --github --pr on a leaf whose own root is delivered ALSO refuses before any gh call (hoisted ahead of --github, same as the Iron Law gate), gh is never invoked (580.830674ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:6774:10)

test at test/state/graph-harness.test.mjs:255:1
✖ mergeReadiness: a candidate whose resolved root is wontfix is ALSO strandedByResolvedRoot (D2 — wontfix blocks too)
  AssertionError: actual: undefined, expected: [ 'leaf' ]

test at test/state/graph-harness.test.mjs:267:1
✖ mergeReadiness: a candidate whose root is open (not resolved) is unaffected, stays ready — strandedByResolvedRoot stays empty
  AssertionError: undefined !== []

test at test/state/graph-harness.test.mjs:279:1
✖ mergeReadiness: a root-to-main item (no parent) is never strandedByResolvedRoot even when its own status is resolved
  AssertionError: undefined !== []

test at test/state/graph-harness.test.mjs:288:1
✖ mergeReadiness: strandedByResolvedRoot resolves through a nested root chain (grandparent) via resolveRoot, not immediate parent
  AssertionError: actual: undefined, expected: [ 'leaf' ]

test at test/state/graph-harness.test.mjs:301:1
✖ mergeReadiness: strandedByResolvedRoot is rank-ordered same as ready/blockedOnSync, not raw candidate-iteration order
  AssertionError: actual: undefined, expected: [ 'mvpLeaf', 'plainLeaf' ]

test at test/state/graph-harness.test.mjs:593:1
✖ mergeTree: a strandedByResolvedRoot item shows status "stranded-resolved-root" with a reason citing the real root and its status (tsk-4s0)
  AssertionError [ERR_ASSERTION]: a strandedByResolvedRoot id must still get a node (D2 never-hide invariant)
```

Unaffected paths correctly stayed green on the reverted code (proving the
new tests are targeted, not universally broken): `approve of a leaf whose
own root is delivered succeeds with --acknowledge-drift`, `approve of a
leaf whose root is still open (not resolved) is unaffected`, `approve of a
root-to-main item (no parent) is unaffected`.

## Passing after (`git checkout HEAD -- bin/fgos.mjs
src/state/graph-harness.mjs`, real implementation restored)

```
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full suite (`npm test`) confirmed green separately: 2835 pass, 0 fail, 5
skipped (pre-existing, unrelated).
