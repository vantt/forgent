# Phase 1: Spec first

The component-authority spec states the layering model and the four owners, against CAS-D1..D26, before any code
changes (hand-off constraint: "spec docs/platform/component-authority/spec.md cập nhật trước
code"). It reuses branch `component-authority-layerings/p01` (123eaf5f07, reviewed against
CAS-D1..D13, not landed) in worktree
`/home/vantt/projects/forgent-worktrees/261127-1247-component-authority-layerings-p01`.

Capability: `code:implement` (prose only).

## Inputs

- `plans/discussions/ds-zfqskcns7j-component-authority-scope-and-levels/DISCUSSION.md`: the
  hand-off block (lines 12-23), §4 CAS-D1..CAS-D26, §6 `#design`.
- `git diff main...component-authority-layerings/p01` (what is already written).
- `docs/platform/governance.md#decision-scope-to-holder-table` (where the narrative goes).

## Files this phase may write

- `docs/platform/component-authority/spec.md`

## Steps

1. Rebase p01 on the current `main` (`git -C <p01 worktree> rebase main`); the diff touches only
   the spec.
2. Keep what p01 already states (layering definition, CAS-D8 fields, rule kinds table, four
   layerings table, hexagon rules, CAS-D1 module paragraph, port field on contracts, settled
   facts 7-11) and amend:
   - §2.1 definition: add CAS-D15 (1) wording (a layering is one view, in its own language, on
     the same system; every layering ranks every live/designed component).
   - Remove the `debt` field and every "named debt on the layering row" sentence (plan.md,
     "Decided by the planner"): a real violation is an `exceptions` line with a reason.
   - `stack` values: `T4-agent-runtime` (CAS-D18), `T7-domain`, `T8-delivery` (CAS-D15 (2)), with
     the members named in acceptance 7 of plan.md.
   - `orchestration-ring`: meaning of each role value per CAS-D16 and CAS-D18 (`orchestrator`
     selects and babysits work), old ring names in `aliases`, `source: declared`, rule
     `order-downward` with shortcut calls allowed and results flowing back as return values or
     port callbacks.
   - `sameAs` and `distinctFrom` on values (CAS-D15 (3)) and the pairs of plan.md.
   - §2.2: drop `source` (merged into `paths`, CAS-D17 (1)); add the rule that a component owns
     at least one of code under `coverage.roots`, a contract it provides, a door,
     or is designed/planned and points to the plan or backlog row that makes it (CAS-D20); a
     `retired` row is deleted, its id goes to the successor's `aliases` (CAS-D21); layering values
     apply only to live/designed rows, status is verified against real code (CAS-D19).
   - New subsection on coverage: `coverage.roots` and `coverage.ignore` live in the model; every
     file under the roots belongs to exactly one component by longest prefix (CAS-D17 (2)); edge
     readers per language sit behind one port, Node and Rust in step A (CAS-D17 (3)).
   - §3 `declare`: every `declared` layering required, ring-vs-stack refusal naming both
     layerings and the pair, `sameAs` refusal, owns-nothing refusal, live-contract provider rule
     (CAS-D14, D15, D20, D21). `locate`: answers four layerings, resolves an old id by `aliases`.
   - §4 lifecycle item 4: new rules run in report mode until clean, then block (CAS-D23); step B
     shape is CAS-D24, stated as future.
   - CAS-D25: a short "Four owners" subsection: structure (this component), rules (ACE, which
     points here for machine-checked rules, never the reverse), decision history (D-ADR records;
     an ADR's scope is the id of the component holding the topic), documentation (renders and
     reading paths, no hand-written authority). Remove decision kinds from the header, §2 and §3
     (`--kind decision-kind` gone); add the component field `decisions` (narrative home,
     default the row's `spec`); old scope ids resolve through `aliases`. CAS-D20's owns-something
     list drops "a decision kind".
   - CAS-D26: add the component field `summary` (one sentence, written once at declare and again
     when the responsibility changes); `architecture-map.md` and `component-boundary.md` are
     renders with a short hand-written head; the layout of the layering sections (CAS-D26 (2));
     render writes no prose and calls no model.
   - §7: retitle the history entry "CAS-D1 đến CAS-D26", and add what D14..D26 decided and which
     earlier parts they replaced (CAS-D15 over D11/D12/D13 parts, D16 over ring parts, D22 over the
     `work-driver` parts, D25 over the decision-kind part of D20).
3. Run `fgos doc locate` per the documentation write door before adding the coverage subsection,
   to confirm the spec is the unit that carries the claim.

## Verify

`node scripts/doc-health.mjs` and `node --test test/report/decision-index.test.mjs` (the spec's
history section feeds the decision index); and `rg -n "T8-work|T4-supervisor|\bdebt\b|fromLayering" docs/platform/component-authority/spec.md`
prints only history-section lines. Pass: the doc checks are green and every CAS-D14..D26 point
above has a sentence in the spec.

## Rollback

Discard the branch; the spec on `main` is unchanged until this phase lands.
