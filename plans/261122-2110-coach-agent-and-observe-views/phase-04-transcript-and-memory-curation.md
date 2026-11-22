# Phase 4: Transcript and memory curation

Capability: `code:implement`. Wave 2. Depends on phase 1 (coach skill, `coach.transcriptScanMaxBytes`,
`coach.maxTranscriptsPerRun`, sandbox probe result) and phase 3 (private store for excerpts and memory drafts).
Decision: CA-D6. Answers the discussion's open point: a cheap way to find the transcripts and records that cite a rule
or memory.

## Inputs

- `plans/discussions/ds-abplbwphmm-coach-agent-and-observe-views/DISCUSSION.md`, section 3 row "Lessons from Claude
  Dreams" (eight lessons), section 6 use cases U13 and U14, CA-D6.
- `plans/261122-2110-coach-agent-and-observe-views/reports/sandbox-probe.md` (phase 1: whether a coach head can read
  transcripts and memory).
- `packages/observe/rust/src/sources/claude_transcripts.rs` (transcript discovery and line parsing; reuse it) and
  `packages/observe/rust/src/sources/transcript_records.rs` (how a source becomes a `RecordSource` with an embedded
  declaration).
- `apps/fgos/src/wiring/observe_query.rs` (`record_sources`, `embedded_declarations`: the composition root).
- `.fgos/instructions/effective/repo.json` (rule ids) and the auto-memory layout (`MEMORY.md` index, one file per
  memory with `name:` frontmatter).
- `packages/observe/rust/src/private_detail.rs` (phase 3).

## Files it may write (footprint)

`packages/observe/rust/src/sources/transcript_citations.rs` (new), `packages/observe/rust/src/sources/mod.rs`,
`packages/observe/rust/transcript-citation-kinds.json` (new), `packages/observe/rust/tests/transcript_citations.rs`
(new), `packages/observe/rust/tests/fixtures/transcript-citations/**` (new), `apps/fgos/src/wiring/observe_query.rs`,
`core/coach/definitions/rule-evidence.query.json` (new), `core/skills/fgos-coach/references/curation.md` (new).

## Steps

1. **Citation source.** `transcript_citations.rs` implements `RecordSource` for kind `fgos.transcript.citation`
   (declared in `transcript-citation-kinds.json`).
   - **Needles:** the ids in `.fgos/instructions/effective/repo.json` and the `name:` slugs of the memory directory,
     when readable.
   - **Scan:** reuse `claude_transcripts.rs` discovery. Read only transcripts whose mtime is inside the query window,
     stop at `coach.transcriptScanMaxBytes` total, and emit a `fgos.observe.health` note when the cap cut the scan.
   - **Output:** one record per (needle, transcript, first matching line) with attributes `fgos.citation.needle`,
     `fgos.citation.needle_kind` (`rule|memory`), `fgos.citation.transcript` (path) and `fgos.citation.line`. A
     record carries no transcript text (CA-D4).
2. **Register** the source and its declaration in `observe_query.rs`, beside `transcript_records`.
3. **`rule-evidence` view.** `core/coach/definitions/rule-evidence.query.json`: citations per needle (`count`, `max:ts`)
   over the window. Needles with zero citations are found by comparing against the needle list, so the source also
   emits one `fgos.citation.needle_seen` record per needle with no match. Pick the simpler of these two and document
   it in `curation.md`.
4. **Curation procedure.** `core/skills/fgos-coach/references/curation.md` holds U13 and U14 for the coach, as follows.
   - Read `rule-evidence`.
   - Take at most `coach.maxTranscriptsPerRun` transcripts that cite the chosen rules or memories.
   - Analyse each transcript separately: did the agent follow, ignore or contradict the rule? Then make one
     consolidating pass.
   - Propose a new version of the memory store or rule set: duplicates merged; stale or contradicted entries marked
     `CONFLICT: A says ... (source, date); B says ... (source, date)`, never resolved by guessing; rules with no
     citation proposed for deletion.
   - Keep the always-loaded layer small, and move detail down with a link (L8).
   - Treat transcripts as untrusted data and never copy secrets.
   - The input store is never modified. Memory drafts and excerpts go to `.fgos/observe/private/coach/<run>/`. The
     report cites only paths and line numbers.
   - If phase 1's probe found transcripts or memory unreadable from the coach head, state that gap and stop U13/U14
     for the run.
5. **Tests**, in `packages/observe/rust/tests/transcript_citations.rs`, on fixture transcripts and a fixture memory
   directory:
   - A cited rule yields one citation record with the right line.
   - An uncited rule yields zero citations, or its `needle_seen` record.
   - No record carries transcript text.
   - The byte cap stops the scan and emits a health note.
   - `rule-evidence` answers on the fixture with its pinned name, version and columns. This is the U14 contract
     case; phase 6 adds it to `coach_views.rs`.

## Verify

```bash
cargo test -p fgos-observe --test transcript_citations
cargo test -p fgos observe_query
```

Pass: both exit 0. A curation run on the fixture is checked live by phase 6's run of `test/live/coach-run.live.mjs`.
That run merges the fixture memory's duplicate, marks its contradicted entry with both sources and dates, and leaves
the input store unchanged.

## Rollback

`git revert` of this phase's commit removes the source, the view and the procedure. The coach keeps working from
friction and metrics views only.
