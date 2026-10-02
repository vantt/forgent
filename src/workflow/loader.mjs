// src/workflow/loader.mjs — Discovery and loading of Workflow definitions
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { validateWorkflow } from './definition.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

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
  return YAML.parse(content);
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
  const root = options.packageRoot ?? resolvePackageRoot(options.cwd ?? process.cwd());
  const workflows = new Map();

  // 1. Core tier: core/workflows/*.{yaml,yml,json}
  const coreDir = path.join(root, 'core', 'workflows');
  if (fs.existsSync(coreDir)) {
    try {
      const files = fs.readdirSync(coreDir).sort();
      for (const file of files) {
        if (/\.(ya?ml|json)$/i.test(file)) {
          const filePath = path.join(coreDir, file);
          try {
            const raw = parseFile(filePath);
            const wf = validateWorkflow(raw);
            workflows.set(wf.id, wf);
          } catch (err) {
            // Re-throw RunnerConfigError or continue
            throw new RunnerConfigError(`Failed to load core workflow from "${filePath}": ${err.message}`);
          }
        }
      }
    } catch (err) {
      if (err instanceof RunnerConfigError) throw err;
    }
  }

  // 2. Domain tier: domains/<domain>/workflows/*.{yaml,yml,json}
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    try {
      const domainEntries = fs.readdirSync(domainsDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
      for (const d of domainEntries) {
        if (d.isDirectory()) {
          const dWfDir = path.join(domainsDir, d.name, 'workflows');
          if (fs.existsSync(dWfDir)) {
            const files = fs.readdirSync(dWfDir).sort();
            for (const file of files) {
              if (/\.(ya?ml|json)$/i.test(file)) {
                const filePath = path.join(dWfDir, file);
                try {
                  const raw = parseFile(filePath);
                  // Default id prefix with domain if not prefixed
                  if (raw && typeof raw === 'object' && !raw.id) {
                    const baseName = path.basename(file, path.extname(file));
                    raw.id = `${d.name}/${baseName}`;
                  }
                  const wf = validateWorkflow(raw);
                  if (!workflows.has(wf.id)) {
                    workflows.set(wf.id, wf);
                  }
                } catch (err) {
                  throw new RunnerConfigError(`Failed to load domain workflow from "${filePath}": ${err.message}`);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof RunnerConfigError) throw err;
    }
  }

  return workflows;
}

/**
 * Load a single Workflow definition by its id.
 *
 * @param {string} id Workflow ID (e.g. 'coding/feature' or 'my-workflow')
 * @param {object} [options]
 * @param {string} [options.packageRoot] Base root
 * @param {string} [options.cwd] Current working directory
 * @returns {Readonly<object>} Validated Workflow
 */
export function loadWorkflow(id, options = {}) {
  if (!id || typeof id !== 'string') {
    throw new RunnerConfigError('loadWorkflow requires a non-empty string id');
  }

  let all = discoverWorkflows(options);
  let found = all.get(id);
  if (!found && options.packageRoot) {
    // If not found in target repo (e.g. temporary test worktree), check core/domains from install root
    const fallbackAll = discoverWorkflows({ cwd: process.cwd() });
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
