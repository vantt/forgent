import { spawn } from 'node:child_process';

function runPlan(plan) {
  return spawn(plan.command, plan.args);
}

export function commitWithDeadline() {
  return runPlan({ command: 'timeout', args: ['--kill-after=5', '30', 'git', 'commit', '-qm', 'x'] });
}
