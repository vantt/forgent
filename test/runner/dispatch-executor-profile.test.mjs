import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRunnerConfig, loadRunnerConfigFromDir, RunnerConfigError, normalizeLegacyConfinement, REASONING_EFFORT_VALUES } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorConfig, resolveExecutorAndOverrides } from '../../src/runner/dispatch/resolve.mjs';

// Phase 01 groups A and C5. The subject here is the CONFIG DOOR: what an executor
// is allowed to declare about itself, and the one combination that must be refused
// before anything runs.
//
// C5 exists because permission posture turned out to be decided, on a real
// machine, by two lines fgOS cannot see: a shell alias supplying the bypass flag
// and a settings key suppressing its acceptance screen. An executor may therefore
// declare `bypass`, but only alongside the confinement that makes it defensible,
// and the refusal has to happen at load rather than in review. Evidence:
// docs/architect/agent-coordination/verification/visibility-herdr/proofs/
//   2026-09-06-isolation/permission-posture-findings.md

function loadWith(executorEntry) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-profile-cfg-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    executors: { sample: { kind: 'agent', ...executorEntry } },
  }, null, 2));
  try {
    return loadRunnerConfig(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const FULL_CONFINEMENT = { privateHome: true, isolatedSession: true, ownWorktree: true };

test('A3: an executor declaring none of the new fields still loads unchanged', () => {
  const cfg = loadWith({ command: 'agy', args: ['-p', '{prompt}'] });
  assert.equal(cfg.executors.sample.permissionMode, undefined);
  assert.equal(cfg.executors.sample.confinement, undefined);
});

test('A1: the declared profile survives the load intact', () => {
  const cfg = loadWith({
    command: 'claude',
    args: ['{prompt}'],
    lifecycleOwner: 'dispatch',
    visibilityTransport: 'herdr',
    promptDelivery: 'file-pointer',
    permissionMode: 'bypass',
    confinement: FULL_CONFINEMENT,
  });
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

test('C5: bypass with full confinement loads', () => {
  const cfg = loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'bypass', confinement: FULL_CONFINEMENT });
  assert.equal(cfg.executors.sample.permissionMode, 'bypass');
});

test('C5: ask mode needs no confinement -- the invariant constrains bypass only', () => {
  const cfg = loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'ask' });
  assert.equal(cfg.executors.sample.permissionMode, 'ask');
});

test('A1: an unknown permissionMode is refused rather than passed through', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], permissionMode: 'yolo' }),
    (err) => err instanceof RunnerConfigError && /permissionMode/.test(err.message),
  );
});

test('A1: confinement flags must be booleans, not truthy strings', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], confinement: { privateHome: 'yes', isolatedSession: true, ownWorktree: true } }),
    (err) => err instanceof RunnerConfigError && /confinement/.test(err.message),
  );
});

test('A1: an unknown promptDelivery value is refused, and a removed field is named rather than ignored', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], promptDelivery: 'telepathy' }),
    (err) => err instanceof RunnerConfigError && /promptDelivery/.test(err.message),
  );
  assert.throws(
    // `receipt` was removed: it had one legal value and no reader anywhere.
    // A config still carrying it is told so, rather than having it quietly do
    // nothing -- which is what a field nothing consults already does.
    () => loadWith({ command: 'claude', args: ['{prompt}'], receipt: 'receiver-written-file' }),
    (err) => err instanceof RunnerConfigError && /receipt/.test(err.message) && /removed/.test(err.message),
  );
});

test('A1: trustStore is declared where it is read, and only there', () => {
  // It used to be declared on the executor and read from `interactiveMode`.
  // The validator therefore guarded a field nothing consulted, which is how
  // this repo's own config ran a `codex-toml` store that the only list of
  // legal kinds did not contain.
  assert.throws(
    () => loadWith({ command: 'c', args: ['{prompt}'], trustStore: { kind: 'claude-json' } }),
    (err) => err instanceof RunnerConfigError && /trustStore/.test(err.message) && /interactiveMode/.test(err.message),
  );

  const withMode = (trustStore) => loadWith({
    command: 'c',
    args: ['{prompt}'],
    adapter: 'herdr-spawn',
    interactiveMode: { exitCommand: '/exit', kind: 'claude', trustStore },
  });
  assert.equal(withMode(null).executors.sample.interactiveMode.trustStore, null);
  assert.equal(withMode({ kind: 'codex-toml' }).executors.sample.interactiveMode.trustStore.kind, 'codex-toml');
  assert.throws(
    () => withMode({ kind: 'sqlite' }),
    (err) => err instanceof RunnerConfigError && /trustStore/.test(err.message),
  );
});

test('A1: the profile reaches the resolver without resolve.mjs being changed for it', () => {
  // resolveExecutorConfig already returns `{ ...executor, governance }`, so the
  // declared profile rides along with that spread. Asserting it here is what
  // makes that a contract instead of a coincidence -- and it is the reason the
  // resolver, whose blast radius impact analysis reports as HIGH, did not have to
  // be edited at all for this phase.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-profile-resolve-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
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
  }, null, 2));
  try {
    const cfg = loadRunnerConfig(file);
    const resolved = resolveExecutorConfig(cfg, 'standard', 'profiled');
    assert.equal(resolved.permissionMode, 'bypass');
    assert.deepEqual(resolved.confinement, normalizeLegacyConfinement(FULL_CONFINEMENT));
    assert.equal(resolved.promptDelivery, 'file-pointer');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the real repository config still loads -- every existing executor stays valid', () => {
  // A3 is only meaningful if it holds against the config actually in use, not
  // only against synthetic fixtures. The real file nests the runner section
  // under a `runner` key, which is what loadRunnerConfigFromDir unwraps.
  const cfg = loadRunnerConfigFromDir(process.cwd());
  assert.ok(Object.keys(cfg.executors).length > 0, 'the repository config declares executors');
});

// Phase C (executor-profile-schema-migration): `identity`/`supports` are
// design.md §3.7's ExecutorProfile target vocabulary, made real additive
// config fields on `executors.<id>` -- the same shape/dual-vocabulary
// pattern `invocations[]` already established for the Invocation half of
// §3.7. Neither field is read by any resolution/dispatch code yet; this
// phase only proves the shape is expressible, validated, and resolvable.

test('Phase C: an executor declaring neither identity nor supports still loads unchanged (regression guard)', () => {
  const cfg = loadWith({ command: 'agy', args: ['-p', '{prompt}'] });
  assert.equal(cfg.executors.sample.identity, undefined);
  assert.equal(cfg.executors.sample.supports, undefined);
});

test('Phase C: a full identity + supports block survives the load intact', () => {
  const cfg = loadWith({
    command: 'claude',
    args: ['{prompt}'],
    identity: {
      principalRef: 'principal://sample',
      runtimeBackendRef: 'backend://sample-cli',
      trustDomain: 'local-operator',
      egressClass: 'unrestricted',
    },
    supports: {
      providerFamilies: ['claude'],
      reasoningEffort: ['low', 'medium'],
      systemPrompt: true,
      toolGating: 'allowedTools',
    },
  });
  const e = cfg.executors.sample;
  assert.deepEqual(e.identity, {
    principalRef: 'principal://sample',
    runtimeBackendRef: 'backend://sample-cli',
    trustDomain: 'local-operator',
    egressClass: 'unrestricted',
  });
  assert.deepEqual(e.supports, {
    providerFamilies: ['claude'],
    reasoningEffort: ['low', 'medium'],
    systemPrompt: true,
    toolGating: 'allowedTools',
  });
});

test('Phase C: identity is all-or-nothing -- each of the four fields is refused by name when missing', () => {
  const fullIdentity = {
    principalRef: 'principal://sample',
    runtimeBackendRef: 'backend://sample-cli',
    trustDomain: 'local-operator',
    egressClass: 'unrestricted',
  };
  for (const field of Object.keys(fullIdentity)) {
    const identity = { ...fullIdentity };
    delete identity[field];
    assert.throws(
      () => loadWith({ command: 'claude', args: ['{prompt}'], identity }),
      (err) => err instanceof RunnerConfigError && err.message.includes(field),
      `expected refusal naming "${field}" when it is missing`,
    );
  }
});

test('Phase C: identity fields must be non-empty strings, not just present', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], identity: { principalRef: '', runtimeBackendRef: 'b', trustDomain: 't', egressClass: 'e' } }),
    (err) => err instanceof RunnerConfigError && err.message.includes('principalRef'),
  );
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], identity: 'not-an-object' }),
    (err) => err instanceof RunnerConfigError && /identity/.test(err.message),
  );
});

test('Phase C: supports fields are each independently optional -- a partial declaration loads', () => {
  const cfg = loadWith({ command: 'claude', args: ['{prompt}'], supports: { toolGating: 'allowedTools' } });
  assert.deepEqual(cfg.executors.sample.supports, { toolGating: 'allowedTools' });
});

test('Phase C: supports.reasoningEffort must be entries from REASONING_EFFORT_VALUES, not free strings', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], supports: { reasoningEffort: ['low', 'extreme'] } }),
    (err) => err instanceof RunnerConfigError && REASONING_EFFORT_VALUES.every((v) => err.message.includes(v)),
  );
  const cfg = loadWith({ command: 'claude', args: ['{prompt}'], supports: { reasoningEffort: [...REASONING_EFFORT_VALUES] } });
  assert.deepEqual(cfg.executors.sample.supports.reasoningEffort, REASONING_EFFORT_VALUES);
});

test('Phase C: supports.providerFamilies must be a non-empty array of non-empty strings', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], supports: { providerFamilies: [] } }),
    (err) => err instanceof RunnerConfigError && /providerFamilies/.test(err.message),
  );
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], supports: { providerFamilies: ['claude', ''] } }),
    (err) => err instanceof RunnerConfigError && /providerFamilies/.test(err.message),
  );
});

test('Phase C: supports.systemPrompt must be a boolean, not a truthy string', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], supports: { systemPrompt: 'yes' } }),
    (err) => err instanceof RunnerConfigError && /systemPrompt/.test(err.message),
  );
});

test('Phase C: supports.toolGating must be a non-empty string', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], supports: { toolGating: '' } }),
    (err) => err instanceof RunnerConfigError && /toolGating/.test(err.message),
  );
});

test('Phase C: the real repository config declares identity/supports on "claude" and it survives resolveExecutorAndOverrides end to end', () => {
  // The phase's own close criterion: "resolvable end-to-end for at least
  // one real executor" -- a synthetic fixture alone would not prove this,
  // only the actual live config declaring it for real does.
  const cfg = loadRunnerConfigFromDir(process.cwd());
  const { executor } = resolveExecutorAndOverrides(cfg, 'claude');
  assert.ok(executor.identity, '"claude" must declare a real identity block');
  assert.equal(executor.identity.trustDomain, 'local-operator');
  assert.ok(executor.supports, '"claude" must declare a real supports block');
  assert.ok(executor.supports.providerFamilies.includes('claude'));
});

// Phase D (executor-profile-schema-migration): retires the top-level
// `runner.readOnlyExecutorRedirects` map -- the same candidate-pool shape
// now lives on `executors.<id>.readOnlyRedirect`, the source executor's own
// entry (same seam Phase C's identity/supports already established, not a
// new namespace).

function loadRunnerConfigObject(cfgObject) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-redirect-cfg-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify(cfgObject, null, 2));
  try {
    return loadRunnerConfig(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('Phase D: the retired top-level "readOnlyExecutorRedirects" field is refused at load, by name, naming its replacement', () => {
  assert.throws(
    () => loadRunnerConfigObject({
      executor: { command: 'node', args: ['{prompt}'] },
      models: { standard: 'sonnet' },
      timeoutMs: 60000,
      readOnlyExecutorRedirects: { claude: ['claude-reviewer'] },
    }),
    (err) => err instanceof RunnerConfigError && /readOnlyExecutorRedirects/.test(err.message) && /removed/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
});

test('Phase D: an executor declaring no readOnlyRedirect still loads unchanged (regression guard)', () => {
  const cfg = loadWith({ command: 'claude', args: ['{prompt}'] });
  assert.equal(cfg.executors.sample.readOnlyRedirect, undefined);
});

test('Phase D: readOnlyRedirect accepts a bare string, an array of strings, or {default, operations}', () => {
  assert.equal(loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: 'claude-reviewer' }).executors.sample.readOnlyRedirect, 'claude-reviewer');
  assert.deepEqual(loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: ['claude-reviewer', 'codex-bwrap'] }).executors.sample.readOnlyRedirect, ['claude-reviewer', 'codex-bwrap']);
  const full = { default: ['codex-bwrap'], operations: { 'review-candidate': ['codex-bwrap'] } };
  assert.deepEqual(loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: full }).executors.sample.readOnlyRedirect, full);
});

test('Phase D: readOnlyRedirect refuses a malformed pool -- empty string, non-string entries, or an unrecognized shape', () => {
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: '' }),
    (err) => err instanceof RunnerConfigError && /readOnlyRedirect/.test(err.message),
  );
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: ['ok', 42] }),
    (err) => err instanceof RunnerConfigError && /readOnlyRedirect/.test(err.message),
  );
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: 42 }),
    (err) => err instanceof RunnerConfigError && /readOnlyRedirect/.test(err.message),
  );
  assert.throws(
    () => loadWith({ command: 'claude', args: ['{prompt}'], readOnlyRedirect: { operations: { 'review-candidate': [42] } } }),
    (err) => err instanceof RunnerConfigError && /operations\.review-candidate/.test(err.message),
  );
});

test('Phase D: the real repository config declares readOnlyRedirect on "claude", no top-level readOnlyExecutorRedirects survives, and it resolves end to end', () => {
  const cfg = loadRunnerConfigFromDir(process.cwd());
  assert.equal(cfg.readOnlyExecutorRedirects, undefined, 'the retired top-level field must not exist in the live repository config');
  const { executor } = resolveExecutorAndOverrides(cfg, 'claude');
  assert.deepEqual(executor.readOnlyRedirect, {
    default: ['codex-bwrap'],
    operations: {
      'review-candidate': ['codex-bwrap'],
      'red-team-candidate': ['codex-bwrap'],
    },
  });
});
