// capability-catalog-doctrine.test.mjs -- proof for
// docs/history/agent-coordination-foundation/plan.md's P2-foundation/P1/
// P2-runtime slice: the shared capability catalog, the shared
// planning-awareness fragment, the P2-runtime code:review/code:test/
// code:debug/code:refactor slots, and that a capability can resolve to a
// tool/MCP provider, not only an agent-shaped executor.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { DEFAULT_CAPABILITY_SLOTS } from '../../src/setup/registrations.mjs';
import { EXECUTOR_KINDS, compileDispatchPlan } from '../../src/runner/dispatch.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const SHARED_DIR = path.join(repoRoot, 'core', 'skills', '_shared');
const CATALOG_PATH = path.join(SHARED_DIR, 'capability-catalog.md');
const PLANNING_PATH = path.join(SHARED_DIR, 'planning-capability-awareness.md');
const DISPATCH_PATH = path.join(SHARED_DIR, 'executor-dispatch-fallback.md');

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
  return entry;
}

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ─── P2-foundation: curated catalog never pins provider/model/executor ───

test('P2-runtime capability slots are registered with no provider/model/executor pin', () => {
  for (const name of ['code:review', 'code:test', 'code:debug', 'code:refactor']) {
    const entry = DEFAULT_CAPABILITY_SLOTS[name];
    assert.ok(entry, `DEFAULT_CAPABILITY_SLOTS is missing "${name}"`);
    assert.deepEqual(Object.keys(entry), ['description'], `"${name}" must carry only a description, never prefer/overrides`);
    assert.equal(typeof entry.description, 'string');
    assert.ok(entry.description.trim().length > 0);
  }
});

test('advise-execute-capabilities-configured covers every curated slot, including the new P2-runtime ones', () => {
  const cwd = mkTemp('capability-doctrine-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { capabilities: DEFAULT_CAPABILITY_SLOTS } }));
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /declares "advise", "execute", and "code:implement"/);
  for (const name of ['code:review', 'code:test', 'code:debug', 'code:refactor']) {
    assert.ok(message.includes(name), `doctor message should mention "${name}": ${message}`);
  }
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('advise-execute-capabilities-configured fails when a P2-runtime slot is missing', () => {
  const cwd = mkTemp('capability-doctrine-missing-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  const { 'code:review': _omit, ...withoutCodeReview } = DEFAULT_CAPABILITY_SLOTS;
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { capabilities: withoutCodeReview } }));
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing or has a malformed slot for/);
  assert.ok(message.includes('code:review'));
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── Capability may resolve to a tool/MCP provider, not only an agent ───

test('EXECUTOR_KINDS registers both agent and tool -- a capability is not agent-only', () => {
  assert.deepEqual([...EXECUTOR_KINDS].sort(), ['agent', 'tool']);
});

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
  for (const name of ['advise', 'execute', 'code:implement', 'code:review', 'code:test', 'code:debug', 'code:refactor', 'impact-analysis']) {
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
