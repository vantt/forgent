// src/runner/execution/case-run-paths.mjs — where a case's run directory is: the one place that builds the path
//
// Every case keeps its ledger and runtime files in `.fgos/workflow-runs/<case id>`. A case id is one path
// segment: it starts with a letter or digit, so `.bindings` (the bindings directory beside the cases) and
// `..` can never name a case, and it holds only letters, digits, `.`, `_` and `-`. Anything else is refused
// here, by name, before a path is made from it.

import path from 'node:path';
import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';

const CASE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Whether `id` is a case id. */
export const isCaseId = (id) => typeof id === 'string' && CASE_ID.test(id);

/** The directory that holds every case, and the bindings directory beside them. */
export const runsRoot = (mainRoot) => path.join(mainRoot, '.fgos', 'workflow-runs');

/** The directory of one case; refuses an id that is not a case id. */
export function runDirOf(mainRoot, caseId) {
  if (!isCaseId(caseId)) throw new RunnerConfigError(`"${String(caseId)}" is not a case id (invalid-case-id)`, { code: 'invalid-case-id' });
  return path.join(runsRoot(mainRoot), caseId);
}

const isPathSegment = (s) => typeof s === 'string' && s !== '' && s !== '.' && s !== '..' && !/[/\\\0\s]/.test(s);

/** Where the owner's answer to one gate of a case is kept, absolute; null when an id names no file there. */
export function gateAnswerFile(mainRoot, caseId, stepId) {
  if (!isCaseId(caseId) || !isPathSegment(stepId)) return null;
  return path.join(runDirOf(mainRoot, caseId), 'gate-answers', `${stepId}.md`);
}
