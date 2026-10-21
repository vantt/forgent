// Owning proof of src/runner/dispatch/stop-processes-inside.mjs. The module
// had no test of its own (`rg -l "stopProcessesInside|processesInside" test`
// found nothing); its callers are the confinement cleanup, the worker home
// teardown and the dev host launcher, whose own tests do not exercise it.
//
// A pid reused between the scan and the signal cannot be forced in a test, so
// this pins the observable half of that defect: the scan must return the
// identity it judged ({ pid, startTime }), because a bare pid cannot be
// checked again at signal time.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { signalByIdentity } from '../../src/runner/dispatch/process-identity.mjs';
import { processesInside, stopProcessesInside } from '../../src/runner/dispatch/stop-processes-inside.mjs';

test('processesInside names the identities it finds (a view with its identity tuple), never a bare pid, and never this process or its parent', async () => {
  if (os.platform() !== 'linux') return;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-inside-test-'));
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: dir, stdio: 'ignore' });
  const exited = new Promise((resolve) => child.on('exit', resolve));
  try {
    // The cwd link exists as soon as the process does; wait until it points inside.
    const deadline = Date.now() + 5000;
    while (!processesInside(dir).some((p) => (p?.pid ?? p) === child.pid)) {
      assert.ok(Date.now() < deadline, 'the child never showed up as running inside the directory');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const found = processesInside(dir);
    const mine = found.find((p) => (p?.pid ?? p) === child.pid);
    assert.equal(typeof mine, 'object', `found entries must carry identity, got ${JSON.stringify(found)}`);
    assert.equal(mine.pid, child.pid);
    assert.match(String(mine.tuple.startTime), /^\d+$/, 'the start time read at scan time travels with the pid');
    const pids = found.map((p) => p?.pid ?? p);
    assert.ok(!pids.includes(process.pid) && !pids.includes(process.ppid));
    const stopped = stopProcessesInside(dir, { graceMs: 1000 });
    assert.deepEqual({ found: stopped.found, stopped: stopped.stopped, left: stopped.left }, { found: 1, stopped: 1, left: [] });
    await exited;
  } finally {
    child.kill('SIGKILL');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a view whose pid was reused since the scan gets identity-mismatch and no signal (the door, over a live process with another start time)', async () => {
  if (os.platform() !== 'linux') return;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-inside-test-'));
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: dir, stdio: 'ignore' });
  try {
    const deadline = Date.now() + 5000;
    let mine;
    while (!(mine = processesInside(dir).find((view) => view.pid === child.pid))) {
      assert.ok(Date.now() < deadline, 'the child never showed up as running inside the directory');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const reused = { ...mine.tuple, startTime: String(Number(mine.tuple.startTime) + 1) };
    assert.equal(signalByIdentity(reused, 'kill'), 'identity-mismatch');
    assert.equal(child.exitCode === null && child.signalCode === null, true, 'the process the tuple does not name received no signal');
    assert.equal(signalByIdentity(mine.tuple, 'kill'), 'sent');
  } finally {
    child.kill('SIGKILL');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
