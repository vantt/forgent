import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legalNext, authorize, visibility, completion } from '../../src/runner/coordination/read-evaluators.mjs';
import { openSession, createSessionAssignment, transitionSessionStatus, authorizeOperation, resolveSessionPaths, readManifest } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { openStandaloneSession, validateConsultProposal, PRIMARY_ACTOR_ID } from '../../src/runner/coordination/session-engine.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-read-evaluator-test-'));
}

function inlineContract(overrides = {}) {
  return {
    objective: 'Gather background facts.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json (status, summary)'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
    ...overrides,
  };
}

// ─── No adapter/mutation surface ────────────────────────────────────────────
// Static grep guard: the leased module must never import fs/child_process/
// network or any adapter -- AD-11's "adapters own filesystem/CLI details;
// domain decisions live in pure evaluators" boundary, enforced structurally
// rather than by convention alone.

const READ_EVALUATORS_PATH = path.resolve(fileURLToPath(import.meta.url), '../../../src/runner/coordination/read-evaluators.mjs');

// Strips `// line` and `/* block */` comments before the mutation-guard
// regex runs over source text -- a comment merely MENTIONING a mutation-
// sounding word (documenting what this module extracts FROM, e.g. "extracted
// from store.mjs's assertDriverIdentity") is not a mutation call, and must
// not false-positive the guard the way a whole-file scan does.
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('read-evaluators.mjs imports no fs/child_process/network/adapter module', () => {
  const source = fs.readFileSync(READ_EVALUATORS_PATH, 'utf8');
  const importLines = source.split('\n').filter((line) => /^\s*import\b/.test(line));
  assert.ok(importLines.length > 0, 'expected at least one import (schema.mjs constants)');
  for (const line of importLines) {
    assert.ok(!/['"]node:fs['"]|['"]fs['"]/.test(line), `unexpected fs import: ${line}`);
    assert.ok(!/['"]node:child_process['"]|['"]child_process['"]/.test(line), `unexpected child_process import: ${line}`);
    assert.ok(!/['"]node:net['"]|['"]node:http['"]|['"]node:https['"]/.test(line), `unexpected network import: ${line}`);
    assert.ok(!/adapter/i.test(line), `unexpected adapter import: ${line}`);
    assert.ok(!/store\.mjs|replay\.mjs|dispatch\//.test(line), `unexpected write-door/adapter dependency: ${line}`);
  }
});

test('read-evaluators.mjs source never mutates (no fs.write/appendEvent/dispatch calls anywhere in the file body)', () => {
  const source = stripComments(fs.readFileSync(READ_EVALUATORS_PATH, 'utf8'));
  assert.ok(!/fs\.\w+Sync/.test(source), 'unexpected fs.*Sync call in a pure evaluator module');
  assert.ok(!/appendEvent|writeManifest|executeAssignment|child_process/.test(source), 'unexpected mutation/execution call in a pure evaluator module');
});

test('stripComments: a comment mentioning a mutation-sounding word does not false-positive the mutation guard', () => {
  const fixtureSource = [
    '// Extracted from store.mjs: appendEvent/writeManifest/executeAssignment',
    '// and child_process are what the write door does, this module never does.',
    '/* fs.writeFileSync / child_process.execSync also mentioned here */',
    'export function pureFn(x) { return x; }',
  ].join('\n');
  const stripped = stripComments(fixtureSource);
  assert.ok(!/fs\.\w+Sync/.test(stripped), 'fs.*Sync mention inside a comment must be stripped');
  assert.ok(!/appendEvent|writeManifest|executeAssignment|child_process/.test(stripped), 'mutation-sounding words inside comments must be stripped');
  assert.match(stripped, /export function pureFn/, 'real code outside comments must survive stripping');
});

// ─── Determinism ─────────────────────────────────────────────────────────────

test('legalNext is a pure deterministic function of its arguments', () => {
  const snapshot = Object.freeze({ manifest: Object.freeze({ coordinationId: 'coord_det', status: 'active' }) });
  const facts = Object.freeze({ requestedAction: Object.freeze({ type: 'transition', status: 'completed' }) });
  const a = legalNext(snapshot, facts);
  const b = legalNext(snapshot, facts);
  assert.deepEqual(a, b);
  assert.equal(a.kind, 'action');
});

test('authorize is a pure deterministic function of its arguments', () => {
  const facts = Object.freeze({
    manifest: Object.freeze({ coordinationId: 'coord_det', provenanceRoot: Object.freeze({ writerId: 'writer-1' }) }),
    authorizedBy: Object.freeze({ id: 'writer-2' }),
  });
  const a = authorize({ label: 'authorize' }, facts);
  const b = authorize({ label: 'authorize' }, facts);
  assert.deepEqual(a, b);
  assert.equal(a.kind, 'needs-input');
});

test('visibility is a pure deterministic function of its arguments', () => {
  const snapshot = Object.freeze({ manifest: Object.freeze({ coordinationId: 'coord_det' }), assignmentRefs: Object.freeze(['asgn_own']) });
  const caller = Object.freeze({ requestedRefs: Object.freeze(['asgn_own', 'asgn_foreign', 'contribution:x']), knownAssignmentIds: Object.freeze(['asgn_own', 'asgn_foreign']) });
  const a = visibility(snapshot, caller);
  const b = visibility(snapshot, caller);
  assert.deepEqual(a, b);
  assert.deepEqual(a.visibleRefs, ['asgn_own']);
  assert.equal(a.deniedRefs.length, 2);
});

// ─── Regression: fail-closed guards ─────────────────────────────────────────

test('visibility denies a blank/whitespace-only ref', () => {
  const snapshot = Object.freeze({ manifest: Object.freeze({ coordinationId: 'coord_blank_ref' }), assignmentRefs: Object.freeze([]) });
  const projection = visibility(snapshot, { requestedRefs: ['   '] });
  assert.equal(projection.visibleRefs.length, 0);
  assert.equal(projection.deniedRefs.length, 1);
  assert.match(projection.deniedRefs[0].reason, /must be a non-empty string/);
});

test('visibility fails closed (denies, does not iterate characters) when requestedRefs is not an array', () => {
  const snapshot = Object.freeze({ manifest: Object.freeze({ coordinationId: 'coord_non_array_refs' }), assignmentRefs: Object.freeze([]) });
  const projection = visibility(snapshot, { requestedRefs: 'asgn_own' });
  assert.deepEqual(projection.visibleRefs, []);
  assert.equal(projection.deniedRefs.length, 1);
  assert.match(projection.deniedRefs[0].reason, /must be an array/);
});

test('authorize rejects an authorizedBy missing the required "type" field', () => {
  const facts = {
    manifest: { coordinationId: 'coord_shape', provenanceRoot: { writerId: 'writer-1' } },
    authorizedBy: { id: 'writer-1' },
  };
  const verdict = authorize({ label: 'authorize' }, facts);
  assert.equal(verdict.kind, 'needs-input');
  assert.match(verdict.reason, /type must be "driver"/);
});

test('authorize rejects an authorizedBy with a non-"driver" type', () => {
  const facts = {
    manifest: { coordinationId: 'coord_shape', provenanceRoot: { writerId: 'writer-1' } },
    authorizedBy: { type: 'worker', id: 'writer-1' },
  };
  const verdict = authorize({ label: 'authorize' }, facts);
  assert.equal(verdict.kind, 'needs-input');
  assert.match(verdict.reason, /type must be "driver"/);
});

test('authorize rejects an authorizedBy carrying an unknown extra field', () => {
  const facts = {
    manifest: { coordinationId: 'coord_shape', provenanceRoot: { writerId: 'writer-1' } },
    authorizedBy: { type: 'driver', id: 'writer-1', extra: 'unexpected' },
  };
  const verdict = authorize({ label: 'authorize' }, facts);
  assert.equal(verdict.kind, 'needs-input');
  assert.match(verdict.reason, /unknown field "extra"/);
});

test('authorize rejects an undefined authorizedBy', () => {
  const facts = {
    manifest: { coordinationId: 'coord_shape', provenanceRoot: { writerId: 'writer-1' } },
    authorizedBy: undefined,
  };
  const verdict = authorize({ label: 'authorize' }, facts);
  assert.equal(verdict.kind, 'needs-input');
  assert.match(verdict.reason, /must be a non-null object/);
});

test('completion is a pure deterministic function of its arguments', () => {
  const snapshot = Object.freeze({ manifest: Object.freeze({ coordinationId: 'coord_det', status: 'partial' }) });
  const a = completion(snapshot, {});
  const b = completion(snapshot, {});
  assert.deepEqual(a, b);
  assert.equal(a.kind, 'incomplete');
});

// ─── Schema-1 fixture parity: legalNext/completion vs transitionSessionStatus ──

test('legalNext/completion parity: an active session is legal-next "proceed" and completion "unknown"', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'coord_parity_active', objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const snapshot = replaySession('coord_parity_active', { cwd: tempDir });

  assert.equal(legalNext(snapshot, {}).kind, 'action');
  assert.equal(completion(snapshot, {}).kind, 'unknown');

  // Real write door: nothing throws "is not active" yet.
  assert.doesNotThrow(() => transitionSessionStatus('coord_parity_active', 'completed', {}, { cwd: tempDir }));
});

for (const [status, extra] of [
  ['completed', {}],
  ['partial', { missingActors: ['specialist'] }],
  ['failed', { reason: 'aggregate bounds exhausted' }],
  ['cancelled', { reason: 'operator stopped the loop' }],
]) {
  test(`legalNext/completion parity: once transitioned to "${status}", legalNext blocks and completion matches transitionSessionStatus's own terminal split`, () => {
    const tempDir = mkTempDir();
    const coordinationId = `coord_parity_${status}`;
    openSession({ coordinationId, objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
    transitionSessionStatus(coordinationId, status, extra, { cwd: tempDir });
    const snapshot = replaySession(coordinationId, { cwd: tempDir });

    const next = legalNext(snapshot, {});
    assert.equal(next.kind, 'blocked');
    assert.match(next.reason, /is not active/);

    // The real write door refuses a second write once terminal, with the
    // SAME "is not active" wording -- identical legality verdict.
    assert.throws(
      () => transitionSessionStatus(coordinationId, 'completed', {}, { cwd: tempDir }),
      (err) => err instanceof CoordinationError && /is not active/.test(err.message),
    );

    const done = completion(snapshot, {});
    if (status === 'completed') {
      assert.equal(done.kind, 'complete');
    } else {
      assert.equal(done.kind, 'incomplete');
    }
  });
}

// ─── Schema-1 fixture parity: authorize vs authorizeOperation's driver gate ──

function authorizationParams(overrides = {}) {
  return {
    authorizationId: 'auth_parity',
    operationId: 'reviewer-recheck',
    nodeId: 'phase-recheck',
    targetActorId: 'reviewer',
    invocationKey: 'recheck:auth_parity',
    authorizedBy: { type: 'driver', id: 'writer-1' },
    reason: 'Recheck the revised candidate.',
    grantedContextRefs: [],
    ...overrides,
  };
}

test('authorize parity: a driver identity matching provenanceRoot.writerId is allowed, matching authorizeOperation succeeding', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_parity_driver_ok';
  openSession({ coordinationId, objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const manifest = readManifest(coordinationId, { cwd: tempDir });

  const verdict = authorize({ label: 'authorizeOperation', subject: 'an authorization' }, { manifest, authorizedBy: { type: 'driver', id: 'writer-1' } });
  assert.equal(verdict.kind, 'allowed');

  assert.doesNotThrow(() => authorizeOperation(coordinationId, authorizationParams(), { cwd: tempDir }));
});

test('authorize parity: a driver identity NOT matching provenanceRoot.writerId needs-input, matching authorizeOperation throwing a driver-identity error', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_parity_driver_bad';
  openSession({ coordinationId, objective: 'Consult.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const manifest = readManifest(coordinationId, { cwd: tempDir });

  const verdict = authorize({ label: 'authorizeOperation', subject: 'an authorization' }, { manifest, authorizedBy: { type: 'driver', id: 'writer-9' } });
  assert.equal(verdict.kind, 'needs-input');
  assert.match(verdict.reason, /driver identity/);

  assert.throws(
    () => authorizeOperation(coordinationId, authorizationParams({ authorizedBy: { type: 'driver', id: 'writer-9' } }), { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /driver identity/.test(err.message),
  );
});

// ─── Schema-1 fixture parity: visibility vs validateConsultProposal's
// assertRefsOwnedBySession sibling/foreign-leakage gate ─────────────────────

function openPrimarySession(coordinationId, tempDir) {
  openStandaloneSession({ coordinationId, objective: 'Investigate.', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });
  return createSessionAssignment(
    { coordinationId, taskKey: 'primary', actorId: PRIMARY_ACTOR_ID, contract: inlineContract(), caller: { writerId: 'writer-1' } },
    { cwd: tempDir },
  ).assignmentId;
}

function consultParams(primaryAssignmentId, overrides = {}) {
  return {
    primaryAssignmentId,
    role: 'reviewer',
    objective: 'Double-check the primary finding.',
    evidenceRequired: 'reported',
    contextRefs: [],
    ...overrides,
  };
}

test('visibility parity: own-session assignment ref is visible, matching validateConsultProposal accepting it', () => {
  const tempDir = mkTempDir();
  const primaryId = openPrimarySession('coord_parity_ref_own', tempDir);
  const snapshot = replaySession('coord_parity_ref_own', { cwd: tempDir });

  const projection = visibility(snapshot, { requestedRefs: [primaryId], knownAssignmentIds: [primaryId] });
  assert.deepEqual(projection.visibleRefs, [primaryId]);
  assert.equal(projection.deniedRefs.length, 0);

  assert.doesNotThrow(() => validateConsultProposal('coord_parity_ref_own', consultParams(primaryId, { contextRefs: [primaryId] }), { cwd: tempDir }));
});

test('visibility parity: a foreign session\'s real Assignment ref is denied, matching validateConsultProposal rejecting it', () => {
  const tempDir = mkTempDir();
  const primaryId = openPrimarySession('coord_parity_ref_foreign_asgn', tempDir);
  const foreignPrimaryId = openPrimarySession('coord_parity_ref_foreign_asgn_other', tempDir);
  const snapshot = replaySession('coord_parity_ref_foreign_asgn', { cwd: tempDir });

  // Ground truth for "known to exist on disk", queried the same way
  // assertRefsOwnedBySession itself resolves existence -- fs.existsSync,
  // never assumed.
  const { fgosDir } = resolveSessionPaths('coord_parity_ref_foreign_asgn', { cwd: tempDir });
  const foreignAssignmentExists = fs.existsSync(path.join(fgosDir, 'assignments', foreignPrimaryId, 'assignment.json'));
  assert.ok(foreignAssignmentExists);

  const projection = visibility(snapshot, { requestedRefs: [foreignPrimaryId], knownAssignmentIds: [foreignPrimaryId] });
  assert.equal(projection.visibleRefs.length, 0);
  assert.equal(projection.deniedRefs.length, 1);
  assert.match(projection.deniedRefs[0].reason, /not a member of coordination session/);

  assert.throws(
    () => validateConsultProposal('coord_parity_ref_foreign_asgn', consultParams(primaryId, { contextRefs: [foreignPrimaryId] }), { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /not a member of coordination session/.test(err.message),
  );
});

test('visibility parity: a foreign session id ref is denied, matching validateConsultProposal rejecting cross-session refs', () => {
  const tempDir = mkTempDir();
  const primaryId = openPrimarySession('coord_parity_ref_foreign_session', tempDir);
  openPrimarySession('coord_parity_ref_foreign_session_other', tempDir);
  const snapshot = replaySession('coord_parity_ref_foreign_session', { cwd: tempDir });

  const { fgosDir } = resolveSessionPaths('coord_parity_ref_foreign_session', { cwd: tempDir });
  const foreignSessionExists = fs.existsSync(path.join(fgosDir, 'coordination', 'sessions', 'coord_parity_ref_foreign_session_other', 'session.json'));
  assert.ok(foreignSessionExists);

  const projection = visibility(snapshot, { requestedRefs: ['coord_parity_ref_foreign_session_other'], knownSessionIds: ['coord_parity_ref_foreign_session_other'] });
  assert.equal(projection.visibleRefs.length, 0);
  assert.match(projection.deniedRefs[0].reason, /different coordination session/);

  assert.throws(
    () => validateConsultProposal('coord_parity_ref_foreign_session', consultParams(primaryId, { contextRefs: ['coord_parity_ref_foreign_session_other'] }), { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /different coordination session/.test(err.message),
  );
});

test('visibility parity: a contribution: ref is denied, matching validateConsultProposal rejecting the reserved namespace', () => {
  const tempDir = mkTempDir();
  const primaryId = openPrimarySession('coord_parity_ref_contribution', tempDir);
  const snapshot = replaySession('coord_parity_ref_contribution', { cwd: tempDir });

  const projection = visibility(snapshot, { requestedRefs: ['contribution:some-id@1'] });
  assert.equal(projection.visibleRefs.length, 0);
  assert.match(projection.deniedRefs[0].reason, /reserved "contribution:" namespace/);

  assert.throws(
    () => validateConsultProposal('coord_parity_ref_contribution', consultParams(primaryId, { contextRefs: ['contribution:some-id@1'] }), { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /reserved "contribution:" namespace/.test(err.message),
  );
});

test('visibility parity: a ref that merely looks like an Assignment id but resolves to nothing real is left visible, matching validateConsultProposal accepting it', () => {
  const tempDir = mkTempDir();
  const primaryId = openPrimarySession('coord_parity_ref_phantom', tempDir);
  const snapshot = replaySession('coord_parity_ref_phantom', { cwd: tempDir });

  const { fgosDir } = resolveSessionPaths('coord_parity_ref_phantom', { cwd: tempDir });
  const phantomRef = 'asgn_does_not_exist_anywhere';
  assert.ok(!fs.existsSync(path.join(fgosDir, 'assignments', phantomRef, 'assignment.json')));

  const projection = visibility(snapshot, { requestedRefs: [phantomRef], knownAssignmentIds: [] });
  assert.deepEqual(projection.visibleRefs, [phantomRef]);
  assert.equal(projection.deniedRefs.length, 0);

  assert.doesNotThrow(() => validateConsultProposal('coord_parity_ref_phantom', consultParams(primaryId, { contextRefs: [phantomRef] }), { cwd: tempDir }));
});
