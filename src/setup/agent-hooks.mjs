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

/** Whether a hook command is the given fgOS hook kind, judged by the arguments after the shim path
 * (the project path itself may contain a kind's name). Assumes a POSIX shell runs the command. */
function commandIsKind(command, kind) {
  return typeof command === 'string' && new RegExp(`\\bhook ${kind}( --format=agy)?\\s*$`).test(command);
}

export function isShimRunnable(repoRoot) {
  const shim = getProjectShimPath(repoRoot);
  if (!existsSync(shim)) return { runnable: false, reason: 'shim-missing' };
  try {
    // Probe the way an agent calls the hook: from a fresh process, not as a
    // child of the host that runs doctor. The host's recursion guard would
    // otherwise make the nested shim refuse and every probe read as broken.
    const env = { ...process.env };
    delete env.FGOS_RUST_HOST_RECURSION_GUARD;
    const res = spawnSync(shim, ['hook', 'dispatch-decide'], {
      input: '{}',
      timeout: 3000,
      env,
    });
    if (res.status === 0) return { runnable: true, reason: null };
    return { runnable: false, reason: `exit-${res.status}` };
  } catch (err) {
    return { runnable: false, reason: err.message };
  }
}

// ---------------------------------------------------------------------------
// 1. Claude Code (.claude/settings.json)
// ---------------------------------------------------------------------------

const CLAUDE_HOOKS = [
  {
    kind: HOOK_KINDS.DISPATCH,
    matcher: 'Agent|Task',
    canonicalCommand: '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook dispatch-decide',
    legacyMarkers: ['dispatch-decide-hook.mjs'],
  },
  {
    kind: HOOK_KINDS.DECISION,
    matcher: 'AskUserQuestion',
    canonicalCommand: '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook decision-question',
    legacyMarkers: ['decision-question-hook.mjs'],
  },
];

function isClaudeOwnedHook(commandStr, hookSpec) {
  if (typeof commandStr !== 'string') return false;
  if (commandStr === hookSpec.canonicalCommand) return true;
  return hookSpec.legacyMarkers.some((marker) => commandStr.includes(marker));
}

export function installClaudeHook(repoRoot) {
  const settingsPath = path.join(repoRoot, '.claude', 'settings.json');
  const settings = readJsonSafe(settingsPath);
  if (settings === null) return { wired: false, skippedExisting: 'malformed' };

  settings.hooks = settings.hooks && typeof settings.hooks === 'object' ? settings.hooks : {};
  let preToolUse = Array.isArray(settings.hooks.PreToolUse) ? settings.hooks.PreToolUse : [];

  let changed = false;

  for (const hookSpec of CLAUDE_HOOKS) {
    let foundIndex = -1;
    for (let i = 0; i < preToolUse.length; i++) {
      const entry = preToolUse[i];
      if (entry && Array.isArray(entry.hooks) && entry.hooks.some((h) => isClaudeOwnedHook(h?.command, hookSpec))) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex >= 0) {
      // Migrate / canonicalize existing owned entry
      const existing = preToolUse[foundIndex];
      const needsUpdate =
        existing.matcher !== hookSpec.matcher ||
        !existing.hooks.some((h) => h?.command === hookSpec.canonicalCommand);

      if (needsUpdate) {
        preToolUse[foundIndex] = {
          matcher: hookSpec.matcher,
          hooks: [{ type: 'command', command: hookSpec.canonicalCommand }],
        };
        changed = true;
      }
    } else {
      // Append missing
      preToolUse.push({
        matcher: hookSpec.matcher,
        hooks: [{ type: 'command', command: hookSpec.canonicalCommand }],
      });
      changed = true;
    }
  }

  if (changed) {
    settings.hooks.PreToolUse = preToolUse;
    writeJsonPretty(settingsPath, settings);
  }
  return { wired: true, skippedExisting: null };
}

export function isClaudeHookConfigured(cwd) {
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  const settings = readJsonSafe(settingsPath);
  if (settings === null) return false;
  const preToolUse = settings?.hooks?.PreToolUse;
  if (!Array.isArray(preToolUse)) return false;
  return CLAUDE_HOOKS.every((hookSpec) =>
    preToolUse.some(
      (entry) =>
        entry?.matcher === hookSpec.matcher &&
        Array.isArray(entry?.hooks) &&
        entry.hooks.some(
          (h) =>
            h?.type === 'command' &&
            (h?.command === hookSpec.canonicalCommand || isClaudeOwnedHook(h?.command, hookSpec)),
        ),
    ),
  );
}

export function checkClaudeHook(cwd) {
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  const settings = readJsonSafe(settingsPath);
  if (settings === null) {
    return { passed: false, message: '.claude/settings.json exists but is malformed JSON' };
  }
  const preToolUse = settings?.hooks?.PreToolUse;
  if (!Array.isArray(preToolUse)) {
    return { passed: false, message: '.claude/settings.json has no PreToolUse hooks registered — run fgos doctor --fix' };
  }

  const missing = [];
  for (const hookSpec of CLAUDE_HOOKS) {
    const hasCanonical = preToolUse.some(
      (entry) =>
        entry?.matcher === hookSpec.matcher &&
        Array.isArray(entry?.hooks) &&
        entry.hooks.some((h) => h?.type === 'command' && h?.command === hookSpec.canonicalCommand),
    );
    if (!hasCanonical) {
      missing.push(hookSpec.kind);
    }
  }

  if (missing.length > 0) {
    return { passed: false, message: `.claude/settings.json missing canonical hook(s): ${missing.join(', ')} — run fgos doctor --fix` };
  }

  // Runnable probe
  const probe = isShimRunnable(cwd);
  if (!probe.runnable) {
    return { passed: false, message: `Claude Code hooks wired but local shim not runnable (${probe.reason})` };
  }

  return { passed: true, message: 'Claude Code hooks wired and verified runnable' };
}

// ---------------------------------------------------------------------------
// 2. Codex CLI (.codex/hooks.json)
// ---------------------------------------------------------------------------

const codexHooks = (repoRoot) => [
  {
    kind: HOOK_KINDS.DISPATCH,
    matcher: '.*',
    canonicalCommand: shimCommand(repoRoot, 'hook dispatch-decide'),
  },
  {
    kind: HOOK_KINDS.DECISION,
    matcher: 'RequestUserInput|ask.*',
    canonicalCommand: shimCommand(repoRoot, 'hook decision-question'),
  },
];

export function installCodexHook(repoRoot) {
  const hooksPath = path.join(repoRoot, '.codex', 'hooks.json');
  const config = readJsonSafe(hooksPath);
  if (config === null) return { wired: false, skippedExisting: 'malformed' };

  config.hooks = config.hooks && typeof config.hooks === 'object' ? config.hooks : {};
  let preToolUse = Array.isArray(config.hooks.PreToolUse) ? config.hooks.PreToolUse : [];

  let changed = false;
  for (const hookSpec of codexHooks(repoRoot)) {
    const idx = preToolUse.findIndex(
      (e) => Array.isArray(e?.hooks) && e.hooks.some((h) => commandIsKind(h?.command, hookSpec.kind)),
    );
    if (idx >= 0) {
      if (
        preToolUse[idx].matcher !== hookSpec.matcher ||
        !preToolUse[idx].hooks.some((h) => h?.command === hookSpec.canonicalCommand)
      ) {
        preToolUse[idx] = {
          matcher: hookSpec.matcher,
          hooks: [{ type: 'command', command: hookSpec.canonicalCommand }],
        };
        changed = true;
      }
    } else {
      preToolUse.push({
        matcher: hookSpec.matcher,
        hooks: [{ type: 'command', command: hookSpec.canonicalCommand }],
      });
      changed = true;
    }
  }

  if (changed) {
    config.hooks.PreToolUse = preToolUse;
    writeJsonPretty(hooksPath, config);
  }

  return { wired: true, skippedExisting: null };
}

export function checkCodexHook(cwd) {
  const codexDir = path.join(cwd, '.codex');
  const hooksPath = path.join(codexDir, 'hooks.json');
  if (!existsSync(codexDir) && !existsSync(hooksPath)) {
    return { passed: true, message: 'Codex CLI hooks not required (no .codex/ directory)' };
  }

  const config = readJsonSafe(hooksPath);
  if (config === null) {
    return { passed: false, message: '.codex/hooks.json exists but is malformed JSON' };
  }
  const preToolUse = config?.hooks?.PreToolUse;
  if (!Array.isArray(preToolUse)) {
    return { passed: false, message: '.codex/hooks.json has no PreToolUse hooks registered — run fgos doctor --fix' };
  }

  const missing = [];
  for (const hookSpec of codexHooks(cwd)) {
    const ok = preToolUse.some(
      (e) =>
        e?.matcher === hookSpec.matcher &&
        Array.isArray(e?.hooks) &&
        e.hooks.some((h) => h?.type === 'command' && h?.command === hookSpec.canonicalCommand),
    );
    if (!ok) missing.push(hookSpec.kind);
  }

  if (missing.length > 0) {
    return { passed: false, message: `.codex/hooks.json missing canonical hook(s): ${missing.join(', ')} — run fgos doctor --fix` };
  }

  const probe = isShimRunnable(cwd);
  if (!probe.runnable) {
    return { passed: false, message: `Codex hooks configured but local shim not runnable (${probe.reason})` };
  }

  return { passed: true, message: 'Codex CLI hooks wired and verified runnable' };
}

// ---------------------------------------------------------------------------
// 3. AGY (.agents/hooks.json)
// ---------------------------------------------------------------------------

const agyGroups = (repoRoot) => ({
  'fgos-dispatch-guard': {
    matcher: '.*',
    command: shimCommand(repoRoot, 'hook dispatch-decide --format=agy'),
  },
  'fgos-decision-guard': {
    matcher: 'ask.*|AskUserQuestion',
    command: shimCommand(repoRoot, 'hook decision-question --format=agy'),
  },
});

export function installAgyHook(repoRoot) {
  const hooksPath = path.join(repoRoot, '.agents', 'hooks.json');
  const config = readJsonSafe(hooksPath);
  if (config === null) return { wired: false, skippedExisting: 'malformed' };

  let changed = false;
  for (const [groupName, spec] of Object.entries(agyGroups(repoRoot))) {
    const existing = config[groupName];
    const isMatching =
      existing &&
      existing.enabled !== false &&
      Array.isArray(existing.PreToolUse) &&
      existing.PreToolUse.some(
        (g) => g?.matcher === spec.matcher && g?.hooks?.some((h) => h?.command === spec.command),
      );

    if (!isMatching) {
      config[groupName] = {
        enabled: true,
        PreToolUse: [
          {
            matcher: spec.matcher,
            hooks: [{ type: 'command', command: spec.command, timeout: 10 }],
          },
        ],
      };
      changed = true;
    }
  }

  if (changed) {
    writeJsonPretty(hooksPath, config);
  }

  return { wired: true, skippedExisting: null };
}

export function checkAgyHook(cwd) {
  const agyDir = path.join(cwd, '.agents');
  const hooksPath = path.join(agyDir, 'hooks.json');
  if (!existsSync(agyDir) && !existsSync(hooksPath)) {
    return { passed: true, message: 'AGY hooks not required (no .agents/ directory)' };
  }

  const config = readJsonSafe(hooksPath);
  if (config === null) {
    return { passed: false, message: '.agents/hooks.json exists but is malformed JSON' };
  }

  const missing = [];
  for (const [groupName, spec] of Object.entries(agyGroups(cwd))) {
    const group = config[groupName];
    const ok =
      group &&
      group.enabled !== false &&
      Array.isArray(group.PreToolUse) &&
      group.PreToolUse.some(
        (g) => g?.matcher === spec.matcher && g?.hooks?.some((h) => h?.command === spec.command),
      );
    if (!ok) missing.push(groupName);
  }

  if (missing.length > 0) {
    return { passed: false, message: `.agents/hooks.json missing canonical group(s): ${missing.join(', ')} — run fgos doctor --fix` };
  }

  const probe = isShimRunnable(cwd);
  if (!probe.runnable) {
    return { passed: false, message: `AGY hooks configured but local shim not runnable (${probe.reason})` };
  }

  return { passed: true, message: 'AGY hooks wired and verified runnable' };
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
