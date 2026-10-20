# Phase 09: `fgos setup` conversion, `seat-binding-drain`, fence proof, rollback

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 08.

## Context

- Spec `docs/specs/seat-binding.md` §9 steps 1–6 [RT-16b]; AGENTS.md install/setup/doctor gate.
- Conversion function from 05; record fence `seatSchema: 1` from 02 (and the pre-wave refusal of it on the old release [RT-15]); project-layer requirement of `patterns.seatBinding.schema` and the global sanitizer from 06.
- Fill-missing writers: setup `ensureSharedConfigDefaults` (`registrations.mjs:273-283`, `bin/fgos.mjs:4058,4061`) and `ensureRunnerConfigForDir` (`config.mjs:399`, write :410 before validation :417; 14 production callers, see 06) write defaults before validating [RT-2, P00-C6]. Only `fgos setup` writes the global file (`bin/fgos.mjs:4061`).

## Requirements

- [RT-2] **`fgos setup` order**: conversion first, then fill-missing. Trigger: project `rigorToTier` present **or** `patterns.seatBinding.schema` absent. On trigger: backup first (`.fgos/config.json.pre-seat-binding-<ts>`, path printed), `convertRunnerConfig`, print the diff (`changes[]` and `reports[]`: bare-verb copies, `maxTier` additions, unit-rigor/`rigorFloor` behaviour changes), write. Idempotent. Refreshes `$comment` when it differs from the crate ladder. Never writes new keys or the marker to the global file.
- [RT-4, P00-C2/C3/C4, D-a, D-b, D-f] **Doctor `seat-binding-drain`** (stop predicate). It **fails only** while a pre-fence `unit.json` (no `seatSchema`) has a **live controller** (`unitControllerHeld`, `unit-control.mjs:27`, with the read-only attempt probe of `deriveUnitState`, `unit-state.mjs:50-70`), whatever its `execution.status` and including records without an `execution` field. Each live record is listed with path, unit run, age and owning session: it finishes on the old release, or that session stops. Dead pre-fence records are **info, never blocking**: records with a dead controller and a closed last attempt (`awaiting-resume`; 28 on forgentX at phase 00), `legacy-run` records (2), and records without an `execution` field (81). The row lists each one with the refusal it gets after landing, `record-predates-seat-binding`, and notes that its history stays readable through the legacy read path (02). No resume is run before the wave and no abandon verb is added (RUL104). Workflow runs that are parked at a gate or `running` with no active step are info as well; a parked gate's role-keyed refs resolve through the legacy read path after landing. The row reads only records, never the runner config, so it runs on an unconverted workspace. `fgos doctor` has no single-check selector; read the row from `fgos doctor` output (JSON by default).
- **Doctor `seat-binding-config`** (new row; `runner-rigor-config` was deleted in 06 [RT-16a]): fails when the project layer lacks `patterns.seatBinding.schema` or still has `rigorToTier` ("run `fgos setup`"); reports `$comment` drift.
- [RT-3] **Fence proof**: a test extracts the pre-wave tree (`git archive` of the track's merge-base with main, `src/` + `package.json`) into a temp dir and, with a temp HOME holding a **real-shaped global file that carries `rigorToTier`**, loads each converted fixture (forgentX-like, mdview-like without capability rigor, mcp-skill-hub-like without `prefer`) with that old loader: it must throw on `patterns.seatBinding`, never bind. The old `ensureRunnerConfigForDir` writes missing defaults before validating (`config.mjs:395-405`), so it may add `rigorToTier` back to the project file: the test records the exact bytes it adds (must be only the default keys), then runs the new `fgos setup` and asserts the file re-converts to the same result and doctor is green [RT-2]. Phase 12 repeats this live on all three workspaces.
- Rollback: prior release + the backup together (spec §9 step 6); the `seat-binding-config` failure message names it.

## Files

- Modify: `src/setup/registrations.mjs` (setup order, two new rows), `src/setup/config-merge.mjs` if the merge path needs the hook, `src/setup/seat-binding-conversion.mjs` (backup/diff wiring only), `bin/fgos.mjs` (setup order at :4058-4061 only).
- Tests: `test/setup/seat-binding-conversion.test.mjs` (CLI level), `test/setup/checks-doctor-config.test.mjs`, new drain and fence tests.

## Steps

1. Setup order + backup + diff.
2. Drain row with fixtures: pre-fence record with a live controller (fails); pre-fence `awaiting-resume`, `legacy-run` and no-`execution` records with dead controllers (info, each with its refusal); post-fence and settled records (silent); parked gate with role refs (info) [P00-C2, D-a, D-b, D-f].
3. Config row.
4. Old-loader fence test with the real-shaped global file.

## Tests (proof owned)

- Conversion idempotent; older activation refuses the new project schema instead of misbinding, for all three workspace shapes, with a global file carrying `rigorToTier`; the global file still loads on the old activation; old fill-missing followed by new setup ends green.
- Drain row fails only on a pre-fence record with a live controller; dead pre-fence records and parked gates are info lines naming `record-predates-seat-binding`; a pre-fence record asked to resume after the wave is refused by that name [D-a, D-b, D-f].

## Risks / rollback

- M×H old setup run on a converted file: it validates and throws; any default keys it wrote are healed by the next new-release setup (tested). Rollback: revert on the track.
