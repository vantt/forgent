// sandbox-git.mjs -- the named sandbox-setup class for outer scripts (Git spec §13: benchmarks and
// fixture regeneration "may create explicitly classified sandbox repos").
//
// A sandbox repository is one the script created itself under a root it owns. This is the only door
// such a script spawns `git` through, and it proves that provenance on every call: the repository must
// be named explicitly (`-C`, `--git-dir`, `cwd` or an absolute `init` path), and every absolute path in the call -- the
// repository, an `init` target, a linked checkout, a path remote -- must sit inside the sandbox root.
// GIT_* variables that pick a repository are dropped so nothing can redirect a call outside it. The checkout
// the script runs from is read through Inspect (scripts/lib/git-ports.mjs), never through here.
//
// A shell script reaches the same door as `node scripts/lib/sandbox-git.mjs --root <sandbox root> --
// <git args...>`; the call is checked exactly as `sandboxGit(root)(args)` checks it, so the git args
// still name the repository (`-C <path>` or an absolute `init` path) inside that root.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { SANDBOX_DOOR } from './git-spawn-match.mjs';
import { isMainModule } from './is-main-module.mjs';

function realOrPending(value) {
  let ancestor = value;
  const tail = [];
  while (!fs.existsSync(ancestor)) { tail.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor); }
  return path.join(fs.realpathSync(ancestor), ...tail);
}

// Variables that choose which repository, index, object store or config a call acts on. Identity and
// date variables (GIT_AUTHOR_*, GIT_COMMITTER_*) stay: fixtures set them on purpose.
const REDIRECTING = /^GIT_(DIR|WORK_TREE|COMMON_DIR|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|PREFIX|REPLACE_REF_BASE|CEILING_DIRECTORIES|DISCOVERY_ACROSS_FILESYSTEM|CONFIG.*)$/;

function sandboxEnv(env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !REDIRECTING.test(key)));
}

/** `git(args, opts)` confined to repositories under `root`; `opts` are execFileSync options. */
export function sandboxGit(root, { env = process.env } = {}) {
  const realRoot = fs.realpathSync(root);
  const inside = (value) => {
    const relative = path.relative(realRoot, realOrPending(path.resolve(value)));
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  };
  return function git(args, opts = {}) {
    const base = path.resolve(opts.cwd ?? process.cwd());
    const repos = args.flatMap((arg, i) => ((arg === '-C' || arg === '--git-dir') && i + 1 < args.length ? [path.resolve(base, args[i + 1])] : []));
    const checked = [...(opts.cwd === undefined ? [] : [base]), ...repos, ...args.filter((arg) => typeof arg === 'string' && path.isAbsolute(arg))];
    if (checked.length === 0) throw new Error(`sandbox-git: name the sandbox repository (-C, --git-dir, cwd or an absolute init path) for git ${args.join(' ')}`);
    const outside = checked.filter((value) => !inside(value));
    if (outside.length) throw new Error(`sandbox-git: ${outside.join(', ')} is outside the sandbox root ${realRoot}`);
    // The marker names this door to the one-door gate (scan and test spy), which re-checks the paths.
    const out = execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts, env: sandboxEnv(opts.env ?? env), [SANDBOX_DOOR]: realRoot });
    return typeof out === 'string' ? out.trim() : out;
  };
}

/** The `git` binary's version line, for a benchmark's environment record, run from the sandbox `root`. */
export function gitVersion(root) {
  const realRoot = fs.realpathSync(root);
  return execFileSync('git', ['--version'], { cwd: realRoot, encoding: 'utf8', env: sandboxEnv(process.env), [SANDBOX_DOOR]: realRoot }).trim();
}

if (isMainModule(import.meta.url)) {
  const argv = process.argv.slice(2);
  const split = argv.indexOf('--');
  if (argv[0] !== '--root' || !argv[1] || split !== 2 || argv.length === 3) {
    process.stderr.write('usage: node scripts/lib/sandbox-git.mjs --root <sandbox root> -- <git args...>\n');
    process.exit(2);
  }
  try {
    const out = sandboxGit(argv[1])(argv.slice(3));
    if (out) process.stdout.write(`${out}\n`);
  } catch (error) {
    process.stderr.write(`${error.stderr || error.message}`.replace(/\n?$/, '\n'));
    process.exit(typeof error.status === 'number' && error.status > 0 ? error.status : 1);
  }
}
