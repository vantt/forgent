# Execution report — phase-1-state-layer-5

**Status:** DONE
**Outcome:** Added `test/e2e/rebuild-determinism.test.mjs` — three e2e cases run through the real `bin/fgos.mjs` binary via child process, cwd always a fresh mkdtemp temp dir: (1) full journey — init, add work with deps + a unicode title, move through todo/doing/blocked/done with `--expect`, decision, delete `state.json`, rebuild → deep-equal view; (2) CAS conflict on a stale `--expect` (exit 3, no event written); (3) a truncated last event-log line (exit 5, message names the error). `README.md` gained one Documentation line pointing at `bin/fgos.mjs` and `docs/history/phase-1-state-layer/`.

**Files touched:** `test/e2e/rebuild-determinism.test.mjs` (new), `README.md`

**Verification:** `npm test` → 71 passed, 0 failed (full trace and verify output: `.bee/cells/phase-1-state-layer-5.json`).

**Commit:** `31c1300` — feat(phase-1-state-layer-5): e2e rebuild-determinism + CAS + corrupt-log via real CLI

**Deviations:** none.

Full trace/evidence: `.bee/cells/phase-1-state-layer-5.json`.
