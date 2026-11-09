---
phase: 11
title: "Domain-dirs door: one listDomainDirs in a src/util leaf replaces the repeated readdirSync(domains) walks in the T8, T5 and T6 callers in the same change; the WORK caller becomes a filed item"
status: pending
depends_on: [01, 02, 03, 06, 07, 08]
parallel: "group D, alone: one import and call per caller file"
effort: ~0.5d
net_size: "Node about -25 / Rust 0 / tests about +25 (estimate)"
---

# Phase 11 - Domain-dirs door (T8-20, Q7 a)

## Context

Owner decision 79 Q7 (a): "`listDomainDirs` moves the T8, T5 and T6 callers; an item for WORK's `domain-registry.mjs`". L10: a new door lands with its callers, the old paths go in the same change. Speed seat: the walk costs under a millisecond, so there is **no speed claim**; this is one door instead of many (RUL11), and the loops differ subtly (some sort, some do not; some filter files, some do not).

Callers on `87e4d1e6f`, after P01 has deleted the Gemini loops:

| Caller | Walk | Owner |
|---|---|---|
| `src/setup/skill-wrappers.mjs` | the loops `assembleSkills`/`discoverCanonicalSkills`/`discoverSharedFragments` still reach (`:700`, `:918` today; the `:451,479,956` ones are in code P01 deletes) | T8 |
| `src/setup/instruction-registry.mjs:679` | | T8 |
| `scripts/build-domain-registry.mjs:49` | | T8 |
| `scripts/project-agents.mjs:122` | | T8 |
| `src/setup/registrations.mjs:782,1129` | two loops | T5 (HARDEN) |
| `src/runner/agent-roster.mjs:48` | | T5 |
| `src/runner/dispatch/operation-prompt-templates.mjs:223,300` | two loops | T5 |
| `src/runner/agent-definitions.mjs:45` | | T5 |
| `src/workflow/loader.mjs:30` | | T6 (HARDEN, closed) |
| `src/state/domain-registry.mjs:72` (`loadDomainsFromDisk`) | | **WORK: filed, not edited** |

Re-run `rg -n "readdirSync\(.*domains" src scripts bin` before starting; the table above is the expected set.

Reused doors: `src/util` leaves (`docs/architecture-manifest.json:198-202` registers `format-bytes`, `normalize-path`, `git-paths` as `kernel`); the new leaf joins them. A new module is allowed a new test file (principle 8).

## Requirements

1. **The leaf.** New `src/util/domain-dirs.mjs`: `listDomainDirs(root)` returns the sorted domain directory names under `<root>/domains` (a directory, not a file or link; `[]` when `domains/` is absent). Imports only `node:fs`/`node:path` (a kernel leaf: it must not import any layer above). Register it in `docs/architecture-manifest.json` as `kernel` in the same commit.
2. **Callers.** Each row above except WORK's replaces its walk with an import and call. Where a caller did **not** sort and now receives a sorted list (RT-6), list it in the report and name the test that proves no result depended on directory order; where a caller filtered by something the leaf does not (a `registry.yaml`, a `skills/` subdir), keep that filter at the call site, not in the leaf.
3. **No second path.** After: `rg -n "readdirSync\(.*domains" src scripts bin` returns only `src/state/domain-registry.mjs` (WORK) and the leaf.
4. **WORK item.** Mint a backlog id (`fgos identity mint backlog`, never hand-numbered), add the row to `docs/backlog.md`: "WORK: `src/state/domain-registry.mjs:72` loops over `domains/` by hand; move to `listDomainDirs`", and post one board line. No edit to a WORK file. WORK is told before this merges (the callers `loader.mjs` and `agent-definitions.mjs` feed Work's runtime).

## Files

**Create:** `src/util/domain-dirs.mjs`; `test/util/domain-dirs.test.mjs` (owning proof: sorted, skips files and links, absent `domains/`, empty `domains/`).

**Modify:** the nine caller files above (one import and one call each, plus the deleted loop); `docs/architecture-manifest.json`; `docs/backlog.md` (one row); `CHANGELOG.md` only if user-visible (it is not); census for hashed files.

**Delete:** the 11 hand-written walks.

**Tests to retire:** none expected; a caller test that relied on unsorted order would be named and fixed, not deleted.

**Cross-lane one-liners:** the five `src/runner`/`src/workflow`/`src/setup` callers are other tracks' files in HARDEN's closed layers (T5, T6): allowed by L10, one line each, named in the commit body. `src/state/domain-registry.mjs` is untouched.

## Red tests first

`test/util/domain-dirs.test.mjs` red before the leaf exists; the architecture test red if the manifest row is missing (the guard exists: `test/architecture.test.mjs`).

## Net size

Node about -25 (11 walks of 3-8 lines each replaced by one 8-line leaf and 9 one-line imports), tests about +25.

## Steps

1. Re-scan callers; list sort behaviour per caller.
2. Leaf, test, manifest row; then the nine callers.
3. Backlog row and board line; WORK told.
4. Report: before/after `rg` output, sort-behaviour table.

## Validation (focused)

- FR `test/util/domain-dirs.test.mjs test/architecture.test.mjs test/setup/skill-wrappers.test.mjs test/setup/checks.test.mjs test/scripts/project-agents.test.mjs test/state/domain-registry-compiled.test.mjs test/workflow/workflow-loader-persona-scope.test.mjs` plus the agent-roster, agent-definitions and operation-prompt-templates tests (find them: `ls test/runner | grep -i "roster\|agent-def\|prompt-templ"`).
- `node scripts/git-one-door-scan.mjs --root .`; full land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| RT-6: a caller depended on unsorted directory order | M x M | Sort-behaviour table; the focused set covers every caller; a dependent caller keeps its own order at the call site |
| Touching T5/T6 files collides with an open lane | L x M | Board line before the window; one-line edits rebase cleanly |
| WORK's runtime and the doctor row now disagree on a domain list | L x M | The leaf's rule is the same as what `loadDomainsFromDisk` does for directories; the WORK item closes the last difference |

## Rollback

Revert the merge commit.

## Done when

One door; two matches left in `rg` (WORK's file and the leaf); WORK backlog row and board line posted; manifest row in; guide section written.

## Lead brief essentials

One import and one call per caller; no behaviour change; do not touch WORK files. All plan.md lead rules apply.
