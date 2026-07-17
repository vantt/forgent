// iron-law.mjs — domain-layer Iron Law risk classifier (D5/D10/D13/D14).
// Pure decision function: no fs, no Date, no network, no store import. Given a
// candidate's changed files and optional description, it decides whether the
// Iron Law (failing-test-first proof) must gate the fix before it lands.
//
// KNOWN LIMITATION (flag for review before Slice 3 wires this to actually skip
// failing-test-first proof): matchedModules tests filesChanged entries against
// D10+D14's ILLUSTRATIVE path list, not every capability-relevant module in the
// repo, and it matches paths LITERALLY — no normalization/canonicalization. A
// caller passing './x', 'repo/x', or a '..'-traversal path gets a literal,
// un-normalized match attempt. Normalizing paths to repo-relative form before
// calling classifyIronLaw is the future caller's contract (Slice 3), not this
// module's job. Both are recorded residual limitations, not silent bugs.

import { HEAVY_KEYWORDS } from '../intake/risk-keywords.mjs';

// D10+D14 self-modifying-capable module list. Each rule tests a filesChanged
// entry literally: 'prefix' matches any path starting with the value; 'equals'
// matches the exact path. bin/fgos.mjs (the whole entry file) deliberately
// stands in for "the evolve verb" — over-reporting on any bin/fgos.mjs change is
// the safe direction (D13).
const MODULE_RULES = [
  { kind: 'prefix', value: 'src/runner/' },
  { kind: 'equals', value: 'src/report/entropy.mjs' },
  { kind: 'prefix', value: 'src/evolve/' },
  { kind: 'equals', value: 'bin/fgos.mjs' },
  { kind: 'equals', value: 'src/state/store.mjs' },
  { kind: 'equals', value: 'src/state/fsm.mjs' },
];

function matchesModuleRule(filePath, rule) {
  return rule.kind === 'prefix'
    ? filePath.startsWith(rule.value)
    : filePath === rule.value;
}

/**
 * Classify a candidate diff for the Iron Law (D5/D10/D13/D14).
 *
 * @param {object} input
 * @param {string[]} input.filesChanged - required array of repo-relative path
 *   strings, matched LITERALLY (no normalization). Throws if not an array.
 * @param {string} [input.description] - optional free text; matched
 *   case-insensitively against every HEAVY_KEYWORDS entry when non-empty. An
 *   absent/empty description yields no flags but never counts as "safe" —
 *   required is still computed from matchedModules.
 * @returns {{required: boolean, matchedFlags: string[], matchedModules: string[]}}
 */
export function classifyIronLaw({ filesChanged, description } = {}) {
  if (!Array.isArray(filesChanged)) {
    throw new TypeError(
      'classifyIronLaw: filesChanged must be an array of repo-relative path strings',
    );
  }

  const matchedModules = filesChanged.filter((filePath) =>
    MODULE_RULES.some((rule) => matchesModuleRule(filePath, rule)),
  );

  const matchedFlags = [];
  if (typeof description === 'string' && description.length > 0) {
    const lowerDescription = description.toLowerCase();
    for (const keyword of HEAVY_KEYWORDS) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        matchedFlags.push(keyword);
      }
    }
  }

  const required = matchedModules.length > 0 || matchedFlags.length > 0;
  return { required, matchedFlags, matchedModules };
}
