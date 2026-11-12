// dispatch/assignment-runner.mjs — execute one Assignment: load its immutable input, admit a Run attempt, lease
// its account, launch it under the run supervisor and return the settled Run Result.
//
// Rules:
// - Run belongs to Assignment, not Work; Work lifecycle state is never mutated as a side effect.
// - assignment.json is written before execution, run.json before the launch.
// - Control-plane files are never evidence for themselves; worker-produced files or git diffs prove work, and
//   files already dirty before the launch never count.

import { recordCustodyHandoff } from '../../run-supervisor/cwd-lock.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { resolveWorkerArtifactPath } from '../../run-supervisor/worker-artifacts.mjs';
import { readSettledResult } from './run-result.mjs';
import {
  commitRunSettlement,
  settleRefusedLease,
  settleRunOutcome,
  isSubstantiveReportText,
  safeGitHead,
  safeGitStatusFiles,
  safeGitCommittedDiffFiles,
  computeChangedFiles,
  resolveRunWorkerArtifactPath,
} from './settlement.mjs';

// Shared with reconciliation, which must never disagree with this collector
// about which file is the worker's claim. Re-exported because callers and
// tests have always taken it from here.
export {
  resolveWorkerArtifactPath,
  resolveRunWorkerArtifactPath,
  commitRunSettlement,
  settleRunOutcome,
  isSubstantiveReportText,
  safeGitHead,
  safeGitStatusFiles,
  safeGitCommittedDiffFiles,
  computeChangedFiles,
};
import crypto from 'node:crypto';
import { createGitInspect, gitPortOptions } from '../../git/inspect.mjs';
import { inspectEntries, inspectPath } from '../../util/git-paths.mjs';
import { bind } from '../execution/bind.mjs';
import { seatConfigDigestOf } from '../execution/seat-policy.mjs';
import { walkStateOf } from '../execution/account-rotation.mjs';
import { bindSeatOf } from '../execution/seat-resolver.mjs';
import { legacyStateKey } from './llm-accounts.mjs';
import { loadRunnerConfigForDir, withDefaultExecutor } from './config.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { renderAssignmentPrompt, isReadOnlyAssignment } from './assignment.mjs';
import { resolveAndRenderOperationPrompt } from './operation-prompt-templates.mjs';
import { withRunDirReadAccess } from './cli.mjs';
import { mintAttemptWriterId, resolveWriterIdentity } from '../../util/session-identity.mjs';
import { resolveExecutorEnv, workerBaseEnv, caseContextEnv, CASE_ID_ENV, CASE_RESERVATION_ENV } from './adapters.mjs';
import { compileDispatchPlan, launchPinOf } from './plan.mjs';
import { familyOf } from './provider-adapter.mjs';
import { refuseWorkItemInput } from './work-item-input.mjs';
import { stampDeclaredAssignment } from './assignment-normalizer.mjs';
import { extractProtocolOperationStamp, normalizeSavedPolicyTier, resolveMutatingCwdPosture } from './execution-contract.mjs';
import {
  acquireRunControl,
  releaseRunControl,
  isRunControlCurrent,
  publishMarkerOnce,
  fsyncFileBestEffort,
  buildRunControlHolder,
} from '../../run-supervisor/run-lock.mjs';
import { admitRunAttempt, isSupervisedAttemptStillWorking } from './run-admission.mjs';
import { resolveExecutorCommand, currentDispatchDepth, MAX_DISPATCH_DEPTH, DispatchError, agentArgsWithoutPrompt } from './transport.mjs';
import {
  acquireAttemptLocks,
  attemptGateCommand,
  withIdentityEnv,
  prepareAttemptFiles,
  terminalSocketPath,
  attemptStepEnv as attemptStepEnvOf,
  awaitSettledResult,
  buildEnvelope,
  readLaunchSettings,
  resolveAttemptHost,
  startSupervisor,
  waitForBinding,
  removeAttemptIntent,
  writeAttemptFiles,
  writeAttemptIntent,
  writeSettleContext,
} from '../../run-supervisor/direct-launch.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { register as registerDeliveredAttempt, unregister as unregisterDeliveredAttempt, beginLaunch as beginAttemptLaunch, endLaunch as endAttemptLaunch } from '../../run-supervisor/cancel-registry.mjs';
import { watchWritesOutsideWorkspace } from '../../run-supervisor/stray-writes.mjs';
import { prepareTerminalAttempt, followPaneScreen, withoutPaneEnv, PANE_IDLE_TIMEOUT_MS, ORPHAN_SETTLE_MS } from './herdr-round.mjs';
import { resolveHerdrBin, workLabelOf } from './terminal-slot.mjs';
import { retainFailedPaneMsOf } from '../../terminal-control/config.mjs';
import { finalizeAttemptHome, prepareConfinementForLaunch } from './confinement/authority.mjs';
import { CREDENTIAL_HOME_KEPT } from './confinement/cleanup.mjs';
import { buildConfinementRequest } from './confinement/request.mjs';
import { resolvePosture } from './confinement/policies.mjs';
import { sha256FileSync } from '../../native/proof-helpers.mjs';
import {
  publishImmutableProof,
  publishMutableProjection,
  computeSha256Digest,
} from '../../native/proof-helpers.mjs';
import {
  buildEffectiveExecutionContract,
  EFFECTIVE_EXECUTION_CONTRACT_FILE,
  readEffectiveExecutionContract,
} from './effective-execution-contract.mjs';
import {
  acquireNamedAccountLease,
  commandCli,
  credentialSourceForCli,
  credentialStoreOf,
  defaultProviderCapacityRuntimeDir,
  hasProviderAccounts,
  probeQuarantinedAccounts,
  redactProviderCapacitySelection,
  releaseProviderAccountLease,
} from './provider-capacity.mjs';

export {
  buildEffectiveExecutionContract,
  EFFECTIVE_EXECUTION_CONTRACT_FILE,
  readEffectiveExecutionContract,
};

// The `mutation` the normalizer would stamp for this role/operation pair, for an assignment.json written
// without one: derived from assignment-normalizer.mjs itself, never a second hand-kept table.
function fallbackMutationForAssignment(asgn) {
  const operation = asgn?.operation;
  if (typeof operation !== 'string' || !operation) return undefined;
  try {
    return stampDeclaredAssignment({ role: asgn?.role, operation }).mutation;
  } catch {
    return undefined;
  }
}

/**
 * The login stores a launch of `executorId` may read, before the invocation is settled: the store key of the
 * pinned invocation when the caller pinned one, else of the executor's `cli` invocations in declaration
 * order (the first is the one an unpinned launch takes). An invocation that declares no store is keyed by
 * its command's CLI. Used to pick an account's per-CLI login store for the lazy probe and for
 * refresh-ahead; the launch itself takes the store its invocation reads.
 */
const storeKeyOf = (invocation) => credentialStoreOf(invocation)?.use ?? commandCli(invocation?.command);

function launchCandidateClis(cfg, executorId, pinnedInvocationId) {
  const entry = cfg?.executors?.[executorId] ?? cfg?.executor;
  const invocations = Array.isArray(entry?.invocations) ? entry.invocations.filter((inv) => inv?.via === 'cli') : [];
  if (pinnedInvocationId) {
    const pinned = invocations.find((inv) => inv.id === pinnedInvocationId);
    if (pinned?.command) return [storeKeyOf(pinned)];
  }
  const keys = invocations.length > 0 ? invocations.map(storeKeyOf) : [storeKeyOf(entry)];
  return [...new Set(keys.filter(Boolean))];
}

/**
 * The login store a launch of `executorId` declares: that of the pinned invocation, else of the first
 * `cli` invocation. Null when the invocation declares none, so a launch that reads no store leases any
 * account of its pool.
 */
function declaredStoreCli(cfg, executorId, pinnedInvocationId) {
  const entry = cfg?.executors?.[executorId] ?? cfg?.executor;
  const invocations = Array.isArray(entry?.invocations) ? entry.invocations.filter((inv) => inv?.via === 'cli') : [];
  const invocation = pinnedInvocationId ? invocations.find((inv) => inv.id === pinnedInvocationId) : invocations[0];
  return invocation ? (credentialStoreOf({ ...invocation, command: invocation.command ?? entry.command })?.use ?? null) : null;
}

/** The existence and sha256 of each file dirty before the launch, so a later change to one is seen. */
export function snapshotDirtyBeforeFiles(dir, dirtyBefore) {
  const snapshots = new Map();
  if (!dir || !Array.isArray(dirtyBefore)) return snapshots;
  for (const relPath of dirtyBefore) {
    const fullPath = path.join(dir, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        snapshots.set(relPath, { hash: sha256FileSync(fullPath), exists: true });
      } else {
        snapshots.set(relPath, { hash: null, exists: false });
      }
    } catch {}
  }
  return snapshots;
}

/**
 * Fail-closed gate PLUS mistake-proofing for an inline mutating
 * Assignment, whichever caller reaches `executeAssignment`.
 *
 * Trust boundary: a caller able to `import` these modules and write under `.fgos/` is in the same trust
 * class as the user who invoked it (`docs/platform/runner/contracts/routing-handoff.md`), so this is
 * mistake-proofing, not authentication. It stops an accidental in-process caller that imports
 * `buildAssignment`/`executeAssignment` without the mediated dispatch door from mutating real files with no
 * interlock. Two independent conditions, both required:
 *
 * 1. The caller asserts `opts.isReadOnlyMode === false` explicitly; an omitted or truthy flag is refused.
 * 2. A unit-run assignment runs in its unit's linked worktree (never the main checkout) and carries the
 *    binding bind() produced, which is replayed from the committed config and must match. An inline
 *    assignment claiming the retired protocol-operation stamp, or with no unit-run gate, is refused.
 *
 * Scoped to inline and unit-run assignments; a declared assignment's mutation posture is
 * `classifyDeclaredMutation` (assignment-normalizer.mjs).
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

  // The protocol-operation stamp path is retired: a claim of it is refused.
  const stamp = extractProtocolOperationStamp(asgn.provenance?.inline?.contract?.constraints);
  if (stamp) {
    throw new RunnerConfigError(
      `executeAssignment: mutating inline assignment "${asgn.assignmentId}" claims protocol-operation stamp for definition "${stamp.definitionId}", but CoordinationProtocol engine has been retired`,
    );
  }

  // A unit run's mutating gate: its worktree and its replayed binding.
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

    // Fail closed: a mutating unit-run assignment must carry the binding that
    // bind() produced for it. Without one there is nothing to compare, and an
    // assignment could pin any executor through `policy.preferExecutor`.
    const asgnBinding = asgn.binding || asgn.provenance?.binding;
    if (!asgnBinding) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" carries no binding -- refused`,
      );
    }

    // Replay: what the seat was bound from is read back from the record, and stage 1 is recomputed from
    // the committed config (the caller's live one, else the project's on disk) -- never from a copy kept in
    // unit.json, which a worker can write. A config that changed since the bind (its digest differs from the
    // one the bind recorded) refuses the write.
    const seat = seatIdOf(asgn);
    const recorded = (unitRecord.bindings?.[`${seat}/${asgn.round}`] ?? []).find((attempt) => attempt?.assignmentId === asgn.assignmentId);
    const boundDigest = recorded?.binding?.bindingInput?.configDigest;
    if (!boundDigest) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" has no recorded binding input to replay -- refused`,
        { code: 'binding-replay-snapshot-missing' },
      );
    }
    const committed = opts.committedRunnerConfig ?? loadRunnerConfigForDir(root);
    if (seatConfigDigestOf(committed).digest !== boundDigest) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" was bound under a different seat config than the committed one -- refused`,
        { code: 'binding-replay-config-mismatch' },
      );
    }
    const recomputed = bind(
      {
        unit: unitRecord.unit,
        ...bindSeatOf(unitRecord, seat),
        readOnly: false,
        overrides: unitRecord.overrides || [],
      },
      { runnerConfig: committed, session: opts.session || {} },
      { walk: walkStateOf(unitRecord, { seat, round: asgn.round, assignmentId: asgn.assignmentId }) },
    );

    if (recomputed.refused) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" recomputed binding refused: ${recomputed.refused.reason} (${recomputed.refused.detail})`,
      );
    }

    if (
      recomputed.executor !== asgnBinding.executor ||
      (recomputed.pool ?? null) !== (asgnBinding.pool ?? null) ||
      recomputed.tier !== asgnBinding.tier ||
      (recomputed.reasoningEffort ?? null) !== (asgnBinding.reasoningEffort ?? null) ||
      recomputed.posture !== asgnBinding.posture
    ) {
      throw new RunnerConfigError(
        `executeAssignment: mutating unit-run assignment "${asgn.assignmentId}" binding mismatch: recomputed { executor: "${recomputed.executor}", pool: "${recomputed.pool ?? ''}", tier: "${recomputed.tier}", effort: "${recomputed.reasoningEffort ?? ''}", posture: "${recomputed.posture}" } does not match assignment { executor: "${asgnBinding.executor}", pool: "${asgnBinding.pool ?? ''}", tier: "${asgnBinding.tier}", effort: "${asgnBinding.reasoningEffort ?? ''}", posture: "${asgnBinding.posture}" } -- refused`,
      );
    }
    const pinnedExecutor = asgn.policy?.preferExecutor ?? launchPinOf(opts).executor;
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

  // An inline Assignment carries no domain, stage or operation, so the declared-operation check is skipped for it.
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
    const matchedOp = Array.isArray(opts.operations) ? opts.operations.find((o) => o.id === asgn.operation) : undefined;
    if (matchedOp?.dispatch === 'human-only') {
      throw new RunnerConfigError(`cannot execute human-only operation "${asgn.operation}" via cli-spawn`);
    }
  }
  if (asgn.dispatch === 'human-only') {
    throw new RunnerConfigError(`cannot execute human-only operation "${asgn.operation}" via cli-spawn`);
  }
  // A caller that requires strictly read-only execution (`opts.isReadOnlyMode`) refuses a mutating Assignment;
  // read-only status comes solely from the stamped `mutation`. Runs for declared and inline Assignments alike.
  const requireReadOnly = Boolean(opts.isReadOnlyMode);
  if (requireReadOnly && !isReadOnlyAssignment(asgn)) {
    throw new RunnerConfigError(
      `cannot execute mutating operation "${asgn.operation}" (role: "${asgn.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
  }

  // Checked where mutation is honored, whatever `opts.isReadOnlyMode` says (a direct caller controls `opts`).
  assertInlineMutatingAssignmentAuthorized(asgn, opts);
}

/** The CLIs whose screens the terminal adapters of the agent protocol know. */
const TERMINAL_CLIS = new Set(['claude', 'codex', 'agy', 'pi', 'omp']);

/**
 * The argv an interactive agent starts with in a pane: the executor's own args without the prompt (the
 * supervisor types the brief at the prompt instead), the read access to the run directory a claude seat
 * needs to open the brief, and -- for codex, whose shell commands run under a shared daemon that does not
 * inherit the pane's environment -- the attempt's writer id as an explicit setting.
 */
export function terminalAgentArgs({ resolvedCmd, prompt, model, runDir, writerId, caseContext = null }) {
  const args = withRunDirReadAccess({
    adapter: 'herdr-spawn',
    interactiveMode: resolvedCmd.interactiveMode,
    args: agentArgsWithoutPrompt({ argsTemplate: resolvedCmd.argsTemplate, args: resolvedCmd.args, prompt, model }),
    runDir,
  });
  // The case the attempt was admitted into travels beside the writer id: a codex shell command does not
  // get the pane's environment, so the nested `fgos` call would otherwise carry no case at all.
  const settings = [`FGOS_SESSION_ID="${writerId}"`, ...(caseContext ? [`${CASE_ID_ENV}="${caseContext.caseId}"`, `${CASE_RESERVATION_ENV}="${caseContext.reservationId}"`] : [])];
  return commandCli(resolvedCmd.command) === 'codex'
    ? [...args, '-c', `shell_environment_policy.set={${settings.join(',')}}`]
    : args;
}

// The seat a unit-run assignment fills: a unit running a Work step operation stamps the
// operation's role on the assignment and keeps the seat's own id in provenance.
function seatIdOf(asgn) {
  return asgn.provenance?.kind === 'unit-run' ? (asgn.provenance.seat ?? asgn.role) : asgn.role;
}

/**
 * Give back the provider account lease a Run selected. A failure is reported and never thrown: the
 * caller is already settling or refusing, its own outcome must not be replaced, and a lease left
 * behind is reclaimed once its Run is dead. It is still said aloud instead of swallowed.
 */
function releaseSelectedProviderLease(selection, runId, runtimeDir) {
  try {
    releaseProviderAccountLease({ provider: selection.provider, accountId: selection.accountId, runId, runtimeDir });
  } catch (err) {
    process.stderr.write(`fgos: could not release the provider lease of ${selection.provider}/${selection.accountId} for ${runId}: ${err?.message ?? err}\n`);
  }
}

/** Real paths of the main checkout and of every worktree git lists for it. */
function allowedInputRoots(mainRoot) {
  const roots = new Set();
  const add = (p) => { try { roots.add(fs.realpathSync(p)); } catch { /* a listed root that is gone holds nothing */ } };
  add(mainRoot);
  try {
    const inspect = createGitInspect(gitPortOptions(mainRoot));
    for (const entry of inspectEntries((page) => inspect.listWorktrees(page))) {
      const listed = inspectPath(entry.path);
      // A listed path that is now a symlink is not that worktree any more.
      try { if (fs.lstatSync(listed).isSymbolicLink()) continue; } catch { continue; }
      add(listed);
    }
  } catch { /* no git: only the main checkout is allowed */ }
  return [...roots];
}

/**
 * Hash each pinned input before the worker starts. An input is read only when its real path
 * lies inside the main checkout or a worktree git lists for it; anything else (outside, a
 * symlink pointing out, missing) is recorded with `sha256: null` and never read. `rel` is the
 * path inside the root that holds it, so a consumer compares the same file across checkouts.
 *
 * @param {string[]|undefined} pinInputs absolute paths
 * @param {string} mainRoot main checkout root
 * @returns {Array<{path: string, root?: string, rel?: string, sha256: string|null, warning?: string}>}
 */
export function digestPinnedInputs(pinInputs, mainRoot) {
  if (!Array.isArray(pinInputs) || pinInputs.length === 0) return [];
  const roots = allowedInputRoots(mainRoot);
  return pinInputs.map((p) => {
    let real;
    try { real = fs.realpathSync(p); } catch { return { path: p, sha256: null, warning: 'pin-missing' }; }
    // The innermost root that holds it: a worktree may sit inside the main checkout.
    const root = roots
      .filter((r) => real === r || real.startsWith(`${r}${path.sep}`))
      .sort((a, b) => b.length - a.length)[0];
    if (!root) return { path: p, sha256: null, warning: 'pin-outside-allowed-roots' };
    const rel = path.relative(root, real).split(path.sep).join('/');
    try {
      if (!fs.statSync(real).isFile()) return { path: p, root, rel, sha256: null, warning: 'pin-not-a-file' };
      return { path: p, root, rel, sha256: crypto.createHash('sha256').update(fs.readFileSync(real)).digest('hex') };
    } catch {
      return { path: p, root, rel, sha256: null, warning: 'pin-unreadable' };
    }
  });
}

/**
 * An extensible copy of a settled result that keeps its accessors (`status`, `confidence`) and
 * non-enumerable links (`runResult`), which an object spread would drop.
 */
function unfrozenCopy(result) {
  const descriptors = Object.getOwnPropertyDescriptors(result);
  for (const descriptor of Object.values(descriptors)) {
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
  }
  return Object.create(Object.getPrototypeOf(result), descriptors);
}

/**
 * Give back the private homes of an attempt that never reached its supervisor, through the door the
 * finalize-home step uses (a renewed login is staged first). False when a home stays for a retry (its login is
 * not staged yet) or cannot be judged: the intent then stays, so the adopt door's finalize-home step retries it.
 */
function giveBackAttemptHome(runDir, attemptId) {
  try {
    return finalizeAttemptHome({ runDir: path.resolve(runDir), attemptId }).state !== CREDENTIAL_HOME_KEPT;
  } catch (err) {
    process.stderr.write(`fgos: private home of attempt ${attemptId} not given back (${err.message})\n`);
    return false;
  }
}

/**
 * The Assignment this Run executes: `assignment.json` under `assignmentDir` is its immutable input. A first
 * call publishes it atomically (template provenance resolved first, so the file on disk carries it); a later
 * call, or one that lost the publish race, reads it back and fails hard when it cannot be read or parsed
 * rather than run a different assignment from memory. `mutation` is backfilled on a record written without it,
 * from the normalizer's own rule, and the result is checked again before its template is rendered.
 */
function loadImmutableAssignment(assignment, { assignmentDir, cwd, opts }) {
  const assignmentJsonPath = path.join(assignmentDir, 'assignment.json');
  let loaded = assignment;
  let published = false;
  if (!fs.existsSync(assignmentJsonPath)) {
    if (assignment.contractTemplate && !assignment.provenance?.template?.templateSnapshot) {
      const initialResolution = resolveAndRenderOperationPrompt(assignment, { cwd, domain: assignment.domain });
      loaded = Object.freeze({
        ...assignment,
        provenance: Object.freeze({ ...(assignment.provenance || {}), template: initialResolution.templateProvenance }),
      });
    }
    // Atomic publish (fsynced temp + exclusive hard link): a crash mid-write never leaves a partial file that
    // would brick this Assignment id. `false` means a concurrent writer won: read its file back below.
    published = publishImmutableProof(assignmentJsonPath, loaded);
  }
  if (!published) {
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
      loaded = Object.freeze(
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

  const effectiveMutation = loaded.mutation === 'read-only' || loaded.mutation === 'mutating'
    ? loaded.mutation
    : fallbackMutationForAssignment(loaded);
  let effectiveAssignment = Object.freeze({ ...loaded, mutation: effectiveMutation });

  validateAssignmentLegality(effectiveAssignment, opts);

  let templateResolution = null;
  if (effectiveAssignment.contractTemplate) {
    templateResolution = resolveAndRenderOperationPrompt(effectiveAssignment, { cwd, domain: effectiveAssignment.domain });
    effectiveAssignment = Object.freeze({
      ...effectiveAssignment,
      provenance: Object.freeze({ ...(effectiveAssignment.provenance || {}), template: templateResolution.templateProvenance }),
    });
  }
  return { effectiveAssignment, effectiveMutation, templateResolution };
}

/**
 * Lease the provider account the binding named for this attempt, when the executor's provider keeps accounts
 * (an out-of-process agent executor). A seat bound to a pool leases from that pool; otherwise the provider
 * family, normalized ('openai' and 'openai-codex' are one inventory). Only an account that holds a login store
 * for the store the launch reads is leased. A relaunched resumed Run leases again like a fresh dispatch.
 *
 * A lease that throws (lock contention, a corrupt state file) is a refusal, never an escape: the Run is already
 * admitted as `running` and the caller settles the refusal. A selected lease is recorded as the Run's
 * provider-capacity evidence (`credentialProvisioned` false until confinement provisions it).
 *
 * @returns {Promise<{ provider?: string, selection: object|null, evidence: object|null }>}
 */
async function leaseAccountForAttempt({ cfg, opts, compiledPlan, effectivePolicy, executorId, pinnedInvocationId, assignmentsDir, assignmentId, runId, runDir, repoRoot }) {
  const pin = launchPinOf(opts);
  const boundPool = pin.pool && pin.executor === executorId ? pin.pool : null;
  const provider = boundPool
    ? legacyStateKey(boundPool)
    : legacyStateKey(effectivePolicy.providerModel || familyOf(cfg.executors?.[executorId] ?? cfg.executor));
  const leaseCli = declaredStoreCli(cfg, executorId, pinnedInvocationId);
  if (compiledPlan.mechanism !== 'out-of-process' || cfg.executors?.[executorId]?.kind === 'tool' || !hasProviderAccounts(cfg, provider)) {
    return { provider, selection: null, evidence: null };
  }
  // When no account of the provider is usable only because a login died, one real call may show the owner
  // has logged in again. A probe problem never blocks the dispatch: the selection decides.
  if (typeof opts.providerCredentialProbe === 'function') {
    try {
      await probeQuarantinedAccounts({
        runnerConfig: cfg,
        provider,
        runtimeDir: opts.providerCapacityRuntimeDir,
        probe: opts.providerCredentialProbe,
        cli: launchCandidateClis(cfg, executorId, pinnedInvocationId)[0] ?? null,
      });
    } catch { /* the selection below reports what is unusable */ }
  }
  // The lease reclaim sees only the runner that took a lease die; the Run's supervisor and agent outlive it.
  // The `run_<assignmentId>_<NN>` id admission gives a Run maps a lease back to its run directory, so
  // provider-capacity.mjs need not know this layout.
  const isRunWorkerAlive = opts.providerCapacityIsRunWorkerAlive ?? ((leasedRunId, heldLease) => {
    if (!heldLease?.assignmentId || typeof leasedRunId !== 'string') return false;
    const prefix = `run_${heldLease.assignmentId}_`;
    if (!leasedRunId.startsWith(prefix)) return false;
    return isSupervisedAttemptStillWorking(path.join(assignmentsDir, heldLease.assignmentId, 'runs', leasedRunId.slice(prefix.length)));
  });
  let selection;
  try {
    // The account is named by the binding (Seat Binding ranked it); the lease only takes it. A launch with no
    // binding names none and cannot lease.
    selection = pin.leaseAccount
      ? acquireNamedAccountLease({
        runnerConfig: cfg,
        provider,
        accountId: pin.leaseAccount,
        accountViewDigest: pin.accountViewDigest,
        assignmentId,
        runId,
        runtimeDir: opts.providerCapacityRuntimeDir,
        runIsDead: opts.providerCapacityRunIsDead,
        isRunWorkerAlive,
        cli: leaseCli,
      })
      : { status: 'refused', provider, reason: 'provider-capacity.no-named-account', detail: 'the launch names no account to lease (it carries no binding)' };
  } catch (err) {
    selection = {
      status: 'refused',
      provider,
      reason: err.code === 'provider-capacity-lock-stale' ? 'provider-capacity.lock-stale' : 'provider-capacity.acquire-failed',
      cause: err.message,
    };
  }
  if (selection?.status !== 'selected') return { provider, selection, evidence: null };

  const evidence = { ...redactProviderCapacitySelection(selection), credentialProvisioned: false };
  const selectionPath = path.join(runDir, 'provider-capacity-selection.json');
  fs.writeFileSync(selectionPath, `${JSON.stringify(evidence, null, 2)}\n`);
  fsyncFileBestEffort(selectionPath);
  const runJsonPath = path.join(runDir, 'run.json');
  try {
    const runJson = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
    fs.writeFileSync(runJsonPath, `${JSON.stringify({ ...runJson, providerCapacitySelectionPath: path.relative(repoRoot, selectionPath) }, null, 2)}\n`);
    fsyncFileBestEffort(runJsonPath);
  } catch { /* the selection file itself is the evidence; run.json only points at it */ }
  return { provider, selection, evidence };
}

/**
 * The one attempt this controller launches: what it owns until the handover (the attempt locks, the pane of a
 * terminal attempt, the provider lease, its run control) and how far it got. `closeAttempt` reads only this.
 */
function openAttempt({ runDir, runId, attemptId, unitRunId, terminal, cwd, host, stepEnv, custody, leaseRuntimeDir }) {
  return {
    runDir,
    runId,
    attemptId,
    unitRunId,
    terminal,
    cwd,
    host,
    stepEnv,
    custody,
    leaseRuntimeDir,
    // The unit's cwd lease stays with its controller across attempts and commit; standalone Assignments own the
    // same lease until their settled handoff. Only the attempt copy closes at supervisor binding.
    locks: null,
    // The provider account lease, when one was selected.
    lease: null,
    // Set once a terminal attempt has its pane; until the handover it is this controller's to give back.
    terminalPrep: null,
    // This controller's run control `{ controlEpoch, controlToken }`, taken once the run is known to launch.
    control: null,
    intentWritten: false,
    intentNamesPane: false,
    // Set once the supervisor owns the attempt: from then on the run control token belongs to its settle step
    // and this controller no longer releases it unless it saw the result.
    handedOver: false,
    settled: false,
    result: undefined,
  };
}

/** The attempt intent, only ever under the attempt lock; a terminal attempt publishes it again with its pane before allocating it. */
function publishAttemptIntent(attempt, pane = null) {
  writeAttemptIntent({
    runDir: path.resolve(attempt.runDir),
    attemptId: attempt.attemptId,
    unitRunId: attempt.unitRunId,
    terminal: attempt.terminal,
    cwd: attempt.cwd,
    host: attempt.host,
    stepEnv: attempt.stepEnv,
    pane,
  });
  attempt.intentWritten = true;
  attempt.intentNamesPane = pane !== null;
}

/**
 * What a resumed Run already has, so a resume never launches a second worker over it: its settled result, or a
 * refusal by name when that result is unreadable, when the adopt door judges its supervised attempt not
 * settled, or when it carries a launch record from before the run supervisor. Null when nothing was launched.
 */
function resumedRunOutcome(runDir, runId) {
  if (fs.existsSync(path.join(runDir, 'result.json'))) {
    // A result that cannot be read soundly (torn write, failed validation, contract-corrupt) is not "no result
    // yet": a human or recovery door decides next.
    const settledResult = readSettledResult(runDir, runId);
    if (!settledResult) {
      throw new RunnerConfigError(
        `executeAssignment: Run "${runId}" resume found an existing result.json that failed validation, failed to parse or is contract-corrupt -- refusing to relaunch over corrupt settlement evidence`,
        { code: 'result-corrupt', phase: 'post-admission' },
      );
    }
    return Object.freeze(settledResult);
  }
  if (fs.existsSync(path.join(runDir, 'envelope.json'))) {
    let judged;
    try {
      judged = adoptRun(runDir);
    } catch (err) {
      throw new RunnerConfigError(
        `executeAssignment: Run "${runId}" resume could not ask the adopt door about its attempt (${err.message})`,
        { code: 'run-unreconciled', phase: 'post-admission' },
      );
    }
    const settledAttempt = readSettledResult(runDir, runId);
    if (settledAttempt) return settledAttempt;
    const live = judged.state === 'running' || judged.state === 'being-adopted' || judged.state === 'held';
    throw new RunnerConfigError(
      `executeAssignment: Run "${runId}" resume found its attempt in state "${judged.state}"${judged.reason ? ` (${judged.reason})` : ''} -- refusing to launch a second worker over it`,
      { code: live ? 'run-in-flight' : 'run-unreconciled', phase: 'post-admission', reconcileStatus: judged.state, ...(judged.reason ? { reconcileReason: judged.reason } : {}) },
    );
  }
  if (fs.existsSync(path.join(runDir, 'controller', 'commands'))) {
    throw new RunnerConfigError(
      `executeAssignment: Run "${runId}" resume found a launch record from before the run supervisor -- refusing to launch a second worker over it`,
      { code: 'run-unreconciled', phase: 'post-admission', reconcileReason: 'legacy-run' },
    );
  }
  return null;
}

/**
 * The lease as the launch carries it. Opted in with a renewal function, a login close to expiry is renewed once,
 * in a copy fgOS holds, and applied to the account's real store before the private home is copied from it (so
 * no pane renews in a throwaway copy and uses up the source's single-use refresh token); the lease then carries
 * the write-back opt-in, so a home whose login a pane renewed anyway is offered back to the source. Only a
 * confined launch copies a login, and which invocation is confined is settled later, so any executor that can
 * be confined (by posture, executor config or a confined invocation) counts. Renewal never blocks the dispatch.
 */
async function renewLeasedLogin(selection, { cfg, opts, executorId, pinnedInvocationId, confinementRequirement }) {
  const launchExecutor = cfg.executors?.[executorId] ?? cfg.executor;
  const isConfined = (entry) => entry?.confinement && typeof entry.confinement === 'object' && Object.keys(entry.confinement).length > 0;
  const mayCopyCredential = confinementRequirement.mode !== 'unconfined'
    || isConfined(launchExecutor)
    || (Array.isArray(launchExecutor?.invocations) && launchExecutor.invocations.some(isConfined));
  if (typeof opts.providerCredentialRenew !== 'function' || selection?.status !== 'selected' || !mayCopyCredential) return selection;
  const credentialRuntimeDir = opts.providerCapacityRuntimeDir ?? defaultProviderCapacityRuntimeDir();
  // An account with one login store per CLI renews the store of each CLI this launch may still run.
  const renewSources = selection.credentialSources
    ? launchCandidateClis(cfg, executorId, pinnedInvocationId).map((cli) => credentialSourceForCli(selection, cli)).filter(Boolean)
    : [selection.credentialSource];
  for (const credentialSource of renewSources) {
    try {
      const renewal = await opts.providerCredentialRenew({
        provider: selection.provider,
        accountId: selection.accountId,
        credentialSource,
        runtimeDir: credentialRuntimeDir,
      });
      // Anything but "nothing was due" is visible, so a renewal that keeps failing is not mistaken for success.
      const quiet = renewal?.status === 'fresh' || (renewal?.status === 'skipped' && renewal?.reason === 'unsupported-layout');
      if (renewal && !quiet) {
        const store = credentialSource?.cli ? ` (${credentialSource.cli})` : '';
        process.stderr.write(`fgos: credential refresh-ahead for ${selection.provider}/${selection.accountId}${store}: ${renewal.status} (${renewal.reason})\n`);
      }
    } catch { /* the launch goes on with the login as it is */ }
  }
  return { ...selection, credentialWriteBack: { runtimeDir: credentialRuntimeDir } };
}

/** Publish the Evaluator Baseline (dirty files with their hashes, HEAD) before launch; returns its digest. */
function publishEvaluatorBaseline({ runDir, runId, assignmentId, cwd, gitBefore, dirtyBefore, dirtyBeforeSnapshots }) {
  const snapshotsObj = {};
  for (const [p, snap] of dirtyBeforeSnapshots.entries()) {
    snapshotsObj[p] = { exists: snap.exists, sha256: snap.hash };
  }
  const baselineBody = {
    contract: 'evaluator-baseline.v1',
    runId,
    assignmentId,
    cwd,
    gitBefore,
    gitBeforeSource: 'pre-launch',
    dirtyBefore,
    dirtyBeforeSnapshots: snapshotsObj,
    capturedAt: new Date().toISOString(),
  };
  const digest = computeSha256Digest(baselineBody);
  publishImmutableProof(path.join(runDir, 'controller', 'evaluator-baseline.json'), { ...baselineBody, digest });
  return digest;
}

/**
 * Everything the supervisor needs, prepared before the handover: the renewed lease, the evaluator baseline, the
 * resolved command, the confinement the Authority prepared, a terminal attempt's pane, the immutable envelope
 * with its secret side file and the context the settle step reads. Returns the written envelope and the launch
 * settings `awaitBinding` waits by.
 */
async function buildLaunch(attempt, ctx) {
  const { cfg, opts, root, fgosDir, assignment, compiledPlan, effectivePolicy, executorId, timeoutMs, prompt } = ctx;
  const { runDir, runId, attemptId, cwd } = attempt;
  const attemptRunDir = path.resolve(runDir);
  const { controlEpoch, controlToken } = attempt.control;
  const providerCapacityForLaunch = await renewLeasedLogin(attempt.lease, ctx);

  const attemptSettings = readLaunchSettings(root);
  // The main checkout as it is before the agent starts: what is dirty outside the workspace afterwards
  // and was not before is reported on the result.
  const strayWatch = watchWritesOutsideWorkspace({ repoRoot: root, cwd });
  const depth = currentDispatchDepth();
  if (depth >= MAX_DISPATCH_DEPTH) {
    throw new DispatchError(
      'dispatch-depth-exceeded',
      `executor dispatch refused: current dispatch depth (${depth}) has reached MAX_DISPATCH_DEPTH (${MAX_DISPATCH_DEPTH}) -- prevent runaway nested dispatch.`,
      { depth, maxDepth: MAX_DISPATCH_DEPTH, workId: assignment?.workId },
    );
  }
  const baselineDigest = publishEvaluatorBaseline({
    runDir, runId, assignmentId: assignment.assignmentId, cwd,
    gitBefore: ctx.gitBefore, dirtyBefore: ctx.dirtyBefore, dirtyBeforeSnapshots: ctx.dirtyBeforeSnapshots,
  });
  const assignmentLaunchContext = {
    contract: 'assignment-cli-spawn-launch-context.v1',
    run: {
      runId,
      assignmentId: assignment.assignmentId,
      attempt: ctx.attemptNum,
      dispatchPlanDigest: ctx.dispatchPlanDigest,
      evaluatorBaselineDigest: baselineDigest,
    },
    command: { launchCommandId: attemptId, controlEpoch, controlTokenDigest: computeSha256Digest(controlToken) },
  };

  let resolvedCmd = resolveExecutorCommand(cfg, {
    prompt,
    model: effectivePolicy.model,
    requestedModel: launchPinOf(opts).model,
    reasoningEffort: effectivePolicy.reasoningEffort,
    tier: effectivePolicy.tier,
    executorId,
    fgosDir,
    attestRoot: cwd,
    // An explicit caller pin names the invocation; otherwise the executor's own choice stands.
    invocationId: ctx.pinnedInvocationId ?? undefined,
  });
  // Admitted into a case: the worker's own environment names it, from this admission and no other.
  if (opts.caseContext) resolvedCmd = { ...resolvedCmd, env: { ...resolvedCmd.env, ...caseContextEnv(opts.caseContext) } };

  // The attempt's writer id is a pure function of its id, so a resume of the attempt sees the same one.
  // `parentWriterId` is the controller's own, so a writer can be traced from the agent back to it.
  const attemptWriterId = mintAttemptWriterId(attemptId);
  let parentWriterId = null;
  try { parentWriterId = String(resolveWriterIdentity(fgosDir).id); } catch { /* no controller identity: the lineage stays empty */ }
  const attemptIdentity = { writerId: attemptWriterId, parentWriterId };
  const terminalSocket = attempt.terminal ? terminalSocketPath(attemptId) : null;
  const attemptArgs = attempt.terminal
    ? terminalAgentArgs({ resolvedCmd, prompt, model: effectivePolicy.model, runDir: attemptRunDir, writerId: attemptWriterId, caseContext: opts.caseContext ?? null })
    : resolvedCmd.args;

  const prepResult = await prepareConfinementForLaunch(buildConfinementRequest({
    capability: compiledPlan.capability || 'code:implement',
    stageSkill: executorId,
    executorId,
    cfg,
    assignmentLaunchContext,
    invocation: {
      command: resolvedCmd.command,
      args: attemptArgs,
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
      credentialStore: resolvedCmd.credentialStore,
    },
    providerCapacity: providerCapacityForLaunch,
    ...(opts.blind === true ? { blind: true } : {}),
    context: {
      cwd,
      ...(opts.blind === true ? { contextRefs: assignment.contextRefs } : {}),
      // A workspace-write posture grants the directory the work happens in (the Unit worktree), never the main
      // checkout that holds fgOS state.
      repoRoot: ctx.postureBinding?.posture === 'workspace-write' ? cwd : root,
      runDir: attemptRunDir,
      fgosDir,
      timeoutMs,
      idleTimeoutMs: cfg.idleTimeoutMs,
      maxBuffer: cfg.maxBuffer,
      onChunk: opts.onChunk,
      workId: executorId,
      tier: effectivePolicy.tier,
      model: effectivePolicy.model,
      dispatchBatchKey: ctx.dispatchBatchKey,
      controlToken,
      controlEpoch,
      launchCommandId: attemptId,
    },
    requirement: ctx.confinementRequirement,
    attemptId,
    launchMode: attempt.terminal ? 'terminal' : 'direct',
    gateCommand: attemptGateCommand(attempt.host.hostBin, runDir, { goSocket: terminalSocket }),
    attemptBinds: prepareAttemptFiles(runDir, attemptId),
  }), { adapterPort: opts.adapterPort });

  let providerCapacityEvidence = ctx.providerCapacityEvidence;
  if (providerCapacityEvidence && prepResult?.providerCapacity?.credentialProvisioned === true) {
    providerCapacityEvidence = { ...providerCapacityEvidence, credentialProvisioned: true };
    const selectionPath = path.join(runDir, 'provider-capacity-selection.json');
    try {
      fs.writeFileSync(selectionPath, `${JSON.stringify(providerCapacityEvidence, null, 2)}\n`);
      fsyncFileBestEffort(selectionPath);
    } catch { /* the settle context below still carries the provisioned evidence */ }
  }

  // Persisted after Authority resolution, before the supervisor is spawned: a requested policy alone is not
  // enforcement evidence.
  const effectiveContract = buildEffectiveExecutionContract({
    ...ctx.contractInput,
    providerCapacity: providerCapacityEvidence,
    confinement: { requirement: prepResult.preparedInvocation.requirement, backend: prepResult.preparedInvocation.backend },
  });
  publishMutableProjection(path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE), effectiveContract);

  // A terminal attempt gets what only its controller can give before the supervisor exists: the brief on disk,
  // the pane the port allocates for the attempt's key, the folder-trust entry.
  if (attempt.terminal) {
    const interactive = resolvedCmd.interactiveMode ?? {};
    attempt.terminalPrep = await prepareTerminalAttempt({
      attemptId,
      runId,
      runDir,
      cwd,
      repoRoot: root,
      prompt,
      workId: executorId,
      tier: effectivePolicy.tier,
      model: effectivePolicy.model,
      herdrBin: resolveHerdrBin(opts.herdrBin),
      fullEnv: { ...workerBaseEnv(), ...resolveExecutorEnv(resolvedCmd.env) },
      attemptEnv: prepResult.attempt.secretEnv,
      confinement: resolvedCmd.confinement,
      permissionMode: resolvedCmd.permissionMode,
      agentKind: interactive.kind ?? path.basename(prepResult.attempt.command),
      delivery: opts.promptDelivery ?? process.env.FGOS_HERDR_PROMPT_DELIVERY?.trim() ?? resolvedCmd.promptDelivery ?? 'inline',
      trustStore: interactive.trustStore,
      trustAccountSource: providerCapacityForLaunch?.status === 'selected'
        ? (resolvedCmd.credentialStore ? credentialSourceForCli(providerCapacityForLaunch, resolvedCmd.credentialStore.use) : null) ?? null
        : null,
      dispatchBatchKey: ctx.dispatchBatchKey,
      dispatchBatchSize: opts.dispatchBatchSize,
      anchorPaneId: process.env.FGOS_HERDR_ANCHOR_PANE?.trim() || undefined,
      terminalConfig: opts.terminalConfig,
      workLabel: workLabelOf(assignment),
      beforeAllocate: attempt.intentWritten ? (pane) => publishAttemptIntent(attempt, pane) : undefined,
      // The persisted contract does not name the role; the brief a pane worker reads has to (an assessment
      // role must be told its claim needs assessment.verdict).
      effectiveContract: { ...effectiveContract, assignment: { role: assignment.role, posture: assignment.posture, operation: assignment.operation } },
    });
  }

  // The envelope, the secret side file and the context the settle step needs. The envelope is immutable from
  // here on; nothing the controller still learns changes what the attempt runs.
  const mutating = ctx.effectiveMutation === 'mutating';
  const envelopeBody = buildEnvelope({
    attemptId,
    unitRunId: attempt.unitRunId,
    runDir: attemptRunDir,
    host: attempt.host,
    cwd: prepResult.attempt.cwd,
    mutating: mutating && opts.forceSharedCwd !== true,
    attempt: attempt.terminal ? { ...prepResult.attempt, env: withoutPaneEnv(prepResult.attempt.env) } : prepResult.attempt,
    timeoutMs,
    idleTimeoutMs: attempt.terminal ? PANE_IDLE_TIMEOUT_MS : cfg.idleTimeoutMs,
    maxOutputBytes: cfg.maxBuffer || 10485760,
    cli: attempt.terminal && TERMINAL_CLIS.has(resolvedCmd.interactiveMode?.kind) ? resolvedCmd.interactiveMode.kind : commandCli(prepResult.attempt.command),
    stepEnv: attempt.stepEnv,
    gateKillGraceMs: attemptSettings.gateKillGraceMs,
    killWaitMs: attemptSettings.killWaitMs,
    identity: attemptIdentity,
    ...(attempt.terminal
      ? {
        terminal: {
          socketPath: terminalSocket,
          exitCommand: resolvedCmd.interactiveMode?.exitCommand ?? null,
          orphanSettleMs: ORPHAN_SETTLE_MS,
          retainFailedPaneMs: retainFailedPaneMsOf(root),
          briefPath: attempt.terminalPrep.briefPath,
          outboxDir: attempt.terminalPrep.outboxDir,
          groupKey: attempt.terminalPrep.slot.groupKey,
        },
        extraSteps: ['cleanup-trust'],
      }
      : {}),
    ...(mutating
      ? { cwdLeaseFile: attempt.locks.cwdLease.path, ...(process.platform === 'win32' ? { cwdLeaseOwner: attempt.locks.cwdLease.domainEndpoint() } : {}) }
      : {}),
  });
  publishMutableProjection(path.join(attemptRunDir, 'assignment.json'), assignment);
  writeSettleContext(attemptRunDir, {
    launchCommandId: attemptId,
    repoRoot: root,
    strayWatch: { repoRoot: root, cwd, before: strayWatch.before },
    resolvedExecutorId: executorId,
    effectivePolicy,
    reasoningEffort: resolvedCmd.reasoningEffort,
    modelCheck: resolvedCmd.modelCheck ?? null,
    providerCapacitySelection: attempt.lease,
    providerCapacityEvidence,
    inputDigests: ctx.inputDigests,
    providerCapacityRuntimeDir: opts.providerCapacityRuntimeDir ?? null,
  });
  const envelope = writeAttemptFiles({
    runDir: attemptRunDir,
    body: envelopeBody,
    // The side file is merged over the envelope's own environment, so the dispatcher's id the authority put in
    // it must not win over the attempt's.
    secretEnv: withIdentityEnv(attempt.terminal ? withoutPaneEnv(prepResult.attempt.secretEnv) : prepResult.attempt.secretEnv, attemptIdentity),
    controlEpoch,
    controlToken,
  });
  return { envelope, settings: attemptSettings };
}

/**
 * Hand the attempt to the supervisor and wait only for its binding, then read the answer the settle step
 * writes. Whatever the outcome, only the attempt copy of the locks closes here; the controller keeps cwd custody.
 */
async function awaitBinding(attempt, { envelope, settings, onChunk, timeoutMs }) {
  const { runDir, runId } = attempt;
  const attemptRunDir = path.resolve(runDir);
  let bound;
  let supervisor;
  // A Ctrl-C from here until the binding is known waits for the binding and then cancels the attempt; one that
  // came earlier refuses the launch (cancel-registry.mjs).
  beginAttemptLaunch(attemptRunDir);
  try {
    supervisor = startSupervisor({ envelope, locks: attempt.locks, stepEnv: attempt.stepEnv, extraEnv: attempt.terminalPrep?.endpointEnv });
    attempt.handedOver = true;
    if (process.platform === 'win32') attempt.locks.releaseAttempt();
    bound = await waitForBinding(attemptRunDir, supervisor.child);
    if (bound.state === 'bound') registerDeliveredAttempt(attemptRunDir);
  } finally {
    attempt.locks.releaseAttempt();
    endAttemptLaunch(attemptRunDir);
  }
  if (bound.state !== 'bound') {
    // The supervisor may have finished the attempt (or refused it) in the same breath: adopt judges what is on
    // disk. Without a settled answer the launch is unknown, never "not started".
    if (bound.state === 'exited') {
      try { adoptRun(attemptRunDir); } catch { /* adopt names its own failure */ }
      const early = readSettledResult(attemptRunDir, runId);
      if (early) return settledBy(attempt, early);
    }
    throw new RunnerConfigError(
      `executeAssignment: Run "${runId}" supervisor did not bind the attempt (${bound.state}${bound.exit != null ? `, exit ${bound.exit}` : ''}) -- the launch is unknown; see supervisor.log in the run directory`,
      { code: 'launch-unknown', phase: 'post-admission', launchState: bound.state },
    );
  }

  // From here the controller only reads: live output from the capture files, the answer from result.json that
  // the settle step writes after the receipt. A terminal attempt writes no capture files; what a person watching
  // this controller sees is the pane's screen, read only to show it. A Ctrl-C until the answer is read asks the
  // supervisor to cancel (registered with the binding above).
  let stopScreen = null;
  let settledResult;
  try {
    stopScreen = attempt.terminalPrep ? followPaneScreen({ tc: attempt.terminalPrep.tc, key: attempt.terminalPrep.slot.key, onChunk }) : null;
    settledResult = await awaitSettledResult({
      runDir: attemptRunDir,
      runId,
      child: supervisor.child,
      capture: envelope.launch.capture,
      onChunk,
      ceilingMs: timeoutMs + settings.gateKillGraceMs + 120_000,
      readSettledResult,
    });
  } finally {
    unregisterDeliveredAttempt(attemptRunDir);
    stopScreen?.();
  }
  if (!settledResult) {
    // A fresher controller took the run control over while the agent ran: the settle step refused to append (it
    // preserves its work product as result.superseded.json), and this controller says so by name.
    if (!isRunControlCurrent(runDir, attempt.control)) {
      throw new RunnerConfigError(
        `executeAssignment: control of Run "${runId}" was superseded while its attempt ran -- no settlement was appended`,
        { code: 'run-control-superseded', phase: 'post-admission' },
      );
    }
    throw new RunnerConfigError(
      `executeAssignment: Run "${runId}" has no settled result after its supervisor ended -- the adopt door owns it now`,
      { code: 'run-unreconciled', phase: 'post-admission' },
    );
  }
  return settledBy(attempt, settledResult);
}

/** Record the settled answer on the attempt and return the copy `closeAttempt` freezes after the custody handoff. */
function settledBy(attempt, settled) {
  attempt.settled = true;
  attempt.result = unfrozenCopy(settled);
  return attempt.result;
}

/**
 * Give back what the attempt still owns, whatever ended it. One order rule: what the launch made before the
 * handover (the pane, the private home) is given back first, still under the attempt lock, and only then may the
 * intent go; a controller killed in between leaves the intent, and the adopt door closes the attempt from it.
 * A supervised attempt that never produced its result is still the supervisor's (and, after it, the adopt
 * door's): its run control token and lease stay, the settle step and the lease reclaim use them.
 */
async function closeAttempt(attempt) {
  const { runDir, runId } = attempt;
  let homeGivenBack = true;
  if (!attempt.handedOver) {
    if (attempt.terminalPrep) await attempt.terminalPrep.abandon();
    if (attempt.locks) homeGivenBack = giveBackAttemptHome(runDir, attempt.attemptId);
  }
  if (attempt.locks) {
    try {
      // The pane was given back above (or never opened): an intent that still named it would have adopt wait
      // for a slot terminal-control may never have recorded.
      if (attempt.intentNamesPane && !attempt.handedOver) {
        try { publishAttemptIntent(attempt); } catch (err) { process.stderr.write(`fgos: attempt intent not replaced (${err.message})\n`); }
      }
      // A run that settled without ever writing an envelope (refused, or already answered) has nothing for the
      // adopt door to close, unless a private home of it is still kept.
      if (homeGivenBack && attempt.intentWritten && !fs.existsSync(path.join(runDir, 'envelope.json')) && readSettledResult(runDir, runId)) removeAttemptIntent(path.resolve(runDir));
      if (!attempt.custody && attempt.settled) recordCustodyHandoff(attempt.locks.cwdLease, attempt.result);
      if (attempt.result) Object.freeze(attempt.result);
    } finally { attempt.locks.release(); }
  }
  // Before the run control was taken the run was refused, settled or judged by the adopt door, which gave back
  // what they took.
  if (attempt.control) {
    const ownsRelease = !attempt.handedOver || attempt.settled;
    if (attempt.lease?.status === 'selected' && ownsRelease) releaseSelectedProviderLease(attempt.lease, runId, attempt.leaseRuntimeDir);
    if (ownsRelease) releaseRunControl(runDir, attempt.control);
  }
}

/**
 * Execute an assignment by dispatching a worker and recording the Run and its Run Result.
 *
 * @param {object} assignment Assignment object
 * @param {object} [opts] Options (`cwd`, `repoRoot`, `runnerConfig`, `binding`, `cliOverride`, `timeoutMs`, `isReadOnlyMode`, ...)
 * @returns {Promise<Readonly<object>>} Stored RunResult object
 */
export async function executeAssignment(assignment, opts = {}) {
  refuseWorkItemInput(opts, 'executeAssignment()');
  validateAssignmentLegality(assignment, opts);

  const cwd = opts.cwd ?? process.cwd();
  const root = opts.repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const rawCfg = opts.runnerConfig ?? loadRunnerConfigForDir(root);
  const cfg = withDefaultExecutor(rawCfg);

  // Storage setup under .fgos/assignments/<assignmentId>/
  const fgosDir = fgosDirFromRoot(root);
  const assignmentsDir = path.join(fgosDir, 'assignments');
  const assignmentDir = path.join(assignmentsDir, assignment.assignmentId);
  const runsDir = path.join(assignmentDir, 'runs');

  fs.mkdirSync(runsDir, { recursive: true });

  const { effectiveAssignment, effectiveMutation, templateResolution } = loadImmutableAssignment(assignment, { assignmentDir, cwd, opts });

  // Decide first: the compiled plan carries the dispatch policy and enforces that the decided executor agrees
  // with it. Dispatch is never handed a Work item.
  const compiledPlan = compileDispatchPlan(cfg, {
    assignment: effectiveAssignment.assignmentId,
    assignmentItem: effectiveAssignment,
    hasLiveTaskAccess: opts.hasLiveTaskAccess ?? false,
    binding: opts.binding,
    cliOverride: opts.cliOverride,
    options: opts.options,
  });

  if (compiledPlan.mechanism === 'unavailable' || compiledPlan.mechanism === null) {
    const reason = compiledPlan.blockedReason ?? compiledPlan.reasonCodes?.join(', ') ?? 'governance-blocked or unavailable mechanism';
    throw new RunnerConfigError(`dispatch decide blocked operation "${effectiveAssignment.operation}": ${reason}`);
  }

  const effectivePolicy = compiledPlan.policy;

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

  const resolvedExecutorId = effectivePolicy.executorId ?? 'claude';
  const pinnedInvocation = launchPinOf(opts).invocation;
  const pinnedInvocationId = typeof pinnedInvocation === 'string' && pinnedInvocation.trim() ? pinnedInvocation : null;
  let resolvedAdapter = compiledPlan?.invocation?.adapter || cfg.executors?.[resolvedExecutorId]?.adapter || cfg.executor?.adapter || 'cli-spawn';
  // The compiled plan describes the pinned invocation already; this only covers a pin
  // the plan could not see (a compiled plan that predates the pin on resume).
  if (pinnedInvocationId) {
    const pinnedInvocation = cfg.executors?.[resolvedExecutorId]?.invocations
      ?.find((inv) => inv?.id === pinnedInvocationId && inv?.via === 'cli');
    if (pinnedInvocation?.adapter) resolvedAdapter = pinnedInvocation.adapter;
  }
  // Every dispatch runs as an attempt of the run supervisor, `direct` (cli-spawn) or `terminal` (herdr-spawn);
  // an adapter that is neither has no way to run here and is refused before anything is admitted.
  if (resolvedAdapter !== 'cli-spawn' && resolvedAdapter !== 'herdr-spawn') {
    throw new DispatchError('supervised-adapter-required', `executor "${resolvedExecutorId}" names adapter "${resolvedAdapter}", which cannot run as an attempt of the run supervisor (cli-spawn and herdr-spawn can)`, {
      adapter: resolvedAdapter, cwd, executorId: resolvedExecutorId, capability: compiledPlan.capability,
    });
  }

  if (effectiveMutation === 'mutating' && opts.forceSharedCwd === true) {
    throw new DispatchError('custody-required', '--force-shared-cwd cannot be used with writes', {
      cwd, executorId: resolvedExecutorId, capability: compiledPlan.capability,
    });
  }
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs ?? 900000;
  const startedAt = new Date().toISOString();

  // Input identity, recorded runner-side before the worker runs: the sha256 of every file the Work layer pinned
  // (its plan.md). Cross-pass consumption recomputes it, so a verdict computed against older bytes is never
  // consumed, even when the worker rewinds file mtimes.
  const inputDigests = digestPinnedInputs(opts.pinInputs, root);
  const dispatchPlanDigest = `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}`;
  const declaredUnitRunId = effectiveAssignment.unitRunId ?? effectiveAssignment.provenance?.unitRunId;
  // The panes of one unit run share a tab: its attempts and rounds are one group.
  const dispatchBatchKey = opts.dispatchBatchKey
    ?? declaredUnitRunId
    ?? (effectiveAssignment.provenance?.kind === 'unit-run' ? effectiveAssignment.assignmentId?.split('/')[0] : undefined);

  // Atomic admission (see admitRunAttempt). `retryId` is opt-in: a caller that omits it gets the next available
  // attempt; one that supplies it opts into the idempotent-tuple and predecessor fencing.
  const defaultAdmissionPayloadDigest = crypto
    .createHash('sha256')
    .update(JSON.stringify({ assignment: effectiveAssignment, compiledPlan }))
    .digest('hex');

  const admitted = admitRunAttempt(assignmentDir, runsDir, effectiveAssignment.assignmentId, {
    retryId: opts.retryId,
    predecessorRunId: opts.predecessorRunId ?? null,
    destination: opts.destination ?? cwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    // The operator's escape valve for a prior attempt this host can no longer observe (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // Opt-in only, by a first, non-retry dispatch (see admitRunAttempt).
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(inputDigests.length ? { inputDigests } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  // An earlier controller's attempt (an envelope or a pre-supervisor launch record) is judged by the adopt door
  // and never launched again, so this controller holds no lock over it.
  const resumedOver = admitted.resumed
    && (fs.existsSync(path.join(runDir, 'envelope.json')) || fs.existsSync(path.join(runDir, 'controller', 'commands')));
  const attempt = openAttempt({
    runDir,
    runId,
    attemptId: opts.launchCommandId || `cmd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    unitRunId: declaredUnitRunId ?? effectiveAssignment.assignmentId,
    // Both shapes run under the run supervisor: `direct` keeps the agent in a process tree the supervisor
    // owns, `terminal` runs it in a pane of the terminal-control port. The controller prepares and hands
    // over; it never settles, signals the agent or closes a pane.
    terminal: resolvedAdapter === 'herdr-spawn',
    cwd,
    // The host and the step environment are resolved before the lock and outside any state transaction.
    host: resumedOver ? null : resolveAttemptHost(),
    stepEnv: attemptStepEnvOf(),
    custody: opts.custody,
    leaseRuntimeDir: opts.providerCapacityRuntimeDir,
  });

  try {
    // The attempt lock comes right after admission, before the first await: every moment from here an attempt
    // can be killed in leaves a lock and an intent the adopt door closes. Nothing between the run record
    // and this lock awaits (a kill on the instruction between them is the one moment no door owns).
    if (!resumedOver) {
      attempt.locks = acquireAttemptLocks({
        executorId: resolvedExecutorId, capability: compiledPlan.capability,
        fgosDir,
        assignmentDir,
        attemptStr,
        cwd,
        mutating: effectiveMutation === 'mutating',
        custody: opts.custody,
      });
      publishAttemptIntent(attempt);
    }

    const lease = await leaseAccountForAttempt({
      cfg, opts, compiledPlan, effectivePolicy, executorId: resolvedExecutorId, pinnedInvocationId, assignmentsDir,
      assignmentId: effectiveAssignment.assignmentId, runId, runDir, repoRoot: root,
    });
    if (lease.selection?.status === 'refused') {
      return settleRefusedLease({
        refusal: lease.selection, provider: lease.provider, runDir, runId, repoRoot: root,
        assignment: effectiveAssignment, executorId: resolvedExecutorId, policy: effectivePolicy,
      });
    }
    attempt.lease = lease.selection;
    const contractInput = {
      assignment: effectiveAssignment,
      dispatchPlan: compiledPlan,
      runId,
      runDir,
      cwd,
      repoRoot: root,
      runnerConfig: cfg,
      timeoutMs,
      executorId: resolvedExecutorId,
      adapter: resolvedAdapter,
      templateProvenance: templateResolution?.templateProvenance ?? effectiveAssignment.provenance?.template,
    };
    let effectiveContract;
    if (fs.existsSync(effectiveContractPath)) {
      try {
        effectiveContract = JSON.parse(fs.readFileSync(effectiveContractPath, 'utf8'));
      } catch {
        effectiveContract = null;
      }
    } else {
      // The prompt is built before Authority preparation: its posture comes from the requirement handed to the
      // Authority, never from an executor profile's merely requested confinement fragment.
      effectiveContract = buildEffectiveExecutionContract({
        ...contractInput,
        providerCapacity: lease.evidence,
        confinement: confinementRequirement.mode === 'unconfined'
          ? { requirement: { mode: 'unconfined' }, backend: { id: 'none', type: 'none' } }
          : { requirement: confinementRequirement },
      });
    }

    if (admitted.resumed) {
      const resumed = resumedRunOutcome(runDir, runId);
      if (resumed) return resumed;
    }

    // Dispatched-run membership: cross-pass consumption refuses a run directory no runner dispatched (a planted
    // runs/NN is never evidence of a real run). One marker per attempt, so a torn write costs only this marker.
    try {
      publishMarkerOnce(path.join(assignmentDir, 'dispatched', attemptStr), { attemptStr, dispatchedAt: new Date().toISOString() });
    } catch {
      // Bookkeeping never aborts a dispatch that already started; a missing marker only costs this run its
      // cross-pass consumability (fail closed).
    }

    // The worker is told the absolute run directory its result files go to, and the persona the dispatch
    // policy resolved (with the text pinned by whoever bound it, which the renderer reads instead of a file).
    const prompt = renderAssignmentPrompt(effectiveAssignment, {
      cwd,
      runDir: path.resolve(runDir),
      effectiveContract,
      ...(effectivePolicy.persona
        ? {
          persona: {
            value: effectivePolicy.persona,
            source: effectivePolicy.provenance?.persona?.source ?? null,
            ...(effectiveAssignment.policy?.personaPin?.name === effectivePolicy.persona
              ? { pinnedText: effectiveAssignment.policy.personaPin.text }
              : {}),
          },
        }
        : {}),
    });

    // Dirty files and HEAD before the launch: pre-existing dirty files never count as run evidence, and a
    // worker that commits then crashes is still seen to have moved HEAD.
    const dirtyBefore = safeGitStatusFiles(cwd);
    const dirtyBeforeSnapshots = snapshotDirtyBeforeFiles(cwd, dirtyBefore);
    const gitBefore = safeGitHead(cwd);

    // Per-Run control fencing: a monotonic controlEpoch plus a unique controlToken, re-checked before a
    // settlement is appended. A live holder is never reclaimed on heartbeat or TTL alone; failing to acquire
    // means another controller holds this Run, so this one refuses rather than race it.
    const control = acquireRunControl(runDir, {
      holder: buildRunControlHolder(`${runId}:${process.pid}:${crypto.randomUUID()}`),
      purpose: 'worker-spawn',
      ttlMs: opts.controlTtlMs,
    });
    if (control.status !== 'acquired') {
      if (attempt.lease?.status === 'selected') releaseSelectedProviderLease(attempt.lease, runId, opts.providerCapacityRuntimeDir);
      throw new RunnerConfigError(
        `executeAssignment: could not acquire control for Run "${runId}" (status: "${control.status}") -- another controller currently holds it`,
        { code: 'run-control-held', phase: 'post-admission' },
      );
    }
    attempt.control = { controlEpoch: control.controlEpoch, controlToken: control.controlToken };

    const launch = await buildLaunch(attempt, {
      cfg, opts, root, fgosDir, assignment: effectiveAssignment, effectiveMutation, compiledPlan, effectivePolicy,
      executorId: resolvedExecutorId, pinnedInvocationId, confinementRequirement, postureBinding, timeoutMs,
      dispatchBatchKey, dispatchPlanDigest, attemptNum: admitted.attemptNum, inputDigests, contractInput,
      providerCapacityEvidence: lease.evidence, prompt, dirtyBefore, dirtyBeforeSnapshots, gitBefore,
    });
    return await awaitBinding(attempt, { ...launch, onChunk: opts.onChunk, timeoutMs });
  } finally {
    await closeAttempt(attempt);
  }
}
