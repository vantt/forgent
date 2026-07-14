# phase-2-routing-2 — replay backward-compat + fixture (D7b)

[DONE]

Replay now folds legacy `work.add` payloads through `DEFAULTS` from
`work.mjs` (a missing `tier` reads back as `standard`, no second hardcoded
default). `test/fixtures/phase1-events.jsonl` was generated from a real
`bin/fgos.mjs` run at commit `31c1300` inside a temporary git worktree
(never hand-written), and is asserted unmodified by the test suite itself.
`test/state/backward-compat.test.mjs` covers the fixture alone, a mixed
old+new log, and a pure-new log — all deterministic, read-only against the
fixture, and read-only against `store.mjs`.

Files touched: `src/state/replay.mjs`, `test/fixtures/phase1-events.jsonl`,
`test/state/backward-compat.test.mjs`.

Verify: `npm test` — 102 passed, 0 failed (baseline 94/94 before this cell).

Full trace and evidence: `.bee/cells/phase-2-routing-2.json`.
