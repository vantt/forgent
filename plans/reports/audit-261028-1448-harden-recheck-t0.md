# HARDEN re-check, layer T0 (process facts and control, containment, leaf crates, addon loader)

Pinned tree: `/home/vantt/projects/forgent-worktrees/harden-recheck` at `b4817283f`. Read-only audit by code-reviewer, 2026-10-28. Baseline: arbitration `council-261021-1507` §2 to §4, closing report `closing-261021-2213`, T0 merge `7d1f1c1b2`.

**Verdict: DRIFT (7 small, 1 large). No High.** The approved shape holds. Nothing in `src` or `bin` reads `/proc`, calls `process.kill` by bare pid or judges liveness outside the door, and `git-one-door-scan` reports 0 undeclared sites. The drift sits at the edges: one canonical-JSON twin added after the layer closed, a dead loader route the door itself added, script-side bare-pid kills, hand-written `/proc` parsers in `run-supervisor`, and gaps in the R14 keep rule.

## Verified: still matches the approved shape

- `src/runner/dispatch/process-identity.mjs` is 29 lines with the 7 exports `judge`, `observe`, `selfRecord`, `signalByIdentity`, `selfChain`, `scan` and `resolveHolderLiveness`. It has no `/proc` read, no cache and no JS fallback. The approved budget was 6 exports. `selfChain` was added for `lock-fence` and is a pass-through, so I do not count it as drift.
- `src/native/door.mjs` is the one loader. `src/git/native.mjs` is a 14-line wrapper over it. Both files are classed `kernel` or `infra` in `architecture-manifest.json`, and the door imports only the `kernel` files `payload-root.mjs` and `host-bin-path.mjs`. There is no second `.node` load, `dlopen` or `require` of an addon outside the door.
- `rg "process\.kill\(" src bin` returns only the three allowlisted own-child group kills (`test/process/one-door.test.mjs:15-19`). `rg "/proc/" src bin` returns only `run-supervisor-checks.mjs:35`, `harness.mjs:337,512` and `bwrap.mjs:669`, which are all allowlisted at `one-door.test.mjs:20-24`.
- No file under `src`, `bin` or `scripts` exports `isProcessAlive`, `pidExists` or `getBootId`. The `fgos internal process-observe` route and client, the nine `kill(pid,0)` judges, `coordination-abandoned-claims`, `facts::start_time` and `kcmp_same_file` are all gone.
- Every durable write the arbitration moved still goes through `replaceDurably` or `installOnce` (18 call sites). The no-fsync, mode-preserving and copy-then-rename classes stayed per the approved shape.
- The `containment.port.v1.json` contract changed once after T0, additively (`de99674f6`, 10-22). `LinuxPgroup` does not set a subreaper on its caller. The 10-24 `posix_spawn` change (`3894ff956`) kept the gate handshake.
- Rust writes that sit outside `durable-file` are the four accepted no-fsync helpers plus `distribution` (Packaging). I found no new hand-written atomic writer.

## Findings

| id | sev | size | file:line | what drifted | introduced by | fix shape (RUL104) | owner |
|---|---|---|---|---|---|---|---|
| T0-D1 | Medium | small | `src/runner/execution/seat-policy.mjs:54-58` | A fifth Node canonical-JSON twin. It is a key-sort serialiser, and its digest (`seatConfigDigestOf`, used at `assignment-runner.mjs:445`) is persisted as the bound digest. The arbitration's rule is that a twin may be deleted only after a byte-equality run; this one came in after that run and carries no "not the door's" reason, unlike the three kept twins. | `3133ed474` 2026-10-21, SEAT | Replace the function with `canonicalJson` from `native/door.mjs`. For JSON-clean config the bytes are equal (JS default sort is UTF-16 order, and number text is the same), so run the byte-equality check over stored seat digests first. If it fails, add the "kept because" comment instead. | SEAT / execution core (T5) |
| T0-D2 | Medium | small | `src/native/door.mjs:40-44` | Dead `native-addon.json` route (`packageDescriptor`). Decision D2 said to produce this descriptor; the closing report then dropped the npm channel, but the route stayed. `package.json` `files` does not ship the file. Only tests write it: `test/git/native-load.test.mjs:221,227`, `test/setup/checks-setup-rc-line.test.mjs:71`, `test/event-store/store-hardening.test.mjs:79,146`. This is an old path alongside the new one (L10) and gives the npm channel a loadable path that is not a supported channel. | `8339c7259` 2026-10-21, T0 | Delete the `native-addon.json` read and `packageDescriptor`. Move those test fixtures to the `descriptor` argument. The npm channel then refuses by name, as owner OQ-2 decided. | T0 (HARDEN) |
| T0-D3 | Low | small | `src/workflow/case-runtime.mjs:150` | Temp name `${file}.${process.pid}.tmp`. Arbitration Part A requires every Node temp name from `uniqueTmpTag` (it names the pid-less names in `attestation-store`). Two writes to the same file from one process collide. Same class at `src/verbs/dispatch/recover.mjs:200`, which uses pid plus `Date.now()` in base 36. | `5b2b91044` 2026-10-19, WORK (before T0; missed by T0) | Use `uniqueTmpTag()` at both sites. | WORK; `recover.mjs` is the dispatch verbs owner |
| T0-D4 | Low | small | `scripts/run-tests.mjs:272,509`; `scripts/lib/mailbox-live-confined.mjs:361-378,426-434` | Two kill-by-bare-pid sites in test tooling. `run-tests.mjs` scans `/proc/*/cmdline` and then `process.kill(pid,'SIGKILL')`, which is the F-A3 shape (scan, then kill by pid). `killIfSame` hand-rolls a start-time compare and then kills, with a gap between the compare and the kill. `one-door.test.mjs:57` scans only `src` and `bin`, so neither is seen. `test-file-watchdog.mjs:88` still has a private `kill(pid,0)` judge, which predates T0 (`8cc25ff77`, 10-04). | `32d3ad95b` 2026-10-23 (TEST); `ff89b6d8a` 2026-10-23 (mailbox) | These scripts already import from `src` (`run-rust-dev-host.mjs:9`). Use `scan` and `signalByIdentity` from `process-identity.mjs`. Add no new scan root. | TEST; mailbox |
| T0-D5 | Low | small | `packages/run-supervisor/rust/src/gate/unix.rs:640-650`; `packages/run-supervisor/rust/src/supervise/terminal.rs:268-272` | Two hand-written `/proc/<pid>/stat` parsers remain beside `facts::parse_relation`. The T0 close says "one parser", and that holds inside `fgos-process`, `holder-lock` and `git`. The parent chain walk in both files is a job `facts::relation_of` already does (`holder-lock/origin.rs:99` uses it). `git/node-addon/src/single_load.rs:24` also keeps its own start-time read; `phase-04:22` allowed that conditionally, so I report it only as a pointer. | `fd7489551` and `ad4d68ce1`, 2026-10-18, run-supervisor (before T0; T4 sites, never listed in the T0 inventory) | Call `facts::relation_of` in both places. This deletes about 15 lines. Hand to T4. | run-supervisor (T4) |
| T0-D6 | Low | small | `scripts/run-rust-dev-host.mjs:53-56`, `:60-70`; `src/runner/dispatch/stop-processes-inside.mjs:35-47` | R14 keep rule (see the R14 section below): fail-open on `unsupported` and `unreadable`, and one full `/proc` scan with environment reads per stale directory. | `d4a2a0d18` 2026-10-26, HARDEN | See below. | HARDEN |
| T0-D7 | Low | small | `test/runner/run-lock-identity.test.mjs:4-6`; `test/runner/dispatch-runtime-inspect.test.mjs:79-80` | Comments that describe a mechanism that is gone. The first claims to exercise "resolveHolderLiveness's full decision table"; the real table is now in `test/process/process-facts-vectors.test.mjs`. The second cites `isProcessAlive`'s `process.kill(pid, 0)`. | T0 `205f8a584`, `934acb77f` | Reword to name the real owner (the test or Rust file that owns the verdict table). Delete the `isProcessAlive` sentence. | HARDEN |
| T0-D8 | Low | large | `packages/durable-file/rust/src/beneath.rs` (297 lines), `packages/durable-file/rust/tests/beneath.rs` | The approved shape was "unchanged entries" (arbitration §2). The crate gained an open-beneath-a-root entry and 297 lines (crate src was about 640 lines at T0 and is now about 744 in `lib.rs` and `beneath.rs` together). That is a read or open door, not a durable write, and it serves the Git WAL. This is a contract change that no owner approval in my sources covers. | `8debed9c6` 2026-10-23, Git/terminal-control, with `e28fdee24` | No code fix inside RUL104. The owner should say whether the crate's role is now "durable and safe file access", or whether `beneath` belongs in a Git-owned crate. See the questions. | Git (T2) |

### R14 (`d4a2a0d18`, `9991529c1`): dev-host run-dir keep rule

The Linux logic is correct and the proofs are real.
- `releaseRunDir` (`run-rust-dev-host.mjs:53-57`) keeps a directory while any process other than itself or its parent has `exe` or `cwd` inside it, or an `FGOS_HOST_BIN` inside it. It goes through the door's `scan({envKeys})`, so there is no new `/proc` reader and no new mechanism.
- The owning test `test/scripts/run-rust-dev-host-staging.test.mjs:30-56` covers "runs from it" and "names it as its host", and prunes after the holder ends.
- `9991529c1` changes the tests to wait for the real condition (`dev-host.test.mjs` `settledEntries`). I found no weakened assertion.

Residual issues, all dev-host only; a release is not affected:
1. **Fail-open on `unsupported` and `unreadable`.** `processesInside` returns `[]` when `scan` is `'unsupported'` (`stop-processes-inside.mjs:41`). The Rust scan is `Unsupported` on Windows and macOS (`platform/windows.rs:138`, `platform/macos.rs:77`). There the keep rule never fires, so the directory is deleted while a detached child still names it, which is the R14 symptom itself. On Linux, a view with `unreadable: true` (`node-addon/src/process.rs:155`) is not tested at `:44-47`, so a process whose environment cannot be read does not keep the directory. Fix: treat `unsupported` and `unreadable` as "keep" in `releaseRunDir` (return `false`), leaving `stopProcessesInside` as it is. The comment at `:15-16` already says confinement is Linux-only; the launcher is not. Size: about 10 lines.
2. **One scan per stale directory.** `pruneRunDirs` (`:60-70`) calls `releaseRunDir` for each directory older than 10 minutes, and each call is a full `/proc` walk that reads every process's environment. Cost grows with stale directories times processes. Fix: scan once and test each directory against the result. I did not measure it; this is by reading.
3. **Only `FGOS_HOST_BIN` is a key.** `devHostEnv` (`scripts/lib/dev-host-manifest.mjs:10-16`) also puts `FGOS_ACTIVE_MANIFEST_PATH` into the run directory. Today a child needs the host binary, so this is not a defect.
4. A hung child keeps its directory (a copy of the host and addon) until a later invocation prunes it. This matches the commit's stated design, so I record it, not as a defect.

## Status of the layer's open items

| Item | Status |
|---|---|
| Phase 7, SEAT carry list | Done: `10a065b38` (T1 phase 6) and `ae778a00e`. The `run-lock.mjs` re-exports are gone. Close-criterion grep over `src` and `scripts` returns only `door.mjs:102`, `process-identity.mjs:29`, `effective-execution-contract.mjs:40` (kept with its H11 comment) and `scripts/build-rust-distribution.mjs:39` (kept: the producer has no addon). `proof-helpers.mjs:12` is the one re-export line the budget allows. |
| 5b, manifest rewrite in `stageLauncherDoor` | Done: `68e268ce1`, with the owning test extended (`run-rust-dev-host-staging.test.mjs:80-107`). |
| T0-R1, canonical JSON cost through N-API (384 µs against 80 µs budget) | Still open. `canonicalJson` still does `JSON.stringify`, then the addon (`door.mjs:102-107`). Not re-measured. No caller is hot. |
| T0-R2, `mode` argument gives a raw `NumberExpected` | Done: `door.mjs:112-115` throws `durable-file-mode-invalid`. |
| Canonical twins "after the corpus proof" | Two moved. Three remain by recorded decision (`effective-execution-contract.mjs:39`, `recovery-planner.mjs:69`, `build-rust-distribution.mjs:36`), each with a "not the door's" reason; `trust-store.mjs:379` stays by design. A fifth, undocumented twin appeared (T0-D1). |
| Owner net-growth decision (c), trim in T1's Part B | Not checkable from code. |
| Backlog `p-3c7681b8`, tests leaking coordination sessions | Outside code; not checked. |

## Unverified

- Whether the Windows dev host fails in `rmSync` (`EBUSY`) when a detached child holds a loaded addon in a run directory, because `releaseRunDir` finds nothing to keep there (R14 item 1). It would throw out of `finally` in `main()` and `pruneRunDirs`. Confirm with one `npm run fgos:dev` on Windows that leaves an `events sync` child running.
- Whether the three `{host, bootId, pidNs}` cases in `direct-launch.mjs:132-138` still give the string `'unknown-boot'` where Rust requires a string on Windows. Confirm with the Rust reader's test on win32. I only read the Node side.
- The size claim in T0-D8 (crate was about 640 lines at T0) comes from the phase-01 text and the current `wc -l`; I did not diff the crate at `7d1f1c1b2`.

## Ideas to add (owner decides)

- **Extend `test/process/one-door.test.mjs` to also scan `scripts/`.** Problem: T0-D4 shows two new bare-pid kill sites and a private `kill(pid,0)` judge in `scripts` that the guard cannot see, because `one-door.test.mjs:57` scans `src` and `bin` only. Benefit: the next such site is caught at commit time. Cost: one allowlist entry per remaining legitimate site, so I leave it to the owner.

## Unresolved questions

1. T0-D8: is a `beneath` (open without following symlinks) entry in `durable-file` the intended shape, or should it move to the Git crate? The arbitration said "unchanged entries".
2. T0-D1: is the seat-policy digest compared across machines or releases? If stored digests are, the byte-equality run is mandatory before the swap.
3. Should the `selfChain` export (7th, approved budget 6) be recorded as an approved addition, or folded into `scan`?
