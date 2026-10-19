// Every verb rejects a flag its registry entry does not declare (exit 4, the
// usage-error code) and accepts every declared flag plus the global ones. The
// registry is the only list: this test is driven by it, so a new verb or flag
// is covered the moment it is declared.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { GLOBAL_FLAGS, acceptedFlags, unknownFlagMessage } from '../../src/cli/flag-check.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FGOS = path.join(REPO_ROOT, 'bin/fgos.mjs');
const BOGUS = 'no-such-flag-xyz';

// `hook` forwards its raw argv to a guard script, never through the flag parser.
const LEGACY = COMMAND_REGISTRY.filter((e) => !e.nativeOnly && e.name !== 'hook');
const NATIVE_ROUTES = Object.values(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-routes.json'), 'utf8')))
  .filter((r) => r.route_kind === 'native');

function parseLike(names) {
  return Object.fromEntries(names.map((n) => [n, true]));
}

function invocations(entry) {
  return entry.subcommands ? Object.keys(entry.subcommands).map((sub) => [sub]) : [[]];
}

for (const entry of LEGACY) {
  test(`${entry.name}: accepts every declared flag and the global ones`, () => {
    for (const positional of invocations(entry)) {
      const accepted = acceptedFlags(entry, positional);
      for (const name of GLOBAL_FLAGS) assert.ok(accepted.has(name), `${entry.name}: --${name} must be accepted`);
      assert.equal(unknownFlagMessage(entry, parseLike([...accepted]), positional), null);
    }
  });

  test(`${entry.name}: rejects an undeclared flag with exit 4 naming the flag`, () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-unknown-flag-'));
    for (const positional of invocations(entry)) {
      const result = spawnSync(process.execPath, [FGOS, entry.name, ...positional, `--${BOGUS}`, 'x'], { cwd, encoding: 'utf8' });
      assert.equal(result.status, 4, `${entry.name} ${positional.join(' ')}: ${result.stderr}`);
      assert.match(result.stderr, new RegExp(`unknown flag "--${BOGUS}" for "fgos ${entry.name}`));
      assert.match(result.stderr, /--help/);
    }
  });
}

test('--dir, the flag the fgos shell function appends to every call, is accepted by every verb', () => {
  for (const entry of COMMAND_REGISTRY) {
    for (const positional of invocations(entry)) {
      assert.ok(acceptedFlags(entry, positional).has('dir'), `${entry.name} ${positional.join(' ')}`);
    }
  }
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dir-flag-'));
  const result = spawnSync(process.execPath, [FGOS, 'version', '--dir', cwd], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('--name=value is refused with a pointer to the space form', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-equals-flag-'));
  const result = spawnSync(process.execPath, [FGOS, 'ready', '--phase=2'], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown flag "--phase=2"/);
  assert.match(result.stderr, /--phase <value>/);
});

test('every native route carries the registry projection of its flags', () => {
  assert.ok(NATIVE_ROUTES.length > 0);
  for (const route of NATIVE_ROUTES) {
    const entry = COMMAND_REGISTRY.find((e) => e.name === route.selector);
    if (entry.subcommands) {
      for (const sub of Object.keys(entry.subcommands)) {
        assert.deepEqual(route.subcommand_flags[sub], [...acceptedFlags(entry, [sub])].sort(), `${route.selector} ${sub}`);
      }
    } else {
      assert.deepEqual(route.accepted_flags, [...acceptedFlags(entry)].sort(), route.selector);
    }
  }
});

const HOST = process.env.FGOS_HOST_BIN;
test('the Rust host rejects an undeclared flag on every native verb and accepts --dir', { skip: !HOST || !fs.existsSync(HOST) }, () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-native-flag-'));
  for (const route of NATIVE_ROUTES) {
    const entry = COMMAND_REGISTRY.find((e) => e.name === route.selector);
    const subs = entry.subcommands ? Object.keys(entry.subcommands) : [null];
    for (const sub of subs) {
      const args = [route.selector, ...(sub ? [sub] : []), `--${BOGUS}`];
      const result = spawnSync(HOST, args, { cwd, encoding: 'utf8', input: '' });
      assert.equal(result.status, 4, `${args.join(' ')}: ${result.stderr}`);
      assert.match(result.stderr, new RegExp(`unknown flag "--${BOGUS}"`));
    }
  }
  const ok = spawnSync(HOST, ['version', '--dir', cwd, '--json'], { cwd, encoding: 'utf8', input: '' });
  assert.equal(ok.status, 0, ok.stderr);
});
