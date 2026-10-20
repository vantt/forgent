// git-spawn-spy.mjs -- the runtime half of the one-door gate (Git spec §12, V-GATE), preloaded
// (`node --test --import`) into every test file's process by scripts/run-tests.mjs.
//
// It records every child process whose binary is `git` or a repository hook -- directly, through a
// shell string or `sh -c`, or behind `env`/`xargs`-style launchers -- that code in this checkout's
// `src/`, `bin/` or `scripts/` starts. Product code reaches Git only through the
// fgos-git driver, which the addon runs in Rust, so any such spawn is a writer outside the one door.
// The run-tests door reads the record after the run and fails the suite on any entry.
//
// A sandbox repository is recognised by its door, not by a path: the shared sandbox door
// (scripts/lib/sandbox-git.mjs, which test/helpers/git-fixture.mjs builds on) marks its spawn options
// with the sandbox root, and the spy re-checks that the spawn's working directory and every `-C` or
// `--git-dir` lies inside that root before it lets the spawn pass.
//
// Children inherit the spy through NODE_OPTIONS, so a CLI a test runs (`node bin/fgos.mjs ...`) is
// watched too; a test that hands its child an env without NODE_OPTIONS opts that child out.

import childProcess from 'node:child_process';
import fs from 'node:fs';
import module from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { CONSUMER_COMMAND, SANDBOX_DOOR, sandboxNamedPaths, shellRunsGit } from '../../scripts/lib/git-spawn-match.mjs';

export const SPY_LOG_ENV = 'FGOS_GIT_SPAWN_SPY_LOG';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRODUCT = ['src', 'bin', 'scripts'].map((dir) => path.join(ROOT, dir) + path.sep);
const SELF = fileURLToPath(import.meta.url);
const HOOK_NAMES = /(^|[\\/])(\.githooks|hooks)[\\/][\w.-]+$/;
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'cmd', 'cmd.exe', 'powershell', 'pwsh']);
const LAUNCHERS = new Set(['env', 'nice', 'timeout', 'xargs', 'sudo', 'nohup', 'stdbuf']);

const base = (file) => path.basename(String(file)).replace(/\.exe$/i, '');

/** What the spawn runs: 'git' | 'hook' | null. */
export function spawnTarget(file, args = [], options = {}, { shell = false } = {}) {
  const text = String(file);
  if (shell || options?.shell) return shellRunsGit([text, ...args.map(String)].join(' ')) ? 'git' : null;
  const name = base(text);
  if (name === 'git') return 'git';
  if (HOOK_NAMES.test(text)) return 'hook';
  if (SHELLS.has(name)) return args.some((a) => shellRunsGit(String(a))) ? 'git' : null;
  if (LAUNCHERS.has(name)) {
    const next = args.findIndex((a) => !String(a).startsWith('-') && !String(a).includes('='));
    return next >= 0 ? spawnTarget(args[next], args.slice(next + 1), {}) : null;
  }
  return null;
}

// The spawn belongs to the code that called child_process: the first frame after the spy's own,
// past Node internals and past a module that wrapped child_process after the spy (the hot-lock guard
// does; its wrapper frame is the patch, not the caller). A product function a test drives counts;
// a test's own spawn function that product code was handed does not.
function productFrame(stack, wrappers) {
  for (const line of String(stack).split('\n').slice(1)) {
    const fn = /^\s*at (?:async )?([\w$.<>]+)(?: \[as [\w$]+\])? \(/.exec(line)?.[1];
    if (fn && wrappers.has(fn.split('.').pop())) continue;
    const m = /\(?(file:\/\/[^\s)]+|\/[^\s):]+|node:[^\s)]+):\d+:\d+\)?$/.exec(line.trim());
    if (!m || m[1].startsWith('node:')) continue;
    const file = m[1].startsWith('file://') ? fileURLToPath(m[1]) : m[1];
    if (file === SELF) continue;
    return PRODUCT.some((dir) => file.startsWith(dir)) ? `${path.relative(ROOT, file)}:${/:(\d+):\d+\)?$/.exec(line.trim())[1]}` : null;
  }
  return null;
}

function insideSandbox(root, file, args, options) {
  const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
  const sandbox = real(root);
  const named = sandboxNamedPaths(args.map(String), options?.cwd === undefined ? undefined : path.resolve(String(options.cwd)));
  return named.length > 0 && named.every((p) => { const r = path.relative(sandbox, real(p)); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); });
}

function record(entry) {
  const log = process.env[SPY_LOG_ENV];
  const line = `${JSON.stringify({ pid: process.pid, ...entry })}\n`;
  if (log) { try { fs.appendFileSync(log, line); return; } catch { /* fall through to stderr */ } }
  process.stderr.write(`git-spawn-spy: ${line}`);
}

/** Wraps the child_process entry points of `cp` so a product Git or hook spawn is recorded. */
export function installGitSpawnSpy(cp = childProcess) {
  const own = new Set();
  const wrappers = (entry) => {
    const names = new Set();
    for (const name of [entry]) if (!own.has(cp[name])) names.add(cp[name].name);
    return names;
  };
  const check = (entry, file, args, options, shell) => {
    const argv = Array.isArray(args) ? args : [];
    const opts = Array.isArray(args) ? options : args;
    const target = spawnTarget(file, argv, opts, { shell });
    if (!target) return;
    const stack = new Error().stack;
    const frame = productFrame(stack, wrappers(entry));
    if (!frame) return;
    if (opts?.[CONSUMER_COMMAND] === true) return; // a consumer's declared command: configured, not a site
    const sandbox = opts?.[SANDBOX_DOOR];
    if (sandbox && insideSandbox(sandbox, file, argv, opts)) return;
    record({ target, frame, file: String(file), args: argv.map(String).slice(0, 12), cwd: opts?.cwd ? String(opts.cwd) : process.cwd(), stack: String(stack).split('\n').slice(2, 10).map((l) => l.trim()) });
  };
  for (const name of ['execFileSync', 'execFile', 'spawnSync', 'spawn']) {
    const original = cp[name];
    cp[name] = function spiedSpawn(file, maybeArgs, maybeOpts, ...rest) {
      check(name, file, maybeArgs, maybeOpts, false);
      return original.call(this, file, maybeArgs, maybeOpts, ...rest);
    };
    own.add(cp[name]);
    keepPromisify(cp[name], original, (file, args, opts) => check(name, file, args, opts, false));
  }
  for (const name of ['execSync', 'exec']) {
    const original = cp[name];
    cp[name] = function spiedShell(command, maybeOpts, ...rest) {
      check(name, command, [], maybeOpts, true);
      return original.call(this, command, maybeOpts, ...rest);
    };
    own.add(cp[name]);
    keepPromisify(cp[name], original, (command, opts) => check(name, command, [], opts, true));
  }
}

function keepPromisify(wrapped, original, spy) {
  const custom = original[promisify.custom];
  if (typeof custom !== 'function') return;
  wrapped[promisify.custom] = function spiedPromisified(...args) {
    spy(...args);
    return custom.apply(this, args);
  };
}

/** The entries a run recorded, one per spawn, or [] when the log is absent. */
export function readSpyLog(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

export const SPY_IMPORT = `--import=${pathToFileURL(SELF).href}`;

installGitSpawnSpy(childProcess);
module.syncBuiltinESMExports();
// Children started with the inherited env carry the spy too.
if (!String(process.env.NODE_OPTIONS ?? '').includes(SPY_IMPORT)) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}${SPY_IMPORT}`;
}
