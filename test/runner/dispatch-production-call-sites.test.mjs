// A production call site, exercised the way production calls it: from a config file.
//
// Every other herdr-spawn test builds the adapter's invocation by hand and
// hands it straight to `EXECUTOR_ADAPTERS['herdr-spawn']`. That is a fine way
// to test the adapter and a useless way to test the wiring: it skips
// `config.json -> resolveExecutorCommand -> adapter` entirely, and twice now a
// field the config declared was dropped between those two ends with the whole
// suite green. These tests start where a real dispatch starts -- at the file.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { addWork, listWork } from '../../src/state/store.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

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
  activateGitFixture(root);
  // The mock herdr writes its script, wrapper and bookkeeping into the repo
  // root. Those are the harness, not the worker, so they are ignored the way a
  // real repo ignores its own noise -- otherwise the stray-write guard would
  // correctly report the test's own scaffolding.
  fs.writeFileSync(path.join(root, '.gitignore'), ['herdr', 'mock-herdr.mjs', 'herdr-calls.log', 'herdr-envs.log', 'agent-exited', 'agent-pid', ''].join('\n'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  writeProjectConfig(root, {
    runner: {
      executor: { command: 'agy', providerModel: 'agy', args: ['-i', '{prompt}'] },
      modelPolicies: { agy: { standard: 'sonnet' }, claude: { standard: 'sonnet' } },
      defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
      timeoutMs: 20000,
      executors: { 'herdr-worker': makeExecutor(root) },
      capabilities: { [IMPLEMENT_CAPABILITY]: { prefer: 'herdr-worker' } },
    },
  });
  return root;
}

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
