// Adversarial CLI edge cases for `fgos capability match`: override/reason
// handling, per-call log shape, and form on override.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');
const ISOLATED_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-capability-match-adv-home-'));

function run(cwd, args) {
  const env = { ...process.env, HOME: ISOLATED_HOME, USERPROFILE: ISOLATED_HOME };
  delete env.CLAUDE_CODE_SESSION_ID;
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8', env });
}

function tmpCwd(capabilities = DEFAULT_CAPABILITY_SLOTS) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-capability-match-adv-'));
  const runner = { ...DEFAULT_RUNNER_CONFIG, executor: { command: 'true', args: [] }, capabilities };
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), `${JSON.stringify({ runner }, null, 2)}\n`);
  return cwd;
}

function logBlocks(cwd) {
  const logPath = path.join(cwd, '.fgos', 'logs', 'capability-match.log');
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8').split(/(?=^=== )/m).filter((b) => b.trim());
}

function data(stdout) {
  return JSON.parse(stdout).data;
}

const demand = (over = {}) => JSON.stringify({
  outputKind: 'change', domain: 'code', mutates: true, needsIndependentReview: false,
  hasPlanOrTrack: false, size: 'light', rigor: 'standard', ...over,
});

test('each of match/override/miss writes exactly one log block with the matching source', () => {
  const cwd = tmpCwd();
  const m = run(cwd, ['capability', 'match', '--demand', demand()]);
  assert.equal(m.status, 0, m.stderr);
  assert.equal(logBlocks(cwd).length, 1);
  const o = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'code:review', '--reason', 'needs a reviewer']);
  assert.equal(o.status, 0, o.stderr);
  assert.equal(logBlocks(cwd).length, 2);
  const x = run(cwd, ['capability', 'match', '--demand', demand({ outputKind: 'nope' })]);
  assert.equal(x.status, 0, x.stderr);
  const blocks = logBlocks(cwd);
  assert.equal(blocks.length, 3);
  assert.match(blocks[0], /message: source=match capability=code:implement /);
  assert.match(blocks[1], /message: source=override capability=code:review .*needs a reviewer/);
  assert.match(blocks[2], /message: source=miss capability=null form=inline/);
  assert.equal(data(m.stdout).source, 'match');
  assert.equal(data(o.stdout).source, 'override');
  assert.equal(data(x.stdout).source, 'miss');
});

test('--override without --reason is a usage error and writes no log', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'code:review']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /--reason/);
  assert.equal(logBlocks(cwd).length, 0);
});

test('--override with an empty --reason is a usage error', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'code:review', '--reason', '']);
  assert.notEqual(r.status, 0);
  assert.equal(logBlocks(cwd).length, 0);
});

test('--override naming an unregistered capability is rejected and never logged as override', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'code:implment', '--reason', 'typo']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /not a registered/);
  assert.equal(logBlocks(cwd).length, 0);
});

test('--override naming an inherited Object.prototype key (constructor) is rejected', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'constructor', '--reason', 'probe']);
  assert.notEqual(r.status, 0);
  assert.equal(logBlocks(cwd).length, 0);
});

test('--override accepts a declared alias and resolves it to the canonical capability key', () => {
  const cwd = tmpCwd({ ...DEFAULT_CAPABILITY_SLOTS, 'code:review': { ...DEFAULT_CAPABILITY_SLOTS['code:review'], aliases: ['cr'] } });
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'cr', '--reason', 'alias']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(data(r.stdout).capability, 'code:review');
});

test('--override on a natural miss re-derives form from the override facts, not the forced-inline miss form', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand({ outputKind: 'nope', hasPlanOrTrack: true, size: 'heavy' }), '--override', 'code:implement', '--reason', 'owner call']);
  assert.equal(r.status, 0, r.stderr);
  const d = data(r.stdout);
  assert.equal(d.capability, 'code:implement');
  assert.equal(d.source, 'override');
  assert.equal(d.form, 'facade', 'form is re-derived for the overridden capability');
});

test('--override log line does not record what the natural match was', () => {
  const cwd = tmpCwd();
  run(cwd, ['capability', 'match', '--demand', demand(), '--override', 'code:review', '--reason', 'why']);
  const [block] = logBlocks(cwd);
  assert.doesNotMatch(block, /code:implement/);
});

test('--reason without --override is a usage error', () => {
  const cwd = tmpCwd();
  const r = run(cwd, ['capability', 'match', '--demand', demand(), '--reason', 'orphan']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /--reason requires --override/);
  assert.equal(logBlocks(cwd).length, 0);
});

test('--demand null / array are validation errors and write no log', () => {
  const cwd = tmpCwd();
  for (const raw of ['null', '[]', '"str"']) {
    const r = run(cwd, ['capability', 'match', '--demand', raw]);
    assert.notEqual(r.status, 0, raw);
  }
  assert.equal(logBlocks(cwd).length, 0);
});

test('capability match does not create .fgos/state or events', () => {
  const cwd = tmpCwd();
  const before = fs.readdirSync(path.join(cwd, '.fgos')).sort();
  run(cwd, ['capability', 'match', '--demand', demand()]);
  const after = fs.readdirSync(path.join(cwd, '.fgos')).sort();
  assert.deepEqual(after.filter((f) => !before.includes(f)), ['logs']);
});
