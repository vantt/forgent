// dispatch/cli.mjs — the seat argv and persona helpers the Work runner and the assignment runner share. Every
// `fgos dispatch` sub-command is served by the native host; this module holds no CLI door.

import path from 'node:path';
import fs from 'node:fs';

import { commandCli } from './provider-capacity.mjs';

export { watchWritesOutsideWorkspace, strayWriteWarning } from '../../run-supervisor/stray-writes.mjs';

// Work-driven dispatch (`spawnWorker`, the executor a Work item's step resolves to) lives in
// the Work layer, src/runner/work-dispatch.mjs; this module takes what that layer resolved.

/**
 * Resolve persona/agentType for a given taskSpec header & list of registered agent-types (D20/D21/D22/D32).
 * Tie-break priority (D32):
 * 1. Task-spec declares `agent:` pin -> wins immediately, skipping skill-matching.
 * 2. No pin -> if `currentAgentType` matches all `requires-skill`, stay with `currentAgentType`.
 * 3. Otherwise -> select deterministically by declaration order (first matching agent-type in `agentDefs`).
 */
export function resolveAgentTypeForTaskSpec(taskSpecHeader, agentDefs = [], currentAgentType = null) {
  if (!taskSpecHeader) return null;

  const pinnedAgents = Array.isArray(taskSpecHeader.agent)
    ? taskSpecHeader.agent
    : typeof taskSpecHeader.agent === 'string' && taskSpecHeader.agent.trim()
      ? [taskSpecHeader.agent.trim()]
      : [];

  if (pinnedAgents.length > 0) {
    const found = agentDefs.find((a) => pinnedAgents.includes(a.name));
    return found ? found.name : null;
  }

  const requiredSkills = Array.isArray(taskSpecHeader['requires-skill'])
    ? taskSpecHeader['requires-skill']
    : typeof taskSpecHeader['requires-skill'] === 'string' && taskSpecHeader['requires-skill'].trim()
      ? [taskSpecHeader['requires-skill'].trim()]
      : [];

  if (requiredSkills.length === 0) {
    return null;
  }

  if (currentAgentType) {
    const currentDef = agentDefs.find((a) => a.name === currentAgentType);
    if (currentDef && Array.isArray(currentDef.skills)) {
      const hasAllSkills = requiredSkills.every((s) => currentDef.skills.includes(s));
      if (hasAllSkills) return currentAgentType;
    }
  }

  const matching = agentDefs.find(
    (a) => Array.isArray(a.skills) && requiredSkills.every((s) => a.skills.includes(s)),
  );
  if (matching) return matching.name;

  return null;
}


/**
 * Claude asks the human before touching a path outside its working directories, and no human answers a
 * seat. A seat's run directory lives under the store, outside its cwd (its worktree), so claude is told
 * which directories it may use. This is claude's own prompt; the OS-level posture is unchanged.
 *
 * - A claude REPL in a herdr pane is briefed with a pointer to a file in the run directory and writes its
 *   outbox there. Blind inputs are copied to assignmentDir/inputs, beside runs/NN, so it gets only that
 *   directory (when present), the run directory and the parents of settled sibling reports.
 * - A headless claude (cli-spawn) is handed its brief as the prompt and writes only its outbox, so it gets
 *   that one directory (`outboxDir`) and nothing else.
 *
 * Writing there also needs the executor's permission mode (`acceptEdits`); a directory grant alone is refused.
 */
export function withRunDirAccess({ adapter, interactiveMode, command, args, runDir, outboxDir }) {
  if (!Array.isArray(args)) return args;
  if (adapter === 'cli-spawn') {
    if (commandCli(command) !== 'claude' || !outboxDir) return args;
    return withAddDirs(args, [path.resolve(outboxDir)]);
  }
  if (adapter !== 'herdr-spawn' || interactiveMode?.kind !== 'claude' || !runDir) return args;
  const run = path.resolve(runDir);
  const inputs = path.join(path.dirname(path.dirname(run)), 'inputs');
  const directories = [run, ...(fs.existsSync(inputs) ? [inputs] : [])];
  // Non-blind handoffs point at settled sibling reports, not copied inputs.
  const assignmentFile = path.join(path.dirname(path.dirname(run)), 'assignment.json');
  if (fs.existsSync(assignmentFile)) {
    const { contextRefs = [] } = JSON.parse(fs.readFileSync(assignmentFile, 'utf8'));
    for (const ref of contextRefs) {
      if (typeof ref === 'string' && path.isAbsolute(ref) && fs.existsSync(ref) && fs.statSync(ref).isFile()) {
        const parent = path.dirname(fs.realpathSync(ref));
        if (!directories.includes(parent)) directories.push(parent);
      }
    }
  }
  return withAddDirs(args, directories);
}

// Operator-approved `--add-dir` entries stay after the granted ones.
function withAddDirs(args, directories) {
  const existing = args.indexOf('--add-dir');
  return existing < 0
    ? [...args, '--add-dir', ...directories]
    : [...args.slice(0, existing + 1), ...directories, ...args.slice(existing + 1)];
}

/**
 * The directories an argv grants with `--add-dir` (variadic: its values run to the next option). claude
 * asks for folder trust on each of them, so a pane that is given them must trust them first.
 */
export function addDirsOf(args) {
  if (!Array.isArray(args)) return [];
  const dirs = [];
  let variadic = false;
  for (const value of args) {
    if (typeof value !== 'string') { variadic = false; continue; }
    if (value === '--add-dir') { variadic = true; continue; }
    if (value.startsWith('--add-dir=')) { dirs.push(value.slice('--add-dir='.length)); variadic = false; continue; }
    if (value.startsWith('-')) { variadic = false; continue; }
    if (variadic) dirs.push(value);
  }
  return dirs;
}
