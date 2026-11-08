// src/workflow/case-runtime.mjs — runtime state beside a case's ledger, and the one drain that folds it in
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// None of these files is a ledger line. A reservation file says an attempt may still be running. A
// settle-pending file is a settle that could not take `advance`. A gate-answer round is one answer, made
// once and never rewritten: its file is created exclusively, and the `gate.answer` event that consumes
// it is appended by whoever holds `advance` next (`drainCaseInbox`), so an `answer` never writes the
// ledger itself. Everything here is rebuilt from, or folded into, the ledger; the ledger is the truth.

import fs from 'node:fs';
import path from 'node:path';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { dispatchCwdHolder } from '../run-supervisor/cwd-lock.mjs';
import { gateAnswerFile, runDirOf } from '../runner/execution/case-run-paths.mjs';
import { appendWorkflowEvent, readWorkflowEvents } from './store.mjs';
import { gateOfStep } from './case-projection.mjs';
import { unbindWorktree } from './case-bindings.mjs';
import { installOnce, replaceDurably } from '../native/door.mjs';

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

const listJson = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort() : []);

// --- reservations -------------------------------------------------------------------------------

const reservationsDir = (mainRoot, caseId) => path.join(runDirOf(mainRoot, caseId), 'reservations');

export function writeReservationFile({ mainRoot, caseId, reservation }) {
  writeJsonAtomic(path.join(reservationsDir(mainRoot, caseId), `${reservation.reservationId}.json`), reservation);
}

export function removeReservationFile({ mainRoot, caseId, reservationId }) {
  fs.rmSync(path.join(reservationsDir(mainRoot, caseId), `${reservationId}.json`), { force: true });
}

export function readReservationFile(mainRoot, caseId, reservationId) {
  return readJson(path.join(reservationsDir(mainRoot, caseId), `${reservationId}.json`));
}

export function readReservationFiles(mainRoot, caseId) {
  return listJson(reservationsDir(mainRoot, caseId)).map((name) => readJson(path.join(reservationsDir(mainRoot, caseId), name))).filter(Boolean);
}

/**
 * Whether the attempt of a reservation is quiet: nothing holds the custody lease of its worktree. A
 * reservation is released only then (or when custody was settled), so a controller's death never frees it.
 */
export function reservationQuiet(mainRoot, reservation) {
  return !reservation.worktree || dispatchCwdHolder(path.join(mainRoot, '.fgos'), reservation.worktree) === null;
}

// --- settle-pending -----------------------------------------------------------------------------

const settlePendingDir = (mainRoot, caseId) => path.join(runDirOf(mainRoot, caseId), 'settle-pending');

/** A settle that could not take `advance`: kept as a file the next holder of `advance` appends first. */
export function writeSettlePending({ mainRoot, caseId, settle }) {
  writeJsonAtomic(path.join(settlePendingDir(mainRoot, caseId), `${settle.reservationId}.json`), settle);
}

/**
 * Record a settle on the ledger under the hold, once, and let go of what the reservation held: the
 * binding the admission created (only when its attempt is quiet) and the reservation file. A settle
 * already on the ledger is not appended again.
 *
 * @returns {boolean} whether the settle was appended now
 */
export function applySettle({ mainRoot, caseId, hold, settle, events = null }) {
  const known = events ?? readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
  const fresh = !known.some((e) => e.type === 'settle' && e.payload?.reservationId === settle.reservationId);
  if (fresh) appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId: caseId, event: { type: 'settle', payload: settle }, hold });
  const file = readReservationFile(mainRoot, caseId, settle.reservationId);
  if (file?.binding?.created) {
    unbindWorktree({ mainRoot, hold, caseId, generation: file.binding.generation, key: file.binding.key, worktree: file.worktree });
  }
  removeReservationFile({ mainRoot, caseId, reservationId: settle.reservationId });
  return fresh;
}

// --- gate-answer rounds -------------------------------------------------------------------------

function roundsDir(mainRoot, caseId, stepId) {
  const file = gateAnswerFile(mainRoot, caseId, stepId);
  if (!file) throw new RunnerConfigError(`gate answer refused: "${stepId}" is not a step id that can name an answer file`);
  return { file, dir: file.replace(/\.md$/, '.rounds') };
}

/** The rounds kept under the gate directory of `stepId`, each with `source`: the gate directory and file it was read from. */
function roundsOf(mainRoot, caseId, stepId) {
  const { dir } = roundsDir(mainRoot, caseId, stepId);
  return listJson(dir).map((name) => {
    const record = readJson(path.join(dir, name));
    return record && typeof record === 'object' ? { ...record, source: { stepId, file: name } } : null;
  }).filter(Boolean)
    .sort((a, b) => a.occurrence - b.occurrence || a.round - b.round);
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
export function unconsumedGateRounds(mainRoot, caseId, events) {
  const dir = path.join(runDirOf(mainRoot, caseId), 'gate-answers');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.rounds'))
    .flatMap((name) => roundsOf(mainRoot, caseId, name.slice(0, -'.rounds'.length)))
    .filter((r) => !roundConsumed(events, r))
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
}

// --- the drain ----------------------------------------------------------------------------------

/**
 * Fold the runtime inbox into the ledger. Called first by whoever takes `advance`: settles that could not
 * take it, then gate-answer rounds nobody recorded yet. Idempotent: a settle or round already on the
 * ledger is skipped.
 *
 * A round that fails `roundProblem` stays unfolded and is listed in `refused`.
 *
 * @returns {{ settles: number, answers: number, refused: Array<{ stepId: string, occurrence: number, round: number, problem: string }> }}
 */
export function drainCaseInbox({ mainRoot, caseId, hold }) {
  const inbox = [settlePendingDir(mainRoot, caseId), path.join(runDirOf(mainRoot, caseId), 'gate-answers')];
  if (!inbox.some((dir) => fs.existsSync(dir))) return { settles: 0, answers: 0, refused: [] };
  let events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
  const append = (event) => {
    const stored = appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId: caseId, event, hold });
    events = [...events, stored];
  };
  let settles = 0;
  let answers = 0;

  const pendingDir = settlePendingDir(mainRoot, caseId);
  for (const name of listJson(pendingDir)) {
    const settle = readJson(path.join(pendingDir, name));
    if (!settle) continue;
    if (applySettle({ mainRoot, caseId, hold, settle, events })) settles += 1;
    events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
    fs.rmSync(path.join(pendingDir, name), { force: true });
  }

  const steps = new Set();
  const refused = [];
  for (const round of unconsumedGateRounds(mainRoot, caseId, events)) {
    const problem = roundProblem({ events, round });
    if (problem) {
      refused.push({ stepId: round.stepId, occurrence: round.occurrence, round: round.round, problem });
      continue;
    }
    append({
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
    });
    steps.add(round.stepId);
    answers += 1;
  }
  for (const stepId of steps) renderGateAnswerFile(mainRoot, caseId, stepId);
  return { settles, answers, refused };
}
