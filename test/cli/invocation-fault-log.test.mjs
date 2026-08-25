// tsk-5z0: a malformed `fgos` call leaves a record naming the call site.
//
// Two properties matter more than the recording itself and are asserted
// throughout: a verb's own refusal is NOT a malformed call and must stay
// unrecorded, and nothing here may create a `.fgos/` that was not already
// there (ADR0020 — a linked worktree never carries one).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FGOS = path.join(REPO_ROOT, 'bin', 'fgos.mjs');
const FAULT_LOG = 'invocation-faults.jsonl';

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function rawTmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fault-'));
}

function tmpCwd() {
  const cwd = rawTmpCwd();
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
}

function gitInit(cwd) {
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });
}

// A store that is also a git repo — the shape most real faults happen in.
function tmpGitCwd() {
  const cwd = tmpCwd();
  gitInit(cwd);
  return cwd;
}

// A linked worktree, which by design carries no `.fgos/` of its own.
function tmpLinkedWorktree() {
  const main = tmpGitCwd();
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fault-wt-'));
  fs.rmdirSync(wt);
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'tsk-5z0-fault-test', wt], { cwd: main });
  return { main, wt };
}

function faultLogPath(root) {
  return path.join(root, '.fgos', 'logs', FAULT_LOG);
}

function faultRecords(root) {
  const p = faultLogPath(root);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function eventLineCount(root) {
  const p = path.join(root, '.fgos', 'events.jsonl');
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).length;
}

test('an unknown verb is recorded with its argv, cwd and writer identity', () => {
  const cwd = tmpGitCwd();
  const result = run(cwd, ['nosuchverb', '--whatever']);

  assert.equal(result.status, 4);
  const records = faultRecords(cwd);
  assert.equal(records.length, 1, `expected exactly one record, got: ${JSON.stringify(records)}`);
  assert.equal(records[0].faultClass, 'unknown-verb');
  assert.equal(records[0].verb, 'nosuchverb');
  assert.deepEqual(records[0].argv, ['nosuchverb', '--whatever']);
  assert.equal(records[0].cwd, fs.realpathSync(cwd));
  assert.ok(records[0].writer?.id, 'a record must name who wrote it');
  assert.match(records[0].message, /unknown verb/);
});

test('a bare --dir (nothing to resolve a store from) is recorded as an input fault', () => {
  const cwd = tmpGitCwd();
  const result = run(cwd, ['list', '--dir']);

  assert.equal(result.status, 4);
  const records = faultRecords(cwd);
  assert.equal(records.length, 1);
  assert.equal(records[0].faultClass, 'dir-invalid');
});

test("a verb's own refusal is not a malformed call and is never recorded", () => {
  const cwd = tmpGitCwd();
  const result = run(cwd, ['rollup', 'no-such-item']);

  assert.equal(result.status, 4, `expected the refusal to still be a refusal: ${result.stderr}`);
  assert.deepEqual(faultRecords(cwd), [], 'a correct refusal must leave no fault record');
  assert.doesNotMatch(result.stderr, /invocation fault recorded/);
});

test('recording never writes to events.jsonl', () => {
  const cwd = tmpGitCwd();
  const before = eventLineCount(cwd);
  run(cwd, ['nosuchverb']);

  assert.equal(eventLineCount(cwd), before, 'the fault log must not touch the event log');
  assert.equal(faultRecords(cwd).length, 1);
});

test('the fault is announced on stderr, after the error itself, and only when a record landed', () => {
  const cwd = tmpGitCwd();
  const recorded = run(cwd, ['nosuchverb']);
  const lines = recorded.stderr.split('\n').filter(Boolean);

  assert.equal(lines.length, 2, `expected the error plus one notice, got: ${JSON.stringify(lines)}`);
  assert.match(lines[0], /^fgos: unknown verb/, 'the original error line must come first, unchanged');
  assert.match(lines[1], new RegExp(`invocation fault recorded to .*${FAULT_LOG}$`));

  // Nowhere to record — no notice, and the error line is untouched.
  const nowhere = rawTmpCwd();
  const silent = run(nowhere, ['nosuchverb']);
  assert.equal(silent.status, 4);
  assert.doesNotMatch(silent.stderr, /invocation fault recorded/);
  assert.equal(silent.stderr.split('\n').filter(Boolean).length, 1);
});

test('a fault from a linked worktree records into the main checkout, never into the worktree', () => {
  const { main, wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));

  const result = run(wt, ['submit', 'should never land']);

  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/, 'the existing refusal must be unchanged');
  assert.ok(
    !fs.existsSync(path.join(wt, '.fgos')),
    'recording must never create .fgos/ in a worktree (ADR0020)',
  );

  const records = faultRecords(main);
  assert.equal(records.length, 1, 'the record belongs in the one real store');
  assert.equal(records[0].faultClass, 'store-missing');
  assert.equal(records[0].cwd, fs.realpathSync(wt), 'the record must name where the bad call came from');
});

test('outside a git repo with no store, nothing is recorded and no store is created', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['submit', 'should never land']);

  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'a refused verb must not create .fgos/');
});

test('concurrent faults append whole lines, never a torn one', () => {
  const cwd = tmpGitCwd();
  const runs = [
    ['nosuchverb', '--one'],
    ['nosuchverb', '--two'],
    ['nosuchverb', '--three'],
  ].map((args) => spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' }));

  for (const r of runs) assert.equal(r.status, 4);
  const records = faultRecords(cwd); // parses every line — a torn line throws here
  assert.equal(records.length, 3);
  assert.deepEqual(
    records.map((r) => r.argv[1]).sort(),
    ['--one', '--three', '--two'],
  );
});

test('the fault log is gitignored in this repo — recorded argv must never be committed', () => {
  const checked = spawnSync('git', ['check-ignore', `.fgos/logs/${FAULT_LOG}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  assert.equal(
    checked.status,
    0,
    `.fgos/logs/${FAULT_LOG} must be gitignored: the records carry the raw argv of the bad call`,
  );
});
