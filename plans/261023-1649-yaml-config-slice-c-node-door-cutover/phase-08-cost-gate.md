# Phase 08: Cost gate (cold start, warm read, marshal) and landing B

Depends on 06, 07. Suggested executor: haiku (measure and write the report), the lead for the gate and the landing. No source except what a measured fix needs under G-C2.

## Context

Spec G1 measured steady-state costs (N-API about 12 µs per call, digest check about 24 µs, `fgos` cold start 97 to 110 ms). It did not measure what this slice adds to a **cold Node process**: the addon load for processes that never touched Git (0.5 ms plus an 8.4 ms hash check, once), the first `snapshot` (parse and bundle of 16 schemas and 15 standard files, validator compile of the `runner` schema, which B made lazy through `OnceLock`), and marshalling the 25 KB `runner` section as JSON text with a prototype-free reviver. Every `fgos` verb, every doctor check and every PreToolUse hook pays these, so they are measured **before** any reader moves.

## What is measured (release-profile addon, this machine, `free -g` noted, 20 runs each, median and worst)

1. `node -e "process.exit()"` baseline versus a process that imports `src/util/yaml.mjs` and parses one document (landing A) versus the old vendored parser at `main` before A.
2. First `readConfig` of this repository's rehearsal copy (the migrated scratch copy of D's phase 16) and of the unmigrated legacy JSON: all sections, `sections: ['gateBypass']`, `sections: ['runner']`.
3. Warm repeat of each (hit in the addon cache) and an alternating project/machine pair (the 8-slot cache).
4. Trusted-root resolution: linked worktree, main checkout, non-repository, with the memo cold and warm.
5. `fgos doctor` end to end on the branch versus `main` (about 40 config reads, spec section 12 estimated 1.4 ms against 2.4 ms) and `fgos dispatch decide` (the hook path, 109 to 110 ms today).

## Thresholds (proposals, approved with the frame)

First snapshot at most 25 ms over today's cold read of the same file; warm one-section read at most 0.3 ms; `runner` marshal at most 3 ms; addon load for a Git-free process at most 12 ms; `dispatch decide` at most 15 ms slower than today. All five must hold, or G-C2 is posted with the numbers and the dominating term (parse, compile, hash, marshal).

## Steps

1. Merge `origin/main`; build the release addon and host once (`cargo build --release -p fgos -p fgctl -p fgos-node-addon --jobs 4` after `free -g`), run the measurements in scratch; write the report under `plans/reports/` (name and path from `fgos convention name|path --json`, slug distinct, for example `measure-<stamp>-config-door-cost`).
2. If every number holds: write the line into the report, proceed. If not: post G-C2 (text in the plan) and stop phase 09 onward; landing B itself is not blocked because it changes no runtime behaviour.
3. Land B: final gates sequentially (`cargo test -p fgos-config -p fgos-node-addon --jobs 4`, then the Node config tests, then `npm test`), board line, tell `lead:HARDEN` and `lead:TEST`. Activation of landing B alone is not required: it is carried by the next release.

## Owning proof

The report (numbers are not a test; a number past a threshold is a stop, not a failure).

## Risk / rollback

No risk (measurement). If G-C2 chooses a Rust-side fix, it is its own commit group inside `fgos-config` and the addon (lazy per-section validator compile, request-scoped validation, cached bundle) with B's goldens as the guard; rollback is its revert.

## Measured (2026-10-24, landing B, release-profile addon and host, 20 runs per row, scratch data outside the repository)

**Result: three of the five bounds do not hold; phase 09 onward is stopped on G-C2** (landing B itself changes no runtime behaviour and is not blocked). The numbers, the method and the dominating terms are in `plans/reports/phase-261024-1154-cfg-slice-c-landing-b-config-door.md`. In short: first snapshot 34.5 ms (2.8 ms bundle load, then 30.2 ms for the first build, of which about 25 ms is one-time: the second build of the same request takes 5.1 ms) against today's 0.3 ms read, bound +25 ms; warm read 0.049 ms when cached but 4.1 ms whenever a detected executor makes the snapshot uncached (any project without `runner.executor` on a machine with `claude` on `PATH`) and for the machine view, bound 0.3 ms; addon load 16.8 ms (6.0 read + 9.2 sha256 + 1.0 require of a 21.6 MB addon), bound 12 ms; `runner` marshal 0.36 ms (bound 3 ms, holds); `dispatch decide` cannot be compared until a reader moves (baseline 252 ms median here).

Rerun after the coordinator's G-C2 decisions (lazy validators, cached detected snapshots, stripped addon): the marginal addon load (5.3 ms) and the detected-executor warm read (0.044 ms) now hold; the first read (26 to 41 ms, bound 25.3) and the uncached machine view (3.9 ms) still fail, and about 20 ms of the first read is the Git driver's cold start resolving the trusted root. Round 2 is in the report.

Round 2 (machine view cached, first read measured as the marginal cost after Git ran: 14 to 21 ms): every bound holds; see the report. Phase 09 waits for the owner to start landing C.
