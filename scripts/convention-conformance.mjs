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

const CONVENTION_RULES_PATH = new URL('../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

function packagedConventionCutoff() {
  const contract = JSON.parse(fs.readFileSync(CONVENTION_RULES_PATH, 'utf8'));
  const cutoffs = new Set(
    contract.rules
      .filter((rule) => Array.isArray(rule.scope) && rule.scope.length > 0 && rule.cutoff)
      .map((rule) => rule.cutoff),
  );
  if (cutoffs.size !== 1) {
    throw new Error(`expected one launch cutoff across scoped packaged rules, found ${cutoffs.size}`);
  }
  return [...cutoffs][0];
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

  let cutoff;
  try {
    cutoff = cutoffResolver(root);
    commitAt(root, cutoff);
  } catch (error) {
    return { passed: false, message: `convention check unavailable: cutoff cannot be inspected: ${error.message}` };
  }

  const recent = [];
  const existing = [];
  for (const violation of result.violations) {
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
