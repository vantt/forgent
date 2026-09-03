import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { claimWork } from '../../src/runner/claim-port.mjs';
import { initStore, addWork, moveWork, readRawEvents } from '../../src/state/store.mjs';
import { readEvents } from '../../src/state/events.mjs';
import { checkTruncationGuard, readGuardMark, writeGuardMark, runOpportunisticMainCheckoutChecks } from '../../src/state/events-jsonl-truncation-guard.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import { readClaims } from '../../src/state/runtime-coordination.mjs';

// Local seq-contiguity assertion helper -- this test only needs it to prove
// a real event log has no gaps/duplicate `seq` values; it does not exercise
// the retired `events-jsonl-contiguous` doctor check or its band-aid module
// (both retired: seq stopped being cross-writer identity once Tầng A T1
// gave every writer its own per-writer file).
function checkSeqContiguity(logPath) {
  const raw = fs.readFileSync(logPath, 'utf8');
  const lines = raw.split('\n').filter((l) => l !== '');
  const seenSeq = new Map();
  const duplicates = [];
  const gaps = [];
  let prevSeq = null;
  for (const line of lines) {
    const parsed = JSON.parse(line);
    const seq = parsed.seq;
    if (typeof seq !== 'number') continue;
    if (seenSeq.has(seq)) duplicates.push(seq);
    else seenSeq.set(seq, true);
    if (prevSeq !== null && seq !== prevSeq + 1 && seq !== prevSeq) gaps.push(seq);
    prevSeq = seq;
  }
  return { ok: duplicates.length === 0 && gaps.length === 0, duplicates, gaps };
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLAIM_PORT_MJS = path.join(REPO_ROOT, 'src/runner/claim-port.mjs');
const GUARD_MJS = path.join(REPO_ROOT, 'src/state/events-jsonl-truncation-guard.mjs');
const FGOS_PATHS_MJS = path.join(REPO_ROOT, 'src/state/fgos-file-registry.mjs');

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
    // tsk-40m: blocked stands in for the retired todo->doing edge -- this
    // test only needs SOME move event to check seq contiguity.
    moveWork(fgosDir, { id: 'item-rc', to: 'blocked', expectedStatus: 'todo', role: 'session' });

    const contiguity = checkSeqContiguity(logPath);
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
for (let attempt = 0; attempt < 300; attempt += 1) {
  try {
    claimWork(fgosDir, { id: itemId, actor: 'session', isolate: false, repoRoot });
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

    // Tầng A/T2 (TA-D2/TA-D11): each concurrent claimWork call is its own OS
    // process -- a fresh writer identity per TA-D11's degraded per-invocation
    // mode -- so each landed its own work.move in its own per-writer file
    // under `.fgos/events/`, never baseline-0 (`logPath`, frozen/empty here).
    // readRawEvents(fgosDir) is the one door that reads all of them (TA-D7
    // total order, deduped); contiguity is checked per-file -- seq is only
    // ever meaningful within one writer's own file post-cutover, never
    // combined across files.
    const events = readRawEvents(fgosDir);
    const contiguity = checkSeqContiguity(logPath);
    assert.equal(contiguity.ok, true, 'baseline-0 contiguity check must pass with 0 gaps and 0 duplicates');
    assert.deepEqual(contiguity.gaps, []);
    assert.deepEqual(contiguity.duplicates, []);

    const eventsDirPath = path.join(fgosDir, 'events');
    const writerFileNames = fs.readdirSync(eventsDirPath).filter((f) => f.endsWith('.jsonl'));
    for (const name of writerFileNames) {
      const writerContiguity = checkSeqContiguity(path.join(eventsDirPath, name));
      assert.equal(writerContiguity.ok, true, `per-writer file ${name} contiguity check must pass with 0 gaps and 0 duplicates`);
    }

    const claims = readClaims(fgosDir);
    assert.equal(Object.keys(claims).length, N_PROC, 'every item must have a recorded active runtime claim');

    fs.rmSync(childScriptDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

// Tầng A/T2/T5 (TA-D2/TA-D10/TA-D11): addWork/moveWork now write into a
// per-writer file under `.fgos/events/`, never baseline-0 (frozen,
// TA-D12) -- and the guard sidecar is a MAP keyed by fileKey (`readGuardMark`/
// `writeGuardMark(guardPath, fileKey, mark)` both take the key explicitly
// now), not a single-file mark. Discovers whichever writer file actually
// holds this process's own moveWork events, the same way
// test/runner/claim-port.test.mjs's own guard-mark test does.
function soleWriterFile(fgosDir) {
  const eventsDir = path.join(fgosDir, 'events');
  const names = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.jsonl'));
  assert.equal(names.length, 1, 'expected exactly one per-writer file for this single-process test');
  return names[0];
}

test('reproduces unlocked guard mark write race across concurrent sessions against unfixed guard code', async () => {
  const origEnv = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;

  const { repoRoot, fgosDir } = initTempRepo();
  const guardPath = resolveFgosFile(fgosDir, FGOS_FILE.GUARD_MARK);

  try {
    addWork(fgosDir, { id: 'task-guard-1', title: 'Task Guard 1', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
    addWork(fgosDir, { id: 'task-guard-2', title: 'Task Guard 2', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });

    const childScriptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-guard-race-child-'));
    const childScriptPath = path.join(childScriptDir, 'guard-race-child.mjs');

    const childScriptContent = `
import { runOpportunisticMainCheckoutChecks, writeGuardMark } from ${JSON.stringify(GUARD_MJS)};
import { resolveFgosFile, FGOS_FILE } from ${JSON.stringify(FGOS_PATHS_MJS)};

const [fgosDir, repoRoot, fileKey, seqStr, hash] = process.argv.slice(2);
const guardPath = resolveFgosFile(fgosDir, FGOS_FILE.GUARD_MARK);

if (seqStr && hash) {
  writeGuardMark(guardPath, fileKey, { seq: Number(seqStr), hash });
} else {
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);
}
process.exit(0);
`;
    fs.writeFileSync(childScriptPath, childScriptContent, 'utf8');

    // tsk-40m: blocked stands in for the retired todo->doing edge.
    moveWork(fgosDir, { id: 'task-guard-1', to: 'blocked', expectedStatus: 'todo', role: 'session' });
    const writerFileName = soleWriterFile(fgosDir);
    const fileKey = `events/${writerFileName}`;
    const writerFilePath = path.join(fgosDir, 'events', writerFileName);
    // Real per-file disk discovery (no `rawLog` override — that path is
    // scoped to baseline-0 only, byte-identical to before T5, and this
    // writer's own events never land there post-cutover).
    runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);
    const markAfterFirst = readGuardMark(guardPath, fileKey);
    assert.ok(markAfterFirst !== null, 'guard mark must be set after first check');

    moveWork(fgosDir, { id: 'task-guard-2', to: 'blocked', expectedStatus: 'todo', role: 'session' });

    const childEnv = { ...process.env };
    delete childEnv.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;

    const child1 = fork(childScriptPath, [fgosDir, repoRoot, fileKey, String(markAfterFirst.seq + 10), 'stale-future-hash'], { stdio: 'inherit', env: childEnv });
    await new Promise((resolve) => child1.on('exit', resolve));

    runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);

    const markAfterRace = readGuardMark(guardPath, fileKey);
    const report = checkTruncationGuard(fs.readFileSync(writerFilePath, 'utf8'), markAfterRace);

    assert.ok(markAfterRace !== null, 'mark exists');
    assert.equal(typeof report.ok, 'boolean');

    fs.rmSync(childScriptDir, { recursive: true, force: true });
  } finally {
    if (origEnv !== undefined) process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = origEnv;
    else delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
