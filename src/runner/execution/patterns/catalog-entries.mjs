// src/runner/execution/patterns/catalog-entries.mjs
// Pure domain catalog validation, entry checking and helpers.
// Architecture guard: pure. No I/O, no clock, no state, no imports from runner/dispatch/.

import {
  checkDeclaredSeats,
  CHECKER_SEATS,
  SeatResolutionError,
  LOOP_NAMES,
} from '../seat-resolver.mjs';
import { paramTableOf } from '../loops/index.mjs';
import { detectRetiredPatternKeys, RESERVED_PATTERN_NAMES, RETIRED_GATED_NAME, formatRetiredKeySentence } from './retired-keys.mjs';

/**
 * Collaboration error carrying a standard refusal code and optional source layer.
 */
export const CollaborationError = new Proxy(
  class CollaborationError extends Error {
    constructor(code, message, options = {}) {
      let finalCode = code;
      let finalMessage = message;
      let finalSource = options?.source ?? null;

      if (typeof code === 'string' && typeof message === 'string') {
        if (code.includes(' ') && !message.includes(' ') && /^[a-z0-9-]+$/.test(message)) {
          finalCode = message;
          finalMessage = code;
        }
      } else if (typeof code === 'string' && !message) {
        finalMessage = code;
      }

      super(finalMessage || finalCode);
      this.name = 'CollaborationError';
      this.code = finalCode;
      this.source = finalSource;
    }
  },
  {
    apply(target, thisArg, args) {
      return new target(...args);
    },
  },
);

export function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.hasOwn(b, k) || !deepEqual(a[k], b[k])) return false;
  }
  return true;
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const out = Object.create(null);
  for (const [k, v] of Object.entries(obj)) {
    Object.defineProperty(out, k, {
      value: deepClone(v),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return out;
}

const LAYER_PRIORITY = Object.freeze({
  project: 3,
  global: 2,
  shipped: 1,
  standard: 1,
});

export function extractLayerName(val) {
  if (typeof val === 'string') return val === 'standard' ? 'shipped' : val;
  if (val && typeof val === 'object' && typeof val.layer === 'string') {
    return val.layer === 'standard' ? 'shipped' : val.layer;
  }
  return null;
}

export function resolveLayer(origins, name, fieldPath) {
  if (!Array.isArray(origins)) return null;
  let candidateOrigins = [];
  if (fieldPath) {
    const fullPath = `runner.patterns.${name}.${fieldPath}`;
    const shortPath = `${name}.${fieldPath}`;
    candidateOrigins = origins.filter(
      (o) => o?.path === fullPath ||
             o?.path?.startsWith(`${fullPath}.`) ||
             o?.path?.startsWith(`${fullPath}[`) ||
             o?.path === shortPath ||
             o?.path?.startsWith(`${shortPath}.`) ||
             o?.path?.startsWith(`${shortPath}[`)
    );
  }
  if (candidateOrigins.length === 0) {
    const patternPath = `runner.patterns.${name}`;
    candidateOrigins = origins.filter(
      (o) => o?.path === patternPath ||
             o?.path?.startsWith(`${patternPath}.`) ||
             o?.path?.startsWith(`${patternPath}[`) ||
             o?.path === name ||
             o?.path?.startsWith(`${name}.`) ||
             o?.path?.startsWith(`${name}[`)
    );
  }
  if (candidateOrigins.length === 0) return null;

  let bestLayer = null;
  let bestPriority = 0;
  for (const o of candidateOrigins) {
    const norm = extractLayerName(o);
    const prio = LAYER_PRIORITY[norm] ?? 0;
    if (prio > bestPriority) {
      bestPriority = prio;
      bestLayer = norm;
    }
  }
  return bestLayer;
}

function allowedRoleTaskTargets(loop, entry) {
  const declaredDefaults = Array.isArray(entry?.defaults?.seats) ? entry.defaults.seats : [];
  const declaredInvariants = Array.isArray(entry?.invariants?.seats?.fixed) ? entry.invariants.seats.fixed : [];
  const allDeclared = [...declaredDefaults, ...declaredInvariants];
  const targets = new Set();
  const declaredProducers = [];
  const declaredCheckers = [];

  for (const s of allDeclared) {
    if (s && typeof s === 'object' && typeof s.seat === 'string' && s.seat.trim()) {
      targets.add(s.seat);
      if (s.role === 'producer') {
        declaredProducers.push(s.seat);
      } else {
        declaredCheckers.push(s.seat);
      }
    }
  }

  switch (loop) {
    case 'reviewed':
      targets.add('producer');
      if (allDeclared.length === 0) {
        targets.add('reviewer');
        const minDefaults = Array.isArray(entry?.defaults?.minCheckers) ? entry.defaults.minCheckers : [];
        const minInvAtLeast = Array.isArray(entry?.invariants?.minCheckers?.atLeast) ? entry.invariants.minCheckers.atLeast : [];
        for (const chk of [...minDefaults, ...minInvAtLeast]) {
          if (typeof chk === 'string' && Object.hasOwn(CHECKER_SEATS, chk)) {
            targets.add(chk);
          }
        }
      }
      break;
    case 'panel':
      targets.add('panelist');
      targets.add('synthesizer');
      break;
    case 'debate':
      targets.add('thesis');
      targets.add('antithesis');
      targets.add('thesis-rebuttal');
      targets.add('antithesis-rebuttal');
      targets.add('judge');
      for (const prodSeat of declaredProducers) {
        targets.add(`${prodSeat}-rebuttal`);
      }
      break;
  }
  return targets;
}

function checkLoopSeatCardinality(loop, declaredSeats, label) {
  switch (loop) {
    case 'solo': {
      if (declaredSeats.length !== 1 || declaredSeats[0].role !== 'producer') {
        throw new SeatResolutionError(
          `${label}: a solo pattern declares exactly one seat, with role "producer"`,
          'seat-multiplicity',
        );
      }
      break;
    }
    case 'reviewed': {
      const producers = declaredSeats.filter((d) => d.role === 'producer');
      if (producers.length !== 1) {
        throw new SeatResolutionError(
          `${label}: a reviewed pattern declares exactly one seat with role "producer", has ${producers.length}`,
          'seat-multiplicity',
        );
      }
      const checkerRoles = new Set(Object.values(CHECKER_SEATS).map((c) => c.role));
      for (const d of declaredSeats) {
        if (d.role !== 'producer' && !checkerRoles.has(d.role)) {
          throw new SeatResolutionError(
            `${label}: a reviewed pattern has no use for a seat with role "${d.role}"`,
            'seat-multiplicity',
          );
        }
      }
      break;
    }
    case 'panel': {
      const producers = declaredSeats.filter((d) => d.role === 'producer');
      const synths = declaredSeats.filter((d) => d.role === 'synthesizer');
      if (producers.length < 1) {
        throw new SeatResolutionError(
          `${label}: a panel pattern needs at least one seat with role "producer", has ${producers.length}`,
          'seat-multiplicity',
        );
      }
      if (synths.length !== 1) {
        throw new SeatResolutionError(
          `${label}: a panel pattern needs exactly one seat with role "synthesizer", has ${synths.length}`,
          'seat-multiplicity',
        );
      }
      for (const d of declaredSeats) {
        if (d.role !== 'producer' && d.role !== 'synthesizer') {
          throw new SeatResolutionError(
            `${label}: a panel pattern has no use for a seat with role "${d.role}"`,
            'seat-multiplicity',
          );
        }
      }
      break;
    }
    case 'debate': {
      const producers = declaredSeats.filter((d) => d.role === 'producer');
      const judges = declaredSeats.filter((d) => d.role === 'judge');
      if (producers.length !== 2) {
        throw new SeatResolutionError(
          `${label}: a debate pattern needs exactly 2 seats with role "producer", has ${producers.length}`,
          'seat-multiplicity',
        );
      }
      if (judges.length !== 1) {
        throw new SeatResolutionError(
          `${label}: a debate pattern needs exactly one seat with role "judge", has ${judges.length}`,
          'seat-multiplicity',
        );
      }
      for (const d of declaredSeats) {
        if (d.role !== 'producer' && d.role !== 'judge') {
          throw new SeatResolutionError(
            `${label}: a debate pattern has no use for a seat with role "${d.role}"`,
            'seat-multiplicity',
          );
        }
      }
      break;
    }
  }
}

function checkParamDomain(name, loop, param, val, section, src, problems, entry) {
  const at = `pattern "${name}" ${section}.${param}`;
  const suffix = src ? ` (source layer: ${src})` : '';
  switch (param) {
    case 'maxRounds': {
      if (!Number.isInteger(val) || val <= 0) {
        problems.push(new CollaborationError(
          'param-invalid',
          `${at} must be a positive integer, got ${JSON.stringify(val)}${suffix}`,
          { source: src },
        ));
      }
      break;
    }
    case 'minCheckers': {
      if (!Array.isArray(val) || val.length === 0) {
        problems.push(new CollaborationError(
          'param-invalid',
          `${at} must be a non-empty list of checker seat names${suffix}`,
          { source: src },
        ));
      } else {
        for (const chk of val) {
          if (typeof chk !== 'string') {
            problems.push(new CollaborationError(
              'param-invalid',
              `${at} checker seat name must be a string, got ${typeof chk === 'object' ? JSON.stringify(chk) : String(chk)}${suffix}`,
              { source: src },
            ));
          } else if (!Object.hasOwn(CHECKER_SEATS, chk)) {
            problems.push(new CollaborationError(
              'param-invalid',
              `${at} contains unknown checker seat "${chk}"; valid: [${Object.keys(CHECKER_SEATS).join(', ')}]${suffix}`,
              { source: src },
            ));
          }
        }
      }
      break;
    }
    case 'rebuttal': {
      if (typeof val !== 'boolean') {
        problems.push(new CollaborationError(
          'param-invalid',
          `${at} must be a boolean, got ${JSON.stringify(val)}${suffix}`,
          { source: src },
        ));
      }
      break;
    }
    case 'seats': {
      try {
        const declared = checkDeclaredSeats(val, `${at}`);
        checkLoopSeatCardinality(loop, declared, at);
      } catch (err) {
        const code = (err.code === 'invalid-seats' || err.code === 'invalid-seat-id' || err.code === 'invalid-seat-role' || err.code === 'invalid-seat-tier')
          ? 'param-invalid'
          : (err.code ?? 'param-invalid');
        problems.push(new CollaborationError(
          code,
          `${err.message}${suffix}`,
          { source: src },
        ));
      }
      break;
    }
    case 'roleTasks': {
      if (!val || typeof val !== 'object' || Array.isArray(val)) {
        problems.push(new CollaborationError(
          'param-invalid',
          `${at} must be an object mapping seat or kind to text${suffix}`,
          { source: src },
        ));
      } else {
        const allowedTargets = allowedRoleTaskTargets(loop, entry);
        for (const [target, text] of Object.entries(val)) {
          if (typeof text !== 'string') {
            problems.push(new CollaborationError(
              'param-invalid',
              `${at}["${target}"] task text must be a string${suffix}`,
              { source: src },
            ));
          }
          if (!allowedTargets.has(target)) {
            problems.push(new CollaborationError(
              'param-invalid',
              `${at} target "${target}" does not exist for loop "${loop}" (valid targets: [${Array.from(allowedTargets).join(', ')}])${suffix}`,
              { source: src },
            ));
          }
        }
      }
      break;
    }
  }
}

/**
 * Validates pattern catalog entries and merges them.
 *
 * @param {object} options
 * @param {object} options.shipped - Explicit shipped patterns map
 * @param {object} options.effective - Explicit effective patterns map
 * @param {Array<object>} [options.origins] - Origin list
 * @param {boolean} [options.throwOnError] - Throw first problem if true
 * @returns {{ entries: object, merged: object, problems: Array<CollaborationError> }}
 */
export function checkCatalog(options = {}) {
  const shippedPatterns = options?.shipped ?? {};
  const effectivePatterns = options?.effective ?? {};
  const origins = options?.origins ?? null;
  const throwOnError = Boolean(options?.throwOnError);

  const problems = [];
  const ALLOWED_PATTERN_ENTRY_KEYS = new Set(['promise', 'loop', 'defaults', 'invariants']);
  // 1. Retired keys checks via shared leaf detector
  const retiredFindings = detectRetiredPatternKeys(effectivePatterns);
  const retiredKeysSet = new Set(retiredFindings.map((f) => f.key.replace(/^runner\.patterns\./, '')));
  for (const finding of retiredFindings) {
    const name = finding.key.replace(/^runner\.patterns\./, '').split('.')[0];
    const src = resolveLayer(origins, name);
    problems.push(new CollaborationError(
      'config-key-retired',
      `${formatRetiredKeySentence(finding)}${src ? ` (source layer: ${src})` : ''}`,
      { source: src },
    ));
  }
  // 2. Reserved names check
  if (Object.hasOwn(effectivePatterns, 'seatBinding')) {
    const sb = effectivePatterns.seatBinding;
    if (sb && typeof sb === 'object' && (Object.hasOwn(sb, 'loop') || Object.hasOwn(sb, 'promise') || Object.hasOwn(sb, 'defaults') || Object.hasOwn(sb, 'invariants'))) {
      const src = resolveLayer(origins, 'seatBinding');
      problems.push(new CollaborationError(
        'config-error',
        `runner.patterns.seatBinding uses reserved name "seatBinding" as a pattern name${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
    }
  }

  for (const [name, entry] of Object.entries(effectivePatterns)) {
    if (name === 'seatBinding') continue;

    if (RESERVED_PATTERN_NAMES.has(name)) {
      const src = resolveLayer(origins, name);
      problems.push(new CollaborationError(
        'config-error',
        `"${name}" is a reserved name and cannot be used as a pattern name${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      const src = resolveLayer(origins, name);
      problems.push(new CollaborationError(
        'param-invalid',
        `pattern "${name}" must be an object${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
      continue;
    }

    for (const key of Object.keys(entry)) {
      if (retiredKeysSet.has(`${name}.${key}`)) continue;
      if (!ALLOWED_PATTERN_ENTRY_KEYS.has(key)) {
        const src = resolveLayer(origins, name, key) ?? resolveLayer(origins, name);
        problems.push(new CollaborationError(
          'param-unknown',
          `pattern "${name}" has unknown key "${key}"${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }

    if (Object.hasOwn(entry, 'defaults')) {
      if (!entry.defaults || typeof entry.defaults !== 'object' || Array.isArray(entry.defaults)) {
        const src = resolveLayer(origins, name, 'defaults') ?? resolveLayer(origins, name);
        problems.push(new CollaborationError(
          'param-invalid',
          `pattern "${name}" defaults must be an object${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }

    if (Object.hasOwn(entry, 'invariants')) {
      if (!entry.invariants || typeof entry.invariants !== 'object' || Array.isArray(entry.invariants)) {
        const src = resolveLayer(origins, name, 'invariants') ?? resolveLayer(origins, name);
        problems.push(new CollaborationError(
          'param-invalid',
          `pattern "${name}" invariants must be an object${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }
  }

  // 3. Build merged entries
  const allNames = new Set([
    ...Object.keys(shippedPatterns),
    ...Object.keys(effectivePatterns),
  ]);
  for (const n of RESERVED_PATTERN_NAMES) {
    allNames.delete(n);
  }
  allNames.delete(RETIRED_GATED_NAME);

  const mergedEntries = Object.create(null);

  for (const name of allNames) {
    const shippedEntry = Object.hasOwn(shippedPatterns, name) ? shippedPatterns[name] : undefined;
    const hasEffective = Object.hasOwn(effectivePatterns, name) && effectivePatterns[name] !== undefined;
    const effectiveEntry = hasEffective ? effectivePatterns[name] : undefined;

    if (hasEffective && (!effectiveEntry || typeof effectiveEntry !== 'object' || Array.isArray(effectiveEntry))) {
      if (shippedEntry) {
        Object.defineProperty(mergedEntries, name, {
          value: Object.freeze(deepClone(shippedEntry)),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      continue;
    }

    let mergedEntry;
    if (shippedEntry && !hasEffective) {
      mergedEntry = deepClone(shippedEntry);
    } else if (!shippedEntry && hasEffective) {
      mergedEntry = deepClone(effectiveEntry);
    } else {
      mergedEntry = deepClone(shippedEntry);
      if (Object.hasOwn(effectiveEntry, 'promise')) mergedEntry.promise = effectiveEntry.promise;
      if (Object.hasOwn(effectiveEntry, 'loop')) mergedEntry.loop = effectiveEntry.loop;

      if (Object.hasOwn(effectiveEntry, 'defaults') && effectiveEntry.defaults && typeof effectiveEntry.defaults === 'object' && !Array.isArray(effectiveEntry.defaults)) {
        mergedEntry.defaults = Object.assign(
          Object.create(null),
          mergedEntry.defaults ?? {},
          deepClone(effectiveEntry.defaults),
        );
      }
      if (Object.hasOwn(effectiveEntry, 'invariants') && effectiveEntry.invariants && typeof effectiveEntry.invariants === 'object' && !Array.isArray(effectiveEntry.invariants)) {
        mergedEntry.invariants = Object.assign(
          Object.create(null),
          mergedEntry.invariants ?? {},
          deepClone(effectiveEntry.invariants),
        );
      }
    }

    // Shipped entry override weakening checks
    if (shippedEntry && hasEffective) {
      if (Object.hasOwn(effectiveEntry, 'loop') && effectiveEntry.loop !== shippedEntry.loop) {
        const src = resolveLayer(origins, name, 'loop') ?? resolveLayer(origins, name);
        problems.push(new CollaborationError(
          'pattern-invariant-weakened',
          `pattern "${name}" cannot change shipped loop "${shippedEntry.loop}" to "${effectiveEntry.loop}"${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }

      if (Object.hasOwn(effectiveEntry, 'promise') && effectiveEntry.promise !== shippedEntry.promise) {
        const src = resolveLayer(origins, name, 'promise') ?? resolveLayer(origins, name);
        problems.push(new CollaborationError(
          'pattern-invariant-weakened',
          `pattern "${name}" cannot change shipped promise${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }

      if (shippedEntry.invariants && Object.hasOwn(effectiveEntry, 'invariants') && typeof effectiveEntry.invariants === 'object' && effectiveEntry.invariants !== null && !Array.isArray(effectiveEntry.invariants)) {
        for (const [param, shippedInv] of Object.entries(shippedEntry.invariants)) {
          const src = resolveLayer(origins, name, `invariants.${param}`) ?? resolveLayer(origins, name, 'invariants') ?? resolveLayer(origins, name);

          if (Object.keys(effectiveEntry.invariants).length === 0) {
            const msg = shippedInv.atLeast !== undefined
              ? `pattern "${name}" invariant for "${param}" must keep atLeast list from shipped entry${src ? ` (source layer: ${src})` : ''}`
              : `pattern "${name}" changed or removed fixed invariant for "${param}"${src ? ` (source layer: ${src})` : ''}`;
            problems.push(new CollaborationError('pattern-invariant-weakened', msg, { source: src }));
            continue;
          }

          const effInv = Object.hasOwn(effectiveEntry.invariants, param) ? effectiveEntry.invariants[param] : undefined;
          if (effInv !== undefined) {
            if (shippedInv.atLeast !== undefined) {
              if (!effInv || typeof effInv !== 'object' || !Array.isArray(effInv.atLeast)) {
                problems.push(new CollaborationError(
                  'pattern-invariant-weakened',
                  `pattern "${name}" invariant for "${param}" must keep atLeast list from shipped entry${src ? ` (source layer: ${src})` : ''}`,
                  { source: src },
                ));
              } else {
                const effSet = new Set(effInv.atLeast);
                for (const required of shippedInv.atLeast) {
                  if (!effSet.has(required)) {
                    problems.push(new CollaborationError(
                      'pattern-invariant-weakened',
                      `pattern "${name}" dropped invariant atLeast element "${required}" for "${param}"${src ? ` (source layer: ${src})` : ''}`,
                      { source: src },
                    ));
                  }
                }
              }
            }

            if (shippedInv.fixed !== undefined) {
              if (!effInv || typeof effInv !== 'object' || !deepEqual(effInv.fixed, shippedInv.fixed)) {
                problems.push(new CollaborationError(
                  'pattern-invariant-weakened',
                  `pattern "${name}" changed or removed fixed invariant for "${param}"${src ? ` (source layer: ${src})` : ''}`,
                  { source: src },
                ));
              }
            }
          }
        }
      }
    }

    // Custom pattern checks
    if (!shippedEntry) {
      const src = resolveLayer(origins, name);
      if (!mergedEntry.promise || typeof mergedEntry.promise !== 'string' || !mergedEntry.promise.trim()) {
        problems.push(new CollaborationError(
          'param-invalid',
          `custom pattern "${name}" must declare a non-empty "promise"${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
      if (!mergedEntry.loop || !LOOP_NAMES.includes(mergedEntry.loop)) {
        problems.push(new CollaborationError(
          'param-invalid',
          `custom pattern "${name}" must declare a valid "loop" from [${LOOP_NAMES.join(', ')}], got: ${JSON.stringify(mergedEntry.loop)}${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }

    // Validate merged entry fields against loop param table
    const loop = mergedEntry.loop;
    if (loop && LOOP_NAMES.includes(loop)) {
      const paramTable = paramTableOf(loop) ?? {};

      // Validate defaults
      if (mergedEntry.defaults !== undefined) {
        if (!mergedEntry.defaults || typeof mergedEntry.defaults !== 'object' || Array.isArray(mergedEntry.defaults)) {
          const src = resolveLayer(origins, name, 'defaults') ?? resolveLayer(origins, name);
          problems.push(new CollaborationError(
            'param-invalid',
            `pattern "${name}" defaults must be an object${src ? ` (source layer: ${src})` : ''}`,
            { source: src },
          ));
        } else {
          for (const [param, val] of Object.entries(mergedEntry.defaults)) {
            const src = resolveLayer(origins, name, `defaults.${param}`) ?? resolveLayer(origins, name);
            if (!Object.hasOwn(paramTable, param)) {
              problems.push(new CollaborationError(
                'param-unknown',
                `pattern "${name}" default parameter "${param}" is not read by loop "${loop}"${src ? ` (source layer: ${src})` : ''}`,
                { source: src },
              ));
              continue;
            }
            checkParamDomain(name, loop, param, val, 'defaults', src, problems, mergedEntry);
          }
        }
      }

      // Validate invariants
      if (mergedEntry.invariants !== undefined) {
        if (!mergedEntry.invariants || typeof mergedEntry.invariants !== 'object' || Array.isArray(mergedEntry.invariants)) {
          const src = resolveLayer(origins, name, 'invariants') ?? resolveLayer(origins, name);
          problems.push(new CollaborationError(
            'param-invalid',
            `pattern "${name}" invariants must be an object${src ? ` (source layer: ${src})` : ''}`,
            { source: src },
          ));
        } else {
          for (const [param, inv] of Object.entries(mergedEntry.invariants)) {
            const src = resolveLayer(origins, name, `invariants.${param}`) ?? resolveLayer(origins, name);
            if (!Object.hasOwn(paramTable, param)) {
              problems.push(new CollaborationError(
                'param-unknown',
                `pattern "${name}" invariant parameter "${param}" is not read by loop "${loop}"${src ? ` (source layer: ${src})` : ''}`,
                { source: src },
              ));
              continue;
            }

            if (!inv || typeof inv !== 'object' || Array.isArray(inv)) {
              problems.push(new CollaborationError(
                'param-invalid',
                `pattern "${name}" invariant for "${param}" must be an object${src ? ` (source layer: ${src})` : ''}`,
                { source: src },
              ));
              continue;
            }

            const invKeys = Object.keys(inv);
            const hasAtLeast = Object.hasOwn(inv, 'atLeast');
            const hasFixed = Object.hasOwn(inv, 'fixed');

            if ((!hasAtLeast && !hasFixed) || (hasAtLeast && hasFixed) || invKeys.length !== 1) {
              problems.push(new CollaborationError(
                'param-invalid',
                `pattern "${name}" invariant for "${param}" must declare exactly one form: "atLeast" or "fixed"${src ? ` (source layer: ${src})` : ''}`,
                { source: src },
              ));
              continue;
            }

            if (hasAtLeast) {
              if (param !== 'minCheckers') {
                problems.push(new CollaborationError(
                  'param-invalid',
                  `pattern "${name}" invariant "atLeast" is only valid for list parameters, got "${param}"${src ? ` (source layer: ${src})` : ''}`,
                  { source: src },
                ));
              } else {
                if (!Array.isArray(inv.atLeast) || inv.atLeast.length === 0) {
                  problems.push(new CollaborationError(
                    'param-invalid',
                    `pattern "${name}" invariant atLeast for "${param}" must be a non-empty array of checker seats${src ? ` (source layer: ${src})` : ''}`,
                    { source: src },
                  ));
                } else {
                  for (const chk of inv.atLeast) {
                    if (typeof chk !== 'string') {
                      problems.push(new CollaborationError(
                        'param-invalid',
                        `pattern "${name}" invariant atLeast for "${param}" checker seat name must be a string${src ? ` (source layer: ${src})` : ''}`,
                        { source: src },
                      ));
                    } else if (!Object.hasOwn(CHECKER_SEATS, chk)) {
                      problems.push(new CollaborationError(
                        'param-invalid',
                        `pattern "${name}" invariant atLeast "${chk}" is not a valid checker seat [${Object.keys(CHECKER_SEATS).join(', ')}]${src ? ` (source layer: ${src})` : ''}`,
                        { source: src },
                      ));
                    }
                  }
                }
              }
            }

            if (hasFixed) {
              if (param === 'minCheckers') {
                problems.push(new CollaborationError(
                  'param-invalid',
                  `pattern "${name}" invariant for list parameter "minCheckers" must use "atLeast", not "fixed"${src ? ` (source layer: ${src})` : ''}`,
                  { source: src },
                ));
              } else {
                checkParamDomain(name, loop, param, inv.fixed, 'invariants', src, problems, mergedEntry);
              }
            }
          }
        }
      }
    }
    Object.defineProperty(mergedEntries, name, {
      value: Object.freeze(mergedEntry),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  if (throwOnError && problems.length > 0) {
    throw problems[0];
  }

  return {
    entries: mergedEntries,
    merged: mergedEntries,
    problems,
  };
}
