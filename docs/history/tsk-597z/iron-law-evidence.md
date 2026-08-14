# Iron Law evidence: tsk-597z

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-commit, `9dfdb004`) returned `required: true` —
`matchedModules: ["bin/fgos.mjs"]` (a new verb, `recheck-blocked`, is
added to `bin/fgos.mjs`'s own dispatch switch), `matchedFlags: []`.

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Failing-test-first proof

Test command: `node --test --test-name-pattern="recheck-blocked" test/cli/fgos-read.test.mjs`
— the CLI-level tests proving this item's core claim: `fgos recheck-blocked`
exists, is a real read-only verb, and correctly separates a blocked item
whose recorded commit now resolves (`resolvable`) from one that genuinely
still doesn't (`stillBlocked`).

**Before the fix** (`bin/fgos.mjs`, `src/cli/command-registry.mjs`, and
`src/state/cleanup-harness.mjs` reverted to `32ad9e3f`, the commit
immediately before this item's implementation, with the new tests kept as
committed): all three tests fail — the verb does not exist yet, so `fgos
recheck-blocked` exits nonzero (unknown verb) and the harness never gets a
JSON envelope to parse:

```
✖ recheck-blocked verb on a store with nothing blocked: all-empty envelope, exit 0, pure read (no event) (230.914294ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  4 !== 0

✖ recheck-blocked verb: a blocked item whose recorded commit is (still) a real ancestor of HEAD is reported resolvable, never auto-transitioned (441.714068ms)
  SyntaxError: Unexpected end of JSON input
      at JSON.parse (<anonymous>)
      at envelopeData (test/cli/helpers/fgos-cli-harness.mjs:78:25)

✖ recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable (423.187327ms)
  SyntaxError: Unexpected end of JSON input
      at JSON.parse (<anonymous>)
      at envelopeData (test/cli/helpers/fgos-cli-harness.mjs:78:25)

ℹ tests 3
ℹ pass 0
ℹ fail 3
```

**After the fix** (all three files restored to their committed state,
`9dfdb004`): all three pass —

```
✔ recheck-blocked verb on a store with nothing blocked: all-empty envelope, exit 0, pure read (no event) (215.397588ms)
✔ recheck-blocked verb: a blocked item whose recorded commit is (still) a real ancestor of HEAD is reported resolvable, never auto-transitioned (497.866916ms)
✔ recheck-blocked verb: a blocked item whose recorded commit is no longer reachable (force-pushed away) is reported stillBlocked, never resolvable (447.510346ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

A fourth new test — `notApplicable`/`domain-not-worktree-backed`/
`no-recorded-commit` scoping — lives in `test/state/cleanup-harness.test.mjs`
as a direct unit test of `blockedItemsNowResolvable`, alongside the CLI
tests above; both files are part of the same committed diff.

Full suite (`npm test`) after the fix: 3245 pass, 0 fail, 5 skipped (up
from 43 new/changed assertions across `test/state/cleanup-harness.test.mjs`
and `test/cli/fgos-read.test.mjs` — no regressions).
