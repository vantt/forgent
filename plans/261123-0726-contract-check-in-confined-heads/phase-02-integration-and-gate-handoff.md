# Phase 2: Integration, confined proof and gate hand-off

Capability: `code:test`.

## Inputs

- `plans/261123-0726-contract-check-in-confined-heads/plan.md` (Acceptance criteria 3 and 4, Non-goals).
- Phase 1's landed commit.
- `plans/261122-0118-heads-stable-and-able/phase-03-land-plan-check.md` step 3 (the gate entry) and that plan's
  Progress line about `14287de27`.

## Files it may write

`plans/261123-0726-contract-check-in-confined-heads/reports/`.

## Steps

1. On the trunk with phase 1 landed, run the full gate: `npm test` and `cargo test --workspace`. Record the result in
   `reports/integration.md`. A red outside this plan's footprint gets classified with its cause; it is never waved
   through.
2. From a confined head (`FGOS_CONFINED=1`), with a fresh staged addon and no env set by hand, run
   `node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads` and one other
   script from the Facts list (for example `node scripts/check-backlog-reconciliation.mjs`). Record the commands,
   exit codes and output tails in the same report.
3. Write the gate hand-off in that report, in one paragraph addressed to the supervisor. The hold condition of
   `14287de27` is met (release `3b595f7c` substitutes `{plans}`), and this plan's fix is on trunk. heads-stable can
   now restore `node scripts/plan-contract-check.mjs {plans}` in `land.gates` through `fgos config patch`. The lead
   raises it to the supervisor with the report path.

## Verify

`reports/integration.md` exists and shows: full gate green or every red classified; the confined check exit 0; the
hand-off paragraph.

## Rollback

Delete the report. Nothing else changes.
