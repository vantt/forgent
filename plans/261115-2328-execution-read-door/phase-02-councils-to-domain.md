# Phase 02: the councils move into a named domain and carry their own tier and rigor

Start after: S4 on main, plan approved. Wave 1, parallel with 01 and 03. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F6, F7. Worktree `erd-p02`, report slug `erd-p02-councils-domain`. Effort: 1.5d.
Owner question Q1 (domain name): default `council`; the phase runs with the default and a later answer is a rename.

## Context

The owner's direction (`docs/platform/vision.md` section 6, "Known gaps") moves the councils in `core/workflows` into a
named domain, and the 37 business capability rows travel with that move (phase 05). The loader already discovers
domain workflows (`src/workflow/loader.mjs:25-37`), so the move is data plus the regenerated compiled registry. The
council rows hold the councils' `tier`, `rigor` and seat tiers; this phase writes them into the workflows so phase 05
can delete the rows without changing what a council seat binds to, except the per-row `prefer` order (Q2).

## Requirements

1. `/usr/bin/git mv core/workflows/{architecture-advisory,architecture-advisory-reopen,business-discussion,council-lite,delphi,group-cognition,nominal-group}.yaml domains/council/workflows/`
   (name per Q1). Workflow names do not change; `fgos workflow start <name>` keeps working.
2. For every unit whose `capability` has a row in `core/config-standard/runner.yaml` (F6), write into the workflow:
   the row's `rigor` as the unit's `rigor` (unless the unit already declares one at least as strong), the row's `tier`
   as the seat `tier` of each seat the unit runs (the row's `seats.producer.tier` for the producer seat), and the row's
   `maxTier` as a comment-free note in the report only (a workflow cannot raise the ceiling; the global `maxTier`
   keeps capping). Record a table "capability -> where each field went" in the report; `prefer` stays in the rows until
   phase 05 and its fate is Q2.
3. `domains/council/` gets what `domain-compile.mjs` needs (no `registry.yaml` required, F7) and a short `AGENTS.md`
   stating the domain's doctrine in one paragraph (councils are compositions of Workflow mechanisms; no business case
   in `src/workflow`). Regenerate `domains/council/compiled.json` with the repository's command (`rg -n "compiled.json"
   scripts package.json` to find it); never hand-write it.
4. Update every reference to `core/workflows/<council>.yaml` (`rg -n "core/workflows" bin src scripts core domains docs test .claude`):
   docs, skills (then `npm run build:skills` for the render surfaces), tests' fixture paths. Persona lookup: council
   personas stay in `core/agents` (visible to every domain); `advisor` stays unresolved as today (F7), named in the report.
5. Bytes of what a council seat binds to: run `fgos dispatch explain --for <cap>` style dry binds before and after for
   one seat of each workflow (`test/workflow/core-workflow-seats.test.mjs` owns the seat table) and show identical
   tier and rigor.

## Files

- Move: the seven `core/workflows/*.yaml` to `domains/council/workflows/`.
- Create: `domains/council/AGENTS.md`, `domains/council/compiled.json` (generated).
- Modify: the seven moved files (tier, rigor), files that cite their old path (list in report), render surfaces
  (generated), `test/workflow/core-workflow-seats.test.mjs` (paths), mutation census.
- Delete: `core/workflows/` if empty (check `rg -n "core/workflows" src` for a directory constant first; a constant
  that only names the directory stays if other files remain).
- Tests retired: none. Net size: about +60 / -10 lines plus the moves.

## Steps

1. Record before-bindings; move; write tier/rigor; regenerate; update references; record after-bindings.
2. Gates in phase-lead-rules plus `test/workflow/*.test.mjs` files that `rg -l "core/workflows|council|delphi|nominal-group|group-cognition|architecture-advisory|business-discussion" test` lists, and `test/state/domain-registry-compiled.test.mjs`.

## Acceptance

- `rg -n "core/workflows/(architecture-advisory|business-discussion|council-lite|delphi|group-cognition|nominal-group)" .`
  outside `plans/` finds nothing; `fgos workflow` lists the seven workflows with `owningDomain: council`.
- Before/after binding table identical in tier and rigor for every council unit.

## Risks / rollback

- A seat's tier changes because the row's tier was the only source (M x M): the before/after table catches it.
- Domain visibility hides a persona (L x M): council personas are core. Revert = one commit (git mv back).
