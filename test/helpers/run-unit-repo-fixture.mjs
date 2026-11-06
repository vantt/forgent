// test/helpers/run-unit-repo-fixture.mjs -- a git repo with a runner config (one confined node executor) and a
// linked worktree, plus the seat list, the signal handling, the stand-in workers, the recorded-unit fixture
// and the git readers those proofs share.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { installCancelOnSignal, resetCancelRequest } from '../../src/run-supervisor/cancel-registry.mjs';
import { resolveSeats } from '../../src/runner/execution/seat-resolver.mjs';
import { snapshotRunnerConfig } from '../../src/runner/execution/run.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';
import { readProjectConfig, writeProjectConfig } from './config-fixture.mjs';

export function setupGitRepo() {
  const tmp = makeFixtureDir('fgos-run-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Test Runner'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@runner.local'], { cwd: tmp, stdio: 'ignore' });

  // Commit initial file
  fs.writeFileSync(path.join(tmp, 'README.md'), '# Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmp, stdio: 'ignore' });

  // Create .fgos/config.json
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const runnerConfig = {
    runner: {
      defaultExecutor: 'test-node',
      defaults: { tier: 'standard' },
      modelPolicies: {
        node: {
          standard: 'node-std',
          flagship: 'node-flagship',
        },
      },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node agent',
          allowCrossProvider: true,
          command: process.execPath,
          args: [],
          providerModel: 'node',
          invocations: [
            {
              id: 'cli-default',
              via: 'cli',
              adapter: 'cli-spawn',
              confinement: { backend: 'bwrap' },
              command: process.execPath,
              args: [],
            },
          ],
        },
      },
      capabilities: {
        'docs:write': {
          prefer: [{ executor: 'test-node' }],
          rigor: 'standard',
        },
        'docs:review': {
          prefer: [{ executor: 'test-node' }],
          persona: 'code-reviewer',
          rigor: 'standard',
        },
        // Declared, but its only executor has no model at the tier it asks for: policy refuses every unit that names it.
        'unserved:answer': {
          prefer: [{ executor: 'test-node' }],
          tier: 'frontier',
        },
      },
      patterns: { seatBinding: { schema: 1 } },
      loops: {
        reviewed: {
          maxRounds: 2,
          checkersByRigor: {
            standard: ['reviewer'],
            high: ['reviewer', 'red-team'],
            critical: ['reviewer', 'red-team', 'tester'],
          },
        },
      },
    },
  };
  writeProjectConfig(tmp, runnerConfig);

  // Create linked worktree
  const worktreeDir = makeFixtureDir('fgos-run-wt-');
  execFileSync('git', ['worktree', 'add', '-b', 'wt-branch', worktreeDir], { cwd: tmp, stdio: 'ignore' });

  return { repoRoot: tmp, worktreeDir };
}

// A panel unit declares its seats: `n` producer members and one synthesizer.
export function panelSeats(n) {
  return [...Array.from({ length: n }, (_, i) => ({ seat: `member-${i + 1}`, role: 'producer' })), { seat: 'synthesizer', role: 'synthesizer' }];
}

// A signal handled the way the CLI does it, with a stand-in exit so the test process survives.
export async function withCancelHandlers(fn) {
  const exits = [];
  const uninstall = installCancelOnSignal({ cancelWaitMs: 1000, exit: (code) => exits.push(code), stderr: { write() {} } });
  try { await fn(exits); } finally { uninstall(); resetCancelRequest(); }
}

// A worker that always settles as done, whatever it was asked: enough to reach the checker role.
export function writeSettlingWorker(dir) {
  const script = path.join(dir, 'settling-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      // A confined worker may only write the run's outbox; an unconfined one writes the run dir.
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
  return script;
}

export function reviewedConfig(repoRoot, executorNames) {
  const cfg = readProjectConfig(repoRoot);
  const script = writeSettlingWorker(repoRoot);
  const executors = {};
  for (const name of executorNames) {
    // Each executor is its own provider family (providerModel), with a distinct command name.
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
  cfg.runner.executors = executors;
  delete cfg.runner.capabilities['unserved:answer']; // its pool named the executor this config replaces
  for (const name of executorNames) cfg.runner.modelPolicies[name] = { nano: `${name}-nano`, standard: `${name}-std`, advanced: `${name}-adv`, flagship: `${name}-flagship`, frontier: `${name}-frontier` };
  const prefer = executorNames.map((executor) => ({ executor }));
  cfg.runner.capabilities['docs:write'] = { prefer, rigor: 'standard', tier: 'standard' };
  cfg.runner.capabilities['docs:review'] = { prefer, persona: 'code-reviewer', rigor: 'standard', tier: 'standard' };
  cfg.runner.defaultExecutor = executorNames[0];
  writeProjectConfig(repoRoot, cfg);
}

export function recordedUnitFixture(t, pattern = 'solo') {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const unitRunId = 'unit-run-recorded';
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });
  const patternName = typeof pattern === 'string' ? pattern : (pattern?.pattern ?? pattern?.name ?? 'solo');
  const loop = patternName === 'rfc' ? 'reviewed' : patternName;
  const record = {
    unit: { id: 'recorded-question', objective: 'Answer the question', capability: 'unserved:answer',
      writes: [], pattern, stanceOptions: ['a', 'b'], ...(patternName === 'panel' ? { seats: panelSeats(3) } : {}) },
    pattern: patternName,
    seatSchema: 1,
    collaboration: {
      effective: {
        loop,
        params: patternName === 'rfc'
          ? { maxRounds: 1, minCheckers: ['reviewer', 'red-team'] }
          : (loop === 'reviewed' ? { maxRounds: 1 } : {}),
      },
      pattern: { name: patternName },
    },
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    overrides: [],
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
  };
  // A pattern the resolver does not know leaves a record with no seats, which a resume then refuses.
  if (patternName === 'rfc') {
    record.seats = [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true, forceOutOfProcess: true } },
      { seat: 'red-team', role: 'reviewer', posture: { readOnly: true, verdict: true, forceOutOfProcess: true } },
    ];
  } else {
    try {
      record.seats = resolveSeats({ pattern, unit: record.unit, runnerConfig: record.configSnapshot.runner });
    } catch {
      record.seats = [];
    }
  }
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  const readRecord = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  return { repoRoot, worktreeDir, unitRunId, unitDir, record, readRecord, readSummary };
}


// A worker that writes `files` (path -> content) in its worktree and settles done. With `waitFor`, it
// first writes `.started` and waits (up to 20s) for that file to appear, so a test can act mid-round.
export function writeScopedWorker(repoRoot, { files, waitFor = null, summary = 'Wrote the files' }) {
  const script = path.join(repoRoot, 'scoped-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    const files = ${JSON.stringify(files)};
    for (const [rel, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(rel), { recursive: true });
      fs.writeFileSync(rel, content);
    }
    const waitFor = ${JSON.stringify(waitFor)};
    if (waitFor) {
      fs.writeFileSync('.started', '');
      const until = Date.now() + 20000;
      while (!fs.existsSync(waitFor) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
    if (match) {
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: ${JSON.stringify(summary)}, assessment: { verdict: 'pass' } }));
    }
    `,
  );
  const cfg = readProjectConfig(repoRoot);
  for (const executor of Object.values(cfg.runner.executors)) {
    executor.args = [script, '{prompt}'];
    for (const invocation of executor.invocations) invocation.args = [script, '{prompt}'];
  }
  writeProjectConfig(repoRoot, cfg);
}

export const gitIn = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
export const headOf = (cwd) => gitIn(cwd, 'rev-parse', 'HEAD').trim();
/** How many producer rounds were actually spawned (each settled spawn leaves a result.json). */
export function producerSpawns(repoRoot, unitRunId) {
  const roleDir = path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'producer');
  if (!fs.existsSync(roleDir)) return 0;
  let n = 0;
  for (const attempt of fs.readdirSync(roleDir)) {
    const runs = path.join(roleDir, attempt, 'runs');
    if (fs.existsSync(runs)) n += fs.readdirSync(runs).filter((r) => fs.existsSync(path.join(runs, r, 'result.json'))).length;
  }
  return n;
}
