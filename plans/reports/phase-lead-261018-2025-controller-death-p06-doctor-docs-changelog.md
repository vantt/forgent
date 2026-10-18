# Phase report: controller death P06 (doctor, docs, changelog)

Status: DONE_WITH_CONCERNS. Branch `controller-death/p06-docs` (2f95797d5, 4414664c6) merged into integration (4158eedff). No component-boundary change.

## Done
- Red test first, then fix: `deriveUnitState` treats `settlement: abandoned-legacy` as closed (probe answers `legacy-run`). Test in `inspect-recover-adopt.test.mjs`, failed before, passes after.
- Doctor checks `legacy-attempts-stuck` (on `findLegacyStuck`/`judgeLegacyHolders`/`sweepLegacy`, no second walker; recover door injected by `registrations.mjs` for layering; fix prints reason per kept run), `units-awaiting-resume` (via `listAssignmentRuns` + `unitDirOfAssignment` + `deriveUnitState`; warn only), `cancel-wait`.
- One reader for both keys: `readCancelWaitMs`/`resolveCancelWait` moved into `gate-kill-grace.mjs`; `cancel-registry.mjs` no longer reads config; `run.mjs` and its test import the new place.
- Docs: run-supervisor spec §9.1 + §14 rows + §16 entry; runner RUL104 + decision section; intent ledger PF-I011/PF-I012; io-contract 130/143; distribution #7/#7b lists + rows 7h-7j; reading-map; CHANGELOG (Added/Changed/Fixed).
- Named limits written: `gate-lost` not relaunched on resume (fail closed, r6 §9.7), relaunch-on-resume deferred (needs gate-side marker before GO); automatic resume deferred.

## Decisions
- Setup registers NO config default for `dispatch.cancelWaitMs` (same rule as the kill grace: older releases refuse unknown keys in the global file, 2026-10-13); doctor `cancel-wait` is its registration. Phase text said "config-merge": not done on purpose.
- Doctor `cancel-wait` fails below `gateKillGraceMs` (phase text); runtime reader keeps the contract floor of 1000.
- Contract `unit-state.v1.json` corrected to match code: controller seat = `unit-control` ledger (not `controller.json`), concurrent resume = that seat (not exclusive mkdir). Added `gate-lost` resume rule. Plan D6 text is stale on this point.
- No decision id invented for the runner spec section (assigned at landing with `fgos decision`).

## Tests (host built from this branch, phase-private target)
- 76 files (every test naming gate-kill-grace, cancel-registry, unit-state, run-supervisor-checks, setup registrations/checks, legacy-sweep, show-run, inspect-recover, reading-map, distribution, plus architecture and assignment-enumerator guard): 1351 tests, 1348 pass, 2 skipped, 1 fail.
- The 1 fail: `skill-wrappers.test.mjs` "projection tests" needs `.claude/skills/instruction-audit/SKILL.md` in this worktree (generated wrapper absent); not touched by this phase, environment of the worktree.
- Credential write-back exactly-once across adopt is not in the crash matrix; covered by provider-credential-renewal and attempt-steps tests.

## Concerns
- `internal-route.run-supervisor.v1.json` still says "left to 6.4" for `legacy-run` (not my file; stale wording).
- Windows/macOS CI: branch not pushed; big lead asked to push.

## Unresolved
- None blocking.
