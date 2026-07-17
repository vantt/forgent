// root-affinity.mjs — the root-affinity claim door (D13): keeps every leaf
// of one lineage tree co-located under a single owning identity (D5) once
// fan-out lets N workers pull concurrently.
//
// PURE: no fs import, no child_process import. Ownership lives ONLY in the
// in-memory store this module hands back (`createOwnershipStore`) — nothing
// here writes `.fgos/`, the event log, or `work.mjs`'s schema. Per the
// cell's own SCOPE DECISION: P6 is a single bounded drain-run in one process
// (D15 — the run terminates when nothing is in-flight and the frontier is
// empty), so ownership only needs to survive that one drain-run's lifetime,
// which a plain in-memory Map already covers exactly. Durable, cross-process
// ownership (a lease with expiry) is P27's job, not P6's — see CONTEXT.md
// D13's own note. Shape mirrors the D13 2-actor race spike
// (.bee/spikes/fan-out-parallel/root-affinity-race-probe.mjs)'s
// makeRootStore()/decideClaim() closely, turned into a real, tested,
// reusable module.
//
// `identity` is just a caller-supplied string (P6 is single-machine per
// D14) — this module never inspects or interprets it, only compares for
// equality. A future P27 multi-machine deploy would pass a real
// machine/session id; P6 callers pass a constant.
//
// Concurrency note: `claimRoot` below is a PURE decision function — it never
// calls `store.setOwner` itself. The caller (cell fan-out-parallel-8) is
// responsible for wrapping the decide-then-write transaction in Epic 1's
// write-queue (D16), exactly as the spike proved is required for genuine
// mutual exclusion under async interleaving. This module supplies the
// decision logic only; it has no opinion about the queue.

/**
 * Create a fresh in-memory ownership store: one Map from root item id to the
 * identity that currently owns it. The caller creates exactly one of these
 * per `runOnce` invocation and threads it through the whole drain-run; it is
 * never persisted anywhere.
 *
 * @returns {{getOwner: (rootId: string) => string|null, setOwner: (rootId: string, ownerIdentity: string) => void}}
 */
export function createOwnershipStore() {
  const owners = new Map();
  return {
    getOwner(rootId) {
      return owners.get(rootId) ?? null;
    },
    setOwner(rootId, ownerIdentity) {
      owners.set(rootId, ownerIdentity);
    },
  };
}

/**
 * Resolve the root of the lineage tree `id` belongs to: walk `view.work[id].parent`
 * upward until reaching an item with no `parent` (or whose `parent` does not
 * resolve to a known item), and return THAT item's id. An item with no
 * `parent` is its own root and resolves to itself.
 *
 * Defensive backstop, mirroring `frontier.mjs`'s `hasOpenDescendant`: a
 * `seen` set guards against a cyclic or malformed parent chain turning this
 * into an infinite walk. Should not occur on real decompose-produced data —
 * if a cycle is detected, the walk stops and returns the current id rather
 * than looping forever.
 *
 * @param {{work: Record<string, {parent?: string|null}>}} view
 * @param {string} id
 * @returns {string}
 */
export function resolveRoot(view, id) {
  const work = view?.work ?? {};
  const seen = new Set();
  let current = id;
  while (true) {
    if (seen.has(current)) return current;
    seen.add(current);
    const item = work[current];
    const parent = item?.parent;
    if (!parent || !work[parent]) return current;
    current = parent;
  }
}

/**
 * Decide whether `ownerIdentity` may claim the root of `id`'s lineage tree.
 * PURE: reads `store.getOwner` but never calls `store.setOwner` — the caller
 * applies the decision (exactly like the spike's decideClaim/claimTransaction
 * split), inside its own write-queue transaction.
 *
 * - unowned root -> {accepted: true, root, action: 'claim'} (caller should set owner)
 * - owned by `ownerIdentity` already -> {accepted: true, root, action: 'noop'}
 * - owned by a different identity -> {accepted: false, root, action: 'reject', currentOwner}
 *
 * @param {{getOwner: (rootId: string) => string|null}} store
 * @param {{work: Record<string, {parent?: string|null}>}} view
 * @param {string} id
 * @param {string} ownerIdentity
 */
export function claimRoot(store, view, id, ownerIdentity) {
  const root = resolveRoot(view, id);
  const current = store.getOwner(root);
  if (current === null) {
    return { accepted: true, root, action: 'claim' };
  }
  if (current === ownerIdentity) {
    return { accepted: true, root, action: 'noop' };
  }
  return { accepted: false, root, action: 'reject', currentOwner: current };
}

/**
 * Filter a ready-work array (the shape `frontier.mjs`'s `frontier()` already
 * returns) down to only the items whose resolved root is either unowned or
 * owned by `ownerIdentity` (D13: "puller X chỉ thấy ready-leaf của root
 * X-sở-hữu hoặc chưa-chủ"). A pure read-side filter — never mutates `store`.
 *
 * On a view with no `parent` fields at all and a fresh (empty) store, every
 * item resolves to itself as an unowned root, so this is a full no-op
 * (keeps everything) — mirrors `frontier.mjs`'s own backward-compat
 * guarantee for parent-less data.
 *
 * @param {Array<{id: string}>} readyItems
 * @param {{work: Record<string, {parent?: string|null}>}} view
 * @param {{getOwner: (rootId: string) => string|null}} store
 * @param {string} ownerIdentity
 * @returns {Array<{id: string}>}
 */
export function steerFrontier(readyItems, view, store, ownerIdentity) {
  return readyItems.filter((item) => {
    const root = resolveRoot(view, item.id);
    const owner = store.getOwner(root);
    return owner === null || owner === ownerIdentity;
  });
}
