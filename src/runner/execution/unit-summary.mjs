// Derived discussion read model. Execution owns selection; Observe only consumes it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readUnitRunSeats } from './unit-run-history.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { reviewedHistoryOutcome } from './patterns/reviewed.mjs';
import { resolvePanelRoles, VALID_OUTCOMES } from './patterns/panel.mjs';

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

/** A published attempt without its terminal result remains unsettled, even after a crash. */
function unitHasActiveRun(unitDir, record) {
  if (fs.existsSync(path.join(unitDir, 'pending-inline.json'))) return true;
  if (record.execution?.status) return record.execution.status !== 'settled';
  for (const role of fs.readdirSync(unitDir, { withFileTypes: true })) {
    if (!role.isDirectory()) continue;
    const roleDir = path.join(unitDir, role.name);
    for (const round of fs.readdirSync(roleDir, { withFileTypes: true })) {
      if (!round.isDirectory() || !/^\d+(?:-fb\d+)?$/.test(round.name)) continue;
      const runsDir = path.join(roleDir, round.name, 'runs');
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

function patternHistoryOutcome(patternName, params, cfg, unit, history, panelRoles) {
  if (patternName === 'reviewed') return reviewedHistoryOutcome(unit, cfg, history, params);
  if (patternName === 'solo') return history.find((seat) => seat.role === (params.role || 'producer'))?.outcome ?? null;
  if (patternName !== 'panel') return null;
  const members = panelRoles.panelists.map(({ role }) => history.find((seat) => seat.role === role));
  if (members.some((seat) => !seat)) return null;
  const error = members.find((seat) => ['execution-failure', 'policy-refusal', 'provider-limit', 'blocked'].includes(seat.outcome));
  if (error) return error.outcome;
  return history.find((seat) => seat.role === panelRoles.synthesizer.role)?.outcome ?? null;
}

/** Build without changing original records. legacyCompletion must name this exact unit run. */
export function buildUnitSummary(unitDir, { legacyCompletion = null } = {}) {
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const unitRunId = path.basename(unitDir);
  if (legacyCompletion && legacyCompletion.unitRunId !== unitRunId) throw new Error('completion belongs to another unit run');
  const pattern = record.pattern ?? record.unit?.pattern ?? 'solo';
  const { patternName, params } = resolvePattern(pattern);
  const cfg = record.configSnapshot?.runner ?? {};
  const panelRoles = patternName === 'panel' ? resolvePanelRoles(cfg, {}, params) : null;
  const kinds = new Map(panelRoles
    ? [...panelRoles.panelists, panelRoles.synthesizer].map(({ role, kind }) => [role, kind]) : []);
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
      kind: panelRoles ? kinds.get(seat.role) ?? 'unknown'
        : patternName === 'solo' || seat.role === 'producer' ? 'producer'
          : seat.role === 'verify' || seat.role === 'verifier' ? 'verifier'
            : patternName === 'reviewed' ? 'checker' : 'unknown',
      round: seat.round,
      final: { ...project(seat.final), stance: extractStance(seat.final.runResult?.agentClaim ?? seat.final.runResult?.result, options) },
      attempts: seat.attempts.map(project),
    };
  }).sort((a, b) => a.role.localeCompare(b.role) || a.round - b.round);
  settlementTimes.sort((a, b) => Date.parse(a) - Date.parse(b));
  const active = unitHasActiveRun(unitDir, record);
  const validCompletion = (completion) => VALID_OUTCOMES.includes(completion?.outcome) && timestamp(completion?.settledAt);
  const settlement = validCompletion(record.settlement) ? record.settlement : null;
  const legacy = validCompletion(legacyCompletion) ? legacyCompletion : null;
  const derivedOutcome = patternHistoryOutcome(patternName, params, cfg, record.unit,
    rawSeats.filter((seat) => seat.final).map((seat) => ({
      role: seat.role, round: seat.round, outcome: seat.final.outcome,
    })), panelRoles);
  const outcome = active ? 'unknown' : settlement?.outcome ?? legacy?.outcome ?? derivedOutcome ?? 'unknown';
  return {
    contract: UNIT_SUMMARY_CONTRACT,
    unitRunId,
    workflow: workflowLink(record.workflow) ?? workflowLink(legacyCompletion?.workflow),
    pattern: typeof pattern === 'string' ? pattern : pattern.pattern,
    capability: record.unit?.capability ?? null,
    outcome,
    startedAt: timestamp(record.createdAt),
    settledAt: outcome === 'unknown' ? null
      : timestamp(settlement?.settledAt) ?? timestamp(legacy?.settledAt) ?? settlementTimes.at(-1) ?? null,
    stanceOptions: [...options],
    seats,
    inline,
    ...(legacy?.evidence && !settlement ? { derivation: legacy.evidence } : {}),
  };
}

/** Atomic and byte-idempotent; dry-run performs no writes. */
export function writeUnitSummary(unitDir, options = {}) {
  const summary = buildUnitSummary(unitDir, options);
  if (summary.outcome === 'unknown' || !summary.settledAt) {
    const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
    return { summary, changed: false, skipped: unitHasActiveRun(unitDir, record) ? 'active' : 'unsettled' };
  }
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
