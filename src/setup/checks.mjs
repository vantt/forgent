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

import { detectRcFiles, hasSourceLine } from './shell-rc.mjs';
import { mergeConfigDefaults } from './config-merge.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../runner/dispatch.mjs';

const MIN_NODE_MAJOR = 18;

/**
 * Absolute path to the sourceable shell-integration script, resolved from
 * this file's own on-disk location via `import.meta.url` — never a cwd-based
 * git lookup, since this file's location is fixed at import time (unlike the
 * script's own runtime cwd-based worktree resolution, which is a separate,
 * already-solved problem — see CONTEXT.md's "Established Patterns").
 */
export function integrationScriptPath() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/fgos-shell-integration.sh');
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
  const missing = rcFiles.filter((rcFile) => !hasSourceLine(rcFile, scriptPath));
  if (missing.length > 0) {
    return { passed: false, message: `not sourced in: ${missing.join(', ')} — run fgos setup` };
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
];
