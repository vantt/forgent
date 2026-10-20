// Setup translates RepositoryConfig reports; Git owns config locking and provenance.
import { existsSync, rmSync, readdirSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { createGitRepositoryConfig } from '../git/config.mjs';

function hooksContext(cwd) {
  const options = gitPortOptions(cwd);
  const facts = createGitInspect(options).resolveRepo();
  if (facts.notARepository) return null;
  const ownedPath = path.join(facts.trustedMainRoot, '.githooks');
  return { inspect: createGitInspect({ ...options, trustedMain: facts.trustedMainRoot }), port: createGitRepositoryConfig({ ...options, trustedMain: facts.trustedMainRoot }), ownedPath };
}

function wired(context, report) {
  if (!report.configuredPath) return false;
  const configured = path.resolve(path.dirname(context.ownedPath), report.configuredPath);
  return process.platform === 'win32'
    ? configured.toLowerCase() === context.ownedPath.toLowerCase()
    : configured === context.ownedPath;
}

/** Fill only: a custom hook directory is always preserved. */
export function installGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return { wired: false, skippedExisting: null };
  const context = hooksContext(repoRoot);
  if (!context) return { wired: false, skippedExisting: null };
  const before = context.port.inspectHooks({ ownedPath: context.ownedPath });
  if (wired(context, before)) return { wired: true, skippedExisting: null };
  if (before.configuredPath) return { wired: false, skippedExisting: before.configuredPath };
  if (!existsSync(context.ownedPath)) return { wired: false, skippedExisting: null };
  const after = context.port.ensureHooks({ ownedPath: context.ownedPath, operationId: randomUUID() });
  return { wired: wired(context, after), skippedExisting: after.status === 'skippedExisting' ? after.configuredPath : null };
}

/** Doctor is read only; missing repositories or unavailable Git read as unwired. */
export function mainCheckoutHookWired(cwd) {
  try {
    const context = hooksContext(cwd);
    return context ? wired(context, context.port.inspectHooks({ ownedPath: context.ownedPath })) : false;
  } catch { return false; }
}

/** Remove configuration only with RepositoryConfig's durable ownership proof. */
export function uninstallGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return { unwired: false, skippedExisting: null };
  const context = hooksContext(repoRoot);
  if (!context) return { unwired: false, skippedExisting: null };
  const before = context.port.inspectHooks({ ownedPath: context.ownedPath });
  if (!before.configuredPath) return { unwired: false, skippedExisting: null };
  const after = context.port.removeOwnedHooksConfig({ ownedPath: context.ownedPath, operationId: randomUUID() });
  if (after.configuredPath) return { unwired: false, skippedExisting: after.configuredPath };
  const preCommitPath = path.join(context.ownedPath, 'pre-commit');
  const head = context.inspect.resolveCommit({ name: 'HEAD' });
  const tracked = head && context.inspect.pathsAtRevision({ revision: head, paths: [[...Buffer.from('.githooks/pre-commit')]], maxBlobBytes: 32 * 1024 * 1024 })[0]?.value.kind !== 'absent';
  if (!tracked && existsSync(preCommitPath)) rmSync(preCommitPath);
  if (existsSync(context.ownedPath) && readdirSync(context.ownedPath).length === 0) rmdirSync(context.ownedPath);
  return { unwired: true, skippedExisting: null };
}
