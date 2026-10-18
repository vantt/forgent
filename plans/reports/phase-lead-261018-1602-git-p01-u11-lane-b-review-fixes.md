# Git phase 01, unit 11: Lane B review fixes

Review: `review-261018-1554-git-p01-lane-b-addon-release.md`. Checked against Git spec §4/§10/§12, phase 01 and owner Q6. Prior-art searches trace these mechanisms to `d1d4ec7ee` and `1cd91c992`; no removed predecessor was found. Existing WAL outcomes, borrowed driver, tombstones, target table and staging helpers were extended. Impact-analysis: inactive (zero providers).

| Finding | Fix | Proof |
|---|---|---|
| H1, Low 8 | Take native config.lock before Intent; retryable busy; edit a private draft while retaining the native lock inode. Cleanup removes only that inode. Pre-attempt errors abandon; attempted-chain recovery observes live mappings and resolves observed/uncertain without replay. Typed invalid/stale/failure results. | Rust config tests cover busy, staging I/O failure, concurrent raw edit, substituted lock, post-rename failure, observed/uncertain recovery, idempotent no-op and old-id refusal. |
| H2 | Only the registered Linux target advertises git-wal-v1. Windows without the claim remains activatable; unsupported claims and lock-taking Git calls refuse by name. Manifest contract names the Windows switch point. | Target matrix test; Windows-specific admission/refusal tests and early addon-door refusals added (not locally executed). |
| M1 | Verify checksum names, semver and hex shape; keep equality with producing Cargo.lock at staging. | Cross-release checksum attestation accepted; malformed checksums rejected; staging tests enforce locked inputs. |
| M2, M4 | All six same-digest branches admit under the activation lock; WAL-writing doors require the controller tombstone before records. | Runtime missing-fence test; real fgctl integration for admission/publication/idempotency/rollback, plus unavailable/live-writer scan vectors and existing atomic fence tests. |
| M3 | Absent controller fence is informational without activation/WAL. Optional addon absence is informational; present malformed descriptors remain red. | Setup channel tests, npm descriptor corruption/absence probes and updated fence-count expectation. |
| M5 | Export Git contract versions; read the Event Store-owned envelope schema; check each independently in the single ABI row. | Combined addon versions test and per-contract incompatibility tests. Reading the owned schema avoids changing the Event Store crate outside this Unit's scope. |
| Cheap Lows 1–3, 5–8, 10–13 (scoped portions) | Correct changelog/spec text; use shared state-root and addon staging helpers/default kill budget; describe doctor rows; detect linked-worktree index locks and symlinks; name predecessor pid/argv; read C5 WAL directly without Publication Git-floor/hooks/state-root setup; put advisory reason in audit output; compare the staged addon bound to its manifest. | Existing state-root/packaging suites, new linked-worktree residue and non-WAL admission tests, scan diagnostic vectors, manifest binding proof. |

Validation: requested five-crate `cargo test --locked --no-fail-fast`: an earlier run had **190 passed**; final run has **189 passed, one existing background-GC negative-control failure**, independently reproduced with HEAD’s original `init.rs`. **Zero new Rust failures.** Requested all-target Clippy with `-D warnings`: **green**. Latest controller/config focused reruns also pass. Requested Node selection: **964 passed, 15 failed, 2 skipped; zero new failure names** against a replay using HEAD's changed setup adapters/tests in the same environment. Architecture passes. `git diff --check` passes. Logs accompany the assignment result.

Limits: the real process scan refuses inside this PID namespace. Integration verifies that refusal and pending-WAL admission here; the full live-writer/fence/rollback branch requires a host scan. Windows execution remains for Windows CI. MDView preview was attempted but its database is read-only.

Deferred low-cost documentation outside write scope: `src/run-supervisor/payload-root.mjs` comment (Low 4), and the program-board row (completion/CI cost). Remaining non-cheap Low portions—registry-derived Rust paths, per-run doctor caching/remote selection, and the dormant constructor's caller-seal handoff—remain with later phases; the phase 02 handoff limitation is now documented. No lifecycle verbs, staging or commits were used.

Status: DONE_WITH_CONCERNS
Summary: Fixed both High findings, all Medium findings and scoped cheap Lows with behavior tests. Clippy passes; Rust and Node have no new failures against reproduced baselines.
Concerns/Blockers: Existing background-GC test failure, host/Windows proof limits and two out-of-scope documentation updates listed above.
Context refs:
- docs/platform/git/spec.md
- docs/platform/packaging-distribution/contracts/release-manifest.md
- apps/fgctl/tests/git_wal_activation_gate.rs
