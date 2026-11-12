// src/workflow/unit-handoff.mjs — what a Unit of a Workflow case is handed and what is checked of it afterwards
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// Helpers of the Playbook proposer, kept apart from its loop: the hand-off of earlier steps' outputs and
// gate answers, the pattern and the overrides a Unit implies, the write chain between writing Units, the
// paths a Unit wrote outside its scope, and the worktrees left behind when a case ends.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { createWorktreeCheckoutSync } from '../runner/repo-locks.mjs';
import { removeWorktree, deleteBranchRef } from '../runner/worktree.mjs';
import { worktreeAdminScope } from '../runner/execution/custody-door.mjs';
import { unitRunFacts } from '../runner/execution/unit-run-record.mjs';

import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { foldRunSetting } from '../runner/execution/run-request.mjs';
import { anonymousInputName, OWN_PREVIOUS_NAME, SEAT_PLACEHOLDER, reportDigest, resolveUnitInputs } from '../runner/execution/handoff-refs.mjs';
import { seatKeyOf } from '../runner/execution/legacy-seat-read.mjs';
import { stepSubjectDigest, unitRunsOf } from './ref-digests.mjs';

const GATE_ANSWER_NOTE_CHARS = 200;

/**
 * What a unit needs beyond its template objective: the owner's request the run was started
 * with, and what the steps it depends on (directly or not) produced.
 *
 * The objective carries only an index of the earlier units -- one summary line each, tagged with
 * its Unit run id. The reports themselves travel as `inputs`, one `unit-run:<id>/<seat>` per seat
 * of every earlier unit; the Execution Core turns them into absolute report paths in the
 * assignment's context refs, so nothing is truncated and no panelist is dropped.
 */
export function buildUnitHandoff({ template, state, step, workflow }) {
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

  // With anonymizeInputs the Execution Core copies each seat's report as seat-A, seat-B, ... in
  // the order of `inputs`, so the index below names them that way and nothing else: no step,
  // unit, unit run or seat. A same-seat input is not part of that numbering: the seat it is for
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
        for (const seat of new Set(results.map(seatKeyOf))) {
          const summary = results.filter((r) => seatKeyOf(r) === seat).at(-1)?.runResult.agentClaim?.summary;
          index.push(`### ${anonymousInputName(anonymized++)}${label ? ` (${label})` : ''}${summary ? `\nSummary: ${summary}` : ''}`);
          inputs.push(`unit-run:${unitState.unitRunId}/${seat}`);
        }
        continue;
      }
      const summary = results.at(-1)?.runResult.agentClaim?.summary;
      index.push(`### ${prior.id} / ${unitId} (unit run ${unitState.unitRunId})${label ? ` (${label})` : ''}${summary ? `\nSummary: ${summary}` : ''}`);
      for (const seat of new Set(results.map(seatKeyOf))) inputs.push(`unit-run:${unitState.unitRunId}/${seat}`);
    }
  }
  if (index.length > 0) {
    parts.push(
      `Output of earlier steps${anonymize ? ', anonymized' : ''} (the full report of every seat is listed under Context refs; read them before answering):\n\n${index.join('\n\n')}`,
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

export function renderGateQuestion(step, state, mainRoot) {
  return (step.gate.question || `Approve step "${step.id}"?`).replace(
    /\{\{report:([^/{}:\s]+)\/([^{}:\s]+):missing expertise\}\}/g,
    (_, stepId, unitId) => {
      const unit = state.steps[stepId]?.units[unitId];
      if (unit?.status !== 'completed' || !unit.unitRunId) throw new RunnerConfigError('gate report producer is not settled');
      const producer = unit.results?.filter((record) => seatKeyOf(record) === 'producer').at(-1);
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
 * The question a human gate asks now: its text with the producer's "missing expertise" quoted in. A packet
 * that cannot be read parks the gate with a question that says so; no decision is inferred from it.
 */
export function gateQuestionOf(step, state, mainRoot) {
  try {
    return renderGateQuestion(step, state, mainRoot);
  } catch (error) {
    const reason = error instanceof SyntaxError ? 'invalid JSON' : error.code || error.message;
    return `Cannot read settled producer "missing expertise": ${reason}. No expertise decision was inferred. Review the packet manually and answer this gate with your decision and acknowledged limitation.`;
  }
}

/**
 * The pattern a template runs: its name, or the name with the template's `params` when it has
 * any -- the same `{ pattern, params }` shape the Execution Core accepts from a CLI caller.
 */
export function unitPatternOf(template) {
  const name = template.pattern || 'solo';
  return template.params ? { pattern: name, params: template.params } : name;
}

/**
 * The overrides a unit implies. A template's `persona` is not one of them: it travels on the Unit
 * itself (unitData.persona), which bind() ranks below an override and above the capability's.
 *
 * A `--seats` run binds each named persona to its own seat of every panel unit, scoped by seat,
 * with the persona text pinned at start: the named seat keeps its persona, every other seat (the
 * synthesizer included) has no matching override and falls through to the unit's own persona.
 *
 * A run started with `--effort` asks every role for that reasoning effort, the way `fgos run --effort`
 * does: on every entry above, and as a trailing unscoped override that a role no entry names falls
 * through to. No override names an origin that says a person typed it: nothing of this release can attest one.
 */
export function unitOverridesOf(unit, seatPersonas = [], options = {}) {
  const { effort = null, timeoutMs = null, account = null } = options ?? {};
  const unitTimeoutMs = unit.timeoutMs ?? unit.template?.timeoutMs;

  const isPanel = typeof options?.loopOf === 'function' ? options.loopOf(unit.template?.pattern) === 'panel' : false;
  const seatScoped = isPanel
    ? seatPersonas.map(({ seat, name, digest, text, identity }) => ({
      scope: { unit: unit.id, seat },
      persona: name,
      personaPin: { name, digest, text, ...(identity === undefined ? {} : { identity }) },
      origin: 'workflow',
    }))
    : [];

  // Each run-level setting is the one fold the Execution door owns; a unit's own timeout wins over the run's.
  let overrides = seatScoped;
  if (effort !== null) overrides = foldRunSetting(overrides, 'reasoningEffort', effort);
  if (unitTimeoutMs === undefined && timeoutMs !== null) overrides = foldRunSetting(overrides, 'timeoutMs', timeoutMs);
  if (account === null) return overrides;
  // The account pin's mode rides `accountPin` on the run options; the label only records in the binding's provenance who asked.
  return foldRunSetting(overrides, 'account', account).map((ov) => (ov.scope ? ov : { ...ov, origin: 'workflow' }));
}

/**
 * The writing unit whose branch a writing unit of `stepId` starts from: the nearest writing unit
 * among the steps it builds on, directly or through read-only steps. Null when it builds on none.
 * Building on two or more writing units (none built on the other) is refused: nothing here merges.
 */
function writeBaseOf(workflow, stepId) {
  const byId = new Map(workflow.steps.map((s) => [s.id, s]));
  const ancestorsOf = (id) => {
    const seen = new Set();
    const walk = (cur) => {
      for (const dep of byId.get(cur)?.dependsOn ?? []) {
        if (seen.has(dep)) continue;
        seen.add(dep);
        walk(dep);
      }
    };
    walk(id);
    return seen;
  };
  const writers = [];
  for (const id of ancestorsOf(stepId)) {
    const step = byId.get(id);
    for (const unit of step.units) if (unit.template.writes?.length) writers.push({ stepId: id, unitId: unit.id });
  }
  // Drop a writer some other writer already builds on: its work is on that writer's branch.
  const nearest = writers.filter((w) => !writers.some((o) => o.stepId !== w.stepId && ancestorsOf(o.stepId).has(w.stepId)));
  if (nearest.length > 1) {
    return { refused: nearest.map((w) => w.unitId) };
  }
  return nearest[0] ?? null;
}

/**
 * Refuse a units file where a writing unit builds on more than one writing unit, before any run
 * exists. A pattern or plan with that shape keeps starting such a unit from HEAD, as before.
 */
export function assertWriteChains(workflow) {
  for (const step of workflow.steps) {
    if (!step.units.some((u) => u.template.writes?.length)) continue;
    const base = writeBaseOf(workflow, step.id);
    if (base?.refused) {
      const writer = step.units.find((u) => u.template.writes?.length).id;
      throw new RunnerConfigError(
        `Workflow "${workflow.id}" unit "${writer}" writes and builds on more than one writing unit (${base.refused.join(', ')}); merge these units into one, or make one depend on the other so they form a chain`,
      );
    }
  }
}

/** The writing unit a writer starts from, or null; a definition with more than one gets none (HEAD). */
export function singleWriteBaseOf(workflow, stepId) {
  const base = writeBaseOf(workflow, stepId);
  return base && !base.refused ? base : null;
}

/**
 * Where a unit runs. A resumed Unit run keeps the worktree it recorded. A read-only unit shares the run's
 * worktree. A writing unit goes on in the worktree and branch an earlier attempt recorded while both still
 * exist (a rerun after an infrastructure failure, a controller that died after scheduling it); otherwise it
 * gets a new branch and worktree started from the writing unit it builds on, or from HEAD. A writing unit
 * never falls back to the shared checkout: `error` says why it has no worktree and it then fails without running.
 *
 * @returns {{ worktree: string, branch: string|null, baseRef: string|null, baseSha: string|null,
 *   owned: boolean, created: boolean, error: string|null }} `owned`: the worktree is this unit's; `created`: made just now
 */
export function prepareUnitWorktree({ mainRoot, workflow, state, step, unitId, writes, base, uState, resuming, worktreePath, workflowRunId }) {
  const recorded = (owned) => ({
    worktree: uState.worktreePath ?? worktreePath, branch: uState.branch ?? null, baseRef: uState.baseRef ?? null, baseSha: uState.baseSha ?? null, owned, created: false, error: null,
  });
  if (resuming) return recorded(false);
  if (writes.length === 0) return { worktree: worktreePath, branch: null, baseRef: null, baseSha: null, owned: false, created: false, error: null };
  if (uState?.worktreePath && uState.branch && fs.existsSync(uState.worktreePath) && workflowCommit(mainRoot, uState.branch)) return recorded(true);

  const branch = `wf/${workflowRunId}/${unitId}`;
  // A unit that builds on a writing unit starts on that unit's branch, so it sees its work.
  const baseRef = base ? state.steps[base.stepId]?.units[base.unitId]?.branch : 'HEAD';
  const baseSha = baseRef ? workflowCommit(mainRoot, baseRef) : null;
  const unprepared = (error) => ({ worktree: worktreePath, branch, baseRef, baseSha, owned: false, created: false, error });
  if (!baseSha) {
    return unprepared(base
      ? `base branch "${baseRef ?? `of unit ${base.unitId}`}" of writing unit ${base.unitId} is gone; it cannot start from the work it builds on`
      : `cannot resolve ${baseRef} to start the unit's worktree from`);
  }
  try {
    return { worktree: createWorkflowWorktree({ repoRoot: mainRoot, branch, baseRef: baseSha }).worktreePath, branch, baseRef, baseSha, owned: true, created: true, error: null };
  } catch (err) {
    return unprepared(`could not create the unit's worktree on ${branch}: ${err.message}`);
  }
}

export function workflowInspect(cwd) {
  return createGitInspect(gitPortOptions(cwd));
}

export function workflowCommit(cwd, name) {
  try { return workflowInspect(cwd).resolveCommit({ name }); }
  catch { return null; }
}

export function workflowCheckout(cwd) {
  const inspect = workflowInspect(cwd);
  const repo = inspect.resolveRepo();
  if (repo.notARepository) return { commonDir: null, ref: null };
  let cursor;
  do {
    const page = inspect.listWorktrees({ cursor, maxEntries: 4096 });
    const row = page.entries.find(row => Buffer.from(row.path).toString() === repo.worktreeRoot);
    if (row) return { commonDir: repo.commonDir, ref: row.branch?.replace(/^refs\/heads\//, '') ?? 'HEAD' };
    cursor = page.nextCursor;
  } while (cursor);
  throw new RunnerConfigError('checkout registration not found');
}

export function resolveIntegrationTarget({ repoRoot } = {}) {
  try {
    const inspect = workflowInspect(repoRoot);
    const target = inspect.resolveTrunk();
    if (target.kind !== 'known') return null;
    return target.value.replace(/^refs\/heads\//, '').replace(/^refs\/remotes\/[^/]+\//, '');
  } catch { return null; }
}

export function createWorkflowWorktree({ repoRoot, branch, baseRef = 'HEAD', worktreeDir }) {
  if (!repoRoot || !branch) throw new RunnerConfigError('createWorkflowWorktree requires repoRoot and branch');
  const worktreePath = path.resolve(worktreeDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-wt-')));
  const inspect = workflowInspect(repoRoot);
  const existing = inspect.resolveRef({ name: `refs/heads/${branch}` });
  createWorktreeCheckoutSync(worktreeAdminScope(), repoRoot, { path: worktreePath, branch, base: existing.kind === 'direct' ? existing.oid : baseRef }, { inspect });
  return { worktreePath: fs.realpathSync(worktreePath), branch };
}

export function cleanupWorkflowWorktree({ repoRoot, worktreePath, branch, deleteBranch = true, deliveredTo }) {
  if (!repoRoot || !worktreePath) throw new RunnerConfigError('cleanupWorkflowWorktree requires repoRoot and worktreePath');
  const expected = branch ? workflowCommit(repoRoot, branch) : null;
  // The existing Execution adapter takes custody and delegates removal/prune to Git.
  // A refusal propagates; neither checkout bytes nor branch are deleted on failure.
  removeWorktree(repoRoot, worktreePath, { ...(deliveredTo ? { deliveredTo } : {}) });
  if (deleteBranch && branch && expected) deleteBranchRef(repoRoot, branch, expected);
}

/**
 * Remove the worktrees of Units whose work reached the main line; keep the rest and say where
 * they are. A passed Unit counts as integrated only when its branch is already part of the integration target (the repository trunk) and
 * its worktree holds nothing uncommitted -- removing a worktree forgets anything left in it. A
 * Unit that failed, was refused, or never finished keeps its worktree for investigation.
 */
export function settleUnitWorktrees({ mainRoot, state }) {
  const removed = [];
  const kept = [];
  if (!Object.values(state.steps).some(step => Object.values(step.units).some(unit => unit.worktreePath))) return { removed, kept };
  const integrationTarget = resolveIntegrationTarget({ repoRoot: mainRoot });
  const deliveredTo = integrationTarget ? workflowCommit(mainRoot, integrationTarget) : null;
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
      } else {
        try {
          const source = unit.branch ? workflowCommit(mainRoot, unit.branch) : null;
          if (unit.branch && (!source || !deliveredTo || workflowInspect(mainRoot).ancestry({ ancestor: source, descendant: deliveredTo }).answer !== 'yes')) {
            reason = 'branch not integrated';
          } else if (workflowInspect(unit.worktreePath).status({ untracked: 'normal', maxEntries: 1 }).entries.length !== 0) {
            reason = 'worktree has uncommitted changes';
          }
        } catch (err) { reason = `worktree inspection refused: ${err.message}`; }
      }
      if (reason) {
        kept.push({ ...entry, reason });
        continue;
      }
      try {
        cleanupWorkflowWorktree({
          repoRoot: mainRoot,
          worktreePath: unit.worktreePath,
          branch: unit.branch,
          deleteBranch: Boolean(unit.branch),
          deliveredTo,
        });
      } catch (err) {
        kept.push({ ...entry, reason: `cleanup refused: ${err.message}` });
        continue;
      }
      removed.push(entry);
    }
  }
  return { removed, kept };
}

/** Whether a running unit's recorded Unit run can still be continued: its record is on disk and the
 * worktrees it ran in still exist. */
export function canResumeUnitRun(mainRoot, uState) {
  if (!uState.unitRunId) return false;
  if (uState.worktreePath && !fs.existsSync(uState.worktreePath)) return false;
  return unitRunFacts(path.join(mainRoot, '.fgos'), uState.unitRunId).resumable;
}

/**
 * The revisions of settled reports a fresh approval stands behind: for each human gate whose latest approval
 * is bound to the digest of what its subject is NOW, the sha256 of the bytes of each report that subject is made
 * of. The Execution Core refuses a settled report whose bytes changed (`report-changed-after-settle`); this is
 * the authority that lets it hand over the one a person approved after the change, and only that one. An edit
 * no approval covers is not here, so it is still refused.
 *
 * @param {object} params
 * @param {Array<object>} params.events the case's ledger
 * @returns {string[]} sha256 hex digests
 */
export function approvedReportDigests({ events, state, workflow, mainRoot }) {
  const accepted = new Set();
  for (const step of workflow.steps) {
    if (!step.gate || step.gate.kind !== 'human' || state.steps[step.id]?.approved !== true) continue;
    const approval = [...events].reverse().find((e) => e.type === 'gate.answer' && e.payload?.stepId === step.id && e.payload.approved === true);
    const current = approval?.payload?.subjectDigest;
    if (!current || current !== stepSubjectDigest({ state, workflow, stepId: step.id, mainRoot })) continue;
    try {
      // All the step's reports or none: one that cannot be read leaves the whole step unaccepted.
      const digests = unitRunsOf(state, step.dependsOn).flatMap(({ unitRunId, seats }) => seats.map((seat) => reportDigest(unitRunId, seat, mainRoot).sha256));
      for (const digest of digests) accepted.add(digest);
    } catch {
      // A report that cannot be read is not accepted; the Unit that needs it is refused by name.
    }
  }
  return [...accepted];
}
