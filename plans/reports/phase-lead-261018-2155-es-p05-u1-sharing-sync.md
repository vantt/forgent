# Event Store phase 05: sharing and sync

Implemented steps 1–4 and the named V-EVENT test. Read the phase plan, Event Store §11/§14 and Git §4 first. Reused Git's RepositoryConfig/Publication ports, verified walks, ancestry query, event-seal authority, receipts and durable-file replacement. History searches found no prior sync implementation. `impact-analysis: inactive` (zero providers).

Sync seals every discovered stream under event-seal, checks the URL against Git's mapping provenance, fetches only mirrors, verifies fetched histories, reconciles the own ref by CAS, and pushes only own project history and fence-authorized legacy. Divergence produces an ordered two-parent, manifest-only merge dated at the later parent. No force push. Durable `sync.json` exposes authenticated tips, errors, shared-machine warnings and unpublished status; retirement summaries include sealed publication and oldest unsealed age.

Two Git repairs stay within §3/§4/§10: no-op mapping setup records renewed URL approval; publication recovery closes interrupted transport through local observations without resending it. Fetch/legacy use stable authority before the first append. Sealing recognizes verified shared-machine reconciliation while retaining sibling-receipt ancestry and own-origin checks.

**Proof:** 180 passed, 0 failed, 2 intentionally ignored helpers/qualification entries; locked all-target clippy passes. Scoped rustfmt and `git diff --check` pass. Real bare remotes and clones cover offline fetch, rejected push/retry, three-clone convergence, joining/leaving, shared machine IDs, two-parent merges, legacy distribution/mismatch, rewind baseline retention, forged own origin, GC, retirement and real SIGKILL after seal CAS. Existing crash/receipt/coverage tests remain green. V-EVENT evidence run: `unit-run-1792335330301-2d5438cb/producer/1`, suite `v_event` (four tests green in the full gate).

Reproduce from the checkout root; no target directory is hard-coded:

```sh
cargo test --locked --no-fail-fast -p fgos-event-store -p fgos-git -- --test-threads=1
cargo test --locked -p fgos-event-store --test v_event --test three_clones -- --test-threads=1
cargo clippy --locked -p fgos-event-store -p fgos-git --all-targets -- -D warnings
```

Logs: `/tmp/es-p05-gate.log`, `/tmp/es-p05-clippy-gate.log`. Git performance was not optimized; E3 remains a separate lane. Real-forge acceptance, setup/doctor/consumer integration, review and merge remain their planned later steps. Coordinator updates to the program board, main phase table and changelog are outside this write grant. No staging or commits performed. MDView preview was attempted but its database is read-only in this worker.

Status: DONE_WITH_CONCERNS
Summary: Completed phase 05 sync and V-EVENT with the locked two-crate gates green.
Concerns/Blockers: Coordinator metadata updates remain outside the write grant; no implementation blocker.
Context refs:
- (none)
