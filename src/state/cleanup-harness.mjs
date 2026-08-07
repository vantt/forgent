// cleanup-harness.mjs — the dedicated skill/harness gating cleanup->done
// (work-item-status-delivered-retrospective-cleanup D8), never folded into
// return/compound. PURE reads only (this module never writes an event or
// touches git state) except the one real subprocess call in
// checkMergeStillResolves, which is read-only (`git merge-base
// --is-ancestor`, no mutation).
//
// Three independent checks, combined by assessCleanupReadiness:
//   (1) TTL elapsed since the item actually entered `cleanup` (D7) — the
//       clock anchors to the specific retrospective->cleanup event
//       timestamp, mirroring graph-metrics.mjs's classifyStaleDoing
//       precedent (age = now - a specific transition's ts), never "latest
//       event of any kind for this id" (an unrelated decision/friction
//       logged while parked would otherwise silently reset the clock).
//   (2) retrospective actually produced real content (D4/D8) — a crashed
//       or partial retrospective run could transition delivered->
//       retrospective->cleanup without ever writing real output, so this
//       is a content-level check (an outcome or decision record exists
//       for the item), not a status-level one.
//   (3) the merge still resolves on main (D8) — domain-conditional (D5):
//       only checked when the domain is worktree-backed (the coding
//       domain's headAtTake/headAtReturn tracking assumes a real git
//       merge happened; synthetic has neither a worktree nor a merge to
//       verify, per its own file header in workflow-stage-graphs.mjs).
//       LIMITATION, documented plainly rather than overclaimed: this
//       checks ANCESTRY (`git merge-base --is-ancestor`), which catches a
//       force-push/history-rewrite that dropped the commit, but does NOT
//       catch a plain `git revert` — a revert adds a new commit undoing
//       the change without removing the original from history, so the
//       original commit stays a provable ancestor of HEAD even after
//       being reverted. Detecting "was the CONTENT undone" generically
//       would need a real diff-against-tree check, out of scope here
//       (YAGNI — no evidence yet that revert-after-merge is the common
//       case this needs to catch; force-push/rebase-away is the case
//       RUL30's headAtTake/headAtReturn tracking already exists to guard
//       against).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from '../runner/root-affinity.mjs';

/**
 * tsk-59x D1: which TTL applies to `id` — the leaf value when `id` has a
 * real parent (`resolveRoot(view, id) !== id`, same leaf test
 * `checkMergeStillResolves` above already uses), the root value otherwise.
 * `leafTtlDays` omitted entirely falls back to `ttlDays` for every item,
 * root or leaf — keeps every existing caller that doesn't pass it
 * byte-identical to pre-tsk-59x behavior.
 */
export function resolveTtlDaysForItem(view, id, { ttlDays, leafTtlDays } = {}) {
  if (leafTtlDays === undefined) return ttlDays;
  const isLeaf = resolveRoot(view, id) !== id;
  return isLeaf ? leafTtlDays : ttlDays;
}

function git(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Does the commit this item's merge/return landed still resolve as an
 * ancestor of the correct target ref? Prefers `branchHeadAtReturn`
 * (branch-source items), then `headAtReturn` (pull-door items), falling
 * back to the `*AtTake` pair only if return-time tracking is absent
 * (an item that was never returned through the normal path). No recorded
 * commit at all is treated as "nothing to verify" (ok: true) rather than a
 * failure — an item this module has no git provenance for was never
 * claiming a git-verifiable merge in the first place.
 *
 * ROOT-AWARE REF (tsk-1p9): a LEAF item's branch is merged into its ROOT's
 * branch (`fgw/<rootId>`), never directly into `main` — the root may still
 * be sitting unmerged for days after the leaf itself is `delivered`.
 * Checking a leaf's commit against literal `HEAD` (always `main` from
 * `repoRoot`, the main checkout) would falsely report a healthy, genuinely
 * merged leaf as "no longer reachable" — indistinguishable from an actual
 * force-push loss. When `view`/`id` are supplied and `resolveRoot(view,
 * id)` differs from `id` (a leaf), the target ref becomes `fgw/<rootId>`
 * instead — a named ref, no checkout required. A root/standalone item
 * (`view`/`id` omitted, or `resolveRoot` returns `id` itself) keeps
 * checking against `HEAD`, unchanged.
 *
 * MISSING-REF FALLBACK (tsk-577): a leaf's own root branch can be pruned
 * (startupReap's zero-ahead prune, loop.mjs) while the leaf is still
 * sitting in `cleanup`, waiting on its own gate. `git merge-base
 * --is-ancestor` against a deleted ref throws "unknown revision" the same
 * way it throws for a genuinely unreachable commit -- indistinguishable
 * without checking ref existence first. But a `fgw/<id>` branch, in this
 * codebase, is ONLY ever force-deleted in two guarded places: loop.mjs's
 * zero-ahead prune (which by definition means the branch tip was already a
 * real ancestor of `main` -- a squash merge would leave the original
 * commits permanently "ahead", never pruned), and merge.mjs's
 * cleanupMergedBranch (which deletes an item's own branch only AFTER that
 * item's own checkMergeStillResolves already passed). So a missing NAMED
 * ref is always safe to re-check against `HEAD` directly instead of
 * failing closed -- `HEAD` itself is never pruned, so this fallback only
 * ever applies to the leaf case (targetRef !== 'HEAD').
 *
 * DIAGNOSTIC HINT (tsk-3ft): when `targetRef` DOES exist but the sha still
 * isn't its ancestor, ancestry alone cannot tell a genuine force-push loss
 * apart from a branch manually reset to unrelated divergent history --
 * `git merge-base --is-ancestor` fails identically either way (this stays
 * an intentional limitation, matching the revert-detection gap documented
 * above; tsk-3ft's own investigation deliberately rejected building
 * detection or auto-recovery for this). The `ok:false` detail just points
 * at `git reflog show <targetRef>` as the next diagnostic step -- the
 * exact tool that resolved tsk-47e's case in that investigation.
 */
export function checkMergeStillResolves(repoRoot, work, { view, id } = {}) {
  const sha = work?.branchHeadAtReturn ?? work?.headAtReturn ?? work?.branchHeadAtTake ?? work?.headAtTake;
  if (!sha) {
    return { ok: true, detail: 'no recorded commit to verify — nothing to check' };
  }
  const rootId = view && id ? resolveRoot(view, id) : id;
  const namedRef = rootId && rootId !== id ? `fgw/${rootId}` : null;

  if (namedRef && !refExists(repoRoot, namedRef)) {
    return checkAncestry(repoRoot, sha, 'HEAD', `${namedRef} no longer exists (pruned)`);
  }
  return checkAncestry(repoRoot, sha, namedRef ?? 'HEAD');
}

function refExists(repoRoot, ref) {
  try {
    git(repoRoot, ['rev-parse', '--verify', '--quiet', ref]);
    return true;
  } catch {
    return false;
  }
}

function checkAncestry(repoRoot, sha, targetRef, fallbackNote) {
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', sha, targetRef]);
    return {
      ok: true,
      detail: fallbackNote
        ? `${fallbackNote} — fell back to HEAD, commit ${sha} is still an ancestor of HEAD`
        : `commit ${sha} is still an ancestor of ${targetRef}`,
    };
  } catch {
    return {
      ok: false,
      detail: fallbackNote
        ? `${fallbackNote} — fell back to HEAD, but commit ${sha} is not an ancestor of HEAD either — the merge may have been force-pushed away or history rewritten`
        : `commit ${sha} is no longer reachable from ${targetRef} — the merge may have been force-pushed away or history rewritten. ` +
          `${targetRef} still exists — if this is unexpected, run "git reflog show ${targetRef}" to check for a manual reset that discarded this commit (tsk-3ft)`,
    };
  }
}

/**
 * Did retrospective actually produce real content for `id` — a real
 * end-user document (D8: `outcome.docType` + `outcome.docPath`, the file
 * itself confirmed present on disk under `repoRoot`) or at least one
 * decision record — rather than just a status flip, or a claim-lifecycle
 * artifact (`outcome.actual`/`outcome.predicted`, written at claim/return
 * time, unrelated to whether retrospective itself ever ran) (tsk-558,
 * restore-to-decision: D8 names `docType` specifically, and a recorded
 * `docPath` alone is not accepted as evidence — a prior incident
 * (retro-loop doc orphaning) proved a path can be recorded while the file
 * never lands in the working tree).
 */
export function checkRetrospectiveContent(view, id, repoRoot) {
  const outcome = view?.outcomes?.[id];
  const hasDecision = (view?.decisionsById?.[id]?.length ?? 0) > 0;
  if (hasDecision) {
    return { ok: true, detail: 'retrospective content found (a decision record exists)' };
  }
  if (outcome?.docType && outcome?.docPath) {
    if (fs.existsSync(path.join(repoRoot, outcome.docPath))) {
      return { ok: true, detail: `retrospective content found (docType "${outcome.docType}" at ${outcome.docPath}, file confirmed present)` };
    }
    return {
      ok: false,
      detail: `outcome records docType "${outcome.docType}" at ${outcome.docPath}, but the file does not exist on disk — retrospective's own document is missing`,
    };
  }
  return {
    ok: false,
    detail: 'no outcome docType/docPath or decision record found for this item — retrospective may not have actually run',
  };
}

/**
 * Has enough time elapsed since `id` actually entered `cleanup`? Reads
 * `rawEvents` (readRawEvents(dir)'s own shape) for the SPECIFIC latest
 * `work.move` event with `payload.to === 'cleanup'` for this id — never
 * "latest event of any kind", per this module's own header comment.
 */
export function checkCleanupTTLElapsed(rawEvents, id, { ttlDays, now = Date.now() } = {}) {
  const entries = (rawEvents ?? []).filter(
    (e) => e.type === 'work.move' && e.payload?.id === id && e.payload?.to === 'cleanup',
  );
  const entered = entries.at(-1);
  if (!entered) {
    return { ok: false, detail: 'item never actually entered cleanup — no retrospective->cleanup event found in the log' };
  }
  const ageMs = now - new Date(entered.ts).getTime();
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  const ageDays = Math.floor(ageMs / 86400000);
  if (ageMs >= ttlMs) {
    return { ok: true, detail: `${ageDays}d elapsed since entering cleanup (TTL ${ttlDays}d)` };
  }
  return { ok: false, detail: `only ${ageDays}d elapsed since entering cleanup, TTL is ${ttlDays}d — not ready yet` };
}

/**
 * Combine all three checks into one verdict, keeping the TTL park
 * precondition (D7) distinct from the two real D8 gate checks — TTL not
 * elapsed is never itself a `cleanup -> blocked` reason (tsk-4jf,
 * restore-to-decision: D7 and D8 are joined by AND, not folded into one
 * flat check). `worktreeBacked` (per-domain, D5) gates whether
 * checkMergeStillResolves runs at all — a domain with no real git
 * worktree/merge concept (synthetic) is not held to a check that assumes
 * one. Returns `{ ready, notReadyYet, failed }`: `ready` is true exactly
 * when both arrays are empty; `notReadyYet` holds the TTL-not-elapsed
 * detail (a park precondition, caller stays a no-op on this alone);
 * `failed` holds every D8 gate-check failure detail (never just the
 * first), so a `cleanup -> blocked` park still carries a complete
 * `reason` when `failed` is non-empty.
 *
 * tsk-59x D1: `leafTtlDays`, when supplied alongside `ttlDays`, resolves
 * per-item via `resolveTtlDaysForItem` before the TTL check runs — a leaf
 * item gets `leafTtlDays`, a root item keeps `ttlDays`. Omitted entirely,
 * behavior is byte-identical to before this item.
 */
export function assessCleanupReadiness({ view, rawEvents, id, repoRoot, worktreeBacked, ttlDays, leafTtlDays, now }) {
  const notReadyYet = [];
  const failed = [];

  const resolvedTtlDays = resolveTtlDaysForItem(view, id, { ttlDays, leafTtlDays });
  const ttl = checkCleanupTTLElapsed(rawEvents, id, { ttlDays: resolvedTtlDays, now });
  if (!ttl.ok) notReadyYet.push(ttl.detail);

  const content = checkRetrospectiveContent(view, id, repoRoot);
  if (!content.ok) failed.push(content.detail);

  if (worktreeBacked) {
    const merge = checkMergeStillResolves(repoRoot, view?.work?.[id], { view, id });
    if (!merge.ok) failed.push(merge.detail);
  }

  return { ready: notReadyYet.length === 0 && failed.length === 0, notReadyYet, failed };
}
