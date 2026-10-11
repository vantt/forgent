// test/runner/agent-definitions.test.mjs — one lookup of an agent definition across workspace, domain and core tiers

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  AGENT_FILE_MAX_BYTES,
  INSTALL_ROOT,
  agentShapeProblem,
  findAgentDuplicates,
  resolveAgentDefinition,
  scanAgentTiers,
} from '../../src/runner/agent-definitions.mjs';

const definition = (name, extra = '') => `name: ${name}\ndescription: ${name} posture\n${extra}`;

function makeProject(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agent-defs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  return { root, write };
}

test('the workspace tier shadows a domain, which shadows core, as a whole file', (t) => {
  const { root, write } = makeProject(t);
  write('core/agents/planner.yaml', definition('planner', 'role: core-only-field\n'));
  write('domains/finance/agents/planner.yaml', definition('planner', 'role: domain-field\n'));
  assert.equal(resolveAgentDefinition('planner', { projectRoot: root }).tier, 'domain');
  assert.equal(resolveAgentDefinition('planner', { projectRoot: root }).source, 'domains/finance/agents/planner.yaml');

  const own = definition('planner', 'persona:\n  voice: the customer voice\n');
  write('fgos/agents/planner.yaml', own);
  const found = resolveAgentDefinition('planner', { projectRoot: root });
  assert.equal(found.tier, 'workspace');
  assert.equal(found.source, 'fgos/agents/planner.yaml');
  assert.equal(found.text, own, 'the file is taken whole, never merged with a lower tier');
  assert.ok(!found.text.includes('core-only-field') && !found.text.includes('domain-field'));
  assert.equal(found.digest, crypto.createHash('sha256').update(own).digest('hex'));
});

test('a customer project without its own core or domains reads the installed definitions', (t) => {
  const { root, write } = makeProject(t);
  write('fgos/agents/finance-controller.yaml', definition('finance-controller'));
  const installed = resolveAgentDefinition('council-assumptions', { projectRoot: root });
  assert.equal(installed.tier, 'core');
  assert.equal(installed.source, 'core/agents/council-assumptions.yaml');
  assert.equal(installed.text, fs.readFileSync(path.join(INSTALL_ROOT, 'core', 'agents', 'council-assumptions.yaml'), 'utf8'));
  assert.equal(resolveAgentDefinition('finance-controller', { projectRoot: root }).tier, 'workspace');
});

test('a project that ships its own core folder is read there, not from the installed package', (t) => {
  const { root, write } = makeProject(t);
  write('core/agents/only-here.yaml', definition('only-here'));
  assert.equal(resolveAgentDefinition('only-here', { projectRoot: root }).tier, 'core');
  assert.throws(() => resolveAgentDefinition('council-assumptions', { projectRoot: root }), /not found/);
});

test('the same name twice in one tier is an error that names both files, found or shadowed', (t) => {
  const { root, write } = makeProject(t);
  write('domains/finance/agents/dup.yaml', definition('dup'));
  write('domains/hr/agents/dup.yaml', definition('dup'));
  assert.throws(
    () => resolveAgentDefinition('dup', { projectRoot: root }),
    /persona "dup" is defined more than once in the domains\/\*\/agents tier \(domains\/finance\/agents\/dup\.yaml, domains\/hr\/agents\/dup\.yaml\)/,
  );
  assert.deepEqual(findAgentDuplicates(scanAgentTiers({ projectRoot: root })).map((d) => [d.tier, d.name, d.files]), [
    ['domain', 'dup', ['domains/finance/agents/dup.yaml', 'domains/hr/agents/dup.yaml']],
  ]);
  // The workspace tier is checked first, so a workspace definition settles the lookup.
  write('fgos/agents/dup.yaml', definition('dup'));
  assert.equal(resolveAgentDefinition('dup', { projectRoot: root }).tier, 'workspace');
});

test('an unknown name names every tier searched and never falls back', (t) => {
  const { root, write } = makeProject(t);
  write('core/agents/other.yaml', definition('other'));
  write('domains/finance/agents/other-domain.yaml', definition('other-domain'));
  assert.throws(
    () => resolveAgentDefinition('nobody', { projectRoot: root }),
    (error) => error.message.startsWith('persona "nobody" not found; searched fgos/agents (')
      && error.message.includes(path.join(root, 'fgos', 'agents'))
      && error.message.includes(`domains/*/agents (${path.join(root, 'domains', 'finance', 'agents')})`)
      && error.message.includes(`core/agents (${path.join(root, 'core', 'agents')})`),
  );
});

test('a .yml file is not a definition and the error says so', (t) => {
  const { root, write } = makeProject(t);
  write('fgos/agents/typo.yml', definition('typo'));
  assert.throws(() => resolveAgentDefinition('typo', { projectRoot: root }), /fgos\/agents\/typo\.yml exists but only \.yaml files are read/);
});

test('names outside the persona grammar are refused before any lookup', (t) => {
  const { root } = makeProject(t);
  for (const bad of ['', 'Upper', '../escape', 'a/b', '1abc', 'a'.repeat(65), 'two words', undefined, null, 7]) {
    assert.throws(() => resolveAgentDefinition(bad, { projectRoot: root }), /persona name .* must match/, String(bad));
  }
});

test('a definition with the wrong shape, invalid YAML or too large is refused with its path', (t) => {
  const { root, write } = makeProject(t);
  write('fgos/agents/wrong-name.yaml', definition('someone-else'));
  write('fgos/agents/no-desc.yaml', 'name: no-desc\n');
  write('fgos/agents/not-a-map.yaml', '- a\n- b\n');
  write('fgos/agents/indented.yaml', '  name: indented\n  description: nested, not top level\n');
  write('fgos/agents/huge.yaml', `${definition('huge')}# ${'x'.repeat(AGENT_FILE_MAX_BYTES)}\n`);
  const refused = (name, pattern) => assert.throws(() => resolveAgentDefinition(name, { projectRoot: root }), pattern, name);
  refused('wrong-name', /\(fgos\/agents\/wrong-name\.yaml\) must declare name: wrong-name/);
  refused('no-desc', /\(fgos\/agents\/no-desc\.yaml\) must declare a non-empty description/);
  refused('not-a-map', /\(fgos\/agents\/not-a-map\.yaml\) must declare name: not-a-map \(got null\)/);
  refused('indented', /\(fgos\/agents\/indented\.yaml\) must declare name: indented \(got null\)/);
  refused('huge', /\(fgos\/agents\/huge\.yaml\) is larger than 16384 bytes/);
  assert.equal(agentShapeProblem('ok', definition('ok')), null);
});

test('every installed core definition resolves through the lookup', (t) => {
  const { root } = makeProject(t);
  const names = fs.readdirSync(path.join(INSTALL_ROOT, 'core', 'agents')).filter((f) => f.endsWith('.yaml')).map((f) => f.slice(0, -5));
  assert.ok(names.length > 0);
  for (const name of names) assert.equal(resolveAgentDefinition(name, { projectRoot: root }).tier, 'core', name);
});
