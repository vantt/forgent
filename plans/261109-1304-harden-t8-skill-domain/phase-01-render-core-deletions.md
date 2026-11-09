---
phase: 01
title: "Render core, deletions first: retire the 63 reference-model and retired-skill tests, delete the Gemini generator and adapter classifier with its 24 tests (Q1 a), remove the two no-op options, so the file every later commit touches is about 600 lines smaller"
status: pending
depends_on: []
parallel: "group A, chain head; P02 and P03 (edit) follow on the same file"
effort: ~1d
net_size: "Node about -620 / Rust 0 / tests about -3 030 (estimate)"
---

# Phase 01 - Render core: deletions (T8-03, Q1 a, T8-16, T8-19)

## Context

Owner decision 79 Q1 (a): "delete the Gemini package generator and its tests, fix the Packaging contract". Arbitration T8-03 (63 tests of a reference model no production code calls and of skills deleted on 2026-10-01), T8-16 (a latent throw in `discoverCanonicalSkills` that falls out of Q1), T8-19 (`checkDuplicates`/`checkCollisions` options only tests pass `false`). Lead decisions L-3 (retire the 63 without waiting for TEST) and L-2 (no new spec file).

Prior art (re-run before deleting): `git log -S'generateGeminiSkillPackage' -- src` shows the generator added 2026-09-14 (`5769cb9e7..dcb97a9aa`) and never given a caller; `git log -S'fgos-code-panel' -- test/setup/skill-wrappers.test.mjs` shows the retired-skill tests outlived their skills (`6527596eb`, 2026-10-01). The one live idea in the retired tests ("retired skill names do not return") is owned by `test/runner/dead-vocabulary-guard.test.mjs` (the name list near `:314-318` names `fgos-code-panel`, `fgos-plan-loop`, `fgos-code-change`).

Reused door: `ownedSkillNames` (`src/setup/skill-wrappers.mjs:163`) and `discoverCanonicalSkills` (`:659`) stay; only the Gemini intent/trigger loop inside the latter goes.

## Requirements

1. **Retired-test table first.** Before deleting a test, write the table (retired title -> owning test, or "behaviour removed: <what>") into the phase report and the commit body; the big lead reviews it before the delete commit. Source of truth for the sections: `test/setup/skill-wrappers.test.mjs` (3 862 lines now): the reference-model block from about `:1514` ("no runtime production code calls this" header), the six tests of `fgos-code-panel`/`-change`/`plan-loop` near `:445-516` and `:539-605`, the nine `return; // retired` bodies, and the Gemini tests (about 24). Counts are the arbitration's (87 with Q1 a); the lead re-counts with `awk` and reports any difference.
2. **Gemini gone.** Delete `generateGeminiSkillPackage` (`:1063`), `SKILL_ADAPTER_TARGETS`, `isGeneratedAdapterTarget` (`:552`), `isCanonicalSkillSource` (`:582`), `deriveSkillIntentId` (`:596`), `normalizeGeminiCommandVerb` (`:607`), `geminiCommandPathForIntent` (`:622`), `mapSkillIntentToHostTriggers` (`:630`), the intent/trigger fields and loops inside `discoverCanonicalSkills`, and every helper only that code used (`resolveProjectRoot` `:419`, `hasCanonicalOrAssembledSkill` `:440`, `hasSharedFragmentSource` `:461`, `isGeneratedClaudeSkillWrapper` `:494`, `isMirroredPluginSkill` `:529`, `canonicalSharedRoots` `:948`, `toPosixRelativePath` `:938`, and the packaged-reference rewriters `:944-1062` if the scan shows only the Gemini package reaches them). **Decide by scan, not by this list:** re-run the export and helper scan (`rg -n "<name>" src scripts bin test` per symbol; arbitration §2 method) and keep whatever `assembleSkills` (`:1251`) or `renderSkillSurfaces` (`:1401`) still reaches (`windowsPathCollisionKey` `:61` stays; `discoverSharedFragments` `:864` stays for assembly). Name the scan output in the report.
3. **Dead options.** Remove `checkDuplicates` and `checkCollisions` from `discoverCanonicalSkills`, `discoverSharedFragments` and `assembleSkills` (the JSDoc at `:1243-1250` too). Duplicate and collision refusals become unconditional; the tests that passed `false` are retired with the behaviour (state which).
4. **Contract rows.** Edit the Gemini rows the deletion makes false in `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (`:33`, `:47`, `:64`, `:75`, `:111-115`) and `docs/platform/packaging-distribution/verification/implementation-alignment.md` (the Gemini row): Gemini is "not provided; add through the common render if ever needed". DOC told before merge. The rest of that contract is P13's.
5. **Behaviour that stays identical:** `renderSkillSurfaces` output for this checkout is byte-identical (P12 proves it by a render that writes nothing new for these reasons). No `.agents`, `.claude`, plugin file is edited here.

## Files

**Create:** none.

**Modify:** `src/setup/skill-wrappers.mjs`; `test/setup/skill-wrappers.test.mjs`; `docs/platform/packaging-distribution/contracts/skill-package-distribution.md` (Gemini rows only); `docs/platform/packaging-distribution/verification/implementation-alignment.md` (Gemini row); `CHANGELOG.md` (one line: the unused Gemini package generator is removed); `packages/git/contracts/mutation-census.v1.json` (hash regen); `docs/architecture-manifest.json` only if an export name is listed there (check).

**Delete:** the code and tests above; nothing else.

**Tests to retire (each names its owner in the table before the delete):** the 57 reference-model tests (owner: behaviour removed, no production code called the model; the live idea "retired names do not return" is `test/runner/dead-vocabulary-guard.test.mjs`); the six retired-skill-name tests (owner: `dead-vocabulary-guard.test.mjs`); the nine `return; // retired` bodies (removed); the Gemini tests (behaviour removed with Q1 a); tests passing `checkDuplicates: false` / `checkCollisions: false` (behaviour removed). Tests that stay: every test of `ownedSkillNames`, `renderSkillSurfaces`, `generateAllSkillWrappers`, `mirrorDevSkillsIntoPlugin`, `assembleSkills`, `materializeSkillsIntoProject`, `createProjectSkillGuard`, the drift guard, the duplicate and collision refusals.

**Cross-lane one-liners:** none. Any other file naming a deleted export is found by `rg` and moved in this commit.

## Red tests first

Deletion phase: the red is a recorded scan. Before the code delete, record `rg -c` of the deleted symbols across `src scripts bin test` (callers: tests of this one file, per the arbitration scan), `wc -l`, and the awk test count; after, the same scan returns nothing and `skill-wrappers.mjs` is within 25 lines of 790.

## Net size

Node about -620 (Gemini about -590, options -12, duplicated walks folded where a deleted loop leaves a single one -20). Tests about -3 030 (63 tests about -2 360, Gemini 24 tests about -670). The file budget (≤ 780) is closed by P02.

## Steps

1. Scan, table, board line to TEST and a message to DOC (contract paths above).
2. Delete tests (table reviewed), then code, in two commits; run the focused set after each.
3. Contract rows, CHANGELOG, census.
4. Report with the scan outputs and `wc -l` before and after.

## Validation (focused)

- FR `test/setup/skill-wrappers.test.mjs test/skills/fgos-mirror.test.mjs test/setup/uninstall-wiring.test.mjs test/architecture.test.mjs test/runner/dead-vocabulary-guard.test.mjs test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`
- `node scripts/git-one-door-scan.mjs --root .` -> 0 undeclared.
- Full land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Deleting a helper `assembleSkills` still reaches | L x H | The scan decides; the focused set includes every assembly and render test; a removed helper that a test reached fails red, not silent |
| Weakening a live assertion while retiring a block | M x M | The table names the owner of every retired title; a title with no owner and a live behaviour is kept |
| The contract rows read as dropping a product intent | L x M | Q1 (a) is the owner's decision 79; the rows say "not provided", not "never"; restore is `git revert` plus the common render door |

## Rollback

Revert the phase's merge commit. Nothing generated changed.

## Done when

Retired-test table reviewed; scans clean; `skill-wrappers.mjs` about 790 lines; tests, doc-health and citation guards green; census 0 undeclared; guide section written.

## Lead brief essentials

Delete by scan, not by list; a kept helper is named with the caller that keeps it. All plan.md lead rules apply.
