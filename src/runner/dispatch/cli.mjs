// dispatch/cli.mjs — dispatch behavior + the thin CLI doors over it (D7,
// tsk-2uf-1): `executorIdForWork`, `spawnWorker` (the automated dispatch
// path `loop.mjs` calls), `logExecutorDispatch`, and the `execute`/`decide`/
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
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { DEFAULTS } from '../../state/work.mjs';
import { DOMAINS, resolveDomainName, bundleForStage, resolveTaskSpecPath } from '../../state/workflow-stage-graphs.mjs';
import { loadAgentDefs, readTaskSpecHeader } from '../agent-roster.mjs';
import { selectTemplate, hashTemplate } from '../prompt-templates.mjs';
import { listWork, resolveWriterLogPath } from '../../state/store.mjs';
import { appendEvent } from '../../state/events.mjs';
import { resolveRepoRoot, resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir, DEFAULT_TIER_TO_POLICY } from './config.mjs';
import { resolveExecutorAndOverrides, resolveExecutorIdForPurpose, modelForTier, executorIdForWork } from './resolve.mjs';
import { resolveAssignmentDispatchPolicy } from './assignment-policy.mjs';
import { decideDispatchMechanism, decideExecutorDispatchMechanism } from './mechanism.mjs';
import { resolveExecutorCommand, EXECUTOR_ADAPTERS, DispatchError } from './transport.mjs';
import { markRunSettled } from './visibility-session.mjs';
import { buildPrompt } from './prepare.mjs';
import { compileDispatchPlan } from './plan.mjs';
import { readSharedConfigOrEmpty } from '../../config/shared-config-file.mjs';
import { hasWorkerSlotRoom } from '../../state/worker-slots.mjs';
import { buildDispatchResult } from './result-ladder.mjs';
import { executeAssignment } from './assignment-runner.mjs';
import { buildAssignment, claimAssignmentId } from './assignment.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';

// Resolved against THIS module's own file location, never a caller-supplied
// `root` -- `bin/fgos.mjs` is a fixed sibling of this checkout's own
// `src/runner/dispatch/cli.mjs`, same "resolve against your own file
// location, never the caller's cwd or repo root" principle
// `gate-check`'s CLI wrapper already establishes elsewhere in this repo, so
// this keeps working from any install shape/test fixture regardless of
// what `root` a given call happens to be resolving `.fgos/`/config against.
const BIN_FGOS_PATH = fileURLToPath(new URL('../../../bin/fgos.mjs', import.meta.url));
import {
  acquireMainCheckoutLock,
  dispatchLockFile,
  ACQUIRED,
  HELD,
  AMBIGUOUS,
  formatLockDurationMs,
} from '../main-checkout-lock.mjs';
import { checkoutDirtyPaths } from '../worktree.mjs';

// executorIdForWork moved to resolve.mjs (self-review finding, 2026-08-25:
// closes the plan.mjs<->cli.mjs import cycle) -- imported above alongside
// this file's other resolve.mjs symbols; this module's own internal
// callers below are unaffected, and dispatch.mjs's barrel now re-exports
// it from resolve.mjs directly (no other file imports it from here).

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
 * `spawnWorker`'s own D20/D22 wiring (review finding H1, tsk-397): the real
 * agent-type this `work` item's dispatch should resolve to, or `null` when
 * there is nothing to resolve from (no taskSpec registered for this
 * domain+stage, or the taskSpec has no header content at all — both
 * legitimate "no opinion" outcomes, not errors). Resolves the taskSpec via
 * `bundleForStage` (D14/D29/D30, the same {skill,taskSpec} lookup
 * `spawnWorker` already uses for the skill half), reads its header via
 * `resolveTaskSpecPath` + `readTaskSpecHeader`, and matches it against the
 * real on-disk agent roster (`loadAgentDefs`) via `resolveAgentTypeForTaskSpec`
 * above.
 *
 * `currentAgentType` is always `null` here: nothing on a work item tracks
 * "which agentType last served this dispatch" today, so there is no real
 * stickiness state to read yet (D32's tie-break priority 2 activates only
 * once such state exists — a later item's own scope, not invented here).
 *
 * The result only has an observable effect on an executor that is already
 * command-less/adapter-less/invocation-less and declares no static
 * `agentType` of its own (see `resolveExecutorConfig`'s own
 * `effectiveAgentType` comment) — every executor this repo configures
 * today (agy, claude, codex, pi) has its own real `command`, so this never
 * changes their dispatch.
 */
export function resolveAgentTypeForWork(work, cwd, stage) {
  const domainObj = DOMAINS[resolveDomainName(work?.domain)];
  const targetStage = stage ?? work?.stage ?? 'executing';
  const { taskSpec } = bundleForStage(domainObj, targetStage);
  if (!taskSpec) return null;
  // resolveTaskSpecPath already returns an absolute path when { cwd } is
  // passed (it joins internally) -- never re-join cwd here too.
  const taskSpecPath = resolveTaskSpecPath(domainObj, taskSpec, { cwd });
  const header = readTaskSpecHeader(taskSpecPath);
  if (Object.keys(header).length === 0) return null;
  const agentDefs = loadAgentDefs(cwd);
  return resolveAgentTypeForTaskSpec(header, agentDefs, null);
}

/**
 * Run the headless executor for `work` inside `cwd` (the worktree checkout
 * — this function never touches the main working tree itself; the caller
 * decides `cwd`). Builds the prompt, resolves tier -> model, resolves the
 * (possibly per-tier/per-executor, P41/tsk-62v) executor + its C9 v2
 * adapter, substitutes the config template, and delegates the actual spawn
 * to that adapter.
 *
 * `opts.fgosDir` (optional, tsk-62v D6): the `.fgos/` directory, needed
 * only so a `kind: "cli"` executor's presence can be checked via
 * `fgos tool query`'s own functions instead of re-probing PATH. Omitted
 * (every pre-tsk-62v call site) skips that check entirely — the item's own
 * `executors`/`executors`/`executor` precedence still resolves exactly as
 * before.
 *
 * Throws `DispatchError('worker-timeout', ...)` when the executor is killed
 * for exceeding `cfg.timeoutMs` (or `opts.timeoutMs`, test-only override),
 * and `DispatchError('worker-spawn-fail', ...)` when the process could not
 * be started at all (e.g. the configured command does not exist). A
 * non-zero exit status from a process that *did* run is NOT an error here —
 * that is the runner's goal-check's concern (per D3: the worker's own exit
 * status/report is never trusted on its own; only `verify` decides).
 *
 * `opts.stage` (tsk-5mj D1/D6/D7, optional): threaded straight through to
 * `buildPrompt`'s own `stage` parameter — omitted (every pre-tsk-5mj call
 * site) keeps the default `'executing'` prompt byte-identical.
 */
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
function watchWritesOutsideWorkspace({ repoRoot, cwd }) {
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
function strayWriteError({ workId, tier, model, cwd, repoRoot, strayPaths }) {
  return new DispatchError(
    'worktree-fail',
    `executor for work "${workId}" reported success but wrote outside its workspace. It was given ${cwd}; these paths became dirty in ${repoRoot} during the round: ${strayPaths.join(', ')}. The round is refused rather than accepted: work in the wrong checkout is not this item's work, and it may belong to whoever else has that checkout open.`,
    { workId, tier, model, reason: 'wrote-outside-workspace', cwd, repoRoot, strayPaths },
  );
}

function openDispatchRun({ fgosDir, workId, executorId, cwd }) {
  if (!fgosDir) return { runDir: undefined, closeRun: () => {} };

  const runDir = path.join(fgosDir, 'dispatch-runs', String(workId ?? executorId), String(Date.now()));
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify({
    runId: `${path.basename(path.dirname(runDir))}-${path.basename(runDir)}`,
    workId: workId ?? null,
    executorId,
    cwd,
    startedAt: new Date().toISOString(),
    status: 'running',
  }, null, 2)}\n`);

  return {
    runDir,
    // `died` is the one failure that says something about the worker's own
    // process; every other outcome ended the round without establishing that.
    closeRun: (status) => {
      try { markRunSettled(runDir, { status }); } catch { /* a run left open is not worth failing a finished dispatch */ }
    },
  };
}

export function spawnWorker(work, cfg, cwd, opts = {}) {
  // Setup stays synchronous and OUTSIDE the adapter call on purpose: a
  // malformed tier/config (RunnerConfigError, via modelForTier/
  // resolveExecutorCommand) must still throw synchronously, before any
  // process is spawned — exactly like the spawnSync-based version, and
  // exactly what dispatch.test.mjs's "throws a RunnerConfigError ... before
  // any spawn" test pins.
  const tier = work.tier ?? DEFAULTS.tier;
  // tsk-5tm-5 D9: executorId computed before modelForTier (moved ahead of
  // its pre-D9 position, right after) so a executor's own providerModel/
  // rigorOverrides can thread into tier resolution — never borrowing
  // Claude's model names for a non-Claude executor's own dispatch.
  const executorId = executorIdForWork(work, opts.stage);
  const { executorId: resolvedExecutorId, executor: executorForTier, overrides: capabilityOverrides } = executorId ? resolveExecutorAndOverrides(cfg, executorId) : {};
  const model = modelForTier(cfg, tier, {
    providerModel: capabilityOverrides?.providerModel ?? executorForTier?.providerModel,
    rigorOverrides: capabilityOverrides?.rigorOverrides ?? executorForTier?.rigorOverrides,
  });
  const prompt = buildPrompt(work, opts.feedback, opts.stage);
  // D20/D22 (review finding H1, tsk-397): only has an observable effect on
  // a command-less/adapter-less/invocation-less executor with no static
  // agentType of its own -- see resolveAgentTypeForWork's own doc comment.
  const resolvedAgentType = resolveAgentTypeForWork(work, cwd, opts.stage);
  // `permissionMode`/`confinement` are carried the whole way or the config
  // door's "bypass requires full confinement" invariant is enforced at load
  // and void at dispatch -- the profile would claim a confined worker and
  // this call would run an unconfined one in the operator's own session.
  const { command, args, argsTemplate, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement, adapter, provider, baseCommit, headRef, governance } = resolveExecutorCommand(cfg, {
    prompt,
    model,
    tier,
    executorId,
    fgosDir: opts.fgosDir,
    // tsk-4hl: attest THIS worker's own dispatch worktree, never fgosDir's
    // root (always the main checkout) — see captureDispatchAttestation's
    // own docstring for why those two roots diverge on a leaf or a retry.
    attestRoot: cwd,
    resolvedAgentType,
  });
  const adapterFn = EXECUTOR_ADAPTERS[adapter];
  if (!adapterFn) {
    throw new RunnerConfigError(`no executor adapter registered for "${adapter}".`);
  }
  const timeoutMs = opts.timeoutMs ?? cfg.timeoutMs;
  const idleTimeoutMs = opts.idleTimeoutMs ?? cfg.idleTimeoutMs;
  const maxBuffer = opts.maxBuffer ?? 10 * 1024 * 1024;

  // Dispatch chokepoint visibility: one line per real spawn, right before it
  // happens, so a human watching the runner's own stderr can see which job
  // (executing-stage skill, executorIdForWork's result — a different axis
  // than the runner.capabilities catalog, D12) resolved to which executor
  // (a real cfg.executors entry, or the global executor when none matches),
  // through which adapter/provider/model/tier. Diagnostic-only: never read
  // back by any caller, never part of this function's return value.
  process.stderr.write(
    `fgos: dispatch job=${executorId} executor=${resolvedExecutorId ?? '(global executor)'} via=${adapter} provider=${provider} model=${model} tier=${tier}\n`,
  );

  // P49: same mechanical selection buildPrompt used internally, called again
  // here (cheap, deterministic, no duplicated LOGIC) purely so the dispatch
  // log can record which template + version produced this prompt. tsk-5mj:
  // threads `opts.stage` through same as buildPrompt's own call, so this
  // log-only selection never drifts from the template actually rendered.
  const templateName = selectTemplate({ kind: work.kind, tier, domain: work.domain, stage: opts.stage });
  const templateHash = hashTemplate(templateName);

  const { runDir: workerRunDir, closeRun } = openDispatchRun({
    fgosDir: opts.fgosDir, workId: work?.id, executorId, cwd,
  });

  const repoRootForWatch = opts.fgosDir ? path.dirname(opts.fgosDir) : undefined;
  const outsideWatch = watchWritesOutsideWorkspace({ repoRoot: repoRootForWatch, cwd });

  return adapterFn({ command, args, argsTemplate, prompt, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement }, {
    cwd,
    repoRoot: opts.fgosDir ? path.dirname(opts.fgosDir) : undefined,
    runDir: workerRunDir,
    timeoutMs,
    idleTimeoutMs,
    maxBuffer,
    onChunk: opts.onChunk,
    workId: work.id,
    tier,
    model,
  }).then(
    // executorId/provider (D7, tsk-62v)/baseCommit/headRef (tsk-4hl)/command
    // (tsk-33w D9)/governance (self-review finding, 2026-08-25): additive
    // only — every field this function already returned stays exactly
    // where it was.
    (result) => {
      closeRun('settled');
      // Settling says the worker finished. It does not say where.
      const strayPaths = outsideWatch.strayPaths();
      if (strayPaths.length > 0) {
        throw strayWriteError({ workId: work.id, tier, model, cwd, repoRoot: repoRootForWatch, strayPaths });
      }
      return { ...result, templateName, templateHash, executorId, provider, command, baseCommit, headRef, governance };
    },
    (err) => {
      // `died` is the one failure that says something about the worker's own
      // process; every other outcome ended the round without establishing
      // that, so it closes as `settled` -- a statement about the run reaching
      // its end, never about the work having succeeded.
      closeRun(err?.outcome === 'died' ? 'died' : 'settled');
      if (err instanceof DispatchError) {
        err.templateName = templateName;
        err.templateHash = templateHash;
      }
      throw err;
    },
  );
}

/**
 * Record one `executor.dispatch` audit line for an IN-SESSION executor
 * call (a live skill's own gather dispatch, tsk-2ie5/tsk-2c1) — the async
 * claim/dispatch cycle's own `executor.dispatch` event (`loop.mjs`) only
 * ever fires from inside a work item's own claim; this is the sibling
 * entry point for a call that has no claim of its own to attach to. Same
 * event `type` and `provider`/`command` shape (D9, `tsk-5td`) so a
 * downstream reader never needs a second vocabulary — `baseCommit`/
 * `headRef` are always `null`: no worktree-dispatch attestation applies to
 * an in-session call (`captureDispatchAttestation` is never invoked here).
 * Writes into THIS writer's own open file under `.fgos/events/`
 * (`resolveWriterLogPath`, TA-D2/TA-D12) — never straight to the frozen
 * baseline `events.jsonl` — so a concurrent in-session gather branch from
 * another writer never contends for the same physical file. `appendEvent`
 * still acquires the shared `events.lock` internally (`withEventsLock`,
 * `src/state/events.mjs`) — no extra locking needed here even when
 * multiple gather branches log concurrently.
 */
// P4 observability (docs/history/agent-coordination-foundation/plan.md):
// `capability`/`mechanism`/`tier`/`fallbackReason` are additive, optional
// fields -- every existing caller that omits them keeps writing the exact
// same payload shape it always has (null, same as baseCommit/headRef were
// before any caller supplied them). Never required, never validated
// against the capability catalog here -- this is a log line, not a gate.
export function logExecutorDispatch(fgosDir, { id, executorId, provider, command, model, governance, plan, capability, mechanism, tier, fallbackReason, outcome }) {
  const gov = governance ?? plan?.governance ?? null;
  return appendEvent(resolveWriterLogPath(fgosDir), {
    type: 'executor.dispatch',
    payload: {
      id,
      executorId,
      provider,
      command,
      model,
      baseCommit: null,
      headRef: null,
      governance: gov,
      capability: capability ?? null,
      mechanism: mechanism ?? null,
      tier: tier ?? null,
      fallbackReason: fallbackReason ?? null,
      // classifyDispatchConfidence (src/report/dispatch-confidence.mjs)
      // already reads payload.outcome as its highest-confidence
      // ('reported') source when present and not 'unsignaled' -- this is
      // the write side completing that already-designed read path, not a
      // new classification concept.
      outcome: outcome ?? null,
    },
  });
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
    for: purpose,
    carries,
    hasLiveTaskAccess = false,
    timeoutMs: timeoutOverride,
    idleTimeoutMs: idleTimeoutOverride,
    maxBuffer: maxBufferOverride,
    onChunk,
    work,
    stage,
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
  } = {},
) {
  if (!executorIdArg && !purpose) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs execute <executorId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access] | execute --for <purpose> [...]',
    );
  }
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  const rawCfg = runnerConfig ?? ensureRunnerConfigForDir(root);
  const cfg = { ...rawCfg };
  if (rawCfg.executor) {
    cfg.executors = {
      ...(rawCfg.executors || {}),
      claude: rawCfg.executor,
      ...(rawCfg.executor.command ? { [rawCfg.executor.command]: rawCfg.executor } : {}),
    };
  }
  const resolvedByPurpose = !executorIdArg;
  // D4 (docs/history/capability-capacity-remodel/CONTEXT.md): resolve
  // through the shared resolver on WHICHEVER key this call actually gave
  // us — `purpose` when purpose-resolved, `executorIdArg` when named
  // directly (itself possibly a purpose-shaped id with no literal
  // `cfg.executors` entry of its own, e.g. "fgos-coding-implement"
  // resolved via `capabilities.<name>.prefer`). A single call per door,
  // never a second one on the already-resolved id afterward — a prior
  // version of this fix called `resolveExecutorAndOverrides` a second
  // time here, on `executorId` post-resolution: for the `--for` door
  // that id is already a literal `cfg.executors` key by then, so the
  // second call always hit the literal-key branch and silently dropped
  // `capabilities.<purpose>.overrides` — found by re-reading this exact
  // code end to end.
  //
  // The two doors keep their own pre-existing error contracts, proven by
  // real tests: `--for` alone throws when nothing resolves ("no executor
  // registered for purpose..." — guides the caller to `decide --for`
  // first); a named `executorIdArg` that resolves to nothing NEVER
  // throws here, silently falling through to the global executor
  // (`resolvedExecutor` stays `undefined` below) — proven by
  // `dispatch.test.mjs`'s own "executeExecutorCli falls back to the
  // global executor when the executorId is not in cfg.executors at all
  // -- never throws".
  let executorId = executorIdArg;
  let resolvedExecutor;
  let capabilityOverrides;
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
    capabilityOverrides = resolved.overrides;
    realExecutorId = resolved.executorId;
    executorConfigured = resolved.configured;
  } else {
    const resolved = resolveExecutorAndOverrides(cfg, executorId);
    resolvedExecutor = resolved.executor; // undefined when unconfigured -- falls through to the global executor below, unchanged
    capabilityOverrides = resolved.overrides;
    realExecutorId = resolved.executorId ?? executorId;
    executorConfigured = resolved.configured;
  }

  // Dispatch chokepoint visibility (both branches below): "capability" is
  // the purpose actually requested via --for when purpose-resolved, or —
  // for a direct executorId call — whichever capabilities that executor
  // itself declares serving (executor.for, D15), so the line still answers
  // "what is this FOR" even without a --for flag. Diagnostic-only.
  const capabilityLabel = purpose ?? (resolvedExecutor?.for?.join(',') || '(none declared)');

  const mechanism = decideExecutorDispatchMechanism(cfg, executorId, { hasLiveTaskAccess });
  if (mechanism === 'in-process') {
    const agentType = resolvedExecutor?.agentType;
    process.stderr.write(
      `fgos: dispatch capability=${capabilityLabel} executor=${executorId} via=in-process agentType=${agentType ?? '(none)'} provider=n/a model=n/a tier=n/a\n`,
    );
    const base = { mechanism, agentType, prompt };
    return resolvedByPurpose ? { ...base, executorId } : base;
  }

  const executor = resolvedExecutor;
  // Dispatch Core Contract Normalization follow-up: governance/provenance
  // now resolve through the SAME resolveAssignmentDispatchPolicy() every
  // other dispatch path uses (Assignment dispatch, coordination dispatch,
  // operation dispatch) -- this used to be a fully separate, inline
  // computation that never consulted `options.disallowedProviders`/
  // `.disallowedExecutors` at all, a real governance gap on the direct
  // spawn path production dispatch actually runs (`execute --for`/`execute
  // <executorId>`, not just Assignment-backed dispatch).
  //
  // The literal MODEL is still computed by the exact same formula as before
  // (D2's precedence, untouched) and handed to the resolver as an
  // already-resolved `cliOverride.model` -- deliberately never letting the
  // resolver's own tier-driven model-table lookup run for this caller. That
  // lookup (`resolvePolicyTierModel`) reads a legacy flat `cfg.models`
  // table keyed by POLICY tier ("lightweight"/"standard"/.../"critical");
  // `modelForTier` (used here, and by every existing `--tier`/
  // `capabilities.overrides.tier`/`executor.tier` caller of this function)
  // reads the SAME field name keyed by WORK tier ("light"/"standard"/
  // "heavy") -- two genuinely incompatible legacy shapes under one config
  // key that predate this unification; reconciling them is out of scope
  // here. Precomputing the model sidesteps the conflict entirely: real
  // production config always declares `modelPolicies` (provider-keyed,
  // policy-tier), where both readings agree.
  const rigorOverrides = capabilityOverrides?.rigorOverrides ?? executor?.rigorOverrides;
  const tier = tierOverride ?? capabilityOverrides?.tier ?? executor?.tier ?? DEFAULTS.tier;
  const model = modelOverride ?? capabilityOverrides?.model ?? executor?.model ?? modelForTier(cfg, tier, {
    providerModel: capabilityOverrides?.providerModel ?? executor?.providerModel,
    rigorOverrides,
  });
  // `minTier` is informational/provenance only here (nothing else raises
  // it in this ad-hoc dispatch path -- no Work/Assignment risk
  // classification is in play) -- translated via the SAME
  // DEFAULT_TIER_TO_POLICY/rigorOverrides formula `modelForTier` just
  // applied internally, so it reports the same rigor `model` was actually
  // resolved against. A value that fails to translate (an invalid --tier)
  // already failed inside `modelForTier` above before reaching here.
  const policyTier = (rigorOverrides && rigorOverrides[tier]) || DEFAULT_TIER_TO_POLICY[tier];
  resolveAssignmentDispatchPolicy({
    assignment: {
      operation: purpose ?? executorId,
      role: undefined,
      policy: {
        minTier: policyTier,
        providerModel: capabilityOverrides?.providerModel,
        // Only when a real registered executor resolved -- an unconfigured
        // executorId must fall through to resolveAssignmentDispatchPolicy's
        // own global-executor default, exactly like resolveExecutorCommand
        // does downstream, never throw "not a registered executor" for a
        // case this function's own contract has never thrown for.
        ...(executorConfigured ? { preferExecutor: realExecutorId } : {}),
      },
      skills: [],
    },
    runnerConfig: cfg,
    cliOverride: { model },
    options,
  });
  const resolvedAgentType = work ? resolveAgentTypeForWork(work, cwd, stage) : null;
  // Same reason as `spawnWorker`: a confinement the profile declares has to
  // reach the adapter, or the invariant that accepted the profile is fiction.
  const { command, args, argsTemplate, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement, adapter, provider } = resolveExecutorCommand(cfg, {
    prompt,
    model,
    tier,
    executorId,
    fgosDir,
    contentCarries: carries,
    attestRoot: cwd,
    resolvedAgentType,
  });
  const adapterFn = EXECUTOR_ADAPTERS[adapter];
  if (!adapterFn) {
    throw new RunnerConfigError(`no executor adapter registered for "${adapter}".`);
  }
  const timeoutMs = timeoutOverride ?? cfg.timeoutMs;
  const idleTimeoutMs = idleTimeoutOverride ?? cfg.idleTimeoutMs;
  const maxBuffer = maxBufferOverride ?? 10 * 1024 * 1024;

  const identity = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const lockFile = dispatchLockFile(cwd);
  const lockRes = acquireMainCheckoutLock(fgosDir, {
    identity,
    ttlMs: timeoutMs,
    now: Date.now(),
    releaseOnExit: true,
    lockFile,
  });

  if (lockRes.status === HELD) {
    const ageStr = formatLockDurationMs(lockRes.lockAgeMs);
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch for cwd "${cwd}" is already in flight (held for ${ageStr}).`,
      { cwd, lockAgeMs: lockRes.lockAgeMs, remainingTtlMs: lockRes.remainingTtlMs, holderPid: lockRes.holderPid },
    );
  }
  if (lockRes.status === AMBIGUOUS) {
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch lock for cwd "${cwd}" is ambiguous (corrupt or unparseable lock file).`,
      { cwd, lockAgeMs: lockRes.lockAgeMs },
    );
  }
  if (lockRes.status !== ACQUIRED) {
    throw new DispatchError(
      'dispatch-in-flight',
      `dispatch lock for cwd "${cwd}" could not be acquired (status: ${lockRes.status}).`,
      { cwd },
    );
  }

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
      : openDispatchRun({ fgosDir, workId: work?.id, executorId, cwd });
    const outsideWatch = watchWritesOutsideWorkspace({ repoRoot: root, cwd });

    let result;
    try {
      result = await adapterFn(
        { command, args, argsTemplate, prompt, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement },
        { cwd, repoRoot: root, timeoutMs, idleTimeoutMs, maxBuffer, onChunk, workId: executorId, tier, model, runDir: opened.runDir, dispatchBatchKey },
      );
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
    const base = buildDispatchResult({ mechanism, result, headBefore, headAfter, lostUncommittedPaths, provider, command });
    return resolvedByPurpose ? { ...base, executorId } : base;
  } finally {
    lockRes.release();
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
 * executor via `executorIdForWork` (the same executing-stage skill lookup
 * `spawnWorker` already applies) before deciding its mechanism -- the
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
 * `executorIdForWork` result has no override configured is `configured:
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
  } = {},
) {
  if (!executorIdArg && !purpose && !workIdArg && !assignmentArg && !needsSoul) {
    throw new RunnerConfigError(
      'usage: node src/runner/dispatch.mjs decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --assignment <assignmentId> [--has-live-task-access] | decide --needs-soul [--has-live-task-access]',
    );
  }
  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const cfg = ensureRunnerConfigForDir(root);

  let workItem;
  if (!executorIdArg && workIdArg) {
    const fgosDir = fgosDirFromRoot(root);
    workItem = listWork(fgosDir).work[workIdArg];
    if (!workItem) {
      throw new RunnerConfigError(`no work item "${workIdArg}" found -- cannot resolve its dispatch executor.`);
    }
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
    stage: stageArg,
    needsSoul,
    hasLiveTaskAccess,
    caller,
    workItem,
    assignmentItem,
  });

  const resolvedIndirectly = !executorIdArg;
  const base = plan.mcpTool
    ? { mechanism: 'in-process', mcpTool: plan.mcpTool, configured: plan.configured }
    : typeof plan.agentType === 'string' && plan.agentType
      ? { mechanism: plan.mechanism, agentType: plan.agentType, configured: plan.configured }
      : { mechanism: plan.mechanism, configured: plan.configured };

  return resolvedIndirectly && plan.executorId ? { ...base, executorId: plan.executorId } : base;
}

/**
 * `fanout-batch <id,id,...>` subcommand (fanout-execute-consolidation):
 * Consolidates the out-of-process dispatch chain (pick -> execute -> return)
 * and worker slot-checking/trimming into a single fast, testable call for fgos-fanout.
 */
export async function fanoutBatchExecutorCli(
  candidateIdsArg = [],
  { cwd = process.cwd(), repoRoot, hasLiveTaskAccess = false } = {},
) {
  const candidateIds = Array.isArray(candidateIdsArg)
    ? candidateIdsArg
    : String(candidateIdsArg).split(',').map((s) => s.trim()).filter(Boolean);

  const root = repoRoot ?? resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd);
  const fgosDir = fgosDirFromRoot(root);
  const cfg = ensureRunnerConfigForDir(root);

  const ceiling = readSharedConfigOrEmpty(root)?.workerSlots?.ceiling;
  const slotsView = listWork(fgosDir);
  const room = hasWorkerSlotRoom(slotsView, { ceiling, batchSize: candidateIds.length });

  if (!room.allowed) {
    return { fired: [], mechanismChanged: [], unavailable: [], deferred: [...candidateIds], slotsFull: true };
  }

  const freeSlots = room.free !== null && room.free !== undefined ? Math.max(0, room.free) : candidateIds.length;
  const batchToRun = candidateIds.slice(0, freeSlots);
  const deferred = candidateIds.slice(freeSlots);

  const fired = [];
  const mechanismChanged = [];
  const unavailable = [];

  const results = await Promise.allSettled(
    batchToRun.map(async (candidateId) => {
      const workItem = slotsView.work[candidateId];
      if (!workItem) {
        return { kind: 'unavailable', entry: { id: candidateId, reason: 'not-found' } };
      }

      const { mechanism, executorId } = compileDispatchPlan(cfg, {
        work: candidateId,
        workItem,
        hasLiveTaskAccess,
      });

      if (mechanism === 'in-process') {
        return { kind: 'mechanismChanged', entry: { id: candidateId, mechanism, executorId } };
      }
      if (mechanism === 'unavailable') {
        return { kind: 'unavailable', entry: { id: candidateId, executorId } };
      }

      try {
        // `--dir` must be the repo ROOT here, never `fgosDir` -- `dataDir()`
        // (bin/fgos.mjs) always derives `.fgos` from `--dir` itself
        // (`fgosDirFromRoot`), so passing an already-`.fgos` path doubles the
        // suffix into a nonexistent `<root>/.fgos/.fgos`.
        const pickStdout = execFileSync(process.execPath, [BIN_FGOS_PATH, 'pick', candidateId, '--dir', root], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        // Every fgos.mjs verb response is wrapped in the fgos.v1 envelope
        // (`wrapEnvelope`, unconditional) -- the real path lives at
        // `data.worktree.path`, never a bare `.worktreePath`/`.path`.
        const picked = JSON.parse(pickStdout);
        const wtPath = picked.data?.worktree?.path || cwd;

        const execRes = await executeExecutorCli(executorId, {
          // Bug found running tsk-397's own fanout batches (2026-08-20): this
          // call omitted `prompt` entirely, so `executeExecutorCli` fell back
          // to its own default `prompt = ''` and every out-of-process executor
          // (agy) received a literal empty prompt — no edits, no commit, then
          // `return` below failed with "branch has not advanced". `spawnWorker`
          // (this same file, above) already builds the work item's own prompt
          // via `buildPrompt` before dispatching; this out-of-process path
          // needs the identical prompt, built the identical way (no feedback,
          // default 'executing' stage — the same defaults `spawnWorker` uses
          // when its own `opts.feedback`/`opts.stage` are omitted).
          prompt: buildPrompt(workItem),
          cwd: wtPath,
          repoRoot: root,
          hasLiveTaskAccess,
          // D20/D22 (review finding H1, tsk-397): lets executeExecutorCli
          // resolve a real agentType via resolveAgentTypeForWork, same as
          // spawnWorker already does.
          work: workItem,
        });

        const returnArgs = ['return', candidateId, '--dir', root];
        if (execRes && execRes.verifiedSha) {
          returnArgs.push('--worker-verified-sha', execRes.verifiedSha);
        }
        execFileSync(process.execPath, [BIN_FGOS_PATH, ...returnArgs], {
          cwd: wtPath,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        return {
          kind: 'fired',
          entry: {
            id: candidateId,
            status: execRes.status ?? 0,
            signal: execRes.signal ?? null,
            errorClass: execRes.errorClass ?? null,
          },
        };
      } catch (err) {
        return {
          kind: 'fired',
          entry: {
            id: candidateId,
            status: 1,
            errorClass: err.errorClass || 'error',
            error: err.message,
          },
        };
      }
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.status === 'fulfilled') {
      const { kind, entry } = res.value;
      if (kind === 'fired') fired.push(entry);
      else if (kind === 'mechanismChanged') mechanismChanged.push(entry);
      else if (kind === 'unavailable') unavailable.push(entry);
    } else {
      const candidateId = batchToRun[i];
      const err = res.reason;
      fired.push({
        id: candidateId,
        status: 1,
        errorClass: err?.errorClass || 'error',
        error: err?.message || String(err),
      });
    }
  }

  return { fired, mechanismChanged, unavailable, deferred };
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
export async function runDispatchCli() {
  const [subcommand, ...afterSubcommand] = process.argv.slice(2);
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
      const assignmentId = flagValue('--assignment');
      const contractFile = flagValue('--contract');
      // ADR-007 R3: `--contract <file>` is its own dispatch door -- an
      // inline, no-Work/no-Stage/no-`decide --for` Assignment built
      // straight from a caller-authored execution contract file. Reject it
      // combined with `--for` or `--assignment` up front, before anything
      // else in this subcommand happens (parse, build, dispatch), mirroring
      // how `--assignment` already short-circuits the rest of this branch
      // on its own flag alone, immediately below.
      if (contractFile && (assignmentId || flagValue('--for'))) {
        const conflictingFlag = assignmentId ? '--assignment' : '--for';
        process.stderr.write(
          `execute --contract cannot be combined with ${conflictingFlag} -- pick exactly one dispatch door\n`,
        );
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
          process.stderr.write(`assignment "${assignmentId}" not found at ${asgnPath}\n`);
          process.exitCode = 1;
          break;
        }
        let asgnObj;
        try {
          asgnObj = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
        } catch (err) {
          process.stderr.write(`failed to parse assignment at ${asgnPath}: ${err.message}\n`);
          process.exitCode = 1;
          break;
        }
        const hasLiveTaskAccess = rest.includes('--has-live-task-access');
        decideExecutorCli(undefined, {
          cwd,
          repoRoot: root,
          assignment: assignmentId,
          hasLiveTaskAccess,
        }).then(
          (decided) => {
            if (decided && (decided.dispatch === 'human-only' || decided.mechanism === 'unavailable' || decided.mechanism === null)) {
              process.stderr.write(`dispatch decide blocked assignment execution: ${decided.blockedReason ?? decided.reason ?? 'unexecutable mechanism'}\n`);
              process.exitCode = 1;
              return;
            }
            const duplicateFlag = findDuplicateOverrideFlag();
            if (duplicateFlag) {
              process.stderr.write(`duplicate flag "${duplicateFlag}" -- pass it at most once before launch\n`);
              process.exitCode = 1;
              return;
            }
            const cliOverride = {};
            if (flagValue('--model')) cliOverride.model = flagValue('--model');
            if (flagValue('--tier')) cliOverride.tier = flagValue('--tier');
            if (flagValue('--executor')) cliOverride.preferExecutor = flagValue('--executor');
            return executeAssignment(asgnObj, {
              cwd: flagValue('--cwd') ?? flagValue('--dir') ?? process.cwd(),
              repoRoot: root,
              cliOverride,
              hasLiveTaskAccess,
              isReadOnlyMode: asgnObj.provenance?.kind === 'inline',
              onChunk: (stream, chunk) => process.stderr.write(chunk),
            }).then(
              (result) => {
                process.stdout.write(`${JSON.stringify(result)}\n`);
              },
              (err) => {
                process.stderr.write(`${err.message}\n`);
                process.exitCode = 1;
              },
            );
          },
          (err) => {
            process.stderr.write(`dispatch decide failed: ${err.message}\n`);
            process.exitCode = 1;
          },
        );
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
          process.stderr.write(`failed to read contract file at ${contractFile}: ${err.message}\n`);
          process.exitCode = 1;
          break;
        }
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          process.stderr.write(`failed to parse contract file at ${contractFile}: ${err.message}\n`);
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
          work = listWork(fgosDir).work[workIdArg];
          if (!work) {
            process.stderr.write(`no work item "${workIdArg}" found -- cannot attach inline contract to it\n`);
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
            process.stderr.write(`duplicate flag "${duplicateFlag}" -- pass it at most once before launch\n`);
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
            onChunk: (stream, chunk) => process.stderr.write(chunk),
          });
          process.stdout.write(`${JSON.stringify(result)}\n`);
        } catch (err) {
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
        process.stdout.write(
          `${JSON.stringify(err instanceof DispatchError ? { error: err.message, errorClass: err.errorClass } : { error: err.message })}\n`,
        );
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
        break;
      }
      executeExecutorCli(executorId, {
        prompt,
        model: flagValue('--model'),
        tier: flagValue('--tier'),
        carries: flagValue('--carries'),
        for: flagValue('--for'),
        cwd: flagValue('--cwd') ?? flagValue('--dir'),
        repoRoot: flagValue('--repo-root'),
        hasLiveTaskAccess: rest.includes('--has-live-task-access'),
        onChunk: (stream, chunk) => process.stderr.write(chunk),
      }).then(
        (executed) => {
          process.stdout.write(`${JSON.stringify(executed)}\n`);
        },
        (err) => {
          // Structured errorClass on stdout (dispatch-execute optimization
          // pass): a caller (a skill following executor-dispatch-fallback.md,
          // or the runner loop) can now tell "dispatch-in-flight -- back off
          // and retry shortly" apart from "dispatch-depth-exceeded -- stop,
          // this needs a human" apart from every other failure, instead of
          // only ever seeing a bare exit-1 + a human-readable message on
          // stderr. `err.message` on stderr is unchanged for a human tailing
          // the terminal.
          process.stdout.write(`${JSON.stringify(err instanceof DispatchError ? { error: err.message, errorClass: err.errorClass } : { error: err.message })}\n`);
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
        },
      );
      break;
    }
    case 'decide': {
      try {
        guardCwdRepoRootDivergence(flagValue('--cwd') ?? flagValue('--dir'), flagValue('--repo-root'));
      } catch (err) {
        process.stderr.write(`${err.message}\n`);
        process.exitCode = 1;
        break;
      }
      decideExecutorCli(executorId, {
        cwd: flagValue('--cwd') ?? flagValue('--dir'),
        repoRoot: flagValue('--repo-root'),
        hasLiveTaskAccess: rest.includes('--has-live-task-access'),
        for: flagValue('--for'),
        work: flagValue('--work'),
        assignment: flagValue('--assignment'),
        stage: flagValue('--stage'),
        needsSoul: rest.includes('--needs-soul'),
      }).then(
        (decided) => {
          process.stdout.write(`${JSON.stringify(decided)}\n`);
        },
        (err) => {
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
        },
      );
      break;
    }
    case 'log': {
      // executorId here is the SAME shared positional above — the log
      // line's own executorId, e.g. whichever id `decide`'s own result
      // named, never a second parsing scheme.
      const id = flagValue('--id');
      const provider = flagValue('--provider');
      const command = flagValue('--command');
      const model = flagValue('--model');
      const capability = flagValue('--capability');
      const mechanism = flagValue('--mechanism');
      const tier = flagValue('--tier');
      const fallbackReason = flagValue('--fallback-reason');
      const outcome = flagValue('--outcome');
      if (!id || !executorId || !provider || !command) {
        process.stderr.write(
          'usage: node src/runner/dispatch.mjs log <executorId> --id <workItemId> --provider <p> --command <c> [--model <m>] [--capability <name>] [--mechanism <m>] [--tier <t>] [--fallback-reason <text>] [--outcome <status>]\n',
        );
        process.exitCode = 1;
      } else {
        const root = resolveMainCheckoutRoot(process.cwd()) ?? resolveRepoRoot(process.cwd());
        const fgosDir = fgosDirFromRoot(root);
        const event = logExecutorDispatch(fgosDir, { id, executorId, provider, command, model, capability, mechanism, tier, fallbackReason, outcome });
        process.stdout.write(`${JSON.stringify(event)}\n`);
      }
      break;
    }
    case 'fanout-batch': {
      const candidateArg = executorId ?? flagValue('--candidates');
      const candidateIds = candidateArg ? String(candidateArg).split(',').map((s) => s.trim()).filter(Boolean) : [];
      fanoutBatchExecutorCli(candidateIds, {
        cwd: flagValue('--cwd') ?? flagValue('--dir'),
        hasLiveTaskAccess: rest.includes('--has-live-task-access'),
      }).then(
        (result) => {
          process.stdout.write(`${JSON.stringify(result)}\n`);
        },
        (err) => {
          process.stderr.write(`${err.message}\n`);
          process.exitCode = 1;
        },
      );
      break;
    }
    default: {
      process.stderr.write(
        `unknown subcommand ${JSON.stringify(subcommand)}. Usage: node src/runner/dispatch.mjs execute <executorId> [--prompt <text>] [--model <name>] [--tier <name>] [--carries <class>] [--has-live-task-access] | execute --for <purpose> [...] | decide <executorId> [--has-live-task-access] | decide --for <purpose> [--needs-soul] [--has-live-task-access] | decide --work <workId> [--stage <stage>] [--has-live-task-access] | decide --needs-soul [--has-live-task-access] | log <executorId> --id <id> --provider <p> --command <c> [--model <m>]\n`,
      );
      process.exitCode = 1;
    }
  }
}
