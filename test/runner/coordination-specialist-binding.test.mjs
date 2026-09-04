// Phase 09 (Step 09 MVP9) P09.2 tests: authorizing a previously-unknown
// specialist actor identity into a declared `topology.specialistSlots[]`
// slot, and dispatching a real Assignment to it through the resolved
// `specialistSlotRef` binding.
//
// Exercised against a project-tier CoordinationProtocol fixture (never a
// faked/inlined definition), through the real `authorizeSpecialistSlot` ->
// `authorizeDeclaredOperation` -> `dispatchDeclaredOperation` doors, with a
// real fake-executor subprocess for the end-to-end dispatch proof -- same
// pattern `coordination-driver-authorization.test.mjs` already established.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  authorizeSpecialistSlot,
  authorizeDeclaredOperation,
  dispatchDeclaredOperation,
  resolveLiveSpecialistBindings,
} from '../../src/runner/coordination/session-engine.mjs';
import { readSessionEvents, readManifest, transitionSessionStatus } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';

const DEFINITION_ID = 'test.coordination-protocol.specialist-binding';
const DRIVER_ID = 'coordinator-1';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-specialist-binding-test-'));
}

// A project-tier definition (`<cwd>/.fgos/coordination-protocols/`), loaded
// through the REAL protocol-loader/validateFlowDefinition path. One slot
// ("review-slot") declaring one operation ("specialist-review"), bound at
// the graph's second node via `specialistSlotRef` instead of a static actor.
function writeFixture(tempDir, { maxBindings = 2, requiredCapabilities = ['deep-review'] } = {}) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          specialistSlots: [
            {
              id: 'review-slot',
              role: 'specialist',
              operationRefs: ['specialist-review'],
              requiredCapabilities,
              allowedVisibilityWindows: [],
              maxBindings,
              maxAssignments: 3,
            },
          ],
        },
      },
      roles: ['doer', 'specialist'],
      actors: [{ id: 'doer', role: 'doer' }],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: { kind: 'work-product', evidenceRequired: 'reported' } },
        {
          id: 'specialist-review',
          role: 'specialist',
          capabilities: ['deep-review'],
          result: { kind: 'advisory', evidenceRequired: 'reported' },
        },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-specialist'] },
          {
            id: 'phase-specialist',
            operations: [{ ref: 'specialist-review', specialistSlotRef: 'review-slot', activation: { mode: 'driver-authorized' } }],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'specialist-binding.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function fakeExecutor(tempDir, { status = 'done', summary = 'Reviewed.' } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 5000,
  };
}

function setup(coordinationId, fixtureOptions) {
  const tempDir = mkTempDir();
  writeFixture(tempDir, fixtureOptions);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId, objective: 'Recruit a bounded specialist into a declared slot.', writerId: DRIVER_ID },
    { cwd: tempDir },
  );
  return { tempDir, runnerConfig: fakeExecutor(tempDir), opts: { cwd: tempDir, repoRoot: tempDir } };
}

function specialistAuthorization(overrides = {}) {
  return {
    slotId: 'review-slot',
    specialistActorId: 'specialist-alpha',
    role: 'specialist',
    capabilities: ['deep-review'],
    authorizedBy: { type: 'driver', id: DRIVER_ID },
    reason: 'Primary review needs a domain specialist.',
    triggerEvidenceRefs: [],
    allowedContextRefs: [],
    maxAssignments: 3,
    expiresAfterRound: 10,
    specialistAuthorizationId: 'sauth_1',
    ...overrides,
  };
}

function operationAuthorization(overrides = {}) {
  return {
    operationId: 'specialist-review',
    targetActorId: 'specialist-alpha',
    authorizationId: 'auth_specialist_1',
    invocationKey: 'specialist-review:1',
    authorizedBy: { type: 'driver', id: DRIVER_ID },
    reason: 'Dispatch the specialist review.',
    grantedContextRefs: [],
    ...overrides,
  };
}

function dispatchSpecialist(coordinationId, ctx, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'specialist-review',
      targetActorId: 'specialist-alpha',
      objective: 'Perform the specialist review.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: DRIVER_ID,
      ...overrides,
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

// ─── Static: caller-supplied-definition bug class (shipped 4x already this
// track -- P06.2, P07.3, P07.4, P08.2's near-miss) ──────────────────────────

test('static: authorizeSpecialistSlot takes no definition parameter -- it resolves the FlowDefinition internally via manifest.definitionRef', () => {
  const source = fs.readFileSync(new URL('../../src/runner/coordination/session-engine.mjs', import.meta.url), 'utf8');
  const signature = source.slice(source.indexOf('export function authorizeSpecialistSlot'));
  const params = signature.slice(signature.indexOf('('), signature.indexOf(') {') + 1);
  assert.ok(/\bopts\b/.test(params), 'the capture must reach the whole parameter list, opts included');
  for (const forbidden of ['definition', 'flowDefinition', 'protocol']) {
    assert.ok(
      !new RegExp(`\\b${forbidden}\\b`, 'i').test(params),
      `"${forbidden}" must never be a caller-supplied parameter -- it is a legality-relevant value and must be derived from manifest.definitionRef (params were: ${params})`,
    );
  }
});

// ─── Acceptance: end-to-end dispatch to a freshly-authorized specialist ────

test('a previously-unknown specialistActorId becomes a legitimate dispatch target for the slot declared operationRefs[], end to end', async () => {
  const ctx = setup('coord_spec_happy');

  const authResult = authorizeSpecialistSlot('coord_spec_happy', specialistAuthorization(), ctx.opts);
  assert.equal(authResult.appended, true);

  authorizeDeclaredOperation('coord_spec_happy', operationAuthorization(), ctx.opts);
  const { assignment, runResult, resumed } = await dispatchSpecialist('coord_spec_happy', ctx);

  assert.equal(resumed, false);
  assert.equal(runResult.status, 'done');
  assert.equal(assignment.role, 'specialist');

  const events = readSessionEvents('coord_spec_happy', ctx.opts);
  const specialistEvent = events.find((e) => e.type === 'specialist-authorized');
  const authEvent = events.find((e) => e.type === 'operation-authorized');
  const createdEvent = events.find((e) => e.type === 'assignment-created');
  assert.ok(specialistEvent, 'specialist-authorized event must exist');
  assert.equal(specialistEvent.payload.specialistActorId, 'specialist-alpha');
  assert.ok(events.indexOf(specialistEvent) < events.indexOf(authEvent), 'specialist-authorized must precede operation-authorized');
  assert.ok(events.indexOf(authEvent) < events.indexOf(createdEvent), 'operation-authorized must precede assignment-created');
  assert.equal(createdEvent.payload.actorId, 'specialist-alpha');

  const replayed = replaySession('coord_spec_happy', ctx.opts);
  assert.equal(replayed.specialistAuthorizations.length, 1);
  assert.equal(replayed.specialistAuthorizations[0].specialistActorId, 'specialist-alpha');
});

test('dispatching without an explicit targetActorId resolves the live specialist automatically', async () => {
  const ctx = setup('coord_spec_implicit');
  authorizeSpecialistSlot('coord_spec_implicit', specialistAuthorization(), ctx.opts);
  authorizeDeclaredOperation('coord_spec_implicit', operationAuthorization(), ctx.opts);

  const { assignment } = await dispatchSpecialist('coord_spec_implicit', ctx, { targetActorId: undefined });
  assert.equal(assignment.role, 'specialist');
});

// ─── Bug Taxonomy: worker/peer authorization refused ───────────────────────

test('a non-driver identity cannot authorize a specialist into a slot', () => {
  const ctx = setup('coord_spec_worker');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_worker', specialistAuthorization({ authorizedBy: { type: 'driver', id: 'not-the-driver' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /is not the driver identity of session/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_spec_worker', ctx.opts).filter((e) => e.type === 'specialist-authorized').length, 0);
});

// A genuinely worker-shaped authorizedBy is a distinct case from the
// id-mismatch test above (a driver-typed identity naming the wrong id) --
// this proves the generic authorizedBy.type schema gate (the same one
// coordination-recheck-disposition.test.mjs:471 already proves for the
// sibling `disposition` event kind) also refuses `specialist-authorized`.
test('a worker-typed identity (not merely a wrong driver id) cannot authorize a specialist into a slot', () => {
  const ctx = setup('coord_spec_worker_type');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_worker_type', specialistAuthorization({ authorizedBy: { type: 'worker', id: 'reviewer' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /authorizedBy\.type must be "driver"/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_spec_worker_type', ctx.opts).filter((e) => e.type === 'specialist-authorized').length, 0);
});

// ─── Bug Taxonomy: unknown slot id refused ──────────────────────────────────

test('an unknown slotId is refused', () => {
  const ctx = setup('coord_spec_unknown_slot');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_unknown_slot', specialistAuthorization({ slotId: 'ghost-slot' }), ctx.opts),
    (err) => err instanceof CoordinationError && /slot "ghost-slot" is not declared/.test(err.message),
  );
});

// ─── Bug Taxonomy: role/capability mismatch refused ────────────────────────

test('a role that does not match the slot\'s own declared role is refused', () => {
  const ctx = setup('coord_spec_role_mismatch');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_role_mismatch', specialistAuthorization({ role: 'doer' }), ctx.opts),
    (err) => err instanceof CoordinationError && /role "doer" does not match specialist slot "review-slot"'s own declared role "specialist"/.test(err.message),
  );
});

test('a capability set that does not satisfy the slot\'s requiredCapabilities is refused', () => {
  const ctx = setup('coord_spec_capability_mismatch');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_capability_mismatch', specialistAuthorization({ capabilities: [] }), ctx.opts),
    (err) => err instanceof CoordinationError && /do not satisfy specialist slot "review-slot"'s own declared requiredCapabilities -- missing \[deep-review\]/.test(err.message),
  );
});

// ─── Bug Taxonomy: over-cap binding refused (maxBindings) ──────────────────

test('a slot at its maxBindings cap refuses a new, different specialist actor', () => {
  const ctx = setup('coord_spec_max_bindings', { maxBindings: 1 });
  authorizeSpecialistSlot('coord_spec_max_bindings', specialistAuthorization(), ctx.opts);
  assert.throws(
    () =>
      authorizeSpecialistSlot(
        'coord_spec_max_bindings',
        specialistAuthorization({ specialistActorId: 'specialist-beta', specialistAuthorizationId: 'sauth_2' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /already has 1 distinct specialist actor\(s\) authorized, at or above its declared maxBindings cap of 1/.test(err.message),
  );
});

test('re-authorizing the SAME specialist actor for the same slot does not consume a new binding', () => {
  const ctx = setup('coord_spec_rebind_same_actor', { maxBindings: 1 });
  authorizeSpecialistSlot('coord_spec_rebind_same_actor', specialistAuthorization(), ctx.opts);
  const result = authorizeSpecialistSlot(
    'coord_spec_rebind_same_actor',
    specialistAuthorization({ specialistAuthorizationId: 'sauth_2', reason: 'Extend the existing specialist authorization.' }),
    ctx.opts,
  );
  assert.equal(result.appended, true);
});

// ─── Bug Taxonomy: over-cap assignment refused (maxAssignments) ───────────

test('a bound specialist cannot be authorized for dispatch beyond its own maxAssignments cap', () => {
  const ctx = setup('coord_spec_max_assignments');
  authorizeSpecialistSlot('coord_spec_max_assignments', specialistAuthorization({ maxAssignments: 1 }), ctx.opts);
  authorizeDeclaredOperation('coord_spec_max_assignments', operationAuthorization(), ctx.opts);
  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_spec_max_assignments',
        operationAuthorization({ authorizationId: 'auth_specialist_2', invocationKey: 'specialist-review:2' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /at or above its specialist authorization's declared maxAssignments cap of 1/.test(err.message),
  );
});

// ─── Bug Taxonomy: foreign context refused ─────────────────────────────────

test('triggerEvidenceRefs/allowedContextRefs naming a different coordination session are refused', () => {
  const ctx = setup('coord_spec_foreign_context');
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_spec_foreign_other', objective: 'A different session entirely.', writerId: DRIVER_ID },
    ctx.opts,
  );
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_foreign_context', specialistAuthorization({ triggerEvidenceRefs: ['coord_spec_foreign_other'] }), ctx.opts),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_foreign_context', specialistAuthorization({ allowedContextRefs: ['coord_spec_foreign_other'] }), ctx.opts),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
});

// ─── Bug Taxonomy: expired or terminal session refused; history preserved ─

test('a terminal session refuses a new specialist authorization', () => {
  const ctx = setup('coord_spec_terminal');
  transitionSessionStatus('coord_spec_terminal', 'completed', {}, ctx.opts);
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_terminal', specialistAuthorization(), ctx.opts),
    (err) => err instanceof CoordinationError && /is not active \(status: "completed"\)/.test(err.message),
  );
});

test('an expired authorization refuses a new Assignment once real session progress passes expiresAfterRound, but its own event is never erased', async () => {
  const ctx = setup('coord_spec_expired');
  authorizeSpecialistSlot('coord_spec_expired', specialistAuthorization({ expiresAfterRound: 1 }), ctx.opts);

  // Fresh session, no Assignment materialized yet: the internally-derived
  // current round is 1, so the authorization is live.
  const beforeAny = replaySession('coord_spec_expired', ctx.opts);
  assert.ok(resolveLiveSpecialistBindings(beforeAny).has('review-slot'));

  // `round` is never supplied here -- matching the ONE real production call
  // path (src/verbs/coordination/run.mjs's "authorize"/"operation" steps),
  // which never forwards it either. The first Assignment is still within
  // expiresAfterRound: 1 (real progress so far is zero prior Assignments).
  authorizeDeclaredOperation('coord_spec_expired', operationAuthorization(), ctx.opts);
  const first = await dispatchSpecialist('coord_spec_expired', ctx);
  assert.equal(first.resumed, false);

  // Real session progress has now advanced (one Assignment materialized,
  // session-wide) past the authorization's own expiresAfterRound: 1 -- this
  // is the Red-Team's exact empirical probe shape: round omitted/defaulted,
  // matching real production usage, and it must now correctly refuse.
  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_spec_expired',
        operationAuthorization({ authorizationId: 'auth_specialist_r2', invocationKey: 'specialist-review:r2' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /no specialist is currently authorized for that slot in this session \(or its authorization has expired\)/.test(err.message),
  );

  const replayed = replaySession('coord_spec_expired', ctx.opts);
  assert.equal(replayed.specialistAuthorizations.length, 1, 'the original specialist-authorized event must still be present, never erased');
  assert.equal(replayed.specialistAuthorizations[0].expiresAfterRound, 1);

  // resolveLiveSpecialistBindings agrees directly: live before any real
  // progress, absent once one Assignment has actually been created.
  assert.ok(!resolveLiveSpecialistBindings(replayed).has('review-slot'));
});

test('a regression against the original round-1 bypass: 5 real authorizeDeclaredOperation calls with round omitted (matching real production run.mjs usage) all correctly refuse once real progress has passed expiresAfterRound', async () => {
  const ctx = setup('coord_spec_round_bypass_regression');
  authorizeSpecialistSlot('coord_spec_round_bypass_regression', specialistAuthorization({ expiresAfterRound: 1 }), ctx.opts);

  // Spend the one round the authorization is actually good for.
  authorizeDeclaredOperation('coord_spec_round_bypass_regression', operationAuthorization(), ctx.opts);
  await dispatchSpecialist('coord_spec_round_bypass_regression', ctx);

  // Pre-fix, this call shape (round always omitted, exactly as the real
  // "authorize" step in run.mjs calls it) structurally never expired
  // anything, no matter how many times it was retried. Post-fix, every one
  // of these must refuse -- none may silently succeed.
  for (let i = 0; i < 5; i += 1) {
    assert.throws(
      () =>
        authorizeDeclaredOperation(
          'coord_spec_round_bypass_regression',
          operationAuthorization({ authorizationId: `auth_bypass_probe_${i}`, invocationKey: `specialist-review:bypass-${i}` }),
          ctx.opts,
        ),
      (err) => err instanceof CoordinationError && /no specialist is currently authorized for that slot in this session \(or its authorization has expired\)/.test(err.message),
      `probe call ${i} must refuse, not silently succeed`,
    );
  }
  assert.equal(
    readSessionEvents('coord_spec_round_bypass_regression', ctx.opts).filter((e) => e.type === 'operation-authorized').length,
    1,
    'only the one legitimate authorization (spent before expiry) may exist -- none of the 5 bypass probes may have appended a second',
  );
});

// ─── Acceptance: replacement stays within slot/session caps, history intact ─

test('replacement: a new driver authorization for the same slot supersedes the prior specialist, remains within maxBindings, and never erases the prior event', async () => {
  const ctx = setup('coord_spec_replace', { maxBindings: 2 });
  authorizeSpecialistSlot('coord_spec_replace', specialistAuthorization(), ctx.opts);
  authorizeSpecialistSlot(
    'coord_spec_replace',
    specialistAuthorization({ specialistActorId: 'specialist-beta', specialistAuthorizationId: 'sauth_2', reason: 'Original specialist unavailable; replace.' }),
    ctx.opts,
  );

  // The live occupant is now the replacement, not the original.
  authorizeDeclaredOperation(
    'coord_spec_replace',
    operationAuthorization({ targetActorId: 'specialist-beta', authorizationId: 'auth_beta_1', invocationKey: 'specialist-review:beta-1' }),
    ctx.opts,
  );
  const { assignment } = await dispatchSpecialist('coord_spec_replace', ctx, { targetActorId: 'specialist-beta' });
  assert.equal(assignment.role, 'specialist');

  const replayed = replaySession('coord_spec_replace', ctx.opts);
  assert.equal(replayed.specialistAuthorizations.length, 2, 'both the original and the replacement authorization remain on the log');
  assert.equal(replayed.specialistAuthorizations[0].specialistActorId, 'specialist-alpha');
  assert.equal(replayed.specialistAuthorizations[1].specialistActorId, 'specialist-beta');
  const live = resolveLiveSpecialistBindings(replayed);
  assert.equal(live.get('review-slot').specialistActorId, 'specialist-beta');

  // A THIRD distinct specialist actor exceeds maxBindings (2 already spent).
  assert.throws(
    () =>
      authorizeSpecialistSlot(
        'coord_spec_replace',
        specialistAuthorization({ specialistActorId: 'specialist-gamma', specialistAuthorizationId: 'sauth_3' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /at or above its declared maxBindings cap of 2/.test(err.message),
  );

  // Dispatching against the OLD (superseded) specialist's id is refused
  // post-replacement (Red-Team round 1, INFO: verified correct by code
  // trace, previously untested).
  await assert.rejects(
    () => dispatchSpecialist('coord_spec_replace', ctx, { targetActorId: 'specialist-alpha' }),
    (err) => err instanceof CoordinationError && /is not wired into this protocol's graph/.test(err.message),
  );
});

// ─── Bug Taxonomy: specialistActorId vs spec.actors[] disjointness ────────

test('a specialistActorId colliding with a statically-declared spec.actors[] id is refused', () => {
  const ctx = setup('coord_spec_actor_collision');
  assert.throws(
    () => authorizeSpecialistSlot('coord_spec_actor_collision', specialistAuthorization({ specialistActorId: 'doer' }), ctx.opts),
    (err) => err instanceof CoordinationError && /collides with a statically-declared spec\.actors\[\] id/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_spec_actor_collision', ctx.opts).filter((e) => e.type === 'specialist-authorized').length, 0);
});

// ─── Read-surface parity (show.mjs mirrors the write door) ─────────────────

test('show surfaces specialistAuthorizations/ignoredSpecialistAuthorizations', () => {
  const ctx = setup('coord_spec_show');
  authorizeSpecialistSlot('coord_spec_show', specialistAuthorization(), ctx.opts);

  const rendered = showCoordinationUseCase(ctx.opts, { id: 'coord_spec_show' });
  assert.equal(rendered.specialistAuthorizations.length, 1);
  assert.equal(rendered.specialistAuthorizations[0].specialistActorId, 'specialist-alpha');
  assert.equal(rendered.specialistAuthorizations[0].slotId, 'review-slot');
  assert.deepEqual(rendered.ignoredSpecialistAuthorizations, []);
});

// ─── Idempotency ────────────────────────────────────────────────────────────

test('a repeated call with the same specialistAuthorizationId is idempotent (no duplicate event)', () => {
  const ctx = setup('coord_spec_idempotent');
  const first = authorizeSpecialistSlot('coord_spec_idempotent', specialistAuthorization(), ctx.opts);
  const second = authorizeSpecialistSlot('coord_spec_idempotent', specialistAuthorization(), ctx.opts);
  assert.equal(first.appended, true);
  assert.equal(second.appended, false);
  assert.equal(readSessionEvents('coord_spec_idempotent', ctx.opts).filter((e) => e.type === 'specialist-authorized').length, 1);
});

// ─── Phase 09 P09.3: no addSessionEdge/topology-overlay/Work/git/coding
// mutation path is reachable through the specialist mechanism -- R7's
// existing hardcoded-read-only guarantee still applies uniformly to a
// specialist-dispatched Assignment, not just a statically-actor-bound one
// (current-cell.md item 2/3). `dispatchDeclaredOperation` has exactly ONE
// `buildReadOnlyContract(...)` call site (session-engine.mjs), reached
// identically whether `resolveDeclaredOperationActor` resolved `actorId` via
// a static `actor` or via a live `specialistSlotRef` binding -- the
// specialist-binding branch (`specialistBindings`) only ever changes WHICH
// actorId is resolved, never how the contract that actorId is dispatched
// under is built. This test proves it behaviorally against a REAL dispatched
// specialist Assignment, complementing (not duplicating)
// coordination-r7-work-isolation.test.mjs's own static param-destructuring
// scan of `dispatchDeclaredOperation` by name (already covers this function
// generically) and its dynamic forbidden-export-name scan over the whole
// `src/runner/coordination/**` directory (already covers every new P09.2
// export, including `authorizeSpecialistSlot`/`recordSpecialistAuthorization`,
// with zero changes needed to that test). ─────────────────────────────────

test('R7: a specialist-dispatched Assignment carries the same hardcoded mutation: "read-only" contract every statically-actor-bound Assignment does -- specialistSlotRef introduces no new mutation-capable path', async () => {
  const ctx = setup('coord_spec_r7_readonly');
  authorizeSpecialistSlot('coord_spec_r7_readonly', specialistAuthorization(), ctx.opts);
  authorizeDeclaredOperation('coord_spec_r7_readonly', operationAuthorization(), ctx.opts);
  const { assignment } = await dispatchSpecialist('coord_spec_r7_readonly', ctx);
  assert.equal(assignment.mutation, 'read-only');
});

// ─── Phase 09 P09.3: crash recovery between authorization, actor binding,
// and Assignment creation -- resumes without duplicate actors or Assignments
// (current-cell.md item 1). Modeled on
// coordination-recovery-and-quorum.test.mjs's own "crash point ..." naming
// convention and its "construct the exact durable on-disk state a crash
// would leave, then prove the SAME real call resumes cleanly" house style
// (never a literal process kill). Since P09.2's own
// `recordSpecialistAuthorization` is a SINGLE `appendEventLocked` call
// inside one `withEventsLock` critical section (Design Notes, P09.2.md --
// "authorized" and "bound" are the same write, so there is no window
// between them to construct a fixture for), the two real crash points this
// mechanism actually has are: (a) the caller never learned whether its
// `specialist-authorized` write committed before crashing, and retries with
// the same `specialistAuthorizationId`; (b) the caller never learned
// whether its dispatch request materialized an Assignment for the newly-
// bound specialist before crashing, and retries the identical dispatch
// request. ───────────────────────────────────────────────────────────────

test('crash point "specialist-authorized write outcome unknown to caller": retrying authorizeSpecialistSlot with the SAME specialistAuthorizationId resumes idempotently -- never mints a second authorization event, the slot\'s live binding is unaffected, and dispatch still proceeds normally afterward', async () => {
  const ctx = setup('coord_spec_crash_authorize_retry');
  const first = authorizeSpecialistSlot('coord_spec_crash_authorize_retry', specialistAuthorization(), ctx.opts);
  assert.equal(first.appended, true);

  // The caller crashed right after this call returned (or before it learned
  // the result) and, on restart, retries the exact same authorization
  // request -- indistinguishable, from the caller's side, from "did my
  // first call ever durably commit?".
  const retried = authorizeSpecialistSlot('coord_spec_crash_authorize_retry', specialistAuthorization(), ctx.opts);
  assert.equal(retried.appended, false, 'the retry must resume, never mint a second specialist-authorized event');

  const replayed = replaySession('coord_spec_crash_authorize_retry', ctx.opts);
  assert.equal(replayed.specialistAuthorizations.length, 1, 'exactly one authorization exists after the retry -- no duplicate actor binding');
  const live = resolveLiveSpecialistBindings(replayed);
  assert.equal(live.size, 1);
  assert.equal(live.get('review-slot').specialistActorId, 'specialist-alpha');

  // Full recovery, not just an event count: the resumed session still
  // dispatches a real Assignment to the (unchanged) live specialist.
  authorizeDeclaredOperation('coord_spec_crash_authorize_retry', operationAuthorization(), ctx.opts);
  const { assignment, runResult } = await dispatchSpecialist('coord_spec_crash_authorize_retry', ctx);
  assert.equal(runResult.status, 'done');
  assert.equal(assignment.role, 'specialist');
});

test('crash point "specialist-authorized and operation-authorized durably written, caller never learned whether the Assignment materialized": retrying the identical dispatch request resumes the SAME Assignment, never double-dispatches or double-authorizes', async () => {
  const ctx = setup('coord_spec_crash_dispatch_retry');
  authorizeSpecialistSlot('coord_spec_crash_dispatch_retry', specialistAuthorization(), ctx.opts);
  authorizeDeclaredOperation('coord_spec_crash_dispatch_retry', operationAuthorization(), ctx.opts);

  const first = await dispatchSpecialist('coord_spec_crash_dispatch_retry', ctx);
  assert.equal(first.resumed, false, 'the first call genuinely dispatches');

  // The caller crashed before it ever saw this response and, on restart,
  // retries the IDENTICAL dispatch request (same operationId/targetActorId,
  // no explicit taskKey -- exactly what a resumed process would replay).
  const retried = await dispatchSpecialist('coord_spec_crash_dispatch_retry', ctx);
  assert.equal(retried.resumed, true, 'the retry must resume the existing Assignment, not dispatch a new one');
  assert.equal(retried.assignment.assignmentId, first.assignment.assignmentId, 'same Assignment id -- no duplicate Assignment for the same specialist invocation');

  const events = readSessionEvents('coord_spec_crash_dispatch_retry', ctx.opts);
  assert.equal(events.filter((e) => e.type === 'specialist-authorized').length, 1, 'no duplicate specialist-authorized event from the retry');
  assert.equal(events.filter((e) => e.type === 'operation-authorized').length, 1, 'no duplicate operation-authorized event from the retry');
  assert.equal(events.filter((e) => e.type === 'assignment-created').length, 1, 'no duplicate assignment-created event from the retry -- exactly one Assignment for this specialist invocation');
});
