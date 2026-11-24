# Phase 4: Integration, land, activate and close

Capability: `code:test`.

## Inputs

- The phase 2 and phase 3 branches; `reports/facts.md` (the baseline); the acceptance criteria of `plan.md`.

## Files it may write

`plans/261124-1030-checkout-crate-create-prune-held-remove/reports/close.md` only.

## Steps

1. Merge phases 2 and 3 onto current `main` in one worktree; record the commit.
2. Run `npm test` alone, then `cargo test --workspace` alone (never in parallel, one cargo build per worktree).
3. Ask the lead to land the branch. After it lands, build and activate the release on this machine, then run
   `fgos doctor` and the smoke run through the installed shim (step 7, D11). The owner lands other machines.
4. Re-measure (step 8): the same commands, machine and load class as the phase 1 baseline.
5. Write `reports/close.md`: the commit, acceptance criteria 1–6 with evidence, the before/after table, the net Δ
   (Node + Rust + test) ≤ 0 or the deletion that pays for each increase, and doctor and smoke results.

## Verify

`reports/close.md` shows all six acceptance criteria met on one recorded commit and the release active on this
machine.

## Rollback

Delete the report. A bad release is rolled back with `fgctl repair`; the code is reverted as `plan.md` says.
