# Current Cell: P03.1 (Plan-Loop Skill And Live Proof — R1-R4 only)

Status: in-progress
Owner: Doer (to be dispatched)
Last updated: 2026-09-05
Next action: dispatch Doer for R1-R4 only

## Goal

Author `.agents/skills/fgos-plan-loop/SKILL.md` (the group-thinking-native
successor to `master-coordinator.md` for Work-independent tracks),
covering: resuming via `fgos coordination chain <track>`; opening a cell
(worktree + `open.json` request); reading Reviewer/Red-Team results and
dispositioning findings; authorizing+dispatching a fix round
(`fix-N.json`); closing a cell (`close.json` + the Lead's own
merge+worktree-removal); the four-condition mutation rule from Phase 01,
stated plainly; explicit non-goals (no Work involvement, no git authority
inside the session, the Lead performs every merge). State Phase 01's own
commit-policy decision plainly: a Doer/Fixer MAY commit on the cell's own
worktree branch; only the Lead merges into the track/main branch.

## Non-Goals (this dispatch)

- Do NOT attempt R5 (the live proof on `/home/vantt/projects/fgos-test-drive`),
  R6, or R7 — these are explicitly paused pending a user decision (see
  P03.1.md's own "Coordinator note on R5"). If you find yourself about to
  touch `/home/vantt/projects/fgos-test-drive` or
  `docs/specs/runner.md`'s stop-gate paragraph, STOP — that is out of
  scope for this dispatch.

## Must Read

- `plans/260904-2329-group-thinking-plan-loop/phase-03-plan-loop-skill-and-live-proof.md` (full — R1-R4 sections)
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P03.1.md` (this cell's trace)
- `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md` (the file this skill succeeds — read in full to understand what it's replacing)
- `docs/architect/proposals/group-thinking-plan-loop.md` (the design proposal — has the templates' own original sketch, R3 says do NOT copy verbatim, re-verify against real code)
- `src/verbs/coordination/schema.mjs` (current, real request schema — every template field must match this, not the proposal's sketch)
- `src/verbs/coordination/chain.mjs` (the resume mechanism SKILL.md documents)
- `docs/architect/agent-coordination/contracts/coordination-session.md` (the four-condition mutation rule, now promoted post-P01.1 close)
- `package.json` (confirm the real `build:skills` script name before using it)

## May Inspect

Anything else under `src/verbs/coordination/`, `src/runner/coordination/`
(read-only, for template field verification), `.agents/skills/` (existing
skill authoring conventions to match).

## Do Not Touch

- `/home/vantt/projects/fgos-test-drive` (any file) — R5 paused.
- `docs/specs/runner.md`'s stop-gate paragraph — R7 depends on R5's real
  evidence, not honest to write yet.
- Any file under `src/runner/coordination/**`, `src/runner/dispatch/**`,
  `src/verbs/coordination/**`.
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`.
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/index.md`.

## Tests First

This cell is proof-driven for R5 (deferred). For R1-R4 (this dispatch),
verify: every template field name is confirmed against the REAL, current
`schema.mjs` (cite file:line for each field), the generated mirror under
`plugins/fgOS/skills/fgos-plan-loop/` matches the source byte-for-byte
after running the real build command, and `master-coordinator.md`'s
Retirement section gains exactly one pointer line, nothing else changed.

## Acceptance (this dispatch, R1-R4 only)

- `.agents/skills/fgos-plan-loop/SKILL.md` exists, internally consistent
  with real post-P01/P02 CLI/schema shapes, every field cited against
  real code.
- Generated mirror matches byte-for-byte.
- `master-coordinator.md`'s Retirement section has exactly one new
  pointer line, nothing else restructured.
- Three request templates (`open.json`, `fix-N.json`, `close.json`)
  demonstrate per-actor `executor`/`tier`/`persona` diversity as a
  first-class property.

## Bug Taxonomy

Documentation/skill-authoring cell — watch for: a template field that
doesn't actually match the real schema (would silently break on first
real use), stale references to pre-P01.1 mechanics (the mutation rule
changed shape across 4 fix rounds — cite the FINAL, merged behavior, not
an intermediate one), copying the design proposal's own sketch verbatim
without re-verification.

## Trace Update

Doer writes to `P03.1.md`'s Proof Matrix/Commands/Gaps sections only
(R1-R4 rows). Never touch the R5/R6/R7 rows or the "Coordinator note on
R5" section.

## Report

Write to
`plans/260904-2329-group-thinking-plan-loop/reports/doer-260905-0245-p03-1-skill-authoring-report.md`
(role, cell, outcome, paths touched, real field-name citations). End with:
`Status: DONE | DONE_WITH_CONCERNS | BLOCKED` and a two-line summary.
