// src/runner/execution/patterns/catalog.mjs
// Pure domain catalog validation, entry checking and loopOf resolution.
// Architecture guard: pure. No I/O, no clock, no state, no imports from runner/dispatch/.

import {
  checkDeclaredSeats,
  CHECKER_SEATS,
  SeatResolutionError,
  LOOP_NAMES,
} from '../seat-resolver.mjs';
import { paramTableOf } from '../loops/index.mjs';

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

function deepEqual(a, b) {
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

function deepClone(obj) {
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

function extractLayerName(val) {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && typeof val.layer === 'string') return val.layer;
  return null;
}

function resolveLayer(layers, patternName, fieldPath) {
  if (!layers) return null;
  if (typeof layers === 'string') return layers;
  if (Array.isArray(layers)) {
    if (fieldPath) {
      const fullPath = `runner.patterns.${patternName}.${fieldPath}`;
      const foundField = layers.find((o) => o?.path === fullPath || o?.path?.startsWith(`${fullPath}.`));
      if (foundField) return extractLayerName(foundField);
      const shortPath = `${patternName}.${fieldPath}`;
      const foundShort = layers.find((o) => o?.path === shortPath || o?.path?.startsWith(`${shortPath}.`));
      if (foundShort) return extractLayerName(foundShort);
    }
    const patternPath = `runner.patterns.${patternName}`;
    const foundPattern = layers.find((o) => o?.path === patternPath || o?.path?.startsWith(`${patternPath}.`));
    if (foundPattern) return extractLayerName(foundPattern);
    const foundShortPattern = layers.find((o) => o?.path === patternName || o?.path?.startsWith(`${patternName}.`));
    if (foundShortPattern) return extractLayerName(foundShortPattern);
    return null;
  }
  if (typeof layers !== 'object') return null;

  if (fieldPath) {
    const fullPath = `runner.patterns.${patternName}.${fieldPath}`;
    if (Object.hasOwn(layers, fullPath) && layers[fullPath]) return extractLayerName(layers[fullPath]);
    const shortPath = `${patternName}.${fieldPath}`;
    if (Object.hasOwn(layers, shortPath) && layers[shortPath]) return extractLayerName(layers[shortPath]);
  }
  const patternPath = `runner.patterns.${patternName}`;
  if (Object.hasOwn(layers, patternPath) && layers[patternPath]) return extractLayerName(layers[patternPath]);
  if (Object.hasOwn(layers, patternName) && layers[patternName]) return extractLayerName(layers[patternName]);

  return null;
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

function checkParamDomain(patternName, loop, param, val, section, src, problems, entry) {
  const at = `pattern "${patternName}" ${section}.${param}`;
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
 * Returns the loop name for a pattern name from effective configuration, or null if unknown.
 *
 * @param {string} name - Pattern name
 * @param {object} [options] - Options containing `{ effective }`
 * @returns {string|null}
 */
export function loopOf(name, options = {}) {
  if (!name || typeof name !== 'string') return null;
  const effective = options?.effective ?? options;
  const patterns = effective?.runner?.patterns ?? effective?.patterns ?? effective;
  if (!patterns || typeof patterns !== 'object') return null;
  const entry = Object.hasOwn(patterns, name) ? patterns[name] : undefined;
  if (entry && typeof entry.loop === 'string') {
    return entry.loop;
  }
  return null;
}

/**
 * Validates pattern catalog entries and merges them.
 *
 * @param {object} options
 * @param {object} options.shipped - Bundled standard catalog { patterns, loops }
 * @param {object} options.effective - Effective merged configuration
 * @param {object} [options.layers] - Origin layer map per pattern or field path
 * @param {boolean} [options.throwOnError] - Throw first problem if true
 * @returns {{ entries: object, merged: object, problems: Array<CollaborationError> }}
 */
export function checkCatalog(options = {}) {
  const shippedInput = options?.shipped ?? {};
  const effectiveInput = options?.effective ?? {};
  const layers = options?.layers ?? null;
  const throwOnError = Boolean(options?.throwOnError);

  const shippedPatterns = shippedInput?.patterns ?? shippedInput ?? {};
  const effectivePatterns = effectiveInput?.runner?.patterns ?? effectiveInput?.patterns ?? effectiveInput ?? {};

  const problems = [];
  const RESERVED_PATTERN_NAMES = new Set(['seatBinding', 'defaultRule']);
  const ALLOWED_PATTERN_ENTRY_KEYS = new Set(['promise', 'loop', 'defaults', 'invariants']);
  // 1. Retired keys checks
  if (Object.hasOwn(effectivePatterns, 'defaultRule')) {
    const src = resolveLayer(layers, 'defaultRule');
    problems.push(new CollaborationError(
      'config-key-retired',
      `runner.patterns.defaultRule was retired; delete the key${src ? ` (source layer: ${src})` : ''}`,
      { source: src },
    ));
  }
  if (Object.hasOwn(effectivePatterns, 'research-fan-out-gated')) {
    const src = resolveLayer(layers, 'research-fan-out-gated');
    problems.push(new CollaborationError(
      'config-key-retired',
      `runner.patterns.research-fan-out-gated was retired; use runner.patterns.research-fan-out instead${src ? ` (source layer: ${src})` : ''}`,
      { source: src },
    ));
  }

  // 2. Reserved names and both-shapes check
  if (Object.hasOwn(effectivePatterns, 'seatBinding')) {
    const sb = effectivePatterns.seatBinding;
    if (sb && typeof sb === 'object' && (Object.hasOwn(sb, 'loop') || Object.hasOwn(sb, 'promise') || Object.hasOwn(sb, 'defaults') || Object.hasOwn(sb, 'invariants'))) {
      const src = resolveLayer(layers, 'seatBinding');
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
      const src = resolveLayer(layers, name);
      problems.push(new CollaborationError(
        'config-error',
        `"${name}" is a reserved name and cannot be used as a pattern name${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      const src = resolveLayer(layers, name);
      problems.push(new CollaborationError(
        'param-invalid',
        `pattern "${name}" must be an object${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
      continue;
    }

    const hasTuning = Object.hasOwn(entry, 'maxRounds') || Object.hasOwn(entry, 'checkersByRigor');
    const hasCatalog = Object.hasOwn(entry, 'loop') || Object.hasOwn(entry, 'defaults') || Object.hasOwn(entry, 'promise') || Object.hasOwn(entry, 'invariants');
    if (hasTuning && hasCatalog) {
      const src = resolveLayer(layers, name);
      problems.push(new CollaborationError(
        'config-error',
        `pattern "${name}" cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.${name}${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
    } else if (hasTuning && !hasCatalog) {
      const src = resolveLayer(layers, name);
      problems.push(new CollaborationError(
        'config-key-retired',
        `runner.patterns.${name} was retired; use runner.loops.${name} instead${src ? ` (source layer: ${src})` : ''}`,
        { source: src },
      ));
    }

    for (const key of Object.keys(entry)) {
      if (key === 'maxRounds' || key === 'checkersByRigor') continue;
      if (!ALLOWED_PATTERN_ENTRY_KEYS.has(key)) {
        const src = resolveLayer(layers, name, key) ?? resolveLayer(layers, name);
        problems.push(new CollaborationError(
          'param-unknown',
          `pattern "${name}" has unknown key "${key}"${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }

    if (Object.hasOwn(entry, 'defaults')) {
      if (!entry.defaults || typeof entry.defaults !== 'object' || Array.isArray(entry.defaults)) {
        const src = resolveLayer(layers, name, 'defaults') ?? resolveLayer(layers, name);
        problems.push(new CollaborationError(
          'param-invalid',
          `pattern "${name}" defaults must be an object${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }
    }

    if (Object.hasOwn(entry, 'invariants')) {
      if (!entry.invariants || typeof entry.invariants !== 'object' || Array.isArray(entry.invariants)) {
        const src = resolveLayer(layers, name, 'invariants') ?? resolveLayer(layers, name);
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
  allNames.delete('seatBinding');
  allNames.delete('defaultRule');
  allNames.delete('research-fan-out-gated');

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
        const src = resolveLayer(layers, name, 'loop') ?? resolveLayer(layers, name);
        problems.push(new CollaborationError(
          'pattern-invariant-weakened',
          `pattern "${name}" cannot change shipped loop "${shippedEntry.loop}" to "${effectiveEntry.loop}"${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }

      if (Object.hasOwn(effectiveEntry, 'promise') && effectiveEntry.promise !== shippedEntry.promise) {
        const src = resolveLayer(layers, name, 'promise') ?? resolveLayer(layers, name);
        problems.push(new CollaborationError(
          'pattern-invariant-weakened',
          `pattern "${name}" cannot change shipped promise${src ? ` (source layer: ${src})` : ''}`,
          { source: src },
        ));
      }

      if (shippedEntry.invariants && Object.hasOwn(effectiveEntry, 'invariants') && typeof effectiveEntry.invariants === 'object' && effectiveEntry.invariants !== null && !Array.isArray(effectiveEntry.invariants)) {
        for (const [param, shippedInv] of Object.entries(shippedEntry.invariants)) {
          const src = resolveLayer(layers, name, `invariants.${param}`) ?? resolveLayer(layers, name, 'invariants') ?? resolveLayer(layers, name);

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
      const src = resolveLayer(layers, name);
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
          const src = resolveLayer(layers, name, 'defaults') ?? resolveLayer(layers, name);
          problems.push(new CollaborationError(
            'param-invalid',
            `pattern "${name}" defaults must be an object${src ? ` (source layer: ${src})` : ''}`,
            { source: src },
          ));
        } else {
          for (const [param, val] of Object.entries(mergedEntry.defaults)) {
            const src = resolveLayer(layers, name, `defaults.${param}`) ?? resolveLayer(layers, name);
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
          const src = resolveLayer(layers, name, 'invariants') ?? resolveLayer(layers, name);
          problems.push(new CollaborationError(
            'param-invalid',
            `pattern "${name}" invariants must be an object${src ? ` (source layer: ${src})` : ''}`,
            { source: src },
          ));
        } else {
          for (const [param, inv] of Object.entries(mergedEntry.invariants)) {
            const src = resolveLayer(layers, name, `invariants.${param}`) ?? resolveLayer(layers, name);
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
