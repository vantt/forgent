# Event Store phase 02: open logs and locks

| Spec rule | Code | Proof |
|---|---|---|
| §4 / holder-lock §§6–7: seal 58, append 70, Rust-owned paths | Shared registry/schema and spec rows; `locks.rs` takes the real kernel lock in process, waits at most 5s, checks caller ranks, existing 0700 lock directory and filesystem guarantee | Node schema/row assertions; Rust `registry_rows.rs`; invalid directory, rank and guarantee-none refusal tests |
| §9: validate before lock; one batch write including marker; fsync before ack | `append.rs`, `fsio.rs`; registry, writer, payload and cursor validation; own-stream stale-cursor; returned hashes/events/guarantee | `append_recovery.rs`: ack, seen, validation ordering, genuine short write; `framing_prefixes.rs`: every byte prefix of three events, alone and after a committed batch, plus wrong checksum |
| §9 recovery: truncate speculative tail; reconcile all local sequence sources before assigning | `append.rs`: receipt, verified closed ranges, committed active, hint; refuse gaps/overlaps/unbacked hint; durable hint repair | C1 receipt 2 / closed 3–4 / active 5 → append 6; receipt-only and retained published segments; committed internal/cross-batch overlap refuses without truncation |
| §10.1: rotate under append lock and sync both directories | `rotate.rs`: recovery, active fsync, rename, closed and stream directory fsync, durable hint | Ordered boundary assertions; real SIGKILL before/after rename and each subsequent sync/hint boundary |
| §11.1–2: active descriptor before closed listing; verify/dedupe; in-gate local bound | `open_read.rs`: marker-only folding, hash/range checks, hash dedupe and sequence-conflict refusal; vanished segments recorded; local `read_in_gate` returns catch-up-required for unavailable coverage | Deterministic real-file rotation after descriptor open / after active read; segment deletion after listing; missing prefix and receipted tail tests |
| Phase 01 handoff: exclude initializers during temp recovery | Append lock encloses identity sweep and initialization; `identity.rs` now reuses `fgos-durable-file::install_once` | Existing concurrent-initializer tests remain green; locked sweep handles legacy and shared-leaf temps; eight pipe-barrier-started child appenders yield one identity and seq 1–24 |

Validation (private `CARGO_TARGET_DIR=.fgos/runtime/phase-target`):

- `cargo test --locked -p fgos-event-store -- --test-threads=1`: **51 passed**.
- `cargo clippy --locked -p fgos-event-store --all-targets -- -D warnings`: passed.
- `node --test test/holder-lock/registry-contract.test.mjs test/event-store/`: **30 passed**.
- Package formatting and `git diff --check`: passed.

The kill tests use 31 real child processes killed with SIGKILL at trait-injected boundaries, including partial writes, truncation, new active creation, append fsync, rotation and hint repair. No sleeps, environment fault switches or skipped checks. Test files use real temporary Git repositories. Mutation/kill tests ran on tmpfs; the real guarantee port was also queried on ext4 (`/var/tmp`) and tmpfs (`/dev/shm`). An attempted ext4 mutation run failed immediately because `/var/tmp` is read-only in confinement; it is not claimed as ext4 write/fsync evidence. Full `npm test` and physical power-loss testing were not run.

Prior art: reused phase 01 canonical envelopes, marker types, registry, layout and identities; holder-lock's existing acquire/guarantee port; the coordinator-provided durable-file leaf (f1181a1d1). History searches found foundation marker commits 0ce27efc3/d4bb2c8d1 and the shared installer introduction 42bc4c7cc. Impact-analysis: inactive (zero registered providers). No holder-lock Rust source, lifecycle verbs, git add/commit or activation changes.

Remaining: coordinator review/merge and program-board update; phase 03 full ref reader and persisted-scope reconciliation; phase 04 publication/receipt certification; phase 07 setup/doctor lock-directory creation. The open reader intentionally exposes steps 1–2 and vanished-segment evidence for phase 03. Report path follows the brief; convention lookup generated the current-minute variant. MDView preview was attempted but its SQLite database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Phase 02 steps 1–5 are implemented and all required scoped checks pass. Ext4 mutation/crash evidence remains unavailable in this confined worker.
Concerns/Blockers: Ext4 write/fsync proof; full repository suite and coordinator review remain outside this unit's completed validation.
Context refs:
- Event Store spec §§4, 8–11; phase 02 plan; phase 01 unit 3 handoff; holder-lock spec §§5–7.
