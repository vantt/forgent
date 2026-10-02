// src/runner/work-dispatch.mjs — Work-driven dispatch: the automated path the runner
// loop takes to run an executor for a Work item.
//
// Dispatch itself (src/runner/dispatch/**) knows nothing about Work, domains or
// steps. This module is the Work layer's door into it: it resolves the item's
// executor, capability hints, agent type and prompt from the item's Workflow
// step, then calls dispatch's generic building blocks.

import path from 'node:path';
import crypto from 'node:crypto';
import { resolveTaskSpecPath } from './paths.mjs';
import { loadAgentDefs, readTaskSpecHeader } from './agent-roster.mjs';
import { selectTemplate, hashTemplate } from './prompt-templates.mjs';
import { RunnerConfigError } from './dispatch/config.mjs';
import { resolveStrongerRigor } from './rigor.mjs';
import { resolveExecutorAndOverrides, resolveTierModel, deriveProviderFamily } from './dispatch/resolve.mjs';
import { resolveExecutorCommand, DispatchError } from './dispatch/transport.mjs';
import { executeThroughConfinement, buildConfinementAttestation } from './dispatch/confinement/authority.mjs';
import { buildConfinementRequest } from './dispatch/confinement/request.mjs';
import {
  resolveAgentTypeForTaskSpec,
  openRunnerRun,
  watchWritesOutsideWorkspace,
  strayWriteError,
} from './dispatch/cli.mjs';
import { executorIdForWork, resolveCapabilityIdentityDetails, workCapabilityHints, buildPrompt } from './work-compat.mjs';
import { getDomain, resolveDomainName, effectiveStep, bundleForStep } from '../state/domain-registry.mjs';
import { listWork } from '../state/store.mjs';

/**
 * `spawnWorker`'s own D20/D22 wiring (review finding H1, tsk-397): the real
 * agent-type this `work` item's dispatch should resolve to, or `null` when
 * there is nothing to resolve from (no taskSpec registered for this
 * domain+stage, or the taskSpec has no header content at all — both
 * legitimate "no opinion" outcomes, not errors). Resolves the taskSpec via
 * `bundleForStep` (the Workflow's step bundle, the same {skill,taskSpec} lookup
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
  const domainName = resolveDomainName(work?.domain);
  const domainObj = getDomain(work?.domain, { onUnrecognized: () => {} });
  const targetStep = stage ?? effectiveStep(work ?? {}, domainObj);
  const { taskSpec } = bundleForStep(domainObj, targetStep, work?.kind);
  if (!taskSpec) return null;
  // resolveTaskSpecPath already returns an absolute path when { cwd } is
  // passed (it joins internally) -- never re-join cwd here too.
  const taskSpecPath = resolveTaskSpecPath(domainName, taskSpec, { cwd });
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
export function spawnWorker(work, cfg, cwd, opts = {}) {
  // Setup stays synchronous and OUTSIDE the adapter call on purpose: a
  // malformed tier/config (RunnerConfigError, via resolveTierModel/
  // resolveExecutorCommand) must still throw synchronously, before any
  // process is spawned — exactly like the spawnSync-based version, and
  // exactly what dispatch.test.mjs's "throws a RunnerConfigError ... before
  // any spawn" test pins.
  const workRigor = work?.rigor ?? (work?.risk === 'heavy' ? 'high' : 'standard');
  const executorId = executorIdForWork(work, opts.stage);
  const { executorId: resolvedExecutorId, executor: executorForTier } = executorId ? resolveExecutorAndOverrides(cfg, executorId) : {};
  const { capability: capabilityName } = resolveCapabilityIdentityDetails({
    cfg,
    work,
    stage: opts.stage,
    executorId,
    resolvedExecutor: executorForTier,
  });
  const capabilityRigor = capabilityName ? cfg.capabilities?.[capabilityName]?.rigor : undefined;
  const effectiveRigor = capabilityRigor ? resolveStrongerRigor(workRigor, capabilityRigor) : workRigor;
  const policyTier = cfg.rigorToTier?.[effectiveRigor] ?? 'standard';
  const providerFamily = deriveProviderFamily(executorForTier);
  const model = executorForTier?.model ?? resolveTierModel(cfg, policyTier, providerFamily);
  const modelSource = { scope: 'placement-policy', id: `${providerFamily}.${policyTier}` };
  const tier = policyTier;
  const prompt = buildPrompt(work, opts.feedback, opts.stage);
  // D20/D22 (review finding H1, tsk-397): only has an observable effect on
  // a command-less/adapter-less/invocation-less executor with no static
  // agentType of its own -- see resolveAgentTypeForWork's own doc comment.
  const resolvedAgentType = resolveAgentTypeForWork(work, cwd, opts.stage);
  // `permissionMode`/`confinement` are carried the whole way or the config
  // door's "bypass requires full confinement" invariant is enforced at load
  // and void at dispatch -- the profile would claim a confined worker and
  // this call would run an unconfined one in the operator's own session.
  const { command, args, argsTemplate, env, liveOutput, interactiveMode, promptDelivery, permissionMode, confinement, adapter, provider, baseCommit, headRef, governance, method, url, headers, body, resourceBindings } = resolveExecutorCommand(cfg, {
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
    `fgos: dispatch job=${executorId} executor=${resolvedExecutorId ?? '(global executor)'} via=${adapter} provider=${provider} model=${model} tier=${tier} modelSource=${modelSource}\n`,
  );

  // P49: same mechanical selection buildPrompt used internally, called again
  // here (cheap, deterministic, no duplicated LOGIC) purely so the dispatch
  // log can record which template + version produced this prompt. tsk-5mj:
  // threads `opts.stage` through same as buildPrompt's own call, so this
  // log-only selection never drifts from the template actually rendered.
  const templateName = selectTemplate({ kind: work.kind, tier, domain: work.domain, stage: opts.stage });
  const templateHash = hashTemplate(templateName);

  const { runDir: workerRunDir, closeRun } = openRunnerRun({
    fgosDir: opts.fgosDir, workId: work?.id, executorId, cwd,
  });

  const repoRootForWatch = opts.fgosDir ? path.dirname(opts.fgosDir) : undefined;
  const outsideWatch = watchWritesOutsideWorkspace({ repoRoot: repoRootForWatch, cwd });

  const stageSkill = executorId;
  const targetStage = opts.stage ?? effectiveStep(work ?? {}, getDomain(work?.domain, { onUnrecognized: () => {} }));
  const capabilityResolution = resolveCapabilityIdentityDetails({
    cfg,
    work,
    stage: targetStage,
    executorId,
    resolvedExecutor: executorForTier,
  });
  const { capability, anchorCapability } = capabilityResolution;

  let confinementRequest;
  try {
    confinementRequest = buildConfinementRequest({
      capability,
      stageSkill,
      executorId: resolvedExecutorId ?? executorId,
      fallbackFrom: anchorCapability,
      anchorCapability,
      cfg,
      providerCapacity: opts.providerCapacity,
      invocation: {
        command,
        args,
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
        repoRoot: repoRootForWatch,
        runDir: workerRunDir,
        fgosDir: opts.fgosDir,
        timeoutMs,
        idleTimeoutMs,
        maxBuffer,
        onChunk: opts.onChunk,
        workId: work.id,
        tier,
        model,
      },
    });
  } catch (err) {
    closeRun('settled');
    const dispatchId = `disp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const refusedAttestation = buildConfinementAttestation({
      request: {
        contract: 'confinement-request.v1',
        dispatchId,
        capability: capability ?? executorId ?? '(unknown-capability)',
        stageSkill,
        executorId: resolvedExecutorId ?? executorId,
        requirement: { mode: 'required', error: err.message },
        context: { cwd, runDir: workerRunDir },
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
        capability: capability ?? executorId ?? '(unknown-capability)',
        stageSkill,
        executorId: resolvedExecutorId ?? executorId,
        attestation: refusedAttestation,
        cause: err,
      },
    );
  }

  return executeThroughConfinement(confinementRequest).then(
    // executorId/provider (D7, tsk-62v)/baseCommit/headRef (tsk-4hl)/command
    // (tsk-33w D9)/governance (self-review finding, 2026-08-25): additive
    // only — every field this function already returned stays exactly
    // where it was.
    (doorResult) => {
      closeRun('settled');
      // Settling says the worker finished. It does not say where.
      const strayPaths = outsideWatch.strayPaths();
      if (strayPaths.length > 0) {
        throw strayWriteError({ workId: work.id, tier, model, cwd, repoRoot: repoRootForWatch, strayPaths });
      }
      const execResult = doorResult?.result ?? doorResult;
      return {
        ...execResult,
        attestation: doorResult?.attestation,
        templateName,
        templateHash,
        executorId,
        provider,
        command,
        baseCommit,
        headRef,
        governance,
      };
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
 * The Work-layer lookup dispatch's CLI calls for `--work <id>`: the Work item and the
 * executor identity its Workflow step resolves to. Returns null when the item is unknown.
 *
 * @param {{ workId: string, stage?: string, fgosDir: string }} params
 */
export function resolveWorkForDispatch({ workId, stage, fgosDir }) {
  const work = listWork(fgosDir).work?.[workId];
  if (!work) return null;
  return { workItem: work, executorId: executorIdForWork(work, stage) };
}

/**
 * The generic, Work-agnostic inputs a Work-driven dispatch hands dispatch: the Work
 * item as data, the capability hints its step implies, and the agent type its task spec
 * resolves to. Spread into `executeAssignment`/`executeExecutorCli` options.
 */
export function workDispatchContext({ work, stage, cwd, executorId } = {}) {
  return {
    work,
    capabilityHints: workCapabilityHints({ work, stage, executorId }),
    agentType: work ? resolveAgentTypeForWork(work, cwd, stage) : null,
  };
}
