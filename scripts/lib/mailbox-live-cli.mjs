/**
 * scripts/lib/mailbox-live-cli.mjs
 *
 * The run guards every live mailbox CLI run shares: the hook-fixture
 * recorder (scripts/record-mailbox-hook-fixtures.mjs) and the live suite
 * (test/live/mailbox-claude.live.mjs) import them, so a guard exists once.
 * Node built-ins only. Every function takes its paths and its account as
 * parameters and throws a `LiveCliError` (with the exit code the caller
 * should use) instead of exiting.
 *
 * - The CLI runs with an allowlisted environment, never the caller's: the
 *   caller is often itself a Claude Code session whose environment carries
 *   its own session id, messaging socket and token. `ZDOTDIR` points at an
 *   empty directory, so no user rc file defines shell functions (in the
 *   owner's shell `fgos` and `codex` are zsh functions) or reorders `PATH`
 *   in the model's shell tool; auto-update is disabled for the run.
 * - The run directory is outside every git checkout, so a full-bypass agent
 *   cannot write the repository and no repository hook file loads.
 * - Before a run, no hook file other than the run's own may load.
 * - Codex runs with `auth.json` a symlink to the account's file and a
 *   working `codex login status` (scripts/lib/codex-auth-guard.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { isAuthLink } from './codex-auth-guard.mjs';

/** A refused run; `code` is the exit status the caller should use. */
export class LiveCliError extends Error {
  constructor(message, code = 2) {
    super(message);
    this.code = code;
  }
}

/** The session-identity variables (fgos-identity ENV_ORDER). */
export const ID_VARS = ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'CLAUDE_CODE_SESSION_ID'];

/** Variables a test CLI must never inherit from its caller. */
export const REMOVED_VARS = [...ID_VARS, 'CLAUDECODE'];

/** The only variables a test CLI inherits from its caller. */
export const INHERITED_VARS = ['HOME', 'USER', 'LANG', 'TERM', 'XDG_RUNTIME_DIR', 'PATH'];

/** The owner's login shell; the model's shell tool starts it. */
const SHELL = '/usr/bin/zsh';

/**
 * The allowlisted environment of a test CLI: the inherited variables, the
 * owner's shell with `ZDOTDIR` at `zdotdir` (created empty when missing,
 * refused when it holds anything), auto-update off, `pathPrefix` in front
 * of `PATH`, and `extra` last.
 */
export function cliEnv({ zdotdir, pathPrefix = null, extra = {} }) {
  fs.mkdirSync(zdotdir, { recursive: true });
  if (fs.readdirSync(zdotdir).length) throw new LiveCliError(`${zdotdir} is not empty; no rc file may load`);
  const env = {};
  for (const name of INHERITED_VARS) if (process.env[name] !== undefined) env[name] = process.env[name];
  if (pathPrefix) env.PATH = `${pathPrefix}:${env.PATH ?? ''}`;
  Object.assign(env, { SHELL, ZDOTDIR: zdotdir, DISABLE_AUTOUPDATER: '1' }, extra);
  for (const name of REMOVED_VARS) if (name in env) throw new LiveCliError(`${name} is set in the child environment`);
  return env;
}

/** Refuses a directory inside a git checkout. */
export function assertOutsideCheckout(dir) {
  for (let at = dir; at !== path.dirname(at); at = path.dirname(at)) {
    if (fs.existsSync(path.join(at, '.git'))) throw new LiveCliError(`${dir} is inside a git checkout (${at})`);
  }
}

/** A value of the owner's interactive zsh (the account tables live there). */
export function zshValue(expr) {
  return execFileSync('zsh', ['-ic', `print -r -- ${expr}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** The home directory of `account` for `cli` (codex or agy). */
export function accountHome(cli, account) {
  const table = cli === 'codex' ? 'CODEX_ACCOUNTS' : 'AGY_ACCOUNTS';
  const home = zshValue(`\${${table}[${account}]}`);
  if (!home || !fs.existsSync(home)) throw new LiveCliError(`${table}[${account}] does not name a directory`);
  return home;
}

/** Every account name of the owner's tables, `account` first. */
export function accountNames(account) {
  const names = new Set([account]);
  for (const table of ['CODEX_ACCOUNTS', 'AGY_ACCOUNTS']) {
    for (const name of zshValue(`\${(k)${table}}`).split(/\s+/)) if (name) names.add(name);
  }
  return [...names];
}

/** `<cli> --version` under `env`, trimmed; empty when it fails. */
export function cliVersion(cli, env) {
  const out = spawnSync(cli, ['--version'], { encoding: 'utf8', env });
  return (out.stdout || '').trim();
}

/**
 * Refuses a run in which a hook file other than the run's own would load:
 * Claude Code's managed policy settings (which `--setting-sources` cannot
 * exclude) and agy's account-level hook files under `home`.
 */
export function hookPreflight(cli, home) {
  if (cli === 'claude') {
    for (const file of ['/etc/claude-code/managed-settings.json', '/Library/Application Support/ClaudeCode/managed-settings.json']) {
      if (fs.existsSync(file) && /"hooks"/.test(fs.readFileSync(file, 'utf8'))) {
        throw new LiveCliError(`${file} declares hooks that would fire during the run`);
      }
    }
  }
  if (cli === 'agy') {
    const found = [path.join(home, '.agents', 'hooks.json')].filter((f) => fs.existsSync(f));
    const gemini = path.join(home, '.gemini');
    if (fs.existsSync(gemini)) {
      for (const entry of fs.readdirSync(gemini, { recursive: true }).map(String)) {
        if (path.basename(entry) === 'hooks.json') found.push(path.join(gemini, entry));
      }
    }
    if (found.length) throw new LiveCliError(`account-level agy hook files would load: ${found.join(', ')}`);
  }
}

/**
 * The print-mode Claude Code argv: only the `settings` file loads (the
 * workspace has no project settings), haiku, every permission skipped.
 */
export function claudeArgs({ settings, prompt, sessionId = null, extra = [] }) {
  return [
    '-p', '--model', 'haiku', '--dangerously-skip-permissions', '--setting-sources', 'project',
    '--settings', settings,
    ...(sessionId ? ['--session-id', sessionId] : []),
    ...extra,
    prompt,
  ];
}

/**
 * A Codex home for one run at `home`: `auth.json` a symlink to
 * `accountAuth`, hooks enabled, the workspace `ws` trusted, `hooks` as its
 * hooks.json.
 */
export function makeCodexHome({ home, accountAuth, ws, hooks }) {
  fs.mkdirSync(home, { recursive: true });
  fs.symlinkSync(accountAuth, path.join(home, 'auth.json'));
  fs.writeFileSync(path.join(home, 'config.toml'),
    `model_reasoning_effort = "low"\n\n[features]\nhooks = true\n\n[projects."${ws}"]\ntrust_level = "trusted"\n`);
  fs.writeFileSync(path.join(home, 'hooks.json'), `${JSON.stringify({ hooks }, null, 2)}\n`);
}

/** The `codex exec` argv for workspace `ws`. */
export function codexArgs({ ws, prompt }) {
  return ['exec', '--dangerously-bypass-hook-trust', '--dangerously-bypass-approvals-and-sandbox',
    '--skip-git-repo-check', '-C', ws, prompt];
}

/**
 * The Codex login guard: the run home's `auth.json` is still a symlink to
 * the account's file (a token refresh then lands in the real file, never in
 * a copy), and `codex login status` succeeds under `env`.
 */
export function codexAuthState({ home, accountAuth, env }) {
  const isLink = isAuthLink(path.join(home, 'auth.json'), accountAuth);
  const status = spawnSync('codex', ['login', 'status'], { env: { ...env, CODEX_HOME: home }, stdio: 'ignore' });
  return { isLink, loggedIn: status.status === 0 };
}
