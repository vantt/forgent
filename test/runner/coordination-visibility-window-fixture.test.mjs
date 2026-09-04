// Phase 06 (MVP6) P06.3 fixture-level proof for visibility windows.
//
// P06.1 proved the schema and P06.2 proved the runtime, both against
// synthetic definitions written into a temp project tier. This file proves
// the same mechanism end to end against the REAL, committed, opt-in core
// fixture `core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml`
// -- loaded through `loadCoordinationProtocol`/`discoverCoordinationProtocols`
// like any shipped protocol, never faked or inlined -- driving the cohort
// through the REAL `dispatchResearchFanOut` entry point rather than a
// hand-rolled per-branch loop.
//
// The paradigm case, stated once: a coordinator fans research out to two
// independent researchers whose contexts stay isolated
// (`contextVisibility: isolated-until-fan-in`); the `post-independent-pass`
// window opens only once EVERY binding of `independent-research` has a
// qualifying linked result; only then may the driver-authorized
// `synthesize-findings` binding be granted the branch outputs at all.
//
// Same fake-executor pattern as coordination-research-fan-out.test.mjs: a
// real Node subprocess, never a JS-level stub over executeAssignment.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  dispatchResearchFanOut,
  authorizeDeclaredOperation,
  deriveVisibilityWindowState,
  evaluateSessionQuorum,
  closeSessionByQuorum,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  readManifest,
  readSessionEvents,
  resolveSessionPaths,
  createSessionAssignment,
  linkResult,
  appendEvent,
  transitionSessionStatus,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { loadCoordinationProtocol, discoverCoordinationProtocols } from '../../src/runner/definitions/protocol-loader.mjs';
import { validateFlowDefinition, FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

const GATED_ID = 'core.coordination-protocol.independent-research-fan-out-fan-in-gated';
const WINDOW_ID = 'post-independent-pass';
const GATED_FIXTURE_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml',
);

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-vw-fixture-test-'));
}

/**
 * The same minimal 3-provider-family runner config
 * coordination-research-fan-out.test.mjs builds for this protocol's cohort
 * planner (three real `agent`-kind executors, each its own providerModel
 * family, each spawning a real subprocess). Duplicated rather than shared
 * because it is a test-local fixture builder in every file in this track
 * that needs one, and this file needs to vary `status` per call.
 */
function fakeCohortRunnerConfig(tempDir, { status = 'done', summary = 'Research findings collected.' } = {}) {
  const executorScript = path.join(tempDir, `fake-vw-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    `,
  );
  const invocation = { via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] };
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    executors: {
      'exec-family-a': { kind: 'agent', providerModel: 'family-a', allowCrossProvider: true, invocations: [invocation] },
      'exec-family-b': { kind: 'agent', providerModel: 'family-b', allowCrossProvider: true, invocations: [invocation] },
      'exec-family-c': { kind: 'agent', providerModel: 'family-c', allowCrossProvider: true, invocations: [invocation] },
    },
    modelPolicies: {
      claude: { lightweight: 'test-model', standard: 'test-model' },
      'family-a': { lightweight: 'test-model', standard: 'test-model' },
      'family-b': { lightweight: 'test-model', standard: 'test-model' },
      'family-c': { lightweight: 'test-model', standard: 'test-model' },
    },
    timeoutMs: 5000,
  };
}

function openGatedSession(coordinationId, tempDir) {
  openDeclaredProtocolSession(
    {
      definitionId: GATED_ID,
      coordinationId,
      objective: 'Fan research out to an independent cohort, then synthesize once the window opens.',
      writerId: 'coordinator-1',
    },
    { cwd: tempDir },
  );
  return { tempDir, runnerConfig: fakeCohortRunnerConfig(tempDir), opts: { cwd: tempDir, repoRoot: tempDir } };
}

function setup(coordinationId) {
  return openGatedSession(coordinationId, mkTempDir());
}

async function dispatchCoordinatorFanOut(coordinationId, ctx) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'dispatch-research',
      objective: 'Fan out two independent research questions.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

function branch(actorId, fromAssignmentId) {
  return {
    actorId,
    objective: `Bounded, independent research question for ${actorId}.`,
    expectedOutputs: ['agent-result.json (status, summary)'],
    fromAssignmentId,
  };
}

/**
 * Fan the named cohort actors out through the REAL `dispatchResearchFanOut`
 * entry point, one full awaited call per actor.
 *
 * Sequential, following the same house convention (and for the same reason)
 * as `coordination-research-fan-out.test.mjs`'s own
 * `dispatchTwoBranchesSequentially`: this repo has a pre-existing per-cwd
 * dispatch lock (tsk-64hk, `dispatch/cli.mjs`'s `dispatch-in-flight`) that
 * admits ONE real subprocess per cwd, so the second of two CONCURRENTLY
 * dispatched branches settles `failed` regardless of any logic under test
 * here. That is real, important behavior -- and it is exactly the noise this
 * file must not confuse with a window verdict, since a `failed` source is
 * itself one of the window's own closed reasons.
 */
async function fanOut(coordinationId, ctx, actorIds, fromAssignmentId, runnerConfig) {
  const branches = [];
  for (const actorId of actorIds) {
    const result = await dispatchResearchFanOut(
      coordinationId,
      { operationId: 'independent-research', branches: [branch(actorId, fromAssignmentId)], writerId: 'coordinator-1' },
      { ...ctx.opts, runnerConfig: runnerConfig ?? ctx.runnerConfig },
    );
    assert.equal(result.status, 'dispatched', `fan-out for "${actorId}" must dispatch`);
    branches.push(...result.branches);
  }
  return { status: 'dispatched', branches };
}

/** The window verdict, always re-derived from an INDEPENDENT replay of disk. */
function windowState(coordinationId, ctx, windowId = WINDOW_ID) {
  const definition = loadCoordinationProtocol(GATED_ID, { cwd: ctx.tempDir });
  const { fgosDir } = resolveSessionPaths(coordinationId, ctx.opts);
  return deriveVisibilityWindowState(definition, windowId, replaySession(coordinationId, ctx.opts), fgosDir);
}

function synthesisAuthorization(overrides = {}) {
  return {
    operationId: 'synthesize-findings',
    targetActorId: 'coordinator-actor',
    authorizationId: 'auth_synth_1',
    invocationKey: 'synth:1',
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    reason: 'Synthesize once the independent pass has completed.',
    grantedContextRefs: [],
    ...overrides,
  };
}

function dispatchSynthesis(coordinationId, ctx, { contextRefs = [], taskKey } = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'synthesize-findings',
      targetActorId: 'coordinator-actor',
      objective: 'Synthesize the accepted findings.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      contextRefs,
      ...(taskKey !== undefined ? { taskKey } : {}),
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

const windowClosed = (err) =>
  err instanceof CoordinationError && new RegExp(`visibility window "${WINDOW_ID}"`).test(err.message) && /is not open/.test(err.message);

// ─── The fixture itself is real, discoverable, and opt-in ──────────────────

test('the gated fixture is a discoverable core protocol whose window and gated binding survive the real loader', () => {
  const entries = discoverCoordinationProtocols({ cwd: mkTempDir() });
  const entry = entries.find((e) => e.definition.metadata.id === GATED_ID);
  assert.ok(entry, 'the gated fixture must be discovered from the core tier like any other shipped protocol');
  assert.equal(entry.tier, 'core');

  const [window] = entry.definition.spec.profile.topology.visibilityWindows;
  assert.deepEqual(
    { id: window.id, milestone: window.opensAfter.milestone, opensAfter: [...window.opensAfter.operationRefs], delivery: window.permits.delivery },
    { id: WINDOW_ID, milestone: 'listed-results-linked', opensAfter: ['independent-research'], delivery: 'artifact-refs' },
  );
  const gatedBinding = entry.definition.spec.graph.nodes.find((n) => n.id === 'phase-fan-in').operations[0];
  assert.equal(gatedBinding.activation.mode, 'driver-authorized');
  assert.equal(gatedBinding.contextAccess.visibilityWindowRef, WINDOW_ID);

  // Opt-in: the UNGATED sibling every other fan-out test drives declares no
  // window at all and no gated binding, so it takes none of these paths.
  const ungated = entries.find((e) => e.definition.metadata.id === 'core.coordination-protocol.independent-research-fan-out-fan-in');
  assert.equal(ungated.definition.spec.profile.topology.visibilityWindows, undefined);
  assert.ok(
    ungated.definition.spec.graph.nodes.every((n) => n.operations.every((op) => op.contextAccess === undefined)),
    'the ungated fixture must declare no contextAccess anywhere',
  );
});

// ─── 1. Positive: opt-in, full cohort, post-independent-pass synthesis ─────

test('POSITIVE: the full independent cohort settles, the window opens, and the gated synthesis is authorized and dispatched with the branch outputs granted', async () => {
  const ctx = setup('coord_vwf_positive');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_positive', ctx);

  // Window shut before the cohort runs -- the synthesis cannot be granted
  // anything at all yet.
  assert.equal(windowState('coord_vwf_positive', ctx).open, false);

  const fan = await fanOut('coord_vwf_positive', ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  const branchAssignmentIds = fan.branches.map((b) => b.result.assignment.assignmentId);
  assert.equal(new Set(branchAssignmentIds).size, 2);

  const state = windowState('coord_vwf_positive', ctx);
  assert.equal(state.open, true, 'the window opens once every binding of independent-research has a qualifying linked result');
  assert.deepEqual(
    state.sources[0].branches.map((b) => [b.boundActorId, b.satisfied]),
    [
      ['researcher-a', true],
      ['researcher-b', true],
    ],
  );

  // The real post-independent-pass delivery: the driver grants the cohort's
  // own artifact refs, and the gated dispatch reads exactly those.
  authorizeDeclaredOperation('coord_vwf_positive', synthesisAuthorization({ grantedContextRefs: branchAssignmentIds }), ctx.opts);
  const synthesis = await dispatchSynthesis('coord_vwf_positive', ctx, { contextRefs: branchAssignmentIds });
  assert.equal(synthesis.resumed, false);
  assert.equal(synthesis.runResult.status, 'done');
  assert.deepEqual(
    synthesis.assignment.provenance.inline.contract.contextRefs.slice().sort(),
    branchAssignmentIds.slice().sort(),
    'the synthesis reads the granted cohort outputs -- the whole point of the window',
  );
});

// ─── 2. Negative: pre-window ───────────────────────────────────────────────

test('NEGATIVE pre-window: neither an empty cohort nor a partial one opens the window, and the synthesis is refused at authorization', async () => {
  const ctx = setup('coord_vwf_pre_window');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_pre_window', ctx);

  assert.throws(() => authorizeDeclaredOperation('coord_vwf_pre_window', synthesisAuthorization(), ctx.opts), windowClosed);
  assert.equal(readSessionEvents('coord_vwf_pre_window', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);

  // HALF the cohort. This is the shape the pre-fix engine opened on: with
  // only the FIRST graph binding resolved, researcher-a alone answered for
  // the whole cohort.
  await fanOut('coord_vwf_pre_window', ctx, ['researcher-a'], dispatch.assignment.assignmentId);
  const partial = windowState('coord_vwf_pre_window', ctx);
  assert.equal(partial.open, false, 'one cohort member reporting must never open the whole cohort\'s window');
  assert.deepEqual(
    partial.sources[0].branches.map((b) => [b.boundActorId, b.satisfied, b.reason]),
    [
      ['researcher-a', true, null],
      ['researcher-b', false, 'missing'],
    ],
  );
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_pre_window', synthesisAuthorization(), ctx.opts), windowClosed);
});

// ─── 3. Negative: unlisted source ──────────────────────────────────────────

test('NEGATIVE unlisted source: an operation outside opensAfter.operationRefs[] cannot satisfy the window, however legitimately it completed', async () => {
  const ctx = setup('coord_vwf_unlisted_source');

  // `dispatch-research` is a real, declared, engine-stamped operation
  // completed by `coordinator-actor` -- the SAME actor the gated
  // `synthesize-findings` binding names. It is simply not listed in
  // `opensAfter.operationRefs[]`, and that is the whole reason it counts
  // for nothing here.
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_unlisted_source', ctx);
  assert.equal(dispatch.runResult.status, 'done');

  const state = windowState('coord_vwf_unlisted_source', ctx);
  assert.equal(state.open, false);
  assert.deepEqual(state.sources.map((s) => s.operationRef), ['independent-research'], 'only the listed source is ever consulted');
  assert.equal(state.sources[0].reason, 'missing');
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_unlisted_source', synthesisAuthorization(), ctx.opts), windowClosed);
});

test('NEGATIVE unlisted source (unstamped work under the source operation\'s own claim key): the reserved stamp is the only channel a window source reads', async () => {
  const ctx = setup('coord_vwf_unstamped_claim_key');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_unstamped_claim_key', ctx);
  await fanOut('coord_vwf_unstamped_claim_key', ctx, ['researcher-a'], dispatch.assignment.assignmentId);

  // researcher-b's obligation is "discharged" by an Assignment created
  // through the unmediated store door, claiming the source operation's own
  // default `declared:<operationId>` namespace and carrying a real linked
  // result -- but no reserved `protocol-operation:` stamp. The claim key is
  // not a channel `assignmentServesOperation` reads at all.
  const assignment = createSessionAssignment(
    {
      coordinationId: 'coord_vwf_unstamped_claim_key',
      taskKey: 'declared:independent-research:round-2',
      actorId: 'researcher-b',
      contract: {
        objective: 'Unstamped work claiming the source operation\'s namespace.',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json (status, summary)'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'researcher',
        budget: { timeoutMs: 60000, maxRuns: 1 },
      },
      caller: { writerId: 'coordinator-1' },
    },
    ctx.opts,
  );
  const runDir = path.join(ctx.tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const runId = `run_${assignment.assignmentId}_01`;
  fs.writeFileSync(
    path.join(runDir, 'result.json'),
    JSON.stringify({ runId, assignmentId: assignment.assignmentId, status: 'done', confidence: 'reported' }, null, 2),
  );
  linkResult('coord_vwf_unstamped_claim_key', { assignmentId: assignment.assignmentId, runId }, ctx.opts);

  const state = windowState('coord_vwf_unstamped_claim_key', ctx);
  assert.equal(state.open, false, 'an unstamped Assignment satisfies no window source, whatever it claims');
  assert.deepEqual(
    state.sources[0].branches.map((b) => [b.boundActorId, b.satisfied, b.reason]),
    [
      ['researcher-a', true, null],
      ['researcher-b', false, 'missing'],
    ],
  );
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_unstamped_claim_key', synthesisAuthorization(), ctx.opts), windowClosed);
});

// ─── 4. Negative: foreign session ──────────────────────────────────────────

test('NEGATIVE foreign session: a fully-settled cohort in ANOTHER session opens nothing here, and its refs are refused as a grant', async () => {
  const ctx = setup('coord_vwf_foreign_donor');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_foreign_donor', ctx);
  const donor = await fanOut('coord_vwf_foreign_donor', ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  const donorRefs = donor.branches.map((b) => b.result.assignment.assignmentId);
  assert.equal(windowState('coord_vwf_foreign_donor', ctx).open, true, 'the donor session\'s own window really is open');

  // A SECOND session, same workspace, same definition. Every donor
  // Assignment (stamp included) is physically on disk under the repo-wide
  // `.fgos/assignments/`, so this crosses a real session boundary rather
  // than a missing-file one: what the recipient lacks is the
  // `assignment-created` events in ITS OWN log.
  openGatedSession('coord_vwf_foreign_recipient', ctx.tempDir);
  const recipient = { ...ctx, opts: ctx.opts };
  for (const ref of donorRefs) {
    assert.ok(
      fs.existsSync(path.join(ctx.tempDir, '.fgos', 'assignments', ref, 'assignment.json')),
      'the donor Assignments must really exist on disk for this to be a session boundary and not a missing file',
    );
  }

  const state = windowState('coord_vwf_foreign_recipient', recipient);
  assert.equal(state.open, false, 'another session\'s settled cohort must not open this session\'s window');
  assert.equal(state.sources[0].reason, 'missing');
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_foreign_recipient', synthesisAuthorization(), ctx.opts), windowClosed);

  // And the donor's refs cannot be smuggled in as a grant either -- the
  // same-session ownership gate is additive to the window, never replaced
  // by it.
  assert.throws(
    () => authorizeDeclaredOperation('coord_vwf_foreign_recipient', synthesisAuthorization({ grantedContextRefs: donorRefs }), ctx.opts),
    (err) => err instanceof CoordinationError && /coord_vwf_foreign_donor|different coordination session|not a member/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_vwf_foreign_recipient', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

// ─── 5. Negative: missing / failed source ──────────────────────────────────

test('NEGATIVE failed source: a cohort member that ran and FAILED leaves the window shut, and replay reports the same "failed" reason', async () => {
  const ctx = setup('coord_vwf_failed_source');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_failed_source', ctx);

  await fanOut('coord_vwf_failed_source', ctx, ['researcher-a'], dispatch.assignment.assignmentId);
  await fanOut(
    'coord_vwf_failed_source',
    ctx,
    ['researcher-b'],
    dispatch.assignment.assignmentId,
    fakeCohortRunnerConfig(ctx.tempDir, { status: 'failed', summary: 'Research could not be completed.' }),
  );

  const state = windowState('coord_vwf_failed_source', ctx);
  assert.equal(state.open, false, 'a failed cohort member must not open the window');
  const failedBranch = state.sources[0].branches.find((b) => b.boundActorId === 'researcher-b');
  assert.equal(failedBranch.satisfied, false);
  assert.equal(failedBranch.reason, 'failed', 'the failure is classified as failed, never silently treated as missing');
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_failed_source', synthesisAuthorization(), ctx.opts), windowClosed);
});

test('NEGATIVE missing source: a cohort member never dispatched at all leaves the window shut with reason "missing"', async () => {
  const ctx = setup('coord_vwf_missing_source');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_missing_source', ctx);
  await fanOut('coord_vwf_missing_source', ctx, ['researcher-b'], dispatch.assignment.assignmentId);

  const state = windowState('coord_vwf_missing_source', ctx);
  assert.equal(state.open, false);
  assert.deepEqual(
    state.sources[0].branches.map((b) => [b.boundActorId, b.satisfied, b.reason]),
    [
      ['researcher-a', false, 'missing'],
      ['researcher-b', true, null],
    ],
  );
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_missing_source', synthesisAuthorization(), ctx.opts), windowClosed);
});

// ─── 6. Negative: unknown window ───────────────────────────────────────────

test('NEGATIVE unknown window: a contextAccess.visibilityWindowRef naming an undeclared window is rejected at load, and the runtime derivation refuses one too', () => {
  const ctx = setup('coord_vwf_unknown_window');

  // (a) Definition tier: the real committed fixture, with ONLY its
  // `visibilityWindowRef` repointed at a window id nothing declares.
  const raw = JSON.parse(JSON.stringify(loadCoordinationProtocol(GATED_ID, { cwd: ctx.tempDir })));
  raw.metadata.id = 'test.coordination-protocol.unknown-window';
  raw.spec.graph.nodes.find((n) => n.id === 'phase-fan-in').operations[0].contextAccess.visibilityWindowRef = 'no-such-window';
  assert.throws(
    () => validateFlowDefinition(raw),
    (err) => err instanceof FlowDefinitionError && /no-such-window/.test(err.message),
  );

  // (b) Runtime tier: asking for a window this definition never declared is
  // a named refusal, never a silent "closed" or a silent "open".
  assert.throws(
    () => windowState('coord_vwf_unknown_window', ctx, 'no-such-window'),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /no-such-window/.test(err.message),
  );
});

// ─── 7. Negative: Workflow profile ─────────────────────────────────────────
//
// P06.1 already proves this at the schema tier with two named tests in
// `test/runner/flow-definition-schema.test.mjs` ("rejects a Workflow-profile
// definition carrying spec.profile.topology.visibilityWindows" and "...
// carrying graph.nodes[].operations[].contextAccess"). Not re-derived here.
// What IS added is the fixture-level half those two cannot cover: THIS
// committed fixture's own window block and gated binding, carried onto a
// Workflow profile, are rejected -- so the fixture can never be re-profiled
// into a Workflow definition that keeps its window silently unenforced.

test('NEGATIVE Workflow profile: this fixture\'s own window block and gated binding are both rejected under a Workflow profile', () => {
  const ctx = setup('coord_vwf_workflow_profile');
  const base = JSON.parse(JSON.stringify(loadCoordinationProtocol(GATED_ID, { cwd: ctx.tempDir })));

  const asWorkflow = () => {
    const doc = JSON.parse(JSON.stringify(base));
    doc.metadata.id = 'test.coordination-protocol.workflow-profile-window';
    doc.spec.profile = { kind: 'Workflow', work: { baseStepMap: { 'phase-fan-out': 'step-1' } } };
    delete doc.spec.actors;
    for (const node of doc.spec.graph.nodes) for (const op of node.operations) delete op.actor;
    return doc;
  };

  // The window block itself, moved onto a Workflow profile.
  const withWindows = asWorkflow();
  withWindows.spec.profile.topology = { visibilityWindows: JSON.parse(JSON.stringify(base.spec.profile.topology.visibilityWindows)) };
  assert.throws(() => validateFlowDefinition(withWindows), (err) => err instanceof FlowDefinitionError && /topology/.test(err.message));

  // The gated binding's `contextAccess`, on a Workflow profile that declares
  // no windows at all -- rejected for being Workflow, not merely for
  // dangling.
  const withContextAccess = asWorkflow();
  assert.throws(
    () => validateFlowDefinition(withContextAccess),
    (err) => err instanceof FlowDefinitionError && /contextAccess/.test(err.message),
  );
});

// ─── 8. Negative: terminal authorization ───────────────────────────────────

test('NEGATIVE terminal authorization: an operation-authorized event that lands after the session closed is neutralized by replay, even with the window wide open', async () => {
  const ctx = setup('coord_vwf_post_terminal');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_post_terminal', ctx);
  await fanOut('coord_vwf_post_terminal', ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  assert.equal(windowState('coord_vwf_post_terminal', ctx).open, true, 'the window must genuinely be OPEN -- this test is about the terminal boundary, not the window');

  transitionSessionStatus('coord_vwf_post_terminal', 'cancelled', { reason: 'stopped mid-flight' }, ctx.opts);

  // An open window does not rescue a closed session: the mediated door
  // refuses to write the authorization at all.
  assert.throws(
    () => authorizeDeclaredOperation('coord_vwf_post_terminal', synthesisAuthorization(), ctx.opts),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'validation' &&
      /is not active \(status: "cancelled"\)/.test(err.message) &&
      !windowClosed(err),
  );

  // Forced onto the log anyway (a hand-crafted log, or a write-time race):
  // replay neutralizes it as post-terminal, and the dispatch gate refuses
  // while NAMING it, so the operator can tell "never authorized" apart from
  // "authorized too late".
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_vwf_post_terminal', ctx.opts);
  appendEvent(
    eventsPath,
    {
      type: 'operation-authorized',
      payload: {
        authorizationId: 'auth_after_terminal',
        operationId: 'synthesize-findings',
        nodeId: 'phase-fan-in',
        targetActorId: 'coordinator-actor',
        invocationKey: 'synth:after-terminal',
        authorizedBy: { type: 'driver', id: 'coordinator-1' },
        reason: 'Written after the session closed.',
        grantedContextRefs: [],
      },
    },
    sessionDir,
  );

  const replayed = replaySession('coord_vwf_post_terminal', ctx.opts);
  assert.deepEqual(replayed.authorizations.map((a) => a.authorizationId), []);
  assert.deepEqual(replayed.ignoredAuthorizations.map((a) => a.authorizationId), ['auth_after_terminal']);

  await assert.rejects(
    dispatchSynthesis('coord_vwf_post_terminal', ctx),
    (err) => err instanceof CoordinationError && /post-terminal/.test(err.message) && /auth_after_terminal/.test(err.message),
  );
  assert.equal(
    readSessionEvents('coord_vwf_post_terminal', ctx.opts).filter((e) => e.type === 'assignment-created' && e.payload.operationId === 'synthesize-findings').length,
    0,
  );
});

// ─── 9. Robustness: crash / resume ─────────────────────────────────────────

test('CRASH/RESUME: a window-gated dispatch interrupted mid-registration self-heals to the SAME Assignment while the window is still open', async () => {
  const ctx = setup('coord_vwf_crash_resume');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_crash_resume', ctx);
  const fan = await fanOut('coord_vwf_crash_resume', ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  const branchRefs = fan.branches.map((b) => b.result.assignment.assignmentId);

  authorizeDeclaredOperation('coord_vwf_crash_resume', synthesisAuthorization({ grantedContextRefs: branchRefs }), ctx.opts);
  const first = await dispatchSynthesis('coord_vwf_crash_resume', ctx, { contextRefs: branchRefs, taskKey: 'synthesis:round-1' });
  const synthesisId = first.assignment.assignmentId;

  // Roll back exactly the two artifacts a crash between the claim write and
  // `completeAssignmentRegistration` leaves missing: every event this
  // Assignment produced, and its `assignmentRefs` entry. The claim file and
  // assignment.json stay, as a real crash also leaves them.
  const { eventsPath, manifestPath } = resolveSessionPaths('coord_vwf_crash_resume', ctx.opts);
  const keptLines = fs
    .readFileSync(eventsPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .filter((line) => JSON.parse(line).payload?.assignmentId !== synthesisId);
  fs.writeFileSync(eventsPath, `${keptLines.join('\n')}\n`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs = manifest.assignmentRefs.filter((id) => id !== synthesisId);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.doesNotThrow(() => replaySession('coord_vwf_crash_resume', ctx.opts), 'the simulated crash state must itself be replayable');

  // The cohort's own events are untouched, so the window is still open and
  // the resume passes the gate exactly as the original dispatch did.
  assert.equal(windowState('coord_vwf_crash_resume', ctx).open, true);
  const resumed = await dispatchSynthesis('coord_vwf_crash_resume', ctx, { contextRefs: branchRefs, taskKey: 'synthesis:round-1' });
  assert.equal(resumed.assignment.assignmentId, synthesisId, 'self-heal must resume the SAME Assignment');
  assert.deepEqual(readManifest('coord_vwf_crash_resume', ctx.opts).assignmentRefs.includes(synthesisId), true);
});

test('CRASH/RESUME fails closed: if the crash also cost a cohort member its linked result, the retry is refused rather than resumed', async () => {
  const ctx = setup('coord_vwf_crash_fails_closed');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_crash_fails_closed', ctx);
  const fan = await fanOut('coord_vwf_crash_fails_closed', ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  const branchRefs = fan.branches.map((b) => b.result.assignment.assignmentId);

  authorizeDeclaredOperation('coord_vwf_crash_fails_closed', synthesisAuthorization({ grantedContextRefs: branchRefs }), ctx.opts);
  const first = await dispatchSynthesis('coord_vwf_crash_fails_closed', ctx, { contextRefs: branchRefs, taskKey: 'synthesis:round-1' });
  const synthesisId = first.assignment.assignmentId;

  // The same crash window as above, except the interrupted write also cost
  // one cohort branch its `result-linked` event -- that branch is now
  // "late", so the window is shut again at retry time. The retry must
  // refuse, never resume a gated Assignment whose gate no longer holds.
  const { eventsPath, manifestPath } = resolveSessionPaths('coord_vwf_crash_fails_closed', ctx.opts);
  const keptLines = fs
    .readFileSync(eventsPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .filter((line) => {
      const event = JSON.parse(line);
      if (event.payload?.assignmentId === synthesisId) return false;
      return !(event.type === 'result-linked' && event.payload.assignmentId === branchRefs[0]);
    });
  fs.writeFileSync(eventsPath, `${keptLines.join('\n')}\n`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs = manifest.assignmentRefs.filter((id) => id !== synthesisId);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const state = windowState('coord_vwf_crash_fails_closed', ctx);
  assert.equal(state.open, false);
  assert.equal(state.sources[0].branches.find((b) => !b.satisfied).reason, 'late');

  await assert.rejects(
    dispatchSynthesis('coord_vwf_crash_fails_closed', ctx, { contextRefs: branchRefs, taskKey: 'synthesis:round-1' }),
    windowClosed,
  );
  assert.equal(readManifest('coord_vwf_crash_fails_closed', ctx.opts).assignmentRefs.includes(synthesisId), false);
});

// ─── Degenerate case: an EMPTY opensAfter.operationRefs[] gates nothing ────
//
// Characterization, NOT an endorsement. `every()` over zero sources is true,
// so a window listing no source operations is open from session open with no
// work done at all. Schema validation accepts it (an empty string array is a
// well-formed one), which makes "declares a window, gates nothing" reachable
// through a second door besides the one the fixture header guards against.
// Named in flow-definition.md's `opensAfter.operationRefs[]` row rather than
// rejected; rejecting it is a schema-tier (P06.1) change, deliberately out of
// this cell's scope. A future cell that adds a minimum-length check should
// change this test deliberately.

test('DEGENERATE: a window whose opensAfter.operationRefs[] is EMPTY validates and is permanently open, gating nothing', () => {
  const ctx = setup('coord_vwf_empty_refs_host');

  const doc = JSON.parse(JSON.stringify(loadCoordinationProtocol(GATED_ID, { cwd: ctx.tempDir })));
  doc.metadata.id = 'test.coordination-protocol.empty-opens-after';
  doc.spec.profile.topology.visibilityWindows[0].opensAfter.operationRefs = [];
  assert.doesNotThrow(() => validateFlowDefinition(doc), 'an empty opensAfter.operationRefs[] is schema-legal today');

  const dir = path.join(ctx.tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'empty-opens-after.json'), `${JSON.stringify(doc, null, 2)}\n`);
  openDeclaredProtocolSession(
    { definitionId: doc.metadata.id, coordinationId: 'coord_vwf_empty_refs', objective: 'Degenerate window.', writerId: 'coordinator-1' },
    { cwd: ctx.tempDir },
  );

  // ZERO cohort work has been done -- not one branch dispatched.
  const definition = loadCoordinationProtocol(doc.metadata.id, { cwd: ctx.tempDir });
  const { fgosDir } = resolveSessionPaths('coord_vwf_empty_refs', ctx.opts);
  const state = deriveVisibilityWindowState(definition, WINDOW_ID, replaySession('coord_vwf_empty_refs', ctx.opts), fgosDir);
  assert.equal(state.sources.length, 0, 'no source obligations at all');
  assert.equal(state.open, true, 'every-of over zero sources is vacuously true -- the window is open from session open');

  // And the gate it is supposed to be is therefore a no-op: the grant door
  // lets the synthesis through with no source work on record.
  assert.doesNotThrow(() =>
    authorizeDeclaredOperation('coord_vwf_empty_refs', synthesisAuthorization(), ctx.opts),
  );
  assert.equal(
    readSessionEvents('coord_vwf_empty_refs', ctx.opts).filter((e) => e.type === 'operation-authorized').length,
    1,
    'the authorization is written despite zero cohort work -- the degenerate case named in flow-definition.md',
  );
});

// ─── Scope boundary: gating happens at the driver-authorized grant door ────
//
// Characterization, NOT an endorsement. Both runtime gates
// (`authorizeDeclaredOperation`, and `dispatchDeclaredOperation`'s check
// inside its `isDriverAuthorized` branch) sit on the grant boundary, because
// a grant is what a window makes legal or illegal. A `required` binding has
// no grant, so a `contextAccess.visibilityWindowRef` on one is schema-valid
// (P06.1 accepts it) and runtime-inert. That is why the gated fixture makes
// `synthesize-findings` driver-authorized, and why the promoted contract
// text in flow-definition.md names this boundary instead of implying that
// any binding carrying a window ref is gated. Recorded in P06.3.md for the
// Coordinator; a future cell that widens the gate should change this test
// deliberately, never discover the boundary again by accident.

test('SCOPE BOUNDARY: a required binding carrying contextAccess.visibilityWindowRef validates but is NOT gated at dispatch (the gate lives on the grant door)', async () => {
  const ctx = setup('coord_vwf_required_binding_boundary');

  // The committed fixture, with ONLY the gated binding's `activation`
  // removed -- i.e. `required` (the default), window ref intact.
  const doc = JSON.parse(JSON.stringify(loadCoordinationProtocol(GATED_ID, { cwd: ctx.tempDir })));
  doc.metadata.id = 'test.coordination-protocol.required-binding-window';
  const gated = doc.spec.graph.nodes.find((n) => n.id === 'phase-fan-in').operations[0];
  delete gated.activation;
  assert.equal(gated.contextAccess.visibilityWindowRef, WINDOW_ID);
  assert.doesNotThrow(() => validateFlowDefinition(doc), 'P06.1 accepts a window ref on a required binding');

  const dir = path.join(ctx.tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'required-binding-window.json'), `${JSON.stringify(doc, null, 2)}\n`);
  openDeclaredProtocolSession(
    { definitionId: doc.metadata.id, coordinationId: 'coord_vwf_required_boundary_session', objective: 'Scope boundary.', writerId: 'coordinator-1' },
    { cwd: ctx.tempDir },
  );

  const definition = loadCoordinationProtocol(doc.metadata.id, { cwd: ctx.tempDir });
  const { fgosDir } = resolveSessionPaths('coord_vwf_required_boundary_session', ctx.opts);
  assert.equal(
    deriveVisibilityWindowState(definition, WINDOW_ID, replaySession('coord_vwf_required_boundary_session', ctx.opts), fgosDir).open,
    false,
    'the window is genuinely closed -- no cohort work exists at all',
  );

  const result = await dispatchDeclaredOperation(
    'coord_vwf_required_boundary_session',
    {
      operationId: 'synthesize-findings',
      targetActorId: 'coordinator-actor',
      objective: 'Synthesize with the window shut.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(result.resumed, false);
  assert.equal(result.runResult.status, 'done', 'today a required binding dispatches regardless of its declared window');
});

// ─── Replay parity on the real fixture ─────────────────────────────────────

test('REPLAY PARITY: an independent replay of the real fixture reaches the same legality decision the live dispatch path reached, open and closed', async () => {
  const ctx = setup('coord_vwf_replay_parity');
  const dispatch = await dispatchCoordinatorFanOut('coord_vwf_replay_parity', ctx);
  await fanOut('coord_vwf_replay_parity', ctx, ['researcher-a'], dispatch.assignment.assignmentId);

  // Closed half: the live authorize path refuses, and a fresh reconstruction
  // taken from disk alone agrees.
  assert.throws(() => authorizeDeclaredOperation('coord_vwf_replay_parity', synthesisAuthorization(), ctx.opts), windowClosed);
  assert.equal(windowState('coord_vwf_replay_parity', ctx).open, false);

  // Open half: same two functions, same disk, opposite verdict.
  await fanOut('coord_vwf_replay_parity', ctx, ['researcher-b'], dispatch.assignment.assignmentId);
  assert.equal(windowState('coord_vwf_replay_parity', ctx).open, true);
  authorizeDeclaredOperation('coord_vwf_replay_parity', synthesisAuthorization(), ctx.opts);
  const synthesis = await dispatchSynthesis('coord_vwf_replay_parity', ctx);
  assert.equal(synthesis.resumed, false);

  // No stored window truth anywhere: the fixture's own committed text and
  // the session's event log are the only inputs.
  const events = readSessionEvents('coord_vwf_replay_parity', ctx.opts);
  assert.equal(events.filter((e) => /visibility/i.test(e.type)).length, 0, 'no visibility-window event kind may be persisted');
  const rawFixture = fs.readFileSync(GATED_FIXTURE_PATH, 'utf8');
  assert.match(rawFixture, /visibilityWindows:/, 'the window is declared in the committed fixture, not synthesized by a test');
});

// ─── P10-KERNEL-FIX Fix Round 1 (HIGH-4): quorum/close coverage ────────────
//
// Neither this file nor coordination-research-fan-out.test.mjs ever called
// evaluateSessionQuorum/closeSessionByQuorum against this fixture before
// this test (redteam-report.md HIGH-4) -- so the driver-authorized +
// window-gated `synthesize-findings` binding's own quorum-gating behavior
// (actorGatingOperationIds, session-engine.mjs) was entirely unproven at the
// close level, even though every OTHER door onto this same fixture (window
// state, authorization refusal, dispatch) was already covered above.

test('P10-KERNEL-FIX quorum: coordinator-actor stays incomplete (and close is refused) once dispatch-research + the full research cohort have settled but synthesize-findings has not, and closes once it does', async () => {
  const coordinationId = 'coord_vwf_quorum_gating';
  const ctx = setup(coordinationId);
  const dispatch = await dispatchCoordinatorFanOut(coordinationId, ctx);
  const fan = await fanOut(coordinationId, ctx, ['researcher-a', 'researcher-b'], dispatch.assignment.assignmentId);
  const branchAssignmentIds = fan.branches.map((b) => b.result.assignment.assignmentId);

  // The whole cohort has settled and the window is open, but the gated
  // `synthesize-findings` binding itself has neither been authorized nor
  // dispatched yet -- coordinator-actor must stay incomplete, and close must
  // refuse, exactly the premature-close bug this cell exists to eliminate.
  const beforeSynthesis = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(beforeSynthesis.missing.map((x) => x.actorId), ['coordinator-actor']);
  assert.throws(
    () => closeSessionByQuorum(coordinationId, {}, ctx.opts),
    (err) => err instanceof CoordinationError && /missing required actor\(s\) \[coordinator-actor\]/.test(err.message),
    'closeSessionByQuorum must refuse to close while the gated synthesize-findings binding is still unsettled',
  );

  authorizeDeclaredOperation(coordinationId, synthesisAuthorization({ grantedContextRefs: branchAssignmentIds }), ctx.opts);
  await dispatchSynthesis(coordinationId, ctx, { contextRefs: branchAssignmentIds });

  const afterSynthesis = evaluateSessionQuorum(coordinationId, ctx.opts);
  assert.deepEqual(afterSynthesis.missing, []);
  assert.deepEqual(afterSynthesis.completed.map((x) => x.actorId).sort(), ['coordinator-actor', 'researcher-a', 'researcher-b']);
  const closed = closeSessionByQuorum(coordinationId, {}, ctx.opts);
  assert.equal(closed.status, 'completed');
});
