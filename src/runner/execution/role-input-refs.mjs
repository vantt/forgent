// Turns the results of earlier roles into the context refs a later role is told to read.
//
// A role's account of its work is already recorded in its run result (`evidence.artifacts`), so
// a later role only needs the path of that account. Paths are made absolute against the main
// checkout: the role may run in a worktree where the repo-relative `.fgos/...` path would not
// exist.

import path from 'node:path';

const REPORT_NAMES = [/^report-\d+\.md$/, /^agent-report\.md$/];
const CLAIM_NAMES = [/^result-\d+\.json$/, /^agent-result\.json$/];

function findArtifact(artifacts, names) {
  for (const name of names) {
    const hit = artifacts.find((a) => typeof a === 'string' && name.test(path.basename(a)));
    if (hit) return hit;
  }
  return null;
}

/**
 * @param {Array<object>} results role results as returned by runRole / history()
 * @param {string} root main checkout root that repo-relative artifact paths are relative to
 * @returns {string[]} absolute paths, in input order, each listed once
 */
export function contextRefsFromRoleResults(results, root) {
  const refs = [];
  for (const result of Array.isArray(results) ? results : []) {
    const artifacts = result?.runResult?.evidence?.artifacts;
    if (!Array.isArray(artifacts)) continue;
    const chosen = findArtifact(artifacts, REPORT_NAMES) ?? findArtifact(artifacts, CLAIM_NAMES);
    if (!chosen) continue;
    const ref = path.resolve(root, chosen);
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}
