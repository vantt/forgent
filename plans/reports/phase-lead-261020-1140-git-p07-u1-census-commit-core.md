# Git phase 07 unit 1: census and commit core

Re-plan/census completed; the Unit-core switch is blocked by conflicting preserved contracts. Production `commit-unit-work.mjs` and `unit-sync.mjs` remain unchanged. Nothing is ready for main.

## Completed

- Updated phase 07, the plan dependency table/status/graph and Git spec §§12–13, §16 retirement timing to the owner’s 2026-10-20 11:34 decision: foundation first, Work later. Defined the planned `legacy-event-git-adapter.mjs`, declared-path port mapping and WORK-owned deletion. It is a plan, not an implemented adapter.
- [Census](scout-261020-1135-git-p07-census.md), [machine records](scout-261020-1135-git-p07-census.json), generator `scripts/git-p07-census.py`: 5,486 conservative candidate lines, including wrappers, Rust variable binaries, hook/shell/skill text, fixtures and generated mirrors. Each has a family and owner. Unresolved/non-Git candidates remain visible; this is not a data-flow-complete V-GATE verdict. Native driver wrappers are included.
- Census proposes six ordered waves and file ownership, including shared-file reservations and handovers. All lanes integrate into `git/p07-switch`; no subset reaches main before phase 08. No change to phase 08’s remaining proof gates.
- Investigated native Sync’s classification mismatch: it labels any unchanged-HEAD commit failure `hook-rejected`, whereas the live runner reproduces pre-commit refusal. Unrestricted replay through Git would violate G-062. No speculative patch, new bypass, matcher, lock or recovery policy remains in the final tree.
- [Local E6 inventory](scout-261020-1135-git-p07-census.e6.json): 217 assertions in the inspected legacy/native core tests marked kept; no retired or retargeted assertion. Legacy assertions still exercise legacy code. This is not completed whole-suite E6 migration evidence.

## Blocking evidence and handoff

1. **Literal-path acceptance conflicts.** `test/runner/execution/commit-unit-work.test.mjs:108` requires literal star, tab and newline filenames to commit. `test/git/scoped-commit.test.mjs:181` requires those selected filenames to refuse before staging/WAL, even under `writes: ['**']`. Both suites pass today. Rust `scoped_commit.rs` calls `fgos_scope_literal` on selected paths; a thin adapter cannot preserve legacy acceptance while preserving the native refusal assertions. Prior art: `d2192042a` introduced the named refusal, while `0074f94ae` introduced the dormant port; `75bae4346` deliberately restored evidence-based hook classification in the live runner. Resolve the literal-path contract/E6 conflict before replacing the caller, rather than weakening an assertion or adding a second matcher/path policy in Node.
2. **Owner-authorized Work adapter lacks port support.** `checkpoint_tracked_files` explicitly refuses every `.fgos/` path (`checkpoint-non-event-main-required`), normal ScopedCommit scope protects `.fgos`, and Land must not implicitly sweep it. The planned thin Work adapter therefore needs a typed declared-legacy-event contract in the existing ports before it can be wired. Its implementation belongs to the Work-event/Land sub-lanes, not an implicit raw-Git exception. No adapter or bypass was added here.
3. **Hook evidence conflict.** G-062 allows only identified known-safe guard replay; the live runner replays arbitrary configured hooks. A generic replay through `git hook run` preserves the live classification but violates the retained safety contract; inferring refusal from commit exit status preserves neither. Resolve the approved diagnostic evidence path before switching.
4. **Remaining first-family integration work.** Persist the native preflight baseline and Sync operation ID in the runner record, carry custody into native inspect/resume, translate all existing result/detail fields and preserve clean-start refusal abort timing. Native Sync intentionally leaves a rejected clean merge open (existing native assertion); the live Unit contract aborts it. That translation must be owned by Git, not adapter cleanup. No late baseline fabrication or hook-refusal guess was introduced.

Other independent sub-lanes can advance; this blocks only the Unit-core switch and eventual one-release gate. Recommended next step: settle the contradictory literal-path expectations, then extend the existing typed ports for required compatibility and migrate the whole family together. Do not land this subset as a production switch.

## Verification

Final-tree focused checks:

- `node --test test/git/sync.test.mjs test/git/scoped-commit.test.mjs` — 33 passed, no skipped tests.
- `node --test test/runner/execution/commit-unit-work.test.mjs` — 30 passed, no skipped tests; legacy production implementation unchanged.
- `node --check test/git/sync.test.mjs` and `git diff --check` — passed.
- `python3 scripts/git-p07-census.py --report plans/reports/scout-261020-1135-git-p07-census.md` — regenerated successfully.

`impact-analysis: inactive` (capability query returned zero providers). No full npm test, E3, git add/commit, lifecycle verbs or delegation. MDView preview failed: its database is read-only; no preview URL is available. Board status update is outside the declared write scope: `plans/261017-1313-fgos-platform-program-board/plan.md` must record this Unit-core blocker; it was not edited.

Status: BLOCKED
Summary: Replanned phase 07 and generated a family-owned caller checklist. The first-family migration remains incomplete because preserved literal-path/hook contracts conflict and native compatibility support is still missing.
Concerns/Blockers: No caller switch, completed E6, Work adapter or one-door acceptance is claimed; board status update needs the board write scope.
Context refs:
- (none)
