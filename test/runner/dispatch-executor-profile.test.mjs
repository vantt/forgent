import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadRunnerConfig, loadRunnerConfigFromDir, RunnerConfigError, normalizeLegacyConfinement } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorConfig } from '../../src/runner/dispatch/resolve.mjs';

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
