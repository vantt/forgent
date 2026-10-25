import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { readProjectConfig, writeProjectConfig } from '../../helpers/config-fixture.mjs';
import {
  SKIP, setup, run, writer, readJson, unitDirOf, attemptsOf,
} from '../../helpers/failover-fixture.mjs';

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
    const native = createGitSync({stateRoot:resolveStateRoot().stateRoot,repoPath:tree,trustedMain:main,writer:record.gitWriter});
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

// The environment is fixed between a run and its resume: the failing seat's executor is replaced by a working one.
function replaceFailingExecutor(fx) {
  const config = readProjectConfig(fx.repoRoot);
  const { runner } = config;
  runner.executors.gamma = JSON.parse(JSON.stringify(runner.executors.beta).replaceAll('spentquota', 'gamma').replaceAll('beta-cli', 'gamma-cli'));
  runner.modelPolicies.gamma = runner.modelPolicies.spentquota;
  for (const tier of Object.keys(runner.tierFallback)) runner.tierFallback[tier] = ['alpha', 'gamma'];
  runner.capabilities['docs:write'].prefer = [{ executor: 'alpha', invocation: 'alpha-cli' }, { executor: 'gamma', invocation: 'gamma-cli' }];
  writeProjectConfig(fx.repoRoot, config);
}
const resume = (fx, unitRunId) => runUnit({
  resumeUnitRunId: unitRunId, repoRoot: fx.repoRoot, cwd: fx.worktreeDir, worktree: fx.worktreeDir,
  session: { herdrPresent: false, headless: true }, providerCapacityRuntimeDir: fx.runtimeDir,
});
const runDirs = (fx, res, seat, sub) => fs.readdirSync(path.join(unitDirOf(fx.repoRoot, res), seat, sub, 'runs'));

test('a resumed run re-binds a seat that did not pass from the current config and keeps the binding of a seat that passed', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha' }, beta: { family: 'spentquota' } });
  const first = await run(fx, { ...writer('u-resume-rebind'), pattern: 'reviewed' }, { pattern: 'reviewed' });
  assert.notEqual(first.outcome, 'pass', JSON.stringify(first.results.map((r) => [r.role, r.outcome])));
  const producerBefore = attemptsOf(fx.repoRoot, first, 'producer/1');
  assert.deepEqual(producerBefore.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'pass']]);
  assert.deepEqual(attemptsOf(fx.repoRoot, first, 'reviewer/1').map((a) => [a.binding.executor, a.outcome]), [['beta', 'provider-limit']]);

  replaceFailingExecutor(fx);
  const resumed = await resume(fx, first.unitRunId);
  assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed.results.map((r) => [r.role, r.outcome, r.fallbackExhausted])));

  // The failed seat got a new attempt from the current config; the old attempt stays as it was.
  const reviewer = attemptsOf(fx.repoRoot, resumed, 'reviewer/1');
  assert.deepEqual(reviewer.map((a) => [a.binding.executor, a.outcome]), [['beta', 'provider-limit'], ['gamma', 'pass']]);
  assert.equal(reviewer[1].assignmentId, `${resumed.unitRunId}/reviewer/1-fb1`);
  const record = readJson(path.join(unitDirOf(fx.repoRoot, resumed), 'unit.json'));
  assert.notEqual(reviewer[0].configHash, reviewer[1].configHash, 'each attempt names the config it was bound from');
  assert.equal(reviewer[1].configHash, record.configSnapshot.hash);

  // The seat that passed is not run again and keeps its binding.
  assert.deepEqual(attemptsOf(fx.repoRoot, resumed, 'producer/1'), producerBefore);
  assert.deepEqual(runDirs(fx, resumed, 'producer', '1'), ['01']);
});

test('a resumed attempt that has a binding but no recorded outcome is adopted, never started a second time', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha' }, beta: { family: 'spentquota' } });
  const first = await run(fx, { ...writer('u-resume-adopt'), pattern: 'reviewed' }, { pattern: 'reviewed' });
  const file = path.join(unitDirOf(fx.repoRoot, first), 'unit.json');
  // The controller died before it read the reviewer's answer.
  const record = readJson(file);
  delete record.bindings['reviewer/1'][0].outcome;
  fs.writeFileSync(file, JSON.stringify(record, null, 2));

  replaceFailingExecutor(fx);
  const resumed = await resume(fx, first.unitRunId);
  const reviewer = attemptsOf(fx.repoRoot, resumed, 'reviewer/1');
  assert.equal(reviewer[0].binding.executor, 'beta', 'the attempt with no outcome keeps its binding');
  assert.equal(reviewer[0].outcome, 'provider-limit', 'its settled result is adopted');
  assert.deepEqual(runDirs(fx, resumed, 'reviewer', '1'), ['01'], 'no second run started for that attempt');
});
