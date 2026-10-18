# Event Store phase 03: HEAD/tree reads and reader

Implemented steps 1–4 on `event-store/p03-reader`. The previous u1/u2 Git blockers are resolved. No model re-check, review, staging or commit was performed. `impact-analysis: inactive` (no providers). The assignment's exact report path takes precedence over the convention command's current-time path.

| Spec rule | Code | Real behavior / proof |
|---|---|---|
| Git Inspect/C1: worktree-specific HEAD; typed literal tree discovery | `packages/git/rust/src/{lib,driver,publication}.rs`, `packages/git/contracts/ports.v1.json` | `head_tree.rs`: attached, unborn and detached linked-worktree HEAD; SHA-1/SHA-256 × files/reftable; paginated newline/tab/glob/non-UTF8 paths. Both operations delegate through Inspect without borrowing or validating Publication's lock; existing hardened environment, no lazy fetch, optional locks off, bounded capture and named missing-object refusals are reused. |
| §11: stop only at certified commits; complete walk before coverage/certification | `walk.rs`, `read.rs` | `walk_certified.rs`: C4 covered A2 still discovers B1 below merge; real promote second parent; duplicate tips; 260-commit paginated termination; losing certificates only increases traversal. Stop commits are returned by Git as boundary records and never have their seals read. |
| §12: placement, closure, sequence conflict, Kahn order, concurrency | `order.rs`, existing envelope/batch verifier | `order_kahn.rs`: all permutations through seven events and 10,000 shuffled nine-event inputs; clock rollback/equal times; missing predecessor and transitive C5 release; cycles/conflicts; atomic promote block, causal inputs and hidden orphan branches. |
| §11/§15: active → closed → refs, canonical coverage cursor, conservative fold/replay | `read.rs`, `cursor.rs`, existing `open_read.rs` | `cursor_incremental.rs`: real local-to-ref transition/restart, incremental fold equals rebuild, C6 late mirror origin replay at position zero, C5 no coverage/certificate advance, ref holes leave the input cursor unchanged. Certificates are bound to requested streams/order mode. |
| D10/D17/D18: verified fetched content and tracked legacy history | `read.rs`, `walk.rs`, existing legacy parser/order | Named tests check machine/scope, event/seal identity, own-origin mirror above receipt, mirror rewind, tracked HEAD rather than dirty bytes, legacy fence OID/seal digest, and file/line provenance. Work and porting legacy sources are selected by requested stream; baseline/shard sort tags remain separate from physical provenance. |
| P02 L5: lost receipt/hint must not restart published sequences | `read::reconcile_durable_history` | Tests remove local hints after published-data deletion: the outside-gate hook walks the own ref, then durably restores physical `lastSeq` separately from emitted coverage under append exclusion. An overlapping seq-1 active batch is refused without deletion; with no overlap the next real append uses seq 2. |

Reuse: Git's Inspect driver and Publication traversal/objects; Event Store's canonical envelope validation, marker-closed decoder, local read ordering, legacy order/dedupe, append lock and durable-file replacement. History searches found foundations/error registrations but no earlier reader/certificate mechanism or exported HEAD/tree-list operation to recover.

Validation: final locked two-crate gate passed: 124 tests passed, 0 failed, 1 existing ignored subprocess-harness helper; Clippy passed with `-D warnings`; scoped formatting and `git diff --check` passed. Reproduce with `sh packages/event-store/rust/run-gates.sh`; it sets private `CARGO_TARGET_DIR=.fgos/runtime/phase-target` and runs the exact locked two-crate tests and Clippy commands. No environment bypass or in-memory Git double was introduced.

Integration notes: full reads and reconciliation run outside the Work gate; existing `read_in_gate` remains the bounded local-only door. The facade/sealer must invoke the reconciliation hook before allowing sequence assignment after cache loss. For suffix comparison, `ReadRequest.folded` supplies the consumer's verified previously emitted events; omitting it with nonempty coverage rebuilds from zero. Combine `legacy` then `sequence` for replay; `events` is the newly covered delta. Explicit concurrency pairs can have quadratic output for fully concurrent streams. Ref enumeration is live rather than an atomic snapshot, as in Git u8.

MDView preview was attempted and refused by its read-only database; the Markdown report remains available on disk.

Coordinator documentation writes outside this unit's scope: add the two read operations to `docs/platform/git/spec.md` (including the distinction between HEAD observation and mutation); update the program-board lane and `CHANGELOG.md`. The model re-check and review/merge remain coordinator-owned steps 5–6.

Status: DONE_WITH_CONCERNS
Summary: Added typed Git HEAD/tree reads and the Event Store coverage/order/cursor pipeline with real-repository C4–C6, V-SEQ-01 and receipt-recovery evidence.
Concerns/Blockers: No additional Git port gap. Facade integration and canonical documentation synchronization remain with their owning phases/coordinator; no rebuild-latency acceptance measurement is claimed.
Context refs:
- (none)
