# Holder-lock streaming borrow prerequisite

**Update 2026-10-18:** The coordinator narrowed the prerequisite to a synchronous bounded-I/O member with the existing `run_borrowed` guarantees; a suspended-start barrier is not required by Git Publication. The prerequisite is implemented in [the follow-up report](phase-lead-261018-1216-git-p01-u4b-holder-lock-borrow-io.md). The original investigation below is historical; Publication operations beyond the driver seam still require their own implementation.

No production API was added. The requested guarantees expose a prerequisite in the read-only process spawn port; Git unit 4 remains blocked.

**API and guarantees.** Reuse `SpawnSpec` for explicit binary stdin and output pipe files, and its explicit fd map for the private lock description. Keep synchronous `run_borrowed` unchanged. A new member of that family needs a scoped lifecycle (or an owning guard), bounded capture, deadline/cancellation, and drain on every exit. Returning a bare `Spawned`, as Git’s current `BorrowedSpawn` seam requests, cannot enforce that lifecycle: it has no borrow of the lock handle, so the caller can release while the child runs. Never expose the lock file or fd to solve this.

**Blocking prerequisite.** Holder-lock spec §8 requires the predecessor record before creating the domain. In process `containment/mod.rs`, `ContainmentDomain::new` sets `domain: None`; `domain()` provides no identity yet. The contract and process spec §10 explicitly complete the Unix identity only after `spawn_in`. Linux `spawn_in` executes the command before `set_domain` and return; there is no suspended-start/admission callback. Declaring after spawn creates a crash interval: the command can fork a writer that closes the borrowed fd, then the holder can die before recording the domain. The kernel lock can become free while that writer remains. The existing acquire admission cannot discover an undeclared domain. Merely adding pipes or polling does not fix this interval.

The process owner needs to extend its existing spawn door with an admission barrier: identify a contained root while payload execution is blocked, allow atomic predecessor declaration, then release execution; declaration failure or holder death must terminate/drain the blocked domain. Equivalent predeclared, enforceable domain identity is also sufficient. This needs changes under `packages/process`, explicitly read-only in this assignment. A holder-lock-only launcher/helper would introduce a second spawn mechanism rather than extend the existing one.

**Containment proof limit.** The selected Linux fallback is `linux-pgroup`, whose documented `setsid` plus double-fork escape prevents domain-empty proof. A strong streaming form must refuse it by name before spawning, or await a kernel containment backend. The real bwrap namespace probe on this machine failed with “No permissions to create a new namespace.” This is an execution-environment limitation in addition to the port gap, not evidence that a production streaming form works. Windows synchronous behavior remains untouched; no new streaming operation or refusal is claimed implemented.

**Prior art.** `1afc7973f` introduced synchronous borrowing and description-holder cleanup; `f6f86b8c8` added Windows jobs and cancellation; `dc6c91249` added Git’s unimplemented seam; `c1e79c6ad` introduced process containment with post-spawn identity. Reuse those ports and their stdio/fd mapping, not raw spawn or a new registry. Impact-analysis: inactive (zero registered providers).

**Baseline validation, unchanged source.** With `CARGO_TARGET_DIR=.fgos/runtime/phase-target`, `cargo test --locked -p fgos-holder-lock` passed 29 tests and locked all-target clippy with warnings denied passed. Literal `node --test test/holder-lock/` failed because Node 24 treats that directory as a module. The explicit glob ran 121 tests: 90 passed, 11 failed, 20 skipped. Four failures require missing `target/release/fgctl`, six require host process visibility (the scan correctly refuses this PID namespace), and one extracted legacy fixture cannot resolve `yaml`. These are baseline failures; no test bypasses or fixture changes were made. New streaming acceptance cases remain unimplemented and unproved.

**Git unit 4 resume.** First obtain the process admission barrier within an expanded upstream assignment and a host capable of kernel containment. Then implement and test the streaming `run_borrowed` family, retaining the opaque handle until verified empty, including cancellation, overflow, errors and abandoned-control paths. Adapt the Git seam to that scoped lifecycle rather than return an unguarded child; keep publication blocked until the binary round trip, child-held authority, bounded capture, cancellation drain, setsid containment/refusal and descriptor secrecy tests pass. Board/changelog changes remain coordinator work outside this scope. MDView MCP is unavailable.

Status: BLOCKED
Summary: The process containment port starts payload execution before exposing the identity needed for predecessor declaration. A safe streaming borrow needs an admission barrier in that read-only component before implementation can preserve all requested guarantees.
Concerns/Blockers: packages/process is outside the authorized write scope; kernel PID namespaces are unavailable on this host; Node baseline is not green.
Context refs:
- docs/platform/holder-lock/spec.md §5, §8
- docs/platform/process/spec.md §10
- packages/process/rust/src/containment/mod.rs
- packages/process/rust/src/containment/linux.rs
- packages/process/contracts/containment.port.v1.json
- packages/git/rust/src/driver.rs
- plans/reports/phase-lead-261018-1210-git-p01-u4-publication-ops.md
