# Iron Law evidence: tsk-qod

`classifyIronLaw` against the real committed diff (`trunk...branch`)
returned `required: true`, matched modules:

```
bin/fgos.mjs
src/runner/claim-port.mjs
src/runner/dispatch.mjs
src/runner/loop.mjs
src/runner/worktree.mjs
src/state/status-fsm.mjs
src/state/store.mjs
src/state/workflow-stage-graphs.mjs
```

## Test command

```
npm test
```
(`node --test 'test/**/*.test.mjs'`)

## Failing-before / passing-after

Retiring `clarify` as a stage (removed from `stages`/`skillMap`/`stepMap`
in `src/state/workflow-stage-graphs.mjs`; `discovery` becomes `stages[0]`,
the domain's new entry point) broke every test whose fixtures created an
item at `stage: 'clarify'` or asserted a `clarify`-sourced transition —
proof the engine's own runtime behavior actually changed, not just prose.
Real transcript excerpt, captured mid-session before the test suite was
updated to match:

```
test at test/intake/discovery.test.mjs:79:1
✖ resolveDiscovery with no callerVerdict, no locked CONTEXT.md, and role "runner" no-ops instead of spawning a subprocess judge (D16) (0.998354ms)
  Error [WorkValidationError]: work.stage must be one of ["discovery","exploring","decompose","planning","executing"] when present, got: "clarify"
      at validateWorkShape (file:///.../src/state/work.mjs:438:13)
      at validateWork (file:///.../src/state/work.mjs:787:3)
      at addWork (file:///.../src/state/store.mjs:180:10)
      at TestContext.<anonymous> (file:///.../test/intake/discovery.test.mjs:81:3)
    category: 'validation'
```

That one file alone: **30 tests, 5 pass, 25 fail** at that point in the
session. The full suite, once the registry change and the docs-index/
skill-prose sweep landed but before the test suite itself was updated:
**2953 tests, 2880 pass, 68 fail** (background run, this session).

After updating every affected fixture (`stage: 'clarify'` → `'discovery'`
where a fresh item's real starting stage was meant; the small number of
genuinely-historical fixtures — `scripts/migrate-clarify-split.mjs`'s own
test — switched to a raw `appendEvent` bypass instead, since `clarify` is
no longer a value `addWork`'s own validation will accept for a live item)
and every hop-count assumption (a fresh item now needs one fewer explicit
`discover --verdict clear` call to reach `planning`, since it starts at
`discovery` instead of `clarify`), the same file — and the full suite —
passes for real:

```
✔ resolveDiscovery with no callerVerdict, no locked CONTEXT.md, and role "runner" no-ops instead of spawning a subprocess judge (D16) (1.359756ms)
...
ℹ tests 30
ℹ pass 30
ℹ fail 0
```

Full suite at the final, returned state: **2953 tests, 2948 pass, 0 fail,
5 skipped** (bee-checkout skips, expected in a worktree).

## Two real bugs the failing-before evidence surfaced

Beyond the expected test-fixture updates, the same failing-first
discipline caught two genuine defects before they shipped, both fixed in
the committed diff:

1. **`replay.mjs`'s `clarify-pass` settlement silently stopped recording
   for every future item.** The settlement gate read `from === 'clarify'`
   — literally correct before this item, but with `clarify` retired as a
   stage entirely, no live coding-domain `work.stage` transition can ever
   again carry `from: 'clarify'` (only the two historical FSM-legality
   edges `migrate-clarify-split.mjs` needs survive it, and those never
   carry the settlement shape). Found by reading the settlement's own
   doc comment against the new registry, not by a test failure alone —
   confirmed by updating `test/state/replay.test.mjs`'s own settlement
   tests to the new entry-stage shape and watching them still assert the
   real behavior. Fixed by regating on `from === 'discovery'`, the new
   entry stage (`src/state/replay.mjs`).
2. **A freshly submitted item is now immediately eligible for real
   research-worker dispatch on the very next `runner --once` tick.**
   `src/runner/loop.mjs`'s pre-existing DISCOVERY DISPATCH sweep
   (tsk-5mj/tsk-4v6, unrelated to this item) unconditionally dispatches a
   real worker for any `stage: 'discovery'`, `status: 'todo'` item. Before
   this item, a fresh item sat at `clarify` — invisible to that sweep —
   until an explicit `discover` call moved it forward, so a test calling
   `runner --once` right after `submit` with no configured executor was
   safe. After this item, a fresh item starts at `discovery` directly, so
   that same test now hits the sweep on its very first tick. Caught live,
   not by inspection: `test/e2e/runner-loop.test.mjs`'s own unclear-verdict
   test actually dispatched a REAL assistant CLI (auto-detected on PATH)
   against its own throwaway test repo and got back a genuine researched
   answer instead of the test's literal input:

   ```
   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   + actual - expected

   + "What concrete deliverable or acceptance criteria does 'the ambiguous
   work' refer to? The repo contains only .git and seed.txt, with no docs,
   code, or prior history to infer scope from, and no
   .claude/skills/fgos-researching/SKILL.md is present in this checkout to
   follow."
   - 'Bạn muốn ưu tiên hiệu năng hay độ chính xác?'
   ```

   Reproduced in isolation to confirm the mechanism (a direct `fgos
   discover --verdict unclear --question ...` CLI call, with no runner
   tick first, returned the literal question correctly and instantly —
   proving the discover verb itself was never the bug). Fixed by
   configuring the same scripted, no-verdict-fence executor other
   dispatch-adjacent tests in that file already use
   (`writeRunnerConfig(repoRoot, writeAdaptiveWorkerExecutor(scriptDir))`)
   before the test's first `runner --once` call, restoring determinism
   without touching the sweep itself (widening the sweep's own step
   vocabulary or otherwise gating it differently is a real product
   decision, out of this item's own scope — noted in the branch's own
   commit message and in `test/cli/fgos-read.test.mjs`'s own comment on
   the closely related `footprintConflicts` gap).

## Not fixed, documented instead (real product decision, out of scope)

`footprintConflicts`/`frontierAcrossSteps`' default step vocabulary
(`Clarify`/`Divide`/`Execute`) no longer covers a fresh item's default
resting stage (`discovery`), since `discovery`/`exploring` were already
outside that vocabulary before this item (tsk-1w7 D10). Before this item,
a fresh item briefly sat at `clarify` (which DID map to `Clarify`) before
an explicit `discover` call moved it on; after this item, it starts at
`discovery` directly and stays invisible to a footprint-conflict scan for
its entire default resting stage, not just a brief transient window.
Recorded plainly in `test/cli/fgos-read.test.mjs`'s own comment on the
test this changed (`conflicts verb: a discovery-stage item and an
executing-stage item sharing a footprint are NOT flagged`) rather than
silently patched — widening `footprintConflicts`' own candidate-selection
strategy is a real product decision this item's own scope does not cover.
