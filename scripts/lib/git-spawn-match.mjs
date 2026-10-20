// git-spawn-match.mjs -- the one matcher the one-door gate shares (Git spec §12): the static scan
// (scripts/git-one-door-scan.mjs), the runtime spy (test/helpers/git-spawn-spy.mjs) and the sandbox
// door (scripts/lib/sandbox-git.mjs) all decide "does this run Git?" and "is this the sandbox door?"
// here, so the three can never disagree.

import path from 'node:path';

/** The spawn-option key the sandbox door sets to its sandbox root; nothing else may set it. */
export const SANDBOX_DOOR = Symbol.for('fgos.git.sandbox-door');

/** The spawn-option key goal-check sets on a consumer's declared command (configured-binary, owner
 * decision Q1). The scan accepts it only on a spawn whose binary is not a literal. */
export const CONSUMER_COMMAND = Symbol.for('fgos.git.consumer-command');

/** Whether a shell command string runs `git` or a repository hook at a command position. */
export function shellRunsGit(text) {
  return /(^|[;&|(`\n]|\$\(|\bthen\b|\bdo\b|\bexec\b|\bxargs\b|\benv\b)\s*(?:[A-Z_]+=\S*\s+)*(?:command\s+)?(?:\S*\/)?git(?:\.exe)?(?=\s|$|['"`;)])/.test(text)
    || /(^|\s|\/)\.githooks\/|\/hooks\/(pre-commit|commit-msg|pre-push)\b/.test(text);
}

/** The repository paths a sandbox-door Git call names, which must all lie under its sandbox root: its
 * `cwd` when given, every `-C`/`--git-dir` operand (resolved from that cwd) and every absolute argument.
 * The door refuses a call that names none; door and spy both judge a call by this list. */
export function sandboxNamedPaths(args, cwd) {
  const base = path.resolve(cwd ?? process.cwd());
  const repos = args.flatMap((arg, i) => ((arg === '-C' || arg === '--git-dir') && i + 1 < args.length ? [path.resolve(base, String(args[i + 1]))] : []));
  return [...(cwd === undefined ? [] : [base]), ...repos, ...args.filter((arg) => typeof arg === 'string' && path.isAbsolute(arg))];
}
