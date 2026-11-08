// src/workflow/store.mjs — Workflow run append-only event store and state projection
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { runDirOf, runsRoot } from '../runner/execution/case-run-paths.mjs';
import { installOnce } from '../native/door.mjs';
import { isVerdictResult } from '../runner/execution/legacy-seat-read.mjs';

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

/** The one place that names a Workflow run's own event log (a different log from the Work history). */
export function eventsFilePath(repoRoot, workflowRunId) {
  return path.join(runDirOf(repoRoot, workflowRunId), 'events.jsonl');
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
  const runDir = runDirOf(repoRoot, runId);
  fs.mkdirSync(runsRoot(repoRoot), { recursive: true });
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

  if (installOnce(runDir, 'events.jsonl', JSON.stringify(startEvent) + '\n', 0o644) !== 'created') throw new RunnerConfigError(`Workflow run "${runId}" already has a ledger`);
  fsyncDirectory(runsRoot(repoRoot));

  return {
    workflowRunId: runId,
    runDir,
  };
}

/**
 * Write `text` at the end of `file` and force it to disk before returning: open, write, fsync,
 * close. A write that stores only part of the line is finished; one that stores nothing is refused,
 * and the partial tail it leaves is the unterminated tail the next holder of `advance` removes.
 */
function writeDurably(file, text) {
  const bytes = Buffer.from(text);
  const fd = fs.openSync(file, 'a');
  try {
    for (let written = 0; written < bytes.length;) {
      const stored = fs.writeSync(fd, bytes, written, bytes.length - written);
      if (stored <= 0) throw new RunnerConfigError(`Workflow ledger "${file}" stored ${written} of ${bytes.length} bytes of a line`, { code: 'ledger-short-write' });
      written += stored;
    }
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/** Force a directory's entries to disk: a file made or removed in it survives a crash. */
export function fsyncDirectory(dir) {
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
 * @param {boolean} [params.retryTail] a reader that does not hold `advance` can meet an append in flight: it reads
 *   again, up to three reads with a short wait, when the only fault is an unterminated tail
 * @returns {Array<object>} Events array
 */
export function readWorkflowEvents({ repoRoot, workflowRunId, retryTail = false }) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return readLedgerOnce(repoRoot, workflowRunId);
    } catch (err) {
      if (!retryTail || err.code !== 'workflow-ledger-unterminated' || attempt >= TAIL_READS) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, TAIL_WAIT_MS);
    }
  }
}

const TAIL_READS = 3;
const TAIL_WAIT_MS = 25;

function readLedgerOnce(repoRoot, workflowRunId) {
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

/** How a unit that failed on infrastructure ends: no seat of it reached a verdict, so `resume` may run it again. */
const INFRASTRUCTURE_OUTCOMES = new Set(['execution-failure', 'not-started']);
const reachedVerdict = (result) => Boolean(result?.refused) || (isVerdictResult(result) && ['pass', 'findings'].includes(result.outcome));
const isRerunnable = (p) => INFRASTRUCTURE_OUTCOMES.has(p.outcome) && !p.outOfScope?.length && !(p.results ?? []).some(reachedVerdict);

/** The unit as `unit.scheduled` records it: running, with the worktree and base a writing unit was given. */
const scheduledUnit = (p) => ({
  unitId: p.unitId,
  status: 'running',
  ...(p.worktreePath ? { worktreePath: p.worktreePath, branch: p.branch ?? null } : {}),
  ...(p.baseRef ? { baseRef: p.baseRef, baseSha: p.baseSha ?? null } : {}),
});

/** The unit a reopened step runs again: pending, with the failed attempt's worktree, branch and run id as its predecessor. */
function reopenedUnit(unit) {
  const { unitId, worktreePath, branch, baseRef, baseSha, unitRunId } = unit;
  return { unitId, status: 'pending', ...(worktreePath ? { worktreePath, branch } : {}), ...(baseRef ? { baseRef, baseSha } : {}), unitRunId };
}

const unitOf = (fold, p) => fold.steps[p.stepId]?.units[p.unitId];

// One fold step per event type; each reads the event payload and changes the fold in place.
const FOLD = {
  'workflow.start': (fold, p) => {
    Object.assign(fold, {
      workflowId: p.workflowId,
      workflowRunId: p.workflowRunId,
      workflow: p.workflow,
      request: p.request ?? null,
      stanceOptions: p.stanceOptions ?? [],
      contextRefs: p.contextRefs ?? [],
      seats: p.seats ?? null,
      effort: p.effort ?? null,
      timeoutMs: p.timeoutMs ?? null,
      account: p.account ?? null,
    });
    for (const s of p.workflow?.steps ?? []) {
      fold.steps[s.id] = { id: s.id, status: 'pending', dependsOn: s.dependsOn || [], kind: s.kind || 'standard', gate: s.gate || null, units: {}, answer: null };
    }
  },

  // A step started after it failed is a reopening (only `resume` writes one): the run and the step run
  // again, the units that failed on infrastructure wait to run again, and the worktrees settle again.
  'step.start': (fold, p) => {
    const step = fold.steps[p.stepId];
    if (!step) return;
    if (step.status === 'failed') {
      delete step.outcome;
      delete step.reason;
      for (const [id, unit] of Object.entries(step.units)) if (unit.rerunnable) step.units[id] = reopenedUnit(unit);
      if (fold.status === 'failed') Object.assign(fold, { status: fold.questions.length > 0 ? 'parked' : 'running', outcome: null });
      fold.worktrees = null;
    }
    step.status = 'running';
  },

  'unit.scheduled': (fold, p) => {
    if (fold.steps[p.stepId]) fold.steps[p.stepId].units[p.unitId] = scheduledUnit(p);
  },

  'unit.started': (fold, p) => {
    const unit = unitOf(fold, p);
    if (unit) unit.unitRunId = p.unitRunId;
  },

  'unit.complete': (fold, p) => {
    const unit = unitOf(fold, p);
    if (!unit) return;
    Object.assign(unit, { status: 'completed', unitRunId: p.unitRunId ?? null, outcome: p.outcome, results: p.results || [] });
    if (p.outOfScope?.length) unit.outOfScope = p.outOfScope;
    if (p.outOfScopeOnBranch?.length) unit.outOfScopeOnBranch = p.outOfScopeOnBranch;
    if (isRerunnable(p)) unit.rerunnable = true;
  },

  'gate.park': (fold, p) => {
    if (fold.steps[p.stepId]) {
      fold.steps[p.stepId].status = 'parked';
      if (!fold.questions.some((q) => q.stepId === p.stepId)) fold.questions.push({ stepId: p.stepId, question: p.question, header: p.header });
    }
    fold.status = 'parked';
  },

  'gate.answer': (fold, p) => {
    const step = fold.steps[p.stepId];
    if (step) {
      const consent = !step.gate?.mode || step.gate.mode === 'consent';
      step.answer = p.answer;
      if (consent && p.approved !== true) {
        // Clarification only: a consent gate stays parked and its question stays active.
        step.status = 'parked';
        step.lastClarification = p.answer;
        fold.status = 'parked';
      } else {
        // An input gate, or a consent gate explicitly approved: it leaves the active questions.
        step.status = 'answered';
        step.approved = p.approved === true;
        const at = fold.questions.findIndex((q) => q.stepId === p.stepId);
        if (at !== -1) fold.questions.splice(at, 1);
      }
    }
    if (fold.questions.length === 0 && fold.status === 'parked') fold.status = 'running';
  },

  'step.complete': (fold, p) => {
    const step = fold.steps[p.stepId];
    if (step) Object.assign(step, { status: 'completed', outcome: p.outcome || 'pass' });
  },

  'step.fail': (fold, p) => {
    const step = fold.steps[p.stepId];
    if (step) Object.assign(step, { status: 'failed', outcome: p.outcome || 'failed', reason: p.reason ?? null });
  },

  'workflow.worktrees': (fold, p) => {
    fold.worktrees = { removed: p.removed || [], kept: p.kept || [] };
  },

  'workflow.fail': (fold, p) => Object.assign(fold, { status: 'failed', outcome: p.outcome || 'failed' }),
  'workflow.complete': (fold, p) => Object.assign(fold, { status: 'completed', outcome: p.outcome || 'pass' }),
};

/**
 * Project current state from Workflow run events.
 *
 * @param {Array<object>} events
 * @returns {object} Projected state
 */
export function projectWorkflowState(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return { status: 'not-started', steps: {}, questions: [] };
  }

  const fold = {
    workflowId: null, workflowRunId: null, workflow: null, request: null, stanceOptions: [], contextRefs: [],
    seats: null, effort: null, timeoutMs: null, account: null,
    status: 'running', outcome: null, worktrees: null, steps: {}, questions: [],
  };
  for (const e of events) FOLD[e.type]?.(fold, e.payload || {});

  // The branch and worktree of every unit that writes, in step order: nothing is merged into the
  // trunk for the user, who merges the branch at the end of a chain.
  const writeBranches = Object.values(fold.steps).flatMap((step) => Object.values(step.units)
    .filter((unit) => unit.branch)
    .map((unit) => ({
      stepId: step.id,
      unitId: unit.unitId,
      branch: unit.branch,
      worktreePath: unit.worktreePath,
      baseRef: unit.baseRef ?? null,
      baseSha: unit.baseSha ?? null,
    })));

  const { seats, effort, timeoutMs, account } = fold;
  return {
    workflowRunId: fold.workflowRunId,
    workflowId: fold.workflowId,
    workflow: fold.workflow,
    request: fold.request,
    stanceOptions: fold.stanceOptions,
    contextRefs: fold.contextRefs,
    ...(seats ? { seats } : {}),
    ...(effort ? { effort } : {}),
    ...(timeoutMs ? { timeoutMs } : {}),
    ...(account ? { account } : {}),
    ...(writeBranches.length > 0 ? { writeBranches } : {}),
    status: fold.status,
    outcome: fold.outcome,
    worktrees: fold.worktrees,
    steps: fold.steps,
    questions: fold.questions,
  };
}
