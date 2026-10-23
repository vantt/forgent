# Phase 09: Parity sweep and fixture refusal census (read-only; sizes everything after it)

Depends on 08 (landing B merged into `cfg/slice-c`, old readers still present). Suggested executor: sonnet. No source: scratch scripts under `.fgos/runtime/tmp/` and one report under `plans/reports/` (name from `fgos convention name|path --json`, for example `sweep-<stamp>-config-cutover-parity`). Run on each machine that holds a project (design-lap: forgentX, mdview, mcp-skill-hub; fg-server and fg-server2: `~/projects/forgent`), reading only.

## Context

Reader semantics change at the first snapshot (plan, "Reader semantics that change"): the new value is the standard plus project plus global, validated whole. Slice D's equivalence check compares the new files with the old JSON **both read through the new rules**, so it cannot show what the cutover itself changes for a project. This sweep can, because the old Node readers still exist on the branch. It also sizes the test-fixture work (G5 made the helper the single writer, but the fixtures it writes were never validated by the strict snapshot).

## Part 1: effective-value parity per project

For each project root and the machine's global file:

1. **Old effective value** with the branch's old code: for every top-level section named by a registered default (`rg registerConfigDefault`, plus `runner`), `mergeWithGlobalConfig(readSharedConfig(root))[section]`; for `runner` the loader's own result (`loadRunnerConfigFromDir(root)`, which applies `sanitizeGlobalLayer`, `stripConfigComments`, normalisation), account inventories excluded (they move separately and are never printed).
2. **New effective value:** facade `readConfig({ projectRoot, sections })` plus the same normalisations where the loader applies them.
3. Compare as Canonical JSON (`canonicalJson` from the door) per section; on a difference list **paths only**, never values, in four classes: `added-by-standard` (the new value has an entry the old one lacked: expected for stale catalogs), `dropped-by-rule` (old value present, new absent because the global sanitiser used to drop it silently and the scope or schema now refuses it, or because `$comment` is stripped), `changed` (same path, different value: **each one is a finding for the owner**), `refused` (the snapshot refuses the file: id, file, line, column, path).
4. For every project also record `fgos config migrate --dry-run` (D) output counts: values dropped as equal to the standard, machine-override paths needing `--accept-machine-overrides`.
5. Report: one table per project (counts per class, the path lists capped at 60 with the total), plus the machine's global file `check` result (ids and paths).

Expected and acceptable: `added-by-standard` for projects with a short seeded `runner` (most projects other than this one), `$comment` removal, `rigorToTier` becoming a named refusal where the global file still holds it (owner action from B's D10). Not acceptable without the owner: any `changed` path; any `refused` project. Each unacceptable line becomes an item (migrate that project first, fix the global file, or a schema question to Config's owner), and phase 20 cannot pass while one is open.

## Part 2: fixture refusal census

1. In scratch (uncommitted patch), make `test/helpers/config-fixture.mjs`'s writers call `checkConfig` on the file they just wrote and append `{ test file, refusal ids and paths }` to a log under `.fgos/runtime/tmp/`.
2. Run `npm test` once through the launcher (after `free -g`; sequential; PID waited on). The 18 known red cases are recorded as a baseline.
3. Count distinct test files whose fixtures the new snapshot refuses, grouped by id (`config-schema`, `config-key-out-of-scope`, `config-key-in-wrong-file`, unknown executor shapes) and by fix kind (fixture is incomplete, fixture is wrong, test intends an invalid config and asserts the refusal). Also count tests that read the config bytes raw (21 by phase 00's count) and tests asserting write-on-read.
4. Put the numbers in the report with a re-estimate of phase 18 (planned 12h). If the refused files are more than 120 or the re-estimate is more than 20h, stop and report in the decision-question template before phase 18 is scheduled (options: more parallel agents, a fixture builder that starts from the standard, splitting 18 per test directory).

## Steps

1. Merge `origin/main` into `cfg/slice-c`; confirm D and landing B are in; `free -g`.
2. Write the two scripts in scratch (not committed); run Part 1 on each machine for its projects (reading `HOME`'s real global file, writing nothing); run Part 2 on the build machine.
3. Write the report; post a board line with the counts and the open items; `SendMessage` nothing to other lanes yet (phase 18 does).

## Owning proof

None (one-off evidence). Phase 21 re-runs Part 1 on this repository against the real migrated file.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| The old and new normalisations differ in a way that shows a false `changed` | M x L | compare after the same `normalizeConfigConfinement`; investigate each `changed` before reporting it |
| The sweep prints a value (a token, an account) | L x H | paths only; account and token keys are skipped by name; the script is reviewed before its first run |
| The census run is long and heavy | M x M | one run, sequential, `free -g` first |

## Rollback

Nothing to roll back (scratch and a report).
