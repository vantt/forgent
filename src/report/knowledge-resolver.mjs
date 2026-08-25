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

  // 1. Direct match on currentPath among non-retired docs
  const activeDocs = Object.values(view.docs).filter(
    (d) => d.currentPath === path && d.docLifecycle !== 'retired'
  );
  if (activeDocs.length === 1) return activeDocs[0];
  if (activeDocs.length > 1) return activeDocs;

  // 2. Direct match on aliases among non-retired docs
  const aliasDocs = Object.values(view.docs).filter(
    (d) => Array.isArray(d.aliases) && d.aliases.includes(path) && d.docLifecycle !== 'retired'
  );
  if (aliasDocs.length === 1) return aliasDocs[0];
  if (aliasDocs.length > 1) return aliasDocs;

  // 3. Match against all docs (including retired or retired-topic docs)
  const matchingRetiredDocs = Object.values(view.docs).filter(
    (d) => d.currentPath === path || (Array.isArray(d.aliases) && d.aliases.includes(path))
  );

  if (matchingRetiredDocs.length === 0) return null;

  const targetDocs = new Set();

  function leadsFrom(tId, ancestorId) {
    if (tId === ancestorId) return true;
    const t = view.topics?.[tId];
    if (!t) return false;
    if (t.lineage?.splitFrom && leadsFrom(t.lineage.splitFrom, ancestorId)) return true;
    if (Array.isArray(t.lineage?.mergedFrom) && t.lineage.mergedFrom.some((m) => leadsFrom(m, ancestorId))) return true;
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
