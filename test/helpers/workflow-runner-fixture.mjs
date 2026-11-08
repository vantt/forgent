// What the Playbook runner's end-to-end suites share: a throwaway repository whose one fake worker
// writes a unit's report, the executors of distinct provider families a panel needs, the advance lock
// held from this process or from a child, and a wait that reads the ledger instead of sleeping.
//
// bwrap mounts a tmpfs over /tmp, so the repository lives in a fixture directory a confined worker can see.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

import { initFixtureRepo } from './git-fixture.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';
import { writeProjectConfig, readProjectConfig } from './config-fixture.mjs';
import { readWorkflowEvents } from '../../src/workflow/store.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

export const BIN_FGOS = path.resolve('bin/fgos.mjs');
const HOLDER_LOCK_MOD = path.resolve('src/holder-lock/index.mjs');

// Two CLI runs of three seats each; alone it takes seconds. The bounds are backstops only: a seat that
// never answers is failed by FIXTURE_SEAT_TIMEOUT_MS.
export const STANCE_CLI_CALL_TIMEOUT_MS = 60_000;
// `runner.timeoutMs` is bounded so a seat whose worker never answers fails the run within a minute,
// naming the seat, instead of after the 35-minute default.
const FIXTURE_SEAT_TIMEOUT_MS = 45_000;

/** A repository with one executor (`test-node`) whose worker writes a done report for every unit it is given. */
export function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-wf-test-');
  initFixtureRepo(tmp, { branch: 'main', ignore: '.fgos/\necho-worker.mjs\n' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Workflow Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tmp, stdio: 'ignore' });

  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+result-1\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nAssignment execution completed successfully with full report content.\\n');
      fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    `,
  );

  fs.mkdirSync(path.join(tmp, '.fgos'), { recursive: true });
  writeProjectConfig(tmp, {
    runner: {
      defaultExecutor: 'test-node',
      defaults: { tier: 'standard' },
      modelPolicies: { node: { standard: 'node-std' } },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node executor',
          allowCrossProvider: true,
          command: process.execPath,
          args: [echoScript, '{prompt}'],
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: {
        'docs:write': { prefer: [{ executor: 'test-node' }], rigor: 'standard', tier: 'standard' },
        'code:implement': { prefer: [{ executor: 'test-node' }], rigor: 'standard', tier: 'standard' },
      },
      patterns: { seatBinding: { schema: 1 } },
      loops: {
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  });
  return tmp;
}

/** Panel seats: `n` producers and a synthesizer. */
export function memberSeats(n = 3) {
  return [...Array.from({ length: n }, (_, i) => ({ seat: `member-${i + 1}`, role: 'producer' })), { seat: 'synthesizer', role: 'synthesizer' }];
}

// A gate-only workflow needs no worker: it parks at the gate and, once answered, completes.
export const GATE_WORKFLOW = {
  id: 'test/gate-only',
  steps: [
    { id: 'step-gate', dependsOn: [], gate: { kind: 'human', question: 'Ready to proceed?' } },
    { id: 'step-after', dependsOn: ['step-gate'] },
  ],
};

/** The CLI wraps its result in a contract envelope; the run state is under `data`. */
export function parseCliData(stdout) {
  return JSON.parse(stdout).data;
}

/**
 * Executors of distinct provider families, so a panel can bind every seat.
 *
 * Each executor command is a symlink to the node binary (over 100 MB). Left as untracked files, every
 * seat's dispatch hashes each of them as a pre-existing dirty file, once before launch and again at
 * settlement. The symlinks are excluded from git so they are not part of the worktree the dispatch
 * snapshots.
 */
export function useDistinctFamilies(tmp, names) {
  const cfg = readProjectConfig(tmp);
  const script = path.join(tmp, 'echo-worker.mjs');
  cfg.runner.executors = {};
  cfg.runner.timeoutMs = FIXTURE_SEAT_TIMEOUT_MS;
  fs.mkdirSync(path.join(tmp, '.git', 'info'), { recursive: true });
  fs.appendFileSync(path.join(tmp, '.git', 'info', 'exclude'), names.map((name) => `/${name}-bin\n`).join(''));
  for (const name of names) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    cfg.runner.executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
    cfg.runner.modelPolicies[name] = { nano: `${name}-nano`, standard: `${name}-std`, advanced: `${name}-adv`, flagship: `${name}-flagship`, frontier: `${name}-frontier` };
  }
  cfg.runner.defaultExecutor = names[0];
  for (const capability of Object.values(cfg.runner.capabilities)) {
    capability.prefer = names.map((executor) => ({ executor }));
  }
  writeProjectConfig(tmp, cfg);
}

/**
 * Resolves with the first ledger event of the run that `predicate` accepts, as soon as it is on the
 * ledger. A run that never records it fails the test at the deadline, naming what was wanted.
 */
export async function waitForLedgerEvent(repoRoot, workflowRunId, predicate, { label = 'the awaited event', timeoutMs = 30_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = readWorkflowEvents({ repoRoot, workflowRunId }).find(predicate);
    if (found) return found;
    assert.ok(Date.now() < deadline, `${label} never reached the ledger of ${workflowRunId} within ${timeoutMs} ms`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export function advanceParams(tmp, id) {
  return { fgosDir: path.join(tmp, '.fgos'), workflowRunDir: path.join(tmp, '.fgos', 'workflow-runs', id) };
}

/** Hold the run's advance lock in this test process, which stands in for the live advancing process. */
export function holdAdvanceHere(tmp, id) {
  const res = acquireSync(createLockScope('test-advance-holder'), 'advance', advanceParams(tmp, id));
  assert.equal(res.result, 'acquired');
  return res.handle;
}

/** Hold the run's advance lock in a separate process; resolves once it holds it. */
export async function holdAdvanceInChild(tmp, id) {
  const readyPath = path.join(tmp, `advance-holder-${process.hrtime.bigint()}`);
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireSync, createLockScope } from ${JSON.stringify(HOLDER_LOCK_MOD)};
    const res = acquireSync(createLockScope('holder'), 'advance', ${JSON.stringify(advanceParams(tmp, id))});
    if (res.result !== 'acquired') process.exit(3);
    fs.writeFileSync(${JSON.stringify(readyPath)}, 'held');
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const deadline = Date.now() + 10000;
  while (!fs.existsSync(readyPath)) {
    assert.ok(Date.now() < deadline, 'the holder never took the advance lock');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return { child, exited };
}
