// workflow-catalog-reader.mjs — how doctor checks read Workflow definitions: through the Workflow loader's one
// catalog (project definitions first, then the running payload's), the same one `fgos workflow start` runs from.
//
// A file that cannot be read, parsed or validated is named by the check that reads the catalog instead of
// stopping every check.

import { workflowCatalog } from '../workflow/loader.mjs';
import { unitFieldsOfTemplate } from '../workflow/steps.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';

/**
 * The catalog a doctor check evaluates, with the files it could not evaluate. The project root is the main
 * checkout's, as the runner resolves it. `payloadRoot` is the running payload's unless a test names another.
 *
 * @param {string} cwd
 * @param {{ payloadRoot?: string }} [options]
 * @returns {{ catalog: ReturnType<typeof workflowCatalog>, unreadable: string[] }}
 */
export function readWorkflowCatalog(cwd, { payloadRoot } = {}) {
  const unreadable = [];
  const catalog = workflowCatalog({ projectRoot: resolveMainCheckoutRoot(cwd) ?? cwd, payloadRoot, unreadable });
  return { catalog, unreadable };
}

/** Where a catalog entry's definition came from, for a message that names it: `project definition <file>`. */
export function sourceOf({ source }) {
  return `${source.root} definition ${source.sourcePath}`;
}

/** The activities a definition declares itself (top level or under `guide`), not the ones the guide derives from steps. */
export function declaredActivities({ raw }) {
  if (Array.isArray(raw?.activities)) return raw.activities;
  return Array.isArray(raw?.guide?.activities) ? raw.guide.activities : [];
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

/** The unit a Workflow definition's unit stands for, as the runner would start it (one projection, `unitFieldsOfTemplate`). */
export function workflowUnitContract(unit) {
  const template = unit?.template ?? {};
  return { id: unit.id, objective: template.objective ?? '', ...unitFieldsOfTemplate(template) };
}
