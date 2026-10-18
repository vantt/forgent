# Git phase 01, unit 2 checkpoint

Step 3 (partial): added the private Git driver, scrubbed runner environment, dormant typed HookContext shape, bounded pipe readers (64 MiB lists, 50 MiB diffs, 64 KiB stderr), time ceilings, credential redaction, and containment through the existing fgos-process port. Calls disable replacement objects, hooks, fsmonitor, automatic gc/maintenance, rerere and autoStash; non-Remote contexts disable lazy fetch and protocols. Ref updates add --no-deref. Publication requires a BorrowedSpawn adapter; there is no default unborrowed fallback. Actual holder-lock lending remains with the WAL unit.

Added git-floor.v1.json (2.53.0) and real throwaway-repository probes for hook suppression, hook run, no-dereference deletion, and no lazy fetch, with enabled-hook/enabled-fetch positive controls. Effective config with origins is parsed as NUL records and re-read before calls; command-running keys are refused by name. No provenance exception is granted yet. The floor verdict is now cached once per process across driver instances; concurrent first use is serialized by OnceLock, and probe errors are cached fail-closed for the process lifetime. HookContext is only a private shape, not an operational hook API; Remote authorization/transport policy and operation-specific revision/parser wiring remain for subsequent work. This is not a completed Publication backend.

Step 4: added RepoLayout and resolution from an explicit canonical trusted main checkout or bare root. Linked gitdir authority comes from the main repository's worktree registrations, not the worker's .git file. Detects files/reftable, SHA-1/SHA-256, shallow, alternates and promisor layouts. Failed object reads name detected layout features while retaining Git diagnostics. Full missing-object classification, traversal-boundary handling and immediate pre-effect topology/identity revalidation remain with typed operations; current failure classification is conservative by layout. No mutation API is exposed.

Evidence (Linux, Git 2.53.0, rustc 1.99.0; private CARGO_TARGET_DIR=.fgos/runtime/phase-target):

- CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo test --locked -p fgos-git -p fgos-durable-file: passed, 18 tests (9 driver, 3 Git contracts, 6 durable-file). A concurrent two-driver regression verifies shared floor verdict identity. Real OS-temp repositories cover all four ref/object-format combinations, linked registration with poisoned worker .git, config changes and command keys, missing promisor/alternate objects, shallow detection, poisoned inherited GIT_* environment, output overflow, timeout and the no-loan refusal.
- CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo clippy --locked -p fgos-git -p fgos-durable-file --all-targets -- -D warnings: passed after the coordinator’s process fix and the three Git lint fixes. ConfigRecord names the origin/key/value tuple; config parsing uses as_chunks::<2>() after rejecting odd field counts. No lint suppression attributes were added.
- rustfmt applied to the two changed Rust sources; git diff --check passed. No npm suite or cross-platform proof was run.

Prior art: reused fgos-process containment::select/create/spawn_in/is_empty/kill_all and its explicit fd-map SpawnSpec; no private process-domain implementation. Git history search found no prior HookContext or hardened driver in packages/git. Unit 1's Oid/RefName and contracts remain in place. impact-analysis: inactive (zero registered providers).

Continuation completed the three requested clippy repairs and the process-wide floor policy gap. The prior process blocker is resolved by the coordinator's cherry-pick (local HEAD 20eb34caf); no process files were edited here. No add/commit was run. The existing report path was reused as directed. The program-board update and any user-facing changelog/setup registration remain coordinator work outside this unit's write scope before exposure. MDView MCP was unavailable. The CLI preview attempt failed because its database is read-only; no preview URL was produced.

Remaining items (deliberately not claimed complete):

- Publication/WAL: implement the real holder-lock BorrowedSpawn adapter and typed Publication operations. The private driver still refuses Publication without a loan. Namespace/direct-ref validation, symbolic preflight/read-back, exact-old CAS and operation evidence belong to that layer; adding --no-deref alone does not establish C1.
- Typed operations: insert --end-of-options at each revision parser boundary, wire operation-specific byte parsers/type checks, distinguish missing-object errors from other Git failures, and detect shallow traversal boundaries. Current checked() failure classification conservatively names the detected layout even for unrelated Git errors.
- Repository authority: revalidate canonical topology and identity immediately before effects. Current resolution trusts the main-root registration and does not provide a mutation-time identity fence.
- Remote: authorize transport/remote explicitly, allow only its scheme, reset SSH command to a trusted default, and integrate credential/helper provenance. Remote is currently a private policy used by the positive-control probe, not an exposed authorized transport API.
- HookContext: validate hook-supplied authority and wire the actual hook execution API in phase 05. The current type/environment builder is dormant.
- Config: effective origins are parsed and command-running keys are refused; no RepositoryConfig provenance exceptions exist. Every call re-reads config instead of using an identity-sensitive cache (conservative correctness, remaining performance optimization).
- Release proof: no Windows/macOS execution, pinned CI Git-floor setup, combined-addon/doctor integration, full npm suite, or complete V-PUB/C1 adversarial typed-backend proof is claimed by this continuation.

Status: DONE_WITH_CONCERNS
Summary: The continuation fixes all three fgos-git clippy failures and caches floor probing once per process, with concurrent driver coverage. Both required locked Cargo gates pass; the broader Publication backend remains partial as enumerated above.
Concerns/Blockers: No blocker for this continuation. Remaining typed-operation, WAL, Remote, hook and release work must complete before accepting the full phase or exposing Publication.
Context refs:
- docs/platform/git/spec.md §4 C1 and §7
- plans/261018-0914-git-component-fgos-git/phase-01-publication-port.md
