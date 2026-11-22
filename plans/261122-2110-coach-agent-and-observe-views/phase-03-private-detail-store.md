# Phase 3: Private detail store

Capability: `code:implement`. Wave 1. Depends on nothing. Decision: CA-D4.

## Inputs

- `plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md`, section 3 row "Privacy of detail",
  section 6 "Private detail", CA-D4.
- `packages/observe/rust/src/friction.rs`: `RecordInput.detail`, `stamped_detail`, `DETAIL_REDACTION_REV`, the record
  write in `record`, and `show`/`list` (they print `detail`).
- `packages/observe/rust/src/friction_cli.rs` (flag parsing for `fgos friction record`).
- `packages/observe/rust/src/record/types.rs` (`Redaction`, `DETAIL_MAX_BYTES`) and `packages/observe/rust/src/record/store/`
  (`RECORDS_STORE`, the writer id used for shard names).
- `packages/observe/rust/src/store_lock.rs` (one lock door; reuse it, never a second lock).
- `src/cli/command-registry.mjs` and `packages/host-runtime/contracts/command-manifest.json` (the `friction record`
  flag rows), `test/cli/subcommand-flag-drift.test.mjs`.

## Files it may write (footprint)

`packages/observe/rust/src/private_detail.rs` (new), `packages/observe/rust/src/friction.rs`,
`packages/observe/rust/src/friction_cli.rs`, `packages/observe/rust/src/lib.rs`,
`packages/observe/rust/tests/private_detail.rs` (new: a new boundary, so a new file), `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-manifest.json`, `test/cli/subcommand-flag-drift.test.mjs`.

## Steps

1. **The store.** In `private_detail.rs`, expose one append and one read:
   - `append(root, writer_id, record_id, text)` appends one JSON line `{recordId, ts, text}` to
     `.fgos/observe/private/<writerId>.jsonl` under the existing store lock. Before the first write it creates the
     directory and `.fgos/observe/private/.gitignore` containing `*`, so the store is ignored in every project
     without touching the root `.gitignore`. Text is capped at `DETAIL_MAX_BYTES` with the same character-boundary
     rule as `stamped_detail`.
   - `read(root, record_id)` returns the text, or `None`.
   The store is generic. Any producer can call it, and it knows no producer by name (CA-D1).
2. **Friction door.** Add `--private-detail <text>` to `fgos friction record` (mutually exclusive with `--detail`;
   refusal `detail-conflict`). With it, the tracked record has `detail: None` and gains the attribute
   `fgos.friction.detail_ref` = the record id. The text goes to the private store. Declare the attribute in
   `friction-kinds.json` only if the registry rejects undeclared attributes. That file belongs to the
   communication-standard plan, so if a declaration is needed, raise one question through the owner question door
   and set this phase to `DONE_WITH_CONCERNS`, rather than writing it. `fgos friction show` prints the private text
   when it can be read locally and `detailRef` otherwise. `list` and `rank` never print it.
3. **Flag registry.** Add the flag row to `command-registry.mjs` and `command-manifest.json`, and extend the
   drift test's expected rows.
4. **Tests**, in `packages/observe/rust/tests/private_detail.rs`:
   - Recording with `--private-detail "khoan, cái này là gì"` leaves no byte of that text in any file under
     `.fgos/observe/records/`, and it is readable through `read`.
   - In a temp git repo, `git check-ignore .fgos/observe/private/<writer>.jsonl` exits 0.
   - `--detail` and `--private-detail` together are refused.
   - A plain `--detail` record still stores its detail, so existing behaviour is unchanged.
   Extend the existing friction record test in `friction.rs` only where it asserts the full attribute set.

## Verify

```bash
cargo test -p fgos-observe --test private_detail
cargo test -p fgos-observe friction
node --test test/cli/subcommand-flag-drift.test.mjs
```

Pass: every command exits 0.

## Rollback

`git revert` of this phase's commit. Private store files already written stay on disk under their own ignore file,
and no tracked record depends on them for anything but display.
