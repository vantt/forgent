import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOMAINS,
  DEFAULT_DOMAIN,
  resolveDomainName,
  getDomain,
  resolveWorkflow,
  domainSteps,
  stepForPhase,
  discoverableSteps,
  effectiveStep,
  isLegalStepMove,
  skillForStep,
  bundleForStep,
  operationsForStep,
  parkReasonForStatus,
  statusCategoryFor,
  classificationVocabulary,
  roleGraphFor,
  legalCallEdges,
} from '../../src/state/domain-registry.mjs';
import { resolveTaskSpecPath } from '../../src/runner/paths.mjs';
import { rebuildView } from '../../src/state/replay.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'phase1-events.jsonl');

test('DEFAULT_DOMAIN is "coding"', () => {
  assert.equal(DEFAULT_DOMAIN, 'coding');
});

test('DOMAINS has exactly four entries: "coding", "synthetic", "triage", and "fixture-marketing"', () => {
  assert.deepEqual(Object.keys(DOMAINS).sort(), ['coding', 'fixture-marketing', 'synthetic', 'triage']);
});

test('DOMAINS holds Work-lifecycle data only: no domain carries a stage graph of its own', () => {
  for (const [name, domain] of Object.entries(DOMAINS)) {
    for (const retired of ['stages', 'stepMap', 'transitions', 'skillMap', 'taskSpecMap', 'operationMap']) {
      assert.equal(Object.hasOwn(domain, retired), false, `${name} must not declare "${retired}"`);
    }
    assert.ok(domain.workflows && Object.keys(domain.workflows).length > 0, `${name} must declare a workflow`);
  }
});

test('DOMAINS is deeply frozen: the registry, each domain entry, and the Workflow data reject mutation', () => {
  assert.ok(Object.isFrozen(DOMAINS));
  assert.ok(Object.isFrozen(DOMAINS.coding));
  assert.ok(Object.isFrozen(DOMAINS.coding.workflows));
  const feature = DOMAINS.coding.workflows.feature;
  assert.ok(Object.isFrozen(feature));
  assert.ok(Object.isFrozen(feature.steps));
  assert.ok(Object.isFrozen(feature.steps[0]));
  assert.ok(Object.isFrozen(feature.transitions));
  assert.ok(Object.isFrozen(feature.transitions[0]));
  assert.ok(Object.isFrozen(feature.steps.find((s) => s.operations.length > 0).operations));
});

// --- the coding Workflow (domains/coding/workflows/feature.yaml) as the Work lifecycle reads it ---

test('coding/feature: the Work-walkable steps, in order — "clarify" is retired, "decompose" is only an alias', () => {
  const coding = getDomain('coding');
  assert.deepEqual(domainSteps(coding), ['discovery', 'exploring', 'planning', 'executing']);
  assert.deepEqual(resolveWorkflow(coding).aliases, { decompose: 'planning' });
});

test('coding/feature: every walkable step plays a phase, and the phases resolve to the expected steps', () => {
  const coding = getDomain('coding');
  assert.equal(stepForPhase(coding, 'clarify'), undefined);
  assert.equal(stepForPhase(coding, 'discover'), 'discovery');
  assert.equal(stepForPhase(coding, 'plan'), 'planning');
  assert.equal(stepForPhase(coding, 'execute'), 'executing');
  assert.deepEqual(discoverableSteps(coding), ['discovery', 'exploring']);
});

test('coding/feature: legal step moves are exactly the Workflow transitions; a clear discovery may skip exploring', () => {
  const coding = getDomain('coding');
  assert.equal(isLegalStepMove(coding, undefined, 'discovery', 'exploring'), true);
  assert.equal(isLegalStepMove(coding, undefined, 'discovery', 'planning'), true);
  assert.equal(isLegalStepMove(coding, undefined, 'exploring', 'planning'), true);
  assert.equal(isLegalStepMove(coding, undefined, 'planning', 'executing'), true);
  assert.equal(isLegalStepMove(coding, undefined, 'executing', 'planning'), false);
  assert.equal(isLegalStepMove(coding, undefined, 'discovery', 'executing'), false);
});

test('effectiveStep returns the recorded step as-is, resolves an older name, and defaults to the execute step when absent', () => {
  const coding = getDomain('coding');
  assert.equal(effectiveStep({ workflowStep: 'planning' }, coding), 'planning');
  assert.equal(effectiveStep({ workflowStep: 'decompose' }, coding), 'planning');
  assert.equal(effectiveStep({}, coding), 'executing');
  assert.equal(effectiveStep({}, getDomain('triage')), 'assembling');
});

test('skillForStep resolves each coding step to its skill, a status handled by a skill, and null otherwise', () => {
  const coding = getDomain('coding');
  assert.equal(skillForStep(coding, 'discovery'), 'fgos-coding-discovering');
  assert.equal(skillForStep(coding, 'exploring'), 'fgos-coding-exploring');
  assert.equal(skillForStep(coding, 'planning'), 'fgos-coding-planning');
  assert.equal(skillForStep(coding, 'executing'), 'fgos-coding-implement');
  assert.equal(skillForStep(coding, 'retrospective'), 'fgos-coding-knowledge');
  assert.equal(skillForStep(coding, 'no-such-step'), null);
  assert.equal(skillForStep(getDomain('synthetic'), 'assembling'), null);
});

test('skillForStep on a domain with no retrospective status skill returns null (synthetic, triage); fixture-marketing has its own', () => {
  assert.equal(skillForStep(getDomain('synthetic'), 'retrospective'), null);
  assert.equal(skillForStep(getDomain('triage'), 'retrospective'), null);
  assert.equal(skillForStep(getDomain('fixture-marketing'), 'retrospective'), 'fgos-fixture-retro');
});

test('bundleForStep resolves {skill, taskSpec} for a step or a status', () => {
  const coding = getDomain('coding');
  assert.deepEqual(bundleForStep(coding, 'executing'), { skill: 'fgos-coding-implement', taskSpec: 'implement-item' });
  assert.deepEqual(bundleForStep(coding, 'planning'), { skill: 'fgos-coding-planning', taskSpec: 'shape-plan' });
  assert.deepEqual(bundleForStep(coding, 'retrospective'), { skill: 'fgos-coding-knowledge', taskSpec: 'compound-learn' });
  assert.deepEqual(bundleForStep(coding, 'no-such-step'), { skill: null, taskSpec: null });
});

test('operationsForStep resolves the explicit operations a step declares, primary first', () => {
  const coding = getDomain('coding');
  assert.deepEqual(operationsForStep(coding, 'planning').map((o) => o.id), ['shape-plan', 'validate-plan', 'scout-blast-radius', 'resolve-question']);
  assert.deepEqual(operationsForStep(coding, 'discovery').map((o) => o.id), ['judge-ambiguity', 'resolve-question']);
  assert.deepEqual(operationsForStep(coding, 'exploring').map((o) => o.id), ['lock-decisions', 'answer-question', 'resolve-question']);
  assert.deepEqual(
    operationsForStep(coding, 'executing').map((o) => o.id),
    ['implement-item', 'review-item', 'fix-verify-red', 'scoped-subtask', 'scout-blast-radius', 'resolve-question'],
  );
  assert.equal(operationsForStep(coding, 'planning').find((o) => o.primary).id, 'shape-plan');
});

test('operationsForStep carries the role, reason, skills, dispatch mode and policy each operation declares', () => {
  const coding = getDomain('coding');
  const validate = operationsForStep(coding, 'planning').find((o) => o.id === 'validate-plan');
  assert.equal(validate.role, 'reviewer');
  assert.equal(validate.reason, 'review');
  assert.deepEqual(validate.skills, ['fgos-coding-validating']);
  assert.deepEqual(validate.policy, { rigor: 'standard' });
  const answer = operationsForStep(coding, 'exploring').find((o) => o.id === 'answer-question');
  assert.equal(answer.dispatch, 'human-only');
});

test('operationsForStep returns [] for a step with no operations and no skill, an unknown step, or no step, and never throws', () => {
  assert.deepEqual(operationsForStep(getDomain('synthetic'), 'assembling'), []);
  assert.deepEqual(operationsForStep(getDomain('coding'), 'no-such-step'), []);
  assert.deepEqual(operationsForStep(getDomain('coding'), undefined), []);
  assert.deepEqual(operationsForStep(undefined, 'planning'), []);
});

// --- fixture domains prove the lifecycle reads phases generically, not a coding literal ---

test('DOMAINS.triage maps clarify/plan/execute phases under non-coding step names', () => {
  const triage = getDomain('triage');
  assert.deepEqual(domainSteps(triage), ['triage', 'shaping', 'assembling']);
  assert.equal(stepForPhase(triage, 'clarify'), 'triage');
  assert.equal(stepForPhase(triage, 'plan'), 'shaping');
  assert.equal(stepForPhase(triage, 'execute'), 'assembling');
  assert.deepEqual(discoverableSteps(triage), ['triage']);
  assert.equal(isLegalStepMove(triage, undefined, 'triage', 'assembling'), true);
  assert.equal(isLegalStepMove(triage, undefined, 'triage', 'shaping'), true);
  assert.equal(isLegalStepMove(triage, undefined, 'shaping', 'assembling'), true);
  assert.equal(isLegalStepMove(triage, undefined, 'assembling', 'triage'), false);
});

test('DOMAINS.synthetic declares exactly one step, the execute step, and no legal move', () => {
  const synthetic = getDomain('synthetic');
  assert.deepEqual(domainSteps(synthetic), ['assembling']);
  assert.equal(stepForPhase(synthetic, 'execute'), 'assembling');
  assert.equal(stepForPhase(synthetic, 'clarify'), undefined);
  assert.equal(stepForPhase(synthetic, 'plan'), undefined);
  assert.deepEqual(resolveWorkflow(synthetic).transitions, []);
  assert.equal(synthetic.worktreeBacked, false);
});

test('adding fixture domains leaves DOMAINS.coding unchanged', () => {
  const coding = getDomain('coding');
  assert.equal(coding.worktreeBacked, true);
  assert.equal(coding.workerContract, '.agents/skills/_shared/coding-worker-contract.md');
  assert.equal(coding.defaultWorkflow, 'feature');
});

test('DOMAINS.fixture-marketing carries its own statusLabels where blocked means canceled', () => {
  const fixture = getDomain('fixture-marketing');
  assert.equal(statusCategoryFor(fixture, 'blocked'), 'canceled');
  assert.equal(statusCategoryFor(getDomain('coding'), 'blocked'), 'in-progress');
});

// --- domain resolution ---

test('resolveDomainName treats an absent domain (undefined or null) as the default, silently (no onUnrecognized call)', () => {
  let called = false;
  assert.equal(resolveDomainName(undefined, { onUnrecognized: () => { called = true; } }), DEFAULT_DOMAIN);
  assert.equal(resolveDomainName(null, { onUnrecognized: () => { called = true; } }), DEFAULT_DOMAIN);
  assert.equal(called, false);
});

test('resolveDomainName passes through a recognized domain name unchanged', () => {
  for (const name of Object.keys(DOMAINS)) assert.equal(resolveDomainName(name), name);
});

test('resolveDomainName folds an unrecognized domain to the default and never throws', () => {
  assert.equal(resolveDomainName('bogus', { onUnrecognized: () => {} }), DEFAULT_DOMAIN);
});

test('resolveDomainName reports an unrecognized domain via onUnrecognized when supplied, with the bad value', () => {
  const seen = [];
  resolveDomainName('bogus', { onUnrecognized: (bad) => seen.push(bad) });
  assert.deepEqual(seen, ['bogus']);
});

test('resolveDomainName falls back to a bare console.warn (never throws) when no onUnrecognized is supplied', () => {
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    assert.equal(resolveDomainName('bogus'), DEFAULT_DOMAIN);
    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /bogus/);
  } finally {
    console.warn = original;
  }
});

test('getDomain resolves straight to the registry entry, folding an unrecognized name to coding', () => {
  assert.equal(getDomain('triage'), DOMAINS.triage);
  assert.equal(getDomain('bogus', { onUnrecognized: () => {} }), DOMAINS.coding);
  assert.equal(getDomain(undefined), DOMAINS.coding);
});

// --- status / park reason / classification (Work-lifecycle data in registry.yaml) ---

test('parkReasonForStatus resolves each of coding\'s three park statuses to its own reason', () => {
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'blocked'), 'system-error');
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'awaiting-human'), 'human-question');
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'awaiting-approval'), 'natural-finish');
});

test('parkReasonForStatus is undefined for a non-park coding status, a domain with no table, or no domain at all', () => {
  assert.equal(parkReasonForStatus(DOMAINS.coding, 'todo'), undefined);
  assert.equal(parkReasonForStatus(DOMAINS.synthetic, 'blocked'), undefined);
  assert.equal(parkReasonForStatus(undefined, 'blocked'), undefined);
  assert.equal(parkReasonForStatus(null, 'blocked'), undefined);
});

test('coding declares a classification vocabulary for both kind and risk; a domain that declares none imposes none', () => {
  assert.deepEqual(classificationVocabulary(DOMAINS.coding, 'kind'), ['bug', 'chore', 'design', 'docs', 'feature', 'task']);
  assert.deepEqual(classificationVocabulary(DOMAINS.coding, 'risk'), ['light', 'standard', 'heavy']);
  assert.equal(classificationVocabulary(DOMAINS.synthetic, 'risk'), undefined);
  assert.equal(classificationVocabulary(undefined, 'kind'), undefined);
});

test('the role graph is keyed by step id and the legacy "decompose" key is gone', () => {
  const graph = roleGraphFor(DOMAINS.coding);
  assert.deepEqual(Object.keys(graph.edges).sort(), ['discovery', 'executing', 'exploring', 'planning']);
  assert.ok(legalCallEdges(DOMAINS.coding, 'planning', 'implementer').length > 0);
  assert.deepEqual(legalCallEdges(DOMAINS.coding, 'decompose', 'implementer'), []);
});

// --- task-spec paths ---

test('resolveTaskSpecPath resolves task spec paths for domains, core, and custom cwd', () => {
  assert.equal(resolveTaskSpecPath('coding', 'implement-item'), path.join('domains', 'coding', 'task-specs', 'implement-item.md'));
  assert.equal(resolveTaskSpecPath('coding', 'implement-item', '/app'), path.join('/app', 'domains', 'coding', 'task-specs', 'implement-item.md'));
  assert.equal(resolveTaskSpecPath('core', 'fgos-routing'), path.join('core', 'task-specs', 'fgos-routing.md'));
});

// --- replay ---

test('rebuild-determinism: the fixture log (zero domain events) rebuilds to the exact pre-retrofit view — no item gains a "domain" or step key', () => {
  const view = rebuildView(FIXTURE_PATH);
  for (const item of Object.values(view.work)) {
    assert.equal('domain' in item, false);
    assert.equal('workflowStep' in item, false);
    assert.equal('stage' in item, false);
  }
  assert.deepEqual(Object.keys(view.work), ['setup-repo', 'design-api', 'build-feature']);
});

// The Rust work-state reader keeps its own copy of each domain's entry step (a contract file
// it embeds at build time). It must name the same step the Workflows declare.
test('packages/work-state/contracts/domain-entry-steps.json matches the entry step of every domain Workflow', async () => {
  const fs = await import('node:fs');
  const contract = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'work-state', 'contracts', 'domain-entry-steps.json'), 'utf8'));
  const expected = {};
  for (const [name, domain] of Object.entries(DOMAINS)) {
    expected[name] = stepForPhase(domain, 'clarify') ?? domainSteps(domain)[0];
  }
  assert.deepEqual(contract, expected);
});
