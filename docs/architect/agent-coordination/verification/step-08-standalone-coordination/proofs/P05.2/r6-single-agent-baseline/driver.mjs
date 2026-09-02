// P05.2 R6 driver: one bounded single-agent baseline dispatch against the
// FROZEN external case (case-lock.md, commit 7910fc22), through the normal
// governed dispatch path -- openStandaloneSession + dispatchPrimaryTask
// (session-engine.mjs), never a bespoke dispatch call. Real cli-spawn
// subprocess (the real, unmodified `claude` executor from .fgos/config.json),
// no mocks, no stubs. mutation: 'read-only' throughout; workspace is an
// isolated tempDir, never the real repo checkout.
//
// Tier judgment call (recorded here, not silently decided): dispatched at
// 'critical' tier via opts.cliOverride -- the SAME tier ceiling R7's own
// final recommend-with-dissent step uses -- on the plain 'claude' executor
// (the single most standard default), so the baseline is not artificially
// reasoning-starved relative to the framework's own strongest step. This is
// a legitimate use of the EXISTING opts.cliOverride channel dispatchPrimaryTask
// already forwards unchanged to executeAssignment/resolveAssignmentDispatchPolicy
// (same governed resolution path every other real dispatch in this codebase
// uses) -- never a second, bespoke dispatch mechanism.
// budget.timeoutMs / real spawn timeoutMs: 600000ms (10 min), longer than
// DEFAULT_TASK_TIMEOUT_MS's 300000ms default, decided BEFORE dispatch (never
// changed mid-run) because a real 'critical'-tier (opus) single-shot answer
// to a multi-part architecture question needs more real wall time than the
// 5-minute default.
//
// Run: node driver.mjs > run.log 2>&1

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openStandaloneSession, dispatchPrimaryTask } from '/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs';
import { readManifest } from '/home/vantt/projects/forgentX/src/runner/coordination/store.mjs';
import { CASE_BRIEF } from '../case-brief.mjs';

const REPO_ROOT = '/home/vantt/projects/forgentX';
const ARTIFACT_DIR = path.dirname(new URL(import.meta.url).pathname);

const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner;

console.log('=== P05.2 R6: single-agent baseline, real cli-spawn, real .fgos/config.json ===\n');
console.log('--- git status --porcelain (forgentX, BEFORE) ---');
console.log(execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }) || '(clean)');

const tempDir = fs.mkdtempSync('/tmp/fgos-p052-r6-baseline-');
console.log('Workspace (isolated, no git repo, no secrets written):', tempDir);

const objective = `${CASE_BRIEF}

=== Your task ===
You are a single agent asked to answer the objective above, alone, in one bounded pass -- no other agent, no follow-up round, no clarification. Produce a written assessment that:
1. States whether the proposed new, separate editor screen is architecturally simple, and why.
2. Names the single largest risk/blocker explicitly.
3. Names concrete decision criteria a real decision-maker would use.
4. Names any alternatives you considered and why you did not recommend them.
5. Names any unsupported assumptions you had to make.
Be concrete and grounded in the frozen context above -- do not invent facts about mdview's architecture beyond what is quoted.`;

const writerId = 'p05.2-r6-baseline-driver';
const timeoutMs = 600000; // 10 min, recorded before dispatch, never changed mid-run

const manifest = openStandaloneSession(
  {
    objective: 'P05.2 R6: single-agent baseline against the frozen mdview editor-screen case.',
    writerId,
    primaryRole: 'advisor',
  },
  { cwd: tempDir },
);
console.log('Session opened:', manifest.coordinationId, 'actors:', manifest.actors.map((a) => a.id));

const start = Date.now();
let dispatchResult = null;
let dispatchError = null;
try {
  dispatchResult = await dispatchPrimaryTask(
    manifest.coordinationId,
    {
      objective,
      expectedOutputs: [
        'A written architectural-simplicity judgment',
        'The single largest risk/blocker, named explicitly',
        'Concrete decision criteria',
        'Alternatives considered',
        'Unsupported assumptions named',
      ],
      evidenceRequired: 'reported',
      writerId,
    },
    {
      cwd: tempDir,
      repoRoot: tempDir,
      packageRoot: REPO_ROOT,
      runnerConfig,
      timeoutMs,
      cliOverride: { minTier: 'critical', preferExecutor: 'claude' },
    },
  );
} catch (err) {
  dispatchError = err;
}
const elapsedMs = Date.now() - start;

console.log('\nWall time (dispatch to settled):', elapsedMs, 'ms');

if (dispatchError) {
  console.log('\nR6 DISPATCH FAILED:');
  console.log(' ', dispatchError.constructor.name + ':', dispatchError.message);
} else {
  const { assignment, runResult, resumed } = dispatchResult;
  console.log('\n--- Assignment ---');
  console.log('assignmentId:', assignment.assignmentId);
  console.log('resumed:', resumed);
  console.log('\n--- RunResult ---');
  console.log('runId:', runResult.runId);
  console.log('status:', runResult.status, ' confidence:', runResult.confidence);
  console.log('retries (attempts beyond the first):', runResult.attempt !== undefined ? runResult.attempt - 1 : 'unknown');
  console.log('\n--- Resolved provenance ---');
  console.log('executor:', runResult.policy?.provenance?.executor?.value, JSON.stringify(runResult.policy?.provenance?.executor?.source));
  console.log('provider:', runResult.policy?.provenance?.provider?.value);
  console.log('model:', runResult.policy?.provenance?.model?.value);
  console.log('tier:', runResult.policy?.provenance?.tier?.value, JSON.stringify(runResult.policy?.provenance?.tier?.source));
  console.log('cost/tokens (from real RunResult, else "unknown"):', JSON.stringify(runResult.usage ?? runResult.cost ?? 'unknown'));
  console.log('\n--- agentClaim.summary ---');
  console.log(runResult.agentClaim?.summary ?? '(none)');
  console.log('\n--- Full RunResult JSON (for the report/rubric self-assessment) ---');
  console.log(JSON.stringify(runResult, null, 2));

  fs.writeFileSync(path.join(ARTIFACT_DIR, 'run-result.json'), JSON.stringify(runResult, null, 2));
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'assignment.json'), JSON.stringify(assignment, null, 2));

  // Copy the real report file the executor wrote, if any, for direct reading.
  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  if (fs.existsSync(runsDir)) {
    for (const attempt of fs.readdirSync(runsDir)) {
      const reportPath = path.join(runsDir, attempt, 'agent-report.md');
      if (fs.existsSync(reportPath)) {
        fs.copyFileSync(reportPath, path.join(ARTIFACT_DIR, `agent-report-attempt-${attempt}.md`));
        console.log(`\n(copied real agent-report.md for attempt ${attempt} to artifact dir)`);
      }
    }
  }
}

const finalManifest = readManifest(manifest.coordinationId, { cwd: tempDir });
fs.writeFileSync(path.join(ARTIFACT_DIR, 'session-manifest.json'), JSON.stringify(finalManifest, null, 2));

console.log('\n--- git status --porcelain (forgentX, AFTER) ---');
console.log(execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }) || '(clean)');

console.log('\n=== P05.2 R6 SUMMARY ===');
console.log('Dispatch:', dispatchError ? `FAILED: ${dispatchError.message}` : `settled, status=${dispatchResult.runResult.status}, confidence=${dispatchResult.runResult.confidence}`);
console.log('Wall time:', elapsedMs, 'ms');
console.log('Workspace (for independent inspection):', tempDir);
