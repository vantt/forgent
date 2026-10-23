// config.mjs -- the `terminal.*` settings: the merge of project over global over
// default with the source of each value, the two rules only Node can judge and
// the part the route accepts. The core owns its defaults, the policy registry
// and the layout floor: callers read them from `capabilities`, the route refuses
// a bad value. Read-only; setup writes the defaults (`registerConfigDefault`).

import { readSharedConfig } from '../config/shared-config-file.mjs';
import { loadGlobalConfig } from '../config/global-config.mjs';

export const TERMINAL_CONFIG_KEY = 'terminal';

/** How far `allocationGraceMs` must stay above the ready timeout. */
const GRACE_MARGIN_MS = 30000;

/** The shape `fgos setup` writes; the route test pins that it agrees with the core's defaults. */
export const DEFAULT_TERMINAL_CONFIG = Object.freeze({
  allocationGraceMs: 60000,
  retainFailedPaneMs: null,
  layout: Object.freeze({ policy: 'measured-split', minCols: 80, minRows: 20, maxPanesPerTab: 8 }),
});

/** Every setting, as its dotted path in the `terminal` section. */
const SETTINGS = ['allocationGraceMs', 'retainFailedPaneMs', 'layout.policy', 'layout.minCols', 'layout.minRows', 'layout.maxPanesPerTab'];

function sectionOf(config) {
  const section = config?.[TERMINAL_CONFIG_KEY];
  return section && typeof section === 'object' && !Array.isArray(section) ? section : {};
}

const readSetting = (section, name) => name.split('.').reduce((value, key) => value?.[key], section);

/** The route's flat key of a setting (`layout.minCols` -> `minCols`). */
const routeKey = (name) => name.replace(/^layout\./, '');

/** A setting nobody set: the core's default, or Node's own for the retain time the route never sees. */
function defaultOf(name, defaults) {
  return name === 'retainFailedPaneMs' ? DEFAULT_TERMINAL_CONFIG.retainFailedPaneMs : defaults?.[routeKey(name)];
}

/**
 * resolveTerminalConfig(repoRoot, { globalConfigPath, defaults }) ->
 *   { entries: [{ name, value, source }], values: { [dotted name]: value } }
 *
 * `source` is `project`, `global` or `default`; an explicit `null` counts as set.
 * `defaults` is the core's `capabilities.defaults` (a core default reads as
 * `undefined` without it). Throws when a config file cannot be parsed.
 */
export function resolveTerminalConfig(repoRoot, { globalConfigPath, defaults } = {}) {
  const project = sectionOf(readSharedConfig(repoRoot));
  const global = sectionOf(globalConfigPath ? loadGlobalConfig(globalConfigPath) : loadGlobalConfig());
  const entries = SETTINGS.map((name) => {
    const fromProject = readSetting(project, name);
    if (fromProject !== undefined) return { name, value: fromProject, source: 'project' };
    const fromGlobal = readSetting(global, name);
    if (fromGlobal !== undefined) return { name, value: fromGlobal, source: 'global' };
    return { name, value: defaultOf(name, defaults), source: 'default' };
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
  } catch {
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
  } catch {
    return null;
  }
}
