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
import { resolveDocPath } from './knowledge-resolver.mjs';

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
 * `docPath` (or resolves to the same doc via stateView).
 */
export function findSourceCaptureId(outcomesView, docPath, stateView = null) {
  const ids = findSourceCaptureIds(outcomesView, docPath, stateView);
  return ids.length > 0 ? ids[0] : null;
}

/**
 * Find EVERY outcome id whose `docPath` matches `docPath` (or resolves to the
 * same doc via stateView).
 */
export function findSourceCaptureIds(outcomesView, docPath, stateView = null) {
  const ids = [];
  let targetDocIds = null;

  if (stateView && stateView.docs) {
    const res = resolveDocPath(stateView, docPath);
    if (res) {
      const docList = Array.isArray(res) ? res : [res];
      targetDocIds = new Set(docList.map((d) => d.docId));
    }
  }

  for (const [id, outcome] of Object.entries(outcomesView ?? {})) {
    if (!outcome || !outcome.docPath) continue;
    if (outcome.docPath === docPath) {
      if (!ids.includes(id)) ids.push(id);
      continue;
    }
    if (targetDocIds && stateView && stateView.docs) {
      const outcomeRes = resolveDocPath(stateView, outcome.docPath);
      if (outcomeRes) {
        const outcomeDocList = Array.isArray(outcomeRes) ? outcomeRes : [outcomeRes];
        const match = outcomeDocList.some((d) => targetDocIds.has(d.docId));
        if (match && !ids.includes(id)) {
          ids.push(id);
        }
      }
    }
  }

  return ids;
}

/**
 * Build the manifest array from enumerated doc entries + the rebuilt
 * outcomes view + optional stateView.
 */
export function buildEnduserIndex(docEntries, outcomesView, stateView = null) {
  const seenPaths = new Set();
  const entries = [];
  for (const doc of docEntries ?? []) {
    if (!doc || typeof doc.docPath !== 'string' || seenPaths.has(doc.docPath)) {
      continue;
    }
    seenPaths.add(doc.docPath);
    const meta = QUADRANT_META[doc.quadrant] ?? { purpose: null, audience: null };

    let aliases = [];
    if (stateView && stateView.docs) {
      const res = resolveDocPath(stateView, doc.docPath);
      if (res && !Array.isArray(res) && Array.isArray(res.aliases)) {
        aliases = res.aliases;
      }
    }

    entries.push({
      quadrant: doc.quadrant,
      purpose: meta.purpose,
      audience: meta.audience,
      docPath: doc.docPath,
      title: doc.title ?? null,
      sourceCaptureId: findSourceCaptureId(outcomesView, doc.docPath, stateView),
      ...(aliases.length > 0 ? { aliases } : {}),
    });
  }
  return entries;
}
