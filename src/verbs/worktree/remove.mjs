import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createGitInspect } from '../../git/inspect.mjs';
import { createGitWorktree } from '../../git/worktree.mjs';
import { removeProvisioned } from '../../runner/worktree.mjs';

const OID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;

function resolveDelivered(inspect, value) {
  if (OID.test(value)) return { ref: null, oid: value };
  const ref = value.startsWith('refs/') ? value : `refs/heads/${value}`;
  const found = inspect.resolveRef({ name: ref });
  if (found.kind !== 'direct') throw new Error(`worktree remove: --delivered-to ${value} does not name an existing branch, full ref or object id`);
  return { ref, oid: found.oid };
}

function worktreeTip(inspect, target) {
  let cursor;
  for (;;) {
    const page = inspect.listWorktrees(cursor ? { cursor } : {});
    const entry = page.entries.find(e => Buffer.from(e.path).toString() === target);
    if (entry) return entry.head;
    if (page.complete) throw new Error(`worktree remove: ${target} is not a registered worktree`);
    cursor = page.nextCursor;
  }
}

// The Worktree port refuses unless the checkout is clean, no process stands in
// it, its tip equals expectedTip, and that tip is an ancestor of (or equal to)
// deliveredTo, which some non-internal ref must contain. evidenceDigest is the
// sha256 of the delivery statement this verb makes, so the Git operation record
// binds the exact path, tip and delivery target the caller asserted.
// What `worktree create` provisioned is set aside first, so the port judges
// only the checkout's own bytes; a refusal puts it back.
export function removeWorktreeUseCase(ctx, options, loaderOptions) {
  if (!options.path || typeof options.path !== 'string') throw new Error('worktree remove requires a path');
  if (!options.deliveredTo || typeof options.deliveredTo !== 'string') throw new Error('worktree remove requires --delivered-to <ref>');
  const target = fs.realpathSync(path.resolve(ctx.cwd, options.path));
  const base = { stateRoot: ctx.stateRoot, repoPath: ctx.cwd, trustedMain: ctx.repoRoot };
  const inspect = createGitInspect(base, loaderOptions);
  const expectedTip = worktreeTip(inspect, target);
  const delivered = resolveDelivered(inspect, options.deliveredTo);
  const evidenceDigest = createHash('sha256')
    .update(JSON.stringify({ path: target, expectedTip, deliveredTo: delivered }))
    .digest('hex');
  const port = createGitWorktree({ ...base, writer: ctx.writer }, loaderOptions);
  removeProvisioned(ctx.stateRoot, target, () => port.remove({ path: target, expectedTip, deliveredTo: delivered.oid, evidenceDigest, operationId: `worktree-${randomUUID()}` }));
  return { removed: true, path: target, expectedTip, deliveredTo: delivered.oid, deliveredToRef: delivered.ref, evidenceDigest };
}
