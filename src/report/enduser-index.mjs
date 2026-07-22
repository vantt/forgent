// enduser-index.mjs — pure transform for the read-by-tag end-user doc index
// (bước-3, CONTEXT.md D12/D13/D14). Mirrors entropy.mjs's own purity
// discipline exactly: ZERO imports, no fs, no Date.now(), no side effects of
// any kind — it receives the already-enumerated doc entries plus the
// rebuilt outcomes view as plain arguments/objects and returns the manifest
// array. All I/O (readdir over docs/<quadrant>/, first-H1 extraction,
// rebuild(dir), writing enduser-docs-index.json) is the entry layer's job
// (bin/fgos.mjs's `docs-index` handler) — never this module's, so this file
// sits at the same "domain" layer as entropy.mjs with no upward import.

// The four Diataxis quadrants this index recognizes, in the exact dir-name
// form they live under `docs/<quadrant>/` (D12). Only `how-to/` exists on
// disk today (D12 validation constraint (a)) — the other three are valid,
// simply-empty quadrants until docs land there; the entry layer must treat
// a missing quadrant dir as "zero docs", never a crash.
export const QUADRANTS = ['tutorials', 'how-to', 'reference', 'explanation'];

// Fixed quadrant -> {purpose, audience} mapping (D12/D14): the SINGLE
// source of truth for what each Diataxis quadrant is for and who it is for.
// Defined ONCE, here — the fgos-indexing skill (cell 14) points at this
// mapping, it never restates the values. The purpose/audience pair is the
// explicit hedge against the Diataxis-sufficiency doubt recorded at D14: an
// index entry is self-describing even if a reader questions whether the
// quadrant label alone is enough.
// One extra on-disk directory alias per quadrant (str64-backfill, CONTEXT.md
// D2): `docs/decisions/` (17 pre-existing ADR records, already product-facing
// distilled) enters the index as `explanation`-quadrant docs alongside the
// primary `docs/explanation/` convention, without moving the files. This is
// the ONE explicit, locked extension — not a general multi-location-per-
// quadrant mechanism, so it deliberately stays a plain quadrant->[dirNames]
// map rather than something more generic. A quadrant absent from this map has
// no alias; the entry layer (bin/fgos.mjs) reads it to also scan
// `docs/<alias>/` for any quadrant listed here, tagging entries found there
// with the quadrant name, never the alias dir name (docPath still reflects
// the real on-disk `docs/decisions/...` location).
export const QUADRANT_DIR_ALIASES = Object.freeze({
  explanation: Object.freeze(['decisions']),
});

export const QUADRANT_META = Object.freeze({
  tutorials: Object.freeze({
    purpose: 'Teach a newcomer to complete a first real task, learning by doing.',
    audience: 'A first-time user with no prior context on this system.',
  }),
  'how-to': Object.freeze({
    purpose: 'Show the steps to accomplish one specific, already-understood goal.',
    audience: 'A user who already knows the system and wants a concrete recipe.',
  }),
  reference: Object.freeze({
    purpose: 'Describe the machinery accurately and completely for lookup.',
    audience: 'A user who needs precise facts about a specific field/command/API.',
  }),
  explanation: Object.freeze({
    purpose: 'Clarify why the system is shaped the way it is, and the tradeoffs behind it.',
    audience: 'A user seeking understanding of the design, not a task to complete.',
  }),
});

/**
 * Find the id of the compound-learn outcome record whose `docPath` matches
 * `docPath` exactly (D13's fidelity/back-link guarantee). `outcomesView` is
 * `view.outcomes` as folded by replay.mjs — `{ [id]: { ...predicted, ...actual,
 * docPath?, docType? } }`, merged-by-id per work.outcome's additive fold —
 * so a single matching id is enough; ties are not expected in practice (a
 * docPath is written once, at the doc's own compound-time), but if more than
 * one id ever carries the same docPath, the first found (stable object-key
 * order) is returned rather than throwing — a read-only index never refuses
 * to render over a data anomaly it did not cause.
 * Returns `null` when no outcome record carries this docPath (the legacy
 * how-to demo, which predates the `--doc-path` capture wiring).
 */
export function findSourceCaptureId(outcomesView, docPath) {
  for (const [id, outcome] of Object.entries(outcomesView ?? {})) {
    if (outcome?.docPath === docPath) {
      return id;
    }
  }
  return null;
}

/**
 * Find EVERY outcome id whose `docPath` matches `docPath` exactly — the
 * plural counterpart to `findSourceCaptureId` above, added for the Slice ①
 * gộp-sống merge (CONTEXT.md D13/D17): the export skill must gather ALL
 * captures linked to a docPath to reconstruct a living doc with no loss of
 * detail, not just the first — the singular helper's first-match behavior
 * above is unchanged and stays the index's own sourceCaptureId resolver.
 * Returns ids in the outcomesView's own stable insertion (object-key) order;
 * `[]` when no outcome carries this docPath — a docPath with zero linked
 * captures is a legitimate, common state, never an error.
 */
export function findSourceCaptureIds(outcomesView, docPath) {
  const ids = [];
  for (const [id, outcome] of Object.entries(outcomesView ?? {})) {
    if (outcome?.docPath === docPath) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Build the manifest array from enumerated doc entries + the rebuilt
 * outcomes view. `docEntries` is `[{ quadrant, docPath, title }]` — exactly
 * what the entry-layer enumeration step produces per doc file found under a
 * `docs/<quadrant>/` dir (readdir + first-H1 extraction), one entry per real
 * on-disk file. `outcomesView` is `view.outcomes` (or `{}`/`undefined` when
 * the log has no outcomes at all — the same lazy-key shape replay.mjs uses
 * everywhere else).
 *
 * Idempotent by construction (D12 validation constraint (d)): the caller
 * re-enumerates the doc tree fresh on every run and this function derives
 * the manifest purely from that snapshot plus the current outcomes view —
 * there is no accumulating state anywhere in the pipeline for a re-run to
 * duplicate. This function additionally dedupes defensively on `docPath`
 * (keeping the first occurrence) so a caller that ever passed the same doc
 * twice in one `docEntries` array still gets exactly one manifest row for
 * it, never two.
 */
export function buildEnduserIndex(docEntries, outcomesView) {
  const seenPaths = new Set();
  const entries = [];
  for (const doc of docEntries ?? []) {
    if (!doc || typeof doc.docPath !== 'string' || seenPaths.has(doc.docPath)) {
      continue;
    }
    seenPaths.add(doc.docPath);
    const meta = QUADRANT_META[doc.quadrant] ?? { purpose: null, audience: null };
    entries.push({
      quadrant: doc.quadrant,
      purpose: meta.purpose,
      audience: meta.audience,
      docPath: doc.docPath,
      title: doc.title ?? null,
      sourceCaptureId: findSourceCaptureId(outcomesView, doc.docPath),
    });
  }
  return entries;
}
