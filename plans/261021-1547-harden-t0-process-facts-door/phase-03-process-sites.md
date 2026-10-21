---
phase: 03
title: "Process sites outside the SEAT carry list onto the door; route and client retired"
status: pending
depends_on: [01, 02]
parallel: "may run in parallel with phase 04 (Rust process crate; disjoint files); phase 05 starts after this phase (shared run-lock.mjs, proof-helpers.mjs, provider-capacity.mjs)"
effort: ~1.5d
net_size: "Node −155 / Rust 0 / tests +40 (estimate)"
---

# Phase 03 — Process sites onto the door

## Context

[plan.md](plan.md) Facts ("Process sites outside the SEAT carry list"); arbitration §3 rows F-A1+RT-M4, F-A3, RT-M3, RT-M5, S-E1, F-A2, RT-M6; simplicity Q3 table (two caller policies: P1 reclaim only on `dead`, P2 signal only on `sent`); red-team verdict 2 (the exclusion set of `stop-processes-inside` stays `process.pid`/`process.ppid`, in-process, nothing shifts). Phase 1's red tests for F-A1/RT-M4, F-A3, RT-M3, RT-M5 flip green here. The SEAT carry list (`assignment-runner.mjs`, `run.mjs`, `unit-summary.mjs`, `registrations.mjs` SEAT parts, `main.rs`) is phase 7, not here.

## Requirements

- Every site below calls the thin client of phase 2 and nothing else. Policy lives in the caller as one line: P1 sites call `resolveHolderLiveness(record) === 'dead'`; P2 sites act only on `'sent'` and surface the other outcomes by name with a next step.
- `'unknown'` is never reclaimed and never signalled (S-E1 policy). A pid-only record (no `startTime`) is `unknown` while the pid lives (`Record::from_json`, `facts.rs:90-114`), which is today's "alive" for those sites: no behaviour widens.
- Windows: `direct-launch.mjs` writes `bootId: selfRecord().bootId ?? 'unknown-boot'` so `supervise.rs:194`, `gate.rs:206`, `adopt.rs:257` keep a string; `cancel-registry.mjs` writes the tuple as `selfRecord()` gives it (`pidNs` in the `pid:[N]`/`none` form Rust compares).
- The `process-observe` route is deleted in **this** phase on the Node side (client and hot-lock caller) and in phase 6 on the Rust side (route, contract, test), because the door ships on every channel after phase 2 (L10; the speed seat's "keep the route for cold paths" was rejected in arbitration §3 verdict 6).
- `src/state/hot-lock.mjs`: only `:24-25`, `:38`, `:57-68`, `:79-94`, `:98-100` change. The staging and transaction region is WORK's and is not touched; the lane is told.
- No `process.kill(pid, 0)` remains in the reconcile closure: remove `SIGNAL_ZERO_PROBE` (`test/runner/dispatch-reconciliation-import-graph.test.mjs:142-151`) in this phase, deliberately, after `provider-capacity.mjs:579` and `process-identity.mjs` are clean.

## Files

**Modify (per site: file:line → after → policy → owning proof)**
- `src/runner/gateway-control.mjs` — `:32` import `judge`, `selfRecord`-free: import `{ observe, judge, signalByIdentity }`; `:225-231` the entry gains `record: { host, bootId, pidNs, pid, startTime }` read through `observe(child.pid)` right after `spawn` (an `unreadable` observation at that moment is a start failure, named); `:66-72` `waitUntilDeadOrDeadline(record, deadline)` polls `judge(record) !== 'alive'` (a zombie is `dead` at once: RT-M4); `:177` and `:336` judge the registry record (`pidExists` gone); `:239` judges the new record; `:287-315` `stopGateway`: `judge(entry.record)`; `'dead'` clears the registry; `'unknown'` (old pid-only entry, or unreadable) throws `GatewayControlError('gateway-stop-identity-unknown: the registry names pid N without a verifiable identity; stop that process yourself, then delete <registryPath>')` and signals nothing; `'alive'` → `signalByIdentity(entry.record, 'term')`, wait, `signalByIdentity(…, 'kill')`, wait; if still `'alive'` after the second window, keep `gateway.json` and throw `gateway-stop-failed: pid N survived SIGKILL; see <logPath>`. Policy P2. Owning proofs: the three phase-1 cases plus the existing `:119, :185, :198, :255`. F-A2 (`:121-132` registry write through `replaceDurably`) is phase 5, to keep this phase off the durable door.
- `src/runner/dispatch/stop-processes-inside.mjs` — `processesInside(dir)` returns the `scan` views whose `exe` or `cwd` is inside `dir`, minus `process.pid` and `process.ppid` (`scan` through the door; the filter stays Node, red-team verdict 2); `stopProcessesInside` signals each view through `signalByIdentity(view, 'term')`, polls `judge(view) === 'alive'` for `graceMs`, then `signalByIdentity(view, 'kill')`; a view whose tuple is unreadable is reported, never signalled. `:21-23` `alive`, `:48-49` readlinks, `:64-71` bare kills deleted. Callers `confinement/cleanup.mjs:218` and `worker-home.mjs:181` keep their call shape (count returned). Policy P2. Owning proof: phase 1's new file, extended with "a reused pid gets identity-mismatch and no signal" wired through the door against a child that exits (the Rust owner is `signal_identity.rs:44-57`).
- `src/runner/lock-fence.mjs` — delete `:48-87` (`startTimeOf`, `cmdlineOf`, `identityOf`, `signalByIdentity`, `stillHolding`'s start-time compare); `fenceLock` (`:137-153`) builds holders from `observe(pid)` into full records and refuses with `lock-fence-identity-unknown: holder pid N has no readable identity; stop it yourself and re-run` when any is unreadable (P2); signals through `signalByIdentity(record, 'term'|'kill')`; `waitUntilGone` polls `lockHolders` plus `judge(record) === 'alive'`; `fenceHotRecord` (`:175-192`) uses `seen.record` as the tuple (never `identityOf(seen.record.pid)`: RT-M3) and polls `judge(seen.record)`. The `cmdline` of a holder (`cmdlineOf`, `:59-65`) is dropped from the confirm prompt, which then shows pid and start time; the CLI test `test/cli/fgos-lock-fence.test.mjs:41` asserts the pid. If the lead finds a test or a verb that asserts the command line, keep one `readFileSync('/proc/<pid>/cmdline')` for display only and list it in the one-door allowlist with the reason "display, never a decision". Owning proofs: phase 1's RT-M3 case and the existing `:41, :67, :97, :127, :192`.
- `src/runner/session.mjs:477` — `const pidDead = resolveHolderLiveness(entry.record ?? { pid: entry.pid }) === 'dead'`; `writeSession` (find with `rg -n "pid: process.pid" src/runner/session.mjs`) records `record: selfRecord()` for new entries. P1. Owning proof: `test/runner/session.test.mjs:483, :521, :553` (extend `:483` with "a live pid without a recorded identity is kept").
- `src/runner/dispatch/provider-credential-renewal.mjs:703-708` — `stagingWriterAlive` → `resolveHolderLiveness({ pid }) !== 'dead'` (keep on unknown, P1; a zombie writer is now reaped, which is correct). Owning proof: `test/runner/provider-credential-renewal.test.mjs` (extend the staging sweep case with a zombie writer).
- `src/runner/dispatch/provider-capacity.mjs:11, :579, :643` — `:643` records `record: selfRecord()` on the lease (keep `pid` and `processStartTime` fields for the previous release's reader; `processStartTime` is `selfRecord().startTime`); `:579` `resolveHolderLiveness(lease.record ?? { pid: lease.pid, processStartTime: lease.processStartTime }) === 'dead'`. P1. Owning proofs: `test/runner/provider-capacity.test.mjs:149, :188, :224, :254` (unchanged expectations; the `getProcessStartTime` import at `:29` moves to `selfRecord`).
- `src/run-supervisor/cancel-registry.mjs:76-83` — `selfTuple()` returns `selfRecord()` as is (phase 1's pidNs case flips green).
- `src/run-supervisor/direct-launch.mjs:17, :130-132` — `bootId: selfRecord().bootId ?? 'unknown-boot'`.
- `src/runner/dispatch/run-lock.mjs:28, :34-47, :51-59` — delete `isProcessAlive` (`:34-42`); `buildRunControlHolder` spreads `selfRecord()` and keeps `id`, `processStartTime` (= `startTime`) and `host` for the previous release's reader; `resolveHolderLiveness(holder)` (`:45-47`) becomes a plain re-export of the client's adapter, kept **only** because `assignment-runner.mjs:75, :82, :823` import it from here (SEAT carry list, phase 7 removes the re-export and `isProcessAlive`'s name). Owning proofs: `test/runner/run-lock-identity.test.mjs:76-110`.
- `src/setup/registrations.mjs:5509-5511` — `const alive = resolveHolderLiveness({ pid: marker.pid }) !== 'dead'` (P1; marker pid-only → unknown → kept, as today; a zombie owner → reaped). Import the client at the top of the file. Owning proof: `test/setup/confinement-doctor-checks.test.mjs:79`. SEAT also edits this file: tell SEAT; keep the edit to these three lines plus one import.
- `src/state/hot-lock.mjs` — `:24` import only `judge` (and `selfRecord` where `:110-120` mints the record; check with `rg -n "getBootId|getPidNs|getProcessStartTime|observeProcess|pidExists" src/state/hot-lock.mjs`); `:25` drop `runProcessObserveRoute`; delete `:38` `HOST_OBSERVE_TTL_MS`, `:57-68` `observeViaHost`, `:79-94` `hotObserver`; `:98-100` `judgeHotRecord(record) = judge(record)`; `:177-189` `reclaimDeadHolder` passes no `{cache:false}`. Owning proof: `test/state/hot-lock-host-judge.test.mjs` is **retired in phase 6** with the route; its two in-process behaviours ("a live holder with its recorded start time is alive; another start time is a reused pid", "a killed holder is dead, a live holder without a recorded start time stays unknown") move in this phase into `test/state/hot-lock-multiprocess.test.mjs` as one wiring case of `judgeHotRecord` through the door (owner after the move).
- `src/holder-lock/driver.mjs:273-292` delete `runProcessObserveRoute`; `src/holder-lock/index.mjs:44, :50` drop the import and export.
- Two T0 copies inside T1 files (parent phase 01 §A #3 and #4, "liveness part only"; arbitration S-E1 counts them among the nine; the brief's site list omitted them, see plan.md concerns): `src/holder-lock/hold-transport.mjs:51-58` `pidAlive` is deleted and `helperAlive` (`:150-153`) becomes `!reaped(hold.child)` (an own, unreaped child cannot be reused; the libuv fact is exact; no door call needed). `src/holder-lock/fences.mjs:97-105` `isPidAlive` becomes one line, `resolveHolderLiveness({ pid }) !== 'dead'` (P1: a pid-only fence holder is `unknown` and kept, a zombie is `dead`); `parentPid` (`:412-421`) stays as the allowlisted self-exclusion read and goes with the fences under R4 in T1. Owning proofs: the existing hold-transport and fence tests under `test/holder-lock/` and `test/cli/fgos-lock-fence.test.mjs:127` (none weakened; find them with `rg -l "hold-transport|fences.mjs" test`).
- `test/runner/dispatch-reconciliation-import-graph.test.mjs:142-151` — remove `SIGNAL_ZERO_PROBE` and its strip at `:151`.
- `packages/git/contracts/mutation-census.v1.json` regenerated; `CHANGELOG.md` `[Unreleased]`: `fgos gateway stop` and `fgos lock fence` act only on the recorded process identity and refuse by name otherwise.

**Create**: none. **Delete**: the code ranges above (no whole file). **Tests to retire**: none in this phase (the hot-lock route test retires in phase 6 after its two behaviours move here).

## Steps

1. Gateway first (the reproduced High): record, judge, signal, named errors; flip the three phase-1 cases; retire `gateway-control.test.mjs:215`.
2. `stop-processes-inside`, then `lock-fence`, then the P1 sites (session, credential staging, provider-capacity, run-lock, registrations `:5509`).
3. `cancel-registry` and `direct-launch` (RT-M5), with the two phase-1 cases.
4. `hot-lock.mjs` and the Node route client; move the two hot-lock behaviours into `hot-lock-multiprocess.test.mjs`.
5. Remove `SIGNAL_ZERO_PROBE`; run the import-graph test.
6. Regenerate the census; run the focused files; `npm test` once; report with the site table (site | before | after | policy | proof | Δ).

## Verification (exact)

- `node scripts/run-tests.mjs test/runner/gateway-control.test.mjs test/runner/stop-processes-inside.test.mjs test/cli/fgos-lock-fence.test.mjs`
- `node scripts/run-tests.mjs test/runner/session.test.mjs test/runner/provider-credential-renewal.test.mjs test/runner/provider-capacity.test.mjs test/runner/run-lock-identity.test.mjs test/setup/confinement-doctor-checks.test.mjs`
- `node scripts/run-tests.mjs test/run-supervisor/cancel-registry.test.mjs test/run-supervisor/direct-cutover.test.mjs test/state/hot-lock-multiprocess.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `rg -n "process\.kill\(" src bin` → only `transport.mjs:369`, `provider-credential-probe.mjs:113`, `holder-lock/index.mjs:454`, and `registrations.mjs:6021,6063,6116` (phase 6 deletes those). `rg -n "/proc/" src bin` → only `run-supervisor-checks.mjs`, `holder-lock-checks.mjs`, `fences.mjs` (`parentPid`), `driver.mjs`, `confinement/probes/harness.mjs`, `confinement/drivers/bwrap.mjs`, and `registrations.mjs:6057-6070` (phase 6).
- `rg -n "runProcessObserveRoute|observeViaHost|HOST_OBSERVE_TTL_MS" src test` → only `test/state/hot-lock-host-judge.test.mjs` (phase 6).
- `node scripts/git-one-door-scan.mjs --write-census`.

## Net size

Node: gateway +12, stop-processes −25, lock-fence −38, session +2, credential −3, provider-capacity +1, cancel-registry −5, direct-launch 0, run-lock −12, registrations −2, hot-lock −40, driver −20, index −2, hold-transport −8, fences −7 → ≈ −155. Rust 0. Tests: stop-processes wiring +15, gateway rewrites +10, session/credential/hot-lock moves +20, `SIGNAL_ZERO_PROBE` −10 → ≈ +40 (the retirements land in phase 6).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A reader in the previous release expects `processStartTime`/`pid` fields on leases and run-control holders | H × M | Keep those fields beside the new `record` (one write, two readers for one release; R4 policy). |
| `stop-processes-inside` under a host without `/proc` (`scan` → `'unsupported'`) | M × L | Returns 0 and reports nothing, as today (`:39`). |
| `lock-fence` CLI test asserts the command line in the prompt | M × L | Checked in the requirement; display-only read allowlisted with its reason, never a decision. |
| hot-lock Windows path loses the 250 ms cache and judges per poll | L × L | A door `observe` is µs; the speed seat's Q1 budget covers it (≤ 25 µs per poll, 10 ms interval). |

## Rollback

Revert the phase's commits. Gateway entries written with `record` are read by the previous release through `pid`/`port` only.

## Done when

All listed sites call the client; phase 1's F-A1/RT-M4, F-A3, RT-M3, RT-M5 cases are green; the `rg` lines above hold; the import-graph test passes without the signal-0 exemption; the site table is in the report.

## Lead brief essentials

Delete list: the ranges above (`lock-fence.mjs:48-87`, `stop-processes-inside.mjs:21-23,48-49,64-71`, `run-lock.mjs:34-42`, `hot-lock.mjs:38,57-68,79-94`, `driver.mjs:273-292`, `gateway-control.mjs` bare-pid kills). Find the owning test before writing a new one (the files named per site). Δ-lines per language. Report only what you saw yourself. Do not touch `hot-lock.mjs` outside the named lines, nor any SEAT carry-list file. Tell SEAT (registrations.mjs) and WORK (hot-lock.mjs) on the board. Report name from `fgos convention name --json`.
