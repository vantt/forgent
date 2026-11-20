# Phase 3 Lead Report: Coordination Evidence Kinds and Observe Prune Door

- **Phase:** 3 (`phase-03-evidence-prune.md`)
- **Status:** done
- **Branch:** `supervision-powers-cores/p03`
- **Worktree:** `/home/vantt/projects/forgent-worktrees/261119-1730-supervision-powers-cores-p03`
- **Branch commit:** `ff48be2667497ece282e8f3ed4a17a4afd8f6d30`
- **Landed commit:** `4cf104274` (ticket `c-49761-1795218550029`)

## Implementation & Verifications
1. **Coordination Act Registration:** Registered `fgos.coordination.act` attrs (`act` enum, `from`, `to`, `outcome`) and kind declaration (`subjects: ["session", "event"]`, `prunable: true`, `retention: "30d"`) in `packages/supervision/rust/observe-kinds.json`.
2. **Registry Model:** Extended `KindDef` with `prunable` and `retention` in `packages/observe/rust/src/record/registry/declaration.rs` and `merge.rs`, exposing `is_prunable()` and `retention()`.
3. **Prune Engine:** Implemented `parse_retention_duration`, `prune`, `prune_with_lock_wait`, and `prune_with_now` in `packages/observe/rust/src/record/store/prune.rs` under observe lock with atomic shard replacement via `fgos_durable_file::replace_durably`.
4. **Store Door Integration:** Added `door.prune(&settled_subjects, apply)` in `packages/observe/rust/src/record/store/door.rs`.
5. **Owning Test Suite:** Added `packages/observe/rust/tests/prune.rs` proving metadata parsing, dry-run safety, retention-based prune, settled-subject prune, non-prunable preservation, record ordering preservation, and fail-open on lock timeout.
6. **Local Gates Passed:**
   - `cargo test -p fgos-observe` (all 74 tests passed)
   - `cargo test -p fgos-supervision` (all tests passed)
   - `cargo fmt --all --check` clean
   - Branch committed cleanly at `ff48be2667497ece282e8f3ed4a17a4afd8f6d30`.

## Blocker Resolution & Land
- **Incident:** During the first land attempt (`c-47511-1795167283319`), host `/dev/nvme0n1p2` hit 100% full (0 bytes available), causing transient `runner-gone` failure.
- **WAL State & Escalation:** Left operation `land-4033127-1795167285169536331-1` in `Phase::Prepared` under writer `4033120` (dead). Subsequent land failed `land-abandoned-writer-mismatch`. Logged owner question `q-bo3abbpcm6`.
- **Resolution:** Owner answered question `q-bo3abbpcm6` ("Run fgos git recover on main checkout"). Interrupted pre-attempt land chain recovered.
- **Land:** Branch `supervision-powers-cores/p03` landed via ticket `c-49761-1795218550029` into main at commit `4cf104274`.
- **Ack:** Question `q-bo3abbpcm6` acknowledged via `fgos questions ack q-bo3abbpcm6`. Phase 3 marked `done`.
