# Phase 6: Program close

Capability: `code:test`. Read-only over the tree; writes one report.

## Gate

Phase 5 is closed (`reports/phase-05-close.md`).

## Inputs

- Every layer close report (`reports/phase-01-close.md` … `reports/phase-05-close.md`) and the phase 0 report.
- `plan.md` acceptance criteria 6–9; discussion §3 rows H1–H7 and C5.

## Files it may write

`plans/261124-1026-harden-next-round/reports/program-close.md`

## Steps

1. On current `main`, run `npm test` alone, then `cargo test --workspace` alone; record the SHA and counts.
2. Check acceptance criteria 6–9 of `plan.md` with their commands:
   `grep -lE '^retiredBy:.*\b(S7|S6b)\b' packages/component-authority/model/doors/*.yaml` (empty),
   `grep -c '"legacy-cli"' packages/host-runtime/contracts/command-routes.json` (0),
   `git ls-files 'src/*.mjs' 'bin/*.mjs'` (empty).
3. List each HARDEN carry-over (H1–H7, C5) with the phase report that closed it or the owner answer that declined it.
4. Run `fgos doctor` and the smoke on the activated release on this machine.
5. Write the report, including the before/after summary across all layers and the summed net Δ.

## Verify

`reports/program-close.md` shows criteria 6–9 met on one recorded SHA, both suites green, and doctor and smoke green.

## Rollback

Delete the report.
