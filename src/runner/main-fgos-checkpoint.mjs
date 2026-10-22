// Work selects timing and exact legacy event paths before Git authority is
// entered. Git owns staging, checkpoint/commit, rollback and main borrowing.
// WORK removes this adapter with its Event Store cutover.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { recordMainCheckoutGuardWarning } from '../state/main-checkout-guard-warnings.mjs';
import { LockHandle } from '../holder-lock/index.mjs';
import { gitPortOptions, createGitInspect } from '../git/inspect.mjs';
import { createGitScopedCommit } from '../git/scoped-commit.mjs';
import { checkpointLegacyEventFiles, commitLegacyEventFiles } from '../state/legacy-event-git-adapter.mjs';
import { runOpportunisticMainCheckoutChecks } from '../state/events-jsonl-truncation-guard.mjs';
import { fgosDirFromRoot } from './paths.mjs';

/** Work policy only. Call before entering Git locks. The legacy callback is
 * a declaration translation: no add/commit/reset command is executed here. */
export function prepareMainFgosCheckpoint(dir, repoRoot, opts = {}) {
  let declaration;
  runOpportunisticMainCheckoutChecks(dir, repoRoot, { ...opts, commit(args) {
    if (args[0] === 'commit') declaration = { message: args[2] };
  } });
  if (!declaration) return null;
  const base = path.basename(dir) === '.fgos' ? dir : fgosDirFromRoot(dir);
  const files = [];
  const add = file => { if (fs.existsSync(file)) files.push(path.relative(repoRoot, file).replaceAll('\\', '/')); };
  add(path.join(base, 'events.jsonl'));
  for (const [subdir, suffixes] of [['events', ['.jsonl']], ['events/archive', ['.jsonl', '.manifest.json']]]) {
    const folder = path.join(base, subdir);
    if (!fs.existsSync(folder)) continue;
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.isFile() && suffixes.some(suffix => entry.name.length > suffix.length && entry.name.endsWith(suffix))) add(path.join(folder, entry.name));
    }
  }
  // Include tracked deletions as well as on-disk files; a removed shard is
  // still an exact declaration, never an implicit directory sweep in Git.
  const inspect = createGitInspect(gitPortOptions(repoRoot));
  let cursor;
  do {
    const page = inspect.status({ untracked: 'all', maxEntries: 4096, cursor });
    for (const entry of page.entries) {
      const file = Buffer.from(entry.path).toString('utf8');
      if (/^\.fgos\/(?:events\.jsonl|events\/[^/]+\.jsonl|events\/archive\/[^/]+\.(?:jsonl|manifest\.json))$/.test(file)) files.push(file);
    }
    cursor = page.nextCursor;
  } while (cursor);
  return { ...declaration, files: [...new Set(files)].sort() };
}

/** Compatibility handle shape; the claim caller supplies prepared policy.
 * Remaining Land callers must move their policy preparation outside slot 20
 * when their coordinated publication migration lands. */
export function checkpointMainFgos(mainHandle, dir, repoRoot, opts = {}) {
  if (!(mainHandle instanceof LockHandle) || mainHandle.name !== 'main-checkout' || mainHandle.released) {
    throw new TypeError('checkpointMainFgos needs the live main-checkout handle from withMainCheckout');
  }
  const prepared = Object.hasOwn(opts, 'prepared') ? opts.prepared : prepareMainFgosCheckpoint(dir, repoRoot, opts);
  if (!prepared?.files.length) return;
  try {
    const options = gitPortOptions(repoRoot, { mutation: true });
    const held = [mainHandle];
    const args = { ...prepared, operationId: crypto.randomUUID() };
    const inspect = createGitInspect(options);
    const revision = inspect.resolveCommit({ name: 'HEAD' });
    const paths = inspect.pathsAtRevision({ revision, paths: prepared.files.map(file => [...Buffer.from(file)]), maxBlobBytes: 32 * 1024 * 1024 });
    // Checkpoint only admits tracked files. A newly created shard uses the
    // existing declared ScopedCommit door rather than broadening Checkpoint.
    if (paths.some(entry => entry.value.kind === 'absent')) {
      const baseline = createGitScopedCommit(options).preflight({}, held);
      return commitLegacyEventFiles(options, { ...args, baseline }, held);
    }
    return checkpointLegacyEventFiles(options, args, held);
  } catch (error) {
    recordMainCheckoutGuardWarning(dir, { reason: 'checkpoint-failed', message: error.message });
    return { status: 'deferred', warnings: [error.message] };
  }
}
