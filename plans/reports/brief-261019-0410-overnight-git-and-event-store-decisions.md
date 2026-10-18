# Overnight: Git and Event Store lanes, and two decisions for the owner

Session `ac420727` (second machine), 2026-10-18 22:40 to 2026-10-19 04:15 Asia/Saigon.

## Done overnight

| Work | State | Evidence |
|---|---|---|
| Shared durable-file / canonical-JSON moves (deferred after 6.3) | on main `035c3a0aa` | [guide](guide-261018-2246-owner-machine-after-shared-primitive-moves.md) |
| Event Store phase 05 (sharing and sync) + review fixes | on main `31055716a` | [review](review-261018-2221-es-p05-sharing-sync.md), [guide](guide-261018-2305-owner-machine-after-event-store-sync.md) |
| Publication port optimization + review fixes + holder-lock release settle | on main `4ebca1739` | [final E3](experiment-261019-0247-git-e3-after-release-settle.md), [guide](guide-261019-0410-owner-machine-after-publication-port-optimization.md) |
| Git phase 04 (custody lease across the runner commit) | branch `git/p04-custody` `0bf950a79`, reviewed, review fixed, host-verified | review `plans/reports/review-261019-0051-git-p04-custody-lease.md` on that branch |

Git 01 is **not landed**: E3 is not green, so the 22:38 self-land condition is not met. Event Store phase 06 and Git phase 02 have not started: the E3 budgets file says any failed line stops the plan for the owner.

Decided overnight inside the frame (for information):
- Holder-lock: the full process scan per borrowed git child was replaced by a release-time settle from kernel lock evidence (counsel by kongming; one correction by the lead after reproducing a non-atomic `/proc/locks` read). Holder-lock spec §1 line 27 gets a dated supersession: the only pid read is the locker pid the kernel stamps on a lock record, compared only with this process's own pid.
- Compaction keeps receipts recoverable (ledger v2 stores expected/next) instead of narrowing `recover`.
- A verify-step custody gap belongs to COOK P2 (board 01:05).

## Decision 1: the changing-CAS budget of E3

**What is happening.** After optimization, 10 of 11 measurable E3 lines pass under the 00:18 run's conditions. `compareAndSwap` changing a ref fails: p95 115-183 ms against a 60 ms budget (p99 117-191 against 120).

**Cause.** The signed WAL ordering (Git spec §10) needs ten durable record installs in sequence per changing CAS; on this NVMe each journal commit takes about 5 ms idle and about 10 ms under other sessions' writes, so fsync alone is about 52 ms before any Git child runs; compaction of the previous operation adds about eight more. The strace census confirms 20 fsyncs per CAS. The in-process Rust route measures the same as the Node route, so Q1 (one combined addon) is not the cause. Separately, spawn-bound lines (push, writeBlob new, reconcile) pass on busy cores and fail on an idle host for the old and new code alike, because the CPU governor is `powersave` (one `git` spawn 5.5 ms idle vs 1.4 ms busy).

**Options.**
1. **Set the changing-CAS budget from the measured floor**: p95 ≤ 150 ms, p99 ≤ 250 ms on ext4, and fix the measurement condition (record raw spawn time and governor with each run; run under the `performance` governor or busy cores). No code change; Git 01 can then self-land here. Harm: the original 60 ms target is dropped; one event seal publication costs about 0.1-0.2 s, invisible next to a model call.
2. **Batch compaction** (plan rule 12a allows it): p95 about 70 ms, still over 60, with p99 spikes when a batch runs. About 50 lines in `publication.rs`. Does not reach the budget alone.
3. **Amend the WAL contract** to fold fsyncs (for example the Prepared record's directory sync into the TargetAttempt write): saves about 5-10 ms per CAS, needs a dated amendment of D-ADR0057 §10 and re-running the M1 model check and crash proofs (about a day). Together with option 2 still likely above 60 ms on this disk.
4. **Reverse Q1** (separate addons): no gain; the cost is not in the N-API boundary.

**Recommendation.** Option 1. The cost is durability the spec requires, measured and explained; nothing cheaper keeps the guarantees.

**Scope of a yes.** Edits `plans/261018-0914-git-component-fgos-git/e3-budgets.md` (changing-CAS line and a measurement-condition line, owner-set with today's date), marks E3 green, and lets me land Git 01 on this machine (with 6.4, which is on main) and write the owner-machine landing guide. It does not land anything on the owner machine and does not start Git 04's landing.

## Decision 2: Git phase 04 best-effort handoff (review H2) and its landing

**What is happening.** Phase 04 clears the producer's predecessor record after a successful run once its process group looks empty. For best-effort domains (`linux-pgroup` on unconfined Linux, `macos-tree` on macOS) "looks empty" cannot see a `setsid` escapee, while admission after a controller death refuses those same domain kinds.

**Cause.** Read in code by the reviewer; a real vector now shows it at the predecessor-primitive level. New evidence from the lead: on supervised Linux the gate is a subreaper and kills the `setsid` escapee before the successful receipt, so the exposure is unconfined Linux and macOS. Before phase 04 there was no custody at all, so neither option is worse than today.

**Options.**
1. **Keep the behavior and write the limitation** into Git §6/§17 and holder-lock §8: a recorded handoff over a best-effort domain does not cover `setsid` escapees; revisit when containment drivers land. A few doc lines.
2. **Refuse to clear best-effort records**: fail closed, but every unconfined or macOS run then strands its worktree; `fgos run --worktree` on macOS is always refused and Workflow always redispatches.

**Recommendation.** Option 1.

**Scope of a yes.** Doc lines on the branch, a final host test pass, then phase 04 merges to main only together with a stop-everything landing on both machines that you schedule (phase 04's landing rule: an older controller commits without a lease). A yes does not choose the landing time.

## Next without the owner

ES phase 06 and Git phase 02 start as soon as Decision 1 is answered; Git 04 docs are ready to apply after Decision 2.
