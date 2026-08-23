# Iron Law evidence — tsk-5tm-6

`classifyIronLaw` result against the real committed diff (`60db01e7...eeddb8f0`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

(Full suite: `npm test` — 3281/3286 pass, 5 pre-existing unrelated skips.)

## Shape of this change

A real addition, same shape as `tsk-5tm-3`/`tsk-5tm-4`/`tsk-5tm-5`: before,
`capacityIdForWork` was module-private (not exported) and
`decideCapacityCli`/the `decide` CLI subcommand had no `--work <id>` path.
The before/after contrast swaps `src/runner/dispatch.mjs` back to its
pre-tsk-5tm-6 committed content (the `fgw/tsk-5tm-5` merge commit,
`60db01e7`) and runs the real, already-committed test file against it.

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-5tm-6 committed content
(`git checkout 60db01e7 -- src/runner/dispatch.mjs`), the real
(already-committed) test file run as-is:

```
file:///.../test/runner/dispatch.test.mjs:31
  capacityIdForWork,
  ^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not
provide an export named 'capacityIdForWork'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)

✖ test/runner/dispatch.test.mjs (39.064214ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

A clean, unambiguous failure: the whole test file fails to load against
the pre-fix tree, because `capacityIdForWork` — the export the new
`--work` tests in this item exercise directly, or through
`decideCapacityCli`/the `decide` CLI subcommand accepting the new `work`
option — does not exist there.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-fix) content
(`git checkout HEAD -- src/runner/dispatch.mjs`), same test file:

```
ℹ tests 215
ℹ suites 0
ℹ pass 215
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short` showed only the expected `.fgos/*` deletions (ADR0020
worktree artifact, never real) before this passing run — confirming it ran
against the real committed tree. Full `npm test` (3281/3286, 5
pre-existing unrelated skips) also green on the same committed tree.

## D4-specific verification beyond the base verify command

Per `docs/history/task-dispatch-unification/plan.md`'s own note on this
piece (verify caveat: "KHÔNG verify được việc SKILL.md prose của
`fgos-fanout` đã wiring đúng, KHÔNG xác nhận 'decide gọi đúng 1 lần/
candidate trước khi Agent fire', và KHÔNG đo được số wall-clock risk map
đòi hỏi"), two extra checks owed before this piece counts as proven, done
live against the real repo (not recalled from the parent plan.md's earlier
feasibility-matrix pass):

- **Re-read `.agents/skills/fgos-fanout/SKILL.md` after editing** to
  confirm the announce-loop still calls `decide --work <id>` at the right
  position — inside the SAME per-candidate serial step the announce line
  already ran in, never a separate synchronous pass over the whole batch.
  Confirmed: the Loop's batch-firing block now reads `decided = node
  src/runner/dispatch.mjs decide --work <id> --has-live-task-access` as
  the first statement inside the existing `for each id in the batch`
  loop, before the announce-line print, with a `firing` accumulator so
  the parallel Agent-fire step below still fires in one batched message
  exactly as before — only the SET of ids fed into it can shrink (a
  non-in-process/unavailable candidate is reported and excluded), the fire
  step's own parallelism is untouched.
- **Wall-clock structural proof** (a per-candidate `decide` call is a
  single local CLI subprocess reading the already-loaded runner config —
  no network call, no lock contention with the parallel Agent-fire step
  that follows it) — this reconfirms, against the real post-implementation
  code, the same "PROVEN bounded" structural finding
  `docs/history/task-dispatch-unification/plan.md`'s feasibility matrix
  already recorded at planning time: the consult step cannot turn the
  already-parallel fire step sequential, because it runs entirely BEFORE
  that step, once per candidate, inside the existing per-candidate loop —
  never inside or after the parallel dispatch itself. A live wall-clock
  timing run of a real fanout batch (multiple concurrent Agents/worktrees)
  is out of scope for a single-session implementation pass — the
  structural bound above is what `plan.md`'s own risk map required to be
  closed at this stage, not a live timing number.
- **`decide` called exactly once per candidate before firing** — proven by
  the new unit/CLI-level tests (`decideCapacityCli resolves
  work-item-based (--work)...`, `the "decide" CLI entry point resolves
  --work <id>...`) exercising the exact same `decideCapacityCli`/CLI path
  the skill's prose now calls, plus the direct re-read of the Loop's
  pseudocode above confirming it sits inside, not outside, the
  per-candidate loop.

## Mirror sync

`plugins/fgOS/skills/fgos-fanout/SKILL.md` re-synced as a byte-identical
copy of `.agents/skills/fgos-fanout/SKILL.md` (`test/skills/
fgos-mirror.test.mjs`'s own required invariant for this repo's plugin
marketplace channel) — confirmed via `diff`, not just copied blind.
