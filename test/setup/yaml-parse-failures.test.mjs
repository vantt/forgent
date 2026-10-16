// test/setup/yaml-parse-failures.test.mjs — a YAML file doctor reads that cannot be parsed is named
// as a problem with its line and column; it is never skipped silently and never crashes doctor.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkBlindStepsUseProvenPools } from '../../src/setup/blind-steps-proven-pools.mjs';
import { checkWorkflowPoolsSatisfyIndependence } from '../../src/setup/workflow-pool-independence.mjs';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'bin', 'fgos.mjs');
const PARSE_PROBLEM = /cannot be parsed: .* \(line \d+, column \d+\)/;

function makeProject(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-yaml-failures-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: root });
  return {
    root,
    write(rel, text) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), text);
    },
  };
}

const checkById = (id) => DOCTOR_CHECKS.find((check) => check.id === id).check;
const MALFORMED_WORKFLOW = 'id: broken\nsteps:\n  - id: a\n   units: [\n';

test('an agent file that is not valid YAML is a named problem in the agent-claims check', async (t) => {
  const { root, write } = makeProject(t);
  write('agents/ok.yaml', 'name: ok\nskills: [a]\n');
  write('agents/broken.yaml', 'name: broken\ndescription: a: b\n');
  const result = await checkById('agent-claims-resolve')(root);
  assert.equal(result.passed, false);
  assert.match(result.message, /agents\/broken\.yaml: cannot be parsed: .* \(line 2, column \d+\)/);
  assert.doesNotMatch(result.message, /ok\.yaml/);
});

test('a malformed workspace agent is named by the agent-names check with line and column', async (t) => {
  const { root, write } = makeProject(t);
  write('fgos/agents/broken.yaml', 'name: broken\ndescription: a: b\n');
  const result = await checkById('agent-type-names-unique')(root);
  assert.equal(result.passed, false);
  assert.match(result.message, /fgos\/agents\/broken\.yaml cannot be parsed: .* \(line 2, column \d+\)/);
});

test('a malformed project workflow is a named problem in each check that reads workflows', async (t) => {
  const { root, write } = makeProject(t);
  write('core/workflows/broken.yaml', MALFORMED_WORKFLOW);
  const capabilities = await checkById('workflow-capabilities-configured')(root);
  assert.equal(capabilities.passed, false);
  assert.match(capabilities.message, new RegExp(`core/workflows/broken\\.yaml: ${PARSE_PROBLEM.source}`));

  const options = { packageRoot: path.join(root, 'elsewhere'), loadRunnerConfig: () => ({ executors: {}, capabilities: {} }) };
  for (const check of [checkWorkflowPoolsSatisfyIndependence, checkBlindStepsUseProvenPools]) {
    const result = await check(root, options);
    assert.equal(result.passed, false, check.name);
    assert.match(result.message, new RegExp(`core/workflows/broken\\.yaml: ${PARSE_PROBLEM.source}`), check.name);
  }
});

test('a self-referencing workflow document does not hang the capability walk', async (t) => {
  const { root, write } = makeProject(t);
  write('core/workflows/loop.yaml', 'id: loop\nsteps: &s\n  - id: a\n    capability: demo:loop\n    again: *s\n');
  const result = await checkById('workflow-capabilities-configured')(root);
  assert.match(result.message, /demo:loop \(loop\)/, 'the capability inside the cycle is still found, once');
});

test('fgos doctor still runs and lists every check when agent and workflow files are malformed', (t) => {
  const { root, write } = makeProject(t);
  write('core/workflows/broken.yaml', MALFORMED_WORKFLOW);
  write('agents/broken.yaml', 'name: broken\ndescription: a: b\n');
  const run = spawnSync(process.execPath, [FGOS, 'doctor', '--json'], { cwd: root, encoding: 'utf8', env: { ...process.env, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' } });
  assert.equal(run.status, 0, run.stderr);
  const checks = JSON.parse(run.stdout).data.checks;
  assert.deepEqual(checks.map((c) => c.id), DOCTOR_CHECKS.map((c) => c.id), 'every registered check ran');
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
  assert.match(byId['agent-claims-resolve'].message, /agents\/broken\.yaml: cannot be parsed/);
  assert.match(byId['workflow-capabilities-configured'].message, /core\/workflows\/broken\.yaml: cannot be parsed/);
});
