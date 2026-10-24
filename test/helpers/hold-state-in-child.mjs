// Hold the state hot mutex of one `.fgos` in a real child process, so a test can see a writer time out on
// it and then kill the holder. The child sits inside a real `withStateTx` until it is killed.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOT_LOCK_MOD = fileURLToPath(new URL('../../src/state/hot-lock.mjs', import.meta.url));

/** Resolves once the child holds the mutex: `{ child, exited }`; `exited` resolves when the child is gone. */
export async function holdStateInChild(fgosDir, { readyTimeoutMs = 10000 } = {}) {
  const readyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-state-holder-'));
  const readyPath = path.join(readyDir, 'ready');
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { withStateTx } from ${JSON.stringify(HOT_LOCK_MOD)};
    withStateTx(${JSON.stringify(fgosDir)}, () => {
      fs.writeFileSync(${JSON.stringify(readyPath)}, 'held');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 120000);
    }, { prefetched: { writer: 'state-holder' } });
  `], { stdio: 'ignore' });
  const exited = new Promise(resolve => child.once('exit', resolve));
  const deadline = Date.now() + readyTimeoutMs;
  try {
    while (!fs.existsSync(readyPath)) {
      if (child.exitCode !== null) assert.fail(`the holder child exited (${child.exitCode}) without taking the state mutex`);
      if (Date.now() >= deadline) {
        child.kill('SIGKILL');
        assert.fail('the holder child never took the state mutex');
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } finally {
    fs.rmSync(readyDir, { recursive: true, force: true });
  }
  return { child, exited };
}
