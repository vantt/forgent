# Current Cell: P01.1 (Author The Soul)

Status: in-progress
Owner: Doer (to be dispatched)
Last updated: 2026-09-05
Next action: dispatch Doer via `fgos coordination run`

## Objective

Create exactly 4 files under `docs/architect/agent-coordination/playbooks/`:
`prompts/architecture-advisory-coordinator.md`,
`architecture-advisory-role-doctrine.md`,
`architecture-advisory-artifact-templates.md`,
`architecture-advisory-evaluation-rubric.md`. The coordinator prompt must be
self-contained: input block, authority order, scout-before-ask rule, role
routing, nine-phase cognitive loop, persistence/recovery, Decision Dialogue,
bounds, stop conditions. Every role spec needs purpose, posture, what to
notice, judgment heuristics, anti-patterns, handoff shape, and >=1 good/bad
example — a role name plus expected-output fields is insufficient.

## Must Read

- `plans/260905-architecture-advisory-panel/phase-01-advisory-soul-and-manual-proof.md` (full — P01.1 section, Soul Deliverables, Required Doctrine)
- `plans/260905-architecture-advisory-panel/plan.md` (Read This First — Trong Mem Ngoai Cung; the soft-inside-first mandate this whole phase exists to satisfy)
- `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md` (the proven manual pattern this soul is "analogous in usability to")
- `docs/architect/agent-coordination/verification/architecture-advisory-panel/P00.1.md` (the now-closed allowlist this track already proved — NOT used for P01.1's own file-writing dispatch, only for P01.2/P01.3's external-project advisory dispatch)

## Requirements (from phase-01.md, P01.1 section + Soul Deliverables + Required Doctrine)

- One-entry manual coordinator playbook analogous to `master-coordinator.md`.
- Role doctrine for: lead advisor, investigator, system shaper, alternative
  shaper, constraint advocate, critic, synthesizer, red-team, specialist.
- Artifact prose/templates — reasoning aids, not schema-only.
- Recovery handoff letting a fresh coordinator resume from persisted
  artifacts alone.
- Qualitative evaluation rubric for advisory quality.
- Role-routing roster: how the coordinator independently selects a
  proven-safe executor/confinement pair, tier, persona per actor and
  records derived provider/model.
- Driver-disposition doctrine: `accepted`/`answered`/`mitigated`/`deferred`/
  `unresolved`/`invalidated-by-evidence`, incl. when the driver must not
  disposition without another advisor's evidence.
- Headless Dialogue Turn Protocol: person's immutable words vs. lead-advisor
  interpretation vs. driver authorization vs. panel response, kept separate.
- Encode the 8 Required Doctrine principles (Understand person/problem, Ask
  reluctantly, Diverge honestly, Debate claims, Converge without flattening,
  Explain for ownership, Stay in dialogue).

## Files

May touch only: the 4 new playbook/doctrine/artifact files above, plus this
cell's own verification report/trace files
(`docs/architect/agent-coordination/verification/architecture-advisory-panel/{P01.1.md,proofs/P01.1/**}`,
`plans/260905-architecture-advisory-panel/reports/**`). Matches the
`panel-soul` lease from plan.md.

## Do Not Touch

Production skills, protocol definitions, runtime, schemas, contracts, CLI,
pack registry, canonical specs, `index.md`, `current-cell.md` (Coordinator-owned).

## Role Roster

Not the Phase 00 read-only allowlist — this cell writes real files inside
`forgentX`'s own worktree (normal mutating work, same class as P00.1's own
Doer/Fixer), not advisory inspection of an external project. The Phase 00
allowlist (`claude-bwrap`/`codex-readonly`/`agy-bwrap`) is for P01.2/P01.3's
external-project advisory dispatch only.

- Doer: `claude`, tier `critical`, persona `principal-architecture-writer`
  (switched from `agy-cli` this round — P00.1 showed a real pattern of
  agy-cli-driven work overclaiming containment/evidence quality; using
  `claude` for the primary authored deliverable this time, per person's
  direct request to watch agy-cli's behavior more critically)
- Reviewer: `codex-cli`, tier `analytical`, persona `skeptical-reviewer`
- Red-Team: `agy-cli`, tier `analytical`, persona `adversarial-tester`
  (kept in the loop specifically to keep observing its real behavior, in a
  role where overclaiming is cheap to independently verify)

## Exact Commands

```sh
fgos coordination chain architecture-advisory-panel --json
git worktree add ../architecture-advisory-panel-p01-1 -b architecture-advisory-panel--p01-1 group-thinking-plan-loop
fgos coordination run --cwd ../architecture-advisory-panel-p01-1 --file docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.1/requests/open.json
fgos coordination show architecture-advisory-panel--p01-1 --json
```

## Stop Gates

- Any playbook change would move empathy/materiality judgment/reframing/
  alternative quality/debate style/recommendation calibration/explanation
  into kernel enums (plan.md's own "MUST NOT" list) — stop, this is a
  product-policy question for the person.
- A role spec reduces to "name + expected-output fields" with no real
  doctrine — Reviewer/Red-Team must block this, not let it pass as done.
- A concurrent track claims any file in the `panel-soul` lease.

## Trace Update

Doer/Reviewer/Red-Team write to `P01.1.md`. Coordinator owns `index.md` and
this file exclusively.

## Report

`plans/260905-architecture-advisory-panel/reports/doer-260905-2110-p01-1-advisory-soul-report.md`
End with: `Status: DONE | DONE_WITH_CONCERNS | BLOCKED` and a two-line summary.
