// src/workflow/case-runtime.mjs — runtime state beside a case's ledger, and the one drain that folds it in
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// None of these files is a ledger line. A settle-pending file is a settle that could not take `advance`. A
// gate-answer round is one answer, made once and never rewritten: its file is created exclusively, and the
// `gate.answer` event that consumes it is appended by whoever holds `advance` next (`drainCaseInbox`), so an
// `answer` never writes the ledger itself. Both are written by processes other than the one that folds them,
// so they are read as agent-written input. Everything here is folded into the ledger; the ledger is the truth.

import fs from 'node:fs';
import path from 'node:path';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { dispatchCwdHolder } from '../run-supervisor/cwd-lock.mjs';
import { assignmentDir } from '../runner/dispatch/assignment-layout.mjs';
import { gateAnswerFile, runDirOf } from '../runner/execution/case-run-paths.mjs';
import { unitControllerHeld } from '../runner/execution/unit-control.mjs';
import { appendWorkflowEvent, readWorkflowEvents } from './store.mjs';
import { gateOfStep, projectCase } from './case-projection.mjs';
import { repairCaseBindings, unbindWorktree } from './case-bindings.mjs';
import { installOnce, replaceDurably } from '../native/door.mjs';
import { readAgentFileSync } from '../native/proof-helpers.mjs';

/** The id prefix of the Unit run a case gate makes; a gate has no unit record to resume. */
export const GATE_RUN_PREFIX = 'gate-run-';

// The largest real inbox file seen was 763 bytes (an answer round); a settle carries a few receipts.
const INBOX_FILE_MAX_BYTES = 256 * 1024;

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  replaceDurably(path.dirname(file), path.basename(file), text, 0o644);
}

const writeJsonAtomic = (file, value) => writeText(file, JSON.stringify(value));

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

/** `{ value }` of a file another process may have written, or `{ problem }`: never follows a link, never waits on a pipe. */
function readInbox(file) {
  try {
    return { value: JSON.parse(readAgentFileSync(file, INBOX_FILE_MAX_BYTES).toString('utf8')) };
  } catch (err) {
    if (err.code === 'ENOTREGULAR' || err.code === 'ELOOP') return { problem: 'it is not a regular file (a pipe, a link or a directory)' };
    return { problem: err.code === 'E2BIG' ? `it is larger than ${INBOX_FILE_MAX_BYTES} bytes` : `it cannot be read (${err.code ?? err.message})` };
  }
}

const inboxName = (mainRoot, caseId, file) => path.relative(runDirOf(mainRoot, caseId), file).split(path.sep).join('/');

const listJson = (dir) => {
  try {
    if (!fs.lstatSync(dir).isDirectory()) return [];
  } catch {
    return [];
  }
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
};

/**
 * Whether nothing can still be running or resumed for a live reservation. Only positive evidence counts: a
 * writing worktree that exists, whose custody lease nobody holds, and a Unit run that is not resumable (no
 * record, or one settled with no controller left); a gate's run never has a record. A read-only reservation,
 * a missing worktree, a lock that cannot be listed and a record that cannot be read are all "not proven".
 */
function reservationDead(mainRoot, { worktree, unitRunId }) {
  const fgosDir = path.join(mainRoot, '.fgos');
  if (!worktree || !fs.existsSync(worktree) || dispatchCwdHolder(fgosDir, worktree) !== null) return false;
  if (typeof unitRunId === 'string' && unitRunId.startsWith(GATE_RUN_PREFIX)) return true;
  const unitDir = typeof unitRunId === 'string' ? assignmentDir(fgosDir, unitRunId) : null;
  const record = unitDir && path.join(unitDir, 'unit.json');
  if (!record || !fs.existsSync(record)) return true;
  return readJson(record)?.execution?.status === 'settled' && !unitControllerHeld(unitDir);
}

/** Give back, as `not-started`, each live reservation proven dead, under the hold. @returns {boolean} whether any was */
function releaseDeadReservations({ mainRoot, caseId, hold, events }) {
  if (!events.some((e) => e.type === 'reservation')) return false;
  const dead = projectCase(events).liveReservations.filter((r) => reservationDead(mainRoot, r));
  for (const r of dead) {
    const settle = { reservationId: r.reservationId, activity: r.activity, unitId: r.unitId ?? null, unitRunId: null, outcome: 'not-started', receipts: [], achieved: [], seatLaunchesUsed: 0, blind: r.blind === true, settledAt: new Date().toISOString() };
    applySettle({ mainRoot, caseId, hold, settle, events });
  }
  return dead.length > 0;
}

// --- settle-pending -----------------------------------------------------------------------------

const settlePendingDir = (mainRoot, caseId) => path.join(runDirOf(mainRoot, caseId), 'settle-pending');

/** A settle that could not take `advance`: kept as a file the next holder of `advance` appends first. */
export function writeSettlePending({ mainRoot, caseId, settle }) {
  writeJsonAtomic(path.join(settlePendingDir(mainRoot, caseId), `${settle.reservationId}.json`), settle);
}

/**
 * Record a settle on the ledger under the hold, once, and let go of the binding the ledger shows for the
 * reservation's worktree (the unbind waits for a quiet attempt). A settle already on the ledger is not
 * appended again.
 *
 * @returns {boolean} whether the settle was appended now
 */
export function applySettle({ mainRoot, caseId, hold, settle, events = null }) {
  const known = events ?? readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
  const fresh = !known.some((e) => e.type === 'settle' && e.payload?.reservationId === settle.reservationId);
  if (fresh) appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId: caseId, event: { type: 'settle', payload: settle }, hold });
  const { worktree } = known.find((e) => e.type === 'reservation' && e.payload?.reservationId === settle.reservationId)?.payload ?? {};
  const held = worktree ? known.findLast((e) => e.type === 'binding' && e.payload?.worktreeRoot === worktree)?.payload : null;
  if (held?.state === 'bound') unbindWorktree({ mainRoot, hold, caseId, generation: held.generation, key: held.key, worktree });
  return fresh;
}

// --- gate-answer rounds -------------------------------------------------------------------------

function roundsDir(mainRoot, caseId, stepId) {
  const file = gateAnswerFile(mainRoot, caseId, stepId);
  if (!file) throw new RunnerConfigError(`gate answer refused: "${stepId}" is not a step id that can name an answer file`);
  return { file, dir: file.replace(/\.md$/, '.rounds') };
}

/**
 * The rounds kept under the gate directory of `stepId`, each with `source`: the gate directory and file it was
 * read from. A file that cannot be read as input is left out and named in `skipped`.
 */
function roundsOf(mainRoot, caseId, stepId, skipped = []) {
  const { dir } = roundsDir(mainRoot, caseId, stepId);
  return listJson(dir).flatMap((name) => {
    const { value, problem } = readInbox(path.join(dir, name));
    if (problem) skipped.push({ file: inboxName(mainRoot, caseId, path.join(dir, name)), problem });
    return value && typeof value === 'object' ? [{ ...value, source: { stepId, file: name } }] : [];
  }).sort((a, b) => a.occurrence - b.occurrence || a.round - b.round);
}

/**
 * Why a round cannot be folded into the ledger now, or null. The one predicate the answer verb and the drain
 * share: the round is a file of its own gate (directory and name agree with what it says), the step is a gate
 * of the guide, the round answers the gate's open occurrence (asked and not settled since), it has the gate's
 * mode. The subject it approves is not judged here: an approval of a subject that has since changed is
 * folded and then found stale by the admission guard, which asks the gate again.
 */
function roundProblem({ events, round }) {
  const { stepId, occurrence } = round;
  if (round.source.stepId !== stepId) return `its file is kept under gate "${round.source.stepId}", not "${stepId}"`;
  if (round.source.file !== `${occurrence}-${round.round}.json`) return `its file name ${round.source.file} disagrees with occurrence ${occurrence} round ${round.round}`;
  const gate = gateOfStep(events, stepId);
  if (!gate) return `"${stepId}" is no gate of the guide`;
  if ((round.mode ?? 'consent') !== gate.mode) return `it was given in ${round.mode} mode to a ${gate.mode} gate`;
  const parks = events.filter((e) => e.type === 'gate.park' && e.payload?.stepId === stepId);
  if (parks.length === 0 || occurrence !== parks.length) return `it answers occurrence ${occurrence}, not the gate's open one (${parks.length})`;
  const lastParkSeq = parks.at(-1).seq ?? 0;
  if (events.some((e) => e.type === 'gate.answer' && e.payload?.stepId === stepId && e.seq > lastParkSeq && (gate.mode === 'input' || e.payload.approved === true))) {
    return 'the gate is already answered and has not been asked again';
  }
  return null;
}

/** The text of an answer file, drawn from its rounds. A view: deleting it loses nothing. */
function renderAnswerFile(caseId, stepId, rounds) {
  const latest = rounds.at(-1);
  const entries = rounds.map((r) => [
    `### Round at ${r.answeredAt} (${r.approved ? 'Approved' : 'Clarification'})`,
    '',
    `- Approved: ${r.approved ? 'yes' : 'no'}`,
    '',
    '#### Answer',
    '',
    r.answer,
    '',
  ].join('\n'));
  return [
    '---',
    `approved: ${latest.approved ? 'yes' : 'no'}`,
    `occurrence: ${latest.occurrence}`,
    `round: ${latest.round}`,
    `subjectDigest: ${latest.subjectDigest ?? 'none'}`,
    '---',
    '',
    `# Owner's answer at the "${stepId}" gate`,
    '',
    'This is input from the owner of the Workflow run, given at a human gate; it is not output of another agent.',
    '',
    `- Workflow run: ${caseId}`,
    `- Step: ${stepId}`,
    '- Answered by: the owner, through "fgos workflow answer"',
    '',
    '## Question',
    '',
    rounds[0].question,
    '',
    '## Rounds',
    '',
    ...entries,
  ].join('\n');
}

function renderGateAnswerFile(mainRoot, caseId, stepId) {
  const { file } = roundsDir(mainRoot, caseId, stepId);
  const rounds = roundsOf(mainRoot, caseId, stepId);
  if (rounds.length === 0) return;
  writeText(file, renderAnswerFile(caseId, stepId, rounds));
}

const roundConsumed = (events, r) => events.some((e) => e.type === 'gate.answer' && e.payload?.stepId === r.stepId
  && e.payload.occurrence === r.occurrence && e.payload.round === r.round);

/**
 * Keep an answer as a round of the gate's current occurrence. Created exclusively and never rewritten:
 * a settling answer (an approval of a consent gate, or any answer to an input gate) closes the
 * occurrence, and a further answer to it is refused by name until the gate parks again.
 *
 * @param {object} params
 * @param {Array<object>} params.events the ledger as read now
 * @param {'consent' | 'input'} [params.mode]
 * @param {string | null} [params.subjectDigest] digest of what is being approved, as it is at answer time
 * @returns {{ stepId: string, occurrence: number, round: number, settles: boolean }}
 */
export function recordGateAnswerRound({ mainRoot, caseId, events, stepId, answer, approved, question, subjectDigest = null, mode = 'consent', answeredAt = new Date().toISOString() }) {
  const { dir } = roundsDir(mainRoot, caseId, stepId);
  const parks = events.filter((e) => e.type === 'gate.park' && e.payload?.stepId === stepId);
  if (parks.length === 0) {
    throw new RunnerConfigError(`gate "${stepId}" of "${caseId}" has not been asked yet; it can be answered only after it parks`, { code: 'gate-not-parked' });
  }
  const occurrence = parks.length;
  const lastParkSeq = parks.at(-1)?.seq ?? 0;
  const settlesNow = mode === 'input' || approved === true;
  const kept = roundsOf(mainRoot, caseId, stepId).filter((r) => r.occurrence === occurrence);
  // A round the drain would refuse never reaches the ledger, so it neither settles the gate nor blocks the next answer.
  const live = kept.filter((r) => roundConsumed(events, r) || roundProblem({ events, round: r }) === null);
  const settledInLedger = events.some((e) => e.type === 'gate.answer' && e.payload?.stepId === stepId && e.seq > lastParkSeq
    && ((e.payload.mode ?? mode) === 'input' || e.payload.approved === true));
  if (settledInLedger || live.some((r) => r.settles)) {
    throw new RunnerConfigError(`gate "${stepId}" of "${caseId}" is already answered (an approval is never replaced); it can be answered again only when it parks again`, { code: 'gate-already-answered' });
  }
  const last = kept.at(-1);
  if (last && live.includes(last) && !roundConsumed(events, last)) {
    throw new RunnerConfigError(`an earlier answer to gate "${stepId}" is not yet recorded on the ledger; wait for it before answering again`, { code: 'gate-already-answered' });
  }
  const round = (last?.round ?? 0) + 1;
  const record = { stepId, occurrence, round, answer: String(answer), approved: approved === true, settles: settlesNow, mode, question, subjectDigest, answeredAt };
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${occurrence}-${round}.json`);
  if (installOnce(dir, path.basename(target), JSON.stringify(record), 0o644) === 'already-exists') {
    throw new RunnerConfigError(`gate "${stepId}" was answered at the same moment by another process`, { code: 'gate-already-answered' });
  }
  renderGateAnswerFile(mainRoot, caseId, stepId);
  return { stepId, occurrence, round, settles: settlesNow };
}

/** Rounds of any gate of the case whose `gate.answer` event is not on the ledger yet. */
export function unconsumedGateRounds(mainRoot, caseId, events, skipped = []) {
  const dir = path.join(runDirOf(mainRoot, caseId), 'gate-answers');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.rounds'))
    .flatMap((name) => roundsOf(mainRoot, caseId, name.slice(0, -'.rounds'.length), skipped))
    .filter((r) => !roundConsumed(events, r))
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
}

// --- the drain ----------------------------------------------------------------------------------

/**
 * What every hold of `advance` does first, in this order: settle the binding records a crash left of this
 * case, fold in the settles that could not take `advance`, give back the reservations of dead controllers
 * (after the settles, so a result already on its way is never replaced), then fold in the gate-answer rounds
 * nobody recorded yet. Idempotent: a settle or round already on the ledger is skipped.
 *
 * A round that fails `roundProblem`, a settle that names no reservation of the case and an inbox file that
 * cannot be read stay where they are and are listed: rounds in `refused`, the rest in `skipped`.
 *
 * @returns {{ settles: number, answers: number, refused: Array<{ stepId: string, occurrence: number, round: number, problem: string }>, skipped: Array<{ file: string, problem: string }> }}
 */
export function drainCaseInbox({ mainRoot, caseId, hold }) {
  const read = () => readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
  let events = read();
  repairCaseBindings({ mainRoot, caseId, events });
  const result = { settles: 0, answers: 0, refused: [], skipped: [] };
  const pendingDir = settlePendingDir(mainRoot, caseId);

  for (const name of listJson(pendingDir)) {
    const file = path.join(pendingDir, name);
    const { value: settle, problem } = readInbox(file);
    const unknown = !problem && !events.some((e) => e.type === 'reservation' && e.payload?.reservationId === settle?.reservationId);
    if (problem || unknown) {
      result.skipped.push({ file: inboxName(mainRoot, caseId, file), problem: problem ?? 'it settles a reservation this case never made' });
      continue;
    }
    if (applySettle({ mainRoot, caseId, hold, settle, events })) result.settles += 1;
    events = read();
    fs.rmSync(file, { force: true });
  }
  if (releaseDeadReservations({ mainRoot, caseId, hold, events })) events = read();

  const steps = new Set();
  for (const round of unconsumedGateRounds(mainRoot, caseId, events, result.skipped)) {
    const problem = roundProblem({ events, round });
    if (problem) {
      result.refused.push({ stepId: round.stepId, occurrence: round.occurrence, round: round.round, problem });
      continue;
    }
    const stored = appendWorkflowEvent({
      repoRoot: mainRoot,
      workflowRunId: caseId,
      hold,
      event: {
        type: 'gate.answer',
        payload: {
          stepId: round.stepId,
          answer: round.answer,
          approved: round.approved,
          answeredAt: round.answeredAt,
          occurrence: round.occurrence,
          round: round.round,
          mode: round.mode,
          subjectDigest: round.subjectDigest,
        },
      },
    });
    events = [...events, stored];
    steps.add(round.stepId);
    result.answers += 1;
  }
  for (const stepId of steps) renderGateAnswerFile(mainRoot, caseId, stepId);
  return result;
}
