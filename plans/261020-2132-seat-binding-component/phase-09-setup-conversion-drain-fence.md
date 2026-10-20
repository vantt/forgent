# Phase 09: `fgos setup` conversion, `seat-binding-drain`, schema fence, rollback

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 08.

## Context

- Spec §8 steps 1–6 [R9, G8, P4]; AGENTS.md install/setup/doctor gate (config-merge + doctor registry, `src/setup/checks.mjs` / `registrations.mjs`).
- Pure conversion from 05 (`src/setup/seat-binding-conversion.mjs`); record fence `seatSchema: 1` from 02; config fence `seatBindingSchema: 1` required since 06.

## Requirements

- `fgos setup` on a project config without `seatBindingSchema`: write a backup first (`.fgos/config.json.pre-seat-binding-<ts>`, path printed), run `convertRunnerConfig`, print the diff (every `changes[]` line incl. bare-verb copies and `maxTier` additions), write. Idempotent: second run prints "already converted", writes nothing. Also refreshes `$comment` text when it differs from the crate ladder.
- `fgos setup` never writes the global file for this (P4); the loader refusal from 05 names project config.
- Doctor `seat-binding-drain`: lists every `unit.json` under the workspace state root in `doing` or `paused` without `seatSchema` (path, unit run, age); fails while any exist. This is the wave's stop predicate, run before activation on every workspace, so it must work on a not-yet-converted workspace: it reads only `unit.json` files and never loads the runner config. `fgos doctor` has no single-check selector today (checked 2026-10-20); read the row from `fgos doctor` output (JSON by default), do not add a selector.
- Doctor `seat-binding-config` replaces `runner-rigor-config` (`registrations.mjs:1437`, old id deleted): fails when the project config lacks `seatBindingSchema` or still has `rigorToTier`, message "run `fgos setup`"; reports `$comment` text that differs from the crate ladder (§4.1).
- Fence proof: a test extracts the pre-wave tree (`git archive` of the track's merge-base with main, `src/` + `package.json`) into a temp dir, loads a converted project config with that real old loader and asserts it throws on the missing `rigorToTier` / unknown capability keys, never binds; the global file with today's shape still loads there. Phase 12 repeats this live with the old activation before activating the new one.
- Rollback recipe documented in the doctor message of `seat-binding-config` failure path and in spec (11): prior release + backup together.

## Files

- Modify: `src/setup/registrations.mjs` (setup config-merge entry, two doctor rows, delete `runner-rigor-config`), `src/setup/config-merge.mjs` if the merge path needs the hook, `src/setup/seat-binding-conversion.mjs` (backup/diff wiring only).
- Tests: `test/setup/seat-binding-conversion.test.mjs` (CLI level), `test/setup/checks-doctor-config.test.mjs`, new drain test.

## Steps

1. Wire conversion into setup with backup + diff.
2. Drain row with fixtures (pre-fence doing/paused, post-fence, settled).
3. Config row replacing `runner-rigor-config`.
4. Old-loader fence test.

## Tests (proof owned)

- Conversion idempotent; older activation refuses the new project schema instead of misbinding; global file still loads on an old activation.
- Drain row fails on a pre-fence `doing` record, passes when settled.

## Risks / rollback

- M×H: setup run by an **old** release on a converted file. Old setup does not know the new keys; it validates and throws (no write), proven by the old-loader test.
- Rollback: revert the merge on the track.
