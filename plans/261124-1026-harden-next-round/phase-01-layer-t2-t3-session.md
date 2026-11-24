# Phase 1: Layer T2–T3 session

Capability: `code:review` for steps 1–3 (baseline, council, arbitration); the implementation runs in the sub-plan.

## Gate

Phase 0's report exists. The baseline (step 1) is taken after the control-group bug rows of D20 have landed; a row
still open then becomes an input to this phase's tables (D14, D20). Steps 1–3 need no other wait (D12).

## Inputs

- Phase 0 report (`reports/phase-00*`): this layer's recount rows, triage weights and job → doors map.
- Discussion `plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`: §6 inventory rows 10, 13 and 14; §3
  H6, H7, N3; D12, D13, D14, D20, D23–D26.
- Components: `session-rotation`, `session-host`, and the dispatch live rest reached only from heads.
- `src/git/main-checkout-delete-guard.mjs` (belongs here, D12; its verdict authority is settled by this council).
- Debt `p-rypvkc3kai` (herdr shim, D23) and every door row phase 0 assigned here.
- The HARDEN loop: `plans/261021-1118-harden-low-layers-bottom-up/plan.md` "The per-layer loop".

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-01*` (baseline, council, arbitration, close). Code, specs and the
model change only through the sub-plan, which has its own footprint.

## Steps (the per-layer loop, discussion §6)

1. **Baseline:** owned routes p50/p95 cold and warm, tests and wall time, LOC Node/Rust/test, open backlog rows, doctor
   rows and setup steps; main SHA. Recheck this layer's triage rows.
2. **Council** only for components triaged full: boundary first (authority and mustNotOwn, contracts and ports, one
   door per job from the phase 0 map, Rust/Node boundary, delete list), then inside changes that must happen (bugs,
   High findings, twins, dead code). Output: migration, delete, doctor and tests tables. Light components go straight
   to the sub-plan.
3. **Arbitration and one batched owner ask** (`fgos questions ask`, five-part form): target shapes, Critical items,
   triage overrides, proposed additions (RUL104), landing slot.
4. **Sub-plan** at `fgos convention path --kind plan`, under the plan contract: Create / Modify / Delete / Tests to
   retire, a net-size line per phase, an Authority map; debts ordered by severity (D24, D25). Link it here.
5. **5–6:** the sub-plan's leads implement; verify independently.
6. **7 Land:** release, activation, doctor and smoke on this machine (D11).
7. **8 Re-measure** on the same machine and load class.
8. **9 Close:** no High left unreproduced; net Δ ≤ 0 or each increase names its paying deletion. Refresh the job →
   doors map for this layer.

## Verify

`reports/phase-01-close.md` holds the before/after table, the net Δ line, the High-findings status, doctor and smoke
results on this machine, `npm test` and `cargo test --workspace` green on main, and the refreshed map rows.

## Rollback

Code reverts through the sub-plan. This phase's own reports are deleted and its row set back to `ready`.
