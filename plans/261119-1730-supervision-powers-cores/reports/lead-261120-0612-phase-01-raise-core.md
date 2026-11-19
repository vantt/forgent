# Lead Report: Phase 01 - Raise a coordination event from a caller

- **Plan:** `plans/261119-1730-supervision-powers-cores`
- **Phase:** 1 (`phase-01-raise-core.md`)
- **Status:** done
- **Units:**
  - `unit-run-1795128945325-e76d609e` (ticket `c-847-1795128944803`): implemented caller coordination event constructors (`coordination`, `coordination_at`, `caller`) in `packages/supervision/rust/src/queue.rs` with closed kinds `COORDINATION_KINDS`, validation, and tests in `tests/queue.rs`.
  - `unit-run-1795129635642-6453c217` (ticket `c-34685-1795129635096`): formatted `queue.rs` and `tests/queue.rs` per reviewer finding to pass `cargo fmt --check`.
- **Review:** code-reviewer subagent reviewed diff against `origin/main` - PASS.
- **Verification:**
  - `cargo test -p fgos-supervision --test queue` passed (12 tests passed).
  - `cargo clippy -p fgos-supervision -- -D warnings` clean.
  - `cargo fmt --check -p fgos-supervision` clean.
- **Landing:** Landed branch `supervision-powers-cores/p01` onto main at `3179baae5d06c3e90ee4da09574d5504c2a370b0` via ticket `c-38118-1795129752390`.
