# Iron Law evidence: tsk-38t-2

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff returned `required: true` — `matchedModules: ["src/state/store.mjs",
"src/state/workflow-stage-graphs.mjs"]` (both on `MODULE_RULES`'
self-modifying-capable list), `matchedFlags: []` (no description-text
keyword hit).

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/state/store.mjs", "src/state/workflow-stage-graphs.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test test/state/status-category.test.mjs` (part of
`npm test`).

**Before the fix** — reverted `src/state/work.mjs`,
`src/state/workflow-stage-graphs.mjs`, `src/state/store.mjs`,
`src/state/replay.mjs` to their pre-`tsk-38t-2` state (`git checkout
HEAD~1 --`) while keeping the new test file, then ran it. Real transcript:

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-38t-2-t0ejyl/test/state/status-category.test.mjs:22
import { STATUS_CATEGORIES } from '../../src/state/work.mjs';
         ^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/state/work.mjs' does not provide an export named 'STATUS_CATEGORIES'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/state/status-category.test.mjs (37.352787ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
```

**After the fix** — restored the four files (`git checkout HEAD --`), same
test file, real transcript:

```
✔ STATUS_CATEGORIES is exported, frozen, and contains exactly the six pinned category names (1.021637ms)
✔ moveWork to front-segment status "doing" writes statusCategory "in-progress" on the event payload and the folded item (2.770405ms)
✔ moveWork to front-segment status "blocked" writes statusCategory "in-progress" on the event payload and the folded item (0.681172ms)
✔ moveWork to front-segment status "awaiting-human" writes statusCategory "in-progress" on the event payload and the folded item (0.55399ms)
✔ moveWork to front-segment status "awaiting-approval" writes statusCategory "review" on the event payload and the folded item (0.735104ms)
✔ moveWork to front-segment status "wontfix" writes statusCategory "canceled" on the event payload and the folded item (0.558906ms)
✔ moveWork to front-segment status "todo" writes statusCategory "todo" on the event payload and the folded item (0.64455ms)
✔ moveWork into the four tail-segment statuses never writes statusCategory on the event payload (1.35518ms)
✔ a stale statusCategory from the last front-segment move survives (uncleared) into the tail chain (0.665123ms)
✔ addWork stamps statusCategory for the initial status ("todo" -> "todo") on both the event payload and the folded item (0.465768ms)
✔ foldEvents replays a pre-statusCategory work.add + work.move without throwing and without inventing a category (0.15611ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
```

Full suite after the fix (`npm test`, the item's own recorded `verify`
run in full, prior to this evidence step): **2484 tests, 2479 pass, 0
fail, 0 cancelled, 5 skip** (the 5 skips pre-exist this item, unrelated;
run twice independently — once in the implementing agent's own worktree,
once again here after `fgos pick` — both identical).

## Why the proof was captured after implementation, not via a literal red-green session

The implementation and its own test file were written together by an
unattended subagent (per this item's own task instructions), not through
a live TDD red/green loop typed by a person. The evidence above
reconstructs the equivalent proof mechanically and honestly: reverting
only the four implementation files (not the test file) and re-running
proves the new tests are not tautological or vacuously passing — they
fail for the real reason (`STATUS_CATEGORIES` genuinely does not exist
without the fix), and pass for the real reason once it does. This is the
same class of evidence the Iron Law asks for — a test that actually
distinguishes "before" from "after" — captured via revert-and-rerun
instead of a literal chronological red-then-green session.
