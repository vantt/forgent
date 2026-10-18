# Event Store phase 03 unit 5 — N2

At starting HEAD `ab12f6b37` (including review fixes `06238664c`), N2 remained reproducible. The report’s one-event Rust witness was ported into `rust/tests/cursor_incremental.rs` using the existing temporary-repository fixture and Git port. Before the fix, `lost_folded_history_with_coverage_requires_rebuild_from_zero` failed: actual `Incremental`, expected `RebuildRequired { first_difference: 0 }`.

`rust/src/read.rs` now reuses `have_history` when choosing the fold answer, as it already does when choosing walk coverage and certificates. Missing history forces a rebuild from zero; `sequence` supplies the recovered full view. The coverage-relative delta remains empty in the witness. The regression compares recovered sequence, full order and cursor with a fresh full read. A converse test retains the history and verifies an empty-delta read stays incremental; the existing own-stream append test also verifies incremental fold equals rebuild. No cursor format or helper signature changed.

Prior art: `git log -S'have_history'` and `-S'fold_answer'` identify the reader introduction in `d9a78fb12`; the original fold guard lacked the history check. This extends the existing reader mechanism rather than adding another one. The source contract remains `docs/platform/event-store/spec.md` sections 11–12 and the `ReadRequest.folded` API comment. Impact-analysis: inactive (capability query returned zero providers).

Verification: `sh packages/event-store/rust/run-gates.sh` exited 0, using the unit-private Cargo directory `.fgos/runtime/es-p03-u5-private`. Formatting, `cargo test --locked -p fgos-event-store -p fgos-git -- --test-threads=1`, and `cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings` all passed. One pre-existing publication crash-child helper was ignored. `git diff --check` passed. No staging or commits were performed. The report’s negative witness assertion was converted into the permanent positive regression and rerun; the separate Python/model-order differential harness was outside this targeted fix and was not rerun.

Status: DONE_WITH_CONCERNS
Summary: Fix N2 by requiring full rebuild when folded history is missing despite nonempty coverage; preserve valid-history incremental reads.
Concerns/Blockers: The repository requires a user-visible fix entry in CHANGELOG.md, which is outside this Unit’s write scope; left unchanged for the lead to add.
Context refs:
- plans/reports/experiment-261018-1531-es-p03-model-recheck-reader.md (N2 and verdict table)
- docs/platform/event-store/spec.md (sections 11–12)
