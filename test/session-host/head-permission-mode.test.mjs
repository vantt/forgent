// The owning proof of a head's permission mode: the release standard pins the secretary head to the pane
// invocation that carries the leads' permission mode (bypass), under the full confinement that mode demands, and
// every other persona keeps the pane invocation that asks. The binding runs the real crate over the real standard.
// What the launch does with that seat (the requirement a grant becomes, the root workspace a head session may use,
// the refusal of a bypass invocation for a worker seat) is the engine's, proven in packages/execution.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { loadRunnerConfigForDir } from '../../src/native/execution-door.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { bindHeadSeat } from '../../src/session-host/head-start.mjs';
import { grantOf } from '../../src/session-host/head-grants.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('claude');

const standard = (runner) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-mode-'));
  if (runner) writeProjectConfig(dir, { runner });
  return loadRunnerConfigForDir(dir);
};
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

test('a project override of the secretary prefer replaces the standard list and the head asks again', async () => {
  const cfg = standard({ personas: { secretary: { prefer: ['claude'] } } });
  const binding = await bindHeadSeat({ persona: 'secretary', key: 'head-secretary-miu-1', runnerConfig: cfg });
  assert.notEqual(invocationOf(cfg, binding).permissionMode, 'bypass');
});

test('a head grant writes only existing directories or existing files of the repository, each named once, a one-level entry ending in /*', () => {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
  for (const role of ['head:secretary-miu', 'head:supervisor-main', 'head:shaper-main', 'head:planner-main']) {
    const { writes } = grantOf(role);
    assert.equal(new Set(writes).size, writes.length, `${role} lists no path twice`);
    for (const entry of writes) {
      const tree = entry.endsWith('/*');
      const target = tree ? entry.slice(0, -2) : entry;
      assert.ok(!target.includes('*') && !path.isAbsolute(target) && !target.split('/').includes('..'), `${role} entry ${entry} is a plain project path or <dir>/*`);
      // A `<dir>/*` entry is a tree the sandbox binds, so it must name a directory; any other entry names one path,
      // which the sandbox binds writable when it is a directory and keeps read-only when it is a regular file.
      const stat = fs.statSync(path.join(repoRoot, target), { throwIfNoEntry: false });
      assert.ok(tree ? stat?.isDirectory() : stat?.isDirectory() || stat?.isFile(), `${role} entry ${entry} names an existing ${tree ? 'directory' : 'directory or regular file'} under the repository root`);
    }
  }
});
