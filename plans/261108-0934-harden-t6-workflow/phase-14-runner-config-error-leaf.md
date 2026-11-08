---
phase: 14
title: "RunnerConfigError moves to an import-free leaf; every importer, source and test, moves in one mechanical commit with no re-export"
status: pending
depends_on: ["01-13 landed", "announced quiet window with no open branch on the importers"]
parallel: "wave 5, alone"
effort: ~0.5d
net_size: "Node +2 / Rust 0 / tests 0 (estimate)"
---

# Phase 14 — `RunnerConfigError` leaf (simplicity 9)

## Context

Arbitration §2.1 simplicity 9 ("`RunnerConfigError` moves to an import-free leaf beside `config.mjs`; all 45 importers move in one mechanical commit (L10), no re-export"), §3 (T5 file; board line before the sweep, "which every open branch will feel"). The ledger, the lowest Workflow file, imports the 2 105-line dispatch config for one class (`store.mjs:7`, `case-lock.mjs:7`, `case-runtime.mjs:12`, 16 files in `src/workflow`).

Counted on `595faa273`: declared `src/runner/dispatch/config.mjs:204`; 45 files in `src bin scripts` name it (43 import lines), 33 test files. Lower layers do not import Dispatch (`test/architecture.test.mjs:185`), so the leaf's importers are Dispatch and above only; the lead confirms no lower-layer importer appears.

## Requirements

1. New import-free leaf in `src/runner/dispatch/` (name chosen by the lead, kebab-case, e.g. `runner-config-error.mjs`) holding the class unchanged; `config.mjs` imports it for its own throws and does not re-export it.
2. Every importer in `src`, `bin`, `scripts`, `test` imports the leaf; one mechanical commit; `docs/architecture-manifest.json` row for the leaf; architecture test green.
3. Board line before the window; run only when no open branch edits those files (`git for-each-ref` of open lane branches against the file list, read by the big lead); OPC reviews the diff (it crosses Git-area files).

## Files

**Create:** the leaf.

**Modify:** `src/runner/dispatch/config.mjs`, the 45 source files and 33 test files that name the class, `docs/architecture-manifest.json`, census.

**Delete:** the class from `config.mjs`.

**Tests to retire:** none.

## Net size

Node +2 (leaf header); imports change in place.

## Steps

1. `rg -l "RunnerConfigError" src bin scripts test` → list; board line with the list. 2. Leaf; sed-style import rewrite reviewed per file. 3. `git diff --stat` shows only import lines and the two files. 4. Full suite.

## Validation

- `rg -n "RunnerConfigError.*config\.mjs" src bin scripts test` → nothing; `node --check` over changed files; `test/architecture.test.mjs`; full suite.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Collides with every open branch (RT-7) | M × M | Last code phase, announced window, OPC review |
| `instanceof` across two class copies | L × H | One class, no re-export; `rg` proves a single declaration |

## Rollback

Revert; no on-disk change.

## Done when

One declaration; all importers moved; landed in the announced window; guide section (one line: no user-visible change).

## Lead brief essentials

Mechanical only; nothing else in the commit. All plan.md lead rules apply.
