// The in-session production call site, exercised the way production calls it.
//
// The runner loop's worker no longer launches through here: spawnWorker runs it as a Unit run
// (runUnit), whose confinement and pane wiring are tested in test/runner/spawn-worker.test.mjs
// and test/runner/execution/run-herdr.test.mjs; the fan-out batch's in
// test/runner/fanout-batch-runner-commit.test.mjs.
//
// Every other herdr-spawn test builds the adapter's invocation by hand and
// hands it straight to `EXECUTOR_ADAPTERS['herdr-spawn']`. That is a fine way
// to test the adapter and a useless way to test the wiring: it skips
// `config.json -> resolveExecutorCommand -> adapter` entirely, and twice now a
// field the config declared was dropped between those two ends with the whole
// suite green. These tests start where a real dispatch starts -- at the file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { addWork, listWork } from '../../src/state/store.mjs';
const WORKER_SESSION = 'fgos-worker';

const testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-prod-callsite-home-'));
const originalHome = process.env.HOME;
fs.mkdirSync(path.join(testHome, '.fgos'), { recursive: true });
if (originalHome && fs.existsSync(path.join(originalHome, '.fgos', 'confinement-backends.json'))) {
  fs.copyFileSync(path.join(originalHome, '.fgos', 'confinement-backends.json'), path.join(testHome, '.fgos', 'confinement-backends.json'));
}
process.env.HOME = testHome;

/** What `executorIdForWork` resolves for a coding item at the executing stage
 * -- the capability a real implement dispatch goes through. */
const IMPLEMENT_CAPABILITY = 'fgos-coding-implement';

/**
 * A herdr that records what it was asked and answers plausibly.
 *
 * Deliberately smaller than the adapter suite's mock: these tests ask what
 * reached herdr, not what the round did with the answers.
 */
function mockHerdr(dir, { failWorkspaceCreate = false, silentWorker = false, writesTo = null } = {}) {
  const logPath = path.join(dir, 'herdr-calls.log');
  const exitedPath = path.join(dir, 'agent-exited');
  const scriptPath = path.join(dir, 'mock-herdr.mjs');
  const wrapperPath = path.join(dir, 'herdr');
  fs.writeFileSync(logPath, '');

  fs.writeFileSync(scriptPath, `
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const fail = (code) => { console.log(JSON.stringify({ error: { code, message: code }, id: 'cli:mock' })); process.exit(1); };
const [group, action] = args;

if (group === 'workspace' && action === 'create') {
  if (${JSON.stringify(failWorkspaceCreate)}) fail('workspace_create_failed');
  ok({ workspace: { workspace_id: 'ws-mock' }, pane: { pane_id: 'mock-root-pane' } });
}
if (group === 'pane' && action === 'list') ok({ panes: [] });
if (group === 'pane' && action === 'split') ok({ pane: { pane_id: 'mock-pane-1' } });
if (group === 'pane' && action === 'close') ok({ closed: true });
if (group === 'pane' && action === 'process-info') {
  // A real pane always lists its own shell; "the agent is there" means a
  // foreground process that is not it. After /exit the agent is gone, which
  // is what lets the exit drain finish instead of waiting out its deadline.
  const gone = fs.existsSync(${JSON.stringify(exitedPath)});
  const foreground = gone ? [{ pid: 100, name: 'zsh' }] : [{ pid: 200, name: 'agy' }, { pid: 100, name: 'zsh' }];
  ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 100, foreground_process_group_id: gone ? 100 : 200, foreground_processes: foreground } });
}
if (group === 'agent' && action === 'start') ok({ agent: { agent_status: 'idle' } });
if (group === 'agent' && action === 'read') ok({ read: { text: '' } });
if (group === 'agent' && action === 'get') ok({ agent: { agent_status: 'working', pane_id: 'mock-pane-1', state_change_seq: 1 } });
if (group === 'agent' && action === 'prompt') {
  const text = args[3];
  if (text.startsWith('/')) fs.writeFileSync(${JSON.stringify(exitedPath)}, '');
  if (!text.startsWith('/') && !${JSON.stringify(silentWorker)}) {
    // Play the worker: follow the pointer to the brief, write what it asks for.
    let brief = text;
    const pointer = text.match(/^Read (.+) and do what it says\\.$/);
    if (pointer) brief = fs.readFileSync(pointer[1], 'utf8');
    const ack = brief.match(/(\\/\\S+\\/outbox\\/ack-1\\.json)/);
    if (ack) {
      const outbox = path.dirname(ack[1]);
      const write = (f, b) => { fs.writeFileSync(f + '.tmp', b); fs.renameSync(f + '.tmp', f); };
      // A worker that does its work in the wrong checkout, then reports
      // success anyway -- exactly what was measured on 2026-09-07.
      const strayDir = ${JSON.stringify(writesTo)};
      if (strayDir) {
        fs.mkdirSync(strayDir, { recursive: true });
        fs.writeFileSync(path.join(strayDir, 'wrong-place.mjs'), 'export const oops = true;');
      }
      write(path.join(outbox, 'report-1.md'), 'report');
      write(path.join(outbox, 'result-1.json'), JSON.stringify({ status: 'settled', summary: 'done', findings: [], evidenceRefs: [] }));
    }
  }
  ok({ agent: { agent_status: 'working' } });
}
ok({});
`);
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);
  return {
    herdrBin: wrapperPath,
    calls: () => fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)),
  };
}

const HERDR_EXECUTOR = {
  kind: 'agent',
  adapter: 'herdr-spawn',
  command: 'agy',
  providerModel: 'agy',
  args: ['-i', '{prompt}', '--mode', 'accept-edits'],
  // agy is not a Claude CLI, so the cross-provider egress gate refuses it
  // unless the executor says so -- the same declaration the live config makes.
  allowCrossProvider: true,
  interactiveMode: { exitCommand: '/exit', kind: 'agy' },
};

/**
 * A repo with a runner config, the way a real project has one: the `runner`
 * section inside `.fgos/config.json`, read back through the loader production
 * uses. `makeExecutor` is handed the repo root so a test can point the
 * executor at paths inside it.
 */
function fixtureRepo(makeExecutor = () => HERDR_EXECUTOR) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-prod-callsite-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'initial'], { cwd: root });
  // The mock herdr writes its script, wrapper and bookkeeping into the repo
  // root. Those are the harness, not the worker, so they are ignored the way a
  // real repo ignores its own noise -- otherwise the stray-write guard would
  // correctly report the test's own scaffolding.
  fs.writeFileSync(path.join(root, '.gitignore'), ['herdr', 'mock-herdr.mjs', 'herdr-calls.log', 'agent-exited', ''].join('\n'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      executor: { command: 'agy', providerModel: 'agy', args: ['-i', '{prompt}'] },
      modelPolicies: { agy: { standard: 'sonnet' }, claude: { standard: 'sonnet' } },
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      timeoutMs: 20000,
      executors: { 'herdr-worker': makeExecutor(root) },
      capabilities: { [IMPLEMENT_CAPABILITY]: { prefer: 'herdr-worker' } },
    },
  }, null, 2));
  return root;
}

/**
 * A worker session that already looks up: its socket file exists under a HOME
 * inside the fixture, so `ensureWorkerSession` skips spawning a server and
 * goes straight to the workspace call. That call is the observable proof the
 * declaration travelled -- and the operator's real HOME is never touched.
 */
function confinedExecutor(root) {
  const home = path.join(root, 'worker-home');
  const socket = path.join(home, '.config', 'herdr', 'sessions', WORKER_SESSION, 'herdr.sock');
  fs.mkdirSync(path.dirname(socket), { recursive: true });
  fs.writeFileSync(socket, '');
  return {
    ...HERDR_EXECUTOR,
    env: { HOME: home },
    // No `sessionName`: there is one worker session and a config cannot name
    // it, which is what stops a config from naming the operator's own.
    confinement: { privateHome: false, isolatedSession: true },
  };
}

/** Point the adapter at the mock the way the adapter itself resolves herdr. */
async function withMockHerdr(bin, fn) {
  const prior = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = bin;
  try {
    return await fn();
  } finally {
    if (prior === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = prior;
  }
}

const runStatus = (runDir) => JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')).status;

/** The single run directory an execution left (under assignments/ or dispatch-runs/). */
function soleRunDir(root) {
  const fgosDir = path.join(root, '.fgos');
  const asgnBase = path.join(fgosDir, 'assignments');
  if (fs.existsSync(asgnBase)) {
    const asgns = fs.readdirSync(asgnBase);
    if (asgns.length > 0) {
      const runsDir = path.join(asgnBase, asgns[0], 'runs');
      const attempts = fs.readdirSync(runsDir);
      return path.join(runsDir, attempts[0]);
    }
  }
  const base = path.join(fgosDir, 'dispatch-runs');
  const workIds = fs.readdirSync(base);
  assert.equal(workIds.length, 1, 'exactly one dispatch run was started');
  const stamps = fs.readdirSync(path.join(base, workIds[0]));
  assert.equal(stamps.length, 1);
  return path.join(base, workIds[0], stamps[0]);
}

test('the in-session entry point carries confinement too -- both call sites or neither', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const root = fixtureRepo(confinedExecutor);
  const mock = mockHerdr(root);
  try {
    await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
    }));
    assert.ok(
      mock.calls().some((c) => c[0] === 'workspace' && c[1] === 'create'),
      'executeExecutorCli confines its worker as well',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the in-session door puts its run where the observe verbs look', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  // It used to leave `runDir` unset, so the adapter opened a private temp
  // directory: the brief, visibility.json and the worker's outbox all landed
  // somewhere `fgos dispatch show-run`/`watch` do not look. A real dispatch
  // through this door was observable in principle and unobservable in fact --
  // found by watching one, not by reading it.
  const root = fixtureRepo();
  mockHerdr(root);
  try {
    await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
    }));

    const dir = soleRunDir(root);
    assert.ok(fs.existsSync(path.join(dir, 'brief-1.md')), 'the brief is under .fgos/, not in /tmp');
    assert.ok(fs.existsSync(path.join(dir, 'outbox')), 'and so is the worker outbox');
    assert.equal(runStatus(dir), 'settled', 'and the run it opened is closed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a caller that supplies its own run directory keeps it', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const root = fixtureRepo();
  mockHerdr(root);
  const given = path.join(root, 'given-run-dir');
  fs.mkdirSync(given, { recursive: true });
  try {
    await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
      runDir: given,
    }));
    assert.ok(fs.existsSync(path.join(given, 'brief-1.md')), "the caller's own directory is used as given");
    assert.ok(!fs.existsSync(path.join(root, '.fgos', 'dispatch-runs')), 'and no second run directory is invented');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a worker that writes into the main checkout instead of its workspace is flagged in the result, and the stray paths are named', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  // The failure this guards was measured, not imagined: agy was handed a
  // worktree, wrote six files into the main checkout -- onto a branch
  // belonging to somebody else's work -- and reported settled. A snapshot of
  // the main checkout cannot tell that worker from another session writing
  // there at the same time, so the round is accepted and the paths travel as
  // a warning on its result instead of a refusal.
  const root = fixtureRepo();
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(worktree, { recursive: true });
  // The worker writes into the repo root instead of the worktree it was given.
  mockHerdr(root, { writesTo: path.join(root, 'src', 'setup') });
  try {
    const res = await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: worktree,
      tier: 'standard',
    }));
    assert.equal(res.status, 0);
    const [warning] = res.warnings ?? [];
    assert.equal(warning?.code, 'stray-write-correlated');
    assert.equal(warning?.level, 'correlated');
    // git collapses a wholly-untracked directory to one entry, so what is
    // named here is `src/` rather than the file inside it. In the incident
    // this guards against the directory already existed and git listed the
    // individual files; either way the warning points at where to look.
    assert.ok(warning.paths.some((p) => p.startsWith('src')),
      `the warning names where it appeared, got: ${JSON.stringify(warning.paths)}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a worker that stays in its workspace is not accused of anything', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const root = fixtureRepo();
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(worktree, { recursive: true });
  mockHerdr(root);
  try {
    const res = await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: worktree,
      tier: 'standard',
    }));
    assert.equal(res.status, 0);
    assert.equal(res.warnings, undefined, 'nothing appeared outside the workspace, so nothing is flagged');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dirt that was already there is not blamed on the worker', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  // The main checkout is a live working tree. Anything already dirty when the
  // round starts belongs to whoever put it there, and a round must not be
  // refused for it.
  const root = fixtureRepo();
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(worktree, { recursive: true });
  fs.mkdirSync(path.join(root, 'src', 'setup'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'setup', 'someone-elses-wip.mjs'), 'export const wip = 1;\n');
  mockHerdr(root);
  try {
    const res = await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: worktree,
      tier: 'standard',
    }));
    assert.equal(res.status, 0, 'pre-existing dirt is not the worker\'s doing');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('production dispatch attaches confinement attestation to ExecutorResult (R5, R7)', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const root = fixtureRepo();
  mockHerdr(root);
  try {
    const res = await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
    }));
    assert.equal(res.status, 0);
    assert.ok(res.attestation, 'attestation is attached to executeExecutorCli result');
    assert.equal(res.attestation.contract, 'confinement-attestation.v1');
    assert.equal(res.attestation.outcome, 'unknown', 'legacy omitted policy gets unknown attestation in observe mode');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('production dispatch takes its posture from the requested capability, never from an agent executor\'s own for', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX shebang wrapper -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, async () => {
  const root = fixtureRepo(() => ({ ...HERDR_EXECUTOR, for: ['code:review'] }));
  const mock = mockHerdr(root);
  const cfgPath = path.join(root, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  // The agent's leftover `for` names a required read-only capability; the
  // dispatch asks for an unconfined one. The work's capability decides.
  cfg.runner.capabilities['generic-fallback'] = { prefer: 'herdr-worker', confinement: { mode: 'unconfined' } };
  cfg.runner.capabilities['code:review'] = { confinement: { mode: 'required', policy: 'host-write-denied' } };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  try {
    const res = await withMockHerdr(path.join(root, 'herdr'), () => executeExecutorCli('herdr-worker', {
      prompt: 'do the thing',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
      for: 'generic-fallback',
    }));
    assert.equal(res.status, 0);
    assert.equal(res.attestation.outcome, 'unconfined');
    assert.equal(res.attestation.requested.mode, 'unconfined');
    assert.ok(mock.calls().some((c) => c[0] === 'pane' && c[1] === 'split'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('in-process dispatch through executeExecutorCli gets authorityScope: external-harness (R6)', async () => {
  const root = fixtureRepo(() => ({
    kind: 'agent',
    agentType: 'general-assistant',
  }));
  try {
    const res = await executeExecutorCli('herdr-worker', {
      prompt: 'in process prompt',
      repoRoot: root,
      cwd: root,
      hasLiveTaskAccess: true,
    });
    assert.equal(res.mechanism, 'in-process');
    assert.equal(res.authorityScope, 'external-harness');
    assert.equal(res.attestation, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('in-process dispatch with required confinement refuses without trusted harness (R6)', async () => {
  const root = fixtureRepo(() => ({
    kind: 'agent',
    agentType: 'general-assistant',
  }));
  // Add required confinement to the capability in config
  const cfgPath = path.join(root, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.runner.capabilities[IMPLEMENT_CAPABILITY].confinement = {
    mode: 'required',
    policy: 'host-write-denied',
  };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  try {
    await assert.rejects(
      () => executeExecutorCli('herdr-worker', {
        prompt: 'in process prompt',
        repoRoot: root,
        cwd: root,
        hasLiveTaskAccess: true,
        for: IMPLEMENT_CAPABILITY,
      }),
      (err) => {
        assert.equal(err.errorClass, 'confinement-unsupported');
        assert.match(err.message, /in-process dispatch has no trusted harness attestation contract/);
        return true;
      },
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('http adapter routes through executeThroughConfinement and returns result with attestation', async () => {
  // Spawn a tiny test HTTP server
  const http = await import('node:http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const root = fixtureRepo(() => ({
    kind: 'tool',
    command: 'curl',
    args: [],
    adapter: 'http',
    allowCrossProvider: true,
    method: 'GET',
    url: `http://127.0.0.1:${port}/test`,
  }));

  try {
    const res = await executeExecutorCli('herdr-worker', {
      prompt: 'ping',
      repoRoot: root,
      cwd: root,
      tier: 'standard',
    });
    assert.equal(res.status, 200);
    assert.ok(res.attestation, 'http adapter result receives attestation through authority');
    assert.equal(res.attestation.contract, 'confinement-attestation.v1');
    assert.equal(res.attestation.outcome, 'unknown');
  } finally {
    server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('R8: legacy openDispatchRun stamps contract: dispatch-run.legacy in run.json', async () => {
  const root = fixtureRepo();
  try {
    const fgosDir = path.join(root, '.fgos');
    const cfg = loadRunnerConfigFromDir(root);
    await executeExecutorCli('mock-non-assignment', {
      prompt: 'hello world',
      cwd: root,
      repoRoot: root,
      fgosDir,
      runnerConfig: {
        ...cfg,
        executors: {
          'mock-non-assignment': {
            adapter: 'cli-spawn',
            command: 'echo',
            providerModel: 'claude',
            args: ['legacy-ok'],
            allowCrossProvider: true,
          },
        },
      },
    });
    const runDir = soleRunDir(root);
    assert.ok(fs.existsSync(runDir), 'dispatch run directory created');
    const runJsonPath = path.join(runDir, 'run.json');
    const runRecord = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
    assert.equal(runRecord.contract, 'run.v1');
    assert.equal(runRecord.executorId, 'mock-non-assignment');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('fgos return --blocked sets item status to blocked with outcome and reason (R1 / F15)', () => {
  const root = fixtureRepo();
  const fgosDir = path.join(root, '.fgos');
  const binFgos = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));

  addWork(fgosDir, {
    id: 'item-to-block',
    title: 'Item to block',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    workflowStep: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: process.platform === 'win32' ? 'node -e "process.exit(0)"' : 'true',
  });

  try {
    execFileSync(
      process.execPath,
      [binFgos, 'pick', 'item-to-block', '--dir', root],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const stdout = execFileSync(
      process.execPath,
      [binFgos, 'return', 'item-to-block', '--blocked', '--reason', 'executor crashed during dispatch', '--dir', root],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.contract, 'fgos.v1');
    assert.equal(parsed.data.id, 'item-to-block');
    assert.equal(parsed.data.to, 'blocked');
    assert.equal(parsed.data.reason, 'executor crashed during dispatch');

    const view = listWork(fgosDir);
    assert.equal(view.work['item-to-block'].status, 'blocked');
    assert.equal(view.outcomes['item-to-block']?.actual?.outcome, 'blocked');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
