# Event Store phase 04: Publication sealing — blocked

Historical attempt. The coordinator resolved D6 at main `16b2c01e5`; the continuation and final qualification are recorded in [the completion report](phase-lead-261018-1643-es-p04-u2-seal-finish.md). The blocker and partial counts below describe only this earlier attempt.

Read the [phase plan](../261018-0945-event-store-fgos-event-store/phase-04-seal-publication.md), then Event Store §4/§10 and Git §4/§10. Work is dormant on `event-store/p04-seal`; coordinator review and merge (step 7) were not performed.

**Step 1:** A1 option 1 was signed as **D-ADR0058** and is implemented in Git. D6's supersession dependency is unblocked despite the stale conditional wording in the plan. M7 is available: `CommitInput` requires explicit author/committer dates (`<unix-seconds> <offset>`). Existing rotation, framing, coverage walk, causal ordering, durable-file replacement, identity randomness and Publication authority/WAL are reused. `impact-analysis: inactive` (zero registered providers).

| Spec rule | Code | Behavioral evidence |
|---|---|---|
| §4: seal 58 outside state; append 70 only during rotation | `locks.rs`, typed `rotate_guarded`; seal/all/interval context checks | Rank, hot-gate, contention, wrong-store guard and existing rotation tests |
| §10: unchanged segment, canonical seal, exact tree, deterministic commit | `publish.rs`, `refs.rs` | `seal_publication.rs`: byte/tree, identity/date, deterministic object, linked-worktree/index-lock/hook isolation |
| §10: CAS, verified durable receipt before deletion, causal deferral | `seal.rs`, `receipt.rs`; effect-aware errors and integrity diagnostics | Receipt rename failure, published-blob corruption, external CAS collision, lost receipt/hint, shared-ref rewind and deferred coverage tests |
| Git §10 rules 4a/4b: recovery without replay; bounded retained records | `PublicationPort::recover_publications`, WAL `retained` enumeration | Git tests: observed recovery, before-attempt abandonment, fresh-id non-identical supersession after real SIGKILL |
| §7/§10: branch/local/promote/abandon; §11 certified pruning | `promote.rs`; source-machine ancestry context in `walk.rs` | `branch_local_refs.rs`, foreign-machine merge below a covered seal, C4 regressions |
| §10 crash table | Real filesystem/Publication checkpoints | `kill_append.rs`: real SIGKILL at rotation, objects, both sides of target CAS, receipt write/fsync/rename, and deletion boundaries |

Steps 2–5 have implementation and focused proof, but are not approved as complete phase delivery.

## Blocking contract conflict

Event Store accepts and acknowledges `1969-12-31T23:59:59.999Z`. D6 requires its seal commit date to come from that last event, producing Unix second `-1`. Git's real `hash-object -w -t commit --stdin` rejects that date with exit **128**, `badDate`; the otherwise identical date `0 +0000` succeeds. The existing Publication port also refuses negative dates.

`seal_publication::pre_epoch_events_remain_local_when_git_cannot_represent_their_required_date` reproduces the acknowledged-but-unsealable event and verifies retention and sequence continuity. It documents the blocker, not successful sealing. The independent raw-Git probe, including exact input and positive control, is in the assignment outbox's `date-probe.json`.

An owner decision must reconcile accepted timestamps with D6: either constrain timestamp admission and define handling of already acknowledged events, or amend the deterministic Git-date mapping. No event bytes or signed policy were changed to hide the conflict. The brief explicitly requires stopping/reporting when the signed contract needs more than a named port extension.

## Verification and unfinished proof

`packages/event-store/rust/run-gates.sh` runs the required locked two-crate tests with `--no-fail-fast --test-threads=1`, then all-target clippy with warnings denied. Both passed; formatting and `git diff --check` passed. Final gate log: `/tmp/fgos-work/es-p04-final-gate.log`.

The explicit release-mode qualification (`qualify-seal.sh`) exercises two sealers, two readers and an appender at seeded real boundaries, over ancestry containing a real promote and foreign-machine merge. **1,100 schedules completed**, then the run was intentionally terminated under the brief's stop rule. Existing C1, every-prefix C2 and C4 tests pass in the ordinary gate. **Step 6's 10,000-run qualification, complete WAL census and 30-day projection remain unfinished and are not claimed.** Log: `/tmp/fgos-work/es-p04-qualification.log`. The long test is explicitly invoked separately from the ordinary gate.

Only allowed code paths and this report were written in the checkout; no staging or commits. Coordinator writes needed outside scope: Event Store spec (timestamp decision), Event Store plan (D6/status), program board (lane status), and CHANGELOG (visible behavior).

Status: BLOCKED
Summary: Implemented dormant Publication sealing and recovery with real-port and real-kill tests. The timestamp/D6 conflict blocks complete phase qualification.
Concerns/Blockers: Owner timestamp-policy decision; unfinished 10,000-run/WAL proof; coordinator writes listed above.
Context refs:
- (none)
