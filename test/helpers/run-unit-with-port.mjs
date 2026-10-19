// test/helpers/run-unit-with-port.mjs — `runUnit` the way every production caller calls it: with the real admission port
//
// A writing Unit is refused without the port, so a test that drives `runUnit` builds the same port the
// entry points build, over the repository the run is about. Options that name a `caseAdmission` of
// their own (a test of the port itself) keep it.

import { runUnit as coreRunUnit, resolveGitRoots } from '../../src/runner/execution/run.mjs';
import { createCaseAdmissionPort } from '../../src/workflow/case-admission-port.mjs';

function mainRootOf(options) {
  if (options.repoRoot) return options.repoRoot;
  try {
    return resolveGitRoots(options.cwd ?? process.cwd()).mainCheckoutRoot;
  } catch {
    return null;
  }
}

export function runUnitWithPort(options = {}) {
  if (options.caseAdmission !== undefined) return coreRunUnit(options);
  const repoRoot = mainRootOf(options);
  return coreRunUnit(repoRoot ? { ...options, caseAdmission: createCaseAdmissionPort({ repoRoot }) } : options);
}
