---
phase: 01
title: "Red tests for the reproduced Highs and Mediums no test owns yet"
status: pending
depends_on: []
parallel: "none; committed first, each case turned green by the phase named in its row"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests +150 (estimate)"
---

# Phase 01 — Red tests

## Context

[plan.md](plan.md) Facts; arbitration §3 rows RT-M2, S-F1, HL-N8/N9 (speed S-6 wording, red-team D-1), RT-M5, RT-M11/R3, T0-R1 (red-team D-2: the validating replacer), T0-R2 (red-team D-3). Design principle 8: one owning proof per behaviour, in the file that owns the module. A test that cannot be red on today's main (the behaviour holds today and the test guards the coming change) is marked **pin-only** with the mutation that makes it red; the others are **red on main**.

## Requirements

Eight cases, each in the file that owns the behaviour, each titled by its behaviour in plain words, each committed on its own with the sentence of why no existing test proves it.

| # | Behaviour | File | Red on main? | Fixed / guarded by |
|---|---|---|---|---|
| RT-M2 | a handle handed to `spawnWithLocks` keeps the child's lock alive after the parent's `release()`: acquire `main-checkout` in process, `spawnWithLocks([handle], { command: process.execPath, args: ['-e', a script that keeps fd 3 open, spawns a grandchild with `stdio: ['ignore','ignore','ignore', 3]` (Node cannot set `FD_CLOEXEC`; the inherited mapping is what the supervisor's `take_inherited` sees, `packages/run-supervisor/rust/src/supervise/unix.rs:38-74`), writes the grandchild's pid to a file and sleeps] })`, wait for the pid file, call `handle.release()`, assert the grandchild is still alive (`observe(pid).kind === 'live'`) and `probe` answers `held`; `t.after` ends both by identity | `test/holder-lock/facade-multiprocess.test.mjs` (owns the facade's process-level wiring; `:66, :92, :193` today) | pin-only (release is `closeSync` today); red under the mutation "release settles every exclusive handle" | phase 2 (the handed-over mark) |
| S-F1 | a waiter blocked by a parsed record whose judge answers `unknown` times out with `reason: 'lock-record-unreadable'` and a message naming `fgos lock fence`: delete the exemption `if (name !== 'unjudgeable')` at `test/state/hot-lock-multiprocess.test.mjs:218` and add `assert.match(answer.message, /fgos lock fence/)` for all three cases (the message is already returned at `:211`) | `test/state/hot-lock-multiprocess.test.mjs:194-228` | **red** (`hot-lock.mjs:192-199` sets `reason` only for `unreadable`) | phase 4 |
| P-N9 | a record that changed after it was judged dead is never reclaimed: write a dead record D (a pid of an exited child with its real start time), `readHotRecord` it as `observed`, overwrite the file with this process's own live record L, call `reclaimDeadHolder(fgosDir, 'state', observed)` → `'changed'` and the file still holds L | `test/state/hot-lock-tx.test.mjs` (owns the module's record functions, `:23`) | pin-only; red under the mutation deleting `hot-lock.mjs:132-133` | phase 4 (speed S-6 shape: one read, bytes **and** judge, direct unlink) |
| P-N8 | `clearHotRecord` clears only the bytes the person saw: write unparseable record U, `clearHotRecord(fgosDir, 'state', U)` → `true` and the file is gone; write U again, overwrite with U', `clearHotRecord(fgosDir, 'state', U)` → `false` and U' intact | `test/state/hot-lock-tx.test.mjs` | pin-only; red under the mutation deleting the compare at `hot-lock.mjs:112` | phase 4; also lets `test/holder-lock/hot-lock-contract.test.mjs:37` (`/bytes equal/`, contract prose) retire in phase 4 with P-N8/P-N9 as owners (TEST D2: prose retires once every behaviour it describes has an owner) |
| RT-M5 | the attestation store honours the state-root pin: with `FGOS_STATE_ROOT=<scratch>` and no `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`, `resolveAttestationStoreDir()` is `<scratch>/attestations`; with a whitespace-only `XDG_STATE_HOME` and a pin the pin still wins | `test/runner/dispatch-r9-performance-cache.test.mjs` (the file that already owns `attestation-store.mjs`'s behaviour; no new file) | **red** (`attestation-store.mjs:167` reads `XDG_STATE_HOME`/`HOME`) | phase 4 |
| RT-M11 / R3 | a `bwrap` that refuses a mount names the mount in the containment error: `BwrapPidns::new(<fixture script>)` where the script writes `bwrap: Can't bind mount /oldroot/var/tmp/x on /newroot/var/tmp/x: Invalid argument` to stderr and exits 1 without writing `--info-fd` (on every invocation, so phase 4's diagnostic re-run sees the same line); `spawn_in` must return `ContainmentError::NamespaceUnavailable(msg)` with `msg` containing `Can't bind mount /oldroot/var/tmp/x` | `packages/process/rust/tests/containment_bwrap.rs` (owns the driver; fixture under `packages/process/rust/tests/fixtures/`, the file's existing `fixture()` helper at `:25`) | **red** (`linux.rs:429` returns the fixed string; `apply_stdio` sends stderr to `/dev/null` or an unread file) | phase 4 |
| T0-R1 guard | the door's `canonicalJson` is byte-equal to the canonical vectors: for every vector of `packages/canonical-json/contracts/vectors/canonical.v1.json` whose `input` survives `JSON.parse` → `JSON.stringify` unchanged, `canonicalJson(JSON.parse(input))` equals the vector's expected bytes; and the five refusals at `:74` stay (`[1, undefined]`, holes, `NaN`, `10n`, functions) | `test/git/native-load.test.mjs` (owns the door, `:68-89`) | pin-only (the object-in door is byte-equal today); red under the naive `JSON.stringify` replacement the red-team falsified (D-2) | phase 4 (string-in door with the validating replacer; the corpus rerun is a phase-4 step, not a test) |
| T0-R2 | an omitted or invalid `mode` is refused by name before any file is touched: `replaceDurably(temp, 'x', 'c')`, `installOnce(temp, 'x', 'c', -1)`, `(…, 1.5)`, `(…, 0o10000)` each throw `{ code: 'durable-file-mode-invalid', installed: 'none' }` and leave no file or temporary | `test/git/native-load.test.mjs:68-89` | **red** (N-API `NumberExpected` / `InvalidArg` today) | phase 4 |

A red test for RT-M1 is not written: the hook tests (`test/runner/custody-lease-commit.test.mjs:57`, `test/runner/execution/commit-unit-work.test.mjs`, `test/runner/merge.test.mjs`) already commit through the real hook against the activated host and are phase 2's wiring proof.

## Files

**Create**: `packages/process/rust/tests/fixtures/bwrap-refuses-mount.sh` (+3, executable). **Modify**: `test/holder-lock/facade-multiprocess.test.mjs` (+35), `test/state/hot-lock-multiprocess.test.mjs` (−1, +3), `test/state/hot-lock-tx.test.mjs` (+40), `test/runner/dispatch-r9-performance-cache.test.mjs` (+20), `packages/process/rust/tests/containment_bwrap.rs` (+30), `test/git/native-load.test.mjs` (+14), `test/suite-baseline.json` (refreshed). **Delete**: none. **Tests to retire**: none.

## Steps

1. Create the worktree with ak-cook on the track branch; run the one-file command below on `test/state/hot-lock-tx.test.mjs` once to confirm the harness stages a host and addon.
2. Write the eight cases in the order S-F1, P-N9, P-N8, RT-M2, RT-M5, T0-R2, T0-R1 guard, RT-M11. For each, run its file alone and paste the red output (or, for a pin-only case, the output under its mutation applied with `sed` in the worktree and reverted) into the phase report.
3. Commit each case on its own with the behaviour sentence.
4. Report: table "test | file | red on main (yes/no, why) | fix phase | owner after the fix", plus the test-cost line (8 tests added, 0 retired, new host spawns: RT-M2 spawns one child plus one grandchild with a `// boundary: process-level lock handover` reason; CLI-call cost before/after from `node scripts/test-proof-inventory.mjs --cli-cost`).

## Verification (exact)

```sh
node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- test/state/hot-lock-tx.test.mjs
```

- `test/state/hot-lock-multiprocess.test.mjs` → the `unjudgeable` case fails on `reason`.
- `test/state/hot-lock-tx.test.mjs` → both new cases pass; with `sed -i '132,133d' src/state/hot-lock.mjs` P-N9 fails; with the compare at `:112` turned into `if (current.state === 'absent') return false;` P-N8 fails; revert.
- `test/holder-lock/facade-multiprocess.test.mjs` → the new case passes; with `release()` changed to call a settle on every handle it would fail (the mutation is phase 2's own regression guard; the lead records it, no mutation run needed).
- `test/runner/dispatch-r9-performance-cache.test.mjs` → the new case is red, the rest pass.
- `test/git/native-load.test.mjs` → the T0-R2 assertions fail (`NumberExpected`); the vector loop passes.
- `cargo test -p fgos-process --test containment_bwrap a_refused_mount_is_named_in_the_containment_error` → red (the message is the fixed string).

## Net size

Node 0. Rust 0. Tests +150 (8 cases; the fixture script counts as tests).

## Test-cost line

Added 8, retired 0. New spawns: RT-M2 (one `node` child and one grandchild, reasoned), RT-M11 (one fixture shell child inside cargo). No new `fgos` host or `fgctl` spawn. CLI-call cost: unchanged (measured and pasted by the lead).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| P-N9's "dead record with a real start time" needs an exited child's tuple | L × L | Spawn `process.execPath -e ''`, read `observe(child.pid)` before it exits (`{kind:'live', …}`), wait, use that tuple as D; the judge answers `dead` for an exited pid with the recorded start time (zombie counts as dead, `judge_vectors.rs`). |
| RT-M2's child or grandchild outlives a failed test | L × M | `t.after` kills both by identity (`signalByIdentity`) and waits for exit. |
| The fixture `bwrap` script runs under `cargo test` on a machine without `bwrap` | L × L | `BwrapPidns::new(path)` takes the fixture path; the test does not call `select`, so it runs everywhere Linux. |

## Rollback

Revert the eight commits; nothing else depends on them.

## Done when

The eight cases are on the track branch with their red or mutation output in the phase report; the baseline is refreshed; the one-file command runs each file.
