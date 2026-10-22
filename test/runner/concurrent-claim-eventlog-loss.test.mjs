import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { activateGitFixture } from './worktree-native-fixture.helper.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';
import { readClaims } from '../../src/state/runtime-coordination.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLAIM_PORT_MJS = pathToFileURL(path.join(REPO_ROOT, 'src/runner/claim-port.mjs')).href;

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-concurrent-claim-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  activateGitFixture(repoRoot);

  const fgosDir = path.join(repoRoot, '.fgos');
  initStore(fgosDir);
  return { repoRoot, fgosDir };
}

test('runs genuinely concurrent fgos claim calls across real OS processes with a barrier', async () => {
  const { repoRoot, fgosDir } = initTempRepo();
  const N_PROC = 6;

  try {
    for (let i = 0; i < N_PROC; i += 1) {
      addWork(fgosDir, { id: `task-${i}`, title: `Task ${i}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
    }

    const childScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-concurrent-claim-child-'));
    const childScriptPath = path.join(childScriptDir, 'claim-child.mjs');

    const childScriptContent = `
import { claimWork } from ${JSON.stringify(CLAIM_PORT_MJS)};

const [repoRoot, fgosDir, itemId, startAtStr] = process.argv.slice(2);
const startAt = Number(startAtStr);
const waitMs = startAt - Date.now();
if (waitMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);

let claimed = false;
for (let attempt = 0; attempt < 300; attempt += 1) {
  try {
    await claimWork(fgosDir, { id: itemId, actor: 'session', isolate: false, repoRoot });
    claimed = true;
    break;
  } catch (err) {
    if (err?.code === 'lock-held' || err?.category === 'lock-timeout' || err?.category === 'lock-held' || err?.message?.includes('lock')) {
      await new Promise((r) => setTimeout(r, 20 + Math.floor(Math.random() * 30)));
      continue;
    }
    console.error(err);
    process.exit(1);
  }
}

if (!claimed) {
  console.error('Timed out acquiring claim lock');
  process.exit(1);
}
process.exit(0);
`;
    fs.writeFileSync(childScriptPath, childScriptContent, 'utf8');

    const startAt = Date.now() + 300;
    const exitCodes = await Promise.all(
      Array.from({ length: N_PROC }, (_, i) =>
        new Promise((resolve) => {
          const child = fork(childScriptPath, [repoRoot, fgosDir, `task-${i}`, String(startAt)], { stdio: 'inherit' });
          child.on('exit', (code) => resolve(code ?? 0));
        }),
      ),
    );

    assert.deepEqual(exitCodes, Array(N_PROC).fill(0), 'all concurrent claim processes must exit with code 0');

    const claims = readClaims(fgosDir);
    assert.equal(Object.keys(claims).length, N_PROC, 'every item must have a recorded active runtime claim');

    fs.rmSync(childScriptDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
