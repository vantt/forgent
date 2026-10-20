# Phase 09: `fgos setup` conversion, `seat-binding-drain`, fence proof, rollback

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 08.

## Context

- Spec `docs/specs/seat-binding.md` §9 steps 1–6 [RT-16b]; AGENTS.md install/setup/doctor gate.
- Conversion function from 05; record fence `seatSchema: 1` from 02 (and the pre-wave refusal of it on the old release [RT-15]); project-layer requirement of `patterns.seatBinding.schema` and the global sanitizer from 06.
- Fill-missing writers: setup `ensureSharedConfigDefaults` (`registrations.mjs:273-283`, `bin/fgos.mjs:4058,4061`) and `ensureRunnerConfigForDir` (`config.mjs:395-405`) write defaults before validating [RT-2].

## Requirements

- [RT-2] **`fgos setup` order**: conversion first, then fill-missing. Trigger: project `rigorToTier` present **or** `patterns.seatBinding.schema` absent. On trigger: backup first (`.fgos/config.json.pre-seat-binding-<ts>`, path printed), `convertRunnerConfig`, print the diff (`changes[]` and `reports[]`: bare-verb copies, `maxTier` additions, unit-rigor/`rigorFloor` behaviour changes), write. Idempotent. Refreshes `$comment` when it differs from the crate ladder. Never writes new keys or the marker to the global file.
- [RT-4] **Doctor `seat-binding-drain`** (stop predicate): fails while any `unit.json` without `seatSchema` has `execution.status` ∈ {running, pending, pending-inline} (statuses per `run.mjs:699,731,735,1259,1371,1374`), or any workflow run has unsettled steps or parked gates holding `unit-run:<id>/<role>` refs. Each blocking record is listed with path, unit run, age and controller liveness (6.4 liveness reader), and the verb that settles it: live → let it finish on the old release; dead → `fgos run --resume <unit>` (adopt) or `fgos doctor --fix` (`run-attempts-stuck` → `sweepAttempts`), per phase 00's finding. A record with no settling path is reported as such (reversal trigger: reader shim). The row reads only records, never the runner config, so it runs on an unconverted workspace. `fgos doctor` has no single-check selector; read the row from `fgos doctor` output (JSON by default).
- **Doctor `seat-binding-config`** (new row; `runner-rigor-config` was deleted in 06 [RT-16a]): fails when the project layer lacks `patterns.seatBinding.schema` or still has `rigorToTier` ("run `fgos setup`"); reports `$comment` drift.
- [RT-3] **Fence proof**: a test extracts the pre-wave tree (`git archive` of the track's merge-base with main, `src/` + `package.json`) into a temp dir and, with a temp HOME holding a **real-shaped global file that carries `rigorToTier`**, loads each converted fixture (forgentX-like, mdview-like without capability rigor, mcp-skill-hub-like without `prefer`) with that old loader: it must throw on `patterns.seatBinding`, never bind. The old `ensureRunnerConfigForDir` writes missing defaults before validating (`config.mjs:395-405`), so it may add `rigorToTier` back to the project file: the test records the exact bytes it adds (must be only the default keys), then runs the new `fgos setup` and asserts the file re-converts to the same result and doctor is green [RT-2]. Phase 12 repeats this live on all three workspaces.
- Rollback: prior release + the backup together (spec §9 step 6); the `seat-binding-config` failure message names it.

## Files

- Modify: `src/setup/registrations.mjs` (setup order, two new rows), `src/setup/config-merge.mjs` if the merge path needs the hook, `src/setup/seat-binding-conversion.mjs` (backup/diff wiring only), `bin/fgos.mjs` (setup order at :4058-4061 only).
- Tests: `test/setup/seat-binding-conversion.test.mjs` (CLI level), `test/setup/checks-doctor-config.test.mjs`, new drain and fence tests.

## Steps

1. Setup order + backup + diff.
2. Drain row with fixtures (pre-fence running/pending/pending-inline, live vs dead controller, post-fence, settled, parked gate with a role ref).
3. Config row.
4. Old-loader fence test with the real-shaped global file.

## Tests (proof owned)

- Conversion idempotent; older activation refuses the new project schema instead of misbinding, for all three workspace shapes, with a global file carrying `rigorToTier`; the global file still loads on the old activation; old fill-missing followed by new setup ends green.
- Drain row fails on a pre-fence running record and on a parked gate with a role ref; passes when settled.

## Risks / rollback

- M×H old setup run on a converted file: it validates and throws; any default keys it wrote are healed by the next new-release setup (tested). Rollback: revert on the track.
