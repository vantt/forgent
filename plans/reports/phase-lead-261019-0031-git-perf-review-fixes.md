# Git Publication optimization review fixes

2026-10-19, Asia/Ho_Chi_Minh. Base: `7f3f86184`, branch `git/p01-publication-perf`. All review findings were verified against code and addressed; no owner budget or signed guarantee was relaxed. Compaction remains per call. E3 was not run. No staging or commits.

Prior art: `git log -S` identified the narrowed drain in `54cc2f788`, floor caching in `634263504`, and original compaction in `ef7d3f48d`. This change extends their existing doors: full fd scans, durable-file installation, Git config-path discovery, WAL ledger and receipt materialization. `impact-analysis: inactive` (`fgos tool query --capability impact-analysis --status present` returned zero providers).

| Finding | Change | Verification |
|---|---|---|
| H1 | Removed the stray Unix guard on Duration/Instant imports. | Linux compilation/clippy; Windows target unavailable. |
| M1 | Admission always uses Everyone. Every borrow's final drain uses Everyone before reaping the root and allowing immediate release; the intermediate pass retains Since. Floor advances to the previous successful proof's start. | Real SCM_RIGHTS transfer to a pre-existing grandchild is killed before release; deterministic proof-boundary eligibility, failed/older proofs, old/unreadable marks, escapee and unrelated pre-exec tests pass. |
| M2 | Uses `^expected` after `--end-of-options`; documented trust in already-published history. | `changing_cas_uses_the_intact_candidate_fast_path` observes the successful fast-path checkpoint on a changing SHA-256 CAS. |
| M3 | Existing Intent fast path syncs the operation directory and WAL parent before returning. | Creator stops at `temp-removed`, before directory sync; replay reaches the post-sync checkpoint and preserves binding/conflict behavior. |
| M4 | Reuses Git's config-path discovery; adds host version, probe implementation digest and PATH, stamps discovered origins, checks config stability, and requires the exact probe set. Includes disable persistent reuse, even when inactive/missing. | Floor key/record, missing/different probe sets, inactive includeIf, symlink and config-preflight tests pass. A source digest provides stronger invalidation than a manually advanced probe-code version constant. |
| M5 | Scan re-reads the durable ledger after root-entry metadata, inspection or enumeration errors. Valid compacted ids are terminal; ledger pass owns their byte count. | Concurrent scan/slow-compaction loop passes; existing corrupt/incomplete/capacity and distribution C5 tests remain green. No C5 policy change. |
| M6 | Version-2 ledger stores expected/next and hashes them. Recover and replay share terminal receipt/error construction. Lossless base64url hash encoding keeps the signed 512-byte limit. | Bounded compaction/recovery runs SHA-1/SHA-256 with files/reftable, including non-absent expected values; maximum ids/supersession round-trip under 512 bytes; legacy binding/replay and crash-compaction tests pass. |
| M7 | Loose-object and WAL memos share device/inode/birth-time identity; absent birth time disables memoization. | Real loose-object removal/recreation requires directory sync again; existing directory recreation test passes. |
| L1 | Restored declare_domain's documentation to its declaration. | Source review and compilation. |
| L2 | Removed empty Directory impl. | Compilation/clippy. |
| L3 | Optional alongside work starts a thread only when present; migrated every caller. | Durable-file ordered-install/barrier/failure tests and dependent crates pass. |
| L4 | PATH lookup rejects directories, resolves relative/empty entries in child cwd, and falls back to `/bin/sh` on ENOEXEC. | Real script without shebang, directory collision, relative PATH and empty PATH regression passes. |
| L5 | Shared ancestor walk, capture reader and allocation-free proc-stat field iterator; holder-lock reuses the process relation parser. | Existing parse, borrow I/O/deadline/overflow and process tests pass. |
| L6 | Removed the owner-child exception from start-time filtering, matching PID-order reach; final full scans retain foreign-holder protection. | Both fallback marks, borrowed descendants and unrelated pre-exec child tests pass. |
| L7 | Admission emits deferred compaction id/cause on stderr and retains evidence. | Compaction crash/recovery and admission regressions pass; both formerly discarded errors now have diagnostics. |
| L8 | Added the requested fallback, floor, Intent durability, fast-path and concurrent-scan regressions. | Included in the commands below. |
| L9 | Updated Git §10 state-root/receipt facts, holder-lock §5 dated clarification, and Unreleased changelog. | Source review; Markdown previews attempted, but MDView's database is read-only here. |
| L10 | Rollback verifier uses read-only `recover` again, retaining id/attribution/OID checks. | Node syntax check; host E3 remains the coordinator's job. |

Verification (run from this worktree, inherited Cargo environment, no copied registry or hard-coded target directory):

```sh
cargo test --locked --no-fail-fast -p fgos-git -p fgos-holder-lock -p fgos-process -p fgos-durable-file -p fgos-event-store -p fgos-distribution -- --test-threads=1
cargo test --locked --no-fail-fast -p fgos-git -p fgos-holder-lock -p fgos-process -p fgos-durable-file -p fgos-event-store -p fgos-distribution -- --test-threads=1 --quiet
cargo test --locked -p fgos-git --lib -- --test-threads=1 --quiet
cargo test --locked -p fgos-git --test publication publication_keeps_retained_chains_bounded_and_compacted_ids_bound -- --test-threads=1
cargo test --locked -p fgos-process -p fgos-holder-lock -- --test-threads=1 --quiet
cargo clippy --locked -p fgos-git -p fgos-holder-lock -p fgos-process -p fgos-durable-file -p fgos-event-store -p fgos-distribution --all-targets -- -D warnings
node --check scripts/git/e3-bench.mjs
git diff --check
rustup target list --installed
```

The six-crate suite passed; the final Git-only compatibility changes additionally passed all 33 library tests and the four-format compaction/recovery integration test. The final allocation-free parser refactor also passed the process and holder-lock suites. Clippy and syntax/whitespace checks passed. Existing ignored tests remain ignored (the crash-child helper and explicit 10,000-segment qualification).

Limits: only `x86_64-unknown-linux-gnu` is installed, so the Windows check could not run. This sandbox is outside the initial host PID namespace; the bwrap PID-namespace tests' existing availability checks skip their namespace-dependent bodies, and spawn-timeout reports that user namespace creation is denied. Real visible-process SCM_RIGHTS, holder cleanup, process-group and mapped-spawn tests did run. Host namespace coverage and E3 remain outstanding. Final full scans intentionally retain their cost. Experimental v1 ledgers cannot supply facts they never stored: their exact-request replay and immutable binding remain supported, while read-only recover reports `legacy-compact-receipt-incomplete` with `recovery-required`; no values are guessed or old entries rewritten.

Status: DONE_WITH_CONCERNS
Summary: Fixed H1, M1–M7 and L1–L10 while preserving the signed safety and compaction contracts; Rust verification passes.
Concerns/Blockers: Windows/host-namespace proof unavailable here; coordinator owns E3. Experimental v1 receipts still require exact-request replay.
Context refs:
- (none)
