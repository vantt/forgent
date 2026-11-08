// src/workflow/loader.mjs — Discovery and loading of Workflow definitions
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from '../util/yaml.mjs';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { definitionNameOf } from '../convention/definition-names.mjs';
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
  if (fs.existsSync(domainsDir)) {
    for (const d of fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const dir = path.join(domainsDir, d.name, 'workflows');
      if (d.isDirectory() && fs.existsSync(dir)) dirs.push({ dir, owningDomain: d.name });
    }
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
 * Discover every Workflow definition across core and domains, with where each one was found.
 * `owningDomain` comes from the location alone: the domain whose `workflows/` holds the file, null for core.
 *
 * @returns {Map<string, { workflow: Readonly<object>, source: { sourcePath: string, workflowDir: string|null, owningDomain: string|null } }>}
 */
function scanWorkflows(options = {}) {
  const root = options.packageRoot ?? OWN_PAYLOAD_ROOT;
  const found = new Map();

  // One id in a packaged and a flat form is a mistake to name, not a precedence to guess. Two flat files
  // sharing an id keep the behaviour of their tier: a later core file replaces, a domain file yields.
  const place = (workflow, source, { replace }) => {
    const existing = found.get(workflow.id);
    if (existing && (existing.source.workflowDir === null) !== (source.workflowDir === null)) {
      throw new RunnerConfigError(`workflow "${workflow.id}" is defined twice, packaged and flat: "${existing.source.sourcePath}" and "${source.sourcePath}"; keep one`);
    }
    if (!existing || replace) found.set(workflow.id, { workflow, source: Object.freeze(source) });
  };

  // Core files replace an earlier file of their id; a domain file yields to one already found.
  for (const { dir, owningDomain } of workflowDirs(root)) {
    const tier = owningDomain === null ? 'core' : 'domain';
    for (const { filePath, workflowDir, fileName } of workflowFilesIn(dir)) {
      let workflow;
      try {
        const raw = parseWorkflowText(fs.readFileSync(filePath, 'utf8'), filePath);
        // A domain file without an id takes the domain's prefix.
        if (owningDomain !== null && raw && typeof raw === 'object' && !raw.id) {
          raw.id = `${owningDomain}/${workflowDir === null ? path.basename(fileName, path.extname(fileName)) : path.basename(workflowDir)}`;
        }
        workflow = validateWorkflow(raw);
      } catch (err) {
        throw new RunnerConfigError(`Failed to load ${tier} workflow from "${filePath}": ${err.message}`);
      }
      place(workflow, { sourcePath: filePath, workflowDir, owningDomain }, { replace: owningDomain === null });
    }
  }

  return found;
}

/**
 * Discover all available Workflow definitions across core and domains.
 *
 * @param {object} [options]
 * @param {string} [options.packageRoot] Root containing core/ and domains/; the running payload when absent
 * @returns {Map<string, Readonly<object>>} Map of workflow id -> validated Workflow
 */
export function discoverWorkflows(options = {}) {
  return new Map([...scanWorkflows(options)].map(([id, { workflow }]) => [id, workflow]));
}

/**
 * Load a single Workflow definition by its id, with the place it was found: `source` is
 * `{ sourcePath, workflowDir, owningDomain }`, `workflowDir` null for a flat file.
 *
 * @param {string} id Workflow ID (e.g. 'coding/feature' or 'my-workflow')
 * @param {object} [options]
 * @param {string} [options.packageRoot] Project root holding its own definitions; the running payload's shipped ones are the fallback
 * @returns {{ workflow: Readonly<object>, source: { sourcePath: string, workflowDir: string|null, owningDomain: string|null } }}
 */
export function loadWorkflowWithSource(id, options = {}) {
  if (!id || typeof id !== 'string') {
    throw new RunnerConfigError('loadWorkflow requires a non-empty string id');
  }

  let all = scanWorkflows(options);
  let found = all.get(id);
  if (!found && options.packageRoot) {
    // Not in the project: the definitions shipped with the running payload (never the project again).
    const fallbackAll = scanWorkflows({});
    found = fallbackAll.get(id);
    if (found) {
      all = fallbackAll;
    }
  }
  if (!found) {
    const known = [...all.keys()].join(', ');
    throw new RunnerConfigError(`Workflow "${id}" not found. Known workflows: [${known || 'none'}]`);
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
