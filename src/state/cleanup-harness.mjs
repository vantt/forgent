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
import { getDomain } from './workflow-stage-graphs.mjs';
import { isCanceledStatus, resolveRoot } from './frontier.mjs';

// Shared with blockedItemsNowResolvable below (tsk-597z): the one detail
// string that means "this item never claimed a git-verifiable merge in the
// first place", not "its ancestry check now passes" -- comparing against
// the SAME constant both places write/read keeps the two in sync without
// duplicating the literal.
const NOTHING_TO_CHECK_DETAIL = 'no recorded commit to verify — nothing to check';

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
 * DIAGNOSTIC HINT (tsk-3ft, tsk-2jz): when `targetRef` DOES exist but direct
 * ancestry fails, checkAncestry tries two fallbacks before reporting failure:
 * (1) checking if the commit reached HEAD directly (blind spot 2: rescue merge
 * bypassing targetRef), and (2) checking if content is equivalent via git
 * cherry-pick patch-ids (blind spot 1: clean rebase-rehash). If both fallbacks
 * fail, ancestry/content checks cannot prove the commit's work reached targetRef
 * (e.g. a rebase that also changed content via conflict resolution, or a genuine
 * force-push loss) -- this stays an intentional limitation. The `ok:false` detail
 * points at `git reflog show <targetRef>` as the next diagnostic step.
 *
 * DECOMPOSED-PARENT FALLBACK (tsk-psb): an item that went through
 * decompose-into-children never itself merges `fgw/<id>` into anything --
 * its children's own branches merge directly into the same resolved root
 * ref instead, and `work.branchHeadAtReturn` for a decomposed item only
 * ever records a sync-back merge (main into `fgw/<id>`), the wrong
 * direction for this ancestry check. So a decomposed item's own recorded
 * sha is structurally never a valid signal once it has real children --
 * unlike the ref-missing case above (sometimes right, sometimes not,
 * depending on prune timing), there is no case where trusting it first is
 * correct. When `view`/`id` are supplied and `id` has at least one item in
 * `view.work` with `parent === id`, this function never reads `id`'s own
 * sha at all -- it recurses into each child's own check instead (each
 * child resolves the SAME target ref via `resolveRoot`'s own multi-level
 * walk, so a grandchild -- a child that was itself decomposed further --
 * composes correctly with zero extra logic). `ok:true` only when every
 * child passes; the first failing child's own detail is surfaced by id, so
 * a genuine loss still names a real, checkable reason instead of an
 * inferred content match.
 */
export function checkMergeStillResolves(repoRoot, work, { view, id } = {}) {
  if (view && id) {
    // tsk-4bh: a canceled/wontfix child never had content to merge in the
    // first place (wontfix-terminal-status-filter-consistency D1, the same
    // settled rule claim-port.mjs's own dep-readiness guard already applies
    // via isResolvedStatus) -- its recorded sha, if any, was never going to
    // become an ancestor of anything, so waiting on it here is not a real
    // check, just a permanent false failure. Filtered out BEFORE the
    // children.length===0 check below, not inside checkChildrenResolve
    // itself: a root whose non-canceled children have all been filtered
    // away this way falls through to the SAME leaf-shaped ancestry check on
    // its own recorded sha that a genuinely childless decomposed item
    // already gets below (an existing, separate limitation this item does
    // not change either way -- see the DECOMPOSED-PARENT FALLBACK doc
    // above), rather than a new code path of its own.
    const children = Object.entries(view.work ?? {}).filter(([, item]) => item.parent === id && !isCanceledStatus(item));
    if (children.length > 0) {
      const childrenResult = checkChildrenResolve(repoRoot, view, children);
      if (!childrenResult.ok) return childrenResult;
      // tsk-5j0: children resolving into THIS item's branch says nothing
      // about whether THIS item's own branch ever reached main -- only
      // matters for the true root, since a non-root decomposed node's own
      // branch is never itself merged forward (tsk-psb).
      return resolveRoot(view, id) === id
        ? checkRootBranchResolves(repoRoot, id, childrenResult)
        : childrenResult;
    }
  }
  // tsk-40m (docs/architect/doing-coordination-redesign.md): these top-level
  // sticky fields are only ever set by a durable work.move payload, which
  // claim time no longer writes -- the real values now live on the settle's
  // own work.attempt, folded into work.lastAttempt. Checked as a fallback,
  // never instead of, so a genuinely legacy pre-migration record (top-level
  // field set, no lastAttempt) still resolves exactly as before.
  const sha = work?.branchHeadAtReturn ?? work?.headAtReturn ?? work?.branchHeadAtTake ?? work?.headAtTake
    ?? work?.lastAttempt?.branchHeadAtReturn ?? work?.lastAttempt?.headAtReturn
    ?? work?.lastAttempt?.branchHeadAtTake ?? work?.lastAttempt?.headAtTake;
  if (!sha) {
    return { ok: true, detail: NOTHING_TO_CHECK_DETAIL };
  }
  const rootId = view && id ? resolveRoot(view, id) : id;
  const namedRef = rootId && rootId !== id ? `fgw/${rootId}` : null;

  if (namedRef && !refExists(repoRoot, namedRef)) {
    return checkAncestry(repoRoot, sha, 'HEAD', `${namedRef} no longer exists (pruned)`);
  }
  return checkAncestry(repoRoot, sha, namedRef ?? 'HEAD');
}

function checkChildrenResolve(repoRoot, view, children) {
  for (const [childId, childWork] of children) {
    const result = checkMergeStillResolves(repoRoot, childWork, { view, id: childId });
    if (!result.ok) {
      return {
        ok: false,
        detail: `decomposed parent: child "${childId}" failed its own merge check — ${result.detail}`,
      };
    }
  }
  return {
    ok: true,
    detail: `decomposed parent: all ${children.length} child item(s) (${children.map(([childId]) => childId).join(', ')}) resolve as ancestors of their own target ref`,
  };
}

/**
 * A decomposed ROOT's own branch (`fgw/<id>`) never merges into anything
 * via the children-recursion above -- children merge directly into it, but
 * nothing checks whether `fgw/<id>` itself ever merged into `main`. Combined
 * with `childrenResult` via AND (tsk-5j0 D2): `ok:true` only when children
 * resolve AND the root's own branch also reached `main`. Diagnostic-only,
 * same posture as every other check in this file -- never auto-recovers,
 * just stops silently reporting ok when it isn't.
 */
function checkRootBranchResolves(repoRoot, id, childrenResult) {
  const namedRef = `fgw/${id}`;
  if (!refExists(repoRoot, namedRef)) {
    return {
      ok: false,
      detail: `${childrenResult.detail} — but this root's own branch ${namedRef} no longer exists, so whether it ever reached HEAD cannot be confirmed`,
    };
  }
  const tipSha = git(repoRoot, ['rev-parse', namedRef]);
  const rootAncestry = checkAncestry(repoRoot, tipSha, 'HEAD');
  if (!rootAncestry.ok) {
    return {
      ok: false,
      detail: `${childrenResult.detail} — but this root's own branch ${namedRef} was never merged into HEAD: ${rootAncestry.detail}`,
    };
  }
  return {
    ok: true,
    detail: `${childrenResult.detail}; root's own branch ${namedRef} is also an ancestor of HEAD`,
  };
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
    // Direct check failed; fall through to fallbacks.
  }

  // Fallback 1: Main-ancestry fallback (resolves blind spot 2)
  if (targetRef !== 'HEAD') {
    try {
      git(repoRoot, ['merge-base', '--is-ancestor', sha, 'HEAD']);
      return {
        ok: true,
        detail: fallbackNote
          ? `${fallbackNote} — fell back to HEAD, commit ${sha} resolved as an ancestor of HEAD (main-ancestry fallback)`
          : `commit ${sha} is not an ancestor of ${targetRef}, but resolved as an ancestor of HEAD (main-ancestry fallback)`,
      };
    } catch {
      // Main-ancestry fallback failed
    }
  }

  // Fallback 2: Content-equivalence fallback (resolves a CLEAN rebase-rehash)
  const refsToTry = [targetRef];
  if (targetRef !== 'HEAD') {
    refsToTry.push('HEAD');
  }

  for (const ref of refsToTry) {
    try {
      const out = git(repoRoot, [
        'rev-list',
        '--count',
        '--cherry-pick',
        '--right-only',
        '--no-merges',
        `${ref}...${sha}`,
      ]).trim();
      const count = Number.parseInt(out, 10);
      if (count === 0) {
        return {
          ok: true,
          detail: `commit ${sha} is not an ancestor of ${targetRef}, but its content is present on ${ref} under a different commit (content-equivalence fallback)`,
        };
      }
    } catch {
      // Ignore git errors in rev-list and try next ref or fall through
    }
  }

  return {
    ok: false,
    detail: fallbackNote
      ? `${fallbackNote} — fell back to HEAD, but commit ${sha} is not an ancestor of HEAD either — the merge may have been force-pushed away or history rewritten`
      : `commit ${sha} is no longer reachable from ${targetRef} — the merge may have been force-pushed away or history rewritten. ` +
        `${targetRef} still exists — if this is unexpected, run "git reflog show ${targetRef}" to check for a manual reset that discarded this commit (tsk-3ft)`,
  };
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
  // `kind: 'engine'` records are the engine's own bookkeeping — a resolvePlan
  // verdict, a discovery outcome, a stale-claim reclaim note, a driver's
  // closing report — written by machinery as a side effect of the lifecycle,
  // never by anyone reflecting on the work. They are exactly the
  // "claim-lifecycle artifact ... unrelated to whether retrospective itself
  // ran" this check was written to reject, so counting them would leave the
  // gate permanently green for every item that ever moved through a stage.
  // That was live: `fgos-coding-driving` records a closing report at every
  // stop, so every driven item carried one before retrospective ran at all.
  const hasDecision = (view?.decisionsById?.[id] ?? []).some((d) => d?.kind !== 'engine');
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

/**
 * tsk-597z: report-only sweep across every currently `status: blocked`
 * item -- re-runs `checkMergeStillResolves` LIVE against each one instead
 * of trusting its stored `reason`/`detail` text, the same pattern
 * `catchup`'s own eligibility gate already uses (`bin/fgos.mjs`'s
 * `case 'catchup'`) for exactly this reason: the `cleanup -> blocked` park
 * path stores the FULL human-readable diagnostic in `reason` itself
 * (possibly joined with an unrelated failure), so it can never be trusted
 * to match by content. Re-running the check is what proves whether the
 * item's own park-causing ancestry check would now pass -- an item stuck
 * `blocked` from before an unrelated fix (e.g. tsk-5j0/tsk-577) landed is
 * exactly the case this surfaces.
 *
 * Domain-conditional (same gate `assessCleanupReadiness` already applies,
 * D5 above): a domain with no real git worktree/merge concept is not held
 * to a check that assumes one. `resolvable` excludes any item for which
 * `checkMergeStillResolves` returned the `NOTHING_TO_CHECK_DETAIL`
 * degenerate case -- that item never claimed a git-verifiable merge in the
 * first place, so reporting it as "would now unblock" would be
 * misleading; it is reported separately under `notApplicable` instead.
 *
 * Never calls `moveWork`/`addFriction`/`addDecision` -- read-only, same as
 * `checkMergeStillResolves` itself. Never auto-transitions anything; the
 * item's own scope note (and the named risks in its description --
 * fragile trigger key, flap loop, check-then-transition TOCTOU, no
 * persistent watch daemon) rule that out for now.
 */
export function blockedItemsNowResolvable({ view, repoRoot }) {
  const resolvable = [];
  const stillBlocked = [];
  const notApplicable = [];

  for (const [id, item] of Object.entries(view.work ?? {})) {
    if (item.status !== 'blocked') continue;

    if (!getDomain(item.domain).worktreeBacked) {
      notApplicable.push({ id, reason: 'domain-not-worktree-backed' });
      continue;
    }

    const result = checkMergeStillResolves(repoRoot, item, { view, id });
    if (result.detail === NOTHING_TO_CHECK_DETAIL) {
      notApplicable.push({ id, reason: 'no-recorded-commit', detail: result.detail });
    } else if (result.ok) {
      resolvable.push({ id, detail: result.detail });
    } else {
      stillBlocked.push({ id, detail: result.detail });
    }
  }

  return { resolvable, stillBlocked, notApplicable };
}
