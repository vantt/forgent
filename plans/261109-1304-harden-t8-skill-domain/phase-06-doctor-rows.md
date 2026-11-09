---
phase: 06
title: "Doctor rows: agent-claims-resolve accepts a claim only when the skill name is owned, executor-skills-installed accepts a user-level skill dir and refuses an empty SKILL.md and names worktree provisioning; no row added or lost"
status: completed
depends_on: []
parallel: "group A; P08 and P11 follow on registrations.mjs"
effort: ~0.5d
net_size: "Node about +14 / Rust 0 / tests about +25 (estimate)"
---

# Phase 06 - Doctor rows (T8-06 row half, T8-17)

## Context

Arbitration T8-06: `checkAgentClaimsResolve` (`src/setup/registrations.mjs:837`) matches a `requires-skill` claim against agent files only, so a dead skill name is green on both sides. T8-17: `executor-skills-installed` (`src/setup/model-pool-checks.mjs:60-84`) checks existence only, in the main checkout only, project level only, `':'` to `'-'` only. Lead decision L-10: T8-17 is done by HARDEN (T5 is closed and HARDEN-owned). Install-gate rule (AGENTS.md): never assume which install level (global vs project) is active.

Reused door: the owned-name set. `ownedSkillNames` (`skill-wrappers.mjs:163`) is a setup-layer export; `registrations.mjs` is also in `src/setup`, so the import is same-layer (read `docs/architecture-manifest.json` and run `test/architecture.test.mjs`; if the guard objects, the owned set moves to a leaf in P11's neighbourhood and this phase reports it instead of copying the code).

## Requirements

1. **T8-06 row.** `agent-claims-resolve` accepts a claim only when (a) an agent provides it (as today) **and** (b) the name is in the owned-skill set (`ownedSkillNames(cwd)`). Message names the claim and which side failed. Row id and count unchanged.
2. **T8-17.** `executor-skills-installed` accepts a project-level **or** user-level skill dir of the CLI (`~/.claude/skills/<name>/SKILL.md` for Claude, the CLI's own user-level path for each executor the check already knows; the lead reads the check to see which CLIs it covers), refuses a present-but-empty `SKILL.md`, and its message says that a worktree gets skills only from provisioning (`worktreeSetup`), so a main-checkout pass is not a worktree pass. Keep the `':'` -> `'-'` mapping for the name.
3. **Remove the kit name from code.** `src/setup/model-pool-checks.mjs:58` comment names `ak:cook` and `ak-cook/SKILL.md` as the example; reword to a generic example (decision 79 Q5: no kit name anywhere in fgOS). The check itself is driven by executor `supports.skills`, which is data.
4. No new doctor row, no new registration; `fgos doctor --json` row ids and count are identical before and after (state both in the report).

## Files

**Create:** none.

**Modify:** `src/setup/registrations.mjs` (`checkAgentClaimsResolve` only, `:837` onward; no other function in the file in this phase), `src/setup/model-pool-checks.mjs`, `test/setup/checks.test.mjs`, `test/setup/model-pool-checks.test.mjs`, `CHANGELOG.md` (one line).

**Delete:** the agent-files-only match in `checkAgentClaimsResolve`, replaced by the two-sided one.

**Tests to retire:** none expected; if an existing case asserts a claim that resolves by an agent alone, it is replaced with a two-sided case and named.

**Cross-lane one-liners:** none.

## Red tests first

- `test/setup/checks.test.mjs` (the agent-claims case): a claim whose skill name is not owned is refused even though an agent provides it; a claim whose owned skill no agent provides is refused; both together pass.
- `test/setup/model-pool-checks.test.mjs`: a user-level skill dir satisfies the row; an empty `SKILL.md` is refused; the message names worktree provisioning.

## Net size

Node about +14 (T8-06 +4, T8-17 +10); tests about +25.

## Steps

1. Callers by `rg` of both functions; confirm the doctor row ids with `fgos doctor --json` before.
2. Red tests; edits; comment reword; CHANGELOG; census.
3. `fgos doctor --json` after: same ids and count.

## Validation (focused)

- FR `test/setup/checks.test.mjs test/setup/model-pool-checks.test.mjs test/architecture.test.mjs`
- `fgos doctor --json` row id list diff (before/after) pasted in the report. Land gate.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Collides with the doctor readiness plan on `registrations.mjs` | M x L | Board line; rebase on whatever doctor landed; no registration change here, one function |
| The user-level path differs per CLI | M x M | Read the check's executor table; accept only paths it already names for that CLI; a CLI with no user-level convention keeps project level only |
| The owned-set import trips the layering guard | L x M | `test/architecture.test.mjs` first; if blocked, report; never copy `ownedSkillNames` |

## Rollback

Revert the merge commit; the rows return to the weaker judgment.

## Done when

Red then green; row ids and count unchanged; no `ak-` string in `src` or `scripts` (`rg`); guide section written.

## Lead brief essentials

One function in `registrations.mjs`; P08 and P11 edit other functions of the same file later. All plan.md lead rules apply.
