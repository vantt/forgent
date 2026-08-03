import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, DEFAULT_DOMAIN, resolveDomainName, getDomain, stageForStep, skillForStage } from '../../src/state/workflow-stage-graphs.mjs';
import { rebuildView } from '../../src/state/replay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'phase1-events.jsonl');

test('DEFAULT_DOMAIN is "coding"', () => {
  assert.equal(DEFAULT_DOMAIN, 'coding');
});

test('DOMAINS has exactly two entries: "coding" and "synthetic"', () => {
  assert.deepEqual(Object.keys(DOMAINS), ['coding', 'synthetic']);
});

test('DOMAINS.coding.stages is the pre-retrofit work.mjs STAGES value — compound-learn retired (D11)', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['clarify', 'decompose', 'executing']);
});

test('DOMAINS.coding.transitions is the pre-retrofit stage.mjs STAGE_TRANSITIONS value — the executing->compound-learn edge is retired (D11)', () => {
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'executing' },
    { from: 'clarify', to: 'decompose' },
    { from: 'decompose', to: 'executing' },
  ]);
});

test('DOMAINS.coding.stepMap maps every stage to a base-workflow step (vision §2 vocabulary) — compound-learn retired (D11)', () => {
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
  assert.ok(Object.isFrozen(DOMAINS.coding.skillMap));
});

// --- skillMap / skillForStage (str89-fgos-domain-skills D3/D4) ---

test('DOMAINS.coding.skillMap has an entry for every stage in DOMAINS.coding.stages', () => {
  for (const stage of DOMAINS.coding.stages) {
    assert.ok(Object.hasOwn(DOMAINS.coding.skillMap, stage), `missing skillMap entry for stage "${stage}"`);
  }
});

test('DOMAINS.coding.skillMap maps every stage, including executing, to its skill', () => {
  assert.equal(DOMAINS.coding.skillMap.clarify, 'fgos-exploring');
  assert.equal(DOMAINS.coding.skillMap.decompose, 'fgos-planning');
  assert.equal(DOMAINS.coding.skillMap.executing, 'fgos-executing');
  // fgos-compounding no longer has a stage entry (D11) — it triggers on
  // status `retrospective` now, not a stage->skill lookup.
  assert.equal('compound-learn' in DOMAINS.coding.skillMap, false);
});

test('DOMAINS.synthetic.skillMap.assembling is null (synthetic has never loaded a skill)', () => {
  assert.equal(DOMAINS.synthetic.skillMap.assembling, null);
  assert.ok(Object.isFrozen(DOMAINS.synthetic.skillMap));
});

// --- worktreeBacked (work-item-status-delivered-retrospective-cleanup D5/D8) ---

test('DOMAINS.coding.worktreeBacked is true (real git merges, cleanup-harness must verify them)', () => {
  assert.equal(DOMAINS.coding.worktreeBacked, true);
});

test('DOMAINS.synthetic.worktreeBacked is false (no real worktree/merge ever happens for this domain)', () => {
  assert.equal(DOMAINS.synthetic.worktreeBacked, false);
});

test('skillForStage resolves each of coding\'s mapped stages to its skill name', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'clarify'), 'fgos-exploring');
  assert.equal(skillForStage(DOMAINS.coding, 'decompose'), 'fgos-planning');
  // compound-learn is retired (D11) — no longer a stage, resolves to null
  // like any other stage absent from skillMap.
  assert.equal(skillForStage(DOMAINS.coding, 'compound-learn'), null);
});

test('skillForStage(DOMAINS.coding, "executing") resolves to fgos-executing', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'executing'), 'fgos-executing');
});

test('skillForStage never throws for a stage absent from a domain\'s skillMap, returning null', () => {
  assert.doesNotThrow(() => skillForStage(DOMAINS.synthetic, 'nonexistent-stage'));
  assert.equal(skillForStage(DOMAINS.synthetic, 'nonexistent-stage'), null);
  assert.equal(skillForStage(DOMAINS.coding, 'nonexistent-stage'), null);
});

// --- 'synthetic' domain (Slice 2, D1/D4): illustrative/disposable, exactly
// one stage mapped only to 'Execute' — no Clarify/Divide mapping (approach.md
// Boundary correction), zero effect on the existing 'coding' entry. ---

test("DOMAINS.synthetic declares exactly one stage, 'assembling'", () => {
  assert.deepEqual(DOMAINS.synthetic.stages, ['assembling']);
});

test("DOMAINS.synthetic.stepMap maps 'assembling' only to 'Execute' — never Clarify or Divide", () => {
  assert.deepEqual(DOMAINS.synthetic.stepMap, { assembling: 'Execute' });
});

test('DOMAINS.synthetic.transitions is empty (a single-stage domain has no legal stage-move edges)', () => {
  assert.deepEqual(DOMAINS.synthetic.transitions, []);
});

test('DOMAINS.synthetic is deeply frozen: the entry and its nested array/object reject mutation', () => {
  assert.ok(Object.isFrozen(DOMAINS.synthetic));
  assert.ok(Object.isFrozen(DOMAINS.synthetic.stages));
  assert.ok(Object.isFrozen(DOMAINS.synthetic.stepMap));
  assert.ok(Object.isFrozen(DOMAINS.synthetic.transitions));
});

test('adding "synthetic" leaves DOMAINS.coding unchanged', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['clarify', 'decompose', 'executing']);
  assert.deepEqual(DOMAINS.coding.stepMap, {
    clarify: 'Clarify',
    decompose: 'Divide',
    executing: 'Execute',
  });
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'executing' },
    { from: 'clarify', to: 'decompose' },
    { from: 'decompose', to: 'executing' },
  ]);
});

test('resolveDomainName passes through "synthetic" unchanged', () => {
  assert.equal(resolveDomainName('synthetic'), 'synthetic');
});

test('getDomain resolves "synthetic" to its own registry entry', () => {
  assert.equal(getDomain('synthetic'), DOMAINS.synthetic);
});

test("stageForStep resolves synthetic's one step to 'assembling', and returns undefined for every other step", () => {
  assert.equal(stageForStep(DOMAINS.synthetic, 'Execute'), 'assembling');
  assert.equal(stageForStep(DOMAINS.synthetic, 'Clarify'), undefined);
  assert.equal(stageForStep(DOMAINS.synthetic, 'Divide'), undefined);
  assert.equal(stageForStep(DOMAINS.synthetic, 'Init'), undefined);
  assert.equal(stageForStep(DOMAINS.synthetic, 'Compound-learn'), undefined);
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

test('stageForStep returns undefined for a step the domain never declares (Init and Compound-learn stay outside the stage dimension)', () => {
  assert.equal(stageForStep(DOMAINS.coding, 'Init'), undefined);
  // Compound-learn is retired as a stage (D11) — the synthesis it used to
  // gate is now the status `retrospective` instead.
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
