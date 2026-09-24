import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { planReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const workerPath = path.join(repoRoot, 'test/runner/reconcile-apply-cas-worker.helper.mjs');

function root() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cas-'));
  fs.mkdirSync(path.join(out, '.fgos'), { recursive: true });
  return out;
}

// Spawns a real, separate node process (not an in-process call) running the
// worker helper above. `stdio: 'pipe'` so the worker's single JSON result
// object comes back over a real OS pipe, the same channel a real concurrent
// caller of applyReconciliation would use.
function runWorker(rootDir, planPath, readyFile, goFile, nowIso) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath, rootDir, planPath, readyFile, goFile, nowIso], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`worker exited ${code}: ${stderr}`)); return; }
      try { resolve(JSON.parse(stdout)); } catch (err) { reject(new Error(`worker produced non-JSON stdout ${JSON.stringify(stdout)}: ${err.message}`)); }
    });
  });
}

test('two real concurrent OS processes racing applyReconciliation against the same dead-holder plan: exactly one applies, the action log is never torn or double-written', async () => {
  const dir = root();
  // Real production per-cwd dispatch lock path/shape (see
  // reconciliation-planner.mjs's own lockFile/cwdLockHolder doc comments).
  const lockPath = path.join(dir, '.fgos', `dispatch--${encodeURIComponent(dir)}.lock`);
  const ts = Date.now();
  fs.writeFileSync(lockPath, JSON.stringify({ pid: `99999999:${ts}:deadfixture`, ts }));
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const planPath = path.join(dir, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan));

  const readyA = path.join(dir, 'ready-a');
  const readyB = path.join(dir, 'ready-b');
  const goFile = path.join(dir, 'go');

  const childA = runWorker(dir, planPath, readyA, goFile, '2026-09-15T00:00:01.000Z');
  const childB = runWorker(dir, planPath, readyB, goFile, '2026-09-15T00:00:01.000Z');

  // Release both real processes together only once BOTH have signalled
  // ready, maximizing genuine overlap between their applyReconciliation
  // calls instead of an incidentally-sequential run.
  const readyDeadline = Date.now() + 10000;
  while ((!fs.existsSync(readyA) || !fs.existsSync(readyB)) && Date.now() < readyDeadline) {
    await new Promise((r) => { setTimeout(r, 5); });
  }
  assert.equal(fs.existsSync(readyA), true, 'worker A never signalled ready');
  assert.equal(fs.existsSync(readyB), true, 'worker B never signalled ready');
  fs.writeFileSync(goFile, '1');

  const [resultA, resultB] = await Promise.all([childA, childB]);
  const outcomes = [resultA.outcome, resultB.outcome];

  // The one invariant that must hold regardless of which real process wins
  // the OS-level lock race: exactly one 'applied', never zero, never two.
  const appliedCount = outcomes.filter((o) => o === 'applied').length;
  assert.equal(appliedCount, 1, `exactly one concurrent apply must win; got ${JSON.stringify(outcomes)}`);
  for (const outcome of outcomes) {
    assert.ok(['applied', 'already-applied', 'blocked'].includes(outcome), `unexpected/corrupted concurrent outcome: ${outcome}`);
  }

  // The guard is gone exactly once -- never left half-removed.
  assert.equal(fs.existsSync(lockPath), false);

  // The action log holds exactly one well-formed 'applied' record for this
  // actionKey: JSON.parse throws on any torn/partial line from an
  // unsynchronized concurrent append, and a count other than 1 would mean a
  // lost write or a double apply.
  const logPath = path.join(dir, '.fgos', 'dispatch', 'reconciliation-actions.jsonl');
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
  const records = lines.map((line) => JSON.parse(line));
  const forThisAction = records.filter((r) => r.actionKey === plan.actionKey);
  assert.equal(forThisAction.length, 1, `action log must hold exactly one record for this action key; got ${forThisAction.length}`);
  assert.equal(forThisAction[0].outcome, 'applied');
});
