// coordination-group-thinking-pack.test.mjs -- Phase 10 (Step 09) P10.1
// proof for the group-thinking Protocol Pack registry and its one gate,
// `src/verbs/coordination/group-thinking-pack.mjs`.
//
// What this proves, and only this: (1) the shipped pack registry
// (`core/protocol-packs/group-thinking.json`) loads and is empty, ready for
// P10.2-P10.4's three definitions without this cell pre-guessing their ids;
// (2) `resolvePackProtocol` refuses an unset protocol id, an id that is not
// a registered pack member (even when that id IS separately loadable
// through `protocol-loader.mjs`), and a pack-pinned version that has
// drifted from the real registered definition; (3) `runGroupThinkingRequest`
// refuses a request whose own `protocolRef.id` disagrees with the caller's
// explicit selection, and a `kind: "agent-led"` request (no bound
// definition to gate); (4) a genuinely pack-registered request runs
// end-to-end through the REAL `runCoordinationUseCase` door
// (`src/verbs/coordination/run.mjs`) with no altered behavior, against the
// real, already-shipped `core/coordination-protocols/declared-consult.yaml`
// fixture -- proving a real dispatch, never a faked/inlined protocol; (5)
// (mid-flight addendum, 2026-09-04) a request naming a DIFFERENT executor
// per actor (`actors[].executor`) reaches `run.mjs`'s real
// `actorPolicyFields` per-actor resolution completely unchanged -- this
// pack gate never collapses a session onto one hardcoded provider, because
// `runGroupThinkingRequest` never reads or reconstructs `requestObject.actors`
// at all; it only peeks `kind`/`protocolRef.id` (see `group-thinking-pack.mjs`'s
// own `peekRequest`) and forwards the request object byte-for-byte; (6)
// (fix round 1, 2026-09-04, independent Red-Team HIGH finding) resuming an
// EXISTING `coordinationId` is refused when the caller's claimed
// `protocolId` disagrees with that session's REAL bound protocol
// (`manifest.definitionRef.id`), even when the claim is otherwise
// self-consistent and a real pack member -- closing a PoC-proven gap where
// a session opened directly under a non-pack protocol could be dispatched
// against through this gate while it believed a different, pack-approved
// protocol was in force; a genuine same-protocol resume still succeeds.
//
// Every fixture below uses `packPath`, an explicit test-only override on
// `loadProtocolPack`/`resolvePackProtocol`/`runGroupThinkingRequest`, so the
// REAL shipped `core/protocol-packs/group-thinking.json` (committed empty,
// per this cell's own design) is never mutated by this suite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadProtocolPack,
  resolvePackProtocol,
  runGroupThinkingRequest,
} from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';

const REAL_PACK_PATH = path.resolve(import.meta.dirname, '../../core/protocol-packs/group-thinking.json');
const DECLARED_CONSULT_ID = 'core.coordination-protocol.declared-consult';
const INDEPENDENT_RESEARCH_ID = 'core.coordination-protocol.independent-research-fan-out-fan-in';

function eventsPath(tempDir, coordinationId) {
  return path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
}

function countEventLines(tempDir, coordinationId) {
  const p = eventsPath(tempDir, coordinationId);
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, 'utf8').split('\n').filter((line) => line.trim() !== '').length;
}

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-group-thinking-pack-test-'));
}

function writePack(tempDir, { members = [] } = {}) {
  const packPath = path.join(tempDir, 'test-pack.json');
  fs.writeFileSync(
    packPath,
    JSON.stringify({ apiVersion: 'fgos.dev/v1alpha1', kind: 'ProtocolPack', metadata: { id: 'group-thinking' }, members }, null, 2),
  );
  return packPath;
}

// ---------------------------------------------------------------------
// 1. The shipped registry itself.

test('the shipped group-thinking pack registry loads and is well-formed', () => {
  // P10.1 shipped this pack empty (`members: []`) by design -- P10.5
  // registers RFC-Review-Lite/Nominal-Group-Lite/Delphi-Feedback-Lite
  // through one writer. This test only re-asserts the registry's own shape
  // invariants (P10.1's own scope); the real registered membership is
  // covered by test/verbs/coordination-group-thinking-pack-registration.test.mjs
  // (P10.5), which is the one test file expected to change when membership
  // changes -- this file should not need editing again for a future
  // registration change.
  const pack = loadProtocolPack();
  assert.equal(pack.apiVersion, 'fgos.dev/v1alpha1');
  assert.equal(pack.kind, 'ProtocolPack');
  assert.equal(pack.metadata.id, 'group-thinking');
  assert.ok(Array.isArray(pack.members), 'members must be an array (possibly populated -- P10.5 registers the three group-thinking-lite protocols here)');
  assert.ok(fs.existsSync(REAL_PACK_PATH), 'sanity: the default packPath really does resolve to the committed file');
});

test('loadProtocolPack returns a frozen structure -- callers cannot mutate the registry in place', () => {
  const pack = loadProtocolPack();
  assert.throws(() => {
    pack.members.push({ id: 'x', version: '1.0.0' });
  });
  assert.throws(() => {
    pack.metadata.id = 'tampered';
  });
});

test('loadProtocolPack refuses a missing pack file', () => {
  const tempDir = mkTempDir();
  assert.throws(
    () => loadProtocolPack({ packPath: path.join(tempDir, 'does-not-exist.json') }),
    (err) => err instanceof StoreError && err.category === 'validation' && /no pack registry found/.test(err.message),
  );
});

test('loadProtocolPack refuses a malformed pack document (wrong kind, non-array members, member missing version)', () => {
  const tempDir = mkTempDir();

  const wrongKind = path.join(tempDir, 'wrong-kind.json');
  fs.writeFileSync(wrongKind, JSON.stringify({ apiVersion: 'fgos.dev/v1alpha1', kind: 'FlowDefinition', metadata: { id: 'x' }, members: [] }));
  assert.throws(() => loadProtocolPack({ packPath: wrongKind }), (err) => err instanceof StoreError && /kind "FlowDefinition"/.test(err.message));

  const nonArrayMembers = path.join(tempDir, 'non-array-members.json');
  fs.writeFileSync(nonArrayMembers, JSON.stringify({ apiVersion: 'fgos.dev/v1alpha1', kind: 'ProtocolPack', metadata: { id: 'x' }, members: {} }));
  assert.throws(() => loadProtocolPack({ packPath: nonArrayMembers }), (err) => err instanceof StoreError && /"members".*must be an array/.test(err.message));

  const missingVersion = path.join(tempDir, 'missing-version.json');
  fs.writeFileSync(
    missingVersion,
    JSON.stringify({ apiVersion: 'fgos.dev/v1alpha1', kind: 'ProtocolPack', metadata: { id: 'x' }, members: [{ id: 'some.protocol' }] }),
  );
  assert.throws(() => loadProtocolPack({ packPath: missingVersion }), (err) => err instanceof StoreError && /missing a non-empty "version"/.test(err.message));

  const duplicateId = path.join(tempDir, 'duplicate-id.json');
  fs.writeFileSync(
    duplicateId,
    JSON.stringify({
      apiVersion: 'fgos.dev/v1alpha1',
      kind: 'ProtocolPack',
      metadata: { id: 'x' },
      members: [
        { id: 'some.protocol', version: '1.0.0' },
        { id: 'some.protocol', version: '2.0.0' },
      ],
    }),
  );
  assert.throws(() => loadProtocolPack({ packPath: duplicateId }), (err) => err instanceof StoreError && /duplicate member id/.test(err.message));
});

// ---------------------------------------------------------------------
// 2. resolvePackProtocol -- the explicit-selection gate.

test('resolvePackProtocol refuses an unset or empty protocol id -- no default, no inference', () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir);
  for (const protocolId of [undefined, '', '   ']) {
    assert.throws(
      () => resolvePackProtocol(protocolId, { packPath }),
      (err) => err instanceof StoreError && err.category === 'validation' && /must be explicitly given/.test(err.message),
    );
  }
});

test('resolvePackProtocol refuses a protocol id that is not a registered pack member, even though it IS separately loadable via protocol-loader.mjs', () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [] }); // deliberately empty -- declared-consult is real, but not registered in THIS pack
  assert.throws(
    () => resolvePackProtocol(DECLARED_CONSULT_ID, { packPath }),
    (err) => err instanceof StoreError && /is not a registered member/.test(err.message) && /none registered yet/.test(err.message),
  );
});

test('resolvePackProtocol succeeds for a real, correctly-pinned pack member and returns its definition', () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  const resolved = resolvePackProtocol(DECLARED_CONSULT_ID, { packPath });
  assert.equal(resolved.id, DECLARED_CONSULT_ID);
  assert.equal(resolved.version, '1.0.0');
  assert.equal(resolved.definition.metadata.id, DECLARED_CONSULT_ID);
  assert.equal(resolved.definition.spec.profile.kind, 'CoordinationProtocol');
});

test('resolvePackProtocol refuses a pack-pinned version that has drifted from the real registered definition', () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '99.0.0' }] });
  assert.throws(
    () => resolvePackProtocol(DECLARED_CONSULT_ID, { packPath }),
    (err) => err instanceof StoreError && /pinned to version "99\.0\.0"/.test(err.message) && /is now version "1\.0\.0"/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// 3. runGroupThinkingRequest -- refusal shapes reachable without any dispatch.

test('runGroupThinkingRequest refuses when protocolId is unset, even before the request object is inspected', async () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        { packPath, requestObject: { kind: 'declared-protocol', protocolRef: { id: DECLARED_CONSULT_ID } } },
      ),
    (err) => err instanceof StoreError && /must be explicitly given/.test(err.message),
  );
});

test('runGroupThinkingRequest refuses a kind:"agent-led" request -- no bound protocol for this pack to gate', async () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        { packPath, protocolId: DECLARED_CONSULT_ID, requestObject: { kind: 'agent-led', objective: 'x', writerId: 'w' } },
      ),
    (err) => err instanceof StoreError && /kind must be "declared-protocol"/.test(err.message),
  );
});

test('runGroupThinkingRequest refuses when the request body\'s protocolRef.id disagrees with the explicitly selected protocolId', async () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        { packPath, protocolId: DECLARED_CONSULT_ID, requestObject: { kind: 'declared-protocol', protocolRef: { id: 'core.coordination-protocol.something-else' } } },
      ),
    (err) => err instanceof StoreError && /does not match the explicitly selected protocolId/.test(err.message),
  );
});

test('runGroupThinkingRequest refuses an unregistered protocolId before ever reading the request file', async () => {
  const tempDir = mkTempDir();
  const packPath = writePack(tempDir, { members: [] });
  const requestPath = path.join(tempDir, 'request.json');
  // Intentionally NOT written -- if the gate read the file before checking
  // pack membership, this would throw an unrelated ENOENT instead.
  await assert.rejects(
    () => runGroupThinkingRequest({ cwd: tempDir, repoRoot: tempDir }, { packPath, protocolId: DECLARED_CONSULT_ID, requestPath }),
    (err) => err instanceof StoreError && /is not a registered member/.test(err.message),
  );
  assert.equal(fs.existsSync(requestPath), false);
});

// ---------------------------------------------------------------------
// 4. Real end-to-end dispatch through the real door.

function fakeExecutor(tempDir) {
  const executorScript = path.join(tempDir, 'fake-executor.mjs');
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
  const fgosDir = path.join(tempDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(
    path.join(fgosDir, 'config.json'),
    JSON.stringify(
      {
        runner: {
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

test('a pack-registered request runs end-to-end through the real runCoordinationUseCase door, byte-identical in shape to a hand-authored request', async () => {
  const tempDir = mkTempDir();
  fakeExecutor(tempDir);
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });

  const request = {
    kind: 'declared-protocol',
    objective: 'Prove the group-thinking pack gate dispatches through the real door, not a second one.',
    writerId: 'group-thinking-pack-test',
    coordinationId: 'coord_group_thinking_pack_test',
    protocolRef: { id: DECLARED_CONSULT_ID },
    steps: [
      { type: 'operation', as: 'req', operationId: 'request-consult', objective: 'Should the pack gate be this thin?', expectedOutputs: OUTPUTS },
      {
        type: 'operation',
        as: 'resp',
        operationId: 'provide-consult',
        objective: 'Answer the consult.',
        expectedOutputs: OUTPUTS,
        contextRefs: ['$ref:req'],
        fromAssignmentId: '$ref:req',
      },
    ],
  };

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    { packPath, protocolId: DECLARED_CONSULT_ID, requestObject: request },
  );

  assert.equal(result.coordinationId, 'coord_group_thinking_pack_test');
  assert.equal(result.kind, 'declared-protocol');
  assert.deepEqual(result.definitionRef, { id: DECLARED_CONSULT_ID, version: '1.0.0' });
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0].status, 'done');
  assert.equal(result.steps[1].status, 'done');
  // completion.mode: synthesize with both required actors covered -- the
  // engine's own automatic close-on-quorum (run.mjs) closes it, unaided by
  // anything this gate does.
  assert.equal(result.closed, true);
});

test('resuming through the pack gate reaches the SAME session runGroupThinkingRequest opened -- resume is run.mjs\'s own behavior, inherited for free', async () => {
  const tempDir = mkTempDir();
  fakeExecutor(tempDir);
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  const coordinationId = 'coord_group_thinking_pack_resume_test';
  const writerId = 'group-thinking-pack-resume-test';

  const first = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    {
      packPath,
      protocolId: DECLARED_CONSULT_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Open, first step only.',
        writerId,
        coordinationId,
        protocolRef: { id: DECLARED_CONSULT_ID },
        steps: [{ type: 'operation', as: 'req', operationId: 'request-consult', objective: 'First step.', expectedOutputs: OUTPUTS }],
      },
    },
  );
  assert.equal(first.closed, false, 'sanity: not closeable yet -- the consultant has not answered');

  const second = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    {
      packPath,
      protocolId: DECLARED_CONSULT_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Resume, second step.',
        writerId,
        coordinationId,
        protocolRef: { id: DECLARED_CONSULT_ID },
        // A resumed request opens a NEW `labels` scope inside `run.mjs`
        // (per-call, never carried across requests) -- `$ref:req` from the
        // first call has nothing to resolve here, so the first call's own
        // real assignment id is passed as a literal ref instead, exactly as
        // an advanced hand-authored resume request would.
        steps: [
          {
            type: 'operation',
            as: 'resp',
            operationId: 'provide-consult',
            objective: 'Answer.',
            expectedOutputs: OUTPUTS,
            contextRefs: [first.steps[0].assignmentId],
            fromAssignmentId: first.steps[0].assignmentId,
          },
        ],
      },
    },
  );
  assert.equal(second.coordinationId, coordinationId);
  assert.equal(second.closed, true);
});

// ---------------------------------------------------------------------
// 4a. Fix round 1 (2026-09-04): the resume cross-check against the
// session's REAL bound protocol -- HIGH finding from the independent
// Red-Team round. Reproduces their exact PoC shape: open a session
// DIRECTLY (bypassing the pack entirely, the same way a non-pack caller
// or `fgos coordination run --file` against a hand-authored request
// could) under a real protocol that is NOT a pack member, then call
// `runGroupThinkingRequest` against the SAME `coordinationId` claiming a
// DIFFERENT, pack-registered protocol -- self-consistent by the caller's
// own claim (protocolId === protocolRef.id, both pack members), so the
// pre-fix gate believed and reported the claimed protocol was selected
// while the session's real governing definition never changed.

test('runGroupThinkingRequest refuses to resume a session that was really opened under a DIFFERENT, non-pack protocol -- Red-Team PoC repro (HIGH, fix round 1)', async () => {
  const tempDir = mkTempDir();
  // Pack registers ONLY declared-consult -- independent-research-fan-out-fan-in
  // is a real, separately-loadable protocol (like group-cognition-framework.yaml
  // would be) that is deliberately NOT a pack member.
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  const coordinationId = 'coord_group_thinking_pack_resume_mismatch_test';
  const writerId = 'group-thinking-pack-resume-mismatch-test';

  // Opened DIRECTLY, bypassing the pack gate entirely -- exactly what the
  // Red-Team's PoC did (their "opened a session directly under a
  // non-pack-member protocol").
  const opened = openDeclaredProtocolSession(
    { definitionId: INDEPENDENT_RESEARCH_ID, coordinationId, objective: 'Opened directly, outside the pack.', writerId },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(opened.definitionRef.id, INDEPENDENT_RESEARCH_ID, 'sanity: the session really is bound to the non-pack protocol');
  // Baseline is "session-opened" plus one "actor-bound" per declared actor
  // (openSession, store.mjs) -- captured dynamically rather than hardcoded,
  // since it depends on how many actors independent-research-fan-out-fan-in
  // declares, not something this test should assume.
  const baselineEventCount = countEventLines(tempDir, coordinationId);
  assert.ok(baselineEventCount > 0, 'sanity: opening the session really wrote events');

  // Now call the pack gate against the SAME coordinationId, claiming the
  // pack-registered declared-consult protocol -- self-consistent
  // (protocolId === protocolRef.id), a real pack member, yet the session it
  // names is really bound to a completely different protocol. A
  // `disposition` step (as the Red-Team used: it has no protocol-binding
  // check of its own inside run.mjs) would previously have gone through.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        {
          packPath,
          protocolId: DECLARED_CONSULT_ID,
          requestObject: {
            kind: 'declared-protocol',
            objective: 'Attempt to dispatch a pack-claimed protocol against a session really bound to a different one.',
            writerId,
            coordinationId,
            protocolRef: { id: DECLARED_CONSULT_ID },
            steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'PoC repro.' }],
          },
        },
      ),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${INDEPENDENT_RESEARCH_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      /not the explicitly selected "core\.coordination-protocol\.declared-consult"/.test(err.message),
  );

  // "Refuse before any mutation" (this track's own established discipline):
  // the refusal must happen before `runCoordinationUseCase` -> the
  // disposition step -> `recordDriverDisposition` ever appends a new event.
  assert.equal(
    countEventLines(tempDir, coordinationId),
    baselineEventCount,
    'zero new events written by the refused dispatch attempt',
  );
});

test('runGroupThinkingRequest resuming an existing session under the SAME protocol it was really opened with still succeeds -- the fix does not break the legitimate resume path (positive regression; also independently covered by the "resuming through the pack gate" test above)', async () => {
  const tempDir = mkTempDir();
  fakeExecutor(tempDir);
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });
  const coordinationId = 'coord_group_thinking_pack_resume_match_test';
  const writerId = 'group-thinking-pack-resume-match-test';

  const first = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    {
      packPath,
      protocolId: DECLARED_CONSULT_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Open under declared-consult.',
        writerId,
        coordinationId,
        protocolRef: { id: DECLARED_CONSULT_ID },
        steps: [{ type: 'operation', as: 'req', operationId: 'request-consult', objective: 'First step.', expectedOutputs: OUTPUTS }],
      },
    },
  );
  assert.equal(first.definitionRef.id, DECLARED_CONSULT_ID);

  // Resume under the SAME protocol id the session was really opened with --
  // must still succeed; the fix's cross-check compares real bound protocol
  // vs claimed protocol and finds them equal here.
  const second = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    {
      packPath,
      protocolId: DECLARED_CONSULT_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Resume under the same protocol.',
        writerId,
        coordinationId,
        protocolRef: { id: DECLARED_CONSULT_ID },
        steps: [
          {
            type: 'operation',
            as: 'resp',
            operationId: 'provide-consult',
            objective: 'Answer.',
            expectedOutputs: OUTPUTS,
            contextRefs: [first.steps[0].assignmentId],
            fromAssignmentId: first.steps[0].assignmentId,
          },
        ],
      },
    },
  );
  assert.equal(second.coordinationId, coordinationId);
  assert.equal(second.closed, true);
});

// ---------------------------------------------------------------------
// 5. Mid-flight addendum (2026-09-04): per-actor executor/provider survives
// the pack gate unchanged -- this pack must never collapse a session onto
// one hardcoded provider. Two REGISTERED executors (runnerConfig.executors,
// same shape test/runner/coordination-visibility-window-fixture.test.mjs's
// own `fakeCohortRunnerConfig` already uses for its real 3-provider-family
// fixture), one per declared-consult.yaml actor, each a real subprocess.

function writeExecutorScript(tempDir, label) {
  const executorScript = path.join(tempDir, `fake-executor-${label}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDispatched by ${label}.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Dispatched by ${label}.' }));
          }
        }
      }
    }
    process.stdout.write('Dispatched by ${label}.\\n');
    process.exit(0);
    `,
  );
  return executorScript;
}

function writeMultiExecutorConfig(tempDir) {
  const scriptA = writeExecutorScript(tempDir, 'exec-actor-a');
  const scriptB = writeExecutorScript(tempDir, 'exec-actor-b');
  const fgosDir = path.join(tempDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(
    path.join(fgosDir, 'config.json'),
    JSON.stringify(
      {
        runner: {
          executor: { allowCrossProvider: true, command: process.execPath, args: [scriptA, '{prompt}'] },
          executors: {
            'exec-actor-a': {
              kind: 'agent',
              providerModel: 'family-a',
              allowCrossProvider: true,
              invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptA, '{prompt}'] }],
            },
            'exec-actor-b': {
              kind: 'agent',
              providerModel: 'family-b',
              allowCrossProvider: true,
              invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptB, '{prompt}'] }],
            },
          },
          modelPolicies: {
            claude: { lightweight: 'test-model', standard: 'test-model' },
            'family-a': { lightweight: 'test-model', standard: 'test-model' },
            'family-b': { lightweight: 'test-model', standard: 'test-model' },
          },
          timeoutMs: 20000,
        },
      },
      null,
      2,
    ),
  );
}

test('a request naming a DIFFERENT executor per actor reaches run.mjs\'s real per-actor actorPolicyFields resolution unchanged -- the pack gate never collapses a session onto one provider', async () => {
  const tempDir = mkTempDir();
  writeMultiExecutorConfig(tempDir);
  const packPath = writePack(tempDir, { members: [{ id: DECLARED_CONSULT_ID, version: '1.0.0' }] });

  const request = {
    kind: 'declared-protocol',
    objective: 'Prove per-actor executor selection survives the group-thinking pack gate unchanged.',
    writerId: 'group-thinking-pack-multi-executor-test',
    coordinationId: 'coord_group_thinking_multi_executor_test',
    protocolRef: { id: DECLARED_CONSULT_ID },
    // The per-actor override channel this addendum requires: each actor
    // names its OWN registered executor. group-thinking-pack.mjs never
    // reads or touches this array -- it forwards the request object as-is.
    actors: [
      { id: 'requester-actor', executor: 'exec-actor-a' },
      { id: 'consultant-actor', executor: 'exec-actor-b' },
    ],
    steps: [
      // targetActorId must be explicit: run.mjs's own actorPolicyFields
      // only looks up `request.actors` when a step names `targetActorId`
      // (`const actorEntry = step.targetActorId ? findActor(...) : undefined`,
      // run.mjs) -- omitting it (legal, and what this file's other tests
      // do) would silently skip the very resolution this test must exercise.
      { type: 'operation', as: 'req', operationId: 'request-consult', targetActorId: 'requester-actor', objective: 'Ask.', expectedOutputs: OUTPUTS },
      {
        type: 'operation',
        as: 'resp',
        operationId: 'provide-consult',
        targetActorId: 'consultant-actor',
        objective: 'Answer.',
        expectedOutputs: OUTPUTS,
        contextRefs: ['$ref:req'],
        fromAssignmentId: '$ref:req',
      },
    ],
  };

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir },
    { packPath, protocolId: DECLARED_CONSULT_ID, requestObject: request },
  );

  assert.equal(result.steps[0].actorId, 'requester-actor');
  assert.equal(result.steps[1].actorId, 'consultant-actor');
  assert.equal(result.steps[0].executor, 'exec-actor-a');
  assert.equal(result.steps[1].executor, 'exec-actor-b');
  assert.notEqual(result.steps[0].executor, result.steps[1].executor, 'the two actors must genuinely resolve to different executors, not both fall back to one global default');
  assert.equal(result.steps[0].provider, 'family-a');
  assert.equal(result.steps[1].provider, 'family-b');
  assert.equal(result.closed, true);
});
