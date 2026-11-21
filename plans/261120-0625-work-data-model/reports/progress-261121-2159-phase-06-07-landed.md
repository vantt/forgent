# Progress: phases 6 and 7 landed; phase 5 waits on the catalog footprint edit

Lead: head:lead-forgent-261120-0625-work-d-ce9f6. Date: 2026-11-21, Asia/Saigon.

## Outcome

- Phase 6 landed as `96aa82f5b` (`work-data-model/p06c`). The land door closes a done plan's cited backlog items in the landing commit. The earlier refusal cleared once the orchestration-skeleton shaper committed its edit (q-2dwvrkgabm).
- Phase 7 landed as `05904d7e2` (`work-data-model/p07`: `186371db0` plus review fixes `fe8042f12`). 22 plan-contract tests pass.
  - 81 legacy plan statuses were rewritten to plan-v1, touching status lines only.
  - A non-plan-v1 status now fails `--all`.
  - Marked plans created from `BACKLOG_SOURCE_REQUIRED_FROM` (2026-11-22) on must cite a minted `p-` id.
- Phase 5, part landed: the discussion roots are now read from the convention rule (`8d0ebd49b`, `work-data-model/p05f`). The review found no blockers.
- Phase 5, part waiting: the verb is routed on `work-data-model/p05e` (`8980311b7`), and its 18 migrate tests pass. The host admission gate also needs a `migrate.portfolio` row in `packages/host-runtime/rust/src/catalog.rs`. The owner said yes (q-psvhjlmjxl), but the footprint edit has not landed yet. The lead cannot make it.

## Lead decisions inside the approved frame

- No `contract: plan-v1` marker on legacy plans. With the marker they would fail every other required key, and the owner's scope for other plans is status and contract lines only.
- The rule that a plan's `source` must cite a `p-` id has a date cutoff, because 13 of the 32 existing marked plans cite none.
- Six old in-progress plans now read `running`. None has a phase table, so the supervisor's portfolio reader still refuses them.
- This plan's phase table now holds one-word statuses. The notes moved to a Progress section (`999d280c5`).

## Open

- q-hui44iwzw4 asks how to read criterion 7. `plan-contract-check --all` still exits 1, on other plans' content and on 6 active footprint overlaps.
- Before the next phase 5 unit, after the catalog edit: the review's non-blocking points. The silent fallback when the discussion rule is missing should become an expect. The `discussion_roots` helper is copied into two crates and could move into fgos-convention.

## Tool frictions

- `fgos request result <id> --wait 50` is refused with bad-args, and `--wait=50` returns at once without waiting.
- `fgos land --test` takes Node test paths only. Passing a Rust test file fails the gate.
- A unit's runner does not commit files that were already dirty in the worktree before its round. Rebuilding the change on a fresh worktree worked.
- Edits made by workers rewrite `fgos-git = {` as `fgos-git ={` in two Cargo.toml files. It is valid TOML and cosmetic.
- My sandbox cannot stage the native addon for `plan-contract-check`. Pointing `FGOS_ACTIVE_MANIFEST_PATH` and `FGOS_HOST_BIN` at a worktree's already-staged addon works.
