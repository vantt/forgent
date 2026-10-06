// Derived discussion read model. Execution owns selection; Observe only consumes it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readUnitRunSeats } from './unit-run-history.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { reviewedHistoryOutcome } from './patterns/reviewed.mjs';

export const UNIT_SUMMARY_CONTRACT = Object.freeze({ id: 'unit-summary', version: 1 });

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
  return value && ['runId', 'stepId', 'unitId'].every((key) => typeof value[key] === 'string' && value[key].trim())
    ? { runId: value.runId, stepId: value.stepId, unitId: value.unitId } : null;
}

/** Build without changing original records. legacyCompletion must name this exact unit run. */
export function buildUnitSummary(unitDir, { legacyCompletion = null } = {}) {
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const unitRunId = path.basename(unitDir);
  if (legacyCompletion && legacyCompletion.unitRunId !== unitRunId) throw new Error('completion belongs to another unit run');
  const options = record.unit?.stanceOptions ?? [];
  const rawSeats = readUnitRunSeats(unitDir);
  const settlementTimes = [];
  let inline = false;
  const seats = rawSeats.filter((seat) => seat.final).map((seat) => {
    const project = (attempt) => {
      const result = attempt.runResult ?? {};
      const recordedBinding = record.bindings?.[`${seat.role}/${seat.round}`]?.find((entry) => entry.assignmentId === attempt.assignmentId);
      const binding = recordedBinding?.binding ?? attempt.assignment?.binding ?? result.binding ?? {};
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
      role: seat.role,
      round: seat.round,
      final: { ...project(seat.final), stance: extractStance(seat.final.runResult?.agentClaim ?? seat.final.runResult?.result, options) },
      attempts: seat.attempts.map(project),
    };
  }).sort((a, b) => a.role.localeCompare(b.role) || a.round - b.round);
  settlementTimes.sort((a, b) => Date.parse(a) - Date.parse(b));
  const settlement = record.settlement;
  const pattern = record.pattern ?? record.unit?.pattern ?? 'solo';
  const { patternName, params } = resolvePattern(pattern);
  const derivedOutcome = patternName === 'reviewed'
    ? reviewedHistoryOutcome(record.unit, record.configSnapshot?.runner ?? {},
      rawSeats.filter((seat) => seat.final).map((seat) => ({
        role: seat.role, round: seat.round, outcome: seat.final.outcome,
      })), params) ?? 'unknown'
    : seats.find((seat) => seat.final.outcome !== 'pass')?.final.outcome
      ?? (seats.length > 0 ? 'pass' : 'unknown');
  const outcome = settlement?.outcome ?? legacyCompletion?.outcome ?? derivedOutcome;
  return {
    contract: UNIT_SUMMARY_CONTRACT,
    unitRunId,
    workflow: workflowLink(record.workflow) ?? workflowLink(legacyCompletion?.workflow),
    pattern: typeof pattern === 'string' ? pattern : pattern.pattern,
    capability: record.unit?.capability ?? null,
    outcome,
    startedAt: timestamp(record.createdAt),
    settledAt: timestamp(settlement?.settledAt) ?? timestamp(legacyCompletion?.settledAt) ?? settlementTimes.at(-1) ?? null,
    stanceOptions: [...options],
    seats,
    inline,
    ...(legacyCompletion?.evidence && !record.settlement ? { derivation: legacyCompletion.evidence } : {}),
  };
}

/** Atomic and byte-idempotent; dry-run performs no writes. */
export function writeUnitSummary(unitDir, options = {}) {
  const summary = buildUnitSummary(unitDir, options);
  const file = path.join(unitDir, 'unit-summary.json');
  const content = `${JSON.stringify(summary, null, 2)}\n`;
  let existing = null;
  try { existing = fs.readFileSync(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const changed = content !== existing;
  if (changed && !options.dryRun) {
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    try { fs.writeFileSync(tmp, content); fs.renameSync(tmp, file); }
    finally { fs.rmSync(tmp, { force: true }); }
  }
  return { summary, changed };
}
