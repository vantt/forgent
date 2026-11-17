# Phase 8: Rotation core — measure, decide, handoff store, config

Pure library, no hook and no process control yet. Node, because it runs inside agent-CLI hooks (every hook in this repo
is a Node script) and only orchestrates Rust doors (durable file writes, secrets redaction); it holds no foundation logic.

## Inputs (read first)
- `plans/261117-1856-secretary-session-spine/reports/spike-rotation.md` (phase 2: which measure source and its rule).
- Research report §4a and "Recommended method" items 1-4, 7-8; SM-D2, SM-D5, SM-D13.
- Atomic write door: `rg -n "writeAtomic|durableFile|publishMutableProjection" src/util src/native | head` and reuse it.
- Redaction: `rg -n "redact" src packages/secrets --glob '*.mjs' --glob '*.rs' -l` and reuse the existing door.
- Config gate: `core/config-standard/*.yaml`, `core/config-schema/*.schema.yaml`, how a new area file is registered
  (`rg -n "workerSlots" src/config core/config-schema -l`); `docs/architecture-manifest.json` layer entries.

## Files this phase may write
`src/session-rotation/**` (except `rotate.mjs`, phase 14), `test/session-rotation/**` (except `rotate.test.mjs`),
`core/config-standard/sessionRotation.yaml`, `core/config-schema/sessionRotation.schema.yaml`, `docs/architecture-manifest.json`.

## Steps
1. Config `sessionRotation`: `soft` 0.40, `hard` 0.70, `keep` 10, `windowTokens` (default from the spike), and
   `personas.<name>.reload` (list of portfolio paths the successor rereads). Schema and standard file; project overrides
   per the vision doc (project wins over global). If registering a new area needs a file outside this footprint, stop.
2. `measure.mjs`: context used as a fraction, from the source the spike chose (sidecar if fresh, else the transcript:
   last non-sidechain assistant entry, deduped by `message.id`, input + cache_creation + cache_read over the window).
3. `decide.mjs`: `rotate: none | soft | hard` from measure, thresholds and at-rest facts (no pending owner question in
   the session's lineage state, no in-process background task from the Stop payload).
4. `handoff-store.mjs`: write `<yymmdd-hhmm>-<sid8>.md` under `.fgos/runtime/session-rotation/<persona>-<name>/`
   (refuse to overwrite), redacted; `latest.json` written atomically last; keep the newest 10; read latest. Content:
   pointers to portfolio files, delta, and on `hard` the last assistant message and pending question verbatim; describe
   state, not actions; first line "verify against the repo before acting".
5. Add `src/session-rotation/` to the architecture manifest at the right layer.
6. Owning tests: `test/session-rotation/measure.test.mjs`, `decide.test.mjs`, `handoff-store.test.mjs` (immutable,
   atomic latest, keep 10, redaction), each the lowest layer for its behaviour.

## Verify
- `node --test test/session-rotation/*.test.mjs` passes; `node --test test/architecture.test.mjs` passes.
- `node --test` the config schema/standard tests (`rg -l "config-standard" test | head`) pass.

## Rollback
`git revert` the phase commit.
