import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import { prepareBwrapSync, computeLaunchDigest } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { resolveRuntimeSocketDir } from '../../src/run-supervisor/runtime-dir.mjs';

const BACKEND = { id: 'bwrap', config: { executable: '/usr/bin/bwrap' } };

function prepare(t, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bwrap-drv-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const plan = {
    coverage: {},
    resources: [{ resource: 'workspace', hostTarget: dir, executionTarget: { location: 'host', path: dir }, access: 'read-write', delivery: 'mount' }],
  };
  const request = { dispatchId: 'disp-1', invocation: { command: 'agent-cli', args: ['--x'], env: {} }, context: { runDir: dir }, ...extra };
  return prepareBwrapSync(plan, request, BACKEND);
}

test('a direct launch has its own pid namespace as pid 1 and never dies with its parent', (t) => {
  const { invocation } = prepare(t, { launchMode: 'direct' });
  const args = invocation.args;
  assert.ok(args.includes('--unshare-pid') && args.includes('--as-pid-1'));
  const proc = args.indexOf('--proc');
  assert.equal(args[proc + 1], '/proc');
  assert.equal(args.includes('--die-with-parent'), false);
});

test('a terminal launch dies with its parent and binds the runtime socket directory', (t) => {
  const xdg = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-xdg-'));
  t.after(() => fs.rmSync(xdg, { recursive: true, force: true }));
  const saved = process.env.XDG_RUNTIME_DIR;
  process.env.XDG_RUNTIME_DIR = xdg;
  t.after(() => { if (saved === undefined) delete process.env.XDG_RUNTIME_DIR; else process.env.XDG_RUNTIME_DIR = saved; });
  const { invocation } = prepare(t, { launchMode: 'terminal' });
  const args = invocation.args;
  const socketDir = resolveRuntimeSocketDir();
  assert.ok(args.includes('--die-with-parent'));
  const bind = args.findIndex((a, i) => a === '--bind' && args[i + 1] === socketDir);
  assert.ok(bind >= 0 && args[bind + 2] === socketDir);
});

test('a supervised attempt gets a prefix ending in -- and no worker command; the digest covers prefix, gate and agent argv', (t) => {
  const prepared = prepare(t, { launchMode: 'direct', attemptId: 'att-1', gateCommand: ['/host/fgos', 'internal', 'gate'] });
  // The attempt home marker is written by the cleanup module; this plan has no temporary home.
  assert.equal(prepared.bwrapPrefix.at(-1), '--');
  assert.deepEqual(prepared.invocation.args, prepared.bwrapPrefix);
  assert.deepEqual(prepared.agentArgv, ['agent-cli', '--x']);
  const base = { bwrapPrefix: prepared.bwrapPrefix, gateCommand: ['/host/fgos', 'internal', 'gate'], agentArgv: prepared.agentArgv };
  assert.equal(prepared.launchDigest, computeLaunchDigest(base));
  assert.notEqual(computeLaunchDigest({ ...base, gateCommand: ['/host/fgos', 'internal', 'gate2'] }), prepared.launchDigest);
  assert.notEqual(computeLaunchDigest({ ...base, agentArgv: ['other'] }), prepared.launchDigest);
  assert.notEqual(computeLaunchDigest({ ...base, bwrapPrefix: [...base.bwrapPrefix, '--x'] }), prepared.launchDigest);
});

test('a request without an attempt keeps the worker command in the argv', (t) => {
  const { invocation } = prepare(t, { launchMode: 'direct' });
  assert.ok(invocation.args.includes('bwrap-launch'));
  assert.equal(invocation.args.at(-2), 'agent-cli');
});

test('the prefix really puts the command at pid 1 of a fresh namespace', (t) => {
  const probe = cp.spawnSync('/usr/bin/bwrap', ['--unshare-pid', '--as-pid-1', '--ro-bind', '/', '/', '--proc', '/proc', 'true']);
  if (probe.status !== 0) return t.skip('bwrap with a pid namespace is not usable on this machine');
  const { bwrapPrefix } = prepare(t, { launchMode: 'direct', attemptId: 'att-2' });
  const run = cp.spawnSync('/usr/bin/bwrap', [...bwrapPrefix, 'sh', '-c', 'cat /proc/self/stat | cut -d" " -f4; echo $$'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  // `$$` is the shell, which is pid 1; the cat it spawned reports it as its parent.
  assert.deepEqual(run.stdout.trim().split('\n'), ['1', '1']);
});
