// src/runner/execution/patterns/catalog.mjs
// Pure domain catalog validation, entry checking, loopOf and resolveCollaboration resolution.
// Architecture guard: pure. No I/O, no clock, no state, no imports from runner/dispatch/.

import {
  CHECKER_SEATS,
  checkDeclaredSeats,
  resolveSeats,
  seatLaunchesOf,
  checkerPlanOf,
} from '../seat-resolver.mjs';
import {
  paramTableOf,
  DEFAULT_MAX_ROUNDS,
  DEFAULT_REBUTTAL,
} from '../loops/index.mjs';
import {
  CollaborationError,
  checkCatalog,
  deepEqual,
  deepClone,
  resolveLayer,
} from './catalog-entries.mjs';

export { CollaborationError, checkCatalog };

/**
 * Returns the loop name for a pattern name from effective configuration, or null if unknown.
 */
export function loopOf(name, options = {}) {
  if (!name || typeof name !== 'string') return null;
  const effective = options?.effective ?? options;
  const patterns = effective?.runner?.patterns ?? effective?.patterns ?? effective;
  if (!patterns || typeof patterns !== 'object') return null;
  const entry = Object.hasOwn(patterns, name) ? patterns[name] : undefined;
  return (entry && typeof entry.loop === 'string') ? entry.loop : null;
}

function checkCarrierDomainValue(key, val, loop, carrierName) {
  const formatVal = (v) => {
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  if (key === 'maxRounds') {
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1) {
      throw new CollaborationError('param-invalid', `parameter "maxRounds" on ${carrierName} must be an integer >= 1, got ${formatVal(val)}`);
    }
  } else if (key === 'minCheckers') {
    if (!Array.isArray(val) || val.some((s) => typeof s !== 'string' || !Object.hasOwn(CHECKER_SEATS, s))) {
      throw new CollaborationError('param-invalid', `parameter "minCheckers" on ${carrierName} must be a list of CHECKER_SEATS names, got ${formatVal(val)}`);
    }
  } else if (key === 'rebuttal') {
    if (typeof val !== 'boolean') {
      throw new CollaborationError('param-invalid', `parameter "rebuttal" on ${carrierName} must be a boolean, got ${formatVal(val)}`);
    }
  } else if (key === 'seats') {
    checkDeclaredSeats(val, `${carrierName}.seats`);
  } else if (key === 'roleTasks') {
    if (!val || typeof val !== 'object' || Array.isArray(val) || Object.values(val).some((v) => typeof v !== 'string')) {
      throw new CollaborationError('param-invalid', `parameter "roleTasks" on ${carrierName} must be a map of string values`);
    }
  }
}

/**
 * Resolves collaboration parameters, seats, launch bounds, and pin for a unit run.
 */
export function resolveCollaboration(options = {}) {
  const {
    unit = {},
    selectors = {},
    request = null,
    inCase = false,
    reason = null,
    runnerConfig = {},
    shipped = {},
    layers = null,
  } = options;

  const { entries } = checkCatalog({ shipped, effective: runnerConfig, layers, throwOnError: true });

  const callerObjPattern = typeof selectors?.callerObject === 'string'
    ? selectors.callerObject
    : (selectors?.callerObject?.pattern && typeof selectors.callerObject.pattern === 'string' ? selectors.callerObject.pattern : null);
  const unitPattern = typeof unit?.pattern === 'string' && unit.pattern
    ? unit.pattern
    : (unit?.pattern?.pattern && typeof unit.pattern.pattern === 'string' ? unit.pattern.pattern : null);
  if (unit?.params !== undefined && (typeof unit.params !== 'object' || unit.params === null || Array.isArray(unit.params))) {
    throw new CollaborationError('param-invalid', 'unit params must be an object');
  }
  if (typeof unit?.pattern === 'object' && unit?.pattern !== null && unit?.pattern?.params !== undefined) {
    if (typeof unit.pattern.params !== 'object' || unit.pattern.params === null || Array.isArray(unit.pattern.params)) {
      throw new CollaborationError('param-invalid', 'unit pattern params must be an object');
    }
  }
  const unitDeclaredParams = Object.create(null);
  if (typeof unit?.pattern === 'object' && unit?.pattern !== null && typeof unit.pattern.params === 'object' && unit.pattern.params !== null && !Array.isArray(unit.pattern.params)) {
    for (const [k, v] of Object.entries(unit.pattern.params)) {
      unitDeclaredParams[k] = v;
    }
  }
  if (unit && typeof unit === 'object') {
    if (unit.seats !== undefined) {
      unitDeclaredParams.seats = unit.seats;
    }
    if (unit.roleTasks !== undefined) {
      unitDeclaredParams.roleTasks = unit.roleTasks;
    }
  }
  if (unit?.params && typeof unit.params === 'object' && !Array.isArray(unit.params)) {
    for (const [k, v] of Object.entries(unit.params)) {
      unitDeclaredParams[k] = v;
    }
  }
  const callerStrPattern = typeof selectors?.callerString === 'string' && selectors.callerString ? selectors.callerString : null;
  const activityPattern = typeof selectors?.activityUnit?.pattern === 'string' && selectors.activityUnit.pattern ? selectors.activityUnit.pattern : null;

  const explicit = [];
  if (callerObjPattern) explicit.push({ name: callerObjPattern, source: 'caller-object', selector: selectors.callerObject });
  if (unitPattern) explicit.push({ name: unitPattern, source: 'unit', selector: unit?.pattern ?? unitPattern });
  if (callerStrPattern) explicit.push({ name: callerStrPattern, source: 'caller-string', selector: callerStrPattern });

  if (explicit.length >= 2) {
    const firstName = explicit[0].name;
    for (let i = 1; i < explicit.length; i++) {
      if (explicit[i].name !== firstName) {
        throw new CollaborationError('selector-conflict', `conflicting explicit selectors: "${firstName}" (${explicit[0].source}) vs "${explicit[i].name}" (${explicit[i].source})`);
      }
    }
  }

  let baseline;
  if (explicit.length > 0) {
    baseline = explicit[0];
  } else if (inCase && activityPattern) {
    baseline = { name: activityPattern, source: 'activity', selector: selectors.activityUnit?.pattern ?? selectors.activityUnit };
  } else {
    baseline = { name: 'solo', source: 'solo', selector: 'solo' };
  }

  const isSwap = Boolean(inCase && activityPattern && explicit.length > 0 && explicit[0].name !== activityPattern);
  const chosenPattern = explicit.length > 0 ? explicit[0].name : baseline.name;

  if (isSwap) {
    baseline = { name: activityPattern, source: 'activity', selector: selectors.activityUnit?.pattern ?? selectors.activityUnit };
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      throw new CollaborationError('request-reason-required', `an explicit pattern swap from "${activityPattern}" to "${chosenPattern}" in a case requires a reason`);
    }
  }

  if (!Object.hasOwn(entries, chosenPattern)) {
    throw new CollaborationError('unknown-pattern', `pattern "${chosenPattern}" is not in the catalog`);
  }
  const entry = entries[chosenPattern];
  const loop = entry.loop;
  const paramTable = paramTableOf(loop);
  if (!paramTable) {
    throw new CollaborationError('unknown-pattern', `loop "${loop}" for pattern "${chosenPattern}" is not supported`);
  }

  let activityEntry = null;
  if (isSwap) {
    if (!Object.hasOwn(entries, activityPattern)) {
      throw new CollaborationError('unknown-pattern', `activity pattern "${activityPattern}" is not in the catalog`);
    }
    activityEntry = entries[activityPattern];
    if (activityEntry.invariants) {
      for (const invParam of Object.keys(activityEntry.invariants)) {
        if (!Object.hasOwn(paramTable, invParam)) {
          throw new CollaborationError('pattern-invariant-weakened', `loop "${loop}" does not read invariant parameter "${invParam}" of activity pattern "${activityPattern}"`);
        }
      }
    }
  }

  const parsedScalars = Object.create(null);
  const seenScalarKeys = new Set();

  if (request !== null && request !== undefined && (typeof request !== 'object' || Array.isArray(request))) {
    throw new CollaborationError('param-invalid', 'request must be an object');
  }

  if (request?.scalars !== undefined) {
    if (typeof request.scalars !== 'object' || request.scalars === null) {
      throw new CollaborationError('param-invalid', 'request scalars must be an array or object');
    }
    const scalarEntries = [];
    if (Array.isArray(request.scalars)) {
      for (const item of request.scalars) {
        if (typeof item === 'string') {
          const eq = item.indexOf('=');
          if (eq < 0) throw new CollaborationError('param-invalid', `scalar parameter "${item}" missing "=" delimiter`);
          scalarEntries.push([item.slice(0, eq), item.slice(eq + 1)]);
        } else if (item && typeof item === 'object') {
          if (Array.isArray(item)) {
            if (item.length === 0 || item.length > 2) {
              throw new CollaborationError('param-invalid', 'scalar array entry must be [key, value]');
            }
            scalarEntries.push([item[0], item[1]]);
          } else if (item.key !== undefined) {
            scalarEntries.push([item.key, item.value]);
          } else {
            const entries = Object.entries(item);
            if (entries.length === 0) {
              throw new CollaborationError('param-invalid', 'scalar object entry cannot be empty');
            }
            for (const [k, v] of entries) scalarEntries.push([k, v]);
          }
        } else {
          throw new CollaborationError('param-invalid', 'scalar item must be a string or object');
        }
      }
    } else {
      for (const [k, v] of Object.entries(request.scalars)) scalarEntries.push([k, v]);
    }

    for (const [rawKey, rawVal] of scalarEntries) {
      if (typeof rawKey !== 'string' || !rawKey) {
        throw new CollaborationError('param-invalid', 'scalar parameter key must be a non-empty string');
      }
      const key = rawKey;
      if (seenScalarKeys.has(key)) throw new CollaborationError('param-request-conflict', `scalar parameter "${key}" was specified more than once`);
      seenScalarKeys.add(key);

      if (request?.params && typeof request.params === 'object' && Object.hasOwn(request.params, key)) {
        throw new CollaborationError('param-request-conflict', `parameter "${key}" was specified in both params and scalars`);
      }
      if (!Object.hasOwn(paramTable, key)) {
        throw new CollaborationError('param-unknown', `unknown parameter "${key}" for loop "${loop}"`);
      }
      const paramDef = paramTable[key];
      if (!paramDef.scalar) {
        throw new CollaborationError('param-invalid', `parameter "${key}" is not a scalar parameter`);
      }
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        throw new CollaborationError('param-invalid', `scalar parameter "${key}" requires a non-empty value`);
      }
      if (typeof rawVal === 'object' || typeof rawVal === 'symbol' || typeof rawVal === 'function') {
        throw new CollaborationError('param-invalid', `scalar parameter "${key}" value must be a scalar, got ${Array.isArray(rawVal) ? 'array' : typeof rawVal}`);
      }

      if (paramDef.type === 'integer') {
        if (typeof rawVal === 'boolean') {
          throw new CollaborationError('param-invalid', `invalid integer scalar "${rawVal}" for parameter "${key}"`);
        }
        if (typeof rawVal === 'number') {
          if (!Number.isInteger(rawVal) || rawVal < 1) {
            throw new CollaborationError('param-invalid', `parameter "${key}" must be an integer >= 1, got ${rawVal}`);
          }
          parsedScalars[key] = rawVal;
        } else {
          const strVal = String(rawVal);
          if (!/^-?[0-9]+$/.test(strVal)) throw new CollaborationError('param-invalid', `invalid integer scalar "${strVal}" for parameter "${key}"`);
          const num = Number(strVal);
          if (!Number.isInteger(num)) throw new CollaborationError('param-invalid', `invalid integer scalar "${strVal}" for parameter "${key}"`);
          if (num < 1) throw new CollaborationError('param-invalid', `parameter "${key}" must be an integer >= 1, got ${num}`);
          parsedScalars[key] = num;
        }
      } else if (paramDef.type === 'boolean') {
        if (typeof rawVal === 'boolean') {
          parsedScalars[key] = rawVal;
        } else if (typeof rawVal === 'string') {
          if (rawVal !== 'true' && rawVal !== 'false') {
            throw new CollaborationError('param-invalid', `invalid boolean scalar "${rawVal}" for parameter "${key}"; must be "true" or "false"`);
          }
          parsedScalars[key] = (rawVal === 'true');
        } else {
          throw new CollaborationError('param-invalid', `invalid boolean scalar "${rawVal}" for parameter "${key}"; must be "true" or "false"`);
        }
      } else {
        if (typeof rawVal === 'boolean') {
          throw new CollaborationError('param-invalid', `parameter "${key}" expects a string literal, got boolean`);
        }
        parsedScalars[key] = String(rawVal);
      }
    }
  }

  const normalizedRequestParams = Object.create(null);
  if (request?.params !== undefined) {
    if (typeof request.params !== 'object' || request.params === null || Array.isArray(request.params)) {
      throw new CollaborationError('param-invalid', 'request params must be an object');
    }
    for (const [key, val] of Object.entries(request.params)) {
      if (key === 'roleTasks') throw new CollaborationError('param-not-requestable', 'roleTasks cannot be requested');
      if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" for loop "${loop}"`);
      checkCarrierDomainValue(key, val, loop, 'request');
      normalizedRequestParams[key] = deepClone(val);
    }
  }

  for (const [key, val] of Object.entries(parsedScalars)) {
    normalizedRequestParams[key] = val;
  }

  const hasRequestParams = Object.keys(normalizedRequestParams).length > 0;
  if (inCase && hasRequestParams && (!reason || typeof reason !== 'string' || !reason.trim())) {
    throw new CollaborationError('request-reason-required', 'a request in a case requires a reason');
  }

  if (selectors?.callerObject && typeof selectors.callerObject === 'object') {
    const callerParams = selectors.callerObject.params;
    if (callerParams !== undefined) {
      if (typeof callerParams !== 'object' || callerParams === null || Array.isArray(callerParams)) {
        throw new CollaborationError('param-invalid', 'caller object params must be an object');
      }
      for (const [key, val] of Object.entries(callerParams)) {
        if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" in caller object for loop "${loop}"`);
        checkCarrierDomainValue(key, val, loop, 'caller object');
      }
    }
  }

  if (typeof unit?.pattern === 'object' && unit?.pattern !== null && unit.pattern.params !== undefined && typeof unit.pattern.params === 'object' && unit.pattern.params !== null && !Array.isArray(unit.pattern.params)) {
    for (const [key, val] of Object.entries(unit.pattern.params)) {
      if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" in unit pattern for loop "${loop}"`);
      checkCarrierDomainValue(key, val, loop, 'unit pattern');
    }
  }

  if (unit?.params !== undefined && typeof unit.params === 'object' && unit.params !== null && !Array.isArray(unit.params)) {
    for (const [key, val] of Object.entries(unit.params)) {
      if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" in unit for loop "${loop}"`);
      checkCarrierDomainValue(key, val, loop, 'unit');
    }
  }

  if (unit && typeof unit === 'object') {
    if (unit.seats !== undefined) {
      if (!Object.hasOwn(paramTable, 'seats')) throw new CollaborationError('param-unknown', `unknown parameter "seats" in unit for loop "${loop}"`);
      checkCarrierDomainValue('seats', unit.seats, loop, 'unit');
    }
    if (unit.roleTasks !== undefined) {
      if (!Object.hasOwn(paramTable, 'roleTasks')) throw new CollaborationError('param-unknown', `unknown parameter "roleTasks" in unit for loop "${loop}"`);
      checkCarrierDomainValue('roleTasks', unit.roleTasks, loop, 'unit');
    }
  }

  const actDeclaredParams = Object.create(null);
  if (selectors?.activityUnit && typeof selectors.activityUnit === 'object') {
    const actParams = selectors.activityUnit.params;
    if (actParams !== undefined) {
      if (typeof actParams !== 'object' || actParams === null || Array.isArray(actParams)) {
        throw new CollaborationError('param-invalid', 'activity unit params must be an object');
      }
      for (const [k, v] of Object.entries(actParams)) {
        actDeclaredParams[k] = v;
      }
    }
    if (selectors.activityUnit.seats !== undefined && !Object.hasOwn(actDeclaredParams, 'seats')) {
      actDeclaredParams.seats = selectors.activityUnit.seats;
    }
    if (selectors.activityUnit.roleTasks !== undefined && !Object.hasOwn(actDeclaredParams, 'roleTasks')) {
      actDeclaredParams.roleTasks = selectors.activityUnit.roleTasks;
    }

    const actPattern = typeof selectors.activityUnit.pattern === 'string' && selectors.activityUnit.pattern
      ? selectors.activityUnit.pattern
      : null;
    let actLoop = 'solo';
    let actTable = paramTableOf('solo');
    if (actPattern) {
      if (!Object.hasOwn(entries, actPattern)) {
        throw new CollaborationError('unknown-pattern', `activity pattern "${actPattern}" is not in the catalog`);
      }
      actLoop = entries[actPattern].loop;
      actTable = paramTableOf(actLoop);
    }
    for (const [key, val] of Object.entries(actDeclaredParams)) {
      if (!actTable || !Object.hasOwn(actTable, key)) {
        throw new CollaborationError('param-unknown', `unknown parameter "${key}" in activity unit for loop "${actLoop}"`);
      }
      checkCarrierDomainValue(key, val, actLoop, 'activity unit');
    }
  }

  const effectiveParams = Object.create(null);
  const provenanceParams = Object.create(null);
  const loopConfig = runnerConfig?.loops?.[loop] ?? runnerConfig?.runner?.loops?.[loop] ?? {};

  for (const param of Object.keys(paramTable)) {
    let winningVal;
    let winningSlot;

    if (Object.hasOwn(normalizedRequestParams, param)) {
      winningVal = normalizedRequestParams[param];
      winningSlot = 'request';
    } else if (selectors?.callerObject?.params && Object.hasOwn(selectors.callerObject.params, param)) {
      winningVal = deepClone(selectors.callerObject.params[param]);
      winningSlot = 'selector';
    } else if (param === 'seats' && Object.hasOwn(unitDeclaredParams, 'seats')) {
      winningVal = deepClone(unitDeclaredParams.seats);
      winningSlot = 'unit';
    } else if (baseline.source === 'activity' && !isSwap && Object.hasOwn(actDeclaredParams, param)) {
      winningVal = deepClone(actDeclaredParams[param]);
      winningSlot = 'activity';
    } else if (Object.hasOwn(unitDeclaredParams, param)) {
      winningVal = deepClone(unitDeclaredParams[param]);
      winningSlot = 'unit';
    } else if (entry.defaults && Object.hasOwn(entry.defaults, param)) {
      winningVal = deepClone(entry.defaults[param]);
      winningSlot = 'pattern-default';
    } else if (loopConfig && Object.hasOwn(loopConfig, param)) {
      winningVal = deepClone(loopConfig[param]);
      winningSlot = 'config';
    } else if (loop === 'reviewed' && param === 'maxRounds') {
      winningVal = DEFAULT_MAX_ROUNDS;
      winningSlot = 'builtin';
    } else if (loop === 'debate' && param === 'rebuttal') {
      winningVal = DEFAULT_REBUTTAL;
      winningSlot = 'builtin';
    }

    if (winningSlot !== undefined) {
      effectiveParams[param] = winningVal;
      provenanceParams[param] = winningSlot;
    }
  }

  const floorCheckers = [];
  const floorCheckerNames = new Set();

  if (entry.invariants?.minCheckers?.atLeast) {
    for (const c of entry.invariants.minCheckers.atLeast) {
      floorCheckers.push({ name: c, source: `pattern-invariant:${chosenPattern}` });
      floorCheckerNames.add(c);
    }
  }
  if (isSwap && activityEntry?.invariants?.minCheckers?.atLeast) {
    for (const c of activityEntry.invariants.minCheckers.atLeast) {
      floorCheckers.push({ name: c, source: `pattern-invariant:${activityPattern}` });
      floorCheckerNames.add(c);
    }
  }

  if (floorCheckerNames.size > 0 && Object.hasOwn(paramTable, 'minCheckers')) {
    const list = Array.isArray(effectiveParams.minCheckers) ? [...effectiveParams.minCheckers] : [];
    for (const c of floorCheckerNames) {
      if (!list.includes(c)) list.push(c);
    }
    effectiveParams.minCheckers = list;
    if (provenanceParams.minCheckers === undefined) provenanceParams.minCheckers = 'pattern-invariant';
  }

  if (entry.invariants) {
    for (const [param, inv] of Object.entries(entry.invariants)) {
      if (inv.fixed !== undefined) {
        if (effectiveParams[param] !== undefined && !deepEqual(effectiveParams[param], inv.fixed)) {
          if (provenanceParams[param] === 'request' || provenanceParams[param] === 'selector' || provenanceParams[param] === 'unit' || provenanceParams[param] === 'activity') {
            throw new CollaborationError('pattern-invariant-weakened', `parameter "${param}" violates fixed invariant on pattern "${chosenPattern}"`);
          }
        }
        effectiveParams[param] = deepClone(inv.fixed);
        provenanceParams[param] = 'pattern-invariant';
      }
    }
  }
  if (isSwap && activityEntry?.invariants) {
    for (const [param, inv] of Object.entries(activityEntry.invariants)) {
      if (inv.fixed !== undefined) {
        if (effectiveParams[param] !== undefined && !deepEqual(effectiveParams[param], inv.fixed)) {
          throw new CollaborationError('pattern-invariant-weakened', `parameter "${param}" violates fixed invariant on activity pattern "${activityPattern}"`);
        }
        effectiveParams[param] = deepClone(inv.fixed);
        provenanceParams[param] = 'pattern-invariant';
      }
    }
  }

  const bounds = loopConfig?.bounds;
  if (bounds && typeof bounds === 'object') {
    for (const [param, bound] of Object.entries(bounds)) {
      if (provenanceParams[param] === 'request' && effectiveParams[param] !== undefined) {
        const val = effectiveParams[param];
        if (typeof val === 'number' && bound && typeof bound === 'object') {
          if (bound.min !== undefined && val < bound.min) {
            throw new CollaborationError('param-out-of-bounds', `requested "${param}" (${val}) is below loop bound min (${bound.min})`);
          }
          if (bound.max !== undefined && val > bound.max) {
            throw new CollaborationError('param-out-of-bounds', `requested "${param}" (${val}) is above loop bound max (${bound.max})`);
          }
        }
      }
    }
  }

  const floors = floorCheckers.length > 0 ? { minCheckers: floorCheckers } : undefined;
  const seats = resolveSeats({
    loop,
    params: effectiveParams,
    floors,
    unit,
    runnerConfig,
    slot: provenanceParams.minCheckers,
  });

  const launchBound = seatLaunchesOf({
    loop,
    params: effectiveParams,
    floors,
    unit,
    runnerConfig,
    slot: provenanceParams.minCheckers,
  });

  const postures = Object.create(null);
  for (const s of seats) {
    if (s.seat && s.posture) postures[s.seat] = s.posture;
  }

  const checkersProvenance = Object.create(null);
  if (loop === 'reviewed') {
    const plan = checkerPlanOf(unit, runnerConfig, {
      requested: effectiveParams.minCheckers,
      floors,
      slot: provenanceParams.minCheckers,
    });
    for (const p of plan) {
      const inv = p.contributions.find((c) => c.startsWith('pattern-invariant:'));
      const cap = p.contributions.find((c) => c.startsWith('capability:'));
      const def = p.contributions.find((c) => c === 'code:default-red-team');
      const rig = p.contributions.find((c) => c.startsWith('rigor:'));
      checkersProvenance[p.seat] = inv ?? cap ?? def ?? rig ?? p.contributions[p.contributions.length - 1] ?? 'request';
    }
  }

  let layerName = null;
  if (layers) layerName = resolveLayer(layers, chosenPattern);
  if (!layerName) {
    const shippedEntry = shipped?.patterns?.[chosenPattern] ?? shipped?.[chosenPattern];
    layerName = (shippedEntry && deepEqual(entry, shippedEntry)) ? 'shipped' : 'project';
  }

  const hasRequest = Boolean(isSwap || hasRequestParams);
  const pin = {
    requested: hasRequest ? {
      pattern: isSwap ? chosenPattern : null,
      params: normalizedRequestParams,
      reason: reason ? String(reason).trim() : null,
    } : null,
    baseline: {
      source: baseline.source,
      selector: baseline.selector,
    },
    pattern: {
      name: chosenPattern,
      layer: layerName,
    },
    effective: {
      loop,
      params: effectiveParams,
      seats,
      postures,
      roleTasks: effectiveParams.roleTasks ?? entry.defaults?.roleTasks ?? {},
      launchBound,
    },
    provenance: {
      params: provenanceParams,
      checkers: checkersProvenance,
    },
  };

  return {
    loop,
    params: effectiveParams,
    seats,
    roleTasks: effectiveParams.roleTasks ?? entry.defaults?.roleTasks ?? {},
    launchBound,
    entry,
    pin,
  };
}
