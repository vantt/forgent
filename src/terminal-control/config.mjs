// config.mjs -- the `terminal.*` settings of terminal-control: their defaults,
// the merge of project over global over default with the source of each value,
// the rules doctor checks them against, and the part the route accepts.
//
// Read-only: setup writes the defaults through `registerConfigDefault`
// (`src/setup/registrations.mjs`); nothing here writes.

import { readSharedConfig } from '../config/shared-config-file.mjs';
import { loadGlobalConfig } from '../config/global-config.mjs';

export const TERMINAL_CONFIG_KEY = 'terminal';

/** The placement policies the Rust core registers
 * (`packages/terminal-control/contracts/placement-policy.v1.json`, `registry.names`). */
export const KNOWN_POLICIES = Object.freeze(['measured-split']);

/** Smallest pane the CLIs were measured to start in
 * (docs/platform/terminal-control/spec.md, "Configuration"). */
export const LAYOUT_FLOOR = Object.freeze({ minCols: 40, minRows: 8 });

/** How far `allocationGraceMs` must stay above the ready timeout. */
export const GRACE_MARGIN_MS = 30000;

export const DEFAULT_TERMINAL_CONFIG = Object.freeze({
  allocationGraceMs: 60000,
  retainFailedPaneMs: null,
  layout: Object.freeze({ policy: 'measured-split', minCols: 80, minRows: 20, maxPanesPerTab: 8 }),
});

/** Every setting as `[dotted path, read from a config section]`. */
const SETTINGS = [
  ['allocationGraceMs', (s) => s.allocationGraceMs],
  ['retainFailedPaneMs', (s) => s.retainFailedPaneMs],
  ['layout.policy', (s) => s.layout?.policy],
  ['layout.minCols', (s) => s.layout?.minCols],
  ['layout.minRows', (s) => s.layout?.minRows],
  ['layout.maxPanesPerTab', (s) => s.layout?.maxPanesPerTab],
];

function sectionOf(config) {
  const section = config?.[TERMINAL_CONFIG_KEY];
  return section && typeof section === 'object' && !Array.isArray(section) ? section : {};
}

function defaultOf(name) {
  return SETTINGS.find(([n]) => n === name)[1](DEFAULT_TERMINAL_CONFIG);
}

/**
 * resolveTerminalConfig(repoRoot, { globalConfigPath }) ->
 *   { entries: [{ name, value, source }], values }
 *
 * `source` is `project`, `global` or `default`. A key present with the value
 * `null` counts as set (`retainFailedPaneMs: null` is a real value). Throws
 * when a config file cannot be parsed.
 */
export function resolveTerminalConfig(repoRoot, { globalConfigPath } = {}) {
  const project = sectionOf(readSharedConfig(repoRoot));
  const global = sectionOf(globalConfigPath ? loadGlobalConfig(globalConfigPath) : loadGlobalConfig());
  const entries = SETTINGS.map(([name, read]) => {
    const fromProject = read(project);
    if (fromProject !== undefined) return { name, value: fromProject, source: 'project' };
    const fromGlobal = read(global);
    if (fromGlobal !== undefined) return { name, value: fromGlobal, source: 'global' };
    return { name, value: defaultOf(name), source: 'default' };
  });
  const byName = Object.fromEntries(entries.map((e) => [e.name, e.value]));
  return {
    entries,
    values: {
      allocationGraceMs: byName.allocationGraceMs,
      retainFailedPaneMs: byName.retainFailedPaneMs,
      layout: {
        policy: byName['layout.policy'],
        minCols: byName['layout.minCols'],
        minRows: byName['layout.minRows'],
        maxPanesPerTab: byName['layout.maxPanesPerTab'],
      },
    },
  };
}

const isPositiveInteger = (n) => Number.isInteger(n) && n > 0;

/**
 * terminalConfigProblems(values, { readyTimeoutMs }) -> string[]
 *
 * One sentence per setting that breaks a rule; empty when every rule holds.
 */
export function terminalConfigProblems(values, { readyTimeoutMs }) {
  const problems = [];
  const { allocationGraceMs, retainFailedPaneMs, layout } = values;
  const minGrace = readyTimeoutMs + GRACE_MARGIN_MS;
  if (!Number.isInteger(allocationGraceMs) || allocationGraceMs < minGrace) {
    problems.push(`terminal.allocationGraceMs = ${JSON.stringify(allocationGraceMs)} must be an integer of at least ${minGrace} (the ${readyTimeoutMs} ms ready timeout plus ${GRACE_MARGIN_MS} ms), or a slot still waiting for its worker would be reported as stuck`);
  }
  if (retainFailedPaneMs !== null && !isPositiveInteger(retainFailedPaneMs)) {
    problems.push(`terminal.retainFailedPaneMs = ${JSON.stringify(retainFailedPaneMs)} must be null (keep a failed pane until a person closes it) or a positive integer of milliseconds`);
  }
  if (!KNOWN_POLICIES.includes(layout.policy)) {
    problems.push(`terminal.layout.policy = ${JSON.stringify(layout.policy)} is not a registered placement policy (${KNOWN_POLICIES.join(', ')})`);
  }
  for (const key of ['minCols', 'minRows', 'maxPanesPerTab']) {
    if (!isPositiveInteger(layout[key])) {
      problems.push(`terminal.layout.${key} = ${JSON.stringify(layout[key])} must be a positive integer`);
    } else if (LAYOUT_FLOOR[key] !== undefined && layout[key] < LAYOUT_FLOOR[key]) {
      problems.push(`terminal.layout.${key} = ${layout[key]} is below the measured floor of ${LAYOUT_FLOOR[key]}: the agent CLIs were not shown to start in a pane that small`);
    }
  }
  return problems;
}

/**
 * The settings of `repoRoot` that were set explicitly (project or global), in
 * the shape of the route's `config` envelope field. Defaults are left out so
 * the Rust core stays the one owner of its own defaults. An unreadable config
 * file gives `{}`: doctor reports it, a dispatch does not stop for it.
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
    config[name.replace(/^layout\./, '')] = value;
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
