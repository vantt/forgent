// The live, synchronous, no-Work standalone Master Coordination proof:
// one real `fgos coordination run --file <request>` subprocess drives
// core/coordination-protocols/standalone-master-coordination-loop.yaml
// through its whole shape -- candidate, required review + red-team first
// pass, driver-authorized revision, a rejecting disposition, two
// driver-authorized rechecks, and an accepting disposition -- then closes
// the session by quorum.
//
// Everything here runs against the SHIPPED core-tier fixture (never a
// project-tier copy) through a genuinely spawned CLI process against a
// real, fake-but-real Node executor. What it proves that the engine-level
// suites cannot: that the whole loop is reachable from a request FILE, and
// that reaching it creates no Work item, no git repository, and no repo
// mutation of any kind.

import { test } from 'node:test';
import { assert, envelopeData, eventLines, fs, path, run, stateView, tmpCwd } from '../cli/helpers/fgos-cli-harness.mjs';
import { loadCoordinationProtocol } from '../../src/runner/definitions/protocol-loader.mjs';
import { readSessionEvents, readManifest } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';

const PROTOCOL_ID = 'core.coordination-protocol.standalone-master-coordination-loop';
const WRITER_ID = 'master-coordinator-live-proof';
const COORDINATION_ID = 'coord_master_loop_live';

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

const OUTPUTS = ['agent-result.json (status, summary)'];

// The full Master Coordination loop as ONE request file. Every ref between
// steps is a `$ref:<label>` placeholder -- no Assignment id is knowable
// before dispatch time, which is exactly why the request surface has them.
function masterLoopRequest() {
  return {
    kind: 'declared-protocol',
    objective: 'Standalone Master Coordination loop: produce, review, red-team, revise under authorization, recheck under authorization, disposition, close.',
    writerId: WRITER_ID,
    coordinationId: COORDINATION_ID,
    protocolRef: { id: PROTOCOL_ID },
    steps: [
      { type: 'operation', as: 'produce', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'Produce the first candidate.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'review', operationId: 'review-candidate', targetActorId: 'reviewer', objective: 'Review the candidate.', expectedOutputs: OUTPUTS, contextRefs: ['$ref:produce'] },
      { type: 'operation', as: 'red-team', operationId: 'red-team-candidate', targetActorId: 'red-team', objective: 'Red-team the candidate.', expectedOutputs: OUTPUTS, contextRefs: ['$ref:produce'] },
      {
        type: 'authorize',
        as: 'authorize-revision',
        operationId: 'revise-candidate',
        targetActorId: 'fixer',
        nodeId: 'phase-revision',
        authorizationId: 'auth_revision_1',
        invocationKey: 'revision:candidate@1',
        reason: 'The first pass raised findings; authorize one revision round.',
        grantedContextRefs: ['$ref:produce', '$ref:review', '$ref:red-team'],
        targetArtifactRef: '$ref:produce',
      },
      { type: 'operation', as: 'revise', operationId: 'revise-candidate', targetActorId: 'fixer', objective: 'Revise the candidate against the first-pass findings.', expectedOutputs: OUTPUTS, contextRefs: ['$ref:produce', '$ref:review', '$ref:red-team'] },
      {
        type: 'disposition',
        as: 'reject-first-pass',
        targetRef: '$ref:produce',
        disposition: 'rejected',
        rationale: 'The first-pass candidate did not clear review; a revision was authorized instead.',
        evidenceRefs: ['$ref:review', '$ref:red-team'],
      },
      {
        type: 'authorize',
        as: 'authorize-reviewer-recheck',
        operationId: 'reviewer-recheck',
        targetActorId: 'reviewer',
        nodeId: 'phase-recheck',
        authorizationId: 'auth_reviewer_recheck_1',
        invocationKey: 'recheck:reviewer:candidate@2',
        reason: 'Recheck the revised candidate against the reviewer findings.',
        grantedContextRefs: ['$ref:revise'],
        targetArtifactRef: '$ref:revise',
      },
      { type: 'operation', as: 'reviewer-recheck', operationId: 'reviewer-recheck', targetActorId: 'reviewer', objective: 'Recheck the revised candidate.', expectedOutputs: OUTPUTS, contextRefs: ['$ref:revise'] },
      {
        type: 'authorize',
        as: 'authorize-red-team-recheck',
        operationId: 'red-team-recheck',
        targetActorId: 'red-team',
        nodeId: 'phase-recheck',
        authorizationId: 'auth_red_team_recheck_1',
        invocationKey: 'recheck:red-team:candidate@2',
        reason: 'Recheck the revised candidate against the red-team findings.',
        grantedContextRefs: ['$ref:revise'],
        targetArtifactRef: '$ref:revise',
      },
      { type: 'operation', as: 'red-team-recheck', operationId: 'red-team-recheck', targetActorId: 'red-team', objective: 'Red-team the revised candidate.', expectedOutputs: OUTPUTS, contextRefs: ['$ref:revise'] },
      {
        type: 'disposition',
        as: 'accept-revision',
        targetRef: '$ref:revise',
        disposition: 'accepted',
        rationale: 'Both rechecks cleared the revision; the round is closed.',
        evidenceRefs: ['$ref:reviewer-recheck', '$ref:red-team-recheck'],
      },
    ],
  };
}

function writeRequest(cwd, name, obj) {
  const p = path.join(cwd, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

test('the shipped standalone-master-coordination-loop fixture gates its revision and recheck bindings on driver authorization, and only those', () => {
  const definition = loadCoordinationProtocol(PROTOCOL_ID, { cwd: tmpCwd() });
  const modes = new Map();
  for (const node of definition.spec.graph.nodes) {
    for (const binding of node.operations) modes.set(binding.ref, binding.activation?.mode ?? 'required');
  }
  assert.deepEqual(
    Object.fromEntries([...modes.entries()].sort()),
    {
      'produce-candidate': 'required',
      'red-team-candidate': 'required',
      'red-team-recheck': 'driver-authorized',
      'review-candidate': 'required',
      'reviewer-recheck': 'driver-authorized',
      'revise-candidate': 'driver-authorized',
    },
  );
});

test('one live `fgos coordination run` drives the whole Master Coordination loop through the shipped fixture: candidate, first pass, authorized revision, authorized recheck, disposition, close', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const workEventsBefore = eventLines(cwd);
  const workStateBefore = stateView(cwd);
  const reqPath = writeRequest(cwd, 'master-loop.json', masterLoopRequest());

  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);

  assert.equal(data.kind, 'declared-protocol');
  assert.equal(data.coordinationId, COORDINATION_ID);
  assert.equal(data.definitionRef.id, PROTOCOL_ID);
  assert.equal(data.closed, true);
  assert.equal(data.status, 'completed');
  assert.deepEqual(data.quorum.missing, []);
  assert.deepEqual(data.quorum.failed, []);

  // Every step reported, in the order the request declared them.
  assert.deepEqual(
    data.steps.map((step) => [step.as, step.type]),
    [
      ['produce', 'operation'],
      ['review', 'operation'],
      ['red-team', 'operation'],
      ['authorize-revision', 'authorize'],
      ['revise', 'operation'],
      ['reject-first-pass', 'disposition'],
      ['authorize-reviewer-recheck', 'authorize'],
      ['reviewer-recheck', 'operation'],
      ['authorize-red-team-recheck', 'authorize'],
      ['red-team-recheck', 'operation'],
      ['accept-revision', 'disposition'],
    ],
  );

  const byLabel = Object.fromEntries(data.steps.map((step) => [step.as, step]));
  for (const label of ['produce', 'review', 'red-team', 'revise', 'reviewer-recheck', 'red-team-recheck']) {
    assert.equal(byLabel[label].status, 'done', `expected step "${label}" to settle done`);
    assert.match(byLabel[label].assignmentId, /^asgn_/);
  }
  for (const label of ['authorize-revision', 'authorize-reviewer-recheck', 'authorize-red-team-recheck', 'reject-first-pass', 'accept-revision']) {
    assert.equal(byLabel[label].appended, true, `expected step "${label}" to append a driver event`);
  }

  const opts = { cwd, repoRoot: cwd };
  const manifest = readManifest(COORDINATION_ID, opts);
  assert.equal(manifest.assignmentRefs.length, 6);
  assert.equal(manifest.workRef, null);

  // Recheck is not retry: six distinct Assignments, each with exactly one
  // linked result, and no run-retried anywhere.
  const events = readSessionEvents(COORDINATION_ID, opts);
  const kinds = events.reduce((acc, event) => ({ ...acc, [event.type]: (acc[event.type] ?? 0) + 1 }), {});
  assert.equal(kinds['assignment-created'], 6);
  assert.equal(kinds['result-linked'], 6);
  assert.equal(kinds['operation-authorized'], 3);
  assert.equal(kinds['driver-disposition-recorded'], 2);
  assert.equal(kinds['run-retried'], undefined);

  // Replay answers the whole round from events.jsonl/session.json alone.
  const replayed = replaySession(COORDINATION_ID, opts);
  assert.deepEqual(
    replayed.authorizations.map((record) => record.authorizationId).sort(),
    ['auth_red_team_recheck_1', 'auth_reviewer_recheck_1', 'auth_revision_1'],
  );
  assert.ok(replayed.authorizations.every((record) => record.consumedByAssignmentId !== null));
  assert.deepEqual(replayed.dispositions.map((record) => record.disposition), ['rejected', 'accepted']);
  // The reviewer ran twice, against two DIFFERENT artifact revisions -- the
  // original review carries no authorization, the recheck names the revised
  // artifact.
  const reviewerAssignments = replayed.assignments.filter((record) => record.actorId === 'reviewer');
  assert.equal(reviewerAssignments.length, 2);
  assert.equal(reviewerAssignments[0].authorizationId, undefined);
  const recheckAuthorization = replayed.authorizations.find((record) => record.authorizationId === reviewerAssignments[1].authorizationId);
  assert.equal(recheckAuthorization.targetArtifactRef, byLabel.revise.assignmentId);
  assert.notEqual(reviewerAssignments[0].assignmentId, reviewerAssignments[1].assignmentId);

  // No Work, no git, no repo mutation -- the whole point of a standalone proof.
  assert.deepEqual(eventLines(cwd), workEventsBefore, 'the standalone run must append no Work event at all');
  assert.deepEqual(stateView(cwd), workStateBefore, 'the standalone run must create or move no Work item');
  assert.equal(fs.existsSync(path.join(cwd, '.git')), false, 'the standalone run must not initialize a git repository');
  const FORBIDDEN_SESSION_FIELDS = ['missionId', 'sessionId', 'threadId', 'coordinationRef'];
  const rawEvents = fs.readFileSync(path.join(cwd, '.fgos', 'coordination', 'sessions', COORDINATION_ID, 'events.jsonl'), 'utf8');
  for (const field of FORBIDDEN_SESSION_FIELDS) {
    assert.equal(rawEvents.includes(`"${field}"`), false, `no session event may carry "${field}"`);
  }
  for (const assignmentId of manifest.assignmentRefs) {
    const raw = fs.readFileSync(path.join(cwd, '.fgos', 'assignments', assignmentId, 'assignment.json'), 'utf8');
    for (const field of [...FORBIDDEN_SESSION_FIELDS, 'coordinationId']) {
      assert.equal(raw.includes(`"${field}"`), false, `Assignment ${assignmentId} must stay session-blind (found "${field}")`);
    }
  }

  // `show` renders the closed session for a stranger, and changes nothing.
  const sessionDir = path.join(cwd, '.fgos', 'coordination', 'sessions', COORDINATION_ID);
  const eventsBefore = fs.readFileSync(path.join(sessionDir, 'events.jsonl'));
  const manifestBefore = fs.readFileSync(path.join(sessionDir, 'session.json'));
  const shown = run(cwd, ['coordination', 'show', COORDINATION_ID, '--json']);
  assert.equal(shown.status, 0, shown.stderr);
  const shownData = envelopeData(shown.stdout);
  assert.equal(shownData.status, 'completed');
  assert.equal(shownData.assignmentRefs.length, 6);
  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'events.jsonl')), eventsBefore);
  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'session.json')), manifestBefore);
});

// R4 substitution helper: no `$ref:` label survives across two separate
// `fgos coordination run` invocations (each call starts its own in-memory
// `labels` map in run.mjs) -- resolveRef's own documented "already
// safe-charset-checked id, an advanced/resume use case" path is exactly
// what a real resuming caller uses instead: the SECOND call's request names
// the FIRST call's own Assignment ids literally. Walks every string field a
// step can carry a `$ref:<label>` in (contextRefs/grantedContextRefs/
// targetArtifactRef/targetRef/evidenceRefs/fromAssignmentId).
function substituteAcrossCallBoundary(value, labelToAssignmentId) {
  if (typeof value === 'string' && value.startsWith('$ref:')) {
    const label = value.slice('$ref:'.length);
    return label in labelToAssignmentId ? labelToAssignmentId[label] : value;
  }
  if (Array.isArray(value)) return value.map((v) => substituteAcrossCallBoundary(v, labelToAssignmentId));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substituteAcrossCallBoundary(v, labelToAssignmentId)]));
  }
  return value;
}

test('R4: a real SECOND `fgos coordination run` invocation against the SAME coordinationId continues the session -- no duplicate Assignment, no reconsumed invocationKey, no lost disposition, no hidden-context leakage', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const workEventsBefore = eventLines(cwd);
  const workStateBefore = stateView(cwd);

  const full = masterLoopRequest();
  // Call 1 stops right after the revision is AUTHORIZED, before "fixer" (the
  // 4th and last required actor) ever runs -- a genuine mid-flight
  // interruption point: at least one Assignment (produce/review/red-team)
  // AND one authorization (authorize-revision) already landed, per R4's own
  // acceptance wording, but quorum cannot yet close the session (evaluated
  // per required-actor coverage: doer/reviewer/red-team done, fixer still
  // missing), so the session is provably still `active` when Call 2 starts.
  const firstSteps = full.steps.slice(0, 4); // produce, review, red-team, authorize-revision
  const secondStepsTemplate = full.steps.slice(4); // revise .. accept-revision
  assert.deepEqual(
    firstSteps.map((s) => s.as),
    ['produce', 'review', 'red-team', 'authorize-revision'],
  );

  const firstPath = writeRequest(cwd, 'master-loop-part1.json', { ...full, steps: firstSteps });
  const firstResult = run(cwd, ['coordination', 'run', '--file', firstPath]);
  assert.equal(firstResult.status, 0, firstResult.stderr);
  const firstData = envelopeData(firstResult.stdout);
  assert.equal(firstData.coordinationId, COORDINATION_ID);
  assert.equal(firstData.closed, false, 'quorum cannot close yet -- required actor "fixer" has not run');
  assert.deepEqual(firstData.quorum.missing.map((m) => m.actorId), ['fixer']);

  const labelToAssignmentId = Object.fromEntries(
    firstData.steps.filter((s) => s.type === 'operation').map((s) => [s.as, s.assignmentId]),
  );
  assert.equal(Object.keys(labelToAssignmentId).length, 3); // produce, review, red-team

  const assignmentsAfterFirst = fs.readdirSync(path.join(cwd, '.fgos', 'assignments')).sort();
  assert.equal(assignmentsAfterFirst.length, 3);
  const manifestAfterFirst = readManifest(COORDINATION_ID, { cwd, repoRoot: cwd });
  assert.equal(manifestAfterFirst.status, 'active', 'the session must genuinely still be active when Call 2 starts -- not already closed');

  const secondSteps = substituteAcrossCallBoundary(secondStepsTemplate, labelToAssignmentId);
  const secondPath = writeRequest(cwd, 'master-loop-part2.json', { ...full, steps: secondSteps });
  const secondResult = run(cwd, ['coordination', 'run', '--file', secondPath]);
  assert.equal(secondResult.status, 0, secondResult.stderr);
  const secondData = envelopeData(secondResult.stdout);
  assert.equal(secondData.coordinationId, COORDINATION_ID);
  assert.equal(secondData.closed, true);
  assert.equal(secondData.status, 'completed');
  assert.deepEqual(secondData.quorum.missing, []);
  assert.deepEqual(secondData.quorum.failed, []);

  const opts = { cwd, repoRoot: cwd };
  const manifest = readManifest(COORDINATION_ID, opts);
  // No duplicate Assignment: exactly 6 total across BOTH calls (4 from Call
  // 1, 2 rechecks from Call 2) -- Call 2 never re-materialized produce/
  // review/red-team/revise.
  assert.equal(manifest.assignmentRefs.length, 6);
  const assignmentsAfterSecond = fs.readdirSync(path.join(cwd, '.fgos', 'assignments')).sort();
  assert.equal(assignmentsAfterSecond.length, 6);
  for (const id of assignmentsAfterFirst) assert.ok(assignmentsAfterSecond.includes(id), `Call 1's Assignment "${id}" must survive Call 2 unchanged`);

  const events = readSessionEvents(COORDINATION_ID, opts);
  const kinds = events.reduce((acc, event) => ({ ...acc, [event.type]: (acc[event.type] ?? 0) + 1 }), {});
  assert.equal(kinds['assignment-created'], 6);
  assert.equal(kinds['result-linked'], 6);
  // No reconsumed invocationKey: exactly 3 `operation-authorized` across
  // BOTH calls (1 from Call 1, 2 from Call 2), 3 distinct invocationKeys.
  assert.equal(kinds['operation-authorized'], 3);
  const authEvents = events.filter((e) => e.type === 'operation-authorized');
  assert.equal(new Set(authEvents.map((e) => e.payload.invocationKey)).size, 3);
  assert.equal(new Set(authEvents.map((e) => e.payload.authorizationId)).size, 3);
  // No lost disposition: both Call 2 dispositions present, in log order.
  assert.equal(kinds['driver-disposition-recorded'], 2);
  const dispositionEvents = events.filter((e) => e.type === 'driver-disposition-recorded');
  assert.deepEqual(dispositionEvents.map((e) => e.payload.disposition), ['rejected', 'accepted']);
  assert.equal(kinds['run-retried'], undefined);

  // No hidden-context leakage: every Assignment Call 2 dispatched carries
  // EXACTLY the contextRefs the request declared for it (the revised
  // artifact's own Assignment id, resolved from Call 1's real output, not a
  // wider or stale set).
  const reviseId = secondData.steps.find((s) => s.as === 'revise').assignmentId;
  const reviewerRecheckId = secondData.steps.find((s) => s.as === 'reviewer-recheck').assignmentId;
  const reviewerRecheckAssignment = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'assignments', reviewerRecheckId, 'assignment.json'), 'utf8'));
  assert.deepEqual(reviewerRecheckAssignment.contextRefs, [reviseId]);

  const replayed = replaySession(COORDINATION_ID, opts);
  assert.deepEqual(
    replayed.authorizations.map((record) => record.authorizationId).sort(),
    ['auth_red_team_recheck_1', 'auth_reviewer_recheck_1', 'auth_revision_1'],
  );
  assert.ok(replayed.authorizations.every((record) => record.consumedByAssignmentId !== null));

  // R7: `coordination show` renders the final disposition/status for a
  // session Call 2 resumed, exactly as it already does for a single-call
  // session (P02.2's own rendering, confirmed unchanged, not reinvented).
  const shown = run(cwd, ['coordination', 'show', COORDINATION_ID, '--json']);
  assert.equal(shown.status, 0, shown.stderr);
  const shownData = envelopeData(shown.stdout);
  assert.equal(shownData.status, 'completed');
  assert.equal(shownData.assignmentRefs.length, 6);
  assert.deepEqual(shownData.dispositions.map((d) => d.disposition), ['rejected', 'accepted']);
  assert.equal(shownData.authorizations.length, 3);
  assert.deepEqual(shownData.pendingDriverAuthorizations, []);

  // No Work, no git, no repo mutation -- across BOTH calls together.
  assert.deepEqual(eventLines(cwd), workEventsBefore);
  assert.deepEqual(stateView(cwd), workStateBefore);
  assert.equal(fs.existsSync(path.join(cwd, '.git')), false);
});

test('R5 (resume-specific): once a session reaches a terminal status, a further CLI invocation naming the SAME coordinationId is refused -- terminal statuses stay absorbing across the resume door too, not just at open', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const reqPath = writeRequest(cwd, 'master-loop.json', masterLoopRequest());

  assert.equal(run(cwd, ['coordination', 'run', '--file', reqPath]).status, 0);
  const sessionDir = path.join(cwd, '.fgos', 'coordination', 'sessions', COORDINATION_ID);
  const eventsBefore = fs.readFileSync(path.join(sessionDir, 'events.jsonl'));
  const manifestBefore = fs.readFileSync(path.join(sessionDir, 'session.json'));
  const assignmentsBefore = fs.readdirSync(path.join(cwd, '.fgos', 'assignments')).sort();
  assert.equal(JSON.parse(manifestBefore).status, 'completed');

  // Same request file, same coordinationId -- resume now SKIPS the old
  // "already exists" refusal and reaches the dispatch door instead, which
  // refuses for the real reason: the session is no longer active.
  const second = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /session "coord_master_loop_live" is not active \(status: "completed"\)/);

  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'events.jsonl')), eventsBefore);
  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'session.json')), manifestBefore);
  assert.deepEqual(fs.readdirSync(path.join(cwd, '.fgos', 'assignments')).sort(), assignmentsBefore);
});

test('the live request without its authorize steps cannot reach the revision or recheck operations at all', () => {
  const cwd = tmpCwd();
  writeFakeExecutorConfig(cwd);
  const request = masterLoopRequest();
  request.steps = request.steps.filter((step) => step.type !== 'authorize' && step.type !== 'disposition');
  const reqPath = writeRequest(cwd, 'unauthorized.json', request);

  const result = run(cwd, ['coordination', 'run', '--file', reqPath]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /declares activation\.mode "driver-authorized", and no unconsumed "operation-authorized" event/);

  const manifest = readManifest(COORDINATION_ID, { cwd, repoRoot: cwd });
  // produce + review + red-team only: the revision never materialized.
  assert.equal(manifest.assignmentRefs.length, 3);
});
