// `fgos <verb> --help --json` and `fgos [-h|--help] [<verb>] [--json]`: an
// agent that has only the installed `fgos` (no bin/, no docs) must be able to
// find how to run any verb from the manifest alone. These run the Node payload
// directly; test/rust-host/help-routes.test.mjs runs the same doors through
// the real Rust host.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { COMMAND_REGISTRY, MANIFEST_SCHEMA_VERSION } from '../../src/cli/command-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

const madeDirs = [];
after(() => {
  for (const dir of madeDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tmpCwd() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-verb-help-json-'));
  madeDirs.push(dir);
  return dir;
}

function run(cwd, args) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8', env });
}

function manifestOf(cwd) {
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('fgos <verb> --help --json prints exactly that verb\'s manifest entry, unwrapped, for every verb', () => {
  const cwd = tmpCwd();
  const manifest = manifestOf(cwd);
  for (const command of manifest.commands) {
    const result = run(cwd, [command.name, '--help', '--json']);
    assert.equal(result.status, 0, `${command.name}: ${result.stderr}`);
    assert.equal(result.stderr, '', `${command.name} --help --json wrote to stderr`);
    assert.deepEqual(JSON.parse(result.stdout), command, `${command.name} --help --json differs from its manifest entry`);
  }
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'help must not create a store');
});

test('-h is the same door as --help, top-level and per verb', () => {
  const cwd = tmpCwd();
  assert.deepEqual(JSON.parse(run(cwd, ['-h', '--json']).stdout), manifestOf(cwd));
  assert.deepEqual(JSON.parse(run(cwd, ['-h', '--help', '--json']).stdout), manifestOf(cwd), 'a repeated help token asks the same thing');
  const verbText = run(cwd, ['add', '-h']);
  assert.equal(verbText.status, 0, verbText.stderr);
  assert.equal(verbText.stdout, run(cwd, ['add', '--help']).stdout);
  const verbJson = run(cwd, ['add', '-h', '--json']);
  assert.equal(verbJson.status, 0, verbJson.stderr);
  assert.deepEqual(JSON.parse(verbJson.stdout), JSON.parse(run(cwd, ['add', '--help', '--json']).stdout));
});

test('fgos --help <verb> --json and fgos -h <verb> are that verb\'s help', () => {
  const cwd = tmpCwd();
  const expected = JSON.parse(run(cwd, ['dispatch', '--help', '--json']).stdout);
  for (const args of [['--help', 'dispatch', '--json'], ['-h', 'dispatch', '--json'], ['--help', '--json', 'dispatch']]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), expected, args.join(' '));
  }
  const text = run(cwd, ['-h', 'dispatch']);
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stdout, run(cwd, ['dispatch', '--help']).stdout);
});

test('top-level help refuses an unknown verb or an unknown option (exit 4, nothing on stdout)', () => {
  const cwd = tmpCwd();
  for (const args of [['-h', 'foo'], ['--help', 'foo', '--json'], ['--help', '--bogus'], ['-h', '--json', '--bogus'], ['--help', 'add', 'submit']]) {
    const result = run(cwd, args);
    assert.equal(result.status, 4, `${args.join(' ')} exited ${result.status}: ${result.stdout}`);
    assert.equal(result.stdout, '', `${args.join(' ')} printed to stdout`);
    assert.match(result.stderr, /fgos: /, args.join(' '));
  }
});

test('manifest entries of multi-sub-verb verbs carry subcommands whose keys match the sub enum', () => {
  const cwd = tmpCwd();
  const manifest = manifestOf(cwd);
  assert.equal(manifest.schema_version, MANIFEST_SCHEMA_VERSION);
  const withSubs = manifest.commands.filter((c) => c.subcommands);
  const names = withSubs.map((c) => c.name).sort();
  for (const required of ['agents', 'dispatch', 'gateway', 'goal', 'merge', 'session', 'tool', 'workflow']) {
    assert.ok(names.includes(required), `${required} has no subcommands in the manifest`);
  }
  for (const command of withSubs) {
    assert.deepEqual(command.parameters.properties.sub.enum, Object.keys(command.subcommands), `${command.name}: sub enum != subcommands keys`);
    assert.deepEqual(command.parameters.required, ['sub'], `${command.name}: sub must be required`);
    for (const [sub, spec] of Object.entries(command.subcommands)) {
      assert.equal(typeof spec.description, 'string', `${command.name} ${sub}: description`);
      assert.ok(spec.description.length > 0, `${command.name} ${sub}: empty description`);
      assert.equal(spec.parameters?.type, 'object', `${command.name} ${sub}: parameters.type`);
      assert.ok(Array.isArray(spec.parameters.required), `${command.name} ${sub}: parameters.required`);
      assert.equal(typeof spec.parameters.properties, 'object', `${command.name} ${sub}: parameters.properties`);
      for (const name of spec.parameters.required) {
        assert.ok(Object.hasOwn(spec.parameters.properties, name), `${command.name} ${sub}: required "${name}" has no property`);
      }
      assert.ok(Array.isArray(spec.examples) && spec.examples.length > 0, `${command.name} ${sub}: examples`);
      for (const example of spec.examples) {
        assert.ok(example.startsWith(`fgos ${command.name} ${sub}`), `${command.name} ${sub}: example "${example}" does not run that sub-verb`);
      }
    }
  }
});

test('fgos <verb> <sub> --help --json prints the verb entry narrowed to that sub-verb', () => {
  const cwd = tmpCwd();
  const full = JSON.parse(run(cwd, ['dispatch', '--help', '--json']).stdout);
  const result = run(cwd, ['dispatch', 'decide', '--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { ...full, subcommands: { decide: full.subcommands.decide } });
  const text = run(cwd, ['workflow', 'start', '--help']);
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /fgos workflow start/);
  assert.doesNotMatch(text.stdout, /fgos workflow answer/);
});

test('an unknown sub-verb under --help is refused with the known list (exit 4)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['dispatch', 'bogus', '--help', '--json']);
  assert.equal(result.status, 4, result.stdout);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /unknown dispatch sub-verb "bogus"/);
  assert.match(result.stderr, /decide/);
});

test('help never runs the verb: write and spawn sub-verbs leave the directory untouched', () => {
  const cwd = tmpCwd();
  const before = fs.readdirSync(cwd);
  for (const args of [
    ['init', '--help', '--json'],
    ['session', 'start', '--help', '--json'],
    ['gateway', 'start', '-h'],
    ['workflow', 'start', 'delphi', '--help', '--json'],
    ['run', 'do something', '--writes', 'x.txt', '--help', '--json'],
    ['merge', 'next', '--help'],
  ]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.doesNotMatch(result.stdout, /"contract":\s*"fgos\.v1"/, `${args.join(' ')} returned an envelope`);
  }
  assert.deepEqual(fs.readdirSync(cwd), before, 'help wrote into the working directory');
});

test('run and workflow entries say which door one task and planned work take, with runnable examples', () => {
  const runEntry = COMMAND_REGISTRY.find((e) => e.name === 'run');
  const workflowEntry = COMMAND_REGISTRY.find((e) => e.name === 'workflow');
  assert.match(runEntry.description, /fgos workflow start/);
  assert.match(workflowEntry.description, /fgos run "<prompt>"/);
  assert.ok(runEntry.examples.some((e) => /^fgos run "[^"]+"$/.test(e)), 'run needs a bare one-liner example');
  assert.ok(workflowEntry.subcommands.start.examples.some((e) => e.includes('--units')), 'workflow start needs a --units example');
  assert.ok(workflowEntry.subcommands.start.examples.some((e) => /^fgos workflow start [a-z]/.test(e)), 'workflow start needs a preset example');
});

// The `fgos` shell function (scripts/fgos-shell-integration.sh) appends
// `--dir <root>` to every call that lacks one, and `fgos doctor` probes the
// shell setup with exactly `fgos --help` through it.
test('help accepts the --dir the shell function appends, through the real shell function', () => {
  const cwd = tmpCwd();
  const expected = manifestOf(cwd);
  for (const args of [['--help', '--json', '--dir', cwd], ['-h', '--json', `--dir=${cwd}`], ['--help', 'add', '--json', '--dir', cwd]]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), args.includes('add') ? expected.commands.find((c) => c.name === 'add') : expected, args.join(' '));
  }
  spawnSync('git', ['init', '-q'], { cwd });
  fs.mkdirSync(path.join(cwd, 'bin'));
  fs.symlinkSync(FGOS, path.join(cwd, 'bin', 'fgos.mjs'));
  const integration = path.resolve(__dirname, '../../scripts/fgos-shell-integration.sh');
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  for (const line of ['fgos --help', 'fgos --help --json', 'fgos -h dispatch --json']) {
    const result = spawnSync('bash', ['-c', `source "${integration}" && ${line}`], { cwd, encoding: 'utf8', env });
    assert.equal(result.status, 0, `${line}: ${result.stderr}`);
    assert.ok(result.stdout.length > 0, line);
  }
});

test('an exact -h/--help token is help even where it would be a flag value (same rule as the Rust host)', () => {
  const cwd = tmpCwd();
  for (const [args, verb] of [[['metrics', 'coverage', '--by', '-h', '--json'], 'metrics'], [['version', '--x', '-h', '--json'], 'version'], [['add', '--title', '--help', '--json'], 'add']]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.equal(JSON.parse(result.stdout).name, verb, args.join(' '));
  }
});
