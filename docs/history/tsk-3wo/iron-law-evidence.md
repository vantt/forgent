# tsk-3wo — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs", "src/state/workflow-stage-graphs.mjs"]`, `matchedFlags: []`.

## Test command

`npm test`, plus scoped: `node --test test/state/cleanup-harness.test.mjs test/state/workflow-stage-graphs.test.mjs test/setup/checks.test.mjs test/setup/registrations.test.mjs test/cli/fgos.test.mjs test/architecture.test.mjs`

## Failing-before (real transcript excerpts)

`src/state/cleanup-harness.mjs` and its 17 tests did not exist before this item — the first `node --test test/state/cleanup-harness.test.mjs` run against the pre-item tree fails as "module not found", the canonical failing-first state for a brand-new module.

The two new CLI verbs (`retrospective`, `cleanup`) did not exist before this item either — `node --test test/cli/fgos.test.mjs` for the 6 tests added at the end of the file failed with `unknown verb "retrospective"` / `unknown verb "cleanup"` (exit 4) before `bin/fgos.mjs` gained the two `case` blocks.

Adding `src/state/cleanup-harness.mjs` without registering it in `docs/architecture-manifest.json` reproduced a real failing-before state on the full suite:

```
✖ đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một
✖ import một chiều xuống: không file nào import ngược lên tầng trên
ℹ tests 2138
ℹ pass 2131
ℹ fail 2
```

Adding the `cleanup` config default without updating `test/setup/checks.test.mjs`'s "every default key" fixture reproduced:

```
✖ config-not-stale passes when the existing config already has every default key
  actual: false, expected: true
```

## Passing-after (real transcript excerpt)

```
node --test test/state/cleanup-harness.test.mjs test/state/workflow-stage-graphs.test.mjs test/setup/checks.test.mjs test/setup/registrations.test.mjs test/cli/fgos.test.mjs test/architecture.test.mjs
ℹ tests 563
ℹ pass 563
ℹ fail 0
```

Full `npm test` after: `tests 2138 / pass 2133 / fail 0` (5 skipped, none failing).

## What changed

New `src/state/cleanup-harness.mjs` (`assessCleanupReadiness` + its three component checks) gating `cleanup -> done` (D8). `workflow-stage-graphs.mjs` gains a `worktreeBacked` field per domain (D5). Two new CLI verbs in `bin/fgos.mjs`: `retrospective` (D9 batch sweep) and `cleanup` (harness-gated finish, performs the actual branch cleanup + `done`/`blocked` transition). A global `cleanup.ttlDays` config default is registered via `registerConfigDefault` (D7). `docs/architecture-manifest.json` gains the new file's layer row.

**Deliberately NOT changed this item** (flagged as a follow-up, not silently dropped): `approve`'s existing synchronous `cleanupMergedBranch` calls in its merge paths — see the implementation commit message for why this was scoped out.
