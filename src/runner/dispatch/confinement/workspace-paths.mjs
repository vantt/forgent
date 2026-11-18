// workspace-paths.mjs -- the shape rule of a workspace-paths grant, and the error the confinement shapes throw.
//
// A leaf: it imports nothing of the confinement layer, so the resolver, the policy shape check and the launch of a
// head all reach the one path check without pulling the backend registry (and with it the drivers) into their imports.

import path from 'node:path';

/** The grant that binds named paths of the project root writable: one entry of `paths`, relative to the root. */
export const WORKSPACE_PATHS_RESOURCE = 'workspace-paths';

/** `paths` of a workspace-paths grant: relative, inside the root, no glob; refused by name, never normalized into range. */
export function validateWorkspacePaths(paths, label) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new ConfinementPolicyError(`runner config (${label}) "paths" must be a non-empty array of project-relative paths.`);
  }
  for (const entry of paths) {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new ConfinementPolicyError(`runner config (${label}) "paths" entries must be non-empty strings, got: ${JSON.stringify(entry)}.`);
    }
    if (path.isAbsolute(entry) || /^[A-Za-z]:/.test(entry)) {
      throw new ConfinementPolicyError(`runner config (${label}) path ${JSON.stringify(entry)} is absolute; a workspace path is relative to the project root.`);
    }
    if (entry.split(/[\\/]/).includes('..')) {
      throw new ConfinementPolicyError(`runner config (${label}) path ${JSON.stringify(entry)} climbs out of the project root with "..".`);
    }
    if (/[*?[\]{}]/.test(entry)) {
      throw new ConfinementPolicyError(`runner config (${label}) path ${JSON.stringify(entry)} contains a glob character; name the exact path.`);
    }
  }
}

export class ConfinementPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfinementPolicyError';
  }
}
