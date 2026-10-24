// src/runner/execution/seat-resolver.mjs — the one place that says which seats a unit's pattern fills.
// Architecture guard: pure. No I/O, no clock, no state.
//
// Execution, the read-only binding simulation, doctor and admission's launch counting all ask here, so
// they list the same seats in the same order. A seat is { seat, role, posture }:
//
//   seat     the id of the seat inside one unit run: a directory name, a ref segment, the key of the
//            ledger and of every record of that seat. Unique in the unit; its charset is Convention's
//            (src/convention/seat-id.mjs).
//   role     one of SEAT_ROLES. It says what the seat does for the pattern and keys taste lookups.
//   posture  how the seat may run. Launch and write behaviour reads posture and never the role or the
//            id: readOnly, writer, forceOutOfProcess, stance (a panel member's passive stance
//            measurement), verdict (the result is a checker's verdict).
//
// This module is also the one authority for effective rigor and checker composition.

import { assertSeatId } from '../../convention/seat-id.mjs';
import { RIGOR_VALUES, resolveStrongerRigor } from '../rigor.mjs';
import { resolvePattern } from './patterns/presets.mjs';

export const SEAT_ROLES = Object.freeze(['producer', 'synthesizer', 'reviewer', 'red-team', 'judge']);

/**
 * The checker seats a reviewed unit can name, with the role each takes. `tester` is a seat of its own:
 * its role is `reviewer` for taste lookup only, and its result is not a verdict (no assessment is
 * required of it, and it backs no verdict receipt).
 */
export const CHECKER_SEATS = Object.freeze({
  reviewer: Object.freeze({ role: 'reviewer', verdict: true }),
  'red-team': Object.freeze({ role: 'red-team', verdict: true }),
  tester: Object.freeze({ role: 'reviewer', verdict: false }),
});

/** The pseudo-seats the runner itself writes results for; never declared, never bound. */
export const VERIFY_SEAT = 'verify';
export const SYNC_SEAT = 'sync';

export const DEFAULT_CHECKERS_BY_RIGOR = Object.freeze({
  low: Object.freeze(['reviewer']),
  standard: Object.freeze(['reviewer']),
  high: Object.freeze(['reviewer', 'red-team']),
  critical: Object.freeze(['reviewer', 'red-team']),
});

const DECLARED_KEYS = new Set(['seat', 'role', 'persona', 'tier']);

/** Thrown when a unit's pattern cannot be given a valid seat list. */
export class SeatResolutionError extends Error {
  constructor(message, code = 'invalid-seats') {
    super(message);
    this.name = 'SeatResolutionError';
    this.code = code;
  }
}

const posture = (fields) => Object.freeze({
  readOnly: false, writer: false, forceOutOfProcess: false, stance: false, verdict: false, ...fields,
});

/** What an ask that names no seat means: the unit's own producer seat. */
export const PRODUCER_POSTURE = posture({ writer: true });

const noWrites = (unit) => (unit?.writes ?? []).length === 0;

// ---- rigor and checker composition --------------------------------------------------------------

/**
 * The config entries that apply to a capability, most specific first: its exact key, then its
 * `<prefix>:*` entry (the text before the first colon). A capability with no colon has no prefix
 * entry, and nothing else is inherited: the bare verb of `code:review` is not a lookup key.
 */
export function capabilityEntriesOf(runnerConfig, capability) {
  if (typeof capability !== 'string' || !capability) return [];
  const capabilities = runnerConfig?.capabilities ?? runnerConfig?.runner?.capabilities ?? {};
  const keys = capability.includes(':') ? [capability, `${capability.split(':')[0]}:*`] : [capability];
  return keys
    .filter((key) => capabilities[key] && typeof capabilities[key] === 'object')
    .map((key) => ({ key, entry: capabilities[key] }));
}

/** Whether a capability entry names at least one executor in `prefer` (a string or a non-empty list). */
export function hasUsablePrefer(entry) {
  const prefer = entry?.prefer;
  return typeof prefer === 'string' ? prefer.trim() !== '' : Array.isArray(prefer) && prefer.length > 0;
}

/** The rigor a capability declares: its exact entry, else the `<prefix>:*` entry's. */
export function capabilityRigorOf(runnerConfig, capability) {
  const rigor = capabilityEntriesOf(runnerConfig, capability).map(({ entry }) => entry.rigor).find((r) => r !== undefined);
  if (rigor !== undefined && !RIGOR_VALUES.includes(rigor)) {
    throw new RangeError(`invalid capability rigor "${rigor}" for "${capability}". Valid rigors: [${RIGOR_VALUES.join(', ')}]`);
  }
  return rigor;
}

/**
 * The rigor a unit runs at: the stronger of its own and its capability's. `undefined` when neither
 * says one, unless `fallback` names the rigor to read in that case.
 */
export function effectiveRigorOf(unit, runnerConfig, { fallback } = {}) {
  return resolveStrongerRigor(unit?.rigor, capabilityRigorOf(runnerConfig, unit?.capability)) ?? fallback;
}

/**
 * The checker seats of a reviewed unit: those `checkersByRigor` names for its effective rigor, the
 * capability's `minCheckers` and the pattern's own, plus red-team for code capabilities. Every entry is
 * a checker seat name (see CHECKER_SEATS).
 */
export function checkerSeatsOf(unit, runnerConfig, params = {}) {
  const rigor = effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' });
  const checkersByRigor = runnerConfig?.patterns?.reviewed?.checkersByRigor || DEFAULT_CHECKERS_BY_RIGOR;
  const fromRigor = checkersByRigor[rigor] || DEFAULT_CHECKERS_BY_RIGOR[rigor] || ['reviewer'];
  const minFromCap = runnerConfig?.capabilities?.[unit?.capability]?.minCheckers || [];
  const minFromParams = Array.isArray(params?.minCheckers) ? params.minCheckers : (params?.minCheckers ? [params.minCheckers] : []);
  const names = new Set([...fromRigor, ...minFromCap, ...minFromParams]);
  if (unit?.capability?.startsWith('code:') || unit?.capability === 'code') names.add('red-team');
  for (const name of names) {
    if (!Object.hasOwn(CHECKER_SEATS, name)) throw new SeatResolutionError(`"${name}" is not a checker seat; valid: [${Object.keys(CHECKER_SEATS).join(', ')}]`, 'unknown-checker-seat');
  }
  return [...names];
}

/**
 * At high or critical effective rigor every seat of the unit runs on its own provider family; at
 * standard or low only checkers differ from the producer.
 */
export function requiresDistinctFamilies(unit, runnerConfig) {
  const rigor = effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' });
  return rigor === 'high' || rigor === 'critical';
}

// ---- declared seats ----------------------------------------------------------------------------

/**
 * Validate declared seats `[{ seat, role, persona?, tier? }]` and return them as plain entries in the
 * declared order. Ids follow Convention's seat id rule and are unique; roles come from SEAT_ROLES. A
 * caller that owns the tier ladder passes it as `tiers` to have each seat's `tier` checked against it.
 */
export function checkDeclaredSeats(raw, label = 'seats', { tiers } = {}) {
  if (!Array.isArray(raw) || raw.length === 0) throw new SeatResolutionError(`${label} must be a non-empty array of { seat, role }`);
  const seen = new Set();
  return raw.map((entry, index) => {
    const at = `${label}[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new SeatResolutionError(`${at} must be an object { seat, role, persona?, tier? }`);
    for (const key of Object.keys(entry)) {
      if (!DECLARED_KEYS.has(key)) throw new SeatResolutionError(`${at} has unknown key "${key}"; a seat declares only seat, role, persona and tier`);
    }
    try { assertSeatId(entry.seat, `${at}.seat`); } catch (error) { throw new SeatResolutionError(error.message, 'invalid-seat-id'); }
    if (seen.has(entry.seat)) throw new SeatResolutionError(`${at}.seat "${entry.seat}" is declared twice in this unit`, 'duplicate-seat');
    seen.add(entry.seat);
    if (!SEAT_ROLES.includes(entry.role)) throw new SeatResolutionError(`${at}.role must be one of [${SEAT_ROLES.join(', ')}], got ${JSON.stringify(entry.role)}`, 'invalid-seat-role');
    if (entry.persona !== undefined && (typeof entry.persona !== 'string' || !entry.persona.trim())) throw new SeatResolutionError(`${at}.persona must be a non-empty string`);
    if (entry.tier !== undefined && tiers && !tiers.includes(entry.tier)) throw new SeatResolutionError(`${at}.tier must be one of [${tiers.join(', ')}], got ${JSON.stringify(entry.tier)}`, 'invalid-seat-tier');
    return Object.freeze({ seat: entry.seat, role: entry.role, ...(entry.persona ? { persona: entry.persona.trim() } : {}), ...(entry.tier ? { tier: entry.tier } : {}) });
  });
}

/** The seats a unit or its pattern params declare; the unit's own win. Null when none are declared. */
function declaredSeatsOf(unit, params) {
  const raw = unit?.seats ?? params?.seats;
  return raw === undefined ? null : checkDeclaredSeats(raw, unit?.seats !== undefined ? 'unit.seats' : 'pattern params seats');
}

const withDeclared = (declared, base) => Object.freeze({ ...base, ...(declared.persona ? { persona: declared.persona } : {}), ...(declared.tier ? { tier: declared.tier } : {}) });

function requireRoles(patternName, declared, expected) {
  const counts = new Map();
  for (const { role } of declared) counts.set(role, (counts.get(role) ?? 0) + 1);
  for (const [role, n] of Object.entries(expected)) {
    const have = counts.get(role) ?? 0;
    const ok = n === '+' ? have >= 1 : have === n;
    if (!ok) throw new SeatResolutionError(`a ${patternName} unit needs ${n === '+' ? 'at least one' : n} seat(s) with role "${role}", has ${have}`, 'seat-multiplicity');
  }
  for (const role of counts.keys()) {
    if (!(role in expected)) throw new SeatResolutionError(`a ${patternName} unit has no use for a seat with role "${role}"`, 'seat-multiplicity');
  }
}

// ---- the resolver ------------------------------------------------------------------------------

/**
 * The ordered seats a unit's pattern fills.
 *
 * - solo: one producer seat, `producer`, unless one seat is declared.
 * - reviewed: `producer`, then one checker seat per checker name (seat id = the name unless the unit declares
 *   its seats; declared checker roles must match the required checkers exactly).
 * - panel: the declared seats; producers are the members, one synthesizer.
 * - debate: the declared seats; two producer sides, then one judge.
 *
 * @param {string|object} pattern pattern name or preset, as `unit.pattern`
 * @returns {Array<{ seat: string, role: string, posture: object, persona?: string, tier?: string }>}
 */
export function resolveSeats({ pattern, unit, runnerConfig }) {
  const { patternName, params } = resolvePattern(pattern);
  const declared = declaredSeatsOf(unit, params);
  const readOnly = noWrites(unit);
  switch (patternName) {
    case 'solo': {
      if (declared) {
        if (declared.length !== 1 || declared[0].role !== 'producer') throw new SeatResolutionError('a solo unit declares exactly one seat, with role "producer"', 'seat-multiplicity');
        return [withDeclared(declared[0], { seat: declared[0].seat, role: 'producer', posture: posture({ readOnly, writer: true }) })];
      }
      return [Object.freeze({ seat: 'producer', role: 'producer', posture: posture({ readOnly, writer: true }) })];
    }
    case 'reviewed': {
      const required = checkerSeatsOf(unit, runnerConfig, params);
      const checkerPosture = (name) => posture({ readOnly: true, forceOutOfProcess: true, verdict: CHECKER_SEATS[name].verdict });
      const producerPosture = posture({ readOnly, writer: true });
      if (!declared) {
        return [
          Object.freeze({ seat: 'producer', role: 'producer', posture: producerPosture }),
          ...required.map((name) => Object.freeze({ seat: name, role: CHECKER_SEATS[name].role, posture: checkerPosture(name) })),
        ];
      }
      // Declared seats name the producer and one seat per checker the unit needs; the roles must match
      // what checkersByRigor[effective rigor] plus minCheckers require, no role missing and none extra.
      const producers = declared.filter((d) => d.role === 'producer');
      if (producers.length !== 1) throw new SeatResolutionError(`a reviewed unit declares exactly one seat with role "producer", has ${producers.length}`, 'seat-multiplicity');
      const wanted = required.map((name) => CHECKER_SEATS[name].role);
      const have = declared.filter((d) => d.role !== 'producer').map((d) => d.role);
      const missing = wanted.filter((role) => { const i = have.indexOf(role); if (i < 0) return true; have.splice(i, 1); return false; });
      if (missing.length > 0 || have.length > 0) {
        throw new SeatResolutionError(`a reviewed unit's checker seats must be exactly [${wanted.join(', ')}] (checkersByRigor for its effective rigor plus minCheckers)${missing.length ? `; missing [${missing.join(', ')}]` : ''}${have.length ? `; extra [${have.join(', ')}]` : ''}`, 'seat-multiplicity');
      }
      // Each declared checker seat takes the first still-unassigned required checker of its role, which
      // fixes its posture (`tester` is a reviewer-role seat whose result is not a verdict).
      const unassigned = [...required];
      return declared.map((d) => {
        if (d.role === 'producer') return withDeclared(d, { seat: d.seat, role: d.role, posture: producerPosture });
        const at = unassigned.findIndex((name) => CHECKER_SEATS[name].role === d.role);
        const [name] = unassigned.splice(at, 1);
        return withDeclared(d, { seat: d.seat, role: d.role, posture: checkerPosture(name) });
      });
    }
    case 'panel': {
      if (!declared) throw new SeatResolutionError('a panel unit must declare its seats: producers as members and one synthesizer', 'seats-required');
      requireRoles('panel', declared, { producer: '+', synthesizer: 1 });
      const members = declared.filter((d) => d.role === 'producer').map((d) => withDeclared(d, { seat: d.seat, role: d.role, posture: posture({ readOnly: true, forceOutOfProcess: true, stance: true }) }));
      const synth = declared.filter((d) => d.role === 'synthesizer').map((d) => withDeclared(d, { seat: d.seat, role: d.role, posture: posture({ readOnly, forceOutOfProcess: true }) }));
      return [...members, ...synth];
    }
    case 'debate': {
      if (!declared) throw new SeatResolutionError('a debate unit must declare its seats: two producer sides and one judge', 'seats-required');
      requireRoles('debate', declared, { producer: 2, judge: 1 });
      const seatOf = (d) => withDeclared(d, { seat: d.seat, role: d.role, posture: posture({ readOnly: true, forceOutOfProcess: true }) });
      return [...declared.filter((d) => d.role === 'producer').map(seatOf), ...declared.filter((d) => d.role === 'judge').map(seatOf)];
    }
    default:
      throw new SeatResolutionError(`Unknown collaboration pattern: "${patternName}"`, 'unknown-pattern');
  }
}

/**
 * Seat launches a unit plans before any fallback: seats per round times the rounds the pattern may run.
 * @returns {number|null} null for a pattern this core does not know
 */
export function seatLaunchesOf({ pattern, unit, runnerConfig }) {
  const { patternName, params } = resolvePattern(pattern);
  if (!['solo', 'reviewed', 'panel', 'debate'].includes(patternName)) return null;
  const seats = resolveSeats({ pattern, unit, runnerConfig });
  switch (patternName) {
    case 'reviewed': return seats.length * (params?.maxRounds ?? runnerConfig?.patterns?.reviewed?.maxRounds ?? 2);
    case 'debate': return 2 * (params?.rebuttal === false ? 1 : 2) + 1;
    default: return seats.length;
  }
}

/** The semantic kind a summary reports for a seat; only `panelist` votes. */
export function seatKind(seat) {
  if (seat.posture?.stance) return 'panelist';
  if (seat.role === 'synthesizer') return 'synthesizer';
  if (seat.role === 'judge') return 'judge';
  if (seat.role === 'producer') return 'producer';
  return 'checker';
}

/** A persisted seat of a unit record, by id; null when the record lists none. */
export function seatOfRecord(unitRecord, seatId) {
  return unitRecord?.seats?.find((s) => s.seat === seatId) ?? null;
}

/**
 * The tier a workflow recommends on a seat, with where it was declared (`workflow:<id>/<unit>/<seat>`,
 * or `workflow:<unit>/<seat>` when the run does not know its workflow). Undefined when the seat
 * declares none.
 */
export function workflowTierOf(seat, unit, workflowId) {
  if (!seat?.tier) return undefined;
  return { tier: seat.tier, source: `workflow:${workflowId ? `${workflowId}/` : ''}${unit?.id ?? 'unit'}/${seat.seat}` };
}

/**
 * The seat part of a bind ask for a seat already recorded in `unitRecord`: its id, role and posture,
 * the tier its workflow recommended, so a replay asks what the run asked. A seat the record does not list is the unit's own producer seat.
 */
export function bindSeatOf(unitRecord, seatId) {
  const seat = seatOfRecord(unitRecord, seatId);
  if (!seat) return { seat: seatId, role: 'producer', posture: PRODUCER_POSTURE };
  const workflowTier = workflowTierOf(seat, unitRecord.unit, unitRecord.workflowId);
  return {
    seat: seat.seat,
    role: seat.role,
    posture: seat.posture,
    ...(seat.persona ? { persona: seat.persona } : {}),
    ...(workflowTier ? { workflowTier } : {}),
  };
}

/**
 * A seat's `tier` is a recommendation only a registered workflow may make. A unit that comes from a file
 * or from stdin (`fgos run --unit`, `fgos workflow start --units`) never carries one: refused by name.
 */
export function assertNoSeatTier(rawSeats, source) {
  if (Array.isArray(rawSeats) && rawSeats.some((entry) => entry && typeof entry === 'object' && entry.tier !== undefined)) {
    throw new SeatResolutionError(`${source} cannot carry seats[].tier: a seat's tier is a recommendation only a registered workflow definition may make`, 'seat-tier-not-allowed');
  }
}
