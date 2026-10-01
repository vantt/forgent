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
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { protocolOperationStamp } from '../../src/runner/coordination/legality-facts.mjs';

const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';
const REAL_PACK_MEMBER_IDS = [
  'core.coordination-protocol.group-thinking-rfc-review-lite',
  'core.coordination-protocol.group-thinking-nominal-group-lite',
  'core.coordination-protocol.group-thinking-delphi-feedback-lite',
  'core.coordination-protocol.standalone-master-coordination-loop',
  'core.coordination-protocol.architecture-advisory-panel-v1',
  'core.coordination-protocol.architecture-advisory-panel-standard-v1',
];

function writeRequest(cwd, name, obj) {
  const requestPath = path.join(cwd, name);
  fs.writeFileSync(requestPath, JSON.stringify(obj, null, 2));
  return requestPath;
}

// MEDIUM-1's resume test: `replaySession`'s own `assignments[].operationId`
// is undefined for a real declared-protocol dispatch (only stamped through a
// different, driver-authorized branch dispatchDeclaredOperation does not take
// for an auto-legal operation like convene/propose) -- the actually-durable,
// on-disk proof of "which operation this assignment served" is the reserved
// `protocol-operation:<id>@<version>#<operationId>` constraint
// `dispatchDeclaredOperation` stamps into the real Assignment's own
// contract (session-engine.mjs's `buildSessionContract`, mirrored read-side
// by `pureAssignmentServesOperation`, legality-facts.mjs). Reads it straight
// off disk, the same file the real engine itself trusts.
function assignmentServedOperation(cwd, assignmentId, operationId) {
  const assignmentPath = path.join(cwd, '.fgos', 'assignments', assignmentId, 'assignment.json');
  const assignment = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
  const constraints = assignment.provenance?.inline?.contract?.constraints ?? [];
  const stamp = protocolOperationStamp({ metadata: { id: RFC_REVIEW_LITE_ID, version: '1.0.0' } }, operationId);
  return constraints.includes(stamp);
}

// Same shape as test/cli/coordination.test.mjs's own agentLedRequest --
// duplicated (not imported) since this file's own fixtures are otherwise
// entirely self-contained; only used by the "opened with no bound protocol"
// resume-refusal test below.
function agentLedRequest(overrides = {}) {
  return {
    kind: 'agent-led',
    objective: 'Investigate package.json.',
    writerId: 'pack-cli-test',
    primaryRole: 'researcher',
    task: {
      expectedOutputs: ['agent-result.json (status, summary)'],
      evidenceRequired: 'reported',
    },
    ...overrides,
  };
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
// The resolved `--model`/`--tier` model string is appended as this script's
// SECOND argv (args: [..., '{prompt}', '{model}']) -- MEDIUM-2's own --tier
// forwarding test reads it back from `<marker>-model.txt` the same way the
// pre-existing marker files below prove --executor forwarding.
function writeFakeExecutorConfig(cwd) {
  const defaultScript = path.join(cwd, 'fake-executor-default.mjs');
  fs.writeFileSync(
    defaultScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    fs.writeFileSync(path.join(cwd, 'default-executor-ran.txt'), 'default\\n');
    fs.writeFileSync(path.join(cwd, 'default-executor-model.txt'), process.argv[3] ?? '');
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
    fs.writeFileSync(path.join(cwd, 'alt-executor-model.txt'), process.argv[3] ?? '');
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
      executor: { allowCrossProvider: true, command: process.execPath, args: [defaultScript, '{prompt}', '{model}'] },
      executors: {
        'alt-executor': { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [altScript, '{prompt}', '{model}'] },
      },
      // "flagship" is deliberately absent from every OTHER test's implicit
      // expectation: convene/propose (coordinator-actor/proposer-actor) never
      // declare policy.rigor in group-thinking-rfc-review-lite.yaml, so
      // every test that omits --tier keeps resolving "standard" -- only the
      // --tier forwarding test below ever asks for "flagship".
      modelPolicies: { claude: { nano: 'test-model', standard: 'test-model', flagship: 'flagship-test-model' } },
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
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

// LOW-1: `show-protocol` is a thin, unscoped wrapper over
// `loadCoordinationProtocol` (unlike `list`, which is genuinely narrowed to
// pack members via `loadProtocolPack`) -- this is the documented, intended
// shape (core/skills/fgos-group-thinking/SKILL.md's own step 2 note), not an
// accidental gap. "declared-consult" is a real, registered
// CoordinationProtocol FlowDefinition (core/coordination-protocols/
// declared-consult.yaml) that is deliberately NOT a group-thinking pack
// member (see the "not a pack member" `pack run` refusal test below) --
// proving `show-protocol` still succeeds on it confirms the wider scope is
// stable, not a bug waiting to be "fixed" into matching `list`'s narrower one.
test('fgos coordination pack show-protocol: succeeds on a real, registered protocol that is NOT a group-thinking pack member', () => {
  const cwd = tmpCwdFromTemplate();
  const result = run(cwd, ['coordination', 'pack', 'show-protocol', 'core.coordination-protocol.declared-consult']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.metadata.id, 'core.coordination-protocol.declared-consult');
  assert.ok(!REAL_PACK_MEMBER_IDS.includes('core.coordination-protocol.declared-consult'), 'fixture assumption: this id must stay a non-pack-member for this test to prove anything');
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

// MEDIUM-2: bin/fgos.mjs wires `cliTier: flags.tier` into
// `runGroupThinkingRequest` exactly like `cliExecutor: flags.executor` above,
// but no test exercised it. Proven the SAME way: the real per-actor policy
// resolution (`resolveAssignmentDispatchPolicy`, assignment-policy.mjs) picks
// the model for the request's effective tier out of `runner.models[tier]`
// and threads it into the executor's own argv via `{model}` substitution
// (transport.mjs's `resolveExecutorCommand`) -- coordinator-actor/
// proposer-actor declare no `policy.rigor` in group-thinking-rfc-review-
// lite.yaml, so every OTHER test in this file (never passing --tier) leaves
// the effective tier at the runtime default "standard" -> "test-model";
// --tier "flagship" here raises it (flagship > standard) to
// "flagship-test-model" -- a value no other test's config path produces --
// proving the flag reached the real dispatch, not just parsed and dropped.
test('fgos coordination pack run: --tier forwards to the real per-actor policy resolution, raising the resolved model', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'request.json', conveneOnlyRequest('coord_pack_tier'));

  const result = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', reqPath,
    '--tier', 'flagship',
  ]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.coordinationId, 'coord_pack_tier');
  assert.equal(data.steps.length, 1);
  assert.equal(data.steps[0].status, 'done');

  // The default (never-named-executor) script ran -- --tier alone must not
  // also redirect the executor -- and it received "flagship-test-model" as
  // its own model argv, not "test-model" (the standard-tier default every
  // other test in this file implicitly proves via the SAME script/config).
  assert.equal(fs.existsSync(path.join(cwd, 'default-executor-ran.txt')), true);
  assert.equal(fs.readFileSync(path.join(cwd, 'default-executor-model.txt'), 'utf8'), 'flagship-test-model');
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
  // Call 2's OWN response only ever reports its own single step -- proves
  // nothing about call 1 by itself (a brand-new session opened for call 2
  // would report this identically). The assertions below replay the
  // session's real on-disk ledger instead, the same technique
  // test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.
  // test.mjs uses to prove resume across independent process-level calls.
  assert.equal(data.steps.length, 1);
  assert.equal(data.steps[0].status, 'done');

  // MEDIUM-1: reconstruct the WHOLE 2-call chain from replaySession's own
  // projection alone -- proving BOTH operations (call 1's convene, call 2's
  // propose) really settled against ONE session, not two disjoint ones a
  // resume bug could silently produce (e.g. call 2 opening a second, brand-
  // new session under the same coordinationId).
  const replayed = replaySession(coordinationId, { cwd, repoRoot: cwd });
  assert.equal(replayed.assignments.length, 2, 'both call 1\'s convene and call 2\'s propose assignments must be replayable from the SAME session, not just call 2\'s own response');
  assert.deepEqual(
    new Set(replayed.assignments.map((a) => a.actorId)),
    new Set(['coordinator-actor', 'proposer-actor']),
    'call 1\'s coordinator-actor dispatch and call 2\'s proposer-actor dispatch must both be visible in one replay',
  );
  const conveneAssignment = replayed.assignments.find((a) => a.actorId === 'coordinator-actor');
  const proposeAssignment = replayed.assignments.find((a) => a.actorId === 'proposer-actor');
  assert.ok(assignmentServedOperation(cwd, conveneAssignment.assignmentId, 'convene'), 'call 1\'s assignment must be stamped as having served "convene", not merely exist');
  assert.ok(assignmentServedOperation(cwd, proposeAssignment.assignmentId, 'propose'), 'call 2\'s assignment must be stamped as having served "propose", not merely exist');
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

// Pre-existing gate refusal (group-thinking-pack.mjs's resume cross-check)
// that predates Unit I23's CLI door but had no test anywhere in the suite:
// a session opened as kind:"agent-led" (plain "coordination run", no bound
// FlowDefinition at all -- manifest.definitionRef stays unset) must refuse a
// LATER kind:"declared-protocol" pack request against that SAME
// coordinationId, not silently treat it as freshly bound to whatever
// protocolId this second call names.
test('fgos coordination pack run: resuming an existing coordinationId that was really opened as kind:"agent-led" (no bound protocol) is refused', () => {
  const cwd = tmpCwdFromTemplate();
  writeFakeExecutorConfig(cwd);
  const coordinationId = 'coord_pack_resume_agent_led';

  const agentLedPath = writeRequest(cwd, 'agent-led.json', agentLedRequest({ coordinationId }));
  const opened = run(cwd, ['coordination', 'run', '--file', agentLedPath]);
  assert.equal(opened.status, 0, opened.stderr);
  assert.equal(envelopeData(opened.stdout).kind, 'agent-led');

  const packRequest = {
    kind: 'declared-protocol',
    objective: 'x',
    writerId: 'pack-cli-test',
    coordinationId,
    protocolRef: { id: RFC_REVIEW_LITE_ID },
    steps: [],
  };
  const packPath = writeRequest(cwd, 'pack-request.json', packRequest);
  const resumed = run(cwd, [
    'coordination', 'pack', 'run',
    '--protocol', RFC_REVIEW_LITE_ID,
    '--file', packPath,
  ]);
  assert.notEqual(resumed.status, 0);
  assert.match(resumed.stderr, /already exists but was opened with no bound protocol \(kind:"agent-led"\)/);
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
