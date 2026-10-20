// test/helpers/run-unit-with-port.mjs — `runUnit` the way every production caller calls it: with the real admission port
//
// A writing Unit is refused without the port, so a test that drives `runUnit` builds the same port the
// entry points build, over the repository the run is about. Options that name a `caseAdmission` of
// their own (a test of the port itself) keep it.

import fs from 'node:fs';
import path from 'node:path';
import { runUnit as coreRunUnit, resolveGitRoots } from '../../src/runner/execution/run.mjs';
import { createCaseAdmissionPort } from '../../src/workflow/case-admission-port.mjs';
import { activateGitFixture } from './git-fixture.mjs';

function mainRootOf(options) {
  if (options.repoRoot) return options.repoRoot;
  try {
    return resolveGitRoots(options.cwd ?? process.cwd()).mainCheckoutRoot;
  } catch {
    return null;
  }
}

// Native Git tests model an activated fixture, like the typed-port fixtures.
// This is fixture setup; production's activation fence remains mandatory.
export function prepareActivatedGitFixture(repoRoot) {
  if (!repoRoot || !fs.existsSync(path.join(repoRoot, '.git'))) return;
  if (fs.existsSync(path.join(repoRoot, '.fgos/locks/activation.lock'))) return;
  activateGitFixture(repoRoot);
}

export function runUnitWithPort(options = {}) {
  const repoRoot = mainRootOf(options);
  prepareActivatedGitFixture(repoRoot);
  if (options.caseAdmission !== undefined) return coreRunUnit(options);
  return coreRunUnit(repoRoot ? { ...options, caseAdmission: createCaseAdmissionPort({ repoRoot }) } : options);
}
