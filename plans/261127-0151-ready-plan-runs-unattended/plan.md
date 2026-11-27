---
contract: plan-v1
title: "A ready plan runs to done without the owner: the standing rule as rule units, an Unattended run section the contract check enforces, and a full-gate door the lead calls"
status: ready
priority: P0
blockedBy:
  - 261126-2318-plan-footprint-overlap-warns
  - 261127-0143-widen-running-plan-footprint
  - 261127-0144-when-to-ask-owner-rule
base: 09a2a89882ec273a1abda2062e0cfe6b044f0a8b
footprint:
  - plans/261127-0151-ready-plan-runs-unattended/**
  - core/instructions/ready-plan-runs-unattended.md
  - domains/coding/instructions/coding-footprint-tracing.md
  - core/skills/_shared/plan-contract.md
  - domains/coding/skills/fgos-coding-planning/SKILL.md
  - domains/coding/skills/fgos-coding-validating/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - AGENTS.md
  - .fgos/instructions/effective/**
  - .agents/skills/**
  - .claude/skills/**
  - plugins/fgOS/skills/**
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - src/portfolio/plan-sections.mjs
  - packages/session-host/rust/src/release.rs
  - packages/session-host/rust/tests/release.rs
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/session-host/contracts/head-permissions.v1.json
  - apps/fgos/src/routing.rs
  - packages/host-runtime/contracts/command-manifest.json
  - src/cli/command-registry.mjs
  - docs/platform/run-supervisor/spec.md
  - changelog.d/261127-0151-a-ready-plan-runs-unattended.md
source:
  - plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md
  - p-u3nndr6vsh
created: 2026-11-27
---

# A ready plan runs to done without the owner

Written from the settled discussion `ds-que32ftgg6` (D1-D5, §6 U1-U7, §7). Every choice below cites the decision it
honors; none is reopened. The owner released the discussion on 2026-11-27 to be planned on its own, apart from the
lifecycle table (`ds-3in4yb5thk`), so this plan adds no lifecycle word: no new plan status, stage or step value. It
changes what `ready` guarantees, not when or how a plan reaches it.

## Outcome

A plan at `ready` can run to `done` with nobody's hands. Concretely:

- The standing rule (D4) lives once, as two rule units the instruction projection already carries to every agent:
  a core unit with U2-U7 (host steps name a door and an executor, fixed cleanup, `core` / `debt-ok` acceptance,
  beyond-the-rule asks once before `ready`, the split lens) and a coding domain unit with U1 (footprint traced, not
  guessed). The plan contract and the planning and validating skills point at the units instead of restating them
  (§6 placement table; design principle 7).
- Every plan carries an **Unattended run** section, and `scripts/plan-contract-check.mjs` refuses `ready` without
  it, with a host step lacking an argv or an executor, with an unmarked acceptance criterion, or with a
  beyond-the-rule item lacking an answered `q-` id (U6).
- A lead runs the project's full gate (`release.checks` from the project config) on its plan's worktree before land,
  through one door the head permission table lets it call: `fgos release check --worktree <path>`. A failing check
  reports red and changes nothing on main; no release step runs (D5).
- The three evidence plans, re-checked against the new contract, show which of their foreseeable owner questions
  the contract now catches before `ready`, and which it still does not (§7 replay).

### The Unattended run section (fixed here so phases 1 and 2 agree)

```markdown
## Unattended run

### Host steps
| step | argv | executor |
|---|---|---|
| full gate on the integrated tree | fgos release check --worktree <path> | lead |

### Cleanup
Standing rule.            <- or the cleanup that differs from U3

### Beyond the rule
None.                     <- or a table | item | question |, one answered q- id per row

### Split
One sentence: which split U7 chose and why.
```

- Host steps: either the word `None.` or a table whose every row has an argv starting with `fgos ` and a non-empty
  executor (a persona name: `lead`, `supervisor`, ...). The check reads shape only; whether the permission table
  allows the argv is the validator's `fgos can-i` read (U2, U6).
- Acceptance criteria: every top-level list item under the Acceptance criteria heading starts with `[core]` or
  `[debt-ok]` after its number or bullet. A criterion the discussion left unmarked is written `[core]` (U4).
- Beyond the rule: `None.` or rows each naming a `q-` id that the question store reports answered.
- Required only for a plan going `ready` that was created on or after the date phase 2 lands (the same date-gate
  pattern as `AUTHORITY_MAP_REQUIRED_FROM`), so legacy and in-flight plans are not failed.

## Acceptance criteria

1. [core] A core rule unit `core/instructions/ready-plan-runs-unattended.md` carries U2-U7 and a coding domain unit
   `domains/coding/instructions/coding-footprint-tracing.md` (`when: domain: [coding]`) carries U1, placed per §6;
   both appear in `.fgos/instructions/effective/rules.json` after regeneration; `core/skills/_shared/plan-contract.md`,
   `fgos-coding-planning` and `fgos-coding-validating` point at them, and
   `rg -n "cost of waiting vs cost of being wrong|debt-ok" core/skills domains/coding/skills` finds no restated copy
   of the rule beyond one-line pointers. Proof: phase 1 verify.
2. [core] `node scripts/plan-contract-check.mjs --plan <dir>` refuses `ready` for a plan without the Unattended run
   section, with a host step lacking argv or executor, with an unmarked acceptance criterion, or with a
   beyond-the-rule item lacking an answered `q-` id, and passes a complete plan; each case is a test in
   `test/scripts/plan-contract-check.test.mjs`. Proof: `node --test test/scripts/plan-contract-check.test.mjs`.
3. [core] From a confined lead head, `fgos release check --worktree <linked worktree>` returns each
   `release.checks` argv with its exit code; with a failing check it reports red, exits non-zero, and `git rev-parse
   main` is unchanged and no release record is written. Proof: the Rust tests of phase 3 and the live call in phase 5.
4. [core] Replay report `plans/261127-0151-ready-plan-runs-unattended/reports/replay-evidence-plans.md` re-checks
   plans 261122-0118, 261121-2110 and 261120-0625 against the new contract and lists, per foreseeable class
   (footprint, hands, cleanup, acceptance deviation), the owner questions the contract catches before `ready` and the
   ones it still does not.
5. [core] `npm test` and `cargo test --workspace` green on the combined tree, run through the new door (phase 5).

## Non-goals

- The run-time ask rule (`ds-jxoz3h2qgk`, plan 261127-0144), the widen door for a running plan (`ds-mzyircswox`,
  plan 261127-0143), `delivery` and admission (`ds-ipvis4jkpc`), the backlog-to-ready flow and every lifecycle word
  (`ds-3in4yb5thk`), the `when:` key rename (`ds-k435vz65l2`), building ACE.
- Renaming the Work item field `kind` and the persona file field `role:` (discussion §6 end: not designed yet; backlog
  p-qu6inz54uz).
- Selecting the units by `workType` or `role`: the units land in today's format and reach every agent until ACE's key
  registry v2 and read path exist (discussion hand-off, open points). The coding unit uses the existing `domain` key
  only.
- A wiring list of files for a new verb: U1 copies the nearest prior-art commit plus what the drift checks name; no
  list is added (§3 row 10, RUL104).
- Any change to `fgos release run`: unchanged (D5).
- Migrating existing plans to the new section: the date gate leaves them as they are.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Core rule unit `ready-plan-runs-unattended` (U2-U7) and coding unit `coding-footprint-tracing` (U1) | `agent-context-engine/effective-rules.v1` | Two new units in the existing instruction roots, projected by the existing composition; no new mechanism. |
| Unattended run section and its shape checks | `supervision/plan-vocabulary.v1` | The plan contract's own check grows four refusals; the section name joins `src/portfolio/plan-sections.mjs`, the one section reader. |
| `fgos release check --worktree <path>` (run `release.checks` on a named worktree, no apply) | `run-supervisor/head-request.v1` | A second frame beside `release run` in the head window; reuses `Recipe` and the check runner of `packages/session-host/rust/src/release.rs`. survivor: `release run` (unchanged); retired: none. |
| `lead` row allowing `release check` | `session-host/head-permissions.v1` | One allow row for the lead (D5); every other head keeps the inherited deny. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Rule units and pointers](phase-01-rule-units-and-pointers.md) | - | core/instructions/ready-plan-runs-unattended.md, domains/coding/instructions/coding-footprint-tracing.md, core/skills/_shared/plan-contract.md, domains/coding/skills/fgos-coding-planning/SKILL.md, domains/coding/skills/fgos-coding-validating/SKILL.md, core/skills/fgos-lead/SKILL.md, AGENTS.md, .fgos/instructions/effective/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/** | 1 | draft |
| 2 | [Contract check refuses ready without the section](phase-02-contract-check.md) | - | scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, src/portfolio/plan-sections.mjs | 1 | draft |
| 3 | [Full-gate door for the lead](phase-03-full-gate-door.md) | - | packages/session-host/rust/src/release.rs, packages/session-host/rust/tests/release.rs, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, packages/session-host/contracts/head-permissions.v1.json, apps/fgos/src/routing.rs, packages/host-runtime/contracts/command-manifest.json, src/cli/command-registry.mjs, docs/platform/run-supervisor/spec.md | 1 | draft |
| 4 | [Replay on the evidence plans](phase-04-replay.md) | 1, 2 | plans/261127-0151-ready-plan-runs-unattended/reports/replay-evidence-plans.md | 2 | draft |
| 5 | [Changelog and integration](phase-05-integration.md) | 1, 2, 3, 4 | changelog.d/261127-0151-a-ready-plan-runs-unattended.md, plans/261127-0151-ready-plan-runs-unattended/reports/integration.md | 3 | draft |

Phases 1, 2 and 3 run in parallel (disjoint footprints); each is `code:implement`, reviewed with `code:review` before
it lands. Phase 1 owns every generated surface (AGENTS.md, effective rules, skill projections) as the one writer in
its wave. Phase 4 is `code:review` (read-only analysis, one report). Phase 5 is `code:test` for the full gate.

**Ordering behind other plans (owner order 2026-11-27).** `scripts/plan-contract-check.mjs` and its test are
rewritten by plan 261126-2318 (carried by Keeper) and `plan-contract.md`, `fgos-lead`, AGENTS.md and the skill
projections by plans 261126-2318 and 261127-0144; the head permission table, head-request contract, command
manifest and registry by plan 261127-0143. This plan is `blockedBy` all three, so no phase starts on a file another
active plan holds.

Checked: `node scripts/plan-contract-check.mjs --plan plans/261127-0151-ready-plan-runs-unattended` and
`fgos resource-check --plan plans/261127-0151-ready-plan-runs-unattended`; results in the land commit message.

## Unattended run

This plan applies its own rule ahead of the check that will enforce it.

### Host steps
| step | argv | executor |
|---|---|---|
| activate the release that carries the new door, after phase 3 lands | fgos release run | supervisor |
| full gate on the integrated tree, before the final land | fgos release check --worktree <phase 5 worktree> | lead |
| remove superseded worktrees at close | fgos worktree remove --delivered-to main | supervisor |

The lead asks for supervisor rows with `fgos supervisor raise --kind coordination-help`, naming the argv above. Plain
`fgos` runs the activated release, so the door exists for the lead only after the supervisor's `release run`; that
run is also the full gate of phases 1-3 on main (`release.checks`).

### Cleanup
Standing rule (U3).

### Beyond the rule
None. The one new grant, the lead's `release check` row, is the owner's settled decision D5 ("chọn B, cho lead quyền
chạy"), not a planner's choice beyond the rule.

### Split
Smallest parallel pieces (U7 part 1): three disjoint wave-1 phases. No staged compatibility releases: the new
section is date-gated, so no plan breaks and no shim is needed.

## Owner questions

None. The ordering behind plans 2318, 0143 and 0144 is the owner's order of 2026-11-27, recorded in `blockedBy`.

## Risks and rollback

- **Check refuses real plans (medium).** A too-strict parser of the section would block every new `ready`. Mitigated
  by the date gate and by tests on a complete plan; proof point for validating: run the new check with `--all` on the
  tree and confirm no plan created before the gate date fails.
- **Door runs outside the worktree (high).** A check run from the project root instead of the named worktree would
  prove main, not the plan. The door refuses a path that is not a registered linked worktree of the project and runs
  each argv with that worktree as cwd; a Rust test asserts the cwd. Proof point for validating.
- **Door becomes a back door to release (high).** The frame shares `Recipe` but must never call apply, probe, rollback,
  the merge slot or the release record. A test asserts none of those ports is touched.
- **Duplicated rule text drifts (low).** Phase 1 replaces copies with pointers; the `rg` in acceptance 1 checks it.
- **Rollback:** each phase lands as its own commit; revert the phase commits in reverse order. The door and the rule
  units carry no state; reverting the permission row removes the lead's access at once.
