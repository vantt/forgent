# B1: unreadable terminal result

Verified the triage against `FsOutbox::newest_complete` and the supervisor drive loop: invalid JSON collapsed into absence, leaving the ordinary idle deadline as the only stop. Prior art: `defcb6a0f` introduced complete-file detection; `ad4d68ce1` introduced the terminal supervisor and existing early-stop/release path. No prior unreadable-result mechanism was found.

Added stable invalid-publication evidence to the existing FsOutbox and a bounded supervisor wait. Nonempty invalid JSON (including non-object JSON) must retain identical bytes and modification time for 30 seconds, with consecutive idle inspections and no visible work/blocker. Edits reset the grace; missing, empty or valid objects clear it. The supervisor stops with `terminal:result-unreadable` through normal cancellation, domain shutdown, settlement and release-slot. No rewrite message or new config/dependency was added. FsOutbox exposes opaque evidence directly because this supervisor already uses the concrete filesystem outbox; existing adapter Outbox implementations need no additional method.

Regression coverage: raw newline JSON, non-object JSON, absent/empty/complete publication, changed content resetting grace, working/unknown observations breaking consecutive idle evidence, and a real supervisor/gate lifecycle over fake herdr asserting the named receipt, release-slot receipt and free attempt lock. Spec and Unreleased changelog updated. No out-of-scope one-line edits. No git add/commit.

Validation passed:
- `cargo test -p fgos-agent-protocol -p fgos-run-supervisor` (all suites, including new terminal lifecycle).
- `cargo clippy -p fgos-agent-protocol -p fgos-run-supervisor --all-targets -- -D warnings`.
- `node --test test/run-supervisor/contracts-unit-state.test.mjs` (8/8; no Node test files changed).
- `git diff --check`.

Impact-analysis: inactive (zero registered providers). No build/test sandbox limitation encountered. Full host gate and real installed herdr/release smoke were not run here; coordinator reruns the full host gate. MDView preview failed with a read-only database. Program-board update is outside this Assignment's write scope and left to coordinator. The required report path is used as explicitly assigned (convention CLI currently generates the same slug with a later clock minute).

Status: DONE_WITH_CONCERNS
Summary: Fixed B1 with stable-file and idle evidence, a named terminal failure, and normal custody release; all targeted checks pass.
Concerns/Blockers: Coordinator owns full host gate and out-of-scope program-board update; MDView preview unavailable.
Context refs:
- plans/reports/debug-261019-1631-landing-bugs-triage.md
- docs/platform/run-supervisor/spec.md
