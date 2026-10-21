---
title: "Test governance phases 2-3: Node-vs-Rust port inventory and use-case extraction for the slowest files"
description: "Retire Node copies of Rust-owned cases in the five ported areas (one route proof per port stays), then move business cases of the slowest CLI-spawn files into direct use-case tests with one CLI parity test per verb."
status: in-progress
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

**Lifted 2026-10-21:** Git 07–08 landed on both machines; the list below is history.

Until branch `git/p07-switch` and its sub-branches land, do not edit or delete: `test/setup/*`, `test/githooks/*`, `test/holder-lock/*`, `test/workflow/*`, `test/git/*`, `test/runner/merge*`, `test/runner/worktree*`, `test/runner/session*`, `test/runner/loop*`, `test/runner/claim*`, `test/runner/execution/*`, `test/direct/merge-gate*`, `test/scripts/*`, `test/cli/fgos-merge*`, `test/state/events-*`, `test/state/drift-status*`. Work on those areas is a separate batch after the landing, re-based on the post-landing tree. First item of that batch: the 59 `test/setup` clones listed in the phase 0-1 report.

## Received items and owner decisions (2026-10-21)

Every item this lane took on is listed here until it closes; a row closes only with its commit. Owner `forgent-f8` since 10-21 15:40 ([handoff](../reports/handoff-261021-1519-test-lane-governance.md)). Rows H1–H5 are the HARDEN hand-off ledger in `plans/261021-1118-harden-low-layers-bottom-up/plan.md`; HARDEN closes each only on TEST's confirmation.

| ID | Item | Source | Decision | State / trigger |
|---|---|---|---|---|
| RS5 | Apply the 5 decided run-supervisor retirements | [phase 2 report](../reports/phase-lead-261021-1129-test-governance-p2-ported-areas.md) §4 | decided by the phase lead | **done** main `4bb8058dc`: npm test 8774/0 fail, cargo 1219/0, coverage map 0 sources lost |
| D1 | Six behaviours no test notices (report §6) | phase 2 report §6 | owner 10-21 15:49, option (a): add owning proofs for ES-R4 (`sync --no-push` pushes) and ES-R5 (`porting/` root) in the event-store crate, RS-N4 (`attempt-still-running` code) and RS-N6 (held controller keeps the unit `running`) in the Node run-supervisor tests; delete the duplicate JS rank check (ES-N1, native is the one authority); keep the retained-view cache (ES-N5) only if a measurement shows it saves work, else delete it | **done** on main with this batch ([report](../reports/phase-lead-261021-1759-test-governance-guards-claude-and-help-routes.md) §3): ES-R4, ES-R5, RS-N6 owned; ES-N1 deleted; RS-N4 no reader of the code; ES-N5 kept (137 vs 274 ms) |
| D2 | Reading of "contract-prose" | phase 2 report §9 | owner 10-21 15:49, option (a): narrow. A contract lint stays while it is the only thing that catches the contract file contradicting itself; prose retires only when every behaviour it describes has an owner | applies to git and holder-lock in phase 2 |
| H1 | "Test cost of the change" line in every lead brief and phase file: tests added and retired (`suite:` line), new CLI/host spawns, one CLI call's cost before/after (`fgos --help`, `fgos list`); a new CLI-spawning test says why a lower layer cannot prove it | [HARDEN test investigation](../reports/research-261021-1210-harden-test-suite-investigation.md) §8 | owner 10-21 15:49: adopt | **done** ([report](../reports/phase-lead-261021-1759-test-governance-guards-claude-and-help-routes.md) §5): `suite:` change line, admission warning for an unexplained CLI spawn, `--cli-cost`, and the `fgos-run` §4 review checklist asks for them (owner 18:13) |
| H2 | Run test files longest-first from the last junit | HARDEN investigation §3, §8 | owner 10-21 15:49: adopt; **replaced 10-21 17:3x, option (c)**: `node --test` sorts files by name itself (checked on Node 24), so ordering needs a `run()`-based driver replacing the suite's core door (~150–250 lines), outside the approved cost | **Parked with a trigger:** after phase 3 makes the slow files cheaper, re-measure the suite tail; if one file still holds the tail alone, ask the owner again with option (a) |
| H3 | Debug vs release staging of the test host and addon | HARDEN investigation §3, §8 | owner 10-21 15:49: **not now** | **Parked with a trigger:** when HARDEN ledger H13 lands (T9/Packaging: each CLI call verifies the release once, so the suite stops hashing the debug addon in every process; owner 10-21 17:43 OQ-3 (c) kept this out of T0), re-measure one CLI call in the suite (`fgos --help`, `fgos list`, debug vs release); if release still saves more than about 20% of CLI-file time, bring the option back to the owner as a decision question. Also listed in the board TEST row "waits" column |
| H4 | `test/rust-host/fgctl-*` call the real `claude` CLI and the network (no `FGOS_CLAUDE_COMMAND`) | HARDEN investigation §4, §7 | in frame (regression of the 08-27 `NO_CLAUDE_ENV` fix); TEST decides | **done** ([report](../reports/phase-lead-261021-1759-test-governance-guards-claude-and-help-routes.md) §4): `buildTestEnv` keeps every suite process off the real claude CLI; a logging shim saw 0 calls in a full run (11 before); the per-file string lint retired |
| H5 | `test/rust-host/help-routes.test.mjs` 119 s: cases spawn `FGOS_HOST_BIN` directly as `internal-routes.test.mjs` does; one case keeps the dev door | [T0 arbitration](../reports/council-261021-1507-harden-t0-arbitration.md) §3 | in frame (phase 3 slow file) | **done** ([report](../reports/phase-lead-261021-1759-test-governance-guards-claude-and-help-routes.md) §5): 95 s → 14 s alone, same five tests |
| P2G | Phase 2, git | [git report](../reports/phase-lead-261021-1845-test-governance-p2-git.md) | phase lead | **done** main `55428cf6b`: 3 retired with owners, 12 route proofs, 10 mutations all caught; gates green |
| P2H | Phase 2, holder-lock | [holder-lock report](../reports/phase-lead-261021-1845-test-governance-p2-holder-lock.md) | phase lead | **done** main `ff24dbde3`: 4 tests and 15 generated vector cases retired with owners, 19 mutations; gates green; baseline refreshed (8084 `test()` calls) |
| W1 | `land:132` "staged overlap refuses before CAS" is a regression witness (fix `ab852c202`) and mirrors Rust | git report | in frame | **done** main `8815bdb81`: the staged case and its kept index bytes are in Rust `dirty_own_paths_block_before_cas` (skipping staged-only entries fails it); Node copy retired |
| D3 | Holder-lock behaviours no test notices: HL-N1 (`runBorrowed` gc/maintenance guard), HL-N7 (`workerBaseEnv` keeps `FGOS_LOCK_FD`), HL-N8/N9 (two bytes-equal checks in `src/state/hot-lock.mjs`) | holder-lock report §7 | owner 10-21 20:5x, option (a): TEST adds owning proofs for HL-N1 and HL-N7; HL-N8/N9 go to HARDEN T1 as a ledger item (needs a process race) | **done** main `24d39b760` for HL-N1 and HL-N7 (each fails under its mutation); HL-N8/N9 recorded by HARDEN as R1 (T1), `5b2a57a77` |
| D4 | 53 git behaviours in Rust code owned only by Node tests | git report | owner 10-21 20:5x, option (a): move them down only for git test files in phase 3's slowest 20; write the Rust test first, check it with the mutation, then retire the Node copy | inside phase 3 |
| S1 | Partial duplicates in `test/setup/holder-lock-checks.test.mjs` (:113, :204, :223, :365) | holder-lock report §7 | in frame; holder-lock-adjacent, HARDEN asked to be pinged first | with the 59 `test/setup` clones |
| — | 1 000-iteration loops in `packages/process/rust/tests/containment_*.rs` | T0 arbitration §5 | stays with HARDEN T0 (its crate's tests) | not TEST's; listed so it is not lost |

Order now: W1 and D3 → phase 3 (with D4) → the 59 `test/setup` clones (with S1). H2 and H3 wait for their triggers.

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
