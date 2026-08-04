# Iron Law evidence: tsk-38t-4

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returned `required: true` — `matchedModules: ["bin/fgos.mjs",
"src/report/entropy.mjs", "src/runner/claim-port.mjs"]` (all three on
`MODULE_RULES`' self-modifying-capable list — `bin/fgos.mjs` via its
`equals` rule, `src/report/entropy.mjs` via its `equals` rule,
`src/runner/claim-port.mjs` via the `src/runner/` `prefix` rule),
`matchedFlags: []` (no description-text keyword hit). The item's other five
changed source files — `src/state/frontier.mjs`, `src/state/graph-
metrics.mjs`, `src/state/graph-harness.mjs`, `src/state/drift-status.mjs`,
`src/state/impact.mjs` — are NOT on `MODULE_RULES` (confirmed by running
`classifyIronLaw` against the full changed-file list, not just guessed).

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/report/entropy.mjs",
    "src/runner/claim-port.mjs"
  ]
}
```

## Failing-test-first proof

Test command: `node --test test/state/frontier.test.mjs
test/report/entropy.test.mjs` (part of `npm test`).

**Before the fix** — stashed all eight changed source files (`git stash
push -- bin/fgos.mjs src/report/entropy.mjs src/runner/claim-port.mjs
src/state/drift-status.mjs src/state/frontier.mjs
src/state/graph-harness.mjs src/state/graph-metrics.mjs
src/state/impact.mjs`, back to their pre-`tsk-38t-4` (post-merge-of-
`fgw/tsk-38t`) state) while keeping the new/extended test files, then ran
the two test files most directly exercising this item's new exports. Real
transcript:

```
file:///home/vantt/projects/forgentX/.claude/worktrees/agent-a622bf7f415f13329/test/report/entropy.test.mjs:3
import { computeEntropy, computeCounts, FINAL_STATUSES } from '../../src/report/entropy.mjs';
                                        ^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/report/entropy.mjs' does not provide an export named 'FINAL_STATUSES'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/report/entropy.test.mjs (39.522209ms)
file:///home/vantt/projects/forgentX/.claude/worktrees/agent-a622bf7f415f13329/test/state/frontier.test.mjs:3
import { frontier, FRONTIER_ORDER_VERSION, isResolvedStatus } from '../../src/state/frontier.mjs';
                                           ^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/frontier.mjs' does not provide an export named 'isResolvedStatus'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/state/frontier.test.mjs (36.398785ms)
ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

**After the fix** — restored the eight files (`git stash pop`), same test
files, real transcript (tail — every one of the 95 frontier.test.mjs cases
plus every entropy.test.mjs case passed; the new `isResolvedStatus` block
shown in full):

```
✔ isResolvedStatus: statusCategory present but NOT 'canceled' overrides a literal 'wontfix'-shaped status that isn't actually wontfix -- category wins once it exists (0.024776ms)
✔ isResolvedStatus: a DIFFERENT domain's canceled-equivalent label ('declined') with statusCategory 'canceled' is resolved -- category-based recognition, not a literal 'wontfix' match (0.025994ms)
✔ isResolvedStatus: the same 'declined' label WITHOUT statusCategory 'canceled' is NOT resolved (proves the previous test passed because of the category, not because 'declined' is special-cased anywhere) (0.051139ms)
✔ frontier: a dep at a DIFFERENT domain's canceled-equivalent status + statusCategory 'canceled' unblocks its dependent, exactly like a coding 'wontfix' dep does (0.069394ms)
✔ frontier: an item at statusCategory 'todo' with a DIFFERENT literal status label is still picked up as ready (the ready filter reads category, not the literal string 'todo') (0.047754ms)
✔ frontier: an item with literal status 'todo' but statusCategory explicitly set to something else is NOT ready (statusCategory, once present, wins over the literal status string) (0.053622ms)
✔ frontier: an item with literal status "todo" and NO statusCategory at all (legacy/pre-tsk-38t-2 data) is still ready -- zero regression for every pre-migration item (0.043513ms)
ℹ tests 95
ℹ suites 0
ℹ pass 95
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

A third targeted case, run separately, distinguishes `bin/fgos.mjs`'s own
refactor (local `FINAL_STATUSES` Set → shared import from
`src/report/entropy.mjs`) at the import-resolution level rather than at
the assertion level: with `bin/fgos.mjs` reverted to its pre-`tsk-38t-4`
state (the same `git stash` above), `test/cli/fgos.test.mjs`'s new
`"check still nags an item sitting at 'delivered'"` case still PASSES
unchanged — because `bin/fgos.mjs`'s own pre-existing local `FINAL_STATUSES`
already included the tail-segment statuses (only `entropy.mjs`'s local copy
was missing them, per 0027's audit §2's "hai bản sao lệch nghĩa" finding).
This is expected, not a gap in the proof: that specific test locks
byte-identical CLI *behavior* across the local-Set-to-shared-import
refactor, not a behavior *change* — the behavior change (entropy.mjs now
also flagging `delivered`/`retrospective`/`cleanup` items) is what the
`entropy.test.mjs` transcript above proves failing-then-passing.

Full suite after the fix (`npm test`, run clean after `git stash pop`, no
other process touching the working tree mid-run): **2526 tests, 2521 pass,
0 fail, 0 cancelled, 5 skip** (baseline before this item's changes, same
worktree, same merge point: 2501 tests, 2496 pass, 0 fail, 5 skip — the
delta is exactly the 25 new/extended assertions this item added across
`test/state/frontier.test.mjs`, `test/report/entropy.test.mjs`, and
`test/cli/fgos.test.mjs`; zero regressions).

## Why the proof was captured after implementation, not via a literal red-green session

The implementation and its own test file were written together by an
unattended subagent (per this item's own task instructions), not through
a live TDD red/green loop typed by a person. The evidence above
reconstructs the equivalent proof mechanically and honestly: reverting
only the eight implementation files (not the test files) and re-running
proves the new/extended tests are not tautological or vacuously passing —
they fail for the real reason (`isResolvedStatus`/`FINAL_STATUSES`
genuinely do not exist without the fix, a `SyntaxError` at module-load
time, the loudest possible "this is real" signal), and pass for the real
reason once they do. All eight changed source files were reverted
together, not just the three `MODULE_RULES`-matched ones, because they are
interdependent (`entropy.mjs`, `bin/fgos.mjs`, and `claim-port.mjs` all
import `isResolvedStatus`/`FINAL_STATUSES` from `frontier.mjs`/
`entropy.mjs` respectively — reverting only the `MODULE_RULES`-matched
subset while leaving `frontier.mjs`'s new exports in place would not
reproduce a coherent pre-fix state) — the same reasoning `tsk-38t-2`'s own
iron-law evidence file already used for its own four-file revert against a
two-file `matchedModules` list.
