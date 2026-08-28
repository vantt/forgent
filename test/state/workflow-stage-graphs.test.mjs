import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, DEFAULT_DOMAIN, resolveDomainName, getDomain, stageForStep, skillForStage, parkReasonForStatus, effectiveStage, classificationVocabulary, resolveTaskSpecPath, bundleForStage, operationsForStage } from '../../src/state/workflow-stage-graphs.mjs';
import { rebuildView } from '../../src/state/replay.mjs';
import { RISK_DISCOUNTS } from '../../src/state/priority-formula.mjs';

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

test('DOMAINS.coding.stages: "clarify" is retired entirely (tsk-qod D1/D2) — "discovery" is now stages[0], the domain\'s own entry point; "decompose" survives only as a legacy, drain-only alias (D18) ahead of "planning" (tsk-403 D11)', () => {
  assert.deepEqual(DOMAINS.coding.stages, ['discovery', 'exploring', 'decompose', 'planning', 'executing']);
});

test('DOMAINS.coding.transitions: "clarify"-sourced edges survive ONLY as the two FSM-legality edges migrate-clarify-split.mjs needs for historical data (tsk-qod D1/D2) — no new item can ever reach them (clarify carries no stages/skillMap/stepMap entry anymore); a new item\'s path branches on its own discovery verdict (tsk-30v D2/D6): "clear" walks discovery -> planning directly, "unclear" walks discovery -> exploring -> planning; both continue on to executing, plus the legacy "decompose" drain edges (tsk-403 D18)', () => {
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'discovery' },
    { from: 'clarify', to: 'exploring' },
    { from: 'decompose', to: 'executing' },
    { from: 'exploring', to: 'decompose' },
    { from: 'discovery', to: 'exploring' },
    { from: 'discovery', to: 'planning' },
    { from: 'exploring', to: 'planning' },
    { from: 'planning', to: 'executing' },
  ]);
});

test('DOMAINS.coding.stepMap maps every LIVE stage to a base-workflow step (vision §2 vocabulary) — compound-learn retired (D11); discovery/exploring carry NO step entry (tsk-1w7 D10, same "outside the 5-step vocabulary" treatment Init/Compound-learn already get); legacy decompose joins that same no-entry set (tsk-403 D18), planning takes over its Divide mapping; clarify carries NO entry at all anymore (tsk-qod D1/D2 — it is no longer a stage, not merely drain-only)', () => {
  assert.deepEqual(DOMAINS.coding.stepMap, {
    planning: 'Divide',
    executing: 'Execute',
  });
  assert.equal('clarify' in DOMAINS.coding.stepMap, false);
  assert.equal('discovery' in DOMAINS.coding.stepMap, false);
  assert.equal('exploring' in DOMAINS.coding.stepMap, false);
  assert.equal('decompose' in DOMAINS.coding.stepMap, false);
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
  // tsk-qod D1/D2: `clarify` carries NO skillMap entry anymore — it moved
  // to a pre-item-creation Init helper (`fgos-clarifying`, called directly
  // by `/fgOS:submit`), never a stage-skill loaded through this map again.
  assert.equal('clarify' in DOMAINS.coding.skillMap, false);
  assert.equal(DOMAINS.coding.skillMap.discovery, 'fgos-coding-discovering');
  assert.equal(DOMAINS.coding.skillMap.exploring, 'fgos-coding-exploring');
  // legacy `decompose` alias and the renamed `planning` stage both resolve
  // to the SAME renamed skill (tsk-403 D18) — the alias must not point at
  // a now-deleted directory name.
  assert.equal(DOMAINS.coding.skillMap.decompose, 'fgos-coding-planning');
  assert.equal(DOMAINS.coding.skillMap.planning, 'fgos-coding-planning');
  assert.equal(DOMAINS.coding.skillMap.executing, 'fgos-coding-implement');
  // fgos-coding-compounding no longer has a stage entry (D11) — it
  // triggers on status `retrospective` now, not a stage->skill lookup.
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

test("DOMAINS.coding.skillMap.retrospective is 'fgos-coding-knowledge' (tsk-28x)", () => {
  assert.equal(DOMAINS.coding.skillMap.retrospective, 'fgos-coding-knowledge');
});

test('skillForStage(DOMAINS.coding, "retrospective") resolves fgos-coding-knowledge', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'retrospective'), 'fgos-coding-knowledge');
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
  // tsk-qod D1/D2: 'clarify' is no longer in skillMap at all -- resolves
  // to null like any other absent stage, same as 'compound-learn' below.
  assert.equal(skillForStage(DOMAINS.coding, 'clarify'), null);
  assert.equal(skillForStage(DOMAINS.coding, 'discovery'), 'fgos-coding-discovering');
  assert.equal(skillForStage(DOMAINS.coding, 'exploring'), 'fgos-coding-exploring');
  assert.equal(skillForStage(DOMAINS.coding, 'decompose'), 'fgos-coding-planning');
  assert.equal(skillForStage(DOMAINS.coding, 'planning'), 'fgos-coding-planning');
  // compound-learn is retired (D11) — no longer a stage, resolves to null
  // like any other stage absent from skillMap.
  assert.equal(skillForStage(DOMAINS.coding, 'compound-learn'), null);
});

test('skillForStage(DOMAINS.coding, "executing") resolves to fgos-coding-implement', () => {
  assert.equal(skillForStage(DOMAINS.coding, 'executing'), 'fgos-coding-implement');
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
  assert.deepEqual(DOMAINS.coding.stages, ['discovery', 'exploring', 'decompose', 'planning', 'executing']);
  assert.deepEqual(DOMAINS.coding.stepMap, {
    planning: 'Divide',
    executing: 'Execute',
  });
  assert.deepEqual(DOMAINS.coding.transitions, [
    { from: 'clarify', to: 'discovery' },
    { from: 'clarify', to: 'exploring' },
    { from: 'decompose', to: 'executing' },
    { from: 'exploring', to: 'decompose' },
    { from: 'discovery', to: 'exploring' },
    { from: 'discovery', to: 'planning' },
    { from: 'exploring', to: 'planning' },
    { from: 'planning', to: 'executing' },
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

test('stageForStep resolves coding\'s two remaining live steps to their stage names', () => {
  assert.equal(stageForStep(DOMAINS.coding, 'Divide'), 'planning');
  assert.equal(stageForStep(DOMAINS.coding, 'Execute'), 'executing');
});

test('stageForStep returns undefined for a step the domain never declares (Init and Compound-learn stay outside the stage dimension); Clarify too now that coding retired it as a stage entirely (tsk-qod D1/D2)', () => {
  assert.equal(stageForStep(DOMAINS.coding, 'Init'), undefined);
  // Compound-learn is retired as a stage (D11) — the synthesis it used to
  // gate is now the status `retrospective` instead.
  assert.equal(stageForStep(DOMAINS.coding, 'Compound-learn'), undefined);
  // tsk-qod D1/D2: Clarify carries no stepMap entry anymore either -- it
  // moved to a pre-item-creation Init helper, never a stage-skill again.
  assert.equal(stageForStep(DOMAINS.coding, 'Clarify'), undefined);
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

// --- classification vocabulary (per-domain kind/risk enum) ---

test('coding declares a classification vocabulary for both kind and risk', () => {
  assert.deepEqual(classificationVocabulary(DOMAINS.coding, 'kind'), ['bug', 'chore', 'design', 'docs', 'feature', 'task']);
  assert.deepEqual(classificationVocabulary(DOMAINS.coding, 'risk'), ['light', 'standard', 'heavy']);
});

// The whole point of pinning risk to light/standard/heavy: two live consumers
// read exactly these values, and neither would fail loudly on a different
// vocabulary -- decompose.mjs's gate would just stop firing, and
// priority-formula.mjs would silently fall back to its `standard` discount.
test("coding's risk vocabulary covers every value decompose's heavy-risk gate and priority-formula's discount table read", () => {
  const risks = classificationVocabulary(DOMAINS.coding, 'risk');
  assert.ok(risks.includes('heavy'), "decompose.mjs's HEAVY_RISK gate value must stay sayable");
  assert.deepEqual([...risks].sort(), Object.keys(RISK_DISCOUNTS).sort());
});

test('a domain that declares no classification vocabulary imposes none (undefined, never a throw)', () => {
  assert.equal(classificationVocabulary(DOMAINS.synthetic, 'kind'), undefined);
  assert.equal(classificationVocabulary(DOMAINS.triage, 'risk'), undefined);
  assert.equal(classificationVocabulary(undefined, 'kind'), undefined);
  assert.equal(classificationVocabulary(DOMAINS.coding, 'nonesuch'), undefined);
});

test('DOMAINS.coding loaded from registry.yaml and workflows/feature.yaml matches expected golden shape', () => {
  assert.equal(DOMAINS.coding.defaultWorkflow, 'feature');
  assert.deepEqual(DOMAINS.coding.stages, ['discovery', 'exploring', 'decompose', 'planning', 'executing']);
  assert.deepEqual(DOMAINS.coding.stepMap, { planning: 'Divide', executing: 'Execute' });
  assert.equal(DOMAINS.coding.worktreeBacked, true);
  assert.equal(DOMAINS.coding.workerContract, '.agents/skills/_shared/coding-worker-contract.md');
  assert.deepEqual(DOMAINS.coding.workflows.feature.stages, DOMAINS.coding.stages);
  assert.deepEqual(DOMAINS.coding.workflows.feature.stepMap, DOMAINS.coding.stepMap);
  assert.deepEqual(DOMAINS.coding.workflows.feature.transitions, DOMAINS.coding.transitions);
  assert.deepEqual(DOMAINS.coding.workflows.feature.skillMap, DOMAINS.coding.skillMap);
  assert.deepEqual(DOMAINS.coding.workflows.feature.taskSpecMap, DOMAINS.coding.taskSpecMap);
});

test('resolveTaskSpecPath resolves task spec paths correctly for domains, domain objects, core, and custom cwd', () => {
  assert.equal(resolveTaskSpecPath('coding', 'implement-item'), path.join('domains', 'coding', 'task-specs', 'implement-item.md'));
  assert.equal(resolveTaskSpecPath('coding', 'implement-item', '/app'), path.join('/app', 'domains', 'coding', 'task-specs', 'implement-item.md'));
  assert.equal(resolveTaskSpecPath('coding', 'implement-item', { cwd: '/app' }), path.join('/app', 'domains', 'coding', 'task-specs', 'implement-item.md'));
  assert.equal(resolveTaskSpecPath('core', 'fgos-routing'), path.join('core', 'task-specs', 'fgos-routing.md'));
  assert.equal(resolveTaskSpecPath('core', 'fgos-routing', '/app'), path.join('/app', 'core', 'task-specs', 'fgos-routing.md'));
  assert.equal(resolveTaskSpecPath(DOMAINS.coding, 'implement-item', '/app'), path.join('/app', 'domains', 'coding', 'task-specs', 'implement-item.md'));
});

test('bundleForStage resolves {skill, taskSpec} for domain and stage (D14/D29/D30)', () => {
  assert.deepEqual(bundleForStage('coding', 'executing'), {
    skill: 'fgos-coding-implement',
    taskSpec: 'implement-item',
  });
  assert.deepEqual(bundleForStage('coding', 'discovery'), {
    skill: 'fgos-coding-discovering',
    taskSpec: 'judge-ambiguity',
  });
  assert.deepEqual(bundleForStage('coding', 'exploring'), {
    skill: 'fgos-coding-exploring',
    taskSpec: 'lock-decisions',
  });
  assert.deepEqual(bundleForStage('coding', 'planning'), {
    skill: 'fgos-coding-planning',
    taskSpec: 'shape-plan',
  });
  assert.deepEqual(bundleForStage('coding', 'retrospective'), {
    skill: 'fgos-coding-knowledge',
    taskSpec: 'compound-learn',
  });
  assert.deepEqual(bundleForStage(DOMAINS.coding, 'executing'), {
    skill: 'fgos-coding-implement',
    taskSpec: 'implement-item',
  });
  assert.deepEqual(bundleForStage('synthetic', 'assembling'), {
    skill: null,
    taskSpec: null,
  });
  assert.deepEqual(bundleForStage('coding', 'nonexistent'), {
    skill: null,
    taskSpec: null,
  });
  assert.deepEqual(bundleForStage(undefined, 'executing'), {
    skill: 'fgos-coding-implement',
    taskSpec: 'implement-item',
  });
  assert.deepEqual(bundleForStage('coding', 'executing', 'feature'), {
    skill: 'fgos-coding-implement',
    taskSpec: 'implement-item',
  });
  assert.deepEqual(bundleForStage('coding', 'executing', { kind: 'feature' }), {
    skill: 'fgos-coding-implement',
    taskSpec: 'implement-item',
  });
});

test('workflow-derived fields take precedence over registryData top-level keys in domain objects (activeWorkflow overrides registryData)', () => {
  const codingDomain = DOMAINS.coding;
  const activeWf = codingDomain.workflows[codingDomain.defaultWorkflow];
  assert.strictEqual(codingDomain.stages, activeWf.stages);
  assert.strictEqual(codingDomain.stepMap, activeWf.stepMap);
  assert.strictEqual(codingDomain.transitions, activeWf.transitions);
  assert.strictEqual(codingDomain.skillMap, activeWf.skillMap);
  assert.strictEqual(codingDomain.taskSpecMap, activeWf.taskSpecMap);
  assert.strictEqual(codingDomain.operationMap, activeWf.operationMap);
});

// --- workflow stage operations (Step 02 / D19) ---

test('DOMAINS.coding.operationMap is deeply frozen', () => {
  assert.ok(Object.isFrozen(DOMAINS.coding.operationMap));
  for (const [stage, ops] of Object.entries(DOMAINS.coding.operationMap)) {
    assert.ok(Object.isFrozen(ops), `operation list for stage "${stage}" must be frozen`);
    for (const op of ops) {
      assert.ok(Object.isFrozen(op), `operation "${op.id}" in stage "${stage}" must be frozen`);
      if (op.skills) assert.ok(Object.isFrozen(op.skills));
      if (op.policy) assert.ok(Object.isFrozen(op.policy));
      if (op.policy?.fallbackExecutors) assert.ok(Object.isFrozen(op.policy.fallbackExecutors));
    }
  }
});

test('operationsForStage resolves explicit operations for planning stage', () => {
  const ops = operationsForStage('coding', 'planning');
  assert.equal(Array.isArray(ops), true);
  assert.equal(ops.length, 4);
  assert.deepEqual(ops.map((o) => o.id), ['shape-plan', 'validate-plan', 'scout-blast-radius', 'resolve-question']);

  const primaryOp = ops.find((o) => o.primary);
  assert.ok(primaryOp);
  assert.equal(primaryOp.id, 'shape-plan');
  assert.equal(primaryOp.taskSpec, 'shape-plan');
  assert.equal(primaryOp.role, 'implementer');
  assert.deepEqual(primaryOp.skills, ['fgos-coding-planning']);

  const validateOp = ops.find((o) => o.id === 'validate-plan');
  assert.ok(validateOp);
  assert.equal(validateOp.role, 'reviewer');
  assert.equal(validateOp.reason, 'review');
  assert.deepEqual(validateOp.skills, ['fgos-coding-validating']);
  assert.deepEqual(validateOp.policy, {
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
    fallbackExecutors: ['pi'],
  });
});

test('operationsForStage resolves explicit operations for discovery, exploring, and executing stages', () => {
  const discoveryOps = operationsForStage('coding', 'discovery');
  assert.deepEqual(discoveryOps.map((o) => o.id), ['judge-ambiguity', 'resolve-question']);
  assert.equal(discoveryOps[0].primary, true);

  const exploringOps = operationsForStage('coding', 'exploring');
  assert.deepEqual(exploringOps.map((o) => o.id), ['lock-decisions', 'answer-question', 'resolve-question']);
  assert.equal(exploringOps[0].primary, true);

  const executingOps = operationsForStage('coding', 'executing');
  assert.deepEqual(executingOps.map((o) => o.id), [
    'implement-item',
    'review-item',
    'fix-verify-red',
    'scoped-subtask',
    'scout-blast-radius',
    'resolve-question',
  ]);
  assert.equal(executingOps[0].primary, true);
});

test('operationsForStage synthesizes primary operation when stage has no explicit operations (decompose)', () => {
  const ops = operationsForStage('coding', 'decompose');
  assert.equal(ops.length, 1);
  assert.deepEqual(ops[0], {
    id: 'decompose',
    primary: true,
    taskSpec: 'decompose',
    role: 'implementer',
    skills: ['fgos-coding-planning'],
  });
  assert.ok(Object.isFrozen(ops));
  assert.ok(Object.isFrozen(ops[0]));
});

test('operationsForStage returns empty array when stage has no skill and no taskSpec (synthetic domain)', () => {
  const ops = operationsForStage('synthetic', 'assembling');
  assert.deepEqual(ops, []);
  assert.ok(Object.isFrozen(ops));
});

test('operationsForStage returns empty array for nonexistent stage or undefined input and never throws', () => {
  assert.deepEqual(operationsForStage('coding', 'nonexistent-stage'), []);
  assert.deepEqual(operationsForStage('coding', ''), []);
  assert.deepEqual(operationsForStage(undefined, 'planning').map((o) => o.id), [
    'shape-plan',
    'validate-plan',
    'scout-blast-radius',
    'resolve-question',
  ]);
  assert.deepEqual(operationsForStage(DOMAINS.coding, 'planning').map((o) => o.id), [
    'shape-plan',
    'validate-plan',
    'scout-blast-radius',
    'resolve-question',
  ]);
  assert.deepEqual(operationsForStage('coding', 'planning', { kind: 'feature' }).map((o) => o.id), [
    'shape-plan',
    'validate-plan',
    'scout-blast-radius',
    'resolve-question',
  ]);
});

