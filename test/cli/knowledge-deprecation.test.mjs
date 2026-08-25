import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync, spawnSync } from 'node:child_process';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { initStore, addWork, putInAwaiting, recordGateApprove } from '../../src/state/store.mjs';

function setupGitRepoWithStore() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-deprecate-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'ignore' });

  const readme = path.join(tmpDir, 'README.md');
  fs.writeFileSync(readme, '# Test Repo\n', 'utf8');
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });

  const fgosDir = path.join(tmpDir, '.fgos');
  initStore(fgosDir);
  return { tmpDir, fgosDir };
}

test('knowledge deprecation - compound is marked deprecated in manifest', () => {
  const compoundEntry = COMMAND_REGISTRY.find((c) => c.name === 'compound');
  assert.ok(compoundEntry, 'compound entry must exist in COMMAND_REGISTRY');
  assert.ok(compoundEntry.deprecated, 'compound entry must have deprecated string set');
  assert.ok(compoundEntry.deprecated.includes('fgos doc'), 'deprecated message must point to fgos doc');
});

test('knowledge deprecation - fgos compound prints deprecation warning on stderr', () => {
  const { tmpDir } = setupGitRepoWithStore();
  try {
    const fgosBin = path.resolve('bin/fgos.mjs');
    const res = spawnSync(process.execPath, [fgosBin, 'compound', 'tsk-100'], { cwd: tmpDir, encoding: 'utf8' });
    assert.ok(res.stderr.includes('[DEPRECATION WARNING]'), 'stderr must contain deprecation warning');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
