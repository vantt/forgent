---
phase: 08
title: "Domain build: one function decides whether a compiled domain matches its YAML (also orphans), used by build-domain-registry --check, the doctor row and the test; a duplicate workflow key is refused"
status: completed
depends_on: ["06 landed for the registrations.mjs line only"]
parallel: "group B; script and test work may start at once, the one import in registrations.mjs waits for 06"
effort: ~0.5d
net_size: "Node about +10 / Rust 0 / tests about +10 (estimate)"
---

# Phase 08 - Domain build (T8-14, T8-23 code)

## Context

Arbitration T8-14: `scripts/build-domain-registry.mjs:47-54` and the doctor row body `checkDomainRegistryCompiled` (`src/setup/registrations.mjs:1124`, domain walk at `:1129`) walk `registry.yaml` directories only, while `loadDomainsFromDisk` (`src/state/domain-registry.mjs:72`, WORK's) loads **every** `compiled.json`. A compiled domain with no `registry.yaml` (an orphan) is never judged. T8-23: `build-domain-registry.mjs:41` keys workflows by basename, so `x.yaml` and `x.yml` collide silently. The script is 79 lines (budget ≤ 95).

Reused doors: the script's own compile function (`--check` already compares compiled with YAML), the row's existing id `domain-registry-compiled` and its sibling `domain-workflow-operations-coverage` (unchanged). The domain walk itself becomes `listDomainDirs` in P11 (this phase keeps the current walk).

## Requirements

1. **One `checkCompiledDomains`** exported from `scripts/build-domain-registry.mjs`: for every domain directory that has a `compiled.json` or a `registry.yaml`: both exist, and `compiled.json` equals the compile of its YAML; returns the findings. `--check`, the doctor row and the test all use it.
2. **The doctor row imports it** (one import and call in `checkDomainRegistryCompiled`; the row id and the "no domains" skip behaviour stay). `src/setup/registrations.mjs:35` already imports `compileDomain` from this script, and the script runs its body only when it is the entry point (`:61`), so the import direction and the layering guard are settled; the new export sits beside `compileDomain`.
3. **Duplicate key refused.** Two workflow files with the same key (`x.yaml` and `x.yml`) make the build throw, naming both files.
4. **Orphan finding.** A `compiled.json` whose domain directory has no `registry.yaml` is a finding (the doctor row and `--check` fail with the domain named).
5. Budget ≤ 95 lines for the script.

## Files

**Create:** `test/scripts/build-domain-registry.test.mjs` only if WORK refuses the one case in its file (WORK told first); otherwise none.

**Modify:** `scripts/build-domain-registry.mjs`; `src/setup/registrations.mjs` (`checkDomainRegistryCompiled` only, after P06 landed); `test/state/domain-registry-compiled.test.mjs` (WORK's file: **one** case, WORK told before merge) or the new test file; `CHANGELOG.md` only if user-visible (a doctor row judging orphans: one line); census.

**Delete:** the row's own walk of `registry.yaml` dirs.

**Tests to retire:** none; the existing row cases stay and gain the shared function.

**Cross-lane one-liners:** `test/state/domain-registry-compiled.test.mjs` is WORK's: at most one case, WORK told.

## Red tests first

- An orphan `compiled.json` (no `registry.yaml`) makes the doctor row fail (red today: not walked).
- `x.yaml` plus `x.yml` makes the build throw naming both (red today: silent last-wins).
- `--check` reports the same set the row reports (one function).

## Net size

Node about +10 (T8-14 +8, T8-23 +2); tests about +10.

## Steps

1. Callers of the two walks by `rg`; confirm the existing import at `registrations.mjs:35`.
2. Red tests; shared function; row import after P06 lands; duplicate key.
3. WORK told (message) before merge; census; report.

## Validation (focused)

- FR `test/state/domain-registry-compiled.test.mjs test/setup/checks.test.mjs test/architecture.test.mjs test/state/domain-registry.test.mjs` (the last is WORK's: run, never edit).
- `node scripts/build-domain-registry.mjs --check` on the real tree: green. Land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The orphan finding turns an existing tree red | L x M | Run `--check` on the real tree first (today `domains/coding` has both files); only a real orphan fails |
| WORK refuses the case in its test file | M x L | The new `test/scripts/build-domain-registry.test.mjs` takes it (principle 8 allows a new file for a behaviour with no owner) |
| The shared function is imported by a setup row | L x L | Same direction as the existing import at `registrations.mjs:35`; `test/architecture.test.mjs` runs in the focused set |

## Rollback

Revert the merge commit.

## Done when

Orphan and duplicate-key cases green; the row, `--check` and the test share one function; row id and count unchanged; WORK told; guide section written.

## Lead brief essentials

Do not edit `src/state/domain-registry.mjs`. All plan.md lead rules apply.
