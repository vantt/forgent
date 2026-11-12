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

const invalid = (message) => new CollaborationError('param-invalid', message);
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const nonEmptyString = (v) => (typeof v === 'string' && v ? v : null);
const hasReason = (reason) => typeof reason === 'string' && reason.trim() !== '';

function requirePlainObject(value, message) {
  if (value !== undefined && !isPlainObject(value)) throw invalid(message);
}

/** Checks each declared key against the loop's parameter table and its value domain. */
function checkCarrierParams(params, table, loop, carrier) {
  for (const [key, val] of Object.entries(params)) {
    if (!table || !Object.hasOwn(table, key)) {
      throw new CollaborationError('param-unknown', `unknown parameter "${key}" in ${carrier} for loop "${loop}"`);
    }
    checkCarrierDomainValue(key, val, loop, carrier);
  }
}

/** Seats and role tasks a unit or activity declares beside its params object. */
function loosePartsOf(carrier) {
  const parts = Object.create(null);
  for (const key of ['seats', 'roleTasks']) {
    if (carrier[key] !== undefined) parts[key] = carrier[key];
  }
  return parts;
}

/** Picks the baseline and the explicit selection from the caller, unit and activity selectors. */
function selectPattern({ unit, selectors, inCase }) {
  const callerObjPattern = nonEmptyString(selectors?.callerObject) ?? nonEmptyString(selectors?.callerObject?.pattern);
  const unitPattern = nonEmptyString(unit?.pattern) ?? nonEmptyString(unit?.pattern?.pattern);
  const callerStrPattern = nonEmptyString(selectors?.callerString);
  const activityPattern = nonEmptyString(selectors?.activityUnit?.pattern);

  const explicit = [];
  if (callerObjPattern) explicit.push({ name: callerObjPattern, source: 'caller-object', selector: selectors.callerObject });
  if (unitPattern) explicit.push({ name: unitPattern, source: 'unit', selector: unit?.pattern ?? unitPattern });
  if (callerStrPattern) explicit.push({ name: callerStrPattern, source: 'caller-string', selector: callerStrPattern });
  for (const other of explicit.slice(1)) {
    if (other.name !== explicit[0].name) {
      throw new CollaborationError('selector-conflict', `conflicting explicit selectors: "${explicit[0].name}" (${explicit[0].source}) vs "${other.name}" (${other.source})`);
    }
  }

  const activityBaseline = activityPattern
    ? { name: activityPattern, source: 'activity', selector: selectors.activityUnit?.pattern ?? selectors.activityUnit }
    : null;
  const isSwap = Boolean(inCase && activityPattern && explicit.length > 0 && explicit[0].name !== activityPattern);
  const selectedName = explicit.length > 0 ? explicit[0].name : (inCase && activityPattern ? activityPattern : 'solo');
  let baseline = explicit[0] ?? (inCase && activityBaseline ? activityBaseline : { name: 'solo', source: 'solo', selector: 'solo' });
  if (isSwap) {
    baseline = activityBaseline;
  }
  return { baseline, selectedName, isSwap, activityPattern };
}

function entryNamed(entries, name, label) {
  if (!Object.hasOwn(entries, name)) {
    throw new CollaborationError('unknown-pattern', `${label} "${name}" is not in the catalog`);
  }
  return entries[name];
}

function parseScalarValue(key, rawVal, paramDef) {
  if (paramDef.type === 'integer') {
    if (typeof rawVal === 'boolean') throw invalid(`invalid integer scalar "${rawVal}" for parameter "${key}"`);
    if (typeof rawVal === 'number') {
      if (!Number.isInteger(rawVal) || rawVal < 1) throw invalid(`parameter "${key}" must be an integer >= 1, got ${rawVal}`);
      return rawVal;
    }
    const strVal = String(rawVal);
    if (!/^-?[0-9]+$/.test(strVal) || !Number.isInteger(Number(strVal))) throw invalid(`invalid integer scalar "${strVal}" for parameter "${key}"`);
    const num = Number(strVal);
    if (num < 1) throw invalid(`parameter "${key}" must be an integer >= 1, got ${num}`);
    return num;
  }
  if (paramDef.type === 'boolean') {
    if (typeof rawVal === 'boolean') return rawVal;
    if (rawVal === 'true' || rawVal === 'false') return rawVal === 'true';
    throw invalid(`invalid boolean scalar "${rawVal}" for parameter "${key}"; must be "true" or "false"`);
  }
  if (typeof rawVal === 'boolean') throw invalid(`parameter "${key}" expects a string literal, got boolean`);
  return String(rawVal);
}

/** Flattens the accepted scalar spellings (key=value strings, pairs, key/value objects, a map) into [key, value] pairs. */
function scalarPairsOf(scalars) {
  if (!Array.isArray(scalars)) return Object.entries(scalars);
  const pairs = [];
  for (const item of scalars) {
    if (typeof item === 'string') {
      const eq = item.indexOf('=');
      if (eq < 0) throw invalid(`scalar parameter "${item}" missing "=" delimiter`);
      pairs.push([item.slice(0, eq), item.slice(eq + 1)]);
    } else if (Array.isArray(item)) {
      if (item.length === 0 || item.length > 2) throw invalid('scalar array entry must be [key, value]');
      pairs.push([item[0], item[1]]);
    } else if (item && typeof item === 'object') {
      if (item.key !== undefined) {
        pairs.push([item.key, item.value]);
      } else {
        const own = Object.entries(item);
        if (own.length === 0) throw invalid('scalar object entry cannot be empty');
        pairs.push(...own);
      }
    } else {
      throw invalid('scalar item must be a string or object');
    }
  }
  return pairs;
}

function parseRequestScalars(request, paramTable, loop) {
  const parsed = Object.create(null);
  if (request?.scalars === undefined) return parsed;
  if (typeof request.scalars !== 'object' || request.scalars === null) throw invalid('request scalars must be an array or object');
  for (const [key, rawVal] of scalarPairsOf(request.scalars)) {
    if (typeof key !== 'string' || !key) throw invalid('scalar parameter key must be a non-empty string');
    if (Object.hasOwn(parsed, key)) throw new CollaborationError('param-request-conflict', `scalar parameter "${key}" was specified more than once`);
    if (request?.params && typeof request.params === 'object' && Object.hasOwn(request.params, key)) {
      throw new CollaborationError('param-request-conflict', `parameter "${key}" was specified in both params and scalars`);
    }
    if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" for loop "${loop}"`);
    const paramDef = paramTable[key];
    if (!paramDef.scalar) throw invalid(`parameter "${key}" is not a scalar parameter`);
    if (rawVal === undefined || rawVal === null || rawVal === '') throw invalid(`scalar parameter "${key}" requires a non-empty value`);
    if (typeof rawVal === 'object' || typeof rawVal === 'symbol' || typeof rawVal === 'function') {
      throw invalid(`scalar parameter "${key}" value must be a scalar, got ${Array.isArray(rawVal) ? 'array' : typeof rawVal}`);
    }
    parsed[key] = parseScalarValue(key, rawVal, paramDef);
  }
  return parsed;
}

/** Validates the request and returns its params with scalars folded in. */
function normalizeRequest(request, paramTable, loop) {
  if (request !== null && request !== undefined && !isPlainObject(request)) throw invalid('request must be an object');
  const parsedScalars = parseRequestScalars(request, paramTable, loop);
  const normalized = Object.create(null);
  if (request?.params !== undefined) {
    if (!isPlainObject(request.params)) throw invalid('request params must be an object');
    for (const [key, val] of Object.entries(request.params)) {
      if (key === 'roleTasks') throw new CollaborationError('param-not-requestable', 'roleTasks cannot be requested');
      if (!Object.hasOwn(paramTable, key)) throw new CollaborationError('param-unknown', `unknown parameter "${key}" for loop "${loop}"`);
      checkCarrierDomainValue(key, val, loop, 'request');
      normalized[key] = deepClone(val);
    }
  }
  return Object.assign(normalized, parsedScalars);
}

/** Validates the activity unit's params against its own loop and returns them with its loose seats and role tasks. */
function activityDeclaredParamsOf(activityUnit, entries) {
  const declared = Object.create(null);
  if (!activityUnit || typeof activityUnit !== 'object') return declared;
  requirePlainObject(activityUnit.params, 'activity unit params must be an object');
  Object.assign(declared, activityUnit.params);
  for (const [key, val] of Object.entries(loosePartsOf(activityUnit))) {
    if (!Object.hasOwn(declared, key)) declared[key] = val;
  }
  const actPattern = nonEmptyString(activityUnit.pattern);
  const actLoop = actPattern ? entryNamed(entries, actPattern, 'activity pattern').loop : 'solo';
  checkCarrierParams(declared, paramTableOf(actLoop), actLoop, 'activity unit');
  return declared;
}

/** The parameter winning slot for each loop parameter, from request down to built-in defaults. */
function layerParams({ paramTable, loop, entry, loopConfig, requestParams, selectors, unitDeclared, activityDeclared, activityBaseline }) {
  const effective = Object.create(null);
  const provenance = Object.create(null);
  const take = (param, value, slot) => { effective[param] = value; provenance[param] = slot; };
  const calleeParams = selectors?.callerObject?.params;
  for (const param of Object.keys(paramTable)) {
    if (Object.hasOwn(requestParams, param)) take(param, requestParams[param], 'request');
    else if (calleeParams && Object.hasOwn(calleeParams, param)) take(param, deepClone(calleeParams[param]), 'selector');
    else if (param === 'seats' && Object.hasOwn(unitDeclared, 'seats')) take(param, deepClone(unitDeclared.seats), 'unit');
    else if (activityBaseline && Object.hasOwn(activityDeclared, param)) take(param, deepClone(activityDeclared[param]), 'activity');
    else if (Object.hasOwn(unitDeclared, param)) take(param, deepClone(unitDeclared[param]), 'unit');
    else if (entry.defaults && Object.hasOwn(entry.defaults, param)) take(param, deepClone(entry.defaults[param]), 'pattern-default');
    else if (loopConfig && Object.hasOwn(loopConfig, param)) take(param, deepClone(loopConfig[param]), 'config');
    else if (loop === 'debate' && param === 'rebuttal') take(param, DEFAULT_REBUTTAL, 'builtin');
  }
  return { effective, provenance };
}

/** Pins every fixed invariant; a violation throws only when the clashing value came from a slot in `weakeningSlots` (any slot when null). */
function applyFixedInvariants(invariants, effective, provenance, label, weakeningSlots) {
  for (const [param, inv] of Object.entries(invariants ?? {})) {
    if (inv.fixed === undefined) continue;
    if (effective[param] !== undefined && !deepEqual(effective[param], inv.fixed)
      && (!weakeningSlots || weakeningSlots.includes(provenance[param]))) {
      throw new CollaborationError('pattern-invariant-weakened', `parameter "${param}" violates fixed invariant on ${label}`);
    }
    effective[param] = deepClone(inv.fixed);
    provenance[param] = 'pattern-invariant';
  }
}

function checkRequestedBounds(bounds, effective, provenance) {
  if (!bounds || typeof bounds !== 'object') return;
  for (const [param, bound] of Object.entries(bounds)) {
    const val = effective[param];
    if (provenance[param] !== 'request' || typeof val !== 'number' || !bound || typeof bound !== 'object') continue;
    if (bound.min !== undefined && val < bound.min) {
      throw new CollaborationError('param-out-of-bounds', `requested "${param}" (${val}) is below loop bound min (${bound.min})`);
    }
    if (bound.max !== undefined && val > bound.max) {
      throw new CollaborationError('param-out-of-bounds', `requested "${param}" (${val}) is above loop bound max (${bound.max})`);
    }
  }
}

function checkersProvenanceOf(plan) {
  const provenance = Object.create(null);
  for (const p of plan) {
    const by = (test) => p.contributions.find(test);
    provenance[p.seat] = by((c) => c.startsWith('pattern-invariant:')) ?? by((c) => c.startsWith('capability:'))
      ?? by((c) => c === 'code:default-red-team') ?? by((c) => c.startsWith('rigor:'))
      ?? p.contributions[p.contributions.length - 1] ?? 'request';
  }
  return provenance;
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
    origins = null,
  } = options;

  // A runner config without a patterns section declares no patterns of its own; it must never be read as the map itself.
  const { entries } = checkCatalog({
    shipped: shipped?.patterns,
    effective: runnerConfig?.runner?.patterns ?? runnerConfig?.patterns ?? {},
    origins,
    throwOnError: true,
  });

  requirePlainObject(unit?.params, 'unit params must be an object');
  const unitPatternObject = isPlainObject(unit?.pattern) ? unit.pattern : null;
  requirePlainObject(unitPatternObject?.params, 'unit pattern params must be an object');
  const unitDeclared = Object.assign(Object.create(null), unitPatternObject?.params, unit && typeof unit === 'object' ? loosePartsOf(unit) : null, unit?.params);

  const { baseline, selectedName, isSwap, activityPattern } = selectPattern({ unit, selectors, inCase });
  const entry = entryNamed(entries, selectedName, 'pattern');
  const loop = entry.loop;
  const paramTable = paramTableOf(loop);
  if (!paramTable) throw new CollaborationError('unknown-pattern', `loop "${loop}" for pattern "${selectedName}" is not supported`);

  let activityEntry = null;
  if (isSwap) {
    activityEntry = entryNamed(entries, activityPattern, 'activity pattern');
    for (const invParam of Object.keys(activityEntry.invariants ?? {})) {
      if (!Object.hasOwn(paramTable, invParam)) {
        throw new CollaborationError('pattern-invariant-weakened', `loop "${loop}" does not read invariant parameter "${invParam}" of activity pattern "${activityPattern}"`);
      }
    }
  }

  const requestParams = normalizeRequest(request, paramTable, loop);
  const hasRequestParams = Object.keys(requestParams).length > 0;
  if (inCase && hasRequestParams && !hasReason(reason)) {
    throw new CollaborationError('request-reason-required', 'a request in a case requires a reason');
  }

  const callerParams = selectors?.callerObject && typeof selectors.callerObject === 'object' ? selectors.callerObject.params : undefined;
  requirePlainObject(callerParams, 'caller object params must be an object');
  checkCarrierParams(callerParams ?? {}, paramTable, loop, 'caller object');
  checkCarrierParams(unitPatternObject?.params ?? {}, paramTable, loop, 'unit pattern');
  checkCarrierParams(unit?.params ?? {}, paramTable, loop, 'unit');
  checkCarrierParams(unit && typeof unit === 'object' ? loosePartsOf(unit) : {}, paramTable, loop, 'unit');
  const activityDeclared = activityDeclaredParamsOf(selectors?.activityUnit, entries);

  const loopConfig = runnerConfig?.loops?.[loop] ?? runnerConfig?.runner?.loops?.[loop] ?? {};
  const { effective: effectiveParams, provenance: provenanceParams } = layerParams({
    paramTable, loop, entry, loopConfig, requestParams, selectors, unitDeclared, activityDeclared,
    activityBaseline: baseline.source === 'activity' && !isSwap,
  });

  const floorCheckers = [];
  const addFloors = (e, name) => {
    for (const c of e?.invariants?.minCheckers?.atLeast ?? []) floorCheckers.push({ name: c, source: `pattern-invariant:${name}` });
  };
  addFloors(entry, selectedName);
  if (isSwap) addFloors(activityEntry, activityPattern);
  if (floorCheckers.length > 0 && Object.hasOwn(paramTable, 'minCheckers')) {
    const list = Array.isArray(effectiveParams.minCheckers) ? [...effectiveParams.minCheckers] : [];
    for (const { name } of floorCheckers) {
      if (!list.includes(name)) list.push(name);
    }
    effectiveParams.minCheckers = list;
    provenanceParams.minCheckers ??= 'pattern-invariant';
  }

  applyFixedInvariants(entry.invariants, effectiveParams, provenanceParams, `pattern "${selectedName}"`, ['request', 'selector', 'unit', 'activity']);
  if (isSwap) applyFixedInvariants(activityEntry.invariants, effectiveParams, provenanceParams, `activity pattern "${activityPattern}"`, null);
  checkRequestedBounds(loopConfig?.bounds, effectiveParams, provenanceParams);

  const seatInput = {
    loop,
    params: effectiveParams,
    floors: floorCheckers.length > 0 ? { minCheckers: floorCheckers } : undefined,
    unit,
    runnerConfig,
    slot: provenanceParams.minCheckers,
    shippedCheckersByRigor: shipped?.loops?.reviewed?.checkersByRigor,
  };
  const seats = resolveSeats(seatInput);
  const launchBound = seatLaunchesOf(seatInput);

  const postures = Object.create(null);
  for (const s of seats) {
    if (s.seat && s.posture) postures[s.seat] = s.posture;
  }
  const checkersProvenance = loop === 'reviewed'
    ? checkersProvenanceOf(checkerPlanOf(unit, runnerConfig, {
      requested: effectiveParams.minCheckers,
      floors: seatInput.floors,
      slot: provenanceParams.minCheckers,
      shippedCheckersByRigor: seatInput.shippedCheckersByRigor,
    }))
    : Object.create(null);

  let layerName = origins ? resolveLayer(origins, selectedName) : null;
  if (!layerName) {
    const shippedEntry = shipped?.patterns?.[selectedName];
    layerName = (shippedEntry && deepEqual(entry, shippedEntry)) ? 'shipped' : 'project';
  }
  const roleTasks = effectiveParams.roleTasks ?? entry.defaults?.roleTasks ?? {};
  const hasRequest = Boolean(isSwap || hasRequestParams);
  const pin = {
    requested: hasRequest ? {
      pattern: isSwap ? selectedName : null,
      params: requestParams,
      reason: reason ? String(reason).trim() : null,
    } : null,
    baseline: { source: baseline.source, selector: baseline.selector },
    pattern: { name: selectedName, layer: layerName },
    effective: { loop, params: effectiveParams, seats, postures, roleTasks, launchBound },
    provenance: { params: provenanceParams, checkers: checkersProvenance },
  };

  return { loop, params: effectiveParams, seats, roleTasks, launchBound, entry, pin };
}
