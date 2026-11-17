---
phase: 1b
title: "Shaper without Work and the plan contract"
status: ready
blockedBy: [phase-1]
effort: 3h
owner: two agents, one per part
---

# Phase 1b: shaper without Work and the plan contract

Runs after phase 1 and before phase 2. Owner decision (2026-11-17 ~14:49): no planning skill is modified; a
planner-agnostic plan contract wraps any planning skill and a machine check enforces it; the contract also says how to
organize planning so the plan can run in parallel. The two parts are disjoint and run at the same time.

## Parts

| Part | Does | Owner | Owns (writes) |
|---|---|---|---|
| a | shaper that runs without the Work layer (no `fgos edit --refs`, no `fgos decision --id`, no `fgw/<id>` branch), so phase 2 stops recording those skips as friction | the shaper agent (own brief) | its own skill paths, declared in its brief; never a path of part b |
| b | the plan contract, its check and the planner brief | this contract agent | `core/skills/_shared/plan-contract.md`, `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`, `plans/261117-1435-solo-driving-trial/planner-brief-template.md`, this plan's `plan.md` and phase files |

## Part b steps

1. Write the contract (`core/skills/_shared/plan-contract.md`): location, frontmatter, body sections, parallel
   organization, rules, wrapper instruction.
2. Write the check through the YAML door; test it with fixtures (valid, missing key, bad status, overlapping footprints,
   same-wave overlap).
3. Write the planner brief template the supervisor fills in for a planner run.
4. Verify: the new test, the architecture, git-mutation-census and doc-health tests, `npm run build:skills`.

## Validation

- `node scripts/plan-contract-check.mjs --all` runs on this repo: contract plans pass, legacy plans are counted and
  warned, none fails.
- Phase 2's planner brief is the template; the planner's output passes `--plan <dir>` before `ready`.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| a second frontmatter reader appears | L x M | check reads only through `src/util/yaml.mjs`; the architecture door row is a gate |
| legacy plans fail the repo | L x M | the check skips plans without `contract: plan-v1`; not wired into `npm test` |

## Rollback

Revert the part b commits; delete the shaper branch. No legacy plan was edited.
