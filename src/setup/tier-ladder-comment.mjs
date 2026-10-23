// src/setup/tier-ladder-comment.mjs — the tier ladder as the project runner config's `$comment`.
//
// The ladder text has one source, the Seat Binding crate. A project config may carry it as a runner-level
// `$comment` so a person editing `tierFallback`, `modelPolicies` or `maxTier` sees what each tier means.
// `$comment` is documentation: the loader strips it and it never reaches a hash. `fgos setup` refreshes a
// `$comment` that differs from the ladder; a config with no `$comment` is left alone.

import { readSharedConfig, writeSharedConfig } from '../config/shared-config-file.mjs';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The `$comment` lines of the tier ladder the crate answers: one line per tier, weakest first. */
export function ladderCommentLines(definitions) {
  return definitions.map((d) => `${d.name}: ${d.work}; self-check: ${d.selfCheck}; e.g. ${d.examples}`);
}

/**
 * Sets the project's runner-level `$comment` to the ladder when it exists and differs, writing the file
 * back with every other section untouched.
 *
 * @param {string} projectDir
 * @param {object} context
 * @param {() => string[]} context.ladder the ladder lines; read only when a `$comment` is there to compare
 * @returns {{status: 'absent'|'unchanged'|'refreshed'}} `absent`: no runner section or no `$comment`
 */
export function refreshTierLadderComment(projectDir, { ladder }) {
  const shared = readSharedConfig(projectDir);
  if (!isPlainObject(shared.runner) || shared.runner.$comment === undefined) return { status: 'absent' };
  const lines = ladder();
  if (JSON.stringify(shared.runner.$comment) === JSON.stringify(lines)) return { status: 'unchanged' };
  writeSharedConfig(projectDir, { ...shared, runner: { ...shared.runner, $comment: lines } });
  return { status: 'refreshed' };
}
