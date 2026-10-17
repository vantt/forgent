// Hold one registry lock in a real child process, so a test can see another
// process holding it and then SIGKILL that holder.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOLDER_LOCK_MOD = fileURLToPath(new URL('../../src/holder-lock/index.mjs', import.meta.url));

/**
 * Starts a child that acquires `name` with `params` and keeps it until killed.
 * Resolves once the lock is held: `{ child, exited }`, where `exited` resolves
 * when the child is gone.
 */
export async function holdLockInChild(name, params, { readyTimeoutMs = 10000 } = {}) {
  const readyPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-holder-')), 'ready');
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireSync, createLockScope } from ${JSON.stringify(HOLDER_LOCK_MOD)};
    const res = acquireSync(createLockScope('holder'), ${JSON.stringify(name)}, ${JSON.stringify(params)});
    if (res.result !== 'acquired') process.exit(3);
    fs.writeFileSync(${JSON.stringify(readyPath)}, 'held');
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const deadline = Date.now() + readyTimeoutMs;
  try {
    while (!fs.existsSync(readyPath)) {
      if (child.exitCode !== null) assert.fail(`the holder child exited (${child.exitCode}) without taking ${name}`);
      if (Date.now() >= deadline) {
        child.kill('SIGKILL');
        assert.fail(`the holder child never took ${name}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } finally {
    fs.rmSync(path.dirname(readyPath), { recursive: true, force: true });
  }
  return { child, exited };
}
