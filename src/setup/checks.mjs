// checks.mjs — fgos doctor's v1 check registry (CONTEXT.md D2): three
// independent checks, each reporting {passed, message}. Orchestrates
// ansi.mjs/config-merge.mjs/shell-rc.mjs (domain/infra per
// docs/architecture-manifest.json) — this file is the "use-case" layer that
// ties them together for the doctor/setup verbs.
//
// config-not-stale is READ-ONLY by construction: it reads and JSON.parses
// .fgos-runner.json directly and calls mergeConfigDefaults (pure), but never
// calls dispatch.mjs's ensureRunnerConfig — doctor never writes.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { detectRcFiles, hasSourceLine, deadSourceLines } from './shell-rc.mjs';
import { mergeConfigDefaults } from './config-merge.mjs';
import { mainCheckoutHookWired } from './git-hooks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../runner/dispatch.mjs';
import { listWork } from '../state/store.mjs';
import { readLocalStatus, classifyRegistryPosture } from '../state/tool-registry.mjs';

export { mainCheckoutHookWired } from './git-hooks.mjs';

const MIN_NODE_MAJOR = 18;

// How many distinct dead paths the shell-integration check names before
// falling back to a count. Observed real profiles carry over a hundred.
const DEAD_LINE_SAMPLE_SIZE = 3;

/**
 * The main checkout that owns `dir` — the directory holding the real `.git` —
 * or `null` when `dir` is not inside a git checkout at all.
 *
 * `--show-toplevel` is deliberately not used: inside a linked worktree it
 * returns that worktree's own root, and treating that as the shell
 * integration's home is what made every worktree earn its own `source` line,
 * one dead line left behind per removed worktree. `--git-common-dir` points
 * at the main checkout's `.git` from anywhere in the repo, so its parent is
 * the one location stable enough for a user's rc file to name. Same
 * resolution `scripts/fgos-shell-integration.sh` already uses, and the same
 * common-dir-parent shape as `merge.mjs`'s `isMainWorktree`.
 */
export function resolveMainCheckout(dir) {
  let commonDir;
  try {
    commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd: dir,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
  return commonDir ? path.dirname(commonDir) : null;
}

/**
 * Absolute path to the sourceable shell-integration script, canonicalized to
 * the main checkout, or `null` when no stable location exists for it.
 *
 * Starts from this file's own on-disk location via `import.meta.url` — that
 * is the copy actually being executed, and the only one guaranteed to exist.
 * When that copy sits inside a linked worktree, the equivalent path in the
 * main checkout is returned instead, so a worktree never earns its own rc
 * line and `checkShellIntegrationSourced` stops reporting a working setup as
 * unconfigured.
 *
 * The `existsSync` guard keeps the canonical rewrite honest for a checkout
 * that is not fgOS's own — fgOS installed under another repo's
 * `node_modules/` resolves that repo as its main checkout, which has no
 * `scripts/` of its own; the executing copy's real path is correct there.
 *
 * `null` means the executing copy is not inside a git checkout at all (an
 * unpacked tarball, an npx cache, a bare temp copy). Such a location is
 * ephemeral by nature, so there is no path worth writing into a shell
 * profile that will outlive it.
 */
export function integrationScriptPath() {
  const executingCopy = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../scripts/fgos-shell-integration.sh',
  );
  const mainCheckout = resolveMainCheckout(path.dirname(executingCopy));
  if (mainCheckout === null) {
    return null;
  }
  const canonical = path.join(mainCheckout, 'scripts', 'fgos-shell-integration.sh');
  return fs.existsSync(canonical) ? canonical : executingCopy;
}

function checkNodeAndGit() {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    return { passed: false, message: `node ${process.version} — need >=${MIN_NODE_MAJOR}` };
  }
  try {
    execFileSync('git', ['--version'], { encoding: 'utf8' });
  } catch (err) {
    return { passed: false, message: `git not available: ${err.message}` };
  }
  return { passed: true, message: `node ${process.version}, git available` };
}

function checkShellIntegrationSourced() {
  const scriptPath = integrationScriptPath();
  const rcFiles = detectRcFiles(os.homedir());
  if (rcFiles.length === 0) {
    return { passed: true, message: 'no shell rc file(s) detected — nothing to check' };
  }
  if (scriptPath === null) {
    return {
      passed: true,
      message: 'this copy of fgos is not inside a git checkout — no stable path to check for',
    };
  }
  // Reported even when the integration itself is correctly sourced: each dead
  // line makes an interactive shell emit its own `no such file or directory`
  // error on open, which is the failure a user actually sees. Reported per rc
  // file because setup writes to every rc file it detects, so they drift apart.
  const dead = rcFiles.flatMap((rcFile) =>
    deadSourceLines(rcFile).map((target) => ({ rcFile, target })),
  );
  const missing = rcFiles.filter((rcFile) => !hasSourceLine(rcFile, scriptPath));
  const problems = [];
  if (missing.length > 0) {
    problems.push(`not sourced in: ${missing.join(', ')} — run fgos setup`);
  }
  if (dead.length > 0) {
    const byFile = new Map();
    for (const { rcFile, target } of dead) {
      byFile.set(rcFile, (byFile.get(rcFile) ?? 0) + 1);
    }
    const counts = [...byFile].map(([rcFile, count]) => `${rcFile} (${count})`).join(', ');
    // Only a sample of the paths: these accumulate into the hundreds, and a
    // check message that prints every one of them scrolls the rest of the
    // report off the screen. The counts above are the actionable part.
    const unique = [...new Set(dead.map(({ target }) => target))];
    const sample = unique.slice(0, DEAD_LINE_SAMPLE_SIZE).join(', ');
    const rest = unique.length - DEAD_LINE_SAMPLE_SIZE;
    problems.push(
      `${dead.length} dead fgos source line(s) in ${counts} — each one errors on every shell open; ` +
        `delete them by hand (fgos never edits your shell profile to remove a line). ` +
        `e.g. ${sample}${rest > 0 ? ` (+${rest} more path(s))` : ''}`,
    );
  }
  if (problems.length > 0) {
    return { passed: false, message: problems.join('; ') };
  }
  return { passed: true, message: `sourced in: ${rcFiles.join(', ')}` };
}

function checkConfigNotStale(cwd) {
  const configPath = path.join(cwd, '.fgos-runner.json');
  if (!fs.existsSync(configPath)) {
    return { passed: false, message: 'not yet configured -- run fgos setup' };
  }
  const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { addedKeys } = mergeConfigDefaults(existingConfig, DEFAULT_RUNNER_CONFIG);
  if (addedKeys.length > 0) {
    return { passed: false, message: `stale config — missing keys: ${addedKeys.join(', ')} — run fgos setup` };
  }
  return { passed: true, message: `config up to date at ${configPath}` };
}

function checkMainCheckoutHookWired(cwd) {
  if (mainCheckoutHookWired(cwd)) {
    return { passed: true, message: 'core.hooksPath = .githooks — main-checkout lock guards every commit here' };
  }
  return { passed: false, message: 'core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run fgos setup' };
}

// tsk-1dj (tool-registry-capability port), CONTEXT.md D1: reports the tool
// registry's posture (inactive/degraded/full), never a hard failure — an
// empty or partially-present registry is never itself a problem (the core
// "absent capability = clean skip" contract this whole item ports), so
// `passed` is always `true` here; only the message carries the posture.
// Reports across every registered tool, never a single hardcoded capability
// (e.g. "impact-analysis") — the registry itself never names one.
function checkToolRegistryConfigured(cwd) {
  const mainCheckout = resolveMainCheckout(cwd);
  if (mainCheckout === null) {
    return { passed: true, message: 'not inside a git checkout — nothing to check' };
  }
  const fgosDir = path.join(mainCheckout, '.fgos');
  const view = listWork(fgosDir);
  const localStatus = readLocalStatus(fgosDir);
  const { posture, registeredCount, presentCount, missingCount, unknownCount } = classifyRegistryPosture(view.tools, localStatus);
  if (posture === 'inactive') {
    return { passed: true, message: 'inactive — no tools registered (fgos tool register to add one)' };
  }
  if (posture === 'full') {
    return { passed: true, message: `full — ${presentCount}/${registeredCount} registered tool(s) present` };
  }
  return {
    passed: true,
    message: `degraded — ${presentCount}/${registeredCount} registered tool(s) present (${missingCount} missing, ${unknownCount} never checked — run fgos tool check)`,
  };
}

export const DOCTOR_CHECKS = [
  {
    id: 'node-version-and-git',
    description: `Node >=${MIN_NODE_MAJOR} and git available`,
    check: (cwd) => checkNodeAndGit(cwd),
  },
  {
    id: 'shell-integration-sourced',
    description: 'shell-integration source line present in detected rc file(s)',
    check: (cwd) => checkShellIntegrationSourced(cwd),
  },
  {
    id: 'config-not-stale',
    description: '.fgos-runner.json exists and has every current default key',
    check: (cwd) => checkConfigNotStale(cwd),
  },
  {
    id: 'main-checkout-hook-wired',
    description: 'core.hooksPath wired to .githooks (str65 main-checkout lock guards every commit)',
    check: (cwd) => checkMainCheckoutHookWired(cwd),
  },
  {
    id: 'tool-registry-configured',
    description: 'tool registry posture — inactive/degraded/full (tsk-1dj)',
    check: (cwd) => checkToolRegistryConfigured(cwd),
  },
];
