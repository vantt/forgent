# Phase -01 (pre-wave): dev-door host resolution and forward record fence, on main

Owner: Sonnet lead in its own worktree **from main** (not the track). Size S (0.5d). Lands on main through the normal merge and rides the next ordinary release activation. It must be **active on forgentX, mdview, mcp-skill-hub and the second machine before phase 12 starts** (phase 12 checks it). Does not wait for phase 00; may run in parallel with 00–02.

## Context

- Red-team items [RT-10] (dev door) and [RT-15] (record fence ahead of the wave), [red-team-adjudication.md](red-team-adjudication.md).
- Host resolution: `src/util/host-bin-path.mjs:69-97` `resolveActiveHostBin` (env → activation beside `fgosDir` → nearest activation above `cwd`); it ignores `FGOS_ACTIVE_MANIFEST_PATH`, which the dev door sets (`scripts/run-rust-dev-host.mjs:152`). Under `npm run fgos:dev` a Node client therefore resolves the **activated** host, not the working-tree host, so a new internal route is invisible to dev runs.
- Records: today `unit.json` carries no seat schema; `execution.status` ∈ running | pending | pending-inline | settled (`run.mjs:699,731,735,1259,1371,1374`).

## Requirements

1. [RT-10] Dev door: `resolveActiveHostBin` honours `FGOS_ACTIVE_MANIFEST_PATH` (the host binary named by that manifest's `entries.fgos`) after `FGOS_HOST_BIN` and before activation lookup; `ignoreEnv` skips both env inputs. Alternative if the manifest form is unsuitable: the dev door exports `FGOS_HOST_BIN`. The lead picks one, states why, and leaves no second path.
2. [RT-15] Forward record fence: the current code refuses to resume or adopt a `unit.json` whose `seatSchema` is present and greater than the version it knows (it knows none, so any value), with `record-from-newer-release` naming the field. Read-only inspection (`show-run`, summaries) still works. This makes rollback after phase 12 safe without a drain of new-release records.

## Files

- Modify: `src/util/host-bin-path.mjs` (or `scripts/run-rust-dev-host.mjs` for the alternative), `src/runner/execution/run.mjs` (resume path only), `src/run-supervisor/` adopt entry if it reads `unit.json` (lead confirms).
- Tests: `test/util/host-bin-path.test.mjs` (or the existing resolver test), one resume-refusal test in `test/runner/execution/run.test.mjs`.

## Steps

1. Resolver change + test (env, manifest, ignoreEnv, activation order).
2. Resume/adopt refusal + test with a fixture `unit.json` carrying `seatSchema: 1`.
3. Full `npm test`; merge to main; note on the board that the change must be activated before SEAT landing.

## Rollback

Revert the commit on main; both changes are inert for current records and activations.
