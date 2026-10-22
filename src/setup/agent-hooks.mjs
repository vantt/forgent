// agent-hooks.mjs — multi-agent hook installer, repair, and runnable doctor checks
// for Claude Code, Codex CLI, AGY (Antigravity CLI), OMP, and Pi.
//
// Rules & Invariants:
// 1. Project-only: writes strictly inside the project root (.claude/, .codex/, .agents/, .omp/, .pi/).
//    Never mutates home directory configs (~/.claude, ~/.codex, ~/.gemini, ~/.omp, ~/.pi).
// 2. Canonical door: all commands point to the project-local stable shim:
//    `${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos` or `.fgos/installation/bin/fgos`.
// 3. Fill-only & Preservation: preserves other keys, custom hooks, and unrelated user settings.
// 4. Exact Migration: migrates historical fgOS commands (node .../scripts/...-hook.mjs) without
//    rewriting user custom hooks.
// 5. Runnable Probe: doctor checks verify both configuration presence AND that the shim is runnable
//    with benign input via non-shell spawnSync with finite timeout.

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const SUPPORTED_AGENTS = ['claude', 'codex', 'agy', 'omp', 'pi'];

export const HOOK_KINDS = {
  DISPATCH: 'dispatch-decide',
  DECISION: 'decision-question',
  MAILBOX: 'mailbox',
};

function readJsonSafe(filePath) {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null; // malformed JSON
  }
}

function writeJsonPretty(filePath, data) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function getProjectShimPath(repoRoot) {
  return path.join(repoRoot, '.fgos', 'installation', 'bin', 'fgos');
}

/** The shim as a shell command: an absolute, single-quoted path, so it runs whatever directory the
 * agent starts the hook in (agy runs it outside the project; codex uses the session directory). */
function shimCommand(repoRoot, args) {
  let root = path.resolve(repoRoot);
  try { root = realpathSync(root); } catch { /* not created yet: the resolved path is what there is */ }
  const shim = getProjectShimPath(root).replace(/'/g, `'\\''`);
  return `'${shim}' ${args}`;
}

/** The shim path forms an fgOS hook command starts with: single-quoted absolute (the codex and agy
 * form, `'\''` escapes inside), the Claude Code project variable form, or an older bare path. */
const SHIM_PREFIX = String.raw`(?:'(?:[^']|'\\'')*\/\.fgos\/installation\/bin\/fgos'|"\$\{CLAUDE_PROJECT_DIR\}\/\.fgos\/installation\/bin\/fgos"|(?:[^\s'"]*\/)?\.fgos\/installation\/bin\/fgos)`;

/** Whether `command` runs the project shim's `hook <kind>` with exactly this row's arguments (agy
 * format, mailbox `--cli`/`--event`), judged from the start of the command, so a user hook that only
 * mentions our arguments (`bash -c '…; echo hook mailbox …'`) or a wrapper with another prefix never
 * reads as ours. Assumes a POSIX shell runs the command. */
function commandIsKind(command, row) {
  if (typeof command !== 'string') return false;
  const args = `hook ${row.kind}${row.args ? ` ${row.args}` : ''}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${SHIM_PREFIX} ${args}(?: --format=agy)?\\s*$`).test(command);
}

export function isShimRunnable(repoRoot, { mailboxCli = null } = {}) {
  const shim = getProjectShimPath(repoRoot);
  if (!existsSync(shim)) return { runnable: false, reason: 'shim-missing' };
  // Probe the way an agent calls the hook: from a fresh process, not as a
  // child of the host that runs doctor. The host's recursion guard would
  // otherwise make the nested shim refuse and every probe read as broken.
  const env = { ...process.env };
  delete env.FGOS_RUST_HOST_RECURSION_GUARD;
  const probes = [{ kind: HOOK_KINDS.DISPATCH, args: ['hook', 'dispatch-decide'], quietStdout: false }];
  // The mailbox kind with benign input: `{}` is no payload of any CLI, so the hook stays quiet, opens
  // no record and writes nothing; it must exit 0 with nothing on stdout.
  if (mailboxCli) probes.push({ kind: `${HOOK_KINDS.MAILBOX} (${mailboxCli})`, args: ['hook', 'mailbox', '--cli', mailboxCli, '--event', 'post-tool-use'], quietStdout: true });
  for (const probe of probes) {
    try {
      const res = spawnSync(shim, probe.args, { input: '{}', timeout: 3000, env, cwd: repoRoot });
      if (res.status !== 0) return { runnable: false, reason: `${probe.kind}: exit-${res.status}` };
      if (probe.quietStdout && res.stdout?.length) return { runnable: false, reason: `${probe.kind}: printed on stdout` };
    } catch (err) {
      return { runnable: false, reason: `${probe.kind}: ${err.message}` };
    }
  }
  return { runnable: true, reason: null };
}

// ---------------------------------------------------------------------------
// 1-3. The hook table: Claude Code, Codex CLI and AGY (JSON hook files)
// ---------------------------------------------------------------------------

const CLAUDE_SHIM = '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"';

/**
 * Every fgOS hook a JSON hook file carries, one row per (cli, kind, event): the file, where the row
 * lives (`hooks.<Event>` entries, or an agy named group), its matcher (null: the entry has none), and
 * its command. The installers and checks of these three CLIs read only this table (spec §7.1).
 * `legacyMarkers` name older fgOS commands an install migrates in place.
 */
const hookRows = (repoRoot) => [
  { cli: 'claude', kind: HOOK_KINDS.DISPATCH, event: 'PreToolUse', matcher: 'Agent|Task', command: `${CLAUDE_SHIM} hook dispatch-decide`, legacyMarkers: ['dispatch-decide-hook.mjs'] },
  { cli: 'claude', kind: HOOK_KINDS.DECISION, event: 'PreToolUse', matcher: 'AskUserQuestion', command: `${CLAUDE_SHIM} hook decision-question`, legacyMarkers: ['decision-question-hook.mjs'] },
  { cli: 'codex', kind: HOOK_KINDS.DISPATCH, event: 'PreToolUse', matcher: '.*', command: shimCommand(repoRoot, 'hook dispatch-decide') },
  { cli: 'codex', kind: HOOK_KINDS.DECISION, event: 'PreToolUse', matcher: 'RequestUserInput|ask.*', command: shimCommand(repoRoot, 'hook decision-question') },
  { cli: 'agy', kind: HOOK_KINDS.DISPATCH, event: 'PreToolUse', group: 'fgos-dispatch-guard', matcher: '.*', command: shimCommand(repoRoot, 'hook dispatch-decide --format=agy'), timeout: 10 },
  { cli: 'agy', kind: HOOK_KINDS.DECISION, event: 'PreToolUse', group: 'fgos-decision-guard', matcher: 'ask.*|AskUserQuestion', command: shimCommand(repoRoot, 'hook decision-question --format=agy'), timeout: 10 },
];

const HOOK_FILES = {
  claude: { file: path.join('.claude', 'settings.json'), label: '.claude/settings.json', name: 'Claude Code', optional: false },
  codex: { file: path.join('.codex', 'hooks.json'), label: '.codex/hooks.json', name: 'Codex CLI', optional: true, dir: '.codex' },
  agy: { file: path.join('.agents', 'hooks.json'), label: '.agents/hooks.json', name: 'AGY', optional: true, dir: '.agents' },
};

function rowsOf(repoRoot, cli) {
  return hookRows(repoRoot).filter((row) => row.cli === cli);
}

/** Whether a hook object is this row's: its exact command, an older fgOS command (legacy marker),
 * or the shim running exactly this row's kind and arguments. */
function isOwnedHook(hook, row) {
  const command = hook?.command;
  if (typeof command !== 'string') return false;
  if (command === row.command) return true;
  if ((row.legacyMarkers ?? []).some((marker) => command.includes(marker))) return true;
  return commandIsKind(command, row);
}

function hookObject(row) {
  return { type: 'command', command: row.command, ...(row.timeout ? { timeout: row.timeout } : {}) };
}

function entryFor(row) {
  return { ...(row.matcher !== null ? { matcher: row.matcher } : {}), hooks: [hookObject(row)] };
}

const sameMatcher = (entry, row) => (row.matcher === null ? entry?.matcher === undefined : entry?.matcher === row.matcher);

/** Puts one nested row into `hooks.<Event>`. Only our hook object is replaced, never the entry it
 * sits in, so a user hook beside it stays; an entry in another shape (no `hooks` array) is left as it
 * is. Returns whether anything changed. */
function installNestedRow(hooks, row) {
  const entries = Array.isArray(hooks[row.event]) ? hooks[row.event] : [];
  hooks[row.event] = entries;
  const wanted = hookObject(row);
  const at = entries.findIndex((e) => Array.isArray(e?.hooks) && e.hooks.some((h) => isOwnedHook(h, row)));
  if (at >= 0) {
    const entry = entries[at];
    const index = entry.hooks.findIndex((h) => isOwnedHook(h, row));
    if (sameMatcher(entry, row)) {
      if (JSON.stringify(entry.hooks[index]) === JSON.stringify(wanted)) return false;
      entry.hooks[index] = wanted;
      return true;
    }
    entry.hooks.splice(index, 1);
    if (entry.hooks.length === 0) {
      entries[at] = entryFor(row);
      return true;
    }
  }
  entries.push(entryFor(row));
  return true;
}

/** Puts one agy row into its named group, as agy reads them. */
function installGroupRow(config, row) {
  const existing = config[row.group];
  const isMatching =
    existing &&
    existing.enabled !== false &&
    Array.isArray(existing[row.event]) &&
    existing[row.event].some((g) => g?.matcher === row.matcher && g?.hooks?.some((h) => h?.command === row.command));
  if (isMatching) return false;
  config[row.group] = { enabled: true, [row.event]: [{ matcher: row.matcher, hooks: [hookObject(row)] }] };
  return true;
}

function installRows(repoRoot, cli) {
  const spec = HOOK_FILES[cli];
  const filePath = path.join(repoRoot, spec.file);
  const config = readJsonSafe(filePath);
  if (config === null) return { wired: false, skippedExisting: 'malformed' };
  let changed = false;
  for (const row of rowsOf(repoRoot, cli)) {
    if (row.group) {
      changed = installGroupRow(config, row) || changed;
    } else {
      config.hooks = config.hooks && typeof config.hooks === 'object' ? config.hooks : {};
      changed = installNestedRow(config.hooks, row) || changed;
    }
  }
  if (changed) writeJsonPretty(filePath, config);
  return { wired: true, skippedExisting: null };
}

/** Whether a row is in its file in the shape the CLI reads. */
function rowPresent(config, row) {
  if (row.group) {
    const group = config[row.group];
    return Boolean(group && group.enabled !== false && Array.isArray(group[row.event]) &&
      group[row.event].some((g) => g?.matcher === row.matcher && g?.hooks?.some((h) => h?.command === row.command)));
  }
  const entries = config?.hooks?.[row.event];
  return Array.isArray(entries) && entries.some((e) => sameMatcher(e, row) && Array.isArray(e?.hooks) &&
    e.hooks.some((h) => h?.type === 'command' && h?.command === row.command));
}

/** Whether a row's command sits in its event in a shape the CLI does not read (a flat hook object
 * instead of an entry with a `hooks` array): such a hook never runs. */
function rowInWrongShape(config, row) {
  const entries = row.group ? config?.[row.group]?.[row.event] : config?.hooks?.[row.event];
  return Array.isArray(entries) && entries.some((e) => !Array.isArray(e?.hooks) && e?.command === row.command);
}

function checkRows(cwd, cli) {
  const spec = HOOK_FILES[cli];
  const filePath = path.join(cwd, spec.file);
  if (spec.optional && !existsSync(path.join(cwd, spec.dir)) && !existsSync(filePath)) {
    return { passed: true, message: `${spec.name} hooks not required (no ${spec.dir}/ directory)` };
  }
  const config = readJsonSafe(filePath);
  if (config === null) return { passed: false, message: `${spec.label} exists but is malformed JSON` };
  const rows = rowsOf(cwd, cli);
  const missing = rows.filter((row) => !rowPresent(config, row));
  if (missing.length > 0) {
    const names = missing.map((row) => (row.group ?? (row.args ? `${row.kind} ${row.event}` : row.kind)));
    const shape = missing.filter((row) => rowInWrongShape(config, row)).map((row) => `${row.kind} ${row.event}`);
    const wrongShape = shape.length ? ` (in a shape ${spec.name} does not read: ${shape.join(', ')})` : '';
    return { passed: false, message: `${spec.label} missing canonical hook(s): ${[...new Set(names)].join(', ')}${wrongShape} — run fgos doctor --fix` };
  }
  const mailboxCli = rows.some((row) => row.kind === HOOK_KINDS.MAILBOX) ? cli : null;
  const probe = isShimRunnable(cwd, { mailboxCli });
  if (!probe.runnable) {
    return { passed: false, message: `${spec.name} hooks wired but local shim not runnable (${probe.reason})` };
  }
  return { passed: true, message: `${spec.name} hooks wired and verified runnable` };
}

export function installClaudeHook(repoRoot) {
  return installRows(repoRoot, 'claude');
}

/** Whether every Claude Code `PreToolUse` guard is present, in its canonical or an older fgOS form. */
export function isClaudeHookConfigured(cwd) {
  const settings = readJsonSafe(path.join(cwd, '.claude', 'settings.json'));
  if (settings === null) return false;
  const preToolUse = settings?.hooks?.PreToolUse;
  if (!Array.isArray(preToolUse)) return false;
  return rowsOf(cwd, 'claude').filter((row) => row.event === 'PreToolUse').every((row) =>
    preToolUse.some((entry) => entry?.matcher === row.matcher && Array.isArray(entry?.hooks) &&
      entry.hooks.some((h) => h?.type === 'command' && isOwnedHook(h, row))));
}

export function checkClaudeHook(cwd) {
  return checkRows(cwd, 'claude');
}

export function installCodexHook(repoRoot) {
  return installRows(repoRoot, 'codex');
}

export function checkCodexHook(cwd) {
  return checkRows(cwd, 'codex');
}

export function installAgyHook(repoRoot) {
  return installRows(repoRoot, 'agy');
}

export function checkAgyHook(cwd) {
  return checkRows(cwd, 'agy');
}

// ---------------------------------------------------------------------------
// 4. OMP (.omp/extensions/fgos-hooks.ts)
// ---------------------------------------------------------------------------

function generateInProcessExtensionSource() {
  return `// @ts-nocheck
// fgos-hooks.ts — managed fgOS guard extension
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export default function (api: any) {
  api.on('tool_call', async (event: any, ctx: any) => {
    try {
      const toolName = event?.toolName || '';
      const cwd = ctx?.cwd || process.cwd();
      const shim = path.join(cwd, '.fgos', 'installation', 'bin', 'fgos');

      if (toolName === 'task') {
        const res = spawnSync(shim, ['hook', 'dispatch-decide'], {
          input: JSON.stringify({
            tool_name: 'Task',
            tool_input: event?.input || {},
            cwd,
          }),
          encoding: 'utf8',
          timeout: 5000,
        });
        if (res.status === 2) {
          return { block: true, reason: res.stderr || 'Blocked by fgOS dispatch-decide guard' };
        }
      } else if (toolName === 'ask' || toolName === 'ask_question') {
        const res = spawnSync(shim, ['hook', 'decision-question'], {
          input: JSON.stringify({
            tool_name: 'AskUserQuestion',
            tool_input: {
              questions: [{ question: event?.input?.question, options: event?.input?.options }],
            },
            cwd,
          }),
          encoding: 'utf8',
          timeout: 5000,
        });
        if (res.status === 2) {
          return { block: true, reason: res.stderr || 'Blocked by fgOS decision-question guard' };
        }
      }
    } catch {
      // fail-open per fgOS hook policy
    }
  });
}
`;
}

export function installOmpHook(repoRoot) {
  const extPath = path.join(repoRoot, '.omp', 'extensions', 'fgos-hooks.ts');
  mkdirSync(path.dirname(extPath), { recursive: true });
  writeFileSync(extPath, generateInProcessExtensionSource(), 'utf8');
  return { wired: true, skippedExisting: null };
}

export function checkOmpHook(cwd) {
  const ompDir = path.join(cwd, '.omp');
  const extPath = path.join(ompDir, 'extensions', 'fgos-hooks.ts');
  if (!existsSync(ompDir) && !existsSync(extPath)) {
    return { passed: true, message: 'OMP hooks not required (no .omp/ directory)' };
  }

  if (!existsSync(extPath)) {
    return { passed: false, message: '.omp/extensions/fgos-hooks.ts not found — run fgos doctor --fix' };
  }
  const content = readFileSync(extPath, 'utf8');
  if (!content.includes('dispatch-decide') || !content.includes('decision-question')) {
    return { passed: false, message: '.omp/extensions/fgos-hooks.ts is missing guard handlers — run fgos doctor --fix' };
  }
  const probe = isShimRunnable(cwd);
  if (!probe.runnable) {
    return { passed: false, message: `OMP extension present but local shim not runnable (${probe.reason})` };
  }
  return { passed: true, message: 'OMP extension hook wired and verified runnable' };
}

// ---------------------------------------------------------------------------
// 5. Pi (.pi/extensions/fgos-hooks.ts)
// ---------------------------------------------------------------------------

export function installPiHook(repoRoot) {
  const extPath = path.join(repoRoot, '.pi', 'extensions', 'fgos-hooks.ts');
  mkdirSync(path.dirname(extPath), { recursive: true });
  writeFileSync(extPath, generateInProcessExtensionSource(), 'utf8');
  return { wired: true, skippedExisting: null };
}

export function checkPiHook(cwd) {
  const piDir = path.join(cwd, '.pi');
  const extPath = path.join(piDir, 'extensions', 'fgos-hooks.ts');
  if (!existsSync(piDir) && !existsSync(extPath)) {
    return { passed: true, message: 'Pi hooks not required (no .pi/ directory)' };
  }

  if (!existsSync(extPath)) {
    return { passed: false, message: '.pi/extensions/fgos-hooks.ts not found — run fgos doctor --fix' };
  }
  const content = readFileSync(extPath, 'utf8');
  if (!content.includes('dispatch-decide') || !content.includes('decision-question')) {
    return { passed: false, message: '.pi/extensions/fgos-hooks.ts is missing guard handlers — run fgos doctor --fix' };
  }
  const probe = isShimRunnable(cwd);
  if (!probe.runnable) {
    return { passed: false, message: `Pi extension present but local shim not runnable (${probe.reason})` };
  }
  return { passed: true, message: 'Pi extension hook wired and verified runnable' };
}

// ---------------------------------------------------------------------------
// Aggregate installer and checker
// ---------------------------------------------------------------------------

export function installAllAgentHooks(repoRoot) {
  const results = {
    claude: installClaudeHook(repoRoot),
    codex: installCodexHook(repoRoot),
    agy: installAgyHook(repoRoot),
    omp: installOmpHook(repoRoot),
    pi: installPiHook(repoRoot),
  };
  return results;
}

export function checkAllAgentHooks(cwd) {
  return {
    claude: checkClaudeHook(cwd),
    codex: checkCodexHook(cwd),
    agy: checkAgyHook(cwd),
    omp: checkOmpHook(cwd),
    pi: checkPiHook(cwd),
  };
}
