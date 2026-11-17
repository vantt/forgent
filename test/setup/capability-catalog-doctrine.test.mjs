// capability-catalog-doctrine.test.mjs -- proof for
// docs/history/agent-coordination-foundation/plan.md's P2-foundation/P1/
// P2-runtime slice: the shared capability catalog, the shared
// planning-awareness fragment, the P2-runtime code:review/code:test/
// code:debug/code:refactor slots, and that a capability can resolve to a
// tool/MCP provider, not only an agent-shaped executor.
import '../helpers/process-tmp-root.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { readStandardValue } from '../../src/config/facade.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';
import { bindable } from '../helpers/work-seat-config.mjs';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';

seedStubAgentClis('claude');

const repoRoot = path.resolve(import.meta.dirname, '../..');
const SHARED_DIR = path.join(repoRoot, 'core', 'skills', '_shared');
const CATALOG_PATH = path.join(SHARED_DIR, 'capability-catalog.md');
const PLANNING_PATH = path.join(SHARED_DIR, 'planning-capability-awareness.md');
const DISPATCH_PATH = path.join(SHARED_DIR, 'executor-dispatch-fallback.md');

// The standard's capability rows, the one catalog a fresh project starts from.
const STANDARD_CAPABILITIES = JSON.parse(JSON.stringify(readStandardValue('runner.capabilities').value));

// ─── The standard holds jobs and tool abilities; business names are labels ───

test('the standard declares only the generic jobs, the tool abilities and the coding rows the Work path and skills route through', () => {
  const jobs = ['advise', 'execute', 'review'];
  const toolAbilities = ['impact-analysis', 'pane-labeling'];
  // Kept as debt until the coding rows' behaviour gets its own home: the Work executing step, the reviewer item,
  // the discovery step's `coding:discover` unit, and the names the coding skills ask decide for.
  const codingDebt = [
    'fgos-coding-implement', 'code:implement', 'code:review', 'code:test', 'code:debug', 'code:refactor',
    'docs:write', 'coding:discover', 'coding:*', 'code:*',
  ];
  assert.deepEqual(Object.keys(STANDARD_CAPABILITIES).sort(), [...jobs, ...toolAbilities, ...codingDebt].sort());
});

// ─── I19: `serves` on the catalog ───

test('the standard\'s job and coding rows declare the "serves" attribute set capability-matching.md\'s doctrine table gives them', () => {
  const expected = {
    advise: { outputKind: 'decision', mutates: false },
    execute: { outputKind: 'change', mutates: true },
    review: { outputKind: 'finding', mutates: false },
    'docs:write': { outputKind: 'change', domain: 'docs', mutates: true },
    'code:implement': { outputKind: 'change', domain: 'code', mutates: true },
    'code:review': { outputKind: 'finding', domain: 'code', mutates: false },
    'code:test': { outputKind: 'verification', domain: 'code' },
    'code:debug': { outputKind: 'finding', domain: 'code' },
    'code:refactor': { outputKind: 'change', domain: 'code', mutates: true, behaviorPreserving: true },
  };
  for (const [name, serves] of Object.entries(expected)) {
    assert.ok(STANDARD_CAPABILITIES[name], `the standard is missing "${name}"`);
    assert.deepEqual(STANDARD_CAPABILITIES[name].serves, serves, `"${name}".serves`);
  }
});

// The shape of `serves` (keys, scalar or list values, non-empty strings, booleans) is the runner schema's; the
// bundled-schema cases in packages/config/rust/tests/golden_validate.rs own it.

// ─── Capability may resolve to a tool/MCP provider, not only an agent ───

test('decide --for resolves an unconfigured capability to unavailable (the fallback path)', () => {
  const cfg = { capabilities: {}, executors: {} };
  const plan = compileDispatchPlan(cfg, { for: 'code:review' });
  assert.equal(plan.mechanism, 'unavailable');
  assert.equal(plan.configured, false);
});

test('decide --for resolves a capability to an agent executor when configured, in-process with live task access', () => {
  const cfg = bindable({
    capabilities: { 'code:review': { prefer: 'reviewer-agent' } },
    executors: { 'reviewer-agent': { kind: 'agent', providerModel: 'claude' } },
    modelPolicies: { claude: { standard: 'sonnet' } },
  });
  const plan = compileDispatchPlan(cfg, { for: 'code:review', hasLiveTaskAccess: true });
  assert.equal(plan.mechanism, 'in-process');
  assert.equal(plan.executorId, 'reviewer-agent');
  assert.equal(plan.configured, true);
});

test('decide --for resolves a capability to a tool/MCP provider, never assuming an agent-shaped hand-off (mirrors impact-analysis -> gitnexus)', () => {
  const cfg = {
    capabilities: { 'code:review': {} },
    executors: {
      'review-tool': {
        kind: 'tool',
        for: ['code:review'],
        scanTarget: '.',
        invocations: [{ via: 'mcp', command: 'mcp:review-tool', tools: { 'code:review': 'mcp__review_tool__review' } }],
      },
    },
  };
  const plan = compileDispatchPlan(cfg, { for: 'code:review', repoRoot });
  assert.equal(plan.executorId, 'review-tool');
  assert.equal(plan.configured, true);
  // The resolved mechanism is in-process (the caller calls the MCP tool
  // directly), even though the executor is "tool"-kind, not "agent".
  assert.equal(plan.mechanism, 'in-process');
  assert.equal(plan.mcpTool, 'mcp__review_tool__review');
});

// ─── Shared awareness cluster: catalog + planning fragment + cross-refs ───

test('shared capability catalog exists, lists the registered vocabulary, and never registers a "research" capability', () => {
  const content = fs.readFileSync(CATALOG_PATH, 'utf8');
  for (const name of ['advise', 'execute', 'review', 'docs:write', 'code:implement', 'code:review', 'code:test', 'code:debug', 'code:refactor', 'impact-analysis']) {
    assert.ok(content.includes(`\`${name}\``), `catalog should document "${name}"`);
  }
  assert.ok(!/\|\s*`research`\s*\|/.test(content), 'catalog must never register a "research" capability');
  assert.ok(/fgos-researching.*skill\/workflow|skill\/workflow.*fgos-researching/is.test(content), 'catalog should state the research ontology boundary');
});

test('shared planning-awareness fragment forbids pinning provider/model/executor in a plan', () => {
  const content = fs.readFileSync(PLANNING_PATH, 'utf8');
  assert.ok(/never.*(provider|executor)|leave executor\/provider\/model\/tier selection to execution time/i.test(content));
  assert.ok(content.includes('capability-catalog.md'));
  assert.ok(content.includes('executor-dispatch-fallback.md'));
});

test('decide-before-execute is the only activation gate -- decide-before-dispatch is documented as legacy, not a second gate', () => {
  const planning = fs.readFileSync(PLANNING_PATH, 'utf8');
  const dispatch = fs.readFileSync(DISPATCH_PATH, 'utf8');
  assert.ok(planning.includes('decide-before-execute'));
  assert.ok(dispatch.includes('decide-before-execute') || dispatch.includes('Decide before execute'));
  assert.ok(/decide-before-dispatch.*legacy|legacy.*decide-before-dispatch/is.test(planning), 'planning fragment should mark decide-before-dispatch as legacy, never a second gate');
});

test('the dispatch fragment cross-references the catalog and the planning fragment (one coherent cluster)', () => {
  const content = fs.readFileSync(DISPATCH_PATH, 'utf8');
  assert.ok(content.includes('capability-catalog.md'));
  assert.ok(content.includes('planning-capability-awareness.md'));
});
