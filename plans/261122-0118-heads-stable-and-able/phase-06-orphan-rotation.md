# Phase 6: A rotation whose executor died is resolved

Capability: `code:implement`.

Closes `p-bakpfrvigb`.

## Inputs

- `src/session-rotation/rotate.mjs`: the executor (from `// ---- the executor`) writes `rotation.json` (the pending
  rotation), places the successor, waits for `session answered`, then ends the old session or abandons. If the detached
  executor dies after placing the successor, the successor runs on and `rotation.json` stays. A late `session answered`
  can still move the role while `placement.json` names the old head.
- `packages/session-host/contracts/rotation-files.v1.json` (the shape of `rotation.json`).
- Identity decides who holds a role. The existing rotation code asks it; reuse that call.
- `packages/distribution/contracts/doctor-registry.v1.json`: pointer rows (`"pointer": true`, for example
  `lock-holders`) and how a row of a Node layer is bridged. `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
  section 3 says when a pointer row may fail.
- `test/session-rotation/rotate.test.mjs`.

## Footprint

`src/session-rotation/rotate.mjs`, `test/session-rotation/rotate.test.mjs`,
`packages/session-host/contracts/rotation-files.v1.json`, `packages/distribution/contracts/doctor-registry.v1.json`,
`apps/fgos/src/wiring/doctor/**`, `docs/platform/session-host/spec.md`.

## Steps

1. Record the executor: `rotation.json` gains the executor's process identity (pid and start time, through the process
   door's existing record and judge, the same pair `head-request.mjs` uses for ticket runners). Add it to the contract.
2. Resolve on the normal path. Before `session rotate` takes the lineage's rotation lock, and before `session answered`
   records an answer, a `rotation.json` whose executor is judged dead is resolved first:
   - Identity names the successor as role holder: complete the rotation. Placement follows the holder, the old head is
     ended, the record is removed.
   - Otherwise: abandon it. The successor is ended, the record is removed, and a late `session answered` is refused
     `no-rotation-pending`, as today.
   Each outcome appends one line to the lineage's rotation record with `resolved-orphan` and the outcome.
3. Doctor: one read-only pointer row ("N pending rotations with a dead executor, resolved on the lineage's next rotate
   or answer"). It warns and never repairs, registered the way existing pointer rows are. If registering it needs a file
   outside this footprint, stop and report.
4. Tests in `rotate.test.mjs`: an executor that died after placing the successor, with Identity naming the successor,
   completes on the next `session rotate`; with Identity naming the old head, it abandons, and a late `session answered`
   is refused. Use the test's existing fake ports for process judge and Identity.
5. Docs: the rotation section of `docs/platform/session-host/spec.md` gains the rule.

## Verify

`node scripts/run-tests.mjs test/session-rotation/rotate.test.mjs` passes, and `fgos doctor --json` lists the pointer
row.

## Rollback

Revert the phase commit. The new `rotation.json` field is optional to readers, so an older record still parses.
