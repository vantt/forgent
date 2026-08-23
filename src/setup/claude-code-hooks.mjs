// claude-code-hooks.mjs — infra layer: real `.claude/settings.json` I/O for
// wiring this repo's `PreToolUse` dispatch-decide enforcement (tsk-60f D1/D5)
// into a checkout. Same shape as `git-hooks.mjs`'s two entry points, one
// mechanism level up (Claude Code's own hook config, not git's):
//   - installClaudeCodeHook: the writer, used by `fgos setup` (bin/fgos.mjs).
//   - claudeCodeHookWired: the read-only check, used by `fgos doctor`
//     (src/setup/registrations.mjs) and by `fgos setup`'s own report of
//     what it did.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const HOOK_COMMAND_MARKER = 'dispatch-decide-hook.mjs';

function readSettings(settingsPath) {
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    return null; // malformed -- never a target this module writes to
  }
}

function hasDispatchDecideHook(settings) {
  const entries = settings?.hooks?.PreToolUse;
  if (!Array.isArray(entries)) return false;
  return entries.some(
    (entry) =>
      entry &&
      typeof entry.matcher === 'string' &&
      Array.isArray(entry.hooks) &&
      entry.hooks.some((h) => h && typeof h.command === 'string' && h.command.includes(HOOK_COMMAND_MARKER)),
  );
}

/**
 * Adds a `PreToolUse` entry wiring `scripts/dispatch-decide-hook.mjs` onto
 * every `Agent`/`Task` tool call, into `<repoRoot>/.claude/settings.json`.
 * FILL-ONLY, never overwrite (same contract `installGitHooks` already gives
 * `core.hooksPath`, and `config-merge.mjs`'s `mergeConfigDefaults` already
 * gives `.fgos/config.json`): every other key in `settings.json` — including
 * a pre-existing `hooks.SessionStart` entry — is left byte-for-byte
 * untouched; only a missing `hooks.PreToolUse` dispatch-decide entry is
 * added. Idempotent: safe to run repeatedly (every `fgos setup`). A
 * malformed existing `settings.json` is left alone entirely (`wired:
 * false, skippedExisting: 'malformed'`) rather than risk clobbering
 * whatever a person was mid-editing.
 *
 * Returns `{ wired, skippedExisting }`: `wired` is the FINAL state (`true`
 * whether freshly added or already present); `skippedExisting` names why a
 * write was declined (`'malformed'`), `null` otherwise.
 */
export function installClaudeCodeHook(repoRoot) {
  const settingsPath = path.join(repoRoot, '.claude', 'settings.json');
  const settings = readSettings(settingsPath);
  if (settings === null) return { wired: false, skippedExisting: 'malformed' };
  if (hasDispatchDecideHook(settings)) return { wired: true, skippedExisting: null };

  settings.hooks = settings.hooks && typeof settings.hooks === 'object' ? settings.hooks : {};
  const preToolUse = Array.isArray(settings.hooks.PreToolUse) ? settings.hooks.PreToolUse : [];
  preToolUse.push({
    matcher: 'Agent|Task',
    hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/scripts/dispatch-decide-hook.mjs"' }],
  });
  settings.hooks.PreToolUse = preToolUse;

  mkdirSync(path.dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  return { wired: true, skippedExisting: null };
}

/**
 * Whether `cwd`'s own `.claude/settings.json` already wires the
 * dispatch-decide `PreToolUse` hook — the tsk-60f D1 enforcement only
 * actually guards Agent/Task calls when this is wired. Never throws: a
 * missing or malformed `settings.json` reads the same as "not wired".
 */
export function claudeCodeHookWired(cwd) {
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  const settings = readSettings(settingsPath);
  if (settings === null) return false;
  return hasDispatchDecideHook(settings);
}
