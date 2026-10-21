# HARDEN T0 baseline: Process Facts & Control, host-runtime, canonical-json, durable-file

Phase 00, step 1 of the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md), measured by session `forgent-a8` on 2026-10-21 between 12:10 and 12:35 (Asia/Saigon). This is the "before" side of the T0 before/after table. Each later layer measures its own baseline when its council opens.

## Where and how

| Item | Value |
|---|---|
| Machine | second machine (`fg-server2`), 24 CPUs, Linux 7.0, Node v24.22.0, ext4 on NVMe (`/dev/nvme0n1p2`). `/tmp` is tmpfs, so fsync costs nothing there; every atomic-write number below was measured on ext4 |
| Code | `main` at `d65407bc7`, clean linked worktree `~/projects/forgent-worktrees/harden-p00`, host built from that tree (release profile, separate `CARGO_TARGET_DIR`) |
| Host for route timings | active release `sha256:ffe66288…` on this machine (built from main `6d4c48a47`, activated 2026-10-21 12:21) |
| Load | 1-minute load 8.1 before, 8.2 after the latency run. Another session's test lead was running the suite at the same time. The numbers are therefore an upper bound for a quiet machine; the re-measure must use the same load class |
| Tools | throwaway probes in the session scratchpad (`t0-bench.mjs` for Node and spawn routes, a small Rust binary linking `fgos-durable-file` and `fgos-canonical-json`), not committed. Raw output: `/tmp/fgos-work/harden-p00/t0-bench-ext4.txt` |

**Method.** Warm means 300 calls in one process after 5 warm-up calls. Cold means the first call in a fresh process, 30 processes, with module load excluded. Routes are timed as whole `spawnSync` calls, 30 runs each. Units are absolute (µs, or ms for spawns).

## 1. Latency per T0 call class

| Call class | How it is reached today | Warm p50 | Warm p95 | Cold p50 | Cold p95 |
|---|---|---:|---:|---:|---:|
| Liveness judge, live record | Node leaf `judge()` (`src/runner/dispatch/process-identity.mjs:126`) | 4.1 µs | 7.3 µs | 87 µs | 97 µs |
| Liveness judge, dead record | same | 3.8 µs | 6.5 µs | 89 µs | 99 µs |
| `resolveHolderLiveness` | Node leaf (`:154`) | 7.7 µs | 10.1 µs | 189 µs | 307 µs |
| `pidExists` | Node leaf (`:69`) | 0.4 µs | 0.4 µs | 44 µs | 57 µs |
| `fgos internal process-observe` | host route, one spawn | 1.33 ms | 1.50 ms | (each call is a spawn) | |
| `fgos identity --pid` (reference only) | host route, one spawn | 1.30 ms | 1.46 ms | | |
| Atomic replace + fsync | Node `writeFileAtomic` (`provider-credential-renewal.mjs:105`) | 5.47 ms | 10.97 ms | 5.50 ms | 6.02 ms |
| Atomic replace, no fsync | copy of `run.mjs:51` `writeJsonAtomic` | 20 µs | 25 µs | 235 µs | 354 µs |
| Atomic, mode-preserving | copy of `trust-store.mjs:77` `writeFileKeepingMode` | 22 µs | 71 µs | 186 µs | 214 µs |
| Create-only (hard link) | run-lock pattern (`run-lock.mjs:227`) | 40 µs | 47 µs | 101 µs | 159 µs |
| Atomic replace, durable | Rust `fgos_durable_file::replace_durably` | 14.45 ms | 15.74 ms | 10.33 ms | 11.02 ms |
| Create-only, durable | Rust `fgos_durable_file::install_once` | 10.38 ms | 11.01 ms | 10.41 ms | 11.68 ms |
| Canonical JSON, small object | Node `effective-execution-contract.mjs:39` | 2.0 µs | 2.7 µs | 49 µs | 70 µs |
| | Node `proof-helpers.mjs:11` | 2.3 µs | 3.1 µs | 60 µs | 68 µs |
| | Rust `fgos_canonical_json::canonical_json` | 0.8 µs | 0.8 µs | 2.5 µs | 3.1 µs |
| Canonical JSON, 200 keys | Node `effective-execution-contract.mjs:39` | 171 µs | 225 µs | 431 µs | 443 µs |
| | Node `proof-helpers.mjs:11` | 181 µs | 263 µs | 500 µs | 540 µs |
| | Rust crate | 49 µs | 52 µs | 103 µs | 106 µs |

What these numbers mean for the T0 council (facts, not decisions):

- **A route spawn costs about 300 times a Node leaf judge** (1.33 ms against 4.1 µs). It is about 3 000 times on the "unknown" path, where callers ask again. That confirms red-team finding 1: option (a) of phase 01 Q1 cannot serve the hot-lock waiter loop. The absolute budget for an in-process door (option b) should be stated against the 4 µs warm and 90 µs cold of today's leaf.
- **`durable-file` costs 10–15 ms per write on this disk**, because it fsyncs the file and the directory. Node's durable copy fsyncs the file only (5.5 ms), and the no-fsync classes cost 20–40 µs. Moving a no-fsync or create-only site onto `durable-file` multiplies its cost by 250 to 500. This is the main input for phase 01 Q2: per class, decide whether the crate's durability is wanted. Moving a class without that decision makes the system slower, which would fail gate 5.
- **The Rust canonical JSON is 3–4 times faster** than both Node twins, so speed is no argument against moving them. The open question stays byte equality (phase 01 §C).

## 2. Size (LOC)

Counted with `wc -l` on `d65407bc7`.

| Component | Rust src | Rust tests dir | `#[test]` / `#[tokio::test]` | Contracts |
|---|---:|---:|---:|---:|
| `packages/process` | 5 334 | 2 279 | 105 | 329 |
| `packages/host-runtime` | 6 302 | 2 261 | 90 | 943 |
| `packages/canonical-json` | 87 | 0 | 1 | 112 |
| `packages/durable-file` | 333 | 297 | 10 | 0 |

The plan's phase 01 counts 65 tests for host-runtime. The 90 here includes `#[tokio::test]` and inline tests. The plan's figure needs the same correction when the T0 table is written.

Node in the phase 01 inventory: `process-identity.mjs` 158 lines and `unique-tmp-tag.mjs` 13 lines. The 14 liveness sites, 33 rename sites and 7 canonical twins are listed in phase 01 §A–§C. Their line counts belong to the T0 sub-plan's net-size table, not to this baseline.

## 3. Tests

| Suite | Count | Wall time |
|---|---:|---:|
| `cargo test -p fgos-process -p fgos-durable-file -p fgos-canonical-json -p fgos-host-runtime` (built, run only) | 179 passed, 0 failed, 0 ignored | 30.1 s |
| `test/process/process-facts-vectors.test.mjs` | 157 lines | 0.1 s |
| `test/runner/process-identity.test.mjs` | 80 lines | 0.1 s |
| `test/runner/run-lock-identity.test.mjs` | 110 lines | 0.1 s |
| `test/util/unique-tmp-tag.test.mjs` | | 0.1 s |
| `test/event-store/canonical-vectors.test.mjs` | 34 lines | < 0.1 s |
| `test/rust-host/internal-routes.test.mjs` | 28 host spawns | 0.4 s |
| `test/rust-host/help-routes.test.mjs` | 28 dev-door spawns | **119.3 s** in the suite |

Of the 206 `#[test]` attributes in the four crates, 179 ran on Linux. The rest are platform-gated.

`help-routes` is the only expensive T0 test file. All its time goes into 28 calls of `scripts/run-rust-dev-host.mjs`, about 4.2 s each, because the dev door stages a host and a payload for every call. The behaviour it proves (help routing in the host) does not need that door for each case. This is a test-cost finding for T0 Part B. The [test investigation](research-261021-1210-harden-test-suite-investigation.md) covers it as an instance of cause 2.

The test files that touch T0 as the lowest layer they import (13 files, 148 `test()` calls, 188 s summed wall in the suite run) are listed in the investigation report §7.

## 4. Doctor rows and setup steps

From `fgos doctor --json` on this workspace, active release `ffe66288…`. The whole doctor run took **40.7 s** for 145 rows. The report has no per-row duration, so the T0 rows cannot be timed separately yet.

| Row | Registered | Result here |
|---|---|---|
| `process-containment` | `src/setup/registrations.mjs:2340` | pass: `bwrap-pidns`, level kernel |
| `rust-host-binary-present` | `:5258` | pass |
| `rust-host-target-supported` | `:5264` | pass |
| `legacy-node-payload-present` | `:5270` | pass |
| `active-release-matches-checkout` | `:5276` | **fail**: the checkout has 2 Node payload files newer than the release (main moved after activation; expected between landings) |
| `command-routes-drift` | `:5282` | pass |
| `confinement-backend-registry-readable` (judges liveness inline, §A #9) | `:5422` | pass |
| `coordination-abandoned-claims` (dead branch, §A #10) | `:6074` | pass, with **no message field at all** in the JSON (one of only two rows without one). This fits the phase 01 finding that nothing writes `claim.json` |

`registerCheck(` appears 140 times in `registrations.mjs`. T0 has no `registerConfigDefault` or `registerFix` step (re-checked with `rg`).

Doctor's 40.7 s is a cost every user pays. It also explains part of the slow `fgctl init` tests (§5 of the investigation report). Measuring it per row needs instrumentation, which belongs to the packaging review in phase 07, or to each layer's gate-8 table for its own rows.

## 5. Open backlog touching T0

From `docs/backlog.md`, status `proposed`:
- `p-e6425aa9` (c): `providerCapacityIsRunWorkerAlive` has the same herdr-spawn blind spot in lease reclaim that M1 had. This is a liveness judge at T5 that should end on the T0 door.
- `p-3c7681b8`: tests leaked coordination session fixtures into the live `.fgos/coordination/sessions/`. The coordination engine is retired, so this row may close together with the deletion of §A #10.

No open row names `process-identity`, `durable-file` or `canonical-json` directly.

## 6. What changed since the plan was written

- Main moved from `f453cd941` (the plan's inventory) to `d65407bc7`. The phase 01 line numbers still need to be re-checked when the council opens.
- On this machine the active release now carries the two Git durability fixes (`a8a306a35`, `5d5a0de33`).
- The committed `packages/git/contracts/mutation-census.v1.json` was stale on `d65407bc7`, so every suite run rewrote it and left the checkout dirty. The GIT lane regenerated it in `534f0fd7a`. This matters to T0, because `process-identity.mjs` is hashed in that file (phase 01 note at `:725`).
- The WORK lane opened on 2026-10-21 ([plan refresh](plan-refresh-261021-1215-work-lane-es-09-11.md)). WORK edits `src/state/hot-lock.mjs:290-394` (staging), while T0 touches only `:57-99` (liveness). The two regions do not overlap, and whichever lane merges later rebases. `src/state/events.mjs` and `src/state/legacy-event-git-adapter.mjs` leave the T3 inventory until WORK lands.

## Unresolved questions

1. No per-row timing exists for doctor, so the T0 rows' share of the 40.7 s is unknown. Should the gate-8 table add row timing, or should doctor print it (a new feature, so owner's choice)?
2. The latency numbers were taken at load about 8 on a shared machine. If the owner wants a quiet-machine number for the before/after table, the re-measure needs a window when no other lane runs tests.
