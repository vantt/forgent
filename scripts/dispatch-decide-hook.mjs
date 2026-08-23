#!/usr/bin/env node
// dispatch-decide-hook.mjs -- PreToolUse hook enforcing tsk-60f D1/D5: every
// Agent/Task-tool call must go through `dispatch.mjs decide` first. Runs
// `decide` FOR the caller (never checks "did the agent already call decide"
// -- that needs fragile per-turn state, D5) and blocks only when the answer
// comes back anything other than `in-process`. A live Agent/Task call is by
// definition need-soul + has-live-task-access, so the hook always passes
// both signals -- it never has to guess.
//
// Calls `decideExecutorCli` directly, in-process (same "the skill already
// self-knows its own tool manifest" pattern `fgos-session-start-hook.mjs`
// already uses for its own imports) -- never shells out to `dispatch.mjs`
// as a subprocess: that would force reconstructing dispatch.mjs's own file
// path from the resolved git root, which only happens to work when this
// hook fires from inside fgOS's own checkout (the common case here, but
// not a safe assumption for every future consumer, and needlessly brittle
// even here). `decideExecutorCli` already resolves the caller's own repo
// root from `cwd` internally -- one resolution, not two.
//
// NEVER hangs the caller on a `decide` hiccup: any failure to read/parse
// stdin or run `decide` itself fails OPEN (exit 0) -- this hook is an
// enforcement layer on TOP of a working dispatch surface, never a second
// point of failure for it (same fail-open discipline
// `~/.claude/hooks/scout-block.cjs` already uses for its own unexpected
// errors).

import fs from 'node:fs';
import { decideExecutorCli } from '../src/runner/dispatch.mjs';

const AGENT_TOOL_NAMES = new Set(['Agent', 'Task']);

async function decideBlock() {
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw || !raw.trim()) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const toolName = data.tool_name;
  if (!AGENT_TOOL_NAMES.has(toolName)) return null;

  const toolInput = data.tool_input && typeof data.tool_input === 'object' ? data.tool_input : {};
  const subagentType =
    typeof toolInput.subagent_type === 'string' && toolInput.subagent_type.trim() ? toolInput.subagent_type : 'general-purpose';

  const payloadCwd = typeof data.cwd === 'string' && data.cwd.trim() ? data.cwd : process.cwd();

  let decided;
  try {
    decided = await decideExecutorCli(undefined, { cwd: payloadCwd, for: subagentType, needsSoul: true, hasLiveTaskAccess: true });
  } catch {
    return null;
  }

  if (decided.mechanism === 'in-process') return null;
  return { toolName, subagentType };
}

let blocked = null;
try {
  blocked = await decideBlock();
} catch {
  blocked = null; // fail-open -- see file header
}

if (blocked) {
  process.stderr.write(
    `BLOCKED: this ${blocked.toolName} call resolves to out-of-process dispatch (no native in-process handler for "${blocked.subagentType}"). ` +
      'Run `node src/runner/dispatch.mjs execute` instead of calling this tool directly -- it self-executes and hands back the real result. ' +
      `(decided via: decide --for "${blocked.subagentType}" --needs-soul --has-live-task-access)\n`,
  );
  process.exit(2);
}
process.exit(0);
