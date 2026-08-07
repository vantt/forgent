import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, DEFAULT_DOMAIN, resolveDomainName, getDomain, stageForStep, skillForStage, parkReasonForStatus, effectiveStage } from '../../src/state/workflow-stage-graphs.mjs';
import { rebuildView } from '../../src/state/replay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'phase1-events.jsonl');

test('DEFAULT_DOMAIN is "coding"', () => {
  assert.equal(DEFAULT_DOMAIN, 'coding');
});

test('DOMAINS has exactly four entries: "coding", "synthetic", "triage", and "fixture-marketing" (tsk-38t-7 capstone fixture)', () => {
  assert.deepEqual(Object.keys(DOMAINS), ['coding', 'synthetic', 'triage', 'fixture-marketing']);
});

test('DOMAINS.triage (tsk-3xo regression fixture) maps Clarify/Divide/Execute under non-coding-literal stage names', () => {
  assert.deepEqual(DOMAINS.triage.stages, ['triage', 'shaping', 'assembling']);
  assert.deepEqual(DOMAINS.triage.stepMap, {
    triage: 'Clarify',
    shaping: 'Divide',
    assembling: 'Execute',
  });
  assert.deepEqual(DOMAINS.triage.transitions, [
    { from: 'triage', to: 'assembling' },
    { from: 'triage', to: 'shaping' },
    { from: 'shaping', to: 'assembling' },
  ]);
  assert.equal(stageForStep(DOMAINS.triage, 'Clarify'), 'triage');
  assert.equal(stageForStep(DOMAINS.triage, 'Divide'), 'shaping');
  assert.equal(stageForStep(DOMAINS.triage, 'Execute'), 'assembling');
});

test('DOMAINS.coding.stages adds "discovery" and "exploring" between clarify and decompose (tsk-1w7 D10) — compound-learn stays retired (D11)', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['clarify', 'discovery', 'exploring', 'decompose', 'executing']);
});

test('DOMAINS.coding.transitions keeps the three pre-existing edges byte-for-byte (discovery.mjs/decompose.mjs are untouched by tsk-1w7, still fire them) and adds the three new D10 edges, plus tsk-puz D12\'s direct clarify->exploring migration jump', () => {
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'executing' },
    { from: 'clarify', to: 'decompose' },
    { from: 'decompose', to: 'executing' },
    { from: 'clarify', to: 'discovery' },
    { from: 'discovery', to: 'exploring' },
    { from: 'exploring', to: 'decompose' },
    { from: 'clarify', to: 'exploring' },
  ]);
});

test('DOMAINS.coding.stepMap maps every stage to a base-workflow step (vision §2 vocabulary) — compound-learn retired (D11); discovery/exploring carry NO step entry (tsk-1w7 D10, same "outside the 5-step vocabulary" treatment Init/Compound-learn already get)', () => {
  assert.deepEqual(DOMAINS.coding.stepMap, {
    clarify: 'Clarify',
    decompose: 'Divide',
    executing: 'Execute',
  });
  assert.equal('discovery' in DOMAINS.coding.stepMap, false);
  assert.equal('exploring' in DOMAINS.coding.stepMap, false);
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
  // tsk-1w7 D10/D13: clarify now runs the NEW lightweight self-judging
  // skill; the OLD deep Socratic-lock skill (still named fgos-exploring,
  // unchanged file) moves to the NEW `exploring` stage instead.
  assert.equal(DOMAINS.coding.skillMap.clarify, 'fgos-clarifying');
  assert.equal(DOMAINS.coding.skillMap.discovery, 'fgos-researching');
  assert.equal(DOMAINS.coding.skillMap.exploring, 'fgos-exploring');
  assert.equal(DOMAINS.coding.skillMap.decompose, 'fgos-planning');
  assert.equal(DOMAINS.coding.skillMap.executing, 'fgos-code-implement');
  // fgos-compounding no longer has a stage entry (D11) — it triggers on
  // status `retrospective` now, not a stage->skill lookup.
  assert.equal('compound-learn' in DOMAINS.coding.skillMap, false);
});

test('DOMAINS.synthetic.skillMap.assembling is null (synthetic has never loaded a skill)', () => {
  assert.equal(DOMAINS.synthetic.skillMap.assembling, null);
  assert.ok(Object.isFrozen(DOMAINS.synthetic.skillMap));
});

// --- skillMap.retrospective (decision record 0027, D5) — a `status` key
// reused on the same `skillMap` field the three `stage` keys above already
// use, resolving which skill fgOS's retrospective loop (/fgOS:retro-next)
// should run for a domain's status:retrospective items. ---

test("DOMAINS.coding.skillMap.retrospective is 'fgos-compounding' (0027 D5 — zero regression, coding's synthesis skill does not change)", () => {
  assert.equal(DOMAINS.coding.skillMap.retrospective, 'fgos-compounding');
});

test('skillForStage(DOMAINS.coding, "retrospective") resolves fgos-compounding — skillForStage is a generic skillMap[key] lookup, not scoped to `stage` names by implementation, only by its usual callers', () => {
  // skillForStage's body (`(domain.skillMap && domain.skillMap[stage]) ??
  // null`) never inspects whether `stage` is actually one of
  // DOMAINS.coding.stages — it is safe and correct to reuse it here for
  // the status key `retrospective` exactly as /fgOS:retro-next's own
  // SKILL.md now does, rather than writing a second, redundant accessor.
  assert.equal(skillForStage(DOMAINS.coding, 'retrospective'), 'fgos-compounding');
});

test('skillForStage falls back to null for "retrospective" on a domain that declares no skillMap.retrospective entry (synthetic, triage) — the caller-side ?? \'fgos-compounding\' fallback documented in retro-next/SKILL.md step 4 covers this case', () => {
  assert.equal(skillForStage(DOMAINS.synthetic, 'retrospective'), null);
  assert.equal(skillForStage(DOMAINS.triage, 'retrospective'), null);
});

// --- worktreeBacked (work-item-status-delivered-retrospective-cleanup D5/D8) ---

test('DOMAINS.coding.worktreeBacked is true (real git merges, cleanup-harness must verify them)', () => {
  assert.equal(DOMAINS.coding.worktreeBacked, true);
});

test('DOMAINS.synthetic.worktreeBacked is false (no real worktree/merge ever happens for this domain)', () => {
  assert.equal(DOMAINS.synthetic.worktreeBacked, false);
});

// --- parkReason / parkReasonForStatus (tsk-3w3 follow-up: fgos-coding-driving's
// stop-condition checks resolved through the registry instead of a literal
// status comparison, same "resolve don't hardcode" shape as stageForStep) ---

test('parkReasonForStatus resolves each of coding\'s three park statuses to its own reason', () => {
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'blocked'), 'system-error');
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'awaiting-human'), 'human-question');
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'awaiting-approval'), 'natural-finish');
});

test('parkReasonForStatus is undefined for a coding status that is not a park state', () => {
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'todo'), undefined);
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'doing'), undefined);
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'delivered'), undefined);
});

test('parkReasonForStatus is undefined for a domain that declares no parkReason table at all (synthetic, triage — never driven through fgos-coding-driving for real)', () => {
  assert.equal(parkReasonForStatus(DOMAINS.synthetic, 'blocked'), undefined);
  assert.equal(parkReasonForStatus(DOMAINS.triage, 'awaiting-human'), undefined);
});

test('parkReasonForStatus never throws on a null/undefined domain', () => {
  assert.equal(parkReasonForStatus(undefined, 'blocked'), undefined);
  assert.equal(parkReasonForStatus(null, 'blocked'), undefined);
});

test('skillForStage resolves each of coding\'s mapped stages to its skill name', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'clarify'), 'fgos-clarifying');
  assert.equal(skillForStage(DOMAINS.coding, 'discovery'), 'fgos-researching');
  assert.equal(skillForStage(DOMAINS.coding, 'exploring'), 'fgos-exploring');
  assert.equal(skillForStage(DOMAINS.coding, 'decompose'), 'fgos-planning');
  // compound-learn is retired (D11) — no longer a stage, resolves to null
  // like any other stage absent from skillMap.
  assert.equal(skillForStage(DOMAINS.coding, 'compound-learn'), null);
});

test('skillForStage(DOMAINS.coding, "executing") resolves to fgos-code-implement', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'executing'), 'fgos-code-implement');
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
  assert.deepEqual(DOMAINS.coding.stages, ['clarify', 'discovery', 'exploring', 'decompose', 'executing']);
  assert.deepEqual(DOMAINS.coding.stepMap, {
    clarify: 'Clarify',
    decompose: 'Divide',
    executing: 'Execute',
  });
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'executing' },
    { from: 'clarify', to: 'decompose' },
    { from: 'decompose', to: 'executing' },
    { from: 'clarify', to: 'discovery' },
    { from: 'discovery', to: 'exploring' },
    { from: 'exploring', to: 'decompose' },
    { from: 'clarify', to: 'exploring' },
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

// --- effectiveStage (tsk-4zj D1/D4) ---

test('effectiveStage returns the explicit stage as-is when present', () => {
  assert.equal(effectiveStage({ stage: 'clarify' }, DOMAINS.coding), 'clarify');
  assert.equal(effectiveStage({ stage: 'decompose' }, DOMAINS.coding), 'decompose');
});

test('effectiveStage defaults to the domain\'s Execute-mapped stage when stage is absent', () => {
  assert.equal(effectiveStage({}, DOMAINS.coding), 'executing');
  assert.equal(effectiveStage({}, DOMAINS.synthetic), 'assembling');
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
