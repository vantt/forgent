# Phase 4: Two-clone race, spec and integration

Decision D7 of [ds-izibwo45vm](../discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md), plus acceptance
criterion 7. Needs phases 1 and 3 on the integration tree.

## Inputs

- `apps/fgos/tests/supervision_verbs.rs`: the existing fixture "a project clone of a bare remote" (around line 86)
  and the admission tests that use it.
- `docs/platform/supervision/spec.md` §1.2 (admission), §2 (shared entities), §5 (flows), §6 (failure modes),
  §8 (decision history), and the admission text near line 265 (`lead`, `leadLive`, `leadUnnamed`).
- `changelog.d/README.md` (fragment format).

## Files it may write

`apps/fgos/tests/supervision_verbs.rs`, `docs/platform/supervision/spec.md`,
`changelog.d/261127-1536-plan-claim-who-and-where.md`, `plans/261127-1536-plan-claim-who-and-where/reports/integration.md`.

## Steps

1. Race test: two clones of one bare remote, each with its own state root and a different machine id, both see one
   `ready` plan with no `host`. Run admission in both so both commit locally before either pushes. This is
   deterministic: hold one clone's push until the other's has landed. Assert that origin has exactly one claim
   commit, whose `host` is the winner's id. Assert that the loser's local main equals origin, that its `plan.md`
   bytes equal origin's, that it started no lead, and that its next `supervisor plans` shows the plan as
   `runningElsewhere: <winner>`. If the test finds a last-writer-wins path, stop and report it. Do not add a lock
   (D7).
2. Spec: state the placement record (`host` on ready and running plans), the admission order (catch-up with own
   leftover push, stale check, one commit with four keys, lead only on a landed commit), the push-outcome table, the
   reason codes `held-other-machine:<host>` and `host-unnamed`, the `runningElsewhere` view field, and who may write
   `host`. Add one decision-history entry citing ds-izibwo45vm D2 and D4-D9.
3. Changelog fragment `changelog.d/261127-1536-plan-claim-who-and-where.md` with one `- Changed:` bullet about plan
   placement and the admission commit that now either reaches origin or is undone.
4. Integration: merge the phase branches, run the full gate on the combined tree and record the result in
   `reports/integration.md`.

## Verify

`cargo test -p fgos --test supervision_verbs`, then `npm test` and `cargo test --workspace` green on the combined
tree, and `node scripts/plan-contract-check.mjs --all` with no new errors.

## Rollback

Revert the phase commit. The race test and spec text go; phases 1-3 stay independently revertible.
