// Worker process for the concurrent-apply CAS proof in
// dispatch-reconciliation-concurrency.test.mjs. Spawned as a real, separate
// OS process (never an in-process fs.readFileSync monkeypatch), so
// the local-lock file contention and the action-log append it exercises are
// genuine concurrent filesystem operations between two independent
// processes, not a simulation of one.
//
// Not a *.test.mjs file on purpose: npm test's glob (test/**/*.test.mjs)
// must never pick this up and try to run it as its own suite -- it only
// makes sense invoked with the positional args below.
import fs from 'node:fs';
import { applyReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';

const [, , rootDir, planPath, readyFile, goFile, nowIso] = process.argv;

fs.writeFileSync(readyFile, String(process.pid));

// Spin on the parent's shared release signal so both worker processes' real
// applyReconciliation calls land as close together as two independent OS
// processes can get -- the parent only writes `goFile` once both workers
// have signalled ready via their own `readyFile`.
const deadline = Date.now() + 10000;
while (!fs.existsSync(goFile) && Date.now() < deadline) {
  // busy-wait
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const result = applyReconciliation(rootDir, plan, { now: nowIso });
process.stdout.write(JSON.stringify(result));
