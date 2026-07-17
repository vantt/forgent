// Machine-readable verb manifest tests (entry-standardization P37 deliverable
// b) — mirrors the run()/spawnSync harness of test/cli/fgos.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { COMMAND_REGISTRY, SCHEMA_VERSION } from '../../src/cli/command-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const FGOS_SOURCE_PATH = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-manifest-cli-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

// Drift guard source of truth: parse `case '<verb>':` inside runVerb's own
// `switch (verb) {` block directly out of bin/fgos.mjs, so a verb added to
// (or removed from) the dispatcher without a matching registry entry fails
// this test the moment either side drifts from the other.
function dispatchedVerbs() {
  const source = fs.readFileSync(FGOS_SOURCE_PATH, 'utf8');
  const switchStart = source.indexOf('async function runVerb(');
  assert.ok(switchStart >= 0, 'runVerb() not found in bin/fgos.mjs — drift guard source moved.');
  const body = source.slice(switchStart);
  const verbs = [...body.matchAll(/^\s{4}case '([a-z-]+)':/gm)].map((m) => m[1]);
  assert.ok(verbs.length > 0, 'no `case \'<verb>\':` lines found — drift guard regex needs updating.');
  return verbs;
}

test('manifest verb-name set equals the set of verbs runVerb() actually dispatches', () => {
  const dispatched = [...new Set(dispatchedVerbs())].sort();
  const registered = COMMAND_REGISTRY.map((entry) => entry.name).sort();
  assert.deepEqual(registered, dispatched);
});

test('every registry entry has access in {read, mutation} and the required keys', () => {
  for (const entry of COMMAND_REGISTRY) {
    assert.deepEqual(
      Object.keys(entry).sort(),
      ['access', 'deprecated', 'description', 'examples', 'invoke', 'name', 'parameters'].sort(),
      `entry "${entry.name}" has an unexpected key set`,
    );
    assert.ok(['read', 'mutation'].includes(entry.access), `entry "${entry.name}" has invalid access "${entry.access}"`);
    assert.equal(typeof entry.name, 'string');
    assert.ok(entry.name.length > 0);
    assert.equal(typeof entry.invoke, 'string');
    assert.equal(typeof entry.description, 'string');
    assert.ok(entry.description.length > 0);
    assert.equal(entry.parameters?.type, 'object');
    assert.ok(Array.isArray(entry.examples));
    assert.ok(entry.examples.length > 0);
  }
});

test('no duplicate verb names in the registry', () => {
  const names = COMMAND_REGISTRY.map((entry) => entry.name);
  assert.deepEqual(names, [...new Set(names)]);
});

test('fgos --help --json parses to {schema_version, commands:[...]} matching the registry', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0);
  const manifest = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(manifest).sort(), ['commands', 'schema_version']);
  assert.equal(manifest.schema_version, SCHEMA_VERSION);
  assert.equal(manifest.commands.length, COMMAND_REGISTRY.length);
  assert.deepEqual(
    manifest.commands.map((c) => c.name).sort(),
    COMMAND_REGISTRY.map((c) => c.name).sort(),
  );
});

test('fgos --help --json manifest is not wrapped in the fgos.v1 envelope', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  const manifest = JSON.parse(result.stdout);
  assert.equal(manifest.contract, undefined);
  assert.equal(manifest.data, undefined);
});

test('fgos --help prints non-empty text listing every verb', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help']);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.length > 0);
  for (const entry of COMMAND_REGISTRY) {
    assert.ok(result.stdout.includes(entry.invoke), `--help text is missing "${entry.invoke}"`);
  }
});
