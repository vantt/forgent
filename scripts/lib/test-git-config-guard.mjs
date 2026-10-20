// test-git-config-guard.mjs -- preloaded (`node --test --import`) into every test file's process
// by scripts/run-tests.mjs. A fixture that configures git (an identity above all) must do it inside
// its own temporary repository. A `git config` write that would land in the checkout running the
// suite -- a missing or empty cwd, a fixture whose `git init` did not happen, a linked worktree that
// shares the checkout's config -- is refused here by name instead of silently rewriting the
// owner's real identity, which then shows up on every later commit.
//
// What it guards: `git config` writes started from this process through child_process (execFileSync,
// execFile, spawnSync, spawn, execSync, exec). A grandchild process is not reached; the run-tests
// door snapshots the checkout's identity keys around the whole run for those.

import childProcess from 'node:child_process';
import fs from 'node:fs';
import module from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { repositoryDirs } from './git-dir-layout.mjs';

const READ_FLAGS = new Set([
  '--get', '--get-all', '--get-regexp', '--get-urlmatch', '--get-color', '--get-colorbool',
  '--list', '-l', '--name-only', '--show-origin', '--show-scope', '--type', '--default',
]);
const GLOBAL_SCOPE_FLAGS = new Set(['--global', '--system']);
// Options before the subcommand that consume the next argv element.
const VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--config-env']);

/** `git config` writes found in one argv: `{ dirs: string[], globalScope: boolean }` per write, else null. */
export function parseGitConfigWrite(args) {
  const dirs = [];
  let i = 0;
  for (; i < args.length; i += 1) {
    const arg = String(args[i]);
    if (arg === '-C') { dirs.push(String(args[i + 1] ?? '')); i += 1; continue; }
    if (arg.startsWith('--git-dir=') || arg.startsWith('--work-tree=')) { dirs.push(arg.slice(arg.indexOf('=') + 1)); continue; }
    if (arg === '--git-dir' || arg === '--work-tree') { dirs.push(String(args[i + 1] ?? '')); i += 1; continue; }
    if (VALUE_OPTIONS.has(arg)) { i += 1; continue; }
    if (arg.startsWith('-')) continue;
    break;
  }
  if (String(args[i]) !== 'config') return null;
  const rest = args.slice(i + 1).map(String);
  if (rest.some((a) => READ_FLAGS.has(a) || a.startsWith('--get'))) return null;
  // `git config <name>` alone reads; a write needs a value, --unset*, --add, --replace-all, --edit, --rename/remove-section.
  const positional = rest.filter((a) => !a.startsWith('-'));
  const explicitWrite = rest.some((a) => /^--(unset|unset-all|add|replace-all|edit|rename-section|remove-section)$|^-e$/.test(a));
  if (!explicitWrite && positional.length < 2) return null;
  return { dirs, globalScope: rest.some((a) => GLOBAL_SCOPE_FLAGS.has(a)) };
}

/** Every `git ... config ...` segment of a shell string as an argv array (best effort: whitespace and quotes). */
function shellGitConfigSegments(command) {
  const segments = [];
  for (const piece of String(command).split(/&&|\|\||;|\n/)) {
    const words = piece.match(/"[^"]*"|'[^']*'|\S+/g)?.map((w) => w.replace(/^(["'])(.*)\1$/, '$2')) ?? [];
    if (words[0] === 'git') segments.push(words.slice(1));
  }
  return segments;
}

function realpathOrSelf(p) {
  try { return fs.realpathSync(p); } catch { return path.resolve(p); }
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Builds the check. `protectedCommonDir` is the git common dir of the checkout that must keep its
 * own config; which repository a directory belongs to is read from its Git layout on disk.
 */
export function createGitConfigGuard({ protectedCommonDir, tempRoots = defaultTempRoots(), env = process.env }) {
  const protectedDir = realpathOrSelf(protectedCommonDir);

  const known = new Map();
  function commonDirOf(dir) {
    if (!known.has(dir)) known.set(dir, lookupCommonDir(dir));
    return known.get(dir);
  }

  function lookupCommonDir(dir) {
    return repositoryDirs(dir)?.commonDir ?? null; // not a repository: git config would fail on its own
  }

  function globalConfigIsDisposable() {
    const target = env.GIT_CONFIG_GLOBAL || env.HOME || os.homedir();
    return Boolean(target) && tempRoots.some((root) => isInside(realpathOrSelf(target), root));
  }

  /** Throws when the argv (run from `cwd`) would write config into the protected checkout. */
  return function assertNotProtected(args, cwd) {
    const write = parseGitConfigWrite(args);
    if (!write) return;
    const label = `git ${args.map(String).join(' ')}`;
    if (write.globalScope) {
      if (!globalConfigIsDisposable()) {
        throw new Error(`refusing "${label}": a test must not write the machine's own git config; run it with HOME or GIT_CONFIG_GLOBAL inside a temporary directory`);
      }
      return;
    }
    let dir = path.resolve(cwd || process.cwd());
    for (const next of write.dirs) dir = path.resolve(dir, next);
    if (commonDirOf(dir) === protectedDir) {
      throw new Error(`refusing "${label}" in ${dir}: it resolves to the checkout running the suite (${protectedDir}); a fixture must pass an explicit cwd inside its own temporary repository`);
    }
  };
}

function defaultTempRoots() {
  const roots = [os.tmpdir(), '/tmp', '/var/tmp', process.env.FGOS_TEST_FIXTURE_ROOT].filter(Boolean);
  return [...new Set(roots.map(realpathOrSelf))];
}

/** Wraps every child_process spawn entry point so a guarded `git config` write throws before git runs. */
export function installGitConfigGuard(cp, assertNotProtected) {
  const optsCwd = (maybeArgs, maybeOpts) => {
    const opts = Array.isArray(maybeArgs) ? maybeOpts : maybeArgs;
    return opts && typeof opts === 'object' && opts.cwd != null ? String(opts.cwd) : undefined;
  };
  const isGit = (file) => path.basename(String(file)) === 'git' || path.basename(String(file)) === 'git.exe';
  for (const name of ['execFileSync', 'execFile', 'spawnSync', 'spawn']) {
    const original = cp[name];
    cp[name] = function guardedGitSpawn(file, maybeArgs, maybeOpts, ...rest) {
      if (isGit(file) && Array.isArray(maybeArgs)) assertNotProtected(maybeArgs, optsCwd(maybeArgs, maybeOpts));
      return original.call(this, file, maybeArgs, maybeOpts, ...rest);
    };
    keepPromisify(cp[name], original, (file, args, opts) => { if (isGit(file) && Array.isArray(args)) assertNotProtected(args, optsCwd(args, opts)); });
  }
  for (const name of ['execSync', 'exec']) {
    const original = cp[name];
    cp[name] = function guardedShell(command, maybeOpts, ...rest) {
      for (const segment of shellGitConfigSegments(command)) assertNotProtected(segment, optsCwd(maybeOpts));
      return original.call(this, command, maybeOpts, ...rest);
    };
    keepPromisify(cp[name], original, (command, opts) => { for (const segment of shellGitConfigSegments(command)) assertNotProtected(segment, optsCwd(opts)); });
  }
}

/** `util.promisify(exec|execFile)` resolves `{ stdout, stderr }` through a custom symbol; keep it, guarded too. */
function keepPromisify(wrapped, original, check) {
  const custom = original[promisify.custom];
  if (typeof custom !== 'function') return;
  wrapped[promisify.custom] = function guardedPromisified(...args) {
    check(...args);
    return custom.apply(this, args);
  };
}

const CHECKOUT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The preload entry: protect the checkout this file belongs to. */
export function installForCheckout(root = CHECKOUT_ROOT) {
  const common = repositoryDirs(root)?.commonDir;
  if (!common) return false; // an unpacked copy with no repository has nothing to protect
  installGitConfigGuard(childProcess, createGitConfigGuard({ protectedCommonDir: common }));
  module.syncBuiltinESMExports();
  return true;
}

installForCheckout();
