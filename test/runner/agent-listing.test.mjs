// test/runner/agent-listing.test.mjs — what a project can seat, what the renderer drops, what is hidden

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { agentDescription, agentRenderWarnings, listAgents } from '../../src/runner/agent-listing.mjs';

const definition = (name, extra = '') => `name: ${name}\ndescription: ${name} posture\n${extra}`;

function makeRoot(t, prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return {
    root,
    write(rel, text) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), text);
    },
  };
}

test('a well-formed definition has no render warnings', () => {
  const text = definition('a', 'persona:\n  voice: plain\n  style: short\n  archetype: a checker\ndecision_boundary:\n  can_decide:\n    - one thing\n  must_escalate:\n    - another\n');
  assert.deepEqual(agentRenderWarnings(text), []);
});

test('keys and block scalars the renderer drops are named', () => {
  const text = [
    'name: a',
    'description: >',
    '  a long folded description',
    'persona:',
    '  voice: |',
    '    two lines',
    '  tone: calm',
    'decision_boundary:',
    '  may_decide:',
    '    - x',
  ].join('\n');
  const warnings = agentRenderWarnings(text);
  assert.ok(warnings.some((w) => w.startsWith('description is a multi-line block')));
  assert.ok(warnings.some((w) => w.startsWith('persona.voice is a multi-line block')));
  assert.ok(warnings.some((w) => w.startsWith('persona.tone is not rendered')));
  assert.ok(warnings.some((w) => w.startsWith('decision_boundary.may_decide is not rendered')));
  assert.equal(agentDescription(text), '', 'a block-scalar description is not read as text');
  assert.equal(agentDescription(definition('a')), 'a posture');
});

test('the listing reports tier, shadowed lower copies and shape problems', (t) => {
  const { root, write } = makeRoot(t, 'fgos-agent-list-');
  write('core/agents/planner.yaml', definition('planner'));
  write('domains/finance/agents/planner.yaml', definition('planner'));
  write('fgos/agents/broken.yaml', 'name: other\ndescription: x\n');
  write('fgos/agents/typo.yml', definition('typo'));

  const listing = listAgents({ projectRoot: root, installRoot: root });
  const planner = listing.agents.find((agent) => agent.name === 'planner');
  assert.equal(planner.tier, 'domain');
  assert.deepEqual(planner.shadows, ['core/agents/planner.yaml']);
  const broken = listing.agents.find((agent) => agent.name === 'broken');
  assert.match(broken.problems[0], /must declare name: broken/);
  assert.deepEqual(listing.ignored, ['fgos/agents/typo.yml']);
  assert.deepEqual(listing.masked, [], 'a project that is its own install hides nothing');
});

test('a project domains folder hides the installed domain personas it lacks', (t) => {
  const project = makeRoot(t, 'fgos-agent-list-project-');
  const install = makeRoot(t, 'fgos-agent-list-install-');
  install.write('domains/marketing/agents/offer-critic.yaml', definition('offer-critic'));
  install.write('domains/finance/agents/close-controller.yaml', definition('close-controller'));
  project.write('domains/finance/agents/close-controller.yaml', definition('close-controller', 'role: own\n'));
  project.write('domains/legal/agents/clause-reader.yaml', definition('clause-reader'));

  const listing = listAgents({ projectRoot: project.root, installRoot: install.root });
  assert.deepEqual(listing.masked.map((m) => m.name), ['offer-critic']);
  assert.equal(listing.masked[0].source, 'domains/marketing/agents/offer-critic.yaml');
  assert.ok(listing.agents.some((agent) => agent.name === 'clause-reader'));
});

test('a project without its own domains folder hides nothing from the install', (t) => {
  const project = makeRoot(t, 'fgos-agent-list-project-');
  const install = makeRoot(t, 'fgos-agent-list-install-');
  install.write('domains/marketing/agents/offer-critic.yaml', definition('offer-critic'));
  project.write('fgos/agents/mine.yaml', definition('mine'));

  const listing = listAgents({ projectRoot: project.root, installRoot: install.root });
  assert.deepEqual(listing.masked, []);
  assert.ok(listing.agents.some((agent) => agent.name === 'offer-critic' && agent.tier === 'domain'));
});
