// test/state/decision-scope-field.test.mjs — tsk-1lv-2 (D4): `state.decisions`
// gains an optional `scope` field for platform/repo-wide decisions
// (`--id` stays the item-scoped axis, unchanged). `addDecision` itself
// stays fully lenient about it (same "CLI validates, store persists"
// split tsk-1lv-1's `relation` field already established) -- these tests
// prove the round-trip through the real store, then the CLI-level
// `--scope` flag wiring.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { addDecision, listWork } from '../../src/state/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-scope-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function initCwd() {
  const cwd = tmpDir();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- addDecision round-trips `scope` verbatim (store layer) ---

test('addDecision persists an explicit scope field verbatim', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'D1: repo-wide naming convention', rationale: 'because reasons', scope: 'repo' });
  const view = listWork(dir);
  assert.equal(view.decisions.at(-1).scope, 'repo');
});

test('addDecision leaves scope entirely absent when the caller omits it -- no default, no inference', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'an ordinary item-scoped decision', rationale: 'because reasons' });
  const view = listWork(dir);
  assert.equal('scope' in view.decisions.at(-1), false);
});

test('addDecision never validates scope -- an arbitrary non-empty string round-trips unchanged (store stays lenient, per tsk-1lv-1\'s relation precedent)', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'D2: area-scoped decision', rationale: 'because reasons', scope: 'runner' });
  const view = listWork(dir);
  assert.equal(view.decisions.at(-1).scope, 'runner');
});

// --- CLI: `fgos decision --scope <value>` ---

test('CLI: decision --scope repo persists and is readable back via listWork', () => {
  const cwd = initCwd();
  const result = run(cwd, ['decision', '--text', 'D1: repo-wide naming convention', '--rationale', 'because reasons', '--relation', 'none', '--scope', 'repo']);
  assert.equal(result.status, 0);
  const view = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'state.json'), 'utf8'));
  assert.equal(view.decisions.at(-1).scope, 'repo');
});

test('CLI: decision without --scope succeeds exactly as before this field existed (fully optional)', () => {
  const cwd = initCwd();
  const result = run(cwd, ['decision', '--text', 'an ordinary decision', '--rationale', 'because reasons', '--relation', 'none']);
  assert.equal(result.status, 0);
  const view = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'state.json'), 'utf8'));
  assert.equal('scope' in view.decisions.at(-1), false);
});

test('CLI: an --id-scoped decision may still carry --scope (not mutually exclusive) -- both fold correctly', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host item', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture item']).status,
    0,
  );
  const result = run(cwd, ['decision', '--id', 'host-item', '--text', 'D1: item decision that also touches platform scope', '--rationale', 'because reasons', '--relation', 'none', '--scope', 'runner']);
  assert.equal(result.status, 0);
  const view = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'state.json'), 'utf8'));
  const last = view.decisions.at(-1);
  assert.equal(last.id, 'host-item');
  assert.equal(last.scope, 'runner');
});
