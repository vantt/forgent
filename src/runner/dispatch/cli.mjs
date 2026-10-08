// dispatch/cli.mjs — dispatch behavior + the thin CLI doors over it (D7,
// tsk-2uf-1): `logExecutorDispatch`, and the `execute`/`decide`/
// `log` CLI subcommands (`executeExecutorCli`/`decideExecutorCli`, plus the
// raw `node src/runner/dispatch.mjs <subcommand> ...` argv-parsing entry
// point, now `runDispatchCli` — called from `src/runner/dispatch.mjs`'s own
// unchanged script guard so every existing `node .../dispatch.mjs execute
// ...` invocation stays byte-identical). Split out of the former
// `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) — pure
// move, no behavior change; `src/runner/dispatch.mjs` re-exports every name
// below unchanged as a barrel. See `docs/history/dispatch-activation-and-
// handoff-redesign/CONTEXT.md` D7 for the split rationale.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir, MODEL_POLICY_TIERS } from './config.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../rigor.mjs';
import { resolveExecutorAndOverrides, resolveTierModel, deriveProviderFamily, resolveCapabilityDetailsFromHints } from './resolve.mjs';
import { resolveExecutorProvider, resolveExecutorGovernance, resolveStrongerTier } from './assignment-policy.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { resolveExecutorCommand, DispatchError } from './transport.mjs';
import { executeThroughConfinement, buildConfinementAttestation } from './confinement/authority.mjs';
import { buildConfinementRequest } from './confinement/request.mjs';
import { markRunSettled } from './visibility-session.mjs';
import { compileDispatchPlan } from './plan.mjs';
import { readSharedConfigOrEmpty } from '../../config/shared-config-file.mjs';
import { buildDispatchResult } from './result-ladder.mjs';
import { executeAssignment, reconcileCliSpawnRun } from './assignment-runner.mjs';
import { createCredentialProbe } from './provider-credential-probe.mjs';
export { reconcileCliSpawnRun };
import { buildAssignment, claimAssignmentId } from './assignment.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';

import { resolveFgosBin } from '../../setup/bin-discovery.mjs';

// Resolved once at import against THIS MODULE's own location, preferring a
// tier-0 resolution when present with the same fallback resolveFgosBin
// itself uses. Known limitation: under this track's linked-worktree
// topology, a dispatch CLI running from a worktree still resolves tier 0
// against the module's own checkout root, not the caller's dispatch root
// -- unreachable from a worktree even when the main checkout has a real
// workspace installation. Accepted for now (falls back to today's exact
// behavior); the cutover track can make this resolve per-call against
// the dispatch root instead.
const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const BIN_FGOS_PATH = resolveFgosBin(REPO_ROOT)?.path ?? fileURLToPath(new URL('../../../bin/fgos.mjs', import.meta.url));
import {
  acquireMainCheckoutLock,
  renewMainCheckoutLockIfOwn,
  dispatchLockFile,
  ACQUIRED,
  HELD,
  AMBIGUOUS,
  formatLockDurationMs,
} from '../main-checkout-lock.mjs';
import { checkoutDirtyPaths } from '../worktree.mjs';

// Work-driven dispatch (`spawnWorker`, the executor a Work item's step resolves to) lives in
// the Work layer, src/runner/work-dispatch.mjs; this module takes what that layer resolved.

/**
 * Resolve persona/agentType for a given taskSpec header & list of registered agent-types (D20/D21/D22/D32).
 * Tie-break priority (D32):
 * 1. Task-spec declares `agent:` pin -> wins immediately, skipping skill-matching.
 * 2. No pin -> if `currentAgentType` matches all `requires-skill`, stay with `currentAgentType`.
 * 3. Otherwise -> select deterministically by declaration order (first matching agent-type in `agentDefs`).
 */
export function resolveAgentTypeForTaskSpec(taskSpecHeader, agentDefs = [], currentAgentType = null) {
  if (!taskSpecHeader) return null;

  const pinnedAgents = Array.isArray(taskSpecHeader.agent)
    ? taskSpecHeader.agent
    : typeof taskSpecHeader.agent === 'string' && taskSpecHeader.agent.trim()
      ? [taskSpecHeader.agent.trim()]
      : [];

  if (pinnedAgents.length > 0) {
    const found = agentDefs.find((a) => pinnedAgents.includes(a.name));
    return found ? found.name : null;
  }

  const requiredSkills = Array.isArray(taskSpecHeader['requires-skill'])
    ? taskSpecHeader['requires-skill']
    : typeof taskSpecHeader['requires-skill'] === 'string' && taskSpecHeader['requires-skill'].trim()
      ? [taskSpecHeader['requires-skill'].trim()]
      : [];

  if (requiredSkills.length === 0) {
    return null;
  }

  if (currentAgentType) {
    const currentDef = agentDefs.find((a) => a.name === currentAgentType);
    if (currentDef && Array.isArray(currentDef.skills)) {
      const hasAllSkills = requiredSkills.every((s) => currentDef.skills.includes(s));
      if (hasAllSkills) return currentAgentType;
    }
  }

  const matching = agentDefs.find(
    (a) => Array.isArray(a.skills) && requiredSkills.every((s) => a.skills.includes(s)),
  );
  if (matching) return matching.name;

  return null;
}


/**
 * Open a run directory under `.fgos/` and record that it is running.
 *
 * Without one, an interactive adapter falls back to a private temp directory.
 * That works and is invisible: the brief, `visibility.json` and the worker's
 * outbox all land somewhere `fgos dispatch show-run`/`watch` do not look, so
 * the run cannot be observed at all -- which is the whole point of dispatching
 * through a pane. Both dispatch doors call this, because a run started through
 * either is a run somebody may want to watch.
 *
 * Returns `{ runDir, closeRun }`. `closeRun` is how the run stops saying
 * `running`: a run this function opened is a run its caller closes, on the
 * failure branch as much as the success one, because a failed round ended and
 * has a named answer. Both are inert when there is no `.fgos/` to write into.
 */
/**
 * Watch for work done outside the workspace the dispatch handed the worker.
 *
 * A round settles when the worker writes its own result file. That establishes
 * the worker DID something; it establishes nothing about WHERE. Measured: agy
 * was given a worktree, reported settled, and had written six files into the
 * main checkout instead -- onto another track's branch. Nothing in the ladder
 * can catch that, because the ladder's whole subject is whether the round
 * ended, not where it ran.
 *
 * This compares the main checkout's dirty paths before and after. It is
 * EVIDENCE, not proof: the main checkout is a live working tree and somebody
 * else may dirty it while a round is in flight, so the refusal below names
 * what it observed rather than asserting who did it. A false positive costs a
 * re-run; the failure it exists to catch costs a stranger's branch.
 *
 * Nothing is watched when the worker was given the repo root itself as its
 * workspace -- there is no outside to write to.
 */
export function watchWritesOutsideWorkspace({ repoRoot, cwd }) {
  const watching = Boolean(repoRoot) && Boolean(cwd) && path.resolve(cwd) !== path.resolve(repoRoot);

  // The workspace usually lives INSIDE the repo root -- fgOS puts worktrees at
  // `<repo>/.claude/worktrees/<id>` -- so the root's own status reports the
  // workspace directory itself as untracked. Everything at or under the
  // workspace is the worker's to write; only what lies outside it is stray.
  const insideWorkspace = (relPath) => {
    const rel = path.relative(path.resolve(cwd), path.resolve(repoRoot, relPath));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  };
  const outsideOnly = () => (watching
    ? checkoutDirtyPaths(repoRoot, repoRoot).filter((entry) => !insideWorkspace(entry))
    : []);

  const before = new Set(outsideOnly());
  return {
    watching,
    /** Paths outside the workspace that are dirty now and were not before. */
    strayPaths() {
      return outsideOnly().filter((entry) => !before.has(entry));
    },
  };
}

/**
 * The error a settled-but-misplaced round becomes. `worktree-fail` is the
 * existing class for "the isolated checkout was not respected", so the
 * recovery matrix already knows to retry it a bounded number of times rather
 * than treating it as a worker that needs a person.
 */
export function strayWriteError({ workId, tier, model, cwd, repoRoot, strayPaths }) {
  return new DispatchError(
    'worktree-fail',
    `executor for work "${workId}" reported success but wrote outside its workspace. It was given ${cwd}; these paths became dirty in ${repoRoot} during the round: ${strayPaths.join(', ')}. The round is refused rather than accepted: work in the wrong checkout is not this item's work, and it may belong to whoever else has that checkout open.`,
    { workId, tier, model, reason: 'wrote-outside-workspace', cwd, repoRoot, strayPaths },
  );
}

export function openRunnerRun({ fgosDir, workId, executorId, cwd }) {
  const baseDir = fgosDir || path.join(os.tmpdir(), 'fgos-assignments');
  const assignmentId = `asgn-${workId || executorId || 'run'}-${Date.now()}`;
  const runDir = path.join(baseDir, 'assignments', assignmentId, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify({
    contract: 'run.v1',
    runId: `${assignmentId}-01`,
    workId: workId ?? null,
    executorId,
    cwd,
    startedAt: new Date().toISOString(),
    status: 'running',
  }, null, 2)}\n`);

  return {
    runDir,
    closeRun: (status) => {
      try { markRunSettled(runDir, { status }); } catch { /* a run left open is not worth failing a finished dispatch */ }
    },
  };
}


function captureHeadSha(cwd) {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return sha || null;
  } catch {
    return null;
  }
}

/**
 * A claude REPL in a herdr pane is briefed with a pointer to a file in the run directory,
 * and the run directory lives under the store, which is outside the worker's cwd (its
 * worktree). Claude asks the human before reading outside its working directories, and
 * nobody is there to answer. Blind inputs are copied to assignmentDir/inputs,
 * beside runs/NN, so grant only that directory (when present) and the run
 * directory. This is claude's own prompt; the OS-level posture is unchanged.
 */
export function withRunDirReadAccess({ adapter, interactiveMode, args, runDir }) {
  if (adapter !== 'herdr-spawn' || interactiveMode?.kind !== 'claude' || !runDir) return args;
  if (!Array.isArray(args)) return args;
  const run = path.resolve(runDir);
  const inputs = path.join(path.dirname(path.dirname(run)), 'inputs');
  const directories = [run, ...(fs.existsSync(inputs) ? [inputs] : [])];
  // Non-blind handoffs point at settled sibling reports, not copied inputs.
  const assignmentFile = path.join(path.dirname(path.dirname(run)), 'assignment.json');
  if (fs.existsSync(assignmentFile)) {
    const { contextRefs = [] } = JSON.parse(fs.readFileSync(assignmentFile, 'utf8'));
    for (const ref of contextRefs) {
      if (typeof ref === 'string' && path.isAbsolute(ref) && fs.existsSync(ref) && fs.statSync(ref).isFile()) {
        const parent = path.dirname(fs.realpathSync(ref));
        if (!directories.includes(parent)) directories.push(parent);
      }
    }
  }
  const existing = args.indexOf('--add-dir');
  return existing < 0
    ? [...args, '--add-dir', ...directories]
    : [...args.slice(0, existing + 1), ...directories, ...args.slice(existing + 1)];
}

/**
 * `execute <executorId>` CLI subcommand (tsk-5tm-3 D5): the self-execute
 * counterpart to `resolve` above, matching marketing-cockpit's `run_task()`
 * contract (`task-executor.py:550-611`) — self-execute for every case that
 * can be, hand back only for the one case that genuinely can't. `resolve`
 * always hands back `{command,args}` for the caller to run itself via
 * Bash, even for a `kind:"cli"` executor that `EXECUTOR_ADAPTERS` could
 * already run directly (`EXECUTOR_ADAPTERS['cli-spawn']` was validated at
 * config-load time but, before this item, only ever CALLED by `spawnWorker`
 * — Flow A never called it). `execute` closes that gap:
 *
 * - **`mechanism: "in-process"`** (native, same-family, live session) —
 *   dispatch itself has no Task/Agent tool to call (a passive CLI/library),
 *   so this is the one case that still hands back — a `spawn_instruction`-
 *   shaped result, `{mechanism, agentType, prompt[, executorId]}`, for the
 *   caller to invoke its OWN Agent/Task tool with. Same `agentType`
 *   resolution and `hasLiveTaskAccess` self-declaration contract `decide`
 *   already uses (never probed or inferred here).
 * - **every other case** (`mechanism: "out-of-process"`, i.e. whatever
 *   `EXECUTOR_ADAPTERS[adapter]` resolves to for this executor) — self-
 *   executes: calls the adapter directly, the same call `spawnWorker`
 *   already makes for a work item's own dispatch, and returns the REAL
 *   result (`{status,signal,stdout,stderr,tier,model}` from `cliSpawnAdapter`
 *   today, plus `provider`/`command`[, `executorId`] additive, same
 *   shape `spawnWorker`'s own result already carries) — never the bare
 *   `{command,args}` `resolve` hands back for the caller to run through
 *   Bash itself.
 *
 * `resolveExecutorCommand` already throws if the resolved `adapter` names
 * an unregistered `EXECUTOR_ADAPTERS` key (config-load-time validation,
 * `validateExecutorShape`) — by the time this function reaches the
 * self-execute branch, `EXECUTOR_ADAPTERS[adapter]` is guaranteed to
 * exist; the explicit check below is defensive, matching `spawnWorker`'s
 * own belt-and-braces style rather than load-bearing.
 */
export async function executeExecutorCli(
  executorIdArg,
  {
    prompt = '',
    cwd = process.cwd(),
    repoRoot,
    runnerConfig,
    model: modelOverride,
    tier: tierOverride,
    rigor: rigorOverride,
    for: purposeArg,
    carries,
    hasLiveTaskAccess = false,
    timeoutMs: timeoutOverride,
    idleTimeoutMs: idleTimeoutOverride,
    maxBuffer: maxBufferOverride,
    onChunk,
    // Work-layer inputs, resolved by the caller (dispatch never looks a Work
    // item's step up): the Work item as plain data, the capability hints its
    // Workflow step implies, and the agent type its task spec resolves to.
    work,
    capabilityHints,
    agentType,
    // Where this run's artifacts live. An interactive adapter writes the
    // brief here and waits for the worker's own files to appear here; a
    // caller that has no run directory (an ad-hoc `execute`) leaves it unset
    // and the adapter uses a private temporary one instead.
    runDir,
    // Additive (Dispatch Core Contract Normalization follow-up): governance
    // options (`disallowedProviders`/`disallowedExecutors`) forwarded to
    // `resolveAssignmentDispatchPolicy` below. Undefined for every existing
    // caller -- opens a real governance channel this function never had at
    // all before (it computed tier/model with its own inline logic that
    // never checked either list), without requiring any caller to opt in.
    options,
    // A caller-supplied string naming the batch this dispatch belongs to --
    // opaque here, meaningful only inside herdr-round.mjs's own batch-tab
    // registry, which uses it to land every dispatch of one batch (one
    // coding-panel round, one fanout wave) in the same herdr tab instead of
    // scattering across whichever tab happens to be focused. Ignored by
    // every adapter that isn't herdr-backed. Deliberately the only
    // herdr-shaped thing this generic, adapter-agnostic function accepts --
    // an explicit anchor pane id is herdr's own vocabulary ("pane"), so it
    // is never threaded through here; a cross-process caller that wants one
    // sets FGOS_HERDR_ANCHOR_PANE in its own env instead (read directly by
    // the herdr adapter in transport.mjs, the same door FGOS_HERDR_BIN
    // already uses for a herdr-only knob this function doesn't carry either).
    dispatchBatchKey,
    assignmentLaunchContext,
    launchCommandId,
    controlEpoch,
    controlToken,
    effectiveContract,
    // Names which `via:"cli"` invocation of the executor runs (bind() pins the
    // herdr-spawn one when herdr is the transport). Unset keeps the first cli one.
    invocationId,
    // The confinement requirement the caller already resolved (an Assignment's
    // posture). Unset leaves it to the capability/invocation declaration.
    requirement,
    // hostRead: blind for this dispatch, and the refs the worker is handed (checked against
    // what blind hides). A blind dispatch is refused rather than run unblind.
    blind = false,
    contextRefs,
    // Directory the confinement authority treats as the writable workspace when the
    // requirement grants one; defaults to the main checkout root.
    workspaceRoot,
    // The provider account an Assignment run leased. Its credential source is what
    // the confined driver copies into the worker's private home; without it a
    // confined pane starts without the account's login.
    providerCapacity,
    // The dispatch cannot write the workspace (a read-only posture), so it shares the directory with
    // other dispatches instead of holding it exclusively.
    sharedCwd = false,
  } = {},
) {
  const purpose = purposeArg;
  if (!executorIdArg && !purpose) {
    throw new RunnerConfigError(
      'executeExecutorCli requires an executorIdArg or a `for` purpose (the CLI\'s own `execute` subcommand only ever supplies executorIdArg positionally -- `for` is a programmatic-caller-only parameter, e.g. spawnWorker\'s own work-item-derived purpose; usage: node src/runner/dispatch.mjs execute <executorId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access])',
    );
  }
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  let configRoot = root;
  if (cwd) {
    try {
      const wtRoot = resolveRepoRoot(cwd);
      const mainRoot = resolveMainCheckoutRoot(cwd);
      if (mainRoot === root && wtRoot !== root && fs.existsSync(path.join(wtRoot, '.fgos', 'config.json'))) {
        configRoot = wtRoot;
      }
    } catch {}
  }
  const rawCfg = runnerConfig ?? ensureRunnerConfigForDir(configRoot);
  const cfg = { ...rawCfg };
  if (rawCfg.executor) {
    cfg.executors = {
      ...(rawCfg.executors || {}),
      claude: rawCfg.executor,
      ...(rawCfg.executor.command ? { [rawCfg.executor.command]: rawCfg.executor } : {}),
    };
  }
  const resolvedByPurpose = !executorIdArg;
  // Resolve through the shared resolver on the supplied capability or
  // executor id. A capability contributes its rigor floor through the
  // policy resolver below; executor selection carries no policy override.
  // The two doors keep their own error contracts: `--for` alone throws when
  // nothing resolves ("no executor registered for purpose..." — guides the
  // caller to `decide --for` first); a named `executorIdArg` that resolves
  // to nothing when `!work` fails closed with DispatchError('executor-not-found')
  // (F4 explicit fail closed). When `work` is present, it falls through to
  // implicit/global resolution for work-driven execution.
  let executorId = executorIdArg;
  let resolvedExecutor;
  // `realExecutorId`/`executorConfigured` (Dispatch Core Contract
  // Normalization follow-up): the positional-executorIdArg branch below
  // deliberately never reassigns `executorId` itself -- it stays as the
  // caller's raw input (which may be capability-shaped, e.g.
  // "fgos-coding-implement", per the comment above), while
  // `resolveExecutorConfig` re-resolves it fresh downstream. The new
  // resolveAssignmentDispatchPolicy() call below needs the REAL resolved
  // executor id (e.g. "agy") for its own `preferExecutor` field, distinct
  // from `executorId` -- and must never pass one at all when nothing
  // resolved, since that resolver throws on an unregistered preferExecutor
  // where THIS function's own contract never has (falls through to the
  // global executor silently).
  let realExecutorId;
  let executorConfigured;
  if (!executorId) {
    const resolved = resolveExecutorAndOverrides(cfg, purpose);
    if (!resolved.executorId) {
      throw new RunnerConfigError(
        `no executor registered for purpose "${purpose}" — call "decide --for ${purpose}" first to check availability before executing.`,
      );
    }
    executorId = resolved.executorId;
    resolvedExecutor = resolved.executor;
    realExecutorId = resolved.executorId;
    executorConfigured = resolved.configured;
  } else {
    const resolved = resolveExecutorAndOverrides(cfg, executorId);
    if (!work && (!resolved.configured || !resolved.executor)) {
      throw new DispatchError(
        'executor-not-found',
        `no executor registered for id "${executorIdArg}"`,
        { executorId: executorIdArg },
      );
    }
    resolvedExecutor = resolved.executor;
    realExecutorId = resolved.executorId ?? executorId;
    executorConfigured = resolved.configured;
  }

  // Dispatch chokepoint visibility (both branches below): "capability" is
  // the purpose actually requested via --for when purpose-resolved, or —
  // for a direct executorId call — whichever capabilities that executor
  // itself declares serving (executor.for, D15), so the line still answers
  // "what is this FOR" even without a --for flag. Diagnostic-only.
  const capabilityResolution = resolveCapabilityDetailsFromHints({
    cfg,
    executorId: executorIdArg,
    resolvedExecutor,
    purpose,
    hints: capabilityHints,
  });
  const { capability: capabilityIdentity, anchorCapability } = capabilityResolution;
  const capabilityLabel = purpose ?? (resolvedExecutor?.for?.join(',') || '(none declared)');

  const mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
  // R7 (L8): In-process handback is a return value, not an invocation.
  // The fgOS Dispatch CLI runs as an external command-line process and does not own or hold
  // the live caller agent session, Task tool, or MCP client of the calling harness. Returning
  // mechanism='in-process' hands control and metadata (agentType, prompt, attestation) back to
  // the caller so the calling session can execute the task in-process using its own native capabilities.
  if (mechanism === 'in-process') {
    const agentType = resolvedExecutor?.agentType;
    const stageSkill = executorIdArg;
    const inProcRunDir = runDir || path.join(os.tmpdir(), 'fgos-in-process', String(executorId), String(Date.now()));
    let confinementRequest;
    try {
      confinementRequest = buildConfinementRequest({
        capability: capabilityIdentity,
        stageSkill,
        executorId,
        fallbackFrom: anchorCapability,
        anchorCapability,
        cfg,
        // Pre-existing bug fix (unrelated to this track's own scope): `opts`
        // is not a parameter of `executeExecutorCli` -- this function
        // destructures its options object directly (no catch-all binding),
        // and the caller-supplied governance/call options bag is named
        // `options` (destructured above). Every existing caller already
        // passes no `providerCapacity` of its own, so this is
        // value-preserving (still `undefined`) for all of them; it only
        // stops the `ReferenceError: opts is not defined` crash this
        // function hit on every call.
        providerCapacity: providerCapacity ?? options?.providerCapacity,
        blind,
        authorityScope: 'external-harness',
        invocation: {
          agentType,
          prompt,
        },
        context: {
          cwd,
          repoRoot: root,
          runDir: inProcRunDir,
          fgosDir,
        },
      });
    } catch (err) {
      const dispatchId = `disp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const refusedAttestation = buildConfinementAttestation({
        request: {
          contract: 'confinement-request.v1',
          dispatchId,
          capability: capabilityIdentity,
          stageSkill,
          executorId,
          authorityScope: 'external-harness',
          requirement: { mode: 'required', error: err.message },
          context: { cwd, runDir: inProcRunDir },
        },
        phase: 'refused',
        outcome: 'refused',
        error: err,
      });
      throw new DispatchError(
        'confinement-policy-error',
        err.message,
        {
          contract: 'confinement-execution.v1',
          status: 'refused',
          dispatchId,
          capability: capabilityIdentity,
          stageSkill,
          executorId,
          authorityScope: 'external-harness',
          attestation: refusedAttestation,
          cause: err,
        },
      );
    }

    const doorResult = await executeThroughConfinement(confinementRequest);

    process.stderr.write(
      `fgos: dispatch capability=${capabilityLabel} executor=${executorId} via=in-process agentType=${agentType ?? '(none)'} provider=n/a model=n/a tier=n/a\n`,
    );
    const base = {
      mechanism,
      agentType,
      prompt,
      authorityScope: 'external-harness',
      attestation: doorResult.attestation,
    };
    return resolvedByPurpose ? { ...base, executorId } : base;
  }

  const executor = resolvedExecutor;
  // Dispatch Core Contract Normalization follow-up, consolidated further
  // (dispatch-engine-liveness-hardening Phase 7, C3): governance now runs
  // through the SAME `resolveExecutorProvider`/`resolveExecutorGovernance`
  // helpers `resolveAssignmentDispatchPolicy` itself uses internally
  // (assignment-policy.mjs) -- this used to call that entire resolver just
  // to reach its two governance throws, discarding its whole computed
  // policy object (tier/quality/persona/reasoningEffort/constraints/
  // provenance) afterward, a real "three resolvers, one feeding the output"
  // waste the audit named (C3). Calling the two small shared helpers
  // directly closes the SAME governance gap (`options.disallowedProviders`/
  // `.disallowedExecutors` are still consulted, unchanged) without paying
  // for the unused computation.
  //
  // The literal MODEL is computed via resolveTierModel and handed to the
  // resolver as an already-resolved `cliOverride.model`.
  const capabilityName = anchorCapability ?? capabilityIdentity ?? purpose ?? executorIdArg;
  const capabilityRigor = capabilityName ? cfg?.capabilities?.[capabilityName]?.rigor : undefined;
  if (tierOverride !== undefined && !MODEL_POLICY_TIERS.includes(tierOverride)) {
    throw new RunnerConfigError(`invalid tier "${tierOverride}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  if (executor?.tier !== undefined && !MODEL_POLICY_TIERS.includes(executor.tier)) {
    throw new RunnerConfigError(`invalid executor tier "${executor.tier}". Valid tiers: [${MODEL_POLICY_TIERS.join(', ')}]`);
  }
  if (rigorOverride !== undefined && !RIGOR_VALUES.includes(rigorOverride)) {
    throw new RunnerConfigError(`invalid rigor "${rigorOverride}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
  }
  const effectiveRigor = (rigorOverride && capabilityRigor)
    ? resolveStrongerRigor(rigorOverride, capabilityRigor)
    : (rigorOverride ?? capabilityRigor);
  const derivedTier = effectiveRigor ? cfg?.rigorToTier?.[effectiveRigor] : undefined;
  const tier = tierOverride
    ?? resolveStrongerTier(derivedTier ?? 'standard', executor?.tier);
  const providerFamily = deriveProviderFamily(executor);
  const fallbackModel = resolveTierModel(cfg, tier, providerFamily);
  const model = modelOverride ?? executor?.model ?? fallbackModel;
  // `primaryExecutor`/`explicitProviderModel` mirror exactly what the
  // former `resolveAssignmentDispatchPolicy({assignment: {policy: {...}}})`
  // call built for this door: only when a real registered executor
  // resolved -- an unconfigured executorId must fall through to
  // `resolveExecutorProvider`'s own global-executor default, exactly like
  // `resolveExecutorCommand` does downstream, never throw "not a
  // registered executor" for a case this function's own contract has never
  // thrown for.
  const primaryExecutor = executorConfigured ? realExecutorId : (cfg?.executor?.command ?? 'claude');
  const { resolvedProvider } = resolveExecutorProvider({
    runnerConfig: cfg,
    primaryExecutor,
    options,
  });
  resolveExecutorGovernance({ primaryExecutor, providerModel: resolvedProvider, options });
  const resolvedAgentType = agentType ?? null;
  // Same reason as `spawnWorker`: a confinement the profile declares has to
  // reach the adapter, or the invariant that accepted the profile is fiction.
  const { command, args, argsTemplate, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement, adapter, provider, method, url, headers, body, resourceBindings } = resolveExecutorCommand(cfg, {
    prompt,
    model,
    tier,
    executorId,
    fgosDir,
    contentCarries: carries,
    attestRoot: cwd,
    resolvedAgentType,
    invocationId,
  });
  const timeoutMs = timeoutOverride ?? cfg.timeoutMs;
  const idleTimeoutMs = idleTimeoutOverride ?? cfg.idleTimeoutMs;
  const maxBuffer = maxBufferOverride ?? 10 * 1024 * 1024;

  // One dispatch at a time per working directory, because two writers in one tree race. A caller that
  // knows the dispatch cannot write the workspace (a read-only posture) shares the directory instead:
  // the panelists of one panel run side by side in the same checkout.
  const identity = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const lockFile = dispatchLockFile(cwd);
  const lockRes = sharedCwd ? null : acquireMainCheckoutLock(fgosDir, {
    identity,
    ttlMs: timeoutMs,
    now: Date.now(),
    releaseOnExit: true,
    lockFile,
  });

  if (lockRes?.status === HELD) {
    const ageStr = formatLockDurationMs(lockRes.lockAgeMs);
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch for cwd "${cwd}" is already in flight (held for ${ageStr}).`,
      { cwd, lockAgeMs: lockRes.lockAgeMs, remainingTtlMs: lockRes.remainingTtlMs, holderPid: lockRes.holderPid },
    );
  }
  if (lockRes?.status === AMBIGUOUS) {
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch lock for cwd "${cwd}" is ambiguous (corrupt or unparseable lock file).`,
      { cwd, lockAgeMs: lockRes.lockAgeMs },
    );
  }
  if (lockRes && lockRes.status !== ACQUIRED) {
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch lock for cwd "${cwd}" could not be acquired (status: ${lockRes.status}).`,
      { cwd },
    );
  }

  // S2 fix (dispatch-engine-liveness-hardening Phase 3): a run's total hold
  // time is pre-spawn prep + up to timeoutMs + settlement, so any run that
  // uses close to its full timeout used to lose exclusivity to a contender
  // before finishing (the lock's own `ttlMs: timeoutMs` window expiring
  // mid-run). Heartbeat renews this SAME lock's timestamp on a fraction of
  // its own ttlMs, mirroring merge.mjs's own withMergeTargetSlot/
  // mergeRunnerItem heartbeat (tsk-4l8) against the identical primitive.
  // renewMainCheckoutLockIfOwn is a no-op (not an error) once this identity
  // no longer owns the lock, so it is safe to call on every tick regardless
  // of how the run ends.
  const heartbeatIntervalMs = Math.max(250, Math.floor(timeoutMs / 3));
  const heartbeat = lockRes
    ? setInterval(() => {
      renewMainCheckoutLockIfOwn(fgosDir, identity, { lockFile });
    }, heartbeatIntervalMs)
    : null;
  heartbeat?.unref();

  try {
    process.stderr.write(
      `fgos: dispatch capability=${capabilityLabel} executor=${executorId} via=${adapter} provider=${provider} model=${model} tier=${tier}\n`,
    );
    const headBefore = captureHeadSha(cwd);
    const dirtyBefore = checkoutDirtyPaths(root, cwd);

    // A caller may hand us a run directory; when none is given, open one under
    // `.fgos/` rather than letting the adapter fall back to a private temp
    // directory. This door used to take that fallback, so a real dispatch
    // through it left its brief, visibility and outbox somewhere
    // `fgos dispatch show-run`/`watch` do not look -- observable in principle
    // and unobservable in practice.
    const opened = runDir
      ? { runDir, closeRun: () => {} }
      : openRunnerRun({ fgosDir, workId: work?.id, executorId, cwd });
    const outsideWatch = watchWritesOutsideWorkspace({ repoRoot: root, cwd });

    let confinementRequest;
    try {
      confinementRequest = buildConfinementRequest({
        capability: capabilityIdentity,
        stageSkill: executorIdArg,
        executorId,
        fallbackFrom: anchorCapability,
        anchorCapability,
        cfg,
        assignmentLaunchContext,
        // Same pre-existing `opts`-is-not-defined fix as the in-process
        // branch above -- see its comment.
        providerCapacity: providerCapacity ?? options?.providerCapacity,
        blind,
        ...(requirement ? { requirement } : {}),
        invocation: {
          command,
          args: withRunDirReadAccess({ adapter, interactiveMode, args, runDir: opened.runDir }),
          argsTemplate,
          prompt,
          env,
          liveOutput,
          interactiveMode,
          promptDelivery,
          permissionMode,
          confinement,
          adapter,
          method,
          url,
          headers,
          body,
          resourceBindings,
        },
        context: {
          cwd,
          repoRoot: workspaceRoot ?? root,
          runDir: opened.runDir,
          fgosDir,
          contextRefs,
          timeoutMs,
          idleTimeoutMs,
          maxBuffer,
          onChunk,
          workId: executorId,
          tier,
          model,
          dispatchBatchKey,
          launchCommandId,
          controlEpoch,
          controlToken,
          effectiveContract,
        },
      });
    } catch (err) {
      opened.closeRun('settled');
      const dispatchId = `disp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const refusedAttestation = buildConfinementAttestation({
        request: {
          contract: 'confinement-request.v1',
          dispatchId,
          capability: capabilityIdentity,
          stageSkill: executorIdArg,
          executorId,
          requirement: { mode: 'required', error: err.message },
          context: { cwd, runDir: opened.runDir },
        },
        phase: 'refused',
        outcome: 'refused',
        error: err,
      });
      throw new DispatchError(
        'confinement-policy-error',
        err.message,
        {
          contract: 'confinement-execution.v1',
          status: 'refused',
          dispatchId,
          capability: capabilityIdentity,
          stageSkill: executorIdArg,
          executorId,
          attestation: refusedAttestation,
          cause: err,
        },
      );
    }

    let result;
    try {
      result = await executeThroughConfinement(confinementRequest);
    } catch (err) {
      opened.closeRun(err?.outcome === 'died' ? 'died' : 'settled');
      throw err;
    }
    opened.closeRun('settled');

    // Same question as the runner path asks: the round ended, but where?
    const strayPaths = outsideWatch.strayPaths();
    if (strayPaths.length > 0) {
      throw strayWriteError({ workId: executorId, tier, model, cwd, repoRoot: root, strayPaths });
    }

    const headAfter = captureHeadSha(cwd);
    const dirtyAfter = checkoutDirtyPaths(root, cwd);
    let lostUncommittedPaths;
    if (headBefore === headAfter && dirtyBefore.length > 0) {
      const dirtyAfterSet = new Set(dirtyAfter);
      const lost = dirtyBefore.filter((p) => !dirtyAfterSet.has(p));
      if (lost.length > 0) {
        lostUncommittedPaths = lost;
        process.stderr.write(
          `fgos: warning: uncommitted path(s) lost across out-of-process dispatch: ${lost.join(', ')}\n`,
        );
      }
    }
    const execResult = result?.result ?? result;
    const resultToBuild = {
      ...execResult,
      attestation: result?.attestation,
    };
    const base = buildDispatchResult({ mechanism, result: resultToBuild, headBefore, headAfter, lostUncommittedPaths, provider, command });
    return resolvedByPurpose ? { ...base, executorId } : base;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    lockRes?.release();
  }

}

/**
 * `decide <executorId>` CLI subcommand (tsk-3ik-1): lets a task-dispatch
 * consumer skill ask, before choosing whether to `execute` the command or
 * call its own Task tool natively, which mechanism
 * `decideExecutorDispatchMechanism` picks for this executor right now.
 * Prints `{"mechanism": "in-process"|"out-of-process"}` as JSON to stdout — same
 * additive-sibling relationship to `executeExecutorCli` above as
 * `decideExecutorDispatchMechanism` has to `resolveExecutorConfig`: reads
 * the same committed runner config, calls nothing that also feeds
 * `execute`'s own resolution path (tsk-60f D4: the `resolve` CLI subcommand
 * this docblock used to describe here was retired -- 0 production
 * consumers, ~15 tests ported onto `execute`).
 *
 * `--has-live-task-access` is the caller's own self-declaration (never
 * probed or inferred here — same contract `decideDispatchMechanism` itself
 * documents) that this session already has live Agent/Task tool access.
 *
 * `agentType` (tsk-3ik-3, additive): included in the result, alongside
 * `mechanism`, whenever the executor declares one — a `mechanism:
 * "in-process"` result is otherwise useless to a consumer skill's own
 * Agent/Task tool call, which needs a concrete `subagent_type` to invoke,
 * not just "go in-process" with no target. Omitted (`undefined`, dropped by
 * `JSON.stringify`) for a executor with no `agentType`, e.g. every `kind:
 * "cli"` executor — `mechanism` for those always resolves
 * `"out-of-process"` anyway (rule 1/3), so no consumer ever needs
 * `agentType` in that case.
 *
 * `work` (tsk-5tm-6 D4/D12(iii)): a work-item id, resolved to its dispatch
 * executor by the Work layer (`resolveWork`, handed in by the caller) before deciding its mechanism -- the
 * lookup `fgos-fanout` needs to consult this protocol per-candidate before
 * firing an Agent, instead of assuming native dispatch unconditionally.
 * Lowest precedence of the three selectors (a real `executorIdArg` always
 * wins, `for` next, matching every pre-D4 caller's byte-identical
 * behavior) since no existing caller ever passes more than one.
 *
 * `needsSoul` (tsk-60f D2): the caller's own self-declaration that it is
 * about to fire its own Agent/Task tool with no executor or work item to
 * name -- the natural fourth signal `decide` never had, distinct from a
 * fourth lookup door (an explicit `--subtask` door was rejected: a
 * sub-task's only natural key is a purpose label, i.e. `for`). Only
 * consulted once every executorId/purpose/work resolution above came up
 * empty (a real match always wins, unchanged): when `needsSoul` is true,
 * that empty resolution defaults to native dispatch
 * (`hasNativeMechanism: true`) instead of `"unavailable"` -- the exact
 * generalization of `work`'s own `hasExplicitExecutor === false` branch
 * above, which has hardcoded this same default for every `--work` caller
 * since tsk-5tm-6.
 *
 * `configured` (tsk-60f D3, additive on every returned shape): `true` when
 * the resolved `executorId` names a real `cfg.executors` entry, `false`
 * otherwise -- distinguishing "nothing registered under this name/purpose"
 * from "registered, and its own kind resolves out-of-process", which today
 * both silently collapse into the same `mechanism: "out-of-process"`
 * value. Never a reason to throw (D3): a work item whose own
 * resolved executor has no override configured is `configured:
 * false` by design (tsk-in1 D12), not an error.
 *
 * `mcpTool` (tsk-45f D10, additive, mutually exclusive with `agentType`):
 * MCP hand-back -- a `kind:"tool"` executor whose mcp invocation declares a
 * `tools` map (piece 3) with an entry for the requested purpose gets
 * `mechanism` upgraded from `out-of-process` to `in-process`, carrying
 * `mcpTool` instead of `agentType`. Same reasoning as the agent-kind
 * hand-back: dispatch has no MCP client of its own, so the caller calls its
 * OWN MCP tool directly (AGENTS.md's Dispatch section, D12). Never builds
 * an MCP client here, never touches Gate B3 (`resolveExecutorConfig`) --
 * a caller that skips `decide` and calls `execute` directly on an mcp-only
 * executor still hits that gate exactly as before.
 */
export async function decideExecutorCli(
  executorIdArg,
  {
    cwd = process.cwd(),
    repoRoot,
    hasLiveTaskAccess = false,
    for: purpose,
    work: workIdArg,
    assignment: assignmentArg,
    stage: stageArg,
    needsSoul = false,
    caller,
    // Work-layer lookup for `--work`: ({ workId, stage, fgosDir }) -> { workItem,
    // executorId } | null. Dispatch holds no Work store of its own.
    resolveWork,
  } = {},
) {
  if (!executorIdArg && !purpose && !workIdArg && !assignmentArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
    );
  }
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  let configRoot = root;
  if (cwd) {
    try {
      const wtRoot = resolveRepoRoot(cwd);
      const mainRoot = resolveMainCheckoutRoot(cwd);
      if (mainRoot === root && wtRoot !== root && fs.existsSync(path.join(wtRoot, '.fgos', 'config.json'))) {
        configRoot = wtRoot;
      }
    } catch {}
  }
  const cfg = ensureRunnerConfigForDir(configRoot);

  let workItem;
  let workExecutorId;
  if (!executorIdArg && workIdArg) {
    if (typeof resolveWork !== 'function') {
      throw new RunnerConfigError(
        `--work needs the Work layer to resolve "${workIdArg}" to its dispatch executor; run it through "fgos dispatch decide" instead of the bare dispatch module.`,
      );
    }
    const resolved = resolveWork({ workId: workIdArg, stage: stageArg, fgosDir: fgosDirFromRoot(root) });
    if (!resolved?.workItem) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch executor.`);
    }
    workItem = resolved.workItem;
    workExecutorId = resolved.executorId ?? null;
  }

  let assignmentItem;
  if (!executorIdArg && assignmentArg) {
    const fgosDir = fgosDirFromRoot(root);
    const asgnId = typeof assignmentArg === 'string' ? assignmentArg : assignmentArg?.assignmentId;
    if (asgnId) {
      const assignmentPath = path.join(fgosDir, 'assignments', asgnId, 'assignment.json');
      if (fs.existsSync(assignmentPath)) {
        try {
          assignmentItem = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
        } catch {
          assignmentItem = null;
        }
      }
    }
  }

  const plan = compileDispatchPlan(cfg, {
    executorId: executorIdArg,
    for: purpose,
    work: workIdArg,
    assignment: assignmentArg,
    needsSoul,
    hasLiveTaskAccess,
    caller,
    workItem,
    workExecutorId,
    assignmentItem,
  });

  const resolvedIndirectly = !executorIdArg;
  const base = plan.mcpTool
    ? {
        mechanism: 'in-process',
        mcpTool: plan.mcpTool,
        configured: plan.configured,
        reasonCodes: plan.reasonCodes ?? [],
        ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
      }
    : typeof plan.agentType === 'string' && plan.agentType
      ? {
          mechanism: plan.mechanism,
          agentType: plan.agentType,
          configured: plan.configured,
          reasonCodes: plan.reasonCodes ?? [],
          ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
        }
      : {
          mechanism: plan.mechanism,
          configured: plan.configured,
          reasonCodes: plan.reasonCodes ?? [],
          ...(plan.blockedReason !== undefined ? { blockedReason: plan.blockedReason } : {}),
        };

  return resolvedIndirectly && plan.executorId ? { ...base, executorId: plan.executorId } : base;
}

/**
 * Guard against --repo-root being passed without --cwd when process.cwd() resolves
 * to a different main-checkout root (or is not a main checkout at all, e.g. a worktree).
 * (tsk-322 / D-ADR0030)
 */
export function guardCwdRepoRootDivergence(cwd, repoRoot) {
  if (repoRoot && !cwd) {
    const mainRoot = resolveMainCheckoutRoot(process.cwd());
    const resolvedMain = mainRoot ? path.resolve(mainRoot) : null;
    const resolvedRepo = path.resolve(repoRoot);
    if (!resolvedMain || resolvedMain !== resolvedRepo) {
      const displayMain = mainRoot ? `"${mainRoot}"` : 'not a main checkout';
      throw new RunnerConfigError(
        `--repo-root ("${repoRoot}") passed without --cwd, but process.cwd() main checkout root resolved to ${displayMain} — pass --cwd explicitly.`,
      );
    }
  }
}

/**
 * CLI entry point body (D7 module split): was an inline `if
 * (import.meta.url === ...)` script guard directly in `dispatch.mjs`
 * before this split — now a named export so the barrel `dispatch.mjs`
 * (the file every existing `node src/runner/dispatch.mjs <subcommand> ...`
 * invocation still names) can call it from its own unchanged script guard.
 * Pure relocation: every line of argv-parsing/dispatch logic below is
 * byte-identical to before the split, only wrapped in a function instead
 * of an `if` block.
 */
export async function runDispatchCli(argv = process.argv.slice(2), { returnResult = false, resolveWork } = {}) {
  const [subcommand, ...afterSubcommand] = argv;
  // Purpose-based binding (tsk-2c1): a caller with no pre-registered
  // executorId to name (a gather branch) passes `--for <purpose>` instead
  // of a positional id — distinguished here by whether the token right
  // after the subcommand looks like a flag. Every pre-tsk-2c1 invocation
  // always names a real, non-"--"-prefixed executorId positionally, so
  // this never changes behavior for an existing caller.
  const executorId = afterSubcommand[0] && !afterSubcommand[0].startsWith('--') ? afterSubcommand[0] : undefined;
  const rest = executorId ? afterSubcommand.slice(1) : afterSubcommand;
  const flagValue = (name) => {
    const i = rest.indexOf(name);
    return i !== -1 ? rest[i + 1] : undefined;
  };
  // R9: "Reject duplicate/conflicting flags ... before launch" -- applies to
  // every `cliOverride` flag (`--executor`/`--model`/`--tier`), not just
  // `--executor`. Returns the first duplicated flag name found, or null.
  // Walks `rest` left to right, exactly mirroring `flagValue()`'s own
  // convention that the token immediately after a flag name is that flag's
  // value: once a token is read as a flag position, the next token is
  // consumed as its value and is never itself re-examined as a flag
  // position. This keeps the two functions from disagreeing about what
  // counts as "this flag, with this value" vs. "a flag-looking string that
  // is actually someone else's value" -- and, unlike a bare `indexOf`/
  // `includes` scan, counts every flag position regardless of where in
  // `rest` it falls, including the very last token.
  const findDuplicateOverrideFlag = () => {
    const flagNames = new Set(['--executor', '--model', '--tier']);
    const counts = new Map();
    let i = 0;
    while (i < rest.length) {
      if (flagNames.has(rest[i])) {
        counts.set(rest[i], (counts.get(rest[i]) ?? 0) + 1);
        i += 2;
      } else {
        i += 1;
      }
    }
    for (const name of ['--executor', '--model', '--tier']) {
      if ((counts.get(name) ?? 0) > 1) return name;
    }
    return null;
  };
  switch (subcommand) {
    case 'execute': {
      // tsk-129: tee the spawned executor's own live stdout/stderr chunks to
      // THIS process's stderr as they arrive, reusing the P39 onChunk hook
      // executeExecutorCli already threads through to the adapter (this CLI
      // branch was the one caller that never passed it -- RESEARCH.md).
      // stdout is left untouched, still carrying only the single final JSON
      // line below, so a scripted caller's JSON.parse(stdout) sees no change.
      // Dispatch-path unification: `execute --for <purpose>` is retired.
      // It was the "purpose door" -- resolving a purpose straight to a
      // spawn with zero provider-capacity lease and zero fallback (unlike
      // every other real dispatch door here) -- and had zero live callers
      // (docs/knowledge/how-to-wire-a-skill-to-an-executor-by-purpose-not-
      // by-name/... 's own "Status: pattern proven, no live consumer
      // today"). The correct, real pattern (already how every live caller
      // works) is two-phase: `decide --for <purpose>` resolves the
      // purpose to a real executorId first, then `execute <that id>`
      // dispatches it positionally -- `decide --for` is unaffected by
      // this, only `execute --for` is refused.
      if (flagValue('--for')) {
        const msg = 'execute --for is no longer supported -- resolve the purpose first (`decide --for <purpose>`), then dispatch the resolved executorId positionally (`execute <executorId>`)';
        if (returnResult) throw new StoreError('validation', msg);
        process.stderr.write(`${msg}\n`);
        process.exitCode = 1;
        break;
      }
      const assignmentId = flagValue('--assignment');
      const contractFile = flagValue('--contract');
      // ADR-007 R3: `--contract <file>` is its own dispatch door -- an
      // inline, no-Work/no-Stage Assignment built straight from a
      // caller-authored execution contract file. Reject it combined with
      // `--assignment` up front, before anything else in this subcommand
      // happens (parse, build, dispatch), mirroring how `--assignment`
      // already short-circuits the rest of this branch on its own flag
      // alone, immediately below.
      if (contractFile && assignmentId) {
        const msg = 'execute --contract cannot be combined with --assignment -- pick exactly one dispatch door';
        if (returnResult) throw new StoreError('validation', msg);
        process.stderr.write(`${msg}\n`);
        process.exitCode = 1;
        break;
      }
      if (assignmentId) {
        const cwd = flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd();
        let root = flagValue('--repo-root') ?? resolveMainCheckoutRoot(cwd);
        if (!root) {
          try {
            root = resolveRepoRoot(cwd);
          } catch {
            root = cwd;
          }
        }
        const fgosDir = fgosDirFromRoot(root);
        const asgnPath = path.isAbsolute(assignmentId) || assignmentId.endsWith('.json')
          ? path.resolve(root, assignmentId)
          : path.join(fgosDir, 'assignments', assignmentId, 'assignment.json');
        if (!fs.existsSync(asgnPath)) {
          const msg = `assignment "${assignmentId}" not found at ${asgnPath}`;
          if (returnResult) throw new StoreError('precondition', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        let asgnObj;
        try {
          asgnObj = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
        } catch (err) {
          const msg = `failed to parse assignment at ${asgnPath}: ${err.message}`;
          if (returnResult) throw new StoreError('validation', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        const hasLiveTaskAccess = rest.includes('--has-live-task-access');
        let decided;
        try {
          decided = await decideExecutorCli(undefined, {
            cwd,
            repoRoot: root,
            assignment: assignmentId,
            hasLiveTaskAccess,
          });
        } catch (err) {
          const msg = `dispatch decide failed: ${err.message}`;
          if (returnResult) throw new StoreError('validation', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        if (decided && (decided.mechanism === 'unavailable' || decided.mechanism === null)) {
          const msg = `dispatch decide blocked assignment execution: ${decided.blockedReason ?? decided.reason ?? 'unexecutable mechanism'}`;
          if (returnResult) throw new StoreError('validation', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        const duplicateFlag = findDuplicateOverrideFlag();
        if (duplicateFlag) {
          const msg = `duplicate flag "${duplicateFlag}" -- pass it at most once before launch`;
          if (returnResult) throw new StoreError('validation', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        const cliOverride = {};
        if (flagValue('--model')) cliOverride.model = flagValue('--model');
        if (flagValue('--tier')) cliOverride.tier = flagValue('--tier');
        if (flagValue('--executor')) cliOverride.preferExecutor = flagValue('--executor');
        try {
          const result = await executeAssignment(asgnObj, {
            cwd: flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd(),
            repoRoot: root,
            cliOverride,
            hasLiveTaskAccess,
            isReadOnlyMode: asgnObj.provenance?.kind === 'inline',
            forceSharedCwd: rest.includes('--force-shared-cwd'),
            providerCredentialProbe: createCredentialProbe(),
            onChunk: (stream, chunk) => process.stderr.write(chunk),
          });
          if (returnResult) return result;
          process.stdout.write(`${JSON.stringify(result)}\n`);
        } catch (err) {
          if (returnResult) throw err;
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
        }
        break;
      }

      if (contractFile) {
        // Same cwd/root resolution as the `--assignment` branch just above
        // (ADR-007 R3 explicitly asks this door to match it, not diverge).
        // Note this branch, like `--assignment`, does NOT call
        // `guardCwdRepoRootDivergence` -- that guard is only wired into the
        // plain-prompt path further below; `--assignment` never called it
        // either, so this stays consistent with the closest existing
        // precedent rather than adding a new check unasked.
        const cwd = flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd();
        let root = flagValue('--repo-root') ?? resolveMainCheckoutRoot(cwd);
        if (!root) {
          try {
            root = resolveRepoRoot(cwd);
          } catch {
            root = cwd;
          }
        }
        const fgosDir = fgosDirFromRoot(root);

        // `--contract <file>` reads a raw path exactly like `--prompt-file`
        // above resolves it (relative to process.cwd(), no path.resolve
        // against root/cwd flags) -- same convention, not a new one.
        let raw;
        try {
          raw = fs.readFileSync(contractFile, 'utf8');
        } catch (err) {
          const msg = `failed to read contract file at ${contractFile}: ${err.message}`;
          if (returnResult) throw new StoreError('precondition', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          const msg = `failed to parse contract file at ${contractFile}: ${err.message}`;
          if (returnResult) throw new StoreError('validation', msg);
          process.stderr.write(`${msg}\n`);
          process.exitCode = 1;
          break;
        }

        // The file IS the contract (ADR-006 §4's field list, flat) -- the
        // one exception is an optional top-level `caller` key, pulled out
        // here rather than left for execution-contract.mjs's own
        // unknown-field gate to reject it (`caller` is caller PROVENANCE,
        // never one of execution-contract.mjs's ACCEPTED_CONTRACT_FIELDS).
        let fileCaller;
        let contractFields = parsed;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          ({ caller: fileCaller, ...contractFields } = parsed);
        }

        // `caller.writerId` is auto-resolved via resolveWriterIdentity()
        // only when the file does not already supply a non-empty one --
        // this door is the SECOND real call site for that function
        // (mission-lite.mjs's createMissionAssignment is the first). A
        // file-supplied `parentAssignmentId` always survives untouched
        // either way. See this cell's trace (P03.2.md Gaps) for why
        // "only when absent" was chosen over unconditionally overwriting
        // whatever the file says.
        let caller;
        if (
          fileCaller &&
          typeof fileCaller === 'object' &&
          typeof fileCaller.writerId === 'string' &&
          fileCaller.writerId.trim() !== ''
        ) {
          caller = fileCaller;
        } else {
          const resolvedWriter = resolveWriterIdentity(fgosDir);
          caller = {
            ...(fileCaller && typeof fileCaller === 'object' ? fileCaller : {}),
            writerId: String(resolvedWriter.id),
          };
        }

        // ADR-007 §1/R5: reuse the exact `--work <id>` lookup `decide
        // --work` already established (cli.mjs, `listWork(fgosDir).work[workIdArg]`)
        // -- this is what lets the domain harness seam actually fire for an
        // inline contract attached to a real Work at a declared Stage.
        const workIdArg = flagValue('--work');
        let work;
        if (workIdArg) {
          work = typeof resolveWork === 'function'
            ? resolveWork({ workId: workIdArg, fgosDir })?.workItem
            : undefined;
          if (!work) {
            const msg = `no work item "${workIdArg}" found -- cannot attach inline contract to it`;
            if (returnResult) throw new StoreError('precondition', msg);
            process.stderr.write(`${msg}\n`);
            process.exitCode = 1;
            break;
          }
        }

        // A mutating contract (or any other execution-contract.mjs /
        // domain-harness rejection) must exit non-zero HERE, before
        // executeAssignment (and therefore any executor) is ever reached --
        // buildAssignment()'s inline path throws RunnerConfigError
        // synchronously for exactly this (ADR-006 §6).
        // ADR-006 R4 / Red-Team fix (P03.2): createAssignmentId's own
        // directory scan is check-then-act, so two genuinely concurrent
        // invocations under the same writer identity or Work can compute
        // the same candidate id before either directory exists. Claim the
        // id atomically (claimAssignmentId, assignment.mjs) instead of
        // building once -- this rebuilds and rescans on collision without
        // writing assignment.json's content itself (R3.5), which stays
        // executeAssignment()'s own lazy first-write responsibility.
        const assignmentsDir = path.join(fgosDir, 'assignments');
        let assignment;
        try {
          assignment = claimAssignmentId(
            () =>
              buildAssignment({
                ...(work ? { work } : {}),
                options: { assignmentsDir },
                provenance: {
                  kind: 'inline',
                  contract: contractFields,
                  caller,
                },
              }),
            assignmentsDir,
          );
        } catch (err) {
          if (returnResult) throw err;
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
          break;
        }

        const hasLiveTaskAccess = rest.includes('--has-live-task-access');
        try {
          // No separate decideExecutorCli pre-flight here -- mirrors
          // mission-lite's own real call site (mission-lite.mjs's
          // runMissionAssignment), which never calls it either:
          // executeAssignment() already runs the identical governance gate
          // (compileDispatchPlan) internally before ever spawning an
          // executor, so a second, earlier call here would only duplicate
          // that same check under a different error message, not add one.
          // `isReadOnlyMode: true` unconditionally -- this Assignment's
          // `provenance.kind` is always 'inline' by construction, the exact
          // condition the `--assignment` branch above already treats as
          // mission-lite-strictly-read-only (ADR-006 R8).
          const duplicateFlag = findDuplicateOverrideFlag();
          if (duplicateFlag) {
            const msg = `duplicate flag "${duplicateFlag}" -- pass it at most once before launch`;
            if (returnResult) throw new StoreError('validation', msg);
            process.stderr.write(`${msg}\n`);
            process.exitCode = 1;
            break;
          }
          const cliOverride = {};
          if (flagValue('--model')) cliOverride.model = flagValue('--model');
          if (flagValue('--tier')) cliOverride.tier = flagValue('--tier');
          if (flagValue('--executor')) cliOverride.preferExecutor = flagValue('--executor');
          const result = await executeAssignment(assignment, {
            cwd,
            repoRoot: root,
            cliOverride,
            hasLiveTaskAccess,
            isReadOnlyMode: true,
            forceSharedCwd: rest.includes('--force-shared-cwd'),
            providerCredentialProbe: createCredentialProbe(),
            onChunk: (stream, chunk) => process.stderr.write(chunk),
          });
          if (returnResult) return result;
          process.stdout.write(`${JSON.stringify(result)}\n`);
        } catch (err) {
          if (returnResult) throw err;
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
        }
        break;
      }

      let prompt = flagValue('--prompt') ?? '';
      const promptFile = flagValue('--prompt-file');
      if (promptFile) {
        try {
          prompt = fs.readFileSync(promptFile, 'utf8');
        } catch (err) {
          if (returnResult) throw new StoreError('precondition', err.message);
          process.stdout.write(
            `${JSON.stringify(err instanceof DispatchError ? { error: err.message, errorClass: err.errorClass } : { error: err.message })}\n`,
          );
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
          break;
        }
      }
      try {
        guardCwdRepoRootDivergence(flagValue('--cwd') ?? flagValue('--dir'), flagValue('--repo-root'));
      } catch (err) {
        if (returnResult) throw err;
        process.stdout.write(
          `${JSON.stringify(err instanceof DispatchError ? { error: err.message, errorClass: err.errorClass } : { error: err.message })}\n`,
        );
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
        break;
      }
      try {
        const executed = await executeExecutorCli(executorId, {
          prompt,
          model: flagValue('--model'),
          tier: flagValue('--tier'),
          carries: flagValue('--carries'),
          cwd: flagValue('--cwd') ?? flagValue('--dir'),
          repoRoot: flagValue('--repo-root'),
          hasLiveTaskAccess: rest.includes('--has-live-task-access'),
          onChunk: (stream, chunk) => process.stderr.write(chunk),
        });
        if (returnResult) return executed;
        process.stdout.write(`${JSON.stringify(executed)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        // Structured errorClass on stdout (dispatch-execute optimization
        // pass): a caller (a skill following executor-dispatch-fallback.md,
        // or the runner loop) can now tell "dispatch-in-flight -- back off
        // and retry shortly" apart from "dispatch-depth-exceeded -- stop,
        // this needs a human" apart from every other failure, instead of
        // only ever seeing a bare exit-1 + a human-readable message on
        let errorClass = err.errorClass;
        if (!errorClass) {
          const code = err.code ?? '';
          if (code.startsWith('governance') || code.startsWith('redirect.') || (err.message && (/governance gate rejected/.test(err.message) || /cross-provider/.test(err.message)))) {
            errorClass = 'governance-refused';
          }
        }
        process.stdout.write(`${JSON.stringify(errorClass ? { error: err.message, errorClass } : { error: err.message })}\n`);
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    case 'decide': {
      try {
        guardCwdRepoRootDivergence(flagValue('--cwd') ?? flagValue('--dir'), flagValue('--repo-root'));
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
        break;
      }
      try {
        const decided = await decideExecutorCli(executorId, {
          cwd: flagValue('--cwd') ?? flagValue('--dir'),
          repoRoot: flagValue('--repo-root'),
          hasLiveTaskAccess: rest.includes('--has-live-task-access'),
          for: flagValue('--for'),
          work: flagValue('--work'),
          assignment: flagValue('--assignment'),
          stage: flagValue('--stage'),
          needsSoul: rest.includes('--needs-soul'),
          resolveWork,
        });
        if (returnResult) return decided;
        process.stdout.write(`${JSON.stringify(decided)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    case 'reconcile': {
      const runDir = executorId ?? flagValue('--run-dir') ?? (typeof positional !== 'undefined' ? positional[1] : undefined);
      if (!runDir) {
        const msg = 'dispatch reconcile requires a run directory: node src/runner/dispatch.mjs reconcile <runDir>\n';
        if (returnResult) throw new StoreError('validation', msg.trim());
        process.stderr.write(msg);
        process.exitCode = 1;
        break;
      }
      try {
        const result = await reconcileCliSpawnRun(runDir, {
          controlEpoch: flagValue('--control-epoch') ? Number(flagValue('--control-epoch')) : undefined,
          controlToken: flagValue('--control-token'),
        });
        if (returnResult) return result;
        process.stdout.write(`${JSON.stringify(result)}\n`);
      } catch (err) {
        if (returnResult) throw err;
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
      }
      break;
    }
    default: {
      const msg = `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs execute <executorId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access] | decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --needs-soul [--has-live-task-access] | reconcile <runDir> [--control-epoch <n>] [--control-token <t>]\n`;
      if (returnResult) throw new StoreError('validation', msg.trim());
      process.stderr.write(msg);
      process.exitCode = 1;
    }
  }
}
