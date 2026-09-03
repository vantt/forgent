// coordination-launch-master-loop.test.mjs -- MVP4 (Step 09, Phase 02) R1-R4
// proof for the thin `standalone-master-coordination-loop` launcher
// (src/verbs/coordination/launch-master-loop.mjs).
//
// What this proves, and only this: the launcher composes the SAME shape a
// hand-authored request file already uses (P03.2's own live-proof request,
// test/verbs/coordination-run-live-proof.test.mjs), reuses schema.mjs's
// existing validation for every reject category that validator already
// covers, adds exactly one genuinely launcher-specific check (plan/artifact
// path existence -- schema.mjs never touches the filesystem) plus one
// optional fixture-version guard (protocolRef has no version field at all),
// and never emits an authorize/disposition/revise/recheck step -- so a
// driver-authorized operation can never be reached through this surface
// without a hand-composed follow-up request carrying the same `authorize`
// step shape `run.mjs` already requires of anyone.

import { test } from 'node:test';
import { assert, envelopeData, fs, path, run, tmpCwd } from '../cli/helpers/fgos-cli-harness.mjs';
import { buildMasterLoopRequest, launchMasterLoopUseCase, MASTER_LOOP_PROTOCOL_ID, describeNextAction } from '../../src/verbs/coordination/launch-master-loop.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { readManifest, readSessionEvents } from '../../src/runner/coordination/store.mjs';

const WRITER_ID = 'master-loop-launcher-test';

function writeFakeExecutorConfig(cwd) {
  const executorScript = path.join(cwd, 'fake-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
          }
        }
      }
    }
    process.stdout.write('Validated.\\n');
    process.exit(0);
    `,
  );
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        ...existing,
        runner: {
          ...(existing.runner ?? {}),
          executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
          models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
          timeoutMs: 20000,
        },
      },
      null,
      2,
    ),
  );
}

function writePlanFile(cwd) {
  const planPath = path.join(cwd, 'plan.md');
  fs.writeFileSync(planPath, '# Plan\nDo the thing.\n');
  return planPath;
}

// ---------------------------------------------------------------------
// R1: shape equivalence against a hand-authored request (P03.2's own
// live-proof request shape, first-pass steps only).
// ---------------------------------------------------------------------

test('buildMasterLoopRequest composes the same normalized shape a hand-authored first-pass request already uses', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);

  const built = buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID });
  const normalized = validateCoordinationRequest(built);

  const handAuthored = {
    kind: 'declared-protocol',
    objective: 'Ship the thing.',
    writerId: WRITER_ID,
    protocolRef: { id: MASTER_LOOP_PROTOCOL_ID },
    steps: [
      { type: 'operation', as: 'produce', operationId: 'produce-candidate', objective: 'irrelevant for shape', expectedOutputs: ['x'], contextRefs: [] },
      { type: 'operation', as: 'review', operationId: 'review-candidate', objective: 'irrelevant for shape', expectedOutputs: ['x'], contextRefs: ['$ref:produce'] },
      { type: 'operation', as: 'red-team', operationId: 'red-team-candidate', objective: 'irrelevant for shape', expectedOutputs: ['x'], contextRefs: ['$ref:produce'] },
    ],
  };
  const normalizedHandAuthored = validateCoordinationRequest(handAuthored);

  assert.equal(normalized.kind, normalizedHandAuthored.kind);
  assert.deepEqual(normalized.protocolRef, normalizedHandAuthored.protocolRef);
  assert.deepEqual(
    normalized.steps.map((s) => ({ type: s.type, as: s.as, operationId: s.operationId, contextRefs: s.contextRefs, targetActorId: s.targetActorId })),
    normalizedHandAuthored.steps.map((s) => ({ type: s.type, as: s.as, operationId: s.operationId, contextRefs: s.contextRefs, targetActorId: s.targetActorId })),
  );
  // The plan path travels in objective text, never as a contextRef (a raw
  // path fails schema.mjs's safe-ref charset) -- assert it actually got in.
  assert.match(normalized.steps[0].objective, /plan\.md/);
});

test('the launcher never emits an authorize, disposition, revise, or recheck step -- only the fixture\'s required first pass', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID });

  assert.deepEqual(built.steps.map((s) => s.type), ['operation', 'operation', 'operation']);
  assert.deepEqual(
    built.steps.map((s) => s.operationId),
    ['produce-candidate', 'review-candidate', 'red-team-candidate'],
  );
  for (const forbidden of ['revise-candidate', 'reviewer-recheck', 'red-team-recheck']) {
    assert.ok(!built.steps.some((s) => s.operationId === forbidden), `must never emit a step for driver-authorized operation "${forbidden}"`);
  }
});

// ---------------------------------------------------------------------
// R4: bad file path (genuinely launcher-specific -- schema.mjs has no
// filesystem access).
// ---------------------------------------------------------------------

test('R4: a plan/artifact path that does not exist on disk fails actionably, before any request is composed', () => {
  const cwd = tmpCwd();
  assert.throws(
    () => buildMasterLoopRequest({ cwd }, { planPath: 'does-not-exist.md', objective: 'Ship the thing.', writerId: WRITER_ID }),
    (err) => err instanceof StoreError && /plan\/artifact path "does-not-exist\.md" does not exist/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R4: unknown fixture id/version.
// ---------------------------------------------------------------------

test('R4: an expected fixture version that does not match the registered fixture fails actionably (genuinely launcher-specific -- protocolRef carries no version field at all)', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  assert.throws(
    () => buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID, expectedFixtureVersion: '9.9.9' }),
    (err) => err instanceof StoreError && /registered at version "1\.0\.0", not the expected "9\.9\.9"/.test(err.message),
  );
});

test('R4: a request naming an unregistered fixture id is refused end to end by the same reused loadCoordinationProtocol check run.mjs already has (no shortcut, no duplicated check)', async () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID });
  built.protocolRef = { id: 'core.coordination-protocol.does-not-exist' };

  await assert.rejects(
    runCoordinationUseCase({ cwd, repoRoot: cwd }, { requestObject: built }),
    (err) => /no CoordinationProtocol definition found for id/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R4: missing objective (reused, not duplicated: schema.mjs's own check).
// ---------------------------------------------------------------------

test('R4: a missing objective fails actionably through the existing schema.mjs check, not a launcher-owned duplicate', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest({ cwd }, { planPath, writerId: WRITER_ID });
  assert.throws(
    () => validateCoordinationRequest(built),
    (err) => err instanceof StoreError && /"objective" must be a non-empty string/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R4: invalid bounds (reused schema.mjs check).
// ---------------------------------------------------------------------

test('R4: an invalid aggregateBounds value fails actionably through the existing schema.mjs check', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest(
    { cwd },
    { planPath, objective: 'Ship the thing.', writerId: WRITER_ID, aggregateBounds: { maxAssignments: -1 } },
  );
  assert.throws(
    () => validateCoordinationRequest(built),
    (err) => err instanceof StoreError && /aggregateBounds\.maxAssignments must be a positive finite number/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R4: forbidden context ref (reused schema.mjs check) -- exactly why the
// plan path itself travels in objective text and never as a contextRef.
// ---------------------------------------------------------------------

test('R4: a caller-supplied context ref outside the safe charset (e.g. a raw path) fails actionably through the existing schema.mjs check', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest(
    { cwd },
    { planPath, objective: 'Ship the thing.', writerId: WRITER_ID, contextRefs: ['/etc/passwd'] },
  );
  assert.throws(
    () => validateCoordinationRequest(built),
    (err) => err instanceof StoreError && /path escape rejected/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R4: Work fields -- the composed request has no passthrough for them, and
// the shared validator still catches one at any nesting depth even if the
// object were tampered with after composition.
// ---------------------------------------------------------------------

test('R4: a Work-lifecycle field, if added onto the composed request, is still refused by the shared Work-boundary scan (the launcher introduces no bypass)', () => {
  const cwd = tmpCwd();
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID });
  built.workStatus = 'done';
  assert.throws(
    () => validateCoordinationRequest(built),
    (err) => err instanceof StoreError && /Work lifecycle authority/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// "cannot dispatch a driver-authorized operation directly": even a request
// this launcher's own output was extended with (a bare operation step, no
// authorize step) is refused by the SAME gate any hand-authored request
// would hit -- no shortcut exists anywhere in this surface.
// ---------------------------------------------------------------------

test('a driver-authorized operation appended to the launcher\'s own request, with no authorize step, is refused by the same gate a hand-authored request would hit', async () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const planPath = writePlanFile(cwd);
  const built = buildMasterLoopRequest({ cwd }, { planPath, objective: 'Ship the thing.', writerId: WRITER_ID, coordinationId: 'coord_launcher_no_shortcut' });
  built.steps.push({
    type: 'operation',
    as: 'revise',
    operationId: 'revise-candidate',
    objective: 'Attempt to revise without authorization.',
    expectedOutputs: ['x'],
    contextRefs: ['$ref:produce'],
  });

  await assert.rejects(
    runCoordinationUseCase({ cwd, repoRoot: cwd }, { requestObject: built }),
    (err) => /declares activation\.mode "driver-authorized", and no unconsumed "operation-authorized" event/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// R1/R2 end to end, live: the launcher reaches the real runtime through
// the one existing door, dispatches exactly the required first pass, and
// -- because it never authorizes the fixer's driver-authorized operation
// -- the session correctly cannot close to "completed" on its own (fixer
// is a required SessionActor per the manifest; this is the expected,
// honest outcome of a mechanical first-pass-only composer, not a defect).
// ---------------------------------------------------------------------

test('R1/R2 live: launchMasterLoopUseCase reaches the real runtime through runCoordinationUseCase and dispatches exactly the required first pass', async () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const planPath = writePlanFile(cwd);

  const data = await launchMasterLoopUseCase(
    { cwd, repoRoot: cwd },
    { planPath, objective: 'Ship the thing.', writerId: WRITER_ID, coordinationId: 'coord_launcher_live' },
  );

  assert.equal(data.kind, 'declared-protocol');
  assert.equal(data.definitionRef.id, MASTER_LOOP_PROTOCOL_ID);
  assert.deepEqual(
    data.steps.map((s) => [s.as, s.type]),
    [
      ['produce', 'operation'],
      ['review', 'operation'],
      ['red-team', 'operation'],
    ],
  );
  for (const step of data.steps) assert.equal(step.status, 'done');

  const manifest = readManifest('coord_launcher_live', { cwd, repoRoot: cwd });
  assert.equal(manifest.assignmentRefs.length, 3);
  const events = readSessionEvents('coord_launcher_live', { cwd, repoRoot: cwd });
  assert.equal(events.some((e) => e.type === 'operation-authorized'), false);
  assert.equal(events.some((e) => e.type === 'driver-disposition-recorded'), false);

  // Fixer is a required SessionActor on this manifest (all 4 fixture actors
  // are), and revise-candidate is driver-authorized -- never dispatched by
  // this mechanical composer -- so the session correctly does not
  // self-close to "completed". This is the honest boundary R5 (a resume/
  // follow-up-request door) picks up later, not a bug here.
  assert.equal(data.closed, false);
  assert.match(data.closeRefusalReason, /missing required actor\(s\) \[fixer\]/);

  // R5 (Step 09 Phase 02): the launcher's own output must always state the
  // coordination id and a concrete next action, without depending on chat
  // history -- assert the ACTUAL message content, not just that some
  // string exists.
  assert.match(data.nextAction, /coord_launcher_live/);
  assert.match(data.nextAction, /fgos coordination show coord_launcher_live/);
  assert.match(data.nextAction, /missing required actor\(s\) \[fixer\]/);
  assert.match(data.nextAction, /driver-authorized operation/);
  // Must not imply a resume/continue door exists -- that is explicitly
  // Phase 04/MVP5's own future work, not this cell's.
  assert.doesNotMatch(data.nextAction, /--resume/);
});

// `describeNextAction` is pure (no engine call) -- unit-tested directly for
// its other two branches, since the shipped fixture's 4-required-actor
// shape (§P00.1.md Frozen Scope) makes `closed: true` structurally
// unreachable through the real launcher today (the composer only ever
// dispatches 3 of the fixture's 4 required SessionActors) -- not a gap in
// this test, a fact about the fixture this launcher targets.
test('R5: describeNextAction states the coordination id and points at show when the session closed cleanly', () => {
  const message = describeNextAction({ coordinationId: 'coord_x', closed: true, closeRefusalReason: null });
  assert.match(message, /coord_x/);
  assert.match(message, /closed/);
  assert.match(message, /fgos coordination show coord_x/);
});

test('R5: describeNextAction states the coordination id even when closed is false with no refusal reason recorded', () => {
  const message = describeNextAction({ coordinationId: 'coord_y', closed: false, closeRefusalReason: null });
  assert.match(message, /coord_y/);
  assert.match(message, /fgos coordination show coord_y/);
  assert.doesNotMatch(message, /--resume/);
});

// ---------------------------------------------------------------------
// CLI wiring: `fgos coordination launch-master-loop` reaches the same
// module through bin/fgos.mjs.
// ---------------------------------------------------------------------

test('CLI: `fgos coordination launch-master-loop --plan --objective --writer-id` reaches the runtime and reports the first pass', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const planPath = writePlanFile(cwd);

  const result = run(cwd, [
    'coordination',
    'launch-master-loop',
    '--plan',
    planPath,
    '--objective',
    'Ship the thing.',
    '--writer-id',
    WRITER_ID,
    '--coordination-id',
    'coord_launcher_cli',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.coordinationId, 'coord_launcher_cli');
  assert.equal(data.definitionRef.id, MASTER_LOOP_PROTOCOL_ID);
  assert.deepEqual(data.steps.map((s) => s.as), ['produce', 'review', 'red-team']);
  // R5: the CLI's own JSON envelope carries the next-action message too,
  // not just the in-process return value.
  assert.match(data.nextAction, /coord_launcher_cli/);
  assert.match(data.nextAction, /fgos coordination show coord_launcher_cli/);
});

test('CLI: `fgos coordination launch-master-loop` without --plan fails actionably', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['coordination', 'launch-master-loop', '--objective', 'x', '--writer-id', WRITER_ID]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires --plan <path>/);
});

// ---------------------------------------------------------------------
// R4 regression: a relative `--plan` must resolve against the invoking
// shell's `process.cwd()` -- same basis `coordination run --file` already
// uses (`bin/fgos.mjs`'s `path.resolve(process.cwd(), filePath)`) -- not
// against `--dir`-derived `repoRootForCoordination`. Before this fix, a
// real, existing plan.md in the caller's own cwd was falsely rejected as
// "does not exist" once `--dir` pointed at a different repo root.
// ---------------------------------------------------------------------

test('CLI: a relative --plan resolves against process.cwd(), not --dir\'s repo root, so a real file in the caller\'s cwd is found', () => {
  const callerCwd = tmpCwd();
  const otherRepoRoot = tmpCwd();
  writeFakeExecutorConfig(otherRepoRoot);
  writePlanFile(callerCwd);

  const result = run(callerCwd, [
    'coordination',
    'launch-master-loop',
    '--dir',
    otherRepoRoot,
    '--plan',
    'plan.md',
    '--objective',
    'Ship the thing.',
    '--writer-id',
    WRITER_ID,
    '--coordination-id',
    'coord_launcher_cli_dir',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.coordinationId, 'coord_launcher_cli_dir');
  assert.deepEqual(data.steps.map((s) => s.as), ['produce', 'review', 'red-team']);
});
