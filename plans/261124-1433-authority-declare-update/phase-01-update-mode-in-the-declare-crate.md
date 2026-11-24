# Phase 1: Update mode in the declare crate

Capability: `code:implement`

## Inputs

- `plans/261124-1433-authority-declare-update/plan.md` (sections Facts and Approach).
- `packages/component-authority/rust/src/declare.rs`: `DeclareRequest`, `declare`, `plan_component`,
  `require_new_names`, `plan_move` (the YAML-door edit pattern), and the tests module (`project`, `component_row`,
  `run`, `code`).
- `packages/component-authority/contracts/model.v1.json`: the component row schema.
- `docs/platform/component-authority/spec.md` §3.2.

## Files it writes

`packages/component-authority/rust/src/declare.rs`, `packages/component-authority/rust/src/lib.rs` (only if the
public API exports need a change).

## Steps

1. Add `update: bool` to `DeclareRequest`, with a doc line: it updates an existing component row; the row carries
   `id` and the fields to change, and each given field replaces the row's field.
2. In `declare`, refuse `update` with any kind other than `Kind::Component`. Use code `update-unsupported`, worded
   like `move-unsupported`. Also refuse `update` together with `move_owner`.
3. Extract the field and reference checks of `plan_component` into one function,
   `check_component(model, root, &component)`. It covers id pattern, meaning, layer, status, tier range, exceptions,
   names, parent, paths, spec, source and exception paths. `plan_component` keeps its own `id-taken` check and then
   calls this function, so new-row behaviour does not change.
4. Add `plan_component_update(model, dir, root, row, present)`:
   - The row is an object with a string `id`. An id not in the model is refused with `reference-missing`.
   - Refuse a `parent` in the row that differs from the current one (including adding or removing it) with
     `update-changes-parent`. The detail says a parent change is an owner question. A row that names the same parent
     is accepted.
   - Build the merged row from the current row (serialize the model's `Component`), with the given fields replacing
     its fields. Decode it as `Component`.
   - Run `check_component` against a copy of the model with this row removed. The name check then compares only
     against other rows, and the update needs no `id-taken` exception.
   - Write each changed field through the YAML door, as `plan_move` does
     (`document.set(&[Segment::Index(i), Segment::Key(field)], value, CommentLoss::Refuse)`). If the door cannot
     insert a key the row lacks, replace the whole item at `Segment::Index(i)` with `ordered(merged,
     COMPONENT_ORDER)`. Either way, read the result back and prove it equals the old rows with only this row
     changed, the way `append_item` proves its append.
5. Skip `require_answered` for an update.
6. Tests in the existing `tests` module, one per behaviour, titles in plain words:
   - An update changes `paths`, `owns` and `status` of an existing row. The model reloads with the new values, and
     the note above the first row survives.
   - An update that sets a field the row did not have (for example `reason`) loads with the model.
   - An update is refused by code for an unknown id, a changed parent, a kind other than component, and a merged
     row that fails a new-row check: a bad status (`row-invalid`), a missing path (`path-missing`), and an alias
     another row uses (`name-taken`). An update that keeps the row's own canonical name and aliases is accepted,
     which proves the name check skips the row itself. A refused update leaves every model file byte-identical.
   - An update needs no approving question (run it with an approvals port that answers `Unknown`).

## Verify

`cargo test -p fgos-component-authority` passes. `cargo clippy -p fgos-component-authority -- -D warnings` passes.

## Rollback

Revert this phase's commit. No other file depends on the new field until phase 3.
