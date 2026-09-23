import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpCwdFast } from '../cli/helpers/fgos-cli-harness.mjs';
import { approveUseCase } from '../../src/verbs/merge/approve.mjs';
import { addWork } from '../../src/state/store.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const execGit = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

function addTestWork(dir, id, extra = {}) {
  return addWork(dir, {
    id,
    title: extra.title ?? ('Title ' + id),
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    risk: extra.risk ?? 'light',
    deps: extra.deps ?? [],
    refs: extra.refs ?? [],
    verify: extra.verify ?? 'test',
    description: 'test',
    ...extra
  });
}

test('approve gate: aborts cleanly on test failure without modifying main', async (t) => {
  const cwd = fs.mkdtempSync(path.join('/tmp', 'test-gate-'));
  
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  
  const fgosDir = path.join(cwd, '.fgos');
  fs.mkdirSync(fgosDir);
  
  addTestWork(fgosDir, 'tsk-test', { status: 'awaiting-approval' });
  execGit(cwd, ['add', '.fgos']);
  execGit(cwd, ['commit', '-m', 'add work']);
  
  execGit(cwd, ['branch', 'fgw/tsk-test', 'HEAD']);
  
  execGit(cwd, ['checkout', 'fgw/tsk-test']);
  fs.writeFileSync(path.join(cwd, 'new-file.txt'), 'hello');
  execGit(cwd, ['add', 'new-file.txt']);
  execGit(cwd, ['commit', '-m', 'add new-file']);
  execGit(cwd, ['checkout', 'main']);
  
  fs.writeFileSync(path.join(cwd, 'fail.sh'), '#!/bin/sh\nexit 1\n');
  fs.chmodSync(path.join(cwd, 'fail.sh'), 0o755);
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ scripts: { test: './fail.sh' } }));
  execGit(cwd, ['add', 'package.json', 'fail.sh']);
  execGit(cwd, ['commit', '-m', 'add test script']);
  const newTargetTip = execGit(cwd, ['rev-parse', 'HEAD']).trim();
  
  execGit(cwd, ['checkout', 'fgw/tsk-test']);
  execGit(cwd, ['merge', 'main']);
  execGit(cwd, ['checkout', 'main']);
  
  try {
    const result = await approveUseCase({ dir: fgosDir, repoRoot: cwd }, {
      id: 'tsk-test',
      resolveTimeoutMs: () => 5000,
      resolveWaitFlags: () => ({ noWait: true }),
      github: false,
      acknowledgeIronLaw: () => {},
      acknowledgeDrift: () => {},
    });
    
    assert.equal(result.to, 'blocked', 'result.to should be blocked');
    assert.equal(result.reason, 'verify-fail', 'result.reason should be verify-fail');
  } catch (e) {
  }
  
  const status = execGit(cwd, ['status', '--porcelain']).trim();
  const statusLines = status.split('\n').filter(line => !line.includes('.fgos/'));
  assert.equal(statusLines.join('\n'), '', 'main working tree should be clean outside of .fgos');
  
  const finalTip = execGit(cwd, ['rev-parse', 'HEAD']).trim();
  assert.equal(finalTip, newTargetTip, 'main ref should not have moved');
});

test('root-into-main merge gate: verify sees the merged tree\'s own declared dependencies installed', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const os = await import('node:os');
  // A local `file:` dependency resolves entirely offline, so provisioning
  // stays fast and never hits the registry.
  const depDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-localdep-'));
  fs.writeFileSync(path.join(depDir, 'package.json'), JSON.stringify({ name: 'fgos-merge-gate-localdep', version: '1.0.0' }));
  fs.writeFileSync(path.join(depDir, 'index.js'), 'module.exports = {};\n');

  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-deps-'));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'host', version: '1.0.0', dependencies: { 'fgos-merge-gate-localdep': `file:${depDir}` } }));
  execGit(cwd, ['add', 'package.json']);
  execGit(cwd, ['commit', '-m', 'declare dependency']);
  fs.mkdirSync(path.join(cwd, '.fgos'));

  execGit(cwd, ['branch', 'fgw/tsk-dep', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-dep']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);
  const mainBefore = execGit(cwd, ['rev-parse', 'HEAD']).trim();

  const item = { id: 'tsk-dep', verify: `node -e "require('fgos-merge-gate-localdep')"` };
  const result = await mergeRootIntoMainCas(cwd, item, 'fgw/tsk-dep', { timeoutMs: 60000 });

  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.notEqual(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore, 'main should advance to the merge commit');
});

test('root-into-main merge gate: verify runs without holding main-checkout.lock, so other fgos commands are not refused meanwhile', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const { LOCK_FILE } = await import('../../src/runner/main-checkout-lock.mjs');
  const os = await import('node:os');
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-lock-'));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  execGit(cwd, ['branch', 'fgw/tsk-lock', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-lock']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);

  const lockPath = path.join(cwd, '.fgos', LOCK_FILE);
  // verify fails (exit 1) if the lock file exists while it runs.
  const item = { id: 'tsk-lock', verify: `node -e "process.exit(require('fs').existsSync('${lockPath}') ? 1 : 0)"` };
  const result = await mergeRootIntoMainCas(cwd, item, 'fgw/tsk-lock', { timeoutMs: 60000 });

  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
  assert.equal(fs.existsSync(lockPath), false, 'the lock is released after landing');
  assert.ok(fs.existsSync(path.join(cwd, 'feature.txt')), 'main checkout working tree synced to the merge');
});

async function casRepoWithSetup(commands) {
  const os = await import('node:os');
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-setup-'));
  execGit(cwd, ['init', '--initial-branch=main']);
  execGit(cwd, ['config', 'user.name', 'Test']);
  execGit(cwd, ['config', 'user.email', 'test@example.com']);
  execGit(cwd, ['commit', '--allow-empty', '-m', 'initial']);
  fs.mkdirSync(path.join(cwd, '.fgos'));
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ worktreeSetup: { commands } }));
  execGit(cwd, ['branch', 'fgw/tsk-setup', 'HEAD']);
  execGit(cwd, ['checkout', 'fgw/tsk-setup']);
  fs.writeFileSync(path.join(cwd, 'feature.txt'), 'feature\n');
  execGit(cwd, ['add', 'feature.txt']);
  execGit(cwd, ['commit', '-m', 'add feature']);
  execGit(cwd, ['checkout', 'main']);
  return cwd;
}

test('root-into-main merge gate: runs the project\'s worktreeSetup commands before verify (e.g. building an artifact the suite needs)', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['echo built > build-artifact.txt']);
  const item = { id: 'tsk-setup', verify: `node -e "process.exit(require('fs').existsSync('build-artifact.txt') ? 0 : 1)"` };
  const result = await mergeRootIntoMainCas(cwd, item, 'fgw/tsk-setup', { timeoutMs: 60000 });
  assert.equal(result.outcome, 'merged', `expected merged, got ${result.outcome}: ${result.check?.output ?? ''}`);
});

test('root-into-main merge gate: a failing worktreeSetup command is a verify-fail naming the command, main untouched', async () => {
  const { mergeRootIntoMainCas } = await import('../../src/runner/merge.mjs');
  const cwd = await casRepoWithSetup(['echo setup-broke >&2; exit 2']);
  const mainBefore = execGit(cwd, ['rev-parse', 'main']).trim();
  const result = await mergeRootIntoMainCas(cwd, { id: 'tsk-setup', verify: 'true' }, 'fgw/tsk-setup', { timeoutMs: 60000 });
  assert.equal(result.outcome, 'verify-fail');
  assert.match(result.check.output, /setup-broke/);
  assert.equal(execGit(cwd, ['rev-parse', 'main']).trim(), mainBefore);
});
