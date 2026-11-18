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
import { bindHeadSeat } from '../../src/session-host/head-start.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('claude');

const standard = () => loadRunnerConfigForDir(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-mode-')));
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
