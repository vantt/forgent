# Phase 2 Lead Report: Drone Definitions for Session Signals

- **Phase:** 2 (`phase-02-drone-definitions.md`)
- **Status:** done
- **Landing commit:** `21341ec688ca9b1653dced2cce3d2e691e11b650`
- **Worktree:** `/home/vantt/projects/forgent-worktrees/261119-1730-supervision-powers-cores-p02`
- **Branch:** `supervision-powers-cores/p02`

## Evidence & Verifications
1. **Signal Sources Fact List:** Documented in [signal-sources.md](signal-sources.md). 3 active sources identified (`fgos.head.state`, `fgos.session.activity`, `fgos.run.settled`). Signal 4 (refused commands) marked as a gap and omitted due to no Observe producer.
2. **Watcher Query Definitions:** Added `session-gone.query.json`, `session-idle.query.json`, `session-no-result.query.json` in `core/watcher/definitions/`.
3. **Configuration:** Registered `sessionGoneLimit`, `sessionIdleLimit`, `sessionNoResultLimit` under `watcher` in `core/config-standard/watcher.yaml` and `core/config-schema/watcher.schema.yaml`.
4. **Tests & Fixtures:** Extended `RAISED` and `UPSTREAM_KINDS` in `packages/supervision/rust/tests/definitions.rs`; added fixture directories with `records.jsonl`, `nomatch.jsonl`, `expected.json`.
5. **Gates Passed:**
   - `cargo test -p fgos-supervision --test definitions` (all 9 tests passed)
   - `node --test test/config/*.test.mjs` (all 21 config tests passed)
   - `cargo fmt --all --check` clean
