// src/workflow/loader.mjs — Discovery and loading of Workflow definitions
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import { describeYamlError, parseYaml } from '../util/yaml.mjs';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { definitionNameOf } from '../convention/definition-names.mjs';
import { listDomainDirs } from '../util/domain-dirs.mjs';
import { OWN_PAYLOAD_ROOT } from '../run-supervisor/payload-root.mjs';

/** The raw definition a workflow file's text holds: JSON for `.json`, the YAML door otherwise. */
export function parseWorkflowText(content, filePath) {
  return filePath.endsWith('.json') ? JSON.parse(content) : parseYaml(content, { filename: filePath });
}

/**
 * The `workflows/` directories of one root in discovery order: core, then each domain by name.
 * `owningDomain` is the domain whose directory it is, null for core.
 *
 * @returns {Array<{ dir: string, owningDomain: string|null }>}
 */
export function workflowDirs(root) {
  const dirs = [];
  const coreDir = path.join(root, 'core', 'workflows');
  if (fs.existsSync(coreDir)) dirs.push({ dir: coreDir, owningDomain: null });
  const domainsDir = path.join(root, 'domains');
  for (const domain of listDomainDirs(domainsDir)) {
    const dir = path.join(domainsDir, domain, 'workflows');
    if (fs.existsSync(dir)) dirs.push({ dir, owningDomain: domain });
  }
  return dirs;
}

/**
 * The workflow files of one `workflows/` directory, in a stable order: flat `<file>.{yaml,yml,json}` files,
 * and packaged workflows, a directory `<name>/` holding `wf.<name>.yaml` (Convention owns that file name).
 * A packaged workflow's directory may also hold its own personas (`agent.<name>.yaml`).
 *
 * @returns {Array<{ filePath: string, workflowDir: string|null, fileName: string }>}
 */
export function workflowFilesIn(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      const fileName = `wf.${entry.name}.yaml`;
      const filePath = path.join(dir, entry.name, fileName);
      if (definitionNameOf('workflow-file', fileName) === entry.name && fs.existsSync(filePath)) {
        found.push({ filePath, workflowDir: path.join(dir, entry.name), fileName });
      }
    } else if (/\.(ya?ml|json)$/i.test(entry.name)) {
      found.push({ filePath: path.join(dir, entry.name), workflowDir: null, fileName: entry.name });
    }
  }
  return found;
}

/**
 * Walk one root's core and domain `workflows/` directories. `problem(kind, filePath, message, tier)` is called
 * for a file that cannot be read, parsed or validated, and for an id defined twice; it throws (the runtime) or
 * records the problem (the doctor), and a file it returns from is skipped.
 *
 * @returns {Map<string, { workflow: Readonly<object>, raw: object, source: { root: string, sourcePath: string, workflowDir: string|null, owningDomain: string|null } }>}
 */
function scanRoot(root, rootLabel, problem) {
  const found = new Map();

  // One id in a packaged and a flat form is a mistake to name, not a precedence to guess. Two flat files
  // sharing an id keep the behaviour of their tier: a later core file replaces, a domain file yields.
  const place = (entry, { replace }) => {
    const { workflow, source } = entry;
    const existing = found.get(workflow.id);
    if (existing && (existing.source.workflowDir === null) !== (source.workflowDir === null)) {
      problem('duplicate', source.sourcePath, `workflow "${workflow.id}" is defined twice, packaged and flat: "${existing.source.sourcePath}" and "${source.sourcePath}"; keep one`);
      return;
    }
    if (!existing || replace) found.set(workflow.id, entry);
  };

  // Core files replace an earlier file of their id; a domain file yields to one already found.
  for (const { dir, owningDomain } of workflowDirs(root)) {
    const tier = owningDomain === null ? 'core' : 'domain';
    for (const { filePath, workflowDir, fileName } of workflowFilesIn(dir)) {
      let text;
      try {
        text = fs.readFileSync(filePath, 'utf8');
      } catch (err) {
        problem('read', filePath, err.message, tier);
        continue;
      }
      let raw;
      try {
        raw = parseWorkflowText(text, filePath);
      } catch (err) {
        problem('parse', filePath, filePath.endsWith('.json') ? err.message : describeYamlError(err), tier);
        continue;
      }
      let workflow;
      try {
        // A domain file without an id takes the domain's prefix.
        if (owningDomain !== null && raw && typeof raw === 'object' && !raw.id) {
          raw.id = `${owningDomain}/${workflowDir === null ? path.basename(fileName, path.extname(fileName)) : path.basename(workflowDir)}`;
        }
        workflow = validateWorkflow(raw);
      } catch (err) {
        problem('validate', filePath, err.message, tier);
        continue;
      }
      place({ workflow, raw, source: Object.freeze({ root: rootLabel, sourcePath: filePath, workflowDir, owningDomain }) }, { replace: owningDomain === null });
    }
  }

  return found;
}

const PROBLEM_WORDS = Object.freeze({ read: 'cannot be read', parse: 'cannot be parsed', validate: 'cannot be validated' });

/**
 * The one answer to "which definition does a Workflow id name": every definition of the project, then every
 * definition the running payload ships, a project definition winning an id the payload also ships. Each entry
 * carries the validated `workflow`, the `raw` document it was read from, and its `source`:
 * `{ root: 'project' | 'payload', sourcePath, workflowDir, owningDomain }` (`workflowDir` null for a flat file).
 * An entry that wins over a shipped id has `overridesShipped: true`. When both roots are one folder it is the
 * project.
 *
 * Without `unreadable` a file that cannot be read, parsed or validated stops the walk with a RunnerConfigError.
 * With it (the doctor's reader) the file is skipped and named in that array, so one bad file does not hide
 * the rest.
 *
 * @param {object} [options]
 * @param {string} [options.projectRoot] Root holding the project's own core/ and domains/; none when absent
 * @param {string} [options.payloadRoot] Root holding the shipped core/ and domains/; the running payload when absent
 * @param {string[]} [options.unreadable] Collects `<file>: cannot be read|parsed|validated: <reason>` instead of throwing
 * @returns {Map<string, { workflow: Readonly<object>, raw: object, overridesShipped: boolean, source: { root: 'project'|'payload', sourcePath: string, workflowDir: string|null, owningDomain: string|null } }>}
 */
export function workflowCatalog({ projectRoot, payloadRoot = OWN_PAYLOAD_ROOT, unreadable } = {}) {
  const roots = [];
  if (projectRoot) roots.push({ root: projectRoot, label: 'project' });
  if (!projectRoot || path.resolve(projectRoot) !== path.resolve(payloadRoot)) roots.push({ root: payloadRoot, label: 'payload' });
  const catalog = new Map();
  const shipped = new Set();
  for (const { root, label } of roots) {
    const problem = (kind, filePath, message, tier) => {
      if (unreadable === undefined) {
        throw new RunnerConfigError(kind === 'duplicate' ? message : `Failed to load ${tier} workflow from "${filePath}": ${message}`);
      }
      const named = path.relative(root, filePath).split(path.sep).join('/');
      unreadable.push(kind === 'duplicate' ? message : `${roots.length > 1 ? `${label}: ` : ''}${named}: ${PROBLEM_WORDS[kind]}: ${message}`);
    };
    for (const [id, entry] of scanRoot(root, label, problem)) {
      if (label === 'payload') shipped.add(id);
      if (!catalog.has(id)) catalog.set(id, { ...entry, overridesShipped: false });
    }
  }
  for (const id of shipped) {
    const entry = catalog.get(id);
    if (entry.source.root === 'project') entry.overridesShipped = true;
  }
  return catalog;
}

/**
 * The Workflow definitions of the catalog by id.
 *
 * @param {object} [options]
 * @param {string} [options.packageRoot] Project root holding its own definitions (the shipped ones are always included)
 * @returns {Map<string, Readonly<object>>} Map of workflow id -> validated Workflow
 */
export function discoverWorkflows(options = {}) {
  return new Map([...workflowCatalog({ projectRoot: options.packageRoot })].map(([id, { workflow }]) => [id, workflow]));
}

/**
 * Load a single Workflow definition by its id, with the place it was found: `source` is
 * `{ root, sourcePath, workflowDir, owningDomain }`, `workflowDir` null for a flat file.
 *
 * @param {string} id Workflow ID (e.g. 'coding/feature' or 'my-workflow')
 * @param {object} [options]
 * @param {string} [options.packageRoot] Project root holding its own definitions; they win over the running payload's shipped ones
 * @returns {{ workflow: Readonly<object>, source: { root: 'project'|'payload', sourcePath: string, workflowDir: string|null, owningDomain: string|null } }}
 */
export function loadWorkflowWithSource(id, options = {}) {
  if (!id || typeof id !== 'string') {
    throw new RunnerConfigError('loadWorkflow requires a non-empty string id');
  }

  const catalog = workflowCatalog({ projectRoot: options.packageRoot });
  const found = catalog.get(id);
  if (!found) {
    throw new RunnerConfigError(`Workflow "${id}" not found. Known workflows: [${[...catalog.keys()].join(', ') || 'none'}]`);
  }
  return found;
}

/**
 * Load a single Workflow definition by its id.
 *
 * @returns {Readonly<object>} Validated Workflow
 */
export function loadWorkflow(id, options = {}) {
  return loadWorkflowWithSource(id, options).workflow;
}

/**
 * Where the persona lookup starts for a registered workflow: `{ workflowDir, owningDomain }`, or null when
 * the id names no registered workflow (a units file, an inline definition).
 */
export function workflowPersonaScope(id, options = {}) {
  try {
    const { source } = loadWorkflowWithSource(id, options);
    return { workflowDir: source.workflowDir, owningDomain: source.owningDomain };
  } catch (err) {
    if (err instanceof RunnerConfigError) return null;
    throw err;
  }
}
