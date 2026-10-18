# Event Store phase 04: sealing completion

Read the [phase plan](../261018-0945-event-store-fgos-event-store/phase-04-seal-publication.md), Event Store §4/§10, and Git §4/§10 first. Continues the [historical attempt](phase-lead-261018-1610-es-p04-u1-seal-publication.md). Steps 1–6 are complete; step 7 (review/merge) was not performed. No staging or commits.

D6 follows coordinator main `16b2c01e5`: commit date is the last event's whole Unix second clamped to zero. Event bytes/hashes and age calculations remain unchanged. The real-port pre-epoch test uses `1969-12-31T23:59:59.999Z`, verifies author/committer date `0 +0000`, rebuilds the identical commit, then successfully re-seals after interruption. A1 is signed D-ADR0058; M7 uses explicit author/committer dates.

Reused rotation, coverage/order, durable-file replacement, and Git Publication/WAL authority. Existing CAS, receipt/deletion, linked-worktree isolation, branch/local/promote/abandon, and real-SIGKILL recovery vectors pass. C1 covers rotation death followed by append; C2 covers every byte prefix. Added a real-reader C4 vector with open-log or rebuilt-receipt coverage: an unknown foreign origin below a covered seal becomes readable when its missing causal predecessor arrives.

`run-gates.sh`: **160 tests passed**, format and locked two-crate all-target clippy passed. Two ignored entries are the separately run qualification and subprocess crash helper. `qualify-seal.sh`: **10,000 seeded schedules passed**, with appender, two sealers/readers, real promote and foreign-machine merge ancestry; elapsed **7,354.12 s**. Seed failures identify their reproducible schedule. `impact-analysis: inactive` (zero providers).

Final WAL census: **0 operation directories, 0 pins, 0 unresolved**; **10,005 terminal compacted receipts**, **3,251,609 logical bytes**, **10,008 inodes / 3 directories**, maximum receipt **325 bytes** (bound 512). Active directories/pins were also checked every 100 schedules. Measured timed sealing rate **1.360144/s**; 30-day linear projection **1,146,237,549 logical bytes**, **3,526,902 receipts**, conservative total census projection **3,527,960 inodes**. Active working storage drains; retained operation-id receipts grow linearly under signed Git §10. These are Linux process-crash results, without a power-loss claim.

Reproduce from the checkout root using the two scripts in `packages/event-store/rust/`; both declare the private Cargo target. Logs: `/tmp/es-p04-u2-final-gates.log`, `/tmp/es-p04-u2-qualification.log`. Code/tests remain within the assignment's grant. Coordinator updates outside it are listed in the result claim.

Status: DONE_WITH_CONCERNS
Summary: Completed phase 04 steps 1–6, including deterministic pre-epoch sealing and the full stress/WAL proof.
Concerns/Blockers: Retained receipt storage grows linearly; coordinator must update the Event Store spec, phase/program status and changelog outside this write scope. Review/merge remains step 7.
Context refs:
- (none)
