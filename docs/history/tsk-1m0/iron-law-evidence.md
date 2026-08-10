# Iron Law evidence — tsk-1m0

`classifyIronLaw` against the real `trunk...branch` committed diff
(`changedFiles(root, item)` at commit `70a88ff`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Test command: `node --test test/setup/checks.test.mjs` (the item's own
`verify`).

## Failing-before

The new tests, run with `--test-name-pattern="enduser-docs-index-stale"`
against `src/setup/registrations.mjs` reverted to its pre-implementation
content (`git show HEAD~1:src/setup/registrations.mjs`, i.e. before this
item's `feat(tsk-1m0)` commit), while keeping the new test file:

```
test at test/setup/checks.test.mjs:158:1
✖ enduser-docs-index-stale passes when docs/enduser-docs-index.json does not exist yet (0.4ms)
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing "enduser-docs-index-stale"
      at checkById (test/setup/checks.test.mjs:39:10)

test at test/setup/checks.test.mjs:236:1
✖ enduser-docs-index-stale fix regenerates the index via the same path fgos docs-index uses, resolving the drift (0.4ms)
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing "enduser-docs-index-stale"

test at test/setup/checks.test.mjs:252:1
✖ enduser-docs-index-stale fix is idempotent -- a second run reports changed:false (0.5ms)
  AssertionError [ERR_ASSERTION]: FIX_REGISTRATIONS is missing "enduser-docs-index-stale"
```

All 7 new tests (`checkById`/`fixById` lookups for `enduser-docs-index-stale`,
plus the `DOCTOR_CHECKS has exactly...` full-registry-list assertion) failed
the same way — the check/fix simply did not exist yet.

## Passing-after

Same command, same test file, `registrations.mjs` restored to this item's
real implementation (current HEAD):

```
✔ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus main-checkout-hook-wired, tool-registry-configured, config-awareness, dependencies-installed, gate-bypass-configured, root-drift, claude-plugin-marketplace, plugin-skill-cli-reachable, changelog-unreleased-stale, and enduser-docs-index-stale (3.170828ms)
✔ enduser-docs-index-stale passes when docs/enduser-docs-index.json does not exist yet (7.522152ms)
✔ enduser-docs-index-stale fails and reports a count (not a path list) when a doc on disk is missing from the index (6.576521ms)
✔ enduser-docs-index-stale passes when the index already covers every on-disk doc (4.220023ms)
✔ enduser-docs-index-stale counts a doc under docs/decisions toward the explanation quadrant (alias, D6) (4.725603ms)
✔ enduser-docs-index-stale fix regenerates the index via the same path fgos docs-index uses, resolving the drift (11.36996ms)
✔ enduser-docs-index-stale fix is idempotent -- a second run reports changed:false (6.341212ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Full `node --test test/setup/checks.test.mjs` (all 66 tests in the file,
unfiltered): `pass 66`, `fail 0`. The broader suites exercising the
refactored `docs-index` path also confirmed clean: `test/report/
enduser-index.test.mjs` (18/18 pass), `test/cli/fgos.test.mjs` (576/576
pass), `test/cli/fgos-manifest.test.mjs` (11/11 pass, including the
`docs-index registry flags` assertion).
