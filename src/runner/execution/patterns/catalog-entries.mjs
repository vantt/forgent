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
 * With a source layer the message ends in "(source layer: <layer>)"; `detail` is the sentence without it.
 */
export const CollaborationError = new Proxy(
  class CollaborationError extends Error {
    constructor(code, message, options = {}) {
      let finalCode = code;
      let finalMessage = message;
      let finalSource = options?.source ?? null;
      let finalPath = options?.path ?? null;

      if (typeof code === 'string' && typeof message === 'string') {
        if (code.includes(' ') && !message.includes(' ') && /^[a-z0-9-]+$/.test(message)) {
          finalCode = message;
          finalMessage = code;
        }
      } else if (typeof code === 'string' && !message) {
        finalMessage = code;
      }

      const detail = finalMessage || finalCode;
      super(finalSource ? `${detail} (source layer: ${finalSource})` : detail);
      this.name = 'CollaborationError';
      this.code = finalCode;
      this.detail = detail;
      this.source = finalSource;
      this.path = finalPath;
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
    candidateOrigins = origins.filter(
      (o) => o?.path === fullPath ||
             o?.path?.startsWith(`${fullPath}.`) ||
             o?.path?.startsWith(`${fullPath}[`)
    );
  }
  if (candidateOrigins.length === 0) {
    const patternPath = `runner.patterns.${name}`;
    candidateOrigins = origins.filter(
      (o) => o?.path === patternPath ||
             o?.path?.startsWith(`${patternPath}.`) ||
             o?.path?.startsWith(`${patternPath}[`)
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
  const refuse = (text) => { throw new SeatResolutionError(`${label}: ${text}`, 'seat-multiplicity'); };
  const count = (role) => declaredSeats.filter((d) => d.role === role).length;
  const rejectOtherRoles = (allowed) => {
    for (const d of declaredSeats) {
      if (!allowed(d.role)) refuse(`a ${loop} pattern has no use for a seat with role "${d.role}"`);
    }
  };
  switch (loop) {
    case 'solo':
      if (declaredSeats.length !== 1 || declaredSeats[0].role !== 'producer') {
        refuse('a solo pattern declares exactly one seat, with role "producer"');
      }
      break;
    case 'reviewed': {
      const producers = count('producer');
      if (producers !== 1) refuse(`a reviewed pattern declares exactly one seat with role "producer", has ${producers}`);
      const checkerRoles = new Set(Object.values(CHECKER_SEATS).map((c) => c.role));
      rejectOtherRoles((role) => role === 'producer' || checkerRoles.has(role));
      break;
    }
    case 'panel': {
      const producers = count('producer');
      const synths = count('synthesizer');
      if (producers < 1) refuse(`a panel pattern needs at least one seat with role "producer", has ${producers}`);
      if (synths !== 1) refuse(`a panel pattern needs exactly one seat with role "synthesizer", has ${synths}`);
      rejectOtherRoles((role) => role === 'producer' || role === 'synthesizer');
      break;
    }
    case 'debate': {
      const producers = count('producer');
      const judges = count('judge');
      if (producers !== 2) refuse(`a debate pattern needs exactly 2 seats with role "producer", has ${producers}`);
      if (judges !== 1) refuse(`a debate pattern needs exactly one seat with role "judge", has ${judges}`);
      rejectOtherRoles((role) => role === 'producer' || role === 'judge');
      break;
    }
  }
}

const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const sourceOf = (origins, name, field) => resolveLayer(origins, name, field) ?? resolveLayer(origins, name);

function checkParamDomain(name, loop, param, val, section, src, flag, entry) {
  const at = `pattern "${name}" ${section}.${param}`;
  const basePath = section === 'invariants'
    ? `runner.patterns.${name}.invariants.${param}.fixed`
    : `runner.patterns.${name}.defaults.${param}`;
  switch (param) {
    case 'maxRounds':
      if (!Number.isInteger(val) || val <= 0) {
        flag('param-invalid', `${at} must be a positive integer, got ${JSON.stringify(val)}`, src, basePath);
      }
      break;
    case 'minCheckers':
      if (!Array.isArray(val) || val.length === 0) {
        flag('param-invalid', `${at} must be a non-empty list of checker seat names`, src, basePath);
        break;
      }
      val.forEach((chk, i) => {
        if (typeof chk !== 'string') {
          flag('param-invalid', `${at} checker seat name must be a string, got ${typeof chk === 'object' ? JSON.stringify(chk) : String(chk)}`, src, `${basePath}[${i}]`);
        } else if (!Object.hasOwn(CHECKER_SEATS, chk)) {
          flag('param-invalid', `${at} contains unknown checker seat "${chk}"; valid: [${Object.keys(CHECKER_SEATS).join(', ')}]`, src, `${basePath}[${i}]`);
        }
      });
      break;
    case 'rebuttal':
      if (typeof val !== 'boolean') flag('param-invalid', `${at} must be a boolean, got ${JSON.stringify(val)}`, src, basePath);
      break;
    case 'seats':
      try {
        checkLoopSeatCardinality(loop, checkDeclaredSeats(val, `${at}`), at);
      } catch (err) {
        const code = ['invalid-seats', 'invalid-seat-id', 'invalid-seat-role', 'invalid-seat-tier'].includes(err.code)
          ? 'param-invalid'
          : (err.code ?? 'param-invalid');
        flag(code, `${err.message}`, src, err.at ? `${basePath}${err.at}` : basePath);
      }
      break;
    case 'roleTasks': {
      if (!isPlainObject(val)) {
        flag('param-invalid', `${at} must be an object mapping seat or kind to text`, src, basePath);
        break;
      }
      const allowedTargets = allowedRoleTaskTargets(loop, entry);
      for (const [target, text] of Object.entries(val)) {
        if (typeof text !== 'string') flag('param-invalid', `${at}["${target}"] task text must be a string`, src, `${basePath}.${target}`);
        if (!allowedTargets.has(target)) {
          flag('param-invalid', `${at} target "${target}" does not exist for loop "${loop}" (valid targets: [${Array.from(allowedTargets).join(', ')}])`, src, `${basePath}.${target}`);
        }
      }
      break;
    }
  }
}

/** Reports retired keys, a reserved seatBinding entry, reserved names, non-object entries, unknown entry keys and non-object defaults or invariants. */
function checkDeclaredEntries(patterns, origins, flag) {
  const retiredFindings = detectRetiredPatternKeys(patterns);
  const retiredKeys = new Set(retiredFindings.map((f) => f.key.replace(/^runner\.patterns\./, '')));
  for (const finding of retiredFindings) {
    const name = finding.key.replace(/^runner\.patterns\./, '').split('.')[0];
    flag('config-key-retired', formatRetiredKeySentence(finding), resolveLayer(origins, name), finding.key);
  }
  const sb = Object.hasOwn(patterns, 'seatBinding') ? patterns.seatBinding : null;
  if (sb && typeof sb === 'object' && ['loop', 'promise', 'defaults', 'invariants'].some((k) => Object.hasOwn(sb, k))) {
    flag('config-error', 'runner.patterns.seatBinding uses reserved name "seatBinding" as a pattern name', resolveLayer(origins, 'seatBinding'), 'runner.patterns.seatBinding');
  }

  for (const [name, entry] of Object.entries(patterns)) {
    if (name === 'seatBinding') continue;
    const at = `runner.patterns.${name}`;
    if (RESERVED_PATTERN_NAMES.has(name)) {
      flag('config-error', `"${name}" is a reserved name and cannot be used as a pattern name`, resolveLayer(origins, name), at);
    }
    if (!isPlainObject(entry)) {
      flag('param-invalid', `pattern "${name}" must be an object`, resolveLayer(origins, name), at);
      continue;
    }
    for (const key of Object.keys(entry)) {
      if (!retiredKeys.has(`${name}.${key}`) && !ALLOWED_PATTERN_ENTRY_KEYS.has(key)) {
        flag('param-unknown', `pattern "${name}" has unknown key "${key}"`, sourceOf(origins, name, key), `${at}.${key}`);
      }
    }
    for (const section of ['defaults', 'invariants']) {
      if (Object.hasOwn(entry, section) && !isPlainObject(entry[section])) {
        flag('param-invalid', `pattern "${name}" ${section} must be an object`, sourceOf(origins, name, section), `${at}.${section}`);
      }
    }
  }
}

const ALLOWED_PATTERN_ENTRY_KEYS = new Set(['promise', 'loop', 'defaults', 'invariants']);

/** Shipped entry overlaid by the effective entry's promise, loop, defaults and invariants. */
function mergeEntry(shippedEntry, effectiveEntry, hasEffective) {
  if (shippedEntry && !hasEffective) return deepClone(shippedEntry);
  if (!shippedEntry && hasEffective) return deepClone(effectiveEntry);
  const merged = deepClone(shippedEntry);
  if (Object.hasOwn(effectiveEntry, 'promise')) merged.promise = effectiveEntry.promise;
  if (Object.hasOwn(effectiveEntry, 'loop')) merged.loop = effectiveEntry.loop;
  for (const section of ['defaults', 'invariants']) {
    if (Object.hasOwn(effectiveEntry, section) && isPlainObject(effectiveEntry[section])) {
      merged[section] = Object.assign(Object.create(null), merged[section] ?? {}, deepClone(effectiveEntry[section]));
    }
  }
  return merged;
}

/** An override of a shipped entry may not change its loop or promise, nor drop or change its invariants. */
function checkShippedOverride(name, shippedEntry, effectiveEntry, origins, flag) {
  const at = `runner.patterns.${name}`;
  if (Object.hasOwn(effectiveEntry, 'loop') && effectiveEntry.loop !== shippedEntry.loop) {
    flag('pattern-invariant-weakened', `pattern "${name}" cannot change shipped loop "${shippedEntry.loop}" to "${effectiveEntry.loop}"`, sourceOf(origins, name, 'loop'), `${at}.loop`);
  }
  if (Object.hasOwn(effectiveEntry, 'promise') && effectiveEntry.promise !== shippedEntry.promise) {
    flag('pattern-invariant-weakened', `pattern "${name}" cannot change shipped promise`, sourceOf(origins, name, 'promise'), `${at}.promise`);
  }
  if (!shippedEntry.invariants || !Object.hasOwn(effectiveEntry, 'invariants') || !isPlainObject(effectiveEntry.invariants)) return;

  for (const [param, shippedInv] of Object.entries(shippedEntry.invariants)) {
    const src = resolveLayer(origins, name, `invariants.${param}`) ?? sourceOf(origins, name, 'invariants');
    const weakened = (message, path) => flag('pattern-invariant-weakened', message, src, path);
    const keepAtLeast = `pattern "${name}" invariant for "${param}" must keep atLeast list from shipped entry`;
    const changedFixed = `pattern "${name}" changed or removed fixed invariant for "${param}"`;
    if (Object.keys(effectiveEntry.invariants).length === 0) {
      weakened(shippedInv.atLeast !== undefined ? keepAtLeast : changedFixed, `${at}.invariants`);
      continue;
    }
    const effInv = Object.hasOwn(effectiveEntry.invariants, param) ? effectiveEntry.invariants[param] : undefined;
    if (effInv === undefined) continue;
    if (shippedInv.atLeast !== undefined) {
      if (!effInv || typeof effInv !== 'object' || !Array.isArray(effInv.atLeast)) {
        weakened(keepAtLeast, `${at}.invariants.${param}.atLeast`);
      } else {
        const effSet = new Set(effInv.atLeast);
        for (const required of shippedInv.atLeast) {
          if (!effSet.has(required)) {
            weakened(`pattern "${name}" dropped invariant atLeast element "${required}" for "${param}"`, `${at}.invariants.${param}.atLeast`);
          }
        }
      }
    }
    if (shippedInv.fixed !== undefined && (!effInv || typeof effInv !== 'object' || !deepEqual(effInv.fixed, shippedInv.fixed))) {
      weakened(changedFixed, `${at}.invariants.${param}.fixed`);
    }
  }
}

function checkCustomEntry(name, merged, origins, flag) {
  const src = resolveLayer(origins, name);
  if (!merged.promise || typeof merged.promise !== 'string' || !merged.promise.trim()) {
    flag('param-invalid', `custom pattern "${name}" must declare a non-empty "promise"`, src, `runner.patterns.${name}.promise`);
  }
  if (!merged.loop || !LOOP_NAMES.includes(merged.loop)) {
    flag('param-invalid', `custom pattern "${name}" must declare a valid "loop" from [${LOOP_NAMES.join(', ')}], got: ${JSON.stringify(merged.loop)}`, src, `runner.patterns.${name}.loop`);
  }
}

/** One invariant: exactly one of "atLeast" (minCheckers only) or "fixed" (any parameter but minCheckers). */
function checkInvariantForm(name, loop, param, inv, src, merged, flag) {
  const at = `runner.patterns.${name}.invariants.${param}`;
  const hasAtLeast = Object.hasOwn(inv, 'atLeast');
  const hasFixed = Object.hasOwn(inv, 'fixed');
  if ((!hasAtLeast && !hasFixed) || (hasAtLeast && hasFixed) || Object.keys(inv).length !== 1) {
    flag('param-invalid', `pattern "${name}" invariant for "${param}" must declare exactly one form: "atLeast" or "fixed"`, src, at);
    return;
  }
  if (hasAtLeast) {
    if (param !== 'minCheckers') {
      flag('param-invalid', `pattern "${name}" invariant "atLeast" is only valid for list parameters, got "${param}"`, src, `${at}.atLeast`);
    } else if (!Array.isArray(inv.atLeast) || inv.atLeast.length === 0) {
      flag('param-invalid', `pattern "${name}" invariant atLeast for "${param}" must be a non-empty array of checker seats`, src, `${at}.atLeast`);
    } else {
      inv.atLeast.forEach((chk, i) => {
        if (typeof chk !== 'string') {
          flag('param-invalid', `pattern "${name}" invariant atLeast for "${param}" checker seat name must be a string`, src, `${at}.atLeast[${i}]`);
        } else if (!Object.hasOwn(CHECKER_SEATS, chk)) {
          flag('param-invalid', `pattern "${name}" invariant atLeast "${chk}" is not a valid checker seat [${Object.keys(CHECKER_SEATS).join(', ')}]`, src, `${at}.atLeast[${i}]`);
        }
      });
    }
  }
  if (hasFixed) {
    if (param === 'minCheckers') {
      flag('param-invalid', `pattern "${name}" invariant for list parameter "minCheckers" must use "atLeast", not "fixed"`, src, `${at}.fixed`);
    } else {
      checkParamDomain(name, loop, param, inv.fixed, 'invariants', src, flag, merged);
    }
  }
}

/** Checks the merged entry's defaults and invariants against its loop's parameter table. */
function checkMergedSections(name, merged, origins, flag) {
  const loop = merged.loop;
  const paramTable = paramTableOf(loop) ?? {};
  const at = `runner.patterns.${name}`;
  for (const [section, label] of [['defaults', 'default'], ['invariants', 'invariant']]) {
    if (merged[section] === undefined) continue;
    if (!isPlainObject(merged[section])) {
      flag('param-invalid', `pattern "${name}" ${section} must be an object`, sourceOf(origins, name, section), `${at}.${section}`);
      continue;
    }
    for (const [param, val] of Object.entries(merged[section])) {
      const src = sourceOf(origins, name, `${section}.${param}`);
      if (!Object.hasOwn(paramTable, param)) {
        flag('param-unknown', `pattern "${name}" ${label} parameter "${param}" is not read by loop "${loop}"`, src, `${at}.${section}.${param}`);
        continue;
      }
      if (section === 'defaults') {
        checkParamDomain(name, loop, param, val, 'defaults', src, flag, merged);
      } else if (!isPlainObject(val)) {
        flag('param-invalid', `pattern "${name}" invariant for "${param}" must be an object`, src, `${at}.invariants.${param}`);
      } else {
        checkInvariantForm(name, loop, param, val, src, merged, flag);
      }
    }
  }
}

const setEntry = (entries, name, value) => Object.defineProperty(entries, name, {
  value, writable: true, enumerable: true, configurable: true,
});

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
  const flag = (code, message, source, path) => problems.push(new CollaborationError(code, message, { source, path }));
  checkDeclaredEntries(effectivePatterns, origins, flag);

  const allNames = new Set([...Object.keys(shippedPatterns), ...Object.keys(effectivePatterns)]);
  for (const n of RESERVED_PATTERN_NAMES) allNames.delete(n);
  allNames.delete(RETIRED_GATED_NAME);

  const mergedEntries = Object.create(null);
  for (const name of allNames) {
    const shippedEntry = Object.hasOwn(shippedPatterns, name) ? shippedPatterns[name] : undefined;
    const hasEffective = Object.hasOwn(effectivePatterns, name) && effectivePatterns[name] !== undefined;
    const effectiveEntry = hasEffective ? effectivePatterns[name] : undefined;

    if (hasEffective && !isPlainObject(effectiveEntry)) {
      if (shippedEntry) setEntry(mergedEntries, name, Object.freeze(deepClone(shippedEntry)));
      continue;
    }

    const mergedEntry = mergeEntry(shippedEntry, effectiveEntry, hasEffective);
    if (shippedEntry && hasEffective) checkShippedOverride(name, shippedEntry, effectiveEntry, origins, flag);
    if (!shippedEntry) checkCustomEntry(name, mergedEntry, origins, flag);
    if (mergedEntry.loop && LOOP_NAMES.includes(mergedEntry.loop)) checkMergedSections(name, mergedEntry, origins, flag);
    setEntry(mergedEntries, name, Object.freeze(mergedEntry));
  }

  if (throwOnError && problems.length > 0) throw problems[0];
  return { entries: mergedEntries, merged: mergedEntries, problems };
}
