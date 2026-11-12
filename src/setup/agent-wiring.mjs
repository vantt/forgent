// agent-wiring.mjs — the one place fgOS changes a person's own agent config (the Claude config dir,
// ~/.gemini, ...), run only by the opt-in `fgos wire-agents`. `fgos init`, `fgos setup` and
// `fgos doctor --fix` write only into the project and ~/.fgos; their doctor rows report what is
// missing here and name this command.
//
// The plan holds only agents present on the machine. A change lists every file it touches; each
// one that exists is copied to `<file>.pre-wire-agents-<time>` before anything writes it. A setting
// that widens what an agent may do (agy's `toolPermission: always-proceed`, Claude's
// `crossSessionInbound: accept`) is never written: the plan shows the file, the value and why, and
// the person decides.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { AGY_PERMISSIONS_DEFAULT, agySettingsPath, checkAgyPermissionsConfigured } from './agy-permissions.mjs';
import { claudeUserSettings, readAccept } from './mailbox-claude-accept.mjs';
import { mailboxOptIn } from './mailbox-limits.mjs';
import { firstOnPath } from './project-launcher.mjs';

export const WIRE_AGENTS_COMMAND = 'fgos wire-agents';

export const CLAUDE_PLUGIN_MARKETPLACE_NAME = 'fgos-plugins';
// The plugin marketplace is added by its GitHub source, never a local path: an installed payload
// does not ship `plugins/` or `.claude-plugin/`, so a local path works only from a checkout of this
// repository. The check accepts an entry under this name from any source.
const CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE = 'vantt/forgent';
export const CLAUDE_PLUGIN_REF = `fgOS@${CLAUDE_PLUGIN_MARKETPLACE_NAME}`;
const WINDOWS = process.platform === 'win32';

// The `claude` binary the check and this command run. Tests point FGOS_CLAUDE_COMMAND at a fake so
// no suite run ever calls the real `claude`; production leaves it unset.
function claudeCommand(env = process.env) {
  return env.FGOS_CLAUDE_COMMAND || 'claude';
}

function runClaude(args, env) {
  return execFileSync(claudeCommand(env), args, { encoding: 'utf8', env: { ...process.env, ...env }, shell: WINDOWS, stdio: ['ignore', 'pipe', 'pipe'] });
}

function claudePresent(env) {
  try {
    runClaude(['--version'], env);
    return true;
  } catch {
    return false;
  }
}

// `claude plugin marketplace list --json` and `claude plugin list --json` print a JSON array; a
// failed run or unparsable output is null.
function claudePluginJson(args, env) {
  try {
    const parsed = JSON.parse(runClaude(args, env));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const hasMarketplace = (marketplaces) => marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME);
const pluginEnabled = (plugins) => plugins.some((p) => typeof p?.id === 'string' && p.id.startsWith('fgOS@') && p.enabled === true);

/** Doctor row `claude-plugin-marketplace`: reports, never writes. A missing plugin is a choice the person may
 * make (global agent config is opt-in), so it warns and names `fgos wire-agents`; only a `claude` that
 * cannot answer its own plugin listing fails. */
export function checkClaudePluginMarketplace({ env = process.env } = {}) {
  if (!claudePresent(env)) return { passed: true, message: 'claude CLI not found on PATH — nothing to check (Claude Code plugin surface not applicable here)' };
  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json'], env);
  if (marketplaces === null) return { passed: false, message: '"claude plugin marketplace list --json" failed to run or parse' };
  if (!hasMarketplace(marketplaces)) {
    return { passed: true, message: `warning: Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" not configured, so the /fgOS:* plugin skills are missing; installing it is your choice: run ${WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)` };
  }
  const plugins = claudePluginJson(['plugin', 'list', '--json'], env);
  if (plugins === null) return { passed: false, message: '"claude plugin list --json" failed to run or parse' };
  if (!pluginEnabled(plugins)) {
    return { passed: true, message: `warning: fgOS Claude Code plugin not installed/enabled, so the /fgOS:* plugin skills are missing; installing it is your choice: run ${WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)` };
  }
  return { passed: true, message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" configured, fgOS plugin enabled` };
}

function claudeEntry(cwd, env, home) {
  const settings = claudeUserSettings({ env, home });
  const changes = [];
  const marketplaces = claudePluginJson(['plugin', 'marketplace', 'list', '--json'], env) ?? [];
  const plugins = claudePluginJson(['plugin', 'list', '--json'], env) ?? [];
  const steps = [
    ...(hasMarketplace(marketplaces) ? [] : [['plugin', 'marketplace', 'add', CLAUDE_PLUGIN_MARKETPLACE_GITHUB_SOURCE]]),
    ...(pluginEnabled(plugins) ? [] : [['plugin', 'install', CLAUDE_PLUGIN_REF]]),
  ];
  if (steps.length > 0) {
    changes.push({
      id: 'claude-plugin',
      what: `register the "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" plugin marketplace and install the fgOS plugin (the claude CLI also adds the plugin under ${path.join(settings.dir, 'plugins')})`,
      commands: steps.map((args) => `claude ${args.join(' ')}`),
      steps,
      files: [settings.file, path.join(settings.dir, 'plugins', 'known_marketplaces.json'), path.join(settings.dir, 'plugins', 'installed_plugins.json')],
    });
  }
  const permissions = [];
  if (mailboxOptIn(cwd).state === 'on') {
    const { state } = readAccept(settings.file);
    if (state !== 'accept' && state !== 'hold') {
      permissions.push({
        file: settings.file,
        set: { crossSessionInbound: 'accept' },
        why: 'the mailbox wakes an idle Claude session only when it accepts cross-session input; without it, mail waits for the session\'s next tool call or stop. Accepting it in this file lets any same-user process start a turn in every one of your Claude sessions; docs/platform/agent-mailbox/spec.md section 7.2 advises scoping it to one session with --settings instead',
        ...(state === 'unreadable' && { note: 'the file cannot be read as a JSON object; fix it by hand first' }),
      });
    }
  }
  return { agent: 'claude', changes, permissions };
}

function agyEntry(home) {
  const permissions = checkAgyPermissionsConfigured(home, { agyPresent: true }).configured
    ? []
    : [{
      file: agySettingsPath(home),
      set: AGY_PERMISSIONS_DEFAULT,
      why: 'agy run by fgOS under this HOME refuses every command in headless mode unless toolPermission is "always-proceed"; the deny list then refuses the listed commands. That lets agy run any other command without review, in your own agy sessions too',
    }];
  return { agent: 'agy', changes: [], permissions };
}

/**
 * What `fgos wire-agents` would change for the agents present on this machine, and the permissions
 * it leaves to the person. Reads only.
 * @returns {{ agents: Array<{agent: string, changes: object[], permissions: object[]}>, absent: string[], files: string[] }}
 */
export function planAgentWiring(cwd, { env = process.env, home = os.homedir() } = {}) {
  const agents = [];
  const absent = [];
  if (claudePresent(env)) agents.push(claudeEntry(cwd, env, home));
  else absent.push('claude');
  if (firstOnPath('agy', env.PATH) !== null) agents.push(agyEntry(home));
  else absent.push('agy');
  const files = [...new Set(agents.flatMap((a) => a.changes.flatMap((c) => c.files)))];
  return { agents, absent, files };
}

function backupStamp(now) {
  return now.toISOString().replace(/[-:.]/g, '');
}

/**
 * Applies every change of `plan`: first copies each existing file a change names to
 * `<file>.pre-wire-agents-<time>` (keeping its mode), then runs the change's steps in order. A
 * change whose backup fails runs nothing; a failing step stops its change and is reported.
 */
export function applyAgentWiring(plan, { env = process.env, now = new Date() } = {}) {
  const stamp = backupStamp(now);
  const backups = [];
  const done = [];
  const failed = [];
  for (const change of plan.agents.flatMap((a) => a.changes)) {
    try {
      for (const file of change.files) {
        if (!fs.existsSync(file)) continue;
        const backup = `${file}.pre-wire-agents-${stamp}`;
        fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
        backups.push({ file, backup });
      }
    } catch (err) {
      failed.push({ id: change.id, error: `backup failed, nothing changed: ${err.message}` });
      continue;
    }
    let stepFailed = false;
    for (const args of change.steps) {
      try {
        runClaude(args, env);
      } catch (err) {
        const detail = typeof err.stderr === 'string' && err.stderr.trim() ? err.stderr.trim() : err.message;
        failed.push({ id: change.id, error: `"claude ${args.join(' ')}" failed: ${detail}` });
        stepFailed = true;
        break;
      }
    }
    if (!stepFailed) done.push(change.id);
  }
  return { applied: true, backups, done, failed };
}

/** The text `fgos wire-agents` prints: the plan, or what it did. */
export function renderAgentWiringText(data) {
  const lines = [];
  const present = data.agents.map((a) => a.agent);
  lines.push(`fgOS global agent wiring (opt-in). Agents found: ${present.join(', ') || 'none'}${data.absent.length ? `; not found: ${data.absent.join(', ')}` : ''}.`);
  const changes = data.agents.flatMap((a) => a.changes.map((c) => ({ agent: a.agent, ...c })));
  if (changes.length === 0) lines.push('Nothing to change.');
  else {
    lines.push(data.applied ? 'Changes:' : 'Changes (run with --yes to apply; every file that exists is backed up first as <file>.pre-wire-agents-<time>):');
    for (const change of changes) {
      lines.push(`  ${change.agent}: ${change.what}`);
      for (const command of change.commands) lines.push(`    runs:    ${command}`);
      for (const file of change.files) lines.push(`    changes: ${file}`);
    }
  }
  const permissions = data.agents.flatMap((a) => a.permissions.map((p) => ({ agent: a.agent, ...p })));
  if (permissions.length > 0) {
    lines.push('Permissions fgOS never sets for you (edit the file yourself if you want them):');
    for (const p of permissions) {
      lines.push(`  ${p.agent}: ${p.file}`);
      lines.push(`    set: ${JSON.stringify(p.set)}`);
      lines.push(`    why: ${p.why}`);
      if (p.note) lines.push(`    note: ${p.note}`);
    }
  }
  if (data.applied) {
    for (const { file, backup } of data.backups) lines.push(`Backed up ${file} -> ${backup}`);
    for (const id of data.done) lines.push(`Done: ${id}`);
    for (const { id, error } of data.failed) lines.push(`Failed: ${id}: ${error}`);
  }
  return `${lines.join('\n')}\n`;
}
