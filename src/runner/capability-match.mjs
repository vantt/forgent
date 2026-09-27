// capability-match.mjs — Q1 steering: matchCapability(demandFacts, catalog).
//
// Pure, side-effect-free. Derives the canonical capability -- and its
// execution `form` -- from declared DemandFacts by checking them against
// each catalog entry's `serves` promise (core/skills/_shared/
// capability-matching.md's matching rules): every attribute a capability's
// `serves` declares must be satisfied by the facts (an attribute the
// capability never declares matches anything); among capabilities that fully
// satisfy their own `serves`, the one satisfying the most attributes wins; a
// tie, or zero satisfying capabilities, is a miss (`capability: null`,
// `form: 'inline'`, logged by the caller alongside the eligible candidates
// this function already returns).
//
// This module never calls `decide`, never reads `capabilities.<name>.prefer`,
// and never resolves an executor -- Q2 binding (`fgos dispatch decide --for
// <capability>`) is a strictly later, separate step this module has no
// awareness of. It imports nothing from `src/runner/dispatch/`: `TIERS` is
// Work's own tier vocabulary (`src/state/work.mjs`), not a dispatch concept,
// and the rigor vocabulary below is a deliberate, drift-tested duplicate
// (see `RIGOR_VALUES`) rather than a dispatch/ import, so this module stays
// fully decoupled from executor/decide/CLI-spawn machinery.

import { TIERS } from '../state/work.mjs';

// Mirrors `MIN_RIGOR_VALUES` (`src/runner/dispatch/assignment-policy.mjs`)
// exactly. Duplicated rather than imported so this module has zero
// dependency on anything under `dispatch/` -- `test/runner/
// capability-match.test.mjs` asserts the two arrays stay identical, so this
// copy cannot silently drift from the real one.
export const RIGOR_VALUES = Object.freeze(['low', 'standard', 'high', 'critical']);

// The three possible execution forms a match can yield. `inline` is both a
// real steady-state form (no protocol, no facade) and the forced form for
// every miss/tie.
export const FORMS = Object.freeze(['inline', 'protocol', 'facade']);

const REQUIRED_BOOLEAN_FACTS = Object.freeze(['mutates', 'needsIndependentReview', 'hasPlanOrTrack']);
const OPTIONAL_BOOLEAN_FACTS = Object.freeze(['behaviorPreserving']);

// The `serves` attribute keys a catalog entry may declare (demand-side half
// of the same closed vocabulary `CAPABILITY_SERVES_KEYS`, private to
// `src/runner/dispatch/config.mjs`, validates from the catalog side).
const SERVES_ATTRIBUTE_KEYS = Object.freeze(['outputKind', 'domain', ...REQUIRED_BOOLEAN_FACTS, ...OPTIONAL_BOOLEAN_FACTS]);

export class CapabilityMatchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CapabilityMatchError';
  }
}

function fail(message) {
  throw new CapabilityMatchError(message);
}

/**
 * Validate `demandFacts` against the DemandFacts vocabulary
 * (core/skills/_shared/capability-matching.md). Throws `CapabilityMatchError`
 * naming the exact offending field -- never a generic "invalid input".
 */
function validateDemandFacts(facts) {
  if (!facts || typeof facts !== 'object' || Array.isArray(facts)) {
    fail('matchCapability requires a demandFacts object.');
  }
  if (typeof facts.outputKind !== 'string' || facts.outputKind.trim() === '') {
    fail(`demandFacts.outputKind must be a non-empty string, got: ${JSON.stringify(facts.outputKind)}.`);
  }
  if (typeof facts.domain !== 'string') {
    fail(`demandFacts.domain must be a string (empty string is valid for domain-neutral work), got: ${JSON.stringify(facts.domain)}.`);
  }
  for (const key of REQUIRED_BOOLEAN_FACTS) {
    if (typeof facts[key] !== 'boolean') {
      fail(`demandFacts.${key} must be a boolean, got: ${JSON.stringify(facts[key])}.`);
    }
  }
  for (const key of OPTIONAL_BOOLEAN_FACTS) {
    if (facts[key] !== undefined && typeof facts[key] !== 'boolean') {
      fail(`demandFacts.${key} must be a boolean when present, got: ${JSON.stringify(facts[key])}.`);
    }
  }
  if (!TIERS.includes(facts.size)) {
    fail(`demandFacts.size must be one of ${TIERS.join('/')}, got: ${JSON.stringify(facts.size)}.`);
  }
  if (!RIGOR_VALUES.includes(facts.rigor)) {
    fail(`demandFacts.rigor must be one of ${RIGOR_VALUES.join('/')}, got: ${JSON.stringify(facts.rigor)}.`);
  }
}

function valueSatisfies(declaredValue, actualValue) {
  const allowed = Array.isArray(declaredValue) ? declaredValue : [declaredValue];
  return allowed.includes(actualValue);
}

/**
 * Evaluate one catalog entry against `facts`. Returns `null` for an entry
 * with no `serves` block (never auto-matched, per doctrine), otherwise
 * `{name, specificity, satisfied, unsatisfiedAttributes}`.
 */
function evaluateCandidate(name, entry, facts) {
  const serves = entry && typeof entry === 'object' && entry.serves && typeof entry.serves === 'object' ? entry.serves : undefined;
  if (!serves) return null;

  const declaredKeys = Object.keys(serves).filter((key) => SERVES_ATTRIBUTE_KEYS.includes(key));
  const unsatisfiedAttributes = declaredKeys.filter((key) => !valueSatisfies(serves[key], facts[key]));

  return Object.freeze({
    name,
    specificity: declaredKeys.length,
    satisfied: unsatisfiedAttributes.length === 0,
    unsatisfiedAttributes: Object.freeze(unsatisfiedAttributes),
  });
}

/**
 * `form` derives from `needsIndependentReview`, `hasPlanOrTrack`, and `size`
 * (never `rigor`, which is Q2-only pass-through): a plan/track-scoped unit
 * whose declared `size` is `heavy` decomposes into a `facade`; short of that,
 * a unit requiring independent review runs under a `protocol`; everything
 * else -- including a plan/track unit that is not heavy -- stays `inline`.
 * Forced to `inline` unconditionally on a miss/tie, per doctrine.
 */
function deriveForm(facts, capability) {
  if (capability === null) return 'inline';
  if (facts.hasPlanOrTrack && facts.size === 'heavy') return 'facade';
  if (facts.needsIndependentReview) return 'protocol';
  return 'inline';
}

/**
 * matchCapability(demandFacts, catalog) — pure Q1 steering.
 *
 * @param {object} demandFacts DemandFacts (see validateDemandFacts).
 * @param {object} [catalog] `cfg.capabilities` (a `{name: {serves?, ...}}`
 *   map, e.g. `ensureRunnerConfigForDir(dir).capabilities`); an entry with no
 *   `serves` is never matched automatically. Missing/empty catalog is a
 *   legitimate all-miss input, never thrown.
 * @returns {Readonly<{facts, capability: string|null, form: string,
 *   candidates: ReadonlyArray<{name: string, specificity: number}>,
 *   source: 'match'|'miss', reason: string}>}
 */
export function matchCapability(demandFacts, catalog) {
  validateDemandFacts(demandFacts);
  const facts = Object.freeze({ ...demandFacts });
  const entries = catalog && typeof catalog === 'object' ? catalog : {};

  const evaluated = Object.entries(entries)
    .map(([name, entry]) => evaluateCandidate(name, entry, facts))
    .filter(Boolean);

  const eligible = evaluated
    .filter((candidate) => candidate.satisfied)
    .sort((a, b) => b.specificity - a.specificity || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const candidates = Object.freeze(eligible.map((candidate) => Object.freeze({ name: candidate.name, specificity: candidate.specificity })));

  let capability = null;
  let source = 'miss';
  let reason;

  if (eligible.length === 0) {
    reason = 'no registered capability\'s serves attributes are fully satisfied by the declared demand facts.';
  } else {
    const topSpecificity = eligible[0].specificity;
    const tied = eligible.filter((candidate) => candidate.specificity === topSpecificity);
    if (tied.length > 1) {
      reason = `${tied.length} capabilities tie at specificity ${topSpecificity} ([${tied.map((candidate) => candidate.name).join(', ')}]); no capability selected.`;
    } else {
      capability = eligible[0].name;
      source = 'match';
      const others = eligible.slice(1);
      reason = `capability "${capability}" matched: satisfies ${topSpecificity} declared serves attribute(s)`
        + (others.length > 0 ? `; ${others.length} other eligible candidate(s) considered: [${others.map((candidate) => candidate.name).join(', ')}]` : '')
        + '.';
    }
  }

  return Object.freeze({
    facts,
    capability,
    form: deriveForm(facts, capability),
    candidates,
    source,
    reason,
  });
}
