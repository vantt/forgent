// hook.mjs (dispatch) -- the verdict of the PreToolUse hook that guards Agent/Task calls: `decide` run FOR the
// caller, blocking unless the answer is `in-process`. The payload normalizer and the answer protocols of the
// agents live in src/runner/hook.mjs; this module judges one normalized call against the project's config.
//
// A failure of `decide` itself allows the call (the hook is an enforcement layer on top of a working dispatch
// surface, never a second point of failure for it). One failure blocks: a refusal of the project's config (a
// `config-*` refusal), because allowing the guarded call would let it bypass the rules the broken file
// declares; so does a project directory that does not exist, since no rule can be read from it.

import fs from 'node:fs';
import { decideExecutorCli, runDoorHint } from './decide.mjs';
import { isConfigRefusal } from '../../config/facade.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';

const AGENT_TOOL_NAMES = new Set(['Agent', 'Task', 'task']);

const isText = (value) => typeof value === 'string' && value.trim() !== '';

/** The refusal ids of a config refusal (never a value: a refusal message carries ids, files and positions only), or null for any other failure. */
function configRefusalText(err) {
  if (isConfigRefusal(err)) return err.message;
  if (err instanceof RunnerConfigError && typeof err.code === 'string' && err.code.startsWith('config-')) return err.code;
  return null;
}

const isDirectory = (dir) => {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
};

const allow = Object.freeze({ blocked: false });
const block = (reason) => ({ blocked: true, reason });

/**
 * The verdict for an Agent/Task call: `decide` run FOR the caller (a live call is by definition need-soul and
 * has-live-task-access), blocking unless the answer is `in-process`.
 */
export async function decideDispatchHook(call, { decide = decideExecutorCli } = {}) {
  if (!AGENT_TOOL_NAMES.has(call.toolName)) return allow;
  const subagentType = [call.toolInput.subagent_type, call.toolInput.agent].find(isText) ?? 'general-purpose';
  if (!isDirectory(call.projectDir)) {
    return block(`this ${call.toolName} call cannot be routed because the project directory "${call.projectDir}" does not exist; set CLAUDE_PROJECT_DIR (or start the hook inside the project) and retry.`);
  }
  let decided;
  try {
    decided = await decide(undefined, { cwd: call.projectDir, for: subagentType, needsSoul: true, hasLiveTaskAccess: true });
  } catch (err) {
    const refusal = configRefusalText(err);
    return refusal === null
      ? allow
      : block(`this ${call.toolName} call cannot be routed because the config is unusable: ${refusal}. Run \`fgos config check\` to list every refusal with its fix, correct the file, then retry.`);
  }
  if (decided.mechanism === 'in-process') return allow;
  const runDoor = runDoorHint({ cwd: call.projectDir, executorId: decided.executorId, capability: subagentType });
  return block(
    `this ${call.toolName} call resolves to out-of-process dispatch (no native in-process handler for "${subagentType}"). ` +
      `Run it through ${runDoor} instead of calling this tool directly -- it runs the task as one unit and hands back the real result. ` +
      `(decided via: decide --for "${subagentType}" --needs-soul --has-live-task-access)`,
  );
}

