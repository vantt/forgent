// instruction-composition.test.mjs — effective instruction-set composition (P4)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  composeAllInstructionSets,
  composeInstructionSet,
  effectiveSetRelativePath,
  evaluateInstructionComposition,
  InstructionCompositionError,
  serializeEffectiveInstructionSet,
} from '../../src/setup/instruction-composition.mjs';

function authority(type, name) {
  return Object.freeze({
    type,
    name,
    toString() {
      return `${type}:${name}`;
    },
  });
}

function unit(id, overrides = {}) {
  const owner = overrides.owner ?? 'platform';
  const authorityValue = overrides.authority ?? authority('platform', owner);
  return Object.freeze({
    id,
    owner,
    authority: authorityValue,
    sourcePath: overrides.sourcePath ?? `core/instructions/${id}.md`,
    fullPath: overrides.fullPath ?? `/repo/core/instructions/${id}.md`,
    scope: overrides.scope ?? 'repo',
    kind: overrides.kind ?? 'procedure',
    mode: overrides.mode ?? 'append',
    appliesTo: overrides.appliesTo ?? ['*'],
    specificity: overrides.specificity ?? (overrides.scope === 'domain' ? 30 : overrides.scope === 'component' ? 20 : 10),
    dependsOn: overrides.dependsOn ?? [],
    refines: overrides.refines ?? [],
    supersedes: overrides.supersedes ?? [],
    supersessionDecision: overrides.supersessionDecision ?? null,
    conflictsWith: overrides.conflictsWith ?? [],
    renderHints: overrides.renderHints ?? {},
    title: overrides.title ?? id,
    description: overrides.description ?? '',
    body: overrides.body ?? `${id} body`,
    rawContent: overrides.rawContent ?? '',
  });
}

test('composeInstructionSet emits a stable IR ordered laws, boundaries, procedures, preferences, host adapters', () => {
  const units = [
    unit('domain-procedure', {
      owner: 'coding',
      authority: authority('domain', 'coding'),
      sourcePath: 'domains/coding/instructions/procedure.md',
      scope: 'domain',
      kind: 'procedure',
      specificity: 30,
    }),
    unit('host-syntax', { scope: 'host', kind: 'host-adapter', specificity: 80 }),
    unit('repo-preference', { kind: 'preference', specificity: 10 }),
    unit('repo-boundary', { kind: 'boundary', specificity: 10 }),
    unit('repo-law', { kind: 'law', specificity: 10 }),
    unit('repo-procedure', { kind: 'procedure', specificity: 10 }),
  ];

  const set = composeInstructionSet(units, { target: 'domain:coding', host: 'claude' });

  assert.deepEqual(set.rules.map((rule) => rule.id), [
    'repo-law',
    'repo-boundary',
    'repo-procedure',
    'domain-procedure',
    'repo-preference',
    'host-syntax',
  ]);
  assert.deepEqual(set.target, { kind: 'domain', name: 'coding' });
  assert.equal(set.key, 'domain-coding');
  assert.equal(effectiveSetRelativePath('domain:coding'), '.fgos/instructions/effective/domain-coding.json');
  assert.ok(serializeEffectiveInstructionSet(set).endsWith('\n'));
});

test('composeInstructionSet keeps high-authority laws effective when narrower procedures refine them', () => {
  const set = composeInstructionSet([
    unit('platform-law', { kind: 'law', body: 'Never bypass platform law.' }),
    unit('domain-procedure', {
      owner: 'coding',
      authority: authority('domain', 'coding'),
      sourcePath: 'domains/coding/instructions/worktree-safety.md',
      scope: 'domain',
      kind: 'procedure',
      mode: 'refine',
      refines: ['platform-law'],
      specificity: 30,
      body: 'Apply the law to coding worktrees.',
    }),
  ], { target: 'domain:coding' });

  assert.deepEqual(set.rules.map((rule) => rule.id), ['platform-law', 'domain-procedure']);
  assert.deepEqual(set.rules.find((rule) => rule.id === 'platform-law').refinedBy, ['domain-procedure']);
  assert.equal(set.rules.find((rule) => rule.id === 'platform-law').effectiveText, 'Never bypass platform law.');
});

test('composeInstructionSet rejects duplicate active ids without valid supersession', () => {
  assert.throws(
    () => composeInstructionSet([
      unit('same-id', { sourcePath: 'core/instructions/a.md' }),
      unit('same-id', { sourcePath: 'core/instructions/b.md' }),
    ]),
    (err) => err instanceof InstructionCompositionError
      && err.conflicts.some((conflict) => conflict.code === 'DUPLICATE_ACTIVE_ID'),
  );
});

test('composeInstructionSet allows explicit supersession and records inactive provenance', () => {
  const set = composeInstructionSet([
    unit('old-procedure', { sourcePath: 'core/instructions/old.md' }),
    unit('new-procedure', { sourcePath: 'core/instructions/new.md', supersedes: ['old-procedure'] }),
  ]);

  assert.deepEqual(set.rules.map((rule) => rule.id), ['new-procedure']);
  assert.deepEqual(set.inactive, [{
    id: 'old-procedure',
    kind: 'procedure',
    owner: 'platform',
    sources: ['core/instructions/old.md'],
    reason: 'superseded',
    by: ['new-procedure'],
  }]);
});

test('composeInstructionSet rejects equal-authority override without ordered specificity winner', () => {
  assert.throws(
    () => composeInstructionSet([
      unit('base-pref', { kind: 'preference', scope: 'repo', specificity: 10 }),
      unit('same-scope-override', {
        kind: 'preference',
        mode: 'override',
        refines: ['base-pref'],
        scope: 'repo',
        specificity: 10,
      }),
    ]),
    (err) => err instanceof InstructionCompositionError
      && err.conflicts.some((conflict) => conflict.code === 'INCOMPATIBLE_ORDERING'),
  );
});

test('composeInstructionSet rejects component authority claiming repo scope to override platform preferences', () => {
  const result = evaluateInstructionComposition([
    unit('platform-pref', { kind: 'preference', scope: 'repo', specificity: 10 }),
    unit('component-repo-override', {
      owner: 'packaging-distribution',
      authority: authority('component', 'packaging-distribution'),
      sourcePath: 'components/packaging-distribution/instructions/override.md',
      kind: 'preference',
      mode: 'override',
      refines: ['platform-pref'],
      scope: 'repo',
      specificity: 20,
    }),
  ], { target: 'component:packaging-distribution' });

  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'ILLEGAL_OVERRIDE'
    && conflict.message.includes('cannot claim scope "repo"')));
});

test('composeInstructionSet orders broad scope before narrow scope regardless of caller specificity', () => {
  const set = composeInstructionSet([
    unit('repo-procedure', { kind: 'procedure', scope: 'repo', specificity: 10 }),
    unit('component-session-procedure', {
      owner: 'packaging-distribution',
      authority: authority('component', 'packaging-distribution'),
      sourcePath: 'components/packaging-distribution/instructions/session.md',
      kind: 'procedure',
      scope: 'session',
      specificity: 0,
    }),
  ], { target: 'component:packaging-distribution' });

  assert.deepEqual(set.rules.map((rule) => rule.id), ['repo-procedure', 'component-session-procedure']);
});

test('composeInstructionSet rejects narrower attempts to override laws', () => {
  assert.throws(
    () => composeInstructionSet([
      unit('locked-law', { kind: 'law' }),
      unit('domain-override', {
        owner: 'coding',
        authority: authority('domain', 'coding'),
        scope: 'domain',
        kind: 'procedure',
        mode: 'override',
        refines: ['locked-law'],
        specificity: 30,
      }),
    ], { target: 'domain:coding' }),
    (err) => err instanceof InstructionCompositionError
      && err.conflicts.some((conflict) => conflict.code === 'ILLEGAL_LAW_OVERRIDE'),
  );
});

test('composeInstructionSet requires law supersession decision evidence', () => {
  const result = evaluateInstructionComposition([
    unit('old-law', { kind: 'law' }),
    unit('new-law', { kind: 'law', supersedes: ['old-law'] }),
  ]);

  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'ILLEGAL_LAW_OVERRIDE'
    && conflict.message.includes('supersessionDecision')));
});

test('composeInstructionSet treats supersession target filtered by host applicability as missing from the effective set', () => {
  const result = evaluateInstructionComposition([
    unit('old', { appliesTo: ['gemini'] }),
    unit('new', { appliesTo: ['claude'], supersedes: ['old'] }),
  ], { host: 'claude' });

  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'MISSING_DEPENDENCY'
    && conflict.message.includes('not effective')));
});

test('composeInstructionSet rejects mutually exclusive active instructions and boundary conflicts', () => {
  const result = evaluateInstructionComposition([
    unit('boundary-a', { kind: 'boundary', conflictsWith: ['boundary-b'] }),
    unit('boundary-b', { kind: 'boundary', conflictsWith: ['boundary-a'] }),
    unit('mode-a', { conflictsWith: ['mode-b'] }),
    unit('mode-b', { conflictsWith: ['mode-a'] }),
  ]);

  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'INCOMPATIBLE_BOUNDARY_AUTHORITY'));
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'MUTUALLY_EXCLUSIVE'));
});

test('composeInstructionSet rejects missing dependencies and impossible ordering relationships', () => {
  const result = evaluateInstructionComposition([
    unit('depends-missing', { dependsOn: ['missing-rule'] }),
    unit('host-adapter-first', {
      kind: 'host-adapter',
      scope: 'host',
      specificity: 80,
    }),
    unit('late-procedure', { kind: 'procedure', specificity: 10, dependsOn: ['host-adapter-first'] }),
  ], { host: 'claude' });

  assert.equal(result.ok, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'MISSING_DEPENDENCY'));
  assert.ok(result.conflicts.some((conflict) => conflict.code === 'INCOMPATIBLE_ORDERING'));
});

test('composeAllInstructionSets emits repo plus owner-scoped sets', () => {
  const sets = composeAllInstructionSets([
    unit('repo-law', { kind: 'law' }),
    unit('component-procedure', {
      owner: 'packaging-distribution',
      authority: authority('component', 'packaging-distribution'),
      scope: 'component',
      specificity: 20,
    }),
    unit('domain-procedure', {
      owner: 'coding',
      authority: authority('domain', 'coding'),
      scope: 'domain',
      specificity: 30,
    }),
  ]);

  assert.deepEqual([...sets.keys()], ['component-packaging-distribution', 'domain-coding', 'repo']);
  assert.deepEqual(sets.get('repo').rules.map((rule) => rule.id), ['repo-law']);
  assert.deepEqual(sets.get('component-packaging-distribution').rules.map((rule) => rule.id), ['repo-law', 'component-procedure']);
  assert.deepEqual(sets.get('domain-coding').rules.map((rule) => rule.id), ['repo-law', 'domain-procedure']);
});
