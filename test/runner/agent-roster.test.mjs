// test/runner/agent-roster.test.mjs — the agent roster reads files as YAML and names what it cannot read

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadAgentRoster } from '../../src/runner/agent-roster.mjs';

function makeRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agent-roster-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
    return root;
  };
}

test('the roster lists name and skills of each agent in block, flow and quoted styles', (t) => {
  const write = makeRoot(t);
  write('core/agents/a.yaml', 'name: a\ndescription: x\nskills:\n  - one\n  - two\n');
  write('domains/d/agents/b.yaml', 'name: "b"\nskills: [three, four]\n');
  const root = write('agents/c.yml', 'description: no declared name\nskills: []\n');
  const { defs, problems } = loadAgentRoster(root);
  assert.deepEqual(defs, [
    { name: 'a', skills: ['one', 'two'] },
    { name: 'b', skills: ['three', 'four'] },
    { name: 'c', skills: [] },
  ]);
  assert.deepEqual(problems, []);
});

test('an agent file that is not valid YAML is left out and named, and the others still load', (t) => {
  const write = makeRoot(t);
  write('core/agents/good.yaml', 'name: good\nskills: [x]\n');
  const root = write('core/agents/bad.yaml', 'name: bad\ndescription: a: b\nskills: [y]\n');
  const { defs, problems } = loadAgentRoster(root);
  assert.deepEqual(defs, [{ name: 'good', skills: ['x'] }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^core\/agents\/bad\.yaml: cannot be parsed: .* \(line 2, column \d+\)$/);
});

test('a numeric name is coerced to text and the first file of a name wins', (t) => {
  const write = makeRoot(t);
  write('core/agents/first.yaml', 'name: 123\nskills: [a]\n');
  const root = write('agents/second.yaml', 'name: "123"\nskills: [b]\n');
  assert.deepEqual(loadAgentRoster(root).defs, [{ name: '123', skills: ['a'] }]);
});
