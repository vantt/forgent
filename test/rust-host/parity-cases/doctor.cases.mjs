// Doctor parity table: every `fgos doctor` call the base release answers, on a fresh world per entry (a project of
// each shape, its own HOME, TMPDIR and state root). The rows are compared one by one (id, status, passed, fix,
// message, detail) after the values that differ between two releases are replaced by tokens: the release root and
// host binary each entry runs from, the commit of the build, and where the state root came from. `--fix` cases
// also compare what the run left on disk, and a case that has no repair to run proves the host wrote nothing.
//
// `cwd`: `repo` (a project with its store), `sub` (a subdirectory), `fresh` (a repository with no fgOS setup at
// all), `outside` (a directory that is no repository), `linked` (a linked worktree of `repo`), `legacy` (a project
// whose config is still the legacy JSON file), `other` (a second project `--dir` can name), `mailbox` (a project that
// opted in to the mailbox), `timers` (opted in, with cross-machine mail and both timer schedules on), `badcfg` (a
// project whose config file cannot be read), `remote` (a project with a Git remote), `clone` (a clone of this
// repository).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { writeProjectConfig, writeRawGlobalConfig, writeRawLegacyGlobalConfig, writeRawLegacyProjectConfig, writeRawProjectConfig } from '../../helpers/config-fixture.mjs';

export const cases = [];

const call = (args, extra = {}) => ({ args: ['doctor', ...args], ...extra });
const add = (id, steps, extra = {}) => cases.push({ id: `doctor-${id}`, steps, ...extra });

// Reading.
add('plain', [call([])]);
add('json', [call(['--json'])]);
add('pretty', [call(['--pretty'])]);
add('pretty-with-json', [call(['--pretty', '--json'])]);
add('strict-plain', [call(['--strict'])]);
add('strict-and-json', [call(['--strict', '--json'])]);
add('strict-with-a-value-is-not-strict', [call(['--strict', 'yes'])]);
add('pretty-with-an-empty-value-is-json', [call(['--pretty', ''])]);
add('from-a-subdirectory', [call([], { cwd: 'sub' })]);
add('from-a-linked-worktree', [{ do: 'linkedWorktree' }, call([], { cwd: 'linked' })]);
add('fresh-repository-with-no-setup', [call([], { cwd: 'fresh' }), { do: 'storeAppeared', cwd: 'fresh' }]);
add('outside-any-repository', [call([], { cwd: 'outside' }), { do: 'storeAppeared', cwd: 'outside' }]);
add('legacy-config-project', [call([], { cwd: 'legacy' })]);
add('dir-names-another-project', [{ do: 'otherProject' }, call(['--dir', '$OTHER'])]);
add('dir-names-another-project-from-outside', [{ do: 'otherProject' }, call(['--dir', '$OTHER'], { cwd: 'outside' })]);
// Accepted change: Node spawned the identity rows from the named directory, so a directory that does not exist
// failed them with the spawn's ENOENT; the host reads the machine's identity without a child, and the machine id
// and key do not depend on the project directory, so those rows now answer what they judge.
const SPAWN_ARTEFACT_ROWS = ['identity-machine-id', 'identity-machine-key', 'identity-project-id'];
add('dir-that-does-not-exist', [call(['--dir', '/nonexistent/fgos-parity-project'])], { ignoreRows: SPAWN_ARTEFACT_ROWS });
add('dir-empty', [call(['--dir', ''])]);
add('dir-bare', [call(['--dir'])]);

// The Git and Event Store rows over the shapes of repository they judge.
add('git-remote-without-mapping', [{ do: 'remoteProject' }, call([], { cwd: 'remote' }), call(['--fix'], { cwd: 'remote' }), { do: 'gitConfig', cwd: 'remote' }], { disk: true });
add('git-obsolete-fetch-mapping', [{ do: 'remoteProject', obsolete: true }, call([], { cwd: 'remote' }), call(['--fix'], { cwd: 'remote' }), { do: 'gitConfig', cwd: 'remote' }, call([], { cwd: 'remote' })], { disk: true });
add('git-merge-in-progress-and-native-lock', [{ do: 'mergeAndLock' }, call([])]);
add('clone-of-this-repository', [{ do: 'cloneThisRepository' }, call([], { cwd: 'clone' })]);

// Writing: `--fix` runs every fix first and judges the rows after the repair.
add('fix', [call(['--fix'])], { disk: true });
add('fix-json', [call(['--fix', '--json'])], { disk: true });
add('fix-pretty', [call(['--fix', '--pretty'])], { disk: true });
add('fix-strict', [call(['--fix', '--strict'])], { disk: true });
add('fix-twice-is-idempotent', [call(['--fix']), call(['--fix']), call([])], { disk: true });
add('fix-in-a-legacy-config-project', [call(['--fix'], { cwd: 'legacy' }), call([], { cwd: 'legacy' })], { disk: true });
add('fix-in-a-fresh-repository', [call(['--fix'], { cwd: 'fresh' })], { disk: true });
add('fix-outside-any-repository', [call(['--fix'], { cwd: 'outside' })], { disk: true });
add('fix-from-a-linked-worktree', [{ do: 'linkedWorktree' }, call(['--fix'], { cwd: 'linked' })], { disk: true });
add('fix-with-a-value-still-fixes', [call(['--fix', 'yes'])], { disk: true });
add('fix-with-an-empty-value-does-not-fix', [call(['--fix', ''])], { disk: true });

// The holder-lock, mailbox and timer rows: a project that opted in, one with both timers asked for (the service
// manager is pointed at a bus that does not exist, so no timer is ever enabled on the machine that runs this), and
// one whose config is refused.
add('mailbox-opted-in', [call([], { cwd: 'mailbox' })]);
add('mailbox-opted-in-fix', [call(['--fix'], { cwd: 'mailbox' })], { disk: true });
add('timers-asked-for', [call([], { cwd: 'timers' })]);
add('timers-asked-for-fix', [call(['--fix'], { cwd: 'timers' }), call([], { cwd: 'timers' })], { disk: true });
add('timers-asked-for-fix-twice', [call(['--fix'], { cwd: 'timers' }), call(['--fix'], { cwd: 'timers' })], { disk: true });
add('refused-config-mailbox-and-timers', [call([], { cwd: 'badcfg' })]);
add('lock-directories-fixed-then-measured', [call(['--fix']), call([])], { disk: true });
add('lock-directory-made-too-open-is-tightened', [call(['--fix']), { do: 'openLockDirs' }, call(['--fix'])], { disk: true });
// The config, identity and observe rows: a broken file, a legacy file, a secret outside `private`, a machine with
// and without its id and key, OpenSSH missing from PATH, a project id, and the Observe store.
add('config-file-that-does-not-parse', [{ do: 'brokenProjectConfig' }, call([])]);
add('config-file-with-an-unknown-key', [{ do: 'unknownKeyProjectConfig' }, call([])]);
add('config-secret-outside-private', [{ do: 'strayGlobalFile' }, call([])]);
add('config-secret-outside-private-fixed', [{ do: 'strayGlobalFile' }, call(['--fix']), call([])], { disk: true });
add('config-global-file-readable-by-others', [{ do: 'looseGlobalConfig' }, call([])]);
add('config-global-file-readable-by-others-fixed', [{ do: 'looseGlobalConfig' }, call(['--fix']), call([])], { disk: true });
add('config-doc-drift-fixed', [{ do: 'driftedDocs' }, call([]), call(['--fix']), call([])], { disk: true });
add('config-redundant-value-fixed', [{ do: 'redundantValue' }, call([]), call(['--fix']), call([])], { disk: true });
add('config-legacy-global-token-kept-by-fix', [{ do: 'legacyGlobalToken' }, call(['--fix']), call([])], { disk: true });
add('identity-without-a-machine-id', [{ do: 'noMachineId' }, call([])]);
add('identity-without-a-machine-id-fixed', [{ do: 'noMachineId' }, call(['--fix']), call([])], { disk: true });
// Accepted change: the words of this refusal moved with the retirement of `setup`, which the base release's text
// told the person to run. Both rows that read the id say it; everything else about them (status, fix, exit) is
// still compared. Each side's text is pinned, not skipped.
const INVALID_ID_TEXT = {
  rows: ['identity-machine-id', 'identity-machine-key'],
  base: /^\S+ identity machine failed \(exit 65\): fgos: error: invalid machine id; run setup fix \[machine-id-unreadable\]$/,
  host: /^\S+ identity machine failed \(exit 65\): fgos: error: invalid machine id in <WORLD>\/state\/machine-id: correct it, or remove it and run fgos doctor --fix to mint a new one \(a new id is a new machine identity\) \[machine-id-unreadable\]$/,
};
add('identity-with-an-invalid-machine-id', [{ do: 'badMachineId' }, call([])], { acceptedText: INVALID_ID_TEXT });
add('identity-with-a-machine-key', [{ do: 'machineKey' }, call([])]);
add('identity-key-fix-never-replaces-a-key', [{ do: 'machineKey' }, call(['--fix']), call([])], { disk: true });
add('identity-without-ssh-keygen-on-path', [{ do: 'pathWithout', tools: ['ssh', 'ssh-keygen'] }, call([], { env: 'PATH_WITHOUT' })]);
add('identity-fix-without-ssh-keygen-on-path', [{ do: 'pathWithout', tools: ['ssh', 'ssh-keygen'] }, call(['--fix'], { env: 'PATH_WITHOUT' })], { disk: true });
add('identity-with-an-old-openssh', [{ do: 'fakeOpenssh', banner: 'OpenSSH_7.4p1, OpenSSL 1.0.2k' }, call([], { env: 'PATH_WITHOUT' })]);
add('identity-with-an-unreadable-openssh-version', [{ do: 'fakeOpenssh', banner: 'OpenSSH_for_Windows_9.5p2, LibreSSL 3.8.2' }, call([], { env: 'PATH_WITHOUT' })]);
add('identity-project-id-file-broken', [{ do: 'brokenProjectId' }, call([])]);
add('identity-outside-any-repository', [call([], { cwd: 'outside' })]);
add('identity-activation-record-without-a-host', [{ do: 'pendingActivation' }, call([])]);
add('observe-directory-present', [{ do: 'observeDir' }, call([])], { disk: true });
add('observe-friction-store-symlinked', [{ do: 'symlinkedFriction' }, call([])]);
add('observe-fresh-repository-writes-nothing', [call([], { cwd: 'fresh' }), { do: 'observeAppeared', cwd: 'fresh' }]);

// Refused calls: the flag text is the registry's, and the call writes nothing.
add('unknown-flag', [call(['--bogus'])], { disk: true });
add('unknown-flag-after-known', [call(['--fix', '--zeta', '--alpha'])], { disk: true });
add('flag-with-equals', [call(['--fix=1'])], { disk: true });
add('strict-with-equals', [call(['--strict=1'])], { disk: true });
add('dir-with-equals', [call(['--dir=/tmp'])], { disk: true });

const MACHINE_ID_SLUG = os.hostname().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;
const GIT_DIR = '.git';

function makeWorld() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p03par-')));
  const dirs = Object.fromEntries(['repo', 'home', 'tmp', 'state', 'fresh', 'outside', 'legacy', 'mailbox', 'timers', 'badcfg'].map((name) => [name, path.join(root, name)]));
  for (const dir of Object.values(dirs)) fs.mkdirSync(dir);
  fs.chmodSync(dirs.state, 0o700);
  fs.writeFileSync(path.join(dirs.state, 'machine-id'), 'parity-machine\n');
  initFixtureRepo(dirs.repo);
  fs.mkdirSync(path.join(dirs.repo, 'sub'));
  initFixtureRepo(dirs.mailbox);
  writeProjectConfig(dirs.mailbox, { mailbox: { enabled: true } });
  initFixtureRepo(dirs.timers);
  writeProjectConfig(dirs.timers, {
    mailbox: { enabled: true, crossMachine: { enabled: true } },
    eventStore: { remote: 'origin', sync: { intervalSec: 300 } },
    dispatch: { probeAccount: { intervalSec: 600 } },
  });
  // The project's installation shim is what a timer unit names, so with one the timer rows reach the unit files.
  const shim = path.join(dirs.timers, '.fgos', 'installation', 'bin', 'fgos');
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  initFixtureRepo(dirs.badcfg);
  writeRawProjectConfig(dirs.badcfg, 'mailbox: [unclosed\n');
  initFixtureRepo(dirs.legacy);
  writeRawLegacyProjectConfig(dirs.legacy, '{\n  "runner": { "generatedPaths": [] }\n}\n');
  const git = (...args) => execFileSync('git', ['-C', dirs.fresh, ...args], { stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.writeFileSync(path.join(dirs.fresh, 'seed.txt'), 'seed\n');
  git('add', 'seed.txt');
  git('commit', '-qm', 'seed');
  return { root, ...dirs };
}

function writeAt(dir, relative, text) {
  const file = path.join(dir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function writeTool(dir, name, body) {
  fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

/** A PATH directory holding the tools a doctor run needs but the named ones, so a row that asks for one finds it missing. */
function toolPath(world, without) {
  const dir = path.join(world.root, 'toolbin');
  fs.mkdirSync(dir, { recursive: true });
  for (const name of ['git', 'node', 'sh', 'env', 'bwrap', 'curl', 'ssh', 'ssh-keygen', 'sleep', 'uname', 'cat']) {
    if (without.includes(name)) continue;
    for (const base of (process.env.PATH ?? '').split(path.delimiter)) {
      const candidate = path.join(base, name);
      if (fs.existsSync(candidate)) { fs.symlinkSync(candidate, path.join(dir, name)); break; }
    }
  }
  return dir;
}

function act(world, step) {
  switch (step.do) {
    case 'linkedWorktree':
      world.linked = path.join(world.root, 'linked');
      execFileSync('git', ['-C', world.repo, 'worktree', 'add', '-q', '--detach', world.linked, 'HEAD'], { stdio: 'ignore' });
      return null;
    case 'otherProject':
      world.other = path.join(world.root, 'other');
      fs.mkdirSync(world.other);
      initFixtureRepo(world.other);
      return null;
    case 'openLockDirs':
      for (const dir of [path.join(world.repo, '.fgos', 'locks'), path.join(world.state, 'locks')]) fs.chmodSync(dir, 0o775);
      return null;
    case 'remoteProject': {
      world.remote = path.join(world.root, 'remote');
      fs.mkdirSync(world.remote);
      initFixtureRepo(world.remote);
      const bare = path.join(world.root, 'remote.git');
      execFileSync('git', ['init', '--bare', '-q', bare], { stdio: 'ignore' });
      const git = (...args) => execFileSync('git', ['-C', world.remote, ...args], { stdio: 'ignore' });
      git('remote', 'add', 'origin', bare);
      // The pre-wildcard legacy mapping breaks a plain fetch when the remote has no such ref.
      if (step.obsolete) git('config', '--add', 'remote.origin.fetch', '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy');
      return null;
    }
    case 'mergeAndLock': {
      const head = execFileSync('git', ['-C', world.repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      fs.writeFileSync(path.join(world.repo, GIT_DIR, 'MERGE_HEAD'), `${head}\n`);
      fs.writeFileSync(path.join(world.repo, GIT_DIR, 'index.lock'), '');
      return null;
    }
    case 'cloneThisRepository':
      world.clone = path.join(world.root, 'clone');
      execFileSync('git', ['clone', '-q', '--shared', fileURLToPath(new URL('../../../', import.meta.url)), world.clone], { stdio: 'ignore' });
      return null;
    case 'gitConfig':
      return execFileSync('git', ['-C', world[step.cwd], 'config', '--get-all', 'remote.origin.fetch'], { encoding: 'utf8' }).trim();
    case 'storeAppeared':
      return `store ${fs.existsSync(path.join(world[step.cwd], '.fgos')) ? 'exists' : 'absent'}`;
    case 'observeAppeared':
      return `observe ${fs.existsSync(path.join(world[step.cwd], '.fgos', 'observe')) ? 'exists' : 'absent'}`;
    case 'brokenProjectConfig':
      writeRawProjectConfig(world.repo, '# @fgos:v1\nrunner: [\n');
      return null;
    case 'unknownKeyProjectConfig':
      writeRawProjectConfig(world.repo, '# @fgos:v1\nunknownKey: 1\n');
      return null;
    case 'strayGlobalFile':
      writeAt(world.home, '.fgos/stray.yaml', '# @fgos:v1\ngateway:\n  token: SENTINEL-9931\n');
      return null;
    case 'looseGlobalConfig':
      writeRawGlobalConfig(world.home, '# @fgos:v1\n');
      fs.chmodSync(path.join(world.home, '.fgos/config.yaml'), 0o666);
      return null;
    case 'driftedDocs':
      writeRawProjectConfig(world.repo, '# @fgos:v1\n\n# @fgos:doc stale text\nrunner:\n  maxParallel: 3\n');
      return null;
    case 'redundantValue':
      writeRawProjectConfig(world.repo, '# @fgos:v1\n\nrunner:\n  maxParallel: 1\n');
      return null;
    case 'legacyGlobalToken':
      writeRawLegacyGlobalConfig(world.home, JSON.stringify({ gateway: { port: 4001, token: 'SENTINEL-9931' } }));
      return null;
    case 'noMachineId':
      fs.rmSync(path.join(world.state, 'machine-id'));
      return null;
    case 'badMachineId':
      fs.writeFileSync(path.join(world.state, 'machine-id'), 'BAD\n');
      return null;
    case 'machineKey':
      fs.mkdirSync(path.join(world.state, 'identity'), { recursive: true, mode: 0o700 });
      execFileSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', 'fgos-machine', '-f', path.join(world.state, 'identity/machine-key')], { stdio: 'ignore' });
      return null;
    case 'pathWithout':
      world.pathWithout = toolPath(world, step.tools ?? []);
      return null;
    case 'fakeOpenssh':
      world.pathWithout = toolPath(world, ['ssh', 'ssh-keygen']);
      writeTool(world.pathWithout, 'ssh', `echo '${step.banner}' >&2`);
      writeTool(world.pathWithout, 'ssh-keygen', 'exit 1');
      return null;
    case 'brokenProjectId':
      writeAt(world.repo, '.fgos/project.json', '{ not json');
      return null;
    case 'pendingActivation':
      writeAt(world.repo, '.fgos/installation/activation.json', JSON.stringify({ status: 'pending' }));
      return null;
    case 'observeDir':
      fs.mkdirSync(path.join(world.repo, '.fgos/observe'), { recursive: true });
      return null;
    case 'symlinkedFriction':
      fs.mkdirSync(path.join(world.repo, '.fgos/observe'), { recursive: true });
      fs.mkdirSync(path.join(world.repo, 'elsewhere'));
      fs.symlinkSync(path.join(world.repo, 'elsewhere'), path.join(world.repo, '.fgos/observe/friction'));
      return null;
    default:
      throw new Error(`unknown action ${step.do}`);
  }
}

const cwdOf = (world, name = 'repo') => ({
  repo: world.repo,
  sub: path.join(world.repo, 'sub'),
  fresh: world.fresh,
  outside: world.outside,
  linked: world.linked,
  legacy: world.legacy,
  other: world.other,
  mailbox: world.mailbox,
  timers: world.timers,
  badcfg: world.badcfg,
  remote: world.remote,
  clone: world.clone,
})[name] ?? assert.fail(`unknown cwd ${name}`);

/** The release, host binary and manifest an entry runs from, as text to replace. */
function runtimePaths(entry) {
  const env = { ...process.env, ...(entry.env ?? {}) };
  return ['FGOS_ACTIVE_MANIFEST_PATH', 'FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH'].map((name) => env[name]).filter(Boolean);
}

function normaliser(world, entry) {
  const paths = runtimePaths(entry).sort((a, b) => b.length - a.length);
  return (text) => {
    let out = text.replaceAll(world.root, '<WORLD>');
    for (const known of paths) out = out.replaceAll(known, '<RUNTIME>');
    return out
      .replace(/<RUNTIME>(?:\/\.fgos\/runtime\/git-addon\/[0-9a-f]+)?/g, '<RUNTIME>')
      .replace(/\.fgos\/runtime\/git-addon\/[0-9a-f]+/g, '<ADDON>')
      .replace(/\.fgos\/runtime\/dev-host\/[A-Za-z0-9_-]+/g, '<DEVHOST>')
      .replace(/(\bfgos \d+\.\d+\.\d+ \()[0-9a-f]{12}(\))/g, '$1<COMMIT>$2')
      // Where the state root was named from: the host pins it for the Node child, a Node run on its own reads the home.
      .replace(/(stateRoot \S+ \()(?:home|pinned|env)\)/g, '$1<SOURCE>)')
      // A timer unit is named after a hash of the project's path, and every world has its own path.
      .replace(/(fgos-(?:mailbox-sync|account-probe))-[0-9a-f]{8}/g, '$1-<STEM>')
      // The config file's own documentation comment: the base names the retired `setup` verb in the mailbox.enabled sentence.
      .replace('Whether fgos setup and doctor --fix install the mailbox hook rows into this project\'s Claude Code and Codex hook files; false removes the rows they installed.', 'Whether fgos doctor --fix installs the mailbox hook rows into this project\'s Claude Code and Codex hook files; false removes the rows it installed.')
      // A clone of this tree carries the mailbox.enabled sentence of this tree; the base release's schema words it as before.
      .replace('; project:config.yaml:256:3 config-doc-drift mailbox.enabled (drift)', '')
      // The base release words the two provenance problems of the mirror mappings in their older sentences.
      .replace('event-store-refspec-missing: the mirror fetch mappings are not recorded for this remote: the recorded mappings are missing or differ from the wanted set', 'event-store-refspec-missing: no Git mapping provenance; run fgos doctor --fix')
      .replace('event-store-remote-changed: the fetch mapping provenance records another remote URL than the remote has now', 'event-store-remote-changed; run fgos doctor --fix')
      // The hooks row's remedy names the command that wires the hooks path, not the retired `setup`.
      .replace(/run npm run setup:hooks/g, 'run fgos setup')
      // The floor row no longer names the Node version (Node is the bridged rows' runtime, reported by them).
      .replace(/"message": "node v\d+\.\d+\.\d+, git available"/g, '"message": "git available"')
      .replace(/\(node v\d+\.\d+\.\d+, git available\)/g, '(git available)')
      .replace(UUID, '<UUID>')
      // The machine id a fix mints is random after the host's name.
      .replace(new RegExp(`${MACHINE_ID_SLUG}-[a-z2-7]{6}\\b`, 'g'), '<MACHINE-ID>')
      .replace(ISO, '<TS>')
      .replace(/"(?:data_hash|generated_at)": "[^"]*",?\s*/g, '')
      .replace(/\b[0-9a-f]{64}\b/g, '<H64>')
      .replace(/\b[0-9a-f]{40}\b/g, '<SHA>')
      // The machine signing key a fix mints is random: its fingerprint is not part of what two runs share.
      .replace(/SHA256:[A-Za-z0-9+/]{43}/g, 'SHA256:<FINGERPRINT>')
      .replace(/"pid": \d+/g, '"pid": <PID>')
      // The fault record of a refused call: the host redacts a flag's `=value` in the message as the record writer does for argv.
      .replace(/(--[a-z-]+)=(?:<\d+>|1\b|\/tmp\b)/g, '$1=<V>');
  };
}

/** What a run left on disk, relative to the world: each file's path and normalised text, the Git internals left out. */
function disk(world, norm) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const rel = norm(path.relative(world.root, full));
      // `state/git-*`: what the Node CLI's own start-up git probe caches in the state root; a refused call never gets that far in the host.
      if (entry.name === GIT_DIR || rel.includes('.fgos/runtime') || rel.includes('/fgos-sessions') || /^state\/git-(?:empty-hooks|floor-verdict)/.test(rel)) continue;
      if (entry.isDirectory()) {
        out[`${rel}/`] = null;
        walk(full);
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(full);
        // Key material is random per run; only its presence is part of the state.
        out[rel] = /\/identity\/machine-key(?:\.pub)?$/.test(rel) ? '<key material>' : bytes.length > 200_000 ? `<${bytes.length} bytes>` : norm(bytes.toString('utf8'));
      } else if (entry.isSymbolicLink()) {
        out[rel] = `-> ${norm(fs.readlinkSync(full))}`;
      }
    }
  };
  walk(world.root);
  return out;
}

/** Rows the base release answers and this release no longer has: the row is deleted with the `setup` verb that kept its
 * source line, so both sides are compared without it. */
const RETIRED_ROWS = new Set(['shell-integration-sourced']);
const RETIRED_PRETTY_LINE = /^[✓✗] shell-integration source line present in detected rc file\(s\)/;

/** The pretty text without the line of a retired row. */
const withoutRetiredLines = (text) => text.split('\n').filter((line) => !RETIRED_PRETTY_LINE.test(line)).join('\n');

/** The base release's Node config loader prints a provider-family warning per executor that declares none, once per load, while
 * the host's bridged child keeps its own stderr; a clone of this repository carries such executors. The warnings belong to the
 * executor policy loader, not to a doctor row, so both sides are compared without them. */
const withoutExecutorPolicyWarnings = (text) => text.split('\n').filter((line) => !/^fgos: executor "[^"]+" declares no "providerModel"/.test(line)).join('\n');

/** The rows of one doctor answer as comparable values, or the raw text when the answer is not the JSON envelope. */
function describe(text, ignoreRows = [], accepted = null, side = 'host') {
  let data;
  try { data = JSON.parse(text).data; } catch { return { text: withoutRetiredLines(text) }; }
  if (!data?.checks) return { text: withoutRetiredLines(text) };
  return {
    ok: data.ok,
    next: data.next,
    fixed: data.fixed,
    // The compatibility row's `detail.versions` listed the Node addon's own component versions; the host has no addon, so
    // it lists the Git component's (accepted change); the floor in `detail` is compared.
    rows: data.checks.filter(({ id }) => !RETIRED_ROWS.has(id)).map(({ id, status, passed, fix, message, detail: rawDetail, description }) => {
      if (ignoreRows.includes(id)) return { id, description };
      const detail = id === 'git-component-compatible' && rawDetail ? { ...rawDetail, versions: undefined }
        // How much finished-operation history the journal holds, and since when, depends on when the run was.
        : id === 'git-operation-journal' && rawDetail?.journal ? { ...rawDetail, journal: { ...rawDetail.journal, retainedBytes: '<n>', oldestRetainedAtMs: '<ms>' } } : rawDetail;
      if (accepted?.rows.includes(id)) {
        assert.match(message, accepted[side], `${id}: the ${side} text of the accepted difference`);
        return { id, status, passed, fix, message: '<ACCEPTED TEXT>', detail, description };
      }
      return { id, status, passed, fix, message, detail, description };
    }),
  };
}

async function runScript(entry, testCase) {
  const world = makeWorld();
  const norm = normaliser(world, entry);
  const outputs = [];
  const children = [];
  try {
    for (const step of testCase.steps) {
      if (step.do) {
        const out = act(world, step);
        if (out !== null) outputs.push({ action: step.do, text: out });
        continue;
      }
      const args = step.args.map((arg) => (arg === '$OTHER' ? world.other : arg));
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args,
        cwd: cwdOf(world, step.cwd),
        env: { HOME: world.home, USERPROFILE: world.home, TMPDIR: world.tmp, FGOS_STATE_ROOT: world.state, XDG_RUNTIME_DIR: path.join(world.root, 'no-runtime-dir'), DBUS_SESSION_BUS_ADDRESS: `unix:path=${path.join(world.root, 'no-bus')}`, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-parity-claude', NO_COLOR: '1', ...(step.env === 'PATH_WITHOUT' ? { PATH: world.pathWithout } : {}) },
        timeoutMs: 180000,
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      outputs.push({
        args: step.args,
        exit: result.exitCode,
        stdout: describe(norm(result.stdoutText), testCase.ignoreRows, testCase.acceptedText, entry.type === 'node' ? 'base' : 'host'),
        stderr: withoutExecutorPolicyWarnings(norm(result.stderrText)),
      });
    }
    // A run leaves no store above its own tree: a stray `.fgos` there would make a later fixture treat that directory as its project.
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
    }
    return { outputs, disk: testCase.disk ? disk(world, norm) : null, outsideStore: fs.existsSync(path.join(world.outside, '.fgos')), children };
  } finally {
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 60).join('\n')}`); }
    };
    // Name the rows that differ first: a deep-equal of two whole reports hides them behind skipped lines.
    host.outputs.forEach((output, at) => {
      const rowsOf = (call) => Object.fromEntries((call?.stdout?.rows ?? []).map((row) => [row.id, row]));
      const [mine, theirs] = [rowsOf(output), rowsOf(base.outputs[at])];
      for (const id of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
        if (JSON.stringify(mine[id]) !== JSON.stringify(theirs[id])) differences.push(`row ${id} (call ${at}) host ${JSON.stringify(mine[id])} base ${JSON.stringify(theirs[id])}`);
      }
    });
    same(host.outputs, base.outputs, 'the calls');
    same(host.outsideStore, base.outsideStore, 'whether a .fgos appeared outside any repository');
    if (testCase.disk) same(host.disk, base.disk, 'what the run left on disk');
    // The host starts Node only for the bridged rows: one child for the rows of a call, one more when its fixes ran,
    // and none for a call the host refused.
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node').length;
    const ran = host.outputs.filter((output) => output.args && ![4].includes(output.exit));
    // Each fix the host runs itself can split the bridged fixes around it into one more call.
    const hostFixes = JSON.parse(fs.readFileSync(new URL('../../../packages/distribution/contracts/doctor-registry.v1.json', import.meta.url), 'utf8')).inRust.fixes.length;
    const most = ran.reduce((sum, output) => sum + (output.args.includes('--fix') ? 2 + hostFixes : 1), 0);
    if (nodeStarts > most) differences.push(`the host started ${nodeStarts} node children for ${ran.length} answered call(s)`);
    if (ran.length === 0 && nodeStarts > 0) differences.push('a refused call started node');
    if (ran.length > 0 && nodeStarts === 0) differences.push('the bridged rows were judged without the bridge');
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
