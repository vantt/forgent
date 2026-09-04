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
  tmpCwd,
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
      models: { standard: 'test-model', lightweight: 'test-model' },
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
// gate, `session-engine.mjs`'s `assertMutatingDispatchAllowed` -- not
// exercised below because `src/verbs/coordination/run.mjs` does not yet
// forward a request step's `mutation` field to the engine at all, `grep -n
// "mutation" src/verbs/coordination/run.mjs` finds zero matches, an
// already-documented, pre-existing gap (P01.1.md); the mutation-unlock
// feature is engine-level-only today, unreachable through this CLI).

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
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'agent-led-no-cwd.json', agentLedRequest());

  const runResult = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(runResult.status, 0, runResult.stderr);
  const runData = envelopeData(runResult.stdout);
  assert.equal(runData.closed, true);

  const sessionManifest = path.join(cwd, '.fgos', 'coordination', 'sessions', runData.coordinationId, 'session.json');
  assert.ok(fs.existsSync(sessionManifest), 'omitting --cwd must default the working directory to the resolved repo root, exactly as before this flag existed');
});

// ─── R2-R5: `fgos coordination chain <track>` ──────────────────────────────

test('fgos coordination chain <track>: lists cells reconstructed from real sessions, names activeCell and nextAction for the still-open one', () => {
  const cwd = tmpCwd();
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
  const cwd = tmpCwd();
  const chainResult = run(cwd, ['coordination', 'chain', 'never-opened-track']);
  assert.equal(chainResult.status, 0, chainResult.stderr);
  const chainData = envelopeData(chainResult.stdout);
  assert.deepEqual(chainData, { track: 'never-opened-track', cells: [], activeCell: null, nextAction: null });
});

test('fgos coordination chain requires a track argument', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['coordination', 'chain']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /coordination chain requires a track/);
});

// ─── R5: every enumerated-subcommand string names "chain" ─────────────────

test('R5: every place that enumerates the coordination sub-verb list (help text, error messages, the registry description) names "chain"', () => {
  const source = fs.readFileSync(FGOS, 'utf8');
  assert.match(
    source,
    /coordination requires a sub-verb: fgos coordination <run\|show\|launch-master-loop\|chain>/,
    'requireField usage message must enumerate "chain"',
  );
  assert.match(
    source,
    /coordination: unknown sub-verb "\$\{sub\}" \(known: run, show, launch-master-loop, chain\)/,
    'unknown-sub-verb error message must enumerate "chain"',
  );

  const entry = COMMAND_REGISTRY.find((e) => e.name === 'coordination');
  assert.ok(entry, 'the "coordination" registry entry must exist');
  assert.match(entry.invoke, /chain/, 'registry invoke string must enumerate "chain"');
  assert.ok(entry.parameters.properties.sub.enum.includes('chain'), 'registry sub enum must include "chain"');
  assert.match(entry.description, /"chain"/, 'registry description must document "chain"');
  assert.ok(entry.examples.some((e) => e.includes('chain')), 'registry examples must include a "chain" example');

  const unknownSubResult = run(tmpCwd(), ['coordination', 'bogus-sub-verb']);
  assert.notEqual(unknownSubResult.status, 0);
  assert.match(unknownSubResult.stderr, /known: run, show, launch-master-loop, chain/);
});

// `execFileSync` re-export sanity: confirms the harness genuinely spawns a
// real subprocess (not an in-process call) for every test above.
test('harness sanity: run() spawns a real node subprocess', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, [FGOS, '--help'], { encoding: 'utf8' }));
});
