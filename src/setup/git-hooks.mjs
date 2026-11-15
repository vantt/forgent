// Setup translates RepositoryConfig reports; Git owns config locking and provenance.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { createGitRepositoryConfig } from '../git/config.mjs';

function hooksContext(cwd) {
  const options = gitPortOptions(cwd);
  const facts = createGitInspect(options).resolveRepo();
  if (facts.notARepository) return null;
  const ownedPath = path.join(facts.trustedMainRoot, '.githooks');
  return { port: createGitRepositoryConfig({ ...options, trustedMain: facts.trustedMainRoot }), ownedPath };
}

// Whether the hooks path is wired to the owned directory is RepositoryConfig's answer (`wired` of its report).
const wired = (report) => report.wired === true;

/** Fill only: a custom hook directory is always preserved. */
export function installGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return { wired: false, skippedExisting: null };
  const context = hooksContext(repoRoot);
  if (!context) return { wired: false, skippedExisting: null };
  const before = context.port.inspectHooks({ ownedPath: context.ownedPath });
  if (wired(before)) return { wired: true, skippedExisting: null };
  if (before.configuredPath) return { wired: false, skippedExisting: before.configuredPath };
  if (!existsSync(context.ownedPath)) return { wired: false, skippedExisting: null };
  const after = context.port.ensureHooks({ ownedPath: context.ownedPath, operationId: randomUUID() });
  return { wired: wired(after), skippedExisting: after.status === 'skippedExisting' ? after.configuredPath : null };
}

/** Doctor is read only; missing repositories or unavailable Git read as unwired. */
export function mainCheckoutHookWired(cwd) {
  try {
    const context = hooksContext(cwd);
    return context ? wired(context.port.inspectHooks({ ownedPath: context.ownedPath })) : false;
  } catch { return false; }
}
