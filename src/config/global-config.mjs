// global-config.mjs -- reads fgOS's global config file (~/.fgos/config.json)
// and merges it with a project config, project always winning
// (docs/history/global-project-config-awareness/CONTEXT.md D1).
//
// config-merge.mjs's own header comment already anticipated this exact
// caller ("a future caller may be a user-level config file") -- this module
// is that caller: mergeConfigDefaults(existing, defaults) already gives
// "existing wins, defaults only fill gaps" semantics, which is exactly
// "project overwrites global" when existing=project, defaults=global.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { mergeConfigDefaults } from '../setup/config-merge.mjs';
import { sharedConfigFilePath } from './shared-config-file.mjs';

// A function, not a module-load-time const: os.homedir() must be read fresh
// on every call, not frozen the first time this module is imported --
// otherwise a caller overriding process.env.HOME (tests; anything else that
// legitimately runs with a different HOME) after this module already
// loaded would see the wrong, stale path. `GLOBAL_CONFIG_PATH` below is
// still exported as a snapshot for display purposes (messages, docs), but
// every function's own default resolution calls this, never the constant.
function defaultGlobalConfigPath() {
  return path.join(os.homedir(), '.fgos', 'config.json');
}

export const GLOBAL_CONFIG_PATH = defaultGlobalConfigPath();

/**
 * Read+parse the global config file. A missing file is not an error --
 * global config is optional -- and resolves to `{}`. A present-but-invalid
 * file throws, the same discipline dispatch.mjs's loadRunnerConfig already
 * applies to the project-level file.
 */
export function loadGlobalConfig(globalConfigPath = defaultGlobalConfigPath()) {
  if (!fs.existsSync(globalConfigPath)) return {};
  const raw = fs.readFileSync(globalConfigPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`cannot parse global config at "${globalConfigPath}": ${err.message}`);
  }
}

/**
 * `projectConfig` merged with the global config, project winning any key
 * present in both.
 */
export function mergeWithGlobalConfig(projectConfig, globalConfigPath = defaultGlobalConfigPath()) {
  const globalConfig = loadGlobalConfig(globalConfigPath);
  return mergeConfigDefaults(projectConfig ?? {}, globalConfig).merged;
}

/**
 * Write `config` to the global config file, creating `~/.fgos/` if needed
 * (tsk-2qc-1 D4 — the write half `loadGlobalConfig` never had: this file
 * used to be read-only, since nothing needed to persist anything into it
 * before the tier-3 bin-discovery cache). Same "the only write path in
 * this module, callers decide WHEN to write" discipline
 * `writeSharedConfig` already applies to the project-level file.
 */
export function writeGlobalConfig(config, globalConfigPath = defaultGlobalConfigPath()) {
  fs.mkdirSync(path.dirname(globalConfigPath), { recursive: true });
  fs.writeFileSync(globalConfigPath, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Which config level is active for `cwd`'s project (project config wins
 * when present, per D1), and whether the other level is also present --
 * the awareness data `fgos doctor`'s config-awareness check reports on.
 *
 * `projectPresent` reflects the shared file (`.fgos/config.json`) alone
 * (tsk-5hv D1: the legacy runner config file was retired, no fallback).
 */
export function describeConfigAwareness(cwd, { globalConfigPath = defaultGlobalConfigPath(), projectConfigPath } = {}) {
  const resolvedProjectPath = projectConfigPath ?? sharedConfigFilePath(cwd);
  const globalPresent = fs.existsSync(globalConfigPath);
  const projectPresent = fs.existsSync(resolvedProjectPath);
  const active = projectPresent ? 'project' : globalPresent ? 'global' : 'none';
  return {
    active,
    globalPresent,
    projectPresent,
    globalConfigPath,
    projectConfigPath: resolvedProjectPath,
  };
}
