// coordination-chain.test.mjs -- proof for `fgos coordination chain <track>`
// (src/verbs/coordination/chain.mjs): a read-only reconstruction of "what's
// done, what's next" across a whole chain of cell-sessions, built entirely
// from each matching session's own event log through the SAME read door
// `fgos coordination show` already uses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chainCoordinationUseCase } from '../../src/verbs/coordination/chain.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { launchMasterLoopUseCase, MASTER_LOOP_PROTOCOL_ID } from '../../src/verbs/coordination/launch-master-loop.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-chain-test-'));
}

function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the chain.mjs test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the chain.mjs test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', analytical: 'test-model' } },
  };
}

function agentLedRequest(coordinationId, overrides = {}) {
  return {
    kind: 'agent-led',
    objective: `Close cell ${coordinationId} cleanly.`,
    writerId: 'chain-test-driver',
    coordinationId,
    primaryRole: 'researcher',
    task: {
      expectedOutputs: ['agent-result.json (status, summary)'],
      evidenceRequired: 'reported',
    },
    ...overrides,
  };
}

// Opens+dispatches+closes a single-actor agent-led session with an explicit
// id -- the simplest real session shape that reliably auto-closes.
async function openClosedCell(tempDir, coordinationId) {
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeRunnerConfig(tempDir) };
  const result = await runCoordinationUseCase(ctx, { requestObject: agentLedRequest(coordinationId) });
  assert.equal(result.closed, true, `expected ${coordinationId} to close cleanly`);
  return result;
}

// Opens+dispatches the shipped `declared-consult` protocol's two required
// operations, records a disposition against the first one's own Assignment
// (a THIRD step in the SAME request, so it lands while the session is still
// "active" -- `recordDriverDisposition` refuses once a session has already
// closed, and the automatic close-on-quorum only runs once, after every
// step in the request has processed), then closes. Real, closed session
// state carrying a real disposition -- never a disposition attached to an
// already-closed session (store.mjs's own write door refuses that).
async function openClosedCellWithDisposition(tempDir, coordinationId) {
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeRunnerConfig(tempDir) };
  const requestObject = {
    kind: 'declared-protocol',
    objective: `Close cell ${coordinationId} with a recorded disposition.`,
    writerId: 'chain-test-driver',
    coordinationId,
    protocolRef: { id: 'core.coordination-protocol.declared-consult' },
    steps: [
      {
        type: 'operation',
        as: 'request',
        operationId: 'request-consult',
        objective: 'Read package.json and report the name/version you find.',
        expectedOutputs: ['agent-result.json (status, summary)'],
      },
      {
        type: 'operation',
        as: 'response',
        operationId: 'provide-consult',
        objective: 'Independently confirm or correct the requester\'s finding.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        fromAssignmentId: '$ref:request',
      },
      {
        type: 'disposition',
        as: 'close-round',
        targetRef: '$ref:request',
        disposition: 'accepted',
        rationale: 'Reviewed and accepted for the chain proof.',
        evidenceRefs: ['$ref:response'],
      },
    ],
  };
  const result = await runCoordinationUseCase(ctx, { requestObject });
  assert.equal(result.closed, true, `expected ${coordinationId} to close cleanly`);
  return result;
}

function writePlanFile(tempDir) {
  const planPath = path.join(tempDir, 'plan.md');
  fs.writeFileSync(planPath, '# Plan\nDo the thing.\n');
  return planPath;
}

// Opens the standalone-master-coordination-loop fixture's required first
// pass ONLY (produce/review/red-team) -- fixer/`revise-candidate` is a
// declared SessionActor (openDeclaredProtocolSession binds every
// spec.actors[] entry, including fixer, regardless of which steps this
// composed request dispatches) that never completes here, so quorum never
// closes and the session stays "active" with `revise-candidate` reported as
// a still-pending driver-authorized operation -- the real, live shape a
// cell "waiting on a driver decision" takes in this codebase.
async function openActiveMasterLoopCell(tempDir, coordinationId) {
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeRunnerConfig(tempDir) };
  const planPath = writePlanFile(tempDir);
  const result = await launchMasterLoopUseCase(ctx, {
    planPath,
    objective: `Open cell ${coordinationId}.`,
    writerId: 'chain-test-driver',
    coordinationId,
  });
  assert.equal(result.closed, false, `expected ${coordinationId} to stay open (driver-authorized step pending)`);
  return result;
}

// ---------------------------------------------------------------------
// Test 1: exact prefix matching, never a loose substring match.
// ---------------------------------------------------------------------

test('chain lists exactly cellA and cellB for track "probe", never "other-track--cellC" -- prefix matching is exact, not a loose substring match', async () => {
  const tempDir = mkTempDir();
  await openClosedCell(tempDir, 'probe--cellA');
  await openClosedCell(tempDir, 'probe--cellB');
  await openClosedCell(tempDir, 'probe--other-track--cellC');

  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'probe' });

  assert.deepEqual(
    new Set(result.cells.map((cell) => cell.cellId)),
    new Set(['cellA', 'cellB']),
    '"probe--other-track--cellC" raw-string-starts-with "probe--", but its own remainder carries a further "--" boundary -- the shape a genuinely different track\'s own session id would carry -- so it must never be listed as track "probe"\'s own cell',
  );
  assert.equal(result.cells.length, 2);
});

test('a session id shaped "<track>--<other-track>--<cell>" is excluded from BOTH the outer and the embedded track -- never silently misfiled under either', async () => {
  const tempDir = mkTempDir();
  await openClosedCell(tempDir, 'probe--other-track--cellC');

  const matchedAsProbe = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'probe' });
  assert.deepEqual(matchedAsProbe.cells, [], 'remainder "other-track--cellC" carries its own "--" boundary -- not a flat cellId under track "probe"');

  const matchedAsOtherTrack = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'other-track' });
  assert.deepEqual(matchedAsOtherTrack.cells, [], 'the raw id does not START WITH "other-track--" at all -- it must never match that track either');
});

// ---------------------------------------------------------------------
// Test 2: one session stays open (a pending driver-authorized step never
// dispatched) -- activeCell names it, nextAction names the real pending
// authorization.
// ---------------------------------------------------------------------

test('chain names the still-open cell as activeCell, and nextAction names the real pending driver-authorized operation, not a generic placeholder', async () => {
  const tempDir = mkTempDir();
  await openClosedCell(tempDir, 'wave--cellA');
  await openActiveMasterLoopCell(tempDir, 'wave--cellB');

  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'wave' });

  assert.equal(result.activeCell, 'cellB');
  const cellA = result.cells.find((cell) => cell.cellId === 'cellA');
  const cellB = result.cells.find((cell) => cell.cellId === 'cellB');
  assert.equal(cellA.status, 'completed');
  assert.equal(cellB.status, 'active');
  assert.ok(Array.isArray(cellB.pendingDriverAuthorizations) && cellB.pendingDriverAuthorizations.length > 0);
  assert.ok(cellB.pendingDriverAuthorizations.some((b) => b.operationId === 'revise-candidate'));

  assert.match(result.nextAction, /cellB/);
  assert.match(result.nextAction, /revise-candidate/, 'nextAction must name the real pending operation, not a generic placeholder');
  assert.match(result.nextAction, /fgos coordination show wave--cellB/);
});

// ---------------------------------------------------------------------
// Test 3: all sessions closed -- activeCell is null, every cell's own
// final disposition/status renders correctly.
// ---------------------------------------------------------------------

test('chain reports activeCell null and every cell\'s own final disposition/status when every session in the track has closed', async () => {
  const tempDir = mkTempDir();
  await openClosedCellWithDisposition(tempDir, 'closedtrack--cellA');
  await openClosedCell(tempDir, 'closedtrack--cellB');

  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'closedtrack' });

  assert.equal(result.activeCell, null);
  assert.equal(result.nextAction, null);
  assert.equal(result.cells.length, 2);
  const cellA = result.cells.find((cell) => cell.cellId === 'cellA');
  const cellB = result.cells.find((cell) => cell.cellId === 'cellB');
  assert.equal(cellA.status, 'completed');
  assert.equal(cellB.status, 'completed');
  assert.ok(cellA.lastDisposition, 'expected cellA\'s own recorded disposition to render');
  assert.equal(cellA.lastDisposition.disposition, 'accepted');
  assert.match(cellA.lastDisposition.targetRef, /^asgn_/, 'targetRef must have resolved from "$ref:request" to the real Assignment id');
  assert.equal(cellB.lastDisposition, null, 'cellB never had a disposition recorded');
});

// ---------------------------------------------------------------------
// Test 4: zero matching sessions -- an empty, well-formed result, not an
// error, not a crash.
// ---------------------------------------------------------------------

test('chain on a track prefix with zero matching sessions returns an empty, well-formed result -- a plan that has not started its first cell is legitimate, never an error', () => {
  const tempDir = mkTempDir();
  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'never-opened-track' });
  assert.deepEqual(result, { track: 'never-opened-track', cells: [], activeCell: null, nextAction: null });
});

test('chain on a track with zero matching sessions in a workspace with NO .fgos/coordination/sessions/ directory at all is still empty, not a crash', () => {
  const tempDir = mkTempDir();
  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'anything' });
  assert.deepEqual(result.cells, []);
});

// ---------------------------------------------------------------------
// Test 7: chain.mjs never imports a write-side store.mjs/session-engine.mjs
// export -- a real static check on this module's own import list, with a
// deliberately-broken PoC confirmed to trip that same check.
// ---------------------------------------------------------------------

// Every export documented or observed as mutating on-disk session state
// (appends an event, creates/opens/resumes a session for writing, creates
// an Assignment, authorizes/dispositions/aggregates/replaces, or
// transitions status) -- the read-only exports this module IS allowed to
// import (`resolveCoordinationPaths`, `readManifest`, `readSessionEvents`,
// `assertSafeCoordinationId`, `readManifestRaw`) are deliberately absent.
const WRITE_SIDE_STORE_EXPORTS = [
  'openSession',
  'bindActor',
  'createSessionAssignment',
  'authorizeOperation',
  'recordSpecialistAuthorization',
  'recordDriverDisposition',
  'recordContributionLink',
  'recordAggregationValidation',
  'linkResult',
  'recordRunRetry',
  'recordActorReplacement',
  'transitionSessionStatusLocked',
  'transitionSessionStatus',
  'withSessionLock',
  'appendEvent',
];

const WRITE_SIDE_SESSION_ENGINE_EXPORTS = [
  'openStandaloneSession',
  'openDeclaredProtocolSession',
  'dispatchDeclaredOperation',
  'dispatchResearchFanOut',
  'authorizeDeclaredOperation',
  'closeSessionByQuorum',
  'replaceSessionActor',
];

// A real (if narrow) parser: pulls every named specifier out of every
// `import { a, b as c } from '<module>'` statement in `source` whose
// module specifier contains one of `modulePathFragments`, resolved to the
// IMPORTED name (never the local alias -- what matters for this check is
// which export was pulled in, not what it was renamed to locally).
function importedNamesFrom(source, modulePathFragments) {
  const names = [];
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(source)) !== null) {
    const [, specifiers, modulePath] = match;
    if (!modulePathFragments.some((fragment) => modulePath.includes(fragment))) continue;
    for (const raw of specifiers.split(',')) {
      const trimmed = raw.trim();
      if (trimmed === '') continue;
      names.push(trimmed.split(/\s+as\s+/)[0].trim());
    }
  }
  return names;
}

// Fails closed on the two import shapes `importedNamesFrom` above cannot
// see into (it only understands named imports): a namespace import
// (`import * as store from '<module>'`) or a dynamic `import('<module>')`
// whose module specifier matches one of `modulePathFragments`. Either
// shape can reach ANY export of the guarded module through the bound
// namespace/module object, so this reports the module path itself rather
// than trying to name which specific export got called -- there is no
// static specifier list to check against import-side for these shapes.
function hasOpaqueImportOf(source, modulePathFragments) {
  const namespaceRe = /import\s*\*\s*as\s+\w+\s*from\s*['"]([^'"]+)['"]/g;
  const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const re of [namespaceRe, dynamicRe]) {
    let match;
    while ((match = re.exec(source)) !== null) {
      const [, modulePath] = match;
      if (modulePathFragments.some((fragment) => modulePath.includes(fragment))) return modulePath;
    }
  }
  return null;
}

function assertNoWriteSideImports(source) {
  const storeImports = importedNamesFrom(source, ['runner/coordination/store.mjs']);
  const sessionEngineImports = importedNamesFrom(source, ['runner/coordination/session-engine.mjs']);
  for (const name of storeImports) {
    assert.ok(!WRITE_SIDE_STORE_EXPORTS.includes(name), `must not import write-side store.mjs export "${name}"`);
  }
  for (const name of sessionEngineImports) {
    assert.ok(!WRITE_SIDE_SESSION_ENGINE_EXPORTS.includes(name), `must not import write-side session-engine.mjs export "${name}"`);
  }
  const opaqueStoreImport = hasOpaqueImportOf(source, ['runner/coordination/store.mjs']);
  assert.equal(opaqueStoreImport, null, `must not import store.mjs via a namespace or dynamic import (found "${opaqueStoreImport}") -- named imports only, so this check can verify every export pulled in`);
  const opaqueSessionEngineImport = hasOpaqueImportOf(source, ['runner/coordination/session-engine.mjs']);
  assert.equal(opaqueSessionEngineImport, null, `must not import session-engine.mjs via a namespace or dynamic import (found "${opaqueSessionEngineImport}") -- named imports only, so this check can verify every export pulled in`);
}

test('chain.mjs never imports a write-side store.mjs/session-engine.mjs export', () => {
  const chainSourcePath = path.resolve(import.meta.dirname, '../../src/verbs/coordination/chain.mjs');
  const source = fs.readFileSync(chainSourcePath, 'utf8');
  assert.doesNotThrow(() => assertNoWriteSideImports(source));
});

test('the write-side-import check above has real teeth: a deliberately-broken PoC importing a write-side export trips it', () => {
  const brokenSource = `
    import { readManifest, openSession } from '../../runner/coordination/store.mjs';
    export function poc() { return readManifest; }
  `;
  assert.throws(
    () => assertNoWriteSideImports(brokenSource),
    /must not import write-side store\.mjs export "openSession"/,
    'the check must actually fail against a module that imports a write-side export',
  );
});

// Reviewer M1 / Red-Team MEDIUM's own PoC #1: a namespace import bypasses
// `importedNamesFrom`'s named-import-only regex entirely (zero matches),
// so the check previously reported "clean" even though `store.openSession`
// is reachable through the bound namespace object.
test('the write-side-import check has real teeth against a namespace-import bypass: `import * as store from store.mjs; store.openSession(...)` trips it', () => {
  const brokenSource = `
    import * as store from '../../runner/coordination/store.mjs';
    export function poc() { return store.openSession(); }
  `;
  assert.throws(
    () => assertNoWriteSideImports(brokenSource),
    /must not import store\.mjs via a namespace or dynamic import/,
    'a namespace import of a guarded module path must trip the check even though no named specifier is present',
  );
});

// Reviewer M1 / Red-Team MEDIUM's own PoC #2: a dynamic `import(...)` is
// likewise invisible to the named-import regex.
test('the write-side-import check has real teeth against a dynamic-import bypass: `const { openSession } = await import(store.mjs)` trips it', () => {
  const brokenSource = `
    export async function poc() {
      const { openSession } = await import('../../runner/coordination/store.mjs');
      return openSession();
    }
  `;
  assert.throws(
    () => assertNoWriteSideImports(brokenSource),
    /must not import store\.mjs via a namespace or dynamic import/,
    'a dynamic import of a guarded module path must trip the check even though no static named specifier is present',
  );
});

// ---------------------------------------------------------------------
// Test 8 (F1 regression): one session with an unreadable/corrupt manifest
// must never take down the whole track's render -- every other, healthy
// cell must still come back, and `activeCell`/`nextAction` must still be
// computed from the cells that DID render.
// ---------------------------------------------------------------------

test('chain renders every healthy cell (and a degraded renderError record for the broken one) when one session in the track has an unreadable/corrupt manifest, instead of throwing for the whole track', async () => {
  const tempDir = mkTempDir();
  await openClosedCell(tempDir, 'crashtrack--cellA');
  await openActiveMasterLoopCell(tempDir, 'crashtrack--cellB');

  // Seed a THIRD session directory by hand, bypassing every real write
  // door, whose session.json is truncated/invalid JSON -- the same
  // `corrupt-log` failure mode store.mjs's own `readManifestRaw` throws
  // for a real corrupt manifest (store.mjs:115-127).
  const brokenSessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', 'crashtrack--cellBroken');
  fs.mkdirSync(brokenSessionDir, { recursive: true });
  fs.writeFileSync(path.join(brokenSessionDir, 'session.json'), '{ not valid json');

  const result = chainCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { track: 'crashtrack' });

  assert.equal(result.cells.length, 3, 'the broken cell must still be LISTED, not silently dropped');
  const cellA = result.cells.find((cell) => cell.cellId === 'cellA');
  const cellB = result.cells.find((cell) => cell.cellId === 'cellB');
  const cellBroken = result.cells.find((cell) => cell.cellId === 'cellBroken');

  assert.equal(cellA.status, 'completed', 'the other healthy, closed cell must still render normally');
  assert.equal(cellB.status, 'active', 'the other healthy, still-open cell must still render normally');
  assert.ok(!('renderError' in cellA) && !('renderError' in cellB), 'healthy cells must never carry a renderError');

  assert.ok(cellBroken, 'the broken cell must still appear in the cells list');
  assert.equal(cellBroken.status, undefined, 'a broken cell has no status -- it must never be picked as activeCell');
  assert.ok(cellBroken.renderError, 'the broken cell must carry a renderError field instead of throwing');
  assert.equal(cellBroken.renderError.step, 'readManifest');
  assert.match(cellBroken.renderError.message, /corrupt-log|not valid JSON/i);

  // activeCell/nextAction must still be computed from the cells that DID
  // render -- cellB is the real, still-open cell; the broken cell must
  // never null this out.
  assert.equal(result.activeCell, 'cellB');
  assert.match(result.nextAction, /cellB/);
});
