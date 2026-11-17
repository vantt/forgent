// Runs one vector of packages/execution/contracts/agents.v1.json against the Node listing. The same file serves
// whoever records the vectors and the test that replays them, so the two can never read a vector differently.
// A vector is `{ name, project, install, expect }`: `project` and `install` map a project-relative path to the
// file's text; `install` is null when the project is its own install. The files are written under a temporary
// directory, so a vector never depends on the machine running it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listAgents } from '../../src/runner/agent-listing.mjs';

function writeFiles(root, files) {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
}

/** The listing the Node door answers for the files of a vector, as plain JSON. */
export function evaluateVector({ project, install }) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-vector-'));
  try {
    const projectRoot = path.join(base, 'project');
    fs.mkdirSync(projectRoot);
    writeFiles(projectRoot, project ?? {});
    let installRoot = projectRoot;
    if (install) {
      installRoot = path.join(base, 'install');
      fs.mkdirSync(installRoot);
      writeFiles(installRoot, install);
    }
    return JSON.parse(JSON.stringify(listAgents({ projectRoot, installRoot })));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
}
