import './process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { waitForSealChildrenOf } from './process-tmp-root.mjs';

// The detached `fgos events sync` child an fgctl run leaves behind runs a script from the release under the state home and keeps writing into that home after the command returned. Proves the wait ends only when such a child is gone, so removing the home right after cannot meet a writer (no existing test owns this wait, which removeTree in the fgctl fixture relies on).
test('waitForSealChildrenOf returns only after a detached sync child running from the directory has ended', { skip: process.platform === 'win32' && 'no /proc process facts' }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seal-wait-'));
  const script = path.join(dir, 'writer.mjs');
  fs.writeFileSync(script, `import fs from 'node:fs'; for (let i = 0; i < 40; i++) { fs.writeFileSync(${JSON.stringify(dir)} + '/w' + i, 'x'); await new Promise((r) => setTimeout(r, 25)); }\n`);
  const child = spawn(process.execPath, [script, 'events', 'sync', '--opportunistic'], { detached: true, stdio: 'ignore' });
  child.unref();
  await new Promise((r) => setTimeout(r, 300)); // the process door loads asynchronously and the child needs to be running
  assert.ok(fs.readdirSync(dir).length < 41, 'the writer is still running when the wait starts');
  waitForSealChildrenOf(dir);
  assert.equal(fs.readdirSync(dir).length, 41, 'the writer finished all its writes before the wait returned');
  fs.rmSync(dir, { recursive: true, maxRetries: 0 });
  assert.equal(fs.existsSync(dir), false);
});
