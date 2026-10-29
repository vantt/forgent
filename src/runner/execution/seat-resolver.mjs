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
import { RIGOR_VALUES, RIGOR_RANK, resolveStrongerRigor } from '../rigor.mjs';

export const SEAT_ROLES = Object.freeze(['producer', 'synthesizer', 'reviewer', 'red-team', 'judge']);
export const LOOP_NAMES = Object.freeze(['solo', 'reviewed', 'panel', 'debate']);

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

export const RESERVED_SEAT_IDS = Object.freeze([VERIFY_SEAT, `${VERIFY_SEAT.slice(0, -1)}ier`]);

export const DEFAULT_CAPABILITY_MIN_CHECKERS = Object.freeze({
  code: Object.freeze(['red-team']),
  'code:*': Object.freeze(['red-team']),
});

const DEFAULT_CAPABILITY_CONFIG = Object.freeze({
  capabilities: Object.freeze(
    Object.fromEntries(
      Object.entries(DEFAULT_CAPABILITY_MIN_CHECKERS).map(([k, v]) => [k, Object.freeze({ minCheckers: v })]),
    ),
  ),
});
const DECLARED_KEYS = new Set(['seat', 'role', 'persona', 'tier']);

/** Thrown when a unit's pattern cannot be given a valid seat list. */
export class SeatResolutionError extends Error {
  constructor(message, code = 'invalid-seats', options = {}) {
    if (typeof code === 'object' && code !== null) {
      options = code;
      code = options.code ?? 'invalid-seats';
    }
    super(message);
    this.name = 'SeatResolutionError';
    this.code = code;
    if (options.at !== undefined) this.at = options.at;
    if (options.detail !== undefined) this.detail = options.detail;
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
 * The checker plan of a reviewed unit: a list of `{ seat, contributions }` where contributions is
 * an array of provenance strings: `rigor:<level>`, `capability:<key>`, `code:default-red-team`,
 * `pattern-invariant:<name>`, `request`, and `param:<slot>`.
 *
 * Replaces `checkerSeatsOf`.
 *
 * @param {object} unit
 * @param {object} runnerConfig
 * @param {object} [options]
 * @param {Array<string|object>|string|object} [options.requested]
 * @param {object} [options.floors]
 * @param {string} [options.slot]
 * @returns {Array<{ seat: string, contributions: Array<string> }>}
 */
export function checkerPlanOf(unit, runnerConfig, options = {}) {
  if (Array.isArray(options)) options = { requested: options };
  else if (typeof options === 'string') options = { requested: [options] };

  const planMap = new Map();
  function addContribution(seat, contribution) {
    if (!planMap.has(seat)) planMap.set(seat, new Set());
    if (contribution) planMap.get(seat).add(contribution);
  }

  // 1. Rigor floor: checkersByRigor read from runnerConfig.loops.reviewed (fallback options.shippedCheckersByRigor)
  const rigor = effectiveRigorOf(unit, runnerConfig, { fallback: 'standard' });
  const configuredCheckers = runnerConfig?.loops?.reviewed?.checkersByRigor ?? runnerConfig?.runner?.loops?.reviewed?.checkersByRigor;
  const shippedCheckers = options.shippedCheckersByRigor;
  const configuredRow = configuredCheckers && Object.hasOwn(configuredCheckers, rigor)
    ? configuredCheckers[rigor]
    : undefined;
  const shippedRow = shippedCheckers && Object.hasOwn(shippedCheckers, rigor)
    ? shippedCheckers[rigor]
    : undefined;
  // A rigor ranked below standard with no row of its own falls back to the standard row of the same tables.
  const fallbackStandard = (RIGOR_RANK[rigor] ?? Infinity) < RIGOR_RANK.standard;
  const rowOf = (table, name) => (table && Object.hasOwn(table, name) ? table[name] : undefined);
  const fromRigor = configuredRow
    ?? shippedRow
    ?? (fallbackStandard ? (rowOf(configuredCheckers, 'standard') ?? rowOf(shippedCheckers, 'standard')) : undefined);
  if (!fromRigor) {
    const errorDetail = fallbackStandard
      ? `(neither runnerConfig nor shippedCheckersByRigor defines it or a standard row)`
      : `(neither runnerConfig nor shippedCheckersByRigor defines it)`;
    throw new SeatResolutionError(
      `missing checkersByRigor for rigor "${rigor}" ${errorDetail}`,
      'configuration-error',
    );
  }
  for (const seat of fromRigor) {
    addContribution(seat, `rigor:${rigor}`);
  }

  // 2. Capability minCheckers: read exact key then <prefix>:* through capabilityEntriesOf.
  // First defined wins, [] clears the default. When no config defines it, DEFAULT_CAPABILITY_MIN_CHECKERS applies.
  const entries = capabilityEntriesOf(runnerConfig, unit?.capability);
  const capEntry = entries.find((e) => e.entry?.minCheckers !== undefined);
  if (capEntry) {
    const min = capEntry.entry.minCheckers;
    const list = Array.isArray(min) ? min : (min ? [min] : []);
    for (const seat of list) {
      addContribution(seat, `capability:${capEntry.key}`);
    }
  } else {
    const defaultEntry = capabilityEntriesOf(DEFAULT_CAPABILITY_CONFIG, unit?.capability)
      .find((e) => e.entry?.minCheckers !== undefined);
    if (defaultEntry) {
      const list = defaultEntry.entry.minCheckers;
      for (const seat of list) {
        addContribution(seat, 'code:default-red-team');
      }
    }
  }

  // 3. Floors: { minCheckers: [{ name, source }] }
  const floors = options.floors;
  if (floors?.minCheckers) {
    const floorList = Array.isArray(floors.minCheckers) ? floors.minCheckers : [floors.minCheckers];
    for (const item of floorList) {
      const seat = typeof item === 'string' ? item : (item.name || item.seat);
      const source = item.source || 'pattern-invariant';
      const contrib = source.startsWith('pattern-invariant:') ? source : `pattern-invariant:${source}`;
      addContribution(seat, contrib);
    }
  }

  // 4. Requested / params
  let req = options.requested ?? options.minCheckers ?? options.params?.minCheckers;
  const resolvedSlot = options.slot ?? options.minCheckersSlot ?? options.provenance?.params?.minCheckers;
  if (req) {
    const reqList = Array.isArray(req) ? req : [req];
    for (const item of reqList) {
      if (typeof item === 'string') {
        const slot = resolvedSlot;
        const contrib = (!slot || slot === 'request') ? 'request' : (slot.startsWith('param:') ? slot : `param:${slot}`);
        addContribution(item, contrib);
      } else if (item && typeof item === 'object') {
        const seat = item.name || item.seat;
        let contrib = item.source;
        if (!contrib) {
          const slot = item.slot || resolvedSlot;
          contrib = (!slot || slot === 'request') ? 'request' : (slot.startsWith('param:') ? slot : `param:${slot}`);
        }
        addContribution(seat, contrib);
      }
    }
  }

  // 5. Validation and frozen result array
  const result = [];
  for (const [seat, contributions] of planMap.entries()) {
    if (!Object.hasOwn(CHECKER_SEATS, seat)) {
      throw new SeatResolutionError(`"${seat}" is not a checker seat; valid: [${Object.keys(CHECKER_SEATS).join(', ')}]`, 'param-invalid');
    }
    result.push(Object.freeze({
      seat,
      contributions: Object.freeze([...contributions]),
    }));
  }
  return Object.freeze(result);
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
  const fail = (displayed, relativeAt, detail, code = 'invalid-seats') => {
    throw new SeatResolutionError(`${displayed} ${detail}`, code, {
      at: relativeAt,
      detail,
    });
  };
  if (!Array.isArray(raw) || raw.length === 0) {
    fail(label, '', 'must be a non-empty array of { seat, role }');
  }
  const seen = new Set();
  return raw.map((entry, index) => {
    const at = `${label}[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(at, `[${index}]`, 'must be an object { seat, role, persona?, tier? }');
    }
    for (const key of Object.keys(entry)) {
      if (!DECLARED_KEYS.has(key)) {
        fail(at, `[${index}].${key}`, `has unknown key "${key}"; a seat declares only seat, role, persona and tier`);
      }
    }
    if (RESERVED_SEAT_IDS.includes(entry.seat)) {
      fail(`${at}.seat`, `[${index}].seat`, `"${entry.seat}" is a reserved seat id; reserved: [${RESERVED_SEAT_IDS.join(', ')}]`, 'param-invalid');
    }
    try {
      assertSeatId(entry.seat, '');
    } catch (unlabelled) {
      fail(`${at}.seat`, `[${index}].seat`, unlabelled.message.trimStart(), 'invalid-seat-id');
    }
    if (seen.has(entry.seat)) {
      fail(`${at}.seat`, `[${index}].seat`, `"${entry.seat}" is declared twice in this unit`, 'duplicate-seat');
    }
    seen.add(entry.seat);
    if (!SEAT_ROLES.includes(entry.role)) {
      fail(`${at}.role`, `[${index}].role`, `must be one of [${SEAT_ROLES.join(', ')}], got ${JSON.stringify(entry.role)}`, 'invalid-seat-role');
    }
    if (entry.persona !== undefined && (typeof entry.persona !== 'string' || !entry.persona.trim())) {
      fail(`${at}.persona`, `[${index}].persona`, 'must be a non-empty string');
    }
    if (entry.tier !== undefined && tiers && !tiers.includes(entry.tier)) {
      fail(`${at}.tier`, `[${index}].tier`, `must be one of [${tiers.join(', ')}], got ${JSON.stringify(entry.tier)}`, 'invalid-seat-tier');
    }
    return Object.freeze({ seat: entry.seat, role: entry.role, ...(entry.persona ? { persona: entry.persona.trim() } : {}), ...(entry.tier ? { tier: entry.tier } : {}) });
  });
}

/** The seats a unit's pattern params declare. Null when none are declared. */
function declaredSeatsOf(unit, params) {
  const raw = params?.seats;
  if (Array.isArray(raw) && raw.length > 0 && raw.every((d) => d && typeof d === 'object' && d.posture)) {
    return raw;
  }
  return raw === undefined ? null : checkDeclaredSeats(raw, 'params.seats');
}

const withDeclared = (declared, base) => Object.freeze({ ...base, ...(declared.persona ? { persona: declared.persona } : {}), ...(declared.tier ? { tier: declared.tier } : {}) });

function requireRoles(loop, declared, expected) {
  const counts = new Map();
  for (const { role } of declared) counts.set(role, (counts.get(role) ?? 0) + 1);
  for (const [role, n] of Object.entries(expected)) {
    const have = counts.get(role) ?? 0;
    const ok = n === '+' ? have >= 1 : have === n;
    if (!ok) throw new SeatResolutionError(`a ${loop} unit needs ${n === '+' ? 'at least one' : n} seat(s) with role "${role}", has ${have}`, 'seat-multiplicity');
  }
  for (const role of counts.keys()) {
    if (!(role in expected)) throw new SeatResolutionError(`a ${loop} unit has no use for a seat with role "${role}"`, 'seat-multiplicity');
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
 * @param {object} options
 * @param {string} [options.loop] loop name; when absent the loop comes from `options.pattern` (a pattern name, as `unit.pattern`)
 * @param {object} [options.params] expanded loop params (declared seats, `minCheckers`)
 * @param {{ minCheckers?: Array<{ name: string, source: string }> }} [options.floors] checker floors with their source
 * @param {object} [options.unit]
 * @param {object} [options.runnerConfig]
 * @returns {Array<{ seat: string, role: string, posture: object, persona?: string, tier?: string }>}
 */
export function resolveSeats(options = {}) {
  let { loop, pattern, params, floors, unit, runnerConfig, shippedCheckersByRigor } = options;
  let resolvedLoop = loop ?? (typeof pattern === 'string' ? pattern : pattern?.pattern) ?? 'solo';
  if (resolvedLoop === 'research-fan-out') {
    resolvedLoop = 'panel';
    params = params ?? { seats: [{ seat: 'member-1', role: 'producer' }, { seat: 'member-2', role: 'producer' }, { seat: 'member-3', role: 'producer' }, { seat: 'synthesizer', role: 'synthesizer' }] };
  }
  const rawParams = params ?? (typeof pattern === 'object' && pattern !== null ? pattern.params : undefined);
  params = rawParams === undefined || rawParams === null ? {} : { ...rawParams };
  if (params.seats === undefined && unit?.seats !== undefined) {
    params.seats = unit.seats;
  }
  const declared = declaredSeatsOf(unit, params);
  if (declared && declared.length > 0 && declared.every((d) => d.posture)) {
    return declared;
  }
  const readOnly = noWrites(unit);
  switch (resolvedLoop) {
    case 'solo': {
      if (declared) {
        if (declared.length !== 1 || declared[0].role !== 'producer') throw new SeatResolutionError('a solo unit declares exactly one seat, with role "producer"', 'seat-multiplicity');
        return [withDeclared(declared[0], { seat: declared[0].seat, role: 'producer', posture: posture({ readOnly, writer: true }) })];
      }
      return [Object.freeze({ seat: 'producer', role: 'producer', posture: posture({ readOnly, writer: true }) })];
    }
    case 'reviewed': {
      const slot = options.slot ?? options.minCheckersSlot ?? options.provenance?.params?.minCheckers;
      const plan = checkerPlanOf(unit, runnerConfig, { requested: params?.minCheckers, floors, slot, shippedCheckersByRigor });
      const required = plan.map((p) => p.seat);
      const checkerPosture = (name) => posture({ readOnly: true, forceOutOfProcess: true, verdict: CHECKER_SEATS[name].verdict });
      const producerPosture = posture({ readOnly, writer: true });
      if (!declared) {
        return [
          Object.freeze({ seat: 'producer', role: 'producer', posture: producerPosture }),
          ...required.map((name) => Object.freeze({ seat: name, role: CHECKER_SEATS[name].role, posture: checkerPosture(name) })),
        ];
      }
      if (declared.length > 0 && declared.every((d) => d.posture)) {
        return declared;
      }
      // Declared seats name the producer and one seat per checker the unit needs; the roles must match
      // what checkersByRigor[effective rigor] plus minCheckers require, no role missing and none extra.
      const producers = declared.filter((d) => d.role === 'producer');
      if (producers.length !== 1) throw new SeatResolutionError(`a reviewed unit declares exactly one seat with role "producer", has ${producers.length}`, 'seat-multiplicity');
      const wanted = required.map((name) => CHECKER_SEATS[name].role);
      const declaredCheckers = declared.filter((d) => d.role !== 'producer');
      const unassignedPlan = [...plan];
      const have = [];
      for (const d of declaredCheckers) {
        const at = unassignedPlan.findIndex((p) => CHECKER_SEATS[p.seat].role === d.role);
        if (at >= 0) {
          unassignedPlan.splice(at, 1);
        } else {
          have.push(d.role);
        }
      }
      const missingRoles = unassignedPlan.map((p) => CHECKER_SEATS[p.seat].role);
      if (unassignedPlan.length > 0 || have.length > 0) {
        const invariantContrib = unassignedPlan.flatMap((p) => p.contributions).find((c) => c.startsWith('pattern-invariant:'));
        if (invariantContrib) {
          throw new SeatResolutionError(
            `declared seats weaken pattern invariant ${invariantContrib}: missing required checker role(s) [${missingRoles.join(', ')}]`,
            'pattern-invariant-weakened',
          );
        }
        throw new SeatResolutionError(
          `a reviewed unit's checker seats must be exactly [${wanted.join(', ')}] (checkersByRigor for its effective rigor plus minCheckers)${missingRoles.length ? `; missing [${missingRoles.join(', ')}]` : ''}${have.length ? `; extra [${have.join(', ')}]` : ''}`,
          'seat-multiplicity',
        );
      }
      // Each declared checker seat takes the first still-unassigned required checker of its role, which
      // fixes its posture (`tester` is a reviewer-role seat whose result is not a verdict).
      const unassignedNames = [...required];
      return declared.map((d) => {
        if (d.role === 'producer') return withDeclared(d, { seat: d.seat, role: d.role, posture: producerPosture });
        const at = unassignedNames.findIndex((name) => CHECKER_SEATS[name].role === d.role);
        const [name] = unassignedNames.splice(at, 1);
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
      throw new SeatResolutionError(`Unknown collaboration pattern: "${resolvedLoop}"`, 'unknown-pattern');
  }
}

/**
 * Seat launches a unit plans before any fallback: seats per round times the rounds the pattern may run.
 * @returns {number|null} null for a pattern this core does not know
 */
export function seatLaunchesOf(options = {}) {
  let { loop, pattern, params, floors, unit, runnerConfig, shippedCheckersByRigor } = options;
  let resolvedLoop = loop ?? (typeof pattern === 'string' ? pattern : pattern?.pattern) ?? 'solo';
  params = params ?? (typeof pattern === 'object' && pattern !== null ? pattern.params : undefined);
  if (!LOOP_NAMES.includes(resolvedLoop)) return null;
  const seats = resolveSeats({ loop: resolvedLoop, params, floors, unit, runnerConfig, slot: options.slot, shippedCheckersByRigor });
  switch (resolvedLoop) {
    case 'reviewed': return seats.length * (params?.maxRounds ?? 2);
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
