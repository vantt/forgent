// The help door through the real Rust host: an agent in a project with no
// bin/ only has the installed `fgos`, so `fgos --help --json` and
// `fgos <verb> --help --json` must work through the host for every route
// kind, never run the verb, and keep R3 (an unlisted selector fails closed).
// The host's help renderer is proven by the unit tests of apps/fgos/src/help.rs;
// this file proves the door: the installed binary, the bytes of the committed
// manifest, no side effects, and the Node channel's hand-over to the host.
// The cases run the installed door itself: one release staged from this
// checkout per file (real manifest, real host, real Node payload), whose
// `bin/fgos` finds its own manifest. One case also goes through the `fgos:dev`
// door (scripts/run-rust-dev-host.mjs), which stages a release per call; there
// only Cargo is substituted, by a stub that installs the already-built host
// binary (FGOS_HOST_BIN, which `npm test` builds from this checkout) and the
// real native addon the door also builds.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildRustDistribution, nativeAddonLibraryName } from '../../scripts/build-rust-distribution.mjs';
import { ensureGitAddon } from '../helpers/git-addon.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTES = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-routes.json'), 'utf8'));
const MANIFEST_BYTES = fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-manifest.json'), 'utf8');
const MANIFEST = JSON.parse(MANIFEST_BYTES);
const BINARY_NAME = process.platform === 'win32' ? 'fgos.exe' : 'fgos';
const HOST_BIN = process.env.FGOS_HOST_BIN;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-help-routes-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
const release = path.join(scratch, 'release');
before(() => buildRustDistribution({ outDir: release, repoRoot: REPO_ROOT }));

function stubCargo() {
  const dir = path.join(scratch, 'cargo-stub');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
    fs.writeFileSync(
      path.join(dir, 'cargo'),
      `#!${process.execPath}\nimport fs from 'node:fs';\nimport path from 'node:path';\nconst out = path.join(process.env.CARGO_TARGET_DIR, 'debug');\nfs.mkdirSync(out, { recursive: true });\nfs.copyFileSync(process.env.HELP_TEST_HOST_BIN, path.join(out, ${JSON.stringify(BINARY_NAME)}));\nfs.chmodSync(path.join(out, ${JSON.stringify(BINARY_NAME)}), 0o755);\nfs.copyFileSync(process.env.HELP_TEST_NATIVE_ADDON, path.join(out, ${JSON.stringify(nativeAddonLibraryName())}));\n`,
      { mode: 0o755 },
    );
  }
  return dir;
}

let builtAddon;
const nativeAddon = () => (builtAddon ??= ensureGitAddon().addon);

/** The installed `fgos` of the staged release; it finds its own manifest. */
function host(args, cwd) {
  const env = { ...process.env };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH', 'FGOS_RUST_HOST_RECURSION_GUARD']) delete env[key];
  return spawnSync(path.join(release, 'bin', BINARY_NAME), args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, env });
}

/** The `fgos:dev` door: stages a release from this checkout for each call. */
function devDoor(args, cwd) {
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
      HELP_TEST_NATIVE_ADDON: nativeAddon(),
    },
  });
}

/** The direct-node channel, which only hands help to the host `hostBin` names (none when it is null). */
function node(args, cwd, hostBin, extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH', 'FGOS_ACTIVE_MANIFEST_PATH']) delete env[key];
  if (hostBin) env.FGOS_HOST_BIN = hostBin;
  return spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), ...args], { cwd, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
}

const installedHost = () => path.join(release, 'bin', BINARY_NAME);

function emptyCwd(name) {
  const dir = path.join(scratch, name);
  fs.mkdirSync(dir);
  return dir;
}

test('fgos --help --json through the host is the whole manifest, byte-identical to the generated manifest file', () => {
  const cwd = emptyCwd('top-level');
  assert.ok(MANIFEST_BYTES.length > 64 * 1024, `manifest unexpectedly small (${MANIFEST_BYTES.length} bytes): the truncation check needs a large one`);
  for (const [door, run] of [['--help', devDoor], ['--help', host], ['-h', host]]) {
    const result = run([door, '--json'], cwd);
    assert.equal(result.status, 0, `${door}: ${result.stderr}`);
    assert.equal(result.stdout, MANIFEST_BYTES, `${door} --json through the host differs from the manifest file (${result.stdout.length} vs ${MANIFEST_BYTES.length} bytes)`);
    assert.ok(JSON.parse(result.stdout).commands.length > 0);
  }
  const text = host(['--help'], cwd);
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stderr, '');
  assert.ok(text.stdout.startsWith('fgos — the fgOS work-item CLI'), text.stdout.slice(0, 80));
  for (const args of [['-h'], ['-h', '--json']]) {
    const short = host(args, cwd);
    assert.equal(short.stdout, host(args.map((a) => (a === '-h' ? '--help' : a)), cwd).stdout, `${args.join(' ')} differs from its --help form`);
  }
  assert.equal(host(['add', '-h'], cwd).stdout, host(['add', '--help'], cwd).stdout, 'a verb answers -h as --help');
  assert.deepEqual(fs.readdirSync(cwd), [], 'help wrote into the working directory');
});

test('an unlisted leading option still fails closed in the host (R3), and refused help exits 4 with nothing on stdout', () => {
  const cwd = emptyCwd('refusals');
  const madeUp = host(['--made-up', 'version'], cwd);
  assert.equal(madeUp.status, 4, madeUp.stdout);
  assert.match(madeUp.stderr, /unknown verb "--made-up"/);
  const unknownVerb = host(['bogus-verb-probe', '--help'], cwd);
  assert.equal(unknownVerb.status, 4);
  assert.equal(unknownVerb.stderr, `fgos: unknown verb "bogus-verb-probe". Usage: fgos <${MANIFEST.commands.map((c) => c.name).join('|')}> ...\n`);
  assert.equal(unknownVerb.stdout, '');
  for (const args of [
    ['-h', 'foo'],
    ['--help', 'foo', '--json'],
    ['--help', '--bogus'],
    ['-h', '--json', '--bogus'],
    ['--help', 'add', 'submit'],
    ['--help', 'dispatch', 'bogus', '--json'],
  ]) {
    const result = host(args, cwd);
    assert.equal(result.status, 4, `${args.join(' ')}: ${result.stdout}`);
    assert.equal(result.stdout, '', args.join(' '));
    assert.match(result.stderr, /^fgos: /, args.join(' '));
  }
  const unknownSub = host(['dispatch', 'bogus', '--help', '--json'], cwd);
  assert.equal(unknownSub.status, 4, unknownSub.stdout);
  assert.equal(unknownSub.stdout, '');
  assert.match(unknownSub.stderr, /unknown dispatch sub-verb "bogus"/);
  assert.match(unknownSub.stderr, /decide/);
});

test('fgos <verb> --help --json through the host returns the manifest entry for every route selector, without running the verb', () => {
  const cwd = emptyCwd('per-verb');
  const entryOf = (name) => MANIFEST.commands.find((c) => c.name === name);
  const selectors = Object.keys(ROUTES);
  const native = Object.values(ROUTES).filter((r) => r.route_kind === 'native').map((r) => r.selector);
  assert.ok(native.length >= 5, `expected the native routes, got ${native}`);
  assert.equal(selectors.length, MANIFEST.commands.length, 'the route table and the manifest name the same verbs');
  const cases = [
    ...selectors.flatMap((name) => [
      { args: [name, '--help', '--json'], expected: entryOf(name) },
      { args: [name, '-h', '--json'], expected: entryOf(name) },
      { args: ['--help', name, '--json'], expected: entryOf(name) },
    ]),
    { args: ['metrics', 'runs', '--help', '--json'], expected: { ...entryOf('metrics'), subcommands: { runs: entryOf('metrics').subcommands.runs } } },
    { args: ['convention', 'name', '--kind', 'report', '--help', '--json'], expected: { ...entryOf('convention'), subcommands: { name: entryOf('convention').subcommands.name } } },
    { args: ['run', 'do it', '--writes', 'a.txt', '--help', '--json'], expected: entryOf('run') },
    { args: ['dispatch', 'decide', '--help', '--json'], expected: { ...entryOf('dispatch'), subcommands: { decide: entryOf('dispatch').subcommands.decide } } },
    { args: ['workflow', 'start', '--help', '--json'], expected: { ...entryOf('workflow'), subcommands: { start: entryOf('workflow').subcommands.start } } },
    { args: ['workflow', 'start', 'delphi', '--help', '--json'], expected: { ...entryOf('workflow'), subcommands: { start: entryOf('workflow').subcommands.start } } },
    // an exact help token is help even where it would be a flag's value
    { args: ['metrics', 'coverage', '--by', '-h', '--json'], expected: { ...entryOf('metrics'), subcommands: { coverage: entryOf('metrics').subcommands.coverage } } },
    { args: ['version', '--x', '-h', '--json'], expected: entryOf('version') },
    { args: ['add', '--title', '--help', '--json'], expected: entryOf('add') },
  ];
  for (const { args, expected } of cases) {
    assert.ok(expected, `no manifest entry for ${args[0]}`);
    const result = host(args, cwd);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), expected, args.join(' '));
  }
  assert.deepEqual(fs.readdirSync(cwd), [], 'help wrote into the working directory');
});

test('help never runs the verb: write and spawn forms, and a help token after a value-taking flag, leave the directory untouched', () => {
  const cwd = emptyCwd('never-runs');
  for (const args of [
    ['init', '--help', '--json'],
    ['init', '-h'],
    ['session', 'start', '--help', '--json'],
    ['gateway', 'start', '-h'],
    ['run', 'do something', '--writes', 'x.txt', '--help', '--json'],
    ['merge', 'next', '--help'],
    ['init', '--json', '-h'],
    ['init', '--foo', '-h'],
    ['init', '--', '-h'],
    ['init', '--dir', '-h'],
    ['session', 'start', '--json', '-h'],
    ['dispatch', 'decide', '--help', '-h'],
  ]) {
    const result = host(args, cwd);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.doesNotMatch(result.stdout, /"contract":\s*"fgos\.v1"/, `${args.join(' ')} returned an envelope`);
    assert.ok(result.stdout.includes('fgos '), args.join(' '));
  }
  assert.deepEqual(fs.readdirSync(cwd), [], 'help wrote into the working directory (init made no .fgos store)');
});

// The `fgos` shell function (scripts/fgos-shell-integration.sh) appends `--dir <root>` to every call that lacks
// one, and `fgos doctor` probes the shell setup with exactly `fgos --help` through it.
test('help accepts the --dir the shell function appends, through the real shell function', { skip: process.platform === 'win32' }, () => {
  const cwd = emptyCwd('shell-function');
  const entryOf = (name) => MANIFEST.commands.find((c) => c.name === name);
  for (const args of [['--help', '--json', '--dir', cwd], ['-h', '--json', `--dir=${cwd}`], ['--help', 'add', '--json', '--dir', cwd]]) {
    const result = host(args, cwd);
    assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), args.includes('add') ? entryOf('add') : MANIFEST, args.join(' '));
  }
  spawnSync('git', ['init', '-q'], { cwd });
  fs.mkdirSync(path.join(cwd, 'bin'));
  fs.symlinkSync(path.join(REPO_ROOT, 'bin/fgos.mjs'), path.join(cwd, 'bin', 'fgos.mjs'));
  const integration = path.join(REPO_ROOT, 'scripts/fgos-shell-integration.sh');
  const env = { ...process.env, FGOS_HOST_BIN: installedHost() };
  delete env.CLAUDE_CODE_SESSION_ID;
  for (const line of ['fgos --help', 'fgos --help --json', 'fgos -h dispatch --json']) {
    const result = spawnSync('bash', ['-c', `source "${integration}" && ${line}`], { cwd, encoding: 'utf8', env });
    assert.equal(result.status, 0, `${line}: ${result.stderr}`);
    assert.ok(result.stdout.length > 0, line);
  }
});

test('a native verb with sub-verbs refuses an unknown sub-verb the same way with or without --help', () => {
  const cwd = emptyCwd('native-unknown-sub');
  const plain = host(['metrics', 'bogus'], cwd);
  assert.equal(plain.status, 4, plain.stdout);
  const text = host(['metrics', '--help'], cwd);
  assert.equal(text.status, 0, text.stderr);
  assert.ok(text.stdout.includes('fgos metrics'), text.stdout.slice(0, 120));
});

test('the direct-node channel hands every help form to the host unchanged, and says where to look when there is none', { skip: process.platform === 'win32' }, () => {
  const cwd = emptyCwd('forwarder');
  // Same bytes and exit code as the host for the forms a person or script types.
  for (const args of [['--help', '--json'], ['-h'], ['dispatch', 'decide', '--help', '--json'], ['add', '-h'], ['--help', 'foo'], ['hook', 'mailbox', '--help']]) {
    const viaNode = node(args, cwd, installedHost(), { FGOS_RUST_HOST_RECURSION_GUARD: '1' });
    const direct = host(args, cwd);
    assert.equal(viaNode.stdout, direct.stdout, args.join(' '));
    assert.equal(viaNode.stderr, direct.stderr, args.join(' '));
    assert.equal(viaNode.status, direct.status, args.join(' '));
  }
  assert.equal(node(['--help', '--json'], cwd, installedHost()).stdout, MANIFEST_BYTES);
  // The child gets the same argv, the host's exit code and the whole environment, the recursion guard of a
  // host that started this process included: a host too old to answer help forwards it back to Node, and the
  // kept guard is what makes it refuse the second hop instead of starting Node again without end.
  const stub = path.join(scratch, 'stub-host');
  fs.writeFileSync(stub, '#!/bin/sh\necho "guard=${FGOS_RUST_HOST_RECURSION_GUARD-unset} args=$*"\nexit 7\n', { mode: 0o755 });
  const forwarded = node(['config', '--title', '-h', '--json'], cwd, stub, { FGOS_RUST_HOST_RECURSION_GUARD: '1' });
  assert.equal(forwarded.status, 7);
  assert.equal(forwarded.stdout, 'guard=1 args=config --title -h --json\n');
  // Without a host it renders nothing and points at the installed fgos and the dev door.
  const none = node(['--help'], cwd, null);
  assert.equal(none.status, 4, none.stdout);
  assert.equal(none.stdout, '');
  assert.equal(none.stderr.trim().split('\n').length, 1, none.stderr);
  assert.match(none.stderr, /installed `fgos`/);
  assert.match(none.stderr, /npm run fgos:dev -- <verb> --help/);
});

// The older-host case: a host that forwards help to Node (as the release installed before the host answered help
// itself does) must not start a Node/host cycle. The stub is such a host; it counts its runs and caps them itself.
test('a host that forwards help back to Node is refused on the second hop, not looped', { skip: process.platform === 'win32' }, () => {
  const cwd = emptyCwd('older-host');
  const counter = path.join(scratch, 'older-host-runs');
  const stub = path.join(scratch, 'older-host-stub');
  fs.writeFileSync(
    stub,
    `#!/bin/sh
echo run >> "${counter}"
if [ "$(wc -l < "${counter}")" -gt 5 ]; then echo "stub: run cap reached" >&2; exit 99; fi
if [ -n "\${FGOS_RUST_HOST_RECURSION_GUARD-}" ]; then echo "stub: recursion guard triggered" >&2; exit 1; fi
FGOS_RUST_HOST_RECURSION_GUARD=1 FGOS_HOST_BIN="$0" exec "${process.execPath}" "${path.join(REPO_ROOT, 'bin/fgos.mjs')}" "$@"
`,
    { mode: 0o755 },
  );
  const env = { ...process.env, FGOS_HOST_BIN: stub };
  for (const key of ['CLAUDE_CODE_SESSION_ID', 'FGOS_RUST_HOST_RECURSION_GUARD']) delete env[key];
  const result = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), '--help'], { cwd, encoding: 'utf8', env, timeout: 30000 });
  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /recursion guard triggered/);
  assert.equal(fs.readFileSync(counter, 'utf8').trim().split('\n').length, 2, 'the stub ran exactly twice');
});
