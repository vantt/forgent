// src/report/knowledge-resolver.mjs

/**
 * Pure resolver function mapping an oldPath or currentPath to current active doc(s).
 * Accepts folded state view from knowledge registry.
 * Does NOT perform file I/O.
 *
 * @param {object} view - Folded state view containing `topics` and `docs`.
 * @param {string} path - Target path to resolve.
 * @returns {object|Array<object>|null} Single doc object, array of doc objects, or null if unresolvable.
 */
export function resolveDocPath(view, path) {
  if (!view || !view.docs || !path) return null;

  // "Live" means both the doc itself is non-retired AND its own topic is
  // still active -- docs/architect/knowledge-registry-redesign.md §14.3's
  // producer gate explicitly requires attestation to reject retired topics,
  // not just retired documents. A topic retired directly (fgos topic
  // retire, as opposed to split/merge, which always move a doc's topicId
  // onto a still-active successor) has no lineage forward to anything, so
  // excluding it here also correctly makes step 3's lineage chase below
  // find no active successor for it -- the doc becomes fully unresolvable,
  // not silently still-attestable.
  const isLive = (d) => d.docLifecycle !== 'retired' && view.topics?.[d.topicId]?.status === 'active';

  // 1. Direct match on currentPath among live docs
  const activeDocs = Object.values(view.docs).filter((d) => d.currentPath === path && isLive(d));
  if (activeDocs.length === 1) return activeDocs[0];
  if (activeDocs.length > 1) return activeDocs;

  // 2. Direct match on aliases among live docs
  const aliasDocs = Object.values(view.docs).filter(
    (d) => Array.isArray(d.aliases) && d.aliases.includes(path) && isLive(d)
  );
  if (aliasDocs.length === 1) return aliasDocs[0];
  if (aliasDocs.length > 1) return aliasDocs;

  // 3. Match against all docs (including retired or retired-topic docs)
  const matchingRetiredDocs = Object.values(view.docs).filter(
    (d) => d.currentPath === path || (Array.isArray(d.aliases) && d.aliases.includes(path))
  );

  if (matchingRetiredDocs.length === 0) return null;

  const targetDocs = new Set();

  // `visited` guards against a lineage cycle (splitFrom/mergedFrom pointing
  // back through some chain to a topic already on the current path) turning
  // this into unbounded recursion -- a RangeError here would crash every
  // reader of this resolver (knowledge attest, the end-user doc index,
  // doctor), not just this one lookup. The write side (topic.split/merge)
  // now refuses to create a cycle going forward, but this stays defensive
  // for any lineage data that predates that guard.
  function leadsFrom(tId, ancestorId, visited = new Set()) {
    if (tId === ancestorId) return true;
    if (visited.has(tId)) return false;
    visited.add(tId);
    const t = view.topics?.[tId];
    if (!t) return false;
    if (t.lineage?.splitFrom && leadsFrom(t.lineage.splitFrom, ancestorId, visited)) return true;
    if (Array.isArray(t.lineage?.mergedFrom) && t.lineage.mergedFrom.some((m) => leadsFrom(m, ancestorId, visited))) return true;
    return false;
  }

  const currentTopics = Object.values(view.topics || {}).filter((t) => t.status === 'active');

  for (const rDoc of matchingRetiredDocs) {
    for (const t of currentTopics) {
      if (leadsFrom(t.topicId, rDoc.topicId)) {
        const docsInT = Object.values(view.docs).filter(
          (d) => d.topicId === t.topicId && d.docLifecycle !== 'retired' && d.role === rDoc.role
        );
        // If exact role match exists, add those; otherwise add all non-retired docs in t
        if (docsInT.length > 0) {
          for (const d of docsInT) targetDocs.add(d);
        } else {
          const allDocsInT = Object.values(view.docs).filter(
            (d) => d.topicId === t.topicId && d.docLifecycle !== 'retired'
          );
          for (const d of allDocsInT) targetDocs.add(d);
        }
      }
    }
  }

  const results = Array.from(targetDocs);
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return results;
}
