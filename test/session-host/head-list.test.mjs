// Owning proof of the read-only live/sleeping/retired join. Stop effects belong to head-stop.test.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureGitAddon } from '../helpers/git-addon.mjs';
import { lineageDirOf, writeHeadPlacement } from '../../src/session-host/head-start.mjs';
import { listHeads } from '../../src/session-host/head-list.mjs';
import { listHeadSessions } from '../../src/session-host/head-request.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';

ensureGitAddon();

const rootOf = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-list-'));
const startedAt = '2026-11-26T12:00:00Z';
const retiredAt = '2026-11-26T13:00:00Z';
const wakeAt = '2026-11-27T12:00:00Z';
function placement(projectRoot, name, extra = {}) {
  writeHeadPlacement(lineageDirOf(projectRoot, 'lead', name), {
    role: `head:lead-${name}`, persona: 'lead', gen: 1, placement: { key: `head-lead-${name}-1` }, startedAt, ...extra,
  });
}
const snapshot = (root) => fs.readdirSync(root, { recursive: true }).sort().map((p) => {
  const file = path.join(root, p);
  return [p, fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8') : null];
});

test('the view joins sleep and manual retirement with live holders, and writes no file or directory', async () => {
  const projectRoot = rootOf();
  placement(projectRoot, 'sleep', { retiredReason: 'sleep', retiredAt, wakeAt, plan: 'plans/example', phase: '02' });
  placement(projectRoot, 'manual', { retiredReason: 'manual', retiredAt });
  placement(projectRoot, 'live');
  // A wake's live holder wins even if the placement still carries sleep state.
  placement(projectRoot, 'woken', { retiredReason: 'sleep', retiredAt, wakeAt });
  const sessions = ['live', 'woken'].map((name) => ({ roles: [`head:lead-${name}`], liveness: 'alive' }));
  const before = snapshot(projectRoot);
  const rows = await listHeads({ projectRoot }, { identity: (root) => { assert.equal(root, projectRoot); return sessions; } });
  assert.deepEqual(rows, [
    { role: 'head:lead-live', persona: 'lead', state: 'live', startedAt },
    { role: 'head:lead-manual', persona: 'lead', state: 'retired', startedAt, retiredAt },
    { role: 'head:lead-sleep', persona: 'lead', state: 'sleeping', startedAt, wakeAt, plan: 'plans/example', phase: '02', retiredAt },
    { role: 'head:lead-woken', persona: 'lead', state: 'live', startedAt },
  ]);
  assert.deepEqual(snapshot(projectRoot), before);
});

test('a missing lineage directory stays missing and unplaced live heads and short-role leads still appear', async () => {
  const projectRoot = rootOf();
  const rows = await listHeads({ projectRoot }, { identity: () => [
    { roles: ['head:secretary-miu'], registeredAt: startedAt, liveness: 'alive', ids: { head: { persona: 'secretary', name: 'miu' } } },
    { roles: ['lead:LANE'], registeredAt: startedAt, liveness: 'unknown' },
    { roles: ['head:lead-remote'], liveness: 'remote' },
  ] });
  assert.deepEqual(rows, [
    { role: 'head:secretary-miu', persona: 'secretary', state: 'live', startedAt },
    { role: 'lead:LANE', persona: null, state: 'live', startedAt },
  ]);
  assert.deepEqual(fs.readdirSync(projectRoot), []);
});

test('a local short-role holder joins its named head lineage once, while a remote holder never wakes a local sleeper', async () => {
  const projectRoot = rootOf();
  placement(projectRoot, 'x', { retiredReason: 'sleep', retiredAt, wakeAt });
  placement(projectRoot, 'y', { retiredReason: 'sleep', retiredAt, wakeAt });
  const rows = await listHeads({ projectRoot }, { identity: () => [
    { roles: ['lead:LANE'], liveness: 'alive', ids: { head: { persona: 'lead', name: 'x', gen: 1 } } },
    { roles: ['head:lead-y'], liveness: 'remote' },
  ] });
  assert.deepEqual(rows.map(({ role, state }) => ({ role, state })), [
    { role: 'head:lead-x', state: 'live' }, { role: 'head:lead-y', state: 'sleeping' },
  ]);
});

test('torn or missing placement records are skipped and an Identity failure is never presented as retirement', async () => {
  const projectRoot = rootOf();
  const dir = lineageDirOf(projectRoot, 'lead', 'torn');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'placement.json'), '{torn');
  fs.mkdirSync(path.join(path.dirname(dir), 'empty'));
  assert.deepEqual(await listHeads({ projectRoot }, { identity: () => [] }), []);
  await assert.rejects(listHeads({ projectRoot }, { identity: () => { throw Object.assign(new Error('unavailable'), { code: 'identity-unavailable' }); } }), { code: 'identity-unavailable' });
});

// One CLI wiring proof: state cases above stay solely with the join, not duplicated through the CLI.
test('the session list payload dispatch accepts no persona and prints the joined view', async () => {
  const { initGitCwd, run, tmpCwd } = await import('../cli/helpers/fgos-cli-harness.mjs');
  const projectRoot = tmpCwd();
  initGitCwd(projectRoot);
  const initialized = run(projectRoot, ['identity', 'project', '--init', '--handle', 'head-list', '--json']);
  assert.equal(initialized.status, 0, initialized.stderr);
  placement(projectRoot, 'sleep', { retiredReason: 'sleep', retiredAt, wakeAt });
  const result = run(projectRoot, ['session', 'list', '--json'], { FGOS_CONFINED: '', FGOS_HEAD_REQUEST_SOCKET: '' });
  assert.equal(result.status, 0, result.stderr);
  const answer = JSON.parse(result.stdout);
  assert.equal(answer.data[0].role, 'head:lead-sleep');
});

test('the session list registry and confined read branch use the existing request window without probing the sandbox root', async () => {
  const session = COMMAND_REGISTRY.find((entry) => entry.name === 'session');
  assert.ok(session.subcommands.list);
  assert.deepEqual(session.subcommands.list.parameters.required, []);
  let called;
  const response = await listHeadSessions({ projectRoot: () => assert.fail('a confined caller must not resolve the root') }, {
    env: { FGOS_CONFINED: '1', FGOS_HEAD_REQUEST_SOCKET: '/head.sock' },
    request: async (...args) => { called = args; return [{ state: 'sleeping' }]; },
  });
  assert.deepEqual(called, ['fgos', { argv: ['session', 'list', '--json'] }, { socketPath: '/head.sock' }]);
  assert.deepEqual(response, [{ state: 'sleeping' }]);
  const projectRoot = rootOf();
  assert.deepEqual(await listHeadSessions({ projectRoot: () => projectRoot }, { env: {}, ports: { identity: () => [] } }), []);
});
