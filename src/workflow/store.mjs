// src/workflow/store.mjs — Workflow run append-only event store and state projection
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

// Every ledger line is written while its writer holds the run's `advance` lock. The hold is the
// proof: a hold made by `createAdvanceHold`, for this run, not yet released. Nothing else appends.
const holds = new WeakMap();

/**
 * Wrap the release of a run's `advance` lock as the hold the ledger demands.
 *
 * @param {object} params
 * @param {string} params.workflowRunId
 * @param {() => void} params.release Releases the underlying lock
 * @returns {{ workflowRunId: string, release: () => void }}
 */
export function createAdvanceHold({ workflowRunId, release }) {
  const state = { workflowRunId, released: false };
  const hold = {
    workflowRunId,
    release() {
      if (state.released) return;
      state.released = true;
      release();
    },
  };
  holds.set(hold, state);
  return Object.freeze(hold);
}

function assertAdvanceHold(hold, workflowRunId, what) {
  const state = hold ? holds.get(hold) : undefined;
  if (!state || state.released || state.workflowRunId !== workflowRunId) {
    throw new RunnerConfigError(`${what} requires the advance lock of Workflow run "${workflowRunId}"`);
  }
}

function workflowRunDir(repoRoot, workflowRunId) {
  return path.join(repoRoot, '.fgos', 'workflow-runs', workflowRunId);
}

function eventsFilePath(repoRoot, workflowRunId) {
  return path.join(workflowRunDir(repoRoot, workflowRunId), 'events.jsonl');
}

/**
 * Initialize a new Workflow run directory and first event.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} [params.workflowRunId]
 * @param {string} params.workflowId
 * @param {object} params.workflow Validated Workflow object
 * @param {object} [params.configSnapshot]
 * @returns {{ workflowRunId: string, runDir: string }}
 */
export function createWorkflowRun({ repoRoot, workflowRunId, workflowId, workflow, configSnapshot, request, stanceOptions = [], contextRefs = [], seats, effort, timeoutMs, account }) {
  if (!repoRoot) throw new RunnerConfigError('createWorkflowRun requires repoRoot');
  if (!workflowId) throw new RunnerConfigError('createWorkflowRun requires workflowId');

  const runId = workflowRunId || `wf-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const runDir = workflowRunDir(repoRoot, runId);
  fs.mkdirSync(path.dirname(runDir), { recursive: true });
  // The run directory is created exclusively: a run id is never reused, and the first line below is
  // the first thing in it.
  try {
    fs.mkdirSync(runDir);
  } catch (err) {
    if (err.code === 'EEXIST') throw new RunnerConfigError(`Workflow run "${runId}" already exists`);
    throw err;
  }

  const startEvent = {
    seq: 1,
    ts: new Date().toISOString(),
    type: 'workflow.start',
    payload: {
      workflowRunId: runId,
      workflowId,
      workflow,
      configSnapshot: configSnapshot || null,
      request: typeof request === 'string' && request.trim() ? request : null,
      stanceOptions: [...stanceOptions],
      contextRefs: [...contextRefs],
      // How a --seats start rebuilt the registered definition: { seats, baseId, baseDigest, refs }.
      ...(seats ? { seats } : {}),
      // The reasoning effort the run was started with (--effort); every unit of the run, resumed or not, asks for it.
      ...(effort ? { effort } : {}),
      ...(timeoutMs ? { timeoutMs } : {}),
      ...(account ? { account } : {}),
    },
  };

  writeDurably(eventsFilePath(repoRoot, runId), JSON.stringify(startEvent) + '\n', { create: true });
  fsyncDirectory(runDir);
  fsyncDirectory(path.dirname(runDir));

  return {
    workflowRunId: runId,
    runDir,
  };
}

/**
 * Write `text` at the end of `file` and force it to disk before returning: open, write, fsync,
 * close. `create` makes the file and fails if it exists.
 */
function writeDurably(file, text, { create = false } = {}) {
  const fd = fs.openSync(file, create ? 'wx' : 'a');
  try {
    fs.writeSync(fd, text);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function fsyncDirectory(dir) {
  const fd = fs.openSync(dir, 'r');
  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Append an event to a Workflow run event log. The only way a line reaches the ledger after the
 * run exists: the caller proves it holds the run's `advance` lock, and the line is on disk when
 * this returns, so the lock is never released over an event that could still be lost.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.workflowRunId
 * @param {object} params.event { type, payload }
 * @param {object} params.hold The run's advance hold (`createAdvanceHold`)
 * @returns {object} Stored event with seq and ts
 */
export function appendWorkflowEvent({ repoRoot, workflowRunId, event, hold }) {
  if (!repoRoot || !workflowRunId || !event || !event.type) {
    throw new RunnerConfigError('appendWorkflowEvent requires repoRoot, workflowRunId, and event with type');
  }
  assertAdvanceHold(hold, workflowRunId, 'appendWorkflowEvent');

  const file = eventsFilePath(repoRoot, workflowRunId);
  if (!fs.existsSync(file)) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" events file not found at "${file}"`);
  }

  const existing = readWorkflowEvents({ repoRoot, workflowRunId });
  const stored = {
    seq: existing.length + 1,
    ts: new Date().toISOString(),
    type: event.type,
    payload: event.payload || {},
  };

  writeDurably(file, JSON.stringify(stored) + '\n');
  return stored;
}

/**
 * Read all events of a Workflow run. Fails closed: a non-empty line that is not an event, or a
 * `seq` that is not the next one, is a corrupt ledger; a last line without its newline is an
 * unterminated tail, which only `recoverWorkflowLedgerTail` removes.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.workflowRunId
 * @returns {Array<object>} Events array
 */
export function readWorkflowEvents({ repoRoot, workflowRunId }) {
  const file = eventsFilePath(repoRoot, workflowRunId);
  if (!fs.existsSync(file)) {
    return [];
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const unterminated = lines.pop() !== '';
  const corrupt = (lineNo, why) => new RunnerConfigError(
    `Workflow ledger "${file}" is corrupt at line ${lineNo}: ${why}`,
    { code: 'workflow-ledger-corrupt' },
  );
  const events = [];
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch (err) {
      throw corrupt(i + 1, `not JSON (${err.message})`);
    }
    if (typeof event?.type !== 'string' || event.seq !== events.length + 1) {
      throw corrupt(i + 1, `expected an event with seq ${events.length + 1}, found ${line.slice(0, 80)}`);
    }
    events.push(event);
  });
  if (unterminated) {
    throw new RunnerConfigError(
      `Workflow ledger "${file}" ends in a line without its newline (an append that did not finish); the next holder of the run's advance lock removes it`,
      { code: 'workflow-ledger-unterminated' },
    );
  }
  return events;
}

/**
 * Remove the unterminated last line of a run's ledger and record that it was removed. The only
 * path that shortens a ledger: it needs the run's `advance` lock, drops that one line and nothing
 * else, and leaves a `ledger.recovered` event behind. A ledger that ends in a newline is left alone.
 *
 * @returns {{ recovered: boolean, droppedBytes: number }}
 */
export function recoverWorkflowLedgerTail({ repoRoot, workflowRunId, hold }) {
  assertAdvanceHold(hold, workflowRunId, 'recoverWorkflowLedgerTail');
  const file = eventsFilePath(repoRoot, workflowRunId);
  if (!fs.existsSync(file)) return { recovered: false, droppedBytes: 0 };

  const text = fs.readFileSync(file);
  if (text.length === 0 || text[text.length - 1] === 0x0a) return { recovered: false, droppedBytes: 0 };

  const keep = text.lastIndexOf(0x0a) + 1;
  const fd = fs.openSync(file, 'r+');
  try {
    fs.ftruncateSync(fd, keep);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  const droppedBytes = text.length - keep;
  appendWorkflowEvent({ repoRoot, workflowRunId, event: { type: 'ledger.recovered', payload: { droppedBytes } }, hold });
  return { recovered: true, droppedBytes };
}

/**
 * Project current state from Workflow run events.
 *
 * @param {Array<object>} events
 * @returns {object} Projected state
 */
export function projectWorkflowState(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      status: 'not-started',
      steps: {},
      questions: [],
    };
  }

  let workflowId = null;
  let workflowRunId = null;
  let workflow = null;
  let request = null;
  let stanceOptions = [];
  let contextRefs = [];
  let seats = null;
  let effort = null;
  let timeoutMs = null;
  let account = null;
  let status = 'running';
  let outcome = null;
  let worktrees = null;
  const steps = {};
  const questions = [];

  for (const e of events) {
    const p = e.payload || {};

    switch (e.type) {
      case 'workflow.start':
        workflowId = p.workflowId;
        workflowRunId = p.workflowRunId;
        workflow = p.workflow;
        request = p.request ?? null;
        stanceOptions = p.stanceOptions ?? [];
        contextRefs = p.contextRefs ?? [];
        seats = p.seats ?? null;
        effort = p.effort ?? null;
        timeoutMs = p.timeoutMs ?? null;
        account = p.account ?? null;
        if (workflow?.steps) {
          for (const s of workflow.steps) {
            steps[s.id] = {
              id: s.id,
              status: 'pending',
              dependsOn: s.dependsOn || [],
              kind: s.kind || 'standard',
              gate: s.gate || null,
              units: {},
              answer: null,
            };
          }
        }
        break;

      case 'step.start':
        if (steps[p.stepId]) {
          steps[p.stepId].status = 'running';
        }
        break;

      case 'unit.scheduled':
        if (steps[p.stepId]) {
          steps[p.stepId].units[p.unitId] = {
            unitId: p.unitId,
            status: 'running',
            ...(p.worktreePath ? { worktreePath: p.worktreePath, branch: p.branch ?? null } : {}),
            ...(p.baseRef ? { baseRef: p.baseRef, baseSha: p.baseSha ?? null } : {}),
          };
        }
        break;

      case 'unit.started':
        if (steps[p.stepId]?.units[p.unitId]) {
          steps[p.stepId].units[p.unitId].unitRunId = p.unitRunId;
        }
        break;

      case 'unit.complete':
        if (steps[p.stepId] && steps[p.stepId].units[p.unitId]) {
          steps[p.stepId].units[p.unitId].status = 'completed';
          steps[p.stepId].units[p.unitId].unitRunId = p.unitRunId ?? null;
          steps[p.stepId].units[p.unitId].outcome = p.outcome;
          steps[p.stepId].units[p.unitId].results = p.results || [];
          if (p.outOfScope?.length) steps[p.stepId].units[p.unitId].outOfScope = p.outOfScope;
          if (p.outOfScopeOnBranch?.length) steps[p.stepId].units[p.unitId].outOfScopeOnBranch = p.outOfScopeOnBranch;
        }
        break;

      case 'gate.park':
        if (steps[p.stepId]) {
          steps[p.stepId].status = 'parked';
          if (!questions.some((q) => q.stepId === p.stepId)) {
            questions.push({
              stepId: p.stepId,
              question: p.question,
              header: p.header,
            });
          }
        }
        status = 'parked';
        break;

      case 'gate.answer':
        if (steps[p.stepId]) {
          const stepGate = steps[p.stepId].gate;
          const isConsentGate = !stepGate?.mode || stepGate.mode === 'consent';
          const isApproved = p.approved === true;

          steps[p.stepId].answer = p.answer;
          if (isConsentGate && !isApproved) {
            // Clarification only: consent gate stays parked, question remains active
            steps[p.stepId].status = 'parked';
            steps[p.stepId].lastClarification = p.answer;
            status = 'parked';
          } else {
            // Either input gate or explicitly approved consent gate
            steps[p.stepId].status = 'answered';
            steps[p.stepId].approved = isApproved;
            // Remove from active questions
            const qIdx = questions.findIndex((q) => q.stepId === p.stepId);
            if (qIdx !== -1) questions.splice(qIdx, 1);
          }
        }
        if (questions.length === 0 && status === 'parked') {
          status = 'running';
        }
        break;

      case 'step.complete':
        if (steps[p.stepId]) {
          steps[p.stepId].status = 'completed';
          steps[p.stepId].outcome = p.outcome || 'pass';
        }
        break;

      case 'step.fail':
        if (steps[p.stepId]) {
          steps[p.stepId].status = 'failed';
          steps[p.stepId].outcome = p.outcome || 'failed';
          steps[p.stepId].reason = p.reason ?? null;
        }
        break;

      case 'workflow.worktrees':
        worktrees = { removed: p.removed || [], kept: p.kept || [] };
        break;

      case 'workflow.fail':
        status = 'failed';
        outcome = p.outcome || 'failed';
        break;

      case 'workflow.complete':
        status = 'completed';
        outcome = p.outcome || 'pass';
        break;

      default:
        break;
    }
  }

  // The branch and worktree of every unit that writes, in step order: nothing is merged into the
  // trunk for the user, who merges the branch at the end of a chain.
  const writeBranches = Object.values(steps).flatMap((step) => Object.values(step.units)
    .filter((unit) => unit.branch)
    .map((unit) => ({
      stepId: step.id,
      unitId: unit.unitId,
      branch: unit.branch,
      worktreePath: unit.worktreePath,
      baseRef: unit.baseRef ?? null,
      baseSha: unit.baseSha ?? null,
    })));

  return {
    workflowRunId,
    workflowId,
    workflow,
    request,
    stanceOptions,
    contextRefs,
    ...(seats ? { seats } : {}),
    ...(effort ? { effort } : {}),
    ...(timeoutMs ? { timeoutMs } : {}),
    ...(account ? { account } : {}),
    ...(writeBranches.length > 0 ? { writeBranches } : {}),
    status,
    outcome,
    worktrees,
    steps,
    questions,
  };
}
