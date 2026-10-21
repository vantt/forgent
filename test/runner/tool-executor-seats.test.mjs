// A capability served by a tool executor (`kind: tool`: gitnexus, herdr) keeps the path it had before Seat Binding:
// Seat Binding decides agent seats only. The golden file is the output of the code before the policy cutover for the
// same config, captured from that code. What the cutover changes is the label of where a tier came from (a config
// path now, never "rigor:<level>") and the reasoning effort rigor used to derive; both are removed from the golden
// and from the live output before they are compared, so every other field (executor, mechanism, model, invocation,
// governance, reason codes, the MCP hand-back) must be identical.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { bind } from '../../src/runner/execution/bind.mjs';
import { compileDispatchPlan } from '../../src/runner/dispatch/plan.mjs';

const golden = JSON.parse(fs.readFileSync(new URL('../fixtures/tool-executor-seats.golden.json', import.meta.url), 'utf8'));

const runnerConfig = {
  executor: { command: 'claude', args: ['-p', '{prompt}'] },
  modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', flagship: 'opus' } },
  timeoutMs: 5000,
  executors: {
    claude: { kind: 'agent', command: 'claude', providerModel: 'claude', args: ['-p', '{prompt}'], invocations: [{ id: 'claude-cli', via: 'cli', adapter: 'cli-spawn', command: 'claude' }] },
    gitnexus: {
      kind: 'tool', description: 'Code-graph blast radius', for: ['impact-analysis'], scanTarget: '.gitnexus', responsibility: 'Verification',
      invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
    },
    herdr: {
      kind: 'tool', for: ['pane-labeling'], responsibility: 'Chrome', description: 'herdr pane label writer',
      invocations: [{ via: 'cli', command: 'herdr', args: [] }],
    },
  },
  capabilities: {
    'impact-analysis': { description: 'Code-graph blast radius', aliases: ['impact_analysis', 'Impact Analysis'], prefer: 'gitnexus' },
    'pane-labeling': { description: 'Write a session/task id onto the pane label', prefer: 'herdr' },
  },
};

/** Drops the two things the cutover changes on purpose, wherever a binding or a plan carries them. */
function normalize(value) {
  const out = JSON.parse(JSON.stringify(value));
  const strip = (obj) => {
    if (obj?.provenance?.tier) delete obj.provenance.tier.source;
    if (obj?.provenance?.reasoningEffort) delete obj.provenance.reasoningEffort;
    delete obj?.reasoningEffort;
  };
  for (const entry of Object.values(out)) {
    strip(entry);
    if (entry?.policy) strip(entry.policy);
  }
  return out;
}

test('tool-executor capabilities bind and plan exactly as before: executor, mechanism, model, invocation, governance and hand-back are unchanged', () => {
  const actual = {};
  for (const capability of ['impact-analysis', 'pane-labeling']) {
    for (const session of [{ headless: true }, { headless: false, hasNativeAgent: true, provider: 'claude' }]) {
      const key = `bind ${capability} ${session.headless ? 'headless' : 'lead'}`;
      actual[key] = bind({ unit: { id: 'u', capability, writes: [] }, role: 'producer' }, { runnerConfig, session });
    }
    for (const hasLiveTaskAccess of [false, true]) {
      actual[`plan ${capability} live=${hasLiveTaskAccess}`] = compileDispatchPlan(runnerConfig, { for: capability, hasLiveTaskAccess });
    }
  }
  actual['plan executor gitnexus'] = compileDispatchPlan(runnerConfig, { executorId: 'gitnexus', hasLiveTaskAccess: true });
  actual['plan executor herdr'] = compileDispatchPlan(runnerConfig, { executorId: 'herdr' });
  assert.deepEqual(normalize(actual), golden);
});

test('the one thing a tool capability\'s tier now says differently is where it came from: the config line, not a rigor level', () => {
  const plan = compileDispatchPlan(runnerConfig, { for: 'impact-analysis', hasLiveTaskAccess: true });
  assert.equal(plan.tier, 'standard');
  assert.deepEqual(plan.provenance.tier.source, { scope: 'seat-binding', id: 'defaults.tier' });
  assert.equal(plan.policy.reasoningEffort, undefined, 'rigor no longer derives an effort');
});
