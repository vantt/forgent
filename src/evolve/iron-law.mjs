// iron-law.mjs — domain-layer Iron Law risk classifier (D5/D10/D13/D14).
// Pure decision function: no fs, no Date, no network, no store import. Given a
// candidate's changed files and optional description, it decides whether the
// Iron Law (failing-test-first proof) must gate the fix before it lands.
//
// KNOWN LIMITATION (flag for review before Slice 3 wires this to actually skip
// failing-test-first proof): matchedModules tests filesChanged entries against
// D10+D14's ILLUSTRATIVE path list, not every capability-relevant module in the
// repo. The list is deliberately illustrative, not exhaustive (D10) — a
// recorded residual limitation, not a silent bug.

import path from 'node:path';
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
  // Iron Law's own risk vocabulary (review-20260717-self-improve-base-workflow
  // finding f1): without these two, a diff that narrows HEAVY_KEYWORDS or
  // reweights classify.mjs's tiering silently gets required:false — the gate
  // has no coverage of the files that define what it's supposed to flag.
  { kind: 'equals', value: 'src/intake/risk-keywords.mjs' },
  { kind: 'equals', value: 'src/intake/classify.mjs' },
  // review-20260718-self-improve-loop finding f03: domains.mjs defines each
  // domain's legal FSM stage-transition table, the same capability fsm.mjs
  // already covers above — missing it let a diff widen a domain's legal
  // transitions (e.g. skip a stage) with required:false.
  { kind: 'equals', value: 'src/state/domains.mjs' },
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
 *   strings, normalized (path.posix.normalize) before matching so './x' and 'x'
 *   match identically. Throws if not an array or any entry is not a string.
 * @param {string} [input.description] - optional free text; matched
 *   case-insensitively against every HEAVY_KEYWORDS entry when non-empty. An
 *   absent/empty description yields no flags but never counts as "safe" —
 *   required is still computed from matchedModules. Throws if present but not a
 *   string.
 * @returns {{required: boolean, matchedFlags: string[], matchedModules: string[]}}
 */
export function classifyIronLaw({ filesChanged, description } = {}) {
  if (!Array.isArray(filesChanged)) {
    throw new TypeError(
      'classifyIronLaw: filesChanged must be an array of repo-relative path strings',
    );
  }
  filesChanged.forEach((filePath, i) => {
    if (typeof filePath !== 'string') {
      throw new TypeError(
        `classifyIronLaw: filesChanged[${i}] must be a string, got ${typeof filePath}`,
      );
    }
  });
  if (description !== undefined && typeof description !== 'string') {
    throw new TypeError(
      `classifyIronLaw: description must be a string or omitted, got ${typeof description}`,
    );
  }

  const matchedModules = filesChanged.filter((filePath) =>
    MODULE_RULES.some((rule) => matchesModuleRule(path.posix.normalize(filePath), rule)),
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
