// runtime-coordination.mjs — runtime claim overlay state for active claims.
//
// Separates live claim/doing coordination from the durable append-only eventlog (D1).
// Active claims live under `.fgos/runtime/claims/<id>.json` (gitignored).
// Effective view derives: effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../runner/paths.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { withStateTx } from './hot-lock.mjs';

const mainFgosDirCache = new Map();

/**
 * The `.fgos` of the main checkout that `dir` belongs to. Resolving it runs
 * git, so it is done once per process and `dir`; callers resolve it before
 * taking the state lock and pass the answer into the transaction.
 */
export function getMainFgosDir(dir) {
  if (!dir) return dir;
  const key = path.resolve(dir);
  let resolved = mainFgosDirCache.get(key);
  if (resolved === undefined) {
    const mainRoot = resolveMainCheckoutRoot(path.dirname(dir));
    resolved = mainRoot ? fgosDirFromRoot(mainRoot) : dir;
    mainFgosDirCache.set(key, resolved);
  }
  return resolved;
}

/**
 * Run `fn(tx)` in the `state` hot mutex of the main checkout's `.fgos` — the
 * one lock for the event log and the runtime claims. Everything that needs a
 * child process (the main checkout root, the writer identity of both
 * directories) is resolved here, before the lock; `fn` reads `tx.mainFgosDir`.
 * `dirInput` is the `.fgos` the caller operates on; the transaction may write
 * there too when it is not the main one.
 */
export function withMainState(dirInput, fn) {
  const mainFgosDir = getMainFgosDir(dirInput);
  const writer = resolveWriterIdentity(dirInput).id;
  if (mainFgosDir !== dirInput) resolveWriterIdentity(mainFgosDir);
  const extraRoots = path.resolve(mainFgosDir) === path.resolve(dirInput) ? [] : [dirInput];
  return withStateTx(mainFgosDir, fn, { prefetched: { mainFgosDir, writer, extraRoots } });
}

export class ClaimError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'ClaimError';
    this.category = category;
  }
}

/**
 * Computes an item's durable state revision hash from its properties in the folded durable view.
 * Used for CAS validation during settleClaim (D2).
 */
export function getItemDurableRevision(view, id) {
  const item = view?.work?.[id];
  if (!item) return 'none';
  return crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex').slice(0, 16);
}

/**
 * Read active runtime claim for a single item `id`.
 *
 * tsk-40m code-review finding (non-blocking, fail-open on corrupt data):
 * ENOENT (no claim file at all) is the only case that legitimately means
 * "no active claim" -> `null`. Any OTHER failure (a torn/corrupt write, a
 * permission error) means "I don't actually know" — fails CLOSED with a
 * typed `ClaimError`, never silently as "unclaimed". Read as `null` here,
 * `acquireClaim`'s own existence check would have happily OVERWRITTEN a
 * claim file that was merely unreadable, not actually absent, and every
 * effective-view read would have shown the item as plain `todo` instead of
 * surfacing that its claim state is unknown.
 */
export function readClaim(fgosDirInput, id) {
  if (!id || typeof id !== 'string') return null;
  const claimsDir = resolveFgosFile(getMainFgosDir(fgosDirInput), FGOS_FILE.CLAIMS_DIR);
  return readClaimFile(claimsDir, id);
}

// Reads one claim file from an already-resolved claims directory. Resolving
// the main checkout spawns git, so a caller reading many claims resolves once
// and calls this per file instead of going back through `readClaim`.
function readClaimFile(claimsDir, id) {
  const claimFilePath = path.join(claimsDir, `${id}.json`);
  let raw;
  try {
    raw = fs.readFileSync(claimFilePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    // 'corrupt-log' (store.mjs's EXIT_CODES, exit 5): the same
    // operator-facing meaning as a corrupt eventlog file — local `.fgos`
    // state needs manual repair — reused here rather than inventing a
    // parallel category for the same class of problem.
    throw new ClaimError('corrupt-log', `readClaim: claim file for "${id}" exists but could not be read: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new ClaimError('corrupt-log', `readClaim: claim file for "${id}" is not valid JSON: ${err.message}`);
  }
}

/**
 * Read all active runtime claims as a map `{ [id]: claimRecord }`.
 */
export function readClaims(fgosDirInput) {
  const fgosDir = getMainFgosDir(fgosDirInput);
  const claimsDir = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_DIR);
  let files = [];
  try {
    files = fs.readdirSync(claimsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return {};
  }

  const claims = {};
  for (const file of files) {
    const id = file.slice(0, -5);
    const claim = readClaimFile(claimsDir, id);
    if (claim) {
      claims[id] = claim;
    }
  }
  return claims;
}

/**
 * Acquire a runtime claim record for item `id` (opens its own state
 * transaction; inside one, call `acquireClaimTx`).
 */
export function acquireClaim(fgosDirInput, args = {}) {
  if (!args.id || typeof args.id !== 'string') {
    throw new ClaimError('validation', 'acquireClaim: "id" is required');
  }
  return withMainState(fgosDirInput, (tx) => acquireClaimTx(tx, args));
}

/** `acquireClaim` inside an open state transaction. */
export function acquireClaimTx(tx, {
  id,
  actor,
  source,
  branch,
  branchHeadAtTake,
  headAtTake,
  claimTrigger,
  preClaimStatus,
  preClaimRevision,
  claimRole,
  hardExpiresAt,
  lastObservedActivityAt,
  force = false,
} = {}) {
  if (!id || typeof id !== 'string') {
    throw new ClaimError('validation', 'acquireClaim: "id" is required');
  }

  const fgosDir = tx.mainFgosDir;
  const claimsDir = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_DIR);
  const claimFilePath = path.join(claimsDir, `${id}.json`);

  if (!force) {
    const existing = readClaimFile(claimsDir, id);
    if (existing) {
      throw new ClaimError('conflict', `Item "${id}" is already claimed by claimId "${existing.claimId}"`);
    }
    if (preClaimStatus === 'doing') {
      throw new ClaimError('conflict', `Item "${id}" is already in status "doing"`);
    }
  }

  const now = new Date().toISOString();
  // tsk-40m code-review finding (blocker, confirmed needed by product
  // decision): the session/shell identity fgOS already resolves for
  // every mutation (session-identity.mjs — stable across separate CLI
  // invocations from the SAME terminal, via an env session id or the
  // terminal root / session id). Recorded here so settleClaim can verify, at
  // settle time, that the caller is really the same actor/session that
  // acquired this claim — independent of claimId, which a caller with no
  // in-process token (a fresh CLI invocation, e.g. `fgos return`,
  // separate from the take/pick that claimed it) can only ever discover
  // by reading "whichever claim is active right now". Taking over a
  // DIFFERENT session's still-live claim goes through the sanctioned
  // stale-claim-reclaim path (claim-port.mjs, gated on real liveness),
  // never a direct `return` under a different identity.
  const writerId = String(resolveWriterIdentity(fgosDir).id);
  const claimRecord = {
    claimId: `clm-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    id,
    actor: actor ?? null,
    writerId,
    source: source ?? null,
    branch: branch ?? null,
    branchHeadAtTake: branchHeadAtTake ?? null,
    headAtTake: headAtTake ?? null,
    claimTrigger: claimTrigger ?? null,
    preClaimStatus: preClaimStatus ?? null,
    preClaimRevision: preClaimRevision ?? null,
    claimRole: claimRole ?? actor ?? null,
    acquiredAt: now,
    lastObservedActivityAt: lastObservedActivityAt || now,
    hardExpiresAt: hardExpiresAt ?? null,
  };

  tx.writeText(claimFilePath, JSON.stringify(claimRecord, null, 2));

  return claimRecord;
}

/**
 * Release an active runtime claim record for item `id`.
 *
 * Only the writer that acquired the claim may release it — the same exact
 * `writerId` rule settleClaim (store.mjs) enforces, resolved fresh from this
 * caller's own session/process. A different writer is refused with a
 * `conflict` ClaimError and the claim file is left untouched; a parent or
 * lineage id grants nothing. Releasing another writer's claim (stale-claim
 * reclaim, operator `unclaim` of an orphaned or dead claim) must name why
 * through `adminReason`; the result then carries `admin` with that reason and
 * both writer ids so the caller can record it. A claim written before
 * `writerId` existed skips the check, as in settleClaim.
 */
export function releaseClaim(fgosDirInput, args = {}) {
  validateReleaseArgs(args);
  return withMainState(fgosDirInput, (tx) => releaseClaimTx(tx, args));
}

function validateReleaseArgs({ id, adminReason }) {
  if (!id || typeof id !== 'string') {
    throw new ClaimError('validation', 'releaseClaim: "id" is required');
  }
  if (adminReason !== undefined && (typeof adminReason !== 'string' || !adminReason.trim())) {
    throw new ClaimError('validation', 'releaseClaim: "adminReason" must be a non-empty string when given');
  }
}

/** `releaseClaim` inside an open state transaction. */
export function releaseClaimTx(tx, args = {}) {
  validateReleaseArgs(args);
  const { id, claimId, adminReason } = args;
  const fgosDir = tx.mainFgosDir;
  const claimsDir = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_DIR);
  const claimFilePath = path.join(claimsDir, `${id}.json`);

  let existing;
  try {
    const raw = fs.readFileSync(claimFilePath, 'utf8');
    existing = JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return { released: false, reason: 'no-claim' };
    throw err;
  }

  if (claimId && existing.claimId !== claimId) {
    return { released: false, reason: 'mismatched-claim-id', existingClaimId: existing.claimId };
  }

  let admin;
  if (existing.writerId !== undefined) {
    const currentWriterId = String(resolveWriterIdentity(fgosDir).id);
    if (existing.writerId !== currentWriterId) {
      if (adminReason === undefined) {
        throw new ClaimError('conflict', `releaseClaim: writer identity mismatch for "${id}" — claim acquired by writer "${existing.writerId}", releasing as writer "${currentWriterId}".`);
      }
      admin = { reason: adminReason.trim(), ownerWriterId: existing.writerId, releasedByWriterId: currentWriterId };
    }
  }

  tx.unlink(claimFilePath);

  return admin ? { released: true, claim: existing, admin } : { released: true, claim: existing };
}

/**
 * Overlay active claims onto a durable state view (D4).
 * Formula: effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item).
 */
export function buildEffectiveView(durableView, claims = {}) {
  if (!durableView || !durableView.work) return durableView;
  const effectiveWork = {};
  for (const [id, item] of Object.entries(durableView.work)) {
    const claim = claims[id];
    // tsk-40m code-review finding (blocker): a claim can legitimately
    // outlive the durable settle it belonged to for a short window (a
    // process crash or a releaseClaim failure between the durable write
    // succeeding and the claim file actually being unlinked) -- if the
    // item's CURRENT durable status has already moved off what the claim
    // recorded at acquire time, the claim is stale/orphaned, not active
    // current work. Overlaying it as 'doing' would hide a real durable
    // awaiting-approval/blocked/etc. status behind a claim that no longer
    // describes anything in progress. A claim with no recorded
    // preClaimStatus (legacy data) can't be judged stale this way -- kept
    // trusted as before, never a false positive on old data.
    const claimIsStale = claim && claim.preClaimStatus != null && claim.preClaimStatus !== item.status;
    if (claimIsStale) {
      effectiveWork[id] = { ...item, staleClaim: claim };
      continue;
    }
    if (claim) {
      const overlaid = {
        ...item,
        status: 'doing',
        statusCategory: 'in-progress',
        claimRole: claim.claimRole || claim.actor || item.claimRole,
        activeClaim: claim,
      };
      // The claim record is authoritative for these fields once active — a
      // field the claim itself never set (persisted as null, e.g. no
      // headAtTake for a branch-source claim) must not leak the pre-claim
      // durable item's own stale copy back into the effective view.
      if (claim.headAtTake != null) overlaid.headAtTake = claim.headAtTake;
      else delete overlaid.headAtTake;
      if (claim.branchHeadAtTake != null) overlaid.branchHeadAtTake = claim.branchHeadAtTake;
      else delete overlaid.branchHeadAtTake;
      if (claim.claimTrigger != null) overlaid.claimTrigger = claim.claimTrigger;
      else delete overlaid.claimTrigger;
      effectiveWork[id] = overlaid;
    } else {
      effectiveWork[id] = item;
    }
  }
  return {
    ...durableView,
    work: effectiveWork,
  };
}
