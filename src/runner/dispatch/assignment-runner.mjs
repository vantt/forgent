// dispatch/assignment-runner.mjs — Assignment execution, Run lifecycle,
// and RunResult evidence persistence for Team Dispatch V1 (Step 01 Slices 4 & 5 / Step 03 / Step 04).
//
// Rules:
// - Run belongs to Assignment, not Work.
// - Always writes assignment.json before execution.
// - Always writes run.json before process spawn.
// - Always writes stdout.log, stderr.log, exit.json, evidence.json, and result.json after settlement.
// - Control-plane files are never evidence for themselves; worker-produced files or git diffs prove work.
// - Never mutates Work lifecycle state as a side effect.
// - Step 04: dirtyBefore is subtracted from post-run dirty state; pre-existing dirty files
//   are never counted as run evidence.
// - Step 04: malformed agent-result.json produces failed/failed, not no-evidence.
// - Step 04: prompt includes concrete runDir paths for worker result artifacts.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  DEFAULT_DOMAIN,
  operationsForStage,
} from '../../state/workflow-stage-graphs.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir } from './config.mjs';
import { writeSharedConfig } from '../../config/shared-config-file.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { resolveAssignmentDispatchPolicy } from './assignment-policy.mjs';
import { renderAssignmentPrompt, isReadOnlyAssignment, validateAgentResultClaim } from './assignment.mjs';
import { executeExecutorCli } from './cli.mjs';
import { compileDispatchPlan } from './plan.mjs';

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
 * List uncommitted changed/untracked files via git status, excluding .fgos/ internal files.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function safeGitStatusFiles(dir) {
  if (!dir) return [];
  try {
    const output = execFileSync('git', ['status', '--porcelain', '-uall'], {
      cwd: dir,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const lines = output.split('\n');
    const files = [];
    for (const rawLine of lines) {
      if (!rawLine || rawLine.length < 4) continue;
      const match = rawLine.slice(3).trim();
      if (match) {
        const filePath = match.includes(' -> ') ? match.split(' -> ')[1].trim() : match;
        if (!filePath.startsWith('.fgos/') && filePath !== '.fgos') {
          files.push(filePath);
        }
      }
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * List files modified between two commit SHAs, excluding .fgos/ internal files.
 *
 * @param {string} dir
 * @param {string|null} gitBefore
 * @param {string|null} gitAfter
 * @returns {string[]}
 */
function safeGitCommittedDiffFiles(dir, gitBefore, gitAfter) {
  if (!dir || !gitBefore || !gitAfter || gitBefore === gitAfter) return [];
  try {
    const output = execFileSync('git', ['diff', '--name-only', `${gitBefore}..${gitAfter}`], {
      cwd: dir,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output
      .trim()
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('.fgos/') && s !== '.fgos');
  } catch {
    return [];
  }
}

/**
 * Compute changed files produced during the run (Step 04 §5.3).
 *
 * Post-run evidence = new dirty files + committed diffs:
 * - newDirtyFiles = dirtyAfter - dirtyBefore  (only files that were clean before the run)
 * - committedFiles = diff(gitBefore..gitAfter)
 * - changedFiles = union(newDirtyFiles, committedFiles)
 *
 * Callers MUST pass dirtyAfter from a snapshot taken immediately after execution —
 * never call safeGitStatusFiles again here. Pre-existing dirty files (dirtyBefore) are
 * excluded from evidence regardless of whether they appear in dirtyAfter.
 *
 * @param {string} dir
 * @param {string|null} gitBefore
 * @param {string|null} gitAfter
 * @param {string[]} dirtyBefore Paths already dirty BEFORE the run started (required)
 * @param {string[]} dirtyAfter  Paths dirty AFTER the run completed (required)
 * @returns {{ changedFiles: string[], changedFileReasons: Record<string,string> }}
 */
function computeChangedFiles(dir, gitBefore, gitAfter, dirtyBefore, dirtyAfter) {
  const dirtyBeforeSet = new Set(dirtyBefore ?? []);
  const committedFiles = safeGitCommittedDiffFiles(dir, gitBefore, gitAfter);

  const changedFileReasons = {};

  // New dirty files: clean before the run, dirty after.
  // Files already dirty before are conservatively excluded (ambiguous provenance).
  for (const f of (dirtyAfter ?? [])) {
    if (!dirtyBeforeSet.has(f)) {
      changedFileReasons[f] = 'new-dirty-after-run';
    }
  }

  // Committed files between gitBefore..gitAfter are always evidence
  for (const f of committedFiles) {
    changedFileReasons[f] = changedFileReasons[f]
      ? 'new-dirty-and-committed-after-run'
      : 'committed-after-run';
  }

  const changedFiles = Array.from(new Set(Object.keys(changedFileReasons))).sort();

  return { changedFiles, changedFileReasons };
}

/**
 * Classify RunResult status and confidence from execution outcome and evidence
 * (Step 01 §11 / Step 03 §5.1 / Step 04 §5.2).
 *
 * Confidence ladder:
 * - `failed`: timeout, nonzero exit, invalid result, or explicit failure.
 *   Step 04: malformed/invalid agent-result.json also produces failed/failed.
 * - `verified`: structured claim says done + external evidence (such as git delta or external verification).
 *   Step 04: only post-run evidence (new dirty files or committed diffs) qualifies.
 * - `reported`: structured claim (valid) says done + consult/review read-only operation + worker-produced result/report artifact exists.
 *   Step 04: requires a valid claim; invalid claim must not produce reported.
 * - `inferred`: no structured claim, but external evidence (git/artifact delta) exists.
 * - `no-evidence`: process settled, but no structured claim with worker artifact, and no external proof.
 *
 * @param {object} params
 * @param {number|null} params.exitCode
 * @param {string|null} params.signal
 * @param {boolean} params.isTimeout
 * @param {object|null} params.agentClaim Parsed agent-result.json content (null if absent or unparseable)
 * @param {boolean} [params.claimInvalid] True when agent-result.json was present but failed schema validation (Step 04)
 * @param {string[]} params.workerArtifacts
 * @param {string[]} params.changedFiles Post-run changed files (dirty-before already subtracted, Step 04)
 * @param {boolean} params.isReadOnlyOperation
 * @returns {{ status: 'done'|'blocked'|'failed'|'no-evidence', confidence: 'verified'|'reported'|'inferred'|'no-evidence'|'failed' }}
 */
export function classifyRunEvidence({
  exitCode,
  signal,
  isTimeout,
  agentClaim,
  claimInvalid = false,
  workerArtifacts = [],
  changedFiles = [],
  isReadOnlyOperation = true,
}) {
  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {
    return { status: 'failed', confidence: 'failed' };
  }

  // Step 04 §5.2: malformed structured claim must fail closed, not degrade to no-evidence.
  if (claimInvalid) {
    return { status: 'failed', confidence: 'failed' };
  }

  if (agentClaim?.status === 'failed') {
    return { status: 'failed', confidence: 'failed' };
  }

  if (agentClaim?.status === 'blocked') {
    return { status: 'blocked', confidence: 'reported' };
  }

  const hasExternalEvidence = changedFiles.length > 0;
  // Step 04 §5.2: agent-result.json is the structured claim, not evidence by itself.
  // A read-only operation requires either a companion report artifact (e.g. agent-report.md)
  // or explicit evidenceRefs in agent-result.json to classify as reported.
  const companionReportArtifacts = workerArtifacts.filter(
    (p) => typeof p === 'string' && !p.endsWith('agent-result.json'),
  );
  const hasEvidenceRefs = Array.isArray(agentClaim?.evidenceRefs) &&
    agentClaim.evidenceRefs.some((ref) => typeof ref === 'string' && ref.trim() !== '');
  const hasWorkerReport = companionReportArtifacts.length > 0 || hasEvidenceRefs;

  if (agentClaim && agentClaim.status === 'done') {
    // Verified requires external evidence (git delta / external test proof)
    // Step 04: changedFiles are already dirty-before-subtracted; only post-run files qualify.
    if (hasExternalEvidence) {
      return { status: 'done', confidence: 'verified' };
    }
    // Reported for read-only consult/review when a worker-produced report artifact or evidenceRefs exists.
    // Step 04: requires a valid claim (claimInvalid=false is guaranteed above) and real report artifact / evidenceRefs.
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
function validateAssignmentLegality(asgn, opts = {}) {
  if (!asgn || typeof asgn !== 'object') {
    throw new RunnerConfigError('executeAssignment requires an assignment object');
  }

  const stageOps = operationsForStage(asgn.domain, asgn.stage, { kind: asgn.workflow });
  const matchedOp = stageOps.find((o) => o.id === asgn.operation);

  if (!matchedOp) {
    throw new RunnerConfigError(
      `unknown operation "${asgn.operation}" for stage "${asgn.stage}" in domain "${asgn.domain}" (declared operations: [${stageOps.map((o) => o.id).join(', ')}])`,
    );
  }

  if (asgn.dispatch === 'human-only' || matchedOp.dispatch === 'human-only') {
    throw new RunnerConfigError(`cannot execute human-only operation "${asgn.operation}" via cli-spawn`);
  }

  return matchedOp;
}

/**
 * Execute an assignment by dispatching a worker and recording the Run & RunResult (Step 03 §5).
 *
 * @param {object} assignment Assignment object
 * @param {object} [opts] Options
 * @param {string} [opts.cwd]
 * @param {string} [opts.repoRoot]
 * @param {object} [opts.runnerConfig]
 * @param {object} [opts.cliOverride]
 * @param {number} [opts.timeoutMs]
 * @param {object} [opts.work]
 * @param {boolean} [opts.isMissionLite]
 * @param {object} [opts.options]
 * @returns {Promise<Readonly<object>>} Stored RunResult object
 */
export async function executeAssignment(assignment, opts = {}) {
  validateAssignmentLegality(assignment, opts);

  const cwd = opts.cwd ?? process.cwd();
  const root = opts.repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  if (opts.runnerConfig) {
    writeSharedConfig(root, { runner: opts.runnerConfig });
  }
  const rawCfg = opts.runnerConfig ?? ensureRunnerConfigForDir(root);
  const cfg = { ...rawCfg };
  if (rawCfg.executor) {
    const defaultExec = { allowCrossProvider: true, ...rawCfg.executor };
    cfg.executor = defaultExec;
    cfg.executors = {
      ...(rawCfg.executors || {}),
      claude: { allowCrossProvider: true, ...(rawCfg.executors?.claude || {}), ...rawCfg.executor },
      ...(rawCfg.executor.command ? { [rawCfg.executor.command]: defaultExec } : {}),
    };
  }

  // Storage setup under .fgos/assignments/<assignmentId>/
  const fgosDir = fgosDirFromRoot(root);
  const assignmentsDir = path.join(fgosDir, 'assignments');
  const assignmentDir = path.join(assignmentsDir, assignment.assignmentId);
  const runsDir = path.join(assignmentDir, 'runs');

  fs.mkdirSync(runsDir, { recursive: true });

  // Ensure persisted assignment.json is the immutable input for this Run (Step 03 §2).
  // Contract: if assignment.json already exists on disk it is THE immutable input — read it.
  // If it exists but is unreadable or corrupt, FAIL HARD rather than silently executing
  // a different assignment from memory (which would violate the immutability guarantee).
  const assignmentJsonPath = path.join(assignmentDir, 'assignment.json');
  let effectiveAssignment = assignment;
  if (!fs.existsSync(assignmentJsonPath)) {
    fs.writeFileSync(assignmentJsonPath, `${JSON.stringify(assignment, null, 2)}\n`);
  } else {
    let raw;
    try {
      raw = fs.readFileSync(assignmentJsonPath, 'utf8');
    } catch (err) {
      throw new RunnerConfigError(
        `assignment.json for "${assignment.assignmentId}" exists but could not be read: ${err.message}`,
      );
    }
    try {
      effectiveAssignment = Object.freeze(JSON.parse(raw));
    } catch (err) {
      throw new RunnerConfigError(
        `assignment.json for "${assignment.assignmentId}" is corrupt (invalid JSON): ${err.message}`,
      );
    }
  }

  validateAssignmentLegality(effectiveAssignment, opts);

  // Enforce decide-first governance gate (Step 06)
  const compiledPlan = compileDispatchPlan(cfg, {
    assignment: effectiveAssignment.assignmentId,
    assignmentItem: effectiveAssignment,
    work: effectiveAssignment.workId,
    stage: effectiveAssignment.stage,
    hasLiveTaskAccess: opts.hasLiveTaskAccess ?? false,
    cliOverride: opts.cliOverride,
  });

  if (compiledPlan.dispatch === 'human-only') {
    throw new RunnerConfigError(`cannot execute human-only operation "${effectiveAssignment.operation}" via cli-spawn`);
  }

  const effectivePolicy = resolveAssignmentDispatchPolicy({
    assignment: effectiveAssignment,
    work: opts.work,
    runnerConfig: cfg,
    cliOverride: opts.cliOverride,
    options: opts.options,
  });

  // Determine run attempt number monotonically without reusing existing dirs
  const existingAttempts = fs.readdirSync(runsDir).filter((d) => /^\d+$/.test(d));
  let maxAttempt = 0;
  for (const att of existingAttempts) {
    const num = parseInt(att, 10);
    if (!Number.isNaN(num) && num > maxAttempt) {
      maxAttempt = num;
    }
  }
  let attemptNum = maxAttempt + 1;
  let attemptStr = String(attemptNum).padStart(2, '0');
  let runDir = path.join(runsDir, attemptStr);
  while (fs.existsSync(runDir)) {
    attemptNum += 1;
    attemptStr = String(attemptNum).padStart(2, '0');
    runDir = path.join(runsDir, attemptStr);
  }
  fs.mkdirSync(runDir, { recursive: true });

  // Step 04 §5.1: pass concrete runDir so worker knows exactly where to write
  // agent-result.json and agent-report.md. Use absolute path to avoid worktree ambiguity.
  const prompt = renderAssignmentPrompt(effectiveAssignment, { cwd, runDir: path.resolve(runDir) });

  const runId = `run_${effectiveAssignment.assignmentId}_${attemptStr}`;
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs ?? 900000;
  const startedAt = new Date().toISOString();

  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(compiledPlan, null, 2)}\n`);

  const runMeta = {
    runId,
    assignmentId: effectiveAssignment.assignmentId,
    attempt: attemptNum,
    executorId: effectivePolicy.executorPreference[0],
    ...(compiledPlan ? { dispatchPlanPath: path.relative(root, dispatchPlanPath) } : {}),
    cwd,
    startedAt,
    timeoutMs,
    status: 'running',
  };

  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(runMeta, null, 2)}\n`);

  // Step 04 §5.3: snapshot dirty state BEFORE the run so pre-existing dirty files
  // are never counted as post-run evidence.
  const gitBefore = safeGitHead(cwd);
  const dirtyBefore = safeGitStatusFiles(cwd);

  const startTime = Date.now();
  let rawResult;
  let executionError = null;

  const executorId = effectivePolicy.executorPreference[0] ?? 'claude';
  try {
    rawResult = await executeExecutorCli(executorId, {
      prompt,
      cwd,
      repoRoot: root,
      runnerConfig: cfg,
      model: effectivePolicy.model,
      tier: effectivePolicy.tier,
      timeoutMs,
      onChunk: opts.onChunk,
      work: opts.work,
      stage: effectiveAssignment.stage,
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
  // Step 04 §5.3: snapshot dirty state AFTER the run for subtraction
  const dirtyAfter = safeGitStatusFiles(cwd);

  const stdoutText = rawResult.stdout || '';
  const stderrText = rawResult.stderr || (executionError ? executionError.message : '');

  fs.writeFileSync(path.join(runDir, 'stdout.log'), stdoutText);
  fs.writeFileSync(path.join(runDir, 'stderr.log'), stderrText);

  const isTimeout = rawResult.status === 'timeout';
  const exitCode = typeof rawResult.status === 'number'
    ? rawResult.status
    : (rawResult.exitCode ?? (isTimeout ? 124 : (rawResult.status === 'failed' || executionError ? 1 : 0)));
  const signal = rawResult.signal ?? (isTimeout ? 'SIGTERM' : null);

  const exitInfoData = {
    exitCode,
    signal,
    timedOut: isTimeout,
    settledAt,
    durationMs,
  };
  fs.writeFileSync(path.join(runDir, 'exit.json'), `${JSON.stringify(exitInfoData, null, 2)}\n`);

  // Detect worker-produced artifacts in runDir (Step 04 §5.5)
  const agentReportPath = path.join(runDir, 'agent-report.md');
  const agentResultPath = path.join(runDir, 'agent-result.json');

  // Step 04 §5.2: validate agent-result.json; invalid schema must produce failed/failed.
  let agentClaim = null;
  let claimInvalid = false;
  const agentResultExists = fs.existsSync(agentResultPath);
  if (agentResultExists) {
    let parsedClaim;
    let parseError = false;
    try {
      parsedClaim = JSON.parse(fs.readFileSync(agentResultPath, 'utf8'));
    } catch {
      parseError = true;
    }
    if (parseError) {
      // Malformed JSON: treat as invalid claim (not absent)
      claimInvalid = true;
    } else {
      const validation = validateAgentResultClaim(parsedClaim);
      if (validation.valid) {
        agentClaim = parsedClaim;
      } else {
        // Present but invalid schema: fail closed
        claimInvalid = true;
      }
    }
  }

  // Build worker artifact list (agent-report.md and agent-result.json are worker-produced).
  // Control-plane files (result.json, evidence.json, etc.) are never listed here.
  const workerArtifacts = [];
  const agentReportExists = fs.existsSync(agentReportPath);
  if (agentReportExists) {
    workerArtifacts.push({
      path: path.relative(root, agentReportPath),
      kind: 'agent-report',
      valid: true,
    });
  }
  if (agentResultExists) {
    workerArtifacts.push({
      path: path.relative(root, agentResultPath),
      kind: 'agent-result',
      valid: !claimInvalid,
    });
  }
  // Flatten to paths for classifyRunEvidence (string[] interface preserved for compat)
  const workerArtifactPaths = workerArtifacts.map((a) => a.path);

  // Step 04 §5.4: use isReadOnlyAssignment helper instead of inline role check
  const isReadOnly = isReadOnlyAssignment(effectiveAssignment);

  // Step 04 §5.3: subtract dirtyBefore from changed files computation.
  // dirtyAfter must be passed explicitly — not re-snapshotted inside computeChangedFiles —
  // so pre-existing dirty files are excluded from post-run evidence.
  const { changedFiles, changedFileReasons } = computeChangedFiles(cwd, gitBefore, gitAfter, dirtyBefore, dirtyAfter);

  const { status, confidence } = classifyRunEvidence({
    exitCode,
    signal,
    isTimeout,
    agentClaim,
    claimInvalid,
    workerArtifacts: workerArtifactPaths,
    changedFiles,
    isReadOnlyOperation: isReadOnly,
  });

  // Step 04 §5.5: richer evidence.json with provenance fields.
  // Keep changedFiles for backward compatibility; add richer fields beside it.
  const evidenceData = {
    operationMutability: isReadOnly ? 'read-only' : 'mutates-repo',
    gitBefore,
    gitAfter,
    dirtyBefore,
    dirtyAfter,
    changedFiles,
    changedFileReasons,
    artifacts: workerArtifacts,
    tests: [],
  };
  fs.writeFileSync(path.join(runDir, 'evidence.json'), `${JSON.stringify(evidenceData, null, 2)}\n`);

  const runResult = {
    runId,
    assignmentId: effectiveAssignment.assignmentId,
    workId: effectiveAssignment.workId,
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
      summary: claimInvalid
        ? 'agent-result.json was present but failed schema validation'
        : (executionError ? executionError.message : (isTimeout ? 'Execution timed out' : 'Settled')),
    },
    evidence: {
      // changedFiles at top level for RunResult backward compatibility (Step 03 §5 shape)
      gitBefore,
      gitAfter,
      changedFiles,
      artifacts: workerArtifactPaths,
      tests: [],
    },
  };

  fs.writeFileSync(path.join(runDir, 'result.json'), `${JSON.stringify(runResult, null, 2)}\n`);

  return Object.freeze(runResult);
}
