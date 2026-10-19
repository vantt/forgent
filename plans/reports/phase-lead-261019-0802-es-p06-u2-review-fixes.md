# Event Store phase 06 review fixes

M1/M2: append now uses the machine bound by `openStore`; the native signature has no machine argument. Removed the raw-directory constructor, `createEventStore` and its Git re-export. Migrated the combined-addon test to real Git resolution and shipped-style contract files. Prepared authority is mandatory in the Rust struct, removing the optional/unprepared branch.

Low findings verified and addressed:

- L1: hot entry returns a one-shot release, with a zero floor; migrated the state caller and tested nested/double release against the real exec guard.
- L2: error decoding anchors at the beginning (including bare refusal names), parses Git JSON code/cause, and never labels an error from a path substring. Regression tests cover both formats.
- L3: `trustedMain` is required. The allowed spec records Git topology limits and phase 07 handoff.
- L4: repository/layout validation precedes seal acquisition. A real mismatched repository with an unusable lock path proves ordering. The spec documents summary waiting behind seal/sync.
- L5: only strace-owned ptrace refusal lines trigger skips. Both ordinary and lost-hwm/torn-tail recovery windows prove zero process creation. Holder reclaim retains structural and crate-test coverage.
- L6: added hot-gate status/summary refusals, actual rank-50 LockScope acceptance, and hostile GIT_COMMON_DIR/GIT_CONFIG_* with common-directory assertions.
- L7: cache keys include loader options; descriptors validate before cache reuse. Tests cover distinct options and invalid descriptors. Process-lifetime invalidation limits are documented.
- L8: removed the import blank, corrected the error comment, documented the new guard location, and reject duplicate consumer cache paths with a regression test.

Reused the existing Git loader/resolver and fetch-mapping authority, Event Store validation, and shared hot guard. The merged Git mapping contract made the fixture's exact legacy refspec obsolete; its one-line correction now calls `gitFetchMappings`. No out-of-scope edits, Git-lead file edits, new dependencies/config, lifecycle verbs, git add or commits.

Validation: `cargo test --locked -p fgos-node-addon -p fgos-event-store` passed (137 passed, 1 ignored); `cargo clippy --locked -p fgos-node-addon -p fgos-event-store --all-targets -- -D warnings` passed. The complete requested Node command passed: 67 passed, 1 Windows-only skip. Both strace tests ran. Changed Rust formatting and `git diff --check` passed. Impact-analysis: inactive (no present providers); source/history searches cross-checked callers. Logs: `/tmp/fgos-work/es-p06-u2-{rust,node,clippy}.log`. Full npm test was not rerun in this review-fix assignment. mdview preview failed with its read-only database.

Status: DONE_WITH_CONCERNS
Summary: Fixed both Medium findings and all Low code findings with real regression coverage and green required checks.
Concerns/Blockers: The write contract excludes the phase 06/07 plan files. Coordinator must update phase 06's stale hotLockDepth reference to src/holder-lock/hot-guard.mjs and copy the spec's explicit trustedMain/topology limitation into phase 07. These two unwritten paths are listed in needsWrites; the source facts are already in the allowed spec. The earlier general port-assertion limitation remains unchanged.
Context refs:
- plans/reports/review-261019-0802-es-p06-node-facade.md
- docs/platform/event-store/spec.md
