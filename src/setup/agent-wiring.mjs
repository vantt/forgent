// agent-wiring.mjs — what the doctor row `claude-plugin-marketplace` reads of the Claude Code plugin
// surface. The opt-in `fgos wire-agents`, the one place fgOS changes a person's own agent config, runs in
// the host (apps/fgos/src/wiring/wire_agents.rs over packages/distribution/rust/src/agent_config.rs); the
// row only reports what is missing there and names that command.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const WIRE_AGENTS_COMMAND = 'fgos wire-agents';

export const CLAUDE_PLUGIN_MARKETPLACE_NAME = 'fgos-plugins';
export const CLAUDE_PLUGIN_REF = `fgOS@${CLAUDE_PLUGIN_MARKETPLACE_NAME}`;
const WINDOWS = process.platform === 'win32';
const execFileAsync = promisify(execFile);

// The `claude` binary the check runs. Tests point FGOS_CLAUDE_COMMAND at a fake so no suite run ever
// calls the real `claude`; production leaves it unset.
function claudeCommand(env = process.env) {
  return env.FGOS_CLAUDE_COMMAND || 'claude';
}

const hasMarketplace = (marketplaces) => marketplaces.some((m) => m?.name === CLAUDE_PLUGIN_MARKETPLACE_NAME);
const pluginEnabled = (plugins) => plugins.some((p) => typeof p?.id === 'string' && p.id.startsWith('fgOS@') && p.enabled === true);

/** `claude <args>` started without waiting: the doctor row asks `claude` three questions that do not depend
 * on one another, and each start-up costs about half a second. */
async function runClaudeAsync(args, env) {
  const { stdout } = await execFileAsync(claudeCommand(env), args, { encoding: 'utf8', env: { ...process.env, ...env }, shell: WINDOWS });
  return stdout;
}

// `claude plugin marketplace list --json` and `claude plugin list --json` print a JSON array; a failed run or
// unparsable output is null.
async function claudePluginJsonAsync(args, env) {
  try {
    const parsed = JSON.parse(await runClaudeAsync(args, env));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Doctor row `claude-plugin-marketplace`: reports, never writes. A missing plugin is a choice the person may
 * make (global agent config is opt-in), so it warns and names `fgos wire-agents`; only a `claude` that
 * cannot answer its own plugin listing fails. The three `claude` calls run together. */
export async function checkClaudePluginMarketplace({ env = process.env } = {}) {
  const [present, marketplaces, plugins] = await Promise.all([
    runClaudeAsync(['--version'], env).then(() => true, () => false),
    claudePluginJsonAsync(['plugin', 'marketplace', 'list', '--json'], env),
    claudePluginJsonAsync(['plugin', 'list', '--json'], env),
  ]);
  if (!present) return { passed: true, message: 'claude CLI not found on PATH — nothing to check (Claude Code plugin surface not applicable here)' };
  if (marketplaces === null) return { passed: false, message: '"claude plugin marketplace list --json" failed to run or parse' };
  if (!hasMarketplace(marketplaces)) {
    return { passed: true, message: `warning: Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" not configured, so the /fgOS:* plugin skills are missing; installing it is your choice: run ${WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)` };
  }
  if (plugins === null) return { passed: false, message: '"claude plugin list --json" failed to run or parse' };
  if (!pluginEnabled(plugins)) {
    return { passed: true, message: `warning: fgOS Claude Code plugin not installed/enabled, so the /fgOS:* plugin skills are missing; installing it is your choice: run ${WIRE_AGENTS_COMMAND} (opt-in: it changes your Claude config, backs it up first)` };
  }
  return { passed: true, message: `Claude Code marketplace "${CLAUDE_PLUGIN_MARKETPLACE_NAME}" configured, fgOS plugin enabled` };
}
