# Review: Event Store phase 04, sealing through the Git Publication port

Read-only code review of `event-store/p04-seal` (worktree `es-p04-review`, HEAD `ddde17b00`, base `b10d53fe2`), before merge (phase step 7).

Read first: [phase plan](../261018-0945-event-store-fgos-event-store/phase-04-seal-publication.md), Event Store spec §4, §10, §13 and §14, Git spec §4 and §10 (rules 4, 4a and 4b), and the two phase-lead reports ([u1](phase-lead-261018-1610-es-p04-u1-seal-publication.md), [u2](phase-lead-261018-1643-es-p04-u2-seal-finish.md)).

**Verdict: do not merge yet.** One High finding needs a fix and a regression test first. Five Medium findings should be fixed or explicitly accepted by the coordinator before merge. No Critical findings.

## Method and evidence

- I read every changed source and test file plus the Git port code they call (`admit_pending`, `recover`, `supersede`, the sweep in `compare_and_swap`, `release_pin_and_compact`).
- I checked each finding below against code. The three behavioral findings (H1, M1, M2) were reproduced with throwaway probe tests. They ran against a `git archive` export of HEAD in a session scratch directory; no file in the worktree was changed. Probe output is quoted under each finding.
- I ran the ordinary gates on the same export. Results are in the [Gates](#gates) section at the end.
- Impact-analysis evidence was not collected (read-only review; the phase-lead reports record `impact-analysis: inactive`).

## Critical

None.

## High

### H1. A crash between CAS and receipt on a shared own ref blocks every sibling stream, and `sealAll` can stay stuck

- **Where:** `packages/event-store/rust/src/seal.rs:185` and `:223-225` (`known_receipt_tip`, `:463-489`); `seal_all` at `:423-439`.
- **What happens:** `project` and `project:<consumer>` share one own ref (`refs/fgos/events/<machine>`).
  1. Stream A's seal publishes commit C and dies after the CAS but before A's receipt (crash row "After `update-ref`, before the receipt").
  2. The next seal of sibling stream B sees tip C. No stream's `sealed.json` names C, so `known_tip` is false.
  3. B's segment is new (`last > high`), so B fails with `event-store-ref-moved` ("own ref differs from receipt") and writes `integrity.json`.
  4. `seal_all` collects into a `Result` and stops at the first error. With the stream list `[B, A]`, A's recovery is never reached, so every `sealAll` fails until someone seals A alone.
- **Spec:** Event Store §10. The crash table says the next seal recovers this row "with no `doctor --fix`". Step 2.3 says a reread tip that is the store's own publication is crash recovery, not an outside move. §21 then fails doctor on the recorded `ref-moved`.
- **Probe output:**
  ```
  PROBE1 seal B after A crash: Err((EventStoreRefMoved, "own ref differs from receipt"))
  PROBE1 seal_all [B,A]: Err((EventStoreRefMoved, "own ref differs from receipt"))
  PROBE1 seal A: Ok(1)
  PROBE1 seal B again: Ok(1)
  ```
- **Why tests miss it:** `project_consumer_streams_share_one_ref_without_false_move_or_sequence_reuse` and `shared_ref_rewind_to_another_streams_old_receipt_is_refused` cover shared refs without a crash. The kill matrix uses only one stream.
- **Fix:**
  - Before deciding "moved", accept a tip whose path from the newest known receipt consists only of `seal` commits with this store's origin. Those are commits the store published for one of its own streams.
  - Better: when a seal starts on a shared ref, first finish receipts for every sibling stream whose closed segment is already on the ref. That reuses the existing `last <= high` recovery branch.
  - Make `seal_all` attempt every stream and return aggregated errors instead of short-circuiting.
  - Add a regression test: kill A after the target CAS, then seal B and `seal_all([B, A])`.

## Medium

### M1. Losing `sealed.json` while unsealed events exist permanently blocks both append and seal

- **Where:** `seal.rs:108-132` rebuilds the receipt from the ref only when there is no `sealed.json`, no closed segment and no `active.jsonl`. Otherwise rotation and append stop in `append.rs:110` ("active gap or overlap above receipt").
- **Spec:** §10 step 2.1 says `sealed.json` is only a cache. When it is missing, the walk starts from empty coverage. Plan item "P02 review L5" requires rebuilding coverage and receipt through the shared ref walk before sequence reuse.
- **Effect:** §13 tells the Work gate to answer `event-store-seq-recovery-conflict` by running `seal(project)` and retrying. Here that seal fails the same way, so the gate loops forever and no Work mutation can land. No data is lost, since the code refuses safely, but nothing repairs the state.
- **Probe output** (2 events sealed, 1 more appended, `sealed.json` deleted):
  ```
  PROBE3 seal 0: Err((EventStoreSeqRecoveryConflict, "active gap or overlap above receipt"))
  PROBE3 seal 1: Err((EventStoreSeqRecoveryConflict, "active gap or overlap above receipt"))
  PROBE3 append: Err((EventStoreSeqRecoveryConflict, "active gap or overlap above receipt"))
  ```
- **Fix:** Run `reconcile_durable_history` whenever `sealed.json` is missing and the own ref exists, not only when the stream is empty. It must run under `event-seal` and before rotation. The rebuilt `lastSeq` stays physical (the walked high), so the existing closed and active ranges then line up. Add the probe as a test. The current `lost_receipt_and_hint_are_rebuilt_before_next_append` test covers only the empty-stream case.

### M2. `integrity.json` is never cleared, so doctor stays red after automatic recovery

- **Where:** `seal.rs:69-88` writes `integrity.json` on every `EventStoreRefMoved` or `EventStoreSealMismatch`. Nothing in the crate removes it or marks it resolved; `grep` finds only this writer.
- **Spec:** §21 makes doctor's `event-store-integrity` row fail when a `ref-moved` or `seal-mismatch` is recorded. The §10 crash table needs no doctor step.
- **Probe output** (H1's sequence, then A and B both sealed successfully):
  ```
  PROBE4 integrity.json still present after full recovery: true
  ```
- **Fix:** Store the offending tip and segment range in the record. A later successful seal whose receipt covers that range should clear the record durably. Alternatively, doctor re-validates the record instead of trusting it. Either way, a test must show the record clearing.

### M3. The gate and qualification scripts are not in the branch

- **Where:** `packages/event-store/rust/run-gates.sh` is **deleted** by this branch (`git diff --stat` shows `-6`). `qualify-seal.sh` was never committed. Yet the u2 report says "Reproduce from the checkout root using the two scripts in `packages/event-store/rust/`". Its logs are in `/tmp`.
- **Spec:** L5 question 5 requires a reproducibly verifiable result. Reproducing the 160-test and 10,000-schedule claims needs commands that exist in the repository.
- **Fix:** Commit both scripts with the private `CARGO_TARGET_DIR` under `.fgos/runtime/`. Alternatively, put the exact `cargo` invocations in the phase report and restore the deleted file.

### M4. The stress qualification has far fewer distinct schedules than the 10,000 it claims

- **Where:** `tests/reader_seal_stress.rs:142-172` and `:80-130`.
- **What the code does:** The seed picks only one of 7 checkpoints; its low bit decides whether reader 0 observes first. That is at most 14 distinct schedules, each repeated about 700 times. Other gaps:
  - The "second sealer" is an in-process `Wait::Try` that must return `busy`. It never seals concurrently or after release.
  - There is one appender and one append per seal.
  - No checkpoint fails, so no crash happens inside the loop.
  - Promote and merge are seeded once before the loop, and the seed writes a hand-made receipt (`seed_promote_and_merge`, `:393-400`, `receipt.write` with cleared cover). Ancestry is therefore traversed, not interleaved.
- **Spec:** §23.2 item 2 and phase Validation call for 10,000 seeded interleavings of appenders, two sealers, two readers, and merge and promote commits.
- **Fix:** Derive several dimensions from the seed: appends per point, more than one firing point per seal, a real second sealer (a thread or process that waits and then seals), promotes and merges inside the loop, and occasional injected failures followed by recovery. Otherwise, restate the claim as "14 schedules × ~700 repetitions" in the phase report. The invariants it checks (no loss, no double count, walk terminates, coverage) are sound.

### M5. Retained receipt storage grows linearly; the cost is accepted in one place but contradicted and untracked elsewhere

- **Facts:**
  - Every seal leaves one compacted ledger file of 512 bytes or less in `<common-dir>/fgos/git/compacted/`, one inode per operation id, forever.
  - That is spec-sanctioned: Git §10 says compaction keeps every request digest so an id is never reused. The plan's M8 row accepts "bounded per seal, not constant".
  - Operation directories and pins do drain to 0 (the qualification asserts this every 100 iterations), so the *working set* is bounded.
- **Gaps:**
  1. Plan acceptance criterion 8 (`plan.md:127`, "WAL records and pins stay bounded over 10,000 seals") and requirement 2b ("the count stays bounded") still say bounded.
  2. Requirement 2b asks for a 30-day projection at the *observed `sealOnWrite` rate*. The report projects at the stress-loop rate of 1.36 seals per second, which gives 1.1 GB and 3.5 M inodes per 30 days. That number is neither realistic nor the requested one.
  3. No backlog item, doctor threshold or rollup design tracks the growth. Doctor's `scan` reports `ledger_bytes`, but nothing warns. One flat directory with millions of entries is also an operational risk.
- **Fix:**
  - Reword criterion 8 and requirement 2b to "working set bounded; id ledger linear".
  - Redo the projection at a measured or assumed `sealOnWrite` rate, for example Work lifecycle events per day.
  - Open an item for ledger rollup or sharding that still preserves id binding, plus a doctor warning threshold.
  - Answer to the brief's question: **the growth is not bounded. It is tracked only by the plan's M8 row, which accepts it.**

## Low

- **L1. Abandon can strand a pending promote.**
  - Where: `promote.rs:108-163` versus `:75-105`.
  - If a process dies between the `store.promote` append and the following project seal, and the branch is abandoned before the next project seal, the branch ref is deleted while an unsealed promote still names its tip. Once `git gc` prunes the now-unreachable commit, the project segment can never be sealed.
  - Fix: `abandon` refuses while an unsealed `store.promote` for that stream exists in the project open log or closed segments.
- **L2. First-seal promote has the wrong parent order.**
  - Where: `publish.rs:34-36`.
  - When the project ref is absent (a promote before any project event), the promote commit's *only* parent is the branch tip. The §10 commit-kind table says "own previous tip, then the branch tip". The walk accepts it because `promoted_parent` can be index 0.
  - Fix: decide whether this shape is allowed and record it in the spec, or refuse promote until the project ref exists.
- **L3. Stale-path inconsistencies.**
  - Where: `seal.rs:251-271`.
  - The stale branch never retries, even when the reread tip is the store's own publication. Spec §10 step 2.3 allows a retry after rerunning 2.1. This is safe while `event-seal` serializes the store, but say so in a comment.
  - `abandon` (`promote.rs:138-146`) returns on a stale CAS without `release_pin_and_compact`, unlike `seal.rs:252`. It is compacted later by `recover_publications`.
- **L4. DRY.**
  - `publish::timestamp_seconds` (`publish.rs:96-120`) reimplements the civil-date math in `packages/host-runtime/rust/src/civil_time.rs` (`days_from_civil`, `parse_rfc3339_millis`). Design principle 2 says to extract a shared leaf module rather than copy, and the Event Store must not depend on host-runtime.
  - `seal.rs` builds the `PublicationPort` twice (`:113`, `:134`) and repeats `walk_verified` + `check_contiguous` three times (`:171`, `:255`, `:291`).
  - `recover_publications` passes an empty-string sentinel id to `admit_pending` (`packages/git/rust/src/publication.rs:686`); a named "no own id" parameter would be clearer.
- **L5. `recover_publications` can abort every seal of a ref.**
  - Where: `packages/git/rust/src/publication.rs:682-714`.
  - A retained chain whose `validate_publication_borrow` fails (for example after the store id is re-minted following loss of the store directory) or whose pin release returns `recovery-required` makes the call fail. That failure aborts every seal of the ref.
  - Git §10 says a pending PublicationCas must not block a different operation id on the same ref.
  - Fix: report such chains as pending or evidence instead of failing the seal.
- **L6. Spec drift.**
  - Event Store spec §10 step 2.2 does not state the D6 date rule: last event's whole Unix second, clamped to 0, `+0000` for author and committer. Today it is only in `plan.md` on main (`16b2c01e5`, not in this branch).
  - §21 does not describe `integrity.json`.
  - The coordinator listed these spec writes; they belong in the same landing (L5 question 6).
- **L7. Small robustness gaps.**
  - `oldest_unsealed_age_sec` (`seal.rs:399-407`) silently skips an unparseable first line. That stream then reports age 0 and `sealIfDue` never fires for it.
  - `rotate_with_fs` hard-codes `hot_lock_depth: 0` (`rotate.rs:35`).

## Checks that passed

| Brief item | Result | Evidence |
|---|---|---|
| Every seal rule and crash row | Single-stream rows pass, including real SIGKILL at 11 seal points; the shared-ref row fails (H1) | `tests/kill_append.rs:216-300`; `tests/seal_publication.rs:124-195` |
| Receipt durable before segment delete | Yes. `replace_durably_observed` (tmp, fsync, rename, directory fsync) runs before `remove_file` and the `closed/` fsync. Each sub-step is killed in tests | `receipt.rs:32-50`; `seal.rs:310-332` |
| No seal under `state` (rank 58 vs 60) | Yes. `held 60` or `hot_lock_depth > 0` gives `event-store-seal-under-state`; ranks ≥ 58 give `lock-order-violation`. Applies to `seal`, `sealAll`, `sealIfDue` and `promote`. Rotation needs a typed `SealGuard` bound to the store | `locks.rs`; `rotate.rs:38-46`; `seal_refuses_state_high_ranks_and_wrong_store_guard` |
| Fresh operation ids; stale attempts close through supersession, never replay | Yes. A 128-bit random id per CAS. `recover_publications` never reissues. A won CAS sweeps same-ref pending chains via rule 4a; Intent or Prepared chains close as `abandonedBeforeAttempt` (rule 4b) | `seal.rs:30-32,240`; `publication.rs:682-714,1171-1182`; Git tests `bound_recovery_*`, `sigkill_before_target_*` |
| Tip-moved handling | An outside move keeps the segment and records the diagnostic; a rewind to another stream's old receipt is refused. False positive in H1; diagnostic never cleared (M2) | `seal.rs:166-225`; `ref_rewind_or_foreign_move_preserves_segment` |
| Branch, local, promote, abandon | Refs per scope are correct. Promote gives two parents with the branch tip second; abandon is an exact-old CAS to `Absent`, then the branch log. Gaps in L1 and L2 | `refs.rs`; `promote.rs`; `branch_local_refs.rs` |
| Deterministic commits | Fixed identity and message; date = last event's second clamped to 0, `+0000`; identical retry gives the same OID; the pre-epoch case is tested | `publish.rs:69-92`; `repeated_identical_objects_*`, `pre_epoch_event_seals_*` |
| Retained receipt growth | Linear, not bounded; see M5 | qualification census in the u2 report |
| Tests are real | Yes. Temporary `git init` repositories, the real Publication port, real holder-lock, real SIGKILL through a driver binary, no env switches or test-only production branches. One seeded receipt is hand-written in the stress setup (M4) | `tests/common/mod.rs`; `tests/support/driver.rs` |
| Git changes follow driver patterns | Yes. `recover_publications` is bound to the port's authority and ref and reuses `admit_pending`, `recover` and `release_pin_and_compact`. `Wal::retained` cleanly splits terminal from `active`. Minor points in L4 and L5 | `publication.rs:682-714`; `wal.rs:1249-1277` |

## Gates

I ran these on a `git archive HEAD` export with the probe file removed, using a private target directory:

- `cargo test --locked -p fgos-event-store -p fgos-git --no-fail-fast -- --test-threads=1`: **160 passed, 0 failed, 2 ignored**. The ignored entries are the 10,000-schedule qualification and the Git crash-child helper. This matches the u2 report.
- `cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings`: clean.
- `cargo fmt --check`: clean.

I did not rerun the ignored qualification (7,354 s in the u2 report).

Status: DONE_WITH_CONCERNS
Summary: No Critical findings; one High (a crash on a shared ref blocks sibling streams and `sealAll`), five Medium, seven Low. H1, M1 and M2 were reproduced with probe tests on a scratch export.
