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

## Added 2026-11-22 09:08 (owner-approved): the rotation Stop hook runs in a confined head

Reported by lead:SUPERVISOR from the owner: the automatic rotation path fires for no head. No `stop-trace.jsonl` existed
under any `.fgos/runtime/session-rotation/<lineage>/`, although `2c10a76a4` (2026-11-21 07:48) makes every head Stop
append one there (`apps/fgos/src/wiring/session_rotation_hook.rs`, `recordStopTrace` and `STOP_TRACE_FILE` in
`src/session-rotation/rotate.mjs`). The last `rotation.log` line anywhere is secretary-miu gen 20 (2026-11-21 09:38
local); Miu's next generations ran for many hours with no decision. The secretary cannot measure her own context, so the
Stop hook is the only path.

Evidence the lead gathered (2026-11-22 09:14):

- The Stop entry exists in `.claude/settings.json` (since `728942829`):
  `"$S" hook session-rotation --event stop || true`, timeout 80, where `S=${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos`.
- Run by hand from inside this confined lead with a minimal payload, the same command exits 0 and writes
  `lineage lead-forgent-261122-0118-heads-b52f9/stop-trace.jsonl` (`decision: no-measure`, 02:14:02Z). So the shim, the
  activated host, the request socket and the host's trace write all work from a confined head.
- The hook prints its failures to stderr only, and `|| true` plus exit 0 hides them: a Stop that fails leaves no trace
  and no visible error. The confined home (`CLAUDE_CONFIG_DIR`) is per dispatch, so its transcript is the only place a
  hook error is recorded.
- Live data point: this lead's own turn-end Stop after 02:14Z either adds a second line to its `stop-trace.jsonl` or it
  does not. The lead reads it at its next wake and records the result here.

Steps:

6. Prove it live: in a confined head, a real Stop (not a hand call) appends to `stop-trace.jsonl`, and a stop whose
   measure is at or above soft asks for and starts a rotation. Read the head's transcript for the Stop hook's recorded
   output to find where a real Stop differs from the hand call: hook not run, killed by its timeout, stdin payload shape
   (`transcript_path`, `session_id`), measure, config, or the socket ask.
7. Fix the cause on the hook's normal path, and make a failing Stop visible: a hook failure leaves an incident line in
   the lineage (`incidents.jsonl`, the existing best-effort writer), not only stderr.
8. Owning proof at the lowest layer that observes the cause, and the live proof is one row of phase 11's probe.

If the cause lies outside this phase's footprint (for example `session_rotation_hook.rs`,
`packages/session-host/rust/src/rotation/measure.rs` or `.claude/settings.json`), stop and report the exact files; the
lead asks the supervisor to widen the plan footprint before the fix unit runs.

## Verify

`node scripts/run-tests.mjs test/session-rotation/rotate.test.mjs` passes, and `fgos doctor --json` lists the pointer
row. A confined head's real Stop appends to its `stop-trace.jsonl`, and a stop at soft rotates.

## Rollback

Revert the phase commit. The new `rotation.json` field is optional to readers, so an older record still parses.
