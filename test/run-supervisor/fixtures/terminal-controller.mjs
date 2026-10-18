// A controller of the terminal-mode tests, run as its own process so a test can kill it. It dispatches one
// herdr-spawn Assignment through executeAssignment and prints the settled run result as one JSON line.
// The job arrives in TERMINAL_CONTROLLER_JOB: { repoDir, workId, executor, timeoutMs, idleTimeoutMs }.
import { executeAssignment } from '../../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../../helpers/declared-assignment.mjs';

const job = JSON.parse(process.env.TERMINAL_CONTROLLER_JOB);
const assignment = buildAssignment({
  workId: job.workId,
  operation: 'implement-item',
  stage: 'executing',
  role: 'implement',
  description: job.description ?? 'terminal mode test',
});
const runnerConfig = {
  executor: job.executor,
  modelPolicies: { claude: { standard: 'sonnet' }, ...(job.modelPolicies ?? {}) },
  rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  timeoutMs: job.timeoutMs ?? 60_000,
  ...(job.idleTimeoutMs ? { idleTimeoutMs: job.idleTimeoutMs } : {}),
};
try {
  const result = await executeAssignment(assignment, {
    cwd: job.repoDir,
    repoRoot: job.repoDir,
    runnerConfig,
    isReadOnlyMode: false,
    ...(job.dispatchBatchKey ? { dispatchBatchKey: job.dispatchBatchKey } : {}),
  });
  process.stdout.write(`${JSON.stringify({ ok: true, result: result.runResult ?? result })}\n`);
} catch (err) {
  process.stdout.write(`${JSON.stringify({ ok: false, code: err.code ?? null, message: err.message })}\n`);
  process.exitCode = 1;
}
