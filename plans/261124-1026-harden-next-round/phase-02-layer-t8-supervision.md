# Phase 2: Layer T8 supervision

Capability: `code:review` for steps 1–3; the implementation runs in the sub-plan.

## Gate

Phase 1 is closed (`reports/phase-01-close.md`). Placed second by D17.

## Inputs

- Phase 0 report: the `supervision` rows, triage weight and job → doors map.
- Discussion §6 inventory row 21; §3 C5 (the stale T8 tier name in `layers.yaml`), N4, N11; D17.
- `src/portfolio/`, `packages/portfolio/*.mjs`, `packages/supervision/rust/`.
- The per-layer loop (discussion §6; HARDEN `261021-1118` "The per-layer loop").

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-02*`. Code, specs and the model change only through the sub-plan.

## Steps

Run the per-layer loop exactly as phase 1 lists it (steps 1–9), with these inputs. With so little Node code, the
council is one shared seat round if the triage says full, or none if it says light (N4). The sub-plan fixes C5 in the
model and moves `packages/portfolio/*.mjs` and `src/portfolio/` callers (including script callers) onto the Rust
owner, deleting the Node side in the same change.

## Verify

`reports/phase-02-close.md` holds the same close evidence as phase 1 (before/after, net Δ, Highs, doctor and smoke on
this machine, both suites green, refreshed map rows).

## Rollback

Code reverts through the sub-plan; delete this phase's reports.
