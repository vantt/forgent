// The Node Execution seam over the host's Execution operations (`src/native/execution-door.mjs` over
// `fgos internal execution`, FGOS_HOST_BIN built from this checkout): the call reaches the route and its answer
// comes back as the door's result, a refused unit run is rethrown as its class, a refused session launch as the
// error Node's launch threw, and the caller's case admission port is served over the child's pipes. The
// operations' outcomes are owned by the route's Rust proofs.
import '../helpers/process-tmp-root.mjs';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executionOp, runUnitInHost, launchSessionInHost, RunnerConfigError, ExecutionRouteError } from '../../src/native/execution-door.mjs';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-execution-door-'));
const savedHome = process.env.HOME;
before(() => {
  // The host child inherits this environment: its state stays in the scratch home.
  process.env.HOME = path.join(scratch, 'home');
  fs.mkdirSync(process.env.HOME, { recursive: true });
});
after(() => {
  process.env.HOME = savedHome;
  fs.rmSync(scratch, { recursive: true, force: true });
});

test('executionOp answers with the result of the host operation', async () => {
  assert.ok(process.env.FGOS_HOST_BIN, 'set FGOS_HOST_BIN to a host built from this checkout (run-tests does)');
  const result = await executionOp('sweep-attempts', { assignmentsRoot: scratch }, { cwd: scratch });
  assert.deepEqual(result, { adopt: [], adoptError: null });
  await assert.rejects(executionOp('sweep-attempts', {}, { cwd: scratch }), (err) => err instanceof ExecutionRouteError && err.code === 'invalid-request');
});

test('executionOp serves the caller\'s case admission port to the operation', { skip: process.platform === 'win32' && 'the verify command is a POSIX shell line' }, async () => {
  const fgosDir = path.join(scratch, 'fgos');
  const worktree = path.join(scratch, 'tree');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.mkdirSync(worktree, { recursive: true });
  const asked = [];
  const caseAdmission = {
    admit: (proposal) => {
      asked.push(proposal);
      return { refused: { code: 'case-admission-busy', condition: 'busy' } };
    },
  };
  const result = await executionOp('custody', { fgosDir, worktree, admit: { unitRunId: 'g-1' }, verify: { command: 'true' } }, { cwd: scratch, caseAdmission });
  assert.deepEqual(asked, [{ unitRunId: 'g-1' }]);
  assert.equal(result.admission.refused.code, 'case-admission-busy');
  assert.equal(result.verified, undefined);
});

test('runUnitInHost rethrows a refused unit run as the class its result names', async () => {
  const created = [];
  await assert.rejects(
    runUnitInHost({ cwd: scratch, unitData: { id: 'u1', capability: 'execute', writes: [] } }, { onUnitRunCreated: (id) => created.push(id) }),
    (err) => err instanceof RunnerConfigError && /objective/.test(err.message),
  );
  assert.deepEqual(created, []);
});

test('launchSessionInHost rethrows a refused launch with the code and message Node\'s launch threw', async () => {
  const projectRoot = path.join(scratch, 'project');
  const used = path.join(projectRoot, '.fgos', 'assignments', 'head-planner-p-1', 'runs', '01');
  fs.mkdirSync(used, { recursive: true });
  fs.writeFileSync(path.join(used, 'envelope.json'), '{}');
  const request = {
    binding: { executor: 'stub' }, runnerConfig: {}, key: 'head-planner-p-1', role: 'head:planner-p',
    grant: { verbs: [], writes: [], mailbox: false, peers: false }, opening: 'hello', ceilingMs: 60000,
    env: { FGOS_HEAD_PERSONA: 'planner' }, projectRoot, beside: null, display: { id: 'p', title: 'planner' },
  };
  await assert.rejects(launchSessionInHost(request), (err) => err.name === 'SessionLaunchError' && err.code === 'head-key-used' && /used once/.test(err.message));
});
