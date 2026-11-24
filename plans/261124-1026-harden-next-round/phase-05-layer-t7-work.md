# Phase 5: Layer T7 Work, last (program step S7)

Capability: `code:review` for steps 1–3; the implementation runs in the sub-plan.

This phase is program step S7 of `plans/261114-2051-rust-verb-migration-program` (D18), run as the HARDEN loop. It
carries S7's exit items from that program row (zero `legacy-cli` routes, migration doc §12 removal gates, F0 twin rows
retired, bridged doctor rows into Rust, `init`'s Work-store step into Rust, `src/setup/doctor-bridge.mjs` and its host
caller deleted) unless the decision 78 council deletes or shrinks Work instead.

## Gate

All must hold:

- Phase 4 is closed (`reports/phase-04-close.md`), after the packaging release (option B of 2026-11-18).
- Discussion `plans/discussions/ds-ubqlutna6r-domain-agnostic-item-component/DISCUSSION.md` is settled and its plan
  has landed (D19). When that plan exists, add its directory to this phase's sub-plan `blockedBy`.

## Inputs

- Phase 0 report: rows for `work-state`, `runner` (tier 7), the domain components and the Work arms of `host-surface`;
  triage (always full, decision 78); job → doors map; door rows assigned to T7 (D21).
- Discussion §6 inventory rows 11, 12, 17, 18 and 19 (Work arms); §3 O1, H4 (WORK ledger rows); the doctor debt 2f
  handed over by doors (D6).
- Decision 78: `plans/261021-1118-harden-low-layers-bottom-up/lessons.md` (lines near 13, 104, 152).
- Program row S7: `plans/261114-2051-rust-verb-migration-program/plan.md`.

## Files it may write

`plans/261124-1026-harden-next-round/reports/phase-05*`. Code, specs and the model change only through the sub-plan.

## Steps

1. Open the decision 78 council. Its first question is keep, shrink or delete Work (D18), under the owner's frame: a
   flexible storage core plus the human touch points of lifecycle, gate and question, and artifact. The answer goes
   into the batched owner ask.
2. Then run the per-layer loop as phase 1 lists it (steps 1–9), on the shape the owner settled.
3. The sub-plan removes the last `legacy-cli` route, the `legacy-node` payload (`bin/fgos.mjs` and `src/**/*.mjs`)
   and the `native` door, with every caller in the same change (L10).

## Verify

`reports/phase-05-close.md` holds the phase 1 close evidence, plus: every door row assigned to T7 closed,
`grep -c '"legacy-cli"' packages/host-runtime/contracts/command-routes.json` is 0, and
`git ls-files 'src/*.mjs' 'bin/*.mjs'` prints nothing.

## Rollback

Code reverts through the sub-plan; delete this phase's reports.
