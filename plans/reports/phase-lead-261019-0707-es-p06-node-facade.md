# Event Store phase 06 — Node facade

Status: DONE_WITH_CONCERNS

Implemented the dormant combined-addon facade for prepare/open, append, in-gate/full read, seal, cadence, seal-all, sync, status and unpublished summary. Repository authority stays opaque in Rust and is resolved before the gate; preparation caches per process. Machine identity uses Git config then the existing state-root machine-id file. The facade requires held ranks for outside-gate operations and refuses hot sections by name. Real local-remote sync, linked-worktree preparation with trustedMain, fresh-store reads and environment scrubbing are covered.

Reused Git's addon loader/resolver, driver, Publication authority and existing Event Store implementations. Extracted the existing hot depth/error/process guard into one holder-lock leaf, migrated production callers, and retained the existing state-module re-exports for callers. Transactions now carry prefetched.eventStore. The unused native identity/rotate methods were removed. Consumer discovery uses a shipped, immutable manifest and loads rebuild code lazily from its declared path. The manifest is empty while the consumers remain on legacy storage; production registrations belong to the consumer cutover. Contracts are included in npm packaging. No setup/config default or environment variable was added; registration stays deferred under plan D8.

Coordinator-approved adjustments:

- exportJsonl, exportLegacyLayout, importLegacy and readLegacyFromHead move together with their crate functions and bindings to phase 08. No stubs were added.
- Git's resolver currently needs the trusted main path for linked worktrees; separate-git-dir and arbitrary cwd discovery remain Git work. Pass prefetched trustedMain. The coordinator accepted this limitation for phase 06.
- The shared guard extraction and the small Rust boundary changes were explicitly approved. All paths outside the original write scope that must be included by the coordinator are: `src/holder-lock/hot-guard.mjs`, `src/state/hot-lock.mjs`, `src/state/runtime-coordination.mjs`, `src/git/index.mjs`, `packages/event-store/rust/src/locks.rs`, `packages/event-store/rust/src/sync.rs`, and `packages/git/node-addon/src/lib.rs`.

Validation, from this worktree, with no CARGO_TARGET_DIR override:

```sh
cargo test --locked -p fgos-node-addon -p fgos-event-store
cargo clippy -p fgos-node-addon --all-targets -- -D warnings
rustfmt --edition 2021 --check packages/git/node-addon/src/event_store.rs packages/event-store/rust/src/locks.rs packages/event-store/rust/src/sync.rs
node --test test/event-store/facade.test.mjs test/event-store/no-spawn-in-gate.test.mjs test/event-store/platform-refusal.test.mjs test/event-store/consumers.test.mjs test/architecture.test.mjs test/git/native-load.test.mjs
node --test test/state/hot-lock-guard.test.mjs test/state/hot-lock-known-exec-sites.test.mjs
cargo build --locked -p fgos
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=/home/vantt/projects/forgent/.claude/worktrees/es-p06/target/debug/fgos npm test
npm pack --dry-run --json --cache /tmp/fgos-work/npm-cache
```

Rust: 134 passed, 0 failed, 1 ignored; clippy and changed-file formatting pass. Final facade/architecture/addon matrix: 49 passed, 0 failed, 1 Windows-only skip. The earlier combined run including the five existing hot-lock regression tests passed 54, with the same single skip. The strace test ran successfully (`strace -f -e trace=process,write`): zero clone/clone3/fork/vfork/execve/execveat calls between the in-gate markers. The exec guard and non-Linux refusal tests pass. Dry-run npm packaging includes the consumer manifest and every existing Event Store contract. `git diff --check` passes. Impact analysis: inactive (zero present providers); source searches cross-checked callers and prior history. No git add/commit or lifecycle verbs were run.

Concerns: full npm test stops before running tests with EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`; rerun the exact command above outside confinement. The planned crate-wide debug assertion against any future port call is not implemented: current append/readInGate signatures have no Git authority and the actual paths are verified by exec guard and strace, but a general Rust port-call assertion would need instrumentation at Git's port boundary. The existing Git topology limitation is recorded above. Markdown preview was attempted with mdview, which also refused its read-only database. Review and merge remain the coordinator's step 5.

Evidence: `test/event-store/{facade,no-spawn-in-gate,platform-refusal,consumers}.test.mjs`; logs under `/tmp/fgos-work/fgos-es-p06-{rust-test,final-node,focused,npm-test}.log` and packaging inventory `fgos-es-p06-pack.json`.

Summary: Added the dormant Event Store Node facade with real gate, publication and no-spawn proofs; coordinator review remains subject to the full-suite environment limit and the noted assertion/topology gaps.
Context refs:
- plans/261018-0945-event-store-fgos-event-store/phase-06-node-facade-addon.md
- docs/platform/event-store/spec.md
