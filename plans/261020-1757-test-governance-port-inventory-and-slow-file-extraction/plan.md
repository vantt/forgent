---
title: "Test governance phases 2-3: Node-vs-Rust port inventory and use-case extraction for the slowest files"
description: "Retire Node copies of Rust-owned cases in the five ported areas (one route proof per port stays), then move business cases of the slowest CLI-spawn files into direct use-case tests with one CLI parity test per verb."
status: pending
priority: P2
effort: 5-8 agent-days
branch: chore/test-governance-p2-p3
tags: [test, governance, cleanup]
created: 2026-10-20
---

# Test governance phases 2-3

- **Implements:** [counsel](../reports/counsel-261020-1658-test-suite-growth-rule.md) §4 phases 2 and 3, owner answers DQ1 (c) and DQ2 (a) of 2026-10-20 17:47.
- **Follows:** [phase 0-1 report](../reports/phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md) (mechanism, fresh profile, clone list).
- **Doctrine:** AGENTS.md L5 q5, design principle 8 **One proof**, `docs/platform/git/spec.md` §15 E6, review checklist in `core/skills/fgos-run/SKILL.md` §4.

## Hard constraint: Git 07 files

Until branch `git/p07-switch` and its sub-branches land, do not edit or delete: `test/setup/*`, `test/githooks/*`, `test/holder-lock/*`, `test/workflow/*`, `test/git/*`, `test/runner/merge*`, `test/runner/worktree*`, `test/runner/session*`, `test/runner/loop*`, `test/runner/claim*`, `test/runner/execution/*`, `test/direct/merge-gate*`, `test/scripts/*`, `test/cli/fgos-merge*`, `test/state/events-*`, `test/state/drift-status*`. Work on those areas is a separate batch after the landing, re-based on the post-landing tree. First item of that batch: the 59 `test/setup` clones listed in the phase 0-1 report.

## Rules for every batch

- `npm test` and `cargo test --workspace` green before and after; quote the `suite:` line both times.
- `node scripts/test-select-coverage-map.mjs` before and after: no source file loses its last covering test.
- At most one area or 60 tests per PR.
- Before retiring a test: `git log -S'<title words>'`. A test born in a bug-fix commit is a regression witness; its case moves into the owning proof instead of disappearing.
- Every retired test is listed with the test that now owns its behaviour, or with "behaviour removed". Delete, never `skip`.
- New test files start with `import '../helpers/process-tmp-root.mjs';` (path relative to the file).

## Phase 2: per-port Node-vs-Rust inventory (DQ2 (a))

| Area | Node tests (files) | Rust `#[test]` | Node files reading `packages/*/contracts` | Batch |
|---|---:|---:|---:|---|
| event-store | 70 (19) | 150 | 4 | now |
| run-supervisor | 143 (23) | 136 | 2 | now |
| terminal-control | 19 (3) | 88 | 0 | now |
| git | 92 (22) | 202 | 0 | after Git 07 lands |
| holder-lock | 110 (20) | 74 | 4 | after Git 07 lands |

Steps per port:
1. List Rust tests (`cargo test -p <crate> -- --list`) and Node titles side by side.
2. Label each Node test: **owns** (Node-only behaviour: facade errors, Node lifecycle, JS-side validation), **route** (the one wiring proof that the Node route reaches the Rust port), **mirrors-Rust** (name the Rust test), **contract-prose** (asserts the wording of a contract file, no behaviour).
3. Mutation spot-check, 3-4 seeded mutations per port in the Rust port and in the Node facade, using the `scripts/test-select-mutate.mjs` approach: a mutation only Rust catches confirms the Node copy is redundant; one only Node catches makes that Node test a route or owns proof, keep it.
4. Retire mirrors-Rust and contract-prose tests; keep exactly one route test per port plus every owns test. Record the labels in the E6 inventory format of Git spec §15 (retired rows carry the owning `file:test`).

Done when: each port has one route test, every Node test carries a label, the retired list names an owner per row, mutation evidence is attached.

## Phase 3: use-case extraction for the slowest files (DQ1 (c))

Order: slowest first from the fresh profile in the phase 0-1 report (top 20 there). Skip any file in the Git 07 set until it lands; the Cartesian clusters (`fgos-merge*`, `approve-1..6`, `intake-1..6`, `read-1..4`, `operation-choice`) keep their enumeration, only their slow business cases move.

Per file:
1. Find the use-case function the verb already exposes (`src/verbs/*`, `src/runner/*`). None exposed: stop for that file and report it; do not add a seam just for tests.
2. Move the business cases into direct tests in the module's existing test file, or `test/direct/<verb>.test.mjs` following the existing `test/direct/` pattern.
3. Keep one CLI parity test per verb (argv parsing, exit code, JSON envelope); retire the CLI permutations of the moved cases, each naming its new direct test.
4. Re-measure the file's wall time and the suite's; update `test/suite-baseline.json` (`node scripts/test-proof-inventory.mjs --write-baseline --wall-seconds <s>`) in the same commit.

Done when: the top-20 files outside the Git 07 set are each extracted or reported as having no use-case seam; `npm test` wall time is re-measured on the reference machine. If it stays above about 5 minutes there, raise the pairwise-generator question (DQ1 option b) with the owner.

## Risks

- A CLI-level regression witness disappears with a permutation: mitigated by the `git log -S` rule.
- Node becomes the only route if the combined addon route is abandoned (E3 reversal trigger): retired Node cases come back from git history.
- The twin of a deleted clone may itself be retired later by Git 07 (for example `test/runner/merge.test.mjs`): the Git 07 E6 inventory must name an owner for it.

## Rollback

Each batch is one revertable commit; deleted tests come back with `git revert`.
