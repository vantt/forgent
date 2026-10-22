// A packaged workflow (<name>/wf.<name>.yaml) is found beside flat files, with the place it was found in,
// and that place alone decides which personas its Units may use.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { discoverWorkflows, loadWorkflowWithSource, workflowPersonaScope } from '../../src/workflow/loader.mjs';
import { resolveAgentDefinition } from '../../src/runner/agent-definitions.mjs';

const workflowText = (id) => `id: ${id}
title: ${id}
description: a one step workflow
steps:
  - id: only
    units:
      - id: do-it
        template:
          capability: execute
          persona: critic
`;
const personaText = (extra = '') => `name: critic\ndescription: critic posture\n${extra}`;

function makeRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-loader-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  return { root, write };
}

test('a packaged workflow is discovered with its directory and owning domain from location alone', (t) => {
  const { root, write } = makeRoot(t);
  write('core/workflows/flat.yaml', workflowText('flat'));
  write('core/workflows/packed/wf.packed.yaml', workflowText('packed'));
  write('domains/finance/workflows/audit/wf.audit.yaml', workflowText('finance/audit').replace(/^id: .*\n/, ''));
  write('domains/finance/workflows/close.yaml', workflowText('finance/close'));
  write('domains/finance/workflows/not-a-package/other.yaml', workflowText('ignored'));

  assert.deepEqual([...discoverWorkflows({ packageRoot: root }).keys()].sort(), ['finance/audit', 'finance/close', 'flat', 'packed']);
  const source = (id) => loadWorkflowWithSource(id, { packageRoot: root }).source;
  assert.deepEqual({ ...source('flat') }, { sourcePath: path.join(root, 'core/workflows/flat.yaml'), workflowDir: null, owningDomain: null });
  assert.deepEqual({ ...source('packed') }, { sourcePath: path.join(root, 'core/workflows/packed/wf.packed.yaml'), workflowDir: path.join(root, 'core/workflows/packed'), owningDomain: null });
  assert.deepEqual({ ...source('finance/audit') }, {
    sourcePath: path.join(root, 'domains/finance/workflows/audit/wf.audit.yaml'),
    workflowDir: path.join(root, 'domains/finance/workflows/audit'),
    owningDomain: 'finance',
  });
  assert.equal(source('finance/close').owningDomain, 'finance');
  assert.equal(source('finance/close').workflowDir, null);
});

test('one id as a packaged and a flat workflow is a load error naming both files', (t) => {
  const { root, write } = makeRoot(t);
  write('core/workflows/twice.yaml', workflowText('twice'));
  write('core/workflows/twice/wf.twice.yaml', workflowText('twice'));
  assert.throws(
    () => discoverWorkflows({ packageRoot: root }),
    (error) => error.message.includes('workflow "twice" is defined twice, packaged and flat')
      && error.message.includes(path.join(root, 'core/workflows/twice.yaml'))
      && error.message.includes(path.join(root, 'core/workflows/twice/wf.twice.yaml')),
  );
});

test('a workflow resolves personas from its own folder and domain, and never from another domain', (t) => {
  const { root, write } = makeRoot(t);
  write('core/agents/critic.yaml', personaText());
  write('domains/finance/agents/critic.yaml', personaText('rigor: high\n'));
  write('domains/finance/workflows/audit/wf.audit.yaml', workflowText('finance/audit').replace(/^id: .*\n/, ''));
  write('domains/finance/workflows/audit/agent.critic.yaml', personaText('rigor: low\n'));
  write('domains/finance/workflows/close.yaml', workflowText('finance/close'));
  write('domains/hr/workflows/review.yaml', workflowText('hr/review'));

  const identityFor = (id) => resolveAgentDefinition('critic', {
    projectRoot: root,
    workflow: workflowPersonaScope(id, { packageRoot: root }),
  }).identity;
  assert.equal(identityFor('finance/audit'), 'workflow:domains/finance/workflows/audit/critic');
  assert.equal(identityFor('finance/close'), 'domain:domains/finance/agents/critic');
  assert.equal(identityFor('hr/review'), 'core:core/agents/critic');
  assert.equal(workflowPersonaScope('no-such-workflow', { packageRoot: root }), null);
});
