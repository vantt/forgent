// src/workflow/case-start.mjs — how a Workflow case begins: the start sources, the opening events, the detached spawn
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { normalizeContextRefs } from './definition.mjs';
import { loadWorkflow, workflowPersonaScope } from './loader.mjs';
import { createWorkflowRun, appendWorkflowEvent, readWorkflowEvents, projectWorkflowState } from './store.mjs';
import { translateUnitsToWorkflow } from './units-source.mjs';
import { snapshotRunnerConfig, resolveGitRoots, assertRepositoryForWrites, detectHerdrPresent } from '../runner/execution/run.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { expandWorkflowSeats, normalizeSeats, personaNameOf, seatedPanelUnits } from './seats.mjs';
import { digestContextRefs, digestText } from './ref-digests.mjs';
import { resolveAgentDefinition } from '../runner/agent-definitions.mjs';
import { RunnerConfigError, assertReasoningEffort, loadRunnerConfigForDir, parseRunTimeout, assertRunTimeoutMs } from '../runner/dispatch/config.mjs';
import { providerAccountInventory } from '../runner/dispatch/provider-capacity.mjs';
import { legacyStateKey } from '../runner/dispatch/llm-accounts.mjs';
import { parseAccountPin } from '../runner/execution/account-pin.mjs';
import { normalizeStanceOptions } from '../runner/execution/unit.mjs';
import { spawnDetachedCli } from '../cli/detached-child.mjs';
import { ADVANCE_DETACHED_ENV } from './case-lock.mjs';
import { assertWriteChains, workflowCheckout } from './unit-handoff.mjs';
import { RIGOR_ORDER } from './case-projection.mjs';
import { bindWorktree } from './case-bindings.mjs';
import { nestedStartRefusal } from './case-admission-port.mjs';
import { chargeNestedCase, refundNestedCase } from './case-frame.mjs';

const FRAME_COUNT_KEYS = Object.freeze(['dispatches', 'mutatingDispatches', 'fallbackPerSeat', 'deviationsBeforeAsk', 'seatLaunchesPerDispatch']);

/**
 * The frame a case opens with: the guide's defaults, narrowed by the flags given at start and never
 * widened. A count may only go down, the rigor floor only up; a count the guide leaves to the approver
 * takes whatever is given. A guide with no frame defaults has nothing to narrow.
 *
 * @param {object | null | undefined} guide
 * @param {Record<string, number | string> | undefined} flags
 * @returns {object | null}
 */
export function resolveFrame(guide, flags) {
  const asked = flags && Object.keys(flags).length > 0 ? flags : null;
  const defaults = guide?.frameDefaults ?? null;
  if (defaults === null) {
    if (asked) throw new RunnerConfigError(`--frame narrows the frame defaults of a guide, and "${guide?.id ?? 'this workflow'}" states none`);
    return null;
  }
  const frame = { ...defaults };
  for (const [key, raw] of Object.entries(asked ?? {})) {
    if (key === 'rigorFloor') {
      if (!RIGOR_ORDER.includes(raw)) throw new RunnerConfigError(`--frame rigorFloor must be one of [${RIGOR_ORDER.join(', ')}], got "${raw}"`);
      if (RIGOR_ORDER.includes(frame.rigorFloor) && RIGOR_ORDER.indexOf(raw) < RIGOR_ORDER.indexOf(frame.rigorFloor)) {
        throw new RunnerConfigError(`--frame rigorFloor=${raw} lowers the guide's floor ${frame.rigorFloor}; a case may only raise it`);
      }
      frame.rigorFloor = raw;
      continue;
    }
    if (!FRAME_COUNT_KEYS.includes(key)) throw new RunnerConfigError(`--frame has unknown key "${key}" (allowed: ${[...FRAME_COUNT_KEYS, 'rigorFloor'].join(', ')})`);
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) throw new RunnerConfigError(`--frame ${key} must be a non-negative integer, got "${raw}"`);
    if (Number.isInteger(frame[key]) && value > frame[key]) {
      throw new RunnerConfigError(`--frame ${key}=${value} widens the guide's default ${frame[key]}; a case may only narrow its frame`);
    }
    frame[key] = value;
  }
  return frame;
}

/**
 * Open the case on its ledger, under the run's `advance` hold: `case.opened` with the guide snapshot
 * reference, the frame and the request digest (which is what makes `request-received` achieved), and a
 * binding for the worktree a conductor case is going to write in. A playbook case binds its worktrees
 * when it admits a writing Unit. A ledger that already carries `case.opened` is left alone, so a run
 * recorded before cases existed is opened on its first resume, with its guide's defaults.
 *
 * @returns {{ opened: boolean }}
 */
export function openCaseOnLedger({ mainRoot, workflowRunId, workflow, guide = workflow.guide, frame, request, hold, worktreePath, legacy = false, parent = null }) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.some((e) => e.type === 'case.opened')) return { opened: false };
  const append = (event) => appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId, event, hold });
  append({
    type: 'case.opened',
    payload: {
      caseId: workflowRunId,
      kind: guide.kind,
      guide: { id: guide.id, sha256: crypto.createHash('sha256').update(JSON.stringify(guide)).digest('hex') },
      frame,
      requestDigest: digestText(request ?? ''),
      openedAt: new Date().toISOString(),
      ...(parent ? { parent: { caseId: parent.parentCaseId, reservationId: parent.reservationId } } : {}),
      ...(legacy ? { legacy: true } : {}),
    },
  });
  if (guide.kind === 'guide' && worktreePath && guide.activities.some((a) => a.effects === 'writes')) {
    const bound = bindWorktree({
      mainRoot,
      hold,
      caseId: workflowRunId,
      worktree: worktreePath,
      ...workflowCheckout(worktreePath),
    });
    if (!bound.ok) {
      append({ type: 'case.closed', payload: { closedAt: new Date().toISOString(), reason: bound.answer } });
      throw new RunnerConfigError(`Workflow case "${workflowRunId}" was not opened: worktree ${worktreePath} cannot be bound (${bound.answer}${bound.record?.caseId ? `, held by case ${bound.record.caseId}` : ''})`, { code: bound.answer });
    }
  }
  return { opened: true };
}

/**
 * Spawn `fgos workflow resume <id> --foreground` as a detached process whose output goes to
 * advance.log beside the event log. `--foreground` is what keeps the child from detaching again.
 */
export function spawnDetachedAdvance({ mainRoot, workflowRunId, runDir, worktree, cwd, cliPath }) {
  const args = ['workflow', 'resume', workflowRunId, '--dir', mainRoot];
  if (worktree) args.push('--worktree', worktree);
  args.push('--foreground');

  const logPath = path.join(runDir, 'advance.log');
  const child = spawnDetachedCli({ args, cwd, logPath, cliPath, env: { ...process.env, [ADVANCE_DETACHED_ENV]: '1' } });
  if (child.error) throw new Error(`cannot start the detached advance: ${child.error}`);
  return { pid: child.pid, logPath, statusCommand: `fgos workflow status ${workflowRunId}` };
}

export function detachedResult({ mainRoot, workflowRunId, detached }) {
  const state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
  return { ...state, caseId: workflowRunId, detached };
}

/**
 * Resolve everything a start needs without touching the store: the roots, the definition to run
 * (the registered one, or that one rebuilt with `params.seats`), and the shared context refs.
 * A refused request throws here, so it creates no run.
 */
function resolveStart(params) {
  const cwd = params.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd, { allowNoRepository: true });
  const mainRoot = params.repoRoot ? path.resolve(params.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = params.worktree ? path.resolve(params.worktree) : roots.worktreeRoot;

  let workflow;
  let workflowId;

  if (params.workflow) {
    workflow = validateWorkflow(params.workflow);
    workflowId = workflow.id;
  } else if (params.unitsPath) {
    workflow = translateUnitsToWorkflow(params.unitsPath);
    workflowId = workflow.id;
  } else if (params.workflowId) {
    workflow = loadWorkflow(params.workflowId, { packageRoot: mainRoot, cwd });
    workflowId = workflow.id;
  } else {
    throw new RunnerConfigError('startWorkflow requires workflowId, workflow, or unitsPath');
  }
  if (params.unitsPath) {
    if (params.seats !== undefined) throw new RunnerConfigError('--seats rebuilds a registered panel preset; it cannot be used with a units file');
    assertWriteChains(workflow);
  }
  // Only a read-only workflow runs outside a repository: a unit that declares writes still needs one.
  assertRepositoryForWrites(roots, cwd, { writes: workflow.steps.some((step) => step.units.some((unit) => unit.template.writes?.length)) });
  const effort = params.effort === undefined || params.effort === null ? null : assertReasoningEffort(params.effort);

  let timeoutMs = null;
  if (params.timeout !== undefined && params.timeout !== null) {
    timeoutMs = typeof params.timeout === 'number'
      ? assertRunTimeoutMs(params.timeout, '--timeout')
      : parseRunTimeout(params.timeout);
  } else if (params.timeoutMs !== undefined && params.timeoutMs !== null) {
    timeoutMs = assertRunTimeoutMs(params.timeoutMs, '--timeout');
  }

  let account = null;
  if (params.account !== undefined && params.account !== null) {
    if (typeof params.account !== 'string' || !params.account.trim()) {
      throw new RunnerConfigError('--account requires a non-empty account id');
    }
    account = params.account.trim();
  }

  const contextRefs = normalizeContextRefs(params.contextRefs);
  let seats;
  if (params.seats !== undefined) {
    // Names are resolved (and a missing or duplicated one refused) here, before any run exists; the
    // text found now is what the run pins, so a later edit of the file never reaches it.
    const personas = {};
    // The same scope the run's Units look personas up in: the workflow's own folder and owning domain.
    const personaScope = workflowPersonaScope(workflow.id, { packageRoot: mainRoot, cwd });
    for (const entry of normalizeSeats(params.seats)) {
      const name = personaNameOf(entry);
      if (name !== null) personas[name] = resolveAgentDefinition(name, { projectRoot: worktreePath, workflow: personaScope });
    }
    ({ workflow, provenance: seats } = expandWorkflowSeats(workflow, params.seats, { contextRefs, personas }));
    seats = { ...seats, refDigests: digestContextRefs(contextRefs, worktreePath) };
  }
  const allRefs = [...contextRefs, ...workflow.steps.flatMap((step) => step.units.flatMap((unit) => unit.template.contextRefs || []))];
  if (allRefs.some((ref) => !/^(unit-run:|gate-answer:)/.test(ref)) && mainRoot !== worktreePath
      && resolveGitRoots(mainRoot).mainCheckoutRoot !== resolveGitRoots(worktreePath).mainCheckoutRoot) {
    throw new RunnerConfigError('Workflow contextRefs cannot use plain paths across repositories; use unit-run:<id>/<role> or gate-answer:<workflowRunId>/<stepId>');
  }
  return { mainRoot, worktreePath, workflow, workflowId, contextRefs, seats, effort, timeoutMs, account };
}

/**
 * Dry-bind a seated definition before anything is spent: every panel unit's seats and synthesizer are
 * bound against the pool exactly as a run would bind them, nothing is dispatched or written.
 * Seats that would share a provider family are only reported (a preference, bind() spreads what it
 * can); a seat no candidate can serve refuses the start. Without `params.seats` it does nothing.
 *
 * @param {object} params the same params as startWorkflow
 * @returns {Promise<{ warnings: string[] }>}
 */
export async function preflightWorkflowSeats(params = {}) {
  if (params.seats === undefined) return { warnings: [] };
  const { mainRoot, workflow } = resolveStart(params);
  const runnerConfig = loadRunnerConfigForDir(mainRoot);
  const session = { headless: true, herdrPresent: detectHerdrPresent() };
  const warnings = [];
  const refused = [];
  for (const unit of seatedPanelUnits(workflow)) {
    const { seats } = await simulateUnitBindings(unit, runnerConfig, { session });
    for (const seat of seats) {
      if (seat.refused) refused.push(`${unit.id}/${seat.seat}: ${seat.refused.reason}: ${seat.refused.detail}`);
      else if (seat.sharesFamilyWith?.length) warnings.push(`${unit.id}/${seat.seat}=${seat.executor} shares a provider family with ${seat.sharesFamilyWith.join(', ')}`);
    }
  }
  if (refused.length > 0) {
    throw new RunnerConfigError(`--seats cannot be served by the current pools, no run was created: ${refused.join('; ')}`);
  }
  return { warnings };
}

/**
 * What a nested case or wave spends of its parent's frame: the dispatches and writing dispatches its own
 * frame grants, or, with no frame to say, one dispatch per Unit it declares (writing ones counted apart).
 */
function nestedCountersOf(workflow, frame) {
  const units = workflow.steps.flatMap((step) => step.units ?? []);
  const writing = units.filter((u) => (u.template?.writes ?? []).length > 0).length;
  return {
    dispatches: Number.isInteger(frame?.dispatches) ? frame.dispatches : units.length,
    mutatingDispatches: Number.isInteger(frame?.mutatingDispatches) ? frame.mutatingDispatches : writing,
  };
}

/**
 * Give a nested case's charge back when its child failed to open, unless it did open: a case that opened
 * keeps what it spent. Called by the start verbs after they release the child's `advance`.
 */
export function refundIfNotOpened({ mainRoot, parent, opened }) {
  if (parent && !opened) refundNestedCase({ mainRoot, ...parent });
}

/**
 * Resolve the Workflow definition and record a new run, without advancing it. The run exists
 * in the store (status `running`, nothing started) as soon as this returns, so its id can be
 * handed to a caller before any step executes.
 */
export function prepareWorkflowRun(params) {
  const { mainRoot, worktreePath, workflow, workflowId, contextRefs, seats, effort, timeoutMs, account } = resolveStart(params);
  // A frame flag that widens the guide's defaults refuses here, so it creates no run.
  const frame = resolveFrame(workflow.guide, params.frame);
  const liveConfig = loadRunnerConfigForDir(mainRoot);
  const configSnapshot = snapshotRunnerConfig(mainRoot, liveConfig);
  if (account !== null) {
    const pin = parseAccountPin(account);
    if (pin.refused) throw new RunnerConfigError(`--account: ${pin.refused.detail}`);
    const accounts = providerAccountInventory(liveConfig)[legacyStateKey(pin.pool)]?.accounts;
    if (!accounts || !Object.hasOwn(accounts, pin.id)) {
      throw new RunnerConfigError(`account "${account}" is not configured: pool "${pin.pool}" has no account "${pin.id}" in runner.llmAccounts`);
    }
  }
  // A case or wave opened under a parent case is charged to the parent's frame first, in the parent's own
  // short `advance` section, released before the child exists; a child that cannot open gives it back.
  let parent = null;
  if (params.parentCase) {
    const refused = nestedStartRefusal({ repoRoot: mainRoot, parentCaseId: params.parentCase, env: params.env });
    if (refused) throw new RunnerConfigError(`workflow start --case ${params.parentCase} refused ${refused.code}: ${refused.condition}`, { code: refused.code });
    parent = chargeNestedCase({ mainRoot, parentCaseId: params.parentCase, counters: nestedCountersOf(workflow, frame), childRef: workflowId });
  }
  let created;
  try {
    created = createWorkflowRun({
      repoRoot: mainRoot,
      workflowId,
      workflow,
      configSnapshot,
      request: params.request,
      stanceOptions: normalizeStanceOptions(params.stanceOptions),
      contextRefs,
      seats,
      effort,
      timeoutMs,
      account,
    });
  } catch (err) {
    if (parent) refundNestedCase({ mainRoot, ...parent });
    throw err;
  }
  const { workflowRunId, runDir } = created;

  return { workflowRunId, runDir, workflow, mainRoot, worktreePath, frame, request: params.request ?? null, parent };
}
