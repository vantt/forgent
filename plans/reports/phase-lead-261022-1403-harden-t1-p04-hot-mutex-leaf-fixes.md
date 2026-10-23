# HARDEN T1 phase 4 — hot-mutex fixes, state-root copies, leaf fixes, size debt (phase lead report)

Branch `harden/t1-p04-hot-mutex-leaf-fixes`. **Verified after the build window (see "Verification results" at the end); the first commit was untested** (only `node --check` on every changed `.mjs` and `rustfmt --check` parse of every changed `.rs`, which found no syntax error). Verification, the corpus rerun, the regenerated census and baseline, and the measured costs below are pending.

## What changed

| Item | Where | Note |
|---|---|---|
| S-F1 | `src/state/hot-lock.mjs` `acquireRecord`/`timeoutError` | last verdict kept; `ok` record judged `unknown` times out as `lock-record-unreadable` with the fence sentence; a live holder keeps "retry the operation" |
| dead argument | `hot-lock.mjs` `withStateTx` | `recordOfSelf(writer)` |
| HL-N8/N9 | `reclaimDeadHolder` | one read under the reclaim lock, one bytes compare (`again.raw === observed.raw`) plus the judge, then a direct `unlinkSync` (ENOENT/EPERM/EBUSY -> `changed`); `unlinkRecordIfUnchanged` keeps its compare for `clearHotRecord` (P-N8) |
| T1-CF-01 | `readHotRecord` returns `{state:'retry', code}` for EPERM/EBUSY; `acquireRecord` waits on it, never reclaims; timeout names the sharing violation and `fgos lock fence <resource>`; `lock-fence.mjs` refuses a `retry` record with `lock-fence-unlistable` ("open by another process"); `lock-record-checks.mjs` warns with the same sentence | `unlinkRecordIfUnchanged`/reclaim treat `retry` as `changed`/`false` |
| T1-CF-02 | `releaseRecord(paths, resource)` throws `hot-lock-release-stuck` after 5 retries; contract gains the error; two Windows cases added in `test/holder-lock/windows-hot-lock.test.mjs` (skip off win32) |
| contract | `packages/holder-lock/contracts/hot-lock.v1.json` | `cleanup.allOf[2]` reworded, `hot-lock-release-stuck` added, timeout meaning widened; `hot-lock-contract.test.mjs` loses the `/bytes equal/` line and lists the new error |
| state-root copy | `attestation-store.mjs` | `path.join(resolveStateRoot().stateRoot, 'attestations')`, `os` import removed |
| `.fgos` copies | `runtime-inspection.mjs`, `friction-client.mjs` (the `\|\| path.join` fallback removed), `main-fgos-checkpoint.mjs`, `run-supervisor-checks.mjs` | now `fgosDirFromRoot`. `session.mjs:64` was already on `fgosDirFromRoot` (nothing to change). `fgos-file-registry.mjs` left alone as the phase says |
| T0-R1 | `canonical_json.rs` takes `String` (`serde_json::from_str`, error `InvalidArg` "canonical-json-not-json"); `door.mjs` `canonicalJson` = `JSON.stringify(value, validating)`; `native-load.test.mjs` +1 assertion (a `Date`) | CHANGELOG line added |
| T0-R2 | `door.mjs` `durable()` validates the mode before the call, `installed: 'none'` |
| R3 | `containment/linux.rs`: `refusal_line` re-runs the same bwrap prefix with `-- /bin/true`, stderr piped (4 KiB, 2 s), only after `read_child_pid` reported the early exit; error is `bwrap ended without reporting a gate pid: <first line>`; empty re-run keeps today's sentence. No new cause name (OPC owns `containment-mount-refused`) |
| RT-M6 | `flock.rs`: Linux `group_members` and its call deleted; `end_process_group` and the macOS `group_members` are now non-Linux only, `end_leftovers` split by `cfg` blocks instead of `cfg!` (needed so Linux still compiles) |
| RT-M9 | `civil_time.rs` gains `parse_rfc3339_offset_seconds` and `format_offset` (the millis parser and the offset share one private `parse_rfc3339`); `operations.rs` `parse_offset`/`format_offset` deleted; `docs/platform/convention/spec.md` Time rule corrected |
| RT-M10 | `borrow_windows.rs`: tail of `run` moved into a pure `settle(waited, emptied, remove_record)`; `LeftoverNotKilled` wins over a failed wait. **Deviation:** the owning proof is an in-module unit test of `settle` (a child leaving a leftover with a failing wait cannot be produced deterministically from `windows_lockfileex.rs`); it runs on the Windows workflow like the file the phase named |

## Canonical-JSON call-site grep (T0-R1)

`rg "canonicalJson\(" src bin scripts`: the door's `canonicalJson` is imported only by `reconciliation-planner.mjs` and `proof-helpers.mjs` (re-exported to `assignment-runner.mjs`, `confinement/authority.mjs`, `attestation-store.mjs`). Their inputs are JSON documents and ISO strings (`now`, `expiresAt` are strings; `new Date(...)` appears only before `.toISOString()`); no `Date`, `Buffer` or `toJSON` input found. The other hits the phase lists (`seat-policy.mjs`, `effective-execution-contract.mjs`) and `trust-store.mjs` define their own local `canonicalJson` and never touch the door, so the semantics change cannot reach them.

## Retired tests and their owners

| Retired | Owner now |
|---|---|
| `gateway-control.test.mjs` pid-only stop refuses, status identity unknown, start refuses (3 cases) | one merged case ("a registry entry with no verifiable identity ... is never signalled") plus the judge vectors |
| `gateway-control.test.mjs` zombie is dead at once | dead-pid entry case and the `t1.zombie` vectors of `judge_vectors.rs` |
| `stop-processes-inside.test.mjs` reused pid -> identity-mismatch | `packages/process/rust/tests/signal_identity.rs`, `test/process/process-facts-vectors.test.mjs`; the identities case in the file stays |
| `run-lock-identity.test.mjs` genuinely dead holder reclaimed (and its `deadPid` helper) | the reused-pid case (same `'dead'` branch); the live-holder and reused-pid cases stay |
| `hot-lock-multiprocess.test.mjs` zombie holder cleaned | the cleanup-under-reclaim-lock case plus the `t1.zombie` vectors |
| `hot-lock-multiprocess.test.mjs` `judgeHotRecord` four verdicts | `judge_vectors.rs` and `process-facts-vectors.test.mjs` (`judgeHotRecord` is `judge`) |
| `test/state/hot-lock-known-exec-sites.test.mjs` (file) | `test/state/hot-lock-guard.test.mjs` owns the live guard; `docs/platform/git/spec.md` loses the citation |
| `hot-lock-contract.test.mjs` `/bytes equal/` | P-N8 and P-N9 |

## Δ-lines (`git diff HEAD --numstat` before this report)

| Area | + | - | net |
|---|---|---|---|
| Node src (hot-lock, lock-fence, lock-record-checks, door, copies, attestation-store) | 75 | 45 | +30 |
| Rust (flock, operations, civil_time, linux, borrow_windows, canonical_json) | 111 | 84 | +27 |
| Tests | 80 | 344 | -264 |
| Contract, specs, CHANGELOG | 10 | 5 | +5 |

The phase estimated Node -4 / Rust -25 / tests -320. Node and Rust run over because S-F1 (a separate `timeoutError`), the `cfg` split in `flock.rs`, the `settle` function with its test, and the `refusal_line` thread/timeout are larger than estimated; tests land at -264 against -320 (the Windows borrow case is an in-module test, and the two Windows hot-lock cases are 68 lines with the PowerShell holder). To be re-measured after the build.

## Test-cost line

Added 3 cases (two Windows hot-lock, one Windows `settle` unit test), merged 3 gateway cases into 1, retired 8 cases + 1 file (1 case `/bytes equal/` line, `hot-lock-known-exec-sites` whole). Host spawns removed: the `git archive` + tar + 3 old-lock processes of `hot-lock-known-exec-sites` (120 s budget), the python zombie fixture, a gateway zombie child. New spawns on Linux: none. Run times before/after: pending the build window.

## Verification results (after "resume builds")

- `cargo test -p fgos-holder-lock -p fgos-process -p fgos-convention -p fgos-host-runtime -p fgos-node-addon --no-fail-fast`: green (`containment_bwrap` 11 passed, including `a_refused_mount_is_named_in_the_containment_error`). `cargo test --workspace --no-fail-fast`: exit 0, 218 `test result: ok`, no FAILED. `cargo clippy --workspace --all-targets -- -D warnings`: clean. Cargo target `/home/vantt/projects/forgent-worktrees/harden-t1-p04-target`. The Windows-only code (`borrow_windows.rs` `settle` and its test, the two Windows hot-lock cases) and the macOS `cfg` branch of `flock.rs` were not compiled or run on this Linux machine.
- Node one-file runs (env from `ensureGitAddon`, `env -u CLAUDE_CODE_SESSION_ID`): `native-load` (T0-R2 and T0-R1 guard plus the new `Date` assertion), `hot-lock-tx` (P-N8, P-N9), `hot-lock-contract`, `hot-lock-guard`, `dispatch-r9-performance-cache` (RT-M5): 35 pass, 0 fail (36 tests, 1 skipped). `hot-lock-multiprocess` (S-F1), `gateway-control`, `stop-processes-inside`, `run-lock-identity`, `process-facts-vectors`: 29 pass, 0 fail, 1 skipped. `architecture`, `fgos-lock-fence`, `lock-record-checks`, `friction-client`, `session`, `windows-hot-lock` (skipped off win32): 65 pass, 0 fail, 5 skipped. Also `test-proof-inventory` 32/32 and `one-door` + `e3-census` 9/9. One failure on the first run was mine (the contract test listed the new error out of sort order); fixed in a second commit.
- Corpus byte-equality over `/home/vantt/projects/forgent/.fgos`: `{"files":14616,"docs":25291,"subtrees":4544622,"mismatches":0,"skipped":9,"bad":[]}` then `canonical-corpus: all equal`.
- Canonical JSON, 200-key flat object, p50: **45.5 µs** with the release addon (11.9 µs `JSON.stringify` with the replacer + 33.1 µs native), against T0's 384 µs and the seat's 81 µs. With the debug addon the staged test build uses, the same call is 287 µs (native 275 µs), so only the release number compares. A heavier 200-key object with nested members measures 948 µs on the debug addon.
- Regenerated on this branch only: `packages/git/contracts/mutation-census.v1.json` (0 undeclared sites) and `test/suite-baseline.json` (601 files / 8202 calls -> 600 / 8187, 59 known clones).
- Verification greps: no `XDG_STATE_HOME` or `.local/state` outside the state-root module; the `rfind(')')` hits are `facts.rs` and `proc_tree.rs` only. The `path.join(x, '.fgos')` grep still lists four lines in `session.mjs` (`:88, :119, :147, :320`): they join a repo or worktree onto the `.fgos` symlink name, not a derivation of the state directory; the phase's `session.mjs:64` target was already on `fgosDirFromRoot`.

## Notes for the big lead

- CHANGELOG lines were added at the top of `[Unreleased]`; phase 3 adds one too, so expect a trivial textual conflict.
- The `retry` fence refusal always refuses (it has no bytes to compare); once the other process is stopped, the next read gives `ok` or `unreadable` and the existing path applies.
- The R3 re-run reuses a caller-given `bwrap_prefix` verbatim; a prefix that names an inherited fd would make the re-run's line about that fd. Not seen in this repo's prefixes.
- Phase 5 still owns `holder-lock-checks.mjs:57` and `terminal-control-checks.mjs:22`; I did not touch them.
