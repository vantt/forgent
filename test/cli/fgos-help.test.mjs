// STR79: per-subcommand `fgos <verb> --help` tests. Before this fix, a verb's
// `--help` had no dedicated handling at all — it fell through to runVerb and
// either threw (exit 4, one-line stderr error, e.g. `submit --help`) or, for
// `init`, silently reran the verb with real side effects. This suite proves
// the centralized `flags.help` check in main() (bin/fgos.mjs, reusing
// renderHelpText scoped to one COMMAND_REGISTRY entry) fixes both failure
// modes for every verb, uniformly, with no side effects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-help-cli-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function entry(name) {
  const found = COMMAND_REGISTRY.find((e) => e.name === name);
  assert.ok(found, `fixture bug: no "${name}" entry in COMMAND_REGISTRY`);
  return found;
}

test('fgos submit --help exits 0 and prints submit\'s own help, not a one-line error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', '--help']);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.includes(entry('submit').invoke), 'stdout missing "fgos submit"');
  assert.ok(result.stdout.includes(entry('submit').description), 'stdout missing submit\'s description');
});

test('fgos discover --help exits 0 and prints discover\'s own help', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['discover', '--help']);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.includes(entry('discover').invoke), 'stdout missing "fgos discover"');
  assert.ok(result.stdout.includes(entry('discover').description), 'stdout missing discover\'s description');
});

test('fgos take --help exits 0 and prints take\'s own help', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['take', '--help']);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.includes(entry('take').invoke), 'stdout missing "fgos take"');
  assert.ok(result.stdout.includes(entry('take').description), 'stdout missing take\'s description');
});

test('fgos init --help exits 0, prints help, and does not call initStore or write any file', () => {
  const cwd = tmpCwd();
  const before = fs.readdirSync(cwd);
  const result = run(cwd, ['init', '--help']);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.includes(entry('init').invoke), 'stdout missing "fgos init"');
  assert.ok(result.stdout.includes(entry('init').description), 'stdout missing init\'s description');
  const after = fs.readdirSync(cwd);
  assert.deepEqual(after, before, 'init --help must not write any file (no .fgos/ store, no side effects)');
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'init --help must not create .fgos/');
});

test('a verb\'s --help prints only that verb\'s block, not the full command list', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', '--help']);
  assert.equal(result.status, 0);
  for (const other of COMMAND_REGISTRY) {
    if (other.name === 'submit') continue;
    assert.ok(
      !result.stdout.includes(other.invoke),
      `submit --help leaked another verb's invoke line: "${other.invoke}"`,
    );
  }
});

test('fgos --help (top-level, no verb) behavior is unchanged', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help']);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.length > 0);
  for (const registryEntry of COMMAND_REGISTRY) {
    assert.ok(result.stdout.includes(registryEntry.invoke), `--help text is missing "${registryEntry.invoke}"`);
  }
});
