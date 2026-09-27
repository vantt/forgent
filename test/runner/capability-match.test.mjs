// Unit tests for src/runner/capability-match.mjs's matchCapability(...) --
// Q1 steering: derive a canonical capability + execution `form` from
// declared DemandFacts by checking them against a catalog's `serves`
// promises (core/skills/_shared/capability-matching.md). Fixture catalog
// mirrors the live registered catalog's own `serves` declarations
// (plans/reports/architecture-investigation-260927-1154-capability-aware-
// dispatch-gate-phase4-decisions.md §11.2) plus two synthetic entries used
// only to exercise the tie case.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { matchCapability, CapabilityMatchError, RIGOR_VALUES, FORMS } from '../../src/runner/capability-match.mjs';
import { MIN_RIGOR_VALUES } from '../../src/runner/dispatch/assignment-policy.mjs';

const moduleFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/capability-match.mjs');

// ─── Fixtures ───────────────────────────────────────────────────────────

const CATALOG = Object.freeze({
  'code:implement': { serves: { outputKind: 'change', domain: 'code', mutates: true } },
  'code:refactor': { serves: { outputKind: 'change', domain: 'code', mutates: true, behaviorPreserving: true } },
  'code:test': { serves: { outputKind: 'verification', domain: 'code' } },
  'code:debug': { serves: { outputKind: 'finding', domain: 'code' } },
  'code:review': { serves: { outputKind: 'finding', domain: 'code', mutates: false } },
  execute: { serves: { outputKind: 'change', mutates: true } },
  advise: { serves: { outputKind: 'decision', mutates: false } },
  review: { serves: { outputKind: 'finding', mutates: false } },
  'no-serves-tool': {},
});

const TIE_CATALOG = Object.freeze({
  'tie:a': { serves: { outputKind: 'change', domain: 'tie-domain', mutates: true } },
  'tie:b': { serves: { outputKind: 'change', domain: 'tie-domain', mutates: true } },
});

function demandFacts(overrides = {}) {
  return {
    outputKind: 'change',
    domain: 'code',
    mutates: true,
    needsIndependentReview: false,
    hasPlanOrTrack: false,
    size: 'light',
    rigor: 'standard',
    ...overrides,
  };
}

// ─── Matching rules ─────────────────────────────────────────────────────

test('code change matches code:implement', () => {
  const result = matchCapability(demandFacts(), CATALOG);
  assert.equal(result.capability, 'code:implement');
  assert.equal(result.source, 'match');
  assert.equal(result.form, 'inline');
});

test('docs change matches generic execute, not code:implement (domain mismatch)', () => {
  const result = matchCapability(demandFacts({ domain: 'docs' }), CATALOG);
  assert.equal(result.capability, 'execute');
});

test('behavior-preserving code change matches code:refactor over code:implement (more specific serves wins)', () => {
  const result = matchCapability(demandFacts({ behaviorPreserving: true }), CATALOG);
  assert.equal(result.capability, 'code:refactor');
});

test('non-behavior-preserving code change still matches code:implement, not code:refactor', () => {
  const result = matchCapability(demandFacts({ behaviorPreserving: false }), CATALOG);
  assert.equal(result.capability, 'code:implement');
});

test('a docs finding matches generic review, not code:review (domain mismatch)', () => {
  const result = matchCapability(demandFacts({ outputKind: 'finding', domain: 'docs', mutates: false }), CATALOG);
  assert.equal(result.capability, 'review');
});

test('a decision matches advise', () => {
  const result = matchCapability(demandFacts({ outputKind: 'decision', domain: '', mutates: false }), CATALOG);
  assert.equal(result.capability, 'advise');
});

test('a tie between equally-specific candidates yields a miss (capability: null, form: inline)', () => {
  const result = matchCapability(demandFacts({ domain: 'tie-domain' }), TIE_CATALOG);
  assert.equal(result.capability, null);
  assert.equal(result.form, 'inline');
  assert.equal(result.source, 'miss');
  assert.deepEqual(result.candidates.map((c) => c.name).sort(), ['tie:a', 'tie:b']);
});

test('an unrecognized outputKind value matches nothing (miss)', () => {
  const result = matchCapability(demandFacts({ outputKind: 'translation' }), CATALOG);
  assert.equal(result.capability, null);
  assert.equal(result.source, 'miss');
  assert.deepEqual(result.candidates, []);
});

test('a catalog entry with no serves block is never auto-matched', () => {
  const result = matchCapability(demandFacts({ outputKind: 'anything-goes', domain: '' }), CATALOG);
  assert.notEqual(result.capability, 'no-serves-tool');
});

test('an empty/undefined catalog is a legitimate miss, never thrown', () => {
  assert.doesNotThrow(() => matchCapability(demandFacts(), {}));
  const result = matchCapability(demandFacts(), undefined);
  assert.equal(result.capability, null);
  assert.equal(result.source, 'miss');
});

// ─── form derivation ────────────────────────────────────────────────────

test('form is inline when neither review nor a heavy plan/track applies', () => {
  const result = matchCapability(demandFacts(), CATALOG);
  assert.equal(result.form, 'inline');
});

test('form is protocol when needsIndependentReview is true', () => {
  const result = matchCapability(demandFacts({ outputKind: 'finding', domain: 'code', mutates: false, needsIndependentReview: true }), CATALOG);
  assert.equal(result.capability, 'code:review');
  assert.equal(result.form, 'protocol');
});

test('form is facade when hasPlanOrTrack and size is heavy', () => {
  const result = matchCapability(demandFacts({ hasPlanOrTrack: true, size: 'heavy' }), CATALOG);
  assert.equal(result.form, 'facade');
});

test('a plan/track unit that is not heavy stays inline, not facade', () => {
  const result = matchCapability(demandFacts({ hasPlanOrTrack: true, size: 'standard' }), CATALOG);
  assert.equal(result.form, 'inline');
});

test('facade takes precedence over protocol when both conditions hold', () => {
  const result = matchCapability(
    demandFacts({ outputKind: 'finding', domain: 'code', mutates: false, needsIndependentReview: true, hasPlanOrTrack: true, size: 'heavy' }),
    CATALOG,
  );
  assert.equal(result.form, 'facade');
});

test('a tie forces form to inline even if needsIndependentReview/hasPlanOrTrack+heavy would otherwise apply', () => {
  const result = matchCapability(demandFacts({ domain: 'tie-domain', needsIndependentReview: true, hasPlanOrTrack: true, size: 'heavy' }), TIE_CATALOG);
  assert.equal(result.capability, null);
  assert.equal(result.form, 'inline');
});

test('FORMS lists exactly the three values the derivation can produce', () => {
  assert.deepEqual([...FORMS], ['inline', 'protocol', 'facade']);
});

// ─── DemandFacts validation: wrong vocabulary -> a clear, named error ────

test('a non-object demandFacts throws CapabilityMatchError', () => {
  assert.throws(() => matchCapability(null, CATALOG), CapabilityMatchError);
  assert.throws(() => matchCapability('nope', CATALOG), CapabilityMatchError);
});

test('a missing/empty outputKind throws naming the field', () => {
  assert.throws(() => matchCapability(demandFacts({ outputKind: '' }), CATALOG), /demandFacts\.outputKind/);
});

test('a non-string domain throws naming the field', () => {
  assert.throws(() => matchCapability(demandFacts({ domain: null }), CATALOG), /demandFacts\.domain/);
});

test('a non-boolean mutates/needsIndependentReview/hasPlanOrTrack throws naming the field', () => {
  assert.throws(() => matchCapability(demandFacts({ mutates: 'yes' }), CATALOG), /demandFacts\.mutates/);
  assert.throws(() => matchCapability(demandFacts({ needsIndependentReview: 1 }), CATALOG), /demandFacts\.needsIndependentReview/);
  assert.throws(() => matchCapability(demandFacts({ hasPlanOrTrack: 0 }), CATALOG), /demandFacts\.hasPlanOrTrack/);
});

test('a non-boolean behaviorPreserving throws naming the field, but absence is valid', () => {
  assert.throws(() => matchCapability(demandFacts({ behaviorPreserving: 'true' }), CATALOG), /demandFacts\.behaviorPreserving/);
  assert.doesNotThrow(() => matchCapability(demandFacts(), CATALOG));
});

test('an out-of-vocabulary size throws naming TIERS', () => {
  assert.throws(() => matchCapability(demandFacts({ size: 'medium' }), CATALOG), /demandFacts\.size/);
});

test('an out-of-vocabulary rigor throws naming the rigor vocabulary', () => {
  assert.throws(() => matchCapability(demandFacts({ rigor: 'urgent' }), CATALOG), /demandFacts\.rigor/);
});

// ─── RIGOR_VALUES drift guard ───────────────────────────────────────────

test('RIGOR_VALUES stays byte-identical to MIN_RIGOR_VALUES (dispatch/assignment-policy.mjs) despite being duplicated for the dispatch/ import boundary', () => {
  assert.deepEqual([...RIGOR_VALUES], [...MIN_RIGOR_VALUES]);
});

// ─── Boundary test: no import of dispatch/plan.mjs, cli.mjs, or transport.mjs ──

const FORBIDDEN_IMPORT_SUBSTRINGS = ['dispatch/plan.mjs', 'dispatch/cli.mjs', 'dispatch/transport.mjs'];

function extractImportSpecifiers(source) {
  const specifiers = [];
  const importRe = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(source))) specifiers.push(match[1]);
  const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRe.exec(source))) specifiers.push(match[1]);
  return specifiers;
}

test('capability-match.mjs exists (sanity check for the static scan below)', () => {
  assert.ok(fs.existsSync(moduleFile), `expected ${moduleFile} to exist`);
});

test('capability-match.mjs never imports dispatch/plan.mjs, dispatch/cli.mjs, or dispatch/transport.mjs', () => {
  const source = fs.readFileSync(moduleFile, 'utf8');
  const violations = [];
  for (const specifier of extractImportSpecifiers(source)) {
    const resolved = specifier.startsWith('.') ? path.normalize(path.join(path.dirname(moduleFile), specifier)) : specifier;
    for (const forbidden of FORBIDDEN_IMPORT_SUBSTRINGS) {
      if (resolved.includes(forbidden)) {
        violations.push(`imports "${specifier}" (resolved: ${resolved}, matches forbidden "${forbidden}")`);
      }
    }
  }
  assert.deepEqual(violations, [], `forbidden imports found:\n${violations.join('\n')}`);
});

test('capability-match.mjs imports nothing from src/runner/dispatch/ at all', () => {
  const source = fs.readFileSync(moduleFile, 'utf8');
  const violations = extractImportSpecifiers(source).filter((specifier) => specifier.includes('dispatch/'));
  assert.deepEqual(violations, [], `unexpected dispatch/ import(s): ${violations.join(', ')}`);
});
