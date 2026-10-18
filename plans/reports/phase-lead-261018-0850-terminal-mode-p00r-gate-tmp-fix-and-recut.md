# Phase lead report: P00r, gate under /tmp, host lookup, re-cut

Status: DONE

## Fixes
1. **Gate under /tmp.** Cause: `prepareBwrapSync` starts every sandbox with `--tmpfs /tmp`, which hides anything the host keeps under `/tmp`, including the run dir (envelope) and a host binary there. Fix in `confinement/drivers/bwrap.mjs`: for a supervised attempt, `--ro-bind` the run dir and the gate binary back onto themselves when they sit under `/tmp`, before the attempt-file writable binds (so the exit record and capture files stay writable). Test: `test/run-supervisor/bwrap-driver.test.mjs` runs real bwrap with run dir, gate binary and workspace under `/tmp`; reads the envelope, writes the bound file. Old behaviour reproduced by hand (`cat` of a `/tmp` file after `--tmpfs /tmp` fails).
2. **host-judge test.** Code was wrong, test right: `resolveActiveHostBin` fell through to the activation when `FGOS_HOST_BIN` named a missing file. Now an explicit `FGOS_HOST_BIN` is the only answer (`bin: null` when not an executable file). New test in `test/util/host-bin-path.test.mjs`. `ignoreEnv` unchanged.
3. **Re-cut.** `## CẮT LẠI 2026-10-18` block added to plan.md; run order unchanged from the brief. `process-containment.yml` now also triggers on `terminal-mode/**`. CHANGELOG: two Fixed lines.

## Tests (host built privately, `FGOS_HOST_BIN` = phase target debug fgos)
- 22 files (util host-bin*, session-identity, bin-discovery, hot-lock host-judge/guard/tx, holder-lock driver-unavailable/facade-multiprocess/state-root/lock-scope-order, run-supervisor bwrap-driver/contracts/runtime-dir/sweep/attempt-steps/adopt-client, dispatch-confinement authority/backend-p03/p04/p05, terminal-control client-route): 240 tests, 237 pass, 0 fail, 3 skipped.
- run-supervisor direct-cutover + direct-crash-matrix: 21/21 pass.
- `test/architecture.test.mjs`: 27/27 (no new src file).
- A first run without `FGOS_HOST_BIN` failed many host-dependent files; environmental, not a regression.
- Full `npm test` not run (change confined to bwrap argv and host lookup).

## Impact
GitNexus not queried (hook-only hints); callers of `resolveActiveHostBin` grepped: session-identity, terminal-control client, registrations, holder-lock driver. Only an invalid explicit env value changes behaviour. Risk: low-medium; no HIGH/CRITICAL symbol edited.

## Decisions
- Bind only run dir and gate binary (not whole workspace): workspace is already a resource mount.

## Unresolved
- Windows/macOS CI for the branch needs `forgentx-95` to push `terminal-mode/**`.
