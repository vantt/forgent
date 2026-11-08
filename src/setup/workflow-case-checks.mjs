// workflow-case-checks.mjs — doctor checks of the worktree binding records of Workflow cases
// (docs/platform/workflow/spec.md#6-business-rules RUL-WF-27). Bodies live here; `registrations.mjs` registers them.
//
// The ledger is the truth (L3); a binding record is a view of it. `workflow-case-bindings` reports where
// they disagree through the Workflow's own reader (`inspectCaseBindings`); the repair runs on the Workflow's
// normal path, under the owning case's hold, never from here. The one readiness fix is the sentinel that marks
// the bindings directory as the real one.

import fs from 'node:fs';
import path from 'node:path';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { bindingsDir, ensureBindingsSentinel, inspectCaseBindings, SENTINEL_NAME } from '../workflow/case-bindings.mjs';

const MAX_LISTED = 5;

function rootOf(cwd) {
  return resolveMainCheckoutRoot(cwd) ?? cwd;
}

const listed = (items) => (items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join('; ')}; and ${items.length - MAX_LISTED} more` : items.join('; '));

/** Doctor check `workflow-case-binding-sentinel`: a bindings directory carries the host's sentinel. */
export function checkWorkflowCaseBindingSentinel(cwd) {
  const dir = bindingsDir(rootOf(cwd));
  if (!fs.existsSync(dir)) return { passed: true, message: 'info: no worktree has been bound by a Workflow case here' };
  if (!fs.existsSync(path.join(dir, SENTINEL_NAME))) {
    return { passed: false, message: `${dir} has no ${SENTINEL_NAME} sentinel, so a reader cannot tell it from a masked view; run fgos doctor --fix` };
  }
  return { passed: true, message: 'bindings directory is marked as the real one' };
}

/** Doctor check `workflow-case-bindings`: every binding record matches the ledger of its case, and the other way round. */
export function checkWorkflowCaseBindings(cwd) {
  const { problems, records } = inspectCaseBindings(rootOf(cwd));
  return problems.length === 0
    ? { passed: true, message: `${records} binding record(s) match their ledgers` }
    : { passed: false, message: listed(problems) };
}

/** Fix `workflow-case-bindings`: the sentinel. Settling a record is the owning case's own hold. */
export function fixWorkflowCaseBindings(cwd) {
  const root = rootOf(cwd);
  const wrote = fs.existsSync(bindingsDir(root)) && !fs.existsSync(path.join(bindingsDir(root), SENTINEL_NAME)) && ensureBindingsSentinel(root);
  return { changed: wrote, message: wrote ? 'wrote the sentinel' : 'the sentinel is in place' };
}
