// The help door through the real Rust host: an agent in a project with no
// bin/ only has the installed `fgos`, so `fgos --help --json` and
// `fgos <verb> --help --json` must work through the host for every route
// kind, never run the verb, and keep R3 (an unlisted selector fails closed).
// Runs the real `fgos:dev` door (scripts/run-rust-dev-host.mjs: real manifest,
// real host, real Node payload); only Cargo is substituted, by a stub that
// installs the already-built host binary (FGOS_HOST_BIN, which `npm test`
// builds from this checkout).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HELP_SELECTORS } from '../../src/cli/command-registry.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTES = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-routes.json'), 'utf8'));
const BINARY_NAME = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
const HOST_BIN = process.env.FGOS_HOST_BIN;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-help-routes-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function stubCargo() {
  const dir = path.join(scratch, 'cargo-stub');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
    fs.writeFileSync(
      path.join(dir, 'cargo'),
      `#!${process.execPath}\nimport fs from 'node:fs';\nimport path from 'node:path';\nconst out = path.join(process.env.CARGO_TARGET_DIR, 'debug');\nfs.mkdirSync(out, { recursive: true });\nfs.copyFileSync(process.env.HELP_TEST_HOST_BIN, path.join(out, ${JSON.stringify(BINARY_NAME)}));\nfs.chmodSync(path.join(out, ${JSON.stringify(BINARY_NAME)}), 0o755);\n`,
      { mode: 0o755 },
    );
  }
  return dir;
}

function host(args, cwd) {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  const env = { ...process.env };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH', 'FGOS_RUST_HOST_RECURSION_GUARD']) delete env[key];
  return spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts/run-rust-dev-host.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 60000,
    env: {
      ...env,
      INIT_CWD: cwd,
      PATH: `${stubCargo()}${path.delimiter}${process.env.PATH}`,
      CARGO_TARGET_DIR: path.join(scratch, 'cargo-out'),
      HELP_TEST_HOST_BIN: HOST_BIN,
    },
  });
}

function node(args, cwd) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  return spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), ...args], { cwd, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
}

function emptyCwd(name) {
  const dir = path.join(scratch, name);
  fs.mkdirSync(dir);
  return dir;
}

test('--help and -h are legacy-node routes generated next to the verb selectors', () => {
  for (const selector of HELP_SELECTORS) {
    assert.equal(ROUTES[selector]?.route_kind, 'legacy-cli', selector);
    assert.equal(ROUTES[selector].legacy_payload, 'legacy-node', selector);
  }
});

test('fgos --help --json through the host is the whole manifest, byte-identical to the Node payload', () => {
  const cwd = emptyCwd('top-level');
  const expected = node(['--help', '--json'], cwd).stdout;
  assert.ok(expected.length > 64 * 1024, `manifest unexpectedly small (${expected.length} bytes): the truncation check needs a large one`);
  for (const door of ['--help', '-h']) {
    const result = host([door, '--json'], cwd);
    assert.equal(result.status, 0, `${door}: ${result.stderr}`);
    assert.equal(result.stdout, expected, `${door} --json through the host differs from the Node payload (${result.stdout.length} vs ${expected.length} bytes)`);
    assert.ok(JSON.parse(result.stdout).commands.length > 0);
  }
  const text = host(['--help'], cwd);
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stdout, node(['--help'], cwd).stdout);
  assert.deepEqual(fs.readdirSync(cwd), [], 'help wrote into the working directory');
});

test('an unlisted leading option still fails closed in the host (R3), and refused help exits 4', () => {
  const cwd = emptyCwd('refusals');
  const madeUp = host(['--made-up', 'version'], cwd);
  assert.equal(madeUp.status, 4, madeUp.stdout);
  assert.match(madeUp.stderr, /unknown verb "--made-up"/);
  for (const args of [['-h', 'foo'], ['--help', '--bogus'], ['--help', 'dispatch', 'bogus', '--json']]) {
    const result = host(args, cwd);
    assert.equal(result.status, 4, `${args.join(' ')}: ${result.stdout}`);
    assert.equal(result.stdout, '', args.join(' '));
  }
});

test('fgos <verb> --help --json through the host returns the manifest entry for every route kind, without running the verb', () => {
  const cwd = emptyCwd('per-verb');
  const manifest = JSON.parse(node(['--help', '--json'], cwd).stdout);
  const entryOf = (name) => manifest.commands.find((c) => c.name === name);
  const native = Object.values(ROUTES).filter((r) => r.route_kind === 'native').map((r) => r.selector);
  assert.ok(native.length >= 5, `expected the native routes, got ${native}`);
  const cases = [
    ...native.map((name) => ({ args: [name, '--help', '--json'], expected: entryOf(name) })),
    ...native.map((name) => ({ args: [name, '-h', '--json'], expected: entryOf(name) })),
    { args: ['metrics', 'runs', '--help', '--json'], expected: { ...entryOf('metrics'), subcommands: { runs: entryOf('metrics').subcommands.runs } } },
    { args: ['convention', 'name', '--kind', 'report', '--help', '--json'], expected: { ...entryOf('convention'), subcommands: { name: entryOf('convention').subcommands.name } } },
    { args: ['add', '--help', '--json'], expected: entryOf('add') },
    { args: ['init', '-h', '--json'], expected: entryOf('init') },
    { args: ['run', 'do it', '--writes', 'a.txt', '--help', '--json'], expected: entryOf('run') },
    { args: ['dispatch', 'decide', '--help', '--json'], expected: { ...entryOf('dispatch'), subcommands: { decide: entryOf('dispatch').subcommands.decide } } },
    { args: ['workflow', 'start', '--help', '--json'], expected: { ...entryOf('workflow'), subcommands: { start: entryOf('workflow').subcommands.start } } },
  ];
  for (const { args, expected } of cases) {
    assert.ok(expected, `no manifest entry for ${args[0]}`);
    const result = host(args, cwd);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), expected, args.join(' '));
  }
  assert.deepEqual(fs.readdirSync(cwd), [], 'help wrote into the working directory');
});

test('a native verb with sub-verbs refuses an unknown sub-verb the same way with or without --help', () => {
  const cwd = emptyCwd('native-unknown-sub');
  const plain = host(['metrics', 'bogus'], cwd);
  assert.equal(plain.status, 4, plain.stdout);
  const text = host(['metrics', '--help'], cwd);
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stdout, node(['metrics', '--help'], cwd).stdout);
});
