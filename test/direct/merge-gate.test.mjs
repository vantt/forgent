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
