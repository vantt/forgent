# Step 7 preassembly dry run

Pinned source commit: `36f195a64f9ab4968bd0b4b529dca7704dc60bd2`.

This is a deterministic pre-pin assembly. It changes no disposition and makes no readiness claim.

## Counts

- `applied-safe`: 0
- `prepared-for-cutover`: 376
- `preserved-history/fixture`: 7526
- `individually parked`: 2311
- `rejected-not-consumer`: 36191
- consumer-class rows: 10213 (5,249 ADMIT; 4,964 admission-unspecified)
- rejected rows checked separately: 36191
- blocked row-readiness entries: 2687
- patch specifications: 204
- changed-candidate union: 48
- park families: 23; members: 2311
- alias writer violations: 0
- rows fitting no class/family: 0

All REJECT rows use `rejected-not-consumer`; every one resolves a non-null value through the matrix custody catalog. `applied-safe` remains in the vocabulary at zero and the assembler stops if a future row lacks applied-edit evidence.

## Output sizes

- `step-07-consumer-cutover-matrix.json`: 4059788 bytes
- `step-07-patch-order.json`: 163400 bytes
- `step-07-readiness.json`: 245413 bytes
- all four generated outputs: 4470421 bytes (limit: < 6000000 bytes)

## Explicit blockers

- `Phase-9-main-reference-reconciliation`: 1
- `Plan-B-is-draft-and-phase-06-does-not-exist`: 1
- `dead-vocabulary-guard`: 1
- `delivery-and-rehearsal-receipts-missing`: 1
- `digest-bound-AGENTS-two-line-reconciliation`: 1
- `entry-by-entry-independent-review`: 1
- `final-pin-bounded-export-not-taken`: 1
- `final-pin-composition-and-review`: 16
- `main-import-cutover-step`: 1
- `this-is-pre-pin-dry-run`: 1
- `two-stale-code-citations`: 1

## Final-pin rerun

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-08/step-07-assemble.py --pin <final-commit> --output-dir plans/260925-documentation-authority-unification/reports/phase-08
```
