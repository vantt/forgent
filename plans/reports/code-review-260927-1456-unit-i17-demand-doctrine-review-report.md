# Unit I17 Independent Review — demand doctrine

## 1. Verdict

**APPROVE_WITH_FIXES** — scope clean, build/mirrors/tests green. Two doctrine defects to fix before integrate (F1, F2); both prose-only, same branch.

## 2. Candidate

- Branch: `coordination-skill-harness-i17-demand-doctrine`
- SHA: `d3224bd2f71d60608dbe9c57269e2b35825c0144` (single commit on `main@6e2bc8309`, merge-base = main tip)
- Worktree: `.claude/worktrees/coordination-skill-harness-i17-demand-doctrine`, clean

## 3. Scope assessment — PASS

23 files, all in allowed set: 4 `core/skills/_shared/*` fragments (1 new), 2 canonical SKILL.md, generated `.agents/`, `plugins/fgOS/`, `.claude/skills` wrappers, `docs/specs/runner.md`, plan + phase file status.

Not touched (verified via `git diff --stat main...HEAD`): `src/**`, `.fgos/config.json`, `src/setup/registrations.mjs`, `src/report/capability-plan-lint.mjs`, no `capability-match.mjs`, no CLI verb, no CoordinationSession, no architecture-panel, no `fgos-code-change`. No I18/I19/I20 work. `coordination-driver.md` / `fgos-plan-loop` untouched per phase file.

`planning-capability-awareness.md` changed — not in reviewer allow-list but explicitly required by phase file Req 3. OK.

## 4. Doctrine / catalog / spec assessment

| Check | Result |
|---|---|
| Matching on declared facts vs `serves`, not keywords | PASS (`capability-matching.md` "Meaning over keywords") |
| One primary canonical capability per unit | PASS (existing `planning-capability-awareness.md` "Exactly one canonical capability") |
| Plans never pin executor/provider/model/tier | PASS |
| Default inline | PASS, but see F1 |
| ≤1 `decide --for` per unit | PASS (SKILL "at most one"; fragment "No double decide") |
| Resolves to agent / MCP-tool / unavailable→inline | PASS (existing catalog + fallback text preserved) |
| Capability = unit routing; protocol = multi-actor | PASS ("Unit vs. Protocol") |
| Capability never Work item/stage | PASS |
| Domain promotion only on trigger | PASS (matches §11.6) |
| Generic `review` for non-code, not forced into `code:review` | PASS (catalog row + "Do not make every review `code:review`") |
| advise/execute/review/code:* boundaries | PASS (serves column makes them distinguishable), see N1 |
| DemandFacts 8 attrs + vocab sources | PASS, matches §11.1 exactly |
| Match rules (all-serves-satisfied, wildcard, specificity, tie/miss→inline+log, override logged) | PASS, matches §11.2 |
| Catalog `serves` column + no-serves-never-auto-matched rule | PASS, but see F2 |
| Fallback: fifth reason "stronger model" tied to `rigor` not `size` | PASS |
| Fallback: mechanism handling preserved | PASS (text unchanged) |
| code-panel trigger: change+code+mutates+needsIndependentReview; not "implement" keyword | PASS; governance/spec review can no longer route to code:* |
| runner.md one concise fact | PASS (1 table row + 1 bullet; no I18–I20 behavior promised) |
| Fragment < 900 words | PASS (doer: 854) |

Serves matching simulated by hand against the new table:
- docs change `{change, docs, mutates:true}` → `execute` ✓
- spec/governance review `{finding, docs, mutates:false}` → `review` ✓ (original bug fixed)
- code review `{finding, code, mutates:false}` → `code:review` (3) over `code:debug`/`review` (2) ✓
- refactor → `code:refactor` (4) ✓; implement → `code:implement` (3) ✓

## 5. Verification

| Command | Result |
|---|---|
| `npm run build:skills` | exit 0; `git status` clean after → no drift |
| `cmp` core ↔ `.agents` ↔ `plugins/fgOS` for all 6 changed skill files | byte-identical |
| `node --test test/setup/capability-catalog-doctrine.test.mjs test/skills/*.test.mjs` (CLAUDE_CODE_SESSION_ID unset) | 40/40 pass |
| Related tests referencing these files: `test/report/capability-plan-lint.test.mjs test/runner/dispatch-coordination-role-tiers.test.mjs test/setup/skill-wrappers.test.mjs` | 124/124 pass |
| `git diff --check main...HEAD` | clean |
| `npx gitnexus detect-changes --scope compare --base-ref main` | CLI failed: multiple repos indexed. Used MCP `detect_changes(repo=/home/vantt/projects/forgentX, scope=compare, base_ref=main, worktree=<I17 worktree>)` → 37 markdown sections touched, 0 affected processes, risk **low** |

Note: plan's literal verification `node --test ... test/skills/` (directory arg) fails on Node 24 with MODULE_NOT_FOUND; doer correctly used `test/skills/*.test.mjs`. Plan text now records the glob form. Fine.

## 6. Blocking findings (fix before integrate)

### F1 — Cluster contradicts itself on who decides Q0 (inline vs dispatch)

- `core/skills/fgos-capability-dispatching/SKILL.md` + `capability-matching.md` Q0: agent itself evaluates the five reasons and calls `decide` **only when** a reason applies.
- `core/skills/_shared/executor-dispatch-fallback.md` (unchanged "Activation doctrine"): "Before executing **any** independently executable unit … call `decide`"; five reasons are phrased as reasons to **configure an executor**.
- `AGENTS.md` Dispatch: "Never decide the mechanism yourself."

Failure scenario: project config maps `code:implement` → a cheaper or different provider (the reason lives in config). Agent under new SKILL wording sees no reason from its own seat, never calls `decide`, runs inline → configured routing silently bypassed. Doer's own report confirms the effect ("sessions will less frequently call decide"). Two fragments in the same cluster now give different instructions; this is the kind of ambiguity the unit exists to remove.

§11.4 says "Năm lý do dispatch; mặc định inline… Đảo ngược trigger", §11.5 chain is `capability match → dispatch decide → dispatch execute`. It does not state who judges the five reasons. Owner decision needed; two consistent options:

- **(A, recommended)** Five reasons = justification for *configuring* an executor. "Default inline" = what `decide` returns (`unavailable`) when nothing is configured. Agent always calls `decide` once per matched unit (Q2). Fix: SKILL.md + fragment Q0 row reword to "inline unless config/decide says otherwise"; drop "only when a dispatch reason applies" gate. Preserves AGENTS.md rule + PreToolUse hook semantics; the trigger reversal (keyword → DemandFacts) still stands.
- **(B)** Agent judges Q0 per unit. Then fallback "Activation doctrine" must be rewritten to match, and AGENTS.md "never decide the mechanism yourself" conflict must be addressed — bigger scope, touches an always-loaded rule.

### F2 — `impact-analysis` given invented `serves: verification` → misroutes

`capability-catalog.md` table: `impact-analysis | verification`. Owner table §11.2 lists no serves for it; tool/adapter capabilities are meant for explicit selection.

Failure scenario: a docs/config verification unit `{outputKind: verification, domain: docs}` → `code:test` fails (domain code), `impact-analysis` matches (1 attr) and wins → routed to GitNexus. Code-domain blast-radius demand `{verification, code}` conversely always loses to `code:test` (2 attrs), so the serves never helps the real use either.

Fix: set `impact-analysis` serves to `—` (same as `pane-labeling`) so it is explicit-selection only, consistent with the "no serves = never auto-matched" rule. I19 will copy this table into config, so fix now.

## 7. Non-blocking notes

- **N1 (design, owner-level, not doer's fault):** `{finding, code, mutates:false}` always picks `code:review` over `code:debug` (§11.2 serves). A read-only debug unit misroutes to review. Differentiator candidate: `needsIndependentReview` in `code:review` serves. Feed to I19/I20.
- **N2:** Plan IDs leak into shipped doctrine: `capability-catalog.md` "scheduled for config schema registration in Unit I19" (projected to other projects via plugin). Replace with behavior wording ("not yet registered in config; `decide --for review` currently returns the default"). `runner.md` "(Phase 5, Unit I17)" is consistent with that spec's existing style — optional.
- **N3:** Serves column format mixes bare values and `key: value` (`change, mutates: true`) and SKILL.md uses `mutates` without `: true`. Harmless in prose; I19 schema should pick one canonical form.
- **N4:** `plan.md` `stop:` field overwritten with "CLEARED — …"; stop condition is a rule, not a status. Keep original stop text, record result under `status`/`verification`. Also `status: implemented` pre-review — acceptable if that is the track's convention.
- **N5:** code-panel description dropped plan-mode examples ("run plans/…/plan.md", "resume track …"); planned-multi-cell mode is still described, so trigger recall for plan-driven tracks may drop slightly. Consider keeping one plan-mode example phrased as facts (`hasPlanOrTrack: true`).
- **N6:** GitNexus reports 24 files vs git's 23; cosmetic, 0 processes affected.

## 8. Exact required fixes

1. F1: after owner picks A or B, make `capability-matching.md` (Q0 row + "Default inline" section), `fgos-capability-dispatching/SKILL.md` (description + "Default inline and decide before execute"), and `executor-dispatch-fallback.md` state one rule. If A: remove "AND at least one of the five valid dispatch reasons applies" / "only when dispatch reasons apply"; say five reasons justify configuring an executor, `decide` once per unit, `unavailable` → inline.
2. F2: `capability-catalog.md` `impact-analysis` Serves → `—`.
3. Rerun `npm run build:skills`, the 40-test + 124-test sets, `git diff --check`; amend or add a commit on the same branch.
4. Optional in same pass: N2, N4.

## 9. Recommendation

Do not integrate `d3224bd2f` as-is. After F1+F2 (prose only, ~15 min), re-review is diff-only and I17 can integrate. I19 (config `serves` + `review` slot) depends on the catalog table being right, so F2 must land before I19 starts; F1 does not block I19 technically but should be settled before I20 builds `capability match` on top of Q0 semantics.

## Unresolved questions

- F1: owner choice A (config judges the five reasons, agent always calls `decide`) vs B (agent judges Q0).
- N1: should `code:review` serves add `needsIndependentReview: true` to separate it from `code:debug`?
