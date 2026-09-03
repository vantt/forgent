---
authoritative_for: dispatch fanout-batch verb, fgos schedule --candidates, consolidated out-of-process fanout wave loop
---

# The out-of-process fanout wave loop is now one verb, not spelled-out bash

`tsk-3av` closed a real duplication: `fgos-fanout`'s own
`wave-dispatch-mechanics.md` used to spell the out-of-process dispatch
chain (claim → execute → return) plus slot-checking/batch-trimming as
several bash steps a skill had to author itself, every time it drove a
wave. That shape had already drifted once (the reference doc still showed
`JSON.parse(process.argv[1]).worktreePath`, a field shape that never
existed in the real `fgos.v1` envelope) — proof that hand-spelled bash goes
stale silently.

## What shipped

Two new real verbs replace the spelled-out bash:

- **`dispatch.mjs fanout-batch <id,id,...>`**
  (`fanoutBatchExecutorCli`, `src/runner/dispatch/cli.mjs`) — for each
  candidate id, resolves its executor/mechanism, and for every
  out-of-process one runs the full `pick → execute → return` chain via real
  subprocess calls to `bin/fgos.mjs`, returning `{fired, mechanismChanged,
  unavailable, deferred}`. Worker-slot room is checked once up front
  (`hasWorkerSlotRoom`) and the batch is trimmed to free slots, with the
  overflow reported back as `deferred` rather than silently dropped.
- **`fgos schedule --candidates <id1,id2,...>`** (`bin/fgos.mjs`) — scopes
  the existing schedule/poll-slot computation to a specific candidate set
  instead of the whole pool, so a caller that already knows which items it
  wants dispatched doesn't have to re-derive that from the full schedule.

`fgos-fanout`'s own `wave-dispatch-mechanics.md` (all three render targets
— `.agents/skills/`, `.claude/skills/`, `plugins/fgOS/skills/`) was
rewritten to call these two verbs instead of spelling the chain in bash.

## What did NOT get consolidated, and why

The in-process branch (firing a native `Agent` call) stays entirely inside
the skill. `dispatch.mjs` has no `Agent`/`Task` tool of its own — it cannot
invoke one — so that loop can never move into this module; only the
out-of-process branch (a real OS subprocess) was ever in scope.

## Three real bugs the first pass shipped, caught by driver review

None of these were caught by the implementer's own new tests — both
avoided the actual pick/execute/return happy path:

1. `--dir <fgosDir>` was passed to `bin/fgos.mjs pick`/`return` instead of
   the repo root. `dataDir()` always derives `.fgos` from `--dir` itself,
   so this doubled the suffix into a nonexistent `<root>/.fgos/.fgos` —
   every real dispatch would have failed.
2. The picked worktree path was read as `picked.worktreePath` /
   `picked.path` — a shape that never exists. Every `fgos.mjs` verb
   response is wrapped in the `fgos.v1` envelope; the real path is
   `picked.data.worktree.path`.
3. `bin/fgos.mjs`'s own path was resolved as `path.join(root, 'bin',
   'fgos.mjs')`, coupling it to the caller-supplied root instead of this
   module's own file location — broke against any root without a physical
   `bin/` sibling, including test fixtures. Fixed with `fileURLToPath(new
   URL('../../../bin/fgos.mjs', import.meta.url))`, the same "resolve
   against your own file location, never the caller's cwd or repo root"
   principle already used elsewhere in this repo (`gate-check`'s CLI
   wrapper).

The fix added one real end-to-end test: a fake executor that actually
commits inside the picked worktree, run through the real
`pick`/`execute`/`return` subprocess chain — the shape the original tests
never exercised — and independently re-reads `listWork` afterward rather
than trusting the function's own return value.

## A citation-discipline fix along the way

The first attempt at documenting the in-process-hazard boundary in
`fgos-fanout/SKILL.md` bare-cited a decision id ("D5") inside shippable
skill prose, tripping this repo's own decision-citation-drift check (rule
0017: inline the content, never the id, in shippable skill prose). It was
rewritten to state the boundary directly: out-of-process consolidation
never touches, fixes, or claims to improve the in-process `EnterWorktree`
hazard, since `dispatch.mjs` never participates in that branch beyond the
initial `decide` call.
