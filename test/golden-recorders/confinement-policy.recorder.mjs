#!/usr/bin/env node
// Golden-vector recorder for live confinement resource modules:
// src/runner/dispatch/confinement/{resources,workspace-paths}.mjs
// Dead sources (policies.mjs, bypass-pairing.mjs) were dropped; policy.v1.json stays and is owned by
// packages/execution/engine/tests/confinement_policy.rs.
//
// Usage: node test/golden-recorders/confinement-policy.recorder.mjs [--out <dir>]
// Default out: packages/execution/contracts/confinement-policy.
//
// Machine-touching cases build their fixture in a fresh temp directory. Paths in inputs and outputs are
// written with the placeholder `$ROOT`, which the reader swaps for its own fixture root.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const confinement = path.join(repo, 'src/runner/dispatch/confinement');
const resources = await import(path.join(confinement, 'resources.mjs'));
const workspacePaths = await import(path.join(confinement, 'workspace-paths.mjs'));

let outDir = path.join(repo, 'packages/execution/contracts/confinement-policy');
const argv = process.argv.slice(2);
if (argv[0] === '--out') outDir = path.resolve(argv[1]);

const uid = process.getuid();

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Runs `fn`; the answer is `{ ok }` or `{ error: message }` (and `code` for a resource error). */
function observe(fn) {
  try {
    const ok = fn();
    return { ok: ok === undefined ? null : clone(ok) };
  } catch (err) {
    return { error: err.message, ...(err.code ? { code: err.code } : {}) };
  }
}

// ---------------------------------------------------------------- resource vectors

/** A fixture: directories, files (with optional modes) and symbolic links, all relative to `$ROOT`. */
function build(root, fixture) {
  const mine = (text) => text.replaceAll('$UID', String(uid));
  fixture = {
    dirs: (fixture.dirs ?? []).map(mine),
    files: Object.fromEntries(Object.entries(fixture.files ?? {}).map(([k, v]) => [mine(k), v])),
    symlinks: Object.fromEntries(Object.entries(fixture.symlinks ?? {}).map(([k, v]) => [mine(k), v])),
    modes: Object.fromEntries(Object.entries(fixture.modes ?? {}).map(([k, v]) => [mine(k), v])),
  };
  for (const dir of fixture.dirs ?? []) fs.mkdirSync(path.join(root, dir), { recursive: true, mode: 0o755 });
  for (const [file, content] of Object.entries(fixture.files ?? {})) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  for (const [link, target] of Object.entries(fixture.symlinks ?? {})) {
    fs.mkdirSync(path.dirname(path.join(root, link)), { recursive: true });
    fs.symlinkSync(target.replaceAll('$ROOT', root), path.join(root, link));
  }
  for (const [entry, mode] of Object.entries(fixture.modes ?? {})) fs.chmodSync(path.join(root, entry), mode);
}

const subst = (value, root) => JSON.parse(JSON.stringify(value === undefined ? null : value).replaceAll('$ROOT', root).replaceAll('"$UID+1"', String(uid + 1)).replaceAll('"$UID"', String(uid)).replaceAll('$UID', String(uid)));
const scrub = (value, root) => JSON.parse(JSON.stringify(value).replaceAll(root, '$ROOT').replaceAll(`/run/${uid}`, '/run/$UID'));

/** Lists what is under the root afterwards (relative path and kind), the side effects a resolver may leave. */
function tree(root) {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const st = fs.lstatSync(full);
      const rel = path.relative(root, full);
      if (st.isSymbolicLink()) out.push({ path: rel, kind: 'link' });
      else if (st.isDirectory()) { out.push({ path: rel, kind: 'dir', mode: st.mode & 0o777 }); walk(full); }
      else out.push({ path: rel, kind: 'file' });
    }
  };
  walk(root);
  return out;
}

function recordFunction(name, fixture, input, run, { withTree = false } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cp-res-')));
  try {
    build(root, fixture);
    const answer = observe(() => run(subst(input, root), root));
    const out = { name, fixture, input, ...scrub(answer, root) };
    if (withTree) out.tree = tree(root).filter((entry) => !(fixture.dirs ?? []).includes(entry.path) || entry.kind === 'dir');
    return out;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}


const privateRootInput = (over = {}) => ({
  homeDir: '$ROOT/home',
  claudeSocketBase: '$ROOT/sockbase',
  xdgRuntimeDir: null,
  xdgConfigHome: null,
  herdrSocketPath: null,
  loginStores: [],
  confinementRoots: [],
  ...over,
});

const machineRootCases = [
  ['nothing exists: no roots', { dirs: ['home', 'sockbase'] }, privateRootInput()],
  ['home .fgos/private', { dirs: ['home/.fgos/private', 'sockbase'] }, privateRootInput()],
  ['runtime directory', { dirs: ['home', 'sockbase', 'rt'] }, privateRootInput({ xdgRuntimeDir: '$ROOT/rt' })],
  ['runtime directory that does not exist is skipped', { dirs: ['home', 'sockbase'] }, privateRootInput({ xdgRuntimeDir: '$ROOT/nope' })],
  ['relative runtime directory has no value', { dirs: ['home', 'sockbase'] }, privateRootInput({ xdgRuntimeDir: 'rt' })],
  ['session socket directory is created outside the runtime directory', { dirs: ['home', 'sockbase', 'rt'], modes: { sockbase: 0o755 } }, privateRootInput({ xdgRuntimeDir: '$ROOT/rt' }), true],
  ['session socket directory under the runtime directory is covered by it', { dirs: ['home', 'rt/cc-socks'] }, privateRootInput({ xdgRuntimeDir: '$ROOT/rt', claudeSocketBase: '$ROOT/rt' })],
  ['session socket directory created when the base is a real directory', { dirs: ['home', 'sockbase'] }, privateRootInput(), true],
  ['session socket directory existing is left as it is', { dirs: ['home', 'sockbase/cc-socks'], modes: { 'sockbase/cc-socks': 0o755 } }, privateRootInput(), true],
  ['socket base missing creates nothing', { dirs: ['home'] }, privateRootInput(), true],
  ['herdr config under home', { dirs: ['home/.config/herdr', 'sockbase'] }, privateRootInput()],
  ['herdr config under xdg config home', { dirs: ['home', 'sockbase', 'xdg/herdr'] }, privateRootInput({ xdgConfigHome: '$ROOT/xdg' })],
  ['herdr socket directory', { dirs: ['home', 'sockbase', 'herdr-run'], files: { 'herdr-run/herdr.sock': '' } }, privateRootInput({ herdrSocketPath: '$ROOT/herdr-run/herdr.sock' })],
  ['herdr socket directory that is the home is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ herdrSocketPath: '$ROOT/home/herdr.sock' })],
  ['herdr socket directory above the home is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ herdrSocketPath: '$ROOT/herdr.sock' })],
  ['herdr socket directory that is the config directory is refused', { dirs: ['home/.config', 'sockbase'] }, privateRootInput({ herdrSocketPath: '$ROOT/home/.config/herdr.sock' })],
  ['herdr socket directory that is the xdg config home is refused', { dirs: ['home', 'sockbase', 'xdg'] }, privateRootInput({ xdgConfigHome: '$ROOT/xdg', herdrSocketPath: '$ROOT/xdg/herdr.sock' })],
  ['herdr socket directory that is /tmp is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ herdrSocketPath: '/tmp/herdr.sock' })],
  ['relative herdr socket path has no value', { dirs: ['home', 'sockbase'] }, privateRootInput({ herdrSocketPath: 'herdr.sock' })],
  ['login store', { dirs: ['home', 'sockbase', 'logins/a', 'logins/b'] }, privateRootInput({ loginStores: ['$ROOT/logins/a', '$ROOT/logins/b'] })],
  ['login store that does not exist is skipped', { dirs: ['home', 'sockbase'] }, privateRootInput({ loginStores: ['$ROOT/logins/a'] })],
  ['login store is a link: its real path is masked', { dirs: ['home', 'sockbase', 'real'], symlinks: { 'logins/a': '$ROOT/real' } }, privateRootInput({ loginStores: ['$ROOT/logins/a'] })],
  ['login store that is the home is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ loginStores: ['$ROOT/home'] })],
  ['login store that holds the home is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ loginStores: ['$ROOT'] })],
  ['login store that is a file is refused', { dirs: ['home', 'sockbase'], files: { 'logins/file': 'x' } }, privateRootInput({ loginStores: ['$ROOT/logins/file'] })],
  ['login store that is relative is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ loginStores: ['logins/a'] })],
  ['login store that is not a string is refused', { dirs: ['home', 'sockbase'] }, privateRootInput({ loginStores: [3] })],
  ['confinement root', { dirs: ['home', 'sockbase', 'tmp/fgos-confinement'] }, privateRootInput({ confinementRoots: ['$ROOT/tmp/fgos-confinement'] })],
  ['two confinement roots, repeats once', { dirs: ['home', 'sockbase', 'c1', 'c2'] }, privateRootInput({ confinementRoots: ['$ROOT/c1', '$ROOT/c2', '$ROOT/c1'] })],
  ['a root inside another is masked by the outer one', { dirs: ['home/.fgos/private', 'logins/a', 'sockbase'] }, privateRootInput({ confinementRoots: ['$ROOT/home/.fgos'], loginStores: ['$ROOT/logins/a'] })],
  ['every root at once', { dirs: ['home/.fgos/private', 'home/.config/herdr', 'rt', 'sockbase', 'xdg/herdr', 'hs', 'login', 'cr'] }, privateRootInput({ xdgRuntimeDir: '$ROOT/rt', xdgConfigHome: '$ROOT/xdg', herdrSocketPath: '$ROOT/hs/herdr.sock', loginStores: ['$ROOT/login'], confinementRoots: ['$ROOT/cr'] }), true],
];

const maskRuntimeCases = [
  ['xdg runtime dir wins', {}, { env: { XDG_RUNTIME_DIR: '$ROOT/xdg' }, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['relative xdg runtime dir is not used', {}, { env: { XDG_RUNTIME_DIR: 'rel' }, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd directory of the user, 0700', { dirs: ['run/$UID'], modes: { 'run/$UID': 0o700 } }, { env: {}, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd directory with loose mode is not used', { dirs: ['run/$UID'], modes: { 'run/$UID': 0o755 } }, { env: {}, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd directory missing', {}, { env: {}, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd path that is a link is not used', { dirs: ['real'], symlinks: { 'run/$UID': '$ROOT/real' }, modes: { real: 0o700 } }, { env: {}, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd path that is a file is not used', { files: { 'run/$UID': '' } }, { env: {}, uid: '$UID', runUserBase: '$ROOT/run' }],
  ['systemd directory of another uid is not used', { dirs: ['run/$UID'], modes: { 'run/$UID': 0o700 } }, { env: {}, uid: '$UID+1', runUserBase: '$ROOT/run' }],
  ['no uid', {}, { env: {}, uid: null, runUserBase: '$ROOT/run' }],
];

const socketBaseCases = [
  ['xdg runtime dir first', { XDG_RUNTIME_DIR: '/x/rt', CLAUDE_CODE_TMPDIR: '/x/cc', TMPDIR: '/x/t' }],
  ['claude code tmp dir', { CLAUDE_CODE_TMPDIR: '/x/cc', TMPDIR: '/x/t' }],
  ['TMPDIR', { TMPDIR: '/x/t', TMP: '/x/tmp', TEMP: '/x/temp' }],
  ['TMP', { TMP: '/x/tmp', TEMP: '/x/temp' }],
  ['TEMP', { TEMP: '/x/temp' }],
  ['relative values are skipped', { XDG_RUNTIME_DIR: 'a', CLAUDE_CODE_TMPDIR: 'b', TMPDIR: 'c', TMP: 'd', TEMP: 'e' }],
  ['nothing set falls to /tmp', {}],
];

const blindRootCases = [
  ['no fgosDir', { dirs: [] }, { fgosDir: '', backendConfig: {} }],
  ['nothing exists', { dirs: ['fgos'] }, { fgosDir: '$ROOT/fgos', backendConfig: { privateHomeRoot: '$ROOT/homes' } }],
  ['every hidden root exists', { dirs: ['fgos/assignments', 'fgos/workflow-runs', 'fgos/dispatch-runs', 'fgos/runtime/mailbox', 'homes'] }, { fgosDir: '$ROOT/fgos', backendConfig: { privateHomeRoot: '$ROOT/homes' } }],
  ['temp root from backend tempRoot', { dirs: ['fgos', 'tmpr'] }, { fgosDir: '$ROOT/fgos', backendConfig: { tempRoot: '$ROOT/tmpr' } }],
  ['a hidden root that is a file is not hidden', { dirs: ['fgos'], files: { 'fgos/assignments': 'x' } }, { fgosDir: '$ROOT/fgos', backendConfig: { privateHomeRoot: '$ROOT/none' } }],
  ['a hidden root that is a link is real-pathed', { dirs: ['elsewhere', 'fgos'], symlinks: { 'fgos/assignments': '$ROOT/elsewhere' } }, { fgosDir: '$ROOT/fgos', backendConfig: { privateHomeRoot: '$ROOT/none' } }],
];

const createBlindCases = [
  ['creates the mailbox directory 0700', { dirs: ['fgos'] }, '$ROOT/fgos'],
  ['creates the runtime directory on the way', { dirs: ['fgos'] }, '$ROOT/fgos'],
  ['no-op when .fgos is missing', { dirs: [] }, '$ROOT/fgos'],
  ['no-op for a blank directory', { dirs: [] }, '  '],
  ['leaves an existing directory as it is', { dirs: ['fgos/runtime/mailbox'], modes: { 'fgos/runtime/mailbox': 0o755 } }, '$ROOT/fgos'],
  ['runtime a plain file leaves the root missing', { dirs: ['fgos'], files: { 'fgos/runtime': 'x' } }, '$ROOT/fgos'],
];

const canonCases = [
  ['inside', { dirs: ['r/a'] }, ['$ROOT/r/a', '$ROOT/r', 'x']],
  ['the root itself', { dirs: ['r'] }, ['$ROOT/r', '$ROOT/r', 'x']],
  ['not yet existing under an existing ancestor', { dirs: ['r'] }, ['$ROOT/r/new/deeper', '$ROOT/r', 'x']],
  ['outside', { dirs: ['r', 's'] }, ['$ROOT/s', '$ROOT/r', 'x']],
  ['sibling with the root as name prefix', { dirs: ['r', 'r2'] }, ['$ROOT/r2', '$ROOT/r', 'x']],
  ['link escaping the root', { dirs: ['r', 's'], symlinks: { 'r/l': '$ROOT/s' } }, ['$ROOT/r/l', '$ROOT/r', 'x']],
  ['link staying inside the root', { dirs: ['r/a'], symlinks: { 'r/l': '$ROOT/r/a' } }, ['$ROOT/r/l', '$ROOT/r', 'x']],
  ['root that is a link', { dirs: ['real/a'], symlinks: { rl: '$ROOT/real' } }, ['$ROOT/rl/a', '$ROOT/rl', 'x']],
  ['target blank', { dirs: ['r'] }, ['  ', '$ROOT/r', 'x']],
  ['root blank', { dirs: ['r'] }, ['$ROOT/r', '', 'x']],
  ['target not a string', { dirs: ['r'] }, [null, '$ROOT/r', 'x']],
  ['dot-dot that leaves the root', { dirs: ['r', 's'] }, ['$ROOT/r/../s', '$ROOT/r', 'x']],
];

const insideCases = [
  ['equal', '/a/b', '/a/b'], ['below', '/a/b/c', '/a/b'], ['sibling prefix', '/a/bc', '/a/b'], ['above', '/a', '/a/b'],
  ['root with trailing slash', '/a/b/c', '/a/b/'], ['root slash', '/a', '/'],
];

const launchContext = (over = {}) => ({ runDir: '$ROOT/fgos/assignments/u/p/1/runs/01', fgosDir: '$ROOT/fgos', repoRoot: '$ROOT/repo', ...over });
const baseDirs = ['fgos/assignments/u/p/1/runs/01', 'repo', 'homes'];
const resolveInput = (over = {}) => ({
  dispatchId: 'd1',
  context: launchContext(),
  grants: [],
  backendConfig: { privateHomeRoot: '$ROOT/homes' },
  providerSources: {},
  blind: false,
  homeDir: '$ROOT/home',
  claudeSocketBase: '$ROOT/sockbase',
  xdgRuntimeDir: null,
  xdgConfigHome: null,
  herdrSocketPath: null,
  loginStores: [],
  confinementRoots: ['$ROOT/homes'],
  ...over,
});
const grant = (resource, access, extra = {}) => ({ resource, access, scope: 'dispatch', ...extra });

const resolveResourceCases = [
  ['no dispatch id', { dirs: baseDirs }, resolveInput({ dispatchId: '' })],
  ['no grants: only the machine-private masks', { dirs: [...baseDirs, 'home/.fgos/private', 'sockbase'] }, resolveInput()],
  ['run-output for a cli-spawn run', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write')] })],
  ['run-output for a herdr-spawn run', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ adapter: 'herdr-spawn' }) }), true],
  ['run-output for an assignment launch', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ assignmentLaunchContext: true }) }), true],
  ['run-output with the worker-output subpath', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write', { subpath: 'worker-output' })] }), true],
  ['run-output with the worker-output/outbox subpath', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write', { subpath: 'worker-output/outbox' })] }), true],
  ['run-output without a run directory', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ runDir: undefined }) })],
  ['run-output without a state directory', { dirs: baseDirs }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ fgosDir: undefined }) })],
  ['run-output outside the state directory', { dirs: [...baseDirs, 'elsewhere'] }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ runDir: '$ROOT/elsewhere' }) })],
  ['run-output through a link out of the state directory', { dirs: [...baseDirs, 'elsewhere'], symlinks: { 'fgos/assignments/u/p/1/runs/02': '$ROOT/elsewhere' } }, resolveInput({ grants: [grant('run-output', 'write')], context: launchContext({ runDir: '$ROOT/fgos/assignments/u/p/1/runs/02' }) })],
  ['workspace', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace', 'read-write')] })],
  ['workspace from cwd', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace', 'read-write')], context: launchContext({ repoRoot: undefined, cwd: '$ROOT/repo' }) })],
  ['workspace without a root', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace', 'read-write')], context: launchContext({ repoRoot: undefined }) })],
  ['workspace root that is a link is refused', { dirs: [...baseDirs, 'real'], symlinks: { rl: '$ROOT/real' } }, resolveInput({ grants: [grant('workspace', 'read-write')], context: launchContext({ repoRoot: '$ROOT/rl' }) })],
  ['workspace-paths directory is bound, a file is not', { dirs: [...baseDirs, 'repo/plans'], files: { 'repo/docs/backlog.md': 'x' } }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['plans', 'docs/backlog.md'] })] })],
  ['workspace-paths entry missing', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['plans'] })] })],
  ['workspace-paths entry is a link', { dirs: [...baseDirs, 'repo/real'], symlinks: { 'repo/plans': '$ROOT/repo/real' } }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['plans'] })] })],
  ['workspace-paths directory between is a link', { dirs: [...baseDirs, 'repo/real/sub'], symlinks: { 'repo/docs': '$ROOT/repo/real' } }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['docs/sub'] })] })],
  ['workspace-paths invalid shape', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['/etc'] })] })],
  ['workspace-paths without a root', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace-paths', 'read-write', { paths: ['plans'] })], context: launchContext({ repoRoot: undefined }) })],
  ['mailbox-record creates the lock file and the directory', { dirs: ['fgos', ...baseDirs] }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record with the files in place', { dirs: ['fgos/runtime/mailbox', 'fgos/locks', ...baseDirs], files: { 'fgos/locks/mailbox.lock': '' } }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record without a state directory', { dirs: baseDirs }, resolveInput({ grants: [grant('mailbox-record', 'read-write')], context: launchContext({ fgosDir: undefined }) })],
  ['mailbox-record where runtime/mailbox is a link', { dirs: ['fgos', 'elsewhere', ...baseDirs], symlinks: { 'fgos/runtime': '$ROOT/elsewhere' } }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record where the lock file is a link', { dirs: ['fgos/locks', 'elsewhere', ...baseDirs], symlinks: { 'fgos/locks/mailbox.lock': '$ROOT/elsewhere' } }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record where the lock directory is a link', { dirs: ['fgos', 'elsewhere', ...baseDirs], symlinks: { 'fgos/locks': '$ROOT/elsewhere' } }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record where the lock file is a directory', { dirs: ['fgos/locks/mailbox.lock', ...baseDirs] }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['mailbox-record where .fgos cannot take the directory', { dirs: ['fgos', ...baseDirs], files: { 'fgos/runtime': 'x' } }, resolveInput({ grants: [grant('mailbox-record', 'read-write')] }), true],
  ['git metadata of a directory that is not a checkout root', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace-git-metadata', 'read')] })],
  ['git metadata without a root', { dirs: baseDirs }, resolveInput({ grants: [grant('workspace-git-metadata', 'read')], context: launchContext({ repoRoot: undefined }) })],
  ['private-home', { dirs: baseDirs }, resolveInput({ grants: [grant('private-home', 'read-write')] })],
  ['private-home from the backend temp root', { dirs: [...baseDirs, 'tmpr'] }, resolveInput({ grants: [grant('private-home', 'read-write')], backendConfig: { tempRoot: '$ROOT/tmpr' } })],
  ['private-home with a hostile dispatch id', { dirs: baseDirs }, resolveInput({ dispatchId: '../escape', grants: [grant('private-home', 'read-write')] })],
  ['executor-credentials at a given path', { dirs: [...baseDirs, 'creds'] }, resolveInput({ grants: [grant('executor-credentials', 'read')], providerSources: { credentialsPath: '$ROOT/creds' } })],
  ['executor-credentials at a given directory', { dirs: [...baseDirs, 'credsdir'] }, resolveInput({ grants: [grant('executor-credentials', 'read')], providerSources: { credentialsDir: '$ROOT/credsdir' } })],
  ['executor-credentials that do not exist', { dirs: baseDirs }, resolveInput({ grants: [grant('executor-credentials', 'read')], providerSources: { credentialsPath: '$ROOT/none' } })],
  ['executor-credentials must be read only', { dirs: baseDirs }, resolveInput({ grants: [grant('executor-credentials', 'read-write')], providerSources: { credentialsPath: '$ROOT/none' } })],
  ['peer-sessions binds the socket directory and the registry', { dirs: [...baseDirs, 'sockbase', 'home/.claude/sessions'] }, resolveInput({ grants: [grant('peer-sessions', 'read-write')] }), true],
  ['peer-sessions registry lands in the private home', { dirs: [...baseDirs, 'sockbase', 'home/.claude/sessions'] }, resolveInput({ grants: [grant('private-home', 'read-write'), grant('peer-sessions', 'read-write')] }), true],
  ['peer-sessions names the runtime directory variable when the base is it', { dirs: [...baseDirs, 'rt', 'home/.claude/sessions'] }, resolveInput({ grants: [grant('peer-sessions', 'read-write')], claudeSocketBase: '$ROOT/rt', xdgRuntimeDir: '$ROOT/rt' }), true],
  ['peer-sessions without a registry', { dirs: [...baseDirs, 'sockbase'] }, resolveInput({ grants: [grant('peer-sessions', 'read-write')] }), true],
  ['peer-sessions must be read-write', { dirs: baseDirs }, resolveInput({ grants: [grant('peer-sessions', 'read')] })],
  ['masks marked machine-private and confinement roots', { dirs: [...baseDirs, 'home/.fgos/private', 'sockbase', 'login'] }, resolveInput({ loginStores: ['$ROOT/login'] }), true],
  ['launch program inside a masked root is bound back (install directories)', { dirs: [...baseDirs, 'login/bin', 'login/install', 'login/other'], files: { 'login/bin/agent': '' }, modes: { 'login/bin/agent': 0o755 } }, resolveInput({ loginStores: ['$ROOT/login'], context: launchContext({ launchCommand: '$ROOT/login/bin/agent' }) })],
  ['launch program inside a masked root with no install directory is bound alone', { dirs: [...baseDirs, 'login'], files: { 'login/agent': '' }, modes: { 'login/agent': 0o755 } }, resolveInput({ loginStores: ['$ROOT/login'], context: launchContext({ launchCommand: '$ROOT/login/agent' }) })],
  ['launch program found on the launch path', { dirs: [...baseDirs, 'login/packages', 'tools'], files: { 'login/agent': '' }, symlinks: { 'tools/agent': '$ROOT/login/agent' } }, resolveInput({ loginStores: ['$ROOT/login'], context: launchContext({ launchCommand: 'agent', launchPath: '$ROOT/tools' }) })],
  ['launch program outside every masked root needs no bind', { dirs: [...baseDirs, 'login', 'tools'], files: { 'tools/agent': '' } }, resolveInput({ loginStores: ['$ROOT/login'], context: launchContext({ launchCommand: '$ROOT/tools/agent' }) })],
  ['launch program that does not exist', { dirs: [...baseDirs, 'login'] }, resolveInput({ loginStores: ['$ROOT/login'], context: launchContext({ launchCommand: '$ROOT/login/none' }) })],
  ['blind hides the other dispatches and keeps its own', { dirs: [...baseDirs, 'fgos/workflow-runs', 'fgos/dispatch-runs'] }, resolveInput({ blind: true }), true],
  ['blind hides the mailbox record it creates', { dirs: [...baseDirs] }, resolveInput({ blind: true }), true],
  ['blind root already masked by a machine-private root is not hidden twice', { dirs: [...baseDirs, 'fgos/workflow-runs'] }, resolveInput({ blind: true, confinementRoots: ['$ROOT/homes'], loginStores: ['$ROOT/fgos'] }), true],
  ['blind without a run directory', { dirs: baseDirs }, resolveInput({ blind: true, context: launchContext({ runDir: undefined }) })],
  ['blind where the own directory is missing', { dirs: ['fgos', 'repo', 'homes'] }, resolveInput({ blind: true, context: launchContext({ runDir: '$ROOT/fgos/run-x' }) })],
  ['blind with a run directory of its own (no assignment)', { dirs: ['fgos/dispatch-runs/r1', 'repo', 'homes'] }, resolveInput({ blind: true, context: launchContext({ runDir: '$ROOT/fgos/dispatch-runs/r1' }) }), true],
  ['blind without a state directory', { dirs: baseDirs }, resolveInput({ blind: true, context: launchContext({ fgosDir: undefined }) })],
  ['every grant of the workspace-write policy but git metadata', { dirs: [...baseDirs, 'creds', 'home/.fgos/private', 'sockbase'] }, resolveInput({ grants: [{ resource: 'run-output', access: 'write', scope: 'dispatch' }, { resource: 'private-home', access: 'read-write', scope: 'dispatch' }, { resource: 'executor-credentials', access: 'read', scope: 'dispatch' }, { resource: 'workspace', access: 'read-write', scope: 'dispatch' }].map(clone), providerSources: { credentialsPath: '$ROOT/creds' } }), true],
];

function runResolve(input, root) {
  const clean = (value) => (value === undefined ? undefined : value);
  return resources.resolveConfinementResources({
    dispatchId: input.dispatchId,
    context: input.context ?? {},
    grants: input.grants,
    backendConfig: input.backendConfig,
    providerSources: input.providerSources,
    blind: input.blind,
    homeDir: input.homeDir,
    claudeSocketBase: input.claudeSocketBase,
    xdgRuntimeDir: input.xdgRuntimeDir,
    xdgConfigHome: input.xdgConfigHome,
    herdrSocketPath: input.herdrSocketPath,
    loginStores: clean(input.loginStores),
    confinementRoots: input.confinementRoots,
  });
}

function gitFixture(root, fixture) {
  const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=r', '-c', 'user.email=r@example.invalid', ...args], { cwd, stdio: 'pipe' });
  if (fixture.gitWorktree) {
    fs.mkdirSync(path.join(root, 'main'), { recursive: true });
    git(path.join(root, 'main'), 'init', '-q', '-b', 'main');
    git(path.join(root, 'main'), 'commit', '-q', '--allow-empty', '-m', 'init');
    fs.rmSync(path.join(root, 'repo'), { recursive: true, force: true });
    git(path.join(root, 'main'), 'worktree', 'add', '-q', '-b', 'w', path.join(root, 'repo'));
  } else {
    git(path.join(root, 'repo'), 'init', '-q', '-b', 'main');
  }
}

/**
 * resolveWorkspaceGitMetadata asks the git addon, which a checkout run does not ship; the answer it would give
 * is git's own: the real path of `git rev-parse --absolute-git-dir` for a directory that holds a `.git`.
 */
function gitMetadataVectors() {
  const cases = [];
  for (const kind of ['plain checkout', 'linked worktree', 'no .git at all']) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cp-git-')));
    try {
      const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=r', '-c', 'user.email=r@example.invalid', ...args], { cwd, stdio: 'pipe' }).toString().trim();
      let workspace = path.join(root, 'repo');
      fs.mkdirSync(workspace);
      let expected = null;
      if (kind === 'plain checkout') {
        git(workspace, 'init', '-q', '-b', 'main');
        expected = fs.realpathSync(git(workspace, 'rev-parse', '--absolute-git-dir'));
      } else if (kind === 'linked worktree') {
        fs.mkdirSync(path.join(root, 'main'));
        git(path.join(root, 'main'), 'init', '-q', '-b', 'main');
        git(path.join(root, 'main'), 'commit', '-q', '--allow-empty', '-m', 'init');
        fs.rmSync(workspace, { recursive: true });
        git(path.join(root, 'main'), 'worktree', 'add', '-q', '-b', 'w', workspace);
        expected = fs.realpathSync(git(workspace, 'rev-parse', '--absolute-git-dir'));
      }
      cases.push({ name: kind, layout: kind === 'plain checkout' ? 'checkout' : kind === 'linked worktree' ? 'linked-worktree' : 'none', ok: expected === null ? null : scrub(expected, root) });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
  return cases;
}

function recordResolve(name, fixture, input, withTree, needsGit) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cp-res-')));
  try {
    build(root, fixture);
    if (needsGit) gitFixture(root, fixture);
    const answer = observe(() => runResolve(subst(input, root), root));
    const out = { name, fixture, input, ...scrub(answer, root) };
    if (needsGit) out.git = fixture.gitWorktree ? 'linked-worktree' : 'checkout';
    if (withTree) out.tree = scrub(tree(root).filter((entry) => !entry.path.startsWith('repo/.git') && !entry.path.startsWith('main')), root);
    return out;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function resourceVectors() {
  return {
    contract: 'confinement-resource-vectors.v1',
    note: 'Paths are written with $ROOT, the reader\'s fixture root. A fixture lists dirs, files, symlinks and modes under it; `git` names a real repository the recorder initialised (a plain checkout, or a linked worktree whose .git file points into main/.git/worktrees).',
    machinePrivateRoots: machineRootCases.map(([name, fixture, input, withTree]) => recordFunction(name, fixture, input, (i) => resources.resolveMachinePrivateRoots(i), { withTree })),
    runtimeDirForMask: maskRuntimeCases.map(([name, fixture, input]) => recordFunction(name, fixture, input, (i) => resources.runtimeDirForMask(i))),
    claudeSocketBase: socketBaseCases.map(([name, env]) => ({ name, env, ...observe(() => resources.resolveClaudeSocketBase({ env })) })),
    blindHiddenRoots: blindRootCases.map(([name, fixture, input]) => recordFunction(name, fixture, input, (i) => resources.resolveBlindHiddenRoots(i))),
    createBlindRoots: createBlindCases.map(([name, fixture, fgosDir]) => recordFunction(name, fixture, { fgosDir }, (i) => resources.createBlindRootsWhenMissing(i.fgosDir), { withTree: true })),
    canonicalizeSubpath: canonCases.map(([name, fixture, args]) => recordFunction(name, fixture, { args }, (i) => resources.canonicalizeAndVerifySubpath(...i.args))),
    isInsideRoot: insideCases.map(([name, target, root]) => ({ name, target, root, ok: resources.isInsideRoot(target, root) })),
    gitMetadata: gitMetadataVectors(),
    resolveResources: resolveResourceCases.map(([name, fixture, input, withTree, needsGit]) => recordResolve(name, fixture, input, withTree, needsGit)),
  };
}

fs.mkdirSync(outDir, { recursive: true });
const write = (file, value) => fs.writeFileSync(path.join(outDir, file), `${JSON.stringify(value, null, 2)}\n`);
const r = resourceVectors();
write('resources.v1.json', r);
const count = (v) => Object.values(v).reduce((n, x) => n + (Array.isArray(x) ? x.length : 0), 0);
console.log(`resources.v1.json: ${count(r)} cases -> ${outDir}`);
