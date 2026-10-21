# Step 7 preassembly dry run

Pinned source commit: `9f708a7ebc9b8ab80710b4dd47007515b1bb7081`.

This is a deterministic pre-pin assembly. It changes no disposition and makes no readiness claim.

## Counts

- `applied-safe`: 36191
- `prepared-for-cutover`: 376
- `preserved-history/fixture`: 7526
- `individually parked`: 2311
- `unmatched`: 0
- patch specifications: 204
- changed-candidate union: 48
- park families: 23; members: 2311
- alias writer violations: 0
- rows fitting no class/family: 0

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
