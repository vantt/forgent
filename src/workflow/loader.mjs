// src/workflow/loader.mjs — Discovery and loading of Workflow definitions
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from '../util/yaml.mjs';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { definitionNameOf } from '../convention/seat-id.mjs';

function resolvePackageRoot(cwd = process.cwd()) {
  // Find package root from cwd or fallback to nearest directory containing package.json or core/workflows
  let cur = path.resolve(cwd);
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'core', 'workflows')) || fs.existsSync(path.join(cur, 'package.json'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  // Final fallback: check repo root containing this file
  const fileDir = path.dirname(new URL(import.meta.url).pathname);
  const repoRoot = path.resolve(fileDir, '..', '..');
  if (fs.existsSync(path.join(repoRoot, 'core', 'workflows'))) {
    return repoRoot;
  }
  return path.resolve(cwd);
}

function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  return parseYaml(content, { filename: filePath });
}

/**
 * The workflow files of one `workflows/` directory, in a stable order: flat `<file>.{yaml,yml,json}` files,
 * and packaged workflows, a directory `<name>/` holding `wf.<name>.yaml` (Convention owns that file name).
 * A packaged workflow's directory may also hold its own personas (`agent.<name>.yaml`).
 *
 * @returns {Array<{ filePath: string, workflowDir: string|null, fileName: string }>}
 */
function workflowFilesIn(dir) {
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
  const root = options.packageRoot ?? resolvePackageRoot(options.cwd ?? process.cwd());
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

  // 1. Core tier: core/workflows
  const coreDir = path.join(root, 'core', 'workflows');
  if (fs.existsSync(coreDir)) {
    for (const { filePath, workflowDir } of workflowFilesIn(coreDir)) {
      let workflow;
      try {
        workflow = validateWorkflow(parseFile(filePath));
      } catch (err) {
        throw new RunnerConfigError(`Failed to load core workflow from "${filePath}": ${err.message}`);
      }
      place(workflow, { sourcePath: filePath, workflowDir, owningDomain: null }, { replace: true });
    }
  }

  // 2. Domain tier: domains/<domain>/workflows
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    const domainEntries = fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const d of domainEntries) {
      if (!d.isDirectory()) continue;
      const dWfDir = path.join(domainsDir, d.name, 'workflows');
      if (!fs.existsSync(dWfDir)) continue;
      for (const { filePath, workflowDir, fileName } of workflowFilesIn(dWfDir)) {
        let workflow;
        try {
          const raw = parseFile(filePath);
          // Default id prefix with domain if not prefixed
          if (raw && typeof raw === 'object' && !raw.id) {
            const baseName = workflowDir === null ? path.basename(fileName, path.extname(fileName)) : path.basename(workflowDir);
            raw.id = `${d.name}/${baseName}`;
          }
          workflow = validateWorkflow(raw);
        } catch (err) {
          throw new RunnerConfigError(`Failed to load domain workflow from "${filePath}": ${err.message}`);
        }
        place(workflow, { sourcePath: filePath, workflowDir, owningDomain: d.name }, { replace: false });
      }
    }
  }

  return found;
}

/**
 * Discover all available Workflow definitions across core and domains.
 *
 * @param {object} [options]
 * @param {string} [options.packageRoot] Base root containing core/ and domains/
 * @param {string} [options.cwd] Current working directory
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
 * @param {string} [options.packageRoot] Base root
 * @param {string} [options.cwd] Current working directory
 * @returns {{ workflow: Readonly<object>, source: { sourcePath: string, workflowDir: string|null, owningDomain: string|null } }}
 */
export function loadWorkflowWithSource(id, options = {}) {
  if (!id || typeof id !== 'string') {
    throw new RunnerConfigError('loadWorkflow requires a non-empty string id');
  }

  let all = scanWorkflows(options);
  let found = all.get(id);
  if (!found && options.packageRoot) {
    // If not found in target repo (e.g. temporary test worktree), check core/domains from install root
    const fallbackAll = scanWorkflows({ cwd: process.cwd() });
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
