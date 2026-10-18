# Git phase 01 u5: Lane A review fixes

Branch `git/p01-publication-port`, starting HEAD `142940324`. Changes stay inside the assignment scope; no staging or commits. `impact-analysis: inactive` (zero registered providers). Reused the durable-file installer, Rust description drain, and existing `lock-fd` host route.

| Finding | Fix | Behavioral proof |
|---|---|---|
| H1 | Common dir accepts group write, requires canonical/no-symlink directory owned by euid/root, rejects world write; WAL descendants retain private trust checks. Removed repo-init chmod masking. | Shared-group repo initialized under umask 002 publishes; world-writable common dir refuses. |
| H2 | File transport explicitly runs receive-pack/upload-pack through the selected absolute Git with the trusted empty hooks path. SSH/HTTPS retain their transport behavior. | Real remote pre-receive/update/post-receive/reference-transaction marker hooks never fire; push/fetch tests cover both object formats and ref backends. |
| H3 | Admission enumerates retained operation directories without traversing ledger history; terminal transfers compact immediately, including recovered transfers. Full bounded doctor scan remains conservative. | Publication succeeds with 100,001 additional valid trusted ledger entries; transfers leave no operation directories. |
| H4 | Candidate checks and quiescent admission precede Intent; no quiescent wait separates Prepared from TargetAttempt. Empty/temp-only directories are no Intent. Same-authority admission records `abandonedBeforeAttempt` only before TargetAttempt and permits compaction. | Intent/Prepared CAS/fetch/push fixtures close without blocking a new id; pre-pin crash vectors, temp-only residue, and filesystem-boundary tests pass. |
| M1 | One Rust drain rule: kill borrow group/descendants and escaped description holders; wait/recheck direct pre-exec children of the holder outside the borrow group. Node sync/async sweep delegates to Rust; removed JS kill-all policy. Updated holder-lock §§5/8 and helper contract. | Real Rust setsid escapees are killed; non-spawning admission refuses unresolved holders; native fork-to-exec fixture proves both Node paths wait and never kill the direct child. |
| M2 | Winning CAS automatically sweeps pending same-ref chains under the caller authority, superseding eligible attempts or recovering observations. Maintenance refusals retain evidence. | Crashed attempt plus a new-id winner becomes terminal without explicit supersede. |
| M3 | Superseded returns its distinct result code and receipt, including same-id compacted retries. | ABA/fault test asserts `Superseded` and uncertain attribution. |
| M4 | Every typed driver policy supplies `LC_ALL=C`, `LANGUAGE=`. | Real Git child locale checks for all policies; stale CAS and non-fast-forward push classification pass. |
| M5 | Post-TargetAttempt CAS/transfer errors carry RecoveryRequired and operation id, with observed/pending receipt where readable. | Symbolic substitution after CAS makes read-back fail as pending; crash/unknown-transfer tests preserve attempts and never replay. |
| M6 | All durable no-overwrite installation inside this scope uses `fgos-durable-file`; the two coordinator-deferred callers are listed below. | Installer concurrency/EFBIG/symlink tests and WAL boundary/compaction tests pass. Fixed the EFBIG fixture to capture child output so its inherited log cannot violate its own file-size limit. |
| M7 | Same-resource admission refusal identifies the blocking transfer id in both field and cause. | Pending-transfer admission test asserts both. |
| M8 | Batched commit metadata/content reads, two-command ref observation, config preflight cached by file identities. The selected Git reports system/global config paths, including absent inputs; changed/unknown dependencies invalidate or prevent caching. | 1,024-commit walk: 12 Git processes (4 rev-list, 4 batch-check, 4 batch reads), zero warmed config spawns; byte-limited continuation and config mutation tests pass. |
| M9 | Caller builder `with_transport_timeout` controls remote calls (default 300 s); local plumbing retains 30 s. No config/env switch introduced. | Zero remote budget fails real transport while local writes succeed; five-second caller budget succeeds. |

No disagreement with H1–H4 or M1–M9. M1 follows the coordinator's refined rule rather than the review's earlier escapee-refusal rule. For M6, the coordinator explicitly deferred these unchanged copies until lane 6.3 lands:

- `packages/run-supervisor/rust/src/publish.rs` (`publish_once`).
- `packages/terminal-control/rust/src/store.rs` (durable install).

The H4 graph addition is implemented and its machine schema updated. Canonical Git §10 is outside this unit's write scope, so the coordinator must synchronize that amendment. Also left unwritten: the program-board lane update and CHANGELOG entry, both outside scope. These three paths are reported in `needsWrites`; no deferred package was edited.

Three consecutive parallel gates on final code (2026-10-18), with private `CARGO_TARGET_DIR=.fgos/runtime/phase-target` and Node pinned to its freshly built host:

- `cargo test --locked -p fgos-git -p fgos-durable-file -p fgos-holder-lock`
- `cargo clippy --locked -p fgos-git -p fgos-durable-file -p fgos-holder-lock --all-targets -- -D warnings`
- `node --test test/holder-lock/*.test.mjs`

| Run | Finished (Asia/Saigon) | Seconds | Rust tests | Clippy | Node difference from baseline |
|---|---|---:|---|---|---|
| 1 | 13:49:14 | 92.3 | green | green | 0 new / 0 resolved |
| 2 | 13:50:55 | 101.6 | green | green | 0 new / 0 resolved |
| 3 | 13:52:45 | 109.7 | green | green | 0 new / 0 resolved |

Each Rust gate reports 93 passed tests and one intentionally ignored subprocess-harness entry. The new Node pre-exec vector passes in every gate. Initial stale fixture assertions were corrected; interrupted verification sequences are excluded from these three runs.

Required coordinator writes, not performed here:

- `docs/platform/git/spec.md`: add the same-authority, record-only `Intent|Prepared -> Outcome(abandonedBeforeAttempt)` edge, forbidden once TargetAttempt exists; terminal for pending/C5, compactable with immutable id binding and existing pin-release protocol.
- `plans/261017-1313-fgos-platform-program-board/plan.md`: update the Git u5 lane and retain the M6 migration dependency on lane 6.3.
- `CHANGELOG.md`: record the visible publication and holder cleanup fixes.


Evidence: `.fgos/runtime/phase-target/release-gate-*-{test,clippy,node}.log`, `release-gate-results.json`, and `walk-release.trace` (private target). Markdown preview was attempted; MDView's database is read-only in this worker.

Status: DONE_WITH_CONCERNS
Summary: Fixed H1–H4 and M1–M9 within scope, including the refined Rust/Node drain rule and publication liveness gaps.
Concerns/Blockers: Canonical Git graph amendment, program-board row and CHANGELOG need coordinator writes outside this unit's scope; M6's two migrations remain deferred to lane 6.3.
Context refs:
- (none)
