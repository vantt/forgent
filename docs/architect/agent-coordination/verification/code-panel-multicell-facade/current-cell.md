# Current Cell — P00: Contract và baseline

- **Cell:** P00
- **Track:** `code-panel-multicell-facade`
- **Plan:** [`plans/260915-code-panel-multicell-facade/plan.md`](file:///home/vantt/projects/code-panel-multicell-facade-p00/plans/260915-code-panel-multicell-facade/plan.md)
- **Coordination ID:** `code-panel-multicell-facade--p00`
- **Cell Branch:** `code-panel-multicell-facade--p00`
- **Base Ref:** `45569ac3379445e93436524c1226159b3869265c` (track branch tip: `91d35b4be8a3b4070d4f4f5b23d9bda68a0fb641`, includes merged P04)
- **Status:** in-progress (candidate-produced, fix round 2 applied, ready for review + red-team)
- **Role:** doer (`agy-cli` / `focused-code-implementer`)
- **Primary Lease:** `facade-contract` (DOCS/EVIDENCE-ONLY)
- **Forbidden Paths:** `src/**`, `core/**`, `domains/**`, `test/**`, active `tsk-1bh` worktree

---

## 1. Cell Objective & Scope

Lock the ownership boundary between `fgos-code-panel`, `fgos-plan-loop`, and the shared coordination engine with durable evidence before any implementation code changes, and record a resumable baseline inventory of paused plans.

Summary of deliverables:
1. **Precondition R1:** Verify commit `9af6362c` (`tsk-1bh` fix) and run focused driver-authorization and recovery tests; record real pass/fail output.
2. **Mode-selection contract R2:** Formulate unambiguous rules:
   - `planned-multi-cell`: plan/phase path is the actual execution target (bare path, or explicit run/resume/execute instruction directed AT the plan/phase artifact itself).
   - `direct-single-cell`: concrete code changes, passing plan/phase citations, plan file cited as an edit target (e.g. "fix typo in plans/X/plan.md"), or plan cited as background context while run/resume verb is directed at another object (e.g. "run focused tests in plans/X/phase-01.md against src/x.mjs" or "resume my work on src/auth.mjs, context in plans/X/plan.md").
   - Anti-guessing: unresolved or ambiguous intent refused or clarification requested, never silently guessed either way.
3. **Ownership boundary R3:** Establish explicit ownership matrix and exact contract assertions (with file:line citations) that Phase 01 must implement as tests.
4. **Paused plans inventory R4:** Survey all active and paused plans under `plans/` with open cell-status tables, recording current/next cell, coordination session, merged commits, worktree status, and proof validity.
5. **Test run count baseline R5:** Establish before/after test count baseline from existing coordination traces for comparison in Phase 05, and durable full-suite baseline (6467 pass, 52 unique failing titles: 51 rust-host + 1 intake seq mismatch, 9 skipped = 6528 total).

---

## 2. Verification Commands

```sh
# Focused coordination tests (130 pass, 0 fail)
node --test test/runner/coordination-driver-authorization.test.mjs test/runner/coordination-recovery-and-quorum.test.mjs test/verbs/coordination-recovery.test.mjs

# Tree purity check (must be clean -- no forbidden code paths touched or untracked)
git diff --exit-code -- src core domains test
git status --porcelain --untracked-files=all -- src core domains test
```

---

## 3. Next Action

- Independent review by `reviewer` (`claude-reviewer` / `independent-code-reviewer`) against requirements R1-R5 and proof sufficiency.
- Adversarial review by `red-team` (`codex-cli` / `adversarial-code-red-team`) testing mode-selection ambiguity, algorithm duplication seams, inventory accuracy, and tree cleanliness.
