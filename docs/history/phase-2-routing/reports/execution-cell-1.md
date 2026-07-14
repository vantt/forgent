# Execution Report — phase-2-routing-1

[DONE] — S1 substrate: `proposed` status, tier/version fields (D5/D6/D7c) implemented and verified.

**Outcome:** `STATUSES` extended to `['todo', 'doing', 'blocked', 'proposed', 'done']`; `fsm.mjs` gains exactly the three D5 edges (`doing->proposed`, `proposed->done`, `proposed->todo` with a required rejection `reason`), `done` keeps zero exits but now has two entries; `work.mjs` adds `TIERS`, `DEFAULTS`, `SCHEMA_VERSION` as the single declared source; `events.mjs` stamps new events with `v: SCHEMA_VERSION` and still reads legacy events with no `v` unmodified. Suite: 94/94 pass (82 baseline + 12 new, 0 regressions, one permitted assertion update per D5).

**Files touched:** `src/state/work.mjs`, `src/state/fsm.mjs`, `src/state/events.mjs`, `test/state/work.test.mjs`, `test/state/fsm.test.mjs`, `test/state/events.test.mjs`.

**Full trace and evidence:** `.bee/cells/phase-2-routing-1.json`

**Commit:** `a2823fc` — `feat(phase-2-routing-1): add proposed status, tier/version fields, and event schema versioning`
