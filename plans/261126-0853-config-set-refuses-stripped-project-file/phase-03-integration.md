# Phase 3: Integration

Capability: `code:test`. Depends on: 1, 2. Wave 2.

## Inputs

- The landed commits of phases 1 and 2, and `plan.md`'s acceptance criteria.

## Files this phase may write

`plans/261126-0853-config-set-refuses-stripped-project-file/reports/integration.md`.

## Steps

1. On the combined tree (main after both phases landed), run the full gate:
   `npm test` and `cargo test --workspace`.
2. Check each acceptance criterion of `plan.md` against the tree and write `reports/integration.md`: one line
   per criterion with its evidence (command and result, or file and line).
3. For any failing test, show whether it reads or touches a file in this plan's footprint
   (`git log --oneline <base>..HEAD -- <failing test file>` and the failure output). A failure from outside is
   recorded with its evidence, not fixed here. A failure from inside goes back to the phase that owns the file.
4. If phase 2 recorded a guard with no owning test outside its footprint, raise it as a follow-up
   (`fgos supervisor raise`), not as a plan edit.

## Verify

```bash
npm test
cargo test --workspace
```

Pass: both green, or each failure shown to come from outside this plan's footprint, in the report.

## Rollback

Nothing to undo; this phase writes only its report.
