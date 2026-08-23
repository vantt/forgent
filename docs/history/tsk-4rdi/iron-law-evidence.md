# tsk-4rdi — Iron Law evidence

Item: `tsk-4rdi` — "Add --backlog flag to fgos submit to create items
directly at backlog status" (Piece 2 of `work-item-backlog-status`).

## Classification

`classifyIronLaw` against the real committed `trunk...fgw/tsk-4rdi` diff
(`changedFiles`, `src/runner/merge.mjs` — the same file set the merge-time
gate itself computes):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/state/status-fsm.mjs","src/state/workflow-stage-graphs.mjs"]}
```

- **`bin/fgos.mjs`** — this item's own change, the sole file it edits for
  behavior.
- **`src/state/status-fsm.mjs`, `src/state/workflow-stage-graphs.mjs`** —
  NOT touched by this item. They arrive in the diff because `fgw/tsk-4rdi`
  forks from `fgw/tsk-5wr` with `tsk-5vs` (Piece 1, the schema core) already
  merged in; `changedFiles` diffs against trunk, so Piece 1's files are
  still in this branch's range. Their own proof lives in
  `docs/history/tsk-5vs/iron-law-evidence.md`, which is itself present in
  the same file list above. This item neither re-proves nor re-opens them.

No `matchedFlags`: the item's description trips no heavy risk keyword.

## Verify command

The item's own recorded `verify`, run exactly as recorded:

```
npm test
```

Full suite result after the change:

```
ℹ tests 3142
ℹ suites 0
ℹ pass 3137
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 73203.43509
```

## Failing-test-first proof

The new regression test is
`test/cli/fgos-intake.test.mjs` — "submit --backlog creates the item at
status:"backlog" with its own category and out of ready; a flagless submit
still creates status:"todo"".

**Failing before** the `bin/fgos.mjs` change. Captured by restoring
`git show HEAD:bin/fgos.mjs` over the working copy, running the new test
against the unchanged implementation, then restoring the change:

```
$ node --test --test-name-pattern="backlog" test/cli/fgos-intake.test.mjs
✖ submit --backlog creates the item at status:"backlog" with its own category and out of ready; a flagless submit still creates status:"todo" (302.801665ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1

✖ failing tests:

test at test/cli/fgos-intake.test.mjs:836:1
✖ submit --backlog creates the item at status:"backlog" with its own category and out of ready; a flagless submit still creates status:"todo" (302.801665ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  'todo' !== 'backlog'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4rdi-q0n1Et/test/cli/fgos-intake.test.mjs:848:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'todo',
    expected: 'backlog',
    operator: 'strictEqual',
    diff: 'simple'
```

The failure is the exact behavior this item changes: `submitWork`'s
hardcoded `status: 'todo'` literal ignoring the flag.

**Passing after** the change, same command:

```
$ node --test --test-name-pattern="backlog" test/cli/fgos-intake.test.mjs
✔ submit --backlog creates the item at status:"backlog" with its own category and out of ready; a flagless submit still creates status:"todo" (499.108742ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

## Regression guard on the unchanged default

`work-item-backlog-status` D2 is explicit that the default must NOT change.
The same test asserts both directions in one case: a `--backlog` submit
lands at `status: 'backlog'` with `statusCategory: 'backlog'`, while a
flagless submit in the same store still lands at `status: 'todo'`. It also
asserts the backlog item does not appear in `fgos ready`, which is D3's
statusCategory mechanism working with no frontier-side code change.

`evolve --submit` (`bin/fgos.mjs`, the only other `submitWork` caller)
passes no `opts` at all, so `opts.backlog` is `undefined` and its behavior
is byte-identical.

## Impact-analysis posture

**Degraded**, not `full` — and this differs from what
`docs/history/work-item-backlog-status/plan.md` recorded.

`fgos tool query --capability impact-analysis --status present` does report
`gitnexus` as `present`. But `present` never means the index is fresh, and
here it demonstrably is not: `impact({target: "submitWork", direction:
"upstream"})` returned `Target 'submitWork' not found` for a function that
exists at `bin/fgos.mjs:903`. `detect_changes` likewise saw only
`COMMAND_REGISTRY` and missed `submitWork` entirely, and the tooling itself
reported `GitNexus index is stale (last indexed: 79fead3)`.

Blast radius was therefore established by grep instead, and is complete for
this symbol: `submitWork` has exactly two call sites, `bin/fgos.mjs:1317`
(the `submit` case, which gains the flag) and `bin/fgos.mjs:4360`
(`evolve --submit`, which passes no opts). Both are in the one file this
item already edits.
