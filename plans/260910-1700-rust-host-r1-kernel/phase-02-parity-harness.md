# Phase 02 — Parity Harness

Depends on: Phase 01 closed (uses `command-routes.json` to enumerate the
coverage-floor selector set).

## Objective

Build the one harness every later Rust-vs-Node proof (P07, P08, P09) runs
against: it invokes Node or a candidate binary with byte-identical inputs,
captures every observable effect, and is proven — by injected-difference
self-tests — to actually catch a regression rather than rubber-stamp one.

## Requirements

- R1: `test/rust-host/harness.mjs` selects the entry under test from
  `FGOS_HARNESS_ENTRY=node:<path>|bin:<path>` (two env vars for a
  differential run, e.g. `FGOS_HARNESS_ENTRY_A`/`FGOS_HARNESS_ENTRY_B`, or a
  single var for a self-check run). `node:<path>` spawns
  `node <path> <args...>`; `bin:<path>` spawns `<path> <args...>` directly.
  Node-against-Node (both entries `node:bin/fgos.mjs`) must pass on the full
  coverage floor (R5).
- R2: Every case declares one or more comparison modes: exact bytes,
  semantic JSON plus a timestamp predicate (never exact timestamp
  equality), filesystem delta, or signal — per
  `rust-cli-and-proof-components-plan.md` §6 step 7.
- R3: Per case, the harness captures: stdout/stderr bytes, normal exit code,
  signal termination, a directory snapshot diff (before/after, for
  write-touching cases), spawned-child-process evidence, and wall-clock
  duration. Child-process evidence uses one named, concrete spy mechanism
  (e.g. a `NODE_OPTIONS=--require <spy>.cjs` preload that monkeypatches
  `child_process.spawn`/`execFile` and appends `{cmd,args}` JSON lines to a
  file named by an env var the harness sets per case) — name the exact
  mechanism used in the harness's own header comment.
- R4: Wall-clock timings are written to a JSON report (one row per case:
  entry label, comparison mode, start/end/duration), path configurable,
  default under a scratch directory — never committed.
- R5: Coverage-floor cases, built from `command-routes.json`'s selector
  list: recognition/help for every one of the 73 selectors; every exit
  category (stdout/stderr/status); reads of `version` and `ready`; one
  validation failure; an unknown verb; an isolated write (`init` then `add`
  in a temp repository); `--dir`; a caller cwd distinct from the product
  root; a stdin-consuming case where one exists; a target-specific
  signal/process-tree case.
- R6: `test/rust-host/harness.test.mjs` proves the harness FAILS on each of:
  an injected stdout byte flip, an exit-code change, a silently
  dropped/altered argv token, and an unexpected child process — using small
  local fixture scripts under `test/rust-host/fixtures/` that deliberately
  diverge, not the real `fgos` binary (which does not exist yet at this
  cell).

## Files

Likely touch:

- `test/rust-host/harness.mjs` (new)
- `test/rust-host/harness.test.mjs` (new)
- `test/rust-host/fixtures/**` (new — divergent stand-in scripts for R6)

Do not touch:

- `packages/host-runtime/rust/**`, `apps/fgos/**`, `Cargo.*` (rust-kernel/rust-workspace lease)
- `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json` (P01's output — read-only input here)

## Verification

```sh
FGOS_HARNESS_ENTRY_A=node:bin/fgos.mjs FGOS_HARNESS_ENTRY_B=node:bin/fgos.mjs \
  node --test test/rust-host/harness.test.mjs
```

- Node-against-Node passes every coverage-floor case.
- The four injected-difference cases in `harness.test.mjs` each fail as
  expected (asserted by the test itself — the harness's failure IS the pass
  condition for these sub-cases).
- A wall-clock JSON report is produced under a scratch path for at least one
  run.
- Capability annotation for this cell: `code:implement`.
