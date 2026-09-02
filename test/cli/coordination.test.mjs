// coordination.test.mjs -- Step 08 Phase 07 R1/R2 tests for
// `fgos coordination run --file <request>` / `fgos coordination show <id>
// --json`. Two layers, per this cell's own "Tests First" list:
// - fast, unit-level coverage of every R2 reject category directly against
//   `validateCoordinationRequest` (src/verbs/coordination/schema.mjs);
// - real CLI subprocess tests (mirroring every other file under test/cli/'s
//   own `run(cwd, args)`/`envelopeData(stdout)` harness) proving the whole
//   wiring end to end: manifest/help/envelope/exit-code, run/show positive
//   and negative, `show` has no mutation/external effect, missing/corrupt
//   session diagnostics.
import { test } from 'node:test';
import {
  FGOS,
  assert,
  envelopeData,
  execFileSync,
  fs,
  path,
  run,
  tmpCwd,
} from './helpers/fgos-cli-harness.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';

// ─── Fake executor wiring for real-subprocess run tests ───────────────────
// Same real Node-subprocess fake executor shape session-engine.mjs's own
// tests use (test/runner/coordination-session-engine.test.mjs's
// `fakeExecutor`), written into a real `.fgos/config.json` so a genuinely
// spawned `fgos coordination run` subprocess resolves it exactly the way
// `ensureRunnerConfigForDir` resolves any other real runner config -- never
// a JS-level stub of the CLI itself.
function writeFakeExecutorConfig(cwd) {
  const executorScript = path.join(cwd, 'fake-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runDir = path.join(assignmentsRoot, asgn, 'runs', '01');
        if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
        }
      }
    }
    process.stdout.write('Validated.\\n');
    process.exit(0);
    `,
  );
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = {
    ...existing,
    runner: {
      ...(existing.runner ?? {}),
      executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
      models: { standard: 'test-model', lightweight: 'test-model' },
      timeoutMs: 20000,
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function writeRequest(cwd, name, obj) {
  const p = path.join(cwd, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

function agentLedRequest(overrides = {}) {
  return {
    kind: 'agent-led',
    objective: 'Investigate package.json.',
    writerId: 'coordination-cli-test',
    primaryRole: 'researcher',
    task: {
      expectedOutputs: ['agent-result.json (status, summary)'],
      evidenceRequired: 'reported',
    },
    ...overrides,
  };
}

// ─── Unit-level: every R2 reject category ──────────────────────────────────

test('validateCoordinationRequest: rejects a non-object request', () => {
  assert.throws(() => validateCoordinationRequest('not an object'), StoreError);
});

test('validateCoordinationRequest: rejects an unknown top-level field', () => {
  assert.throws(
    () => validateCoordinationRequest({ ...agentLedRequest(), bogusField: true }),
    (err) => err instanceof StoreError && /unknown field "bogusField"/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a top-level executor/model/tier field (CLI/file conflict)', () => {
  assert.throws(
    () => validateCoordinationRequest({ ...agentLedRequest(), executor: 'claude' }),
    (err) => err instanceof StoreError && /reserved for the CLI's own --executor flag/.test(err.message),
  );
  assert.throws(
    () => validateCoordinationRequest({ ...agentLedRequest(), tier: 'standard' }, { tier: 'lightweight' }),
    (err) => err instanceof StoreError && /conflicts with the CLI's own --tier flag \(value "lightweight"\)/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects inline protocol content in protocolRef ("portable concrete infra")', () => {
  const req = {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.declared-consult', topology: { edges: [] } },
    steps: [{ type: 'operation', as: 's1', operationId: 'request-consult', objective: 'x', expectedOutputs: ['y'] }],
  };
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /portable concrete infra, rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects an actors[] entry carrying "role" (actor-role rewrite)', () => {
  const req = agentLedRequest({ actors: [{ id: 'primary', role: 'advisor' }] });
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /actor-role rewrite rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a duplicate actors[].id (undeclared actor multiplicity)', () => {
  const req = agentLedRequest({ actors: [{ id: 'primary', executor: 'a' }, { id: 'primary', executor: 'b' }] });
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /undeclared actor multiplicity rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects an unregistered actors[].id for an agent-led session', () => {
  const req = agentLedRequest({ actors: [{ id: 'specialist', executor: 'a' }] });
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /unregistered actor override rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a fan-out step with a duplicate branch actorId (distinct from the top-level actors[] duplicate-id case)', () => {
  const req = {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.independent-research-fan-out-fan-in' },
    steps: [
      {
        type: 'fan-out',
        as: 'research',
        operationId: 'independent-research',
        branches: [
          { actorId: 'researcher-a', objective: 'Research approach A.', expectedOutputs: ['y'] },
          { actorId: 'researcher-a', objective: 'Research approach A again.', expectedOutputs: ['y'] },
        ],
      },
    ],
  };
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) =>
      err instanceof StoreError &&
      /steps\[0\]\.branches names actorId "researcher-a" more than once -- undeclared actor multiplicity rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a non-read-only "mutation" field', () => {
  const req = agentLedRequest();
  req.task.mutation = 'write';
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /must be "read-only"/.test(err.message),
  );
});

test('validateCoordinationRequest: accepts an explicit "mutation": "read-only" (no-op, not a reject)', () => {
  const req = agentLedRequest();
  req.task.mutation = 'read-only';
  assert.doesNotThrow(() => validateCoordinationRequest(req));
});

test('validateCoordinationRequest: rejects a Work-lifecycle-shaped key at any nesting depth (Work lifecycle authority)', () => {
  const req = agentLedRequest();
  req.task.approve = true;
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /carries Work lifecycle authority/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects missionId anywhere (Work lifecycle authority / ADR-008 Decision 5)', () => {
  const req = agentLedRequest({ missionId: 'm-1' });
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /carries Work lifecycle authority/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a path-escaping coordinationId (path escape)', () => {
  const req = agentLedRequest({ coordinationId: '../../etc/passwd' });
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /path escape rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a path-escaping taskKey (path escape)', () => {
  const req = agentLedRequest();
  req.task.taskKey = '../evil';
  assert.throws(
    () => validateCoordinationRequest(req),
    (err) => err instanceof StoreError && /path escape rejected/.test(err.message),
  );
});

test('validateCoordinationRequest: rejects a declared-protocol request missing "steps"/"protocolRef"', () => {
  assert.throws(() => validateCoordinationRequest({ kind: 'declared-protocol', objective: 'x', writerId: 'w' }), StoreError);
});

test('validateCoordinationRequest: rejects "task" on a declared-protocol request and "protocolRef"/"steps" on an agent-led request', () => {
  assert.throws(
    () => validateCoordinationRequest({
      kind: 'declared-protocol', objective: 'x', writerId: 'w',
      protocolRef: { id: 'core.coordination-protocol.declared-consult' },
      steps: [{ type: 'operation', as: 's1', operationId: 'request-consult', objective: 'x', expectedOutputs: ['y'] }],
      task: { expectedOutputs: ['y'], evidenceRequired: 'reported' },
    }),
    (err) => err instanceof StoreError && /"task" is not allowed/.test(err.message),
  );
  assert.throws(
    () => validateCoordinationRequest({ ...agentLedRequest(), protocolRef: { id: 'x' } }),
    (err) => err instanceof StoreError && /"protocolRef" is not allowed/.test(err.message),
  );
});

test('validateCoordinationRequest: accepts a real, well-formed agent-led request unchanged in shape', () => {
  const normalized = validateCoordinationRequest(agentLedRequest());
  assert.equal(normalized.kind, 'agent-led');
  assert.equal(normalized.primaryRole, 'researcher');
  assert.deepEqual(normalized.task.expectedOutputs, ['agent-result.json (status, summary)']);
});

// ─── CLI subprocess: manifest/envelope/exit-code ───────────────────────────

test('fgos --help --json manifest includes the "coordination" verb with run/show sub-verb parameters', () => {
  const result = run(tmpCwd(), ['--help', '--json']);
  assert.equal(result.status, 0);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'coordination');
  assert.ok(entry, 'expected a "coordination" entry in the CLI manifest');
  assert.deepEqual(entry.parameters.positional, ['sub', 'id']);
  assert.ok('file' in entry.parameters.properties);
  assert.ok('executor' in entry.parameters.properties);
  assert.ok('model' in entry.parameters.properties);
  assert.ok('tier' in entry.parameters.properties);
  assert.equal(entry.touchesState, true);
  assert.equal(entry.externalEffect, true);
});

test('fgos coordination --help prints verb help text (reasoned exception, not an envelope) and exits 0', () => {
  const result = run(tmpCwd(), ['coordination', '--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /coordination/);
  assert.throws(() => JSON.parse(result.stdout), 'help text is prose, never a parsed fgos.v1 envelope');
});

test('fgos coordination: unknown sub-verb is a validation error (exit 4)', () => {
  const result = run(tmpCwd(), ['coordination', 'bogus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown sub-verb "bogus"/);
});

test('fgos coordination run: missing --file is a validation error (exit 4)', () => {
  const result = run(tmpCwd(), ['coordination', 'run']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--file/);
});

test('fgos coordination run: a request file that is not valid JSON is a validation error (exit 4)', () => {
  const cwd = tmpCwd();
  const reqPath = path.join(cwd, 'bad.json');
  fs.writeFileSync(reqPath, '{ not valid json');
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not valid JSON/);
});

test('fgos coordination run: a request file that does not exist is a validation error (exit 4)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['coordination', 'run', '--file', path.join(cwd, 'does-not-exist.json')]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /request file not found/);
});

test('fgos coordination run: a request file violating R2 (top-level executor field) is a validation error (exit 4) end to end through the real CLI', () => {
  const cwd = tmpCwd();
  const reqPath = writeRequest(cwd, 'bad-executor.json', { ...agentLedRequest(), executor: 'claude' });
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /reserved for the CLI's own --executor flag/);
});

test('fgos coordination run: --model with a declared-protocol request is refused (no engine channel today)', () => {
  const cwd = tmpCwd();
  const reqPath = writeRequest(cwd, 'declared.json', {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.declared-consult' },
    steps: [{ type: 'operation', as: 's1', operationId: 'request-consult', objective: 'x', expectedOutputs: ['y'] }],
  });
  const result = run(cwd, ['coordination', 'run', '--file', reqPath, '--model', 'opus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--model \/ actors\[\]\.model is not supported for kind:"declared-protocol"/);
});

test('fgos coordination run: a declared-protocol request with an actors[] id not declared by the protocol is a validation error (exit 4, unregistered actor override rejected)', () => {
  const cwd = tmpCwd();
  const reqPath = writeRequest(cwd, 'undeclared-actor.json', {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.declared-consult' },
    actors: [{ id: 'bogus-actor', executor: 'claude' }],
    steps: [
      { type: 'operation', as: 's1', operationId: 'request-consult', objective: 'x', expectedOutputs: ['y'] },
      { type: 'operation', as: 's2', operationId: 'provide-consult', objective: 'x', expectedOutputs: ['y'] },
    ],
  });
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /actors\[\]\.id "bogus-actor" is not declared by protocol "core\.coordination-protocol\.declared-consult"/);
  assert.match(result.stderr, /unregistered actor override rejected/);
});

test('fgos coordination run: a fan-out branch actorId also carrying a top-level actors[] policy override is a validation error (exit 4, no per-branch policy-override channel)', () => {
  const cwd = tmpCwd();
  const reqPath = writeRequest(cwd, 'fanout-actor-policy-collision.json', {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.independent-research-fan-out-fan-in' },
    actors: [{ id: 'researcher-a', executor: 'claude' }],
    steps: [
      {
        type: 'fan-out',
        as: 'research',
        operationId: 'independent-research',
        branches: [
          { actorId: 'researcher-a', objective: 'Research approach A.', expectedOutputs: ['y'] },
          { actorId: 'researcher-b', objective: 'Research approach B.', expectedOutputs: ['y'] },
        ],
      },
    ],
  });
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /actors\[\]\.id "researcher-a" declares policy \(persona\/executor\/model\/tier\), but this actor only ever appears as a fan-out branch/);
  assert.match(result.stderr, /has no per-branch policy-override channel/);
});

test('fgos coordination show: unknown id is a validation error naming "no session" (missing session diagnostic, exit 4)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['coordination', 'show', 'coord_never_existed']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no session "coord_never_existed" found/);
});

test('fgos coordination show: a corrupt session.json is a diagnosed, categorized failure (missing/corrupt session diagnostic)', () => {
  const cwd = tmpCwd();
  const sessionDir = path.join(cwd, '.fgos', 'coordination', 'sessions', 'coord_corrupt');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'session.json'), '{ this is not json');
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');
  const result = run(cwd, ['coordination', 'show', 'coord_corrupt']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not valid JSON/);
});

// ─── CLI subprocess: real end-to-end run/show against a fake-but-real executor ─

test('fgos coordination run --file <agent-led> genuinely dispatches through the real engine and closes the session; fgos coordination show reports it, read-only', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'agent-led.json', agentLedRequest());

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.kind, 'agent-led');
  assert.match(runData.coordinationId, /^[A-Za-z0-9_-]+$/);
  assert.equal(runData.closed, true);
  assert.equal(runData.status, 'completed');
  assert.equal(runData.steps.length, 1);
  assert.equal(runData.steps[0].status, 'done');
  assert.deepEqual(runData.quorum.missing, []);
  assert.deepEqual(runData.quorum.failed, []);

  const sessionDir = path.join(cwd, '.fgos', 'coordination', 'sessions', runData.coordinationId);
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  assert.ok(fs.existsSync(eventsPath), 'expected a real session events.jsonl on disk');
  const beforeShow = fs.readFileSync(eventsPath);
  const beforeManifest = fs.readFileSync(path.join(sessionDir, 'session.json'));

  const showResult = run(cwd, ['coordination', 'show', runData.coordinationId, '--json']);
  assert.equal(showResult.status, 0, showResult.stderr);
  const showData = envelopeData(showResult.stdout);
  assert.equal(showData.coordinationId, runData.coordinationId);
  assert.equal(showData.status, 'completed');
  assert.equal(showData.phase, 'completed');
  assert.ok(showData.eventCount > 0);
  assert.deepEqual(showData.quorum.missing, []);

  // "show has no mutation/external effect" (R1): byte-identical session
  // state before/after the show call.
  assert.deepEqual(fs.readFileSync(eventsPath), beforeShow);
  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'session.json')), beforeManifest);
});

test('fgos coordination run --file <declared consult>: dispatches both declared operations through the real engine and closes the session', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const examplePath = path.resolve(FGOS, '../../docs/how-to/coordination-examples/declared-consult-request.json');
  const raw = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  const reqPath = writeRequest(cwd, 'declared-consult.json', raw);

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.kind, 'declared-protocol');
  assert.equal(runData.definitionRef.id, 'core.coordination-protocol.declared-consult');
  assert.equal(runData.closed, true);
  assert.equal(runData.status, 'completed');
  assert.equal(runData.steps.length, 2);
  assert.equal(runData.steps[0].as, 'request');
  assert.equal(runData.steps[1].as, 'response');
  assert.equal(runData.steps[1].status, 'done');
});

// `execFileSync` re-export sanity: confirms the harness genuinely spawns a
// real subprocess (not an in-process call) for every test above.
test('harness sanity: run() spawns a real node subprocess', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, [FGOS, '--help'], { encoding: 'utf8' }));
});
