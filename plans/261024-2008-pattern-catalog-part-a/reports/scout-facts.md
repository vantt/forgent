# Scout facts for Part A (verified at worktree HEAD 24d8816ba, which equals origin/main at 2026-10-24 20:10)

Scope: the code and docs the approved spec cites, re-grepped. Line drift against the spec is listed; none changes a design decision.

## Line drift (spec citation -> now)

| Spec cites | Now | Note |
|---|---|---|
| `run.mjs:366` `chosenPattern` | `run.mjs:366` | same |
| `run.mjs:768` `seatSchema: 1`, `:773` stored selector | `:768`, `:773` | same |
| `run.mjs:1438-1441` resume reads `unitRecord.pattern` | `:1442-1445` | +4 |
| `run.mjs:1513` `recordInlineRun`, settle ~1581-1590 | `:1517`, `:1585-1590` | +4 |
| `run.mjs` ~1415 verify returns `{pass:true}` with no command | `:1423` | +8 |
| `run.mjs:211-224`, `620-622` seatSchema fence | `:211-224`, `:621` | same |
| `seat-resolver.mjs:113,116` capability `minCheckers` exact key, code red-team | `:113`, `:116` | same |
| `seat-resolver.mjs:159-162`, `:198-201`, `:205-223`, `:139` | `:159`, `:200`, `:205-223`, `:139` | same (declaredSeatsOf, solo declared, reviewed exact, checkDeclaredSeats) |
| `config.mjs:290-300`, `1488-1505` marker + strict allowlist | `:290-298`, `:1469-1492` (`validateRunnerPatternsShape`) | -15 on the validator |
| `registrations.mjs:281` marker write | `:282` | +1 |
| `case-projection.mjs:240` `receiptsFromResults` | `:237-247` | same function |
| `unit-summary.mjs:72,146` | `:73`, `:~148` | +1/+2 |
| `bin/fgos.mjs:2854`, `2912-2930`, `~4354` | `:2854`, `:2912-2930`, `:4354` | same |
| `feature.yaml:145` `unit: { pattern: reviewed }` | `domains/coding/workflows/feature.yaml:145` | path is `domains/coding/workflows/`, not `core/` |

## Facts the spec does not state

1. `core/config-schema/runner.schema.yaml` and `core/config-standard/runner.yaml` already exist (commit `221403acb`) and still carry `patterns.defaultRule`, `patterns.reviewed`, `patterns.seatBinding`. They are embedded in the Rust bundle (`packages/config/rust/src/bundle.rs`, `build.rs`) and pinned by `packages/config/rust/tests/authoring_equivalence.rs` against `packages/config/contracts/fixtures/authoring-source.config.json` (which holds the old `defaultRule`/`reviewed` shape). Editing the two data files therefore touches Rust-side proofs owned by CFG.
2. Config landing C (the Node reader cutover) is not on origin/main: `src/config/facade.mjs` exists (landing B) but `git grep facade.mjs -- src/runner src/setup bin` is empty; the runner still reads `.fgos/config.json` through `loadRunnerConfigFromDir` + `mergeWithGlobalConfig` (`src/config/global-config.mjs:64`), whose semantics already are "per-key deep, arrays are leaves, project wins" (`src/setup/config-merge.mjs`). C's phase 10 keeps `validateRunnerConfigShape`, so the shape validator is the one hook that exists in both worlds.
3. The pre-commit hook refuses a commit that stages a shipped Node file without the regenerated census (`.githooks/pre-commit:454-484`, proof `test/githooks/census-drift.test.mjs`). Every phase that edits `src/**` lists `packages/git/contracts/mutation-census.v1.json` in its writes and ends with `node scripts/git-one-door-scan.mjs --write-census`.
4. The loops may not import `runner/dispatch/` (`test/runner/execution/patterns/architecture-guard.test.mjs:9-20`); `seat-resolver.mjs` is declared pure (no I/O). The shipped catalog (bundled YAML) is therefore read by an infra module and passed into the pure resolver as data.
5. `dry-bind.mjs:67` calls `runPattern(unit.pattern || 'solo', ...)`, so it never sees the caller's `--pattern`; `run.mjs:421` works around it by copying the chosen pattern into the unit. Both go through the one resolution after Part A.
6. `patternHistoryOutcome` for `solo` (`patterns/history-outcome.mjs`, `case 'solo'`) reads only the producer seat, so a solo verify result would not change the derived summary outcome until that case is extended.
7. Existing tests assert seat/pattern refusals by message only (`/not a checker seat/`, `/runs solo/`); no test asserts `unknown-checker-seat` or `seat-multiplicity` by code (`git grep -n unknown-checker-seat -- test` is empty), so retiring the code needs no test migration, only new code assertions.
8. `fgos run` flag parsing already collects `--param` as a list (`bin/fgos.mjs:566` `REPEATABLE_FLAGS = ['context-ref', 'param']`) and `parseLockParams` (`src/runner/lock-fence.mjs:28`) is the existing `k=v` idiom; `--reason` is already a case-only flag (`bin/fgos.mjs:2912`).
9. The flag list of `fgos run` is registered in `src/cli/command-registry.mjs:1484-1501` and guarded by `test/cli/fgos-manifest.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs`.
10. The old-shape config appears in ~18 test fixtures that write `defaultRule`/`reviewed` into a config file (list in phase 03). About 150 more fixtures write only `patterns: { seatBinding: { schema: 1 } }`, which stays valid (the new release reads schema 1 and 2), so they are not touched.

## Prior art (git log -S) and what is reused

- `PRESETS`/`resolvePattern`: `abe6f2b3c`, widened by `d9b7026d5`. Replaced by the config catalog; the per-name data moves into `core/config-standard/runner.yaml` (reuse the exact seat lists and `rfc` role-task text from `presets.mjs`).
- `research-fan-out-gated`: `026dda79c` (P4 presets), `gated` is written (`presets.mjs:38`, `legacy-seat-read.mjs:55`) and read by no loop (`git grep gated -- src/runner/execution` shows only those two). Retired, with a record-read mapping to `research-fan-out`.
- `patterns.defaultRule.mutatingMinRigor`: introduced `abe6f2b3c`; `git grep mutatingMinRigor -- src bin` shows only validators (`config.mjs:1497-1506`, `registrations.mjs:553-554`) and the default (`config.mjs:246`). Dead key, dropped.
- `minCheckers`/red-team: `abe6f2b3c`, seat form `d9b7026d5`, declared seats `09eb8d473`. The unconditional branch at `seat-resolver.mjs:116` becomes a shipped resolver default.
- `seatSchema` fence and `record-from-newer-release`: commit `17f551556`. Reused as-is; `KNOWN_SEAT_SCHEMA` 1 -> 2.
- Refusal of a retired config key instead of dropping it in memory: `478f351ff` (`rigorToTier`) and doctor row `tier-vocabulary-dead-keys` (`registrations.mjs:1317`). Reused as the model for `config-key-retired` and for the doctor report.
- Config-defined topology engine retired on purpose: `2180b4e72`. The plan keeps the four loops in code and gives config only names, defaults, invariants and tuning.
- Solo verify: `solo.mjs` has accepted a `verify` hook since `abe6f2b3c` and never called it (`src/runner/execution/patterns/solo.mjs:29`); `48d457a53` (verify and skills on the Unit, bounded verify step) is what the reviewed loop uses and what solo reuses, so nothing was removed and nothing needs reviving.
