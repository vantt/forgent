# Plan mode: cell selection, cell-status table, closeout

Loaded only when Step 0's Mode Selection resolved plan mode (an imperative
run/resume/execute verb targeting a plan/phase path or a uniquely resolvable
track). Everything below is additive to `SKILL.md`'s own Steps 0-4, which
still govern each individual cell's open/fix/close/worktree mechanics
unchanged -- this file only adds the track-level layer sitting above them:
which cell to open next, and what to record once one closes.

## Cell naming

Plan-mode cells use `<track>--<cell-id>` (never the single-cell mode's own
`code-change--<slug>` prefix), matching the track's own existing cells so
`fgos coordination chain <track>` groups them correctly.

## Track-level resume: `fgos coordination chain <track> --json`

Query cold, with zero prior chat context:
```sh
fgos coordination chain <track> --json
```
Returns `{track, cells, activeCell, nextAction}`. Classify the durable state
as one of:

- **active cell** -- an existing session for the current/next cell is active
  or has an authorized fix/recheck round. Resume that same cell (SKILL.md
  Steps 2-4). Do not open a new cell.
- **terminal cell not integrated** -- the session is completed/closed but the
  plan row or Git merge evidence does not yet show the cell integrated.
  Delegate close/integration follow-through for that cell, not the next
  phase.
- **merged cell with stale session evidence** -- Git/plan evidence says the
  cell landed, but the session log is stale or not terminal. Reconcile
  through coordination recovery; never hand-edit JSONL/state to make the row
  look closed.
- **no open cell** -- select the lowest phase in `plan.md` lacking a
  `merged` entry as the next cell (SKILL.md Step 1).
- **completed track** -- every phase row is merged/closed; report complete
  and do not open a new session.

Legacy plans remain valid: a phase file with no declared test-policy
metadata composes its Test-Selection Block (`../_shared/coding-cell-policy.md`
§2) from its `## Verification` block, repo evidence, and the mechanical
`FULL_TRIGGERS` list -- missing metadata is never a migration gate.

Phase-path target interaction: when a request names a specific phase as
execution target, verify it against `chain`'s own next unmerged cell; refuse
(never silently override) if the named phase mismatches what `chain` would
open next.

## After a cell closes

1. Merge and post-merge-verify per `../_shared/coding-cell-policy.md` §5
   (SKILL.md Step 4).
2. Append one row to `plan.md`'s cell-status table recording the cell,
   `testedSha`, `integratedSha`, and outcome.
3. Record the cell trace at `docs/architect/agent-coordination/verification/<track>/<cell>.md`
   or `plans/<track>/reports/`.

## Unattended track mode: run every cell to the end

When executing a full multi-cell track unattended:

0. **Baseline:** run the track's full proof command once before cell work
   begins. Record baseline failures in `plan.md`'s Execution Inputs. Known
   failures may shrink, never grow.
1. **Track Iteration:** loop until every phase in `plan.md` is `merged`:
   query `fgos coordination chain <track> --json`; resume the active cell or
   select the lowest unmerged phase (above); run that cell through
   SKILL.md's Steps 0-4 in full, including the fix-round cap and explicit
   close; merge, post-merge-verify, and record the cell-status row and
   trace (above).
2. **Track Completion:** write `plans/<track>/reports/track-closeout.md`
   summarizing every merged cell, its commits, and its verified evidence.
