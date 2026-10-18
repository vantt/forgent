# Event Store phase 01, unit 2 checkpoint

Step 5: added the strict, versioned consumer registry schema and transactional file loader. Tests cover domain/type ownership, duplicate registration (including attempted scope changes), all three scopes, project-only `work.*`/`decision`, positive safe schema versions, required boolean `sealOnWrite`, unsupported contract versions, unknown fields, and unregistered-type refusal. `store.promote` is built in (project, version 1, seal-on-write). Payloads stay opaque: rule 3's business-reference direction remains a consumer obligation, not something the store can infer from arbitrary JSON.

Event Store now resolves its machine id from a caller-supplied repository config value before the holder-lock state-root file; invalid config refuses rather than silently falling back. Setup minting remains phase 07. Store identity is random 128-bit lowercase hex, canonical `store.json`, tmp/file-fsync/rename/directory-fsync, with parent directory entries also synced. Existing identities are never re-minted; machine, canonical common-dir path and dev:ino mismatches refuse `event-store-store-moved`. Initialization explicitly requires the caller's event-append lock; phase 02 must wire that precondition before concurrent production use. This unit does not introduce a competing lock mechanism.

The pure layout port accepts an already resolved absolute Git common directory, maps the caller's non-repository result to `event-store-no-repository`, and exposes only the specified store, lock and per-stream paths. Project, named project, local and branch streams share one traversal-safe grammar with envelope/seen/marker/seal validation. Slugs use lowercase ASCII letters/digits and internal hyphens, 1–128 bytes. Real Git repository tests prove linked worktrees share the same open root. Git invocation/environment scrubbing and filesystem-guarantee refusal belong to the actual resolver/append integration in phases 06/02; this crate does not shell out to resolve Git. Native identity support is Unix only at this checkpoint; other platforms explicitly refuse `event-store-unsupported-platform` pending a native file-identity/random driver.

Prior art: reused unit 1's `Scope`, timestamp validation, canonical-line serializer and result-code authority; replaced its loose stream checks with the shared layout grammar. History searches for `sealOnWrite`, `stream-registry`, `machine-id` and `commonDirDevIno` found no earlier Event Store implementation to resurrect. The spec and approved plan D9/D19 supply the named-stream and copied-clone behavior. Impact-analysis: inactive (zero registered providers).

Step 6: added `scripts/event-store/v-spawn-bench.mjs`. It refuses existing roots and non-ext4 mounts before mutation, seeds through the actual consumer API, and runs the real Node CLI against a fresh Git project. Default rows are claim (`take`), move (`todo` to `blocked`, CAS), settle (`return --to blocked`, same writer as its preparation claim), 1/10/20 concurrent sessions, 40 samples each. Timing covers CLI spawn through exit; settle preparation is excluded. Successful claim rows intentionally leave growing claim/state history, as the original experiment did. The harness records raw observations, nearest-rank p50/p95/p99/max, errors and peak direct children; it does not claim descendant spawn counts, lock-wait metrics or in-gate latency.

Ext4 baseline: 2026-10-18 11:55–11:56 Asia/Saigon, `/dev/nvme0n1p2`, beneath the owner's home at `scripts/event-store/bench-fixture` (fixture removed after measurement). Node v24.22.0, Intel i7-13700, 24 logical CPUs. Checkout `0ce27efc380c8089b433a12dd55ac28c75dfa699` contains `a4b1278ae`; its `bin/` and `src/` are byte-identical to main checkpoint `93aad788c`, and no Event Store cutover exists. The real host was activated release `f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374`. Raw evidence: [baseline-ext4.json](../../scripts/event-store/baseline-ext4.json).

| Mutation | Sessions | n | p50 ms | p95 ms | p99/max ms | Errors |
|---|---:|---:|---:|---:|---:|---:|
| claim | 1 | 40 | 176.80 | 193.65 | 218.17 | 0 |
| claim | 10 | 40 | 198.83 | 292.51 | 333.63 | 0 |
| claim | 20 | 40 | 297.24 | 470.34 | 523.37 | 0 |
| move | 1 | 40 | 117.17 | 129.09 | 131.18 | 0 |
| move | 10 | 40 | 160.88 | 196.09 | 211.35 | 0 |
| move | 20 | 40 | 238.17 | 343.73 | 351.70 | 0 |
| settle | 1 | 40 | 150.37 | 169.75 | 177.59 | 0 |
| settle | 10 | 40 | 204.74 | 275.01 | 286.01 | 0 |
| settle | 20 | 40 | 318.74 | 451.29 | 480.22 | 0 |

All 360 measured mutations and 120 settle-preparation claims succeeded. Peak direct children matched 1/10/20. This is a post-readClaims-fix ext4 baseline comparable in operation/concurrency/sample definition with V-SPAWN-01, not a controlled attribution of the improvement from its pre-fix tmpfs numbers. All 20-session p95s still exceed 50 ms, and these whole-CLI timings do not test the future native append budget.

Reproduce from the checkout, with a fresh root under an existing ext4 parent:

```sh
node scripts/event-store/v-spawn-bench.mjs \
  --root scripts/event-store/bench-fixture \
  --out scripts/event-store/baseline-ext4.json \
  --host-bin /home/vantt/.local/state/fgos/releases/sha256:f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374/bin/fgos
```

Evidence: `cargo test --locked -p fgos-event-store -p fgos-canonical-json -- --test-threads=1` passed 15 tests; `node --test test/event-store/` passed 5. Package formatting, `git diff --check`, and `cargo clippy -p fgos-event-store --all-targets --no-deps -- -D warnings` passed. All Cargo calls used private `CARGO_TARGET_DIR=$PWD/.fgos/runtime/phase-target` and `CARGO_HOME` beneath it. The exact required dependency-wide clippy command was run and fails on the pre-existing `unnecessary_map_or` at `packages/process/rust/src/platform/windows_job.rs:147`; that file is outside scope and was not edited. No lint suppression or behavior bypass was added. Full `npm test` and phase-wide review were not run in this scoped checkpoint.

Preview: `mdview open` was attempted but refused by its read-only SQLite database; the Markdown file remains directly readable.

Remaining: coordinator owns step 7 review/merge and the program-board ES row update (outside scope). Follow the unit 1 report for the run-supervisor extraction and distribution digest migration deferrals; neither consumer was changed. Report naming was queried through `fgos convention path`; the brief's exact 11:53 path takes precedence over its current-minute result. No lifecycle verbs, git add/commit, or activation changes were used.

Status: DONE_WITH_CONCERNS
Summary: Registry, identities/layout and the reproducible ext4 baseline are complete as a dormant checkpoint. Tests pass; exact clippy green needs the existing out-of-scope process lint fixed.
Concerns/Blockers: Dependency-wide clippy; Unix-only native identity driver; caller must supply the append lock and verified Git/filesystem context at integration. Program-board update remains with the coordinator.
Context refs:
- Phase 01 plan; unit 1 report; Event Store spec §§5–8, 17, 23; approved plan D9/D19.
