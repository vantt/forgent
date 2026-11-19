// Records the golden vectors of the Rust unit run module (packages/execution/engine/src/unit_run/) by running the
// Node modules it ports: src/runner/execution/{commit-unit-work,unit-sync,custody-door,run,unit-run-start,
// unit-run-history}.mjs.
// Run: node test/golden-recorders/unit-run.recorder.mjs [--check]
// Writes under packages/execution/contracts/unit-run/: commit-subject.json, sync.json, verify.json, run-loop.json.
//
// The run loop's own decisions that run.mjs and unit-run-start.mjs keep private (the scope rule, the reasons a
// unit ended on infrastructure, the option checks of a fresh run and of a resume) are reached through a copy of the
// module text with one export line added and its relative imports pointed back at the source tree, so the
// recorded answers are those of the real functions, not of a re-typed twin.
//   --check  write nothing: fail when a recorded file is not what the Node modules give today.
//
// What is not recorded here: the peer's own frames (a new protocol with no Node twin, vectors in
// contracts/admission-peer/), the worktree snapshot comparison (it needs the Git addon, which a checkout does not
// ship; tests/unit_run.rs proves it against its definition) and the verify run itself (it spawns a shell).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'execution', 'contracts', 'unit-run');
const exec = path.join(root, 'src', 'runner', 'execution');

const { subjectFrom, syncSubject } = await import(path.join(exec, 'commit-unit-work.mjs'));
const sync = await import(path.join(exec, 'unit-sync.mjs'));
const { outcomeOfVerify, answerOfVerify } = await import(path.join(exec, 'custody-door.mjs'));

const plain = (value) => JSON.parse(JSON.stringify(value === undefined ? null : value));
const long = 'x'.repeat(30);

const subjects = [
  { name: 'conventional summary kept', summary: 'feat(core): add the thing\nmore text', unitId: 'u1', objective: 'objective' },
  { name: 'plain summary filed under chore', summary: 'Add the thing', unitId: 'u1', objective: '' },
  { name: 'heading skipped', summary: '# Goal\nFix the parser', unitId: 'u1', objective: '' },
  { name: 'only a heading', summary: '## Heading only', unitId: 'u2', objective: '' },
  { name: 'objective when no summary', summary: undefined, unitId: 'u3', objective: 'Port the module' },
  { name: 'empty both', summary: '', unitId: 'u4', objective: '' },
  { name: 'ellipsis dropped', summary: 'Fix the thing... and more … again', unitId: 'u1', objective: '' },
  { name: 'own prefix stripped', summary: 'u5: do work', unitId: 'u5', objective: '' },
  { name: 'breaking conventional', summary: 'fix(api)!: drop the old route', unitId: 'u1', objective: '' },
  { name: 'not conventional without space', summary: 'fix:nospace here', unitId: 'u1', objective: '' },
  { name: 'long cut at sentence end', summary: `feat(core): ${long}. ${long} and then ${long} more`, unitId: 'u1', objective: '' },
  { name: 'long cut at word boundary', summary: `Add ${long} ${long} ${long} ${long}`, unitId: 'u1', objective: '' },
  { name: 'long hard cut', summary: `feat(core): ${'y'.repeat(140)}`, unitId: 'u1', objective: '' },
  { name: 'long ends in punctuation trimmed', summary: `fix: ${long} ${long} ${long} ${long}, tail`, unitId: 'u1', objective: '' },
  { name: 'crlf lines', summary: '\r\n# T\r\n  spaced   words \r\n', unitId: 'u1', objective: '' },
].map((c) => ({ ...c, subject: subjectFrom(c.summary, c.unitId, c.objective) }));

const syncSubjects = ['main', `origin/${'branch-'.repeat(20)}`].map((ref) => ({ ref, subject: syncSubject(ref) }));

const record = (syncRecord, extra = {}) => ({ writeScope: ['src/**'], unit: { writes: ['lib/**'] }, sync: syncRecord, ...extra });
const syncCases = {
  effectiveWriteScope: [
    record({ status: 'conflicted', scopeAdded: ['a.txt'] }),
    record({ status: 'merged', scopeAdded: ['a.txt'] }),
    record(undefined),
    { unit: { writes: ['lib/**'] }, sync: { status: 'conflicted' } },
    { sync: { status: 'conflicted', scopeAdded: ['z'] } },
  ].map((unitRecord) => ({ unitRecord: plain(unitRecord), scope: plain(sync.effectiveWriteScope(unitRecord)) })),
  syncBrief: [
    undefined,
    { status: 'merged', ref: 'main', sha: 'abc' },
    { status: 'conflicted', ref: 'main', sha: '0123456789abcdef0123', conflicts: ['a.txt', 'b/c.txt'] },
  ].map((s) => ({ sync: plain(s), brief: sync.syncBrief(s) })),
  syncSummary: [
    undefined,
    { status: 'merged', ref: 'main', sha: 'abc', started: true, mergeStaged: ['x'], nativeHead: 'h', nextOperationId: 'n', operationId: 'o' },
  ].map((s) => ({ sync: plain(s), summary: plain(sync.syncSummary(s)) })),
  syncOnlyPass: [
    { status: 'merged', ref: 'main', sha: 'abc', commit: { sha: 'c1', subject: 'chore(sync): merge main', files: ['a'] } },
    { status: 'up-to-date', ref: 'main', sha: 'abc' },
    { status: 'merged', ref: 'main', sha: 'abc', commit: { by: 'outside' }, warnings: [{ code: 'w', message: 'm' }] },
  ].map((s) => ({
    sync: s,
    result: plain(sync.runPendingSync({ sync: s, unit: { syncOnly: true }, bindings: {} }, '/unused', () => {}, null)),
  })),
  syncOnlyNotOwed: [
    { sync: { status: 'merged' }, unit: { syncOnly: false }, bindings: {} },
    { sync: { status: 'merged' }, unit: { syncOnly: true }, bindings: { 'producer/1': {} } },
  ].map((unitRecord) => ({ unitRecord, result: plain(sync.runPendingSync(unitRecord, '/unused', () => {}, null)) })),
};

const base = { status: 0, how: 'exited 0', tail: '', durationMs: 1, outputDigest: 'sha256:00' };
const verifies = [
  { ...base, verdict: 'pass' },
  { ...base, verdict: 'findings', status: 1, how: 'exited 1', tail: 'line one\nline two' },
  { ...base, verdict: 'findings', status: 2, how: 'exited 2', tail: '' },
  { ...base, infrastructure: 'timeout', status: null, how: 'timed out after 5ms', tail: 'partial' },
  { ...base, infrastructure: 'not-run', status: null, how: 'could not run', tail: '' },
].map((v) => ({ verified: v, outcome: outcomeOfVerify(v), answer: plain(answerOfVerify(v, 'Verification command', 'npm test')) }));

// ---- the run loop ---------------------------------------------------------------------------------------------

/**
 * The module at `file` with `names` exported as well: its text, relative imports made absolute, one line added.
 * `data` replaces an import that only hands data in (the shipped catalog, read through the Git addon a checkout does
 * not ship) with a function returning the given value; no logic is replaced.
 */
async function withPrivate(file, names, data = {}) {
  const dir = path.dirname(file);
  let source = fs.readFileSync(file, 'utf8');
  for (const [line, value] of Object.entries(data)) {
    const [, name] = /import \{ (\w+) \}/.exec(line);
    if (!source.includes(line)) throw new Error(`${path.basename(file)} no longer has: ${line}`);
    source = source.replace(line, `const ${name} = () => (${JSON.stringify(value)});`);
  }
  const text = source
    .replace(/(from\s+')(\.\.?\/[^']+)(')/g, (_, a, spec, b) => `${a}${pathToFileURL(path.resolve(dir, spec)).href}${b}`)
    .concat(`\nexport { ${names.join(', ')} };\n`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unit-run-recorder-'));
  const copy = path.join(tmp, path.basename(file));
  fs.writeFileSync(copy, text);
  try { return await import(pathToFileURL(copy).href); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

const runLoop = await withPrivate(path.join(exec, 'run.mjs'),
  ['applyScopeRule', 'infrastructureReasonOf', 'refusedSeatsOf', 'failedUnitFacts']);
const shippedPatterns = { solo: {}, reviewed: {}, panel: {}, debate: {} };
const start = await withPrivate(path.join(exec, 'unit-run-start.mjs'),
  ['checkedBranchBase', 'checkedPinInputs', 'checkedAcceptedReports', 'assertRecordNotFromNewerRelease',
    'assertCollaborationPinUsable', 'requireFreeWorktree'],
  { "import { shippedCatalog } from '../dispatch/shipped-catalog.mjs';": { patterns: shippedPatterns } });
const { outcomeOfRunResult, readUnitRunHistory } = await import(path.join(exec, 'unit-run-history.mjs'));

/** What a call threw, as the run-unit error carries it; `ok` with its value when it did not throw. */
function outcomeOf(fn) {
  try { return { ok: true, value: plain(fn()) }; }
  catch (e) {
    return { ok: false, error: plain({ name: e.name, code: e.code ?? null, phase: e.phase ?? null, message: e.message, ...(e.refusal ? { refusal: e.refusal } : {}) }) };
  }
}

const bound = (extra = {}) => ({ executor: 'claude', invocation: 'claude-cli', transport: 'process', pool: 'anthropic', leaseAccount: 'a1', ...extra });
const limit = { classification: { outcome: { category: 'provider' }, failure: { code: 'provider-limit' } } };
const leaseConflict = { classification: { outcome: { category: 'infra' }, failure: { code: 'provider-capacity-lease-conflict' } } };
const credential = { classification: { outcome: { category: 'provider' }, failure: { code: 'provider-limit', cause: 'credential' } } };
const attempt = (extra = {}) => ({ binding: bound(), outcome: 'provider-limit', ...extra });
const providerLimit = [
  { name: 'lease conflict on a pinned account stops', result: { runResult: leaseConflict }, bound: bound({ account: { pool: 'anthropic', id: 'a1' } }), attempts: [attempt()], attemptNo: 0 },
  { name: 'lease conflict rebinds from a fresh view', result: { runResult: leaseConflict }, bound: bound(), attempts: [attempt({ leaseConflict: true })], attemptNo: 0 },
  { name: 'lease conflict past the bound is refused', result: { runResult: leaseConflict }, bound: bound(), attempts: Array.from({ length: 9 }, () => attempt({ leaseConflict: true })), attemptNo: 8 },
  { name: 'a lost brief rebinds the same candidate', result: { runResult: { classification: { outcome: { category: 'infra' } } } }, bound: bound(), attempts: [attempt({ briefNotDelivered: true })], attemptNo: 0, briefNotDelivered: true },
  { name: 'a brief lost twice stops', result: { runResult: {} }, bound: bound(), attempts: [attempt({ briefNotDelivered: true }), attempt({ briefNotDelivered: true })], attemptNo: 1, briefNotDelivered: true },
  { name: 'a change that cannot be read stops', result: { runResult: limit }, bound: bound(), attempts: [attempt()], attemptNo: 0, changed: { error: 'no snapshot' } },
  { name: 'changed paths stop', result: { runResult: limit }, bound: bound(), attempts: [attempt()], attemptNo: 0, changed: { paths: ['a.txt', 'b.txt'], headMoved: false } },
  { name: 'a moved head stops a pinned seat', result: { runResult: limit }, bound: bound({ account: { pool: 'anthropic', id: 'a1' } }), attempts: [attempt()], attemptNo: 0, changed: { paths: [], headMoved: true } },
  { name: 'a lost brief with changes stops', result: { runResult: {} }, bound: bound(), attempts: [attempt({ briefNotDelivered: true })], attemptNo: 0, briefNotDelivered: true, changed: { paths: ['x'], headMoved: false } },
  { name: 'a pinned account is never moved', result: { runResult: limit }, bound: bound({ account: { pool: 'anthropic', id: 'a1' } }), attempts: [attempt()], attemptNo: 0, changed: { paths: [], headMoved: false } },
  { name: 'walk rotates first when another account is healthy', result: { runResult: limit }, bound: bound(), attempts: [attempt()], attemptNo: 0, rotation: { pool: 'anthropic', total: 3, healthy: 2 } },
  { name: 'walk steps on when no account is healthy', result: { runResult: limit }, bound: bound(), attempts: [attempt()], attemptNo: 0, rotation: { pool: 'anthropic', total: 3, healthy: 0 } },
  { name: 'a credential fault names its pool', result: { runResult: credential }, bound: bound(), attempts: [attempt()], attemptNo: 0 },
  { name: 'rotations spent are counted and bound the next', result: { runResult: limit }, bound: bound({ transport: undefined }),
    attempts: [attempt(), attempt({ fallbackFrom: { kind: 'account-rotation' } }), attempt({ fallbackFrom: { kind: 'account-rotation' } })], attemptNo: 2, rotation: { pool: 'anthropic', total: 3, healthy: 1 } },
].map((c) => ({ ...plain(c), answer: plain(runLoop.answerProviderLimit(c)) }));

const configs = [
  {},
  { defaults: { tier: 'standard' }, maxTier: 'deep', capabilities: { 'code:implement': { verify: 'npm test' } }, llmAccounts: { x: 1 }, providers: { p: {} }, timeoutMs: 1000, governance: { rule: true } },
  { roles: { producer: {} }, executors: { claude: { command: 'claude' } }, loops: {}, patterns: { solo: {} }, maxTier: null, generatedPaths: ['a/**'] },
].map((cfg) => ({ cfg, snapshot: runLoop.snapshotRunnerConfig('/unused', cfg) }));

const outcomes = [
  { classification: { outcome: { category: 'ok' } } },
  { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'findings' } } },
  { classification: { outcome: { category: 'verdict' }, assessment: { verdict: 'pass' } } },
  { classification: { outcome: { category: 'blocked' } } },
  { classification: { outcome: { category: 'policy' } } },
  { classification: { outcome: { category: 'provider' } } },
  { classification: { outcome: { category: 'infra' }, failure: { code: 'paused-limit' } } },
  { classification: { outcome: { category: 'infra' }, failure: { code: 'provider-capacity-lease-conflict' } } },
  { classification: { outcome: { category: 'infra' }, failure: { code: 'other' } } },
  { classification: { outcome: { category: 'corrupt' } } },
].map((runResult) => ({ runResult, outcome: outcomeOfRunResult(runResult) }));

const corpusRoot = path.join(root, 'packages', 'execution', 'contracts', 'corpus');
const history = ['v3-solo-settled', 'v3-open-attempt'].map((sample) => ({
  sample,
  history: readUnitRunHistory(path.join(corpusRoot, sample)).map(({ seat, round, outcome }) => ({ seat, round, outcome })),
}));

const unitRecordOf = (extra = {}) => ({ unit: { writes: [] }, bindings: {}, ...extra });
const scopeRule = [
  { outcome: 'pass', results: [], unitRecord: unitRecordOf() },
  { outcome: 'pass', results: [{ commit: { outOfScope: ['z.txt', 'a.txt'] } }], unitRecord: unitRecordOf() },
  { outcome: 'pass', results: [], unitRecord: unitRecordOf({ branchBase: { branch: null, baseSha: null, outOfScopeOnBranch: ['b', 'a'] } }) },
  { outcome: 'findings', results: [], unitRecord: unitRecordOf({ bindings: { 'producer/1': [{ commit: { outOfScope: ['c', 'a'] } }] } }) },
  { outcome: 'execution-failure', results: [{ commit: { outOfScope: ['x'] } }], unitRecord: unitRecordOf() },
].map((c) => ({ ...c, ruled: plain(runLoop.applyScopeRule({ unitRecord: c.unitRecord, mainRoot: '/unused' }, c)) }));

const infra = [
  { started: { value: false }, ruled: {}, attempts: [] },
  { started: { value: true }, ruled: { error: 'x' }, attempts: [] },
  { started: { value: true }, ruled: {}, attempts: [{ outcome: 'pass' }] },
  { started: { value: true }, ruled: {}, attempts: [{ seat: 'verify', outcome: 'execution-failure', infrastructureReason: 'timeout' }] },
  { started: { value: true }, ruled: {}, attempts: [{ seat: 'producer', outcome: 'execution-failure', commit: { status: 'failed', reason: 'git-error' } }] },
  { started: { value: true }, ruled: {}, attempts: [{ seat: 'producer', outcome: 'execution-failure', commit: { status: 'failed' } }] },
  { started: { value: true }, ruled: {}, attempts: [{ seat: 'producer', outcome: 'provider-limit', runResult: { classification: { outcome: { reason: 'quota' } } } }] },
  { started: { value: true }, ruled: {}, attempts: [{ seat: 'producer', outcome: 'execution-failure' }] },
].map((c) => ({ ...c, reason: runLoop.infrastructureReasonOf(c) }));

const refused = [
  [{ seat: 'producer', round: 1, refused: { reason: 'r', detail: 'd' } }, { seat: 'checker', outcome: 'pass' }],
  [{ seat: 'producer', refused: { reason: 'r' } }],
].map((attempts) => ({ attempts, seats: plain(runLoop.refusedSeatsOf(attempts)) }));

const failedFacts = [
  { scope: { unitRecord: null, ceilingHit: false }, admission: { started: false } },
  { scope: { unitRecord: { seatLaunchCeiling: 3, bindings: { 'producer/1': [{ dispatchRetryId: 'a' }, { dispatchRetryId: 'b', leaseConflict: true }] } }, ceilingHit: true }, admission: { started: true } },
].map((c) => ({ ...c, facts: plain(runLoop.failedUnitFacts(c.scope, c.admission)) }));

const branchBases = [undefined, null, 'x', { branch: 'b', baseSha: 's', outOfScopeOnBranch: ['z', 'a', 'z'] },
  { branch: null, baseSha: null, outOfScopeOnBranch: [] }, { branch: 'b', baseSha: null, outOfScopeOnBranch: [] },
  { branch: 'b', baseSha: 's' }, { branch: 'b', baseSha: 's', outOfScopeOnBranch: [''] }]
  .map((value) => ({ value: value === undefined ? '<absent>' : value, answer: outcomeOf(() => start.checkedBranchBase(value)) }));
const pinInputs = [undefined, ['/a', '/b', '/a'], ['rel'], 'x', [1]]
  .map((value) => ({ value: value === undefined ? '<absent>' : value, answer: outcomeOf(() => start.checkedPinInputs(value)) }));
const digest = 'a'.repeat(64);
const acceptedReports = [undefined, [digest, digest], ['A'.repeat(64)], [digest.slice(1)], 'x']
  .map((value) => ({ value: value === undefined ? '<absent>' : value, answer: outcomeOf(() => start.checkedAcceptedReports(value)) }));
const seatSchemas = [undefined, null, 1, 2, 3, '2', 2.5]
  .map((schema) => ({ schema: schema === undefined ? '<absent>' : schema, answer: outcomeOf(() => start.assertRecordNotFromNewerRelease('unit-run-1', schema === undefined ? {} : { seatSchema: schema })) }));
const snapshot = { runner: { patterns: { mine: {} } } };
const pins = [
  undefined, 'x', {}, { pattern: { name: 'solo' } }, { pattern: { name: 'solo' }, effective: { loop: 'nope', params: {} } },
  { pattern: { name: 'solo' }, effective: { params: {} } }, { pattern: { name: 'solo' }, effective: { loop: 'solo', params: [] } },
  { pattern: { name: 'solo' }, effective: { loop: 'solo', params: {} } }, { pattern: { name: 'mine' }, effective: { loop: 'reviewed', params: {} } },
  { pattern: { name: 'live' }, effective: { loop: 'panel', params: {} } }, { pattern: { name: 'gone' }, effective: { loop: 'solo', params: {} } },
].map((collaboration) => ({
  collaboration: collaboration === undefined ? '<absent>' : collaboration,
  answer: outcomeOf(() => start.assertCollaborationPinUsable('unit-run-1', collaboration, snapshot, { runner: { patterns: { live: {} } } })),
}));
const bindings = [{ answer: 'unbound' }, { answer: 'bound', record: { caseId: 'case-1' } }, null, { answer: 'bound', condition: 'held by x' }, { answer: 'stale' }]
  .map((binding) => ({ binding, answer: outcomeOf(() => start.requireFreeWorktree({ resolveBinding: () => binding }, '/w')) }));

const runLoopVectors = {
  providerLimit, snapshot: configs, outcomeOfRunResult: outcomes, corpusHistory: history, scopeRule, infrastructureReason: infra,
  refusedSeats: refused, failedUnitFacts: failedFacts,
  start: { branchBases, pinInputs, acceptedReports, seatSchemas, collaborationPins: { shippedPatterns, snapshot, live: { runner: { patterns: { live: {} } } }, cases: pins }, requireFreeWorktree: bindings },
};

const files = {
  'commit-subject.json': { subjects, syncSubjects },
  'sync.json': syncCases,
  'verify.json': { subject: 'Verification command', command: 'npm test', cases: verifies },
  'run-loop.json': runLoopVectors,
};
const text = (body) => `${JSON.stringify(body, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const stale = Object.entries(files).filter(([name, body]) => {
    try { return fs.readFileSync(path.join(outDir, name), 'utf8') !== text(body); } catch { return true; }
  }).map(([name]) => name);
  if (stale.length) { console.error(`stale vectors: ${stale.join(', ')}`); process.exit(1); }
  console.log(`checked ${Object.keys(files).length} vector files`);
  process.exit(0);
}
fs.mkdirSync(outDir, { recursive: true });
for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), text(body));
console.log(`recorded ${Object.keys(files).join(', ')}`);
