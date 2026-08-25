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

export function getMainFgosDir(dir) {
  if (!dir) return dir;
  try {
    const mainRoot = resolveMainCheckoutRoot(path.dirname(dir));
    return mainRoot ? fgosDirFromRoot(mainRoot) : dir;
  } catch {
    return dir;
  }
}

export class ClaimError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'ClaimError';
    this.category = category;
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
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
 * Acquire `.fgos/runtime/claims.lock` exclusively for reading/modifying claims.
 */
export function withClaimsLock(fgosDirInput, fn, { timeoutMs = 2000, retryMs = 10 } = {}) {
  const fgosDir = getMainFgosDir(fgosDirInput);
  const lockPath = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_LOCK);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const deadline = Date.now() + timeoutMs;
  const pid = process.pid;
  let acquired = false;

  while (Date.now() < deadline) {
    const tmpPath = `${lockPath}.tmp-${pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify({ pid, ts: Date.now() }), 'utf8');
      fs.linkSync(tmpPath, lockPath);
      acquired = true;
      try { fs.unlinkSync(tmpPath); } catch {}
      break;
    } catch (err) {
      try { fs.unlinkSync(tmpPath); } catch {}
      if (err.code !== 'EEXIST') throw err;
    }

    let raw;
    try {
      raw = fs.readFileSync(lockPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }

    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
    if (parsed && typeof parsed.pid === 'number') {
      if (!isPidAlive(parsed.pid) || (Date.now() - parsed.ts > 30000)) {
        try { fs.unlinkSync(lockPath); } catch {}
        continue;
      }
    }
    sleepSync(retryMs);
  }

  if (!acquired) {
    throw new ClaimError('lock-timeout', `Timed out acquiring claims.lock at "${lockPath}"`);
  }

  try {
    return fn();
  } finally {
    try {
      fs.unlinkSync(lockPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
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
  const fgosDir = getMainFgosDir(fgosDirInput);
  const claimsDir = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_DIR);
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
    const claim = readClaim(fgosDir, id);
    if (claim) {
      claims[id] = claim;
    }
  }
  return claims;
}

/**
 * Acquire a runtime claim record for item `id`.
 */
export function acquireClaim(fgosDirInput, {
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

  const fgosDir = getMainFgosDir(fgosDirInput);
  return withClaimsLock(fgosDir, () => {
    const claimsDir = resolveFgosFile(fgosDir, FGOS_FILE.CLAIMS_DIR);
    fs.mkdirSync(claimsDir, { recursive: true });
    const claimFilePath = path.join(claimsDir, `${id}.json`);

    if (!force) {
      const existing = readClaim(fgosDir, id);
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
    // invocations from the SAME terminal, via its own env-session-var/
    // pid-ancestor-walk). Recorded here so settleClaim can verify, at
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

    const tmpPath = `${claimFilePath}.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(claimRecord, null, 2), 'utf8');
    fs.renameSync(tmpPath, claimFilePath);

    return claimRecord;
  });
}

/**
 * Release an active runtime claim record for item `id`.
 */
export function releaseClaim(fgosDirInput, { id, claimId } = {}) {
  if (!id || typeof id !== 'string') {
    throw new ClaimError('validation', 'releaseClaim: "id" is required');
  }

  const fgosDir = getMainFgosDir(fgosDirInput);
  return withClaimsLock(fgosDir, () => {
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

    try {
      fs.unlinkSync(claimFilePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    return { released: true, claim: existing };
  });
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
