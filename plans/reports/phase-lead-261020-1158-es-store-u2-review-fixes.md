# Event Store unit 2: review fixes

Foundation only; no Work consumer changes, lifecycle calls, staging or commits.
Review preserved at `plans/reports/review-261020-1156-es-store-layer.md`.
Impact-analysis: inactive (zero registered providers). Report path confirmed by
`fgos convention path --kind report --type phase-lead --slug es-store-u2-review-fixes --at 2026-10-20T11:58:00+07:00 --json`.

- **C1:** Hook enforcement activates only for the exact regular-file fence in HEAD/index; legacy shard/checkpoint inputs pass without it, including an explicit successful fence-only case.
- **H1:** Removed all Work file hashes and line coordinates; declared finding identities use file + call kind + target family and site counts; equality rejects additions and stale debt after removal.
- **M1:** Restored unconditional store-root fsync in `append::prepare_stream`; existing stream/active barriers remain (three steady fsyncs); injected root-sync failure refuses ack after interrupted directory creation, and retry preserves the event.
- **M2:** Removed legacy reader whole-file exemptions; reader calls/imports are individually counted, including owner files; a synthetic added read inside `event-log.mjs` is detected while unrelated edits preserve identity.
- **L1:** Hook matches only `.fgos/events.jsonl*` and `.fgos/events/`, allowing unrelated prefixes and the exact fence.
- **L2:** Age reads reuse the append lock against recovery/rotation, open a stable handle and buffer only the first line; incomplete headers and concurrently removed closed files are skipped; a writer paused mid-header blocks maintenance until completion.
- **L3:** Moved the single addon build/load implementation to `scripts/git-addon.mjs`; benchmark and in-scope tests import it there; the old test path only re-exports for three callers outside this grant.
- **L4:** Native `own_origin` returns an optional string, exposed as `null` before local identity exists; spec, facade comment and real native before/after-append regression document/prove the meaning.

Reused the existing hook, source lexer/census, append filesystem port, append
lock, buffered IO and addon builder. History confirms the hook introduced in
`1ab6c566d` and age reader in `ddde17b00`; no replacement
mechanism or Work cutover was introduced. Spec and Unreleased entry updated.
Program-board edits remain coordinator-owned outside this grant.

Validation (exact commands; logs under `/tmp/es-u2-*.log`):

```sh
cargo test --locked -p fgos-event-store -p fgos-git
cargo test --locked -p fgos-event-store
cargo test --locked -p fgos-event-store --test p02_review
cargo clippy --locked -p fgos-event-store -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/*.test.mjs test/git/*.test.mjs test/githooks/event-layout.test.mjs test/architecture.test.mjs
node --test test/githooks/event-layout.test.mjs
rustfmt --edition 2021 --config skip_children=true --check packages/event-store/rust/src/append.rs packages/event-store/rust/src/seal.rs packages/event-store/rust/src/diagnostics.rs packages/event-store/rust/tests/p02_review.rs packages/git/node-addon/src/event_store.rs
git diff --check
```

Combined Rust: 369 passed, 10 existing ignored qualifications.
Final Event Store Rust: 148 passed, one existing ignored qualification; focused
review regressions: eight passed. Combined Node: 253 passed, six existing skips
(five host/PID-namespace migration gates, one Windows case). Final expanded
hook run: 11 passed. Clippy, edited Rust formatting and diff whitespace pass.
No full `npm test` ran. Workspace-wide `cargo fmt --all -- --check` reports
pre-existing formatting outside this scope; those files were not changed.
MDView preview was attempted and rejected by its read-only database.

Status: DONE_WITH_CONCERNS
Summary: Fixed all eight review findings while keeping Work on its legacy layout until cutover. Durability takes priority over the previous two-fsync target.
Concerns/Blockers: Existing host-only migration and filesystem power-loss/latency qualification remain external gates; no fresh host acceptance is claimed.
Context refs:
- (none)
