import '../helpers/process-tmp-root.mjs';
import { committedConfigDir } from '../helpers/committed-config.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRunnerConfigForDir, RunnerConfigError, validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { normalizeLegacyConfinement } from '../../src/runner/dispatch/confinement/policies.mjs';
import { resolveExecutorConfig, resolveExecutorAndOverrides } from '../../src/runner/dispatch/resolve.mjs';
import { writeGlobalConfig, writeProjectConfig, withHome } from '../helpers/config-fixture.mjs';

// Phase 01 groups A and C5. The subject here is what an executor may declare about itself that the
// schema cannot state: the one combination that must be refused before anything runs, and the removed fields
// that are named rather than ignored. The shape of every field is the runner schema's.
//
// C5 exists because permission posture turned out to be decided, on a real
// machine, by two lines fgOS cannot see: a shell alias supplying the bypass flag
// and a settings key suppressing its acceptance screen. An executor may therefore
// declare `bypass`, but only alongside the confinement that makes it defensible,
// and the refusal has to happen at load rather than in review. Evidence:
// docs/platform/agent-coordination/verification/visibility-herdr/proofs/
//   2026-09-06-isolation/permission-posture-findings.md

const runnerWith = (extra) => ({
  executor: { command: 'node', args: ['{prompt}'] },
  modelPolicies: { node: { standard: 'sonnet' }, claude: { standard: 'sonnet' } },
  timeoutMs: 60000,
  ...extra,
});

/** The runner config of one executor named `sample`, after the checks that compare two fields. */
function loadWith(executorEntry) {
  const cfg = runnerWith({ executors: { sample: { kind: 'agent', ...executorEntry } } });
  validateRunnerConfigShape(cfg, 'test');
  return cfg;
}

const FULL_CONFINEMENT = { privateHome: true, isolatedSession: true, ownWorktree: true };

test('A1: the loader keeps the declared profile and normalizes its legacy confinement flags', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-profile-cfg-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-profile-home-'));
  const { executor, executors, ...project } = runnerWith({
    executors: {
      sample: {
        kind: 'agent', command: 'claude', args: ['{prompt}'], promptDelivery: 'file-pointer', permissionMode: 'bypass', confinement: FULL_CONFINEMENT,
      },
    },
  });
  writeProjectConfig(dir, { runner: project });
  writeGlobalConfig(home, { runner: { executor, executors } });
  const cfg = withHome(home, () => loadRunnerConfigForDir(dir));
  const e = cfg.executors.sample;
  assert.equal(e.permissionMode, 'bypass');
  assert.deepEqual(e.confinement, normalizeLegacyConfinement(FULL_CONFINEMENT));
  assert.equal(e.promptDelivery, 'file-pointer');
});

test('C5: bypass without any confinement is refused at load, by name', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'bypass' }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.match(err.message, /confinement/i);
      assert.match(err.message, /bypass/i);
      return true;
    },
  );
});

test('C5: bypass with a PARTIAL confinement is refused -- two of three is not confinement', () => {
  for (const missing of ['privateHome', 'isolatedSession', 'ownWorktree']) {
    const confinement = { ...FULL_CONFINEMENT, [missing]: false };
    assert.throws(
      () => loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'bypass', confinement }),
      (err) => err instanceof RunnerConfigError && /confinement/i.test(err.message) && err.message.includes(missing),
      `expected refusal naming the missing flag when ${missing} is false`,
    );
  }
});

test('C5: bypass with full confinement loads, and ask mode needs none -- the invariant constrains bypass only', () => {
  assert.doesNotThrow(() => loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'bypass', confinement: FULL_CONFINEMENT }));
  assert.doesNotThrow(() => loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'ask' }));
});

test('A1: a removed field is named rather than ignored', () => {
  assert.throws(
    // `receipt` was removed: it had one legal value and no reader anywhere.
    // A config still carrying it is told so, rather than having it quietly do
    // nothing -- which is what a field nothing consults already does.
    () => loadWith({ command: 'claude', args: ['{prompt}'], receipt: 'receiver-written-file' }),
    (err) => err instanceof RunnerConfigError && /receipt/.test(err.message) && /removed/.test(err.message),
  );
});

test('A1: trustStore is declared where it is read, and only there', () => {
  // It used to be declared on the executor and read from `interactiveMode`, so the validator guarded a field
  // nothing consulted. Declared on the executor it is now refused, naming where it belongs.
  assert.throws(
    () => loadWith({ command: 'c', args: ['{prompt}'], trustStore: { kind: 'claude-json' } }),
    (err) => err instanceof RunnerConfigError && /trustStore/.test(err.message) && /interactiveMode/.test(err.message),
  );
});

test('A1: the profile reaches the resolver without resolve.mjs being changed for it', () => {
  // resolveExecutorConfig already returns `{ ...executor, governance }`, so the declared profile rides along
  // with that spread. Asserting it here is what makes that a contract instead of a coincidence -- and it is the
  // reason the resolver, whose blast radius impact analysis reports as HIGH, did not have to be edited for it.
  const cfg = runnerWith({
    executors: {
      profiled: {
        kind: 'agent',
        command: 'claude',
        args: ['{prompt}'],
        providerModel: 'claude',
        permissionMode: 'bypass',
        confinement: FULL_CONFINEMENT,
        promptDelivery: 'file-pointer',
      },
    },
  });
  validateRunnerConfigShape(cfg, 'test');
  const resolved = resolveExecutorConfig(cfg, 'standard', 'profiled');
  assert.equal(resolved.permissionMode, 'bypass');
  assert.deepEqual(resolved.confinement, FULL_CONFINEMENT);
  assert.equal(resolved.promptDelivery, 'file-pointer');
});

test('the real repository config still loads -- every existing executor stays valid', () => {
  // The real file nests the runner section under a `runner` key, which is what loadRunnerConfigForDir unwraps.
  const cfg = loadRunnerConfigForDir(committedConfigDir());
  assert.ok(Object.keys(cfg.executors).length > 0, 'the repository config declares executors');
});

test('Phase C: the real repository config declares identity/supports on "claude" and it survives resolveExecutorAndOverrides end to end', () => {
  // The phase's own close criterion: "resolvable end-to-end for at least one real executor" -- a synthetic
  // fixture alone would not prove this, only the actual live config declaring it for real does.
  const cfg = loadRunnerConfigForDir(committedConfigDir());
  const { executor } = resolveExecutorAndOverrides(cfg, 'claude');
  assert.ok(executor.identity, '"claude" must declare a real identity block');
  assert.equal(executor.identity.trustDomain, 'local-operator');
  assert.ok(executor.supports, '"claude" must declare a real supports block');
  assert.ok(executor.supports.providerFamilies.includes('claude'));
});

// The removed `readOnlyExecutorRedirects` map and `placementPolicy`: no schema node describes them, so the
// runner config check says they are gone.

test('Phase D: the retired top-level "readOnlyExecutorRedirects" and "placementPolicy" fields are refused at load, by name', () => {
  for (const key of ['readOnlyExecutorRedirects', 'placementPolicy']) {
    assert.throws(
      () => validateRunnerConfigShape(runnerWith({ [key]: { claude: ['claude-reviewer'] } }), 'test'),
      (err) => err instanceof RunnerConfigError && err.message.includes(key) && /OS confinement/.test(err.message),
    );
  }
  const cfg = loadRunnerConfigForDir(committedConfigDir());
  assert.equal(cfg.readOnlyExecutorRedirects, undefined);
  assert.equal(cfg.placementPolicy, undefined);
  assert.equal(cfg.executors?.claude?.readOnlyRedirect, undefined);
});

test('Phase D correction: declaring readOnlyRedirect ON an executor entry is refused at load, by name', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: 'claude-reviewer' }),
    (err) => err instanceof RunnerConfigError && /readOnlyRedirect/.test(err.message) && /retired|removed/.test(err.message),
  );
});

// executor-id-consolidation Step 2.1: an invocation can name itself with "id" so a caller can select one
// specific `via:"cli"` entry among several, instead of always getting the legacy "first cli match".

function multiInvocationConfig(invocations) {
  const cfg = runnerWith({ executors: { multi: { kind: 'agent', invocations } } });
  validateRunnerConfigShape(cfg, 'test');
  return cfg;
}

test('Step 2.1: two invocations on the same executor cannot declare the same "id"', () => {
  assert.throws(
    () => multiInvocationConfig([
      { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--full'] },
      { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--readonly'] },
    ]),
    (err) => err instanceof RunnerConfigError && /"id": "cli" more than once/.test(err.message),
  );
});

test('Step 2.1: resolveExecutorConfig defaults to the first "via:cli" invocation when no invocationId is passed -- byte-identical to before this field existed', () => {
  const cfg = multiInvocationConfig([
    { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--full'] },
    { id: 'cli-readonly', via: 'cli', command: 'claude', args: ['{prompt}', '--readonly'] },
  ]);
  const resolved = resolveExecutorConfig(cfg, 'standard', 'multi');
  assert.deepEqual(resolved.args, ['{prompt}', '--full']);
});

test('Step 2.1: resolveExecutorConfig selects the named invocation when invocationId is passed', () => {
  const cfg = multiInvocationConfig([
    { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}', '--full'] },
    { id: 'cli-readonly', via: 'cli', command: 'claude', args: ['{prompt}', '--readonly'] },
  ]);
  const resolved = resolveExecutorConfig(cfg, 'standard', 'multi', undefined, undefined, undefined, 'cli-readonly');
  assert.deepEqual(resolved.args, ['{prompt}', '--readonly']);
});

test('Step 2.1: resolveExecutorConfig throws by name when invocationId names an invocation that does not exist', () => {
  const cfg = multiInvocationConfig([
    { id: 'cli', via: 'cli', command: 'claude', args: ['{prompt}'] },
  ]);
  assert.throws(
    () => resolveExecutorConfig(cfg, 'standard', 'multi', undefined, undefined, undefined, 'cli-bwrap'),
    (err) => err instanceof RunnerConfigError && /no "invocations" entry with "id": "cli-bwrap"/.test(err.message),
  );
});
