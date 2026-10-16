// agent-listing.mjs — what personas a project can seat, and what is wrong or hidden about them.
// LAYER: infra. Reads the same tiers as `resolveAgentDefinition` (agent-definitions.mjs) and adds three
// things that resolver never says: a one-line description per persona, the shipped definitions a
// project's own `domains/` or `core/agents/` folder hides, and the keys the persona renderer drops.
//
// The renderer (dispatch/assignment.mjs) reads only `description`, `persona.voice|style|archetype` and
// `decision_boundary.can_decide|must_escalate` (see projectPersona). Any other key in those sections is
// not rendered and not reported there, so the warnings below are the only place that says so.

import fs from 'node:fs';
import path from 'node:path';

import {
  BOUNDARY_KEYS,
  INSTALL_ROOT,
  PERSONA_KEYS,
  agentShapeProblem,
  findAgentDuplicates,
  readAgentDefinition,
  scanAgentTiers,
} from './agent-definitions.mjs';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Keys in a definition that the renderer would silently drop, one sentence each. A file that is not
 * valid YAML has none to report here; `agentShapeProblem` names the parse failure.
 *
 * @param {string} text the definition file's text
 * @returns {string[]}
 */
export function agentRenderWarnings(text) {
  const { data } = readAgentDefinition(text);
  const warnings = [];
  if (isPlainObject(data?.persona)) {
    for (const key of Object.keys(data.persona)) {
      if (!PERSONA_KEYS.includes(key)) warnings.push(`persona.${key} is not rendered (only ${PERSONA_KEYS.join(', ')} are)`);
    }
  }
  if (isPlainObject(data?.decision_boundary)) {
    for (const key of Object.keys(data.decision_boundary)) {
      if (!BOUNDARY_KEYS.includes(key)) warnings.push(`decision_boundary.${key} is not rendered (only ${BOUNDARY_KEYS.join(', ')} are)`);
    }
  }
  return warnings;
}

/** The `description:` of a definition on one line (whitespace runs collapsed), or '' when it has none. */
export function agentDescription(text) {
  return readAgentDefinition(text).description.replace(/\s+/g, ' ');
}

function readQuietly(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

// An installed definition the project's own folder hides. A project that ships `domains/` (or
// `core/agents/`) is read there instead of the install, so every shipped name that folder lacks is
// invisible to a seat lookup. The project-side scan cannot see them; the install root is scanned
// separately and only when the two roots differ.
function maskedByProject(projectRoot, installRoot, visibleNames) {
  if (path.resolve(projectRoot) === path.resolve(installRoot)) return [];
  const masked = [];
  for (const rel of ['domains', 'core/agents']) {
    if (!fs.existsSync(path.join(projectRoot, rel))) continue;
    const hidden = scanAgentTiers({ projectRoot: installRoot, installRoot })
      .filter((tier) => (rel === 'domains' ? tier.tier === 'domain' : tier.tier === 'core'))
      .flatMap((tier) => tier.entries.map((entry) => ({ ...entry, tier: tier.tier, label: tier.label })));
    for (const entry of hidden) {
      if (visibleNames.has(entry.name)) continue;
      masked.push({ name: entry.name, tier: entry.tier, source: entry.rel, hiddenBy: `${rel}/ of this project` });
    }
  }
  return masked;
}

/**
 * Every persona a seat lookup can find from `projectRoot`, in lookup order, plus what is hidden.
 *
 * @param {{ projectRoot: string, installRoot?: string }} options
 * @returns {{ agents: Array<{ name: string, tier: string, source: string, description: string, problems: string[], warnings: string[], shadows: string[] }>,
 *   masked: Array<{ name: string, tier: string, source: string, hiddenBy: string }>, duplicates: object[], ignored: string[] }}
 */
export function listAgents({ projectRoot, installRoot = INSTALL_ROOT }) {
  const scan = scanAgentTiers({ projectRoot, installRoot });
  const seen = new Map();
  for (const { tier, entries } of scan) {
    for (const entry of entries) {
      const text = readQuietly(entry.file);
      const record = {
        name: entry.name,
        tier,
        source: entry.rel,
        text,
      };
      if (seen.has(entry.name)) seen.get(entry.name).shadows.push(entry.rel);
      else seen.set(entry.name, { ...record, shadows: [] });
    }
  }

  const agents = [...seen.values()].map(({ text, ...record }) => ({
    ...record,
    description: text === null ? '' : agentDescription(text),
    problems: text === null ? ['cannot be read'] : [agentShapeProblem(record.name, text)].filter(Boolean),
    warnings: text === null ? [] : agentRenderWarnings(text),
  }));

  return {
    agents,
    masked: maskedByProject(projectRoot, installRoot, new Set(agents.map((agent) => agent.name))),
    duplicates: findAgentDuplicates(scan),
    ignored: scan.flatMap((tier) => tier.ignored),
  };
}
