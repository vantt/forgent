// test/helpers/trivial-workflow.mjs — a project-local Workflow with one step and no Units,
// so a CLI run through `fgos workflow start <id>` completes without any worker.

import fs from 'node:fs';
import path from 'node:path';

export const TRIVIAL_WORKFLOW_ID = 'trivial-cli';

/** Write the one-step Workflow under `<repoRoot>/core/workflows` and return its id. */
export function writeTrivialWorkflow(repoRoot) {
  const dir = path.join(repoRoot, 'core', 'workflows');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${TRIVIAL_WORKFLOW_ID}.yaml`),
    `id: ${TRIVIAL_WORKFLOW_ID}\nsteps:\n  - id: start\n    title: Start\n`,
  );
  return TRIVIAL_WORKFLOW_ID;
}
