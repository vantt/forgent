// iron-law-gate.mjs — the one place that turns a work item into an Iron Law
// verdict, and the one place that words the refusal.
//
// `classifyIronLaw` (evolve/iron-law.mjs) is a pure function of a file list
// plus a description; it knows nothing about git. Every caller therefore had
// to build the same three things first: which branch to diff against, the
// item's own changed-file list, and the refusal text. That preamble was
// copy-pasted verbatim at three call sites in bin/fgos.mjs (`merge next`'s
// pre-check, `approve`'s real gate, `sync-root`'s gate), so a change to how
// the diff base is resolved had to be made three times to stay consistent —
// which is exactly the shape of drift a gate must not have (tsk-49i D1).
//
// Deliberately NOT part of the gate: whether the caller acknowledged the law
// (`--acknowledge-iron-law`), and whether the item is even runner-sourced.
// Both are the calling verb's own policy — this module only answers "does
// this item's own diff trip the law, and what does refusing it say".
import { changedFiles } from './merge.mjs';
import { branchNameFor, branchExists } from './worktree.mjs';
import { resolveRoot } from '../state/frontier.mjs';
import { classifyIronLaw } from '../evolve/iron-law.mjs';

/**
 * Resolve the `changedFiles` options that scope an item's diff to ITS OWN
 * work rather than its whole lineage (tsk-4voj-iron-law-leaf-scope D1).
 *
 * - `trunk` given explicitly — diff against that branch. `null`/omitted with
 *   no `view` means the caller has no nested target: diff against the repo
 *   trunk, `changedFiles`' own default.
 * - `view` given — walk the item's lineage to its resolved root and diff
 *   against `fgw/<root>` when that branch exists. A resolved root without
 *   its own branch (e.g. a milestone root still at stage `clarify`, never
 *   itself taken) has no ref to diff against, so fall back to the default
 *   rather than crashing on an unknown revision.
 */
function ironLawDiffOpts(repoRoot, item, { view, trunk }) {
  if (typeof trunk === 'string' && trunk !== '') return { trunk };
  if (!view) return {};
  const rootId = resolveRoot(view, item.id);
  if (rootId === item.id) return {};
  const rootBranch = branchNameFor(rootId);
  return branchExists(repoRoot, rootBranch) ? { trunk: rootBranch } : {};
}

/**
 * Classify one item's own diff against the Iron Law.
 *
 * @param {string} repoRoot
 * @param {{id: string, description?: string}} item
 * @param {{view?: object|null, trunk?: string|null}} [opts] - exactly one of
 *   `view` (walk to the resolved root branch) or `trunk` (an already-resolved
 *   target branch) is normally supplied; see `ironLawDiffOpts`.
 * @returns {{filesChanged: string[], required: boolean, matchedFlags: string[], matchedModules: string[]}}
 *   `filesChanged` is returned alongside the verdict so a caller that also
 *   needs the item's own diff (approve's clean-tree `ownFileSet`) reuses this
 *   one git read instead of recomputing it.
 */
export function ironLawForItem(repoRoot, item, { view = null, trunk = null } = {}) {
  const filesChanged = changedFiles(repoRoot, item, ironLawDiffOpts(repoRoot, item, { view, trunk }));
  return { filesChanged, ...classifyIronLaw({ filesChanged, description: item.description }) };
}

/** The refusal a verb reports when `ironLawForItem` says required and the
 * caller did not acknowledge. `verb` is the reporting verb's own name so the
 * message names the command the user actually ran. */
export function ironLawRefusal(verb, id, { matchedFlags, matchedModules }) {
  return (
    `${verb}: "${id}" trips the Iron Law — a failing test must precede this self-modifying diff before it can land. `
    + `Matched flags: [${matchedFlags.join(', ') || 'none'}]; matched modules: [${matchedModules.join(', ') || 'none'}]. `
    + `Re-run with --acknowledge-iron-law to confirm failing-test-first proof and proceed.`
  );
}
