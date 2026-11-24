# Phase 4: Layer T9 host, surface, packaging and report

Capability: `code:review` for steps 1–3; the implementation runs in the sub-plan (or sub-plans, one per component
group, if the council splits it).

## Gate

Phase 3 is closed (`reports/phase-03-close.md`).

## Inputs

- Phase 0 report: rows for `host-surface` (non-Work arms), `packaging-distribution`, `learning-docs-registry`,
  `host-invocation-routing` and `fgos-gateway`; triage weights; job → doors map; door rows assigned to T9 (D21),
  including `no-node-from-native-packaging` and `node-rows-bridge` (D22).
- Discussion §6 inventory rows 1, 19 (non-Work arms), 20 and 22; §3 H2 (T9 carry-over: 211-module entry, doctor time,
  PATH walkers, did-you-mean and doctor-row copies, H9b, H9c, H11), H3 (packaging carry-over, 14 MUST fails),
  the `hook` route's remaining Node arms.
- `src/setup/`, `src/verbs/`, `src/report/`, `src/cli/`, `bin/`, `apps/fgos/`, `packages/distribution/`.

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-04*`. Code, specs and the model change only through the sub-plan.

## Steps

Run the per-layer loop as phase 1 lists it (steps 1–9). The council works through the H2 and H3 carry-over rows and
closes or declines each with a source. The `legacy-node` payload and the `native` door stay until phase 5 (T7)
removes their last callers; this phase removes every non-Work `legacy-cli` route it owns.

## Verify

`reports/phase-04-close.md` holds the phase 1 close evidence, plus: each H2 and H3 row closed or declined by the owner,
every door row assigned to T9 closed, and the remaining `legacy-cli` count (Work routes only).

## Rollback

Code reverts through the sub-plan; delete this phase's reports.
