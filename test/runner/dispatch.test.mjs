import { committedRunnerConfig } from '../helpers/committed-config.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveInvocationRoot } from '../../src/runner/paths.mjs';
import { parseYaml } from '../../src/util/yaml.mjs';

// Live cases only: each reads committed project config and/or the standard
// runner.yaml. No import from the dead Node dispatch/run-supervisor table in
// plans/261122-2108-delete-dead-node-execution-closure/reports/closure.md.

test('the committed .fgos/config.json runner section declares the consolidated gemini executor (executor-provider-naming 2026-09-17, replacing the former "agy" executor id): invocations[]-shaped, kind agent, allowCrossProvider true, run through agy with the tier model passed on every invocation', () => {
  const cfg = committedRunnerConfig();
  const executor = cfg.executors?.gemini;
  assert.ok(executor, 'executors.gemini must exist');
  assert.equal(executor.kind, 'agent');
  assert.equal(executor.allowCrossProvider, true);
  assert.ok(Array.isArray(executor.invocations));
  const ids = executor.invocations.map((inv) => inv.id);
  for (const id of ['agy-herdr-bwrap', 'agy-cli-bwrap']) {
    assert.ok(ids.includes(id), `gemini must declare the "${id}" invocation`);
  }
  // gemini runs through the Antigravity CLI; omp and pi do not serve it.
  assert.ok(executor.invocations.every((inv) => inv.command === 'agy'), `gemini invocations must all run agy, got ${JSON.stringify(executor.invocations.map((inv) => inv.command))}`);
  for (const inv of executor.invocations) {
    // Without --model agy runs its default model whatever the tier asked for.
    const at = inv.args.indexOf('--model');
    assert.ok(at >= 0 && inv.args[at + 1] === '{model}', `${inv.id} must pass --model {model}`);
    assert.deepEqual(inv.confinement, { backend: 'bwrap' }, `${inv.id} runs confined`);
  }
  const headless = executor.invocations.find((inv) => inv.id === 'agy-cli-bwrap');
  assert.equal(headless.via, 'cli');
  assert.equal(headless.adapter, 'cli-spawn');
  assert.ok(headless.args.includes('{prompt}'));
});

test('the committed .fgos/config.json runner section loads and is well-formed', () => {
  const cfg = committedRunnerConfig();
  assert.deepEqual(Object.keys(cfg.modelPolicies.claude).sort(), ['flagship', 'advanced', 'frontier', 'mini', 'nano', 'standard'].sort());
});

test('the committed .fgos/config.json runner section wires the consolidated gemini executor to gemini\'s own modelPolicies, not claude\'s (D9, tsk-5tm-5 — the bug this piece originally fixed)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.gemini?.providerModel, 'gemini');
  assert.equal(typeof cfg.modelPolicies?.gemini?.nano, 'string');
  assert.ok(cfg.modelPolicies.gemini.nano.length > 0);
});

test('the worker grant, from the machine default and from the standard confined invocation, is test commands only with no git write grant', () => {
  const cfg = committedRunnerConfig();
  const { args } = cfg.executor;
  assert.ok(args.includes('--permission-mode'));
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'acceptEdits');
  const allowed = args.includes('--allowedTools') ? args[args.indexOf('--allowedTools') + 1].split(',') : [];
  const testCommand = /^(Skill|Bash\((rtk (proxy )?)?(cargo (build|check|test|clippy|fmt)|node --test|npm test|cargo|node):\*\))$/;
  for (const tool of allowed) assert.match(tool, testCommand, `allowlist grants only test commands, found ${tool}`);
  assert.ok(!args.some((arg) => /git (add|commit)/.test(arg)), 'no git add/commit grant on the default executor');
  assert.ok(!args.includes('--dangerously-skip-permissions'));

  const { root } = resolveInvocationRoot({ cwd: process.cwd() });
  const standardFilename = path.join(root, 'core', 'config-standard', 'runner.yaml');
  const standard = parseYaml(fs.readFileSync(standardFilename, 'utf8'), { filename: standardFilename });
  const bwrapInvocation = standard.runner?.executors?.claude?.invocations?.find((inv) => inv.id === 'claude-cli-bwrap');
  assert.ok(bwrapInvocation, 'claude-cli-bwrap invocation found');
  const bwrapArgs = bwrapInvocation.args;
  assert.ok(bwrapArgs.includes('--allowedTools'));
  assert.deepEqual(bwrapArgs[bwrapArgs.indexOf('--allowedTools') + 1].split(','), ['Bash(cargo:*)', 'Bash(node:*)', 'Bash(npm test:*)']);
  assert.ok(bwrapArgs.includes('--permission-mode'));
  assert.equal(bwrapArgs[bwrapArgs.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.ok(!bwrapArgs.some((arg) => /git (add|commit)/.test(arg)), 'no git add/commit grant in claude-cli-bwrap');
  assert.ok(!bwrapArgs.includes('--dangerously-skip-permissions'));
});

test('the committed .fgos/config.json runner section no longer declares a coding-classify-intake executor (tsk-49u): tsk-4ns already stripped its only consumer (fgos-submit-assist\'s dispatch-fallback branch), leaving the config entry orphaned, so it was removed via the same ADR0020 hand-commit-to-main path its own rename (tsk-3fj) originally used', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.['coding-classify-intake'], undefined, 'executors.coding-classify-intake should no longer exist -- retired after tsk-4ns removed its only consumer');
});

test('the committed .fgos/config.json runner section no longer declares a gather executor (tsk-5tm-2 D6): the one cross-provider path, retired -- no architectural reason on record for cross-provider, and native Task-tool dispatch already met the one documented reason (parallelizing wall-clock)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.gather, undefined, 'executors.gather should no longer exist -- retired per D6');
});

test('the committed .fgos/config.json runner section declares "impact-analysis"/"pane-labeling" in its capabilities catalog (D4/D14, tsk-in1-3)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(typeof cfg.capabilities?.['impact-analysis']?.description, 'string');
  assert.ok(cfg.capabilities['impact-analysis'].description.length > 0);
  assert.equal(typeof cfg.capabilities?.['pane-labeling']?.description, 'string');
});
