# Phase 09: `fgos setup` converts the project file; doctor `runner-patterns-config` judges through the one resolver

Depends on: 03 (retired-key table, marker, shipped catalog), 05 (`checkCatalog`), 06 (dry-bind resolves activity units). Blocks: 10, 12. Effort: 8h. Risk: Medium-High (writes users' config; doctor semantics).

Run as (fgos-cook): two slices (9a conversion, 9b doctor). Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high` for 9a (a config write with a backup; hard to reverse on a machine), `standard` for 9b. Branch A or B (phase 03 gate) changes the marked steps.

## Context links

- Spec sections 13.2 (items 2-4), 13.3 (registration table), 5.3, 8.4, 12 (doctor information), scenarios S9 (doctor part) and S18.
- Today: doctor row `runner-patterns-config` (`src/setup/registrations.mjs:525-600`, registered at :1311) re-implements the shape rules by hand (`defaultRule`, `reviewed`, cumulative `checkersByRigor`), duplicating `validateRunnerPatternsShape`. Setup: `bin/fgos.mjs:4040-4052` calls `refreshTierLadderComment`, then `ensureSharedConfigDefaults(repoRoot)` and `ensureSharedConfigDefaults(os.homedir(), { layer: 'global' })`.
- Prior art reused: `readSharedConfig`/`writeSharedConfig` (`src/config/shared-config-file.mjs`) and the setup-writes-a-`$comment` precedent (`src/setup/tier-ladder-comment.mjs`); the `rigorToTier` refusal (`478f351ff`) and the doctor row `tier-vocabulary-dead-keys` (`registrations.mjs:1317`) for reporting a retired key at both levels; `checkSeatBindingDryBind` for workflow-unit validation (`src/setup/seat-binding-checks.mjs:66`).
- Install/setup/doctor gate (AGENTS.md): no new check name (`distribution.md` row 77 unchanged), setup registers conversion without seeding the catalog, nothing assumes an install level.

## Requirements

9a. `src/setup/runner-config-conversion.mjs` exports `convertRunnerPatternsConfig(projectDir)` returning `{ status: 'absent'|'unchanged'|'converted', backup?, written[] }`:
1. It reads the **project** file only. It never rewrites the global file (older installed releases read it with the strict allowlist).
2. When the file holds a retired key (`retiredKeysIn`): copy it to `<file>.pre-patterns-catalog-<UTC timestamp>` first; move `runner.patterns.reviewed.{maxRounds,checkersByRigor}` to `runner.loops.reviewed.*`; delete `runner.patterns.defaultRule`; write `runner.patterns.seatBinding.schema: 2`; write a `$comment` beside each key it writes saying what the key does and why it holds this value (config comments are documentation). Idempotent: a second run is `unchanged`. A file with no retired key and marker 1 is left alone (the new release reads it), not bumped.
3. Wired into the `setup` handler before `ensureSharedConfigDefaults`. It reports the global file: if the global file holds a retired key, the setup output names the file, the two edits and the one-minute command (phase 12 authors the text); it does not touch it.
4. Branch A: the same operations go through the Config write door (`fgos config patch`/`applyPatch`) with a reason, and the comment is the `@fgos:why` line; if the door refuses a file whose only fault is the retired keys, stop and take unresolved question U6 to CFG instead of writing around the door.

9b. Doctor `runner-patterns-config` (id kept) is rebuilt on the one resolver:
5. Per level (project, global): `retiredKeysIn(runnerRaw, file)` is a **failing** check (`config-key-retired`) naming file and replacement, like the `rigorToTier` row. Then the effective config is loaded and `checkCatalog` problems fail the check; read-only, never spawns a seat or runs verify.
6. Warnings: a pattern default or activity default beyond a `bounds` value (runs unclamped); catalog entries or `runner.loops` in the **global** file (an older release refuses that file; doctor cannot enumerate installed releases, so the warning is unconditional and says so: unresolved question U7); information: a capability `minCheckers` entry that omits `red-team` for a `code` or `code:*` capability; hint (never failure): two patterns with the same loop, params and invariants and different names.
7. The hand-written shape rules at `registrations.mjs:550-590` are deleted (one door); `VALID_CHECKER_SEATS`/`RIGOR_VALUES` imports shrink accordingly.
8. No `--fix` is registered for this row, so `doctor --fix` can never loosen a floor or rewrite a promise (spec 13.3); the way out of a failing row is `fgos setup` (project) or the per-machine command (global).
9. `checkSeatBindingDryBind` also resolves each loaded workflow's activity `unit` (a string `unit.pattern` plus params) through `resolveCollaboration`, so a typo in an activity unit is reported by doctor instead of at the first dispatch (spec 8.1 carrier "activity unit").

## Files (writes)

9a: `src/setup/runner-config-conversion.mjs` (new), `bin/fgos.mjs` (setup handler), `test/setup/runner-config-conversion.test.mjs` (new; the module is new, so its proof lives in its own file; the spec table named `test/setup/registrations.test.mjs`), `docs/architecture-manifest.json`, `packages/git/contracts/mutation-census.v1.json`
9b: `src/setup/registrations.mjs`, `src/setup/seat-binding-checks.mjs`, `test/setup/registrations.test.mjs` (doctor row: rewrite `:1149-1190`; owns S9 doctor warning and the S18 doctor failing check), `test/setup/seat-binding-dry-bind.test.mjs` (activity unit case), `test/setup/checks.test.mjs` (id list unchanged: check only), `test/setup/checks-doctor-config.test.mjs` (marker fixtures at :49)

## Steps

1. 9a: write the module on `readSharedConfig`/`writeSharedConfig`; tests in plain words: converts a project file holding the old shape with a backup, comments and marker 2; the backup equals the original bytes; a second run changes nothing; a converted file passes the loader; the global file is never written (assert its bytes); a file already in the new shape is untouched.
2. 9a: add the call in `bin/fgos.mjs`; the setup output lists what it did and what it left for the global file.
3. 9b: replace the check body; delete the duplicated rules; add the cases: a retired key in the project file fails naming file and `runner.loops.reviewed`; the same in the global file fails naming the global path; a default beyond a bound warns; a global catalog entry warns; an explicit `code:*` `minCheckers: [reviewer]` informs; two identical-meaning patterns hint.
4. 9b: extend `checkSeatBindingDryBind` with the activity-unit validation.
5. Census, manifest.

## Verify

- 9a: `node scripts/run-tests.mjs test/setup/runner-config-conversion.test.mjs test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs test/setup/checks-setup-idempotent.test.mjs`
- 9b: `node scripts/run-tests.mjs test/setup/registrations.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/runner/dispatch-config-patterns.test.mjs`
- No Rust. Full gate at phase 12.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| conversion corrupts or loses a project's config | L x H | backup first, idempotent, the converted file is read back through the loader inside the conversion before it reports `converted` (restore the backup on failure) |
| setup converts then an older activated release on the same machine refuses the file | H x M | the intended fence; the output says so; stated in plan.md risk 1 |
| doctor now fails on files that were fine | H x M | only for retired keys and real catalog errors; the message names the one-command fix |
| the unconditional global warning is noisy for single-release machines | M x L | wording; question U7 |
| two writers: setup conversion and Config write door | L x M | branch A rule above: never write around the door |

## Rollback

Revert 9b then 9a. A project file already converted by a trial run is restored from its `.pre-patterns-catalog-*` backup (the plan never converts a real project file before phase 12).

## Acceptance (owned here)

S18: setup converts the project file with backup, comments and marker 2, never rewrites the global file (`test/setup/runner-config-conversion.test.mjs`); doctor reports a retired key as a failing check naming file and replacement key (`test/setup/registrations.test.mjs`). S9: doctor warns on a default beyond a bound (same file). Not here: the older-release refusal (manual evidence in phase 12) and the unpinned-record resume (phase 06).
