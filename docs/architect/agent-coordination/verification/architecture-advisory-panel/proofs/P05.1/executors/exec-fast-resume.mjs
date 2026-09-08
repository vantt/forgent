import fs from 'node:fs';
import path from 'node:path';
const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
if (fs.existsSync(assignmentsRoot)) {
  for (const asgn of fs.readdirSync(assignmentsRoot)) {
    const runsDir = path.join(assignmentsRoot, asgn, 'runs');
    if (!fs.existsSync(runsDir)) continue;
    for (const run of fs.readdirSync(runsDir)) {
      const runDir = path.join(runsDir, run);
      if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
        fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nSettled by exec-fast-resume, from the FRESH process after the real kill -9 (P05.1 crash-recovery proof).\n');
        fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by exec-fast-resume after crash recovery.' }));
      }
    }
  }
}
process.stdout.write('done\n');
