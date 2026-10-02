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
import { resolveWorkerArtifactPath } from './worker-artifacts.mjs';
import { normalizeRunResultV2, interpretRunResult, ASSESSMENT_VERDICTS, runOutcome } from './run-result.mjs';
import { attributeWorkspaceChanges } from './evidence-attribution.mjs';
import {
  commitRunSettlement,
  settleRunOutcome,
  settleFailedRunFromOutcome,
  settleReceiptRunFromOutcome,
  isSubstantiveReportText,
  safeGitHead,
  safeGitStatusFiles,
  safeGitCommittedDiffFiles,
  computeChangedFiles,
  resolveRunWorkerArtifactPath,
} from './settlement.mjs';
import { reconcileCliSpawnRun } from './reconcile-cli-spawn.mjs';

// Shared with reconciliation, which must never disagree with this collector
// about which file is the worker's claim. Re-exported because callers and
// tests have always taken it from here.
export {
  resolveWorkerArtifactPath,
  resolveRunWorkerArtifactPath,
  commitRunSettlement,
  settleRunOutcome,
  settleFailedRunFromOutcome,
  settleReceiptRunFromOutcome,
  isSubstantiveReportText,
  safeGitHead,
  safeGitStatusFiles,
  safeGitCommittedDiffFiles,
  computeChangedFiles,
  reconcileCliSpawnRun,
};
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { bind } from '../execution/bind.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir } from './config.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot, resolveContentRoot } from '../paths.mjs';
import { renderAssignmentPrompt, isReadOnlyAssignment, validateAgentResultClaim } from './assignment.mjs';
import { resolveAndRenderOperationPrompt, TemplateResolutionError } from './operation-prompt-templates.mjs';
import { executeExecutorCli } from './cli.mjs';
import { compileDispatchPlan } from './plan.mjs';
import { resolveFallback } from './recovery.mjs';
import { deriveProviderFamily, resolveTierModel, resolveExecutorConfig, selectConfinedInvocationId } from './resolve.mjs';
import { normalizeProviderFamily, checkProviderDisallowed } from './provider-adapter.mjs';
import { markRunSettled } from './visibility-session.mjs';
import { stampDeclaredAssignment } from './assignment-normalizer.mjs';
import { extractProtocolOperationStamp, normalizeSavedPolicyTier, resolveMutatingCwdPosture } from './execution-contract.mjs';
import {
  publishNextGeneration,
  currentGeneration,
  acquireRunControl,
  releaseRunControl,
  settleRunControl,
  isRunControlCurrent,
  isProcessAlive,
  readMarker,
  publishMarkerOnce,
  fsyncFileBestEffort,
  fsyncDirBestEffort,
  buildRunControlHolder,
  inspectRunControl,
  resolveHolderLiveness,
} from './run-lock.mjs';
import { resolveExecutorCommand, currentDispatchDepth, MAX_DISPATCH_DEPTH, DispatchError } from './transport.mjs';
import {
  acquireMainCheckoutLock,
  renewMainCheckoutLockIfOwn,
  dispatchLockFile,
  ACQUIRED,
  HELD,
  AMBIGUOUS,
  formatLockDurationMs,
} from '../main-checkout-lock.mjs';
import { reconcileHerdrSpawnRun, isHerdrSpawnRunStillWorking } from './herdr-reconcile.mjs';
import { prepareConfinementForLaunch, finalizeConfinementResources } from './confinement/authority.mjs';
import { buildConfinementRequest } from './confinement/request.mjs';
import { resolvePosture } from './confinement/policies.mjs';
import {
  startDetachedRunSupervisorProcess,
  readDetachedRunSupervisorBinding,
  readDetachedRunWorkerBinding,
  readDetachedRunAdapterReceipt,
  getBootId,
  getProcessStartTime,
  getProcessPgid,
  publishImmutableProof,
  publishMutableProjection,
  computeSha256Digest,
  canonicalJson,
  isDetachedRunProcessAlive,
} from './detached-run-supervisor.mjs';
import {
  buildEffectiveExecutionContract,
  EFFECTIVE_EXECUTION_CONTRACT_FILE,
  readEffectiveExecutionContract,
} from './effective-execution-contract.mjs';
import {
  acquireProviderAccountLease,
  classifyProviderCapacityFault,
  hasProviderAccounts,
  quarantineProviderAccount,
  redactProviderCapacitySelection,
  releaseProviderAccountLease,
} from './provider-capacity.mjs';

export {
  buildEffectiveExecutionContract,
  EFFECTIVE_EXECUTION_CONTRACT_FILE,
  readEffectiveExecutionContract,
};

function normalizeDigest(digest) {
  if (!digest || typeof digest !== 'string') return null;
  return digest.startsWith('sha256:') ? digest.slice(7) : digest;
}


// ADR-006 R7 (P02.4 Red-Team HIGH fix): executeAssignment's own
// `effectiveAssignment` derivation reads a stored assignment.json back from
// disk via raw JSON.parse (below), bypassing buildAssignment()/the
// normalizer entirely -- so `mutation` is `undefined` on any assignment.json
// written before that field existed (or otherwise missing it). This is the
// same read-back gap already fixed for `findLatestAssignmentRunResult`
// (operation-choice.mjs) and `runMissionAssignment`'s string-ID branch
// (mission-lite.mjs); mirrors that exact pattern here, at the one location
// that makes the fix caller-independent: derive the SAME value
// assignment-normalizer.mjs would stamp for this role/operation pair, from
// that module's own single source of truth -- never a second,
// independently hand-maintained table that could drift from it.
function fallbackMutationForAssignment(asgn) {
  const operation = asgn?.operation;
  if (typeof operation !== 'string' || !operation) return undefined;
  try {
    return stampDeclaredAssignment({ role: asgn?.role, operation }).mutation;
  } catch {
    return undefined;
  }
}

function resolveExecutorCommandFallback(entry, executorId) {
  if (entry?.command) return entry.command;
  if (Array.isArray(entry?.invocations)) {
    const cli = entry.invocations.find((inv) => inv?.via === 'cli');
    if (cli?.command) return cli.command;
  }
  return executorId;
}

function resolveProviderFamilyForExecutor(entry, executorId) {
  const declared = entry?.providerModel || entry?.provider;
  if (declared) return normalizeProviderFamily(declared);
  const cmd = resolveExecutorCommandFallback(entry, executorId);
  return normalizeProviderFamily(deriveProviderFamily(entry, cmd), cmd);
}


function policyForActualExecutor(cfg, policy, executorId, sourceExecutorId) {
  if (executorId === sourceExecutorId) return policy;
  const executorEntry = cfg?.executors?.[executorId];
  const providerModel = resolveProviderFamilyForExecutor(executorEntry, executorId);
  // dispatch-engine-liveness-hardening Phase 7: `resolveVerifiedAssignmentModel`
  // retired -- both sides call the identical `resolveTierModel(cfg, policy.tier, provider)` with
  // identical inputs, so divergence was never possible.
  // (a provenance/ownership label, not a second competing computation).
  const model = providerModel === policy.providerModel
    ? policy.model
    : resolveTierModel(cfg, policy.tier, providerModel);
  return {
    ...policy,
    executorId,
    providerModel,
    model,
    provenance: {
      ...policy.provenance,
      provider: providerModel === policy.providerModel ? policy.provenance?.provider : {
        value: providerModel,
        source: { scope: 'readOnlyExecutorRedirect', id: executorId },
      },
      model: model === policy.model ? policy.provenance?.model : {
        value: model,
        source: { scope: 'readOnlyExecutorRedirect', id: `${providerModel}.${policy.tier}` },
      },
    },
  };
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
/**
 * Fail-closed gate PLUS mistake-proofing for an inline mutating
 * Assignment, whichever caller reaches `executeAssignment`.
 *
 * Trust boundary, stated plainly so a future reader does not mistake this
 * for authentication against a hostile caller: a caller able to `import`
 * this codebase's own dispatch modules and write files under `.fgos/` is,
 * by this repo's own already-locked architecture, in the SAME trust class
 * as the user who invoked it -- not an external attacker class. See
 * `docs/routing-handoff-contract.md`'s three locked invariants
 * (containment is instructions plus a throwaway branch, never a sandbox;
 * work items must originate from the real user; `.fgos/config.json`'s
 * `runner` section is executable config, whoever can edit it decides what
 * the runner spawns) and `dispatch/config.mjs`'s own TRUSTED-CONFIG NOTE
 * and `runner/worktree.mjs`'s SAME-USER TRUST INVARIANT -- both already
 * state this codebase never treats "can run code in this process" as a
 * hostile boundary. Every worker this runner spawns, including read-only
 * ones, already runs with `--permission-mode acceptEdits`; "read-only" is
 * graded/rolled back after the fact, never OS-enforced. Chasing an
 * on-disk cross-check against that trust class is unwinnable: the
 * attacker already has the same read/write access as the check itself, so
 * any file the check trusts, the attacker can also just write.
 *
 * What this function actually protects against, in scope: an
 * ACCIDENTAL or well-behaved-but-unaware in-process caller -- code that
 * imports `buildAssignment`/`executeAssignment` (both pre-existing,
 * already-exported primitives) without going through
 * `session-engine.mjs`'s own mediated `dispatchDeclaredOperation` door,
 * and would otherwise silently mutate real files with no interlock at
 * all. Two independent conditions, both required:
 *
 * 1. The caller must explicitly assert `opts.isReadOnlyMode === false` --
 *    an omitted or truthy flag is refused, never treated as permission.
 *    `runExecutorAttempt` (session-engine.mjs) already computes and
 *    passes this from the Assignment's own stamped `mutation` field for
 *    every real dispatch, so this is a no-op for the legitimate path and
 *    a hard stop for any caller that forgot the flag entirely.
 * 2. The claimed `definitionId@version#operationId` stamp must resolve to
 *    a REAL, on-disk CoordinationProtocol operation declaring
 *    `result.kind: 'work-product'`, and `cwd` must resolve to a linked
 *    git worktree, never the main checkout -- catching the realistic
 *    accident of a well-behaved caller dispatching mutating work into the
 *    wrong place, not a hostile forgery (a caller in the trust class
 *    above can already write whatever `cwd`/stamp it wants; this is
 *    mistake-proofing, not a barrier to it).
 *
 * Scoped to `provenance.kind === 'inline'` only: before this cell, an
 * inline contract's `mutation: 'mutating'` was unconditionally refused
 * (ADR-006 §6) regardless of any stamp -- this cell is what first made an
 * inline mutating Assignment constructible at all. A declared-shape
 * Assignment's mutation posture is the pre-existing, unrelated
 * `classifyDeclaredMutation` mechanism (assignment-normalizer.mjs),
 * untouched and out of scope here.
 *
 * @param {object} asgn
 * @param {object} opts
 */
function assertInlineMutatingAssignmentAuthorized(asgn, opts) {
  if (asgn.mutation !== 'mutating') return;
  if (asgn.provenance?.kind !== 'inline' && asgn.provenance?.kind !== 'unit-run') return;

  if (opts.isReadOnlyMode !== false) {
    throw new RunnerConfigError(
      `executeAssignment: inline mutating assignment "${asgn.assignmentId}" refused -- mutation requires the caller to assert isReadOnlyMode: false explicitly (an omitted flag is read-only)`,
    );
  }

  const cwd = opts.cwd ?? process.cwd();

  // Check 1: Engine protocol-operation stamp exception (named legacy path until P4 phase 6)
  const stamp = extractProtocolOperationStamp(asgn.provenance?.inline?.contract?.constraints);
  if (stamp) {
    throw new RunnerConfigError(
      `executeAssignment: mutating inline assignment "${asgn.assignmentId}" claims protocol-operation stamp for definition "${stamp.definitionId}", but CoordinationProtocol engine has been retired`,
    );
  }

  // Check 2: Verifiable Unit run mutating gate (Q9, supersede ADR-006 §6)
  if (asgn.provenance?.kind === 'unit-run' || asgn.unitRunId) {
    const unitRunId = asgn.unitRunId || asgn.provenance?.unitRunId || asgn.assignmentId?.split('/')[0];
    if (!unitRunId) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" has unresolvable unitRunId -- refused`,
      );
    }
    const root = opts.repoRoot ?? resolveRepoRoot(cwd);
    const unitJsonPath = path.join(root, '.fgos', 'assignments', unitRunId, 'unit.json');
    if (!fs.existsSync(unitJsonPath)) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" refers to missing unit.json at "${unitJsonPath}" -- refused`,
      );
    }
    let unitRecord;
    try {
      unitRecord = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
    } catch (err) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" has corrupt unit.json at "${unitJsonPath}" -- refused (${err.message})`,
      );
    }

    const posture = resolveMutatingCwdPosture(cwd);
    if (!posture.ok) {
      const reason =
        posture.reason === 'main-checkout'
          ? `resolves to the main checkout ("${posture.repoRoot}"); a mutating dispatch must run in a linked git worktree, never the main checkout`
          : posture.reason === 'outside-git'
            ? 'does not resolve inside any git checkout (fail closed on an unresolvable root, never fail open)'
            : 'toplevel could not be resolved; fail closed, never fail open';
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" refused -- cwd "${cwd}" ${reason}`,
      );
    }

    let realCwd, realExpectedWorktree;
    try {
      realCwd = fs.realpathSync(cwd);
      realExpectedWorktree = fs.realpathSync(unitRecord.worktree);
    } catch (err) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" could not resolve realpath for worktree -- refused (${err.message})`,
      );
    }
    if (realCwd !== realExpectedWorktree) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" worktree mismatch: cwd "${realCwd}" does not match unit.json worktree "${realExpectedWorktree}" -- refused`,
      );
    }

    const recomputed = bind(
      {
        unit: unitRecord.unit,
        role: asgn.role,
        readOnly: false,
        overrides: unitRecord.overrides || [],
      },
      {
        runnerConfig: unitRecord.configSnapshot?.runner || opts.runnerConfig,
        session: opts.session || {},
      },
    );

    if (recomputed.refused) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" recomputed binding refused: ${recomputed.refused.reason} (${recomputed.refused.detail})`,
      );
    }

    // Fail closed: a mutating unit-run assignment must carry the binding that
    // bind() produced for it. Without one there is nothing to compare, and an
    // assignment could pin any executor through `policy.preferExecutor`.
    const asgnBinding = asgn.binding || asgn.provenance?.binding;
    if (!asgnBinding) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" carries no binding -- refused`,
      );
    }
    if (
      recomputed.executor !== asgnBinding.executor ||
      recomputed.tier !== asgnBinding.tier ||
      recomputed.posture !== asgnBinding.posture
    ) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" binding mismatch: recomputed { executor: "${recomputed.executor}", tier: "${recomputed.tier}", posture: "${recomputed.posture}" } does not match assignment { executor: "${asgnBinding.executor}", tier: "${asgnBinding.tier}", posture: "${asgnBinding.posture}" } -- refused`,
      );
    }
    const pinnedExecutor = asgn.policy?.preferExecutor ?? opts.cliOverride?.preferExecutor;
    if (pinnedExecutor !== undefined && pinnedExecutor !== recomputed.executor) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" pins executor "${pinnedExecutor}" but the verified binding is "${recomputed.executor}" -- refused`,
      );
    }

    return;
  }

  throw new RunnerConfigError(
    `executeAssignment: mutating inline assignment "${asgn.assignmentId}" carries no single, well-formed engine-reserved protocol-operation stamp and no verified unit-run gate -- refused`,
  );
}


function validateAssignmentLegality(asgn, opts = {}) {
  if (!asgn || typeof asgn !== 'object') {
    throw new RunnerConfigError('executeAssignment requires an assignment object');
  }

  // ADR-006 R8: an inline Assignment (provenance.kind === 'inline') never
  // carries domain/stage/operation -- buildInlineAssignment sets none of
  // these (ADR-006 R4), so the declared-operation legality check below
  // (matchedOp, and the matchedOp-driven human-only
  // dispatch check it feeds) is meaningless for it and is skipped
  // entirely; `matchedOp` stays `undefined` in that case, which is safe --
  // its return value is never consumed by either call site of this
  // function (both are bare statements). This is the ONLY change to this
  // function (and its caller, `executeAssignment`, is untouched beyond
  // this one branch) -- the existing hardening here (the mission-refusal
  // gate immediately below, and `executeAssignment`'s own
  // `effectiveAssignment` mutation backfill) stays exactly as-is and
  // still runs unconditionally for both shapes.
  let matchedOp = undefined;
  if (asgn.provenance?.kind !== 'inline' && asgn.stage && asgn.operation) {
    // The legal operations of the step come from the Workflow the Work layer built
    // this Assignment from: either handed in now (`opts.operations`, stricter) or
    // the list buildAssignment validated against and recorded on the Assignment.
    // Dispatch never resolves a step's operations itself, so an Assignment that
    // carries neither is refused rather than trusted.
    const legal = Array.isArray(opts.operations) ? opts.operations : asgn.provenance?.declared?.legalOperations;
    if (!Array.isArray(legal)) {
      throw new RunnerConfigError(
        `declared assignment "${asgn.assignmentId}" carries no legal-operation list for stage "${asgn.stage}" -- refused`,
      );
    }
    const legalIds = legal.map((o) => (typeof o === 'string' ? o : o?.id));
    if (!legalIds.includes(asgn.operation)) {
      throw new RunnerConfigError(
        `unknown operation "${asgn.operation}" for stage "${asgn.stage}" in domain "${asgn.domain}" (declared operations: [${legalIds.join(', ')}])`,
      );
    }
    matchedOp = Array.isArray(opts.operations) ? opts.operations.find((o) => o.id === asgn.operation) : undefined;
    if (matchedOp?.dispatch === 'human-only') {
      throw new RunnerConfigError(`cannot execute human-only operation "${asgn.operation}" via cli-spawn`);
    }
  }
  if (asgn.dispatch === 'human-only') {
    throw new RunnerConfigError(`cannot execute human-only operation "${asgn.operation}" via cli-spawn`);
  }
  // Step 07 §7 / Step 08 Phase 01 R4: some callers require strictly
  // read-only execution and reject a mutating Assignment outright.
  // `opts.isReadOnlyMode` is an explicit, caller-supplied flag (mission-lite's
  // `runMissionAssignment()` was the original caller of this gate under its
  // former name `isMissionLite`; a standalone CoordinationSession's
  // read-only proof, R6/R8, is the same mechanism under its new name) --
  // not re-derived from `missionId`/`workId` here (ADR-006 R7 retires that
  // heuristic; read-only status now comes solely from the stamped
  // `mutation` field below). Applies identically to declared and inline
  // Assignments (ADR-006 R8) -- this gate is unconditional and runs for
  // BOTH shapes, regardless of the inline-only skip above.
  const requireReadOnly = Boolean(opts.isReadOnlyMode);
  if (requireReadOnly && !isReadOnlyAssignment(asgn)) {
    throw new RunnerConfigError(
      `cannot execute mutating operation "${asgn.operation}" (role: "${asgn.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
  }

  // Phase 01 mutation-unlock HIGH-finding fix: re-verify R2/R3 at the actual
  // point mutation is honored, independent of `opts.isReadOnlyMode` (a
  // direct `buildAssignment` + `executeAssignment` caller controls `opts`
  // itself and can simply omit this flag) -- see
  // `assertInlineMutatingAssignmentAuthorized`'s own doc comment.
  assertInlineMutatingAssignmentAuthorized(asgn, opts);

  return matchedOp;
}

/**
 * Whether a cli-spawn Run's DETACHED supervisor or worker -- published
 * under `runDir/protected/(supervisor-binding|bindings)/*` by
 * detached-run-supervisor.mjs -- is still doing real work, independent of
 * whether the RUNNER process that spawned it (the control holder
 * `inspectRunControl` tracks) is alive. The supervisor is spawned
 * `detached: true` and deliberately outlives its parent; a runner-only
 * liveness check (`inspectRunControl`) reads `held: false` the instant the
 * runner dies even while its supervisor/worker keeps mutating the cwd (S1).
 * Both `admitRunAttempt`'s in-flight check and provider-capacity's lease
 * reclaim need this SAME real-worker signal, not just the runner's.
 *
 * Mirrors reconcile-cli-spawn.mjs's own "latest command file" discovery
 * (sorted `controller/commands/*.json`, last wins) so this reads the same
 * launchCommandId that reconciliation would use. A herdr-spawn Run (no
 * supervisor/worker bindings ever published for it) or a Run with no
 * commands at all correctly reads back `false` here -- falls through to
 * the existing holder-only check, unchanged from before this fix.
 */
function isCliSpawnRunStillWorking(runDir) {
  const commandsDir = path.join(runDir, 'controller', 'commands');
  if (!fs.existsSync(commandsDir)) return false;
  let commandFiles;
  try {
    commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return false;
  }
  const latestCommandFile = commandFiles[commandFiles.length - 1];
  if (!latestCommandFile) return false;
  const launchCommandId = path.basename(latestCommandFile, '.json');
  const supervisorBinding = readDetachedRunSupervisorBinding(runDir, launchCommandId);
  if (supervisorBinding?.supervisor && isDetachedRunProcessAlive(supervisorBinding.supervisor)) return true;
  const workerBinding = readDetachedRunWorkerBinding(runDir, launchCommandId);
  if (workerBinding?.worker && isDetachedRunProcessAlive(workerBinding.worker)) return true;
  return false;
}

/**
 * Atomically admit one Run attempt for `assignmentId` under `runsDir`,
 * replacing the prior readdirSync + max-attempt scan. Fences three
 * outcomes, per the admission door's own commit algorithm:
 *
 * - The SAME `(retryId, destination, payloadDigest)` tuple as an
 *   already-committed generation returns that SAME attempt/runId, never a
 *   new one (idempotent retry).
 * - A DIFFERENT tuple reusing an already-used `retryId` is refused
 *   (`duplicate-retry`) -- a caller's retry identity may not silently
 *   change what it means partway through.
 * - A caller naming `predecessorRunId` (or contending while a Run is
 *   already admitted at all) must supersede the EXACT current committed
 *   Run; any other value is refused (`invalid-predecessor`).
 *
 * The admission-generation ledger (`assignmentDir/admission/generations/`,
 * run-lock.mjs's shared append-only primitive) is the sole source of truth
 * for attempt numbers: concurrent callers race on one hard-linked path,
 * exactly one wins, every loser rereads and re-evaluates against the new
 * current generation. Once an attempt/runId is committed there, it is
 * never reused or leapfrogged, independent of whether the run directory
 * materialization below has completed.
 *
 * The run directory itself (`runs/<NN>/run.json` + `dispatch-plan.json`)
 * is built in a same-filesystem staging directory, fsynced, then published
 * with one atomic rename -- a reader never observes a partially-written
 * attempt directory, and a crash between generation commit and rename
 * leaves the generation record as the sole durable fact (no `runs/<NN>/`
 * at all) until a later call for the same tuple resumes and completes it.
 * Final attempt directories are never created empty.
 */
function admitRunAttempt(
  assignmentDir,
  runsDir,
  assignmentId,
  { retryId, predecessorRunId = null, destination, payloadDigest, expectedRunId, buildRunMeta, buildDispatchPlan, buildEffectiveExecutionContract: buildEffectiveContractOpt, forceNewAttempt = false, refuseIfSettled = false, herdrLivenessPreCheck = null },
) {
  const admissionGenerationsDir = path.join(assignmentDir, 'admission', 'generations');
  const admissionMarkersDir = path.join(assignmentDir, 'admission', 'markers');

  if (retryId !== undefined) {
    if (readMarker(path.join(admissionMarkersDir, `${retryId}.aborted.json`)) !== null) {
      throw new RunnerConfigError(
        `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was aborted -- refuse identity reuse`,
      );
    }
  }

  const admission = publishNextGeneration(admissionGenerationsDir, ({ current, nextEpoch, generations }) => {
    // Strict tuple/predecessor fencing is opt-in, gated on the caller
    // supplying a `retryId` at all -- every pre-existing caller of
    // `executeAssignment` (and every legacy retry path that just calls it
    // again with no new admission opts) never passes one, and must keep
    // getting "next available attempt" exactly as the replaced
    // readdirSync scan did. A caller that DOES pass `retryId` opts into
    // the full admission contract: same tuple resumes idempotently, a
    // changed tuple under the same retryId is refused, and the caller must
    // name the exact current Run it supersedes.
    if (retryId !== undefined) {
      const priorForRetryId = generations.find((g) => g.record.retryId === retryId);
      if (priorForRetryId) {
        if (priorForRetryId.record.destination === destination && priorForRetryId.record.admissionPayloadDigest === payloadDigest) {
          return { stop: true, status: 'duplicate', epoch: priorForRetryId.epoch, record: priorForRetryId.record };
        }
        return { stop: true, status: 'duplicate-retry', epoch: priorForRetryId.epoch, record: priorForRetryId.record };
      }

      const isGenerationValid = (g) => {
        if (!g.record?.retryId) return true;
        const isAborted = readMarker(path.join(admissionMarkersDir, `${g.record.retryId}.aborted.json`)) !== null;
        if (!isAborted) return true;
        const attemptStr = g.record.attemptStr || String(g.record.attempt).padStart(2, '0');
        const runJsonPath = path.join(runsDir, attemptStr, 'run.json');
        if (!fs.existsSync(runJsonPath)) return false;
        try {
          const runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
          return runMeta?.retryId === g.record.retryId;
        } catch {
          return false;
        }
      };

      const validGenerations = generations.filter(isGenerationValid);
      const currentValid = validGenerations.length > 0 ? validGenerations[validGenerations.length - 1] : null;
      const currentRunId = currentValid?.record?.runId ?? null;
      if (predecessorRunId !== currentRunId) {
        return { stop: true, status: 'invalid-predecessor', currentRunId };
      }
    }

    let maxDir = 0;
    if (fs.existsSync(runsDir)) {
      try {
        const entries = fs.readdirSync(runsDir);
        for (const name of entries) {
          if (/^\d+$/.test(name)) {
            const n = parseInt(name, 10);
            if (!Number.isNaN(n) && n > maxDir) maxDir = n;
          }
        }
      } catch {}
    }
    for (const g of generations) {
      if (g.record?.attempt && g.record.attempt > maxDir) {
        maxDir = g.record.attempt;
      }
    }
    let attempt = Math.max(nextEpoch, maxDir + 1);
    while (fs.existsSync(path.join(runsDir, String(attempt).padStart(2, '0')))) {
      attempt += 1;
    }

    // L1: expectedRunId is checked below against the naturally-computed
    // attempt, never used to bump it -- a caller declaring an attempt ahead
    // of what this ledger would assign gets refused (invalid-predecessor),
    // never silently adopted as the new attempt number.
    const attemptStr = String(attempt).padStart(2, '0');
    const runId = `run_${assignmentId}_${attemptStr}`;
    if (expectedRunId !== undefined && runId !== expectedRunId) {
      // A caller (e.g. a schema-2 session retry declaration) that named an
      // exact expected identity gets exactly that identity or a refusal --
      // never a silently different runId drifting out of two independent
      // ledgers (the session's own retry-declaration generations and this
      // Assignment's admission generations) that were supposed to stay in
      // lockstep.
      const isGenerationValid = (g) => {
        if (!g.record?.retryId) return true;
        const isAborted = readMarker(path.join(admissionMarkersDir, `${g.record.retryId}.aborted.json`)) !== null;
        if (!isAborted) return true;
        const attemptStr = g.record.attemptStr || String(g.record.attempt).padStart(2, '0');
        const runJsonPath = path.join(runsDir, attemptStr, 'run.json');
        if (!fs.existsSync(runJsonPath)) return false;
        try {
          const runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
          return runMeta?.retryId === g.record.retryId;
        } catch {
          return false;
        }
      };
      const validGenerations = generations.filter(isGenerationValid);
      const currentValid = validGenerations.length > 0 ? validGenerations[validGenerations.length - 1] : null;
      return { stop: true, status: 'invalid-predecessor', currentRunId: currentValid?.record?.runId ?? null, expectedRunId, computedRunId: runId };
    }
    // M1: refuse an unfenced new admission when the CURRENT (most recent)
    // attempt has neither settled (result.json) nor a provably-dead
    // control holder -- admitting anyway spawns a second worker racing an
    // unsettled first one, the exact double-materialization this phase
    // exists to close, one level up from R1's own resume-time check (this
    // fires on a FRESH dispatch that never resumes anything, so R1's guard
    // never runs). Only a dead holder (inspectRunControl, Phase 02
    // identity) AND no live detached supervisor/worker (S1, Phase 2 --
    // `inspectRunControl` alone only proves the RUNNER is dead; its
    // detached supervisor/worker is spawned to deliberately outlive it and
    // keeps mutating the cwd, so a runner-only check would admit a second,
    // racing worker onto the same Run) authorizes silently proceeding;
    // alive or undisprovable liveness on either signal refuses unless the
    // operator explicitly overrides via `forceNewAttempt`
    // (--force-new-attempt).
    if (current && !forceNewAttempt) {
      const priorAttemptStr = current.record.attemptStr || String(current.record.attempt).padStart(2, '0');
      const priorRunDir = path.join(runsDir, priorAttemptStr);
      if (!fs.existsSync(path.join(priorRunDir, 'result.json'))) {
        const priorControl = inspectRunControl(priorRunDir);
        // S5: a genuinely concurrent sibling caller can reach ITS OWN
        // admission check for this exact Assignment before it (or a racing
        // twin) has ever acquired real run control (`acquireRunControl`,
        // `purpose: 'worker-spawn'`) -- a separate, later step inside
        // `executeAssignment`, not part of this same CAS commit. In that
        // narrow window `priorControl.held` is false (no control record
        // exists at all, `priorControl.controlEpoch` is undefined) and
        // `isCliSpawnRunStillWorking` is also false (no supervisor/worker
        // spawned yet either), so neither signal below would ever catch a
        // second admission racing INSIDE that window -- confirmed via a
        // real two-process race (test/runner/coordination-dag-concurrency
        // .test.mjs's cross-process "identical concurrent writers" case).
        // The one signal that DOES exist for the whole window, with zero
        // extra writes: the admitting process's own pid, stamped into this
        // SAME atomic CAS record as `admittedBy` below. Consulted ONLY when
        // no real control record exists yet (`!priorControl.controlEpoch`)
        // -- once one does, `priorControl.held` alone is authoritative and
        // this fallback is never consulted, so it can never override or go
        // stale against the real control ledger.
        const admitterAlive =
          !priorControl.controlEpoch && current.record.admittedBy && resolveHolderLiveness(current.record.admittedBy) === 'held';
        // Part 2 (herdr-spawn liveness): the prior attempt's own adapter
        // (buildRunMeta's `adapter` field, run.json) decides which
        // detached-run-supervisor implementation to consult.
        // isCliSpawnRunStillWorking is local/instant, so it stays exactly as
        // before, called inline here. herdr-spawn's own signal was already
        // computed OUTSIDE this synchronous CAS section (see the caller's
        // own herdrLivenessPreCheck comment) -- consult it ONLY when it was
        // computed for this EXACT current generation (`runId` match); a
        // mismatch means a concurrent commit changed `current` between that
        // pre-check and this CAS running (a real but narrow race), and per
        // this track's own repeated "fail closed on undecidable liveness"
        // rule, an unmatched/never-computed pre-check is treated the SAME as
        // "still working", never silently ignored.
        let priorRunAdapter = null;
        try {
          priorRunAdapter = JSON.parse(fs.readFileSync(path.join(priorRunDir, 'run.json'), 'utf8'))?.adapter;
        } catch {}
        const priorDetachedRunStillWorking = priorRunAdapter === 'herdr-spawn'
          ? (herdrLivenessPreCheck?.runId === current.record.runId ? herdrLivenessPreCheck.result !== false : true)
          : isCliSpawnRunStillWorking(priorRunDir);
        if (priorControl.held || priorDetachedRunStillWorking || admitterAlive) {
          return {
            stop: true,
            status: 'run-in-flight',
            priorRunId: current.record.runId,
            priorAttempt: current.record.attempt,
            holder: priorControl.holder ?? current.record.admittedBy ?? null,
          };
        }
      } else if (refuseIfSettled) {
        // S5 (dispatch-engine-liveness-hardening Phase 5): opt-in only, never
        // the default -- a settled current attempt is exactly what a
        // legitimate retry (schema-1 or schema-2, `retrySessionTask`) is
        // SUPPOSED to admit a fresh attempt over, so M1 above never refuses
        // on settlement alone. But a caller that never intends a retry (a
        // FIRST, non-retry dispatch of an Assignment/taskKey) has no other
        // atomic way to tell "a concurrent sibling already finished this
        // exact dispatch" apart from "nothing has happened yet" -- a plain
        // re-read from that caller's own process can always be outrun by a
        // genuinely concurrent cross-process sibling (real wall-clock I/O,
        // not a same-process race admitRunAttempt's own atomicity already
        // closes). Refusing here, INSIDE the same CAS critical section that
        // decides admission, is the only place this can be closed for real.
        return { stop: true, status: 'run-already-settled', priorRunId: current.record.runId, priorAttempt: current.record.attempt };
      }
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);

  if (fs.existsSync(runDir)) {
    if (retryId !== undefined && admission.status === 'duplicate') {
      return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: true };
    }
  }

  // Remove matching abandoned staging directory only after validating its identity:
  // "abandoned staging is not admission and is removed only after matching its retry id and digest"
  try {
    if (fs.existsSync(runsDir)) {
      const entries = fs.readdirSync(runsDir);
      for (const name of entries) {
        if (name.startsWith(`.staging-${record.attemptStr}`)) {
          const abandonedPath = path.join(runsDir, name);
          try {
            // Live sibling protection: never delete a staging directory belonging to a live process
            const pidMatch = /^\.staging-[^-]+-(\d+)-/.exec(name);
            if (pidMatch) {
              const stagedPid = parseInt(pidMatch[1], 10);
              if (isProcessAlive(stagedPid)) {
                continue;
              }
            }

            // Legacy staging without PID/UUID (.staging-NN)
            if (name === `.staging-${record.attemptStr}`) {
              fs.rmSync(abandonedPath, { recursive: true, force: true });
              continue;
            }

            const stagedMetaPath = path.join(abandonedPath, 'run.json');
            if (fs.existsSync(stagedMetaPath)) {
              const stagedMeta = JSON.parse(fs.readFileSync(stagedMetaPath, 'utf8'));
              const normStaged = normalizeDigest(stagedMeta.payloadDigest);
              const normAdmission = normalizeDigest(record.admissionPayloadDigest);
              if (
                stagedMeta.retryId === (record.retryId ?? null) &&
                normStaged === normAdmission
              ) {
                fs.rmSync(abandonedPath, { recursive: true, force: true });
              }
            }
          } catch {}
        }
      }
    }
  } catch {}

  const stagingDir = path.join(runsDir, `.staging-${record.attemptStr}-${process.pid}-${crypto.randomUUID()}`);
  fs.mkdirSync(stagingDir, { recursive: true });

  const runMeta = buildRunMeta(record);
  const runMetaPath = path.join(stagingDir, 'run.json');
  fs.writeFileSync(runMetaPath, `${JSON.stringify(runMeta, null, 2)}\n`);
  fsyncFileBestEffort(runMetaPath);

  if (buildDispatchPlan) {
    const dispatchPlan = buildDispatchPlan(record);
    if (dispatchPlan) {
      const dispatchPlanPath = path.join(stagingDir, 'dispatch-plan.json');
      fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(dispatchPlan, null, 2)}\n`);
      fsyncFileBestEffort(dispatchPlanPath);
    }
  }

  if (buildEffectiveContractOpt) {
    const effectiveContract = buildEffectiveContractOpt(record);
    if (effectiveContract) {
      const contractPath = path.join(stagingDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
      publishMutableProjection(contractPath, effectiveContract);
    }
  }
  fsyncDirBestEffort(stagingDir);

  try {
    fs.renameSync(stagingDir, runDir);
  } catch (err) {
    if (
      err.code === 'ENOTEMPTY' ||
      err.code === 'EEXIST' ||
      (process.platform === 'win32' && (err.code === 'EPERM' || err.code === 'EACCES') && fs.existsSync(runDir))
    ) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: true };
    } else {
      throw err;
    }
  }
  fsyncDirBestEffort(runsDir);

  return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: false };
}

/**
 * Phase B (plans/260917-executor-profile-schema-migration/plan.md): when
 * the primary executor's provider-capacity lease is refused, attempt ONE
 * real dispatch against a declared fallback executor instead of settling
 * the Run as failed immediately. assignment-policy.mjs's own
 * `fallbackExecutors`/`executorPreference` field has been
 * "reserved-not-executed" (Phase 00 R10) until now; this closes that gap.
 *
 * Reuses dispatch/recovery.mjs's `resolveFallback` (built by an earlier,
 * unrelated track, never wired to a real caller) for the governance/
 * compile check: it re-runs the exact same `compileDispatchPlan()`
 * resolution with `cliOverride.preferExecutor` forced to the candidate,
 * verifies the scoped plan's governance verdict reads "allowed" and its
 * tier/visibility provenance agrees with the original plan, and never
 * silently downgrades a governance floor.
 * inside `resolveAssignmentDispatchPolicy`), plus a full, correctly
 * recompiled invocation/confinement-policy for the candidate, "for free".
 *
 * This function only picks a candidate and (at most once) attempts its
 * provider-capacity lease -- design.md's own "no retry loop owned by the
 * rotator": the FIRST scoped, out-of-process, non-tool candidate is the
 * only one whose capacity is ever checked; every candidate before it that
 * fails governance/compile/mechanism is recorded in `skippedCandidates`
 * and passed over, never retried. It never writes to disk or mutates the
 * caller's in-scope variables -- the caller commits (or discards) the
 * result.
 *
 * @returns {{adopted: false, evidence: object|null} | {adopted: true, plan: object, executorId: string, lease: object|null, evidence: object}}
 */
function attemptProviderCapacityFallback({
  cfg,
  compiledPlan,
  resolvedExecutorId,
  primaryRefusalReason,
  effectiveAssignment,
  runId,
  cliOverride,
  options,
  work,
  hasLiveTaskAccess,
  providerCapacityRuntimeDir,
  providerCapacityRunIsDead,
  providerCapacityIsRunWorkerAlive,
}) {
  const declaredCandidates = Array.isArray(compiledPlan.policy?.executorPreference)
    ? compiledPlan.policy.executorPreference.slice(1)
    : [];
  const skippedCandidates = [];
  // M6: same normalized derivation as the primary's own providerCapacityProvider,
  // recorded once here so every candidate's evidence below can name the
  // provider family this fallback is actually switching FROM.
  const fromProvider = normalizeProviderFamily(compiledPlan.policy?.providerModel || deriveProviderFamily(cfg.executors?.[resolvedExecutorId] ?? cfg.executor));

  for (const candidateId of declaredCandidates) {
    if (candidateId === resolvedExecutorId) continue; // not a fallback from itself

    let fallbackResolution;
    try {
      fallbackResolution = resolveFallback(compiledPlan, candidateId, {
        compilePlan: (id) => compileDispatchPlan(cfg, {
          assignment: effectiveAssignment.assignmentId,
          assignmentItem: effectiveAssignment,
          workItem: work,
          hasLiveTaskAccess: hasLiveTaskAccess ?? false,
          cliOverride: {
            ...(cliOverride || {}),
            preferExecutor: id,
            policyProvenance: {
              ...(cliOverride?.policyProvenance || {}),
              executor: { scope: 'fallback', from: resolvedExecutorId, reasonCode: 'provider-capacity-refused' },
            },
          },
          options,
        }),
      });
    } catch (err) {
      skippedCandidates.push({ executorId: candidateId, reasonCode: 'compiler-error', reason: err.message });
      continue;
    }

    if (fallbackResolution.status !== 'scoped') {
      skippedCandidates.push({ executorId: candidateId, reasonCode: fallbackResolution.status, reason: fallbackResolution.reason ?? null });
      continue;
    }

    const plan = fallbackResolution.plan;
    // Same three guards the primary's own `shouldSelectProviderAccount`
    // applies (executeAssignment, above) -- resolveFallback proves
    // governance/tier/visibility, never mechanism.
    if (plan.mechanism !== 'out-of-process' || cfg.executors?.[candidateId]?.kind === 'tool') {
      skippedCandidates.push({ executorId: candidateId, reasonCode: 'unsupported-mechanism' });
      continue;
    }

    // Found the one candidate to attempt -- bounded to exactly this one,
    // regardless of how many more are declared after it.
    // M6: normalized so a fallback candidate's provider-capacity lookup
    // uses the same canonical key ('openai' ≡ 'openai-codex') as inventory
    // validation and the fault classifier, never a raw config-declared spelling.
    const provider = normalizeProviderFamily(plan.policy?.providerModel || deriveProviderFamily(cfg.executors?.[candidateId] ?? cfg.executor));
    const switchedAt = new Date().toISOString();
    // M6: fromProvider/toProvider make a cross-provider-family fallback
    // switch explicit in the persisted evidence (e.g. an openai-codex
    // primary exhausted, falling back to a claude candidate), instead of
    // an auditor having to re-derive both providers from the executor
    // config themselves to notice the switch happened at all.
    const baseEvidence = {
      declaredPrimary: resolvedExecutorId,
      reasonCode: 'provider-capacity-refused',
      primaryRefusalReason,
      skippedCandidates,
      fromProvider,
      toProvider: provider,
    };

    if (!hasProviderAccounts(cfg, provider)) {
      // Not managed by the rotator at all -- the same rule the primary
      // already follows (`shouldSelectProviderAccount`): nothing to lease,
      // proceed unconditionally.
      return {
        adopted: true,
        plan,
        executorId: candidateId,
        lease: null,
        evidence: { ...baseEvidence, resolved: candidateId, resolvedCapacity: 'not-managed', switchedAt },
      };
    }

    // C2c: same reasoning as the primary lease acquisition above -- a
    // throw (lock-stale timeout, corrupt state) must never escape this
    // candidate loop uncaught; it is exactly as valid a "this candidate
    // isn't usable" outcome as a normal `status: 'refused'` return, so the
    // loop can try the next declared candidate instead of the whole
    // fallback attempt aborting unclassified.
    let lease;
    try {
      lease = acquireProviderAccountLease({
        runnerConfig: cfg,
        provider,
        assignmentId: effectiveAssignment.assignmentId,
        runId,
        seed: `${effectiveAssignment.assignmentId}:${runId}:fallback:${candidateId}`,
        runtimeDir: providerCapacityRuntimeDir,
        runIsDead: providerCapacityRunIsDead,
        isRunWorkerAlive: providerCapacityIsRunWorkerAlive,
      });
    } catch (err) {
      lease = { status: 'refused', reason: err.code === 'provider-capacity-lock-stale' ? 'provider-capacity.lock-stale' : 'provider-capacity.acquire-failed' };
    }
    if (lease?.status === 'selected') {
      return {
        adopted: true,
        plan,
        executorId: candidateId,
        lease,
        evidence: { ...baseEvidence, resolved: candidateId, resolvedCapacity: 'selected', switchedAt },
      };
    }
    return {
      adopted: false,
      evidence: { ...baseEvidence, attempted: candidateId, attemptedRefusalReason: lease?.reason ?? 'provider-capacity.exhausted-or-quarantined' },
    };
  }

  return {
    adopted: false,
    // No fallback declared at all (declaredCandidates.length === 0) must
    // stay `null` -- the caller's terminal settlement only adds an
    // `evidence.json`/`stderr.log` fallback trace when non-null, so an
    // assignment with no fallbackExecutors dispatches byte-identically to
    // before this phase.
    evidence: declaredCandidates.length ? { declaredPrimary: resolvedExecutorId, reasonCode: 'provider-capacity-refused', primaryRefusalReason, skippedCandidates } : null,
  };
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
 * @param {boolean} [opts.isReadOnlyMode]
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

  // S1 (Phase 2): reclaimDeadLeases (provider-capacity.mjs) only ever saw
  // the lease-acquiring RUNNER pid go dead, never whether the Run's
  // detached supervisor/worker is still using the credential -- the exact
  // same runner-vs-detached-child gap admitRunAttempt's in-flight check
  // closes above. `lease.assignmentId` + the `run_<assignmentId>_<NN>`
  // runId shape (this function's own admission naming, above) are enough
  // to rebuild that Run's directory without provider-capacity.mjs itself
  // needing to know this layout -- it stays a generic module, this closure
  // is the only place that maps a lease back to a real runDir.
  const providerCapacityIsRunWorkerAlive = opts.providerCapacityIsRunWorkerAlive ?? ((runId, lease) => {
    if (!lease?.assignmentId || typeof runId !== 'string') return false;
    const prefix = `run_${lease.assignmentId}_`;
    if (!runId.startsWith(prefix)) return false;
    const attemptStr = runId.slice(prefix.length);
    return isCliSpawnRunStillWorking(path.join(assignmentsDir, lease.assignmentId, 'runs', attemptStr));
  });

  fs.mkdirSync(runsDir, { recursive: true });

  // Ensure persisted assignment.json is the immutable input for this Run (Step 03 §2).
  // Contract: if assignment.json already exists on disk it is THE immutable input — read it.
  // If it exists but is unreadable or corrupt, FAIL HARD rather than silently executing
  // a different assignment from memory (which would violate the immutability guarantee).
  const assignmentJsonPath = path.join(assignmentDir, 'assignment.json');
  let effectiveAssignment = assignment;
  let assignmentJsonPublished = false;
  if (!fs.existsSync(assignmentJsonPath)) {
    // I04-REV-01: Ensure template resolution happens before assignment.json is persisted,
    // so the immutable assignment.json on disk carries complete template provenance (including templateSnapshot).
    if (assignment.contractTemplate && !assignment.provenance?.template?.templateSnapshot) {
      const initialResolution = resolveAndRenderOperationPrompt(assignment, {
        cwd,
        domain: assignment.domain,
      });
      assignment = Object.freeze({
        ...assignment,
        provenance: Object.freeze({
          ...(assignment.provenance || {}),
          template: initialResolution.templateProvenance,
        }),
      });
    }
    effectiveAssignment = assignment;
    // Atomic publish (fsynced temp + exclusive hard link, same primitive as
    // result.json/run.json): a crash mid-write must never leave a partial
    // assignment.json on disk -- that used to make the read-back branch
    // below throw "corrupt (invalid JSON)" forever, permanently bricking
    // this Assignment id (S6). `publishImmutableProof` either lands the
    // complete file or leaves it cleanly absent; `false` here means a
    // concurrent writer won the race in the TOCTOU window above, so fall
    // through to the read-back branch exactly as if it had existed from
    // the start.
    assignmentJsonPublished = publishImmutableProof(assignmentJsonPath, assignment);
  }
  if (!assignmentJsonPublished) {
    let raw;
    try {
      raw = fs.readFileSync(assignmentJsonPath, 'utf8');
    } catch (err) {
      throw new RunnerConfigError(
        `assignment.json for "${assignment.assignmentId}" exists but could not be read: ${err.message}`,
      );
    }
    let parsedAssignment;
    try {
      parsedAssignment = JSON.parse(raw);
    } catch (err) {
      throw new RunnerConfigError(
        `assignment.json for "${assignment.assignmentId}" is corrupt (invalid JSON): ${err.message}`,
      );
    }
    try {
      const normalizedPolicy = normalizeSavedPolicyTier(parsedAssignment.policy, { allowAdditionalFields: true });
      effectiveAssignment = Object.freeze(
        normalizedPolicy === parsedAssignment.policy
          ? parsedAssignment
          : { ...parsedAssignment, policy: normalizedPolicy },
      );
    } catch (err) {
      throw new RunnerConfigError(
        `assignment.json for "${assignment.assignmentId}" is corrupt or invalid: ${err.message}`,
      );
    }
  }

  // ADR-006 R7 (P02.4 Red-Team HIGH fix): backfill `mutation` on
  // `effectiveAssignment` before it is used anywhere below -- covers BOTH
  // branches above (the fresh-write branch already carries a valid
  // `mutation` from buildAssignment()/the normalizer, so this is a
  // value-preserving no-op there; the raw disk read-back branch is the one
  // that actually needs it). `effectiveAssignment` is reassigned to a new
  // frozen object here (never mutated in place -- it may already be
  // frozen per the read-back branch above), mirroring the exact
  // `Object.freeze({ ...x, mutation: effective })` pattern already applied
  // in `operation-choice.mjs` and `mission-lite.mjs`.
  const effectiveMutation =
    effectiveAssignment.mutation === 'read-only' || effectiveAssignment.mutation === 'mutating'
      ? effectiveAssignment.mutation
      : fallbackMutationForAssignment(effectiveAssignment);
  effectiveAssignment = Object.freeze({ ...effectiveAssignment, mutation: effectiveMutation });

  validateAssignmentLegality(effectiveAssignment, opts);

  let templateResolution = null;
  if (effectiveAssignment.contractTemplate) {
    templateResolution = resolveAndRenderOperationPrompt(effectiveAssignment, {
      cwd,
      domain: effectiveAssignment.domain,
    });
    effectiveAssignment = Object.freeze({
      ...effectiveAssignment,
      provenance: Object.freeze({
        ...(effectiveAssignment.provenance || {}),
        template: templateResolution.templateProvenance,
      }),
    });
  }

  // Enforce decide-first governance gate (Step 06). Dispatch Core Contract
  // Normalization Slice D: compileDispatchPlan() now merges
  // resolveAssignmentDispatchPolicy()'s tier/model/providerModel/provenance
  // into the plan itself (compiledPlan.policy) and enforces the
  // decided-executor-vs-policy-executor agreement internally -- this call
  // site no longer resolves policy a second time or re-checks that
  // agreement; both used to happen here, separately, and could only ever
  // agree or throw, never usefully disagree. `workItem: opts.work` is
  // threaded through so the merged policy resolution sees the real Work
  // object for rigor monotonicity (work.rigor/work.risk), the same object
  // the removed direct call used to pass as `work`.
  // `let`, not `const`: a provider-capacity refusal below (Phase B,
  // plans/260917-executor-profile-schema-migration/plan.md) may replace
  // this with a governance-scoped fallback candidate's own compiled plan,
  // via `attemptProviderCapacityFallback`. Every reassignment site is
  // marked with that same phase reference.
  let compiledPlan = compileDispatchPlan(cfg, {
    assignment: effectiveAssignment.assignmentId,
    assignmentItem: effectiveAssignment,
    workItem: opts.work,
    hasLiveTaskAccess: opts.hasLiveTaskAccess ?? false,
    cliOverride: opts.cliOverride,
    options: opts.options,
  });

  if (compiledPlan.mechanism === 'unavailable' || compiledPlan.mechanism === null) {
    const reason = compiledPlan.blockedReason ?? compiledPlan.reasonCodes?.join(', ') ?? 'governance-blocked or unavailable mechanism';
    throw new RunnerConfigError(`dispatch decide blocked operation "${effectiveAssignment.operation}": ${reason}`);
  }

  let effectivePolicy = compiledPlan.policy;

  // One confinement path: an Assignment bound by bind() carries its posture, and
  // that posture alone picks the requirement handed to the Confinement Authority.
  // Without a binding (direct callers) the plan's own confinement applies as before.
  const postureBinding = effectiveAssignment.binding || effectiveAssignment.provenance?.binding;
  const confinementRequirement = postureBinding?.posture
    ? resolvePosture(postureBinding, { runnerConfig: cfg }).requirement
    : compiledPlan.policy?.confinement
      ? (compiledPlan.policy.confinement.mode === 'unconfined'
          ? { mode: 'unconfined', policyId: null, policy: null }
          : compiledPlan.policy.confinement)
      : { mode: 'unconfined', policyId: null, policy: null };

  // executor-id-consolidation Step 2 (fallback confinement preservation):
  // captured HERE, before any read-only-redirect or provider-capacity
  // fallback substitution below can reassign `effectivePolicy`/
  // `resolvedExecutorId` -- this is "the declared primary candidate" every
  // later substitution gets compared against, never recomputed from an
  // already-substituted policy (resume rehydration, below, overwrites
  // `effectivePolicy` with a fallback-scoped recompilation whose own
  // `executorPreference[0]` is the FALLBACK id, not the true original
  // primary).
  const declaredPrimaryExecutorId = effectivePolicy.executorPreference?.[0] ?? 'claude';

  const defaultExecutorId = effectivePolicy.executorPreference?.[0] ?? 'claude';
  const hasExplicitInvocationPin = typeof opts.cliOverride?.preferInvocation === 'string' && opts.cliOverride.preferInvocation.trim();
  let resolvedExecutorId = defaultExecutorId;
  effectivePolicy = policyForActualExecutor(cfg, effectivePolicy, resolvedExecutorId, defaultExecutorId);
  // Cell 6.7 Bug B: `resolvedExecutorId` can diverge from `defaultExecutorId`
  // for a redirected read-only op (above). `policy.executorPreference[0]`
  // (persisted below, unchanged) always records the DECLARED preference
  // before that redirection, while `executorId` records what ACTUALLY ran --
  // these are two distinct, non-contradictory fields by design, not a stale
  // duplicate. `executorRedirected` makes that divergence explicit in the
  // persisted record instead of leaving an auditor to infer it by comparing
  // the two fields themselves.
  const executorRedirected = resolvedExecutorId !== defaultExecutorId;
  // `let`: see the Phase B note on `compiledPlan` above.
  let resolvedAdapter = compiledPlan?.invocation?.adapter || cfg.executors?.[resolvedExecutorId]?.adapter || cfg.executor?.adapter || 'cli-spawn';
  // The compiled plan describes the pinned invocation already; this only covers a pin
  // the plan could not see (a compiled plan that predates the pin on resume).
  if (hasExplicitInvocationPin) {
    const pinnedInvocation = cfg.executors?.[resolvedExecutorId]?.invocations
      ?.find((inv) => inv?.id === opts.cliOverride.preferInvocation && inv?.via === 'cli');
    if (pinnedInvocation?.adapter) resolvedAdapter = pinnedInvocation.adapter;
  }

  let effectiveCwd = compiledPlan?.invocation?.cwd ?? compiledPlan?.cwd ?? cwd;
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs ?? 900000;
  const startedAt = new Date().toISOString();

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

  // Atomic admission (replaces the prior readdirSync + max-attempt scan --
  // see admitRunAttempt's own doc comment for the full commit algorithm).
  // `retryId` is opt-in: every pre-existing caller omits it and gets "next
  // available attempt" exactly as before; a caller that supplies one opts
  // into the full idempotent-tuple/predecessor-fencing contract.
  const defaultAdmissionPayloadDigest = crypto
    .createHash('sha256')
    .update(JSON.stringify({ assignment: effectiveAssignment, compiledPlan }))
    .digest('hex');

  // Part 2 (herdr-spawn liveness): admitRunAttempt's own M1 in-flight check
  // (below) is a synchronous CAS critical section that must never block on
  // anything external -- but herdr-spawn's own liveness signal
  // (isHerdrSpawnRunStillWorking) is a real, non-deterministic-availability
  // herdr CLI subprocess call. Pre-compute it here, OUTSIDE the CAS section,
  // as a best-effort peek at whatever generation is current RIGHT NOW; if a
  // concurrent commit changes the current generation between this peek and
  // the real CAS below (a narrow, expected race -- currentGeneration is a
  // plain read, not part of the same atomic transaction), M1's own check
  // notices the runId mismatch and fails closed (treats it as still
  // working) rather than trusting a pre-check computed for the wrong
  // attempt. Skipped entirely when there is no live candidate to check
  // (no generation yet, an already-settled attempt, or a non-herdr-spawn
  // adapter -- isCliSpawnRunStillWorking's own synchronous, local check
  // already covers that case unchanged, inside the CAS section itself).
  let herdrLivenessPreCheck = null;
  const admissionGenerationsDirPeek = path.join(assignmentDir, 'admission', 'generations');
  const currentGenPeek = currentGeneration(admissionGenerationsDirPeek);
  if (currentGenPeek?.record) {
    const peekAttemptStr = currentGenPeek.record.attemptStr || String(currentGenPeek.record.attempt).padStart(2, '0');
    const peekRunDir = path.join(runsDir, peekAttemptStr);
    if (!fs.existsSync(path.join(peekRunDir, 'result.json'))) {
      let peekAdapter = null;
      try {
        peekAdapter = JSON.parse(fs.readFileSync(path.join(peekRunDir, 'run.json'), 'utf8'))?.adapter;
      } catch {}
      if (peekAdapter === 'herdr-spawn') {
        const result = await isHerdrSpawnRunStillWorking(peekRunDir, { cwd: effectiveCwd });
        herdrLivenessPreCheck = { runId: currentGenPeek.record.runId, result };
      }
    }
  }

  const admitted = admitRunAttempt(assignmentDir, runsDir, effectiveAssignment.assignmentId, {
    retryId: opts.retryId,
    predecessorRunId: opts.predecessorRunId ?? null,
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
  // already-existing mechanism this step does not touch.
  let fallbackSubstituted = false;

  // Phase B resume rehydration: a prior attempt at this exact Run already
  // switched to a fallback executor and persisted that switch (see the
  // `fallback` commit below) before crashing/restarting -- a resume must
  // pick up that SAME executor, never recompile the primary. Getting this
  // wrong throws later, at confinement prep
  // (confinement/request.mjs's crossCheckAssignmentLaunchContext compares
  // the in-memory plan's digest against the ALREADY-PERSISTED
  // run.json.dispatchPlanDigest and refuses on any mismatch).
  if (admitted.resumed) {
    try {
      const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
      if (runJson.fallback?.resolved && fs.existsSync(dispatchPlanPath)) {
        const persistedPlan = JSON.parse(fs.readFileSync(dispatchPlanPath, 'utf8'));
        if (persistedPlan.executorId === runJson.fallback.resolved) {
          compiledPlan = persistedPlan;
          effectivePolicy = persistedPlan.policy;
          resolvedExecutorId = runJson.fallback.resolved;
          resolvedAdapter = persistedPlan.invocation?.adapter || cfg.executors?.[resolvedExecutorId]?.adapter || cfg.executor?.adapter || 'cli-spawn';
          effectiveCwd = persistedPlan.invocation?.cwd ?? persistedPlan.cwd ?? cwd;
          fallbackEvidence = runJson.fallback;
          fallbackSubstituted = true;
        }
      }
    } catch {
      // No readable run.json/dispatch-plan.json yet, or no fallback ever
      // committed for this Run -- resume proceeds against the primary
      // exactly as before this phase.
    }
  }

  // M6: normalized ('openai' ≡ 'openai-codex') so leases, quarantine, and
  // the fault classifier all key the same provider inventory bucket
  // regardless of which spelling a config or resolved command happened to use.
  const providerCapacityProvider = normalizeProviderFamily(effectivePolicy.providerModel || deriveProviderFamily(cfg.executors?.[resolvedExecutorId] ?? cfg.executor));
  // H8 (resume re-acquire): control only reaches this point on a resumed
  // Run when reconcile already proved there is no live or settled worker
  // to reattach to (both cases return earlier, well above this line) --
  // i.e. a genuinely new worker process is about to be relaunched, which
  // needs its own lease exactly like a fresh dispatch does. The excluded
  // `!admitted.resumed` used to skip leasing here unconditionally, leaving
  // a relaunched resumed Run to run with no provider-capacity account at
  // all instead of re-acquiring (rankProviderAccounts' own sticky lookup,
  // keyed by state.assignments[provider:assignmentId], already prefers the
  // SAME account the original attempt held, once reclaimDeadLeases frees
  // its now-dead lease).
  const shouldSelectProviderAccount =
    compiledPlan.mechanism === 'out-of-process' &&
    cfg.executors?.[resolvedExecutorId]?.kind !== 'tool' &&
    hasProviderAccounts(cfg, providerCapacityProvider);
  if (shouldSelectProviderAccount) {
    // C2c: this call happens AFTER admitRunAttempt already committed
    // run.json status:"running" -- exactly the same post-admission window
    // H2's comment below already documents for a `status:'refused'`
    // RETURN value. A THROW here (e.g. ProviderCapacityLockError on lock
    // contention timeout, or a corrupt state.json) used to escape this
    // function entirely instead, leaving that same Run permanently
    // "running"/unsettled with no orphan marker. Route it through the
    // exact same status:'refused' settle path below instead of inventing
    // a second one.
    try {
      providerCapacitySelection = acquireProviderAccountLease({
        runnerConfig: cfg,
        provider: providerCapacityProvider,
        assignmentId: effectiveAssignment.assignmentId,
        runId,
        seed: `${effectiveAssignment.assignmentId}:${runId}`,
        runtimeDir: opts.providerCapacityRuntimeDir,
        runIsDead: opts.providerCapacityRunIsDead,
        isRunWorkerAlive: providerCapacityIsRunWorkerAlive,
      });
    } catch (err) {
      providerCapacitySelection = {
        status: 'refused',
        provider: providerCapacityProvider,
        reason: err.code === 'provider-capacity-lock-stale' ? 'provider-capacity.lock-stale' : 'provider-capacity.acquire-failed',
        cause: err.message,
      };
    }
    // H8: a lease can be selected (an account/credentialSource chosen) for
    // a dispatch shape nothing can actually provision that credential
    // into -- only the confined bwrap driver's own prepare() copies
    // credentialSource into the worker's private home (confinement/drivers/
    // bwrap.mjs's provisionSelectedCodexCredential), and both cli-spawn and
    // herdr-spawn reach that prepare() through prepareConfinementForLaunch
    // with the same providerCapacity. Narrowly scoped to
    // `confinement.mode: 'required'`: that is the one case where the
    // CALLER explicitly declared it needs confinement, so silently
    // running with no credential provisioned (and no sandbox either) is a
    // real, undisclosed contract violation, not the accepted interim gap.
    // An unconfined (or confinement-unspecified) dispatch keeps today's
    // existing, already-honest behavior unchanged: it proceeds and
    // records `credentialProvisioned: false` in its evidence (below) --
    // choosing between "refuse this too" and "provision via env for
    // cli-spawn" for THAT broader case belongs to account-rotator's own
    // plan owner (the review names both as valid fixes), not this phase.
    if (providerCapacitySelection?.status === 'selected') {
      const confinementMode = compiledPlan?.policy?.confinement?.mode;
      const requiresConfinement = confinementMode === 'required';
      const canProvisionCredential = !requiresConfinement || resolvedAdapter === 'cli-spawn' || resolvedAdapter === 'herdr-spawn';
      if (requiresConfinement && !canProvisionCredential) {
        try {
          releaseProviderAccountLease({
            provider: providerCapacitySelection.provider,
            accountId: providerCapacitySelection.accountId,
            runId,
            runtimeDir: opts.providerCapacityRuntimeDir,
          });
        } catch {}
        providerCapacitySelection = {
          status: 'refused',
          provider: providerCapacityProvider,
          reason: 'credential-provisioning-unsupported',
          cause: `confinement mode "required" was declared but adapter "${resolvedAdapter}" has no path to provision the selected account's credential into a confined worker`,
        };
      }
    }
    if (providerCapacitySelection?.status === 'refused') {
      // Pre-Phase-05 gate H2 (executor-policy-dispatch-seams plan.md): this
      // refusal happens AFTER admitRunAttempt already created runId/runDir
      // (run.json written `status: "running"` above) -- an unclassified
      // throw here used to leave that Run permanently `running`/unsettled,
      // with nothing to tell an orphan apart from one still genuinely in
      // flight. Settle it properly instead, using the exact same
      // result.json/run.json/markRunSettled sequence the normal completion
      // path below uses, classified via runtime.executionError so
      // normalizeRunResultV2 derives execStatus:"failed",
      // failure:{family:"provider", code:"provider-capacity-refused"}, and
      // policy:{disposition:"needs-input"} through its own existing rules --
      // no new override channel invented. `predecessorRunId`/`retryId` are
      // executeAssignment's EXISTING admission-time retry channel (see
      // admitRunAttempt above): a caller that wants to reattempt calls
      // executeAssignment again with `predecessorRunId: runId`, which
      // supersedes this settled attempt through the same path every other
      // retry already uses -- this settlement does not need its own retry
      // loop, only to stop being unsettled.
      //
      // Phase B (plans/260917-executor-profile-schema-migration/plan.md):
      // before settling as terminal, attempt ONE real dispatch against a
      // declared fallback executor. An assignment with no declared
      // fallbackExecutors takes this exact branch and falls straight
      // through unchanged (`fallbackOutcome.evidence` stays `null`), so
      // that case remains byte-identical to before this phase.
      const primaryRefusalReason = providerCapacitySelection.reason;
      const fallbackOutcome = attemptProviderCapacityFallback({
        cfg,
        compiledPlan,
        resolvedExecutorId,
        primaryRefusalReason,
        effectiveAssignment,
        runId,
        cliOverride: opts.cliOverride,
        options: opts.options,
        work: opts.work,
        hasLiveTaskAccess: opts.hasLiveTaskAccess,
        providerCapacityRuntimeDir: opts.providerCapacityRuntimeDir,
        providerCapacityRunIsDead: opts.providerCapacityRunIsDead,
        providerCapacityIsRunWorkerAlive,
      });

      let fallbackAdopted = false;
      if (fallbackOutcome.adopted) {
        // Commit the switch to disk BEFORE reassigning any in-memory
        // variable, so a crash between the two leaves disk and memory
        // consistent with EITHER the primary or the fallback, never a mix.
        // `dispatchPlanDigest` must move together with `dispatch-plan.json`
        // -- confinement/request.mjs's crossCheckAssignmentLaunchContext
        // throws on any disagreement between them.
        const newDigest = `sha256:${crypto.createHash('sha256').update(JSON.stringify(fallbackOutcome.plan)).digest('hex')}`;
        try {
          fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(fallbackOutcome.plan, null, 2)}\n`);
          fsyncFileBestEffort(dispatchPlanPath);
          const runJsonPath = path.join(runDir, 'run.json');
          const runJson = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
          fs.writeFileSync(
            runJsonPath,
            `${JSON.stringify({ ...runJson, executorId: fallbackOutcome.executorId, dispatchPlanDigest: newDigest, fallback: fallbackOutcome.evidence }, null, 2)}\n`,
          );
          fsyncFileBestEffort(runJsonPath);
          fallbackAdopted = true;
        } catch (err) {
          // The patch itself failed -- never run with a half-switched state
          // (dispatch-plan.json/run.json disagreeing with what actually
          // executes). Release any lease the fallback acquired and fall
          // through to the terminal settlement below, as if the fallback
          // had never been attempted.
          if (fallbackOutcome.lease?.status === 'selected') {
            try {
              releaseProviderAccountLease({
                provider: fallbackOutcome.lease.provider,
                accountId: fallbackOutcome.lease.accountId,
                runId,
                runtimeDir: opts.providerCapacityRuntimeDir,
              });
            } catch {}
          }
          fallbackOutcome.evidence = { ...fallbackOutcome.evidence, resolved: null, commitError: err.message };
        }
      }

      if (fallbackAdopted) {
        compiledPlan = fallbackOutcome.plan;
        effectivePolicy = fallbackOutcome.plan.policy;
        resolvedExecutorId = fallbackOutcome.executorId;
        resolvedAdapter = fallbackOutcome.plan.invocation?.adapter || cfg.executors?.[resolvedExecutorId]?.adapter || cfg.executor?.adapter || 'cli-spawn';
        effectiveCwd = fallbackOutcome.plan.invocation?.cwd ?? fallbackOutcome.plan.cwd ?? cwd;
        providerCapacitySelection = fallbackOutcome.lease;
        fallbackEvidence = fallbackOutcome.evidence;
        fallbackSubstituted = true;
        // Fall through: the rest of executeAssignment now dispatches
        // against the fallback exactly as it would have against the
        // primary. The `status === 'selected'` block right below picks up
        // `providerCapacitySelection` (now the fallback's own lease, or
        // `null` for an unmanaged fallback provider) and runs once for
        // whichever selection won -- never duplicated.
      } else {
        const settledAt = new Date().toISOString();
        const stderrText = fallbackOutcome.evidence
          ? `provider capacity refused for "${providerCapacityProvider}": ${primaryRefusalReason} (fallback attempt also failed: ${JSON.stringify(fallbackOutcome.evidence)})`
          : `provider capacity refused for "${providerCapacityProvider}": ${primaryRefusalReason}`;
        fs.writeFileSync(path.join(runDir, 'stdout.log'), '');
        fs.writeFileSync(path.join(runDir, 'stderr.log'), stderrText);
        const evidenceData = {
          operationMutability: isReadOnlyAssignment(effectiveAssignment) ? 'read-only' : 'mutates-repo',
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
          ...(fallbackOutcome.evidence ? { fallback: fallbackOutcome.evidence } : {}),
        };
        fs.writeFileSync(path.join(runDir, 'evidence.json'), `${JSON.stringify(evidenceData, null, 2)}\n`);
        const refusedRunResult = normalizeRunResultV2({
          runId,
          assignmentId: effectiveAssignment.assignmentId,
          workId: effectiveAssignment.workId,
          executorId: resolvedExecutorId,
          policy: effectivePolicy,
          settledAt,
          role: effectiveAssignment.role,
          operation: effectiveAssignment.operation,
          isReadOnlyOperation: evidenceData.operationMutability === 'read-only',
          runtime: {
            exitCode: null,
            executionError: { code: 'provider-capacity-refused', message: stderrText },
            stdoutLog: path.relative(root, path.join(runDir, 'stdout.log')),
            stderrLog: path.relative(root, path.join(runDir, 'stderr.log')),
          },
          evidence: evidenceData,
        });
        // This early-exit runs BEFORE the main acquireRunControl at line 2231, so
        // no control token exists yet. Acquire one now, use the shared atomic
        // settlement primitive (CAS + immutable publication), and return.
        // The settled generation record fences any future controller from acquiring
        // this Run — consistent with every other settlement path (F-01).
        const refusalControlHolder = buildRunControlHolder(`${runId}:${process.pid}:provider-capacity-refusal`);
        const refusalControl = acquireRunControl(runDir, { holder: refusalControlHolder, purpose: 'provider-capacity-refusal' });
        if (refusalControl.status !== 'acquired') {
          // Already settled by another path — rehydrate and return.
          try {
            const resultJsonPath = path.join(runDir, 'result.json');
            if (fs.existsSync(resultJsonPath)) {
              const res = interpretRunResult(resultJsonPath, { expectedRunId: runId });
              if (!res.corrupt && !res.contractCorrupt && !res.resultCorrupt && res.classification?.provenance !== 'contract-corrupt') {
                return Object.freeze(res);
              }
            }
          } catch {}
          throw new RunnerConfigError(
            `executeAssignment: provider-capacity refusal could not acquire control for Run "${runId}" (status: "${refusalControl.status}")`,
            { code: 'run-control-held', phase: 'provider-capacity-refusal' },
          );
        }
        return commitRunSettlement({
          runDir,
          runId,
          controlEpoch: refusalControl.controlEpoch,
          controlToken: refusalControl.controlToken,
          runResult: refusedRunResult,
        });
      }
    }
    if (providerCapacitySelection?.status === 'selected') {
      providerCapacityEvidence = {
        ...redactProviderCapacitySelection(providerCapacitySelection),
        credentialProvisioned: false,
      };
      const selectionPath = path.join(runDir, 'provider-capacity-selection.json');
      fs.writeFileSync(selectionPath, `${JSON.stringify(providerCapacityEvidence, null, 2)}\n`);
      fsyncFileBestEffort(selectionPath);
      const runJsonPath = path.join(runDir, 'run.json');
      try {
        const runJson = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
        fs.writeFileSync(
          runJsonPath,
          `${JSON.stringify({ ...runJson, providerCapacitySelectionPath: path.relative(root, selectionPath) }, null, 2)}\n`,
        );
        fsyncFileBestEffort(runJsonPath);
      } catch {}
    }
  }
  let effectiveContract;
  if (fs.existsSync(effectiveContractPath)) {
    try {
      effectiveContract = JSON.parse(fs.readFileSync(effectiveContractPath, 'utf8'));
    } catch {
      effectiveContract = null;
    }
  } else {
    effectiveContract = buildEffectiveExecutionContract({
      assignment: effectiveAssignment,
      dispatchPlan: compiledPlan,
      runId,
      runDir,
      cwd: effectiveCwd,
      repoRoot: root,
      runnerConfig: cfg,
      timeoutMs,
      executorId: resolvedExecutorId,
      adapter: resolvedAdapter,
      providerCapacity: providerCapacityEvidence,
      templateProvenance: templateResolution?.templateProvenance ?? effectiveAssignment.provenance?.template,
      // The prompt is built before Authority preparation. Derive its posture
      // from the same requirement that will be handed to Authority, never
      // from an executor profile's merely requested confinement fragment.
      confinement: confinementRequirement.mode === 'unconfined'
        ? { requirement: { mode: 'unconfined' }, backend: { id: 'none', type: 'none' } }
        : { requirement: confinementRequirement },
    });
  }

  const resultJsonPath = path.join(runDir, 'result.json');
  if (admitted.resumed) {
    if (fs.existsSync(resultJsonPath)) {
      try {
        const settledResult = interpretRunResult(resultJsonPath, { expectedRunId: runId });
        if (!settledResult || settledResult.corrupt || settledResult.contractCorrupt || settledResult.resultCorrupt || settledResult.classification?.provenance === 'contract-corrupt') {
          throw new RunnerConfigError(
            `executeAssignment: Run "${runId}" resume found an existing result.json that failed validation or is contract-corrupt -- refusing to relaunch over corrupt settlement evidence`,
            { code: 'result-corrupt', phase: 'post-admission' },
          );
        }
        return Object.freeze(settledResult);
      } catch (err) {
        if (err instanceof RunnerConfigError) throw err;
        // H3: result.json EXISTS (checked above) but failed to read/parse --
        // a torn or corrupt write, not "no result yet". Falling through here
        // used to silently continue toward launching a brand-new worker over
        // a Run slot that already has terminal evidence, just unreadable
        // evidence. Refuse instead; a human/recovery door decides next, this
        // path never guesses by relaunching over it.
        throw new RunnerConfigError(
          `executeAssignment: Run "${runId}" resume found an existing result.json that failed to parse (${err.message}) -- refusing to relaunch over unreadable settlement evidence`,
          { code: 'result-corrupt', phase: 'post-admission' },
        );
      }
    }
    const commandsDir = path.join(runDir, 'controller', 'commands');
    if (fs.existsSync(commandsDir)) {
      // The commands/<launchCommandId>.json record's own `contract` field
      // says which reconcile shape actually applies -- cli-spawn's
      // 'assignment-command-state.v1' (envelopeDigest/bindingDigest) and
      // herdr-spawn's 'herdr-launch-command.v1' (herdrName/paneId/
      // agentSession) are different contracts sharing this one path, and
      // reconcileCliSpawnRun's own window checks (e.g. `command.envelopeDigest`)
      // never match a herdr record, so a herdr-spawn resume always fell
      // through to a duplicate fresh dispatch attempt instead of finding
      // its live/settled worker.
      let reconcileFn = reconcileCliSpawnRun;
      try {
        const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json')).sort();
        const latestCommandFile = commandFiles[commandFiles.length - 1];
        if (latestCommandFile) {
          const latestCommand = JSON.parse(fs.readFileSync(path.join(commandsDir, latestCommandFile), 'utf8'));
          if (latestCommand?.contract === 'herdr-launch-command.v1') {
            reconcileFn = reconcileHerdrSpawnRun;
          }
        }
      } catch {}
      const rec = await reconcileFn(runDir);
      if (rec.settled && rec.runResult) {
        return rec.runResult;
      }
      // C1a: a resumed Run whose reconcile did NOT come back settled has a
      // dispatch attempt already on record -- launching a second worker over
      // it is exactly the double-materialization this phase exists to close.
      // Allow-listed by SAFETY, not by enumerating every status both
      // adapters can return (that list already includes 'waiting', 'held',
      // 'stale', 'observed', 'observed-stale', 'refused', and herdr's own
      // 'failed' for a receipt-backed outcome whose outbox file could not be
      // verified -- none of them mean "nothing was ever dispatched"). The
      // ONLY state that legitimately means that is `parked` with reason
      // `command-missing` (no commands/*.json ever got written, or none
      // parsed) -- everything else falls through to a refusal below instead
      // of silently becoming a fresh launch attempt.
      const isCommandMissing = rec.status === 'parked' && rec.reason === 'command-missing';
      if (!isCommandMissing) {
        const confirmedLive = rec.status === 'waiting';
        throw new RunnerConfigError(
          `executeAssignment: Run "${runId}" resume found an existing dispatch attempt in a non-settled state (status: "${rec.status}"${rec.reason ? `, reason: "${rec.reason}"` : ''}) -- refusing to launch a second worker over it`,
          {
            code: confirmedLive ? 'run-in-flight' : 'run-unreconciled',
            phase: 'post-admission',
            reconcileStatus: rec.status,
            ...(rec.reason ? { reconcileReason: rec.reason } : {}),
          },
        );
      }
    }
  }

  // Dispatched-run membership: record every run attempt THIS runner actually
  // dispatched, so cross-pass consumption can refuse run dirs no runner ever
  // dispatched (a planted runs/NN directory must never look like evidence of
  // a real run). H3: a one-file-per-attempt marker under dispatched/<NN>
  // instead of a full assignment.json rewrite -- a torn write here can only
  // ever cost this ONE marker, never corrupt the whole manifest (assignment
  // fields stay the immutable input per Step 03 §2, untouched by this write
  // either way). operation-choice.mjs reads this marker first, falling back
  // to the legacy dispatchedRuns array for one release.
  try {
    const dispatchedDir = path.join(assignmentDir, 'dispatched');
    publishMarkerOnce(path.join(dispatchedDir, attemptStr), { attemptStr, dispatchedAt: new Date().toISOString() });
  } catch {
    // Bookkeeping must never abort a dispatch that already started; a missing
    // entry only costs this run its cross-pass consumability (fail closed).
  }

  // Step 04 §5.1: pass concrete runDir so worker knows exactly where to write
  // agent-result.json and agent-report.md. Use absolute path to avoid worktree ambiguity.
  // Phase 02 (executor-policy-dispatch-seams): thread the ALREADY-resolved
  // persona (effectivePolicy.persona/provenance.persona, computed above by
  // the same resolveAssignmentDispatchPolicy() every dispatch path shares)
  // into the actual worker-visible prompt -- previously resolved but never
  // delivered. Additive: `undefined` when no persona resolved, byte-identical
  // to the pre-Phase-02 prompt for every such assignment.
  const prompt = renderAssignmentPrompt(effectiveAssignment, {
    cwd,
    runDir: path.resolve(runDir),
    effectiveContract,
    ...(effectivePolicy.persona
      ? { persona: { value: effectivePolicy.persona, source: effectivePolicy.provenance?.persona?.source ?? null } }
      : {}),
  });

  // Step 04 §5.3: snapshot dirty state BEFORE the run so pre-existing dirty files
  // are never counted as post-run evidence.
  const dirtyBefore = safeGitStatusFiles(effectiveCwd);
  const dirtyBeforeSnapshots = snapshotDirtyBeforeFiles(effectiveCwd, dirtyBefore);

  // Cell 6.7 G6: capture gitBefore BEFORE the worker launches, unconditionally
  // (not only on a settled/happy path) -- a worker that commits then crashes
  // must never have gitBefore/gitAfter read at the same post-crash instant,
  // which would silently hide that a commit happened during the run. This
  // pre-launch capture is the ONLY source for gitBefore below; a settled
  // rawResult's own headBefore (when the out-of-process adapter also
  // captured one) is intentionally not consulted, so provenance stays
  // consistent across both the settle and the crash path.
  const gitBefore = safeGitHead(effectiveCwd);
  // safeGitHead already fails closed to null internally and never throws,
  // so no runtime path today fails to reach the capture above --
  // gitBeforeSource is always 'pre-launch'. The literal is still named
  // (rather than inlined at each write site below) and 'post-crash-fallback'
  // kept as the sibling value so a future change that captures gitBefore
  // through a different path is forced to say so explicitly instead of
  // silently inheriting this call's provenance.
  const gitBeforeSource = 'pre-launch';

  // Per-Run control fencing (AD-02/AD-10): a monotonic controlEpoch plus a
  // unique controlToken, acquired synchronously (no adapter I/O runs inside
  // the acquisition itself) and re-checked before this attempt is allowed
  // to append a settlement. Two acquisitions of the same Run always
  // receive distinct epochs/tokens; a live holder is never reclaimed on
  // heartbeat/TTL alone (see run-lock.mjs). Failure to acquire here means a
  // different controller already holds this exact Run -- refuse outright
  // rather than race it for the same subprocess/files.
  const controlHolder = buildRunControlHolder(`${runId}:${process.pid}:${crypto.randomUUID()}`);
  const control = acquireRunControl(runDir, { holder: controlHolder, purpose: 'worker-spawn', ttlMs: opts.controlTtlMs });
  if (control.status !== 'acquired') {
    if (providerCapacitySelection?.status === 'selected') {
      try {
        releaseProviderAccountLease({
          provider: providerCapacitySelection.provider,
          accountId: providerCapacitySelection.accountId,
          runId,
          runtimeDir: opts.providerCapacityRuntimeDir,
        });
      } catch {}
    }
    throw new RunnerConfigError(
      `executeAssignment: could not acquire control for Run "${runId}" (status: "${control.status}") -- another controller currently holds it`,
      { code: 'run-control-held', phase: 'post-admission' },
    );
  }
  const { controlEpoch, controlToken } = control;

  const startTime = Date.now();
  let rawResult;
  let executionError = null;

  const executorId = resolvedExecutorId;
  // ADR-006 R7 sibling bug (RT059-F1): `compiledPlan.policy` (the object
  // `resolveAssignmentDispatchPolicy()` returns -- tier/model/providerModel/
  // confinement/executorPreference) has never carried an `adapter` field.
  // The real resolved adapter lives at `compiledPlan.invocation.adapter`
  // (plan.mjs: `invocation = { via: 'cli', adapter: resolvedForDispatch.adapter
  // ?? executor?.adapter ?? 'cli-spawn', ... }`). Reading the wrong (always
  // undefined) field silently defaulted every executor to 'cli-spawn',
  // including a real herdr-spawn `invocations[]` executor -- misrouting it
  // into the cli-spawn supervisor, which then spawns against a herdr
  // launch-command file it cannot parse.
  const useSupervisorRecovery = resolvedAdapter === 'cli-spawn' && !opts.legacySpawn;
  // Both cli-spawn (via the local supervisor process, below) and herdr-spawn
  // (via `executeExecutorCli`'s own confinement-authority door) are
  // Assignment-owned recoverable dispatches: a resume must find the same
  // launchCommandId/controlEpoch/controlToken identity a first attempt
  // admitted, and a receipt must land under the same runDir. This is the
  // ONE decision that determines that identity is built and threaded --
  // never left to each adapter branch to remember independently (RT059-F2:
  // the herdr-spawn branch used to skip this entirely and fall back to
  // legacy behavior with no controller/protected tree and no receipt).
  const needsAssignmentLaunchContext = (resolvedAdapter === 'cli-spawn' || resolvedAdapter === 'herdr-spawn') && !opts.legacySpawn;

  let launchCommandId = opts.launchCommandId || `cmd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  let commandState = null;
  let commandPath = null;
  let supervisorReceipt = null;
  let assignmentLaunchContext = null;

  // S4 (dispatch-engine-liveness-hardening): cli-spawn is the one Assignment
  // launch shape with no acquireMainCheckoutLock coverage at all -- herdr-spawn
  // already inherits it below via its own executeExecutorCli() call, which
  // internally acquires acquireMainCheckoutLock(fgosDir, {lockFile:
  // dispatchLockFile(cwd)}) for the full duration of that call. Acquiring a
  // SECOND lock here for herdr-spawn too would self-conflict against that
  // inner acquisition (two distinct string identities from the same process
  // racing the same lock file -- the second would see the first as HELD by
  // "a different holder" and refuse), so this is scoped to cli-spawn only.
  // Keyed on the SAME dispatchLockFile(cwd) name executeExecutorCli already
  // uses, so a cli-spawn Assignment, a herdr-spawn Assignment, and an ad-hoc
  // `dispatch execute` all contend on ONE lock file per cwd. A per-call
  // string identity (matching executeExecutorCli's own scheme, not a bare
  // process.pid) is required because one long-lived process can dispatch
  // several different Assignments in a row (or concurrently) against the
  // same cwd -- a bare pid would self-recognize a second, unrelated dispatch
  // as a refresh of the first instead of a genuine contender.
  // `opts.forceSharedCwd` (CLI: --force-shared-cwd) is a distinct axis from
  // `forceNewAttempt` above (that overrides the M1 same-assignment-retry
  // check; this overrides a DIFFERENT assignment/process sharing this cwd)
  // -- an operator who already knows concurrent mutation here is safe skips
  // the acquisition entirely, same as never having contended for the lock.
  // Gated on `effectiveMutation === 'mutating'`: S4's own problem statement
  // is concurrent MUTATING Assignments racing a cwd, and this repo's own
  // test suite (assignment-dispatch.test.mjs's "genuinely concurrent
  // invocations under the same --work id" Red-Team fix tests) already
  // proves concurrent READ-ONLY dispatch to the SAME cwd through this exact
  // cli-spawn/`--contract` door is intentional, existing, relied-upon
  // behavior -- an unconditional lock here regressed both tests outright
  // (verified by running them). Read-only Assignments never acquire and are
  // therefore never blocked by, nor able to block, this lock.
  let cwdLockRes = null;
  let cwdLockHeartbeat = null;

  try {
    if (useSupervisorRecovery && effectiveMutation === 'mutating' && opts.forceSharedCwd !== true) {
      const cwdLockIdentity = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      const cwdLockFile = dispatchLockFile(cwd);
      const cwdLockAcquired = acquireMainCheckoutLock(fgosDir, {
        identity: cwdLockIdentity,
        ttlMs: timeoutMs,
        releaseOnExit: true,
        lockFile: cwdLockFile,
      });
      if (cwdLockAcquired.status === HELD) {
        throw new DispatchError(
          'dispatch-in-flight',
          `dispatch for cwd "${cwd}" is already in flight (held for ${formatLockDurationMs(cwdLockAcquired.lockAgeMs)}).`,
          { cwd, lockAgeMs: cwdLockAcquired.lockAgeMs, remainingTtlMs: cwdLockAcquired.remainingTtlMs, holderPid: cwdLockAcquired.holderPid },
        );
      }
      if (cwdLockAcquired.status === AMBIGUOUS) {
        throw new DispatchError(
          'dispatch-in-flight',
          `dispatch lock for cwd "${cwd}" is ambiguous (corrupt or unparseable lock file).`,
          { cwd, lockAgeMs: cwdLockAcquired.lockAgeMs },
        );
      }
      if (cwdLockAcquired.status !== ACQUIRED) {
        throw new DispatchError(
          'dispatch-in-flight',
          `dispatch lock for cwd "${cwd}" could not be acquired (status: ${cwdLockAcquired.status}).`,
          { cwd },
        );
      }
      cwdLockRes = cwdLockAcquired;
      const cwdLockHeartbeatMs = Math.max(250, Math.floor(timeoutMs / 3));
      cwdLockHeartbeat = setInterval(() => {
        renewMainCheckoutLockIfOwn(fgosDir, cwdLockIdentity, { lockFile: cwdLockFile });
      }, cwdLockHeartbeatMs);
      cwdLockHeartbeat.unref();
    }
    if (needsAssignmentLaunchContext) {
      const depth = currentDispatchDepth();
      if (depth >= MAX_DISPATCH_DEPTH) {
        throw new DispatchError(
          'dispatch-depth-exceeded',
          `executor dispatch refused: current dispatch depth (${depth}) has reached MAX_DISPATCH_DEPTH (${MAX_DISPATCH_DEPTH}) -- prevent runaway nested dispatch.`,
          { depth, maxDepth: MAX_DISPATCH_DEPTH, workId: effectiveAssignment?.workId },
        );
      }
      // 1. Snapshot and write Evaluator Baseline V1 before launch
      const snapshotsObj = {};
      for (const [p, snap] of dirtyBeforeSnapshots.entries()) {
        snapshotsObj[p] = { exists: snap.exists, sha256: snap.hash };
      }
      const baselineBody = {
        contract: 'evaluator-baseline.v1',
        runId,
        assignmentId: effectiveAssignment.assignmentId,
        cwd: effectiveCwd,
        gitBefore,
        gitBeforeSource,
        dirtyBefore,
        dirtyBeforeSnapshots: snapshotsObj,
        capturedAt: new Date().toISOString(),
      };
      const baselineDigest = computeSha256Digest(baselineBody);
      const baselineRecord = { ...baselineBody, digest: baselineDigest };
      const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
      publishImmutableProof(baselinePath, baselineRecord);

      // 2. Commit Command State V1 not-requested -> pending. For herdr-spawn
      // this initial record is immediately superseded by the
      // herdr-launch-command.v1 shape `prepareConfinementForLaunch` publishes
      // to the same path (confinement/authority.mjs) -- harmless, since that
      // publish already preserves any prior pending/reconciled state for
      // this exact launchCommandId, and this write's only real job is
      // admitting the identity before anything downstream can race it.
      commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
      commandState = {
        contract: 'assignment-command-state.v1',
        runId,
        launchCommandId,
        controlEpoch,
        controlTokenDigest: computeSha256Digest(controlToken),
        state: 'pending',
        envelopeDigest: null,
        bindingDigest: null,
        receiptDigest: null,
        outcome: null,
      };
      publishMutableProjection(commandPath, commandState);

      // 3. Build Assignment Launch Context
      assignmentLaunchContext = {
        contract: 'assignment-cli-spawn-launch-context.v1',
        run: {
          runId,
          assignmentId: effectiveAssignment.assignmentId,
          attempt: admitted.attemptNum,
          dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
          evaluatorBaselineDigest: baselineDigest,
        },
        command: {
          launchCommandId,
          controlEpoch,
          controlTokenDigest: computeSha256Digest(controlToken),
        },
      };
    }

    if (useSupervisorRecovery) {
      // 4. Resolve executor command params
      let resolvedCmd;
      try {
        // executor-id-consolidation Step 2 (fallback confinement
        // preservation): only relevant when `resolvedExecutorId` was
        // substituted by the provider-capacity fallback mechanism
        // specifically (never for the unsubstituted primary, and never
        // for the separate, already-existing read-only-redirect
        // substitution -- see `fallbackSubstituted`'s own doc comment
        // above). A confined primary (`declaredPrimaryExecutorId`) whose
        // fallback candidate has no confined invocation available refuses
        // outright -- caught by the same catch block below that already
        // turns a resolveExecutorCommand failure into a structured
        // "submission-refused" outcome -- rather than silently
        // dispatching the fallback unconfined.
        let fallbackInvocationId;
        if (fallbackSubstituted) {
          let primaryConfinement;
          try {
            primaryConfinement = resolveExecutorConfig(cfg, undefined, declaredPrimaryExecutorId).confinement;
          } catch {
            primaryConfinement = undefined;
          }
          const primaryWasConfined = primaryConfinement && typeof primaryConfinement === 'object' && Object.keys(primaryConfinement).length > 0;
          if (primaryWasConfined) {
            fallbackInvocationId = selectConfinedInvocationId(cfg.executors?.[resolvedExecutorId]);
            if (!fallbackInvocationId) {
              throw new RunnerConfigError(
                `fallback executor "${resolvedExecutorId}" has no confined invocation available -- refusing to silently downgrade from primary "${declaredPrimaryExecutorId}"'s required confinement.`,
              );
            }
          }
        }

        resolvedCmd = resolveExecutorCommand(cfg, {
          prompt,
          model: effectivePolicy.model,
          tier: effectivePolicy.tier,
          executorId: resolvedExecutorId,
          fgosDir,
          attestRoot: effectiveCwd,
          // Three sources, most-specific-wins: an EXPLICIT caller pin
          // (`opts.cliOverride.preferInvocation` -- a code-panel actor's
          // own deliberate choice, already guarded above so the redirect
          // never overrides it) always wins first; the provider-capacity
          // fallback's own confinement-preservation pick is next (it only
          // ever applies to a fallback-substituted executor, never the
          // unsubstituted primary the explicit pin would target); the
          // read-only-redirect's own declared pin is the last fallback
          // source; neither pins anything for the unsubstituted
          invocationId: (hasExplicitInvocationPin ? opts.cliOverride.preferInvocation : undefined) ?? fallbackInvocationId,
        });
      } catch (err) {
        const commandOutcome = {
          kind: 'submission-refused',
          reason: 'launch-envelope-invalid',
          failureDetail: { message: err.message, code: 'config-invalid', source: 'controller' },
          failedAt: new Date().toISOString(),
        };
        commandOutcome.failureDigest = computeSha256Digest({
          kind: commandOutcome.kind,
          reason: commandOutcome.reason,
          failureDetail: commandOutcome.failureDetail,
          failedAt: commandOutcome.failedAt,
        });
        commandState.state = 'reconciled';
        commandState.outcome = commandOutcome;
        publishMutableProjection(commandPath, commandState);
        throw err;
      }

      // 5. Prepare Confinement For Launch via Confinement Authority
      let prepResult;
      try {
        const confReq = buildConfinementRequest({
          capability: compiledPlan.capability || 'code:implement',
          stageSkill: resolvedExecutorId,
          executorId: resolvedExecutorId,
          cfg,
          assignmentLaunchContext,
          invocation: {
            command: resolvedCmd.command,
            args: resolvedCmd.args,
            argsTemplate: resolvedCmd.argsTemplate,
            prompt,
            env: resolvedCmd.env,
            liveOutput: resolvedCmd.liveOutput,
            interactiveMode: resolvedCmd.interactiveMode,
            promptDelivery: resolvedCmd.promptDelivery,
            permissionMode: resolvedCmd.permissionMode,
            confinement: resolvedCmd.confinement,
            adapter: resolvedCmd.adapter || 'cli-spawn',
            method: resolvedCmd.method,
            url: resolvedCmd.url,
            headers: resolvedCmd.headers,
            body: resolvedCmd.body,
            resourceBindings: resolvedCmd.resourceBindings,
          },
          providerCapacity: providerCapacitySelection,
          context: {
            cwd: effectiveCwd,
            // A workspace-write posture grants the directory the work happens in
            // (the Unit worktree), never the main checkout that holds fgOS state.
            repoRoot: postureBinding?.posture === 'workspace-write' ? effectiveCwd : root,
            runDir: path.resolve(runDir),
            fgosDir,
            timeoutMs,
            idleTimeoutMs: cfg.idleTimeoutMs,
            maxBuffer: cfg.maxBuffer,
            onChunk: opts.onChunk,
            workId: resolvedExecutorId,
            tier: effectivePolicy.tier,
            model: effectivePolicy.model,
            dispatchBatchKey: opts.dispatchBatchKey,
            controlToken,
            controlEpoch,
            launchCommandId,
          },
          requirement: confinementRequirement,
        });
        prepResult = await prepareConfinementForLaunch(confReq, { adapterPort: opts.adapterPort });
      } catch (err) {
        const commandOutcome = {
          kind: 'submission-refused',
          reason: err.code || 'confinement-refused',
          failureDetail: { message: err.message, code: err.code || null, source: 'confinement-authority' },
          failedAt: new Date().toISOString(),
        };
        commandOutcome.failureDigest = computeSha256Digest({
          kind: commandOutcome.kind,
          reason: commandOutcome.reason,
          failureDetail: commandOutcome.failureDetail,
          failedAt: commandOutcome.failedAt,
        });
        commandState.state = 'reconciled';
        commandState.outcome = commandOutcome;
        publishMutableProjection(commandPath, commandState);
        throw err;
      }

      if (providerCapacityEvidence && prepResult?.providerCapacity?.credentialProvisioned === true) {
        providerCapacityEvidence = { ...providerCapacityEvidence, credentialProvisioned: true };
        const selectionPath = path.join(runDir, 'provider-capacity-selection.json');
        try {
          fs.writeFileSync(selectionPath, `${JSON.stringify(providerCapacityEvidence, null, 2)}\n`);
          fsyncFileBestEffort(selectionPath);
        } catch {}
      }

      // Persist after Authority resolution, yet before the supervisor is
      // spawned. A requested policy alone is not enforcement evidence.
      effectiveContract = buildEffectiveExecutionContract({
        assignment: effectiveAssignment,
        dispatchPlan: compiledPlan,
        runId,
        runDir,
        cwd: effectiveCwd,
        repoRoot: root,
        runnerConfig: cfg,
        timeoutMs,
        executorId: resolvedExecutorId,
        adapter: resolvedAdapter,
        providerCapacity: providerCapacityEvidence,
        confinement: {
          requirement: prepResult.preparedInvocation.requirement,
          backend: prepResult.preparedInvocation.backend,
        },
        templateProvenance: templateResolution?.templateProvenance ?? effectiveAssignment.provenance?.template,
      });
      publishMutableProjection(effectiveContractPath, effectiveContract);

      // 6. Guarded update of pending command with envelopeDigest
      commandState.envelopeDigest = prepResult.envelope.digest;
      publishMutableProjection(commandPath, commandState);

      // 7. Submit supervisor
      let supervisorProc;
      try {
        supervisorProc = startDetachedRunSupervisorProcess({
          envelopePath: prepResult.envelopePath,
          detached: true,
          onChunk: opts.onChunk,
        });
      } catch (err) {
        const commandOutcome = {
          kind: 'submission-refused',
          reason: 'supervisor-spawn-refused',
          failureDetail: { message: err.message, code: 'supervisor-spawn-fail', source: 'supervisor-launch' },
          failedAt: new Date().toISOString(),
        };
        commandOutcome.failureDigest = computeSha256Digest({
          kind: commandOutcome.kind,
          reason: commandOutcome.reason,
          failureDetail: commandOutcome.failureDetail,
          failedAt: commandOutcome.failedAt,
        });
        commandState.state = 'reconciled';
        commandState.outcome = commandOutcome;
        publishMutableProjection(commandPath, commandState);
        throw err;
      }

      // 8. Wait for receipt in live execution (event-driven with fs.watch + 20ms fallback)
      const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
      const receiptsDir = path.dirname(receiptPath);
      let watcher = null;
      let watcherTrigger = null;
      try {
        fs.mkdirSync(receiptsDir, { recursive: true });
        watcher = fs.watch(receiptsDir, (eventType, filename) => {
          if (!filename || filename === path.basename(receiptPath)) {
            if (watcherTrigger) watcherTrigger();
          }
        });
      } catch {}

      const pollStart = Date.now();
      const pollDeadline = pollStart + timeoutMs + 10000;
      while (Date.now() < pollDeadline) {
        if (fs.existsSync(receiptPath)) {
          try {
            supervisorReceipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
            break;
          } catch {}
        }
        if (supervisorProc.exitCode !== null) {
          if (fs.existsSync(receiptPath)) {
            try { supervisorReceipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8')); } catch {}
          }
          break;
        }
        await new Promise((r) => {
          const timer = setTimeout(r, 20);
          watcherTrigger = () => {
            clearTimeout(timer);
            r();
          };
        });
      }
      if (watcher) {
        try { watcher.close(); } catch {}
        watcher = null;
      }

      // 9. Guarded update: command reconciled with receipt-backed outcome
      if (supervisorReceipt) {
        commandState.state = 'reconciled';
        commandState.receiptDigest = supervisorReceipt.digest;
        commandState.bindingDigest = supervisorReceipt.bindingDigest;
        commandState.outcome = {
          kind: 'receipt-backed',
          receiptDigest: supervisorReceipt.digest,
          adapterCompletion: supervisorReceipt.completion,
        };
        publishMutableProjection(commandPath, commandState);
      } else {
        commandState.state = 'reconciled';
        commandState.outcome = {
          kind: 'submission-refused',
          reason: 'worker-state-unknown',
          failureDetail: {
            message: 'supervisor exited before adapter receipt was published',
          },
        };
        publishMutableProjection(commandPath, commandState);
        let runMeta = null;
        const runJsonPath = path.join(runDir, 'run.json');
        if (fs.existsSync(runJsonPath)) {
          try { runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8')); } catch {}
        }
        if (!runMeta) {
          runMeta = {
            contract: 'run-meta.v1',
            runId,
            assignmentId: effectiveAssignment.assignmentId,
            workId: effectiveAssignment.workId,
            attempt: admitted.attemptNum,
            executorId,
          };
        }
        const settledFailed = await settleFailedRunFromOutcome(runDir, runMeta, commandState, controlEpoch, controlToken, opts);
        return settledFailed.runResult;
      }

      const captureStdoutPath = path.join(runDir, 'protected', 'capture', launchCommandId, 'stdout.log');
      const captureStderrPath = path.join(runDir, 'protected', 'capture', launchCommandId, 'stderr.log');
      let stdoutText = '';
      let stderrText = '';
      try { stdoutText = fs.readFileSync(captureStdoutPath, 'utf8'); } catch {}
      try { stderrText = fs.readFileSync(captureStderrPath, 'utf8'); } catch {}

      const isTimeout = supervisorReceipt?.completion?.kind === 'timeout' || supervisorReceipt?.completion?.kind === 'idle-timeout';
      const exitCode = supervisorReceipt?.completion?.exitCode ?? (isTimeout ? 124 : 0);
      const signal = supervisorReceipt?.completion?.signal ?? (isTimeout ? 'SIGTERM' : null);
      rawResult = {
        status: isTimeout ? 'timeout' : (exitCode === 0 ? 0 : 'failed'),
        exitCode,
        signal,
        stdout: stdoutText,
        stderr: stderrText,
      };
    } else {
      // Legacy/non-supervisor adapters retain the existing pre-spawn write
      // guarantee. cli-spawn writes later, immediately after Authority
      // preparation, so its persisted posture reflects that preparation.
      if (!fs.existsSync(effectiveContractPath)) {
        publishMutableProjection(effectiveContractPath, effectiveContract);
      }
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
          // Work-layer inputs the caller resolved from the item's Workflow step.
          work: opts.work,
          capabilityHints: opts.capabilityHints,
          agentType: opts.agentType,
          runDir: path.resolve(runDir),
          dispatchBatchKey: opts.dispatchBatchKey,
          // The persisted contract does not name the role; the brief a pane worker reads has to
          // (an assessment role must be told its claim needs assessment.verdict).
          effectiveContract: effectiveContract
            ? { ...effectiveContract, assignment: { role: effectiveAssignment.role, operation: effectiveAssignment.operation } }
            : effectiveContract,
          // needsAssignmentLaunchContext (herdr-spawn, and any other
          // out-of-process adapter besides cli-spawn) reuses the SAME
          // assignmentLaunchContext identity built above -- executeExecutorCli
          // already accepts and threads these through buildConfinementRequest
          // -> executeThroughConfinement -> confinement/authority.mjs, which
          // resolves 'herdr-spawn' onto `herdrSpawnInteractiveAdapter`
          // (transport.mjs) -> `runHerdrRound` (herdr-round.mjs), the real
          // worker-command seam that publishes a receipt to
          // runDir/protected/adapter-receipts/<launchCommandId>.json. A plain
          // `opts.legacySpawn`/unrecognized-adapter caller never sets
          // `needsAssignmentLaunchContext`, so `assignmentLaunchContext` stays
          // null here and this call is byte-identical to before this fix.
          ...(needsAssignmentLaunchContext ? { assignmentLaunchContext, launchCommandId, controlEpoch, controlToken } : {}),
          ...(providerCapacitySelection ? { providerCapacity: providerCapacitySelection } : {}),
          // The one confinement path: the posture an Assignment was bound with decides
          // what wraps the agent in its pane, exactly as it does for cli-spawn.
          ...(postureBinding?.posture
            ? {
                requirement: confinementRequirement,
                ...(postureBinding.posture === 'workspace-write' ? { workspaceRoot: effectiveCwd } : {}),
              }
            : {}),
          ...(hasExplicitInvocationPin ? { invocationId: opts.cliOverride.preferInvocation } : {}),
        });
      } catch (err) {
        executionError = err;
        // The herdr round names the real reason beside the coarse error class; a
        // provider limit is not a timeout and must not be settled as one.
        const limitOutcome = err.outcome === 'provider-limit' || err.outcome === 'paused-limit' ? err.outcome : null;
        const isTimeoutErr = !limitOutcome && (err.errorClass === 'worker-timeout' || err.category === 'worker-timeout' || /timed out/i.test(err.message));
        rawResult = {
          status: isTimeoutErr ? 'timeout' : 'failed',
          signal: isTimeoutErr ? 'SIGTERM' : null,
          stdout: err.stdout || '',
          stderr: err.stderr || err.message || String(err),
          ...(limitOutcome ? { adapterOutcome: limitOutcome } : {}),
        };
      }

      // The adapter call above is the ONE async gap this control token has to
      // outlive. The settlement gate below checks isRunControlCurrent before
      // writing result.json: if superseded, it preserves the work product as
      // result.superseded.json (R5 / Decision D3) and throws
      // run-control-superseded without touching authoritative result.json.
    }

    const runMeta = {
      contract: 'run-meta.v1',
      runId,
      assignmentId: effectiveAssignment.assignmentId,
      workId: effectiveAssignment.workId,
      attempt: admitted.attemptNum,
      executorId,
    };

    const outcome = await settleRunOutcome({
      runDir,
      runMeta,
      assignment: effectiveAssignment,
      controlEpoch,
      controlToken,
      exitCode: typeof rawResult?.status === 'number'
        ? rawResult.status
        : (rawResult?.exitCode ?? (rawResult?.status === 'timeout' ? 124 : (rawResult?.status === 'failed' || executionError ? 1 : 0))),
      signal: rawResult?.signal ?? (rawResult?.status === 'timeout' ? 'SIGTERM' : null),
      isTimeout: rawResult?.status === 'timeout',
      durationMs: Date.now() - startTime,
      settledAt: new Date().toISOString(),
      stdoutText: rawResult?.stdout || '',
      stderrText: rawResult?.stderr || (executionError ? executionError.message : ''),
      effectiveCwd,
      gitBefore,
      gitBeforeSource,
      gitAfter: rawResult?.headAfter ?? safeGitHead(effectiveCwd),
      dirtyBefore,
      dirtyAfter: safeGitStatusFiles(effectiveCwd),
      dirtyBeforeSnapshots,
      planContentHash,
      resolvedExecutorId,
      effectivePolicy,
      executorRedirected,
      providerCapacitySelection,
      providerCapacityEvidence,
      fallbackEvidence,
      executionError,
      launchCommandId: useSupervisorRecovery ? launchCommandId : null,
      receipt: supervisorReceipt,
      adapterOutcome: rawResult?.adapterOutcome || rawResult?.outcome || rawResult?.status,
      // The adapter that really ran, so result.json states the transport instead of a guess.
      opts: { ...opts, adapter: resolvedAdapter, repoRoot: root, cwd },
    });
    return outcome.runResult;
  } finally {
    if (cwdLockHeartbeat) clearInterval(cwdLockHeartbeat);
    if (cwdLockRes) cwdLockRes.release();
    if (useSupervisorRecovery && launchCommandId) {
      try {
        await finalizeConfinementResources({ runDir, launchCommandId, receipt: supervisorReceipt });
      } catch {}
    }
    if (providerCapacitySelection?.status === 'selected') {
      try {
        releaseProviderAccountLease({
          provider: providerCapacitySelection.provider,
          accountId: providerCapacitySelection.accountId,
          runId,
          runtimeDir: opts.providerCapacityRuntimeDir,
        });
      } catch {}
    }
    releaseRunControl(runDir, { controlEpoch, controlToken });
  }
}
