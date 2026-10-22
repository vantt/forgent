---
phase: 04
title: "Hot-mutex fixes (S-F1, HL-N8/N9, Windows paths), the private state-root and .fgos copies, T0-R1, T0-R2, R3, the Lows, T0's size-debt test retirements"
status: pending
depends_on: [02]
parallel: "with phase 03 (disjoint files; both add one CHANGELOG line)"
effort: ~1.5d
net_size: "Node −5 / Rust −22 / tests −320 (estimate)"
---

# Phase 04 — Hot mutex, state-root copies, leaf fixes, size debt

## Context

[plan.md](plan.md) Facts ("The hot mutex", "State root", "Containment R3", "Leaf Lows"); arbitration §3 rows S-F1, HL-N8/N9 (speed S-6 shape; red-team D-1), T1-CF-01/02, RT-M5, RT-M11/R3, T0-R1 (red-team D-2), T0-R2 (red-team D-3), RT-M6, RT-M8 (done in phase 3 with `v1Path`), RT-M9, RT-M10, "T0 size debt" (simplicity's list with the red-team correction: `run-lock-identity` keeps `:35` and `:45`, retires `:60`); owner decision 3 (`hot-lock.mjs:227-332` is WORK's: untouched here); owner decision 11 (`hot-lock-multiprocess.test.mjs:249-298` is TEST's: untouched). Phase 1's red tests for S-F1, P-N8, P-N9, RT-M5, RT-M11, T0-R1 guard, T0-R2 turn green here.

## Requirements

### Hot mutex (`src/state/hot-lock.mjs:1-226`)

- **S-F1** (`:191-199`): keep the last verdict in the loop; when `seen.state === 'ok'` and `judgeHotRecord(seen.record) === 'unknown'`, the timeout carries `reason: 'lock-record-unreadable'` and the message's next step is the fence sentence (`confirm the holder is gone and run \`fgos lock fence <resource>\``), as for an unparsable record; a live holder keeps "retry the operation". Also delete the dead second argument at `:311` (`recordOfSelf(writer, fgosDir)` → `recordOfSelf(writer)`; one token in WORK's region, agreed by arbitration S-F3).
- **HL-N8/N9** (speed S-6): `reclaimDeadHolder` (`:126-138`) reads once under the reclaim lock, returns `'changed'` unless `again.state === 'ok' && again.raw === observed.raw && judgeHotRecord(again.record) === 'dead'`, then `fs.unlinkSync(record)` directly (ENOENT → `'changed'`); `unlinkRecordIfUnchanged` (`:110-120`) stays for `clearHotRecord` only. Owning proofs: phase 1's P-N9 and P-N8; `test/holder-lock/hot-lock-contract.test.mjs:37` (`/bytes equal/`) retires its line (the contract text at `packages/holder-lock/contracts/hot-lock.v1.json` `cleanup.allOf[2]` is reworded to "read again under the kernel lock; the bytes must equal what the judge saw and the judge must still answer dead").
  - Phase 1 finding (lead report `phase-lead-261022-1005-harden-t1-p01-red-tests.md`): P-N9 goes red only when **both** the bytes compare inside `reclaimDeadHolder` and the one in `unlinkRecordIfUnchanged` are removed. So the one-read shape must keep a bytes compare on the reclaim path (`again.raw === observed.raw`, above); dropping it in favour of the judge alone breaks P-N9.
- **T1-CF-01**: `readHotRecord` (`:89-106`) returns `{ state: 'retry', code }` for `EPERM`/`EBUSY` instead of `absent`; `acquireRecord` (`:178-203`) treats `retry` like a held record (sleeps `POLL_MS`, observes the deadline, is never eligible for reclaim) and the timeout it reaches says `the record is open by another process (sharing violation, EBUSY); stop that process, then run fgos lock fence <resource>`; `unlinkRecordIfUnchanged` and the reclaim treat `retry` as `changed`/`false`. **Visible, never a wedge** (red-team security F7, failure F10): `fenceHotRecord` (`src/runner/lock-fence.mjs:171-205`) names a `retry` record as "open by another process" and refuses with `lock-fence-unlistable` until the process is stopped (then `--attest-stopped` clears it as today), and the hot-record doctor line (phase 5 folds it into `lock-holders`; until then `src/setup/lock-record-checks.mjs:30-44`, which phase 4 teaches the `retry` state in one line) warns with the same sentence.
- **T1-CF-02**: `releaseRecord` (`:205-219`) throws `HotLockError('hot-lock-release-stuck', …, { resource, path })` after its retries instead of returning. It is called from `withStateTx`'s `finally` (`:321-325`, WORK's region, untouched beyond the three lines phase 6 removes), so by JavaScript's `finally` semantics this error replaces the callback's own error or committed result (red-team failure F4, security F8); the honest correction (capture the callback's error and attach it as `cause`, three lines in `withStateTx`) is handed to WORK as ledger row H23 (D-T1-12), and spec §15 records the limit: only a Windows writer whose unlink stayed sharing-blocked for 25 ms meets it, its retry then times out on its own still-present record (5 s) rather than applying twice, and `fgos lock fence <resource>` is the way out. The contract gains `hot-lock-release-stuck` (`category: precondition`, "the record could not be unlinked after the bounded Windows retries; the record stays and `fgos lock fence <resource>` is the way out"). Owning proofs: two cases in `test/holder-lock/windows-hot-lock.test.mjs` (`{ skip }` off Windows, run on the cross-platform workflow): a sharing-violated read waits to the timeout instead of spinning; an unlink that stays blocked throws the named error and leaves the record.

### State-root and `.fgos` copies (one door)

- `src/runner/dispatch/confinement/attestation-store.mjs:167` → `path.join(resolveStateRoot().stateRoot, 'attestations')` (import from `src/holder-lock/state-root.mjs`); the `os` import goes if unused (RT-M5; phase 1's test turns green).
- `fgosDirFromRoot` from `src/runner/paths.mjs:87` replaces: `src/runner/dispatch/runtime-inspection.mjs:19` (`fgosDir`), `src/observe/friction-client.mjs:30-34` (`resolveFgosDir`: keep the `.fgos`-suffix shortcut, call the door for the join), `src/runner/main-fgos-checkpoint.mjs:22`, `src/runner/session.mjs:64`, `src/setup/run-supervisor-checks.mjs:46` (five files, all `infra` in `docs/architecture-manifest.json`, so importing `paths.mjs` (infra) is allowed). **Not** `src/state/fgos-file-registry.mjs:69`: `normalizeFgosDir` is a disambiguator of a value in hand (its own comment, `:62-67`) and the file is `kernel` (`architecture-manifest.json:262`), which may not import an `infra` module (`test/architecture.test.mjs:142-165`; red-team scope F5); it stays. `src/setup/holder-lock-checks.mjs:57` (`fgosDirOf`, imported by `lock-record-checks.mjs:8`) and `src/setup/terminal-control-checks.mjs:22` are **phase 5's**.

### T0-R1 (canonical JSON, string in)

- `packages/git/node-addon/src/canonical_json.rs:7-11`: `canonical_json(text: String) -> Result<String>`: `serde_json::from_str::<Value>(&text)` (error → `InvalidArg` named `canonical-json-not-json`), then `fgos_canonical_json::canonical_json(&value)`.
- `src/native/door.mjs:73-76`: `canonicalJson(value)` serialises with a validating replacer that throws `canonical-json-not-json` for a hole, a non-finite number, a `bigint`, a function or an `undefined` array element while dropping `undefined` members as today, checks `text === undefined`, and passes the string (red-team D-2; measured 15 µs p50 for the 200-key object, total ≈ 48 µs against 81 µs today). **Semantics change, named (D-T1-11):** a `Date` or any object with `toJSON` now serialises to its `toJSON` text (today's object marshalling gives `{}` for a `Date`) and a `Buffer` is accepted as `{type:'Buffer', data:[…]}` (today refused); this is the contract the boundary row states (`component-boundary.md:83`, "as `JSON.stringify` does"). The lead greps every call site's inputs (`rg -n "canonicalJson\(" src bin scripts`: `src/runner/execution/seat-policy.mjs:64, :79, :99`, `src/runner/dispatch/effective-execution-contract.mjs:48, :58`, `src/runner/dispatch/reconciliation-planner.mjs:25, :62, :240, :304, :344`, `src/runner/dispatch/proof-helpers.mjs:15`) for a `Date`/`Buffer`/`toJSON` input and records the result; one CHANGELOG line names the change; `native-load.test.mjs:68-89` gains one assertion for a `Date` input.
- Corpus byte-equality rerun: the throwaway script of T0 phase 5 (`.fgos/runtime/tmp/canonical-corpus.mjs`, not committed) re-digests every stored proof and reconcile hash under `.fgos/assignments/**` and `.fgos/runs/**` on this machine through the string-in door and compares; the report pastes the summary line (expected equal; a stored document holds no `Date`, so the rerun cannot see the semantics change above, which is why the call-site grep exists). Owning proofs unchanged: `test/git/native-load.test.mjs:73-76` plus phase 1's vector loop; `packages/canonical-json/contracts/vectors/canonical.v1.json` by cargo.

### T0-R2 (durable mode)

- `src/native/door.mjs:81-89` `durable()`: before the call, `if (!Number.isInteger(mode) || mode < 0 || mode > 0o7777) throw Object.assign(new Error(\`durable-file-mode-invalid: mode must be an integer from 0 to 0o7777, got ${JSON.stringify(mode)}\`), { code: 'durable-file-mode-invalid', installed: 'none' })` (red-team D-3; Rust keeps `u32`). Owning proof: phase 1's cases in `native-load.test.mjs`.

### R3 / RT-M11 (containment)

- **Error name (OPC council, 2026-10-22 13:20):** `containment-mount-refused`, carried as the cause under the existing port error `namespace-unavailable` ("namespace-unavailable: containment-mount-refused: <bwrap stderr line>"); no silent per-operation fallback to `linux-pgroup`. Use this name; the contract adds it as a cause, not a new port error.

- `packages/process/rust/src/containment/linux.rs:127-143`: `spawn_in` changes nothing on the success path (bwrap's fd 2 is the gate's fd 2 for its whole life, so a pipe there would make the gate die with EPIPE or block at 64 KiB; red-team failure F1, security F2, assume F4). When `read_child_pid` ends with 0 bytes (`:428-430`), `end_failed_spawn` runs one **diagnostic re-run on the failure path only**: the same `bwrap` prefix with `--` `/bin/true`, stdin/stdout null, stderr captured (bounded, 4 KiB, 2 s), the pattern of `pidns_usable` (`:44-62`), and returns `NamespaceUnavailable(format!("bwrap ended without reporting a gate pid: {first non-empty stderr line}"))`; a re-run that prints nothing keeps today's sentence. A mount that cannot be remounted is persistent, so the re-run sees the same refusal (R3's evidence: every `--dev-bind / /` failed while the snapshot was mounted). ≈ 15 lines. The contract's `escapes`/driver text does not change; `packages/process/contracts/containment.port.v1.json` gains nothing. Owning proof: phase 1's `containment_bwrap.rs` case (the fixture `bwrap` prints the line on every invocation). The error reaches the Git driver (`packages/git/rust/src/driver.rs:1172-1195`) unchanged in shape.

### The Lows

- **RT-M6**: delete `#[cfg(not(target_os = "macos"))] fn group_members` (`flock.rs:613-628`) and the `domain.extend(group_members(...))` call at `:483` (the `/proc` loop at `:484-490` already covers the group through `in_borrow_domain`); the macOS `group_members` (`:592-611`) stays for `end_process_group`. Owning proofs unchanged: `packages/holder-lock/rust/tests/borrow_io.rs`, `borrow_git.rs`.
- **RT-M9**: `packages/host-runtime/rust/src/civil_time.rs` exposes `parse_rfc3339_offset_seconds(&str) -> Option<i32>` (the offset half of `parse_rfc3339_millis`, `:172-183`) and `format_offset(i32) -> Option<String>` (`:88-90, 103-106`); `packages/convention/rust/src/operations.rs:280-312` `parse_offset`/`format_offset` are deleted and `resolve_time` (`:251-278`) calls the host-runtime ones. Owning proofs unchanged: `packages/convention/rust/tests/golden.rs` (an explicit non-`+07:00` offset is in the golden set, spec `:247`). **S-F5a**: `docs/platform/convention/spec.md:168` is corrected to the code ("Unix obtains the local offset with `localtime_r` in the Convention provider; the RFC 3339 offset parsing and formatting are the shared host-runtime civil-time functions") — the smaller of the two options, since Observe and Distribution format local times through their own paths today and moving `local_offset_seconds` would be an addition (spec edit lands with this code, gate 7).
- **RT-M10**: `packages/holder-lock/rust/src/borrow_windows.rs:245-262`: match `emptied` before `waited?`: `Err(pids)` → `LeftoverNotKilled` (precedence per `holder-lock.port.v1.json:73`) whatever `waited` says; `Ok(killed)` → `remove_record`, then `waited?` → `Wait(err)` or the outcome. Owning proof: one case in `packages/holder-lock/rust/tests/windows_lockfileex.rs` (`{cfg(windows)}`, cross-platform workflow): a child that leaves a leftover and a failing wait reports `borrow-leftover-not-killed`.

### T0 size-debt retirements (simplicity's list, red-team correction applied)

| Retired | Owner now |
|---|---|
| `test/runner/gateway-control.test.mjs:257, :297, :418` (pid-only entry: stop refuses, status says identity unknown, start refuses) → one case asserting status, stop and start on the same fixture | the judge vectors (no `startTime` → unknown) and that one wiring case |
| `gateway-control.test.mjs:357` (a zombie is dead at once) | `:187` (dead-pid entry cleared) and the `t1.zombie` vectors of `judge_vectors.rs` |
| `test/runner/stop-processes-inside.test.mjs:48` (reused pid → identity-mismatch) | `packages/process/rust/tests/signal_identity.rs` and `test/process/process-facts-vectors.test.mjs:29` (the door's wiring); `:20` stays |
| `test/runner/run-lock-identity.test.mjs:60` (genuinely dead holder reclaimed) | `:45` (reused pid reclaimed exercises the same `'dead'` branch of `acquireRunControl`, `run-lock.mjs:276, :320`); `:35` and `:45` stay (red-team §4 item 9) |
| `test/state/hot-lock-multiprocess.test.mjs:173` (zombie holder cleaned; the python fixture) | `:119` (cleanup under the reclaim lock) plus the `t1.zombie` vectors |
| `test/state/hot-lock-multiprocess.test.mjs:301` (`judgeHotRecord` four verdicts) | `judge_vectors.rs` and `process-facts-vectors.test.mjs:13` (`judgeHotRecord` is `judge`, `hot-lock.mjs:55-57`) |
| `test/state/hot-lock-known-exec-sites.test.mjs` (174 lines, 120 s, `git archive` of `eab4d617b`) | `test/state/hot-lock-guard.test.mjs:25-60` owns the live guard; the sites it exercised belong to a deleted mechanism; `docs/platform/git/spec.md:610` cites the file and loses that citation in the same commit (GIT/DOC told) |
| `test/holder-lock/hot-lock-contract.test.mjs:37` | P-N8, P-N9 |

`hot-lock-multiprocess.test.mjs:249-298` is not touched (TEST, H21).

## Files

**Create**: none. **Modify**: `src/state/hot-lock.mjs`, `packages/holder-lock/contracts/hot-lock.v1.json`, `src/runner/lock-fence.mjs:171-205` (the `retry` sentence only; phase 2's edits to this file landed before), `src/setup/lock-record-checks.mjs` (one line; phase 5 deletes the file), `src/runner/dispatch/confinement/attestation-store.mjs`, `src/runner/dispatch/runtime-inspection.mjs`, `src/observe/friction-client.mjs`, `src/runner/main-fgos-checkpoint.mjs`, `src/runner/session.mjs`, `src/setup/run-supervisor-checks.mjs`, `src/native/door.mjs`, `docs/platform/git/spec.md:610`, `test/runner/dispatch-r9-performance-cache.test.mjs` (phase 1's RT-M5 case turns green), `packages/git/node-addon/src/canonical_json.rs`, `packages/process/rust/src/containment/linux.rs`, `packages/holder-lock/rust/src/driver/flock.rs`, `packages/holder-lock/rust/src/borrow_windows.rs`, `packages/host-runtime/rust/src/civil_time.rs`, `packages/convention/rust/src/operations.rs`, `docs/platform/convention/spec.md:168`, the tests named, `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json`, `CHANGELOG.md`. **Delete**: `test/state/hot-lock-known-exec-sites.test.mjs`; `flock.rs:613-628`; `operations.rs:280-312`. **Tests to retire**: the table above.

## Steps

1. Rust: RT-M6, RT-M9 (+ spec line), RT-M10 (+ Windows case), R3 (+ phase 1's case green), T0-R1 string-in; `cargo test -p fgos-holder-lock -p fgos-process -p fgos-convention -p fgos-host-runtime -p fgos-node-addon`; clippy.
2. `door.mjs` (replacer, mode check); `native-load.test.mjs` green; the corpus rerun; the measured `canonicalJson` p50.
3. `hot-lock.mjs` S-F1, HL-N8/N9, CF-01, CF-02, the dead argument; the contract; the Windows cases; phase 1's cases green.
4. The six `.fgos`/state-root copies.
5. The retirements with their owners; the baseline; the census; the CHANGELOG lines (durable-file mode error, containment error names the mount, hot mutex `unknown` holder reason).
6. Report: Δ table, test-cost line, the corpus summary line, `canonicalJson` and `withStateTx` p50 against the baseline.

## Verification (exact)

- `cargo test --workspace` green on Linux; `cargo clippy --workspace --all-targets -- -D warnings` clean.
- One-file runs: `test/state/hot-lock-tx.test.mjs test/state/hot-lock-multiprocess.test.mjs test/holder-lock/hot-lock-contract.test.mjs test/state/hot-lock-guard.test.mjs test/git/native-load.test.mjs test/runner/dispatch-r9-performance-cache.test.mjs test/architecture.test.mjs test/runner/gateway-control.test.mjs test/runner/stop-processes-inside.test.mjs test/runner/run-lock-identity.test.mjs test/process/process-facts-vectors.test.mjs test/cli/fgos-lock-fence.test.mjs test/setup/lock-record-checks.test.mjs test/observe/friction-client.test.mjs test/runner/session.test.mjs`.
- `rg -n "XDG_STATE_HOME|\.local', 'state'" src bin` → nothing outside `src/holder-lock/state-root.mjs`; `rg -n "path\.join\([a-zA-Z]+, '\.fgos'\)" src/runner/dispatch/runtime-inspection.mjs src/observe/friction-client.mjs src/runner/main-fgos-checkpoint.mjs src/runner/session.mjs src/setup/run-supervisor-checks.mjs` → nothing.
- `rg -n "rfind\(\x27\)\x27\)" packages/process/rust/src packages/holder-lock/rust/src packages/session-identity/rust/src packages/convention/rust/src` → `facts.rs` and `proc_tree.rs` only (the latter goes in phase 6).

## Net size

Node −4 (`hot-lock.mjs` +4, `lock-fence.mjs` +2, `lock-record-checks.mjs` +1, `door.mjs` +6, copies −12, `attestation-store.mjs` −5). Rust −25 (`flock.rs` −17, `operations.rs` −32, `civil_time.rs` +12, `linux.rs` +15, `borrow_windows.rs` ±0, `canonical_json.rs` +1 −4). Tests −320 (`gateway-control` −90, `stop-processes-inside` −25, `run-lock-identity` −13, `hot-lock-multiprocess` −45, `hot-lock-known-exec-sites` −174, `hot-lock-contract` −1, `windows-hot-lock` +30, `windows_lockfileex.rs` +20, `native-load` +2, phase 1's cases ±0, minus the exemption line already counted).

## Test-cost line

Added 3 (two Windows hot-lock, one Windows borrow), retired 8 cases + 1 file. Host spawns removed: `hot-lock-known-exec-sites` (one `git archive` + tar + 3 old-lock processes, 120 s budget), `hot-lock-multiprocess:173` (a python zombie fixture), `gateway-control:357` (a zombie child). New spawns: none on Linux. CLI-call cost before/after pasted.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The validating replacer changes `canonicalJson`'s accepted inputs | L × H | Phase 1's vector loop and `:73-76`; the corpus rerun over this machine's stored digests. |
| `retry` state changes a Linux path | L × M | `EPERM`/`EBUSY` are never returned by Linux `readFileSync` on a regular file; the Linux cases are unchanged and `hot-lock-multiprocess` proves them. |
| The diagnostic re-run disagrees with the failed spawn (the mount refusal was transient) | L × L | The error then keeps today's sentence plus "diagnostic run passed"; nothing is decided from the re-run, it only names the mount. |
| A `retry` record on Windows wedges every writer | L × H | Named in the timeout, the fence and the doctor line (T1-CF-01 above); `--attest-stopped` clears it once the process is gone. |
| RT-M9 changes a golden name | L × M | `golden.rs` runs every case; `format_offset` output is byte-identical. |

## Rollback

Revert the phase's commits. The hot-record and predecessor formats are unchanged; the `durable-file`/containment error texts return to today's.

## Done when

Phase 1's seven cases of this phase are green; the retirements name their owners; the corpus line is in the report; `cargo test --workspace` green; the greps are clean.
