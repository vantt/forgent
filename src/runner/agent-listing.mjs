// agent-listing.mjs — what personas a project can seat, and what is wrong or hidden about them.
// LAYER: infra. Reads the same tiers as `resolveAgentDefinition` (agent-definitions.mjs) and adds three
// things that resolver never says: a one-line description per persona, the shipped definitions a
// project's own `domains/` or `core/agents/` folder hides, and the keys the persona renderer drops.
//
// The renderer (dispatch/assignment.mjs) reads only `description`, `persona.voice|style|archetype` and
// `decision_boundary.can_decide|must_escalate`. Anything else, a multi-line value, or a block scalar is
// not rendered and not reported there, so the warnings below are the only place that says so.

import fs from 'node:fs';
import path from 'node:path';

import { INSTALL_ROOT, agentShapeProblem, findAgentDuplicates, scanAgentTiers } from './agent-definitions.mjs';

const PERSONA_KEYS = new Set(['voice', 'style', 'archetype']);
const BOUNDARY_KEYS = new Set(['can_decide', 'must_escalate']);
const BLOCK_SCALAR = /^[>|][+-]?\d*$/;

const unquote = (value) => value.trim().replace(/^["'](.*)["']$/, '$1');

/**
 * Keys in a definition that the renderer would silently drop, one sentence each.
 *
 * @param {string} text the definition file's text
 * @returns {string[]}
 */
export function agentRenderWarnings(text) {
  const warnings = [];
  let section = null;
  for (const line of String(text).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const top = /^([a-zA-Z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (top && !/^[ \t]/.test(line)) {
      const [, key, value] = top;
      section = value.trim() === '' ? key : null;
      if (key === 'description' && BLOCK_SCALAR.test(value.trim())) {
        warnings.push('description is a multi-line block, so only its marker is rendered; write it on one line');
      }
      continue;
    }
    if (section === 'persona') {
      const child = /^\s+([a-zA-Z0-9_-]+):[ \t]*(.*)$/.exec(line);
      if (!child) continue;
      if (!PERSONA_KEYS.has(child[1])) warnings.push(`persona.${child[1]} is not rendered (only voice, style, archetype are)`);
      else if (BLOCK_SCALAR.test(child[2].trim())) warnings.push(`persona.${child[1]} is a multi-line block, so only its marker is rendered; write it on one line`);
    } else if (section === 'decision_boundary') {
      const sub = /^\s{2}([a-zA-Z0-9_-]+):[ \t]*$/.exec(line);
      if (sub && !BOUNDARY_KEYS.has(sub[1])) warnings.push(`decision_boundary.${sub[1]} is not rendered (only can_decide, must_escalate are)`);
    }
  }
  return [...new Set(warnings)];
}

/** The one-line `description:` of a definition, or '' when it has none on one line. */
export function agentDescription(text) {
  const match = /^description:[ \t]*(\S.*)$/m.exec(String(text));
  const value = match ? unquote(match[1]) : '';
  return BLOCK_SCALAR.test(value) ? '' : value;
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
