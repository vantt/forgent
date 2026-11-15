# Phase 02: the councils move into a named domain

Start after: S4 on main, plan approved. Wave 1, parallel with 01, 13, 14. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F6, F7. Worktree `erd-p02`, report slug `erd-p02-councils-domain`. Effort: 1d.
Owner question Q1 (domain name): default `council`; the phase runs with the default and a later answer is a rename.

## Context

The owner's direction (`docs/platform/vision.md` section 6, "Known gaps") moves the councils in `core/workflows` into a
named domain; the business capability rows travel with the move (05). The loader already discovers domain workflows
(`src/workflow/loader.mjs:25-37`), so this phase is a data move. The councils' tier and rigor move into the workflows in
05 (with 14's unit tier), after the rows are gone, so this phase changes no binding.

## Requirements

1. `/usr/bin/git mv core/workflows/{architecture-advisory,architecture-advisory-reopen,business-discussion,council-lite,delphi,group-cognition,nominal-group}.yaml domains/council/workflows/`
   (name per Q1). Workflow names do not change; `fgos workflow start <name>` keeps working.
2. `domains/council/` gets a short `AGENTS.md` stating its doctrine in one paragraph (councils are compositions of
   Workflow mechanisms; no business case in `src/workflow`). **No `registry.yaml` and no `compiled.json`**: without a
   registry `compileDomain` writes nothing (`domain-compile.mjs:22-26`), and a registry would make `council` a Work
   domain (`domain-registry.mjs:66-82`). The council domain is not a Work domain; a test asserts the Work domain set
   (`DOMAINS`) is unchanged.
3. Update every reference to the old paths (`rg -n "core/workflows" bin src scripts core domains docs test .claude`):
   docs, skills (then `npm run build:skills`), tests' fixture paths; if a constant in `src` names the `core/workflows`
   directory and other files remain there, it stays.
4. Persona lookup: council personas stay in `core/agents` (visible to every domain); `advisor` stays unresolved as today
   (F7), named in the report.
5. Check: `fgos workflow` lists the seven workflows with `owningDomain: council`; the doctor row `seat-binding-dry-bind`
   result is unchanged (the rows still exist).

## Files

- Move: the seven `core/workflows/*.yaml` to `domains/council/workflows/`.
- Create: `domains/council/AGENTS.md`.
- Modify: files citing the old paths (list in report), render surfaces (generated), the workflow tests that name the
  paths (`test/workflow/core-workflow-seats.test.mjs` and those `rg -l "core/workflows" test` lists), one assertion that
  the Work domain set is unchanged (in the test that owns `DOMAINS`, `test/state/domain-registry*.test.mjs`), mutation census.
- Delete: `core/workflows/` if empty. Tests retired: none.
- Net size: about +25 / -5 lines plus the moves.

## Acceptance

- `rg -n "core/workflows/(architecture-advisory|business-discussion|council-lite|delphi|group-cognition|nominal-group)" .`
  outside `plans/` finds nothing; Work's domain list unchanged; dry-bind row unchanged.

## Risks / rollback

- Domain visibility hides a persona (L x M): council personas are core. Revert: one commit (git mv back).
