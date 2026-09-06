import fs from 'node:fs';
import path from 'node:path';
const cwd = process.cwd();
const markerPath = path.join(cwd, 'exec-slow-started.marker');
fs.writeFileSync(markerPath, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }, null, 2));
// Deliberately slow: gives the P05.1 crash-proof driver a real window to
// observe this process running, then kill -9 the PARENT `fgos coordination
// run` process before this settles the assignment.
await new Promise((resolve) => setTimeout(resolve, 25000));
const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
if (fs.existsSync(assignmentsRoot)) {
  for (const asgn of fs.readdirSync(assignmentsRoot)) {
    const runsDir = path.join(assignmentsRoot, asgn, 'runs');
    if (!fs.existsSync(runsDir)) continue;
    for (const run of fs.readdirSync(runsDir)) {
      const runDir = path.join(runsDir, run);
      if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
        fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nSettled by exec-slow (should never be seen if the kill worked).\n');
        fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by exec-slow.' }));
      }
    }
  }
}
fs.writeFileSync(path.join(cwd, 'exec-slow-finished.marker'), new Date().toISOString());
process.stdout.write('done\n');
