// agent-definitions.mjs — the one lookup of an agent definition (persona) by name across its three tiers.
// LAYER: infra. Customer customization lives in `fgos/agents/<name>.yaml` of the project (workspace tier);
// a domain keeps its own in `domains/<domain>/agents/`; the installed set is `core/agents/`.
//
// Lookup order is workspace, then domain, then core: the first tier that holds the name wins and its file
// replaces a lower tier's whole file (fields are never merged). Two files of one name in the same tier are
// an error, and an unknown name is an error that names every directory searched; there is no fallback.
//
// A project that ships its own `domains/` or `core/agents/` folder is read there. A project without one
// (any customer project) falls back to the installed package that is running this code, so installed
// definitions reach every project without a path guess based on the working directory.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describeYamlError, parseYaml } from '../util/yaml.mjs';
import { RunnerConfigError } from './dispatch/config.mjs';

export const AGENT_NAME_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
// A definition is a short persona sketch; the cap bounds what a pinned copy adds to a run record.
export const AGENT_FILE_MAX_BYTES = 16 * 1024;
export const INSTALL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** No tier defines the name. Told apart from a definition that exists but is unusable, which a caller must not skip. */
export class AgentNotFoundError extends RunnerConfigError {}

const TIER_LABELS = { workspace: 'fgos/agents', domain: 'domains/*/agents', core: 'core/agents' };

function sortedNames(dir) {
  return fs.readdirSync(dir).sort((a, b) => a.localeCompare(b));
}

/** The directories each tier is read from, in lookup order: [{ tier, label, dirs: [{ dir, relDir }] }]. */
export function agentTierDirs({ projectRoot, installRoot = INSTALL_ROOT }) {
  if (typeof projectRoot !== 'string' || projectRoot === '') throw new RunnerConfigError('agent definition lookup requires a project root');
  const rootFor = (rel) => (fs.existsSync(path.join(projectRoot, rel)) ? projectRoot : installRoot);

  const domainsRoot = rootFor('domains');
  const domainsDir = path.join(domainsRoot, 'domains');
  const domainDirs = fs.existsSync(domainsDir)
    ? fs.readdirSync(domainsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => ({ dir: path.join(domainsDir, entry.name, 'agents'), relDir: `domains/${entry.name}/agents` }))
    : [];

  return [
    { tier: 'workspace', label: TIER_LABELS.workspace, dirs: [{ dir: path.join(projectRoot, 'fgos', 'agents'), relDir: 'fgos/agents' }] },
    { tier: 'domain', label: TIER_LABELS.domain, dirs: domainDirs },
    { tier: 'core', label: TIER_LABELS.core, dirs: [{ dir: path.join(rootFor('core/agents'), 'core', 'agents'), relDir: 'core/agents' }] },
  ];
}

/**
 * Every definition file of every tier. Only `<name>.yaml` files are definitions; a `.yml` file is listed
 * under `ignored` so a typo in the extension is visible instead of silently missing.
 *
 * @returns {Array<{ tier: string, label: string, dirs: string[], entries: Array<{ name: string, file: string, rel: string }>, ignored: string[] }>}
 */
export function scanAgentTiers(options) {
  return agentTierDirs(options).map(({ tier, label, dirs }) => {
    const entries = [];
    const ignored = [];
    for (const { dir, relDir } of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const fileName of sortedNames(dir)) {
        const file = path.join(dir, fileName);
        if (!fs.statSync(file).isFile()) continue;
        if (fileName.endsWith('.yaml')) entries.push({ name: fileName.slice(0, -'.yaml'.length), file, rel: `${relDir}/${fileName}` });
        else if (fileName.endsWith('.yml')) ignored.push(`${relDir}/${fileName}`);
      }
    }
    return { tier, label, dirs: dirs.map((d) => d.dir), entries, ignored };
  });
}

/** Names defined more than once inside one tier: [{ tier, label, name, files }]. */
export function findAgentDuplicates(scan) {
  const duplicates = [];
  for (const { tier, label, entries } of scan) {
    const byName = new Map();
    for (const entry of entries) byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry.rel]);
    for (const [name, files] of byName) if (files.length > 1) duplicates.push({ tier, label, name, files });
  }
  return duplicates;
}

export const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isScalar = (value) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

/**
 * Reads a definition file's text once with the real YAML parser and derives the fields every reader
 * needs. A file that is not valid YAML never throws: `error` carries `cannot be parsed: <reason>
 * (line L, column C)` and `data` is null, so each caller decides how to report it.
 *
 * - `name`: the declared name coerced with `String()` (`name: 123` is "123"), or undefined when absent.
 * - `skills`: the entries of `skills` that are strings; `[]` when absent or not a list.
 * - `description`: the declared description as text, or '' when absent.
 *
 * @param {string} text
 * @param {{ filename?: string }} [options] named in the parse error
 * @returns {{ data: object|null, error: string|null, name: string|undefined, skills: string[], description: string }}
 */
export function readAgentDefinition(text, { filename } = {}) {
  let parsed;
  try {
    parsed = parseYaml(String(text), { filename });
  } catch (error) {
    return { data: null, error: `cannot be parsed: ${describeYamlError(error)}`, name: undefined, skills: [], description: '' };
  }
  const data = isPlainObject(parsed) ? parsed : null;
  const declared = data && isScalar(data.name) ? String(data.name).trim() : '';
  return {
    data,
    error: null,
    name: declared === '' ? undefined : declared,
    skills: Array.isArray(data?.skills) ? data.skills.filter((skill) => typeof skill === 'string') : [],
    description: data && isScalar(data.description) ? String(data.description).trim() : '',
  };
}

/** The keys of a definition the persona renderer reads; anything else in those sections is not rendered. */
export const PERSONA_KEYS = Object.freeze(['voice', 'style', 'archetype']);
export const BOUNDARY_KEYS = Object.freeze(['can_decide', 'must_escalate']);

const scalarText = (value) => (isScalar(value) ? String(value).trim() : '');
const textList = (value) => (Array.isArray(value) ? value.filter(isScalar).map((item) => String(item).trim()).filter(Boolean) : []);

/**
 * What the persona renderer shows from a parsed definition: `description`, `persona.voice|style|archetype`
 * (text) and `decision_boundary.can_decide|must_escalate` (lists of text). Scalars are rendered with
 * `String()`; a missing or non-scalar value is ''/[] and renders nothing.
 *
 * @param {object|null} data a parsed definition (see readAgentDefinition)
 */
export function projectPersona(data) {
  const persona = isPlainObject(data?.persona) ? data.persona : {};
  const boundary = isPlainObject(data?.decision_boundary) ? data.decision_boundary : {};
  return {
    description: scalarText(data?.description),
    persona: Object.fromEntries(PERSONA_KEYS.map((key) => [key, scalarText(persona[key])])),
    decision_boundary: Object.fromEntries(BOUNDARY_KEYS.map((key) => [key, textList(boundary[key])])),
  };
}

/**
 * Values in the rendered sections that the renderer would silently drop because they are not text:
 * a mapping where text belongs (typically an unquoted ": " inside a list item or a value) or a list
 * where a single text belongs. One sentence per value, naming its path. This is the one detector;
 * the shape check refuses the file with it and the pinned-text renderer falls back on it.
 *
 * @param {object|null} data a parsed definition (see readAgentDefinition)
 * @returns {string[]}
 */
export function nonTextPersonaValues(data) {
  const problems = [];
  const kind = (value) => (Array.isArray(value) ? 'a list' : 'a mapping');
  const hint = '; an unquoted ": " inside the text makes YAML read a mapping, quote it';
  const single = (value, where) => {
    if (value !== null && value !== undefined && !isScalar(value)) problems.push(`${where} is ${kind(value)}, not text${hint}`);
  };
  single(data?.description, 'description');
  if (isPlainObject(data?.persona)) for (const key of PERSONA_KEYS) single(data.persona[key], `persona.${key}`);
  if (isPlainObject(data?.decision_boundary)) {
    for (const key of BOUNDARY_KEYS) {
      const list = data.decision_boundary[key];
      const where = `decision_boundary.${key}`;
      if (list === null || list === undefined) continue;
      if (!Array.isArray(list)) {
        problems.push(`${where} is ${isPlainObject(list) ? 'a mapping' : 'text'}, not a list${isPlainObject(list) ? hint : ''}`);
        continue;
      }
      list.forEach((item, index) => {
        if (item !== null && !isScalar(item)) problems.push(`${where}[${index}] is ${kind(item)}${hint}`);
      });
    }
  }
  return problems;
}

/**
 * The problem with a definition file's shape, or null. The renderer needs a file that names itself
 * after its basename and says what it is for; anything else would render as an empty persona. A file
 * that is not valid YAML is reported with the parser's line and column.
 */
export function agentShapeProblem(name, text) {
  return shapeProblemOf(name, readAgentDefinition(text));
}

/** agentShapeProblem for a definition already read with readAgentDefinition. */
export function shapeProblemOf(name, { data, error, name: declared, description }) {
  if (error) return error;
  if (declared !== name) return `must declare name: ${name} (got ${JSON.stringify(declared ?? null)})`;
  const [nonText] = nonTextPersonaValues(data);
  if (nonText) return nonText;
  if (description === '') return 'must declare a non-empty description';
  return null;
}

/**
 * Resolve a definition by name: its text, the tier it came from and a digest of the exact bytes.
 *
 * @returns {{ name: string, tier: string, source: string, text: string, digest: string }}
 */
export function resolveAgentDefinition(name, options) {
  if (typeof name !== 'string' || !AGENT_NAME_PATTERN.test(name)) {
    throw new RunnerConfigError(`persona name ${JSON.stringify(name)} must match ${AGENT_NAME_PATTERN} (lowercase letters, digits and "-")`);
  }
  const scan = scanAgentTiers(options);
  for (const { tier, label, entries } of scan) {
    const matches = entries.filter((entry) => entry.name === name);
    if (matches.length > 1) {
      throw new RunnerConfigError(`persona "${name}" is defined more than once in the ${label} tier (${matches.map((m) => m.rel).join(', ')}); keep one`);
    }
    if (matches.length === 0) continue;
    const [{ file, rel }] = matches;
    if (fs.statSync(file).size > AGENT_FILE_MAX_BYTES) {
      throw new RunnerConfigError(`persona "${name}" (${rel}) is larger than ${AGENT_FILE_MAX_BYTES} bytes`);
    }
    const text = fs.readFileSync(file, 'utf8');
    const problem = agentShapeProblem(name, text);
    if (problem) throw new RunnerConfigError(`persona "${name}" (${rel}) ${problem}`);
    return { name, tier, source: rel, text, digest: crypto.createHash('sha256').update(text).digest('hex') };
  }
  const searched = scan.map(({ label, dirs }) => `${label} (${dirs.length > 0 ? dirs.join(', ') : 'no such folder'})`).join('; ');
  const hint = scan.flatMap((t) => t.ignored).find((rel) => rel.endsWith(`/${name}.yml`));
  throw new AgentNotFoundError(`persona "${name}" not found; searched ${searched}${hint ? `; ${hint} exists but only .yaml files are read` : ''}`);
}
