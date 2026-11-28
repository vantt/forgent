# Phase 10: Decision kinds retired, four owners

The model stops carrying decision kinds. Each live component row is its own decision scope, and
its narrative sits in its `spec` unless the row names another place in `decisions` (CAS-D25).
This phase runs between phases 2 and 3; it is numbered 10 so the earlier phase numbers stay
stable.

Capability: `code:implement`.

## Inputs

- DISCUSSION §4 CAS-D25, §3 row 26.
- `packages/component-authority/model/decision-kinds.yaml` (9 rows) and `components.yaml` after
  phase 2.
- `packages/component-authority/rust/src/{model,declare,locate,render,lib}.rs` (the
  `DecisionKind` type, `decision_kinds` rows in `locate.rs:155`, `governance_holder_body` in
  `render.rs:283`), `rust/tests/model_checks.rs`, `contracts/model.v1.json`.
- `apps/fgos/src/wiring/authority.rs` (`--kind decision-kind`, around lines 73, 211, 532),
  `apps/fgos/tests/authority.rs`.
- `src/report/decision-index.mjs:25-60` (`narrativeHolderResolver`),
  `test/report/decision-index.test.mjs`.
- `scripts/plan-contract-check.mjs:345-352` (`DECLARE_KINDS`, `decisionKinds` ids),
  `test/scripts/plan-contract-check.test.mjs`.
- Prose that names decision kinds: `core/instructions/design-principles.md` (principle 7),
  `core/instructions/ready-plan-runs-unattended.md`, `core/skills/_shared/plan-contract.md:71,176`,
  `core/skills/fgos-shaping/SKILL.md`, `domains/coding/skills/fgos-coding-implement/SKILL.md`.

## Files this phase may write

Its footprint row in plan.md.

## Steps

1. Model data. For each of the 9 decision kinds: copy its `aliases` (and its `canonical`
   `decision-kind:<id>`) onto the owning component's `aliases`; where its `narrative` is not the
   owner's `spec` (the five `docs/platform/<area>/decisions/` homes of `agent-confinement`,
   `packaging-distribution`, `observe`, `runner`, `work-state`), set `decisions: <that path>` on
   the owner row. Put the old non-component scope `architecture-map` in
   `component-authority.aliases`. Delete `decision-kinds.yaml`.
2. Delete rows `enduser-docs-authoring` and `enduser-docs-index`; add both ids and their aliases
   to `learning-docs-registry.aliases` (the owner of `src/report/enduser-index-generate.mjs`).
   Drop their consumer lines on contracts, if any. Their spec text in
   `docs/platform/work-state/contracts/knowledge-registry.md` stays unchanged (plan.md, "Decided
   by the planner").
3. Schema and Rust: remove the `decisionKinds` def and the `DecisionKind` type; add an optional
   component field `decisions` (a repo path); `model.rs` refuses a `decision-kinds.yaml` file by
   name, pointing to the component `decisions` field; `declare.rs` and the wiring lose
   `--kind decision-kind` (a call with it is refused, naming the remaining kinds `component`,
   `door`, `contract`); `locate.rs` stops ranking decision-kind rows, and its alias match
   already returns the component for an old kind id. `render.rs` `governance_holder_body` lists
   one line per live/designed component: scope id with its ASCII aliases, read-first = `spec`,
   narrative home = `decisions` or `spec`. Move every fixture and test (`model_checks.rs`, crate
   unit tests, `apps/fgos/tests/authority.rs`).
4. `src/report/decision-index.mjs`: `narrativeHolderResolver` reads `components` from
   `authority model --json` and maps id, canonical and every alias to `decisions ?? spec`; the
   platform-file fallback stays. Update its test fixture; add one case where an old kind alias
   resolves to the component's home.
5. `scripts/plan-contract-check.mjs`: `DECLARE_KINDS` is `component`, `door`, `contract`; the
   Authority-map id list drops `decisionKinds`. Update its test.
6. Prose: principle 7 in `core/instructions/design-principles.md` reads "**One authority, one
   source of truth.** Each component does one job, and no second component does a similar
   job." followed by its existing second and third sentences; the other four files drop
   "decision kind" (plan-contract §3 kinds list, the beyond-the-rule list "a new component or a
   change to a locked law"). Run `npm run build:skills` to regenerate `AGENTS.md`,
   `.fgos/instructions/effective/rules.json`, `.agents/skills/` and `plugins/fgOS/skills/`. If it
   touches a path outside this phase's footprint, the lead widens before landing.
7. Render with the worktree code (`npm run fgos:dev -- authority render`), then `--check`.

## Verify

`cargo test -p component-authority`, `cargo test -p fgos --test authority`,
`node --test test/report/decision-index.test.mjs test/scripts/plan-contract-check.test.mjs test/architecture.test.mjs`,
`npm run fgos:dev -- authority render --check`, and
`rg -n -i "decision.?kind" packages/component-authority/rust/src scripts/plan-contract-check.mjs src/report/decision-index.mjs core/instructions core/skills/_shared/plan-contract.md`
prints only the old-file refusal and its test. Pass: all green; `fgos decision-index` (worktree
code) writes the same narrative homes for every scope the index held before, checked by
diffing `docs/decisions/index.md` before and after (scope column only).

## Rollback

Revert the phase merge; it restores `decision-kinds.yaml`, the two enduser rows and the old
principle 7 wording.
