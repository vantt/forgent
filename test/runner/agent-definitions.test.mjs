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
  readAgentDefinition,
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
  write('fgos/agents/broken-yaml.yaml', 'name: broken-yaml\ndescription: fine\npersona:\n  voice: direct: no hedging\n');
  write('fgos/agents/huge.yaml', `${definition('huge')}# ${'x'.repeat(AGENT_FILE_MAX_BYTES)}\n`);
  const refused = (name, pattern) => assert.throws(() => resolveAgentDefinition(name, { projectRoot: root }), pattern, name);
  refused('wrong-name', /\(fgos\/agents\/wrong-name\.yaml\) must declare name: wrong-name/);
  refused('no-desc', /\(fgos\/agents\/no-desc\.yaml\) must declare a non-empty description/);
  refused('not-a-map', /\(fgos\/agents\/not-a-map\.yaml\) must declare name: not-a-map \(got null\)/);
  refused('broken-yaml', /\(fgos\/agents\/broken-yaml\.yaml\) cannot be parsed: .* \(line 4, column \d+\)/);
  refused('huge', /\(fgos\/agents\/huge\.yaml\) is larger than 16384 bytes/);
  assert.equal(agentShapeProblem('ok', definition('ok')), null);
});

test('a mapping or list where the renderer needs text is refused with its path, never dropped', (t) => {
  const { root, write } = makeProject(t);
  const cases = {
    'item-map': ['decision_boundary:', '  must_escalate:', '    - Escalate when: budget exceeded'].join('\n'),
    'second-item': ['decision_boundary:', '  can_decide:', '    - fine', '    - Decide when: sure'].join('\n'),
    'voice-map': ['persona:', '  voice:', '    tone: calm'].join('\n'),
    'style-list': ['persona:', '  style: [a, b]'].join('\n'),
    'boundary-map': ['decision_boundary:', '  must_escalate:', '    when: budget'].join('\n'),
    'boundary-text': ['decision_boundary:', '  must_escalate: budget'].join('\n'),
  };
  const expected = {
    'item-map': /decision_boundary\.must_escalate\[0\] is a mapping; an unquoted ": "/,
    'second-item': /decision_boundary\.can_decide\[1\] is a mapping/,
    'voice-map': /persona\.voice is a mapping/,
    'style-list': /persona\.style is a list/,
    'boundary-map': /decision_boundary\.must_escalate is a mapping, not a list/,
    'boundary-text': /decision_boundary\.must_escalate is text, not a list/,
  };
  for (const [name, body] of Object.entries(cases)) {
    const text = `${definition(name)}${body}\n`;
    write(`fgos/agents/${name}.yaml`, text);
    assert.match(agentShapeProblem(name, text), expected[name], name);
    assert.throws(() => resolveAgentDefinition(name, { projectRoot: root }), expected[name], name);
  }
  assert.equal(agentShapeProblem('quoted', `${definition('quoted')}decision_boundary:\n  must_escalate:\n    - "Escalate when: budget exceeded"\n`), null);
});

test('a definition is read as YAML: indentation, quoting and numbers are the parser\'s business', (t) => {
  const { root, write } = makeProject(t);
  write('fgos/agents/indented.yaml', '  name: indented\n  description: nested, still a mapping\n');
  write('fgos/agents/quoted.yaml', 'name: "quoted"\ndescription: >\n  folded\n  across lines\n');
  assert.equal(resolveAgentDefinition('indented', { projectRoot: root }).tier, 'workspace');
  assert.equal(agentShapeProblem('quoted', fs.readFileSync(path.join(root, 'fgos/agents/quoted.yaml'), 'utf8')), null);
  assert.equal(readAgentDefinition('name: 123\ndescription: x\n').name, '123', 'a numeric name is coerced to text');
  assert.equal(agentShapeProblem('123', 'name: 123\ndescription: x\n'), null);
  assert.equal(readAgentDefinition('name: a\ndescription: x\nskills:\n  - one\n  - 2\n  - two\n').skills.join(), 'one,two');
  assert.deepEqual(readAgentDefinition('name: a\nskills: [x, y]\n').skills, ['x', 'y']);
});

test('invalid YAML is a named result, never a throw', () => {
  const read = readAgentDefinition('name: a\ndescription: x: y\n', { filename: 'a.yaml' });
  assert.equal(read.data, null);
  assert.match(read.error, /^cannot be parsed: .* \(line 2, column \d+\)$/);
  assert.deepEqual(read.skills, []);
});

test('every installed core definition resolves through the lookup', (t) => {
  const { root } = makeProject(t);
  const names = fs.readdirSync(path.join(INSTALL_ROOT, 'core', 'agents')).filter((f) => f.endsWith('.yaml')).map((f) => f.slice(0, -5));
  assert.ok(names.length > 0);
  for (const name of names) assert.equal(resolveAgentDefinition(name, { projectRoot: root }).tier, 'core', name);
});
