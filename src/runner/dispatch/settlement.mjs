// dispatch/settlement.mjs — Unified Run settlement pipeline and primitives (R3, Phase 09)
//
// Consolidates the three former settlement implementations in assignment-runner.mjs
// (inline execution settlement, settleReceiptRunFromOutcome, and settleFailedRunFromOutcome)
// into a single cohesive settlement pipeline.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { sha256FileSync } from './proof-helpers.mjs';
import { RunnerConfigError } from './config.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot } from '../paths.mjs';
import {
  isRunControlCurrent,
  settleRunControl,
  fsyncFileBestEffort,
  controlDirs,
  currentGeneration,
} from './run-lock.mjs';
import { markRunSettled } from './visibility-session.mjs';
import { normalizeRunResultV2, normalizeRunResultV3, interpretRunResult } from './run-result.mjs';
import { validateAgentResultClaim, isReadOnlyAssignment } from './assignment.mjs';
import { resolveWorkerArtifactPath } from './worker-artifacts.mjs';
import { attributeWorkspaceChanges } from './evidence-attribution.mjs';
import { parseUsageForAdapter } from './usage-parsers.mjs';

export function resolveRunWorkerArtifactPath(runDir, roundPattern, legacyName) {
  return resolveWorkerArtifactPath(runDir, roundPattern, legacyName);
}
import { finalizeConfinementResources } from './confinement/authority.mjs';
import {
  publishMutableProjection,
  publishImmutableProof,
  readDetachedRunAdapterReceipt,
} from './detached-run-supervisor.mjs';
import {
  classifyProviderCapacityFault,
  quarantineProviderAccount,
} from './provider-capacity.mjs';

/**
 * Safely resolve root path without failing if not in a git repository.
 */
/**
 * Re-hash every pre-launch dirty file under `cwd` and return the relative
 * paths whose existence or sha256 differs from its snapshot. Snapshots may be
 * the in-memory Map (`{ exists, hash }`) or the persisted baseline object
 * (`{ exists, sha256 }`). A file that cannot be read counts as absent.
 */
export function findMutatedDirtyBeforeFiles(cwd, dirtyBeforeSnapshots) {
  const mutated = [];
  const entries = dirtyBeforeSnapshots instanceof Map
    ? dirtyBeforeSnapshots.entries()
    : Object.entries(dirtyBeforeSnapshots);
  for (const [relPath, snap] of entries) {
    const fullPath = path.join(cwd, relPath);
    let currentExists = false;
    let currentHash = null;
    try {
      if (fs.existsSync(fullPath)) {
        currentHash = sha256FileSync(fullPath);
        currentExists = true;
      }
    } catch {}
    const snapHash = snap.hash ?? snap.sha256;
    if (currentExists !== snap.exists || currentHash !== snapHash) {
      mutated.push(relPath);
    }
  }
  return mutated;
}

export function resolveSafeRoot(runDir, preferredRoot = null, preferMainCheckout = false) {
  if (preferMainCheckout) {
    try {
      const main = resolveMainCheckoutRoot(runDir);
      if (main) return main;
    } catch {}
    try {
      const repo = resolveRepoRoot(runDir);
      if (repo) return repo;
    } catch {}
    if (preferredRoot) return preferredRoot;
    return runDir || process.cwd();
  }
  if (preferredRoot) return preferredRoot;
  try {
    const main = resolveMainCheckoutRoot(runDir);
    if (main) return main;
  } catch {}
  try {
    const repo = resolveRepoRoot(runDir);
    if (repo) return repo;
  } catch {}
  return runDir || process.cwd();
}

/**
 * Check whether a text string constitutes substantive agent report content.
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
 * Capture current git HEAD commit safely without throwing.
 */
export function safeGitHead(dir) {
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
 * Read current dirty file paths relative to git root safely, excluding .fgos/ internal files.
 */
export function safeGitStatusFiles(dir) {
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
 */
export function safeGitCommittedDiffFiles(dir, gitBefore, gitAfter) {
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
 */
export function computeChangedFiles(dir, gitBefore, gitAfter, dirtyBefore, dirtyAfter) {
  const dirtyBeforeSet = new Set(dirtyBefore ?? []);
  const committedFiles = safeGitCommittedDiffFiles(dir, gitBefore, gitAfter);

  const changedFileReasons = {};

  for (const f of (dirtyAfter ?? [])) {
    if (!dirtyBeforeSet.has(f)) {
      changedFileReasons[f] = 'new-dirty-after-run';
    }
  }

  for (const f of committedFiles) {
    changedFileReasons[f] = changedFileReasons[f]
      ? 'new-dirty-and-committed-after-run'
      : 'committed-after-run';
  }

  const changedFiles = Array.from(new Set(Object.keys(changedFileReasons))).sort();

  return { changedFiles, changedFileReasons };
}

function classifyEvidenceToOutcomeFacts({
  exitCode,
  signal,
  isTimeout,
  agentClaim,
  claimInvalid = false,
  workerArtifacts = [],
  changedFiles = [],
  hasDirtyBeforeMutation = false,
  isReadOnlyOperation = true,
  role,
  assignment,
}) {
  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {
    return {
      execStatus: 'failed',
      confidenceLevel: 'failed',
      verdict: 'not-applicable',
      failure: isTimeout
        ? { family: 'resource', code: 'execution-timeout' }
        : { family: 'provider', code: 'nonzero-process-exit' },
      policy: null,
    };
  }

  if (claimInvalid) {
    return {
      execStatus: 'failed',
      confidenceLevel: 'failed',
      verdict: 'not-applicable',
      failure: { family: 'contract', code: 'invalid-agent-result-claim' },
      policy: { disposition: 'refuse', code: 'invalid-agent-result-claim' },
    };
  }

  const companionReportArtifacts = workerArtifacts.filter(
    (p) => typeof p === 'string' && !p.endsWith('agent-result.json') && !/[/\\]outbox[/\\]result-\d+\.json$/.test(p),
  );
  const hasWorkerReport = companionReportArtifacts.length > 0;

  if (agentClaim?.status === 'failed') {
    const isReviewerRole = role === 'reviewer' || role === 'red-team' || assignment?.role === 'reviewer' || assignment?.role === 'red-team';
    const isFindingVerdict = agentClaim?.assessment?.verdict === 'findings';
    if ((isReviewerRole || isFindingVerdict) && hasWorkerReport && exitCode === 0 && !isTimeout) {
      return {
        execStatus: 'completed',
        confidenceLevel: 'reported',
        verdict: 'findings',
        failure: null,
        policy: { disposition: 'allow', code: null },
      };
    }
    return {
      execStatus: 'failed',
      confidenceLevel: 'failed',
      verdict: 'not-applicable',
      failure: { family: 'provider', code: 'agent-failed' },
      policy: null,
    };
  }

  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;

  if (isReadOnlyOperation && hasExternalEvidence) {
    return {
      execStatus: 'failed',
      confidenceLevel: 'failed',
      verdict: 'not-applicable',
      failure: { family: 'policy', code: 'read-only-mutation' },
      policy: { disposition: 'refuse', code: 'read-only-mutation' },
    };
  }

  if (agentClaim?.status === 'blocked') {
    return {
      execStatus: 'completed',
      confidenceLevel: 'reported',
      verdict: 'blocked',
      failure: null,
      policy: { disposition: 'allow', code: null },
    };
  }

  if (agentClaim && agentClaim.status === 'done') {
    const verdict = agentClaim.assessment?.verdict === 'findings' ? 'findings' : 'pass';
    if (isReadOnlyOperation) {
      if (hasWorkerReport) {
        return {
          execStatus: 'completed',
          confidenceLevel: 'reported',
          verdict,
          failure: null,
          policy: { disposition: 'allow', code: null },
        };
      }
      return {
        execStatus: 'completed',
        confidenceLevel: 'no-evidence',
        verdict: 'inconclusive',
        failure: null,
        policy: null,
      };
    }
    if (hasExternalEvidence) {
      return {
        execStatus: 'completed',
        confidenceLevel: 'verified',
        verdict,
        failure: null,
        policy: { disposition: 'allow', code: null },
      };
    }
    return {
      execStatus: 'completed',
      confidenceLevel: 'no-evidence',
      verdict: 'inconclusive',
      failure: null,
      policy: null,
    };
  }

  if (!isReadOnlyOperation && hasExternalEvidence) {
    return {
      execStatus: 'completed',
      confidenceLevel: 'inferred',
      verdict: 'pass',
      failure: null,
      policy: { disposition: 'allow', code: null },
    };
  }

  return {
    execStatus: 'completed',
    confidenceLevel: 'no-evidence',
    verdict: 'inconclusive',
    failure: null,
    policy: null,
  };
}

/**
 * Atomically commit a RunResult settlement to disk via CAS and immutable hard link.
 *
 * S8 recovery: `settleRunControl` publishes the 'settled' generation BEFORE
 * `publishImmutableProof(result.json)` runs below -- a crash in that exact
 * window leaves control settled with no result.json. `settleRunControl`
 * always publishes 'settled' as the NEXT generation (current.epoch + 1), so
 * a bare retry with the original `{controlEpoch, controlToken}` would read
 * as "not current" via `isRunControlCurrent` and be refused as superseded
 * forever, even though no other controller ever took over -- exactly the
 * "can neither resume nor repair" state the audit names. `alreadySettledByUs`
 * below recognizes that specific shape (current generation is 'settled',
 * same controlToken, settledEpoch equal to our controlEpoch) and lets this
 * exact retry finish the commit instead of re-running settleRunControl or
 * being refused. A genuinely superseded caller (a different token, from a
 * newer controller that really did take over) is unaffected: its token
 * never matches, so it still falls through to the normal refusal below.
 */
export function commitRunSettlement({
  runDir,
  runId,
  controlEpoch,
  controlToken,
  runResult,
  _beforeAuthoritativePublish = null,
  _afterControlSettlement = null,
}) {
  const resultJsonPath = path.join(runDir, 'result.json');
  const supersededJsonPath = path.join(runDir, 'result.superseded.json');

  const { generationsDir } = controlDirs(runDir);
  const current = currentGeneration(generationsDir);
  const alreadySettledByUs = Boolean(
    current
    && current.record?.purpose === 'settled'
    && current.record?.controlToken === controlToken
    && current.record?.settledEpoch === controlEpoch,
  );

  if (!alreadySettledByUs && !isRunControlCurrent(runDir, { controlEpoch, controlToken })) {
    publishMutableProjection(supersededJsonPath, runResult);
    throw new RunnerConfigError(
      `executeAssignment: control token for Run "${runId}" (epoch ${controlEpoch}) is no longer current -- a newer controller has taken over; refusing to append a settlement from a superseded controller`,
      { code: 'run-control-superseded', phase: 'post-admission' },
    );
  }

  if (typeof _beforeAuthoritativePublish === 'function') {
    _beforeAuthoritativePublish({ runDir, runId, controlEpoch, controlToken });
  }

  if (!alreadySettledByUs) {
    const settlement = settleRunControl(runDir, { controlEpoch, controlToken });
    if (settlement.status !== 'settled') {
      publishMutableProjection(supersededJsonPath, runResult);
      throw new RunnerConfigError(
        `executeAssignment: control token for Run "${runId}" (epoch ${controlEpoch}) is no longer current (settlement status: "${settlement.status}") -- a newer controller has taken over; refusing to append a settlement from a superseded controller`,
        { code: 'run-control-superseded', phase: 'post-admission' },
      );
    }
    if (typeof _afterControlSettlement === 'function') {
      _afterControlSettlement({ runDir, runId, controlEpoch, controlToken });
    }
  }

  const published = publishImmutableProof(resultJsonPath, runResult);
  if (!published) {
    if (alreadySettledByUs) {
      // Our own prior attempt already reached the authoritative publish
      // (possibly a concurrent duplicate call, or a retry that raced its own
      // still-running earlier attempt) -- rehydrate rather than treat as
      // superseded.
      try {
        const existing = interpretRunResult(resultJsonPath, { expectedRunId: runId });
        if (existing && !existing.corrupt && !existing.contractCorrupt && !existing.resultCorrupt
          && existing.classification?.provenance !== 'contract-corrupt') {
          return Object.freeze(existing);
        }
      } catch {}
    }
    publishMutableProjection(supersededJsonPath, runResult);
    throw new RunnerConfigError(
      `executeAssignment: authoritative result.json for Run "${runId}" already exists -- refusing to overwrite authoritative result`,
      { code: 'run-control-superseded', phase: 'post-admission' },
    );
  }

  markRunSettled(runDir);
  Object.defineProperty(runResult, 'runResult', { value: runResult, enumerable: false, configurable: true });
  return Object.freeze(runResult);
}

/**
 * Unified settlement pipeline for successful or evaluated Run outcomes.
 */
export async function settleRunOutcome({
  runDir,
  runMeta,
  assignment,
  controlEpoch,
  controlToken,
  exitCode,
  signal,
  isTimeout,
  durationMs,
  settledAt,
  stdoutText,
  stderrText,
  effectiveCwd,
  gitBefore,
  gitBeforeSource = 'pre-launch',
  gitAfter = null,
  dirtyBefore = [],
  dirtyAfter = null,
  dirtyBeforeSnapshots = null,
  planContentHash,
  resolvedExecutorId,
  effectivePolicy,
  executorRedirected = false,
  providerCapacitySelection = null,
  providerCapacityEvidence = null,
  fallbackEvidence = null,
  executionError = null,
  launchCommandId = null,
  receipt = null,
  adapterOutcome = null,
  opts = {},
}) {
  const root = resolveSafeRoot(runDir, opts?.repoRoot);

  fs.writeFileSync(path.join(runDir, 'stdout.log'), stdoutText || '');
  fs.writeFileSync(path.join(runDir, 'stderr.log'), stderrText || (executionError ? executionError.message : ''));

  const exitInfoData = {
    exitCode,
    signal,
    timedOut: Boolean(isTimeout),
    settledAt,
    durationMs: typeof durationMs === 'number' ? durationMs : null,
  };
  fs.writeFileSync(path.join(runDir, 'exit.json'), `${JSON.stringify(exitInfoData, null, 2)}\n`);

  const agentReportPath = resolveRunWorkerArtifactPath(runDir, /^report-(\d+)\.md$/, 'agent-report.md');
  const agentResultPath = resolveRunWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json');

  let agentClaim = null;
  let claimInvalid = false;
  let claimSha256 = null;

  if (fs.existsSync(agentResultPath)) {
    try {
      const claimBytes = fs.readFileSync(agentResultPath);
      const parsed = JSON.parse(claimBytes.toString('utf8'));
      const validation = validateAgentResultClaim(parsed, { role: assignment?.role, operation: assignment?.operation });
      if (validation.valid) {
        agentClaim = parsed;
        claimSha256 = crypto.createHash('sha256').update(claimBytes).digest('hex');
      } else {
        claimInvalid = true;
      }
    } catch {
      claimInvalid = true;
    }
  }

  const workerArtifacts = [];
  const settleReports = [];
  if (fs.existsSync(agentReportPath)) {
    let reportValid = false;
    let reportSha256 = null;
    try {
      const reportBytes = fs.readFileSync(agentReportPath);
      reportValid = isSubstantiveReportText(reportBytes.toString('utf8'));
      if (reportValid) {
        reportSha256 = crypto.createHash('sha256').update(reportBytes).digest('hex');
      }
    } catch {
      reportValid = false;
    }
    const reportRel = path.relative(root, agentReportPath);
    workerArtifacts.push({ path: reportRel, kind: 'agent-report', valid: reportValid });
    if (reportValid && reportSha256) {
      settleReports.push({ path: reportRel, sha256: reportSha256 });
    }
  }

  if (fs.existsSync(agentResultPath)) {
    workerArtifacts.push({
      path: path.relative(root, agentResultPath),
      kind: 'agent-result',
      valid: !claimInvalid,
    });
  }

  const workerArtifactPaths = workerArtifacts.filter((a) => a.valid).map((a) => a.path);
  const isReadOnly = isReadOnlyAssignment(assignment);

  const settlementCwd = opts?.cwd || effectiveCwd;
  const resolvedGitAfter = gitAfter ?? safeGitHead(settlementCwd);
  const resolvedDirtyAfter = dirtyAfter ?? safeGitStatusFiles(settlementCwd);

  const { changedFiles, changedFileReasons } = computeChangedFiles(
    settlementCwd,
    gitBefore,
    resolvedGitAfter,
    dirtyBefore,
    resolvedDirtyAfter,
  );

  const mutatedDirtyBeforeFiles = isReadOnly && dirtyBeforeSnapshots
    ? findMutatedDirtyBeforeFiles(settlementCwd, dirtyBeforeSnapshots)
    : [];

  let providerCapacityFault = null;
  if (providerCapacitySelection?.status === 'selected') {
    const fault = classifyProviderCapacityFault({
      provider: providerCapacitySelection.provider,
      stderr: stderrText,
      adapterOutcome: adapterOutcome || (exitCode === 0 ? 'success' : 'failed'),
      structuredAgent: agentClaim,
    });
    if (fault?.action && fault.action !== 'none') {
      providerCapacityFault = {
        provider: providerCapacitySelection.provider,
        accountId: providerCapacitySelection.accountId,
        action: fault.action,
        reasonCode: fault.reasonCode,
        quarantineKind: fault.quarantineKind,
      };
      if (fault.action === 'quarantine') {
        const quarantine = quarantineProviderAccount({
          provider: providerCapacitySelection.provider,
          accountId: providerCapacitySelection.accountId,
          reasonCode: fault.reasonCode,
          quarantineKind: fault.quarantineKind,
          until: fault.until,
          runtimeDir: opts.providerCapacityRuntimeDir,
          detail: {
            kind: 'provider-stderr-classifier',
            runId: runMeta?.runId,
            assignmentId: assignment?.assignmentId,
          },
        });
        providerCapacityFault.quarantine = quarantine;
      }
      if (providerCapacityEvidence) {
        providerCapacityEvidence = {
          ...providerCapacityEvidence,
          reasonCodes: [...new Set([...(providerCapacityEvidence.reasonCodes || []), fault.reasonCode].filter(Boolean))],
          ...(providerCapacityFault.quarantine ? { quarantine: providerCapacityFault.quarantine } : {}),
        };
        const selectionPath = path.join(runDir, 'provider-capacity-selection.json');
        try {
          fs.writeFileSync(selectionPath, `${JSON.stringify(providerCapacityEvidence, null, 2)}\n`);
          fsyncFileBestEffort(selectionPath);
        } catch {}
      }
    }
  }

  const evidenceData = {
    operationMutability: isReadOnly ? 'read-only' : 'mutates-repo',
    gitBefore,
    gitAfter: resolvedGitAfter,
    gitBeforeSource,
    dirtyBefore,
    dirtyAfter: resolvedDirtyAfter,
    mutatedDirtyBeforeFiles,
    changedFiles,
    changedFileReasons,
    attribution: attributeWorkspaceChanges({ preLaunchDirt: dirtyBefore, postRunDirt: resolvedDirtyAfter }),
    artifacts: workerArtifacts,
    tests: [],
    ...(providerCapacityFault ? { providerCapacity: providerCapacityFault } : {}),
    ...(fallbackEvidence ? { fallback: fallbackEvidence } : {}),
  };
  fs.writeFileSync(path.join(runDir, 'evidence.json'), `${JSON.stringify(evidenceData, null, 2)}\n`);
  const stdoutPath = path.join(runDir, 'stdout.log');
  const stderrPath = path.join(runDir, 'stderr.log');
  let stdoutContent = null;
  let stderrContent = null;
  try { if (fs.existsSync(stdoutPath)) stdoutContent = fs.readFileSync(stdoutPath, 'utf8'); } catch {}
  try { if (fs.existsSync(stderrPath)) stderrContent = fs.readFileSync(stderrPath, 'utf8'); } catch {}

  const usage = parseUsageForAdapter(resolvedExecutorId || opts?.adapter || 'cli-spawn', {
    stdout: stdoutContent,
    stderr: stderrContent,
  });
  const evidenceFacts = classifyEvidenceToOutcomeFacts({
    exitCode,
    signal,
    isTimeout: Boolean(isTimeout),
    agentClaim,
    claimInvalid,
    workerArtifacts: workerArtifactPaths,
    changedFiles,
    hasDirtyBeforeMutation: mutatedDirtyBeforeFiles.length > 0,
    isReadOnlyOperation: isReadOnly,
    role: assignment?.role,
    assignment,
  });

  const runResult = normalizeRunResultV3({
    usage,
    runId: runMeta.runId,
    assignmentId: runMeta.assignmentId,
    workId: runMeta.workId || assignment?.workId,
    controlEpoch,
    controlToken,
    executorId: resolvedExecutorId || runMeta.executorId || null,
    adapter: opts?.adapter || (resolvedExecutorId?.includes('herdr') ? 'herdr-spawn' : 'cli-spawn'),
    confinement: (effectivePolicy?.confinement?.requirement?.mode === 'confined' ? (effectivePolicy?.confinement?.backend?.type ?? 'bwrap') : null),
    role: assignment?.role ?? null,
    ...(effectivePolicy ? { policy: effectivePolicy, executorRedirected } : {}),
    settledAt,
    durationMs: typeof durationMs === 'number' ? durationMs : null,
    ...(planContentHash ? { planContentHash } : {}),
    ...(claimSha256 ? { claimSha256 } : {}),
    settleReports,
    operation: assignment?.operation,
    isReadOnlyOperation: isReadOnly,
    ...(evidenceFacts.execStatus ? { execStatusOverride: evidenceFacts.execStatus } : {}),
    ...(evidenceFacts.verdict ? { assessmentOverride: { verdict: evidenceFacts.verdict } } : {}),
    confidenceLevel: evidenceFacts.confidenceLevel,
    // A worker that stopped on a provider limit failed for that reason, not for the
    // generic exit the adapter reported; the code is what lets a caller move to the
    // next candidate instead of retrying the same provider. One waiting on a prompt only
    // a person can answer is `blocked`: retrying or moving on does not clear it.
    ...(adapterOutcome === 'provider-limit' || adapterOutcome === 'paused-limit' || adapterOutcome === 'blocked'
      ? { failureOverride: { family: 'provider', code: adapterOutcome } }
      : evidenceFacts.failure ? { failureOverride: evidenceFacts.failure } : {}),
    ...(evidenceFacts.policy ? { policyOverride: evidenceFacts.policy } : {}),
    runtime: {
      exitCode,
      isTimeout: Boolean(isTimeout),
      ...(executionError ? { executionError: { message: executionError.message, code: executionError.code } } : {}),
      stdoutLog: path.relative(root, path.join(runDir, 'stdout.log')),
      stderrLog: path.relative(root, path.join(runDir, 'stderr.log')),
    },
    agentClaim,
    claimInvalid,
    evidence: {
      gitBefore,
      gitAfter: resolvedGitAfter,
      gitBeforeSource,
      changedFiles,
      mutatedDirtyBeforeFiles,
      attribution: evidenceData.attribution,
      artifacts: workerArtifactPaths,
      tests: [],
    },
  });

  const settled = commitRunSettlement({
    runDir,
    runId: runMeta.runId,
    controlEpoch,
    controlToken,
    runResult,
    _beforeAuthoritativePublish: opts?._beforeAuthoritativePublish,
  });

  if (opts?.updateRunJson) {
    const runJsonPath = path.join(runDir, 'run.json');
    let runJsonMeta = runMeta || {};
    if (fs.existsSync(runJsonPath)) {
      try { runJsonMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8')); } catch {}
    }
    publishMutableProjection(runJsonPath, { ...runJsonMeta, status: opts.updateRunJson, settledAt });
  }

  return { status: 'settled', settled: true, runResult: Object.freeze(settled) };
}

/**
 * Settle a failed Run from a recorded command outcome (e.g. supervisor exit or submission refusal).
 */
export async function settleFailedRunFromOutcome(runDir, runMeta, command, controlEpoch, controlToken, opts = {}) {
  const resultJsonPath = path.join(runDir, 'result.json');
  if (fs.existsSync(resultJsonPath)) {
    try {
      const settledResult = interpretRunResult(resultJsonPath, { expectedRunId: runMeta?.runId });
      if (!settledResult || settledResult.corrupt || settledResult.contractCorrupt || settledResult.resultCorrupt || settledResult.classification?.provenance === 'contract-corrupt') {
        // Do not rehydrate a contract-corrupt result
      } else {
        return { status: 'settled', settled: true, runResult: Object.freeze(settledResult) };
      }
    } catch {}
  }

  const settledAt = new Date().toISOString();
  const root = resolveSafeRoot(runDir, opts?.repoRoot, true);

  const stdoutText = '';
  const stderrText = command.outcome?.failureDetail?.message || 'submission-refused';

  fs.writeFileSync(path.join(runDir, 'stdout.log'), stdoutText);
  fs.writeFileSync(path.join(runDir, 'stderr.log'), stderrText);

  const exitInfoData = {
    exitCode: 1,
    signal: null,
    timedOut: false,
    settledAt,
    durationMs: null,
  };
  fs.writeFileSync(path.join(runDir, 'exit.json'), `${JSON.stringify(exitInfoData, null, 2)}\n`);

  const evidenceData = {
    operationMutability: 'mutates-repo',
    gitBefore: null,
    gitAfter: null,
    gitBeforeSource: 'pre-launch',
    dirtyBefore: [],
    dirtyAfter: [],
    mutatedDirtyBeforeFiles: [],
    changedFiles: [],
    changedFileReasons: {},
    attribution: [],
    artifacts: [],
    tests: [],
  };
  fs.writeFileSync(path.join(runDir, 'evidence.json'), `${JSON.stringify(evidenceData, null, 2)}\n`);

  const runResult = normalizeRunResultV2({
    runId: runMeta.runId,
    assignmentId: runMeta.assignmentId,
    controlEpoch,
    controlToken,
    confidence: 'failed',
    confidenceLevel: 'failed',
    runtime: {
      exitCode: 1,
      stdoutLog: path.relative(root, path.join(runDir, 'stdout.log')),
      stderrLog: path.relative(root, path.join(runDir, 'stderr.log')),
    },
    runnerNote: stderrText,
    evidence: {
      gitBefore: null,
      gitAfter: null,
      gitBeforeSource: 'pre-launch',
      changedFiles: [],
      mutatedDirtyBeforeFiles: [],
      attribution: [],
      artifacts: [],
      tests: [],
    },
  });

  const settled = commitRunSettlement({
    runDir,
    runId: runMeta.runId,
    controlEpoch,
    controlToken,
    runResult,
    _beforeAuthoritativePublish: opts?._beforeAuthoritativePublish,
  });

  const runJsonPath = path.join(runDir, 'run.json');
  let runJsonMeta = runMeta || {};
  if (fs.existsSync(runJsonPath)) {
    try { runJsonMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8')); } catch {}
  }
  publishMutableProjection(runJsonPath, { ...runJsonMeta, status: 'failed', settledAt });
  await finalizeConfinementResources({ runDir, launchCommandId: command?.launchCommandId });

  return { status: 'settled', settled: true, runResult: Object.freeze(settled) };
}

/**
 * Settle a Run from an adapter receipt and recorded evaluator baseline.
 */
export async function settleReceiptRunFromOutcome(
  runDir,
  runMeta,
  command,
  baseline,
  controlEpoch,
  controlToken,
  receiptOpt = null,
  opts = {},
) {
  const resultJsonPath = path.join(runDir, 'result.json');
  if (fs.existsSync(resultJsonPath)) {
    try {
      const settledResult = interpretRunResult(resultJsonPath, { expectedRunId: runMeta?.runId });
      if (!settledResult || settledResult.corrupt || settledResult.contractCorrupt || settledResult.resultCorrupt || settledResult.classification?.provenance === 'contract-corrupt') {
        // Do not rehydrate a contract-corrupt result
      } else {
        return { status: 'settled', settled: true, runResult: Object.freeze(settledResult) };
      }
    } catch {}
  }

  const launchCommandId = command.launchCommandId;
  const receipt = receiptOpt || readDetachedRunAdapterReceipt(runDir, launchCommandId);
  const root = resolveSafeRoot(runDir, opts?.repoRoot, true);

  const captureStdoutPath = path.join(runDir, 'protected', 'capture', launchCommandId, 'stdout.log');
  const captureStderrPath = path.join(runDir, 'protected', 'capture', launchCommandId, 'stderr.log');
  let stdoutText = '';
  let stderrText = '';
  try { stdoutText = fs.readFileSync(captureStdoutPath, 'utf8'); } catch {}
  try { stderrText = fs.readFileSync(captureStderrPath, 'utf8'); } catch {}

  const isTimeout = receipt?.completion?.kind === 'timeout' || receipt?.completion?.kind === 'idle-timeout';
  const exitCode = receipt?.completion?.exitCode ?? (isTimeout ? 124 : 0);
  const signal = receipt?.completion?.signal ?? (isTimeout ? 'SIGTERM' : null);
  const durationMs = typeof receipt?.completion?.durationMs === 'number' ? receipt.completion.durationMs : null;
  const settledAt = receipt?.completion?.settledAt ?? new Date().toISOString();

  const candidateAssignmentPaths = [
    path.join(path.dirname(runDir), '..', 'assignment.json'),
    path.join(runDir, 'assignment.json'),
  ];
  let asgn = null;
  for (const p of candidateAssignmentPaths) {
    if (fs.existsSync(p)) {
      try { asgn = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch {}
    }
  }

  // Settle outcome using unified pipeline
  const outcome = await settleRunOutcome({
    runDir,
    runMeta,
    assignment: asgn,
    controlEpoch,
    controlToken,
    exitCode,
    signal,
    isTimeout,
    durationMs,
    settledAt,
    stdoutText,
    stderrText,
    effectiveCwd: baseline?.cwd || root,
    gitBefore: baseline?.gitBefore ?? null,
    gitBeforeSource: baseline?.gitBeforeSource ?? 'pre-launch',
    dirtyBefore: baseline?.dirtyBefore || [],
    dirtyBeforeSnapshots: baseline?.dirtyBeforeSnapshots || null,
    launchCommandId,
    receipt,
    opts: { ...opts, updateRunJson: 'settled' },
  });

  if (launchCommandId) {
    await finalizeConfinementResources({ runDir, launchCommandId, receipt });
  }

  return outcome;
}
