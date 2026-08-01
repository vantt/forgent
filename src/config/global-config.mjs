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

export const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.fgos', 'config.json');

/**
 * Read+parse the global config file. A missing file is not an error --
 * global config is optional -- and resolves to `{}`. A present-but-invalid
 * file throws, the same discipline dispatch.mjs's loadRunnerConfig already
 * applies to the project-level file.
 */
export function loadGlobalConfig(globalConfigPath = GLOBAL_CONFIG_PATH) {
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
export function mergeWithGlobalConfig(projectConfig, globalConfigPath = GLOBAL_CONFIG_PATH) {
  const globalConfig = loadGlobalConfig(globalConfigPath);
  return mergeConfigDefaults(projectConfig ?? {}, globalConfig).merged;
}

/**
 * Which config level is active for `cwd`'s project (project config wins
 * when present, per D1), and whether the other level is also present --
 * the awareness data `fgos doctor`'s config-awareness check reports on.
 */
export function describeConfigAwareness(cwd, { globalConfigPath = GLOBAL_CONFIG_PATH, projectConfigPath } = {}) {
  const resolvedProjectPath = projectConfigPath ?? path.join(cwd, '.fgos-runner.json');
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
