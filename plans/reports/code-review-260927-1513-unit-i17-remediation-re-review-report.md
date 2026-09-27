# Unit I17 Re-review — remediation of F1/F2

Prior review: `plans/reports/code-review-260927-1456-unit-i17-demand-doctrine-review-report.md`

## 1. Verdict

**APPROVE** — F1 and F2 resolved; N2/N4/N5 applied; no new issues. Integrate.

## 2. Candidate

- Branch: `coordination-skill-harness-i17-demand-doctrine`
- HEAD: `8864ea596` (remediation) on top of `d3224bd2f`; merge-base `6e2bc8309`
- Worktree clean.

## 3. Scope — PASS

Remediation diff `d3224bd2f..8864ea596`: 15 files, prose only (catalog, matching fragment, 2 SKILL.md + mirrors/wrappers, plan.md stop line). Branch total vs merge-base: 23 files, all under `core/skills`, `domains/coding/skills`, `.agents/skills`, `.claude/skills`, `plugins/fgOS/skills`, `docs/specs/runner.md`, `plans/` (grep for any other path: none). No `src/`, config, I18/I19/I20 work.

## 4. Finding closure

| Finding | Status | Evidence |
|---|---|---|
| F1 Q0 contradiction | **Fixed (option A)** | `capability-matching.md` Q0 row + "Default inline" section: inline = `decide` returns `unavailable` when unconfigured; five reasons justify *configuring* an executor; agent "never decides the mechanism itself", calls `decide --for <capability>` once. `fgos-capability-dispatching/SKILL.md` description + body: calls `decide` once per unit when facts say `mutates: true` + `domain: code`; reason-gate removed. Now consistent with unchanged `executor-dispatch-fallback.md` Activation doctrine and `AGENTS.md`. grep for "dispatch reason applies"/"only when" in both files: none. |
| F2 impact-analysis serves | **Fixed** | Serves `—`; explicit-selection only. |
| N2 plan ID in shipped doctrine | Fixed | "Unit I19" → "pending config schema registration; `decide --for review` currently returns the default mechanism". |
| N4 stop field | Fixed | Original stop condition restored. |
| N5 plan-mode example | Fixed | code-panel description keeps `hasPlanOrTrack: true` + `plans/260915-foo/plan.md` example. |
| N1 debug vs review serves | Deferred to I19/I20 (owner design) | acknowledged in doer report |
| N3 serves notation | Deferred to I19 schema | — |

Option A was the recommended choice; doer reports it as ratified. Confirm the owner ratified it (if not, it still matches `AGENTS.md` + §11.5 chain and is the conservative reading).

## 5. Verification (rerun by reviewer)

| Command | Result |
|---|---|
| `npm run build:skills` | exit 0, `git status` clean after (no drift) |
| `cmp` core ↔ `.agents` ↔ `plugins/fgOS`, 6 changed skill files | byte-identical |
| `node --test test/setup/capability-catalog-doctrine.test.mjs test/skills/*.test.mjs test/report/capability-plan-lint.test.mjs test/runner/dispatch-coordination-role-tiers.test.mjs test/setup/skill-wrappers.test.mjs` (CLAUDE_CODE_SESSION_ID unset) | 164/164 pass |
| `git diff --check main...HEAD` | clean |
| `wc -w capability-matching.md` | 862 (< 900) |
| GitNexus MCP `detect_changes(repo=/home/vantt/projects/forgentX, scope=compare, base_ref=main, worktree=<I17>)` (CLI form fails: multiple repos indexed) | risk low, 0 affected processes |
| Trial merge `git merge-tree <base> HEAD main` | `plan.md` changed in both, auto-merges, 0 conflict markers |

Note: `main` advanced to `5af2f011e` (3 plan-only commits: I21 design, Phase 6/7 wording, runbook). GitNexus compare-to-main therefore also lists main-side plan.md sections (Phase 6/7) — not from this branch. No overlap with I17 skill/doctrine files.

## 6. Non-blocking notes

- Commit subject `fix(dispatch): address review findings F1 and F2 …` carries finding codes (repo rule: no audit labels in commit messages). Squash into the doctrine commit or reword on integrate if convenient.
- Doer report lists phase-05-unit-i17 file as "(NEW)"; it pre-existed at base and was only modified. Cosmetic.

## 7. Recommendation

I17 can integrate into `main` (plan.md auto-merges with the 3 newer main commits). After integration, I19 is unlocked; the catalog `serves` table is now correct for I19 to register. Carry N1 (`code:debug` vs `code:review` disambiguation, e.g. `needsIndependentReview` in `code:review` serves) and N3 (single serves notation) into I19/I20.

## Unresolved questions

- Confirm owner ratified F1 option A (doer states "Ratified").
