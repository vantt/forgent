# Phase 2: Friction layer value for owner communication

Capability: `code:implement`. Wave 1, no dependencies.

## Inputs

- Discussion OC-D4 and OC-D14 (`plans/discussions/ds-cfsfcbknl6-owner-communication/DISCUSSION.md`, section 4).
- `packages/observe/rust/friction-kinds.json`: the declared value lists (`attrs."fgos.friction.layer".values`,
  `fgos.friction.kind`, `fgos.friction.disposition`).
- `packages/observe/rust/src/friction.rs`: embeds that file with `include_str!` (line 27), but the record door checks
  `input.layer` against `PUBLISHED_LAYERS` (line 42, a hand copy of the JSON list), and likewise `PUBLISHED_KINDS`
  and `PUBLISHED_DISPOSITIONS`. Adding a value to the JSON alone is therefore not enough today.
- `docs/platform/observe/spec.md` line 154: the spec's copy of the layer list, and its sentence "Thêm giá trị là sửa
  file khai báo đó, không sửa code đọc" (adding a value edits the declaration, not the reading code).

## Files it may write

`packages/observe/rust/friction-kinds.json`, `packages/observe/rust/src/friction.rs`, `docs/platform/observe/spec.md`.

## Steps

1. Add `"owner-communication"` to `attrs."fgos.friction.layer".values` in `friction-kinds.json`.
2. In `friction.rs`, replace the hand-copied `PUBLISHED_LAYERS`, `PUBLISHED_KINDS` and `PUBLISHED_DISPOSITIONS`
   lists with values read once from the already-embedded `friction-kinds.json` (the same parse the record kinds use;
   reuse it, add no second parser). Keep the public names or their callers' behaviour; the refusal text still lists
   the accepted values. Run impact analysis on the three constants first (`fgos dispatch decide --for
   impact-analysis --json`, then the tool or `rg`), and move every caller in this change.
3. Extend the existing unit test in `friction.rs` that refuses an invalid layer (around line 1321) with one accepted
   record whose layer is `owner-communication`; do not add a second test.
4. Add the value to the layer list in `docs/platform/observe/spec.md` line 154, with a few words: talking to the
   owner (questions, reports, presentation).

## Verify

```bash
cargo test -p fgos-observe
git grep -n '"attestation",' -- packages/observe/rust/src/friction.rs   # prints nothing: no hand copy left
```

Pass: tests green, the new value accepted, and no hand-copied list left.

## Rollback

`git revert` the phase commit.
