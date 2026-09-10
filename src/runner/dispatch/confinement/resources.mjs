// resources.mjs — resource resolver for Confinement Authority (Phase 03 R2, spec §6.3).
//
// Resolves:
//   - run-output: dispatch-scoped writable run directory
//   - workspace: root workspace granted to dispatch
//   - workspace-git-metadata: per-worktree git directory and metadata
//   - private-home: temporary home directory allocated under tempRoot with ownership marker
//   - executor-credentials: read-only credentials path/directory
//
// All paths are canonically resolved. Symlink escapes outside declared root boundaries
// are strictly refused (confinement-grant-invalid), never silently clamped.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class ConfinementResourceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ConfinementResourceError';
    this.code = code;
  }
}

/**
 * Canonically resolves a path and verifies it stays inside declared root.
 * Refuses on symlink escape; never silently clamps.
 */
export function canonicalizeAndVerifySubpath(targetPath, declaredRoot, resourceName) {
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    throw new ConfinementResourceError(
      'confinement-grant-invalid',
      `resource "${resourceName}" target path must be a non-empty string.`,
    );
  }
  if (typeof declaredRoot !== 'string' || !declaredRoot.trim()) {
    throw new ConfinementResourceError(
      'confinement-grant-invalid',
      `resource "${resourceName}" declared root must be a non-empty string.`,
    );
  }

  const absRoot = path.resolve(declaredRoot);
  const absTarget = path.resolve(targetPath);

  // Resolve real canonical path of root if it exists
  let realRoot = absRoot;
  try {
    if (fs.existsSync(absRoot)) {
      realRoot = fs.realpathSync(absRoot);
    }
  } catch (err) {
    throw new ConfinementResourceError(
      'confinement-grant-invalid',
      `failed to resolve canonical root for resource "${resourceName}": ${err.message}`,
    );
  }

  // Resolve real canonical path of target
  let realTarget = absTarget;
  try {
    if (fs.existsSync(absTarget)) {
      realTarget = fs.realpathSync(absTarget);
    } else {
      // For paths that don't exist yet, resolve the closest existing ancestor
      let ancestor = path.dirname(absTarget);
      let relativeTail = path.basename(absTarget);
      while (ancestor !== path.dirname(ancestor) && !fs.existsSync(ancestor)) {
        relativeTail = path.join(path.basename(ancestor), relativeTail);
        ancestor = path.dirname(ancestor);
      }
      if (fs.existsSync(ancestor)) {
        const realAncestor = fs.realpathSync(ancestor);
        realTarget = path.join(realAncestor, relativeTail);
      }
    }
  } catch (err) {
    throw new ConfinementResourceError(
      'confinement-grant-invalid',
      `failed to resolve canonical target for resource "${resourceName}": ${err.message}`,
    );
  }

  // Check containment
  const isInside = realTarget === realRoot || realTarget.startsWith(realRoot + path.sep);
  if (!isInside) {
    throw new ConfinementResourceError(
      'confinement-grant-invalid',
      `symlink escape or out-of-bounds path detected for resource "${resourceName}": resolved path "${realTarget}" escapes declared root "${realRoot}".`,
    );
  }

  return {
    hostTarget: realTarget,
    declaredRoot: realRoot,
  };
}

/**
 * Resolve git metadata path for a workspace.
 * Resolves per-worktree gitdir pointer if .git is a file.
 */
export function resolveWorkspaceGitMetadata(workspaceRoot) {
  const dotGit = path.join(workspaceRoot, '.git');
  if (!fs.existsSync(dotGit)) {
    return null;
  }

  let realDotGit = fs.realpathSync(dotGit);
  const stat = fs.statSync(dotGit);

  if (stat.isFile()) {
    // Worktree .git file containing "gitdir: <path>"
    const content = fs.readFileSync(dotGit, 'utf8').trim();
    const match = content.match(/^gitdir:\s*(.+)$/m);
    if (!match) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        `malformed .git file in workspace "${workspaceRoot}": ${content}`,
      );
    }
    const rawGitDir = match[1].trim();
    const resolvedGitDir = path.isAbsolute(rawGitDir)
      ? path.resolve(rawGitDir)
      : path.resolve(workspaceRoot, rawGitDir);

    if (!fs.existsSync(resolvedGitDir)) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        `worktree gitdir does not exist: "${resolvedGitDir}"`,
      );
    }
    realDotGit = fs.realpathSync(resolvedGitDir);
  }

  return realDotGit;
}

/**
 * Canonical resource resolver implementation (spec §6.3, R2).
 */
export function resolveConfinementResources({
  dispatchId,
  context = {},
  grants = [],
  resourceNeeds = [],
  backendConfig = {},
  providerSources = {},
} = {}) {
  if (!dispatchId || typeof dispatchId !== 'string') {
    throw new ConfinementResourceError('confinement-grant-invalid', 'dispatchId is required.');
  }

  const resolved = [];
  const grantsByResource = new Map(grants.map((g) => [g.resource, g]));

  // 1. run-output (required for dispatch)
  if (grantsByResource.has('run-output')) {
    const grant = grantsByResource.get('run-output');
    if (!context.runDir) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        'run-output resource requires context.runDir to be specified.',
      );
    }
    if (!context.fgosDir) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        'run-output resource requires context.fgosDir so its containment boundary can be verified.',
      );
    }
    const declaredRoot = context.fgosDir;
    const { hostTarget } = canonicalizeAndVerifySubpath(context.runDir, declaredRoot, 'run-output');

    resolved.push({
      resource: 'run-output',
      identity: `run-output:${dispatchId}`,
      hostTarget,
      executionTarget: { location: 'host', path: hostTarget },
      delivery: 'mount',
      collect: 'artifact',
      access: grant.access,
      allocation: 'existing',
    });
  }

  // 2. workspace
  if (grantsByResource.has('workspace')) {
    const grant = grantsByResource.get('workspace');
    const declaredRoot = context.repoRoot || context.cwd;
    if (!declaredRoot) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        'workspace resource requires context.repoRoot or context.cwd.',
      );
    }
    const { hostTarget } = canonicalizeAndVerifySubpath(declaredRoot, path.dirname(declaredRoot), 'workspace');
    if (hostTarget !== path.resolve(declaredRoot)) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        `workspace root "${declaredRoot}" resolves through a symlink to "${hostTarget}"; use its canonical path.`,
      );
    }

    resolved.push({
      resource: 'workspace',
      identity: `workspace:${path.basename(hostTarget)}`,
      hostTarget,
      executionTarget: { location: 'host', path: hostTarget },
      delivery: 'mount',
      collect: 'workspace-change',
      access: grant.access,
      allocation: 'existing',
    });
  }

  // 3. workspace-git-metadata
  if (grantsByResource.has('workspace-git-metadata')) {
    const grant = grantsByResource.get('workspace-git-metadata');
    const wsRoot = context.repoRoot || context.cwd;
    if (!wsRoot) {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        'workspace-git-metadata requires context.repoRoot or context.cwd.',
      );
    }
    const gitDir = resolveWorkspaceGitMetadata(wsRoot);
    if (gitDir) {
      resolved.push({
        resource: 'workspace-git-metadata',
        identity: `workspace-git-metadata:${path.basename(gitDir)}`,
        hostTarget: gitDir,
        executionTarget: { location: 'host', path: gitDir },
        delivery: 'mount',
        collect: 'none',
        access: grant.access,
        allocation: 'existing',
      });
    }
  }

  // 4. private-home
  if (grantsByResource.has('private-home')) {
    const grant = grantsByResource.get('private-home');
    const tempRoot =
      backendConfig.privateHomeRoot ||
      backendConfig.tempRoot ||
      path.join(os.tmpdir(), 'fgos-confinement');

    const allocatedHome = path.join(tempRoot, dispatchId, 'home');
    // Validate before any mutation: a hostile dispatchId must never leave an
    // escaped directory behind when validation refuses it.
    const { hostTarget } = canonicalizeAndVerifySubpath(allocatedHome, tempRoot, 'private-home');

    resolved.push({
      resource: 'private-home',
      identity: `private-home:${dispatchId}`,
      hostTarget,
      executionTarget: { location: 'host', path: hostTarget },
      delivery: 'mount',
      collect: 'none',
      access: grant.access,
      allocation: 'temporary',
    });
  }

  // 5. executor-credentials
  if (grantsByResource.has('executor-credentials')) {
    const grant = grantsByResource.get('executor-credentials');
    if (grant.access !== 'read') {
      throw new ConfinementResourceError(
        'confinement-grant-invalid',
        `executor-credentials resource access must be strictly "read", got "${grant.access}".`,
      );
    }
    const credsPath =
      providerSources.credentialsPath ||
      providerSources.credentialsDir ||
      path.join(os.homedir(), '.fgos', 'credentials');

    if (fs.existsSync(credsPath)) {
      const parentRoot = path.dirname(credsPath);
      const { hostTarget } = canonicalizeAndVerifySubpath(credsPath, parentRoot, 'executor-credentials');
      resolved.push({
        resource: 'executor-credentials',
        identity: `executor-credentials:${path.basename(hostTarget)}`,
        hostTarget,
        executionTarget: { location: 'host', path: hostTarget },
        delivery: 'mount',
        collect: 'none',
        access: 'read',
        allocation: 'existing',
      });
    }
  }

  return resolved;
}
