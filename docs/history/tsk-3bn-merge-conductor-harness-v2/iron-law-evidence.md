# Iron Law evidence: tsk-3bn

`classifyIronLaw` on this item's real diff (`fgw/tsk-3bn` vs `main`, computed
from the real main checkout, `changedFiles(repoRoot, item)`):

```json
{
  "required": true,
  "matchedFlags": ["mất dữ liệu"],
  "matchedModules": ["bin/fgos.mjs", "src/state/store.mjs"]
}
```

`matchedFlags` pulled "mất dữ liệu" (data loss) from this item's own
description text, which discusses that exact failure mode as its origin
incident context — not from anything genuinely destructive in the diff
itself. `matchedModules` are real: `bin/fgos.mjs` (new `sync-root` case,
close-out drift guard inside `approve`, `--merge-after` edit flag) and
`src/state/store.mjs` (`EDITABLE_FIELDS` gains `mergeAfter`) are both
touched, both gated core mechanism files.

## Honest gap: this was not failing-test-first development

Every capability in this diff (`driftStatus`, `fgos sync-root`, the
close-out guard, `mergeReadiness` v2's `mergeSets`/`blockedOnSync`/
`mergeTier`, the `mergeAfter`/`waits-for` edge) was implemented with its
tests written alongside it in the same pass, then verified green — not
proven red-before-green. This file does not claim otherwise; it records
the acknowledgment (`--acknowledge-iron-law`) as an explicit, informed
tradeoff the user accepted, not a substitute for the real practice.

## What was actually proven

Full suite, run from the real implementation branch, clean tree, immediately
before this evidence file was written:

```
$ npm test
...
ℹ tests 2237
ℹ suites 0
ℹ pass 2232
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(5 skips pre-exist this item's work, unrelated to it.)

Each of the 4 child items delivered its own dedicated new-capability
coverage, each independently returned with its own passing verify run
before this root's own `return`:

- `tsk-5m7`: `test/state/drift-status.test.mjs` (8 tests) + `fgos doctor`
  `root-drift` check tests in `test/setup/checks.test.mjs`.
- `tsk-50i`: 7 CLI-level `sync-root` tests in `test/cli/fgos.test.mjs`
  (happy path, nested target, conflict-abort, worktree guard, decision
  recording).
- `tsk-62y`: 4 CLI-level close-out-guard tests (block, `--acknowledge-drift`
  override, no-drift pass-through, regression on an ordinary item).
- `tsk-2u0`: 24 unit tests in `test/state/graph-harness.test.mjs`
  (mergeAfter waiting-gate, blockedOnSync, footprint-overlap/shared-root
  mergeSets, mergeTier) + mixed-cycle tests in `test/state/dep-graph.test.mjs`
  + field-validation tests in `test/state/work.test.mjs` + 6 CLI
  `--merge-after` tests in `test/cli/fgos.test.mjs`.

Accepted via `fgos approve tsk-3bn --acknowledge-iron-law` on this evidence.
