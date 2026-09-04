// Phase 01 mutation-unlock tests: a declared `operation` step may dispatch
// as a real, mutating worker under a narrow, testable four-condition rule
// (R1-R6), without weakening the existing read-only guarantee for every
// other role/step shape. All engine-level -- calling
// `openDeclaredProtocolSession`/`dispatchDeclaredOperation`/
// `dispatchPrimaryTask`/`proposeConsult` directly with explicit
// `ctx.cwd`/`ctx.repoRoot`, never through bin/fgos.mjs or any CLI surface.
//
// R3's own check shells out to real git (resolveMainCheckoutRoot/
// resolveRepoRoot), so it cannot be stubbed -- every test here that exercises
// mutation:'mutating' builds a REAL temp git repo with a REAL linked
// worktree (`git worktree add`), matching this repo's own established
// pattern (test/runner/main-checkout-lock.test.mjs, test/runner/worktree.test.mjs).
//
// The declared protocol fixture is written project-tier
// (`<cwd>/.fgos/coordination-protocols/*.json`), the SAME pattern
// test/runner/coordination-driver-authorization.test.mjs already uses --
// never a core/coordination-protocols/** fixture (Phase 01's own
// Do-Not-Touch list).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  openDeclaredProtocolSession,
  openStandaloneSession,
  dispatchDeclaredOperation,
  dispatchPrimaryTask,
  proposeConsult,
} from '../../src/runner/coordination/session-engine.mjs';
import { resolveSessionPaths } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';

const DEFINITION_ID = 'test.coordination-protocol.mutation-unlock';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** A real disposable git repo (main checkout) with a REAL linked worktree
 * (`git worktree add`), mirroring test/runner/main-checkout-lock.test.mjs's
 * own `initTempRepo` + test/runner/worktree.test.mjs's own `worktree add`
 * pattern. R3's check cannot be exercised without a genuine git checkout. */
function initTempRepoWithWorktree() {
  const repoRoot = mkTempDir('fgos-mutation-unlock-repo-');
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });

  const worktreeRoot = mkTempDir('fgos-mutation-unlock-worktree-');
  execFileSync('git', ['worktree', 'add', '-b', `mutation-unlock-work-${Math.random().toString(36).slice(2)}`, worktreeRoot], { cwd: repoRoot });
  return { repoRoot, worktreeRoot };
}

/** Project-tier CoordinationProtocol fixture (never core/**): three root
 * operations (no spec.profile.topology declared, so none of them require
 * `fromAssignmentId`) -- `produce-mutating` (doer, result.kind:
 * work-product), `produce-advisory` (doer, result.kind: advisory, for R2's
 * negative test), `review-candidate` (reviewer, result.kind: advisory, for
 * the rollback/hard-refusal regression, Tests First #5). */
function writeFixture(cwd) {
  const dir = path.join(cwd, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer'],
      actors: [
        { id: 'doer-actor', role: 'doer' },
        { id: 'reviewer-actor', role: 'reviewer' },
      ],
      operations: [
        { id: 'produce-mutating', role: 'doer', result: { kind: 'work-product', evidenceRequired: 'reported' } },
        { id: 'produce-advisory', role: 'doer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-mutating', actor: 'doer-actor' }], transitions: ['phase-produce-advisory'] },
          { id: 'phase-produce-advisory', operations: [{ ref: 'produce-advisory', actor: 'doer-actor' }], transitions: ['phase-review'] },
          { id: 'phase-review', operations: [{ ref: 'review-candidate', actor: 'reviewer-actor' }], transitions: [] },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'mutation-unlock.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

/**
 * A real Node subprocess worker (never a JS-level stub over
 * executeAssignment/executeExecutorCli), same shape as
 * coordination-declared-consult.test.mjs's own `fakeExecutor` -- except
 * `assignmentsRoot` is passed in EXPLICITLY (an absolute path known at
 * test-setup time) rather than derived from the worker's own
 * `process.cwd()`, because for a worktree-cwd dispatch the real
 * `.fgos/assignments/` directory lives at the MAIN CHECKOUT root (R8), not
 * under the worktree the worker's own cwd resolves to.
 *
 * @param {string} scriptDir Where to write the throwaway executor script.
 * @param {string} assignmentsRoot Absolute path to the REAL `.fgos/assignments` dir.
 * @param {{status?: string, summary?: string, writeFile?: string, commit?: boolean}} [options]
 */
function fakeExecutor(scriptDir, assignmentsRoot, { status = 'done', summary = 'Validated.', writeFile, commit = false } = {}) {
  const scriptPath = path.resolve(scriptDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    import { execFileSync } from 'node:child_process';
    const cwd = process.cwd();
    const assignmentsRoot = ${JSON.stringify(assignmentsRoot)};
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
    ${writeFile ? `fs.writeFileSync(path.join(cwd, ${JSON.stringify(writeFile)}), 'mutating worker output\\n');` : ''}
    ${commit
      ? `
    execFileSync('git', ['add', ${JSON.stringify(writeFile)}], { cwd });
    execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '-q', '-m', 'worker: mutate'], { cwd });
    `
      : ''}
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 5000,
  };
}

// ─── R1 (src/verbs/coordination/schema.mjs): assertMutationAllowed ────────

test('R1: a request-file "operation" step may declare mutation: "mutating"; every other step type (authorize/disposition/fan-out/contribution) stays hard-refused for anything but "read-only"', () => {
  if (!validateCoordinationRequest) return; // module not present at this path; covered indirectly below
  const baseRequest = (steps) => ({
    kind: 'declared-protocol',
    coordinationId: 'coord_r1_schema',
    objective: 'Prove R1 mutation-field scoping at the schema layer.',
    writerId: 'coordinator-1',
    protocolRef: { id: DEFINITION_ID.replace(/\./g, '-') },
    steps,
  });

  const mutatingOperationStep = {
    type: 'operation',
    as: 'produce',
    operationId: 'produce-mutating',
    objective: 'Produce a work-product.',
    expectedOutputs: ['agent-result.json'],
    mutation: 'mutating',
  };
  const normalized = validateCoordinationRequest(baseRequest([mutatingOperationStep]));
  assert.equal(normalized.steps[0].mutation, 'mutating', 'an "operation" step must be allowed to declare mutation: "mutating"');

  const mutatingAuthorizeStep = {
    type: 'authorize',
    as: 'authorize-x',
    operationId: 'produce-mutating',
    authorizationId: 'auth_1',
    invocationKey: 'k1',
    reason: 'test',
    mutation: 'mutating',
  };
  assert.throws(
    () => validateCoordinationRequest(baseRequest([mutatingOperationStep, mutatingAuthorizeStep])),
    (err) => /must be "read-only"/.test(err.message),
    'an "authorize" step must stay hard-refused for mutation: "mutating"',
  );

  const mutatingDispositionStep = {
    type: 'disposition',
    as: 'close',
    targetRef: '$ref:produce',
    disposition: 'accepted',
    rationale: 'test',
    mutation: 'mutating',
  };
  assert.throws(
    () => validateCoordinationRequest(baseRequest([mutatingOperationStep, mutatingDispositionStep])),
    (err) => /must be "read-only"/.test(err.message),
    'a "disposition" step must stay hard-refused for mutation: "mutating"',
  );

  const mutatingFanOutStep = {
    type: 'fan-out',
    as: 'fan',
    operationId: 'produce-mutating',
    branches: [{ actorId: 'doer-actor', objective: 'x', expectedOutputs: ['y'], mutation: 'mutating' }],
  };
  assert.throws(
    () => validateCoordinationRequest(baseRequest([mutatingOperationStep, mutatingFanOutStep])),
    (err) => /must be "read-only"/.test(err.message),
    'a fan-out branch must stay hard-refused for mutation: "mutating"',
  );
});

test('R1: an "operation" step with mutation omitted still normalizes to mutation: undefined (byte-identical default, threaded through unset)', () => {
  if (!validateCoordinationRequest) return;
  const normalized = validateCoordinationRequest({
    kind: 'declared-protocol',
    coordinationId: 'coord_r1_omit',
    objective: 'x',
    writerId: 'coordinator-1',
    protocolRef: { id: 'x' },
    steps: [
      {
        type: 'operation',
        as: 'produce',
        operationId: 'produce-mutating',
        objective: 'x',
        expectedOutputs: ['y'],
      },
    ],
  });
  assert.equal(normalized.steps[0].mutation, undefined);
});

// ─── Tests First #1: a mutating dispatch produces a REAL git delta ────────

test('Tests First #1(a): a mutating operation step (result.kind: work-product) dispatched with ctx.cwd = a real linked worktree produces a real uncommitted file change and grades verified with non-empty changedFiles', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  writeFixture(worktreeRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r3_1a', objective: 'Prove a mutating dispatch produces a real, verified git delta.', writerId: 'coordinator-1' },
    { cwd: worktreeRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(worktreeRoot, assignmentsRoot, { writeFile: 'mutating-output.txt' });

  const { assignment, runResult } = await dispatchDeclaredOperation(
    'coord_r3_1a',
    {
      operationId: 'produce-mutating',
      objective: 'Produce a real work-product artifact.',
      expectedOutputs: ['mutating-output.txt'],
      writerId: 'coordinator-1',
      mutation: 'mutating',
    },
    { cwd: worktreeRoot, runnerConfig },
  );

  assert.equal(assignment.mutation, 'mutating');
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(runResult.status, 'done');
  assert.equal(runResult.confidence, 'verified');
  assert.ok(
    runResult.evidence.changedFiles.includes('mutating-output.txt'),
    `expected mutating-output.txt in changedFiles, got: ${JSON.stringify(runResult.evidence.changedFiles)}`,
  );
  assert.equal(fs.existsSync(path.join(worktreeRoot, 'mutating-output.txt')), true);

  // R8 regression (same dispatch, no extra setup): session/assignment state
  // lands under the MAIN CHECKOUT's .fgos/, never the worktree's own
  // (wiped-on-creation, ADR0020) .fgos/.
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'coordination', 'sessions', 'coord_r3_1a', 'session.json')), true);
  assert.equal(fs.existsSync(path.join(worktreeRoot, '.fgos', 'coordination')), false);
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json')), true);

  // R7 regression, real persisted artifact: the actual DispatchPlan this
  // dispatch compiled and wrote to disk never carries an invocation.cwd (or
  // top-level cwd) field at all -- so assignment-runner.mjs's own
  // `effectiveCwd = compiledPlan?.invocation?.cwd ?? compiledPlan?.cwd ?? cwd`
  // always collapses to plain `cwd` on this path, exactly like `dirtyBefore`/
  // `dirtyAfter` above already proved empirically via changedFiles.
  const runsDir = path.join(repoRoot, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  const attempt = fs.readdirSync(runsDir).sort()[0];
  const compiledPlan = JSON.parse(fs.readFileSync(path.join(runsDir, attempt, 'dispatch-plan.json'), 'utf8'));
  assert.equal('cwd' in (compiledPlan.invocation ?? {}), false, 'compiledPlan.invocation must never carry a cwd key');
  assert.equal('cwd' in compiledPlan, false, 'compiledPlan must never carry a top-level cwd key');
});

test('Tests First #1(b): a Doer that commits its own change on the cell\'s own worktree branch (R7 commit-policy) also grades verified with the committed file correctly attributed', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  writeFixture(worktreeRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r3_1b', objective: 'Prove a committing mutating dispatch also grades verified.', writerId: 'coordinator-1' },
    { cwd: worktreeRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(worktreeRoot, assignmentsRoot, { writeFile: 'committed-output.txt', commit: true });

  const { assignment, runResult } = await dispatchDeclaredOperation(
    'coord_r3_1b',
    {
      operationId: 'produce-mutating',
      objective: 'Produce and commit a real work-product artifact.',
      expectedOutputs: ['committed-output.txt'],
      writerId: 'coordinator-1',
      mutation: 'mutating',
    },
    { cwd: worktreeRoot, runnerConfig },
  );

  assert.equal(assignment.mutation, 'mutating');
  assert.equal(runResult.status, 'done');
  assert.equal(runResult.confidence, 'verified');
  assert.ok(
    runResult.evidence.changedFiles.includes('committed-output.txt'),
    `expected committed-output.txt (committed) in changedFiles, got: ${JSON.stringify(runResult.evidence.changedFiles)}`,
  );
  assert.notEqual(runResult.evidence.gitBefore, runResult.evidence.gitAfter, 'a real commit must advance the worktree HEAD');

  const log = execFileSync('git', ['log', '--oneline', '-1'], { cwd: worktreeRoot, encoding: 'utf8' });
  assert.match(log, /worker: mutate/);
});

// ─── Tests First #2: refused when cwd is the main checkout, or outside git ─

test('Tests First #2(a): the same mutating request dispatched with ctx.cwd = the main checkout root is refused BEFORE any dispatch, error naming "main checkout"', async () => {
  const { repoRoot } = initTempRepoWithWorktree();
  writeFixture(repoRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r3_2a', objective: 'R3 negative: main checkout refused.', writerId: 'coordinator-1' },
    { cwd: repoRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(repoRoot, assignmentsRoot, { writeFile: 'should-never-exist.txt' });

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_r3_2a',
      {
        operationId: 'produce-mutating',
        objective: 'x',
        expectedOutputs: ['y'],
        writerId: 'coordinator-1',
        mutation: 'mutating',
      },
      { cwd: repoRoot, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /main checkout/.test(err.message),
  );

  assert.equal(fs.existsSync(path.join(repoRoot, 'should-never-exist.txt')), false, 'a refused-before-dispatch request must never spawn the worker at all');
  const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
  assert.ok(!fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0, 'zero Assignments created by a refused mutating dispatch');
});

test('Tests First #2(b): the same mutating request dispatched with ctx.cwd entirely outside any git checkout is refused too (R3 fail-closed-on-null)', async () => {
  // A session/definition can only be opened relative to an already-resolved
  // workspace, so this exercises assertMutatingDispatchAllowed's own
  // resolveMainCheckoutRoot(cwd) === null branch directly, at the exact
  // point dispatchDeclaredOperation calls it -- the session/definition
  // themselves are opened against the real repo (repoRoot forwarded
  // explicitly), but the DISPATCH's own cwd points outside git entirely.
  const { repoRoot } = initTempRepoWithWorktree();
  writeFixture(repoRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r3_2b', objective: 'R3 negative: outside git refused.', writerId: 'coordinator-1' },
    { cwd: repoRoot },
  );
  const outsideGit = mkTempDir('fgos-mutation-unlock-outside-git-');
  // loadCoordinationProtocol's project-tier lookup resolves relative to raw
  // opts.cwd (protocol-loader.mjs), independent of opts.repoRoot and of git
  // entirely -- write the SAME fixture there too so the definition load
  // (which runs BEFORE this cell's own R2/R3 gate inside
  // dispatchDeclaredOperation) succeeds, and the FIRST refusal actually hit
  // is R3's, not an unrelated "definition not found".
  writeFixture(outsideGit);
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(outsideGit, assignmentsRoot, { writeFile: 'should-never-exist-2.txt' });

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_r3_2b',
      {
        operationId: 'produce-mutating',
        objective: 'x',
        expectedOutputs: ['y'],
        writerId: 'coordinator-1',
        mutation: 'mutating',
      },
      { cwd: outsideGit, repoRoot, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /does not resolve inside any git checkout/.test(err.message),
  );
  assert.equal(fs.existsSync(path.join(outsideGit, 'should-never-exist-2.txt')), false);
});

// ─── Tests First #3: refused when the operation's own declared kind isn't work-product ─

test('Tests First #3: a mutating step whose bound operation declares result.kind: "advisory" is refused, error naming the operation\'s own declared kind', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  writeFixture(worktreeRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r2_neg', objective: 'R2 negative: advisory kind refused.', writerId: 'coordinator-1' },
    { cwd: worktreeRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(worktreeRoot, assignmentsRoot, { writeFile: 'should-never-exist-3.txt' });

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_r2_neg',
      {
        operationId: 'produce-advisory',
        objective: 'x',
        expectedOutputs: ['y'],
        writerId: 'coordinator-1',
        mutation: 'mutating',
      },
      { cwd: worktreeRoot, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /result\.kind "advisory"/.test(err.message) && /work-product/.test(err.message),
  );
  assert.equal(fs.existsSync(path.join(worktreeRoot, 'should-never-exist-3.txt')), false);
});

// ─── Tests First #4: mutation omitted stays byte-identical to today ───────

test('Tests First #4: a step that does NOT declare mutation at all behaves byte-identically to today (read-only, isReadOnlyMode: true), reproduced against an existing standalone-master-coordination-loop-shaped dispatch', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  writeFixture(worktreeRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r4_default', objective: 'R4 default: omitted mutation stays read-only.', writerId: 'coordinator-1' },
    { cwd: worktreeRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(worktreeRoot, assignmentsRoot);

  const { assignment, runResult } = await dispatchDeclaredOperation(
    'coord_r4_default',
    {
      operationId: 'produce-mutating', // declares work-product, but mutation is simply omitted here
      objective: 'x',
      expectedOutputs: ['agent-result.json'],
      writerId: 'coordinator-1',
      // mutation intentionally omitted
    },
    { cwd: worktreeRoot, runnerConfig },
  );

  assert.equal(assignment.mutation, 'read-only', 'omitted mutation must default to read-only even for a work-product-declaring operation');
  assert.equal(runResult.status, 'done');
  assert.equal(runResult.confidence, 'reported');
});

// ─── Tests First #5: reviewer/red-team rollback + hard read-only carve-out ─

test('Tests First #5(a): a reviewer role dispatched normally (unchanged request shape, mutation omitted) still fails closed if its own worker script mutates a file -- the pre-existing read-only-violation gate, unaffected by mutation-unlock', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  writeFixture(worktreeRoot);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_r5_rollback', objective: 'R5 regression: reviewer mutation still fails closed.', writerId: 'coordinator-1' },
    { cwd: worktreeRoot },
  );
  const assignmentsRoot = path.join(repoRoot, '.fgos', 'assignments');
  const runnerConfig = fakeExecutor(worktreeRoot, assignmentsRoot, { writeFile: 'illegal-reviewer-write.txt' });

  const { assignment, runResult } = await dispatchDeclaredOperation(
    'coord_r5_rollback',
    {
      operationId: 'review-candidate',
      objective: 'Review the candidate.',
      expectedOutputs: ['agent-result.json'],
      writerId: 'coordinator-1',
    },
    { cwd: worktreeRoot, runnerConfig },
  );

  assert.equal(assignment.mutation, 'read-only');
  // classifyRunEvidence's own Step 06 P1 gate: a read-only operation that
  // produced external evidence (a real file mutation) fails closed --
  // confirmed the CURRENT real behavior (not a stale assumption) against
  // test/runner/assignment-dispatch.test.mjs's own "Finding 3" regression
  // test, which asserts the identical {status:'failed', confidence:'failed'}
  // shape for the exact same mutation-while-read-only scenario.
  assert.equal(runResult.status, 'failed');
  assert.equal(runResult.confidence, 'failed');
  assert.ok(runResult.evidence.changedFiles.includes('illegal-reviewer-write.txt'));
});

test('Tests First #5(b): dispatchPrimaryTask and proposeConsult keep their OWN, separate, hard read-only assertions completely unchanged -- R4\'s explicit carve-out, this mutation-unlock never reaches either path', async () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  const runnerConfig = fakeExecutor(worktreeRoot, path.join(repoRoot, '.fgos', 'assignments'));

  const manifest = openStandaloneSession(
    { coordinationId: 'coord_r5_carveout', objective: 'R5 carve-out: dispatchPrimaryTask/proposeConsult stay hard read-only.', writerId: 'coordinator-1', primaryRole: 'reviewer' },
    { cwd: worktreeRoot },
  );
  assert.equal(manifest.status, 'active');

  // Neither function even ACCEPTS a mutation parameter -- proven structurally:
  // passing one has no effect, both still build mutation: 'read-only'
  // contracts (buildSessionContract's own default), so isReadOnlyMode stays
  // true regardless of what a caller tries to smuggle in.
  const { assignment: primaryAssignment, runResult: primaryResult } = await dispatchPrimaryTask(
    'coord_r5_carveout',
    {
      objective: 'x',
      expectedOutputs: ['agent-result.json'],
      evidenceRequired: 'reported',
      writerId: 'coordinator-1',
      // @ts-expect-error -- not a real parameter; proves it has zero effect
      mutation: 'mutating',
    },
    { cwd: worktreeRoot, runnerConfig },
  );
  assert.equal(primaryAssignment.mutation, 'read-only');
  assert.equal(primaryResult.status, 'done');

  const { assignment: consultAssignment } = await proposeConsult(
    'coord_r5_carveout',
    {
      primaryAssignmentId: primaryAssignment.assignmentId,
      role: 'advisor',
      objective: 'x',
      expectedOutputs: ['agent-result.json'],
      evidenceRequired: 'reported',
      writerId: 'coordinator-1',
    },
    { cwd: worktreeRoot, runnerConfig },
  );
  assert.equal(consultAssignment.mutation, 'read-only');
});

// ─── R6c: operation-choice.mjs's executeAssignment(...) call is proven to
// never receive an inline-provenance Assignment ───────────────────────────

test('R6c: operation-choice.mjs single buildAssignment(...) call (feeding its own executeAssignment(...) two lines later) never sets provenance -- can never build an inline-provenance Assignment, so the inline-mutating-forgery risk R6a stamp gate protects against is structurally unreachable from this call site', () => {
  const source = fs.readFileSync(new URL('../../src/runner/dispatch/operation-choice.mjs', import.meta.url), 'utf8');
  const cleaned = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const matches = [...cleaned.matchAll(/\bbuildAssignment\s*\(/g)];
  assert.equal(matches.length, 1, `expected exactly one buildAssignment(...) call in operation-choice.mjs, found ${matches.length} -- re-open R6c if this changed`);

  // Extract the full call text by paren-balance, same technique as
  // test/architecture.test.mjs's own R6b enumeration.
  const startIdx = matches[0].index;
  const parenStart = cleaned.indexOf('(', startIdx);
  let depth = 0;
  let end = parenStart;
  for (let i = parenStart; i < cleaned.length; i++) {
    if (cleaned[i] === '(') depth++;
    else if (cleaned[i] === ')') {
      depth -= 1;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  const callText = cleaned.slice(startIdx, end);
  assert.ok(
    !/provenance\s*:/.test(callText),
    `operation-choice.mjs's buildAssignment(...) call now sets a "provenance" key -- this could build an inline Assignment; R6c's verified-non-issue conclusion no longer holds: ${callText}`,
  );
});

// ─── R8: every fgosDirFromRoot(-class call site, direct regression ────────

test('R8: resolveSessionPaths keys .fgos on the resolved MAIN CHECKOUT root, never raw cwd, when dispatched from a linked worktree', () => {
  const { repoRoot, worktreeRoot } = initTempRepoWithWorktree();
  const paths = resolveSessionPaths('coord_r8_regression', { cwd: worktreeRoot });
  assert.equal(paths.fgosDir, path.join(repoRoot, '.fgos'));
  assert.notEqual(paths.fgosDir, path.join(worktreeRoot, '.fgos'));
  assert.equal(paths.root, repoRoot);
});
