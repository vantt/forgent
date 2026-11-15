// session.mjs — the Node readers' door to the per-session checkout registry.
//
// The registry (`.fgos/sessions.json`), the session worktrees and the `fgos session start|end|list|gc` verbs
// belong to the Rust host (`apps/fgos/src/wiring/session.rs`); this module only asks it. The merge, approve,
// post-land drift and `return` paths read the registry through `listSessions`, one client of the one verb.

import { invokeHost } from '../util/host-bin.mjs';

/**
 * The current session registry rows of the project `repoRoot` sits in, as `fgos session list` answers them.
 * The verb acts on the directory it is started in, so the host child runs in `repoRoot`.
 */
export function listSessions(repoRoot) {
  return invokeHost(['session', 'list'], { dir: repoRoot, cwd: repoRoot });
}
