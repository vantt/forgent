# P01 — Authoring Template And Coding Verification Fragment

**Capability:** `code:implement` (docs + one instruction fragment)

**Depends on:** none

## Context

- [plan.md](plan.md) Design section (settled proof model)
- [reports/review-260915-0944-critical-design-review.md](reports/review-260915-0944-critical-design-review.md) §3 S1–S4, §5 wording
- Existing conventions to copy, not reinvent:
  - Product Gates + `**Full-suite gate.**`: `plans/260910-1700-rust-host-r1-kernel/plan.md:148-168`
  - Execution Inputs shape: `plans/260915-0455-test-suite-feedback-cost/plan.md` "Execution Model"
  - TEST BASELINE: `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md:255-260`
  - Isolation-breaking path list: `master-coordinator.md:241-243`
  - Fragment front-matter shape: `domains/coding/instructions/worktree-safety.md`
  - Fragment validation: `src/setup/instruction-registry.mjs` (kind ∈ law/boundary/procedure/host-adapter/preference; `appliesTo`; `specificity`)

## Requirements

R1. `docs/how-to/author-a-plan-loop-track.md` — required sections of a
    Work-independent track plan, each with a copyable block:
    - Precedence & compatibility rule: plan-level Product Gates and phase
      `## Verification` take precedence over generic skill defaults.
      Isolation-breaking diffs and Lead-accepted escalations override the
      targeted default for that cell. Work items running under fgOS Work use
      the item `verify` contract; existing running tracks without
      baseline/checkpoint blocks remain fully compatible without forced schema
      migration or validator scripts.
    - Execution Inputs: track branch, cell branch/coordination-id convention,
      roster (verbatim across every request), **full proof command**,
      **recorded baseline** (command, date, commit, known failures — may only
      shrink), merge cadence to main (per cell / per gate / final — a choice,
      no default), optional main→track sync point.
    - Durable evidence schema: explicit distinction between three states:
      1. `coordination-accepted`: cell coordination loop reached quorum and
         cell-declared targeted verification passed on cell worktree at `testedSha`.
      2. `merged-to-track`: cell branch integrated into track branch at
         `integratedSha`.
      3. `checkpoint-verified`: gate full proof executed against `integratedSha`
         compared against recorded baseline, triaged, and passed.
    - Checkpoint identity: durable record tuple consisting of `phase/cell id`,
      `command`, `baseline`, `testedSha`, `integratedSha`, and `outcome`.
    - Non-inference rule: if `testedSha != integratedSha`, `checkpoint-verified`
      cannot be inferred from pre-merge proof; full gate verification must execute
      against `integratedSha`.
    - Product Gates table with `**Full-suite gate.**` marker semantics and the
      mechanical-gate rule (diff touches dispatch/self-host hooks,
      session/replay/schema core, shared invariants, migrations, test-harness
      foundations, or `package.json` scripts ⇒ gate regardless of marker).
    - Per-phase `## Verification`: targeted commands only; the full proof
      command appears in a phase file only when that phase is a gate.
    - Escalation authority & scope: Reviewer/Red-Team report proof gaps as
      advisory findings (naming missing tests/contracts; no unilateral run
      expansion); Lead holds sole authority to decide `accepted` or provide an
      evidence-backed `rejected`. An accepted escalation upgrades the proof
      requirement for the **current cell only** (`Proof: escalated-to-full`),
      not necessarily creating a permanent Product Gate across future cells.
    - Cell trace format: `Proof: targeted | full-suite-gate | escalated-to-full` +
      complete checkpoint identity tuple (`phase/cell id`, `command`, `baseline`,
      `testedSha`, `integratedSha`, `outcome`).
    - Lead checklist: open cell, close cell, gate full proof + triage
      (patch-related / pre-existing / environmental), track integration merge,
      post-merge gate execution when `testedSha != integratedSha`, final close.
R2. `domains/coding/instructions/verification-discipline.md`, `kind:
    procedure`, `scope: domain`, `owner: coding`, `appliesTo: ["*"]`,
    one paragraph: run the verification your unit declares (Work `verify` or
    cell Verification); the full suite belongs to declared gates, track close,
    Work verify/reverify — never every implement/fix round; reviewer/red-team
    report coverage gaps via advisory findings, never expand their own run;
    Lead decides escalation (accepted upgrades current cell only, or evidence-backed
    rejection).
R3. The how-to links the fragment as the source of the rule; the fragment does
    not restate the how-to.
R4. `CHANGELOG.md` `## [Unreleased]` entry.

## Files

- Add: `docs/how-to/author-a-plan-loop-track.md`
- Add: `domains/coding/instructions/verification-discipline.md`
- Edit: `CHANGELOG.md`
- Edit (link only): `docs/specs/reading-map.md` if it indexes `docs/how-to/`
- Must not edit: `plans/260915-0455-test-suite-feedback-cost/**`,
  `core/skills/**` (phase 02), `AGENTS.md` (generated projection surface)

## Adversarial checks

- A phase template that still lets `npm test` slip into a non-gate phase.
- Baseline block without a "may only shrink" rule (lets known failures grow).
- Inferring `checkpoint-verified` from pre-merge proof when `testedSha != integratedSha`.
- Reviewer/red-team attempting to force full-suite execution or Lead rejecting a
  proof gap without evidence-backed rationale.
- Escalating a single cell and treating it as a permanent Product Gate across all
  subsequent phases without explicit plan update.
- Breaking compatibility with existing running tracks lacking baseline/checkpoint blocks.
- Fragment front-matter rejected by `discoverInstructionSources` or causing
  a composition conflict against `coding-worktree-safety`.
- Any `trackKind` / `executionPolicy` vocabulary reappearing.

## Verification

```sh
node --input-type=module -e "import { discoverInstructionSources } from './src/setup/instruction-registry.mjs'; const u = discoverInstructionSources(process.cwd()); console.log(u.filter(x => x.id === 'coding-verification-discipline').length === 1 ? 'fragment ok' : 'fragment missing')"
node --input-type=module -e "import { inspectInstructionProjection } from './src/setup/instruction-projections.mjs'; const r = inspectInstructionProjection(process.cwd()); if (!r.passed) { console.error(r.problems); process.exit(1) }"
node --test test/setup/instruction-registry.test.mjs test/setup/instruction-composition.test.mjs
grep -rn "trackKind\|executionPolicy" docs/how-to domains/coding/instructions && exit 1 || true
```

## Acceptance

A stranger Lead can write a new track's plan.md and phase files from the
how-to alone with baseline, gates, targeted Verification, precedence/compatibility,
durable evidence schema (`coordination-accepted`, `merged-to-track`,
`checkpoint-verified`), checkpoint identity (`phase/cell id`, `command`, `baseline`,
`testedSha`, `integratedSha`, `outcome`), escalation authority (current cell only),
and non-inference rule (`testedSha != integratedSha`) present; the fragment
discovers and composes cleanly; no new vocabulary.

## Risks and rollback

Docs-only; revert the two files. The fragment is not yet rendered to workers
(only the `repo` target is projected today) — that is a known limit, recorded
in the review, not a regression.
