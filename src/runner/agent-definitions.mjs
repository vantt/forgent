// agent-definitions.mjs — the one lookup of an agent definition (persona) by name across its layers.
// LAYER: infra. Customer customization lives in `fgos/agents/<name>.yaml` of the project (workspace layer);
// a packaged workflow keeps its own beside it (`agent.<name>.yaml`); a domain keeps its own in
// `domains/<domain>/agents/`, visible only to workflows that domain owns; the installed set is `core/agents/`.
//
// Lookup order is workspace, workflow folder, owning domain, then core: the first layer that holds the name
// wins and its file replaces a lower layer's whole file (fields are never merged). An unknown name is an error
// that names every directory searched; there is no fallback. A persona file never carries model taste.
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
import { definitionFileName } from '../convention/seat-id.mjs';

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
  const taste = personaModelTasteProblem(data);
  if (taste) return taste;
  const [nonText] = nonTextPersonaValues(data);
  if (nonText) return nonText;
  if (description === '') return 'must declare a non-empty description';
  return null;
}

/**
 * The directories one lookup reads, in order, for the workflow it is made for. Narrower than the listing's
 * tiers: a packaged workflow's own folder is read first after the workspace, and a domain's personas are
 * visible only to workflows that domain owns, so a lookup with no domain never reads `domains/`.
 *
 * @param {{ projectRoot: string, installRoot?: string }} options
 * @param {{ workflowDir?: string|null, owningDomain?: string|null }} [workflow]
 * @returns {Array<{ layer: string, label: string, dir: string, relDir: string, fileOf: (name: string) => string }>}
 */
function lookupTiers(options, workflow) {
  const { projectRoot, installRoot = INSTALL_ROOT } = options;
  const [workspace, domainTier, core] = agentTierDirs({ projectRoot, installRoot });
  const plain = (name) => `${name}.yaml`;
  const tiers = [{ layer: 'workspace', label: workspace.label, ...workspace.dirs[0], fileOf: plain }];
  if (typeof workflow?.workflowDir === 'string' && workflow.workflowDir !== '') {
    const root = [projectRoot, installRoot].find((candidate) => !path.relative(candidate, workflow.workflowDir).startsWith('..'));
    const relDir = root ? path.relative(root, workflow.workflowDir).split(path.sep).join('/') : workflow.workflowDir;
    tiers.push({ layer: 'workflow', label: 'the workflow folder', dir: workflow.workflowDir, relDir, fileOf: (name) => definitionFileName('agent-file', name) });
  }
  if (typeof workflow?.owningDomain === 'string' && workflow.owningDomain !== '') {
    const own = domainTier.dirs.find((entry) => entry.relDir === `domains/${workflow.owningDomain}/agents`);
    if (own) tiers.push({ layer: 'domain', label: `domains/${workflow.owningDomain}/agents`, ...own, fileOf: plain });
  }
  tiers.push({ layer: 'core', label: core.label, ...core.dirs[0], fileOf: plain });
  return tiers;
}

/**
 * Model taste (`tier`, `prefer`) belongs to a seat, not to a persona: a persona file that names one is refused,
 * and the refusal says where it goes. `rigor` stays a plain field of the persona and no seat choice reads it.
 *
 * @param {object|null} data a parsed definition (see readAgentDefinition)
 * @returns {string|null}
 */
export function personaModelTasteProblem(data) {
  const field = ['tier', 'prefer'].find((key) => isPlainObject(data) && Object.hasOwn(data, key));
  if (field === undefined) return null;
  return `persona-model-taste-not-allowed: "${field}" is a model choice and a persona does not make one; set it at capabilities.<cap>.personas.<name> in the runner config`;
}

/**
 * Resolve a definition by name for a workflow: its text, the layer it came from, a digest of the exact bytes and
 * its qualified identity `<layer>:<source>/<name>`. Lookup order: workspace `fgos/agents`, the workflow's own
 * folder (`agent.<name>.yaml`), the workflow's owning domain, then core. A lookup made without a workflow
 * (`fgos run --persona`) reads workspace and core only.
 *
 * @param {string} name
 * @param {{ projectRoot: string, installRoot?: string, workflow?: { workflowDir?: string|null, owningDomain?: string|null }|null }} options
 * @returns {{ name: string, tier: string, source: string, identity: string, text: string, digest: string }}
 */
export function resolveAgentDefinition(name, options) {
  if (typeof name !== 'string' || !AGENT_NAME_PATTERN.test(name)) {
    throw new RunnerConfigError(`persona name ${JSON.stringify(name)} must match ${AGENT_NAME_PATTERN} (lowercase letters, digits and "-")`);
  }
  const tiers = lookupTiers(options, options.workflow);
  for (const { layer, dir, relDir, fileOf } of tiers) {
    const file = path.join(dir, fileOf(name));
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
    const rel = `${relDir}/${fileOf(name)}`;
    if (fs.statSync(file).size > AGENT_FILE_MAX_BYTES) {
      throw new RunnerConfigError(`persona "${name}" (${rel}) is larger than ${AGENT_FILE_MAX_BYTES} bytes`);
    }
    const text = fs.readFileSync(file, 'utf8');
    const problem = agentShapeProblem(name, text);
    if (problem) throw new RunnerConfigError(`persona "${name}" (${rel}) ${problem}`);
    return { name, tier: layer, source: rel, identity: `${layer}:${relDir}/${name}`, text, digest: crypto.createHash('sha256').update(text).digest('hex') };
  }
  const searched = tiers.map(({ label, dir }) => `${label} (${dir})`).join('; ');
  const hint = tiers.flatMap(({ dir, relDir }) => (fs.existsSync(path.join(dir, `${name}.yml`)) ? [`${relDir}/${name}.yml`] : []))[0];
  throw new AgentNotFoundError(`persona "${name}" not found; searched ${searched}${hint ? `; ${hint} exists but only .yaml files are read` : ''}`);
}
