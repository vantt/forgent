import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import { execFileSync } from 'node:child_process';

// Observe the real resume check without replacing its native custody/recovery behavior.
// A separate process keeps the module observer out of other runner tests.
test('sync resumability is checked only on resume and after custody admission', () => {
  execFileSync(process.execPath, ['--experimental-test-module-mocks', '--input-type=module', '-'], {
    cwd: new URL('../../../', import.meta.url), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    input: `
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { acquireSync, createLockScope, resolveStateRoot } from './src/holder-lock/index.mjs';
import { createGitSync } from './src/git/index.mjs';
import { holdLockInChild } from './test/helpers/hold-lock-in-child.mjs';
import * as sync from './src/runner/execution/unit-sync.mjs';
let checks = 0;
mock.module('./src/runner/execution/unit-sync.mjs', { namedExports: {
  ...sync,
  assertSyncResumable(...args) {
    assert.ok(args[3], 'custody must be admitted before checking resumability');
    checks++;
    return sync.assertSyncResumable(...args);
  },
}});
const { runUnitWithPort: runUnit } = await import('./test/helpers/run-unit-with-port.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-order-'));
const main = path.join(temp, 'main'), tree = path.join(temp, 'tree');
fs.mkdirSync(main);
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
try {
  git(main,'init','-qb','main'); git(main,'config','user.name','Fixture'); git(main,'config','user.email','fixture@test');
  fs.writeFileSync(path.join(main,'a'),'base\\n'); git(main,'add','a'); git(main,'commit','-qm','base');
  git(main,'worktree','add','-qb','producer',tree);
  const fresh = await runUnit({repoRoot:main,cwd:tree,worktree:tree,unitData:{id:'order',objective:'Sync',capability:'not-configured:answer',writes:['a'],syncOnly:true,syncBase:'main'}});
  assert.equal(fresh.outcome,'pass',JSON.stringify(fresh));
  assert.equal(checks,0,'a fresh run does not invoke the resume check');
  const file = path.join(main,'.fgos/assignments',fresh.unitRunId,'unit.json');
  const record = JSON.parse(fs.readFileSync(file,'utf8'));
  fs.writeFileSync(path.join(main,'a'),'target\\n'); git(main,'commit','-qam','target');
  fs.writeFileSync(path.join(tree,'a'),'producer\\n'); git(tree,'commit','-qam','producer');
  const lease = acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(main,'.fgos'),cwd:tree});
  assert.equal(lease.result,'acquired');
  const target = git(main,'rev-parse','HEAD');
  try {
    const native = createGitSync({stateRoot:resolveStateRoot({fgosDir:path.join(main,'.fgos')}).stateRoot,repoPath:tree,trustedMain:main,writer:record.gitWriter});
    const started = native.start({operationId:'resume-order',target,message:'sync'},[lease.handle]);
    assert.equal(started.state,'conflicted-open');
    record.sync = {ref:'main',sha:target,status:'conflicted',operationId:'resume-order',conflicts:['a'],scopeAdded:['a']};
    fs.writeFileSync(file,JSON.stringify(record));
  } finally { lease.handle.release(); }
  const { child, exited } = await holdLockInChild('dispatch-cwd',{fgosDir:path.join(main,'.fgos'),cwd:tree});
  try {
    await assert.rejects(runUnit({repoRoot:main,cwd:tree,resumeUnitRunId:fresh.unitRunId}),{code:'dispatch-in-flight'});
    assert.equal(checks,0,'failed custody admission must not inspect Sync');
  } finally { child.kill('SIGKILL'); await exited; }
  fs.writeFileSync(path.join(tree,'a'),'manual resolution\\n'); git(tree,'add','a'); git(tree,'commit','-qm','manual merge');
  const resumed = await runUnit({repoRoot:main,cwd:tree,resumeUnitRunId:fresh.unitRunId});
  assert.equal(checks,1);
  assert.equal(resumed.outcome,'pass',JSON.stringify(resumed));
  const settled = JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(settled.sync.status,'merged');
  assert.deepEqual(settled.sync.commit,{by:'outside'});
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
`,
  });
});
