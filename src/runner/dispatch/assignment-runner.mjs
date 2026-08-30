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
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  DEFAULT_DOMAIN,
  operationsForStage,
} from '../../state/workflow-stage-graphs.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir } from './config.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { resolveAssignmentDispatchPolicy } from './assignment-policy.mjs';
import { renderAssignmentPrompt, isReadOnlyAssignment, validateAgentResultClaim } from './assignment.mjs';
import { executeExecutorCli } from './cli.mjs';
import { compileDispatchPlan } from './plan.mjs';
import { resolveContentRoot } from '../../intake/plan.mjs';

/**
 * Check if report text is non-empty and contains substantive content (not a placeholder).
 *
 * @param {string} text
 * @returns {boolean}
 */
/**
 * Check if report text is non-empty and contains substantive content (not a placeholder).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isSubstantiveReportText(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (/^(todo|n\/?a|none|tbd|placeholder|null|undefined)[\s.!\-:#]*$/i.test(trimmed)) {
    return false;
  }

  const words = trimmed.toUpperCase().match(/\b[A-Z0-9_-]+\b/g) || [];
  if (words.length === 0) return false;

  const GENERIC_KEYWORDS = new Set([
    'TODO', 'N', 'A', 'NA', 'NONE', 'TBD', 'PLACEHOLDER', 'NULL', 'UNDEFINED',
    'DONE', 'PASSED', 'PASS', 'FAIL', 'FAILED', 'REJECTED', 'READY', 'SUMMARY',
    'VERDICT', 'REPORT', 'OK', 'STATUS', 'YES', 'NO', 'RESULT', 'RESULTS',
    'CHECK', 'TITLE', 'HEADER', 'NOTES', 'NOTE', 'DETAILS', 'FINDINGS',
  ]);

  const nonGenericWords = words.filter((w) => !GENERIC_KEYWORDS.has(w));
  if (nonGenericWords.length === 0) {
    return false;
  }

  const hasExplicitPlaceholder = /\b(todo|n\/?a|none|tbd|placeholder)\b/i.test(trimmed);
  if (hasExplicitPlaceholder && nonGenericWords.length < 3) {
    return false;
  }

  return true;
}

/**
 * Validate that an evidenceRef is substantive and not a placeholder or fabricated reference.
 *
 * @param {string} ref
 * @param {object} [opts]
 * @returns {boolean}
 */
export function isSubstantiveEvidenceRef(ref, opts = {}) {
  if (typeof ref !== 'string') return false;
  const trimmed = ref.trim();
  if (!trimmed) return false;
  if (/^(todo|n\/?a|na|none|none\.txt|placeholder|tbd|null|undefined)[\s.!\-#]*$/i.test(trimmed)) {
    return false;
  }

  if (/^(evidence|diff|verify|test|doc|file|git):/i.test(trimmed)) {
    const value = trimmed.split(':')[1]?.trim();
    if (!value || /^(todo|n\/?a|na|none|placeholder|tbd)$/i.test(value)) return false;
    return true;
  }

  const cwd = opts.cwd || opts.repoRoot;
  if (cwd && fs.existsSync(path.resolve(cwd, trimmed))) {
    return true;
  }

  const known = new Set([
    ...(opts.assignment?.contextRefs || []),
    ...(opts.work?.refs || []),
    ...(opts.choice?.contextRefs || []),
  ]);
  if (known.has(trimmed)) {
    return true;
  }

  if (cwd || known.size > 0) {
    return false;
  }

  return !/^[a-z0-9_-]+$/i.test(trimmed) || trimmed.includes('/') || trimmed.includes('.');
}

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
 * Roll back any repository state modifications caused by a read-only operation.
 * Restores modified tracked files and removes newly created untracked files in dir,
 * ignoring pre-existing dirty files in dirtyBefore.
 */
function rollbackReadOnlyMutations(dir, changedFiles, dirtyBefore, gitBefore, gitAfter) {
  if (!dir || !Array.isArray(changedFiles) || changedFiles.length === 0) return;
  const dirtyBeforeSet = new Set(dirtyBefore ?? []);

  if (gitBefore && gitAfter && gitBefore !== gitAfter) {
    try {
      execFileSync('git', ['reset', '--soft', gitBefore], {
        cwd: dir,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    } catch {
      // ignore
    }
  }

  for (const relPath of changedFiles) {
    if (dirtyBeforeSet.has(relPath)) {
      continue;
    }
    const fullPath = path.join(dir, relPath);
    let existedAtBefore = false;
    if (gitBefore) {
      try {
        execFileSync('git', ['cat-file', '-e', `${gitBefore}:${relPath}`], {
          cwd: dir,
          stdio: ['ignore', 'ignore', 'ignore'],
        });
        existedAtBefore = true;
      } catch {
        existedAtBefore = false;
      }
    } else {
      try {
        execFileSync('git', ['ls-files', '--error-unmatch', relPath], {
          cwd: dir,
          stdio: ['ignore', 'ignore', 'ignore'],
        });
        existedAtBefore = true;
      } catch {
        existedAtBefore = false;
      }
    }

    try {
      execFileSync('git', ['reset', 'HEAD', '--', relPath], {
        cwd: dir,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    } catch {
      // ignore
    }

    if (existedAtBefore) {
      try {
        execFileSync('git', ['checkout', 'HEAD', '--', relPath], {
          cwd: dir,
          stdio: ['ignore', 'ignore', 'ignore'],
        });
      } catch {
        // ignore
      }
    } else if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
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
 */
function snapshotDirtyBeforeFiles(dir, dirtyBefore) {
  const snapshots = new Map();
  if (!dir || !Array.isArray(dirtyBefore)) return snapshots;
  for (const relPath of dirtyBefore) {
    const fullPath = path.join(dir, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        snapshots.set(relPath, { content, hash, exists: true });
      } else {
        snapshots.set(relPath, { content: null, hash: null, exists: false });
      }
    } catch {}
  }
  return snapshots;
}

/**
 * Classify RunResult status and confidence from evidence (Step 04 §5.2).
 *
 * @param {object} params
 * @param {number|null} params.exitCode
 * @param {string|null} params.signal
 * @param {boolean} params.isTimeout
 * @param {object|null} params.agentClaim
 * @param {boolean} [params.claimInvalid]
 * @param {string[]} [params.workerArtifacts]
 * @param {string[]} [params.changedFiles]
 * @param {boolean} [params.hasDirtyBeforeMutation]
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
  hasDirtyBeforeMutation = false,
  isReadOnlyOperation = true,
  cwd,
  repoRoot,
  assignment,
  work,
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

  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;

  // Step 06 P1: Read-only operation MUST NOT mutate repo state.
  // If a read-only assignment modified files in the repository (hasExternalEvidence === true),
  // it violates the read-only contract and must fail closed with confidence: 'failed'.
  if (isReadOnlyOperation && hasExternalEvidence) {
    return { status: 'failed', confidence: 'failed' };
  }

  // Step 04 §5.2: agent-result.json is the structured claim, not evidence by itself.
  // A read-only operation classifies as reported only with a companion report
  // artifact (e.g. agent-report.md) the runner detected in the run dir.
  // Self-attested evidenceRefs strings never substitute for it: the worker
  // fully controls agent-result.json, so string refs prove nothing on disk.
  const companionReportArtifacts = workerArtifacts.filter(
    (p) => typeof p === 'string' && !p.endsWith('agent-result.json'),
  );
  const hasWorkerReport = companionReportArtifacts.length > 0;

  if (agentClaim && agentClaim.status === 'done') {
    // Reported for read-only consult/review only when a runner-detected
    // worker-produced report artifact exists.
    if (isReadOnlyOperation) {
      if (hasWorkerReport) {
        return { status: 'done', confidence: 'reported' };
      }
      return { status: 'no-evidence', confidence: 'no-evidence' };
    }
    // Verified requires external evidence for mutating operations (git delta / external test proof)
    // Step 04: changedFiles are already dirty-before-subtracted; only post-run files qualify.
    if (hasExternalEvidence) {
      return { status: 'done', confidence: 'verified' };
    }
    return { status: 'no-evidence', confidence: 'no-evidence' };
  }

  // Inferred when external evidence exists without structured claim for mutating operations
  if (!isReadOnlyOperation && hasExternalEvidence) {
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

  // Step 07 §7: Mission-lite is strictly read-only. Reject mutating operations.
  const isMission = Boolean(asgn.missionId || asgn.workId === null || opts.isMissionLite);
  if (isMission && !isReadOnlyAssignment(asgn)) {
    throw new RunnerConfigError(
      `cannot execute mutating operation "${asgn.operation}" (role: "${asgn.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
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
  const rawCfg = opts.runnerConfig ?? ensureRunnerConfigForDir(root);
  const cfg = { ...rawCfg };
  if (rawCfg.executor) {
    const defaultExec = { ...rawCfg.executor };
    cfg.executor = defaultExec;
    cfg.executors = {
      ...(rawCfg.executors || {}),
      claude: { ...(rawCfg.executors?.claude || {}), ...rawCfg.executor },
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
    options: opts.options,
  });

  if (compiledPlan.dispatch === 'human-only' || compiledPlan.mechanism === 'unavailable' || compiledPlan.mechanism === null) {
    const reason = compiledPlan.blockedReason ?? compiledPlan.reasonCodes?.join(', ') ?? 'governance-blocked or unavailable mechanism';
    throw new RunnerConfigError(`dispatch decide blocked operation "${effectiveAssignment.operation}": ${reason}`);
  }

  const effectivePolicy = resolveAssignmentDispatchPolicy({
    assignment: effectiveAssignment,
    work: opts.work,
    runnerConfig: cfg,
    cliOverride: opts.cliOverride,
    options: opts.options,
  });

  const decidedExecutor = compiledPlan.executorId ?? compiledPlan.invocation?.executorId;
  if (decidedExecutor && decidedExecutor !== effectivePolicy.executorPreference[0]) {
    throw new RunnerConfigError(
      `dispatch decide mismatch for operation "${effectiveAssignment.operation}": decided executor "${decidedExecutor}" does not match execution policy executor "${effectivePolicy.executorPreference[0]}"`,
    );
  }

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

  // Dispatched-run membership: record every run attempt THIS runner actually
  // dispatched, appended to assignment.json right after the run dir exists.
  // assignment.json's assignment fields stay the immutable input per Step 03
  // §2 — this one key is runner-owned append-only bookkeeping, so cross-pass
  // consumption can refuse run dirs no runner ever dispatched (a planted
  // runs/NN directory must never look like evidence of a real run).
  try {
    const manifestRaw = JSON.parse(fs.readFileSync(assignmentJsonPath, 'utf8'));
    const prevDispatched = Array.isArray(manifestRaw.dispatchedRuns) ? manifestRaw.dispatchedRuns : [];
    const nextDispatched = prevDispatched.includes(attemptStr) ? prevDispatched : [...prevDispatched, attemptStr];
    fs.writeFileSync(
      assignmentJsonPath,
      `${JSON.stringify({ ...manifestRaw, dispatchedRuns: nextDispatched }, null, 2)}\n`,
    );
  } catch {
    // Bookkeeping must never abort a dispatch that already started; a missing
    // entry only costs this run its cross-pass consumability (fail closed).
  }

  // Step 04 §5.1: pass concrete runDir so worker knows exactly where to write
  // agent-result.json and agent-report.md. Use absolute path to avoid worktree ambiguity.
  const prompt = renderAssignmentPrompt(effectiveAssignment, { cwd, runDir: path.resolve(runDir) });

  const runId = `run_${effectiveAssignment.assignmentId}_${attemptStr}`;
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs ?? 900000;
  const startedAt = new Date().toISOString();

  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(compiledPlan, null, 2)}\n`);

  // Plan content identity, recorded runner-side BEFORE the worker runs: the
  // sha256 of the Work's plan.md at dispatch time. Cross-pass consumption
  // recomputes this hash so a verdict computed against an older plan
  // revision is never consumed, even when the worker hides the edit by
  // rewinding file mtimes (the worker controls mtimes; it never controls
  // this runner-recorded hash).
  let planContentHash = null;
  if (effectiveAssignment.workId && opts.work?.docsRef) {
    try {
      const planContentRoot = resolveContentRoot(root, effectiveAssignment.workId, opts.work.docsRef);
      const planInputPath = path.join(planContentRoot, opts.work.docsRef, 'plan.md');
      if (fs.existsSync(planInputPath)) {
        planContentHash = crypto.createHash('sha256').update(fs.readFileSync(planInputPath)).digest('hex');
      }
    } catch {
      planContentHash = null;
    }
  }

  const runMeta = {
    runId,
    assignmentId: effectiveAssignment.assignmentId,
    attempt: attemptNum,
    executorId: effectivePolicy.executorPreference[0],
    ...(compiledPlan ? { dispatchPlanPath: path.relative(root, dispatchPlanPath) } : {}),
    ...(planContentHash ? { planContentHash } : {}),
    cwd,
    startedAt,
    timeoutMs,
    status: 'running',
  };

  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(runMeta, null, 2)}\n`);

  const effectiveCwd = compiledPlan?.invocation?.cwd ?? compiledPlan?.cwd ?? cwd;

  // Step 04 §5.3: snapshot dirty state BEFORE the run so pre-existing dirty files
  // are never counted as post-run evidence.
  const dirtyBefore = safeGitStatusFiles(effectiveCwd);
  const dirtyBeforeSnapshots = snapshotDirtyBeforeFiles(effectiveCwd, dirtyBefore);

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

  const gitBefore = rawResult?.headBefore ?? safeGitHead(effectiveCwd);
  const gitAfter = rawResult?.headAfter ?? safeGitHead(effectiveCwd);
  // Step 04 §5.3: snapshot dirty state AFTER the run for subtraction
  const dirtyAfter = safeGitStatusFiles(effectiveCwd);

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
  // Claim-bytes binding: the sha256 of the EXACT agent-result.json bytes this
  // runner classified. result.json records it alongside the claim copy, so
  // cross-pass consumption can prove the stored claim still matches the
  // worker's own file — a post-exit edit of either side breaks the pairing.
  let claimSha256 = null;
  const agentResultExists = fs.existsSync(agentResultPath);
  if (agentResultExists) {
    let claimBytes;
    let parseError = false;
    try {
      claimBytes = fs.readFileSync(agentResultPath);
    } catch {
      parseError = true;
    }
    let parsedClaim = null;
    if (!parseError) {
      try {
        parsedClaim = JSON.parse(claimBytes.toString('utf8'));
      } catch {
        parseError = true;
      }
    }
    if (parseError) {
      // Malformed JSON: treat as invalid claim (not absent)
      claimInvalid = true;
    } else {
      const validation = validateAgentResultClaim(parsedClaim);
      if (validation.valid) {
        agentClaim = parsedClaim;
        try {
          claimSha256 = crypto.createHash('sha256').update(claimBytes).digest('hex');
        } catch {
          claimSha256 = null;
        }
      } else {
        // Present but invalid schema: fail closed
        claimInvalid = true;
      }
    }
  }

  // Build worker artifact list (agent-report.md and agent-result.json are worker-produced).
  // Control-plane files (result.json, evidence.json, etc.) are never listed here.
  const workerArtifacts = [];
  // Settle-report binding: hash the EXACT bytes of every companion report
  // artifact the classifier will count. result.json records the settle set,
  // so cross-pass consumption can prove each report is still the bytes that
  // were classified — a report planted or edited after settle is not in the
  // set (or no longer matches) and can never satisfy a report gate. An
  // honest no-report run records an empty settle set.
  const settleReports = [];
  const agentReportExists = fs.existsSync(agentReportPath);
  if (agentReportExists) {
    let reportValid = false;
    let reportSha256 = null;
    try {
      const reportBytes = fs.readFileSync(agentReportPath);
      reportValid = isSubstantiveReportText(reportBytes.toString('utf8'));
      if (reportValid) {
        try {
          reportSha256 = crypto.createHash('sha256').update(reportBytes).digest('hex');
        } catch {
          reportSha256 = null;
        }
      }
    } catch {
      reportValid = false;
    }
    const reportRelPath = path.relative(root, agentReportPath);
    workerArtifacts.push({
      path: reportRelPath,
      kind: 'agent-report',
      valid: reportValid,
    });
    if (reportValid && reportSha256) {
      settleReports.push({ path: reportRelPath, sha256: reportSha256 });
    }
  }
  if (agentResultExists) {
    workerArtifacts.push({
      path: path.relative(root, agentResultPath),
      kind: 'agent-result',
      valid: !claimInvalid,
    });
  }
  // Flatten to paths for classifyRunEvidence (only valid worker artifacts count towards evidence)
  const workerArtifactPaths = workerArtifacts.filter((a) => a.valid).map((a) => a.path);

  // Step 04 §5.4: use isReadOnlyAssignment helper instead of inline role check
  const isReadOnly = isReadOnlyAssignment(effectiveAssignment);

  // Step 04 §5.3: subtract dirtyBefore from changed files computation.
  // dirtyAfter must be passed explicitly — not re-snapshotted inside computeChangedFiles —
  // so pre-existing dirty files are excluded from post-run evidence.
  const { changedFiles, changedFileReasons } = computeChangedFiles(cwd, gitBefore, gitAfter, dirtyBefore, dirtyAfter);

  const mutatedDirtyBeforeFiles = [];
  if (isReadOnly) {
    for (const [relPath, snap] of dirtyBeforeSnapshots) {
      const fullPath = path.join(cwd, relPath);
      let currentContent = null;
      let currentHash = null;
      let currentExists = false;
      try {
        if (fs.existsSync(fullPath)) {
          currentContent = fs.readFileSync(fullPath);
          currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
          currentExists = true;
        }
      } catch {}

      if (currentExists !== snap.exists || currentHash !== snap.hash) {
        mutatedDirtyBeforeFiles.push(relPath);
      }
    }
  }

  const { status, confidence } = classifyRunEvidence({
    exitCode,
    signal,
    isTimeout,
    agentClaim,
    claimInvalid,
    workerArtifacts: workerArtifactPaths,
    changedFiles,
    hasDirtyBeforeMutation: mutatedDirtyBeforeFiles.length > 0,
    isReadOnlyOperation: isReadOnly,
    cwd,
    repoRoot: root,
    assignment: effectiveAssignment,
    work: opts.work,
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
    ...(planContentHash ? { planContentHash } : {}),
    ...(claimSha256 ? { claimSha256 } : {}),
    settleReports,
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
