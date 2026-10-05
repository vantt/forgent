import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { BLIND_PROVEN_PAIRS, checkBlindStepsUseProvenPools } from '../../src/setup/blind-steps-proven-pools.mjs';

const cliBwrap = (id, command) => ({ id, via: 'cli', adapter: 'cli-spawn', command, args: ['-p', '{prompt}'], confinement: { backend: 'bwrap' } });
const herdrBwrap = (id, command) => ({ id, via: 'cli', adapter: 'herdr-spawn', command, args: ['{prompt}'], confinement: { backend: 'bwrap' } });

// providerModel names the family, as in a real project config.
const EXECUTORS = {
  // proven: deepseek through a bwrap cli invocation
  deepseek: { kind: 'agent', providerModel: 'deepseek', invocations: [cliBwrap('pi-cli-bwrap', 'pi')] },
  // proven: xai through herdr
  xai: { kind: 'agent', providerModel: 'xai', invocations: [herdrBwrap('pi-herdr', 'pi')] },
  // deepseek through herdr is not a proven pair (only its cli was measured)
  'deepseek-herdr': { kind: 'agent', providerModel: 'deepseek', invocations: [herdrBwrap('pi-herdr-deepseek', 'pi')] },
  // mistral is a family no canary has proven on either transport
  mistral: { kind: 'agent', providerModel: 'mistral', invocations: [herdrBwrap('agy-herdr', 'agy'), cliBwrap('agy-cli-bwrap', 'agy')] },
  // proven family but no confinement: blind could not be enforced on it
  'deepseek-bare': { kind: 'agent', providerModel: 'deepseek', invocations: [{ id: 'pi-cli', via: 'cli', adapter: 'cli-spawn', command: 'pi', args: ['-p', '{prompt}'] }] },
};

const runnerConfig = (capabilities) => ({ executors: EXECUTORS, capabilities });
const prefer = (...ids) => ({ prefer: ids.map((executor) => ({ executor })) });

function workflow(blindLine) {
  return `
id: blind-fixture
title: Blind fixture
steps:
  - id: propose
    title: Propose
    units:
      - id: ideas
        template:
          capability: fixture:propose
          pattern: solo
          objective: Propose ideas
${blindLine}
`;
}

async function run(workflowYaml, capabilities) {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-pools-'));
  fs.mkdirSync(path.join(packageRoot, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'core', 'workflows', 'fixture.yaml'), workflowYaml);
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-pools-project-'));
  try {
    return await checkBlindStepsUseProvenPools(cwd, { packageRoot, loadRunnerConfig: () => runnerConfig(capabilities) });
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

const BLIND = workflow('          blind: true');

test('the check is registered in the doctor registry', () => {
  assert.ok(DOCTOR_CHECKS.map((c) => c.id).includes('blind-steps-use-proven-pools'));
});

test('the proven table holds exactly the canary pairs and not an unmeasured family', () => {
  const rows = BLIND_PROVEN_PAIRS.map((p) => `${p.family}/${p.transport}`).sort();
  assert.deepEqual(rows, ['claude/cli', 'claude/herdr', 'deepseek/cli', 'gemini/cli', 'gemini/herdr', 'openai/cli', 'openai/herdr', 'xai/cli', 'xai/herdr', 'z-ai/cli']);
  assert.ok(BLIND_PROVEN_PAIRS.every((p) => p.backend === 'bwrap'));
});

test('a workflow with no blind unit is not applicable', async () => {
  const result = await run(workflow(''), { 'fixture:propose': prefer('mistral') });
  assert.equal(result.passed, true);
  assert.match(result.message, /not applicable/);
});

test('a blind unit whose pool holds only proven pairs passes', async () => {
  const result = await run(BLIND, { 'fixture:propose': prefer('deepseek', 'xai') });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /\(1\)/);
});

test('a blind unit whose pool includes mistral fails and names the executor, the invocation and the fix', async () => {
  const result = await run(BLIND, { 'fixture:propose': prefer('deepseek', 'mistral') });
  assert.equal(result.passed, false);
  assert.match(result.message, /blind-fixture\/propose\/ideas \(capability "fixture:propose"\)/);
  assert.match(result.message, /mistral via agy-herdr \(family mistral, herdr/);
  assert.match(result.message, /mistral via agy-cli-bwrap \(family mistral, cli/);
  assert.doesNotMatch(result.message, /deepseek via/);
  assert.match(result.message, /remove that executor from the capability's prefer pool/);
  assert.match(result.message, /BLIND_PROVEN_PAIRS/);
});

test('a proven family on a transport that was not proven still fails', async () => {
  const result = await run(BLIND, { 'fixture:propose': prefer('deepseek-herdr') });
  assert.equal(result.passed, false);
  assert.match(result.message, /deepseek-herdr via pi-herdr-deepseek \(family deepseek, herdr/);
});

test('an unconfined invocation is never a candidate, so it is not reported here', async () => {
  const result = await run(BLIND, { 'fixture:propose': prefer('deepseek-bare', 'deepseek') });
  assert.equal(result.passed, true, result.message);
});

test('a capability pool from a bare verb entry is resolved by bind like at run time', async () => {
  const result = await run(BLIND, { propose: prefer('mistral') });
  assert.equal(result.passed, false);
  assert.match(result.message, /mistral via agy-herdr/);
});

test('a runner config that cannot be loaded passes with a note instead of throwing', async () => {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-pools-'));
  try {
    const result = await checkBlindStepsUseProvenPools(os.tmpdir(), {
      packageRoot,
      loadRunnerConfig: () => { throw new Error('no such file'); },
    });
    assert.equal(result.passed, true);
    assert.match(result.message, /not evaluated: no such file/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('the registered check runs against the shipped Workflows without throwing', async () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'blind-steps-use-proven-pools');
  const result = await entry.check(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-blind-pools-registered-')));
  assert.equal(typeof result.passed, 'boolean');
  assert.equal(typeof result.message, 'string');
});
