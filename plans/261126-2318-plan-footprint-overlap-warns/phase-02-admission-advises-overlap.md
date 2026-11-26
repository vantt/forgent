# Phase 2: admission no longer holds on overlap; the read view lists it as advice

Run by the lead of plan `261122-0056-orchestration-skeleton` (Keeper) as one of its own phases, by owner answer B
to `q-kyzictpkf6`. Phases 1 and 2 change the two doors together: land them as one change, or back to back with no
release in between. Keeper's footprint covers every file below.

## Inputs

- `plan.md`: Outcome, "Admission advice shape", acceptance criterion 2.
- `packages/supervision/rust/src/portfolio.rs`: `admissible` and `admission_hold` (`:269-296`).
- `packages/supervision/rust/src/supervisor.rs`: `PlanRow`, `plans` (`:96-139`), `PlansView::to_json` (`:233-255`).
- `packages/supervision/rust/src/wake.rs:520-560` (the judgement filter names `held-footprint-overlap`).
- `packages/write-scope/src/lib.rs`: `colliding_pairs` and `Pair { a, b, shared }`.
- Tests: `packages/supervision/rust/tests/portfolio.rs`
  (`a_plan_whose_footprint_overlaps_a_running_plan_is_not_admissible`), `packages/supervision/rust/tests/wake.rs`
  (`a_new_admission_holds_overlapping_ready_plans_in_the_same_wake`, and the `leadUnnamed` JSON test near `:526`).

## Files this phase may write

- `packages/supervision/rust/src/portfolio.rs`, `supervisor.rs`, `wake.rs`
- `packages/supervision/rust/tests/portfolio.rs`, `packages/supervision/rust/tests/wake.rs`

## Steps

1. `admission_hold` keeps `held-blocked` and the footprint problems (`footprint-empty`, `footprint-entry-invalid`)
   and loses the overlap branch. Update its and `admissible`'s doc comments.
2. Add one portfolio function, beside `footprint_problem`, that answers a `ready` plan's overlaps with the `running`
   plans: `Vec<(running_dir, shared_entries)>`, computed with `fgos_write_scope::colliding_pairs` (not a new
   overlap rule; the door `footprint-write-scope-overlap-rule` lists the allowed overlap call sites, so do not add a
   `scopes_overlap`/`overlaps` call; if the architecture test still flags the new call, add the allowed site in the
   same change and say so in the report). A plan whose footprint cannot be compared has no overlaps.
3. `PlanRow` gains `overlaps`; `plans` fills it for `ready` rows; `to_json` writes
   `"overlaps": [{"plan": ..., "paths": [...]}]` only when non-empty.
4. `wake.rs`: drop `held-footprint-overlap` from the judgement filter. The in-wake reservation (a plan admitted in
   this wake becomes `running`) stays; it no longer holds anyone back.
5. Tests, in the owning files: the portfolio test becomes "a plan whose footprint overlaps a running plan is
   admissible and its row lists the overlap" (checks `admissible` and the `overlaps` JSON with the shared path);
   the wake test becomes "two overlapping ready plans are both admitted in one wake" (capacity 2, both admitted, no
   `held-footprint-overlap` decision). Any other test asserting the hold is retired with a line in the report
   naming the test that now owns the behaviour.

## Verify

`cargo test -p fgos-supervision --test portfolio --test wake` and `cargo fmt --all --check` pass;
`rg -n "held-footprint-overlap" packages apps src scripts core` finds nothing.

## Rollback

`git revert` the phase commit; the hold and its tests return.
