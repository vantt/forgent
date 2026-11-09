// plugin-marketplace-doctor-check.test.mjs — proves the claude-plugin-
// marketplace doctor row (tsk-4xg): it reports whether the fgOS Claude Code
// plugin is registered and enabled, and names `fgos wire-agents` as the fix.
// Installing it changes the person's own Claude config, so only that opt-in
// command does it; its cases live in test/setup/agent-wiring.test.mjs.
//
// Fake `claude` binary only -- a stateful node script this file writes to a
// mkdtemp directory at test time, driven entirely through FGOS_CLAUDE_COMMAND
// (registrations.mjs's own test-only seam). No real `claude` CLI is ever
// invoked.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DOCTOR_CHECKS } from '../../src/setup/registrations.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plugin-marketplace-check-test-'));
}

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
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
  if (process.platform === 'win32') {
    const cmdPath = path.join(dir, 'fake-claude.cmd');
    fs.writeFileSync(cmdPath, `@node "${scriptPath}" %*`);
    return { scriptPath: cmdPath, statePath };
  }
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

test('check warns, never fails, and names fgos wire-agents when the marketplace is not configured at all', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, { marketplaces: [], plugins: [] });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: Claude Code marketplace "fgos-plugins" not configured.*run fgos wire-agents/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check warns when the marketplace is configured but the fgOS plugin is not enabled', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/some/repo' }],
    plugins: [],
  });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: fgOS Claude Code plugin not installed\/enabled.*run fgos wire-agents/);
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

test('check treats a disabled fgOS plugin entry as not enabled and warns', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: false }],
  });
  withFakeClaude(scriptPath, () => {
    const { passed, message } = checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: fgOS Claude Code plugin not installed\/enabled.*run fgos wire-agents/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});
