// test/helpers/run-unit-repo-fixture.mjs -- a git repo with a runner config (one confined node executor) and a
// linked worktree, plus the seat list and the signal handling those proofs share.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { installCancelOnSignal, resetCancelRequest } from '../../src/run-supervisor/cancel-registry.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';
import { writeProjectConfig } from './config-fixture.mjs';

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
