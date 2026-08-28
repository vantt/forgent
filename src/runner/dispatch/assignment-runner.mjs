// dispatch/assignment-runner.mjs — Assignment execution, Run lifecycle,
// and RunResult evidence persistence for Team Dispatch V1 (Step 01 Slices 4 & 5 / Step 03).
//
// Rules:
// - Run belongs to Assignment, not Work.
// - Always writes assignment.json before execution.
// - Always writes run.json before process spawn.
// - Always writes stdout.log, stderr.log, exit.json, evidence.json, and result.json after settlement.
// - Control-plane files are never evidence for themselves; worker-produced files or git diffs prove work.
// - Never mutates Work lifecycle state as a side effect.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { RunnerConfigError, ensureRunnerConfigForDir } from './config.mjs';
import { writeSharedConfig } from '../../config/shared-config-file.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { resolveAssignmentDispatchPolicy } from './assignment-policy.mjs';
import { renderAssignmentPrompt } from './assignment.mjs';
import { executeExecutorCli } from './cli.mjs';

/**
 * Read git HEAD sha safely without emitting error noise on non-git directories.
 *
 * @param {string} dir
 * @returns {string|null}
 */
function safeGitHead(dir) {
  if (!dir) return null;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: dir,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Classify RunResult status and confidence from execution outcome and evidence (Step 01 §11 / Step 03 §5.1).
 *
 * Confidence ladder:
 * - `failed`: timeout, nonzero exit, invalid result, or explicit failure.
 * - `verified`: structured claim says done + external evidence (such as git delta or external verification).
 * - `reported`: structured claim says done + consult/review read-only operation + worker-produced result/report artifact exists.
 * - `inferred`: no structured claim, but external evidence (git/artifact delta) exists.
 * - `no-evidence`: process settled, but no structured claim with worker artifact, and no external proof.
 *
 * @param {object} params
 * @param {number|null} params.exitCode
 * @param {string|null} params.signal
 * @param {boolean} params.isTimeout
 * @param {object|null} params.agentClaim
 * @param {string[]} params.workerArtifacts
 * @param {string[]} params.changedFiles
 * @param {boolean} params.isReadOnlyOperation
 * @returns {{ status: 'done'|'blocked'|'failed'|'no-evidence', confidence: 'verified'|'reported'|'inferred'|'no-evidence'|'failed' }}
 */
export function classifyRunEvidence({
  exitCode,
  signal,
  isTimeout,
  agentClaim,
  workerArtifacts = [],
  changedFiles = [],
  isReadOnlyOperation = true,
}) {
  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {
    return { status: 'failed', confidence: 'failed' };
  }

  if (agentClaim?.status === 'failed') {
    return { status: 'failed', confidence: 'failed' };
  }

  if (agentClaim?.status === 'blocked') {
    return { status: 'blocked', confidence: 'reported' };
  }

  const hasExternalEvidence = changedFiles.length > 0;
  const hasWorkerReport = workerArtifacts.length > 0;

  if (agentClaim && agentClaim.status === 'done') {
    // Verified requires external evidence (git delta / external test proof)
    if (hasExternalEvidence) {
      return { status: 'done', confidence: 'verified' };
    }
    // Reported for read-only consult/review when a worker-produced result or report artifact exists
    if (isReadOnlyOperation && hasWorkerReport) {
      return { status: 'done', confidence: 'reported' };
    }
    return { status: 'no-evidence', confidence: 'no-evidence' };
  }

  // Inferred when external evidence exists without structured claim
  if (hasExternalEvidence) {
    return { status: 'done', confidence: 'inferred' };
  }

  // A settled process with no claim/report and no external proof is always no-evidence
  return { status: 'no-evidence', confidence: 'no-evidence' };
}

/**
 * Execute an Assignment through the dispatch control plane and record full RunResult evidence (Step 01 Slice 4/5).
 *
 * @param {object} assignment Assignment object
 * @param {object} [opts]
 * @param {string} [opts.cwd]
 * @param {string} [opts.repoRoot]
 * @param {object} [opts.runnerConfig]
 * @param {object} [opts.cliOverride]
 * @param {number} [opts.timeoutMs]
 * @param {object} [opts.work]
 * @param {object} [opts.options]
 * @returns {Promise<Readonly<object>>} Stored RunResult object
 */
export async function executeAssignment(assignment, opts = {}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('executeAssignment requires an assignment object');
  }

  if (assignment.dispatch === 'human-only') {
    throw new RunnerConfigError(`cannot execute human-only operation "${assignment.operation}" via cli-spawn`);
  }

  const cwd = opts.cwd ?? process.cwd();
  const root = opts.repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  if (opts.runnerConfig) {
    writeSharedConfig(root, { runner: opts.runnerConfig });
  }
  const cfg = opts.runnerConfig ?? ensureRunnerConfigForDir(root);

  const effectivePolicy = resolveAssignmentDispatchPolicy({
    assignment,
    work: opts.work,
    runnerConfig: cfg,
    cliOverride: opts.cliOverride,
    options: opts.options,
  });

  const prompt = renderAssignmentPrompt(assignment, { cwd });

  // Storage setup under .fgos/assignments/<assignmentId>/
  const fgosDir = fgosDirFromRoot(root);
  const assignmentsDir = path.join(fgosDir, 'assignments');
  const assignmentDir = path.join(assignmentsDir, assignment.assignmentId);
  const runsDir = path.join(assignmentDir, 'runs');

  fs.mkdirSync(runsDir, { recursive: true });

  const assignmentJsonPath = path.join(assignmentDir, 'assignment.json');
  if (!fs.existsSync(assignmentJsonPath)) {
    fs.writeFileSync(assignmentJsonPath, `${JSON.stringify(assignment, null, 2)}\n`);
  }

  // Determine run attempt number
  const existingAttempts = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d));
  const attemptNum = existingAttempts.length + 1;
  const attemptStr = String(attemptNum).padStart(2, '0');
  const runDir = path.join(runsDir, attemptStr);
  fs.mkdirSync(runDir, { recursive: true });

  const runId = `run_${assignment.assignmentId}_${attemptStr}`;
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs ?? 900000;
  const startedAt = new Date().toISOString();

  const runMeta = {
    runId,
    assignmentId: assignment.assignmentId,
    attempt: attemptNum,
    executorId: effectivePolicy.executorPreference[0],
    cwd,
    startedAt,
    timeoutMs,
    status: 'running',
  };

  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(runMeta, null, 2)}\n`);

  const gitBefore = safeGitHead(cwd);

  const startTime = Date.now();
  let rawResult;
  let executionError = null;

  try {
    rawResult = await executeExecutorCli(effectivePolicy.executorPreference[0], {
      prompt,
      cwd,
      repoRoot: root,
      model: effectivePolicy.model,
      tier: effectivePolicy.tier,
      timeoutMs,
      onChunk: opts.onChunk,
      work: opts.work,
      stage: assignment.stage,
    });
  } catch (err) {
    executionError = err;
    const isTimeoutErr = err.errorClass === 'worker-timeout' || err.category === 'worker-timeout' || /timed out/i.test(err.message);
    rawResult = {
      status: isTimeoutErr ? 'timeout' : 'failed',
      signal: isTimeoutErr ? 'SIGTERM' : null,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || String(err),
    };
  }

  const durationMs = Date.now() - startTime;
  const settledAt = new Date().toISOString();

  const gitAfter = safeGitHead(cwd);

  const stdoutText = rawResult.stdout || '';
  const stderrText = rawResult.stderr || (executionError ? executionError.message : '');

  fs.writeFileSync(path.join(runDir, 'stdout.log'), stdoutText);
  fs.writeFileSync(path.join(runDir, 'stderr.log'), stderrText);

  const isTimeout = rawResult.status === 'timeout';
  const exitCode = typeof rawResult.status === 'number'
    ? rawResult.status
    : (rawResult.exitCode ?? (isTimeout ? 124 : (rawResult.status === 'failed' || executionError ? 1 : 0)));
  const signal = rawResult.signal ?? (isTimeout ? 'SIGTERM' : null);

  const exitInfo = {
    exitCode,
    signal,
    settledAt,
    durationMs,
  };
  fs.writeFileSync(path.join(runDir, 'exit.json'), `${JSON.stringify(exitInfo, null, 2)}\n`);

  // Detect worker-produced artifacts in runDir or context
  const workerArtifacts = [];
  const agentReportPath = path.join(runDir, 'agent-report.md');
  const agentResultPath = path.join(runDir, 'agent-result.json');

  if (fs.existsSync(agentReportPath)) {
    workerArtifacts.push(path.relative(root, agentReportPath));
  }
  if (fs.existsSync(agentResultPath)) {
    workerArtifacts.push(path.relative(root, agentResultPath));
  }

  let agentClaim = null;
  if (fs.existsSync(agentResultPath)) {
    try {
      agentClaim = JSON.parse(fs.readFileSync(agentResultPath, 'utf8'));
    } catch {
      agentClaim = null;
    }
  }

  const isReadOnly = assignment.role === 'reviewer' || assignment.role === 'researcher' || assignment.role === 'advisor';
  const changedFiles = (gitBefore && gitAfter && gitBefore !== gitAfter) ? ['(git-delta)'] : [];

  const { status, confidence } = classifyRunEvidence({
    exitCode,
    signal,
    isTimeout,
    agentClaim,
    workerArtifacts,
    changedFiles,
    isReadOnlyOperation: isReadOnly,
  });

  const evidenceData = {
    gitBefore,
    gitAfter,
    changedFiles,
    artifacts: workerArtifacts,
    tests: [],
  };
  fs.writeFileSync(path.join(runDir, 'evidence.json'), `${JSON.stringify(evidenceData, null, 2)}\n`);

  const runResult = {
    runId,
    assignmentId: assignment.assignmentId,
    workId: assignment.workId,
    executorId: effectivePolicy.executorPreference[0],
    policy: effectivePolicy,
    status,
    confidence,
    runtime: {
      exitCode,
      stdoutLog: path.relative(root, path.join(runDir, 'stdout.log')),
      stderrLog: path.relative(root, path.join(runDir, 'stderr.log')),
    },
    agentClaim: agentClaim ?? {
      status,
      summary: executionError ? executionError.message : (isTimeout ? 'Execution timed out' : 'Settled'),
    },
    evidence: evidenceData,
  };

  fs.writeFileSync(path.join(runDir, 'result.json'), `${JSON.stringify(runResult, null, 2)}\n`);

  return Object.freeze(runResult);
}
