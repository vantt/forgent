// agent-wiring.test.mjs -- fgOS writes a person's own agent config (~/.claude, ~/.gemini, ...)
// only through the opt-in `fgos wire-agents`: init and doctor --fix leave HOME alone
// outside ~/.fgos. The opt-in command itself (acts only on agents present, prints every file, backs
// each one up first, never sets a permission) is the host's: its proofs are in
// apps/fgos/src/wiring/wire_agents.rs and packages/distribution/rust/src/agent_config.rs.
// The case runs against a throwaway HOME and a fake `claude` (FGOS_CLAUDE_COMMAND) whose state
// lives outside that HOME.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { spawnFgos } from '../helpers/cli-entry.mjs';

const FGOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');
const WINDOWS = process.platform === 'win32';

function mkTemp(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

/** A fake `claude` keeping its marketplace/plugin state and a log of every call in `dir` (never in HOME). */
function fakeClaude(dir, state) {
  const statePath = path.join(dir, 'state.json');
  const logPath = path.join(dir, 'calls.log');
  fs.writeFileSync(statePath, JSON.stringify(state));
  const script = path.join(dir, 'fake-claude.mjs');
  fs.writeFileSync(script, `#!/usr/bin/env node
import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
const read = () => JSON.parse(fs.readFileSync(${JSON.stringify(statePath)}, 'utf8'));
const write = (s) => fs.writeFileSync(${JSON.stringify(statePath)}, JSON.stringify(s));
if (args[0] === '--version') { process.stdout.write('1.0.0 (fake)'); process.exit(0); }
if (args.join(' ') === 'plugin marketplace list --json') { process.stdout.write(JSON.stringify(read().marketplaces)); process.exit(0); }
if (args.join(' ') === 'plugin list --json') { process.stdout.write(JSON.stringify(read().plugins)); process.exit(0); }
if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'add') {
  const s = read();
  s.marketplaces.push({ name: 'fgos-plugins', source: 'github', repo: args[3] }); write(s); process.exit(0);
}
if (args[0] === 'plugin' && args[1] === 'install') {
  const s = read();
  s.plugins.push({ id: args[2], enabled: true }); write(s); process.exit(0);
}
process.stderr.write('fake-claude: unrecognized args ' + JSON.stringify(args)); process.exit(1);
`);
  fs.chmodSync(script, 0o755);
  let command = script;
  if (WINDOWS) {
    command = path.join(dir, 'fake-claude.cmd');
    fs.writeFileSync(command, `@node "${script}" %*`);
  }
  const calls = () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
  return { command, statePath, calls, state: () => JSON.parse(fs.readFileSync(statePath, 'utf8')) };
}

/** A directory holding an executable `agy` that does nothing, to put agy on PATH. */
function fakeAgyBin(dir) {
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  if (WINDOWS) fs.writeFileSync(path.join(bin, 'agy.cmd'), '@exit /b 0\r\n');
  else {
    fs.writeFileSync(path.join(bin, 'agy'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'agy'), 0o755);
  }
  return bin;
}

/** Every file and directory under `root` except `.fgos`, with a content hash for files. */
function snapshotHome(root) {
  const out = {};
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = path.posix.join(rel, entry.name);
      if (relPath === '.fgos') continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out[`${relPath}/`] = 'dir';
        walk(abs, relPath);
      } else {
        out[relPath] = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
      }
    }
  };
  walk(root, '');
  return out;
}

const CHANGING_CLAUDE_CALLS = (calls) => calls.filter((args) => args[0] === 'plugin' && ['add', 'install'].includes(args[args[1] === 'marketplace' ? 2 : 1]));

function runFgos(cwd, args, env) {
  // boundary: the claim is about what the init, doctor --fix and wire-agents verbs write as whole
  // processes under one HOME; the verb cases in bin/fgos.mjs have no use case to call in process.
  // `doctor` is the host's verb, run through the host binary the test launcher staged.
  if (args[0] === 'doctor') return spawnSync(process.env.FGOS_HOST_BIN, args, { cwd, encoding: 'utf8', env });
  return spawnFgos(FGOS, args, { cwd, encoding: 'utf8', env });
}

test('init and doctor --fix write nothing in HOME outside ~/.fgos and change no Claude state, with claude and agy present and the mailbox on', () => {
  const work = mkTemp('agent-wiring-untouched-');
  const home = path.join(work, 'home');
  fs.mkdirSync(path.join(home, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'settings.json'), '{\n  "theme": "dark"\n}\n');
  const repo = initFixtureRepo(fs.mkdirSync(path.join(work, 'repo'), { recursive: true }), { branch: 'main' });
  writeProjectConfig(repo, { mailbox: { enabled: true } });
  const claude = fakeClaude(work, { marketplaces: [], plugins: [] });
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    FGOS_CLAUDE_COMMAND: claude.command,
    PATH: `${fakeAgyBin(work)}${path.delimiter}${process.env.PATH}`,
  };
  delete env.CLAUDE_CONFIG_DIR;
  const before = snapshotHome(home);

  for (const args of [['init'], ['doctor', '--fix']]) {
    const result = runFgos(repo, args, env);
    assert.equal(result.status, 0, `fgos ${args.join(' ')} failed: ${result.stderr}`);
  }

  assert.deepEqual(snapshotHome(home), before, 'HOME outside ~/.fgos must be byte-identical');
  assert.deepEqual(CHANGING_CLAUDE_CALLS(claude.calls()), [], 'no claude command that changes Claude state may run');
  fs.rmSync(work, { recursive: true, force: true });
});
