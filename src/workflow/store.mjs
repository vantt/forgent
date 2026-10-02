// src/workflow/store.mjs — Workflow run append-only event store and state projection
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

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
export function createWorkflowRun({ repoRoot, workflowRunId, workflowId, workflow, configSnapshot }) {
  if (!repoRoot) throw new RunnerConfigError('createWorkflowRun requires repoRoot');
  if (!workflowId) throw new RunnerConfigError('createWorkflowRun requires workflowId');

  const runId = workflowRunId || `wf-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const runDir = workflowRunDir(repoRoot, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const startEvent = {
    seq: 1,
    ts: new Date().toISOString(),
    type: 'workflow.start',
    payload: {
      workflowRunId: runId,
      workflowId,
      workflow,
      configSnapshot: configSnapshot || null,
    },
  };

  const file = eventsFilePath(repoRoot, runId);
  fs.writeFileSync(file, JSON.stringify(startEvent) + '\n');

  return {
    workflowRunId: runId,
    runDir,
  };
}

/**
 * Append an event to a Workflow run event log.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string} params.workflowRunId
 * @param {object} params.event { type, payload }
 * @returns {object} Stored event with seq and ts
 */
export function appendWorkflowEvent({ repoRoot, workflowRunId, event }) {
  if (!repoRoot || !workflowRunId || !event || !event.type) {
    throw new RunnerConfigError('appendWorkflowEvent requires repoRoot, workflowRunId, and event with type');
  }

  const file = eventsFilePath(repoRoot, workflowRunId);
  if (!fs.existsSync(file)) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" events file not found at "${file}"`);
  }

  const existing = readWorkflowEvents({ repoRoot, workflowRunId });
  const nextSeq = existing.length + 1;
  const stored = {
    seq: nextSeq,
    ts: new Date().toISOString(),
    type: event.type,
    payload: event.payload || {},
  };

  fs.appendFileSync(file, JSON.stringify(stored) + '\n');
  return stored;
}

/**
 * Read all events of a Workflow run.
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
  const events = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // Ignore corrupted trailing line
    }
  }
  return events;
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
  let status = 'running';
  let outcome = null;
  const steps = {};
  const questions = [];

  for (const e of events) {
    const p = e.payload || {};

    switch (e.type) {
      case 'workflow.start':
        workflowId = p.workflowId;
        workflowRunId = p.workflowRunId;
        workflow = p.workflow;
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
            unitRunId: p.unitRunId,
            status: 'running',
          };
        }
        break;

      case 'unit.complete':
        if (steps[p.stepId] && steps[p.stepId].units[p.unitId]) {
          steps[p.stepId].units[p.unitId].status = 'completed';
          steps[p.stepId].units[p.unitId].outcome = p.outcome;
          steps[p.stepId].units[p.unitId].results = p.results || [];
        }
        break;

      case 'gate.park':
        if (steps[p.stepId]) {
          steps[p.stepId].status = 'parked';
          questions.push({
            stepId: p.stepId,
            question: p.question,
            header: p.header,
          });
        }
        status = 'parked';
        break;

      case 'gate.answer':
        if (steps[p.stepId]) {
          steps[p.stepId].answer = p.answer;
          steps[p.stepId].status = 'answered';
          // Remove from active questions
          const qIdx = questions.findIndex((q) => q.stepId === p.stepId);
          if (qIdx !== -1) questions.splice(qIdx, 1);
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

  return {
    workflowRunId,
    workflowId,
    workflow,
    status,
    outcome,
    steps,
    questions,
  };
}
