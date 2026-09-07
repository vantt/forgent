// The two production call sites, exercised the way production calls them.
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
import { execFileSync } from 'node:child_process';
import { spawnWorker, executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';

const WORKER_SESSION = 'fgos-worker';

/** What `executorIdForWork` resolves for a coding item at the executing stage
 * -- the capability a real implement dispatch goes through. */
const IMPLEMENT_CAPABILITY = 'fgos-coding-implement';

/**
 * A herdr that records what it was asked and answers plausibly.
 *
 * Deliberately smaller than the adapter suite's mock: these tests ask what
 * reached herdr, not what the round did with the answers.
 */
function mockHerdr(dir, { failWorkspaceCreate = false, silentWorker = false } = {}) {
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
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      executor: { command: 'agy', args: ['-i', '{prompt}'] },
      models: { standard: 'sonnet' },
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

const dispatch = (root, workId, opts = {}) => withMockHerdr(
  path.join(root, 'herdr'),
  () => spawnWorker(
    { id: workId, kind: 'task', title: workId, domain: 'coding', stage: 'executing' },
    loadRunnerConfigFromDir(root),
    root,
    { executorId: 'herdr-worker', fgosDir: path.join(root, '.fgos'), tier: 'standard', ...opts },
  ),
);

const runStatus = (runDir) => JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')).status;

/** The single `dispatch-runs/<workId>/<stamp>` directory a dispatch left. */
function soleRunDir(root) {
  const base = path.join(root, '.fgos', 'dispatch-runs');
  const workIds = fs.readdirSync(base);
  assert.equal(workIds.length, 1, 'exactly one dispatch run was started');
  const stamps = fs.readdirSync(path.join(base, workIds[0]));
  assert.equal(stamps.length, 1);
  return path.join(base, workIds[0], stamps[0]);
}

test('a confinement the config declares reaches herdr, from the config file down', async () => {
  const root = fixtureRepo(confinedExecutor);
  const mock = mockHerdr(root);
  try {
    assert.deepEqual(
      loadRunnerConfigFromDir(root).executors['herdr-worker'].confinement,
      { privateHome: false, isolatedSession: true },
      'the config door accepted the declaration',
    );

    await dispatch(root, 'tsk-conf');

    // A worker session is given a workspace to split from before any pane
    // exists in it. If the declaration never reached the adapter, the round
    // splits a pane in the operator's own session and this call never happens.
    const calls = mock.calls();
    assert.ok(
      calls.some((c) => c[0] === 'workspace' && c[1] === 'create'),
      `herdr was asked for the worker session's workspace; saw: ${JSON.stringify(calls.map((c) => c.slice(0, 2)))}`,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a confinement that cannot be established refuses the dispatch instead of running unconfined', async () => {
  const root = fixtureRepo(confinedExecutor);
  const mock = mockHerdr(root, { failWorkspaceCreate: true });
  try {
    await assert.rejects(
      () => dispatch(root, 'tsk-conf-fail'),
      (err) => {
        assert.equal(err.errorClass, 'invalid-config');
        // The reason is herdr's own code when herdr named one; the generic
        // `confinement-unavailable` is the fallback for a failure that did not.
        assert.match(err.message, /confinement was declared but could not be established/);
        assert.ok(err.reason, `the refusal names a cause, got: ${err.reason}`);
        return true;
      },
    );
    // The refusal has to land before a pane exists, or a worker was already
    // launched somewhere the profile said it must not be.
    assert.ok(
      !mock.calls().some((c) => c[0] === 'pane' && c[1] === 'split'),
      'no pane was opened for a worker that could not be confined',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an executor that declares no confinement dispatches exactly as before', async () => {
  const root = fixtureRepo();
  const mock = mockHerdr(root);
  try {
    await dispatch(root, 'tsk-plain');
    const calls = mock.calls();
    assert.ok(!calls.some((c) => c[0] === 'workspace'), 'no worker session was made for an unconfined executor');
    assert.ok(calls.some((c) => c[0] === 'pane' && c[1] === 'split'), 'the pane came from the ordinary path');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a run this path opened is a run this path closes', async () => {
  const root = fixtureRepo();
  mockHerdr(root);
  try {
    await dispatch(root, 'tsk-settle');
    assert.equal(runStatus(soleRunDir(root)), 'settled');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a dispatch that fails still closes its run -- a failure is an answer, not an unfinished round', async () => {
  const root = fixtureRepo(() => ({
    ...HERDR_EXECUTOR,
    interactiveMode: { exitCommand: '/exit', kind: 'agy', promptTimeoutMs: 10000, maxResends: 0 },
  }));
  mockHerdr(root, { silentWorker: true });
  try {
    await assert.rejects(() => dispatch(root, 'tsk-fails', { timeoutMs: 1500 }));
    // `running` here would be the exact defect visibility-session.mjs exists
    // to close: a round that ended long ago reading like one still in flight.
    assert.notEqual(runStatus(soleRunDir(root)), 'running');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the in-session entry point carries confinement too -- both call sites or neither', async () => {
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

test('the in-session door puts its run where the observe verbs look', async () => {
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

test('a caller that supplies its own run directory keeps it', async () => {
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
