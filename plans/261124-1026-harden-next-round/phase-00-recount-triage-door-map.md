# Phase 0: Recount, triage and one-door map (gated)

Capability: `code:test`. Read-only; it changes no code and writes reports only (D27).

## Gate

Start only when both hold (O7, D6, D22, D27):

- `plans/261121-2110-component-authority-doors/plan.md` says `status: done` (12a, 12b and 12d landed; 12c was
  withdrawn there and moved into `261122-2108`);
- `plans/261122-2108-delete-dead-node-execution-closure/plan.md` says `status: done` (its phase 11 is the old 12c).

## Inputs

- `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`: §3 (H1–H7, C5, N4, N6, N13), §4 (D9, D13, D15,
  D21, D24), §6 (the inventory and the loop).
- `plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md` §5 (the inventory method).
- `packages/component-authority/model/` (`components.yaml`, `layers.yaml`, `contracts.yaml`, `decision-kinds.yaml`,
  `doors/`), and `fgos authority locate`.
- `test/architecture.test.mjs` (`NAMED_DOOR_DEBT`), `packages/host-runtime/contracts/command-routes.json`.
- The HARDEN root closing report: `plans/reports/closing-261118-1344-harden-root-closing.md` (§1–§7).

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-00*` (for example `reports/phase-00-recount.md`).

## Steps

1. **Recount (D9).** Rerun the ds-wham5txfkv §5 method on current `main`. Produce the §6 table again: area,
   component (tier), kind, files and lines, tests, what Rust owns, live callers, owning phase of this plan. Record the
   main SHA, the `legacy-cli` route count and `git ls-files 'src/*.mjs' 'bin/*.mjs' | wc -l`.
2. **H5 (N6).** Run alone: `node --test test/cli/fgos-workflow.test.mjs` and the instruction-projection test the
   HARDEN closing report §5 names. Record pass or fail for each.
3. **Triage (D13).** For every component in the recount, write the council weight (full, light or skip) and the reason,
   by the rules of discussion §3 row N7: full when authority, contracts or door are unsound (status `designed`,
   per-file layer exceptions, contract evidence pointing at Node, door debt, a `mustNotOwn` breach sign, more than one
   door for a job); light when only inside work remains; skip for a facade, thin client or dead code (D1). T7 Work is
   always full.
4. **One-door map (D15).** For every job in the model (`owns`, `mustNotOwn`, decision kinds, contracts, door rows),
   list every door that does it, over `src`, `bin`, `scripts`, `apps`, `packages` and the hooks, Node and Rust. Mark
   the door kept (the lowest layer that needs it) and the phase that deletes each extra door. A job the model lacks is
   listed for the model's owner, not added here.
5. **Assign the named debt (D21, D22).** Each door row whose `retiredBy` names S6b or S7 gets one phase: T6, T7 or T9.
   Include the severity each row carries (D24).
6. **Confirm N4:** T8 is the `supervision` component. Name C5's stale tier name for phase 2.
7. Write the report and update this plan's phase 1–5 files only if the recount moves a row between phases (note it in
   the report; this phase writes no other file).

## Verify

The report contains, on one recorded SHA: the recounted table, the two H5 results, the triage column for every
component, the job → doors map, the phase for each of the S6b/S7 door rows, and the N4 answer.

## Rollback

Delete the report.
