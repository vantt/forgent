# RESEARCH.md -- tsk-3wl5: khao sat tum lum ngoai dispatch

## Round 1 -- 2026-08-18 (discovery)

Asked: item description gives an explicit file list, methodology, and boundaries. Is there genuine ambiguity blocking a clear discovery verdict, or is scope fully resolvable from item text plus a repo scout?

Checked:

1. Which files are in scope. Item text sums to exactly 15500 across the first 8 lines of its own table (4201+2204+1996+1534+1471+1447+1369+1278). src/intake/plan.mjs (1027) is a 9th line, not part of that sum, but IS part of the list the per-file instructions point at (each file in the list above except dispatch.mjs). Resolved: 8 files in scope (9 listed minus dispatch.mjs, already owned by tsk-2uf-1).

2. Current line counts, re-measured live 2026-08-18 (tsk-2uf-1 merged since item was written):

| File | Lines (item claim) | Lines (live) |
|---|---|---|
| bin/fgos.mjs | 4201 | 4215 |
| src/setup/registrations.mjs | 1996 | 2071 |
| src/runner/loop.mjs | 1534 | 1534 |
| src/state/store.mjs | 1471 | 1471 |
| src/runner/merge.mjs | 1447 | 1447 |
| src/runner/worktree.mjs | 1369 | 1369 |
| src/cli/command-registry.mjs | 1278 | 1278 |
| src/intake/plan.mjs | 1027 | 1027 |
| src/runner/dispatch.mjs (owned, excluded) | 2204 | 61 (barrel re-export) |

Drift is minor except registrations.mjs (+75) and dispatch.mjs (2204 to 61, confirms tsk-2uf-1 landed for real).

3. tsk-2uf-1 own template, live on disk: src/runner/dispatch/cli.mjs, config.mjs, mechanism.mjs, prepare.mjs, resolve.mjs, transport.mjs (600/832/96/154/316/350 lines, sum 2348), matching CONTEXT.md D7 6-concern claim exactly. Concrete precedent to cite for what a consolidated module split looks like: concern-named files, old path kept as a barrel re-export so importers do not change, split sizes ranging 96-832 lines (splitting does not need equal-size files, it needs concern-clean ones).

4. Per-file signal gathering (function count / test-file bloat / churn -- the pain signals the item names besides tool-breakage):

| File | Top-level fns | Test lines (files) | Churn (rev-list --count) |
|---|---|---|---|
| bin/fgos.mjs | 46 | 12666 across 22 files (test/cli/fgos-*.test.mjs) | 358 |
| src/setup/registrations.mjs | 59 | 399 (1 file) | 65 |
| src/runner/loop.mjs | 19 | 2017 (1 file) | 63 |
| src/state/store.mjs | 39 | 1261 (1 file) | 90 |
| src/runner/merge.mjs | 25 | 1852 (1 file) | 49 |
| src/runner/worktree.mjs | 33 | 1415 (1 file) | 36 |
| src/cli/command-registry.mjs | 0 (single COMMAND_REGISTRY array literal) | 138 (1 file) | 122 |
| src/intake/plan.mjs | 12 | 1644 (1 file) | 8 |
| src/runner/dispatch.mjs (reference point) | n-a | was the 175K-mentioned file pre-split | 70 |

command-registry.mjs churn (122) is HIGH but homogeneous -- every hit sampled is add-one-command-row, the single-concern data-table case the item own boundary #4 names as the wrong thing to consolidate (consolidating a registry is patching backwards). plan.mjs churn (7) is the lowest of the eight by a wide margin -- not a live pain signal today despite its size.

bin/fgos.mjs is the standout on every signal at once: highest churn (358, 3-5x the next files), most fragmented test coverage (22 separate test/cli/fgos-*.test.mjs files instead of one file-matching test, for 19-plus visibly unrelated CLI verbs -- approve, claim, edit, gate-approve, handoff, help, intake, iron-law-gate, manifest, merge, move, post-merge, read, return, review-pr, setup, stage, tool, version), and the only file in the set with an already-documented tool-breakage citation (this repo own CLAUDE.md: GitNexus indexes zero Function symbols for it, tsk-38h).

All numbers in this table were re-verified independently (`grep`/`wc`/`git rev-list --count`) during the review pass on 2026-08-18, after an earlier round of hand-transcription introduced small drift (off-by-a-handful on several churn/function-count cells, and a 21-vs-22-file miscount on bin/fgos.mjs's own test fragmentation). Corrected in place rather than left standing, since this table's whole point is being measured, not felt.

5. Where the roadmap doc belongs. No Plan Location section exists in docs/routing-handoff-contract.md (checked, not found). This repo actual live convention (dozens of examples under docs/history/feature-name/) is a feature-named folder holding CONTEXT.md / plan.md / RESEARCH.md. This item own deliverable (roadmap plus notes on what NOT to consolidate) fits that shape directly -- no new convention needed.

Verdict: clear. Every point above resolves from the item own text plus a direct repo scout (line counts, precedent module split, test-and-churn signals, doc-location convention) -- no gap needs a person judgment call. Classification: kind reads as task (a survey plus roadmap deliverable that spawns ordered child work, not a defect fix, feature, or docs-only change); risk and tier stay standard (unchanged from submit).
