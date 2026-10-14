// test/runner/spawn-worker.test.mjs — spawnWorker runs a Work item's worker as one Unit run
// (runUnit) in the item's worktree and maps what that run settled onto the fields and error
// classes the runner loop reads. The worker is a real confined (bwrap) process; the limits it
// meets (time budget, idle budget, output budget, nested-dispatch depth, process-group kill) are
// enforced by the cli-spawn launch every Unit run goes through.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { spawnWorker } from '../../src/runner/work-dispatch.mjs';
import { buildPrompt } from '../../src/runner/work-compat.mjs';
import { DispatchError } from '../../src/runner/dispatch/dispatch-error.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { MAX_DISPATCH_DEPTH } from '../../src/runner/dispatch/transport.mjs';
import { resolveAction } from '../../src/runner/recovery.mjs';
import { confinedRunnerConfig, persistRunnerConfig, unitRuns, countWorkerRuns } from './loop-worker-fixture.helper.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const DISPATCH_DEPTH_ENV = 'FGOS_DISPATCH_DEPTH';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function sampleWork(overrides = {}) {
  return {
    id: 'sample-work',
    title: 'Add the widget',
    kind: 'feature',
    status: 'doing',
    deps: [],
    risk: 'light',
    refs: ['src/widget.mjs', 'docs/specs/widget.md'],
    verify: 'npm test',
    ...overrides,
  };
}

function writeScript(dir, name, body) {
  const scriptPath = path.join(dir, `${name}.mjs`);
  fs.writeFileSync(scriptPath, body);
  return scriptPath;
}

/**
 * A repo with the item's linked worktree, and `config` (completed with a confined invocation per
 * executor) on disk, where runUnit reads it. `run(work, opts)` calls spawnWorker the way the loop
 * does: in that worktree, with the repo's `.fgos` as `fgosDir`.
 */
function fixture(config) {
  const repoRoot = fs.realpathSync(makeFixtureDir('fgos-spawn-worker-repo-'));
  git(repoRoot, 'init', '-q', '-b', 'main');
  git(repoRoot, 'config', 'user.email', 'test@example.com');
  git(repoRoot, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  git(repoRoot, 'add', 'seed.txt');
  git(repoRoot, 'commit', '-q', '-m', 'seed');
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir);
  const worktree = path.join(fs.realpathSync(makeFixtureDir('fgos-spawn-worker-wt-')), 'sample-work');
  git(repoRoot, 'worktree', 'add', '-q', '-b', 'fgw/sample-work', worktree);
  const cfg = confinedRunnerConfig(config);
  persistRunnerConfig(repoRoot, cfg);
  return {
    repoRoot, fgosDir, worktree, cfg,
    run: (work = sampleWork(), opts = {}) => spawnWorker(work, cfg, worktree, { fgosDir, ...opts }),
  };
}

const scriptDir = () => fs.realpathSync(makeFixtureDir('fgos-spawn-worker-exec-'));

function baseConfig(executorArgs, extra = {}) {
  return {
    // bind picks the model from the executor's declared provider.
    executor: { command: process.execPath, args: executorArgs, providerModel: 'node' },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' }, node: { nano: 'haiku', standard: 'sonnet', frontier: 'opus' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 20000,
    ...extra,
  };
}

// Printed after a word, not as a bare JSON object: a bare object on stdout reads as the agent's
// own result claim. It also writes a file: a writing Unit whose worker changed nothing and
// claimed nothing settles inconclusive.
const ECHO = `import fs from 'node:fs';\nfs.writeFileSync('echo.txt', 'echo\\n');\nprocess.stdout.write('echo ' + JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd() }));\n`;
const echoed = (stdout) => JSON.parse(stdout.slice(stdout.indexOf('{')));

test('spawnWorker runs the item worker as a Unit run in its worktree: tier -> model, the objective is the worker prompt, and the run is named', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}', '--model', '{model}']));
  const work = sampleWork({ rigor: 'critical' });

  const result = await fx.run(work);

  assert.equal(result.status, 0);
  assert.equal(result.tier, 'frontier');
  assert.equal(result.model, 'opus');
  const payload = echoed(result.stdout);
  assert.equal(fs.realpathSync(payload.cwd), fx.worktree, 'the worker ran in the item worktree');
  assert.deepEqual(payload.args.slice(-2), ['--model', 'opus']);
  const [run] = unitRuns(fx.repoRoot);
  assert.equal(result.unitRunId, run.unitRunId);
  assert.equal(run.record.unit.objective, buildPrompt(work).trim(), 'the Unit objective is exactly the worker prompt');
  assert.ok(payload.args[0].includes(buildPrompt(work).trim()), 'and the prompt the worker got carries it');
});

test('spawnWorker reports the template its prompt was rendered from, for the executing step and for discovery', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}']));

  const executing = await fx.run(sampleWork());
  assert.equal(executing.templateName, 'worker-prompt-skill-pointer.txt');
  assert.equal(typeof executing.templateHash, 'string');

  const discovery = await fx.run(sampleWork(), { stage: 'discovery' });
  assert.equal(discovery.templateName, 'worker-prompt-discovery.txt');
  const record = unitRuns(fx.repoRoot).find((r) => r.unitRunId === discovery.unitRunId).record;
  assert.equal(record.unit.objective, buildPrompt(sampleWork(), undefined, 'discovery').trim());
  assert.ok(record.unit.objective.includes('.claude/skills/fgos-coding-discovering/SKILL.md'));
});

test('spawnWorker defaults to the standard tier when the work item declares no rigor', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}']));
  const result = await fx.run();
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
});

test('spawnWorker prints one "fgos: dispatch ..." line naming the unit run, executor, transport, model, tier and outcome', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}']));
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => { captured += chunk; return true; };
  let result;
  try {
    result = await fx.run();
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, new RegExp(`fgos: dispatch unit=${result.unitRunId} executor=fgos-coding-implement via=cli model=sonnet tier=standard outcome=pass`));
});

test('spawnWorker result names what really ran: executor, provider, command, and the attested worktree commit and branch', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}']));
  fs.writeFileSync(path.join(fx.worktree, 'second.txt'), 'second\n');
  git(fx.worktree, 'add', 'second.txt');
  git(fx.worktree, 'commit', '-q', '-m', 'second');
  const worktreeHead = git(fx.worktree, 'rev-parse', 'HEAD');

  const result = await fx.run();

  assert.equal(result.executorId, 'fgos-coding-implement');
  assert.equal(result.provider, process.execPath);
  assert.equal(result.command, process.execPath);
  assert.equal(result.baseCommit, worktreeHead, 'the commit the worker started from in its own worktree');
  assert.notEqual(result.baseCommit, git(fx.repoRoot, 'rev-parse', 'HEAD'), 'never the main checkout head');
  assert.equal(result.headRef, 'fgw/sample-work');
  assert.equal(result.attestation.confinement, 'bwrap');
  assert.equal(result.attestation.adapter, 'cli-spawn');
});

test('spawnWorker: the runner commits what the worker left (commit "runner"); a worker that changes nothing leaves commit "none"', async () => {
  const dir = scriptDir();
  const writing = writeScript(dir, 'writing', `import fs from 'node:fs';\nfs.writeFileSync('widget.txt', 'widget\\n');\n`);
  const fx = fixture(baseConfig([writing, '{prompt}']));
  const before = git(fx.worktree, 'rev-parse', 'HEAD');

  const wrote = await fx.run();
  assert.equal(wrote.commit, 'runner');
  assert.equal(wrote.runnerCommit.status, 'committed');
  assert.deepEqual(wrote.runnerCommit.files, ['widget.txt']);
  assert.equal(git(fx.worktree, 'rev-parse', 'HEAD'), wrote.runnerCommit.sha);
  assert.notEqual(wrote.runnerCommit.sha, before);

  // Changed nothing and claimed nothing: the round settles inconclusive, nothing is committed,
  // and the loop's goal-check then finds no commit (verify-miss).
  const silent = writeScript(dir, 'silent', 'process.exit(0);\n');
  const fx2 = fixture(baseConfig([silent, '{prompt}']));
  const none = await fx2.run();
  assert.equal(none.status, 0);
  assert.equal(none.commit, 'none');
  assert.equal(none.runnerCommit, null);
});

test('spawnWorker surfaces a non-zero exit without throwing and commits nothing (goal-check decides, not dispatch)', async () => {
  const failing = writeScript(scriptDir(), 'failing', `import fs from 'node:fs';\nfs.writeFileSync('half.txt', 'half\\n');\nprocess.exit(7);\n`);
  const fx = fixture(baseConfig([failing, '{prompt}']));
  const before = git(fx.worktree, 'rev-parse', 'HEAD');

  const result = await fx.run();

  assert.equal(result.status, 7);
  assert.equal(result.commit, 'none');
  assert.equal(git(fx.worktree, 'rev-parse', 'HEAD'), before, 'a failed round is never committed');
});

test('spawnWorker throws worker-timeout past the time budget and keeps what the worker printed before the kill', async () => {
  const hanging = writeScript(scriptDir(), 'hanging', `process.stdout.write('partial stdout before hang');\nprocess.stderr.write('partial stderr before hang');\nconst until = Date.now() + 30000;\nwhile (Date.now() < until) { /* busy-wait */ }\n`);
  const fx = fixture(baseConfig([hanging], { timeoutMs: 3000 }));

  await assert.rejects(() => fx.run(), (err) => {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-timeout');
    assert.match(err.unitRunId, /^unit-run-/);
    assert.equal(err.stdout, 'partial stdout before hang');
    assert.match(err.stderr, /partial stderr before hang/);
    return true;
  });
});

test('spawnWorker throws worker-spawn-fail when the configured command does not exist', async () => {
  const fx = fixture({
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
    timeoutMs: 20000,
  });
  await assert.rejects(() => fx.run(), (err) => {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-spawn-fail');
    assert.equal(err.stdout, '', 'nothing was ever printed');
    return true;
  });
});

test('spawnWorker: a worker printing past the output budget is killed, and what it printed before is kept', async () => {
  const chatty = writeScript(scriptDir(), 'chatty', `const chunk = 'x'.repeat(1024);\nlet i = 0;\nconst t = setInterval(() => { process.stdout.write(chunk); i += 1; if (i > 400) clearInterval(t); }, 5);\n`);
  const fx = fixture(baseConfig([chatty], { maxBuffer: 4096 }));

  const outcome = await fx.run().then((r) => ({ r }), (err) => ({ err }));
  const stdout = outcome.err?.stdout ?? outcome.r?.stdout ?? '';
  assert.ok(stdout.length > 0, 'output before the kill is kept');
  assert.ok(stdout.length < 401 * 1024, 'the worker did not run to the end');
  if (outcome.r) assert.notEqual(outcome.r.status, 0, 'a killed worker never reports success');
});

test('the process GROUP is killed on timeout: a grandchild the worker itself started does not survive', async () => {
  const spawner = writeScript(scriptDir(), 'grandchild', `import { spawn } from 'node:child_process';
const grandchild = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000);'], { stdio: 'ignore' });
grandchild.unref();
process.stdout.write('grandchild=' + grandchild.pid + '\\n');
const until = Date.now() + 30000;
while (Date.now() < until) { /* busy-wait */ }
`);
  const fx = fixture(baseConfig([spawner], { timeoutMs: 3000 }));

  let stdout = '';
  await assert.rejects(() => fx.run(), (err) => {
    assert.equal(err.errorClass, 'worker-timeout');
    stdout = err.stdout;
    return true;
  });

  const grandchildPid = Number(/grandchild=(\d+)/.exec(stdout)?.[1]);
  assert.ok(grandchildPid > 0, `the worker reported its grandchild: ${JSON.stringify(stdout)}`);
  let alive = true;
  for (const deadline = Date.now() + 30_000; alive && Date.now() < deadline;) {
    try {
      process.kill(grandchildPid, 0);
      await new Promise((r) => setTimeout(r, 50));
    } catch {
      alive = false;
    }
  }
  assert.equal(alive, false, 'the grandchild died with the worker process group');
});

test('idleTimeoutMs kills a worker that went silent well before the hard cap; unset, only the hard cap applies; output resets it', async () => {
  const dir = scriptDir();
  const silent = writeScript(dir, 'goes-silent', `process.stdout.write('alive\\n');\nconst until = Date.now() + 30000;\nwhile (Date.now() < until) { /* no more output */ }\n`);
  const idle = fixture(baseConfig([silent], { timeoutMs: 20000, idleTimeoutMs: 1500 }));
  const start = Date.now();
  await assert.rejects(() => idle.run(), (err) => {
    assert.equal(err.errorClass, 'worker-timeout');
    assert.equal(err.stdout, 'alive\n');
    return true;
  });
  assert.ok(Date.now() - start < 12000, 'the idle budget fired well before the 20s hard cap');

  const hardOnly = fixture(baseConfig([silent], { timeoutMs: 2500 }));
  await assert.rejects(() => hardOnly.run(), (err) => err.errorClass === 'worker-timeout');

  const periodic = writeScript(dir, 'periodic', `let i = 0;\nconst t = setInterval(() => { process.stdout.write('tick-' + i + '\\n'); i += 1; if (i >= 6) { clearInterval(t); process.exit(0); } }, 300);\n`);
  const resets = fixture(baseConfig([periodic], { timeoutMs: 20000, idleTimeoutMs: 1500 }));
  const result = await resets.run();
  assert.equal(result.status, 0, 'a worker printing more often than the idle budget completes');
  assert.match(result.stdout, /tick-5/);
});

test('spawnWorker threads a dispatch depth of 1 into a fresh worker, and refuses at the cap without starting one (classified park)', async () => {
  const depthEcho = writeScript(scriptDir(), 'depth', `import fs from 'node:fs';\nfs.writeFileSync('ran.txt', 'ran\\n'); process.stdout.write('depth ' + JSON.stringify({ depth: process.env.FGOS_DISPATCH_DEPTH ?? '0' }));\n`);
  const fx = fixture(baseConfig([depthEcho]));
  const prior = process.env[DISPATCH_DEPTH_ENV];
  try {
    delete process.env[DISPATCH_DEPTH_ENV];
    const fresh = await fx.run();
    assert.deepEqual(echoed(fresh.stdout), { depth: '1' });

    process.env[DISPATCH_DEPTH_ENV] = String(MAX_DISPATCH_DEPTH);
    let caught;
    await assert.rejects(() => fx.run(), (err) => {
      caught = err;
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'dispatch-depth-exceeded');
      return true;
    });
    // The refused attempt is recorded, but only the fresh run's worker ever printed.
    const printed = unitRuns(fx.repoRoot).filter(({ unitRunId }) => {
      const runs = path.join(fx.repoRoot, '.fgos', 'assignments', unitRunId, 'producer', '1', 'runs');
      return fs.existsSync(runs) && fs.readdirSync(runs).some((n) => {
        const log = path.join(runs, n, 'stdout.log');
        return fs.existsSync(log) && fs.readFileSync(log, 'utf8').includes('depth ');
      });
    });
    assert.equal(printed.length, 1, 'no worker started at the cap');
    assert.deepEqual(resolveAction(caught.errorClass, 1), { action: 'park', errorClass: 'dispatch-depth-exceeded' });
  } finally {
    if (prior === undefined) delete process.env[DISPATCH_DEPTH_ENV];
    else process.env[DISPATCH_DEPTH_ENV] = prior;
  }
});

test('spawnWorker does not hand the Rust host recursion guard to the worker, and keeps the rest of the environment', async () => {
  const guardEcho = writeScript(scriptDir(), 'guard', `import fs from 'node:fs';\nfs.writeFileSync('ran.txt', 'ran\\n'); process.stdout.write('guard ' + JSON.stringify({ guard: process.env.FGOS_RUST_HOST_RECURSION_GUARD ?? null, kept: process.env.FGOS_GUARD_TEST_KEPT ?? null }));\n`);
  const fx = fixture(baseConfig([guardEcho]));
  const prior = { guard: process.env.FGOS_RUST_HOST_RECURSION_GUARD, kept: process.env.FGOS_GUARD_TEST_KEPT };
  process.env.FGOS_RUST_HOST_RECURSION_GUARD = '1';
  process.env.FGOS_GUARD_TEST_KEPT = 'yes';
  try {
    const result = await fx.run();
    assert.deepEqual(echoed(result.stdout), { guard: null, kept: 'yes' });
  } finally {
    for (const [key, value] of [['FGOS_RUST_HOST_RECURSION_GUARD', prior.guard], ['FGOS_GUARD_TEST_KEPT', prior.kept]]) {
      if (value !== undefined) process.env[key] = value;
      else delete process.env[key];
    }
  }
});

test('spawnWorker passes an executor\'s own resolved env to the worker, never into the host', async () => {
  const envEcho = writeScript(scriptDir(), 'env-echo', `import fs from 'node:fs';\nfs.writeFileSync('ran.txt', 'ran\\n'); process.stdout.write('env ' + JSON.stringify({ BASE_URL: process.env.ANTHROPIC_BASE_URL, AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN, API_KEY: process.env.ANTHROPIC_API_KEY }));\n`);
  const originalKey = process.env.GLM_OPENROUTER_API_KEY;
  process.env.GLM_OPENROUTER_API_KEY = 'secret-test-key-12345';
  try {
    const env = { ANTHROPIC_BASE_URL: 'https://openrouter.ai/api', ANTHROPIC_AUTH_TOKEN: '${GLM_OPENROUTER_API_KEY}', ANTHROPIC_API_KEY: '' };
    const fx = fixture({
      executors: {
        glm: {
          kind: 'agent', command: process.execPath, args: [envEcho], allowCrossProvider: true, env,
          invocations: [{ id: 'cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [envEcho], env }],
        },
      },
      capabilities: { 'code:implement': { prefer: [{ executor: 'glm' }] } },
      modelPolicies: { claude: { standard: 'sonnet' }, node: { standard: 'sonnet' } },
      timeoutMs: 20000,
    });

    const result = await fx.run();

    assert.equal(result.executorId, 'glm');
    const output = echoed(result.stdout);
    assert.equal(output.BASE_URL, 'https://openrouter.ai/api');
    assert.equal(output.AUTH_TOKEN, 'secret-test-key-12345');
    assert.equal(output.API_KEY, '');
    assert.equal(process.env.ANTHROPIC_BASE_URL, undefined, 'the host environment is untouched');
  } finally {
    if (originalKey !== undefined) process.env.GLM_OPENROUTER_API_KEY = originalKey;
    else delete process.env.GLM_OPENROUTER_API_KEY;
  }
});

test('spawnWorker applies the capability rigor as a raise-only tier floor', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const args = [echo, '{prompt}', '--model', '{model}'];
  const fx = fixture({
    executors: {
      agy: {
        kind: 'agent', command: process.execPath, args, providerModel: 'gemini', allowCrossProvider: true,
        invocations: [{ id: 'cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args }],
      },
    },
    capabilities: { 'code:implement': { prefer: [{ executor: 'agy' }], rigor: 'high' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { claude: { standard: 'sonnet' }, gemini: { standard: 'gemini-flash', flagship: 'gemini-pro' } },
    timeoutMs: 20000,
  });

  const result = await fx.run(sampleWork({ domain: 'coding' }));

  assert.equal(result.executorId, 'agy');
  assert.equal(result.model, 'gemini-pro');
  assert.deepEqual(echoed(result.stdout).args.slice(-2), ['--model', 'gemini-pro']);
});

test('spawnWorker rejects a work item it cannot turn into a Unit before any worker starts', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  const fx = fixture(baseConfig([echo, '{prompt}']));
  await assert.rejects(() => fx.run(sampleWork({ id: undefined })), RunnerConfigError);
  assert.equal(countWorkerRuns(fx.repoRoot), 0);
  assert.equal(unitRuns(fx.repoRoot).length, 0, 'no Unit run was even created');
});

test('spawnWorker refuses with confinement-policy-error when no executor may run the Unit, and nothing starts', async () => {
  const echo = writeScript(scriptDir(), 'echo', ECHO);
  // A pool exists, but its only executor declares no confinement, so it cannot write.
  const fx = fixture(baseConfig([echo, '{prompt}']));
  const cfg = JSON.parse(fs.readFileSync(path.join(fx.repoRoot, '.fgos', 'config.json'), 'utf8'));
  for (const entry of Object.values(cfg.runner.executors)) delete entry.invocations;
  fs.writeFileSync(path.join(fx.repoRoot, '.fgos', 'config.json'), JSON.stringify(cfg));

  await assert.rejects(() => fx.run(), (err) => {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'confinement-policy-error');
    assert.match(err.message, /posture-unavailable/);
    return true;
  });
  assert.equal(countWorkerRuns(fx.repoRoot), 0);
  assert.equal(resolveAction('confinement-policy-error', 1).action, 'halt', 'a config that can run nothing stops the runner, as before');
});
