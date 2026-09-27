// CLI integration coverage for `fgos capability match --demand <json>` -- the
// read-only door onto matchCapability (src/runner/capability-match.mjs).
// Self-contained harness (own tmpCwd/run/envelopeData), same style as
// test/cli/plan-lint.test.mjs in this directory.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// Same HOME-isolation rationale as test/cli/plan-lint.test.mjs: avoid this
// dev machine's real, possibly-in-progress global `~/.fgos/config.json`.
const ISOLATED_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-capability-match-home-'));

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: ISOLATED_HOME, USERPROFILE: ISOLATED_HOME },
  });
}

function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-capability-match-cli-'));
  const runner = { ...DEFAULT_RUNNER_CONFIG, executor: { command: 'true', args: [] }, capabilities: DEFAULT_CAPABILITY_SLOTS };
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), `${JSON.stringify({ runner }, null, 2)}\n`);
  return cwd;
}

function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  return envelope.data;
}

const CODE_IMPLEMENT_DEMAND = JSON.stringify({
  outputKind: 'change',
  domain: 'code',
  mutates: true,
  needsIndependentReview: false,
  hasPlanOrTrack: false,
  size: 'light',
  rigor: 'standard',
});

test('a real demand matches code:implement against the default capability catalog', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.capability, 'code:implement');
  assert.equal(data.source, 'match');
  assert.equal(data.form, 'inline');
});

test('appends exactly one .fgos/logs/capability-match.log line per call, with source: match', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND]);
  assert.equal(result.status, 0, result.stderr);
  const logPath = path.join(cwd, '.fgos', 'logs', 'capability-match.log');
  const log = fs.readFileSync(logPath, 'utf8');
  const blocks = log.split(/(?=^=== )/m).filter((b) => b.trim());
  assert.equal(blocks.length, 1);
  assert.match(blocks[0], /source=match capability=code:implement form=inline/);
});

test('a second call appends a second block, never overwriting the first', () => {
  const cwd = tmpCwd();
  run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND]);
  run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND]);
  const logPath = path.join(cwd, '.fgos', 'logs', 'capability-match.log');
  const log = fs.readFileSync(logPath, 'utf8');
  const blocks = log.split(/(?=^=== )/m).filter((b) => b.trim());
  assert.equal(blocks.length, 2);
});

test('a miss is source: miss, form: inline, and still logs', () => {
  const cwd = tmpCwd();
  const demand = JSON.stringify({
    outputKind: 'some-unregistered-kind',
    domain: 'code',
    mutates: true,
    needsIndependentReview: false,
    hasPlanOrTrack: false,
    size: 'light',
    rigor: 'standard',
  });
  const result = run(cwd, ['capability', 'match', '--demand', demand]);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.capability, null);
  assert.equal(data.source, 'miss');
  assert.equal(data.form, 'inline');
  const logPath = path.join(cwd, '.fgos', 'logs', 'capability-match.log');
  assert.match(fs.readFileSync(logPath, 'utf8'), /source=miss capability=null/);
});

test('--override replaces the natural match, requires --reason, and logs source: override', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND, '--override', 'code:review', '--reason', 'domain context warrants independent review']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.capability, 'code:review');
  assert.equal(data.source, 'override');
  assert.equal(data.reason, 'domain context warrants independent review');
  const logPath = path.join(cwd, '.fgos', 'logs', 'capability-match.log');
  assert.match(fs.readFileSync(logPath, 'utf8'), /source=override capability=code:review/);
});

test('--override without --reason is a usage error and never logs', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND, '--override', 'code:review']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--override requires --reason/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos', 'logs', 'capability-match.log')));
});

test('--override naming an unregistered capability is a usage error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', CODE_IMPLEMENT_DEMAND, '--override', 'totally:bogus', '--reason', 'x']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /"totally:bogus" is not a registered runner\.capabilities key or alias/);
});

test('missing --demand is a usage error naming the requirement', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires --demand/);
});

test('malformed --demand JSON is a usage error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'match', '--demand', 'not-json']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be valid JSON/);
});

test('demandFacts violating the closed vocabulary (bad size) is a usage error naming the field', () => {
  const cwd = tmpCwd();
  const demand = JSON.stringify({
    outputKind: 'change',
    domain: 'code',
    mutates: true,
    needsIndependentReview: false,
    hasPlanOrTrack: false,
    size: 'medium',
    rigor: 'standard',
  });
  const result = run(cwd, ['capability', 'match', '--demand', demand]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /demandFacts\.size/);
});

test('an unknown capability sub-verb is a usage error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['capability', 'bogus-sub']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown sub-verb "bogus-sub"/);
});
