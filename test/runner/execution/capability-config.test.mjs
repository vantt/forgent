import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  catalogOf, capabilityNamesOf, hasCapabilityEntry, isCapabilityDeclared, registeredCapabilityOf,
  capabilityPersonaOf, capabilityRigorOf, minCheckersOf, ownMinCheckersOf, capabilityVerifyOf,
  capabilityConfinementOf, capabilityServesOf, capabilityDescriptionOf, preferOf, hasPreferPool,
  hasOwnPreferPool, bindingTasteOf,
} from '../../../src/runner/execution/capability-config.mjs';

// The shapes of the repo's own runner config: string and list `prefer` (with an invocation pin), aliases,
// confinement, a prefix entry with minCheckers, persona, verify, serves, and the role and persona taste tables.
const runner = Object.freeze({
  capabilities: Object.freeze({
    'impact-analysis': { description: 'blast radius', prefer: 'gitnexus', serves: ['gitnexus'] },
    review: { aliases: ['code-review'], prefer: [{ executor: 'claude', invocation: 'fast' }, 'codex'], confinement: { mode: 'required' }, rigor: 'high' },
    'code:*': {
      description: 'code work', tier: 'T2', maxTier: 'T3', prefer: ['claude'], rigor: 'standard', minCheckers: ['red-team'],
    },
    'code:implement': { persona: 'builder', verify: 'npm test', description: 'implement', blank: 1 },
    'code:debug': { prefer: '   ', minCheckers: [] },
    docs: { prefer: [] },
    'docs:write': { aliases: 'write-docs' },
    nothing: null,
    text: 'x',
    list: ['x'],
  }),
  roles: Object.freeze({ reviewer: { tier: 'T3', prefer: 'codex', extra: 1 }, bad: 'x' }),
  personas: Object.freeze({ pm: { tier: 'T1' } }),
});

const wrapped = { runner: runner };

test('a capability reads its exact entry before its prefix entry', () => {
  assert.deepEqual(capabilityPersonaOf(runner, 'code:implement'), { persona: 'builder', key: 'code:implement' });
  assert.equal(capabilityRigorOf(runner, 'review'), 'high');
  assert.equal(capabilityRigorOf(runner, 'code:implement'), 'standard', 'the prefix entry covers a name with no rigor of its own');
  assert.deepEqual(minCheckersOf(runner, 'code:implement'), { key: 'code:*', minCheckers: ['red-team'] });
});

test('when the exact entry and the prefix entry both declare a field, the exact one wins and the prefix one covers the rest', () => {
  const both = {
    capabilities: {
      'lane:*': { persona: 'prefix-persona', rigor: 'low', minCheckers: ['prefix-checker'] },
      'lane:exact': { persona: 'exact-persona', rigor: 'critical', minCheckers: ['exact-checker'] },
      'lane:bare': { description: 'no persona, rigor or checkers of its own' },
    },
  };
  assert.deepEqual(capabilityPersonaOf(both, 'lane:exact'), { persona: 'exact-persona', key: 'lane:exact' });
  assert.equal(capabilityRigorOf(both, 'lane:exact'), 'critical');
  assert.deepEqual(minCheckersOf(both, 'lane:exact'), { key: 'lane:exact', minCheckers: ['exact-checker'] });
  assert.deepEqual(capabilityPersonaOf(both, 'lane:other'), { persona: 'prefix-persona', key: 'lane:*' });
  assert.equal(capabilityRigorOf(both, 'lane:other'), 'low');
  assert.deepEqual(capabilityPersonaOf(both, 'lane:bare'), { persona: 'prefix-persona', key: 'lane:*' }, 'a field the exact entry lacks falls to the prefix entry');
  assert.equal(capabilityRigorOf(both, 'lane:bare'), 'low');
});

test('a name with no colon has no prefix entry and the bare verb is never consulted', () => {
  assert.equal(capabilityRigorOf(runner, 'x:review'), undefined);
  assert.equal(isCapabilityDeclared(runner, 'x:review'), false);
  assert.equal(isCapabilityDeclared(runner, 'code:review'), true, 'declared through code:*');
  assert.equal(isCapabilityDeclared(runner, 'docs'), true);
  assert.equal(isCapabilityDeclared(runner, 'nope'), false);
  assert.equal(capabilityPersonaOf(runner, 'code'), null, 'a bare prefix is not code:*');
});

test('a config wrapped as runner.capabilities holds no catalog: every read, lookups included, is flat only', () => {
  assert.equal(capabilityRigorOf(wrapped, 'review'), undefined);
  assert.equal(isCapabilityDeclared(wrapped, 'code:x'), false);
  assert.equal(hasPreferPool(wrapped, 'review'), false);
  assert.equal(minCheckersOf(wrapped, 'code:x'), null);
  assert.equal(capabilityPersonaOf(wrapped, 'code:implement'), null);
  assert.equal(capabilityVerifyOf(wrapped, 'code:implement'), undefined);
  assert.equal(capabilityConfinementOf(wrapped, 'review'), undefined);
  assert.equal(preferOf(wrapped, 'review'), undefined);
  assert.equal(hasCapabilityEntry(wrapped, 'review'), false);
  assert.deepEqual(capabilityNamesOf(wrapped), []);
  assert.deepEqual(bindingTasteOf(wrapped), { capabilities: {}, roles: {}, personas: {} });
});

test('an alias resolves to its key, an own key wins over an alias and a string aliases value is ignored', () => {
  assert.equal(registeredCapabilityOf(runner, 'review'), 'review');
  assert.equal(registeredCapabilityOf(runner, 'code-review'), 'review');
  assert.equal(registeredCapabilityOf(runner, 'write-docs'), undefined);
  assert.equal(registeredCapabilityOf(runner, 'wri'), undefined, 'no substring match');
  const collision = { capabilities: { first: { aliases: ['x'] }, second: { aliases: ['x'] }, x: {} } };
  assert.equal(registeredCapabilityOf(collision, 'x'), 'x');
  assert.equal(registeredCapabilityOf({ capabilities: { first: { aliases: ['x'] }, second: { aliases: ['x'] } } }, 'x'), 'first');
});

test('a name from Object.prototype is never declared', () => {
  const names = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'];
  for (const name of names) {
    assert.equal(hasCapabilityEntry(runner, name), false, name);
    assert.equal(registeredCapabilityOf(runner, name), undefined, name);
    assert.equal(isCapabilityDeclared(runner, name), false, name);
    assert.equal(capabilityVerifyOf(runner, name), undefined, name);
    assert.equal(capabilityConfinementOf(runner, name), undefined, name);
    assert.equal(preferOf(runner, name), undefined, name);
    assert.equal(capabilityRigorOf(runner, name), undefined, name);
  }
});

test('a null or string entry is not an entry and an array entry is', () => {
  assert.equal(hasCapabilityEntry(runner, 'nothing'), false);
  assert.equal(hasCapabilityEntry(runner, 'text'), false);
  assert.equal(hasCapabilityEntry(runner, 'list'), true);
  assert.equal(isCapabilityDeclared(runner, 'text'), false);
  assert.equal(hasCapabilityEntry(runner, 'review'), true);
  assert.deepEqual(capabilityNamesOf(runner), Object.keys(runner.capabilities), 'names are the own keys, entries or not');
  assert.deepEqual(capabilityNamesOf({ capabilities: 'x' }), []);
  assert.deepEqual(capabilityNamesOf(undefined), []);
});

test('the catalog is the raw section value', () => {
  assert.equal(catalogOf(runner), runner.capabilities);
  assert.equal(catalogOf({}), undefined);
  assert.equal(catalogOf({ capabilities: 'x' }), 'x');
});

test('a string, a list and a blank prefer are told apart by both pool functions', () => {
  assert.equal(hasOwnPreferPool(runner, 'impact-analysis'), true, 'string');
  assert.equal(hasOwnPreferPool(runner, 'review'), true, 'list');
  assert.equal(hasOwnPreferPool(runner, 'code:debug'), false, 'blank string');
  assert.equal(hasOwnPreferPool(runner, 'docs'), false, 'empty list');
  assert.equal(hasOwnPreferPool(runner, 'code:implement'), false, 'the prefix entry is not consulted');
  assert.equal(hasPreferPool(runner, 'code:implement'), true, 'the prefix entry serves');
  assert.equal(hasPreferPool(runner, 'code:debug'), true, 'the prefix entry serves when the exact one is blank');
  assert.equal(hasPreferPool(runner, 'docs:write'), false);
  assert.equal(preferOf(runner, 'impact-analysis'), 'gitnexus');
  assert.deepEqual(preferOf(runner, 'review'), [{ executor: 'claude', invocation: 'fast' }, 'codex']);
  assert.equal(preferOf(runner, 'code:implement'), undefined);
});

test('an empty minCheckers list is defined and clears; the own read ignores the prefix entry', () => {
  assert.deepEqual(minCheckersOf(runner, 'code:debug'), { key: 'code:debug', minCheckers: [] });
  assert.equal(minCheckersOf(runner, 'review'), null);
  assert.equal(ownMinCheckersOf(runner, 'code:implement'), undefined);
  assert.deepEqual(ownMinCheckersOf(runner, 'code:*'), ['red-team']);
  assert.deepEqual(ownMinCheckersOf(runner, 'code:debug'), []);
});

test('verify, confinement, serves and description are read raw from the exact entry', () => {
  assert.equal(capabilityVerifyOf(runner, 'code:implement'), 'npm test');
  assert.equal(capabilityVerifyOf(runner, 'code:review'), undefined, 'no prefix fallback');
  assert.deepEqual(capabilityConfinementOf(runner, 'review'), { mode: 'required' });
  assert.deepEqual(capabilityServesOf(runner, 'impact-analysis'), ['gitnexus']);
  assert.equal(capabilityServesOf(runner, 'review'), undefined);
  assert.equal(capabilityDescriptionOf(runner, 'code:implement'), 'implement');
  assert.equal(capabilityDescriptionOf(runner, 'code:debug'), 'code work', 'the prefix entry describes a name whose own entry has none');
  assert.equal(capabilityDescriptionOf(runner, 'review'), null);
  assert.equal(capabilityDescriptionOf(runner, undefined), null);
});

test('the binding taste keeps only the crate fields, per capability and in the role and persona tables and normalizes a string prefer to a list', () => {
  const { capabilities, roles, personas } = bindingTasteOf(runner);
  assert.deepEqual(capabilities['impact-analysis'], { prefer: ['gitnexus'] });
  assert.deepEqual(capabilities.review, { prefer: [{ executor: 'claude', invocation: 'fast' }, 'codex'] });
  assert.deepEqual(capabilities['code:*'], { tier: 'T2', maxTier: 'T3', prefer: ['claude'] });
  assert.deepEqual(capabilities['code:implement'], {}, 'persona, verify and description are not binding fields');
  assert.equal('nothing' in capabilities, false);
  assert.equal('text' in capabilities, false);
  assert.equal('list' in capabilities, false, 'an array is not an entry for the crate');
  assert.deepEqual(roles, { reviewer: { tier: 'T3', prefer: ['codex'] } }, 'a role entry keeps tier and prefer only; a non-object is dropped');
  assert.deepEqual(personas, { pm: { tier: 'T1' } });
});

test('an invalid rigor throws the same RangeError text', () => {
  const bad = { capabilities: { 'x:y': { rigor: 'extreme' } } };
  assert.throws(
    () => capabilityRigorOf(bad, 'x:y'),
    (err) => err instanceof RangeError && err.message === 'invalid capability rigor "extreme" for "x:y". Valid rigors: [low, standard, high, critical]',
  );
});
