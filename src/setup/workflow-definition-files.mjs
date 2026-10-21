// workflow-definition-files.mjs — the one reader of Workflow definition files for doctor checks.
//
// It reads the raw definitions (not the validated ones the loader returns) so that a file that does not
// parse is named by the check that reads it instead of stopping every check. Which files make a Workflow
// (flat files and packaged directories) is the loader's one rule.

import fs from 'node:fs';
import path from 'node:path';

import { workflowFilesIn } from '../workflow/loader.mjs';
import { describeYamlError, parseYaml } from '../util/yaml.mjs';

function workflowDefinitionFiles(root) {
  const dirs = [];
  const core = path.join(root, 'core', 'workflows');
  if (fs.existsSync(core)) dirs.push({ dir: core, prefix: '' });
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    for (const d of fs.readdirSync(domainsDir, { withFileTypes: true })) {
      const dir = path.join(domainsDir, d.name, 'workflows');
      if (d.isDirectory() && fs.existsSync(dir)) dirs.push({ dir, prefix: `${d.name}/` });
    }
  }
  const files = [];
  for (const { dir, prefix } of dirs) {
    for (const { filePath, workflowDir, fileName } of workflowFilesIn(dir)) {
      const name = workflowDir === null ? fileName.replace(/\.[^.]+$/, '') : path.basename(workflowDir);
      files.push({ file: filePath, rel: path.relative(root, filePath).split(path.sep).join('/'), fileId: `${prefix}${name}` });
    }
  }
  return files;
}

/**
 * The one reader of Workflow definition files. Every `core/workflows` and `domains/*\/workflows` file
 * `.yaml`, `.yml` or `.json` under each root is read and parsed (JSON.parse for `.json`, the YAML door
 * otherwise). A file that cannot be read or parsed is left out of `files` and named in `unreadable` as
 * `<file>: cannot be read: <reason>` or `<file>: cannot be parsed: <reason>`; the file is prefixed with its
 * root's label (`package: ...`, `project: ...`) when more than one root is scanned.
 *
 * @param {Array<{ root: string, label: string }>} roots
 * @returns {{ files: Array<{ fileId: string, rel: string, root: string, raw: unknown }>, unreadable: string[] }}
 */
export function readWorkflowDefinitionFiles(roots) {
  const files = [];
  const unreadable = [];
  for (const { root, label } of roots) {
    for (const { file, rel, fileId } of workflowDefinitionFiles(root)) {
      const named = roots.length > 1 ? `${label}: ${rel}` : rel;
      let body;
      try {
        body = fs.readFileSync(file, 'utf8');
      } catch (err) {
        unreadable.push(`${named}: cannot be read: ${err.message}`);
        continue;
      }
      try {
        files.push({ fileId, rel, root, raw: file.endsWith('.json') ? JSON.parse(body) : parseYaml(body, { filename: rel }) });
      } catch (err) {
        unreadable.push(`${named}: cannot be parsed: ${file.endsWith('.json') ? err.message : describeYamlError(err)}`);
      }
    }
  }
  return { files, unreadable };
}

/** The roots a doctor check reads Workflow definitions from: the package, then the project when it is another folder. */
export function workflowRoots(cwd, packageRoot) {
  const roots = [{ root: packageRoot, label: 'package' }];
  if (path.resolve(cwd) !== path.resolve(packageRoot)) roots.push({ root: cwd, label: 'project' });
  return roots;
}

/**
 * Workflow definitions under `roots`, each as { id, steps }; the first definition of an id wins. Files
 * that cannot be read or parsed are named in `unreadable` (see readWorkflowDefinitionFiles).
 */
export function loadWorkflowDefinitions(roots) {
  const { files, unreadable } = readWorkflowDefinitionFiles(roots);
  const workflows = new Map();
  for (const { fileId, raw } of files) {
    const id = typeof raw?.id === 'string' && raw.id ? raw.id : fileId;
    if (!workflows.has(id)) workflows.set(id, { id, steps: Array.isArray(raw?.steps) ? raw.steps : [] });
  }
  return { workflows, unreadable };
}

/**
 * A check's verdict with the Workflow files it could not evaluate added: the normal message stands, the
 * named problems are appended, and any unreadable file fails the check.
 */
export function withUnreadableDefinitions(result, unreadable) {
  if (unreadable.length === 0) return result;
  return {
    passed: false,
    message: `${result.message}; Workflow definitions that cannot be read or parsed, so they are not evaluated: ${unreadable.join('; ')}`,
  };
}

/**
 * The unit contract subset a Workflow unit stands for, as the runner would build it from its template.
 * The one place doctor checks turn a definition's unit into something `simulateUnitBindings` can drive.
 */
export function workflowUnitContract(unit) {
  const template = unit?.template ?? {};
  return {
    id: unit.id,
    objective: template.objective ?? '',
    capability: template.capability,
    rigor: template.rigor,
    writes: template.writes ?? [],
    pattern: template.params ? { pattern: template.pattern, params: template.params } : template.pattern,
    ...(template.seats ? { seats: template.seats } : {}),
  };
}
