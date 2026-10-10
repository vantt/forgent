// A confined agent that gets a private home (CODEX_HOME / HOME) reads its trust store from there, and
// that home starts without the operator's trust decisions. The entry is therefore written into the
// private store -- derived from a root the person already trusted in the real account store -- and the
// real store is never edited. Everything here runs against fixture files.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  seedCodexTrust, readCodexTrust, seedAgyTrust, readAgyTrust, removeCodexTrust, TrustStoreError,
  codexHookTrustHash, seedCodexHookTrust,
} from '../../src/runner/dispatch/trust-store.mjs';
import { trustRoots, trustStorePaths, seedWorkspaceTrust } from '../../src/runner/dispatch/herdr-round.mjs';

const dirs = [];
const tmp = (prefix) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};
after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });

const ROOT = '/home/someone/projects/repo';
const WORKSPACE = '/var/tmp/some-worktree';
const trustedToml = `model = "x"\n\n[projects."${ROOT}"]\ntrust_level = "trusted"\n`;

test('codex: the entry goes to the private config, created when absent, while the root is vouched for by the real config', () => {
  const real = path.join(tmp('fgos-codex-real-'), 'config.toml');
  fs.writeFileSync(real, trustedToml);
  const privateConfig = path.join(tmp('fgos-codex-private-'), 'home', 'config.toml');

  assert.equal(seedCodexTrust(privateConfig, { projectPath: WORKSPACE, repoRoot: ROOT, rootConfigPath: real }), true);

  assert.equal(readCodexTrust(privateConfig, WORKSPACE), true);
  assert.equal(fs.readFileSync(real, 'utf8'), trustedToml, 'the real account config is not edited');
  assert.equal(readCodexTrust(privateConfig, ROOT), null, 'only the workspace is trusted, not the root it was derived from');
});

test('codex: a root the person never trusted in the real config derives nothing, whatever the private config says', () => {
  const real = path.join(tmp('fgos-codex-real-'), 'config.toml');
  fs.writeFileSync(real, 'model = "x"\n');
  const privateConfig = path.join(tmp('fgos-codex-private-'), 'config.toml');
  fs.writeFileSync(privateConfig, trustedToml);

  assert.throws(
    () => seedCodexTrust(privateConfig, { projectPath: WORKSPACE, repoRoot: ROOT, rootConfigPath: real }),
    (err) => err instanceof TrustStoreError && err.code === 'untrusted-root',
  );
  assert.equal(readCodexTrust(privateConfig, WORKSPACE), null);
});

test('codex: without a separate root config the behaviour is unchanged (same file reads and writes)', () => {
  const config = path.join(tmp('fgos-codex-same-'), 'config.toml');
  fs.writeFileSync(config, trustedToml);
  assert.equal(seedCodexTrust(config, { projectPath: WORKSPACE, repoRoot: ROOT }), true);
  assert.equal(seedCodexTrust(config, { projectPath: WORKSPACE, repoRoot: ROOT }), false, 'seeding twice changes nothing');
  assert.equal(removeCodexTrust(config, WORKSPACE), true);
  assert.equal(readCodexTrust(config, WORKSPACE), null);
  // A missing store is still an error here: nothing is trusted anywhere.
  assert.throws(() => seedCodexTrust(path.join(tmp('fgos-codex-none-'), 'config.toml'), { projectPath: WORKSPACE, repoRoot: ROOT }), TrustStoreError);
});

test('agy: the workspace is trusted in the private settings, derived from the real settings, which stay as they were', () => {
  const real = path.join(tmp('fgos-agy-real-'), 'settings.json');
  const realBody = `${JSON.stringify({ trustedWorkspaces: [ROOT] }, null, 2)}\n`;
  fs.writeFileSync(real, realBody);
  const privateSettings = path.join(tmp('fgos-agy-private-'), 'settings.json');
  fs.writeFileSync(privateSettings, `${JSON.stringify({ model: 'm' }, null, 2)}\n`);

  assert.equal(seedAgyTrust(privateSettings, { projectPath: WORKSPACE, repoRoot: ROOT, rootSettingsPath: real }), true);
  assert.equal(readAgyTrust(privateSettings, WORKSPACE), true);
  assert.equal(JSON.parse(fs.readFileSync(privateSettings, 'utf8')).model, 'm', 'the rest of the private settings is kept');
  assert.equal(fs.readFileSync(real, 'utf8'), realBody);

  const untrusted = path.join(tmp('fgos-agy-untrusted-'), 'settings.json');
  fs.writeFileSync(untrusted, `${JSON.stringify({ trustedWorkspaces: [] })}\n`);
  assert.throws(
    () => seedAgyTrust(privateSettings, { projectPath: '/var/tmp/other', repoRoot: ROOT, rootSettingsPath: untrusted }),
    (err) => err instanceof TrustStoreError && err.code === 'untrusted-root',
  );
});

test('trust is read from the real store and written to the private one only when the worker has its own home', () => {
  const codex = { kind: 'codex-toml' };
  const shared = trustStorePaths({ trustStore: codex, fullEnv: { CODEX_HOME: '/real/codex' }, workerEnv: null });
  assert.deepEqual(shared, { root: '/real/codex/config.toml', target: '/real/codex/config.toml' });
  const sameHome = trustStorePaths({ trustStore: codex, fullEnv: { CODEX_HOME: '/real/codex' }, workerEnv: { CODEX_HOME: '/real/codex' } });
  assert.equal(sameHome.target, '/real/codex/config.toml');
  const own = trustStorePaths({ trustStore: codex, fullEnv: { CODEX_HOME: '/real/codex' }, workerEnv: { CODEX_HOME: '/tmp/private/home' } });
  assert.deepEqual(own, { root: '/real/codex/config.toml', target: '/tmp/private/home/config.toml' });

  const agy = { kind: 'agy' };
  const agyOwn = trustStorePaths({ trustStore: agy, fullEnv: { HOME: '/real/agy' }, workerEnv: { HOME: '/tmp/private/home' } });
  assert.equal(agyOwn.root, '/real/agy/.gemini/antigravity-cli/settings.json');
  assert.equal(agyOwn.target, '/tmp/private/home/.gemini/antigravity-cli/settings.json');

  const pinned = trustStorePaths({ trustStore: { kind: 'codex-toml', path: '/pinned/config.toml' }, fullEnv: {}, workerEnv: { CODEX_HOME: '/tmp/private/home' } });
  assert.equal(pinned.root, '/pinned/config.toml', 'a declared store path is where the decision was made');
});

test('a linked worktree may derive its trust from the main checkout that owns it', () => {
  const main = fs.realpathSync(tmp('fgos-trust-main-'));
  const git = (args, cwd = main) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'T']);
  git(['config', 'user.email', 't@t.local']);
  fs.writeFileSync(path.join(main, 'f.txt'), 'x');
  git(['add', 'f.txt']);
  git(['commit', '-m', 'init']);
  const worktree = path.join(tmp('fgos-trust-wt-'), 'wt');
  git(['worktree', 'add', '--detach', worktree]);
  const store = '/some/other/store';

  assert.deepEqual(trustRoots(fs.realpathSync(worktree), store), [store, main]);
  assert.deepEqual(trustRoots(main, main), [main], 'a checkout that is its own root yields one candidate');
  const notGit = tmp('fgos-trust-nogit-');
  assert.deepEqual(trustRoots(notGit, store), [store], 'a directory outside any checkout has only the declared root');
});

// Hashes codex itself stored for the two hooks fgOS installs (copied from a real account config).
const DISPATCH_DECIDE = '.fgos/installation/bin/fgos hook dispatch-decide';
const DECISION_QUESTION = '.fgos/installation/bin/fgos hook decision-question';
const HOOKS_JSON = JSON.stringify({
  hooks: {
    PreToolUse: [
      { matcher: '.*', hooks: [{ type: 'command', command: DISPATCH_DECIDE }] },
      { matcher: 'RequestUserInput|ask.*', hooks: [{ type: 'command', command: DECISION_QUESTION }] },
    ],
  },
});

test('codex hooks: the trust hash is the one codex stores for the same hook', () => {
  assert.equal(
    codexHookTrustHash('pre_tool_use', '.*', { command: DISPATCH_DECIDE }),
    'sha256:1fc36c0dc7df159e3dec9de401733c5ad2a9c5d3099fc484f68369c36941389c',
  );
  assert.equal(
    codexHookTrustHash('pre_tool_use', 'RequestUserInput|ask.*', { command: DECISION_QUESTION }),
    'sha256:c63f37e29ab42cb29938cb131108f93cc2666ba31b6919872627261f9dd5de78',
  );
});

test('codex hooks: seeding writes one entry per hook into the private config, once', () => {
  const project = tmp('fgos-codex-hooks-project-');
  fs.mkdirSync(path.join(project, '.codex'));
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const real = path.join(tmp('fgos-codex-real-'), 'config.toml');
  fs.writeFileSync(real, `[projects."${project}"]\ntrust_level = "trusted"\n`);
  const privateConfig = path.join(tmp('fgos-codex-private-'), 'config.toml');
  fs.writeFileSync(privateConfig, '[projects."/keep/me"]\ntrust_level = "trusted"\n');

  const { keys, skipped } = seedCodexHookTrust(privateConfig, { projectPath: project, repoRoot: project, rootConfigPath: real });

  assert.equal(skipped, 0);
  assert.deepEqual(keys, [
    `${project}/.codex/hooks.json:pre_tool_use:0:0`,
    `${project}/.codex/hooks.json:pre_tool_use:1:0`,
  ]);
  const body = fs.readFileSync(privateConfig, 'utf8');
  assert.ok(body.includes('trusted_hash = "sha256:1fc36c0dc7df159e3dec9de401733c5ad2a9c5d3099fc484f68369c36941389c"'));
  assert.deepEqual(seedCodexHookTrust(privateConfig, { projectPath: project, repoRoot: project, rootConfigPath: real }).keys, [], 'seeding twice writes nothing');

  assert.equal(fs.readFileSync(real, 'utf8'), `[projects."${project}"]\ntrust_level = "trusted"\n`, 'the real account config is not edited');
});

test('codex hooks: no hooks file seeds nothing, and an untrusted root derives nothing', () => {
  const project = tmp('fgos-codex-hooks-none-');
  const config = path.join(tmp('fgos-codex-private-'), 'config.toml');
  assert.deepEqual(seedCodexHookTrust(config, { projectPath: project, repoRoot: project, rootConfigPath: config }), { keys: [], skipped: 0 });

  fs.mkdirSync(path.join(project, '.codex'));
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  fs.writeFileSync(config, 'model = "x"\n');
  assert.throws(
    () => seedCodexHookTrust(config, { projectPath: project, repoRoot: project, rootConfigPath: config }),
    (err) => err instanceof TrustStoreError && err.code === 'untrusted-root',
  );
});

test('codex hooks: an entry codex wrote itself (indented) is recognised, so no duplicate table is appended', () => {
  const project = tmp('fgos-codex-hooks-existing-');
  fs.mkdirSync(path.join(project, '.codex'));
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const config = path.join(tmp('fgos-codex-private-'), 'config.toml');
  const own = `[projects."${project}"]\ntrust_level = "trusted"\n\n    [hooks.state."${project}/.codex/hooks.json:pre_tool_use:0:0"]\n      trusted_hash = "sha256:person"\n`;
  fs.writeFileSync(config, own);

  const { keys } = seedCodexHookTrust(config, { projectPath: project, repoRoot: project });

  assert.deepEqual(keys, [`${project}/.codex/hooks.json:pre_tool_use:1:0`], 'only the missing hook is added');
  assert.equal(fs.readFileSync(config, 'utf8').split('pre_tool_use:0:0').length, 2, 'the person\'s entry stays the only one for its key');
});

test('codex hooks: a path with a quote or backslash is escaped so the config stays valid TOML', () => {
  const project = tmp('fgos-codex-hooks-esc-') + '/we"ird\\dir';
  fs.mkdirSync(path.join(project, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const config = path.join(tmp('fgos-codex-private-'), 'config.toml');
  const root = tmp('fgos-codex-hooks-root-');
  fs.writeFileSync(config, `[projects."${root}"]\ntrust_level = "trusted"\n`);

  seedCodexHookTrust(config, { projectPath: project, repoRoot: root });

  assert.match(fs.readFileSync(config, 'utf8'), /\[hooks\.state\."[^\n]*we\\"ird\\\\dir[^\n]*"\]/);
});

test('codex hooks: a control character in the path is escaped so the header stays one line', () => {
  const project = tmp('fgos-codex-hooks-ctl-') + '/line\nbreak';
  fs.mkdirSync(path.join(project, '.codex'), { recursive: true });
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const root = tmp('fgos-codex-hooks-root-');
  const config = path.join(tmp('fgos-codex-private-'), 'config.toml');
  fs.writeFileSync(config, `[projects."${root}"]\ntrust_level = "trusted"\n`);

  seedCodexHookTrust(config, { projectPath: project, repoRoot: root });

  const header = fs.readFileSync(config, 'utf8').split('\n').find((line) => line.startsWith('[hooks.state.'));
  assert.ok(header.includes('line\\nbreak'), 'the newline is written as an escape sequence');
});

test('codex hooks: a key present in dotted form is not given a second table', () => {
  const project = tmp('fgos-codex-hooks-dotted-');
  fs.mkdirSync(path.join(project, '.codex'));
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const config = path.join(tmp('fgos-codex-private-'), 'config.toml');
  fs.writeFileSync(config, `[projects."${project}"]\ntrust_level = "trusted"\n\n[hooks.state]\n"${project}/.codex/hooks.json:pre_tool_use:0:0" = { trusted_hash = "sha256:person" }\n`);

  const { keys } = seedCodexHookTrust(config, { projectPath: project, repoRoot: project });

  assert.deepEqual(keys, [`${project}/.codex/hooks.json:pre_tool_use:1:0`]);
});

test('codex hooks: hook trust goes only to a private home, never into the account config the worker would share', () => {
  const project = tmp('fgos-codex-hooks-wire-');
  fs.mkdirSync(path.join(project, '.codex'));
  fs.writeFileSync(path.join(project, '.codex', 'hooks.json'), HOOKS_JSON);
  const realHome = tmp('fgos-codex-real-home-');
  const realConfig = path.join(realHome, 'config.toml');
  const realBody = `[projects."${project}"]\ntrust_level = "trusted"\n`;
  fs.writeFileSync(realConfig, realBody);
  const trustStore = { kind: 'codex-toml' };
  const notes = [];
  const round = { trustWritten: false, note: (patch) => notes.push(patch) };

  seedWorkspaceTrust({ trustStore, round, cwd: project, repoRoot: project, fullEnv: { CODEX_HOME: realHome }, workerEnv: null });
  assert.equal(fs.readFileSync(realConfig, 'utf8'), realBody, 'no private home: the real config is left as it was');
  assert.ok(!notes.some((n) => n.hookTrustSeeded), 'nothing is reported as seeded');

  const privateHome = tmp('fgos-codex-private-home-');
  seedWorkspaceTrust({ trustStore, round, cwd: project, repoRoot: project, fullEnv: { CODEX_HOME: realHome }, workerEnv: { CODEX_HOME: privateHome } });
  assert.equal(fs.readFileSync(realConfig, 'utf8'), realBody, 'the real config is still untouched');
  assert.match(fs.readFileSync(path.join(privateHome, 'config.toml'), 'utf8'), /\[hooks\.state\./);
  assert.ok(notes.some((n) => n.hookTrustSeeded === 2));
});
