// dispatch/operation-choice.mjs — Stage operation selection helper for Team Dispatch V1 (Step 05).
//
// Pure helper:
// - chooseStageOperation: resolves legal stage operations via operationsForStage and
//   selects either the primary stage owner path or a secondary Assignment operation.
// - executeDriverOperationChoice: executes chosen stage operation (builds/executes Assignment
//   if requested) and consumes hardened RunResult conservatively.
// - Never mutates Work lifecycle state directly as a side effect.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  DEFAULT_DOMAIN,
  resolveDomainName,
  operationsForStage,
} from '../../state/workflow-stage-graphs.mjs';
import { resolveContentRoot } from '../../intake/plan.mjs';
import { buildAssignment, isReadOnlyAssignment, validateAgentResultClaim } from './assignment.mjs';
import { executeAssignment, classifyRunEvidence, isSubstantiveReportText } from './assignment-runner.mjs';
import { detectTrunk } from '../worktree.mjs';

// Non-enumerable stamp the cross-pass scan attaches to a consumed runResult:
// the dispatched member dir the result was physically read from. Evidence
// scoping derives from this runner-owned location; result.json fields are
// post-settle writable and never locate evidence.
const CONSUMING_RUN_DIR = Symbol('fgos:consumingRunDir');

/**
 * Check whether plan.md exists for a given work item.
 *
 * @param {object} params
 * @param {object} params.work Work item
 * @param {string} [params.repoRoot]
 * @returns {boolean}
 */
export function hasPlanMd({ work, repoRoot }) {
  if (!work) return false;
  const root = repoRoot ?? process.cwd();
  const docsRef = work.docsRef;
  if (!docsRef) return false;

  const contentRoot = resolveContentRoot(root, work.id, docsRef);
  const planPath = path.join(contentRoot, docsRef, 'plan.md');
  if (fs.existsSync(planPath)) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      return content.trim().length > 0;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check whether plan.md contains recorded constraint evidence (e.g. ## Constraints section).
 *
 * @param {object} params
 * @param {object} [params.work] Work item
 * @param {string} [params.docsRef] docsRef path
 * @param {string} [params.repoRoot]
 * @returns {boolean}
 */
export function hasPlanConstraints({ work, docsRef, repoRoot }) {
  const resolvedDocsRef = docsRef ?? work?.docsRef;
  if (!resolvedDocsRef) return false;
  const root = repoRoot ?? process.cwd();
  const workId = work?.id ?? 'temp';

  const contentRoot = resolveContentRoot(root, workId, resolvedDocsRef);
  const planPath = path.join(contentRoot, resolvedDocsRef, 'plan.md');
  if (fs.existsSync(planPath)) {
    try {
      const content = fs.readFileSync(planPath, 'utf8');
      const upper = content.toUpperCase();
      return (
        upper.includes('## CONSTRAINT') ||
        upper.includes('# CONSTRAINT') ||
        upper.includes('CONSTRAINTS:') ||
        upper.includes('RECORDED CONSTRAINTS')
      );
    } catch {
      return false;
    }
  }
  return false;
}

function findLatestAssignmentRunResult({ work, repoRoot, stage, operation = 'validate-plan' }) {
  if (!work?.id || !repoRoot) return null;
  const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
  if (!fs.existsSync(assignmentsDir)) return null;

  const targetStage = stage ?? work?.stage;

  try {
    const asgnDirs = fs.readdirSync(assignmentsDir);
    let latestRunResult = null;
    let latestMtime = 0;

    for (const dirName of asgnDirs) {
      const asgnDir = path.join(assignmentsDir, dirName);
      const asgnJsonPath = path.join(asgnDir, 'assignment.json');
      if (!fs.existsSync(asgnJsonPath)) continue;

      try {
        const asgn = JSON.parse(fs.readFileSync(asgnJsonPath, 'utf8'));
        if (asgn.workId !== work.id && asgn.work?.id !== work.id) continue;
        if (targetStage && asgn.stage && asgn.stage !== targetStage) continue;
        if (operation && asgn.operation && asgn.operation !== operation) continue;

        // Dispatched-run membership: only run dirs the runner itself
        // dispatched (recorded in assignment.json at dispatch time) count as
        // evidence. A run dir planted in the tree without a dispatch — no
        // matter how self-consistent its result.json — is skipped, and an
        // assignment without the manifest fails closed.
        const dispatchedRuns = Array.isArray(asgn.dispatchedRuns) ? asgn.dispatchedRuns : null;
        if (!dispatchedRuns) continue;
        const asgnId = path.basename(asgnDir);

        const runsDir = path.join(asgnDir, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runSubdirs = fs.readdirSync(runsDir);
        for (const runSub of runSubdirs) {
          if (!dispatchedRuns.includes(runSub)) continue;
          const resultJsonPath = path.join(runsDir, runSub, 'result.json');
          if (!fs.existsSync(resultJsonPath)) continue;

          // Read-back hardening: parse each stored result independently so one
          // tampered or unreadable result.json can never abort the remaining
          // runs of the same assignment.
          let runResult = null;
          try {
            runResult = JSON.parse(fs.readFileSync(resultJsonPath, 'utf8'));
          } catch {
            continue;
          }
          if (!runResult || typeof runResult !== 'object') continue;

          // runId-vs-member identity: the runner writes runId as
          // `run_<assignmentId>_<runSub>` when it dispatches this member. A
          // result.json field is post-settle writable, so a present runId that
          // CONTRADICTS the member it was read from marks the result as
          // tampered — skip it outright. (An ABSENT runId does not contradict
          // anything; its evidence is pinned below to this member's own dir.)
          if (typeof runResult.runId === 'string' && runResult.runId !== '') {
            if (runResult.runId !== `run_${asgnId}_${runSub}`) continue;
          }

          // Pin the evidence dir to the dispatched member this result was
          // read from. Evidence scoping (which report files a consumer may
          // honor) derives from the runner-owned manifest, never from
          // result.json fields the worker or a post-settle writer controls.
          try {
            Object.defineProperty(runResult, CONSUMING_RUN_DIR, {
              value: path.join(runsDir, runSub),
              enumerable: false,
              configurable: true,
              writable: false,
            });
          } catch {}

          // Read-back re-validation: a claim tampered after settle must not be
          // consumable cross-pass. The runner enforced this schema at
          // classification time; re-run the same gate here.
          if (runResult.agentClaim !== undefined && runResult.agentClaim !== null) {
            try {
              if (!validateAgentResultClaim(runResult.agentClaim).valid) continue;
            } catch {
              continue;
            }
          }

          // Claim-bytes binding: the runner recorded the sha256 of the exact
          // agent-result.json bytes it classified. Re-read that file and
          // require BOTH the hash and the parsed content to still match the
          // stored claim copy — a post-settle edit of either side (flip the
          // verdict in result.json, or in the worker's own file) breaks the
          // pairing. A schema-valid result recorded without the binding is
          // not consumable (fail closed, same stance as the plan hash).
          if (runResult.agentClaim !== undefined && runResult.agentClaim !== null) {
            const recordedClaimHash = typeof runResult.claimSha256 === 'string' ? runResult.claimSha256 : '';
            if (!recordedClaimHash) continue;
            let storedClaimBytes = null;
            try {
              storedClaimBytes = fs.readFileSync(path.join(runsDir, runSub, 'agent-result.json'));
            } catch {
              continue;
            }
            let actualClaimHash = null;
            try {
              actualClaimHash = crypto.createHash('sha256').update(storedClaimBytes).digest('hex');
            } catch {
              continue;
            }
            if (actualClaimHash !== recordedClaimHash) continue;
            let storedClaim = null;
            try {
              storedClaim = JSON.parse(storedClaimBytes.toString('utf8'));
            } catch {
              continue;
            }
            if (JSON.stringify(storedClaim) !== JSON.stringify(runResult.agentClaim)) continue;
          }

          // Settle-report binding: the runner recorded, at classification
          // time, every companion report artifact it actually saw, with the
          // sha256 of its exact bytes. Re-verify every entry on disk: a
          // report edited, deleted, or planted after settle is not the
          // evidence the classifier judged — skip the member (fail closed;
          // legacy pre-binding results lose cross-pass consumability, one
          // conservative re-dispatch, same stance as the claim binding).
          // Entries must also resolve inside this member's own dir: the
          // runner only ever binds reports from the run dir it classified.
          const settleReports = Array.isArray(runResult.settleReports) ? runResult.settleReports : null;
          if (!settleReports) continue;
          const memberDir = path.join(runsDir, runSub);
          let settleSetValid = true;
          for (const entry of settleReports) {
            const rel = entry && typeof entry.path === 'string' ? entry.path : '';
            const recordedHash = entry && typeof entry.sha256 === 'string' ? entry.sha256 : '';
            let resolvedEntry = null;
            if (rel && recordedHash) {
              try {
                resolvedEntry = path.resolve(repoRoot, rel);
              } catch {
                resolvedEntry = null;
              }
            }
            if (!resolvedEntry || (resolvedEntry !== memberDir && !resolvedEntry.startsWith(`${memberDir}${path.sep}`))) {
              settleSetValid = false;
              break;
            }
            let settleBytes = null;
            try {
              settleBytes = fs.readFileSync(resolvedEntry);
            } catch {
              settleSetValid = false;
              break;
            }
            let actualSettleHash = null;
            try {
              actualSettleHash = crypto.createHash('sha256').update(settleBytes).digest('hex');
            } catch {
              settleSetValid = false;
              break;
            }
            if (actualSettleHash !== recordedHash) {
              settleSetValid = false;
              break;
            }
          }
          if (!settleSetValid) continue;

          // Recorded evidence refs pointing at repo files must still exist:
          // a stored verdict whose recorded path evidence has vanished is
          // dead evidence. A ref resolving inside this assignment's own tree
          // must exist on its own — mixing one live ref with ghost siblings
          // must not launder the dead ones through the all-missing backstop.
          // Refs outside the assignment tree are informational (they may name
          // repo paths owned by other passes) and keep only the existing
          // all-missing backstop. Symbolic refs (evidence:/diff:/verify:/
          // test:) are resolved by the operation's own resolvers, not by
          // path lookup.
          const claimRefs = Array.isArray(runResult.agentClaim?.evidenceRefs)
            ? runResult.agentClaim.evidenceRefs
            : [];
          const pathRefs = claimRefs.filter(
            (r) => typeof r === 'string' && r.trim() !== '' && !/^[a-z0-9_-]+:/i.test(r.trim()),
          );
          if (pathRefs.length > 0) {
            const missingInTreeRef = pathRefs.some((ref) => {
              let resolved;
              try {
                resolved = path.resolve(repoRoot, ref.trim());
              } catch {
                return true;
              }
              const inTree = resolved === asgnDir || resolved.startsWith(`${asgnDir}${path.sep}`);
              return inTree && !fs.existsSync(resolved);
            });
            if (missingInTreeRef) continue;
            const allPathRefsMissing = pathRefs.every((ref) => {
              try {
                return !fs.existsSync(path.resolve(repoRoot, ref.trim()));
              } catch {
                return true;
              }
            });
            if (allPathRefsMissing) continue;
          }

          const stat = fs.statSync(resultJsonPath);

          // Plan evidence identity. The mtime comparison stays as a cheap
          // pre-filter; the authoritative gate is the plan content hash the
          // runner recorded at dispatch time — mtimes are worker-controllable
          // (cwd == repoRoot), the recorded hash is not. A stored result
          // without the dispatch-time anchor is not consumable when plan.md
          // exists (fail closed).
          if (work?.docsRef && work?.id) {
            const contentRoot = resolveContentRoot(repoRoot, work.id, work.docsRef);
            const planPath = path.join(contentRoot, work.docsRef, 'plan.md');
            if (fs.existsSync(planPath)) {
              const planStat = fs.statSync(planPath);
              if (planStat.mtimeMs > stat.mtimeMs) {
                continue;
              }
              const recordedHash = typeof runResult.planContentHash === 'string' ? runResult.planContentHash : '';
              if (!recordedHash) {
                continue;
              }
              let currentPlanHash = null;
              try {
                currentPlanHash = crypto.createHash('sha256').update(fs.readFileSync(planPath)).digest('hex');
              } catch {
                continue;
              }
              if (recordedHash !== currentPlanHash) {
                continue;
              }
            }
          }

          // Read-back re-derivation: stored status/confidence live in the
          // same result.json as every other attacker-writable field, so they
          // are advisory only. Re-run the classifier over the hash-verified
          // evidence — the byte-bound claim and the settle-bound reports —
          // and let the derived values drive every consumption decision. A
          // stored flip with an empty or failed settle set can never reach
          // reported/READY.
          //
          // Monotonic re-derivation: the settle-time verdict is the floor.
          // Re-derivation reads runtime.exitCode and evidence.changedFiles
          // from the same attacker-writable result.json, and inputs the
          // result never persisted (the read-only dirty-mutation flag) are
          // simply absent — so a derived pair MORE advancing than what the
          // runner recorded at settle is a forged or lost fact, never new
          // truth. An honestly settled failed run (non-zero/timeout exit,
          // dirty mutation) must never re-derive upward to done/reported:
          // the stored verdict stands and the member stops per failed
          // semantics. Downgrades and equal derivations still apply — that
          // is what makes a stored flip inert.
          const runtimeInfo = runResult.runtime && typeof runResult.runtime === 'object' ? runResult.runtime : {};
          const derived = classifyRunEvidence({
            exitCode: typeof runtimeInfo.exitCode === 'number' ? runtimeInfo.exitCode : null,
            signal: typeof runtimeInfo.signal === 'string' ? runtimeInfo.signal : null,
            isTimeout: runtimeInfo.isTimeout === true,
            agentClaim: runResult.agentClaim ?? null,
            claimInvalid: false,
            workerArtifacts: [
              ...settleReports.map((e) => e.path),
              path.relative(repoRoot, path.join(runsDir, runSub, 'agent-result.json')),
            ],
            changedFiles: Array.isArray(runResult.evidence?.changedFiles)
              ? runResult.evidence.changedFiles.filter((f) => typeof f === 'string')
              : [],
            hasDirtyBeforeMutation: false,
            isReadOnlyOperation: isReadOnlyAssignment(asgn),
            repoRoot,
          });
          const settlesAdvance =
            runResult.status === 'done' && (runResult.confidence === 'reported' || runResult.confidence === 'verified');
          const derivedAdvances =
            derived.status === 'done' && (derived.confidence === 'reported' || derived.confidence === 'verified');
          if (!derivedAdvances || settlesAdvance) {
            runResult.status = derived.status;
            runResult.confidence = derived.confidence;
          }

          if (stat.mtimeMs > latestMtime) {
            latestMtime = stat.mtimeMs;
            latestRunResult = runResult;
          }
        }
      } catch {}
    }

    return latestRunResult;
  } catch {
    return null;
  }
}

export function isCandidateDiffRef(ref) {
  if (typeof ref !== 'string') return false;
  const trimmed = ref.trim();
  if (!trimmed) return false;
  return (
    trimmed === 'evidence:candidate-diff' ||
    trimmed.startsWith('evidence:candidate-diff:') ||
    trimmed.startsWith('diff:') ||
    /^diff:/i.test(trimmed) ||
    /^evidence:candidate-diff\b/i.test(trimmed)
  );
}

export function isVerifyResultRef(ref) {
  if (typeof ref !== 'string') return false;
  const trimmed = ref.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('verify:') ||
    trimmed.startsWith('test:') ||
    trimmed.startsWith('evidence:verify-') ||
    trimmed.startsWith('evidence:verify:') ||
    /^verify:/i.test(trimmed) ||
    /^test:/i.test(trimmed) ||
    /^evidence:verify-/i.test(trimmed)
  );
}

function workCreatedAtMs(work) {
  const raw = work?.createdAt ?? work?.submittedAt ?? null;
  if (typeof raw !== 'string') return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

// A repoRoot convention artifact only counts when it is not older than the
// Work item that claims it — a candidate diff or verify output cannot predate
// the item that needs it. Fail closed when the item carries a timestamp and
// the file predates it (a stale leftover is not this item's evidence).
function onDiskArtifactForWork(p, work) {
  try {
    const stat = fs.statSync(p);
    if (!stat.isFile() || stat.size <= 0) return false;
    const createdMs = workCreatedAtMs(work);
    if (createdMs !== null && stat.mtimeMs < createdMs) return false;
    return true;
  } catch {
    return false;
  }
}

// Candidate-diff evidence from the item's own branch: a real branch under
// refs/heads (never a tag or remote ref) carrying at least one commit ahead
// of the trunk base — an early-minted zero-commit branch carries no diff.
function candidateBranchAheadOfTrunk(repoRoot, workId) {
  try {
    const trunk = detectTrunk(repoRoot);
    const count = execFileSync(
      'git',
      ['rev-list', '--count', `${trunk}..refs/heads/fgw/${workId}`],
      { cwd: repoRoot, stdio: 'pipe' },
    ).toString().trim();
    return Number.parseInt(count, 10) > 0;
  } catch {
    return false;
  }
}

// Whether a real candidate exists for the item: its branch with commits ahead
// of base, or a diff-shaped ref that resolves to an on-disk artifact.
function candidateExistsForWork(work, contextSignals, repoRoot) {
  if (!repoRoot) return false;
  if (work?.id && candidateBranchAheadOfTrunk(repoRoot, work.id)) return true;
  const known = [
    ...(work?.refs || []),
    ...(contextSignals?.contextRefs || []),
    ...(contextSignals?.candidateRefs || []),
  ];
  return known.some((r) => isResolvableDiffRef(r, { work, contextSignals, repoRoot }));
}

export function isResolvableDiffRef(ref, { choice, work, contextSignals, repoRoot, reportText, runResult } = {}) {
  if (!isCandidateDiffRef(ref)) return false;
  if (typeof ref !== 'string') return false;

  const trimmed = ref.trim();

  // Evidence resolves to on-disk artifacts or git refs only. Inline diff text
  // in the ref string and caller-declared content/boolean signals are
  // verdict-interpretation input, never resolver evidence.
  if (repoRoot) {
    if (contextSignals?.candidateDiffPath) {
      const candPath = path.isAbsolute(contextSignals.candidateDiffPath)
        ? contextSignals.candidateDiffPath
        : path.join(repoRoot, contextSignals.candidateDiffPath);
      if (onDiskArtifactForWork(candPath, work)) {
        return true;
      }
    }
    const cleanPath = trimmed.replace(/^evidence:candidate-diff:?|^diff:?/i, '').trim();
    if (cleanPath && !cleanPath.startsWith('candidate') && !cleanPath.startsWith('patch')) {
      const candidatePath = path.isAbsolute(cleanPath) ? cleanPath : path.join(repoRoot, cleanPath);
      if (onDiskArtifactForWork(candidatePath, work)) {
        return true;
      }
    }
    // Name-implied convention artifacts carry no binding of their own, so they
    // must at least be fresh for this Work item.
    try {
      const candidateArtifacts = ['candidate-diff.patch', 'candidate.diff', 'patch.diff'];
      for (const art of candidateArtifacts) {
        if (onDiskArtifactForWork(path.join(repoRoot, art), work)) {
          return true;
        }
      }
    } catch {}
    if (work?.id && candidateBranchAheadOfTrunk(repoRoot, work.id)) {
      return true;
    }
  }

  return false;
}

export function isResolvableVerifyRef(ref, { choice, work, contextSignals, repoRoot, reportText, runResult } = {}) {
  if (!isVerifyResultRef(ref)) return false;
  if (typeof ref !== 'string') return false;

  const trimmed = ref.trim();

  // Verify evidence is a verify artifact on disk, or the Work's own configured
  // verify check (work.verify — the mechanism runGoalCheck re-executes before
  // any approve edge) run against a real candidate. Inline "EXIT CODE: 0"-style
  // text in the ref, report-text claims, and caller-declared booleans are
  // verdict-interpretation input, never resolver evidence. The candidate branch
  // alone — one ref — must never satisfy both gates: the verify mechanism only
  // counts when a candidate exists independently.
  if (Array.isArray(runResult?.evidence?.artifacts)) {
    for (const p of runResult.evidence.artifacts) {
      if (typeof p === 'string' && (p.endsWith('verify.log') || p.endsWith('verify-result.json'))) {
        try {
          const absPath = path.isAbsolute(p) ? p : (repoRoot ? path.join(repoRoot, p) : p);
          if (fs.existsSync(absPath) && fs.statSync(absPath).isFile() && fs.statSync(absPath).size > 0) {
            return true;
          }
        } catch {}
      }
    }
  }

  if (repoRoot) {
    if (contextSignals?.candidateVerifyPath) {
      const candPath = path.isAbsolute(contextSignals.candidateVerifyPath)
        ? contextSignals.candidateVerifyPath
        : path.join(repoRoot, contextSignals.candidateVerifyPath);
      if (onDiskArtifactForWork(candPath, work)) {
        return true;
      }
    }
    const cleanPath = trimmed.replace(/^evidence:verify-?:?|^verify:?|^test:?/i, '').trim();
    if (cleanPath && !cleanPath.startsWith('pass') && !cleanPath.startsWith('fail')) {
      const candidatePath = path.isAbsolute(cleanPath) ? cleanPath : path.join(repoRoot, cleanPath);
      if (onDiskArtifactForWork(candidatePath, work)) {
        return true;
      }
    }
    try {
      if (onDiskArtifactForWork(path.join(repoRoot, 'verify.log'), work)) {
        return true;
      }
      if (onDiskArtifactForWork(path.join(repoRoot, 'verify-result.json'), work)) {
        return true;
      }
    } catch {}
  }

  if (work?.verify && candidateExistsForWork(work, contextSignals, repoRoot)) {
    return true;
  }

  return false;
}

export function deriveCandidateReviewRefs({ work, contextSignals, repoRoot }) {
  const refs = [];

  const known = [
    ...(work?.refs || []),
    ...(contextSignals?.contextRefs || []),
    ...(contextSignals?.candidateRefs || []),
  ];
  if (contextSignals?.candidateDiffRef) known.push(contextSignals.candidateDiffRef);
  if (contextSignals?.candidateVerifyRef) known.push(contextSignals.candidateVerifyRef);
  if (contextSignals?.diffRef) known.push(contextSignals.diffRef);
  if (contextSignals?.verifyRef) known.push(contextSignals.verifyRef);

  const hasDiff = known.some((r) => isResolvableDiffRef(r, { work, contextSignals, repoRoot }));
  const hasVerify = known.some((r) => isResolvableVerifyRef(r, { work, contextSignals, repoRoot }));

  for (const r of known) {
    if (typeof r === 'string' && !refs.includes(r)) refs.push(r);
  }

  return {
    canProduce: hasDiff && hasVerify,
    candidateRefs: Object.freeze(refs),
  };
}

/**
 * Select the legal stage operation for a Work item at its current stage (Step 05).
 *
 * Return shape:
 * {
 *   operation: string | null,
 *   reason: string,
 *   dispatch: 'direct-stage-skill' | 'assignment' | 'human-only' | null,
 *   stop: boolean,
 *   canAdvanceEdge?: boolean,
 * }
 *
 * @param {object} params
 * @param {object} params.work Work item object
 * @param {string} [params.stage] Current stage (defaults to work.stage)
 * @param {string} [params.domain] Domain (defaults to work.domain or 'coding')
 * @param {string} [params.workflow] Workflow (defaults to work.workflow or 'feature')
 * @param {readonly object[]} [params.availableOperations] Optional pre-resolved operations array
 * @param {object|null} [params.lastRunResult] Optional last Assignment RunResult for this stage
 * @param {object} [params.contextSignals] Optional signals (e.g. { hasPlan: boolean, validationDue: boolean })
 * @param {string} [params.repoRoot] Optional repo root path
 * @returns {Readonly<object>} Operation choice result
 */
export function chooseStageOperation({
  work,
  stage,
  domain,
  workflow,
  availableOperations,
  lastRunResult,
  contextSignals = {},
  repoRoot,
}) {
  const currentStage = stage ?? work?.stage;
  if (!currentStage) {
    return Object.freeze({
      operation: null,
      reason: 'no-stage-specified',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  const domainInput = typeof domain === 'object' && domain !== null ? (domain.name ?? domain) : domain;
  const resolvedDomain = resolveDomainName(domainInput ?? work?.domain ?? DEFAULT_DOMAIN);
  const resolvedWorkflow = workflow ?? work?.workflow ?? 'feature';

  const ops = availableOperations ?? operationsForStage(resolvedDomain, currentStage, { kind: resolvedWorkflow });

  if (!ops || ops.length === 0) {
    return Object.freeze({
      operation: null,
      reason: 'no-operations-available',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  const primaryOp = ops.find((o) => o.primary) ?? ops[0];

  const explicitRequestedOp =
    (typeof contextSignals.nextOperation === 'string' && contextSignals.nextOperation.trim() ? contextSignals.nextOperation.trim() : null) ??
    (typeof work?.nextOperation === 'string' && work.nextOperation.trim() ? work.nextOperation.trim() : null) ??
    (typeof contextSignals.secondaryOperation === 'string' && contextSignals.secondaryOperation.trim() ? contextSignals.secondaryOperation.trim() : null) ??
    (typeof work?.secondaryOperation === 'string' && work.secondaryOperation.trim() ? work.secondaryOperation.trim() : null) ??
    (typeof work?.operation === 'string' && work.operation.trim() ? work.operation.trim() : null);

  if (explicitRequestedOp && !ops.some((o) => o.id === explicitRequestedOp)) {
    return Object.freeze({
      operation: explicitRequestedOp,
      reason: `undeclared-stage-operation-${explicitRequestedOp}`,
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  // Deterministic rules per stage (Step 05 §6)

  // 1. Planning stage choice (Step 05 §6.2)
  if (currentStage === 'planning' || currentStage === 'decompose') {
    const validateOp = ops.find((o) => o.id === 'validate-plan');

    // Check if plan.md exists
    const planExists = contextSignals.hasPlan ?? (work ? hasPlanMd({ work, repoRoot }) : false);

    let effectiveLastRunResult = lastRunResult;
    if (effectiveLastRunResult) {
      const lastOp = effectiveLastRunResult.operation ?? effectiveLastRunResult.assignment?.operation;
      const lastStage = effectiveLastRunResult.stage ?? effectiveLastRunResult.assignment?.stage;
      if (lastOp && lastOp !== 'validate-plan') {
        effectiveLastRunResult = null;
      } else if (lastStage && lastStage !== currentStage) {
        effectiveLastRunResult = null;
      } else if (work?.docsRef && work?.id && repoRoot) {
        const contentRoot = resolveContentRoot(repoRoot, work.id, work.docsRef);
        const planPath = path.join(contentRoot, work.docsRef, 'plan.md');
        if (fs.existsSync(planPath)) {
          const planStat = fs.statSync(planPath);
          const rawTime = effectiveLastRunResult.settledAt ?? effectiveLastRunResult.createdAt ?? effectiveLastRunResult.runtime?.settledAt;
          const settledMs = rawTime ? Date.parse(rawTime) : NaN;
          if (Number.isFinite(settledMs) && settledMs > 0 && planStat.mtimeMs > settledMs) {
            effectiveLastRunResult = null;
          } else if (typeof effectiveLastRunResult.planContentHash === 'string' && effectiveLastRunResult.planContentHash) {
            // Results carrying the dispatch-time plan content hash must match
            // the current plan.md even when the settle time postdates the
            // edit — mtimes line up too easily to be trusted alone.
            let currentPlanHash = null;
            try {
              currentPlanHash = crypto.createHash('sha256').update(fs.readFileSync(planPath)).digest('hex');
            } catch {
              currentPlanHash = null;
            }
            if (!currentPlanHash || currentPlanHash !== effectiveLastRunResult.planContentHash) {
              effectiveLastRunResult = null;
            }
          }
        }
      }
    }
    if (!effectiveLastRunResult && work && repoRoot) {
      effectiveLastRunResult = findLatestAssignmentRunResult({ work, repoRoot, stage: currentStage, operation: 'validate-plan' });
    }

    // If lastRunResult exists from validate-plan:
    if (effectiveLastRunResult) {
      const interpreted = interpretAssignmentRunResult({
        choice: { operation: 'validate-plan', work },
        runResult: effectiveLastRunResult,
        contextSignals,
        work,
        repoRoot,
      });

      if (interpreted.reason === 'assignment-validate-plan-no-evidence') {
        return Object.freeze({
          operation: 'validate-plan',
          reason: 'validation-no-evidence-do-not-advance-work',
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.reason === 'assignment-validate-plan-failed') {
        return Object.freeze({
          operation: 'validate-plan',
          reason: 'validation-failed-do-not-advance-work',
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.nextOperation === 'shape-plan') {
        return Object.freeze({
          operation: primaryOp.id,
          reason: 'validation-returned-to-planning',
          dispatch: 'direct-stage-skill',
          stop: false,
          canAdvanceEdge: false,
        });
      }

      if (interpreted.canAdvanceEdge) {
        return Object.freeze({
          operation: primaryOp.id,
          reason: 'validation-passed-ready-for-planning-edge',
          dispatch: 'direct-stage-skill',
          stop: false,
          canAdvanceEdge: true,
        });
      }

      if (interpreted.stop) {
        return Object.freeze({
          operation: 'validate-plan',
          reason: interpreted.reason,
          dispatch: 'assignment',
          stop: true,
          canAdvanceEdge: false,
        });
      }
    }

    // If plan.md exists and validation is due (and validate-plan is a legal stage operation with a taskSpec)
    const validationDue = contextSignals.validationDue ?? planExists;
    const taskSpecExists = !repoRoot || fs.existsSync(path.join(repoRoot, 'domains', resolvedDomain, 'task-specs', 'validate-plan.md'));
    if (validateOp && planExists && validationDue && taskSpecExists) {
      return Object.freeze({
        operation: 'validate-plan',
        reason: 'plan-written-needs-reality-check',
        dispatch: validateOp.dispatch === 'human-only' ? 'human-only' : 'assignment',
        stop: validateOp.dispatch === 'human-only',
        canAdvanceEdge: false,
      });
    }

    // Default planning path: shape-plan primary path
    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // 2. Discovery stage choice (Step 05 §6.1)
  if (currentStage === 'discovery') {
    if (contextSignals.needsResearch && ops.some((o) => o.id === 'resolve-question')) {
      return Object.freeze({
        operation: 'resolve-question',
        reason: 'bounded-evidence-gap-research-consult',
        dispatch: 'assignment',
        stop: false,
        canAdvanceEdge: false,
      });
    }
    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // 3. Executing stage choice (Step 05 §6.3 / Step 06)
  if (currentStage === 'executing') {
    const reviewOp = ops.find((o) => o.id === 'review-item');
    const scoutOp = ops.find((o) => o.id === 'scout-blast-radius');
    const subtaskOp = ops.find((o) => o.id === 'scoped-subtask');

    const requestedSecondaryOp =
      contextSignals.nextOperation ??
      work?.nextOperation ??
      contextSignals.secondaryOperation ??
      work?.secondaryOperation ??
      work?.operation ??
      (contextSignals.needsReview || contextSignals.hasCandidateImplementation ? 'review-item' : null) ??
      (contextSignals.needsScout || contextSignals.riskyEdit ? 'scout-blast-radius' : null);

    if (requestedSecondaryOp === 'fix-verify-red' || work?.nextOperation === 'fix-verify-red' || contextSignals.nextOperation === 'fix-verify-red') {
      const fixOp = ops.find((o) => o.id === 'fix-verify-red');
      return Object.freeze({
        operation: fixOp ? fixOp.id : primaryOp.id,
        reason: 'review-rejected-route-to-fix',
        dispatch: fixOp ? (fixOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill') : 'direct-stage-skill',
        stop: false,
        canAdvanceEdge: false,
        nextOperation: 'fix-verify-red',
      });
    }

    if (requestedSecondaryOp === 'review-item' || lastRunResult?.operation === 'review-item') {
      const { canProduce, candidateRefs } = deriveCandidateReviewRefs({ work, contextSignals, repoRoot });

      if (lastRunResult && (requestedSecondaryOp === 'review-item' || lastRunResult?.operation === 'review-item')) {
        const interpreted = interpretAssignmentRunResult({
          choice: { operation: 'review-item', contextRefs: candidateRefs },
          runResult: lastRunResult,
          contextSignals,
          work,
          repoRoot,
        });

        if (interpreted.reason === 'review-item-rejected-route-fix') {
          const fixOp = ops.find((o) => o.id === 'fix-verify-red');
          return Object.freeze({
            operation: fixOp ? fixOp.id : primaryOp.id,
            reason: 'review-rejected-route-to-fix',
            dispatch: fixOp ? (fixOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill') : 'direct-stage-skill',
            stop: false,
            canAdvanceEdge: false,
            nextOperation: 'fix-verify-red',
          });
        }

        if (interpreted.stop) {
          return Object.freeze({
            operation: 'review-item',
            reason: interpreted.reason,
            dispatch: 'assignment',
            contextRefs: candidateRefs,
            stop: true,
            canAdvanceEdge: false,
          });
        }
      }

      if (requestedSecondaryOp === 'review-item') {
        if (!canProduce) {
          return Object.freeze({
            operation: 'review-item',
            reason: 'review-item-missing-candidate-diff-and-verify-refs',
            dispatch: 'assignment',
            stop: true,
            canAdvanceEdge: false,
          });
        }
        const reviewOp = ops.find((o) => o.id === 'review-item');
        return Object.freeze({
          operation: 'review-item',
          reason: 'secondary-operation-review-item',
          dispatch: reviewOp?.dispatch === 'human-only' ? 'human-only' : 'assignment',
          contextRefs: candidateRefs,
          stop: false,
          canAdvanceEdge: false,
        });
      }
    }

    if (requestedSecondaryOp && requestedSecondaryOp !== primaryOp.id && requestedSecondaryOp !== 'review-item') {
      const selectedOp = ops.find((o) => o.id === requestedSecondaryOp);
      if (selectedOp) {
        return Object.freeze({
          operation: selectedOp.id,
          reason: `secondary-operation-${selectedOp.id}`,
          dispatch: selectedOp.dispatch === 'human-only' ? 'human-only' : 'assignment',
          stop: selectedOp.dispatch === 'human-only',
          canAdvanceEdge: false,
        });
      }
    }

    return Object.freeze({
      operation: primaryOp.id,
      reason: 'primary-stage-owner-work',
      dispatch: primaryOp.dispatch === 'human-only' ? 'human-only' : 'direct-stage-skill',
      stop: primaryOp.dispatch === 'human-only',
      canAdvanceEdge: false,
    });
  }

  // Fallback for other stages
  if (contextSignals.secondaryOperation && contextSignals.secondaryOperation !== primaryOp.id) {
    const selectedOp = ops.find((o) => o.id === contextSignals.secondaryOperation);
    if (selectedOp) {
      return Object.freeze({
        operation: selectedOp.id,
        reason: `secondary-operation-${selectedOp.id}`,
        dispatch: selectedOp.dispatch === 'human-only' ? 'human-only' : 'assignment',
        stop: selectedOp.dispatch === 'human-only',
        canAdvanceEdge: false,
      });
    }
  }

  const isHumanOnly = primaryOp.dispatch === 'human-only';
  return Object.freeze({
    operation: primaryOp.id,
    reason: isHumanOnly ? 'human-only-operation' : 'primary-stage-owner-work',
    dispatch: isHumanOnly ? 'human-only' : 'direct-stage-skill',
    stop: isHumanOnly,
    canAdvanceEdge: false,
  });
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function validationVerdict(agentClaim) {
  const explicit = normalizeText(agentClaim?.verdict);
  if (explicit) {
    const norm = explicit.replace(/[\u2014\u2013\u2212]/g, '-');
    if (norm === 'REJECTED' || norm === 'NOT READY - RETURN TO PLANNING' || norm === 'NOT READY') {
      return 'NOT READY - RETURN TO PLANNING';
    }
    return explicit;
  }
  const summary = normalizeText(agentClaim?.summary);
  if (summary.includes('NOT READY') || summary.includes('REJECTED')) return 'NOT READY - RETURN TO PLANNING';
  if (summary.includes('READY WITH CONSTRAINTS')) return 'READY WITH CONSTRAINTS';
  if (summary.includes('READY')) return 'READY';
  return null;
}

function reviewVerdict(agentClaim) {
  const explicit = normalizeText(agentClaim?.verdict ?? agentClaim?.reviewVerdict);
  if (explicit) return explicit;
  const summary = normalizeText(agentClaim?.summary);
  if (summary.includes('REJECT') || summary.includes('CHANGES REQUESTED') || summary.includes('NOT APPROVED')) {
    return 'REJECT';
  }
  if (summary.includes('APPROVED') || summary.includes('APPROVE')) {
    return 'APPROVED';
  }
  return null;
}

/**
 * Helper to check if a value is substantive (non-empty string, number, boolean,
 * non-empty array with substantive elements, or non-empty object with substantive properties).
 */
function isSubstantiveValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (typeof val === 'number' || typeof val === 'boolean') return true;
  if (Array.isArray(val)) {
    return val.length > 0 && val.some(isSubstantiveValue);
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    return keys.length > 0 && keys.some((k) => isSubstantiveValue(val[k]));
  }
  return false;
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function hasSubstantiveStringArray(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(isNonEmptyString);
}

function isConcreteCitation(val, repoRoot) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.length > 0 && val.some((item) => isConcreteCitation(item, repoRoot));
    }
    const values = Object.values(val);
    if (values.length > 0 && values.some((item) => isConcreteCitation(item, repoRoot))) return true;
    const jsonStr = JSON.stringify(val);
    return isConcreteCitation(jsonStr, repoRoot);
  }
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (s.length === 0) return false;

  const isPlaceholderWord = (w) =>
    /^(none|n\/a|todo|tbd|placeholder|dummy|unknown|null|undefined|made-up|made-up-ref|fake|foo|bar)$/i.test(w.trim());

  if (isPlaceholderWord(s) || /^evidence-looking-key/i.test(s)) {
    return false;
  }

  const root = repoRoot || process.cwd();

  // 1. Check file paths / line refs inside s
  const fileMatches = Array.from(s.matchAll(/(?:file:\/\/)?([a-zA-Z0-9_\-\/]+\.(js|mjs|cjs|ts|jsx|tsx|py|json|md|yaml|yml|go|rs|c|cpp|h))\b(?::\d+|#L\d+|\bL\d+\b)?/gi));
  if (fileMatches.length > 0) {
    let hasExistingFile = false;
    for (const match of fileMatches) {
      const relOrAbs = match[1];
      const targetPathInRepo = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
      const targetPathInCwd = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(process.cwd(), relOrAbs);
      if (fs.existsSync(targetPathInRepo) || fs.existsSync(targetPathInCwd)) {
        hasExistingFile = true;
      }
    }
    if (hasExistingFile) return true;
  }

  // 2. Check URLs
  if (/https?:\/\/|git@/i.test(s)) return true;

  // 3. Check evidence refs
  if (/\b(evidence|diff|verify|test)\s*:\s*[a-zA-Z0-9_\-\*]+/i.test(s)) {
    const evMatch = s.match(/\b(evidence|diff|verify|test)\s*:\s*([a-zA-Z0-9_\-\*]+)/i);
    if (evMatch && !isPlaceholderWord(evMatch[2])) return true;
  }

  // 4. Check explicit command refs
  if (/\b(node|npm|pnpm|yarn|git|fgos|bash|sh|make)\s+[a-zA-Z0-9_\-\.\/]+/i.test(s)) {
    return true;
  }

  // 5. Check citation / ref prefixes like citation: foo
  const citeMatches = Array.from(s.matchAll(/\b(citation|cite|ref|file|command|doc|proof|src|verified)\s*:\s*([^\s\)\],]+)/gi));
  if (citeMatches.length > 0) {
    for (const match of citeMatches) {
      const target = match[2];
      if (isPlaceholderWord(target)) continue;
      const targetFile = target.replace(/:\d+$/, '').replace(/#L\d+$/, '');
      const relOrAbs = targetFile.replace(/^file:\/\//, '');
      const targetPathInRepo = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(root, relOrAbs);
      const targetPathInCwd = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(process.cwd(), relOrAbs);
      if (fs.existsSync(targetPathInRepo) || fs.existsSync(targetPathInCwd)) {
        return true;
      }
      if (/https?:\/\//i.test(target)) return true;
    }
  }

  return false;
}

function isValidGateRow(row, repoRoot) {
  if (!row) return false;
  let statusStr = '';
  if (typeof row === 'string') {
    statusStr = row;
  } else if (typeof row === 'object') {
    statusStr = JSON.stringify(row);
  }
  const hasPassOrFail = /\b(PASS|FAIL)\b/i.test(statusStr);
  if (!hasPassOrFail) return false;
  return isConcreteCitation(row, repoRoot);
}

const REQUIRED_GATE_DIMENSIONS = [
  /mode[-_ ]?fit|mode/i,
  /repo[-_ ]?fit|repo/i,
  /assumptions?[-_ ]?fit|assumptions?/i,
  /smaller[-_ ]?path[-_ ]?fit|smaller[-_ ]?path/i,
  /proof[-_ ]?surface[-_ ]?fit|proof[-_ ]?surface/i,
  /impact[-_ ]?(analysis[-_ ]?)?(posture|fit)?/i,
];

/**
 * Check whether a reality gate structure is substantive and covers all 6 required dimensions.
 */
function hasSubstantiveRealityGate(gateData, repoRoot) {
  if (!gateData || typeof gateData !== 'object') return false;

  let entries = [];
  if (Array.isArray(gateData)) {
    entries = gateData;
  } else {
    entries = Object.entries(gateData).map(([k, v]) => ({ key: k, value: v }));
  }

  if (entries.length < 6) return false;

  for (const dimRegex of REQUIRED_GATE_DIMENSIONS) {
    const matched = entries.find((e) => {
      const name = typeof e === 'object' && e !== null ? (e.key ?? e.gate ?? e.name ?? e.dimension ?? JSON.stringify(e)) : String(e);
      return dimRegex.test(name);
    });
    if (!matched) return false;
    const value = typeof matched === 'object' && matched !== null && 'value' in matched ? matched.value : matched;
    if (!isValidGateRow(value, repoRoot)) return false;
  }

  return true;
}

/**
 * Check whether an entry in a feasibility matrix contains citations or evidence.
 */
function hasCitationOrEvidence(entry, repoRoot) {
  return isConcreteCitation(entry, repoRoot);
}

/**
 * Extract medium+ risk names from plan.md text.
 *
 * @param {string} planContent
 * @returns {string[]}
 */
export function extractMediumPlusRisks(planContent) {
  if (!planContent || typeof planContent !== 'string') return [];
  const risks = new Set();
  const lines = planContent.split('\n');

  let inRiskTable = false;
  let riskColIdx = -1;
  let levelColIdx = -1;

  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).slice(1, -1);
      if (!inRiskTable) {
        const lowerCells = cells.map((c) => c.toLowerCase());
        const rIdx = lowerCells.findIndex((c) => c.includes('risk') || c.includes('hazard') || c.includes('item'));
        const lIdx = lowerCells.findIndex((c) => c.includes('level') || c.includes('severity') || c.includes('impact') || c.includes('rating') || c.includes('tier'));
        if (rIdx !== -1 && lIdx !== -1) {
          inRiskTable = true;
          riskColIdx = rIdx;
          levelColIdx = lIdx;
          continue;
        }
      } else {
        if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
        if (cells.length > Math.max(riskColIdx, levelColIdx)) {
          const riskName = cells[riskColIdx];
          const levelVal = cells[levelColIdx];
          if (riskName && levelVal && /medium\+?|med\+?|high|critical|severe|extreme/i.test(levelVal) && !/low|light|none|negligible/i.test(levelVal)) {
            const cleaned = riskName.replace(/[\*\`\_]/g, '').trim();
            if (cleaned && cleaned !== '—' && cleaned !== '-') {
              risks.add(cleaned);
            }
          }
        }
      }
    } else {
      inRiskTable = false;
    }
  }

  const listMatches = planContent.matchAll(/(?:[-*]\s*|risk[:\s]+)(?:\*\*)?([a-zA-Z0-9_\-\/]+)(?:\*\*)?\s*[:\(\-]\s*(medium\+?|med\+?|high|critical|severe|extreme)/gi);
  for (const match of listMatches) {
    const name = match[1].replace(/[\*\`\_]/g, '').trim();
    if (name && !/^(level|severity|impact|rating|risk|mode|flag|flags)$/i.test(name)) {
      risks.add(name);
    }
  }

  return Array.from(risks);
}

/**
 * Check whether a feasibility matrix structure is substantive and backed by citations/evidence.
 */
function hasSubstantiveFeasibilityMatrix(matrixData, repoRoot, planContent = null) {
  if (!matrixData || typeof matrixData !== 'object') return false;
  let rows = [];
  if (Array.isArray(matrixData)) {
    rows = matrixData;
  } else {
    rows = Object.entries(matrixData).map(([k, v]) => {
      if (typeof v === 'object' && v !== null) {
        return { risk: k, ...v };
      }
      return { risk: k, citation: v };
    });
  }
  if (rows.length === 0) return false;
  if (!rows.every((r) => hasCitationOrEvidence(r, repoRoot))) return false;

  if (planContent) {
    const requiredMediumPlusRisks = extractMediumPlusRisks(planContent);
    if (requiredMediumPlusRisks.length > 0) {
      for (const reqRisk of requiredMediumPlusRisks) {
        const reqLower = reqRisk.toLowerCase();
        const found = rows.some((r) => {
          const rowRiskName = String(r.risk ?? r.riskName ?? r.name ?? r.key ?? r.id ?? '').toLowerCase();
          return rowRiskName.includes(reqLower) || reqLower.includes(rowRiskName);
        });
        if (!found) return false;
      }
    }
  }

  return true;
}

/**
 * Check whether validate-plan report text has substantive reality gate & feasibility content.
 */
function hasSubstantiveValidateReportText(reportText, repoRoot) {
  if (!reportText || typeof reportText !== 'string') return false;
  const hasRealityGateInText = /reality[- ]gate|reality check|mode fit|repo fit|proof surface|score/i.test(reportText);
  const hasFeasibilityInText = /feasibility matrix|feasibility|risk matrix|risk assessment/i.test(reportText);
  if (!hasRealityGateInText || !hasFeasibilityInText) return false;

  const hasCitationsInText = isConcreteCitation(reportText, repoRoot);

  const strippedText = reportText
    .replace(/reality[- ]gate|reality check|mode fit|repo fit|proof surface|score|feasibility matrix|feasibility|risk matrix|risk assessment|pass|fail/gi, '')
    .trim();

  return hasCitationsInText && strippedText.length > 20;
}

/**
 * Check whether agentClaim contains a substantive structured validate-plan claim.
 */
function hasSubstantiveStructuredValidateClaim(agentClaim, repoRoot, planContent = null) {
  if (!agentClaim || typeof agentClaim !== 'object') return false;
  const gateData = agentClaim.realityGate ?? agentClaim.realityCheck;
  const matrixData = agentClaim.feasibilityMatrix ?? agentClaim.feasibility;
  return hasSubstantiveRealityGate(gateData, repoRoot) && hasSubstantiveFeasibilityMatrix(matrixData, repoRoot, planContent);
}

function getBoundRefs(choice, work, agentClaim) {
  const allRefs = [
    ...(choice?.assignment?.contextRefs || []),
    ...(choice?.contextRefs || []),
    ...(work?.refs || []),
    ...(agentClaim?.evidenceRefs || []),
  ].filter((r) => typeof r === 'string' && r.trim().length > 0);

  const boundDiffRefs = Array.from(new Set(allRefs.filter((r) => isCandidateDiffRef(r))));
  const boundVerifyRefs = Array.from(new Set(allRefs.filter((r) => isVerifyResultRef(r))));
  return { boundDiffRefs, boundVerifyRefs };
}

/**
 * Check whether agentClaim contains substantive findings/evaluation tied to diff/verify refs.
 */
function hasSubstantiveStructuredReviewClaim(agentClaim, choice, work) {
  if (!agentClaim || typeof agentClaim !== 'object') return false;
  const findings = agentClaim.findings ?? agentClaim.evaluation ?? agentClaim.reviewFindings;
  if (!findings) return false;

  if (Array.isArray(findings)) {
    if (findings.length === 0 || !findings.every(isSubstantiveValue)) return false;
  } else if (typeof findings === 'object') {
    if (Object.keys(findings).length === 0 || !Object.values(findings).every(isSubstantiveValue)) return false;
  } else {
    return false;
  }

  const { boundDiffRefs, boundVerifyRefs } = getBoundRefs(choice, work, agentClaim);
  const findingsStr = JSON.stringify(findings);

  const hasDiffTie =
    boundDiffRefs.length > 0
      ? boundDiffRefs.some((ref) => findingsStr.includes(ref))
      : /diff:|evidence:candidate-diff/i.test(findingsStr);

  const hasVerifyTie =
    boundVerifyRefs.length > 0
      ? boundVerifyRefs.some((ref) => findingsStr.includes(ref))
      : /verify:|evidence:verify-|test:/i.test(findingsStr);

  return Boolean(hasDiffTie && hasVerifyTie);
}

/**
 * Validate that review-item evidenceRefs contain structured, evidence-bound refs
 * (matching exact prefixes like 'evidence:candidate-diff', 'evidence:verify-*',
 * 'diff:...', 'verify:...', 'test:...' or matching context/work refs).
 *
 * @param {unknown} evidenceRefs
 * @param {object} [choice]
 * @param {object} [work]
 * @returns {boolean}
 */
export function hasValidReviewEvidenceRefs(evidenceRefs, choice, work, repoRoot, contextSignals, reportText, runResult) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    return false;
  }

  const knownRefs = new Set([
    ...(choice?.assignment?.contextRefs || []),
    ...(choice?.contextRefs || []),
    ...(work?.refs || []),
  ]);

  const isBoundDiffRef = (ref) => {
    if (typeof ref !== 'string') return false;
    const trimmed = ref.trim();
    if (!knownRefs.has(trimmed)) return false;
    return isResolvableDiffRef(trimmed, { choice, work, contextSignals, repoRoot, reportText, runResult });
  };

  const isBoundVerifyRef = (ref) => {
    if (typeof ref !== 'string') return false;
    const trimmed = ref.trim();
    if (!knownRefs.has(trimmed)) return false;
    return isResolvableVerifyRef(trimmed, { choice, work, contextSignals, repoRoot, reportText, runResult });
  };

  const hasDiff = evidenceRefs.some(isBoundDiffRef);
  const hasVerify = evidenceRefs.some(isBoundVerifyRef);

  return hasDiff && hasVerify;
}

/**
 * Retrieve text content of worker report artifact if present.
 *
 * @param {object} runResult
 * @param {string} [repoRoot]
 * @returns {string|null}
 */
function getArtifactList(runResult) {
  if (Array.isArray(runResult?.evidence?.artifacts) && runResult.evidence.artifacts.length > 0) {
    return runResult.evidence.artifacts;
  }
  if (Array.isArray(runResult?.artifacts) && runResult.artifacts.length > 0) {
    return runResult.artifacts;
  }
  if (Array.isArray(runResult?.workerArtifacts) && runResult.workerArtifacts.length > 0) {
    return runResult.workerArtifacts.map((a) => (typeof a === 'string' ? a : a.path)).filter(Boolean);
  }
  return [];
}

// The run dir whose evidence a consuming pass may actually read, in trust
// order:
// 1. The scan's manifest-pinned dir (the Symbol set by
//    findLatestAssignmentRunResult from the dispatched member the result was
//    read from). result.json fields are post-settle writable and never
//    locate evidence for a scanned result.
// 2. The result's own runId (run_<assignmentId>_<attempt>; the attempt is
//    the last '_' segment since assignment ids contain underscores) — the
//    runner writes this field when it builds a fresh in-pass result. A
//    PRESENT-but-unusable runId pins the result to NO dir: falling back to
//    other result.json fields the same writer controls would let a tampered
//    result relocate its own evidence.
// 3. Legacy shapes with no runId at all: the dir of the recorded stdout log.
// Returns null when no trustworthy dir can be derived — callers then see NO
// report text (missing-report/insufficient stop), never raw recorded-path
// resolution.
function consumingRunDirFor(runResult, root) {
  const pinned = runResult?.[CONSUMING_RUN_DIR];
  if (typeof pinned === 'string' && pinned !== '') {
    return pinned;
  }
  if (typeof runResult?.runId === 'string' && runResult.runId !== '') {
    const attempt = runResult.runId.split('_').pop();
    const asgnId = runResult?.assignmentId ?? runResult?.assignment?.assignmentId;
    if (asgnId && /^\d+$/.test(attempt)) {
      return path.join(root, '.fgos', 'assignments', asgnId, 'runs', attempt);
    }
    return null;
  }
  if (runResult?.runtime?.stdoutLog) {
    return path.dirname(path.resolve(root, runResult.runtime.stdoutLog));
  }
  return null;
}

// Report-artifact name predicate: control-plane files and logs never count;
// markdown or report-named files do. Shared by getReportText and
// hasWorkerReportArtifact.
function isReportArtifactPath(art) {
  if (typeof art !== 'string') return false;
  const base = path.basename(art);
  if (
    base === 'agent-result.json' ||
    base === 'run.json' ||
    base === 'exit.json' ||
    base === 'evidence.json' ||
    base === 'assignment.json' ||
    base === 'dispatch-plan.json' ||
    base === 'stdout.log' ||
    base === 'stderr.log'
  ) {
    return false;
  }
  return base.endsWith('.md') || /report|feasibility|validation/i.test(base);
}

export function getReportText(runResult, repoRoot) {
  const artifacts = getArtifactList(runResult);
  if (artifacts.length === 0) {
    return null;
  }
  const root = repoRoot || process.cwd();
  const reportCandidates = artifacts.filter(isReportArtifactPath);
  if (reportCandidates.length === 0) return null;

  const settleSet = Array.isArray(runResult?.settleReports) ? runResult.settleReports : null;
  if (settleSet) {
    // Reports are bound at settle: only files in the settle set (hash-verified
    // by the cross-pass scan; runner-recorded for fresh in-pass results) may
    // supply report text. Recorded artifact paths outside the set — and the
    // consuming-dir fallbacks below — are ignored: a report planted or edited
    // after settle is not the evidence the classifier judged, and dir-level
    // fallbacks would read it anyway.
    const allowed = new Set();
    for (const entry of settleSet) {
      if (!entry || typeof entry.path !== 'string') continue;
      try {
        allowed.add(path.resolve(root, entry.path));
      } catch {}
    }
    if (allowed.size === 0) return null;
    for (const candidate of reportCandidates) {
      let resolvedCandidate = null;
      try {
        resolvedCandidate = path.resolve(root, candidate);
      } catch {
        resolvedCandidate = null;
      }
      if (resolvedCandidate === null || !allowed.has(resolvedCandidate)) continue;
      try {
        if (fs.existsSync(resolvedCandidate) && fs.statSync(resolvedCandidate).isFile()) {
          return fs.readFileSync(resolvedCandidate, 'utf8');
        }
      } catch {}
    }
    return null;
  }

  const reportPath = reportCandidates[0];
  const consumingDir = consumingRunDirFor(runResult, root);
  if (!consumingDir) {
    // No trustworthy run dir: no report text. The report gate then stops as
    // missing-report/insufficient. Recorded artifact paths are never
    // resolved raw — the recorded path itself is result.json-writable, and
    // whoever wrote it also controls whether the planted file exists.
    return null;
  }
  // Only the consuming run's own dir counts. A recorded path is honored
  // when it resolves inside that dir; a bare name is honored as that
  // dir's file. A recorded path into a sibling run's dir is ignored —
  // one run's report must never satisfy another run's gate.
  const candidatePaths = [];
  let resolvedRecorded = null;
  try {
    resolvedRecorded = path.resolve(root, reportPath);
  } catch {
    resolvedRecorded = null;
  }
  const recordedInRun =
    resolvedRecorded !== null &&
    (resolvedRecorded === consumingDir || resolvedRecorded.startsWith(`${consumingDir}${path.sep}`));
  if (recordedInRun) candidatePaths.push(resolvedRecorded);
  candidatePaths.push(path.join(consumingDir, path.basename(reportPath)));
  candidatePaths.push(path.join(consumingDir, 'agent-report.md'));

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return fs.readFileSync(p, 'utf8');
      }
    } catch {}
  }
  return null;
}

/**
 * Validate that runResult contains a substantive worker-produced report artifact
 * (e.g. agent-report.md or .md artifact other than control-plane JSON/logs).
 *
 * @param {object} runResult
 * @param {string} [repoRoot]
 * @returns {boolean}
 */
export function hasWorkerReportArtifact(runResult, repoRoot) {
  const artifacts = getArtifactList(runResult);
  if (artifacts.length === 0) {
    return false;
  }
  const hasReportPath = artifacts.some(isReportArtifactPath);
  if (!hasReportPath) return false;

  const text = getReportText(runResult, repoRoot);
  if (text !== null) {
    return isSubstantiveReportText(text);
  }
  return false;
}

/**
 * Interpret an Assignment RunResult for the selected stage operation.
 *
 * This function is deliberately conservative: only operation-specific verdicts
 * can unblock the driver. Generic `done` claims are not lifecycle evidence.
 *
 * @param {object} params
 * @param {object} params.choice Operation choice
 * @param {object} params.runResult Stored RunResult
 * @param {object} [params.contextSignals] Driver context signals
 * @returns {Readonly<object>}
 */
export function interpretAssignmentRunResult({ choice, runResult, contextSignals = {}, work, repoRoot }) {
  const confidence = runResult?.confidence;
  const status = runResult?.status;
  const operation = choice?.operation;

  if (confidence === 'no-evidence' || status === 'no-evidence') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-no-evidence`,
    });
  }

  if (confidence === 'failed' || status === 'failed') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-failed`,
    });
  }

  if (status === 'blocked') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-blocked`,
    });
  }

  const hasReportConfidence = confidence === 'reported' || confidence === 'verified';
  if (!hasReportConfidence || status !== 'done') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: `assignment-${operation}-insufficient-confidence`,
    });
  }

  if (operation === 'validate-plan') {
    if (!hasWorkerReportArtifact(runResult, repoRoot)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: 'validate-plan-missing-report-artifact',
      });
    }

    let planContent = null;
    const targetWork = choice?.work ?? work;
    if (targetWork?.docsRef && repoRoot) {
      const docsRef = targetWork.docsRef;
      const contentRoot = resolveContentRoot(repoRoot, targetWork.id, docsRef);
      const planPath = path.join(contentRoot, docsRef, 'plan.md');
      if (fs.existsSync(planPath)) {
        try {
          planContent = fs.readFileSync(planPath, 'utf8');
        } catch {}
      }
    }

    const reportText = getReportText(runResult, repoRoot);
    const agentClaim = runResult?.agentClaim;

    const hasReportEvidence = hasSubstantiveValidateReportText(reportText, repoRoot);
    const hasStructuredClaimEvidence = hasSubstantiveStructuredValidateClaim(agentClaim, repoRoot, planContent);

    if (!hasStructuredClaimEvidence || !hasReportEvidence) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: 'validate-plan-insufficient-evidence',
      });
    }

    const verdict = validationVerdict(agentClaim);

    if (verdict === 'READY') {
      return Object.freeze({
        canAdvanceEdge: true,
        stop: false,
        reason: 'validate-plan-ready',
        verdict,
      });
    }
    if (verdict === 'READY WITH CONSTRAINTS') {
      const recordedInPlan = hasPlanConstraints({ work: targetWork, repoRoot });
      const constraintsAccepted =
        recordedInPlan ||
        contextSignals.constraintsWritten === true ||
        contextSignals.constraintsAccepted === true;
      return Object.freeze({
        canAdvanceEdge: constraintsAccepted,
        stop: !constraintsAccepted,
        reason: constraintsAccepted
          ? 'validate-plan-ready-with-recorded-constraints'
          : 'validate-plan-ready-with-unrecorded-constraints',
        verdict,
      });
    }
    const normVerdict = verdict ? verdict.replace(/[\u2014\u2013\u2212]/g, '-').trim() : '';
    if (normVerdict === 'NOT READY - RETURN TO PLANNING' || normVerdict === 'NOT READY') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        nextOperation: 'shape-plan',
        reason: 'validate-plan-return-to-planning',
        verdict,
      });
    }
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: 'validate-plan-missing-structured-verdict',
      verdict,
    });
  }

  if (operation === 'review-item') {
    const reportText = getReportText(runResult, repoRoot);
    const evidenceRefs = runResult?.agentClaim?.evidenceRefs;
    if (!hasValidReviewEvidenceRefs(evidenceRefs, choice, work, repoRoot, contextSignals, reportText, runResult)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: 'review-item-missing-evidence-refs',
      });
    }

    if (!hasWorkerReportArtifact(runResult, repoRoot)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: 'review-item-missing-report-artifact',
      });
    }
    const agentClaim = runResult?.agentClaim;

    const { boundDiffRefs, boundVerifyRefs } = getBoundRefs(choice, work, agentClaim);

    const hasSubstantiveEvaluationInText = Boolean(
      reportText &&
      /approve|approved|reject|rejected|finding|evaluation|rationale|assessment/i.test(reportText) &&
      (boundDiffRefs.length > 0
        ? boundDiffRefs.some((ref) => reportText.includes(ref))
        : /diff|candidate-diff|patch|change|code change/i.test(reportText)) &&
      (boundVerifyRefs.length > 0
        ? boundVerifyRefs.some((ref) => reportText.includes(ref))
        : /verify|verification|test|pass|fail/i.test(reportText))
    );
    const hasStructuredClaimFindings = hasSubstantiveStructuredReviewClaim(agentClaim, choice, work);

    if (reportText !== null && !hasSubstantiveEvaluationInText && !hasStructuredClaimFindings) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        canProceed: false,
        reason: 'review-item-insufficient-evidence',
      });
    }

    const verdict = reviewVerdict(runResult.agentClaim);
    if (verdict === 'APPROVED' || verdict === 'APPROVE') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        canProceed: true,
        reason: 'review-item-approved',
        verdict,
      });
    }
    if (verdict === 'REJECT' || verdict === 'CHANGES REQUESTED' || verdict === 'NOT APPROVED') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: false,
        nextOperation: 'fix-verify-red',
        reason: 'review-item-rejected-route-fix',
        verdict,
      });
    }
    return Object.freeze({
      canAdvanceEdge: false,
      stop: true,
      reason: 'review-item-missing-structured-verdict',
      verdict,
    });
  }

  if (operation === 'scout-blast-radius') {
    if (confidence !== 'reported' && confidence !== 'verified') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: `assignment-${operation}-insufficient-confidence`,
      });
    }

    if (!hasWorkerReportArtifact(runResult, repoRoot)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        canProceed: false,
        reason: 'scout-blast-radius-missing-report-artifact',
      });
    }

    const reportText = getReportText(runResult, repoRoot);
    const agentClaim = runResult?.agentClaim;

    const hasReportTextFilesOrSymbols = Boolean(
      reportText &&
      /[a-zA-Z0-9_\-\/]+\.(js|mjs|cjs|ts|jsx|tsx|py|json|md|yaml|yml|go|rs|c|cpp|h)\b|symbol:|function\s+\w+|class\s+\w+|method\s+\w+/i.test(reportText) &&
      reportText.trim().replace(/scout|blast|radius|impact|search/gi, '').trim().length > 20
    );
    const hasClaimFilesOrSymbols =
      hasSubstantiveStringArray(agentClaim?.files) ||
      hasSubstantiveStringArray(agentClaim?.symbols) ||
      isNonEmptyString(agentClaim?.file) ||
      isNonEmptyString(agentClaim?.symbol);
    const hasNamedFilesOrSymbols = hasReportTextFilesOrSymbols || hasClaimFilesOrSymbols;

    const hasReportTextPosture = Boolean(
      reportText && /\brg\b|ripgrep|graph\b|\bposture\b|degraded|inactive|cross-check/i.test(reportText)
    );
    const hasClaimPosture = isNonEmptyString(agentClaim?.posture) || isNonEmptyString(agentClaim?.searchPosture) || isNonEmptyString(agentClaim?.graphPosture);
    const hasPostureEvidence = hasReportTextPosture || hasClaimPosture;

    const hasReportTextCallers = Boolean(
      reportText && /callers?:|direct callers|called by|invoked by|caller list/i.test(reportText)
    );
    const hasClaimCallers =
      hasSubstantiveStringArray(agentClaim?.callers) || isNonEmptyString(agentClaim?.callers) || isNonEmptyString(agentClaim?.caller);
    const hasCallersEvidence = hasReportTextCallers || hasClaimCallers;

    const hasReportTextAffected = Boolean(
      reportText && /affected:|affected processes|impacted:|downstream:|affected workflows|processes affected/i.test(reportText)
    );
    const hasClaimAffected =
      hasSubstantiveStringArray(agentClaim?.affected) ||
      hasSubstantiveStringArray(agentClaim?.processes) ||
      isNonEmptyString(agentClaim?.affected) ||
      isNonEmptyString(agentClaim?.affectedProcesses);
    const hasAffectedEvidence = hasReportTextAffected || hasClaimAffected;

    const hasReportTextRisk = Boolean(
      reportText && /risk read:|risk:|risk assessment:|risk level|\b(low|medium|high|critical|light)\s+risk\b/i.test(reportText)
    );
    const hasClaimRisk =
      isNonEmptyString(agentClaim?.risk) || isNonEmptyString(agentClaim?.riskRead) || isNonEmptyString(agentClaim?.riskAssessment);
    const hasRiskEvidence = hasReportTextRisk || hasClaimRisk;

    if (reportText !== null && (!hasNamedFilesOrSymbols || !hasPostureEvidence || !hasCallersEvidence || !hasAffectedEvidence || !hasRiskEvidence)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        canProceed: false,
        reason: 'scout-blast-radius-insufficient-evidence',
      });
    }

    return Object.freeze({
      canAdvanceEdge: false,
      stop: false,
      canProceed: true,
      reason: `${operation}-reported`,
    });
  }

  if (operation === 'resolve-question') {
    if (confidence !== 'reported' && confidence !== 'verified') {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        reason: `assignment-${operation}-insufficient-confidence`,
      });
    }

    if (!hasWorkerReportArtifact(runResult, repoRoot)) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        canProceed: false,
        reason: 'resolve-question-missing-report-artifact',
      });
    }

    const reportText = getReportText(runResult, repoRoot);
    const agentClaim = runResult?.agentClaim;

    const hasReportTextAnswer = Boolean(
      reportText &&
      /answer:|finding:|conclusion:|result:/i.test(reportText) &&
      reportText.trim().replace(/question|resolve|answer|finding|conclusion|result/gi, '').trim().length > 15
    );
    const hasClaimAnswer = isNonEmptyString(agentClaim?.answer) || hasSubstantiveStringArray(agentClaim?.findings);
    const hasDirectAnswer = hasReportTextAnswer || hasClaimAnswer;

    const hasReportTextCitations = Boolean(
      reportText && isConcreteCitation(reportText, repoRoot)
    );
    const hasClaimCitations =
      Array.isArray(agentClaim?.citations) &&
      agentClaim.citations.length > 0 &&
      agentClaim.citations.every((c) => isConcreteCitation(c, repoRoot));
    const hasCitations = hasReportTextCitations || hasClaimCitations;

    const hasReportTextVerdict = Boolean(
      reportText && /uncertainty:|remaining uncertainty|verdict:\s*(clear|unclear)|\bclear\b|\bunclear\b/i.test(reportText)
    );
    const hasClaimVerdict = agentClaim?.verdict === 'clear' || agentClaim?.verdict === 'unclear';
    const hasUncertaintyOrVerdict = hasReportTextVerdict || hasClaimVerdict;

    const hasSubstantiveResolveEvidence = hasDirectAnswer && hasCitations && hasUncertaintyOrVerdict;

    if (reportText !== null && !hasSubstantiveResolveEvidence) {
      return Object.freeze({
        canAdvanceEdge: false,
        stop: true,
        canProceed: false,
        reason: 'resolve-question-insufficient-evidence',
      });
    }

    return Object.freeze({
      canAdvanceEdge: false,
      stop: false,
      canProceed: true,
      reason: `${operation}-reported`,
    });
  }

  if (operation === 'scoped-subtask' || operation === 'fix-verify-red') {
    return Object.freeze({
      canAdvanceEdge: false,
      stop: confidence !== 'verified',
      canProceed: confidence === 'verified',
      reason: confidence === 'verified'
        ? `${operation}-verified`
        : `${operation}-requires-verified-evidence`,
    });
  }

  return Object.freeze({
    canAdvanceEdge: false,
    stop: true,
    reason: `assignment-${operation}-unsupported-operation`,
  });
}

/**
 * Execute chosen stage operation by spawning Assignment runner or direct skill (Step 05 / Step 06).
 *
 * @param {object} work Work item object
 * @param {object} choice Choice object returned from chooseStageOperation
 * @param {object} [opts] Execution options (repoRoot, cwd, runnerConfig, etc.)
 * @returns {Promise<object>} Execution result object
 */
export async function executeDriverOperationChoice(work, choice, opts = {}) {
  if (!choice || !choice.operation) {
    return {
      executed: false,
      reason: 'no-operation-chosen',
      canAdvanceEdge: false,
      stop: true,
    };
  }

  if (choice.stop === true) {
    return {
      executed: false,
      dispatchType: choice.dispatch ?? null,
      operation: choice.operation,
      reason: choice.reason ?? 'choice-stopped',
      canAdvanceEdge: choice.canAdvanceEdge ?? false,
      stop: true,
    };
  }

  if (choice.dispatch === 'human-only') {
    return {
      executed: false,
      dispatchType: 'human-only',
      operation: choice.operation,
      reason: choice.reason ?? 'human-only-operation',
      canAdvanceEdge: choice.canAdvanceEdge ?? false,
      stop: choice.stop ?? true,
    };
  }

  if (choice.dispatch === 'direct-stage-skill') {
    return {
      executed: true,
      dispatchType: choice.dispatch,
      operation: choice.operation,
      reason: choice.reason,
      canAdvanceEdge: choice.canAdvanceEdge ?? false,
      stop: choice.stop ?? false,
    };
  }

  if (choice.dispatch === 'assignment') {
    const assignment = buildAssignment({
      work,
      stage: choice.stage ?? work.stage,
      operation: choice.operation,
      contextRefs: choice.contextRefs,
      options: opts,
    });

    const runResult = await executeAssignment(assignment, opts);
    const interpreted = interpretAssignmentRunResult({
      choice: { ...choice, assignment, work: choice?.work ?? work },
      runResult,
      contextSignals: opts.contextSignals ?? choice.contextSignals ?? {},
      work,
      repoRoot: opts.repoRoot ?? opts.cwd,
    });

    let verdictPayload;
    if (choice.operation === 'validate-plan') {
      verdictPayload = undefined;
    } else {
      verdictPayload = interpreted.verdictPayload ?? (
        runResult?.agentClaim?.verdictPayload ?? (
          Array.isArray(runResult?.agentClaim?.children) && runResult.agentClaim.children.length > 0
            ? { verdict: 'decompose', children: runResult.agentClaim.children, reason: runResult?.agentClaim?.summary }
            : runResult?.agentClaim?.verdict === 'need-human'
              ? { verdict: 'need-human', reason: runResult?.agentClaim?.summary }
              : { verdict: 'pass-through', reason: runResult?.agentClaim?.summary }
        )
      );
    }

    return {
      executed: true,
      dispatchType: 'assignment',
      assignment,
      runResult,
      verdictPayload,
      ...interpreted,
    };
  }

  return {
    executed: false,
    reason: 'unknown-dispatch-type',
    canAdvanceEdge: false,
    stop: true,
  };
}
