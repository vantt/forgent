// plugin-marketplace-doctor-check.test.mjs — proves the claude-plugin-
// marketplace doctor check/fix (tsk-4xg,
// docs/history/tsk-4xg-plugin-marketplace-doctor-check/): a new project set
// up via `fgos setup` never got the fgOS Claude Code plugin
// (.claude-plugin/marketplace.json, plugins/fgOS) registered or installed,
// so it had no /fgOS:* skills available -- and doctor never flagged the
// gap. Same registerCheck/registerFix registry every other doctor check/fix
// already uses (tsk-2cs) -- a new consumer, no new plumbing.
//
// Fake `claude` binary only -- a stateful node script this file writes to a
// mkdtemp directory at test time, driven entirely through FGOS_CLAUDE_COMMAND
// (registrations.mjs's own test-only seam). No real `claude` CLI is ever
// invoked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/registrations.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plugin-marketplace-check-test-'));
}

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
  return entry;
}

function fixById(id) {
  const entry = FIX_REGISTRATIONS.find((f) => f.id === id);
  assert.ok(entry, `FIX_REGISTRATIONS is missing "${id}"`);
  return entry;
}

// Writes a fake `claude` executable whose plugin marketplace/plugin state
// lives in a JSON file on disk, so a `fix` call's real mutation (marketplace
// add / plugin install) is observable across subsequent `check`/`fix`
// calls, the same way the real `claude` CLI's own on-disk state would be.
function writeFakeClaude(dir, initialState) {
  const statePath = path.join(dir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(initialState));
  const scriptPath = path.join(dir, 'fake-claude.mjs');
  fs.writeFileSync(
    scriptPath,
    `#!/usr/bin/env node
    import fs from 'node:fs';
    const statePath = ${JSON.stringify(statePath)};
    const args = process.argv.slice(2);
    const readState = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const writeState = (s) => fs.writeFileSync(statePath, JSON.stringify(s));

    if (args[0] === '--version') {
      process.stdout.write('1.0.0 (fake)');
      process.exit(0);
    }
    if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'list' && args[3] === '--json') {
      process.stdout.write(JSON.stringify(readState().marketplaces));
      process.exit(0);
    }
    if (args[0] === 'plugin' && args[1] === 'list' && args[2] === '--json') {
      process.stdout.write(JSON.stringify(readState().plugins));
      process.exit(0);
    }
    if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'add') {
      const state = readState();
      if (state.failAdd) {
        process.stderr.write('fake add failure');
        process.exit(1);
      }
      state.marketplaces.push({ name: 'fgos-plugins', source: 'github', repo: args[3] });
      writeState(state);
      process.stdout.write('added');
      process.exit(0);
    }
    if (args[0] === 'plugin' && args[1] === 'install') {
      const state = readState();
      if (state.failInstall) {
        process.stderr.write('fake install failure');
        process.exit(1);
      }
      state.plugins.push({ id: args[2], enabled: true });
      writeState(state);
      process.stdout.write('installed');
      process.exit(0);
    }
    process.stderr.write('fake-claude: unrecognized args ' + JSON.stringify(args));
    process.exit(1);
    `,
  );
  fs.chmodSync(scriptPath, 0o755);
  return { scriptPath, statePath };
}

function withFakeClaude(scriptPath, fn) {
  const prev = process.env.FGOS_CLAUDE_COMMAND;
  process.env.FGOS_CLAUDE_COMMAND = scriptPath;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.FGOS_CLAUDE_COMMAND;
    else process.env.FGOS_CLAUDE_COMMAND = prev;
  }
}

test('check passes without touching claude when the claude binary is not on PATH', () => {
  const prev = process.env.FGOS_CLAUDE_COMMAND;
  process.env.FGOS_CLAUDE_COMMAND = '/nonexistent/fgos-test-claude-binary';
  try {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /not found on PATH/);
  } finally {
    if (prev === undefined) delete process.env.FGOS_CLAUDE_COMMAND;
    else process.env.FGOS_CLAUDE_COMMAND = prev;
  }
});

test('fix is a no-op without touching claude when the claude binary is not on PATH', () => {
  const prev = process.env.FGOS_CLAUDE_COMMAND;
  process.env.FGOS_CLAUDE_COMMAND = '/nonexistent/fgos-test-claude-binary';
  try {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, false);
    assert.match(message, /not found on PATH/);
  } finally {
    if (prev === undefined) delete process.env.FGOS_CLAUDE_COMMAND;
    else process.env.FGOS_CLAUDE_COMMAND = prev;
  }
});

test('check fails when the marketplace is not configured at all', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, { marketplaces: [], plugins: [] });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, false);
    assert.match(message, /marketplace "fgos-plugins" not configured/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check fails when the marketplace is configured but the fgOS plugin is not enabled', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/some/repo' }],
    plugins: [],
  });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, false);
    assert.match(message, /plugin not installed\/enabled/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check accepts a directory-sourced marketplace entry (dev-checkout self-hosting), not just a github one', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/some/repo' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: true }],
  });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /fgOS plugin enabled/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check treats a disabled fgOS plugin entry as not enabled', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: false }],
  });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, false);
    assert.match(message, /plugin not installed\/enabled/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fix adds the marketplace by its GitHub source and installs the plugin when both are missing', () => {
  const dir = mkTempDir();
  const { scriptPath, statePath } = writeFakeClaude(dir, { marketplaces: [], plugins: [] });
  withFakeClaude(scriptPath, () => {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, true);
    assert.match(message, /added marketplace "fgos-plugins" from vantt\/forgent/);
    assert.match(message, /installed and enabled fgOS plugin/);
  });
  const finalState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.deepEqual(finalState.marketplaces, [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }]);
  assert.deepEqual(finalState.plugins, [{ id: 'fgOS@fgos-plugins', enabled: true }]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fix only installs the plugin when the marketplace already exists (never re-adds it)', () => {
  const dir = mkTempDir();
  const { scriptPath, statePath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/dev/checkout' }],
    plugins: [],
  });
  withFakeClaude(scriptPath, () => {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, true);
    assert.doesNotMatch(message, /added marketplace/);
    assert.match(message, /installed and enabled fgOS plugin/);
  });
  const finalState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.deepEqual(finalState.marketplaces, [{ name: 'fgos-plugins', source: 'directory', path: '/dev/checkout' }]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fix is idempotent: changed:false when everything is already configured', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: true }],
  });
  withFakeClaude(scriptPath, () => {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, false);
    assert.match(message, /already configured/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fix surfaces the real error and does not silently swallow a failing marketplace add', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, { marketplaces: [], plugins: [], failAdd: true });
  withFakeClaude(scriptPath, () => {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, false);
    assert.match(message, /claude plugin marketplace add vantt\/forgent.*failed/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fix surfaces the real error and does not silently swallow a failing plugin install', () => {
  const dir = mkTempDir();
  const { scriptPath, statePath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [],
    failInstall: true,
  });
  withFakeClaude(scriptPath, () => {
    const { changed, message } = fixById('claude-plugin-marketplace').fix(process.cwd());
    assert.equal(changed, false);
    assert.match(message, /claude plugin install fgOS@fgos-plugins.*failed/);
  });
  const finalState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  // The marketplace add (which did not need failAdd) still succeeded and
  // persisted -- only the plugin install half failed, proving the fix does
  // not roll back or re-attempt an already-succeeded half on a later run.
  assert.deepEqual(finalState.marketplaces, [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }]);
  fs.rmSync(dir, { recursive: true, force: true });
});
