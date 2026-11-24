# Phase 12d2: Write the severity value into every door row, and make the field required

## Why now
Owner decision D24 (`plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`, row N18) gives every door row a
one-word `severity`. Phase 12d shipped the expand half: `packages/component-authority/contracts/model.v1.json` and the
crate accept an optional `severity`. The rows could not carry it yet. Every model reader (the architecture test, the
instruction registry, decision-index, `fgos authority locate`) loads the model through the activated host. That host
refuses an unknown field (`deny_unknown_fields`), so rows with `severity` would break every reader on main until a
release that knows the field is activated. Phase 10b waited for its release in the same way.

## Waits for
A release that carries phase 12d's crate change, staged and activated in the main checkout (`fgos doctor`
`active-release-matches-checkout`, or the supervisor's release note). Check it with: the activated host's
`fgos authority model --json` loads a door row that has `severity: low`.

## Inputs
- `reports/unit-261124-1109-p12d-door-severity-values.md`: the value for each of the 83 rows (5 high, 7 medium,
  71 low) and the reasons for high and medium.
- A row added or changed since then gets its value from the N18 rules in that report's header.

## Files it may write
packages/component-authority/model/doors/, packages/component-authority/contracts/model.v1.json,
packages/component-authority/rust/, docs/platform/component-authority/spec.md

## Steps
1. Write `severity: <value>` right after `kind` in every door row, from the report.
2. Make `severity` required: add it to `required` in the door schema of `model.v1.json`, make the `Door` field
   non-optional in `model.rs`, and move it to the required list in `tests/model_checks.rs`.
3. In `docs/platform/component-authority/spec.md`, say that the field is required, and append to the 12d
   decision-history line.

## Verify
- `cargo test -p fgos-component-authority` is green, and `cargo fmt --all --check` is clean.
- `node --test test/architecture.test.mjs` passes except A4, with the activated host.
- Every file in `packages/component-authority/model/doors/` has `severity`.

## Rollback
Revert the commit. The rows lose the field, and the field becomes optional again.
