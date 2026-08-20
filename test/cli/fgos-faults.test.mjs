// CLI integration coverage for `fgos faults` (tsk-1wdf) — the
// machine-readable read surface for .fgos/invocation-faults.jsonl, the side
// log `recordInvocationFault` (tsk-5z0) writes. Self-contained harness (own
// tmpCwd/run/envelopeData), same topic-scoped split as fgos-tool.test.mjs and
// invocation-fault-log.test.mjs in this directory rather than growing either.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function rawTmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-faults-cli-'));
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

function tmpGitCwd() {
  const cwd = tmpCwd();
  gitInit(cwd);
  return cwd;
}

function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  return envelope.data;
}

test('an empty store with no faults yet reports count 0 and an empty array', () => {
  const cwd = tmpGitCwd();
  const result = run(cwd, ['faults']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 0);
  assert.deepEqual(data.records, []);
});

test('a recorded fault is read back with its full provenance', () => {
  const cwd = tmpGitCwd();
  assert.equal(run(cwd, ['nosuchverb', '--whatever']).status, 4);

  const result = run(cwd, ['faults']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1);
  assert.equal(data.records.length, 1);
  const [record] = data.records;
  assert.equal(record.faultClass, 'unknown-verb');
  assert.equal(record.verb, 'nosuchverb');
  assert.deepEqual(record.argv, ['nosuchverb', '--whatever']);
  assert.equal(record.cwd, fs.realpathSync(cwd));
  assert.ok(record.writer?.id, 'a record must name who wrote it');
  assert.match(record.message, /unknown verb/);
  assert.equal(data.path, path.join(fs.realpathSync(cwd), '.fgos', 'invocation-faults.jsonl'));
});

test('a verb\'s own business refusal never shows up in the read surface', () => {
  const cwd = tmpGitCwd();
  assert.equal(run(cwd, ['rollup', 'no-such-item']).status, 4);

  const data = envelopeData(run(cwd, ['faults']).stdout);
  assert.equal(data.count, 0);
  assert.deepEqual(data.records, []);
});

test('--limit returns only the N most recently recorded faults', () => {
  const cwd = tmpGitCwd();
  for (const tag of ['--one', '--two', '--three']) {
    assert.equal(run(cwd, ['nosuchverb', tag]).status, 4);
  }

  const data = envelopeData(run(cwd, ['faults', '--limit', '2']).stdout);
  assert.equal(data.count, 3, 'count reports the full log even when the returned page is limited');
  assert.equal(data.records.length, 2);
  assert.deepEqual(
    data.records.map((r) => r.argv[1]),
    ['--two', '--three'],
  );
});

test('--limit rejects a non-positive-integer value', () => {
  const cwd = tmpGitCwd();
  for (const bad of ['0', '-1', 'abc']) {
    const result = run(cwd, ['faults', '--limit', bad]);
    assert.equal(result.status, 4, `--limit ${bad} should be refused`);
    assert.match(result.stderr, /faults --limit requires a positive integer value/);
  }
});

test('a linked worktree with no --dir still reads the main checkout\'s real log', () => {
  const main = tmpGitCwd();
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-faults-wt-'));
  fs.rmdirSync(wt);
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'tsk-1wdf-fault-test', wt], { cwd: main });
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));

  // Fault from the main checkout so there is a real record to find.
  assert.equal(run(main, ['nosuchverb']).status, 4);

  const result = run(wt, ['faults']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1, 'the worktree session must see the main checkout\'s own log, not an empty one');
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')), 'reading must never create .fgos/ in a worktree');
});

test('outside a git repo with no store at all, faults reports an empty view rather than failing', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['faults']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 0);
  assert.deepEqual(data.records, []);
  assert.equal(data.path, null);
});
