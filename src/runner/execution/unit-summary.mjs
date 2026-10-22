// Derived discussion read model. Execution owns selection; Observe only consumes it.
import fs from 'node:fs';
import path from 'node:path';
import { uniqueTmpTag } from '../../util/unique-tmp-tag.mjs';
import { readUnitRunSeats } from './unit-run-history.mjs';
import { normalizeWorkflowLink } from './unit.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { patternHistoryOutcome } from './patterns/history-outcome.mjs';
import { VALID_OUTCOMES } from './patterns/panel.mjs';
import { seatsOfRecord } from './legacy-seat-read.mjs';
import { seatKind, VERIFY_SEAT } from './seat-resolver.mjs';

// Version 2: every seat carries an owner-written kind, and a finished unit whose pattern was never
// recorded is published as UNDETERMINED_OUTCOME instead of being derived as if it were solo. Each
// seat names its `seat` id and its canonical `role`; a record written before seats existed is read
// through legacy-seat-read.mjs, which says what each directory name was.
export const UNIT_SUMMARY_CONTRACT = Object.freeze({ id: 'unit-summary', version: 2 });

/** A finished unit whose outcome cannot be derived from its records; never a pass or a failure. */
export const UNDETERMINED_OUTCOME = 'undetermined';

export function extractStance(agentClaim, options = []) {
  if (agentClaim?.stance === undefined) return { status: 'missing' };
  const stance = agentClaim.stance;
  if (!stance || typeof stance !== 'object' || Array.isArray(stance)) return { status: 'invalid', reason: 'stance-not-object' };
  if (typeof stance.choice !== 'string' || (!options.includes(stance.choice) && stance.choice !== 'other')) {
    return { status: 'invalid', reason: 'choice-not-declared' };
  }
  if (stance.confidence !== undefined && stance.confidence !== null
    && (typeof stance.confidence !== 'number' || !Number.isFinite(stance.confidence) || stance.confidence < 0 || stance.confidence > 1)) {
    return { status: 'invalid', reason: 'confidence-out-of-range' };
  }
  return { status: 'valid', choice: stance.choice, confidence: stance.confidence ?? null };
}

function timestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function workflowLink(value) {
  try { return normalizeWorkflowLink(value); } catch { return null; }
}

/** A published attempt without its terminal result remains unsettled, even after a crash. */
function unitHasActiveRun(unitDir, record) {
  if (fs.existsSync(path.join(unitDir, 'pending-inline.json'))) return true;
  if (record.execution?.status) return record.execution.status !== 'settled';
  for (const seatEntry of fs.readdirSync(unitDir, { withFileTypes: true })) {
    if (!seatEntry.isDirectory()) continue;
    const seatDir = path.join(unitDir, seatEntry.name);
    for (const round of fs.readdirSync(seatDir, { withFileTypes: true })) {
      if (!round.isDirectory() || !/^\d+(?:-fb\d+)?$/.test(round.name)) continue;
      const runsDir = path.join(seatDir, round.name, 'runs');
      if (!fs.existsSync(runsDir)) continue;
      for (const run of fs.readdirSync(runsDir, { withFileTypes: true })) {
        if (run.isDirectory()
          && fs.existsSync(path.join(runsDir, run.name, 'run.json'))
          && !fs.existsSync(path.join(runsDir, run.name, 'result.json'))) return true;
      }
    }
  }
  return false;
}

/** Build without changing original records. legacyCompletion must name this exact unit run. */
export function buildUnitSummary(unitDir, { legacyCompletion = null } = {}) {
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const unitRunId = path.basename(unitDir);
  if (legacyCompletion && legacyCompletion.unitRunId !== unitRunId) throw new Error('completion belongs to another unit run');
  // Records written before the owner stored its pattern do not say which pattern ran (a caller's
  // --pattern was never kept), so the pattern stays unknown rather than defaulting to solo.
  const pattern = record.pattern ?? record.unit?.pattern ?? null;
  const { patternName, params } = pattern === null ? { patternName: null, params: {} } : resolvePattern(pattern);
  const cfg = record.configSnapshot?.runner ?? {};
  const recordSeats = seatsOfRecord(record);
  const seatInfo = new Map(recordSeats.map((entry) => [entry.seat, entry]));
  const kindOf = (seatId) => {
    const known = seatInfo.get(seatId);
    if (known) return seatKind(known);
    if (patternName === null) return 'unknown';
    if (seatId === VERIFY_SEAT || seatId === 'verifier') return 'verifier';
    return patternName === 'reviewed' ? 'checker' : 'unknown';
  };
  const options = record.unit?.stanceOptions ?? [];
  const rawSeats = readUnitRunSeats(unitDir);
  const settlementTimes = [];
  let inline = false;
  // Provider family each final seat was bound to, when its binding asked for a soft spread.
  const familyBySeat = new Map();
  const seats = rawSeats.filter((seat) => seat.final).map((seat) => {
    const project = (attempt) => {
      const result = attempt.runResult ?? {};
      const recordedBinding = record.bindings?.[`${seat.seat}/${seat.round}`]?.find((entry) => entry.assignmentId === attempt.assignmentId);
      const binding = recordedBinding?.binding ?? attempt.assignment?.binding ?? result.binding ?? {};
      if (attempt === seat.final && binding.provenance?.familySpread?.value?.family) {
        familyBySeat.set(`${seat.seat}/${seat.round}`, binding.provenance.familySpread.value.family);
      }
      const executor = result.executorId ?? binding.executor ?? null;
      const isInline = !result.runId && result.unitRunId === unitRunId;
      inline ||= isInline;
      const settledAt = timestamp(result.settledAt) ?? timestamp(result.timestamp) ?? (isInline ? timestamp(result.recordedAt) : null);
      if (settledAt) settlementTimes.push(settledAt);
      return {
        assignmentId: result.assignmentId ?? attempt.assignmentId,
        runId: result.runId ?? null,
        executor,
        provider: result.policy?.providerModel ?? record.configSnapshot?.runner?.executors?.[executor]?.providerModel ?? null,
        persona: result.policy?.persona ?? binding.persona ?? null,
        model: result.policy?.model ?? binding.model ?? null,
        outcome: attempt.outcome,
        fallbackFrom: recordedBinding?.fallbackFrom ?? binding.provenance?.fallbackFrom ?? null,
      };
    };
    return {
      seat: seat.seat,
      role: seatInfo.get(seat.seat)?.role ?? seat.seat,
      kind: kindOf(seat.seat),
      round: seat.round,
      final: { ...project(seat.final), stance: extractStance(seat.final.runResult?.agentClaim ?? seat.final.runResult?.result, options) },
      attempts: seat.attempts.map(project),
    };
  }).sort((a, b) => a.seat.localeCompare(b.seat) || a.round - b.round);
  // Seats that ended up on one provider family. Absent when every spread seat has its own, so a
  // summary never claims independence it lacks and older summaries keep their bytes.
  const seatsByFamily = new Map();
  for (const [seat, family] of familyBySeat) seatsByFamily.set(family, [...(seatsByFamily.get(family) ?? []), seat]);
  const sharedFamilies = [...seatsByFamily].filter(([, roles]) => roles.length > 1)
    .map(([family, roles]) => ({ family, seats: roles.sort() })).sort((a, b) => a.family.localeCompare(b.family));
  settlementTimes.sort((a, b) => Date.parse(a) - Date.parse(b));
  const active = unitHasActiveRun(unitDir, record);
  const validCompletion = (completion) => VALID_OUTCOMES.includes(completion?.outcome) && timestamp(completion?.settledAt);
  const settlement = validCompletion(record.settlement) ? record.settlement : null;
  const legacy = validCompletion(legacyCompletion) ? legacyCompletion : null;
  const derivedOutcome = patternName === null ? UNDETERMINED_OUTCOME
    : patternHistoryOutcome({
      patternName, params, unit: record.unit, cfg, seats: recordSeats,
      history: rawSeats.filter((seat) => seat.final).map((seat) => ({
        seat: seat.seat, round: seat.round, outcome: seat.final.outcome,
      })),
    });
  const outcome = active ? 'unknown' : settlement?.outcome ?? legacy?.outcome ?? derivedOutcome ?? 'unknown';
  return {
    contract: UNIT_SUMMARY_CONTRACT,
    unitRunId,
    workflow: workflowLink(record.workflow) ?? workflowLink(legacyCompletion?.workflow),
    pattern: pattern === null || typeof pattern === 'string' ? pattern : pattern.pattern ?? pattern.patternName ?? null,
    capability: record.unit?.capability ?? null,
    outcome,
    startedAt: timestamp(record.createdAt),
    settledAt: outcome === 'unknown' ? null
      : timestamp(settlement?.settledAt) ?? timestamp(legacy?.settledAt) ?? settlementTimes.at(-1) ?? null,
    stanceOptions: [...options],
    seats,
    inline,
    ...(sharedFamilies.length > 0 ? { sharedFamilies } : {}),
    ...(legacy?.evidence && !settlement ? { derivation: legacy.evidence } : {}),
  };
}

export function serializeUnitSummary(summary) {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

/** The stored summary bytes, or null when there is none. */
export function readStoredUnitSummary(unitDir) {
  try { return fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

/**
 * Why no summary can be published now: 'active' while any attempt or inline step is still open,
 * 'unsettled' when the unit is finished but has no establishable outcome or settlement time.
 */
export function unitSummarySkipReason(unitDir, summary) {
  if (summary.outcome !== 'unknown' && summary.settledAt) return null;
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  return unitHasActiveRun(unitDir, record) ? 'active' : 'unsettled';
}

/** Atomic and byte-idempotent; dry-run performs no writes. */
export function writeUnitSummary(unitDir, options = {}) {
  const summary = buildUnitSummary(unitDir, options);
  const skipped = unitSummarySkipReason(unitDir, summary);
  if (skipped) return { summary, changed: false, skipped };
  const file = path.join(unitDir, 'unit-summary.json');
  const content = serializeUnitSummary(summary);
  const changed = content !== readStoredUnitSummary(unitDir);
  if (changed && !options.dryRun) {
    const tmp = `${file}.${uniqueTmpTag()}.tmp`;
    try { fs.writeFileSync(tmp, content); fs.renameSync(tmp, file); }
    finally { fs.rmSync(tmp, { force: true }); }
  }
  return { summary, changed };
}
