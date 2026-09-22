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
  initGitCwdWithWorktree,
  os,
  path,
  run,
  tmpCwdFromTemplate,
} from './helpers/fgos-cli-harness.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';

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
      models: { standard: 'test-model', nano: 'test-model' },
      timeoutMs: 20000,
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Fake-executor variant for the R7 `--cwd` tests below: writes a REAL
// marker file into its own `process.cwd()` before settling the assignment
// -- proves the dispatched worker's own subprocess cwd genuinely is
// whatever `--cwd` resolved to (`assignment-runner.mjs`'s `executeAssignment`
// spawns the executor CLI with `cwd: opts.cwd`, never `opts.repoRoot` --
// confirmed by reading its own `executeExecutorCli(...)` call site, which
// passes `cwd` straight through). `assignmentsRoot` is taken as an
// EXPLICIT parameter, never derived from the worker's own `process.cwd()`
// the way `writeFakeExecutorConfig` above does -- because `.fgos/assignments/`
// always lives under repoRoot (Phase 01 R8), which genuinely diverges from
// the worker's own cwd in exactly the `--cwd` case these tests exercise
// (same reason test/runner/coordination-mutation-unlock.test.mjs's own
// `fakeExecutor` takes `assignmentsRoot` explicitly too).
function writeCwdMarkerExecutorConfig(repoRootDir, assignmentsRoot) {
  const executorScript = path.join(repoRootDir, 'fake-executor-cwd-marker.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    fs.writeFileSync(path.join(cwd, 'cwd-marker.txt'), cwd + '\\n');
    const assignmentsRoot = ${JSON.stringify(assignmentsRoot)};
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
  const configPath = path.join(repoRootDir, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = {
    ...existing,
    runner: {
      ...(existing.runner ?? {}),
      executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
      models: { standard: 'test-model', nano: 'test-model' },
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
    close: true, writerId: 'coordination-cli-test',
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
    () => validateCoordinationRequest({ ...agentLedRequest(), tier: 'standard' }, { tier: 'nano' }),
    (err) => err instanceof StoreError && /conflicts with the CLI's own --tier flag \(value "nano"\)/.test(err.message),
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
  const result = run(tmpCwdFromTemplate(), ['--help', '--json']);
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
  const result = run(tmpCwdFromTemplate(), ['coordination', '--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /coordination/);
  assert.throws(() => JSON.parse(result.stdout), 'help text is prose, never a parsed fgos.v1 envelope');
});

test('fgos coordination: unknown sub-verb is a validation error (exit 4)', () => {
  const result = run(tmpCwdFromTemplate(), ['coordination', 'bogus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown sub-verb "bogus"/);
});

test('fgos coordination run: missing --file is a validation error (exit 4)', () => {
  const result = run(tmpCwdFromTemplate(), ['coordination', 'run']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--file/);
});

test('fgos coordination run: a request file that is not valid JSON is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = path.join(cwd, 'bad.json');
  fs.writeFileSync(reqPath, '{ not valid json');
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not valid JSON/);
});

test('fgos coordination run: a request file that does not exist is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'run', '--file', path.join(cwd, 'does-not-exist.json')]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /request file not found/);
});

test('fgos coordination run: a request file violating R2 (top-level executor field) is a validation error (exit 4) end to end through the real CLI', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = writeRequest(cwd, 'bad-executor.json', { ...agentLedRequest(), executor: 'claude' });
  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /reserved for the CLI's own --executor flag/);
});

test('fgos coordination run: --model with a declared-protocol request is refused (no engine channel today)', () => {
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'show', 'coord_never_existed']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no session "coord_never_existed" found/);
});

test('fgos coordination show: a corrupt session.json is a diagnosed, categorized failure (missing/corrupt session diagnostic)', () => {
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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
  const cwd = tmpCwdFromTemplate();
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

test('fgos coordination run without close: true and without close step leaves the session active', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const req = agentLedRequest();
  delete req.close;
  const reqPath = writeRequest(cwd, 'agent-led-no-close.json', req);

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, false, 'response closed is false');

  const showResult = run(cwd, ['coordination', 'show', runData.coordinationId, '--json']);
  const showData = envelopeData(showResult.stdout);
  assert.equal(showData.status, 'active', 'show confirms session is active');
});

test('fgos coordination run with close: true explicitly closes the session', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const req = agentLedRequest({ writerId: 'test' });
  req.close = true;
  const reqPath = writeRequest(cwd, 'req.json', req);

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, true, 'response closed is true due to top-level close');
});

test('fgos coordination run with {"type": "close", "as": "closeSession"} step explicitly closes the session without top-level close: true', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const examplePath = path.resolve(FGOS, '../../docs/how-to/coordination-examples/declared-consult-request.json');
  const raw = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  delete raw.close;
  raw.steps.push({ type: 'close', as: 'closeSession' });
  const reqPath = writeRequest(cwd, 'declared-consult-close-step.json', raw);

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, true, 'response closed is true due to close step, not top-level flag');
  assert.equal(runData.status, 'completed');
});

test('fgos coordination close --file closes session or refuses cleanly on quorum/identity', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const reqNoClose = agentLedRequest({ writerId: 'driver-1' });
  delete reqNoClose.close;
  const reqNoClosePath = writeRequest(cwd, 'req-no-close.json', reqNoClose);
  const runResult = run(cwd, ['coordination', 'run', '--file', reqNoClosePath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);

  const closeReqWrongId = {
    kind: 'close',
    coordinationId: runData.coordinationId,
    authorizedBy: { type: 'operator', id: 'driver-2' },
  };
  const closeReqWrongIdPath = writeRequest(cwd, 'close-wrong.json', closeReqWrongId);
  const closeResWrong = run(cwd, ['coordination', 'close', '--file', closeReqWrongIdPath]);
  assert.notEqual(closeResWrong.status, 0);
  assert.match(closeResWrong.stderr, /identity|not the driver/i, 'refusal reason should mention identity');

  const closeReq = {
    kind: 'close',
    coordinationId: runData.coordinationId,
    authorizedBy: { type: 'operator', id: 'driver-1' },
  };
  const closeReqPath = writeRequest(cwd, 'close-req.json', closeReq);
  const closeRes = run(cwd, ['coordination', 'close', '--file', closeReqPath]);
  assert.equal(closeRes.status, 0, closeRes.stderr);
  const closeData = envelopeData(closeRes.stdout);
  assert.equal(closeData.closed, true, 'session closed via explicit close cli');
});

test('a disposition event like cell-closed does not self-close the session', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const req = {
    kind: 'declared-protocol',
    protocolRef: { id: 'core.coordination-protocol.declared-consult' },
    objective: 'Test disp step',
    actors: [{ id: 'consultant-actor' }],
    writerId: 'test',
    steps: [
      { type: 'disposition', as: 'closeCell', targetRef: 'unknown', disposition: 'cell-closed', rationale: 'audit state' }
    ]
  };
  const reqPath = writeRequest(cwd, 'req.json', req);
  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, false, 'session is NOT closed');

  const showResult = run(cwd, ['coordination', 'show', runData.coordinationId, '--json']);
  assert.equal(showResult.status, 0);
  const showData = envelopeData(showResult.stdout);
  assert.equal(showData.status, 'active');
  assert.ok(
    showData.dispositions?.some((d) => d.targetRef === 'unknown' && d.disposition === 'cell-closed'),
    'show must report the persisted cell-closed disposition',
  );

  const eventsFile = path.join(cwd, '.fgos/coordination/sessions', runData.coordinationId, 'events.jsonl');
  assert.ok(fs.existsSync(eventsFile), 'events.jsonl must exist');
  const eventsContent = fs.readFileSync(eventsFile, 'utf8');
  assert.match(
    eventsContent,
    /"type":"driver-disposition-recorded"/,
    'events.jsonl must persist driver-disposition-recorded event',
  );
  assert.match(
    eventsContent,
    /"disposition":"cell-closed"/,
    'persisted event must record disposition "cell-closed"',
  );
});

// ─── R7: `--cwd <path>` ─────────────────────────────────────────────────
//
// CORRECTED (Wave 1 integration fix, group-thinking-plan-loop): the two
// tests below used to assert that `--cwd` relocates WHERE `.fgos/` session
// state lives (under the `--cwd` worktree). That was true only against
// P02.1's own pre-merge worktree state, where `store.mjs`'s
// `resolveCoordinationPaths` still had the Phase 01 R8 bug (`fgosDir`
// keyed on raw `cwd` unconditionally, even when `opts.repoRoot` was
// explicitly passed). Once P01.1's R8 fix merged into this same branch,
// `resolveCoordinationPaths` ALWAYS honors `opts.repoRoot` for `fgosDir`
// when present -- and `bin/fgos.mjs`'s `coordination` case ALWAYS passes
// `repoRoot: repoRootForCoordination` explicitly, completely independent
// of `--cwd` (confirmed by reading both sites directly). So `--cwd` now
// has ZERO effect on where session/Assignment state lives; it only ever
// threads into `ctx.cwd`, which matters for OTHER things (the dispatched
// worker's own subprocess cwd; R3's worktree-vs-main-checkout mutation
// gate, `session-engine.mjs`'s `assertMutatingDispatchAllowed`). The two
// tests immediately below dispatch an agent-led (read-only) request, so
// they never touch a request step's `mutation` field at all -- see the
// "mutation: 'mutating' forwarding" tests further down this file for CLI
// coverage of `run.mjs` threading an operation step's own `mutation`
// field into `dispatchDeclaredOperation`.

test('fgos coordination run --cwd <worktree>: session/Assignment storage is governed by repoRoot (--dir), never relocated by --cwd (Phase 01 R8); ctx.cwd genuinely threads to the dispatched worker\'s own subprocess cwd instead, proven by a real marker file the worker writes into its own process.cwd()', () => {
  const { cwd: repoRootDir, worktreePath: worktreeDir } = initGitCwdWithWorktree();
  const assignmentsRoot = path.join(repoRootDir, '.fgos', 'assignments');
  writeCwdMarkerExecutorConfig(repoRootDir, assignmentsRoot);

  // (a) --cwd names a REAL linked worktree (not a bare mkdtemp dir --
  // R3-adjacent cwd/worktree resolution shells out to real git, so a
  // genuine `git worktree add` is the only fixture that can stand in for
  // it credibly, matching test/runner/coordination-mutation-unlock.test.mjs's
  // own established pattern).
  // Not asserted here: `run`'s own success/closed status. The worker's
  // marker write is a REAL, uncommitted change inside the (real) git
  // worktree, so R1's own pre-existing read-only-contract enforcement
  // (`classifyRunEvidence`, assignment-runner.mjs: a read-only-declared
  // Assignment that mutates repo state fails closed, confidence:
  // 'failed') correctly grades this dispatch as failed -- expected,
  // unrelated to what this test proves, and deliberately not worked
  // around by asserting a fake "verified" grading. What this test proves,
  // and only this: `ctx.cwd` really reached the dispatched worker's own
  // subprocess, and the session's own on-disk state stays repoRoot-
  // governed -- both direct filesystem assertions, not exit-code claims.
  const idWithCwd = 'coord_cwd_wiring_probe_worktree';
  const reqWithCwd = writeRequest(repoRootDir, 'agent-led-with-cwd.json', agentLedRequest({ coordinationId: idWithCwd }));
  run(repoRootDir, ['coordination', 'run', '--cwd', worktreeDir, '--file', reqWithCwd]);

  // ctx.cwd genuinely reached the dispatched worker: the marker it wrote
  // into its own process.cwd() landed under the --cwd worktree, never the
  // repo root -- a direct filesystem assertion, not an inferred claim.
  assert.ok(fs.existsSync(path.join(worktreeDir, 'cwd-marker.txt')), 'the dispatched worker\'s own subprocess cwd must be the --cwd worktree');
  assert.equal(fs.existsSync(path.join(repoRootDir, 'cwd-marker.txt')), false, '--cwd must not also leave the worker running against the repo root');

  // Phase 01 R8: session storage is governed by repoRoot regardless of
  // --cwd -- the session opens under the REPO ROOT's own .fgos/, never
  // the --cwd worktree's.
  assert.ok(
    fs.existsSync(path.join(repoRootDir, '.fgos', 'coordination', 'sessions', idWithCwd, 'session.json')),
    'the session must open under the repo root\'s own .fgos/, governed by repoRoot, not --cwd',
  );
  assert.equal(
    fs.existsSync(path.join(worktreeDir, '.fgos', 'coordination', 'sessions', idWithCwd)),
    false,
    '--cwd must never relocate session storage to the worktree',
  );

  // (b) The SAME kind of request dispatched with --cwd OMITTED: ctx.cwd
  // defaults to repoRootForCoordination -- the marker now lands under the
  // repo root instead, proving ctx.cwd really did switch between the two
  // calls (never a no-op flag that just happens to always resolve the
  // same way).
  const idWithoutCwd = 'coord_cwd_wiring_probe_no_cwd';
  const reqWithoutCwd = writeRequest(repoRootDir, 'agent-led-without-cwd.json', agentLedRequest({ coordinationId: idWithoutCwd }));
  const resultWithoutCwd = run(repoRootDir, ['coordination', 'run', '--file', reqWithoutCwd]);
  assert.equal(resultWithoutCwd.status, 0, resultWithoutCwd.stderr);
  assert.ok(fs.existsSync(path.join(repoRootDir, 'cwd-marker.txt')), 'omitting --cwd must default ctx.cwd to the repo root');
});

test('fgos coordination show --cwd <anything>: repoRoot (--dir), never --cwd, governs which session is read -- a session opened at the repo root reads identically whether --cwd names a real linked worktree, an unrelated directory, or is omitted entirely (Phase 01 R8: --cwd has zero storage/read-location effect)', () => {
  const { cwd: repoRootDir, worktreePath: worktreeDir } = initGitCwdWithWorktree();
  writeFakeExecutorConfig(repoRootDir);
  const coordinationId = 'coord_cwd_show_probe';
  const reqPath = writeRequest(repoRootDir, 'agent-led-show-cwd.json', agentLedRequest({ coordinationId }));
  const runResult = run(repoRootDir, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);

  const unrelatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-cwd-show-unrelated-'));

  for (const cwdFlag of [[], ['--cwd', worktreeDir], ['--cwd', unrelatedDir]]) {
    const showResult = run(repoRootDir, ['coordination', 'show', coordinationId, ...cwdFlag, '--json']);
    assert.equal(showResult.status, 0, showResult.stderr);
    assert.equal(envelopeData(showResult.stdout).coordinationId, coordinationId);
  }
});

test('fgos coordination run --file <request> with --cwd OMITTED behaves byte-identically to today: the session lands under the repo root\'s own .fgos/', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'agent-led-no-cwd.json', agentLedRequest());

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, true);

  const sessionManifest = path.join(cwd, '.fgos', 'coordination', 'sessions', runData.coordinationId, 'session.json');
  assert.ok(fs.existsSync(sessionManifest), 'omitting --cwd must default the working directory to the resolved repo root, exactly as before this flag existed');
});

// ─── mutation: "mutating" forwarding through the CLI run door ─────────────
//
// A declared `operation` step's own `mutation` field must reach
// `dispatchDeclaredOperation` (session-engine.mjs) through this real CLI
// subprocess, not just at the schema/engine layers already covered by
// test/runner/coordination-mutation-unlock.test.mjs. `run.mjs` forwards
// `step.mutation` into the dispatch call only when the field is present,
// so a request that omits it stays byte-identical to every pre-existing
// caller (implicit `'read-only'` default).

test('fgos coordination run --file <declared operation step, mutation:"mutating", result.kind:"work-product">, --cwd <linked worktree>: the request\'s mutation field reaches dispatchDeclaredOperation, so a real work-product mutation grades done/verified instead of being fail-closed by the read-only gate, and the persisted Assignment record itself carries mutation:"mutating"', () => {
  const { cwd: repoRootDir, worktreePath: worktreeDir } = initGitCwdWithWorktree();
  const assignmentsRoot = path.join(repoRootDir, '.fgos', 'assignments');
  writeCwdMarkerExecutorConfig(repoRootDir, assignmentsRoot);

  const req = {
    kind: 'declared-protocol',
    objective: 'Prove a request step\'s mutation field reaches the engine through the CLI run door.',
    close: true, writerId: 'coordination-cli-test',
    protocolRef: { id: 'core.coordination-protocol.standalone-master-coordination-loop' },
    steps: [
      {
        type: 'operation',
        as: 'produce',
        operationId: 'produce-candidate',
        targetActorId: 'doer',
        objective: 'Produce a real work-product artifact.',
        expectedOutputs: ['cwd-marker.txt'],
        mutation: 'mutating',
      },
    ],
  };
  const reqPath = writeRequest(repoRootDir, 'mutating-produce-candidate.json', req);

  const runResult = run(repoRootDir, ['coordination', 'run', '--cwd', worktreeDir, '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(
    runData.steps[0].status,
    'done',
    `a mutating dispatch with real external evidence must grade "done", not fail-closed by the read-only gate; got ${JSON.stringify(runData.steps[0])}`,
  );
  assert.equal(runData.steps[0].confidence, 'verified');

  // Real external evidence: the worker's own marker file landed in the
  // worktree the dispatch actually ran against.
  assert.ok(fs.existsSync(path.join(worktreeDir, 'cwd-marker.txt')));

  // The persisted Assignment record itself carries mutation: "mutating" --
  // proof the request's own field reached dispatchDeclaredOperation, not
  // an inferred status from the step result alone.
  const assignmentId = runData.steps[0].assignmentId;
  const assignmentRecord = JSON.parse(
    fs.readFileSync(path.join(repoRootDir, '.fgos', 'assignments', assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.equal(assignmentRecord.mutation, 'mutating');
});

test('fgos coordination run --file <declared operation step, mutation:"mutating", on an advisory operation>: refused by name through the CLI door -- an operation must declare result.kind:"work-product" before it may opt into a real, mutating dispatch', () => {
  const cwd = tmpCwdFromTemplate();
  const req = {
    kind: 'declared-protocol',
    objective: 'Prove an advisory operation cannot be dispatched as mutating through the CLI run door.',
    close: true, writerId: 'coordination-cli-test',
    protocolRef: { id: 'core.coordination-protocol.standalone-master-coordination-loop' },
    steps: [
      {
        type: 'operation',
        as: 'review',
        operationId: 'review-candidate',
        targetActorId: 'reviewer',
        objective: 'Review a candidate.',
        expectedOutputs: ['review-notes.md'],
        mutation: 'mutating',
      },
    ],
  };
  const reqPath = writeRequest(cwd, 'mutating-advisory-refused.json', req);

  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /operation "review-candidate" declares result\.kind "advisory"/);
  assert.match(result.stderr, /a mutating dispatch requires the bound operation to declare result\.kind "work-product"/);
});

// ─── R2-R5: `fgos coordination chain <track>` ──────────────────────────────

test('fgos coordination chain <track>: lists cells reconstructed from real sessions, names activeCell and nextAction for the still-open one', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'agent-led-chain.json', agentLedRequest({ coordinationId: 'cli-chain--cellA' }));

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  assert.equal(envelopeData(runResult.stdout).closed, true);

  const chainResult = run(cwd, ['coordination', 'chain', 'cli-chain', '--json']);
  assert.equal(chainResult.status, 0, chainResult.stderr);
  const chainData = envelopeData(chainResult.stdout);
  assert.equal(chainData.track, 'cli-chain');
  assert.deepEqual(chainData.cells.map((c) => c.cellId), ['cellA']);
  assert.equal(chainData.cells[0].status, 'completed');
  assert.equal(chainData.activeCell, null);
});

test('fgos coordination chain <track> on a track with zero matching sessions is a validation-free empty result, not an error', () => {
  const cwd = tmpCwdFromTemplate();
  const chainResult = run(cwd, ['coordination', 'chain', 'never-opened-track']);
  assert.equal(chainResult.status, 0, chainResult.stderr);
  const chainData = envelopeData(chainResult.stdout);
  assert.deepEqual(chainData, { track: 'never-opened-track', cells: [], activeCell: null, nextAction: null });
});

test('fgos coordination chain requires a track argument', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'chain']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /coordination chain requires a track/);
});

// ─── R5: every enumerated-subcommand string names all 15 subverbs ──────────

test('R5: every place that enumerates the coordination sub-verb list (help text, error messages, the registry description) names all 15 subverbs', () => {
  const source = fs.readFileSync(FGOS, 'utf8');
  assert.match(
    source,
    /coordination requires a sub-verb: fgos coordination <start\|status\|run\|close\|show\|chain\|recover\|operation\|authorize-and-dispatch\|fan-out\|contribution\|human-turn\|disposition\|clean\|inspect>/,
    'requireField usage message must enumerate all 15 subverbs including "clean" and "inspect"',
  );
  assert.match(
    source,
    /coordination: unknown sub-verb "\$\{sub\}" \(known: start, status, run, close, show, chain, recover, operation, authorize-and-dispatch, fan-out, contribution, human-turn, disposition, clean, inspect\)/,
    'unknown-sub-verb error message must enumerate all 15 subverbs including "clean" and "inspect"',
  );

  const entry = COMMAND_REGISTRY.find((e) => e.name === 'coordination');
  assert.ok(entry, 'the "coordination" registry entry must exist');
  assert.match(entry.invoke, /clean/, 'registry invoke string must enumerate "clean"');
  assert.match(entry.invoke, /inspect/, 'registry invoke string must enumerate "inspect"');
  assert.match(entry.invoke, /close/, 'registry invoke string must enumerate "close"');
  assert.match(entry.invoke, /chain/, 'registry invoke string must enumerate "chain"');
  assert.equal(entry.parameters.properties.sub.enum.length, 15, 'registry sub enum must contain exactly 15 subverbs');
  assert.ok(entry.parameters.properties.sub.enum.includes('clean'), 'registry sub enum must include "clean"');
  assert.ok(entry.parameters.properties.sub.enum.includes('inspect'), 'registry sub enum must include "inspect"');
  assert.ok(entry.parameters.properties.sub.enum.includes('close'), 'registry sub enum must include "close"');
  assert.ok(entry.parameters.properties.sub.enum.includes('chain'), 'registry sub enum must include "chain"');
  assert.ok(!entry.parameters.properties.sub.enum.includes('actions'), 'registry sub enum must not include "actions"');
  assert.ok(!entry.parameters.properties.sub.enum.includes('launch-master-loop'), 'registry sub enum must not include "launch-master-loop"');
  assert.match(entry.description, /"clean"/, 'registry description must document "clean"');
  assert.match(entry.description, /"inspect"/, 'registry description must document "inspect"');
  assert.match(entry.description, /"close"/, 'registry description must document "close"');
  assert.match(entry.description, /"chain"/, 'registry description must document "chain"');
  assert.ok(entry.examples.some((e) => e.includes('clean')), 'registry examples must include a "clean" example');
  assert.ok(entry.examples.some((e) => e.includes('inspect')), 'registry examples must include an "inspect" example');
  assert.ok(entry.examples.some((e) => e.includes('chain')), 'registry examples must include a "chain" example');

  const unknownSubResult = run(tmpCwdFromTemplate(), ['coordination', 'bogus-sub-verb']);
  assert.notEqual(unknownSubResult.status, 0);
  assert.match(unknownSubResult.stderr, /known: start, status, run, close, show, chain, recover, operation, authorize-and-dispatch, fan-out, contribution, human-turn, disposition, clean, inspect/);
});

test('coordination CLI option validation: rejects unknown, mis-scoped, and forbidden options per subverb', () => {
  const cwd = tmpCwdFromTemplate();
  // 1. Unknown option on start
  const resUnknownStart = run(cwd, ['coordination', 'start', '--unknown-option', 'foo']);
  assert.notEqual(resUnknownStart.status, 0);
  assert.match(resUnknownStart.stderr, /coordination start: unknown or unsupported option "--unknown-option"/);

  // 2. Mis-scoped option (e.g. passing --plan to start)
  const resMisScopedStart = run(cwd, ['coordination', 'start', '--plan', 'foo.md']);
  assert.notEqual(resMisScopedStart.status, 0);
  assert.match(resMisScopedStart.stderr, /coordination start: unknown or unsupported option "--plan"/);

  // 3. Forbidden caller identity override on authorize-and-dispatch (--authorization-id, --invocation-key)
  const resAuthId = run(cwd, ['coordination', 'authorize-and-dispatch', 'coord-1', '--authorization-id', 'auth-override']);
  assert.notEqual(resAuthId.status, 0);
  assert.match(resAuthId.stderr, /coordination authorize-and-dispatch: unknown or unsupported option "--authorization-id"/);

  const resInvKey = run(cwd, ['coordination', 'authorize-and-dispatch', 'coord-1', '--invocation-key', 'inv-override']);
  assert.notEqual(resInvKey.status, 0);
  assert.match(resInvKey.stderr, /coordination authorize-and-dispatch: unknown or unsupported option "--invocation-key"/);

  // 4. Mis-scoped option on close (e.g. passing --reason)
  const resCloseReason = run(cwd, ['coordination', 'close', 'coord-1', '--reason', 'some-reason']);
  assert.notEqual(resCloseReason.status, 0);
  assert.match(resCloseReason.stderr, /coordination close: unknown or unsupported option "--reason"/);

  // 5. Mis-scoped option on operation (e.g. passing --branches)
  const resOpBranches = run(cwd, ['coordination', 'operation', 'coord-1', '--branches', '[]']);
  assert.notEqual(resOpBranches.status, 0);
  assert.match(resOpBranches.stderr, /coordination operation: unknown or unsupported option "--branches"/);

  // 6. Mis-scoped option on clean
  const resCleanUnknown = run(cwd, ['coordination', 'clean', '--unknown-flag']);
  assert.notEqual(resCleanUnknown.status, 0);
  assert.match(resCleanUnknown.stderr, /coordination clean: unknown or unsupported option "--unknown-flag"/);

  // 7. Mis-scoped option on inspect
  const resInspectUnknown = run(cwd, ['coordination', 'inspect', 'coord-1', '--unknown-flag']);
  assert.notEqual(resInspectUnknown.status, 0);
  assert.match(resInspectUnknown.stderr, /coordination inspect: unknown or unsupported option "--unknown-flag"/);

  // 8. Missing sub-verb usage error enumerates all 15 subverbs
  const resNoSub = run(cwd, ['coordination']);
  assert.notEqual(resNoSub.status, 0);
  assert.match(resNoSub.stderr, /coordination requires a sub-verb: fgos coordination <start\|status\|run\|close\|show\|chain\|recover\|operation\|authorize-and-dispatch\|fan-out\|contribution\|human-turn\|disposition\|clean\|inspect>/);
});

// ─── Semantic coordination CLI subcommands ─────────────────────────────────

test('fgos coordination start creates session and fgos coordination status projects status and actions', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const startRes = run(cwd, [
    'coordination', 'start', 'coord-sem-test-1',
    '--kind', 'declared-protocol',
    '--protocol', 'core.coordination-protocol.declared-consult',
    '--objective', 'Test start semantic command',
    '--writer-id', 'test-operator',
    '--actors', JSON.stringify([{ id: 'consultant-actor' }]),
  ]);
  assert.equal(startRes.status, 0, startRes.stderr);
  const startData = envelopeData(startRes.stdout);
  assert.equal(startData.coordinationId, 'coord-sem-test-1');
  assert.equal(startData.status, 'running');

  const statusRes = run(cwd, ['coordination', 'status', startData.coordinationId]);
  assert.equal(statusRes.status, 0, statusRes.stderr);
  const statusData = envelopeData(statusRes.stdout);
  assert.equal(statusData.coordinationId, startData.coordinationId);
  assert.equal(statusData.session.status, 'active');
  assert.ok(Array.isArray(statusData.actions));
  assert.ok(statusData.actions.length > 0);
});

test('fgos coordination semantic workflow: start -> operation -> close', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const startRes = run(cwd, [
    'coordination', 'start', 'coord-sem-test-2',
    '--kind', 'declared-protocol',
    '--protocol', 'core.coordination-protocol.declared-consult',
    '--objective', 'Consultation workflow',
    '--writer-id', 'driver-main',
    '--actors', JSON.stringify([{ id: 'consultant-actor' }]),
  ]);
  assert.equal(startRes.status, 0, startRes.stderr);
  const startData = envelopeData(startRes.stdout);
  const coordinationId = startData.coordinationId;
  const initialAssignmentId = startData.steps[0].assignmentId;
  assert.ok(initialAssignmentId, 'initial entry step produced assignmentId');

  // status to get available operation action (provide-consult)
  const statusRes1 = run(cwd, ['coordination', 'status', coordinationId]);
  const statusData1 = envelopeData(statusRes1.stdout);
  const opAction = statusData1.actions.find((a) => a.kind === 'dispatch-operation');
  assert.ok(opAction, 'expected dispatch-operation action for provide-consult');

  // execute operation via semantic CLI
  const opRes = run(cwd, [
    'coordination', 'operation', coordinationId,
    '--action-key', opAction.actionKey,
    '--writer-id', 'driver-main',
    '--objective', 'Perform provide consult',
    '--expected-outputs', 'agent-result.json,agent-report.md',
    '--from-assignment-id', initialAssignmentId,
  ]);
  assert.equal(opRes.status, 0, opRes.stderr);
  const opData = envelopeData(opRes.stdout);
  assert.equal(opData.coordinationId, coordinationId);

  // status after operation: close action should be available
  const statusRes2 = run(cwd, ['coordination', 'status', coordinationId]);
  const statusData2 = envelopeData(statusRes2.stdout);
  const closeAction = statusData2.actions.find((a) => a.kind === 'close');
  assert.ok(closeAction, 'expected close action');

  // execute close via semantic CLI
  const closeRes = run(cwd, [
    'coordination', 'close', coordinationId,
    '--action-key', closeAction.actionKey,
    '--writer-id', 'driver-main',
  ]);
  assert.equal(closeRes.status, 0, closeRes.stderr);
  const closeData = envelopeData(closeRes.stdout);
  assert.equal(closeData.coordinationId, coordinationId);
  assert.equal(closeData.closed, true);

  // Verify stale action key rejection
  const staleCloseRes = run(cwd, [
    'coordination', 'close', coordinationId,
    '--action-key', 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    '--writer-id', 'driver-main',
  ]);
  assert.notEqual(staleCloseRes.status, 0);
  assert.match(staleCloseRes.stderr, /stale|precondition|not found|does not match/i);
});

test('fgos coordination inspect: produces read-only projection with operationId coordination.inspect', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const startRes = run(cwd, [
    'coordination', 'start', 'coord-inspect-test-1',
    '--kind', 'declared-protocol',
    '--protocol', 'core.coordination-protocol.declared-consult',
    '--objective', 'Test inspect semantic command',
    '--writer-id', 'test-operator',
    '--actors', JSON.stringify([{ id: 'consultant-actor' }]),
  ]);
  assert.equal(startRes.status, 0, startRes.stderr);

  // inspect without id fails
  const noIdRes = run(cwd, ['coordination', 'inspect']);
  assert.notEqual(noIdRes.status, 0);
  assert.match(noIdRes.stderr, /coordination inspect requires an id/);

  // inspect with id returns inspection projection
  const inspectRes = run(cwd, ['coordination', 'inspect', 'coord-inspect-test-1']);
  assert.equal(inspectRes.status, 0, inspectRes.stderr);
  const inspectData = envelopeData(inspectRes.stdout);
  assert.equal(inspectData.ok, true);
  assert.equal(inspectData.operationId, 'coordination.inspect');
  assert.equal(inspectData.effect, 'read');
  assert.equal(inspectData.coordinationId, 'coord-inspect-test-1');
  assert.equal(inspectData.status, 'active');
  assert.equal(inspectData.session.status, 'active');
  assert.ok(Array.isArray(inspectData.actions));
});

test('fgos coordination clean: safe no-op on active session and cleans on terminal session or with --force', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  // 1. Clean when no sessions exist
  const cleanEmptyRes = run(cwd, ['coordination', 'clean']);
  assert.equal(cleanEmptyRes.status, 0, cleanEmptyRes.stderr);
  const emptyData = envelopeData(cleanEmptyRes.stdout);
  assert.equal(emptyData.ok, true);
  assert.equal(emptyData.cleaned, true);

  // 2. Start session
  const startRes = run(cwd, [
    'coordination', 'start', 'coord-clean-test-1',
    '--kind', 'declared-protocol',
    '--protocol', 'core.coordination-protocol.declared-consult',
    '--objective', 'Test clean semantic command',
    '--writer-id', 'test-operator',
    '--actors', JSON.stringify([{ id: 'consultant-actor' }]),
  ]);
  assert.equal(startRes.status, 0, startRes.stderr);

  // 3. Clean active session without force: safe no-op
  const cleanActiveRes = run(cwd, ['coordination', 'clean', 'coord-clean-test-1']);
  assert.equal(cleanActiveRes.status, 0, cleanActiveRes.stderr);
  const activeData = envelopeData(cleanActiveRes.stdout);
  assert.equal(activeData.ok, true);
  assert.equal(activeData.coordinationId, 'coord-clean-test-1');
  assert.equal(activeData.cleaned, false);
  assert.match(activeData.message, /safe no-op/);

  // 4. Clean active session with --force: cleans
  const cleanForceRes = run(cwd, ['coordination', 'clean', 'coord-clean-test-1', '--force']);
  assert.equal(cleanForceRes.status, 0, cleanForceRes.stderr);
  const forceData = envelopeData(cleanForceRes.stdout);
  assert.equal(forceData.ok, true);
  assert.equal(forceData.cleaned, true);

  // 5. Clean with --dry-run
  const cleanDryRunRes = run(cwd, ['coordination', 'clean', 'coord-clean-test-1', '--dry-run']);
  assert.equal(cleanDryRunRes.status, 0, cleanDryRunRes.stderr);
  const dryRunData = envelopeData(cleanDryRunRes.stdout);
  assert.equal(dryRunData.ok, true);
  assert.equal(dryRunData.dryRun, true);
});

test('coordination CLI: hidden aliases "actions" and "launch-master-loop" still dispatch for backcompat', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);

  const startRes = run(cwd, [
    'coordination', 'start', 'coord-compat-test-1',
    '--kind', 'declared-protocol',
    '--protocol', 'core.coordination-protocol.declared-consult',
    '--objective', 'Test backcompat command',
    '--writer-id', 'test-operator',
    '--actors', JSON.stringify([{ id: 'consultant-actor' }]),
  ]);
  assert.equal(startRes.status, 0, startRes.stderr);

  const actionsRes = run(cwd, ['coordination', 'actions', 'coord-compat-test-1', '--json']);
  assert.equal(actionsRes.status, 0, actionsRes.stderr);
  const actionsData = envelopeData(actionsRes.stdout);
  assert.equal(actionsData.coordinationId, 'coord-compat-test-1');
  assert.ok(Array.isArray(actionsData.actions));
});

// `execFileSync` re-export sanity: confirms the harness genuinely spawns a
// real subprocess (not an in-process call) for every test above.
test('harness sanity: run() spawns a real node subprocess', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, [FGOS, '--help'], { encoding: 'utf8' }));
});
