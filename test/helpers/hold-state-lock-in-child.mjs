// Hold the state hot lock in a real child process, so a test can see another
// process inside the critical section (the same process cannot: a second
// acquire in it is a reentry and throws at once).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOT_LOCK_MOD = fileURLToPath(new URL('../../src/state/hot-lock.mjs', import.meta.url));

/**
 * Starts a child that enters `withStateTx(fgosDir, ...)` and stays inside
 * until `release()` is called (or it is killed). Resolves once the child is
 * inside: `{ child, exited, release }`. `resource` picks `state` (default) or
 * `porting-events`.
 */
export async function holdStateLockInChild(fgosDir, { resource = 'state', readyTimeoutMs = 10000 } = {}) {
  const flagDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-state-holder-'));
  const readyPath = path.join(flagDir, 'ready');
  const releasePath = path.join(flagDir, 'release');
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { withStateTx } from ${JSON.stringify(HOT_LOCK_MOD)};
    withStateTx(${JSON.stringify(fgosDir)}, () => {
      fs.writeFileSync(${JSON.stringify(readyPath)}, 'held');
      while (!fs.existsSync(${JSON.stringify(releasePath)})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }, { resource: ${JSON.stringify(resource)}, prefetched: { writer: 'state-holder' } });
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const deadline = Date.now() + readyTimeoutMs;
  while (!fs.existsSync(readyPath)) {
    if (child.exitCode !== null) assert.fail(`the holder child exited (${child.exitCode}) without entering ${resource}`);
    if (Date.now() >= deadline) {
      child.kill('SIGKILL');
      assert.fail(`the holder child never entered ${resource}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const release = async () => {
    fs.writeFileSync(releasePath, 'go');
    await exited;
    fs.rmSync(flagDir, { recursive: true, force: true });
  };
  return { child, exited, release };
}
