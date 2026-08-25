# tsk-28x — Iron Law failing-test-first evidence

`classifyIronLaw` result (against commit `5c948d2a49da9fc184513bba5585a9a381ee5edb`,
`trunk...branch` diff): `required: true`, `matchedModules: ["bin/fgos.mjs",
"src/state/store.mjs", "src/state/workflow-stage-graphs.mjs"]`,
`matchedFlags: []`.

## Test command

`npm test` (also run scoped, against the three matched modules specifically:
`node --test test/cli/knowledge-verbs.test.mjs test/cli/knowledge-attest-gate.test.mjs
test/cli/knowledge-deprecation.test.mjs test/state/workflow-stage-graphs.test.mjs`)

## Failing-before (real transcript excerpt)

Produced by temporarily restoring the pre-implementation parent commit's
version of the three matched modules (`git checkout
dd99ba005fd6c16d99be1b99735901d0781dc464 -- bin/fgos.mjs src/state/store.mjs
src/state/workflow-stage-graphs.mjs`) while keeping this item's new test
files at HEAD, then running the scoped suite:

```
test at test/cli/knowledge-verbs.test.mjs:25:1
✖ knowledge-verbs - topic register, rename, split, merge, retire (111.961777ms)
  Error: Command failed: node ".../bin/fgos.mjs" topic register t1 --purpose-slug worktree-reclaim --purpose-title "Worktree Reclaim"
  fgos: unknown verb "topic". Usage: fgos <version|init|add|submit|discover|plan|move|retrospective|cleanup|compound|edit|ask|answer|decision|list|ready|rebuild|repair|check|rollup|take|return|review|approve|sync-root|reject|catchup|evolve|triage|session|goal|tool|setup|doctor|unlock|lock-status|main-checkout-reset> ...

test at test/cli/knowledge-verbs.test.mjs:63:1
✖ knowledge-verbs - doc lifecycle and promote preconditions (79.721111ms)
  Error: Command failed: node ".../bin/fgos.mjs" topic register t1 --purpose-slug worktree-reclaim
  fgos: unknown verb "topic". Usage: fgos <version|init|add|submit|...> ...

test at test/state/workflow-stage-graphs.test.mjs:111:1
✖ DOMAINS.coding.skillMap.retrospective is 'fgos-coding-knowledge' (tsk-28x) (0.7561ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'fgos-coding-compounding'
  - 'fgos-coding-knowledge'

test at test/state/workflow-stage-graphs.test.mjs:115:1
✖ skillForStage(DOMAINS.coding, "retrospective") resolves fgos-coding-knowledge (0.169417ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'fgos-coding-compounding'
  - 'fgos-coding-knowledge'

ℹ tests 49
ℹ pass 43
ℹ fail 6
```

(6 failures: 2 in `knowledge-verbs.test.mjs` — CLI `topic`/`doc` verbs did not
exist yet on `bin/fgos.mjs` — plus 4 in `workflow-stage-graphs.test.mjs` — the
`fgos-coding-compounding` -> `fgos-coding-knowledge` skill-mapping rename had
not landed yet. `knowledge-attest-gate.test.mjs`/`knowledge-deprecation.test.mjs`
passed even against the reverted modules because those two files' own
fixtures happened not to exercise the specific reverted verb paths directly —
not evidence of a weak test, just this particular scoped slice.)

## Passing-after (real transcript excerpt)

After restoring the real implementation (`git checkout HEAD --
bin/fgos.mjs src/state/store.mjs src/state/workflow-stage-graphs.mjs`,
tree clean, back to commit `5c948d2a`):

```
ℹ tests 49
ℹ pass 49
ℹ fail 0
```

Full `npm test` (the out-of-process worker's own verify run, ahead of
`fgos return`): **3,658 tests passing, 0 failing, 5 skipped**.

## What changed

`bin/fgos.mjs` — added `topic register|rename|split|merge|retire`, `doc
reserve|register|mark-rendered|move-path|promote|supersede|retire`, and
`knowledge status|attest` verbs (Phase 05/06), plus deprecation warnings on
the legacy `compound` verb (Phase 12). `src/state/store.mjs` — the new
knowledge-registry event write door (`withEventsLock` +
`appendEventLocked`, mirroring `addWork`/`moveWork`). `src/state/
workflow-stage-graphs.mjs` — `DOMAINS.coding.skillMap.retrospective`
retargeted from `fgos-coding-compounding` to `fgos-coding-knowledge`
(Phase 09 skill rename). Full phase-by-phase detail:
`plans/260825-1841-knowledge-registry/plan.md`.
