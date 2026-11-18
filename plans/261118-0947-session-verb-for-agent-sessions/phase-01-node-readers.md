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

## Facts re-checked on origin/main 4cde6c9de (lead, 2026-11-18)
- Lines moved: `bin/fgos.mjs` import :100, guard :3140-3158; `approve.mjs` import :57, loop :232-241, refusal :243-256;
  `merge.mjs` import :47/:52, `detectPostLandDrift` :348, call :1036; `checkLeafNotifyDrift` :939, row :1077;
  doctor-registry row :360 (no Rust mirror); manifest entry :1675; `test/architecture.test.mjs:1694` lists `session.mjs`.
- `postLand` consumers: `approve.mjs:655,668,853,866`, `src/verbs/merge/sync-root.mjs:226`.
- Extra tests to retire/adjust: `test/state/postland-drift.test.mjs`, `test/runner/merge.test.mjs` (`detectPostLandDrift`
  cases ~1451-1594), `test/runner/merge-quoted-paths.test.mjs` (~102-117), `test/direct/merge-gate.test.mjs` (~428:
  the "verify breaks the session registry" case), `test/test-ownership.mjs:68`, `test/suite-baseline.json:540`;
  `startSession`/`endSession` have ~28 importers under `test/cli/**` (all of them move).
- Comment-only mentions to fix: `src/runner/worktree.mjs:206-207,281`, `test/runner/paths.test.mjs:58`.
- Not this phase (left for phase 4): `src/util/session-identity.mjs`, `src/cli/command-registry.mjs` identity text,
  `test/util/session-identity.test.mjs`, `docs/platform/runner/spec.md:223`, `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:74`.
  Decision history (`docs/platform/runner/decisions/**`) stays as history.

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
- `node scripts/run-tests.mjs` focused on the touched test files (`test/runner/merge*.test.mjs`, `test/direct/merge-gate.test.mjs`, `test/cli/fgos-return.test.mjs`, `test/verbs/merge/**`, `test/setup/checks.test.mjs`, `test/cli/fgos-disconnected-worktree-guard.test.mjs`, `test/cli/fgos-claim*.test.mjs`, `test/architecture.test.mjs`): all pass.
- `rg -n "listSessions|runner/session\.mjs|postland-drift|leaf-notify-drift|startSession|endSession" src bin test docs/platform/runner docs/architecture-manifest.json -g '!docs/platform/runner/decisions/**'` finds nothing (gateway client.ts is outside these roots); `rg -n "sessions\.json" src bin test docs/platform/runner` finds only the phase-4 identity files listed above.

## Rollback
`git revert` the phase commit set.
