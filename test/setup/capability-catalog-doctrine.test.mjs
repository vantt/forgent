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

import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const SHARED_DIR = path.join(repoRoot, 'core', 'skills', '_shared');
const CATALOG_PATH = path.join(SHARED_DIR, 'capability-catalog.md');
const PLANNING_PATH = path.join(SHARED_DIR, 'planning-capability-awareness.md');
const DISPATCH_PATH = path.join(SHARED_DIR, 'executor-dispatch-fallback.md');

// ─── P2-foundation: curated catalog never pins provider/model/executor ───

test('P2-runtime capability slots are registered with no provider/model/executor pin', () => {
  for (const name of ['code:review', 'code:test', 'code:debug', 'code:refactor']) {
    const entry = DEFAULT_CAPABILITY_SLOTS[name];
    assert.ok(entry, `DEFAULT_CAPABILITY_SLOTS is missing "${name}"`);
    assert.ok(!entry.prefer && !entry.overrides, `"${name}" must never carry prefer/overrides`);
    assert.equal(typeof entry.description, 'string');
    assert.ok(entry.description.trim().length > 0);
  }
});

// ─── I19: `serves` on the curated catalog, and the new "review" slot ───

test('every DEFAULT_CAPABILITY_SLOTS entry declares a "serves" attribute set matching capability-matching.md\'s doctrine table', () => {
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
    const entry = DEFAULT_CAPABILITY_SLOTS[name];
    assert.ok(entry, `DEFAULT_CAPABILITY_SLOTS is missing "${name}"`);
    assert.deepEqual(entry.serves, serves, `"${name}".serves`);
  }
});

test('"review" is a new curated slot with no prefer/overrides pin, same discipline as every other curated default', () => {
  const entry = DEFAULT_CAPABILITY_SLOTS.review;
  assert.ok(entry, 'DEFAULT_CAPABILITY_SLOTS is missing "review"');
  assert.ok(!entry.prefer && !entry.overrides, '"review" must never carry prefer/overrides');
  assert.equal(typeof entry.description, 'string');
  assert.ok(entry.description.trim().length > 0);
});

test('no two DEFAULT_CAPABILITY_SLOTS entries declare the identical "serves" attribute set', () => {
  const signatures = new Map();
  for (const [name, entry] of Object.entries(DEFAULT_CAPABILITY_SLOTS)) {
    if (!entry.serves) continue;
    const signature = JSON.stringify(Object.fromEntries(Object.entries(entry.serves).sort(([a], [b]) => a.localeCompare(b))));
    const prior = signatures.get(signature);
    assert.ok(!prior, `"${prior}" and "${name}" declare the identical serves attribute set`);
    signatures.set(signature, name);
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
  const cfg = {
    capabilities: { 'code:review': { prefer: 'reviewer-agent' } },
    executors: { 'reviewer-agent': { kind: 'agent' } },
  };
  const plan = compileDispatchPlan(cfg, { for: 'code:review', hasLiveTaskAccess: true });
  assert.equal(plan.mechanism, 'in-process');
  assert.equal(plan.executorId, 'reviewer-agent');
  assert.equal(plan.configured, true);
});

test('decide --for resolves a capability to a tool/MCP provider, never assuming an agent-shaped hand-off (mirrors impact-analysis -> gitnexus)', () => {
  const cfg = {
    capabilities: { 'code:review': { prefer: 'review-tool' } },
    executors: {
      'review-tool': {
        kind: 'tool',
        invocations: [{ via: 'mcp', command: 'mcp:review-tool', tools: { 'code:review': 'mcp__review_tool__review' } }],
      },
    },
  };
  const plan = compileDispatchPlan(cfg, { for: 'code:review' });
  assert.equal(plan.executorId, 'review-tool');
  assert.equal(plan.configured, true);
  // mcp-handback: the resolved mechanism is in-process (the caller calls the
  // MCP tool directly), even though the executor is "tool"-kind, not "agent".
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
