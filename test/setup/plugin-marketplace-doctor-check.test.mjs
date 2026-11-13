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

async function withFakeClaude(scriptPath, fn) {
  const prev = process.env.FGOS_CLAUDE_COMMAND;
  process.env.FGOS_CLAUDE_COMMAND = scriptPath;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.FGOS_CLAUDE_COMMAND;
    else process.env.FGOS_CLAUDE_COMMAND = prev;
  }
}

test('check passes without touching claude when the claude binary is not on PATH', async () => {
  const prev = process.env.FGOS_CLAUDE_COMMAND;
  process.env.FGOS_CLAUDE_COMMAND = '/nonexistent/fgos-test-claude-binary';
  try {
    const { passed, message } = await checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /not found on PATH/);
  } finally {
    if (prev === undefined) delete process.env.FGOS_CLAUDE_COMMAND;
    else process.env.FGOS_CLAUDE_COMMAND = prev;
  }
});

test('check warns, never fails, and names fgos wire-agents when the marketplace is not configured at all', async () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, { marketplaces: [], plugins: [] });
  await withFakeClaude(scriptPath, async () => {
    const { passed, message } = await checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: Claude Code marketplace "fgos-plugins" not configured.*run fgos wire-agents/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check warns when the marketplace is configured but the fgOS plugin is not enabled', async () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/some/repo' }],
    plugins: [],
  });
  await withFakeClaude(scriptPath, async () => {
    const { passed, message } = await checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: fgOS Claude Code plugin not installed\/enabled.*run fgos wire-agents/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check accepts a directory-sourced marketplace entry (dev-checkout self-hosting), not just a github one', async () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'directory', path: '/some/repo' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: true }],
  });
  await withFakeClaude(scriptPath, async () => {
    const { passed, message } = await checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /fgOS plugin enabled/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('check treats a disabled fgOS plugin entry as not enabled and warns', async () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFakeClaude(dir, {
    marketplaces: [{ name: 'fgos-plugins', source: 'github', repo: 'vantt/forgent' }],
    plugins: [{ id: 'fgOS@fgos-plugins', enabled: false }],
  });
  await withFakeClaude(scriptPath, async () => {
    const { passed, message } = await checkById('claude-plugin-marketplace').check(process.cwd());
    assert.equal(passed, true);
    assert.match(message, /^warning: fgOS Claude Code plugin not installed\/enabled.*run fgos wire-agents/);
  });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the three claude calls of the row overlap instead of running one after another', async () => {
  const dir = mkTempDir();
  const spans = path.join(dir, 'spans.log');
  const scriptPath = path.join(dir, 'slow-claude.mjs');
  fs.writeFileSync(scriptPath, `#!/usr/bin/env node
import fs from 'node:fs';
const start = Date.now();
await new Promise((resolve) => setTimeout(resolve, 400));
fs.appendFileSync(${JSON.stringify(spans)}, start + ' ' + Date.now() + '\\n');
const args = process.argv.slice(2);
process.stdout.write(args[0] === '--version' ? '1.0.0' : '[]');
`);
  fs.chmodSync(scriptPath, 0o755);
  const command = process.platform === 'win32' ? (() => {
    const cmd = path.join(dir, 'slow-claude.cmd');
    fs.writeFileSync(cmd, `@node "${scriptPath}" %*`);
    return cmd;
  })() : scriptPath;
  await withFakeClaude(command, async () => {
    await checkById('claude-plugin-marketplace').check(process.cwd());
  });
  const rows = fs.readFileSync(spans, 'utf8').trim().split('\n').map((line) => line.split(' ').map(Number));
  assert.equal(rows.length, 3, 'the row asks claude three questions');
  const lastStart = Math.max(...rows.map(([start]) => start));
  const firstEnd = Math.min(...rows.map(([, end]) => end));
  assert.ok(lastStart < firstEnd, 'every call started before the first one finished');
  fs.rmSync(dir, { recursive: true, force: true });
});
