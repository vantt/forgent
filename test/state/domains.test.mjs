import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, DEFAULT_DOMAIN, resolveDomainName, getDomain, stageForStep } from '../../src/state/domains.mjs';
import { rebuildView } from '../../src/state/replay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'phase1-events.jsonl');

test('DEFAULT_DOMAIN is "coding"', () => {
  assert.equal(DEFAULT_DOMAIN, 'coding');
});

test('DOMAINS has exactly one entry ("coding") — no second (synthetic) domain in this slice (D1)', () => {
  assert.deepEqual(Object.keys(DOMAINS), ['coding']);
});

test('DOMAINS.coding.stages is byte-for-byte the pre-retrofit work.mjs STAGES value', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['clarify', 'decompose', 'executing']);
});

test('DOMAINS.coding.transitions is byte-for-byte the pre-retrofit stage.mjs STAGE_TRANSITIONS value', () => {
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'executing' },
    { from: 'clarify', to: 'decompose' },
    { from: 'decompose', to: 'executing' },
  ]);
});

test('DOMAINS.coding.stepMap maps every stage to a base-workflow step (vision §2 vocabulary)', () => {
  assert.deepEqual(DOMAINS.coding.stepMap, {
    clarify: 'Clarify',
    decompose: 'Divide',
    executing: 'Execute',
  });
});

test('DOMAINS is deeply frozen: the registry, each domain entry, and each nested array/object reject mutation', () => {
  assert.ok(Object.isFrozen(DOMAINS));
  assert.ok(Object.isFrozen(DOMAINS.coding));
  assert.ok(Object.isFrozen(DOMAINS.coding.stages));
  assert.ok(Object.isFrozen(DOMAINS.coding.stepMap));
  assert.ok(Object.isFrozen(DOMAINS.coding.transitions));
  assert.ok(Object.isFrozen(DOMAINS.coding.transitions[0]));
});

// --- resolveDomainName / getDomain: the fail-safe (must_have) ---

test('resolveDomainName treats an absent domain (undefined or null) as the default, silently (no onUnrecognized call)', () => {
  let called = false;
  assert.equal(resolveDomainName(undefined, { onUnrecognized: () => { called = true; } }), DEFAULT_DOMAIN);
  assert.equal(resolveDomainName(null, { onUnrecognized: () => { called = true; } }), DEFAULT_DOMAIN);
  assert.equal(called, false, 'absent domain is expected, not an anomaly — must never warn');
});

test('resolveDomainName passes through a recognized domain name unchanged', () => {
  assert.equal(resolveDomainName('coding'), 'coding');
});

test('resolveDomainName folds an unrecognized domain to the default and never throws', () => {
  assert.doesNotThrow(() => resolveDomainName('marketing'));
  assert.equal(resolveDomainName('marketing'), DEFAULT_DOMAIN);
});

test('resolveDomainName reports an unrecognized domain via onUnrecognized when supplied, with the bad value', () => {
  let seen;
  const resolved = resolveDomainName('bogus', { onUnrecognized: (bad) => { seen = bad; } });
  assert.equal(resolved, DEFAULT_DOMAIN);
  assert.equal(seen, 'bogus');
});

test('resolveDomainName falls back to a bare console.warn (never throws) when no onUnrecognized is supplied', () => {
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    assert.doesNotThrow(() => resolveDomainName('rogue-domain'));
    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /rogue-domain/);
  } finally {
    console.warn = original;
  }
});

test('getDomain resolves straight to the registry entry, folding an unrecognized name to coding', () => {
  assert.equal(getDomain('coding'), DOMAINS.coding);
  assert.equal(getDomain(undefined), DOMAINS.coding);
  assert.equal(getDomain('nonexistent', { onUnrecognized: () => {} }), DOMAINS.coding);
});

// --- stageForStep ---

test('stageForStep resolves each of coding\'s three steps to its stage name', () => {
  assert.equal(stageForStep(DOMAINS.coding, 'Clarify'), 'clarify');
  assert.equal(stageForStep(DOMAINS.coding, 'Divide'), 'decompose');
  assert.equal(stageForStep(DOMAINS.coding, 'Execute'), 'executing');
});

test('stageForStep returns undefined for a step the domain never declares (Init/Compound-learn are outside the stage dimension)', () => {
  assert.equal(stageForStep(DOMAINS.coding, 'Init'), undefined);
  assert.equal(stageForStep(DOMAINS.coding, 'Compound-learn'), undefined);
});

// --- rebuild-determinism (must_have): replaying an event log with zero
// "domain" events must still produce the exact pre-retrofit view — this
// retrofit never stamps a domain value onto anything, and every item reads
// as 'coding' purely through the lazy default. ---

test('rebuild-determinism (domain retrofit): the fixture log (zero domain events) rebuilds to the exact pre-retrofit view — no item gains a "domain" key', () => {
  const view = rebuildView(FIXTURE_PATH);
  assert.deepEqual(view, {
    work: {
      'setup-repo': {
        id: 'setup-repo',
        title: 'Setup repo',
        kind: 'chore',
        status: 'done',
        deps: [],
        risk: 'low',
        refs: [],
        verify: 'npm test',
        tier: 'standard',
      },
      'design-api': {
        id: 'design-api',
        title: 'Thiết kế API — 设计',
        kind: 'design',
        status: 'doing',
        deps: ['setup-repo'],
        risk: 'medium',
        refs: ['docs/spec.md'],
        verify: 'review passes',
        tier: 'standard',
      },
      'build-feature': {
        id: 'build-feature',
        title: 'Build feature',
        kind: 'feature',
        status: 'todo',
        deps: ['design-api'],
        risk: 'high',
        refs: [],
        verify: 'npm test',
        tier: 'standard',
      },
    },
    decisions: [{ text: 'Chose fgos naming convention', ts: '2026-07-14T06:17:16.363Z' }],
  });
  for (const item of Object.values(view.work)) {
    assert.equal('domain' in item, false);
  }
});
