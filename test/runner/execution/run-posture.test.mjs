// test/runner/execution/run-posture.test.mjs -- the bound posture reaches the OS
// confinement backend through the one confinement path (runUnit -> executeAssignment
// -> Confinement Authority -> bwrap driver), and an unavailable backend refuses.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnit } from '../../../src/runner/execution/run.mjs';
import { resolvePosture, canApplyPosture, resolvePostureInvocation } from '../../../src/runner/dispatch/confinement/policies.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

// Confined runs mount a private tmpfs over /tmp, so fixtures live outside it.
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

const fixtureDirs = [];
const fixtureDir = (prefix) => {
  const dir = makeFixtureDir(prefix);
  fixtureDirs.push(dir);
  return dir;
};
after(() => {
  for (const dir of fixtureDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function bwrapUsable() {
  try {
    execFileSync('/usr/bin/bwrap', ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const SKIP = bwrapUsable() ? false : 'bwrap is not usable in this environment (user namespaces unavailable)';

// Tries three writes and records the error code (or "ok") of each in the run outbox:
//   worktree -> the Unit worktree (the worker's cwd)
//   main     -> the main checkout (holds fgOS state)
//   outbox   -> the run outbox
const PROBE_WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const dir = fs.existsSync(outbox) ? outbox : claimDir;
  const attempt = (file) => {
    try { fs.writeFileSync(file, 'x'); return 'ok'; } catch (err) { return err.code || String(err); }
  };
  const cfg = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'probe-targets.json'), 'utf8'));
  const results = {
    worktree: attempt(path.join(cfg.worktree, 'probe-worktree.txt')),
    main: attempt(path.join(cfg.main, 'probe-main.txt')),
  };
  fs.mkdirSync(dir, { recursive: true });
  results.outbox = attempt(path.join(dir, 'probe-outbox.txt'));
  fs.writeFileSync(path.join(dir, 'probe-results.json'), JSON.stringify(results));
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
}
`;

function setupProbeRepo(executorNames) {
  const repoRoot = fixtureDir('fgos-posture-');
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Test Runner']);
  git(['config', 'user.email', 'test@runner.local']);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# Test\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'initial']);
  const worktreeDir = fixtureDir('fgos-posture-wt-');
  git(['worktree', 'add', '-b', 'wt-branch', worktreeDir]);

  const script = path.join(repoRoot, 'probe-worker.mjs');
  fs.writeFileSync(script, PROBE_WORKER);
  fs.writeFileSync(
    path.join(repoRoot, 'probe-targets.json'),
    JSON.stringify({ worktree: fs.realpathSync(worktreeDir), main: fs.realpathSync(repoRoot) }),
  );

  const executors = {};
  for (const name of executorNames) {
    const command = path.join(repoRoot, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  const prefer = executorNames.map((executor) => ({ executor }));
  const cfg = {
    runner: {
      defaultExecutor: executorNames[0],
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: {},
      executors,
      capabilities: {
        'docs:write': { prefer, rigor: 'standard' },
        'docs:review': { prefer, persona: 'code-reviewer', rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'], high: ['reviewer'], critical: ['reviewer'] } },
      },
    },
  };
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify(cfg, null, 2));
  return { repoRoot, worktreeDir };
}

function readProbe(repoRoot, unitRunId, role, round = 1) {
  const outbox = path.join(repoRoot, '.fgos', 'assignments', unitRunId, role, String(round), 'runs', '01', 'worker-output', 'outbox');
  return JSON.parse(fs.readFileSync(path.join(outbox, 'probe-results.json'), 'utf8'));
}

const BLOCKED = /^(EROFS|EACCES|EPERM)$/;

test('read-only posture: repo writes are blocked, the run outbox stays writable', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setupProbeRepo(['alpha']);
  const res = await runUnit({
    unitData: { id: 'u-ro', objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'solo',
  });
  assert.equal(res.results[0].runResult?.classification?.outcome?.category, 'ok', JSON.stringify(res.results[0]).slice(0, 1500));
  const probe = readProbe(repoRoot, res.unitRunId, 'producer');
  assert.match(probe.worktree, BLOCKED);
  assert.match(probe.main, BLOCKED);
  assert.equal(probe.outbox, 'ok');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'probe-worktree.txt')), false);
});

test('workspace-write producer writes in its worktree only; the reviewer is read-only', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setupProbeRepo(['alpha', 'beta']);
  const res = await runUnit({
    unitData: { id: 'u-rw', objective: 'Write docs', capability: 'docs:write', writes: ['probe-worktree.txt'], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  const producer = readProbe(repoRoot, res.unitRunId, 'producer');
  assert.equal(producer.worktree, 'ok');
  assert.match(producer.main, BLOCKED);
  assert.equal(producer.outbox, 'ok');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'probe-worktree.txt')), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'probe-main.txt')), false);

  const reviewer = readProbe(repoRoot, res.unitRunId, 'reviewer');
  assert.match(reviewer.worktree, BLOCKED);
  assert.match(reviewer.main, BLOCKED);
  assert.equal(reviewer.outbox, 'ok');
});

test('a run uses the confined invocation that was approved, not the executor first cli invocation', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setupProbeRepo(['alpha']);
  const cfgPath = path.join(repoRoot, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const failScript = path.join(repoRoot, 'unconfined-must-not-run.mjs');
  fs.writeFileSync(failScript, "process.stderr.write('the unconfined invocation must not run\\n'); process.exit(7);\n");
  const alpha = cfg.runner.executors.alpha;
  const confined = { ...alpha.invocations[0], id: 'cli-confined' };
  alpha.invocations = [
    { id: 'cli-plain', via: 'cli', adapter: 'cli-spawn', command: alpha.command, args: [failScript, '{prompt}'] },
    confined,
  ];
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const res = await runUnit({
    unitData: { id: 'u-two', objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'solo',
  });
  assert.equal(res.results[0].runResult?.classification?.outcome?.category, 'ok', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(res.results[0].binding?.invocation, 'cli-confined');
  const probe = readProbe(repoRoot, res.unitRunId, 'producer');
  assert.match(probe.worktree, BLOCKED);
  assert.equal(probe.outbox, 'ok');
});

test('an unavailable backend refuses with posture-unavailable and never runs unconfined', async () => {
  const { repoRoot, worktreeDir } = setupProbeRepo(['alpha']);
  const registry = path.join(repoRoot, 'no-bwrap-registry.json');
  fs.writeFileSync(registry, JSON.stringify({
    contract: 'confinement-backend-registry.v1',
    confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: '/nonexistent/bwrap' } },
  }));
  const previous = process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
  process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = registry;
  try {
    const res = await runUnit({
      unitData: { id: 'u-nobw', objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' },
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      pattern: 'solo',
    });
    assert.equal(res.outcome, 'policy-refusal');
    assert.equal(res.results[0].refused.reason, 'posture-unavailable');
    assert.equal(res.results[0].runResult, undefined, 'nothing may have been launched');
  } finally {
    if (previous === undefined) delete process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH;
    else process.env.FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH = previous;
  }
});

test('resolvePosture maps posture onto the built-in policies without building sandbox arguments', () => {
  const ro = resolvePosture({ posture: 'read-only' });
  assert.equal(ro.policyId, 'host-write-denied');
  assert.deepEqual(ro.requirement, { mode: 'required', policyId: 'host-write-denied', policy: ro.policy });
  assert.ok(ro.policy.grants.some((g) => g.resource === 'run-output' && g.access === 'write'));
  assert.ok(ro.policy.grants.some((g) => g.resource === 'executor-credentials' && g.access === 'read'));
  assert.ok(!ro.policy.grants.some((g) => g.resource === 'workspace'));
  assert.equal('bwrapArgs' in ro, false);

  const rw = resolvePosture({ posture: 'workspace-write' });
  assert.equal(rw.policyId, 'workspace-write');
  assert.equal(rw.requirement.mode, 'required');
  assert.ok(rw.policy.grants.some((g) => g.resource === 'workspace' && g.access === 'read-write'));

  // an unknown or missing posture never widens access
  assert.equal(resolvePosture({ posture: 'anything-else' }).policyId, 'host-write-denied');
  assert.equal(resolvePosture(undefined).policyId, 'host-write-denied');
});

test('resolvePostureInvocation selects the first cli invocation that can carry the posture', () => {
  const ctx = {
    executors: {
      two: {
        invocations: [
          { id: 'cli-plain', via: 'cli', command: 'x' },
          { id: 'cli-bwrap', via: 'cli', command: 'x', confinement: { backend: 'bwrap' } },
        ],
      },
      noid: { invocations: [{ via: 'cli', command: 'x' }, { via: 'cli', command: 'y', confinement: { backend: 'bwrap' } }] },
    },
  };
  assert.deepEqual(resolvePostureInvocation({ executor: 'two', invocation: null }, 'read-only', ctx), { ok: true, invocation: 'cli-bwrap' });
  assert.deepEqual(resolvePostureInvocation({ executor: 'two', invocation: 'cli-bwrap' }, 'read-only', ctx), { ok: true, invocation: 'cli-bwrap' });
  assert.equal(resolvePostureInvocation({ executor: 'two', invocation: 'cli-plain' }, 'read-only', ctx).ok, false);
  // a confined invocation with no id cannot be pinned and is not the default one: no approval
  assert.equal(resolvePostureInvocation({ executor: 'noid', invocation: null }, 'read-only', ctx).ok, false);
});

test('canApplyPosture needs a declared backend that is registered and executable on this machine', () => {
  const executors = {
    confined: { invocations: [{ id: 'cli-bwrap', via: 'cli', confinement: { backend: 'bwrap' } }, { id: 'cli-plain', via: 'cli' }] },
    plain: { command: 'x', invocations: [{ id: 'cli-plain', via: 'cli' }] },
  };
  const ctx = { executors };
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'cli-bwrap' }, 'read-only', ctx), true);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: null }, 'workspace-write', ctx), true);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'cli-plain' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'confined', invocation: 'missing' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'plain', invocation: null }, 'read-only', ctx), false);
  assert.equal(canApplyPosture({ executor: 'unknown' }, 'read-only', ctx), false);
  assert.equal(canApplyPosture(null, 'read-only', ctx), false);

  const dir = fixtureDir('fgos-posture-reg-');
  const write = (name, doc) => { const p = path.join(dir, name); fs.writeFileSync(p, JSON.stringify(doc)); return p; };
  const reg = (instance) => ({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: instance } });
  const base = { executor: 'confined', invocation: 'cli-bwrap' };
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('missing-exe.json', reg({ type: 'bwrap', enabled: true, executable: '/nonexistent/bwrap' })) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('disabled.json', reg({ type: 'bwrap', enabled: false, executable: '/usr/bin/bwrap' })) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: write('empty.json', { contract: 'confinement-backend-registry.v1', confinementBackends: {} }) }), false);
  assert.equal(canApplyPosture(base, 'read-only', { executors, registryPath: path.join(dir, 'malformed.json') }), false);
});

test('guard: policies.mjs builds no sandbox arguments of its own', () => {
  const src = fs.readFileSync(path.resolve('src/runner/dispatch/confinement/policies.mjs'), 'utf8');
  assert.ok(!/bwrapArgs/.test(src), 'sandbox argv belongs to the bwrap driver only');
});
