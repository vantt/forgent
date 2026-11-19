// Records the golden vectors of the Rust unit run module (packages/execution/engine/src/unit_run/) by running the
// Node modules it ports: src/runner/execution/{commit-unit-work,unit-sync,custody-door}.mjs.
// Run: node test/golden-recorders/unit-run.recorder.mjs [--check]
// Writes under packages/execution/contracts/unit-run/: commit-subject.json, sync.json, verify.json.
//   --check  write nothing: fail when a recorded file is not what the Node modules give today.
//
// What is not recorded here: the peer's own frames (a new protocol with no Node twin, vectors in
// contracts/admission-peer/), the worktree snapshot comparison (it needs the Git addon, which a checkout does not
// ship; tests/unit_run.rs proves it against its definition) and the verify run itself (it spawns a shell).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const files = {
  'commit-subject.json': { subjects, syncSubjects },
  'sync.json': syncCases,
  'verify.json': { subject: 'Verification command', command: 'npm test', cases: verifies },
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
