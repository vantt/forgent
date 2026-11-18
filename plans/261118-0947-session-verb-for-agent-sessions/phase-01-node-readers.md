# Phase 1: Node readers stop reading the session registry

Decisions: SV-2, SV-3, SV-4 (plan.md). Evidence: scan report §1, §8.

## Inputs (read first)
- `src/runner/session.mjs` (`listSessions`, the only export) and its importers: `bin/fgos.mjs` (return guard, ~3150-3200;
  comment ~248, ~3616), `src/verbs/merge/approve.mjs` (~220-260), `src/runner/merge.mjs` (`detectPostLandDrift` ~348,
  call ~1033), `src/state/postland-drift.mjs`, `src/state/graph-harness.mjs` (`classifyPostLandDrift` ~454),
  `src/setup/registrations.mjs` (`checkLeafNotifyDrift` ~981, row ~1119).
- `packages/distribution/contracts/doctor-registry.v1.json` row `leaf-notify-drift`; any Rust mirror of that row
  (`rg -n leaf-notify-drift packages apps`).
- Tests: `test/cli/helpers/fgos-cli-harness.mjs` (`startSession`/`endSession`, ~1034-1140) and every importer
  (`rg -l "startSession|endSession" test`), `test/runner/session.test.mjs`, `test/cli/fgos-return.test.mjs`,
  `test/cli/fgos-disconnected-worktree-guard.test.mjs`, `test/cli/fgos-claim{,-2}.test.mjs`,
  `test/verbs/merge/approve-leaf-and-worktree.test.mjs`, `test/setup/checks.test.mjs`, tests of `classifyPostLandDrift`
  and `postLandDrift` (`rg -l "classifyPostLandDrift|postLandDrift|notify" test`).
- Docs: `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md:38`, `docs/platform/runner/operations/h-51f5cd7279fd.md`
  (~281, 664-778), `docs/platform/runner/contracts/conserved-dispatch-doctrine.md:31-33`, `docs/architecture-manifest.json`.

## Files this phase may write
See the phase table footprint in plan.md.

## Steps
0. Re-grep the inputs on the landed tree; stop with `NEEDS_CONTEXT` if a new `listSessions`/`sessions.json` reader appeared that this phase cannot retire.
1. `return` (main-source): drop the registered-session exemption; refuse every linked worktree; the message says to run return from the main checkout (no `fgos session` advice). Update the comment block to the new rule.
2. `approve`: delete the registry loop; keep the structural refusal, its message no longer mentions `fgos session start`.
3. Post-land drift: `classifyPostLandDrift` returns `{ stale }` only; `detectPostLandDrift` loses `sessions`; move every consumer of `notify` (approve output, `rg -n "\.notify|postLand" src`). Delete `src/state/postland-drift.mjs`, `checkLeafNotifyDrift`, its registration row and the doctor-registry row (and its Rust mirror if one exists).
4. Delete `src/runner/session.mjs` and its architecture-manifest entry.
5. Tests: delete `test/runner/session.test.mjs`, the harness `startSession`/`endSession` and their imports; retire the return-exemption test, the session case of the disconnected-worktree guard test, the session uses in claim tests, the `leaf-notify-drift` and notify-outcome cases; keep (reword titles only where they name `fgos session start`) the tests that prove the remaining refusals. Each retired test is named in the commit body with its new owner or "behaviour removed".
6. Runner docs: remove the `fgos session` entry point and its operations section; the doctrine line keeps the rule "a merge into main never runs from a linked worktree" without the session exemption.

## Verify
- `node scripts/run-tests.mjs` focused on the touched test files (`test/cli/fgos-return.test.mjs`, `test/verbs/merge/**`, `test/setup/checks.test.mjs`, `test/cli/fgos-disconnected-worktree-guard.test.mjs`, `test/cli/fgos-claim*.test.mjs`, `test/architecture.test.mjs`): all pass.
- `rg -n "listSessions|sessions\.json|session\.mjs|leaf-notify-drift" src bin test docs/platform/runner docs/architecture-manifest.json` finds nothing.

## Rollback
`git revert` the phase commit set.
