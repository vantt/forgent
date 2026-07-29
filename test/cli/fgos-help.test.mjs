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

// submit/discover/take are arbitrary sample verbs: the centralized
// flags.help check in main() runs before verb dispatch, uniformly, so any
// verb proves the same mechanism — no verb-specific wiring to distinguish
// (unlike `init --help` below, which has its own real side-effect concern).
for (const verb of ['submit', 'discover', 'take']) {
  test(`fgos ${verb} --help exits 0 and prints ${verb}'s own help, not a one-line error`, () => {
    const cwd = tmpCwd();
    const result = run(cwd, [verb, '--help']);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.ok(result.stdout.includes(entry(verb).invoke), `stdout missing "fgos ${verb}"`);
    assert.ok(result.stdout.includes(entry(verb).description), `stdout missing ${verb}'s description`);
  });
}

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
