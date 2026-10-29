// config.mjs -- the `terminal.*` settings: the merge of project over global over
// default with the source of each value, the two rules only Node can judge and
// the part the route accepts. The core owns its defaults, the policy registry
// and the layout floor: callers read them from `capabilities`, the route refuses
// a bad value. Read-only; the standard holds the defaults.

import path from 'node:path';
import { isConfigRefusal, readConfig } from '../config/facade.mjs';

export const TERMINAL_CONFIG_KEY = 'terminal';

/** How far `allocationGraceMs` must stay above the ready timeout. */
const GRACE_MARGIN_MS = 30000;

/** Every setting, as its dotted path in the `terminal` section. */
const SETTINGS = ['allocationGraceMs', 'retainFailedPaneMs', 'layout.policy', 'layout.minCols', 'layout.minRows', 'layout.maxPanesPerTab'];

const readSetting = (section, name) => name.split('.').reduce((value, key) => value?.[key], section);

/** The route's flat key of a setting (`layout.minCols` -> `minCols`). */
const routeKey = (name) => name.replace(/^layout\./, '');

/** A setting nobody set: the core's default, or the standard's value (already in the snapshot) for the retain time the route never sees. */
function defaultOf(name, defaults, section) {
  return name === 'retainFailedPaneMs' ? readSetting(section, name) : defaults?.[routeKey(name)];
}

/**
 * resolveTerminalConfig(repoRoot, { globalConfigPath, defaults }) ->
 *   { entries: [{ name, value, source }], values: { [dotted name]: value } }
 *
 * `source` is `project`, `global` or `default` (the value came only from the
 * standard); an explicit `null` counts as set. `defaults` is the core's
 * `capabilities.defaults` (a core default reads as `undefined` without it).
 * `globalConfigPath` names a global config file whose directory replaces `~/.fgos`.
 * Throws the door's refusal when a config file is unusable.
 */
export function resolveTerminalConfig(repoRoot, { globalConfigPath, defaults } = {}) {
  const { value, origins } = readConfig({
    projectRoot: repoRoot,
    globalDir: globalConfigPath ? path.dirname(globalConfigPath) : undefined,
    sections: [TERMINAL_CONFIG_KEY],
    origins: [TERMINAL_CONFIG_KEY],
  });
  const layers = new Map(origins.map((origin) => [origin.path, origin.layer]));
  const entries = SETTINGS.map((name) => {
    const layer = layers.get(`${TERMINAL_CONFIG_KEY}.${name}`);
    if (layer === 'project' || layer === 'global') return { name, value: readSetting(value[TERMINAL_CONFIG_KEY], name), source: layer };
    return { name, value: defaultOf(name, defaults, value[TERMINAL_CONFIG_KEY]), source: 'default' };
  });
  return { entries, values: Object.fromEntries(entries.map((e) => [e.name, e.value])) };
}

const isPositiveInteger = (n) => Number.isInteger(n) && n > 0;

/**
 * terminalConfigProblems(values, { readyTimeoutMs }) -> string[]
 *
 * One sentence per breach of the two rules whose inputs are not the core's (the
 * dispatch ready timeout, the round's retain time); the core refuses the rest.
 */
export function terminalConfigProblems(values, { readyTimeoutMs }) {
  const problems = [];
  const { allocationGraceMs, retainFailedPaneMs } = values;
  const minGrace = readyTimeoutMs + GRACE_MARGIN_MS;
  if (!Number.isInteger(allocationGraceMs) || allocationGraceMs < minGrace) {
    problems.push(`terminal.allocationGraceMs = ${JSON.stringify(allocationGraceMs)} must be an integer of at least ${minGrace} (the ${readyTimeoutMs} ms ready timeout plus ${GRACE_MARGIN_MS} ms), or a slot still waiting for its worker would be reported as stuck`);
  }
  if (retainFailedPaneMs !== null && !isPositiveInteger(retainFailedPaneMs)) {
    problems.push(`terminal.retainFailedPaneMs = ${JSON.stringify(retainFailedPaneMs)} must be null (keep a failed pane until a person closes it) or a positive integer of milliseconds`);
  }
  return problems;
}

/**
 * The settings of `repoRoot` set explicitly (project or global), as the route's
 * `config` field; defaults stay the core's. An unreadable config file gives `{}`:
 * doctor reports it, a dispatch does not stop for it.
 */
export function terminalRouteConfig(repoRoot, { globalConfigPath } = {}) {
  let entries;
  try {
    ({ entries } = resolveTerminalConfig(repoRoot, { globalConfigPath }));
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    return {};
  }
  const config = {};
  for (const { name, value, source } of entries) {
    if (source === 'default' || value === null || value === undefined) continue;
    if (name === 'retainFailedPaneMs') continue; // the round's own concern, not the route's
    config[routeKey(name)] = value;
  }
  return config;
}

/** `terminal.retainFailedPaneMs` of `repoRoot`: a positive number, or `null` for "keep until a person closes it". */
export function retainFailedPaneMsOf(repoRoot, { globalConfigPath } = {}) {
  try {
    const { values } = resolveTerminalConfig(repoRoot, { globalConfigPath });
    return isPositiveInteger(values.retainFailedPaneMs) ? values.retainFailedPaneMs : null;
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    return null;
  }
}
