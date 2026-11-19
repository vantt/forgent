import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { initStore, addWork } from '../../src/state/store.mjs';

// The machine's own global config file is layered under the project's; a test never reads the real one.
process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-report-verb-home-'));

const FGOS_BIN = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));

function setup() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-report-verb-test-'));
  initializeWorkRepository(repoRoot);
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'target', title: 'Target', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  return { repoRoot, dir };
}

// `--dir` is the project root; the CLI resolves `.fgos` underneath it.
function runFgos(repoRoot, args) {
  const out = execFileSync('node', [FGOS_BIN, ...args, '--dir', repoRoot], { encoding: 'utf8' });
  return JSON.parse(out).data;
}

test('fgos report lands a driver closing report on the item, readable through fgos show', () => {
  const { repoRoot } = setup();
  const written = runFgos(repoRoot, ['report', 'target', '--text', 'returned, verify green', '--stop-reason', 'awaiting-approval']);
  assert.equal(written.id, 'target');
  assert.equal(written.stopReason, 'awaiting-approval');

  const shown = runFgos(repoRoot, ['show', 'target', '--json']);
  const reports = shown.decisions.filter((d) => d.source === 'driver-report');
  assert.equal(reports.length, 1);
  assert.equal(reports[0].text, 'returned, verify green');
  assert.match(reports[0].rationale, /awaiting-approval/);
});

test('fgos report supplies its own rationale when no stop reason is given, since addDecision requires one', () => {
  const { repoRoot } = setup();
  const written = runFgos(repoRoot, ['report', 'target', '--text', 'closing note']);
  assert.equal(written.stopReason, null);
  const shown = runFgos(repoRoot, ['show', 'target', '--json']);
  const report = shown.decisions.find((d) => d.source === 'driver-report');
  assert.ok(report.rationale.trim().length > 0);
});
