// team-cognition/aggregation-evaluator.mjs — the Team Cognition Engine's
// minimal evaluator skeleton (Phase 07 / MVP7, cell P07.1).
//
// Scope of THIS skeleton, per phase-07-mvp7-evidence-preserving-aggregation.md
// and current-cell.md's P07.1 section:
//   - Validate structured source coverage: every declared
//     `sourceOperationRef` resolves to at least one supplied `sources[]`
//     entry, and no supplied entry names an operation ref that was never
//     declared (an "unresolved" source ref).
//   - Validate required disclosures: every supplied source's `disclosures`
//     object carries a defined value for every id in `requiredDisclosures`.
//
// Explicitly OUT of scope for this skeleton (left to later Phase 07 cells,
// per phase-07.md's own P07.2/P07.3 split):
//   - Outcome classification (`consensus | qualified | no-consensus`),
//     dissent resolution, or missing/failed-actor accounting.
//   - Comparing a supplied `revision` against the artifact's actual current
//     revision to detect staleness -- this evaluator has no session/store
//     access to look that up; it only checks that a revision pin is
//     PRESENT (see schema.mjs's `validateAggregationSource`), never that it
//     is current.
//   - Any FlowDefinition/CoordinationSession integration (P07.3, Wave 3).
//
// Hard constraint (component-authority-boundary-map.md §6, Team Cognition
// Engine "Must not own"): this module never rewrites evidence, never alters
// RunResult confidence, never dispatches work, and never transitions a
// CoordinationSession. It is a pure function -- given refs + disclosures,
// it returns a validation result. It imports nothing from
// src/runner/coordination/ (session-engine.mjs, store.mjs included) and
// nothing that dispatches or mutates session state.

import { validateSourceOperationRefs, validateSources, validateRequiredDisclosures } from './schema.mjs';

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
