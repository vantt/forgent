# Event Store phase 04: review fixes

Read the [phase](../261018-0945-event-store-fgos-event-store/phase-04-seal-publication.md), [review](review-261018-1954-es-p04-seal-publication.md), Event Store §4/§10/§13–14/§21/§23, and Git §10 first. Reused the verified history walk, closed-segment authentication, durable-file receipts, and WAL scan; no replacement persistence mechanism. `impact-analysis: inactive` (zero providers). No staging or commits.

| Finding | Fix | Behavioral test |
|---|---|---|
| H1 | Authenticate unreceipted first-parent seal commits against the store's retained segment bytes; retain every sibling receipt's ancestry constraint. `sealAll` attempts all streams and aggregates errors. | Real SIGKILL after target CAS, then sibling seal and `[sibling, original]`; separate failed-first-stream vector. |
| M1 | Prepare the stream and reconcile a missing receipt before rotation with an active or closed tail, including a previously unused sibling. Physical lastSeq remains separate from emitted coverage. | Published 1..2, unsealed 3, deleted receipt: seal repairs and append assigns 4; both tail forms. |
| M2 | Record ref observation and segment ranges; retire the diagnostic under event-seal after full root-to-tip verification and receipt coverage, then fsync the directory. Applies to internal promote seals and no-op recovery too. | Ref disappearance records an error; restoring it and interrupting after segment deletion leaves evidence; next no-op seal clears it. |
| M3 | Exact commands below, without target-directory assumptions in package scripts. | Required locked gates and explicit qualification. |
| M4 | 10,000 disjoint seed schedules across eight real repositories; seven seed-derived append counts, multiple firing points, concurrent appenders, a blocking second sealer that publishes, two readers, promote/merge rounds inside the loop, filesystem failures before/after CAS and receipt plus recovery. No fabricated receipt: merge setup exercises real receipt reconstruction. | Every chosen point must actually fire; count/hash/coverage invariants checked each schedule; existing real-SIGKILL matrix retained. |
| M5 | Active working set bounded, retained id ledger linear per Git §10. WAL scan exposes entries/bytes and capacity warning at 100,000 entries or 64 MiB. Named follow-up `ES04-M5-ledger-capacity` in the phase covers doctor adapter integration and id-preserving rollup/sharding. | Real retained-receipt scan and sparse over-capacity evidence; qualification census. |

Cheap lows: pending active/closed promotes prevent abandon (L1); a promote requires a previous project publication (L2); stale abandon compacts its terminal operation and the seal stale path explains serialization (L3); malformed age input errors instead of reporting zero (L7). The CAS race fixture now prepares shared WAL directories before rendezvousing on operation-directory creation; shared mkdir checkpoints have only one creator and cannot form a two-worker barrier.

## Verification

Locked two-crate gate: **168 passed, 0 failed, 2 intentionally ignored**. All-target clippy with warnings denied, scoped rustfmt check and `git diff --check` pass. Qualification: **10,000 distinct schedules passed**, eight repositories × 1,250, **3,826.08 seconds**. The seed mapping is injective across disjoint index ranges; each shard asserts uniqueness and that every selected firing point actually ran. The run exercised 79 interrupted-publication recoveries, 1,869 post-delete failure recoveries, and 10 promote/merge rounds inside the loop (plus eight initial rounds). Both readers checked event counts, unique hashes and contiguous coverage after every schedule.

Aggregate final census: **0 operation directories, 0 pins, 0 unresolved**, complete scans; **20,149 retained receipts, 6,548,173 logical bytes, 20,173 inodes / 24 directories** across eight repositories. Maximum receipt: **325 bytes** (asserted bound 512). Working sets were also checked every 100 schedules. These are Linux process-crash/filesystem-failure results, with no power-loss claim. Logs: `/tmp/es-p04-u3-tests-final.log`, `/tmp/es-p04-u3-clippy.log`, `/tmp/es-p04-u3-qualification.log`.

## Reproduce

Run from the checkout root. Any caller-selected `CARGO_TARGET_DIR` works; this run used a private shell-only target under `/tmp`.

```sh
cargo test --locked --no-fail-fast -p fgos-event-store -p fgos-git -- --test-threads=1
cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings
cargo test --locked -p fgos-event-store --test reader_seal_stress -- --ignored --nocapture
```

## Limits and coordinator writes

Git §10 retains every operation-id binding, so deleting old receipts to claim constant storage would violate the contract. Sizing assumes 1,000 Work lifecycle `sealOnWrite` publications/day, no batching: 30,000 receipts/30 days, with **9,749,625 projected logical bytes**, at least **30,000 receipt inodes**, and additional filesystem allocation/directory overhead (4 KiB per receipt alone would occupy 122,880,000 bytes). This is an explicit workload assumption, not observed production throughput.

Outside this grant: Event Store spec §10/§21 must document D6's whole-second clamp to zero, integrity diagnostics/retirement, first-promote precondition and ledger metrics; Git spec §12 must document the new ledger metrics/thresholds; main plan requirement 2b and criterion 8 must distinguish bounded working set from linear ledger; program board and changelog need coordinator landing updates. Doctor adapter registration belongs to the planned ES-09 integration, tracked by the named phase follow-up. Civil-time leaf extraction and rotation's explicit hot-lock-depth API remain low-priority follow-ups. L5 cross-authority recovery is not loosened here: Git §10 rule 4a permits nonblocking supersession only with the same authority; reminting a store id cannot silently grant recovery authority over an old writer's evidence.

MDView preview was attempted; its database is read-only in this worker, so no preview URL is available.

Status: DONE_WITH_CONCERNS
Summary: Fixed H1 and M1–M5 within the write grant, plus cheap lows. The 168-test gate, clippy and 10,000 distinct real-port schedules pass.
Concerns/Blockers: Coordinator documentation and doctor integration remain outside this write grant.
Context refs:
- (none)
