// Adversarial edge cases for matchCapability beyond the phase file's listed cases.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { matchCapability } from '../../src/runner/capability-match.mjs';
import { validateCapabilityServesShape } from '../../src/runner/dispatch/config.mjs';

const BASE = Object.freeze({
  outputKind: 'change',
  domain: 'code',
  mutates: true,
  needsIndependentReview: false,
  hasPlanOrTrack: false,
  size: 'light',
  rigor: 'standard',
});

const CATALOG = Object.freeze({
  'code:implement': { serves: { outputKind: 'change', domain: 'code', mutates: true } },
  execute: { serves: { outputKind: 'change', mutates: true } },
});

test('an unknown extra demandFacts key is ignored for matching (not rejected)', () => {
  const plain = matchCapability(BASE, CATALOG);
  const withExtra = matchCapability({ ...BASE, bogusKey: 'x', outputkind: 'finding' }, CATALOG);
  assert.equal(withExtra.capability, plain.capability);
  assert.equal(withExtra.source, 'match');
});

test('an unknown extra demandFacts key is echoed back in result.facts (not stripped)', () => {
  const result = matchCapability({ ...BASE, bogusKey: 'x' }, CATALOG);
  assert.equal(result.facts.bogusKey, 'x');
});

test('a typo of the optional behaviorPreserving key silently drops refactor steering', () => {
  const catalog = { ...CATALOG, 'code:refactor': { serves: { outputKind: 'change', domain: 'code', mutates: true, behaviorPreserving: true } } };
  assert.equal(matchCapability({ ...BASE, behaviorPreserving: true }, catalog).capability, 'code:refactor');
  assert.equal(matchCapability({ ...BASE, behaviourPreserving: true }, catalog).capability, 'code:implement');
});

test('two capabilities tying on satisfied-attribute count is a miss with both listed as candidates', () => {
  const catalog = {
    alpha: { serves: { outputKind: 'change', mutates: true } },
    beta: { serves: { domain: 'code', mutates: true } },
  };
  const result = matchCapability(BASE, catalog);
  assert.equal(result.capability, null);
  assert.equal(result.source, 'miss');
  assert.equal(result.form, 'inline');
  assert.deepEqual(result.candidates.map((c) => c.name), ['alpha', 'beta']);
  assert.match(result.reason, /tie/);
});

test('a tie at the top is a miss even when a lower-specificity candidate is unique', () => {
  const catalog = {
    alpha: { serves: { outputKind: 'change', mutates: true } },
    beta: { serves: { domain: 'code', mutates: true } },
    gamma: { serves: { mutates: true } },
  };
  const result = matchCapability({ ...BASE, hasPlanOrTrack: true, size: 'heavy' }, catalog);
  assert.equal(result.capability, null);
  assert.equal(result.form, 'inline');
});

test('array-valued serves attribute matches any listed value', () => {
  const catalog = { docsy: { serves: { outputKind: 'change', domain: ['docs', 'config'], mutates: true } }, execute: CATALOG.execute };
  assert.equal(matchCapability({ ...BASE, domain: 'docs' }, catalog).capability, 'docsy');
  assert.equal(matchCapability({ ...BASE, domain: 'config' }, catalog).capability, 'docsy');
  assert.equal(matchCapability({ ...BASE, domain: 'code' }, catalog).capability, 'execute');
});

test('array-valued boolean serves attribute ([true,false]) matches both', () => {
  const catalog = { any: { serves: { outputKind: 'change', mutates: [true, false] } } };
  assert.equal(matchCapability({ ...BASE, mutates: true }, catalog).capability, 'any');
  assert.equal(matchCapability({ ...BASE, mutates: false }, catalog).capability, 'any');
});

test('scalar and array forms of the same declaration match identically', () => {
  const scalar = { c: { serves: { outputKind: 'change', domain: 'code' } } };
  const array = { c: { serves: { outputKind: ['change'], domain: ['code'] } } };
  for (const domain of ['code', 'docs']) {
    const a = matchCapability({ ...BASE, domain }, scalar);
    const b = matchCapability({ ...BASE, domain }, array);
    assert.equal(a.capability, b.capability);
    assert.deepEqual(a.candidates, b.candidates);
  }
});

test('an array serves value counts the same specificity as a scalar (breadth is not penalized)', () => {
  const catalog = {
    narrow: { serves: { outputKind: 'change', domain: 'code' } },
    broad: { serves: { outputKind: 'change', domain: ['code', 'docs', 'config'] } },
  };
  const result = matchCapability(BASE, catalog);
  assert.equal(result.capability, null, 'narrow and broad tie at specificity 2');
});

test('serves: {} passes I19 config validation and becomes a zero-specificity catch-all candidate', () => {
  assert.doesNotThrow(() => validateCapabilityServesShape({}, 'probe'));
  const result = matchCapability({ ...BASE, outputKind: 'nothing-registered' }, { catchall: { serves: {} } });
  assert.equal(result.capability, 'catchall');
  assert.equal(result.source, 'match');
});

test('an omitted optional behaviorPreserving never satisfies serves.behaviorPreserving: false', () => {
  const catalog = { newcode: { serves: { outputKind: 'change', behaviorPreserving: false } } };
  assert.equal(matchCapability(BASE, catalog).capability, null);
  assert.equal(matchCapability({ ...BASE, behaviorPreserving: false }, catalog).capability, 'newcode');
});

test('prototype-ish catalog keys do not crash matching', () => {
  const catalog = JSON.parse('{"__proto__": {"serves": {"outputKind": "change"}}, "constructor": {"serves": {"outputKind": "change", "mutates": true}}}');
  const result = matchCapability(BASE, catalog);
  assert.ok(result.capability === null || typeof result.capability === 'string');
});

test('result and its candidates are frozen', () => {
  const result = matchCapability(BASE, CATALOG);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.facts));
  assert.ok(Object.isFrozen(result.candidates));
});
