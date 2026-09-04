// team-cognition/aggregation-evaluator.mjs — the Team Cognition Engine's
// minimal evaluator skeleton (Phase 07 / MVP7, cells P07.1 + P07.2).
//
// Scope, per phase-07-mvp7-evidence-preserving-aggregation.md and
// current-cell.md's P07.1/P07.2 sections:
//   - Validate structured source coverage: every declared
//     `sourceOperationRef` resolves to at least one supplied `sources[]`
//     entry, and no supplied entry names an operation ref that was never
//     declared (an "unresolved" source ref). (P07.1)
//   - Validate required disclosures: every supplied source's `disclosures`
//     object carries a defined value for every id in `requiredDisclosures`.
//     (P07.1)
//   - Validate that every disclosure VALUE is at least well-typed, not
//     merely present. (P07.2)
//   - Compare a supplied `revision` against a caller-supplied "current
//     revision" reference map to detect staleness -- this evaluator still
//     has no session/store access (P07.3 integration concern), so
//     currency is checked only against a pure-function input, never a
//     live lookup. (P07.2)
//   - Cross-reference disclosed dissent against a caller-declared
//     `dissentRefs[]` list, rejecting hidden dissent and tracking
//     unresolved dissent. (P07.2)
//   - Classify one deterministic outcome (`consensus | qualified |
//     no-consensus`) from the checks above -- never a vote, rank tally,
//     weighted score, or convergence engine (plan.md Non-Negotiable
//     Deferrals). (P07.2)
//
// Explicitly OUT of scope (left to later Phase 07 cells):
//   - Missing/failed-actor accounting.
//   - Any FlowDefinition/CoordinationSession integration (P07.3, Wave 3).
//
// Hard constraint (component-authority-boundary-map.md §6, Team Cognition
// Engine "Must not own"): this module never rewrites evidence, never alters
// RunResult confidence, never dispatches work, and never transitions a
// CoordinationSession. It is a pure function -- given refs + disclosures,
// it returns a validation result. It imports nothing from
// src/runner/coordination/ (session-engine.mjs, store.mjs included) and
// nothing that dispatches or mutates session state.

import {
  validateSourceOperationRefs,
  validateSources,
  validateRequiredDisclosures,
  validateDissentRefs,
  validateCurrentRevisions,
  isNonEmptyString,
} from './schema.mjs';

// Object.freeze() on a Map does not block .set()/.delete()/.clear() -- those
// go through internal slots, not ordinary property assignment, so freezing
// the Map object alone is not real immutability. Wrap it in a Proxy that
// throws on any mutator instead, after freezing each array value it holds.
const MAP_MUTATOR_METHODS = new Set(['set', 'delete', 'clear']);

// `bySourceOperationRef` must never let a caller reach the caller's own
// `sources[]` object references and mutate them in place (`revision` is
// schema.mjs's own immutability pin -- the exact field this exists to
// protect). Freezing the array container alone (see `freezeCoverageMap`)
// only blocks push/pop/index-reassignment on the array; it does nothing for
// the objects the array holds if those are the caller's own references. So
// this snapshots each source into an independent, deep-frozen copy -- the
// caller's original `sources[]` entries are never touched (freezing them in
// place would itself be a form of input mutation, the exact thing this
// module's own Bug Taxonomy forbids).
function freezeSourceSnapshot(source) {
  return Object.freeze({ ...source, disclosures: Object.freeze({ ...source.disclosures }) });
}

function freezeCoverageMap(map) {
  for (const value of map.values()) Object.freeze(value);
  return new Proxy(map, {
    get(target, prop, receiver) {
      if (MAP_MUTATOR_METHODS.has(prop)) {
        return () => {
          throw new TypeError('team-cognition: bySourceOperationRef is immutable');
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set() {
      throw new TypeError('team-cognition: bySourceOperationRef is immutable');
    },
    deleteProperty() {
      throw new TypeError('team-cognition: bySourceOperationRef is immutable');
    },
  });
}

/**
 * @typedef {object} AggregationSource
 * @property {string} sourceOperationRef Which declared source operation this entry satisfies.
 * @property {string} assignmentId
 * @property {string} runId
 * @property {string} artifactRef Immutable artifact reference.
 * @property {string} revision Revision pin proving the ref is immutable, not a live/mutable pointer.
 * @property {Object<string, unknown>} disclosures Map of disclosure id -> disclosed value.
 */

/**
 * Validate structured source coverage: every entry in `sourceOperationRefs`
 * (candidate contract: `completion.aggregation.sourceOperationRefs[]`) must
 * resolve to at least one entry in `sources`, and every `sources[]` entry
 * must name a `sourceOperationRef` that was actually declared.
 *
 * Pure: throws `AggregationError` only on malformed input shape (via
 * schema.mjs); a coverage gap is reported in the returned result, not
 * thrown, since "some sources are missing" is an ordinary validation
 * outcome an evaluator caller inspects, not a programmer error.
 *
 * @param {string[]} sourceOperationRefs
 * @param {AggregationSource[]} sources
 * @returns {{
 *   ok: boolean,
 *   missingSourceOperationRefs: string[],
 *   unresolvedSourceRefs: string[],
 *   bySourceOperationRef: Map<string, AggregationSource[]>,
 * }} The whole result and every nested array/Map value are frozen/mutator-blocked (see `freezeCoverageMap`).
 */
export function validateSourceCoverage(sourceOperationRefs, sources) {
  validateSourceOperationRefs(sourceOperationRefs);
  validateSources(sources);

  const declared = new Set(sourceOperationRefs);
  const bySourceOperationRef = new Map();
  const unresolvedSourceRefs = [];

  for (const source of sources) {
    if (!declared.has(source.sourceOperationRef)) {
      unresolvedSourceRefs.push(source.sourceOperationRef);
      continue;
    }
    if (!bySourceOperationRef.has(source.sourceOperationRef)) {
      bySourceOperationRef.set(source.sourceOperationRef, []);
    }
    bySourceOperationRef.get(source.sourceOperationRef).push(freezeSourceSnapshot(source));
  }

  const missingSourceOperationRefs = sourceOperationRefs.filter((ref) => !bySourceOperationRef.has(ref));

  return Object.freeze({
    ok: missingSourceOperationRefs.length === 0 && unresolvedSourceRefs.length === 0,
    missingSourceOperationRefs: Object.freeze(missingSourceOperationRefs),
    unresolvedSourceRefs: Object.freeze(unresolvedSourceRefs),
    bySourceOperationRef: freezeCoverageMap(bySourceOperationRef),
  });
}

/**
 * Validate required disclosures against a set of already-coverage-checked
 * sources: every id in `requiredDisclosures` (candidate contract:
 * `completion.aggregation.requiredDisclosures[]`) must be present, with a
 * defined non-null value, on every supplied source's `disclosures` object.
 *
 * @param {AggregationSource[]} sources
 * @param {string[]} requiredDisclosures
 * @returns {{
 *   ok: boolean,
 *   missingDisclosuresBySource: Object<string, string[]>,
 * }}
 */
export function validateRequiredDisclosureCoverage(sources, requiredDisclosures) {
  validateSources(sources);
  validateRequiredDisclosures(requiredDisclosures);

  const missingDisclosuresBySource = {};
  for (const source of sources) {
    const missing = requiredDisclosures.filter((id) => source.disclosures[id] === undefined || source.disclosures[id] === null);
    if (missing.length > 0) {
      missingDisclosuresBySource[`${source.sourceOperationRef}:${source.assignmentId}:${source.runId}`] = Object.freeze(missing);
    }
  }

  return Object.freeze({
    ok: Object.keys(missingDisclosuresBySource).length === 0,
    missingDisclosuresBySource: Object.freeze(missingDisclosuresBySource),
  });
}

/**
 * Pure evaluator entry point: given a declared set of source operations,
 * the structured evidence sources actually supplied, and the disclosure
 * ids every source must carry, return one combined validation result.
 *
 * Never fetches, never dispatches, never mutates a session, never rewrites
 * a RunResult or artifact ref -- everything it inspects is passed in as
 * already-resolved data.
 *
 * @param {object} input
 * @param {string[]} input.sourceOperationRefs
 * @param {AggregationSource[]} input.sources
 * @param {string[]} input.requiredDisclosures
 * @returns {{
 *   ok: boolean,
 *   sourceCoverage: { ok: boolean, missingSourceOperationRefs: string[], unresolvedSourceRefs: string[] },
 *   disclosureCoverage: { ok: boolean, missingDisclosuresBySource: Object<string, string[]> },
 * }}
 */
export function evaluateAggregationCoverage({ sourceOperationRefs, sources, requiredDisclosures }) {
  const coverage = validateSourceCoverage(sourceOperationRefs, sources);
  const disclosures = validateRequiredDisclosureCoverage(sources, requiredDisclosures);

  return Object.freeze({
    ok: coverage.ok && disclosures.ok,
    sourceCoverage: Object.freeze({
      ok: coverage.ok,
      missingSourceOperationRefs: Object.freeze([...coverage.missingSourceOperationRefs]),
      unresolvedSourceRefs: Object.freeze([...coverage.unresolvedSourceRefs]),
    }),
    disclosureCoverage: Object.freeze({
      ok: disclosures.ok,
      missingDisclosuresBySource: Object.freeze({ ...disclosures.missingDisclosuresBySource }),
    }),
  });
}

// A per-source report key shared by every content-check function below
// (`missingDisclosuresBySource` already established this shape in P07.1):
// `sourceOperationRef:assignmentId:runId` uniquely identifies one supplied
// source entry, since more than one source may share a `sourceOperationRef`.
function sourceKey(source) {
  return `${source.sourceOperationRef}:${source.assignmentId}:${source.runId}`;
}

/**
 * Validate that every disclosure VALUE (not just presence, per P07.1's own
 * Gaps) is at least well-typed. Minimal shape chosen for this cell: every
 * disclosure value must be a non-empty string -- matches every existing
 * disclosure fixture shape (`'high'`, `'none'`, ...) and is the smallest
 * check that rules out the malformed shapes closest to hand (a number, an
 * array, a nested object, a boolean, an empty string) without inventing
 * per-disclosure-id semantics P07.1 explicitly deferred to "a later cell
 * that defines disclosure semantics."
 *
 * @param {AggregationSource[]} sources
 * @returns {{ ok: boolean, malformedDisclosuresBySource: Object<string, string[]> }}
 */
export function validateDisclosureValueShapes(sources) {
  validateSources(sources);

  const malformedDisclosuresBySource = {};
  for (const source of sources) {
    const malformed = Object.entries(source.disclosures)
      .filter(([, value]) => !isNonEmptyString(value))
      .map(([id]) => id);
    if (malformed.length > 0) {
      malformedDisclosuresBySource[sourceKey(source)] = Object.freeze(malformed);
    }
  }

  return Object.freeze({
    ok: Object.keys(malformedDisclosuresBySource).length === 0,
    malformedDisclosuresBySource: Object.freeze(malformedDisclosuresBySource),
  });
}

/**
 * Validate that every source's `revision` pin still matches the artifact's
 * actual current revision. Pure-function input, not a store read: given
 * this module's hard "no session/store access" constraint (P07.1's Gaps,
 * P07.3 integration concern), the caller supplies `currentRevisions` -- a
 * map of `artifactRef -> current revision string` -- as a plain data
 * argument, keyed by `artifactRef` (the field that actually identifies
 * which artifact a revision belongs to; `sourceOperationRef` can be shared
 * by more than one contributor's source entry).
 *
 * Fail-closed: a source whose `artifactRef` has no entry in
 * `currentRevisions` is treated as stale too -- this cell's own Bug
 * Taxonomy names the failure mode directly ("accepting a stale revision
 * because the 'current revision' input itself wasn't validated against
 * anything"); an unvalidated or incomplete map must never silently pass a
 * source through as current.
 *
 * @param {AggregationSource[]} sources
 * @param {Object<string, string>} currentRevisions
 * @returns {{ ok: boolean, staleSourceKeys: string[] }}
 */
export function validateSourceRevisionCurrency(sources, currentRevisions) {
  validateSources(sources);
  validateCurrentRevisions(currentRevisions);

  const staleSourceKeys = [];
  for (const source of sources) {
    const current = currentRevisions[source.artifactRef];
    if (current === undefined || current !== source.revision) {
      staleSourceKeys.push(sourceKey(source));
    }
  }

  return Object.freeze({
    ok: staleSourceKeys.length === 0,
    staleSourceKeys: Object.freeze(staleSourceKeys),
  });
}

/**
 * Cross-reference each source's disclosed dissent signal against the
 * caller-declared `dissentRefs[]` list, and separately report which
 * declared dissent refs remain unresolved.
 *
 * Dissent-surfacing convention (this cell's own choice -- P07.1 left
 * disclosure semantics undefined by design): a source's
 * `disclosures.dissent` value of exactly `'none'`, or its absence
 * entirely, means "nothing disclosed"; any other (well-typed, per
 * `validateDisclosureValueShapes`) string value is a disclosed objection
 * that MUST have a matching `dissentRefs[]` entry, matched by
 * `sourceOperationRef` (ref-level, matching the candidate contract's own
 * `sourceOperationRefs`/`dissentRefs` granularity -- not the finer
 * per-source key `validateDisclosureValueShapes`/
 * `validateSourceRevisionCurrency` use, since a dissent is a property of
 * the declared operation, not of one specific contributor's run). A
 * disclosed objection with no matching entry is "hidden dissent": the
 * aggregation input quietly omitted evidence it already possessed.
 *
 * @param {AggregationSource[]} sources
 * @param {{sourceOperationRef: string, resolved: boolean}[]} dissentRefs
 * @returns {{
 *   ok: boolean,
 *   hiddenDissentSourceRefs: string[],
 *   unresolvedDissentRefs: string[],
 * }}
 */
export function validateDissentSurfacing(sources, dissentRefs) {
  validateSources(sources);
  validateDissentRefs(dissentRefs);

  const surfaced = new Set(dissentRefs.map((entry) => entry.sourceOperationRef));
  const hiddenDissentSourceRefs = [];
  for (const source of sources) {
    const disclosed = source.disclosures.dissent;
    if (disclosed !== undefined && disclosed !== 'none' && !surfaced.has(source.sourceOperationRef)) {
      hiddenDissentSourceRefs.push(source.sourceOperationRef);
    }
  }

  const unresolvedDissentRefs = dissentRefs.filter((entry) => entry.resolved !== true).map((entry) => entry.sourceOperationRef);

  return Object.freeze({
    ok: hiddenDissentSourceRefs.length === 0,
    hiddenDissentSourceRefs: Object.freeze(hiddenDissentSourceRefs),
    unresolvedDissentRefs: Object.freeze(unresolvedDissentRefs),
  });
}

/**
 * Outcome classification: `consensus | qualified | no-consensus`, built on
 * top of `evaluateAggregationCoverage` (extends, never forks it) plus the
 * three additional structural checks this cell adds. Deterministic rule,
 * evaluated in this fixed order -- never a numeric score, vote, rank
 * tally, or weighting (plan.md Non-Negotiable Deferrals):
 *
 *   1. `no-consensus` if source coverage or required-disclosure coverage
 *      fails (`evaluateAggregationCoverage`), OR any disclosure value is
 *      malformed (`validateDisclosureValueShapes`), OR any source's
 *      revision pin does not match its `currentRevisions` entry
 *      (`validateSourceRevisionCurrency`), OR any disclosed dissent is not
 *      surfaced in `dissentRefs` (`validateDissentSurfacing`'s
 *      `hiddenDissentSourceRefs`). Any one of these is an integrity or
 *      completeness failure that makes the aggregation untrustworthy on
 *      its face -- classification never reaches the next step.
 *   2. Otherwise `qualified` if `dissentRefs` names at least one entry not
 *      yet marked `resolved: true` -- dissent was surfaced honestly, but
 *      is not yet settled.
 *   3. Otherwise `consensus` -- coverage and disclosures are complete,
 *      every revision pin is current, and every disclosed dissent is both
 *      surfaced and resolved (or there was none to surface).
 *
 * There is no "claimed outcome" input: a caller cannot make this function
 * return `consensus` by asserting it. The outcome is always derived from
 * the evidence supplied, which is what keeps step 1's hidden-dissent check
 * and step 2's unresolved-dissent check meaningful -- a claimed `consensus`
 * that coexists with hidden or unresolved dissent can never be produced by
 * this classifier in the first place.
 *
 * @param {object} input
 * @param {string[]} input.sourceOperationRefs
 * @param {AggregationSource[]} input.sources
 * @param {string[]} input.requiredDisclosures
 * @param {{sourceOperationRef: string, resolved: boolean}[]} input.dissentRefs
 * @param {Object<string, string>} input.currentRevisions
 * @returns {{
 *   outcome: 'consensus' | 'qualified' | 'no-consensus',
 *   coverage: object,
 *   disclosureShape: { ok: boolean, malformedDisclosuresBySource: Object<string, string[]> },
 *   revisionCurrency: { ok: boolean, staleSourceKeys: string[] },
 *   dissentSurfacing: { ok: boolean, hiddenDissentSourceRefs: string[], unresolvedDissentRefs: string[] },
 * }}
 */
export function classifyAggregationOutcome({ sourceOperationRefs, sources, requiredDisclosures, dissentRefs, currentRevisions }) {
  const coverage = evaluateAggregationCoverage({ sourceOperationRefs, sources, requiredDisclosures });
  const disclosureShape = validateDisclosureValueShapes(sources);
  const revisionCurrency = validateSourceRevisionCurrency(sources, currentRevisions);
  const dissentSurfacing = validateDissentSurfacing(sources, dissentRefs);

  let outcome;
  if (!coverage.ok || !disclosureShape.ok || !revisionCurrency.ok || !dissentSurfacing.ok) {
    outcome = 'no-consensus';
  } else if (dissentSurfacing.unresolvedDissentRefs.length > 0) {
    outcome = 'qualified';
  } else {
    outcome = 'consensus';
  }

  return Object.freeze({
    outcome,
    coverage,
    disclosureShape,
    revisionCurrency,
    dissentSurfacing,
  });
}
