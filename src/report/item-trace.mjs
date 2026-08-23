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

// Friction report cap (per porting lesson predicted-actual-feedback-store:
// "gợi ý luôn CAP, không xả vô hạn") — counts are always full, the record
// list returned is only the newest few.
export const FRICTION_DISPLAY_CAP = 5;

/** Friction channel data (kênh 2 của capture 2 kênh — Phase 3 Slice 2):
 * per-layer counts over ALL matching records, plus the newest records
 * capped at FRICTION_DISPLAY_CAP. `frictions` is a lazy view key
 * (replay.mjs) — a log with no work.friction events has no key and this
 * returns null, keeping `check`'s data shape byte-identical to
 * pre-friction logs. */
export function collectFrictionData(view, id) {
  const frictions = view.frictions ?? {};
  const records = (id ? [id] : Object.keys(frictions)).flatMap((itemId) =>
    (frictions[itemId] ?? []).map((r) => ({ ...r, id: r.id ?? itemId })),
  );
  if (records.length === 0) {
    return null;
  }
  const byLayer = {};
  for (const r of records) {
    byLayer[r.layer] = (byLayer[r.layer] ?? 0) + 1;
  }
  const recent = records
    .sort((a, b) => ((a.ts ?? '') < (b.ts ?? '') ? -1 : 1))
    .slice(-FRICTION_DISPLAY_CAP)
    .reverse();
  return { count: records.length, byLayer, recent };
}

/** `review`'s trace summary (pr-lifecycle-2 cell action: "kèm trace tóm tắt
 * (outcome/friction)"): reuses the SAME two data sources `check` already
 * returns — no new collector, no new data source — so a reviewer gets
 * exactly the outcome/friction history `fgos check <id>` would show, folded
 * into the review payload instead of requiring a second command. */
export function collectReviewTrace(view, id) {
  const outcomeEntry = view.outcomes?.[id] ?? null;
  return {
    outcome: outcomeEntry ? collectOutcomeEntry(id, outcomeEntry) : null,
    friction: collectFrictionData(view, id),
  };
}
