// coordination-pack.test.mjs -- CLI integration coverage for
// `fgos coordination pack <list|show-protocol|run>` (Unit I23), the public
// door onto the group-thinking Protocol Pack gate
// (src/verbs/coordination/group-thinking-pack.mjs), replacing the inline
// `node -e` scripts the fgos-group-thinking skill used to instruct a
// dispatching agent to author by hand. Every test below runs the REAL
// shipped pack registry (core/protocol-packs/group-thinking.json) -- no
// packPath override is exposed at the CLI layer, matching production.
// Same run()/envelopeData()/tmpCwdFromTemplate() harness as
// test/cli/coordination.test.mjs (this directory's shared convention).
import { test } from 'node:test';
import {
  assert,
  fs,
  envelopeData,
  path,
  run,
  tmpCwdFromTemplate,
} from './helpers/fgos-cli-harness.mjs';

const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';
const REAL_PACK_MEMBER_IDS = [
  'core.coordination-protocol.group-thinking-rfc-review-lite',
  'core.coordination-protocol.group-thinking-nominal-group-lite',
  'core.coordination-protocol.group-thinking-delphi-feedback-lite',
  'core.coordination-protocol.standalone-master-coordination-loop',
  'core.coordination-protocol.architecture-advisory-panel-v1',
];

function writeRequest(cwd, name, obj) {
  const requestPath = path.join(cwd, name);
  fs.writeFileSync(requestPath, JSON.stringify(obj, null, 2));
  return requestPath;
}

function conveneOnlyRequest(coordinationId) {
  return {
    kind: 'declared-protocol',
    objective: 'Prove the pack CLI dispatches through the real gate.',
    writerId: 'pack-cli-test',
    coordinationId,
    protocolRef: { id: RFC_REVIEW_LITE_ID },
    steps: [
      {
        type: 'operation',
        as: 'convene',
        operationId: 'convene',
        targetActorId: 'coordinator-actor',
        taskKey: 'pack-cli-convene',
        objective: 'State the RFC under review and open the round.',
        expectedOutputs: ['agent-result.json (status, summary)'],
      },
    ],
  };
}

// Real Node-subprocess fake executor, same shape as
// test/cli/coordination.test.mjs's own writeFakeExecutorConfig -- a genuinely
// spawned `fgos coordination pack run` subprocess resolves it exactly the
// way `ensureRunnerConfigForDir` resolves any other real runner config,
// never a JS-level stub. `runner.executors['alt-executor']` is a SECOND,
// independently distinguishable script -- proving --executor forwards
// through `runGroupThinkingRequest`'s cliExecutor channel into the real
// per-actor policy resolution (composers.mjs's `withComputedActorBindings`),
// not just "some executor happened to run".
function writeFakeExecutorConfig(cwd) {
  const defaultScript = path.join(cwd, 'fake-executor-default.mjs');
  fs.writeFileSync(
    defaultScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    fs.writeFileSync(path.join(cwd, 'default-executor-ran.txt'), 'default\\n');
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
  const altScript = path.join(cwd, 'fake-executor-alt.mjs');
  fs.writeFileSync(
    altScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    fs.writeFileSync(path.join(cwd, 'alt-executor-ran.txt'), 'alt\\n');
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
      executor: { allowCrossProvider: true, command: process.execPath, args: [defaultScript, '{prompt}'] },
      executors: {
        'alt-executor': { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [altScript, '{prompt}'] },
      },
      models: { standard: 'test-model', nano: 'test-model' },
      timeoutMs: 20000,
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ---------------------------------------------------------------------
// `pack list`

test('fgos coordination pack list: returns the real shipped pack registry', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'list']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.kind, 'ProtocolPack');
  assert.deepEqual(data.members.map((m) => m.id).sort(), [...REAL_PACK_MEMBER_IDS].sort());
});

test('fgos coordination pack list: never touches .fgos/ (read-only)', () => {
  const cwd = tmpCwdFromTemplate();
  const before = fs.readdirSync(path.join(cwd, '.fgos')).sort();
  const result = run(cwd, ['coordination', 'pack', 'list']);
  assert.equal(result.status, 0, result.stderr);
  const after = fs.readdirSync(path.join(cwd, '.fgos')).sort();
  assert.deepEqual(after, before);
});

// ---------------------------------------------------------------------
// `pack show-protocol <id>`

test('fgos coordination pack show-protocol: reads a real pack member\'s own declared FlowDefinition shape', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'show-protocol', RFC_REVIEW_LITE_ID]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.metadata.id, RFC_REVIEW_LITE_ID);
  assert.ok(Array.isArray(data.spec.actors), 'expected the real FlowDefinition spec.actors array');
  assert.ok(data.spec.actors.some((a) => a.id === 'coordinator-actor'));
});

test('fgos coordination pack show-protocol: missing id is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'show-protocol']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /protocol id/);
});

test('fgos coordination pack show-protocol: an id with no registered FlowDefinition anywhere is refused, not silently empty', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'show-protocol', 'core.coordination-protocol.does-not-exist']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no CoordinationProtocol definition found/);
});

// ---------------------------------------------------------------------
// `pack run` -- validation

test('fgos coordination pack run: missing --protocol is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = writeRequest(cwd, 'request.json', conveneOnlyRequest('coord_pack_missing_protocol'));
  const result = run(cwd, ['coordination', 'pack', 'run', '--file', reqPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--protocol/);
});

test('fgos coordination pack run: missing --file is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'run', '--protocol', RFC_REVIEW_LITE_ID]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--file/);
});

test('fgos coordination pack run: a protocolId that is not a pack member is refused before any dispatch -- the gate plain "coordination run" does not have', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = writeRequest(cwd, 'request.json', {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'w',
    protocolRef: { id: 'core.coordination-protocol.declared-consult' },
    steps: [{ type: 'operation', as: 's1', operationId: 'request-consult', objective: 'x', expectedOutputs: ['y'] }],
  });
  const result = run(cwd, ['coordination', 'pack', 'run', '--protocol', 'core.coordination-protocol.declared-consult', '--file', reqPath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /is not a registered member of the "group-thinking" pack/);
});

test('fgos coordination pack run: a request body protocolRef.id disagreeing with --protocol is refused', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = writeRequest(cwd, 'request.json', conveneOnlyRequest('coord_pack_mismatch'));
  const result = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', 'core.coordination-protocol.group-thinking-nominal-group-lite',
    '--file', reqPath,
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match the explicitly selected protocolId/);
});

// ---------------------------------------------------------------------
// `pack run` -- --model is refused for declared-protocol requests, the SAME
// way plain `coordination run` already refuses it (test/cli/coordination.
// test.mjs's own "declared-protocol request; --model with a declared-protocol
// request is refused" case) -- proving --model forwards through the
// identical cliModel/assertModelSupportedForKind channel, not a second one.

test('fgos coordination pack run: --model is refused for a declared-protocol pack request the same way plain "coordination run" refuses it', () => {
  const cwd = tmpCwdFromTemplate();
  const reqPath = writeRequest(cwd, 'request.json', conveneOnlyRequest('coord_pack_model_refused'));
  const result = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', reqPath,
    '--model', 'opus',
  ]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--model \/ actors\[\]\.model is not supported for kind:"declared-protocol"/);
});

// ---------------------------------------------------------------------
// `pack run` -- real end-to-end dispatch through the real door, plus
// --executor forwarding.

test('fgos coordination pack run: a pack-registered request dispatches end-to-end through the real gate, and --executor forwards to the actually-invoked executor', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'request.json', conveneOnlyRequest('coord_pack_e2e'));

  const result = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', reqPath,
    '--executor', 'alt-executor',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.coordinationId, 'coord_pack_e2e');
  assert.deepEqual(data.definitionRef, { id: RFC_REVIEW_LITE_ID, version: '1.0.0' });
  assert.equal(data.steps.length, 1);
  assert.equal(data.steps[0].status, 'done');
  // Only one legal operation was dispatched (convene); the protocol's other
  // required bindings are still pending, so the engine's own automatic
  // close-on-quorum correctly leaves the session open.
  assert.equal(data.closed, false);

  // --executor alt-executor genuinely redirected dispatch: the alt script's
  // own marker exists, the default executor's marker does not.
  assert.equal(fs.existsSync(path.join(cwd, 'alt-executor-ran.txt')), true);
  assert.equal(fs.existsSync(path.join(cwd, 'default-executor-ran.txt')), false);
});

test('fgos coordination pack run: resuming the SAME coordinationId through the pack gate reaches the session "pack run" itself opened', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const coordinationId = 'coord_pack_resume';
  const firstPath = writeRequest(cwd, 'first.json', conveneOnlyRequest(coordinationId));
  const first = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', firstPath,
    '--executor', 'alt-executor',
  ]);
  assert.equal(first.status, 0, first.stderr);

  const secondRequest = conveneOnlyRequest(coordinationId);
  secondRequest.steps = [
    {
      type: 'operation',
      as: 'propose',
      operationId: 'propose',
      targetActorId: 'proposer-actor',
      taskKey: 'pack-cli-propose',
      objective: 'Write the proposal being reviewed.',
      expectedOutputs: ['agent-result.json (status, summary)'],
    },
  ];
  const secondPath = writeRequest(cwd, 'second.json', secondRequest);
  const second = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', secondPath,
    '--executor', 'alt-executor',
  ]);
  assert.equal(second.status, 0, second.stderr);
  const data = envelopeData(second.stdout);
  assert.equal(data.coordinationId, coordinationId);
  // Resumed the SAME session: two real operations now settled against it
  // (convene from call 1, propose from call 2), never a second session.
  assert.equal(data.steps.length, 1);
  assert.equal(data.steps[0].status, 'done');
});

test('fgos coordination pack run: resuming an existing coordinationId under a DIFFERENT protocolId than it was really opened with is refused', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const coordinationId = 'coord_pack_resume_mismatch';
  const firstPath = writeRequest(cwd, 'first.json', conveneOnlyRequest(coordinationId));
  const first = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', firstPath,
    '--executor', 'alt-executor',
  ]);
  assert.equal(first.status, 0, first.stderr);

  const secondRequest = {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'pack-cli-test',
    coordinationId,
    protocolRef: { id: 'core.coordination-protocol.group-thinking-nominal-group-lite' },
    steps: [],
  };
  const secondPath = writeRequest(cwd, 'second.json', secondRequest);
  const second = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', 'core.coordination-protocol.group-thinking-nominal-group-lite',
    '--file', secondPath,
  ]);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /already bound to protocol/);
});

// ---------------------------------------------------------------------
// Unknown pack sub-verb

test('fgos coordination pack: an unknown pack sub-verb is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'bogus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown sub-verb "bogus"/);
});

test('fgos coordination pack: no sub-verb at all is a validation error (exit 4)', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /coordination pack requires a sub-verb/);
});
