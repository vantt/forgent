// item-trace.mjs — the outcome/friction trace of ONE work item, read
// straight off a replayed view.
//
// Pure view-readers: no fs, no child_process, no imports. They were
// module-level functions in bin/fgos.mjs, which put entry-tier code in
// charge of domain-tier data — five verbs (`review`, `check`, `show`,
// `doc-sources`, `evolve`) already shared them, and once `review` moved to
// the use-case layer it could not reach back up into the entry file at all
// (tsk-49i D5). Nothing about their behavior changes here.

/** One item's predicted-vs-actual outcome entry, with the two
 * compound-learn fields (`docType`, CONTEXT D12/D15 `docPath`) surfaced as
 * their real value when present and `null` when absent — a capture with no
 * doc-path stays byte-identical to pre-docPath logs. */
export function collectOutcomeEntry(id, entry) {
  return {
    id,
    predicted: entry?.predicted ?? null,
    actual: entry?.actual ?? null,
    docType: entry?.docType ?? null,
    docPath: entry?.docPath ?? null,
  };
}

/** `review`'s trace summary (pr-lifecycle-2 cell action):
 * returns outcome history folded into the review payload. */
export function collectReviewTrace(view, id) {
  const outcomeEntry = view.outcomes?.[id] ?? null;
  return {
    outcome: outcomeEntry ? collectOutcomeEntry(id, outcomeEntry) : null,
  };
}
