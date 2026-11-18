// The owning proof of a head's permission mode: the release standard pins the secretary head to the pane
// invocation that carries the leads' permission mode (bypass), under the full confinement that mode demands, and
// every other persona keeps the pane invocation that asks. The binding runs the real crate over the real standard.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { loadRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';
import { bind } from '../../src/runner/execution/bind.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { bindHeadSeat } from '../../src/session-host/head-start.mjs';
import { grantOf } from '../../src/session-host/head-grants.mjs';
import { launchSessionAttempt, requirementOf } from '../../src/runner/dispatch/session-attempt.mjs';
import { prepareSeat } from '../../src/runner/dispatch/herdr-round.mjs';
import { controlDelivery } from '../../src/runner/dispatch/confinement/bypass-pairing.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('claude');

const standard = (runner) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-mode-'));
  if (runner) writeProjectConfig(dir, { runner });
  return loadRunnerConfigForDir(dir);
};
const BYPASS = { executor: 'claude', invocation: 'claude-herdr-bypass-bwrap' };
const workerAsk = (extra = {}) => ({ unit: { id: 'u1', capability: 'execute', rigor: 'standard', writes: [] }, seat: 'producer', role: 'producer', readOnly: true, raiseAuthorized: false, ...extra });
const paneSession = { headless: false, herdrPresent: true, postureAtLaunch: true };
const invocationOf = (cfg, binding) => cfg.executors[binding.executor].invocations.find((i) => i.id === binding.invocation);

test('the secretary head launches with the bypass flag under full confinement and a shaper head does not', async () => {
  const cfg = standard();
  const secretary = invocationOf(cfg, await bindHeadSeat({ persona: 'secretary', key: 'head-secretary-miu-1', runnerConfig: cfg }));
  assert.equal(secretary.permissionMode, 'bypass');
  assert.ok(secretary.args.includes('--dangerously-skip-permissions'));
  assert.deepEqual([secretary.confinement.privateHome, secretary.confinement.isolatedSession, secretary.confinement.ownWorktree], [true, true, true]);

  const shaper = invocationOf(cfg, await bindHeadSeat({ persona: 'shaper', key: 'head-shaper-x-1', runnerConfig: cfg }));
  assert.notEqual(shaper.permissionMode, 'bypass');
  assert.ok(!shaper.args.includes('--dangerously-skip-permissions'));
});

test('a capability, role or persona pin of the bypass invocation is refused for a worker seat, and allowed only for a head launch', () => {
  const pins = [
    { capabilities: { execute: { prefer: [BYPASS] } } },
    { roles: { producer: { prefer: [BYPASS] } } },
    { personas: { panelist: { prefer: [BYPASS] } } },
  ];
  for (const runner of pins) {
    const cfg = standard(runner);
    const refused = bind(workerAsk({ persona: 'panelist' }), { runnerConfig: cfg, session: paneSession }).refused;
    assert.equal(refused?.reason, 'bypass-invocation-not-allowed', JSON.stringify(runner));
  }
  const cfg = standard({ personas: { panelist: { prefer: [BYPASS] } } });
  const allowed = bind(workerAsk({ persona: 'panelist' }), { runnerConfig: cfg, session: paneSession }, { headLaunch: true });
  assert.equal(allowed.invocation, BYPASS.invocation);
});

test('a project override of the secretary prefer replaces the standard list and the head asks again', async () => {
  const cfg = standard({ personas: { secretary: { prefer: ['claude'] } } });
  const binding = await bindHeadSeat({ persona: 'secretary', key: 'head-secretary-miu-1', runnerConfig: cfg });
  assert.notEqual(invocationOf(cfg, binding).permissionMode, 'bypass');
});

// The launch a head start makes, run for real up to the pane: bind, the Confinement Authority, the bwrap preparation
// and the seat's own confinement checks. The terminal config that cannot build a control stops it right after the
// seat is prepared, so reaching that error means every confinement check let the head through.
const PANE_REACHED = 'pane reached: the seat passed its confinement checks';
const stopAtPane = { get unusable() { throw new Error(PANE_REACHED); } };
const projectWith = (dirs) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-bypass-root-'));
  for (const dir of dirs) fs.mkdirSync(path.join(root, dir), { recursive: true });
  return root;
};

test('the secretary head launches bypass in the main checkout it is granted, and a worker seat with the bypass invocation there is still refused', { skip: !fs.existsSync('/usr/bin/bwrap') && 'no bwrap on this machine', timeout: 120_000 }, async () => {
  const projectRoot = projectWith(['plans', 'docs/discussions']);
  fs.writeFileSync(path.join(projectRoot, 'docs', 'backlog.md'), '');
  try {
    const cfg = standard();
    const key = 'head-secretary-miu-1';
    const binding = await bindHeadSeat({ persona: 'secretary', key, runnerConfig: cfg });
    assert.equal(invocationOf(cfg, binding).permissionMode, 'bypass');
    const role = 'head:secretary-miu';
    await assert.rejects(launchSessionAttempt({
      binding, runnerConfig: cfg, key, role, grant: grantOf(role), opening: 'hello', ceilingMs: 60_000, projectRoot,
      opts: { terminalConfig: stopAtPane },
    }), (err) => { assert.equal(err.message, PANE_REACHED, `the head was refused: ${err.message}`); return true; });
    const [prepared] = fs.readdirSync(path.join(projectRoot, '.fgos', 'assignments', key, 'runs', '01', 'protected', 'prepared-invocation'));
    const record = JSON.parse(fs.readFileSync(path.join(projectRoot, '.fgos', 'assignments', key, 'runs', '01', 'protected', 'prepared-invocation', prepared), 'utf8'));
    assert.equal(record.workerInvocation.cwd, projectRoot, 'the head runs in the main checkout');
    assert.ok(record.workerInvocation.args.includes('--dangerously-skip-permissions'), 'the head runs in bypass');
    assert.equal(record.backend.type, 'bwrap', 'inside its sandbox');
  } finally { fs.rmSync(projectRoot, { recursive: true, force: true }); }

  // The same seat preparation with the launch context of a worker: the repo root is not a worktree of its own.
  const workerRoot = projectWith([]);
  try {
    await assert.rejects(prepareSeat({
      binding: { command: 'claude', args: ['--dangerously-skip-permissions'], env: {}, permissionMode: 'bypass', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } },
      round: { workId: 'claude', note: () => {}, fail: (code, reason, message) => Object.assign(new Error(message), { code, reason }) },
      runDir: fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-bypass-run-')), cwd: workerRoot, repoRoot: workerRoot, fullEnv: {},
      delivery: controlDelivery({ launchKind: 'assignment', requirement: requirementOf(grantOf('head:secretary-miu')), backend: 'bwrap' }),
    }), (err) => err.reason === 'own-worktree-unavailable');
  } finally { fs.rmSync(workerRoot, { recursive: true, force: true }); }
});
