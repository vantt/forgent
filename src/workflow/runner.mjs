// src/workflow/runner.mjs — Workflow execution runner, DAG sequencer, and gate manager
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { normalizeContextRefs } from './definition.mjs';
import { loadWorkflow } from './loader.mjs';
import {
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
} from './store.mjs';
import {
  createWorkflowWorktree,
  mergeWorkflowBranch,
  resolveIntegrationTarget,
  cleanupWorkflowWorktree,
} from './integrate.mjs';
import { translatePlanToWorkflow } from './plan-source.mjs';
import { runUnit, snapshotRunnerConfig, resolveGitRoots } from '../runner/execution/run.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { normalizeStanceOptions } from '../runner/execution/unit.mjs';
import { anonymousInputName, gateAnswerFile, OWN_PREVIOUS_NAME, SEAT_PLACEHOLDER, resolveUnitInputs } from '../runner/execution/handoff-refs.mjs';

const GATE_ANSWER_NOTE_CHARS = 200;

/**
 * What a unit needs beyond its template objective: the owner's request the run was started
 * with, and what the steps it depends on (directly or not) produced.
 *
 * The objective carries only an index of the earlier units -- one summary line each, tagged with
 * its Unit run id. The reports themselves travel as `inputs`, one `unit-run:<id>/<role>` per role
 * of every earlier unit; the Execution Core turns them into absolute report paths in the
 * assignment's context refs, so nothing is truncated and no panelist is dropped.
 */
function buildUnitHandoff({ template, state, step, workflow }) {
  const parts = [template.objective || ''];
  if (state.request) parts.push(`Owner request:\n${state.request}`);

  const wanted = new Set();
  const collect = (stepId) => {
    for (const dep of workflow.steps.find((s) => s.id === stepId)?.dependsOn ?? []) {
      if (!wanted.has(dep)) {
        wanted.add(dep);
        collect(dep);
      }
    }
  };
  collect(step.id);

  // Which earlier steps the unit receives: every step it builds on, unless its template declares
  // `inputs`, which then names the steps (and, per entry, whether it is the unit's own seat's
  // result of that step only) in the order they are listed.
  const picks = template.inputs
    ? template.inputs.map((entry) => ({ prior: workflow.steps.find((s) => s.id === entry.step), sameSeat: entry.sameSeat === true, label: entry.label }))
    : workflow.steps.filter((s) => wanted.has(s.id)).map((prior) => ({ prior }));

  // With anonymizeInputs the Execution Core copies each role's report as seat-A, seat-B, ... in
  // the order of `inputs`, so the index below names them that way and nothing else: no step,
  // unit, unit run or role. A same-seat input is not part of that numbering: the role it is for
  // gets it as its own earlier result, and the brief only says so.
  const anonymize = template.anonymizeInputs === true;
  const index = [];
  const inputs = [...(template.contextRefs ?? []), ...(step.dependsOn.length === 0 ? state.contextRefs ?? [] : [])];
  let anonymized = 0;
  for (const { prior, sameSeat, label } of picks) {
    for (const [unitId, unitState] of Object.entries(state.steps[prior.id]?.units ?? {})) {
      if (!unitState.unitRunId) continue;
      const results = (unitState.results ?? []).filter((r) => r?.runResult);
      if (sameSeat) {
        inputs.push(`unit-run:${unitState.unitRunId}/${SEAT_PLACEHOLDER}`);
        index.push(`### ${label ?? 'Your own earlier result'}\nIt is the file named "${OWN_PREVIOUS_NAME}" under Context refs: what you yourself produced in an earlier step.`);
        continue;
      }
      if (anonymize) {
        for (const role of new Set(results.map((r) => r.role))) {
          const summary = results.filter((r) => r.role === role).at(-1)?.runResult.agentClaim?.summary;
          index.push(`### ${anonymousInputName(anonymized++)}${label ? ` (${label})` : ''}${summary ? `\nSummary: ${summary}` : ''}`);
          inputs.push(`unit-run:${unitState.unitRunId}/${role}`);
        }
        continue;
      }
      const summary = results.at(-1)?.runResult.agentClaim?.summary;
      index.push(`### ${prior.id} / ${unitId} (unit run ${unitState.unitRunId})${label ? ` (${label})` : ''}${summary ? `\nSummary: ${summary}` : ''}`);
      for (const role of new Set(results.map((r) => r.role))) inputs.push(`unit-run:${unitState.unitRunId}/${role}`);
    }
  }
  if (index.length > 0) {
    parts.push(
      `Output of earlier steps${anonymize ? ', anonymized' : ''} (the full report of every role is listed under Context refs; read them before answering):\n\n${index.join('\n\n')}`,
    );
  }

  // The owner's answers to human gates -- the gated step's own and those of the steps it builds on.
  // Each travels as a file ref; the objective keeps one line per answer, tagged as the owner's.
  const answerNotes = [];
  for (const gated of workflow.steps) {
    const answer = state.steps[gated.id]?.answer;
    if (answer === null || answer === undefined || (!wanted.has(gated.id) && gated.id !== step.id)) continue;
    inputs.push(`gate-answer:${state.workflowRunId}/${gated.id}`);
    const oneLine = String(answer).replace(/\s+/g, ' ').trim();
    answerNotes.push(`- ${gated.id} (owner's answer at the "${gated.id}" gate): ${oneLine.slice(0, GATE_ANSWER_NOTE_CHARS)}`);
  }
  if (answerNotes.length > 0) {
    parts.push(
      `The owner's own answers at human gates of this run -- the owner's input, not another agent's output, and it decides what is open at that gate (the full text of each is listed under Context refs; read it before answering):\n${answerNotes.join('\n')}`,
    );
  }
  return { objective: parts.filter(Boolean).join('\n\n'), inputs };
}

const EXPERTISE_KEYS = ['missing expertise', 'missing_expertise'];

/**
 * The producer's packet is its settled report: raw JSON, never fenced or mixed into prose. Models
 * that keep the report as prose write the packet beside it as `packet-*.json`; that file counts
 * only when it is a JSON object that was not touched after the report settled, because it is not
 * covered by the report digest. Either key spelling is read.
 */
function readMissingExpertise(reportFile, settledAt) {
  const pick = (packet) => EXPERTISE_KEYS.map((key) => packet?.[key]).find((value) => value !== undefined);
  let reportError;
  try {
    const found = pick(JSON.parse(fs.readFileSync(reportFile, 'utf8')));
    if (found !== undefined) return found;
  } catch (error) {
    reportError = error;
  }
  const dir = path.dirname(reportFile);
  const settledMs = Date.parse(settledAt);
  const siblings = fs.readdirSync(dir).filter((name) => /^packet-[^/]*\.json$/.test(name)).sort().reverse();
  for (const name of siblings) {
    if (!(fs.statSync(path.join(dir, name)).mtimeMs <= settledMs)) continue;
    try {
      const found = pick(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
      if (found !== undefined) return found;
    } catch { /* a malformed side file is not evidence; the report error below decides */ }
  }
  if (reportError) throw reportError;
  return undefined;
}

function renderGateQuestion(step, state, mainRoot) {
  return (step.gate.question || `Approve step "${step.id}"?`).replace(
    /\{\{report:([^/{}:\s]+)\/([^{}:\s]+):missing expertise\}\}/g,
    (_, stepId, unitId) => {
      const unit = state.steps[stepId]?.units[unitId];
      if (unit?.status !== 'completed' || !unit.unitRunId) throw new RunnerConfigError('gate report producer is not settled');
      const producer = unit.results?.filter((record) => record.role === 'producer').at(-1);
      if (!producer?.runResult?.settleReports?.length) throw new RunnerConfigError('gate requires a settled producer report');
      const [file] = resolveUnitInputs([`unit-run:${unit.unitRunId}/producer`], mainRoot).refs;
      const expertise = readMissingExpertise(file, producer.runResult.settledAt);
      if (!Array.isArray(expertise) || expertise.some((entry) => typeof entry !== 'string' || !entry.trim())) {
        throw new RunnerConfigError('gate report requires "missing expertise" as an array of non-empty strings');
      }
      return JSON.stringify(expertise);
    },
  );
}

/**
 * The pattern a template runs: its name, or the name with the template's `params` when it has
 * any -- the same `{ pattern, params }` shape the Execution Core accepts from a CLI caller.
 */
function unitPatternOf(template) {
  const name = template.pattern || 'solo';
  return template.params ? { pattern: name, params: template.params } : name;
}

/**
 * The overrides a template implies. `persona` binds that persona on every seat of the unit, as the
 * `--override` JSON `{"scope":{"unit":"<id>"},"persona":"<name>"}` would; the origin says the
 * Workflow definition set it, not a person at the CLI.
 */
function unitOverridesOf(unit) {
  const persona = unit.template.persona;
  return persona ? [{ scope: { unit: unit.id }, persona, origin: 'workflow' }] : [];
}

function gitOk(cwd, args) {
  try {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function gitOut(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/**
 * Remove the worktrees of Units whose work reached the main line; keep the rest and say where
 * they are. A passed Unit counts as integrated only when its branch is already part of the integration target (the integrate step's `target`, else the repository trunk) and
 * its worktree holds nothing uncommitted -- removing a worktree forgets anything left in it. A
 * Unit that failed, was refused, or never finished keeps its worktree for investigation.
 */
function settleUnitWorktrees({ mainRoot, state, workflow }) {
  const integrationTarget = resolveIntegrationTarget({ repoRoot: mainRoot, workflow });
  const removed = [];
  const kept = [];
  for (const step of Object.values(state.steps)) {
    for (const unit of Object.values(step.units)) {
      if (!unit.worktreePath) continue;
      const entry = { stepId: step.id, unitId: unit.unitId, worktreePath: unit.worktreePath, branch: unit.branch };
      let reason = null;
      if (unit.status !== 'completed' || unit.outcome !== 'pass') {
        reason = `unit ended ${unit.outcome ?? 'unfinished'}`;
      } else if (!fs.existsSync(unit.worktreePath)) {
        removed.push(entry);
        continue;
      } else if (unit.branch && !gitOk(mainRoot, ['merge-base', '--is-ancestor', unit.branch, integrationTarget])) {
        reason = 'branch not integrated';
      } else if ((gitOut(unit.worktreePath, ['status', '--porcelain']) ?? 'unknown').trim() !== '') {
        reason = 'worktree has uncommitted changes';
      }
      if (reason) {
        kept.push({ ...entry, reason });
        continue;
      }
      cleanupWorkflowWorktree({
        repoRoot: mainRoot,
        worktreePath: unit.worktreePath,
        branch: unit.branch,
        deleteBranch: Boolean(unit.branch),
      });
      removed.push(entry);
    }
  }
  return { removed, kept };
}

const PROGRESS_LINE_LIMIT = 300;

/** One log line for the events that mark a step's progress, null for every other event. */
function progressLine({ ts, type, payload }) {
  const step = payload?.stepId;
  let what;
  if (type === 'step.start') what = 'started';
  else if (type === 'step.complete') what = 'completed';
  else if (type === 'step.fail') what = `failed: ${payload.reason ?? payload.outcome}`;
  else if (type === 'gate.park') what = 'parked, waiting for an answer';
  else return null;
  return `[${ts}] step ${step} ${what}`.slice(0, PROGRESS_LINE_LIMIT);
}

// The detached advance process is the only one whose output is a log nobody is watching live, so
// it alone prints progress; a foreground advance keeps its stdout for the result.
const ADVANCE_DETACHED_ENV = 'FGOS_WORKFLOW_ADVANCE_DETACHED';
const detachedChildLog = process.env[ADVANCE_DETACHED_ENV] === '1' ? (line) => process.stderr.write(`${line}\n`) : null;

/**
 * Run loop to advance ready steps in a Workflow run.
 */
async function advanceWorkflowRun({ repoRoot, workflowRunId, workflow, mainRoot, worktreePath, onLog = detachedChildLog }) {
  // Every event is recorded in the event log; a step's start, end or park also reaches onLog as one line.
  const recordEvent = (args) => {
    const stored = appendWorkflowEvent(args);
    const line = progressLine(stored);
    if (line && onLog) onLog(line);
    return stored;
  };
  let events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  let state = projectWorkflowState(events);

  while (state.status === 'running') {
    const steps = workflow.steps;
    const completedStepIds = new Set(
      Object.values(state.steps)
        .filter((s) => s.status === 'completed')
        .map((s) => s.id),
    );

    // Find ready steps that haven't started or are running
    const readySteps = steps.filter((step) => {
      const stepState = state.steps[step.id];
      if (!stepState || stepState.status === 'completed' || stepState.status === 'parked' || stepState.status === 'failed') {
        return false;
      }
      return step.dependsOn.every((dep) => completedStepIds.has(dep));
    });

    if (readySteps.length === 0) {
      // Check if all steps completed
      const allDone = steps.every((s) => state.steps[s.id]?.status === 'completed');
      if (allDone) {
        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'workflow.complete',
            payload: { outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
      }
      break;
    }

    // Process ready steps
    let stateChanged = false;
    for (const step of readySteps) {
      const stepState = state.steps[step.id];

      // 1. Human gate check
      if (step.gate && step.gate.kind === 'human' && stepState.status !== 'answered') {
        let question;
        try {
          question = renderGateQuestion(step, state, mainRoot);
        } catch (error) {
          const reason = error instanceof SyntaxError ? 'invalid JSON' : error.code || error.message;
          question = `Cannot read settled producer "missing expertise": ${reason}. No expertise decision was inferred. Review the packet manually and answer this gate with your decision and acknowledged limitation.`;
        }
        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'gate.park',
            payload: {
              stepId: step.id,
              question,
              header: step.gate.header,
              parkedAt: new Date().toISOString(),
            },
          },
        });
        stateChanged = true;
        continue;
      }

      // Mark step start if pending
      if (stepState.status === 'pending' || stepState.status === 'answered') {
        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'step.start',
            payload: { stepId: step.id, startedAt: new Date().toISOString() },
          },
        });
        stateChanged = true;
      }

      // 2. Integration step
      if (step.kind === 'integrate') {
        const integrationTarget = resolveIntegrationTarget({ repoRoot: mainRoot, workflow });
        // Collect branches from predecessor units
        for (const depId of step.dependsOn) {
          const depStep = workflow.steps.find((s) => s.id === depId);
          if (depStep?.units) {
            for (const u of depStep.units) {
              const uBranch = `wf/${workflowRunId}/${u.id}`;
              try {
                mergeWorkflowBranch({
                  repoRoot: mainRoot,
                  sourceBranch: uBranch,
                  targetBranch: integrationTarget,
                  commitMessage: `integrate: merge step ${depId} unit ${u.id}`,
                });
              } catch {
                // If branch didn't have commits or already merged, ignore
              }
            }
          }
        }

        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'step.complete',
            payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        stateChanged = true;
        continue;
      }

      // 3. Standard step with units
      if (step.units && step.units.length > 0) {
        let failedUnit = null;
        for (const u of step.units) {
          const uState = stepState.units[u.id];
          if (uState && uState.status === 'completed') {
            continue;
          }

          // Build unit object
          const handoff = buildUnitHandoff({ template: u.template, state, step, workflow });
          const unitData = {
            id: u.id,
            objective: handoff.objective || `Execute unit ${u.id} in step ${step.id}`,
            capability: u.template.capability,
            pattern: u.template.pattern || 'solo',
            rigor: u.template.rigor,
            writes: u.template.writes || [],
            dependsOn: u.dependsOn || [],
            inputs: handoff.inputs,
            stanceOptions: state.stanceOptions?.length ? state.stanceOptions : u.template.stanceOptions,
            ...(u.template.anonymizeInputs ? { anonymizeInputs: true } : {}),
            ...(u.template.blind ? { blind: true } : {}),
          };

          // A unit left `running` with a recorded Unit run id was started by a controller that died:
          // continue that run (settled seats are kept) and reuse the worktree it already has.
          const resumeUnitRunId = uState?.status === 'running' ? (uState.unitRunId ?? null) : null;

          // If unit has writes, prepare worktree
          let unitWorktree = worktreePath;
          let uBranch = null;
          let ownsWorktree = false;
          if (resumeUnitRunId && uState.worktreePath) {
            unitWorktree = uState.worktreePath;
            uBranch = uState.branch ?? null;
          } else if (unitData.writes.length > 0) {
            uBranch = `wf/${workflowRunId}/${u.id}`;
            try {
              const wtInfo = createWorkflowWorktree({
                repoRoot: mainRoot,
                branch: uBranch,
              });
              unitWorktree = wtInfo.worktreePath;
              ownsWorktree = true;
            } catch {
              unitWorktree = worktreePath;
            }
          }

          // Recording it again would reset the unit and lose the run id it already carries.
          if (!resumeUnitRunId) {
            recordEvent({
              repoRoot: mainRoot,
              workflowRunId,
              event: {
                type: 'unit.scheduled',
                payload: {
                  stepId: step.id,
                  unitId: u.id,
                  ...(ownsWorktree ? { worktreePath: unitWorktree, branch: uBranch } : {}),
                },
              },
            });
          }

          // Run Unit via P1 execution door. A throw (an unresolvable hand-off ref, a refused
          // config) is a failed unit like any other: left uncaught it would end the advance with
          // the run still `running` and no event saying why.
          let unitRunResult;
          try {
            unitRunResult = await runUnit({
              unitData,
              repoRoot: mainRoot,
              cwd: unitWorktree,
              worktree: unitWorktree,
              pattern: unitPatternOf(u.template),
              overrides: unitOverridesOf(u),
              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },
              ...(resumeUnitRunId ? { resumeUnitRunId } : {
                onUnitRunCreated: (unitRunId) => recordEvent({
                  repoRoot: mainRoot,
                  workflowRunId,
                  event: { type: 'unit.started', payload: { stepId: step.id, unitId: u.id, unitRunId } },
                }),
              }),
            });
          } catch (err) {
            unitRunResult = {
              unitRunId: null,
              outcome: 'execution-failure',
              results: [],
              error: String(err?.message ?? err),
            };
          }

          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'unit.complete',
              payload: {
                stepId: step.id,
                unitId: u.id,
                unitRunId: unitRunResult.unitRunId,
                outcome: unitRunResult.outcome,
                results: unitRunResult.results || [],
              },
            },
          });

          stateChanged = true;
          // Only explicitly accepted semantic outcomes proceed; execution failures never do.
          if (!(u.template.acceptOutcomes ?? ['pass']).includes(unitRunResult.outcome)) {
            failedUnit = { unitId: u.id, outcome: unitRunResult.outcome, results: unitRunResult.results || [], error: unitRunResult.error };
            break;
          }
        }

        if (failedUnit) {
          const refusal = failedUnit.results.find((r) => r?.refused)?.refused;
          const reason = refusal
            ? `${refusal.reason}: ${refusal.detail}`
            : failedUnit.error
              ? `unit ${failedUnit.unitId} could not run: ${failedUnit.error}`
              : `unit ${failedUnit.unitId} ended ${failedUnit.outcome}`;
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'step.fail',
              payload: { stepId: step.id, outcome: failedUnit.outcome, unitId: failedUnit.unitId, reason, failedAt: new Date().toISOString() },
            },
          });
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'workflow.fail',
              payload: { outcome: failedUnit.outcome, stepId: step.id, reason, failedAt: new Date().toISOString() },
            },
          });
          break;
        }

        {
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'step.complete',
              payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
            },
          });
        }
      } else {
        // Step with no units
        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'step.complete',
            payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        stateChanged = true;
      }
    }

    events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
    state = projectWorkflowState(events);

    if (!stateChanged) {
      break;
    }
  }

  if ((state.status === 'completed' || state.status === 'failed') && !state.worktrees) {
    const { removed, kept } = settleUnitWorktrees({ mainRoot, state, workflow });
    if (removed.length > 0 || kept.length > 0) {
      recordEvent({
        repoRoot: mainRoot,
        workflowRunId,
        event: { type: 'workflow.worktrees', payload: { removed, kept } },
      });
      state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
    }
  }

  return state;
}

const ADVANCE_LOCK_FILE = 'advance.lock';
// A lock file that exists but holds no pid yet is a holder caught between creating and writing it.
const ADVANCE_LOCK_WRITE_GRACE_MS = 2000;

function workflowRunDirOf(mainRoot, workflowRunId) {
  return path.join(mainRoot, '.fgos', 'workflow-runs', workflowRunId);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** Pid of the process currently advancing the run, 0 for a holder still writing its pid, null when nothing live holds it. */
function liveAdvanceHolder(runDir) {
  const lockPath = path.join(runDir, ADVANCE_LOCK_FILE);
  let text;
  let mtimeMs;
  try {
    text = fs.readFileSync(lockPath, 'utf8');
    mtimeMs = fs.statSync(lockPath).mtimeMs;
  } catch {
    return null;
  }
  const pid = Number.parseInt(text, 10);
  if (Number.isInteger(pid) && pid > 0) return isProcessAlive(pid) ? pid : null;
  return Date.now() - mtimeMs < ADVANCE_LOCK_WRITE_GRACE_MS ? 0 : null;
}

function advanceRefusal(workflowRunId, pid) {
  const holder = pid ? `process ${pid}` : 'another process';
  return new RunnerConfigError(
    `Workflow run "${workflowRunId}" is already being advanced by ${holder}; read progress with "fgos workflow status ${workflowRunId}" and retry once it parks or finishes`,
  );
}

/** Refuse when a live process is already advancing the run. */
function assertNoLiveAdvance(mainRoot, workflowRunId) {
  const pid = liveAdvanceHolder(workflowRunDirOf(mainRoot, workflowRunId));
  if (pid !== null) throw advanceRefusal(workflowRunId, pid);
}

/**
 * Hold the run for this process while it advances, so two processes never advance one run at
 * once. A lock left by a dead process is taken over. Returns the function that releases it.
 */
function acquireAdvanceLock(mainRoot, workflowRunId) {
  const runDir = workflowRunDirOf(mainRoot, workflowRunId);
  const lockPath = path.join(runDir, ADVANCE_LOCK_FILE);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return () => {
        try {
          if (fs.readFileSync(lockPath, 'utf8') === String(process.pid)) fs.unlinkSync(lockPath);
        } catch {
          // Already gone.
        }
      };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      const pid = liveAdvanceHolder(runDir);
      if (pid !== null) throw advanceRefusal(workflowRunId, pid);
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // Another process cleared it first; the next attempt decides.
      }
    }
  }
  throw advanceRefusal(workflowRunId, 0);
}

const ADVANCE_TAIL_LINES = 20;
const ADVANCE_TAIL_READ_BYTES = 64 * 1024;
// A recorded run whose advance has not taken the lock yet is still starting; past this age with no
// live holder it is a dead child.
const ADVANCE_STALE_MS = 30 * 1000;

function tailAdvanceLog(logPath) {
  let fd;
  try {
    fd = fs.openSync(logPath, 'r');
    const { size } = fs.fstatSync(fd);
    const length = Math.min(size, ADVANCE_TAIL_READ_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    return buffer
      .toString('utf8')
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(-ADVANCE_TAIL_LINES)
      .map((line) => line.slice(0, PROGRESS_LINE_LIMIT));
  } catch {
    return [];
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** What the detached advance of a run is doing: liveness from the lock holder, plus its log tail. */
function advanceReport(runDir, workflowRunId, state, events) {
  const holder = liveAdvanceHolder(runDir);
  const logPath = path.join(runDir, 'advance.log');
  const advance = { running: holder !== null, pid: holder || null, logPath };
  if (state.status !== 'completed') {
    const lastLines = tailAdvanceLog(logPath);
    if (lastLines.length > 0) advance.lastLines = lastLines;
  }
  const lastTs = Date.parse(events[events.length - 1].ts);
  if (state.status === 'running' && holder === null && Date.now() - lastTs > ADVANCE_STALE_MS) {
    advance.hint = `The advance of this run is not running and nothing was recorded for a while; continue it with: fgos workflow resume ${workflowRunId}`;
  }
  return advance;
}

/** Run `advance` while this process holds the run's advance lock. */
async function withAdvanceLock(mainRoot, workflowRunId, advance) {
  const release = acquireAdvanceLock(mainRoot, workflowRunId);
  try {
    return await advance();
  } finally {
    release();
  }
}

/**
 * Spawn `fgos workflow resume <id> --foreground` as a detached process whose output goes to
 * advance.log beside the event log. `--foreground` is what keeps the child from detaching again.
 */
function spawnDetachedAdvance({ mainRoot, workflowRunId, runDir, worktree, cwd, cliPath }) {
  const cli = cliPath ?? fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));
  const args = [cli, 'workflow', 'resume', workflowRunId, '--dir', mainRoot];
  if (worktree) args.push('--worktree', worktree);
  args.push('--foreground');

  const logPath = path.join(runDir, 'advance.log');
  const logFd = fs.openSync(logPath, 'a');
  let child;
  try {
    child = spawn(process.execPath, args, {
      cwd: cwd ?? process.cwd(),
      detached: true,
      env: { ...process.env, [ADVANCE_DETACHED_ENV]: '1' },
      stdio: ['ignore', logFd, logFd],
    });
  } finally {
    fs.closeSync(logFd);
  }
  child.on('error', () => {});
  child.unref();
  return { pid: child.pid ?? null, logPath, statusCommand: `fgos workflow status ${workflowRunId}` };
}

function detachedResult({ mainRoot, workflowRunId, detached }) {
  const state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
  return { ...state, detached };
}

/**
 * Resolve the Workflow definition and record a new run, without advancing it. The run exists
 * in the store (status `running`, nothing started) as soon as this returns, so its id can be
 * handed to a caller before any step executes.
 */
function prepareWorkflowRun(params) {
  const cwd = params.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = params.repoRoot ? path.resolve(params.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = params.worktree ? path.resolve(params.worktree) : roots.worktreeRoot;

  let workflow;
  let workflowId;

  if (params.workflow) {
    workflow = validateWorkflow(params.workflow);
    workflowId = workflow.id;
  } else if (params.planPath) {
    workflow = translatePlanToWorkflow(params.planPath);
    workflowId = workflow.id;
  } else if (params.workflowId) {
    workflow = loadWorkflow(params.workflowId, { packageRoot: mainRoot, cwd });
    workflowId = workflow.id;
  } else {
    throw new RunnerConfigError('startWorkflow requires workflowId, workflow, or planPath');
  }

  const contextRefs = normalizeContextRefs(params.contextRefs);
  const allRefs = [...contextRefs, ...workflow.steps.flatMap((step) => step.units.flatMap((unit) => unit.template.contextRefs || []))];
  if (allRefs.some((ref) => !/^(unit-run:|gate-answer:)/.test(ref)) && mainRoot !== worktreePath
      && resolveGitRoots(mainRoot).mainCheckoutRoot !== resolveGitRoots(worktreePath).mainCheckoutRoot) {
    throw new RunnerConfigError('Workflow contextRefs cannot use plain paths across repositories; use unit-run:<id>/<role> or gate-answer:<workflowRunId>/<stepId>');
  }

  const configSnapshot = snapshotRunnerConfig(mainRoot);
  const { workflowRunId, runDir } = createWorkflowRun({
    repoRoot: mainRoot,
    workflowId,
    workflow,
    configSnapshot,
    request: params.request,
    stanceOptions: normalizeStanceOptions(params.stanceOptions),
    contextRefs,
  });

  return { workflowRunId, runDir, workflow, mainRoot, worktreePath };
}

/**
 * Start a new Workflow run and hand its advancing to a detached process, returning as soon as
 * the run is recorded. The caller gets the run id and where to read progress
 * (`fgos workflow status <id>`); the detached process is `fgos workflow resume <id>`, so it
 * survives the caller exiting or being killed and stays readable through the same event log.
 *
 * Same params as startWorkflow, plus `params.cliPath` to override the CLI entry that is spawned.
 *
 * @returns {object} Projected state of the just-recorded run plus `detached: { pid, logPath, statusCommand }`
 */
export function startWorkflowDetached(params = {}) {
  const { workflowRunId, runDir, mainRoot, worktreePath } = prepareWorkflowRun(params);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir,
    worktree: params.worktree ? worktreePath : undefined,
    cwd: params.cwd,
    cliPath: params.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}

/**
 * Start a new Workflow run and advance it in this process until it completes, fails, or parks.
 *
 * @param {object} params
 * @param {string} [params.workflowId] Id of registered workflow
 * @param {object} [params.workflow] In-memory workflow object
 * @param {string} [params.planPath] Path to AgentKit plan.md or plan directory
 * @param {string} [params.request] The owner's request this run serves; given to every unit
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @param {string} [params.worktree]
 * @param {Function} [params.onLog]
 * @returns {Promise<object>} Projected workflow state
 */
export async function startWorkflow(params = {}) {
  const { workflowRunId, workflow, mainRoot, worktreePath } = prepareWorkflowRun(params);

  return await withAdvanceLock(mainRoot, workflowRunId, () =>
    advanceWorkflowRun({
      repoRoot: mainRoot,
      workflowRunId,
      workflow,
      mainRoot,
      worktreePath,
      onLog: params.onLog,
    }),
  );
}

/**
 * Get current projected status of a Workflow run, plus `advance: { running, pid, logPath, lastLines?, hint? }`
 * describing its detached advance.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {object} Projected state
 */
export function statusWorkflow(workflowRunId, options = {}) {
  if (!workflowRunId) throw new RunnerConfigError('statusWorkflow requires workflowRunId');
  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;

  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  const state = projectWorkflowState(events);
  return { ...state, advance: advanceReport(workflowRunDirOf(mainRoot, workflowRunId), workflowRunId, state, events) };
}

/**
 * Answer a parked human gate in a Workflow run.
 *
 * @param {string} workflowRunId
 * @param {object} params
 * @param {string} params.stepId
 * @param {string} params.answer
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @returns {Promise<object>} Projected state after advancing
 */
export async function answerWorkflow(workflowRunId, params = {}) {
  const { mainRoot, worktreePath } = resolveAnswerTarget(workflowRunId, params);
  return await withAdvanceLock(mainRoot, workflowRunId, () => {
    const state = recordGateAnswer(workflowRunId, params, mainRoot);
    return advanceWorkflowRun({
      repoRoot: mainRoot,
      workflowRunId,
      workflow: state.workflow,
      mainRoot,
      worktreePath,
    });
  });
}

function resolveAnswerTarget(workflowRunId, params) {
  if (!workflowRunId) throw new RunnerConfigError('answerWorkflow requires workflowRunId');
  if (!params.stepId) throw new RunnerConfigError('answerWorkflow requires stepId');
  if (params.answer === undefined) throw new RunnerConfigError('answerWorkflow requires answer');

  const cwd = params.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = params.repoRoot ? path.resolve(params.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = params.worktree ? path.resolve(params.worktree) : roots.worktreeRoot;
  return { mainRoot, worktreePath };
}

/** Append the gate answer to the run's event log; returns the run state as it was before the answer. */
function recordGateAnswer(workflowRunId, params, mainRoot) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  const state = projectWorkflowState(events);

  // The file comes first: an answer that cannot be kept where later units read it is refused,
  // not recorded.
  const approved = params.approved === true || params.approved === 'true';
  const answeredAt = new Date().toISOString();
  const question = state.questions.find((q) => q.stepId === params.stepId)?.question ?? state.steps[params.stepId]?.gate?.question ?? '';
  writeGateAnswerFile({ mainRoot, workflowRunId, stepId: params.stepId, question, answer: String(params.answer), answeredAt, approved });

  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId,
    event: {
      type: 'gate.answer',
      payload: {
        stepId: params.stepId,
        answer: params.answer,
        approved,
        answeredAt,
      },
    },
  });
  return state;
}

/**
 * Keep the owner's answer to a human gate as a file in the run directory, the one place later
 * units are handed it from (`gate-answer:<workflowRunId>/<stepId>`). A second answer to the same
 * gate replaces the first.
 */
function writeGateAnswerFile({ mainRoot, workflowRunId, stepId, question, answer, answeredAt, approved }) {
  const file = gateAnswerFile(mainRoot, workflowRunId, stepId);
  if (!file) {
    throw new RunnerConfigError(`gate answer refused: "${stepId}" is not a step id that can name an answer file`);
  }
  let baseHeader = '';
  let priorRounds = '';
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8');
    const roundsIndex = existing.indexOf('## Rounds');
    if (roundsIndex !== -1) {
      baseHeader = existing.slice(0, roundsIndex).trim();
      priorRounds = existing.slice(roundsIndex).trim();
    } else {
      baseHeader = existing.trim();
    }
  }

  const roundEntry = [
    `### Round at ${answeredAt} (${approved ? 'Approved' : 'Clarification'})`,
    '',
    `- Approved: ${approved ? 'yes' : 'no'}`,
    '',
    '#### Answer',
    '',
    answer,
    '',
  ].join('\n');

  let text;
  if (!baseHeader) {
    text = [
      `# Owner's answer at the "${stepId}" gate`,
      '',
      `This is input from the owner of the Workflow run, given at a human gate; it is not output of another agent.`,
      '',
      `- Workflow run: ${workflowRunId}`,
      `- Step: ${stepId}`,
      `- Answered by: the owner, through "fgos workflow answer"`,
      '',
      '## Question',
      '',
      question,
      '',
      '## Rounds',
      '',
      roundEntry,
    ].join('\n');
  } else if (priorRounds) {
    text = `${baseHeader}\n\n${priorRounds}\n\n${roundEntry}\n`;
  } else {
    text = `${baseHeader}\n\n## Rounds\n\n${roundEntry}\n`;
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

/**
 * Record a gate answer and hand advancing the run to a detached process, returning as soon as
 * the answer is stored. Refuses, without recording anything, while a live process is advancing
 * the run. Same params as answerWorkflow, plus `params.cliPath`.
 *
 * @returns {object} Projected state with the answer recorded plus `detached: { pid, logPath, statusCommand }`
 */
export function answerWorkflowDetached(workflowRunId, params = {}) {
  const { mainRoot, worktreePath } = resolveAnswerTarget(workflowRunId, params);
  assertNoLiveAdvance(mainRoot, workflowRunId);
  recordGateAnswer(workflowRunId, params, mainRoot);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir: workflowRunDirOf(mainRoot, workflowRunId),
    worktree: params.worktree ? worktreePath : undefined,
    cwd: params.cwd,
    cliPath: params.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}

/**
 * Resume execution of an existing Workflow run.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {Promise<object>} Projected state
 */
export async function resumeWorkflow(workflowRunId, options = {}) {
  const { mainRoot, worktreePath, state } = resolveResumeTarget(workflowRunId, options);
  return await withAdvanceLock(mainRoot, workflowRunId, () =>
    advanceWorkflowRun({
      repoRoot: mainRoot,
      workflowRunId,
      workflow: state.workflow,
      mainRoot,
      worktreePath,
    }),
  );
}

function resolveResumeTarget(workflowRunId, options) {
  if (!workflowRunId) throw new RunnerConfigError('resumeWorkflow requires workflowRunId');
  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;

  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  return { mainRoot, worktreePath, state: projectWorkflowState(events) };
}

/**
 * Hand advancing an existing run to a detached process, returning at once. Refuses while a live
 * process is already advancing the run. Same options as resumeWorkflow, plus `options.cliPath`.
 *
 * @returns {object} Projected state plus `detached: { pid, logPath, statusCommand }`
 */
export function resumeWorkflowDetached(workflowRunId, options = {}) {
  const { mainRoot, worktreePath } = resolveResumeTarget(workflowRunId, options);
  assertNoLiveAdvance(mainRoot, workflowRunId);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir: workflowRunDirOf(mainRoot, workflowRunId),
    worktree: options.worktree ? worktreePath : undefined,
    cwd: options.cwd,
    cliPath: options.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}
