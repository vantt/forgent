// convention-conformance.mjs -- the fgOS source repository conforms to the packaged
// naming, documentation-placement and retired-root rules. A block-posture violation
// always fails; a warn-posture violation fails only for a path introduced after the
// rules' launch cutoff. The judgment itself is the native Convention host's
// (`fgos convention check --all`); this file owns only the verdict over its answer.
// A host that cannot answer is a failure, never a pass.
// Owned proof: test/scripts/convention-conformance.test.mjs.

import fs from 'node:fs';
import { commitAt, pathExistsAt } from '../src/git/inspect.mjs';
import { conventionCheck } from '../src/convention/convention-client.mjs';
import { matchesWriteScope } from '../src/runner/dispatch/write-scope.mjs';

const CONVENTION_RULES_PATH = new URL('../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

let cachedContract = null;
function getContract() {
  if (!cachedContract) {
    cachedContract = JSON.parse(fs.readFileSync(CONVENTION_RULES_PATH, 'utf8'));
  }
  return cachedContract;
}

function ruleForPath(rules, relativePath) {
  for (const rule of rules) {
    if (Array.isArray(rule.scope) && rule.scope.length > 0 && matchesWriteScope(relativePath, rule.scope)) {
      return rule;
    }
  }
  const candidate = rules
    .filter((rule) => Array.isArray(rule.roots) && rule.roots.length > 0 && Array.isArray(rule.scope) && rule.scope.length > 0)
    .flatMap((rule) => rule.roots.map((root) => ({ rule, root })))
    .filter(({ root, rule }) => {
      if (rule.template && !rule.template.includes('{')) {
        return relativePath === `${root}${rule.template}`;
      }
      return root !== 'plans/' && relativePath.startsWith(root);
    })
    .sort((a, b) => b.root.length - a.root.length)[0];
  return candidate?.rule ?? null;
}

function packagedConventionCutoff(_root, relativePath) {
  const contract = getContract();
  const launchCutoff = contract.rules.find((rule) => rule.id === 'report')?.cutoff ?? '3faf81996';
  if (!relativePath) return launchCutoff;
  const rule = ruleForPath(contract.rules, relativePath);
  return rule?.cutoff ?? launchCutoff;
}

function pathWasIntroducedAfter(root, relativePath, cutoff) {
  try {
    return !pathExistsAt(root, commitAt(root, cutoff), relativePath);
  } catch {
    return true;
  }
}

export function checkConventionConformance(root, {
  hostRunner = conventionCheck,
  cutoffResolver = packagedConventionCutoff,
  introducedAfter = pathWasIntroducedAfter,
} = {}) {
  let result;
  try {
    result = hostRunner({ all: true }, { dir: root });
  } catch (error) {
    const category = error?.code ?? 'client-load-error';
    const detail = error?.timedOut ? 'host timed out' : (error?.message ?? 'unknown error');
    return { passed: false, message: `convention check unavailable: ${category}: ${detail}` };
  }
  if (!result || !Array.isArray(result.violations)) {
    return { passed: false, message: 'convention check unavailable: host returned an invalid result' };
  }
  if (result.violations.length === 0) {
    return { passed: true, message: `convention check passed: ${result.checked ?? 0} scoped file(s), no violations` };
  }

  const blocking = result.violations.filter((violation) => violation.posture === 'block');
  if (blocking.length > 0) {
    return {
      passed: false,
      message: `convention placement refused: ${blocking.length} blocking violation(s); examples: ${blocking.slice(0, 3).map((v) => `${v.path}: ${v.code} ${v.message}`).join('; ')}`,
    };
  }

  const resolveCutoffFor = (relPath) => {
    if (typeof cutoffResolver === 'function') {
      return cutoffResolver(root, relPath);
    }
    return cutoffResolver;
  };

  const commitCache = new Map();
  const getCommit = (cutoff) => {
    if (!commitCache.has(cutoff)) {
      commitCache.set(cutoff, commitAt(root, cutoff));
    }
    return commitCache.get(cutoff);
  };

  const recent = [];
  const existing = [];
  for (const violation of result.violations) {
    let cutoff;
    try {
      cutoff = resolveCutoffFor(violation.path);
      getCommit(cutoff);
    } catch (error) {
      return { passed: false, message: `convention check unavailable: cutoff cannot be inspected: ${error.message}` };
    }
    (introducedAfter(root, violation.path, cutoff) ? recent : existing).push(violation);
  }
  const examples = result.violations
    .slice(0, 3)
    .map((violation) => `${violation.path}: ${violation.code} ${violation.message}`)
    .join('; ');
  return {
    passed: recent.length === 0,
    message: `convention violations: ${existing.length} pre-cutoff, ${recent.length} post-cutoff; checked ${result.checked ?? 0}; examples: ${examples}`,
  };
}
