# Git phase 01, unit 4: Publication operations dependency

**Update 2026-10-18:** The coordinator narrowed the prerequisite to a synchronous bounded-I/O member with the existing `run_borrowed` guarantees; a suspended-start barrier is not required by Git Publication. The prerequisite is implemented in [the follow-up report](phase-lead-261018-1216-git-p01-u4b-holder-lock-borrow-io.md). The original investigation below is historical; Publication operations beyond the driver seam still require their own implementation.

Stopped under the assignment's explicit rule: “If fgos-holder-lock lacks an API you need, stop and report precisely instead of editing it.” No production code or dependency was changed.

Requirement → implementation → evidence:

- Caller-acquired opaque authority, every effecting child through `run_borrowed` → blocked on holder-lock's public borrow API. `packages/holder-lock/rust/src/port.rs:166` keeps the descriptor private, as required; `run_borrowed` at line 568 is synchronous and returns only exit, signal and leftovers killed. There is no public contained-spawn adapter or child-control callback.
- Binary object input, bounded captured output and errors → `BorrowSpec` (line 305) has argv, cwd, environment and only Inherit/Null/Files stdio. No explicit input bytes/file/pipe or output pipe handles exist. Files sets stdin to null and is Windows-only; Unix explicitly rejects it at line 606. Inherit would consume the host's streams and Null discards Git's object IDs and diagnostic evidence.
- Existing hardened spawn door → `packages/git/rust/src/driver.rs:54` requires `BorrowedSpawn::spawn_borrowed(ContainmentDriver, ContainmentDomain, SpawnSpec) -> Spawned`. The driver owns bounded pipe readers, timeout cancellation and domain-empty verification. The holder-lock call accepts none of these containment objects and exposes no running child; it cannot implement that interface directly. Moving process-global standard streams or launching a shell/helper redirection path would introduce a second mechanism rather than fill the missing primitive.
- Successor admission → holder-lock already has the predecessor rule in `acquire` and `predecessor::admit`. That rule must remain authoritative. This is not a request for a new registry row or an exposed descriptor.

Needed upstream capability: an opaque-handle borrow operation with explicit stdin/stdout/stderr handles, cancellation/deadline support and integration with the existing process containment spawn port, preserving predecessor admission and drain-before-return/release. Its exact API belongs to the holder-lock owner. A streaming/control extension to `run_borrowed` could also serve if it preserves those guarantees. Merely enabling Unix output files would not provide binary stdin, bounded streaming capture or deadline cancellation.

Prior art: history searches for BorrowStdio and spawn_borrowed found the original holder-lock port (`1afc7973f`), Windows file-stdio addition (`f6f86b8c8`) and Git's intentionally unimplemented borrowed-spawn seam (`dc6c91249`). Current public exports and Unix implementation confirm no suitable adapter. No holder-lock/process/supervisor/terminal-control files were edited.

Validation of the unchanged baseline: `CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo test --locked -p fgos-git -p fgos-durable-file` passed 32 tests (23 Git unit, 3 Git contract, 6 durable-file); required locked clippy with `--all-targets -- -D warnings` passed. These are units 1–3 evidence, not Publication conformance or new authority tests.

Event Store interface: still the preliminary `Publication` trait in `packages/git/rust/src/lib.rs`. No operational implementation is handed over or frozen. All unit-4 work remains: object writes, bounded stop-set walks, ordered pin/WAL/target CAS and delete, remote results, directory durability, live authority/admission adapters, recovery and receipt materialization. Existing WAL and driver foundations remain intact. No registry rows, git add or git commit were run. Board updates remain coordinator work outside this assignment's write scope. MDView MCP was unavailable.

Status: BLOCKED
Summary: Publication operations require a holder-lock borrow API that supports explicit I/O, running-child control and process containment; the current synchronous status-only port cannot supply the hardened driver adapter.
Concerns/Blockers: Upstream holder-lock API extension is outside scope and explicitly forbidden in this unit. Resume unit 4 after that capability is available.
Context refs:
- packages/holder-lock/rust/src/port.rs:285–329, 568–638
- packages/git/rust/src/driver.rs:50–61, 370–430
- packages/git/rust/src/wal.rs:763–774
- plans/reports/phase-lead-261018-1158-git-p01-u3-wal.md

Upstream prerequisite investigation (2026-10-18): [holder-lock streaming borrow report](phase-lead-261018-1213-git-p01-u4a-holder-lock-streaming-borrow.md) identifies a process-port admission-barrier gap before predecessor declaration. No streaming API was added; unit 4 remains blocked.
