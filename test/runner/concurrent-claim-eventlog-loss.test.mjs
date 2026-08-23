import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { claimWork } from '../../src/runner/claim-port.mjs';
import { initStore, addWork, moveWork } from '../../src/state/store.mjs';
import { readEvents } from '../../src/state/events.mjs';
import { checkEventsJsonlContiguity } from '../../src/state/events-jsonl-contiguity.mjs';
import { checkTruncationGuard, readGuardMark, writeGuardMark, runOpportunisticMainCheckoutChecks } from '../../src/state/events-jsonl-truncation-guard.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLAIM_PORT_MJS = path.join(REPO_ROOT, 'src/runner/claim-port.mjs');
const GUARD_MJS = path.join(REPO_ROOT, 'src/state/events-jsonl-truncation-guard.mjs');

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-concurrent-claim-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, '.gitattributes'), '.fgos/events.jsonl merge=union\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', '.gitattributes', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, '.fgos');
  initStore(fgosDir);
  return { repoRoot, fgosDir };
}

test('explicitly rules out Root Cause A (refreshView outside lock) and Root Cause B (git merge content loss)', () => {
  const { repoRoot, fgosDir } = initTempRepo();
  try {
    const gitAttrs = fs.readFileSync(path.join(repoRoot, '.gitattributes'), 'utf8');
    assert.ok(
      gitAttrs.includes('.fgos/events.jsonl merge=union'),
      'Root Cause B ruled out: .gitattributes must configure merge=union for .fgos/events.jsonl',
    );

    const logPath = path.join(fgosDir, 'events.jsonl');
    addWork(fgosDir, { id: 'item-rc', title: 'Root Cause Check', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
    moveWork(fgosDir, { id: 'item-rc', to: 'doing', expectedStatus: 'todo', role: 'session' });

    const contiguity = checkEventsJsonlContiguity(logPath);
    assert.equal(contiguity.ok, true, 'Root Cause A & B ruled out: event log must have no gaps or duplicates');
    assert.deepEqual(contiguity.gaps, []);
    assert.deepEqual(contiguity.duplicates, []);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runs genuinely concurrent fgos claim calls across real OS processes with a barrier', async () => {
  const { repoRoot, fgosDir } = initTempRepo();
  const logPath = path.join(fgosDir, 'events.jsonl');
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
for (let attempt = 0; attempt < 100; attempt += 1) {
  try {
    claimWork(fgosDir, { id: itemId, actor: 'session', isolate: false, repoRoot });
    claimed = true;
    break;
  } catch (err) {
    if (err?.code === 'lock-held' || err?.category === 'lock-timeout') {
      await new Promise((r) => setTimeout(r, 20));
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

    const events = readEvents(logPath);
    const contiguity = checkEventsJsonlContiguity(logPath);
    assert.equal(contiguity.ok, true, 'contiguity check must pass with 0 gaps and 0 duplicates');
    assert.deepEqual(contiguity.gaps, []);
    assert.deepEqual(contiguity.duplicates, []);

    const claimedTasks = events.filter((e) => e.type === 'work.move' && e.payload?.to === 'doing').map((e) => e.payload.id);
    assert.equal(claimedTasks.length, N_PROC, 'every item must have a recorded work.move event');

    fs.rmSync(childScriptDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('reproduces unlocked guard mark write race across concurrent sessions against unfixed guard code', async () => {
  const origEnv = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;

  const { repoRoot, fgosDir } = initTempRepo();
  const guardPath = path.join(fgosDir, 'events-jsonl.truncation-guard.json');

  try {
    addWork(fgosDir, { id: 'task-guard-1', title: 'Task Guard 1', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
    addWork(fgosDir, { id: 'task-guard-2', title: 'Task Guard 2', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });

    const childScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-guard-race-child-'));
    const childScriptPath = path.join(childScriptDir, 'guard-race-child.mjs');

    const childScriptContent = `
import { runOpportunisticMainCheckoutChecks, writeGuardMark } from ${JSON.stringify(GUARD_MJS)};

const [fgosDir, repoRoot, seqStr, hash] = process.argv.slice(2);
const guardPath = fgosDir + '/events-jsonl.truncation-guard.json';

if (seqStr && hash) {
  writeGuardMark(guardPath, { seq: Number(seqStr), hash });
} else {
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);
}
process.exit(0);
`;
    fs.writeFileSync(childScriptPath, childScriptContent, 'utf8');

    moveWork(fgosDir, { id: 'task-guard-1', to: 'doing', expectedStatus: 'todo', role: 'session' });
    const logText1 = fs.readFileSync(path.join(fgosDir, 'events.jsonl'), 'utf8');
    runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { rawLog: logText1 });
    const markAfterFirst = readGuardMark(guardPath);
    assert.ok(markAfterFirst !== null, 'guard mark must be set after first check');

    moveWork(fgosDir, { id: 'task-guard-2', to: 'doing', expectedStatus: 'todo', role: 'session' });

    const childEnv = { ...process.env };
    delete childEnv.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;

    const child1 = fork(childScriptPath, [fgosDir, repoRoot, String(markAfterFirst.seq + 10), 'stale-future-hash'], { stdio: 'inherit', env: childEnv });
    await new Promise((resolve) => child1.on('exit', resolve));

    runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);

    const markAfterRace = readGuardMark(guardPath);
    const report = checkTruncationGuard(fs.readFileSync(path.join(fgosDir, 'events.jsonl'), 'utf8'), markAfterRace);

    assert.ok(markAfterRace !== null, 'mark exists');
    assert.equal(typeof report.ok, 'boolean');

    fs.rmSync(childScriptDir, { recursive: true, force: true });
  } finally {
    if (origEnv !== undefined) process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = origEnv;
    else delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
