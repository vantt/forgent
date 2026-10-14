// src/runner/work-dispatch.mjs — Work-driven dispatch: the automated path the runner
// loop takes to run an executor for a Work item.
//
// Dispatch itself (src/runner/dispatch/**) knows nothing about Work, domains or
// steps. This module is the Work layer's door into it: it resolves the item's
// executor, capability hints, agent type and prompt from the item's Workflow
// step, then calls dispatch's generic building blocks.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveTaskSpecPath, resolveContentRoot } from './paths.mjs';
import { loadAgentDefs, readTaskSpecHeader } from './agent-roster.mjs';
import { selectTemplate, hashTemplate } from './prompt-templates.mjs';
import { RunnerConfigError } from './dispatch/config.mjs';
import { resolveStrongerRigor, RIGOR_VALUES } from './rigor.mjs';
import { stampDeclaredAssignment } from './dispatch/assignment-normalizer.mjs';
import { deriveOperationCapability } from './operation-capability.mjs';
import { resolveExecutorAndOverrides, resolveExecutorConfig } from './dispatch/resolve.mjs';
import { DispatchError } from './dispatch/dispatch-error.mjs';
import { resolveAgentTypeForTaskSpec, watchWritesOutsideWorkspace, strayWriteWarning } from './dispatch/cli.mjs';
import { runUnit, resolveGitRoots } from './execution/run.mjs';
import { executorIdForWork, resolveCapabilityIdentityDetails, workCapabilityHints, buildPrompt } from './work-compat.mjs';
import { getDomain, resolveDomainName, effectiveStep, bundleForStep, operationsForStep } from '../state/domain-registry.mjs';
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
 * Run the worker for `work` inside `cwd` (the item's dispatch worktree; this function never
 * touches the main working tree itself) as one Unit through `runUnit`, the same execution door
 * `fgos run` uses. The Unit comes from `workUnitFor`; bind chooses the executor (the step's
 * executor is a soft preference), the worker runs confined, and the runner commits what it left
 * in the worktree. The worker never commits.
 *
 * Resolves with the fields the runner loop reads: `status`/`signal` (the worker's exit),
 * `executorId`/`provider`/`command`/`model`/`tier` (what actually ran), `stdout` (the worker's
 * output, read back from the run's log), `attestation`, `baseCommit`/`headRef`, `governance`,
 * `templateName`/`templateHash`, and `unitRunId` plus `commit` (`runner`, `self` or `none`, and
 * the runner's commit record under `runnerCommit`).
 *
 * Rejects with a `DispatchError` whose `errorClass` is recovery-matrix vocabulary:
 * `worker-timeout`, `worker-spawn-fail`, `provider-limit` (every candidate of the pool hit its
 * limit), `worktree-fail` (the runner commit failed, or an index someone else staged refused the
 * launch), `no-executor` (nothing may run this Unit, decided before any worker started) and `worker-failed` (the worker ran, its round did not pass, and it left uncommitted
 * changes). A round that did not pass and left nothing behind resolves with `commit: 'none'`:
 * per D3 only `verify` decides, on the branch as it stands.
 *
 * `opts.stage` names the step (default: the item's own); `opts.feedback` rides into the prompt;
 * `opts.onUnitRunCreated(unitRunId)` is told the run's id as soon as it exists.
 *
 * The loop runs without a pane: `herdrPresent: false` keeps the cli transport even when the
 * runner itself was started inside herdr.
 */
export async function spawnWorker(work, cfg, cwd, opts = {}) {
  const repoRoot = opts.repoRoot ?? (opts.fgosDir ? path.dirname(opts.fgosDir) : undefined);
  const { unitData, warnings: unitWarnings } = workUnitFor(work, { cfg, stage: opts.stage, feedback: opts.feedback, worktree: cwd });
  const templateName = selectTemplate({ kind: work.kind, domain: work.domain, stage: opts.stage });
  const templateHash = hashTemplate(templateName);
  const baseCommit = gitIn(cwd, ['rev-parse', 'HEAD']);
  const headRef = gitIn(cwd, ['symbolic-ref', '--quiet', '--short', 'HEAD']);

  const mainRoot = repoRoot ?? resolveGitRoots(cwd).mainCheckoutRoot;
  // Settling says the worker finished, not where it wrote: a file outside its worktree that
  // became dirty in the main checkout during the round is reported (never blocked).
  const outsideWatch = watchWritesOutsideWorkspace({ repoRoot: mainRoot, cwd });

  let unitRunId = null;
  const unit = await runUnit({
    unitData,
    worktree: cwd,
    cwd,
    ...(repoRoot ? { repoRoot } : {}),
    session: { headless: true, herdrPresent: false },
    onUnitRunCreated: (id) => {
      unitRunId = id;
      opts.onUnitRunCreated?.(id);
    },
  });
  unitRunId = unit.unitRunId ?? unitRunId;
  const seat = unit.results?.[unit.results.length - 1] ?? {};
  const runResult = seat.runResult ?? null;
  const binding = seat.binding ?? null;
  const ran = describeBinding(mainRoot, unitRunId, binding);
  const stdout = workerOutput(mainRoot, runResult, binding);
  const stderr = readRunLog(mainRoot, runResult?.runtime?.stderrLog) ?? '';
  const strayWarning = strayWriteWarning({ repoRoot: mainRoot, strayPaths: outsideWatch.strayPaths() });
  const warnings = [...(unitWarnings ?? []), ...(runResult?.warnings ?? []), ...(strayWarning ? [strayWarning] : [])];
  const facts = {
    unitRunId,
    executorId: binding?.executor ?? null,
    provider: ran.provider,
    command: ran.command,
    governance: ran.governance,
    model: binding?.model ?? runResult?.policy?.model ?? null,
    tier: binding?.tier ?? runResult?.policy?.tier ?? null,
    status: runResult?.runtime?.exitCode ?? null,
    signal: runResult?.runtime?.signal ?? null,
    stdout,
    stderr,
    attestation: runResult ? { confinement: runResult.confinement ?? null, adapter: runResult.adapter ?? null, runId: runResult.runId ?? null } : null,
    baseCommit,
    headRef,
    templateName,
    templateHash,
    ...(warnings.length ? { warnings } : {}),
  };
  process.stderr.write(
    `fgos: dispatch unit=${unitRunId} executor=${facts.executorId ?? '(none)'} via=${binding?.transport ?? '(none)'} model=${facts.model} tier=${facts.tier} outcome=${seat.outcome ?? unit.outcome}\n`,
  );

  const fail = (errorClass, message, extra = {}) => new DispatchError(errorClass, message, { ...facts, ...extra });
  if (seat.commit?.status === 'failed') {
    throw fail('worktree-fail', `runner commit of the worker's changes failed: ${seat.commit.error ?? seat.commit.reason}`, { runnerCommit: seat.commit });
  }
  const outcome = seat.outcome ?? unit.outcome;
  if (outcome === 'pass') {
    const commitStatus = seat.commit?.status;
    const commit = commitStatus === 'committed' ? 'runner'
      : gitIn(cwd, ['rev-parse', 'HEAD']) === baseCommit ? 'none' : 'self';
    return { ...facts, commit, runnerCommit: seat.commit ?? null };
  }
  // Refused before any worker started: the launch itself could not happen.
  if (outcome === 'policy-refusal' && !runResult) {
    const refused = seat.refused ?? {};
    if (refused.reason === 'foreign-staged-index') {
      throw fail('worktree-fail', `the worktree's index holds changes the runner did not stage: ${refused.detail ?? ''}`.trim(), { refused });
    }
    throw fail('no-executor', `no executor may run this work (capability "${unitData.capability}"): ${refused.reason ?? 'refused'}${refused.detail ? ` (${refused.detail})` : ''}; register an executor with a confined invocation in runner.capabilities["${unitData.capability}"].prefer`, { refused });
  }
  if (outcome === 'provider-limit') {
    throw fail('provider-limit', `every candidate for this work hit its provider limit${seat.fallbackExhausted?.detail ? `: ${seat.fallbackExhausted.detail}` : ''}`, { fallbackExhausted: seat.fallbackExhausted ?? null });
  }
  const failureCode = runResult?.classification?.failure?.code ?? null;
  if (failureCode === 'execution-timeout') {
    throw fail('worker-timeout', `the worker ran past its time budget (unit run ${unitRunId})`);
  }
  if (!runResult || failureCode === 'supervisor-spawn-fail' || facts.status === 127) {
    throw fail('worker-spawn-fail', `the worker could not be started (unit run ${unitRunId}${failureCode ? `, ${failureCode}` : ''})`);
  }
  // The worker ran and its round did not pass, so nothing was committed. Files it left in the
  // worktree must never reach goal-check, which would judge them as if they were on the branch:
  // that round is a failed attempt. A round that left nothing behind is judged on the branch as
  // it stands, as before.
  const reason = runResult.classification?.outcome?.reason ?? seat.refused?.reason ?? outcome;
  if (gitIn(cwd, ['status', '--porcelain', '--untracked-files=all'])) {
    throw fail('worker-failed', `the worker round ended ${outcome} (${reason}, unit run ${unitRunId}); its uncommitted changes were not committed`);
  }
  return { ...facts, commit: 'none', runnerCommit: seat.commit ?? null, outcome };
}

function gitIn(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** A run log the runner wrote (path relative to the main checkout), or null when there is none. */
function readRunLog(mainRoot, rel) {
  if (typeof rel !== 'string' || !rel) return null;
  try {
    return fs.readFileSync(path.resolve(mainRoot, rel), 'utf8');
  } catch {
    return null;
  }
}

/**
 * What the worker said, for the loop's fenced verdict and discovered-work blocks. A cli run's
 * stdout log is the worker's own output. A pane run has no terminal output to read (pane text is
 * never read): its stdout log holds the settled report text instead, so the first source that has
 * text is used, never several, or a fence would be read twice.
 */
function workerOutput(mainRoot, runResult, binding) {
  const stdoutLog = readRunLog(mainRoot, runResult?.runtime?.stdoutLog);
  if (binding?.transport !== 'herdr') return stdoutLog ?? '';
  const reports = (runResult?.settleReports ?? []).map((report) => readRunLog(mainRoot, report?.path)).filter(Boolean).join('\n');
  return [reports, stdoutLog, runResult?.agentClaim?.summary]
    .find((text) => typeof text === 'string' && text.trim()) ?? '';
}

/**
 * The command, provider label and governance of the executor and invocation bind chose, read from
 * the config the unit run pinned. Audit only: nothing is resolved again for the launch itself.
 */
function describeBinding(mainRoot, unitRunId, binding) {
  if (!binding?.executor) return { command: null, provider: null, governance: null };
  try {
    const record = JSON.parse(fs.readFileSync(path.join(mainRoot, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
    const config = record.configSnapshot?.runner ?? {};
    const resolved = resolveExecutorConfig(config, binding.tier, binding.executor, undefined, undefined, undefined, binding.invocation);
    return { command: resolved.command ?? null, provider: resolved.provider ?? resolved.command ?? null, governance: resolved.governance ?? null };
  } catch {
    return { command: null, provider: null, governance: null };
  }
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
 * resolves to. Spread into `executeAssignment` options.
 */
export function workDispatchContext({ work, stage, cwd, executorId } = {}) {
  return {
    work,
    capabilityHints: workCapabilityHints({ work, stage, executorId }),
    agentType: work ? resolveAgentTypeForWork(work, cwd, stage) : null,
  };
}

/**
 * The Unit rigor a Work item demands, before the lower layer applies its own floors
 * (capability rigor, Unit tier override, `maxTier`). Same order as the assignment policy:
 * the operation's own rigor comes first, the item's `rigor` then only raises it, and
 * `risk: heavy` reads as `high` only when the item declares no `rigor`. `undefined` when
 * nothing explicit applies, so the lower layer's default stands.
 */
export function workRigorFor(work, opPolicy) {
  const checked = (value, label) => {
    if (!RIGOR_VALUES.includes(value)) {
      throw new RunnerConfigError(`invalid ${label} rigor "${value}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
    }
    return value;
  };
  let rigor = opPolicy?.rigor !== undefined ? checked(opPolicy.rigor, 'operation') : undefined;
  const raise = (next) => { rigor = rigor === undefined ? next : resolveStrongerRigor(rigor, next); };
  if (work?.rigor !== undefined) raise(checked(work.rigor, 'work'));
  else if (work?.risk === 'heavy') raise('high');
  return rigor;
}

// Same section buildPrompt renders into the worker prompt, for an operation Unit whose
// prompt the dispatch side renders from the operation's contract template.
function feedbackLines(feedback) {
  const answer = typeof feedback?.answer === 'string' && feedback.answer.trim() ? feedback.answer : null;
  const reason = typeof feedback?.reason === 'string' && feedback.reason.trim() ? feedback.reason : null;
  const lines = [];
  if (answer) lines.push(`Human answer (binding decision):\n${answer}`);
  if (reason) lines.push(`Latest human rejection/park reason (fix THIS before anything else):\n${reason}`);
  return lines.length ? `\n\n# Human feedback\n${lines.join('\n\n')}` : '';
}

// A Work ref names a file in the repo. `unit-run:`/`gate-answer:` are Unit input forms
// that read another run's output; an item's editable refs never get to name one.
function isSafeRepoRelative(ref) {
  return typeof ref === 'string' && ref.trim() !== '' && !ref.startsWith('/')
    && !ref.startsWith('unit-run:') && !ref.startsWith('gate-answer:')
    && !ref.includes('\\') && !ref.includes('\0') && !ref.split('/').includes('..');
}

/**
 * The single place a Work item becomes Unit data for `runUnit`.
 *
 * Without `operation` this is a step Unit (the runner loop's worker): its objective is the
 * worker prompt and it is mutating. With `operation` it is an operation Unit (a driver
 * step such as `validate-plan`): its objective names the operation, whose prompt the
 * dispatch side renders from the contract template; `declared` carries the operation
 * semantics and `pinInputs` the absolute files whose bytes the verdict is bound to.
 *
 * `inputs` stay repo-relative; the worker reads them relative to `worktree`. A read-only
 * operation Unit defaults to running where the item's locked plan lives
 * (`resolveContentRoot`). A mutating Unit needs the caller's worktree.
 *
 * Transport and session stay the caller's choice; nothing here decides them.
 *
 * @param {object} item  Work item
 * @param {{ cfg?: object, stateRoot?: string, stage?: string, operation?: string,
 *   feedback?: {answer?: string, reason?: string}, expectedFiles?: string[], worktree?: string }} [opts]
 * @returns {{ unitData: object, declared?: object, pinInputs?: string[], worktree: string, warnings: string[] }}
 */
export function workUnitFor(item, opts = {}) {
  const { cfg = {}, stateRoot, operation, feedback, expectedFiles } = opts;
  if (typeof item?.id !== 'string' || !item.id.trim()) {
    throw new RunnerConfigError('workUnitFor: the work item needs an id.');
  }
  const warnings = [];
  const domain = resolveDomainName(item?.domain);
  const domainObj = getDomain(item?.domain, { onUnrecognized: () => {} });
  const stage = opts.stage ?? effectiveStep(item ?? {}, domainObj);

  let matchedOp;
  let operations;
  let mutating = true;
  if (operation !== undefined) {
    operations = operationsForStep(domainObj, stage, item?.kind);
    matchedOp = operations.find((op) => op.id === operation);
    if (!matchedOp) {
      throw new RunnerConfigError(`operation "${operation}" is not declared at step "${stage}" for work "${item?.id}".`);
    }
    mutating = stampDeclaredAssignment({ role: matchedOp.role, operation }).mutation === 'mutating';
  }

  const executorId = executorIdForWork(item, stage);
  const resolved = executorId ? resolveExecutorAndOverrides(cfg, executorId) : { configured: false };
  const stepCapability = resolveCapabilityIdentityDetails({
    cfg, work: item, stage, executorId, resolvedExecutor: resolved.executor,
  }).capability;
  let capability = stepCapability;
  if (matchedOp) {
    const resultKind = stampDeclaredAssignment({ role: matchedOp.role, operation }).resultKind;
    capability = deriveOperationCapability(
      { ...matchedOp, result: matchedOp.result ?? { kind: resultKind } },
      { domain },
      cfg,
    ).name ?? stepCapability;
  }

  const inputs = [];
  const addInput = (ref) => {
    if (!isSafeRepoRelative(ref)) {
      warnings.push(`work-ref-skipped: ${JSON.stringify(ref)} is not a repo-relative path`);
      return;
    }
    if (!inputs.includes(ref)) inputs.push(ref);
  };
  // An unsafe docsRef is treated as absent: it would otherwise pick the pinned plan and
  // the default worktree outside the repo.
  let docsRef = typeof item?.docsRef === 'string' && item.docsRef.trim() ? item.docsRef : null;
  if (docsRef && !isSafeRepoRelative(docsRef)) {
    warnings.push(`work-docsRef-skipped: ${JSON.stringify(docsRef)} is not a repo-relative path`);
    docsRef = null;
  }
  if (docsRef) {
    addInput(docsRef);
    addInput(path.posix.join(docsRef, 'plan.md'));
    addInput(path.posix.join(docsRef, 'CONTEXT.md'));
  }
  for (const ref of Array.isArray(item?.refs) ? item.refs : []) addInput(ref);

  let worktree = opts.worktree;
  let pinInputs;
  if (matchedOp) {
    if (!stateRoot) throw new RunnerConfigError('workUnitFor: an operation Unit needs stateRoot.');
    const contentRoot = docsRef ? resolveContentRoot(stateRoot, item.id, docsRef) : stateRoot;
    const planPath = docsRef ? path.join(contentRoot, docsRef, 'plan.md') : null;
    pinInputs = planPath && fs.existsSync(planPath) ? [planPath] : [];
    if (!mutating) worktree ??= contentRoot;
  }
  if (!worktree) {
    throw new RunnerConfigError(`workUnitFor: a mutating Unit for work "${item?.id}" needs the caller's worktree.`);
  }

  const writes = !mutating ? [] : (Array.isArray(expectedFiles) && expectedFiles.length ? [...expectedFiles] : ['**']);
  const rigor = workRigorFor(item, matchedOp?.policy);
  const preferId = resolved.configured && cfg.executors?.[resolved.executorId] ? resolved.executorId : null;
  const idTail = String(operation ?? stage);
  const unitId = `work-${item?.id}-${idTail}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/-$/, '');

  const unitData = {
    id: unitId,
    objective: matchedOp
      ? `Execute ${stage}.${operation} operation${feedbackLines(feedback)}`
      : buildPrompt(item, feedback, opts.stage),
    capability,
    writes,
    inputs,
    pattern: 'solo',
    ...(rigor !== undefined ? { rigor } : {}),
    ...(preferId ? { prefer: [preferId] } : {}),
  };

  const workflow = item?.workflow
    ?? (item?.kind !== undefined ? domainObj?.workflowFor?.[item.kind] : undefined)
    ?? domainObj?.defaultWorkflow;
  return {
    unitData,
    ...(matchedOp ? { declared: { workId: item.id, domain, workflow, stage, operation, operations }, pinInputs } : {}),
    worktree,
    warnings,
  };
}
