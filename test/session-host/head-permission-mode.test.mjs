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
