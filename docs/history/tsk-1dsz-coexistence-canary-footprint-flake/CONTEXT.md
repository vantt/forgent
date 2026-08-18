# tsk-1dsz — CONTEXT.md

## Feature boundary

`test/e2e/coexistence-canary.test.mjs`'s test (ii) "footprint" case flaked
once (2026-08-13) with a byte-snapshot diff mismatch (`assert.deepEqual`
failure, no thrown error) — see the item's own description for the exact
failure. This item's scope is the decision of what to DO about that single
occurrence, not a code fix: whether to invest further session time
reproducing it under load, or to document it as a known, unconfirmed,
low-frequency flake and close.

## Scout / evidence gathered (discovery stage, `fgos-researching` round 1)

Full citations in `docs/history/tsk-1dsz-coexistence-canary-footprint-flake/RESEARCH.md`.
Summary:

- `snapshotTree(fx, ['.fgos', '.git'])` (test file lines 128-144) skips
  recursing into those two dirs entirely, so the diff paths reported can
  only originate from files at the fixture root, not from inside `.fgos/`.
- Static read of `src/state/store.mjs:88-90` and
  `src/runner/paths.mjs:87-98` found no code path that writes
  `events.jsonl`/`state.json` outside a `.fgos`-joined root — every root
  resolution funnels through `fgosDirFromRoot`, which always appends
  `.fgos`. No storeRoot-resolution bug identified.
- `docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/plan.md` +
  `RESEARCH.md`: tsk-4fx's confirmed mechanism needs MANY concurrent
  racing child processes contending for `acquireEventsLock`'s 2s
  per-attempt deadline, throwing a real `lock-timeout` error. This
  coexistence-canary test spawns exactly ONE `runner --once` subprocess
  against an isolated tmp fixture and fails silently — a structurally
  different shape. Confirmed NOT the same mechanism.
- Impact-analysis posture: `full` — GitNexus is registered and `present`
  (`fgos tool query --capability impact-analysis --status present`).
  Informational only; this item makes no code change, so no `impact()`
  call was needed against a symbol.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Close tsk-1dsz as a known, unconfirmed flake — no code fix. Move to `wontfix` rather than investing further session time in reproduction, since the occurrence was a single, immediately-clean-on-rerun event with no code-level bug found on static read. If it recurs, a NEW item should be filed carrying the accumulated evidence from this one (this RESEARCH.md/CONTEXT.md), not reopened blind. |

Source: human answer recorded on `tsk-1dsz` (discovery-stage parked
question, 2026-08-13): "Close as a known flake: document root cause is
unconfirmed ... Do not invest further reproduction effort now -- close
wontfix unless it recurs."

## Pinned terms

- "the flake" — the single `test/e2e/coexistence-canary.test.mjs` test
  (ii) footprint-case failure observed 2026-08-13, immediately clean on
  rerun, never reproduced since.

## Outstanding questions

None
