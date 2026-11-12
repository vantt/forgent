import path from 'node:path';
import { gitWriter } from '../../git/inspect.mjs';
import { resolveStateRoot } from '../../holder-lock/state-root.mjs';

/** What `create` and `remove` both act through: the caller's directory, the main checkout it resolved to, the state root
 * worktree-admin records under, and the identity the Git port writes as. Built once per invocation. */
export function worktreeContext(cwd, repoRoot) {
  const fgosDir = path.join(repoRoot, '.fgos');
  return { cwd, repoRoot, stateRoot: resolveStateRoot({ fgosDir }).stateRoot, writer: gitWriter(fgosDir) };
}
