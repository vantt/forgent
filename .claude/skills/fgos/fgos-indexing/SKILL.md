---
name: fgos-indexing
description: >-
  Regenerate the machine-readable, read-by-tag index of fgOS end-user
  documents after any end-user doc is written during compound-learn. Use
  once `fgos-compounding` has stored a `docType`/`docPath`-tagged capture
  and written its document — this skill turns the real docs on disk into
  `docs/enduser-docs-index.json`. Examples: "the end-user doc just landed,
  update the index", "regenerate the docs index", "where do I point a
  reader who wants docs by audience/purpose instead of by file path".
---

# fgos-indexing

Runs after `fgos-compounding` has written an end-user document and stored
its `docType`/`docPath` on the item's capture. This skill does not classify
or write documents itself — that stays `fgos-compounding`'s job — it only
regenerates the read-by-tag catalog over whatever real documents already
exist under `docs/<quadrant>/`.

## When to run

Run `fgos docs-index` once, right after step 4/5 of `fgos-compounding`
(the document is on disk and the capture's `docType`/`docPath` are
confirmed). It is read-only and safe to re-run any time the set of
end-user documents changes — it always regenerates the whole manifest
fresh from disk, never accumulates or appends across runs.

## What it produces

`fgos docs-index` enumerates every document under `docs/<quadrant>/`
(the four Diataxis quadrant directories) and writes
`repo/docs/enduser-docs-index.json` — the machine-readable, read-by-tag
index of fgOS end-user docs. Each entry carries the doc's quadrant,
`purpose`/`audience`, `docPath`, `title`, and `sourceCaptureId` (the
compound-learn capture the doc came from, or `null` when none is
recorded yet — e.g. a doc written before `--doc-path` capture existed).

## The quadrant → {purpose, audience} mapping

The fixed mapping from Diataxis quadrant to its `{purpose, audience}`
pair is **not** defined by this skill. It lives in exactly one place —
`QUADRANT_META` in `repo/src/report/enduser-index.mjs` — and this skill
only points at it. Read that export if you need to see or discuss the
actual purpose/audience strings; never restate or re-derive them here,
and never hand-edit an index entry's `purpose`/`audience` — they come
from `QUADRANT_META` alone, keyed by the entry's `quadrant`.

## Superseded pointer

This skill's manifest supersedes **only** the end-user-docs pointer bullet
in `docs/specs/reading-map.md` (the line naming `docs/how-to/`,
`docs/tutorials/`, `docs/reference/`, `docs/explanation/`). That file
itself stays the whole-repo canonical first-read and every other entry in
it is unaffected — this skill never removes or restructures
`reading-map.md`, it only keeps that one pointer accurate: it now names
`docs/enduser-docs-index.json` as the machine-readable read-by-tag index,
in place of a hand-maintained prose description of the four directories.

## Red flags

- restating or re-deriving a `purpose`/`audience` string instead of
  reading it from `QUADRANT_META`
- hand-editing `docs/enduser-docs-index.json` instead of re-running
  `fgos docs-index`
- treating this skill as a document-writer or classifier — that is
  `fgos-compounding`'s job; this skill only indexes what already exists
- removing `reading-map.md` or any of its other entries while updating
  the end-user-docs pointer

Violating the letter of the rules is violating the spirit of the rules.

Manifest regenerated from real docs on disk, pointer in `reading-map.md`
kept accurate. This skill's job ends there.
