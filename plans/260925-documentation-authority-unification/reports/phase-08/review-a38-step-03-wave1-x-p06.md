# Review a38 step-03 wave 1 expansion, part p06

Reviewer: independent read-only. Pin `ae141550c`, worktree `forgentX-s8-review`. Records are `step-03-records/batch-015.jsonl` lines 16-21, all in set batch-015.

Method: I read each whole source at the pin and every edge in its record (span, expression, disposition, unit, target, anchor, timing, reason, categories, targetFacts). I read each diff and the legacyScan/description/witness checks. I verified target existence with `git cat-file` and `git ls-tree` at the pin. I wrote my own read-only relative-link scan that mirrors the checker's resolution order (consumer directory, then area root, then provenance roots). I compared it against each record's edge lines. I did not run any step-03 check, probe or resolve script.

## Verdicts

| File | Record | Edges | Verdict |
|---|---|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/README.md` | batch-015:16 | 4 | ok |
| `docs/platform/agent-coordination/history/retired-engine/inbound/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | batch-015:17 | 9 (5 inventory + 4 added) | ok |
| `docs/platform/agent-coordination/history/retired-engine/legacy/README.md` | batch-015:18 | 19 (5 inventory + 14 added) | ok |
| `docs/platform/agent-coordination/history/retired-engine/subcomponents/README.md` | batch-015:19 | 21 | ok (record-text notes below) |
| `docs/platform/agent-coordination/proposals/README.md` | batch-015:20 | 2 | ok |
| `docs/platform/agent-coordination/verification/README.md` | batch-015:21 | 18 | ok |

**Per-set count for batch-015, this part only:** reviewed 6 files / 73 edges, rework 0. No earlier wave-1 report (p01-p03, u01-u04) lists these six files. The related u03 and p01 entries cover different files, so there were no earlier defects to confirm fixed.

## Outcome defects

None found.

## What was checked, per file

- **files/vocabulary/README.md**
  - The Related `docs/specs/runner.md` patch (maps-j-06280, L17) goes to `docs/platform/runner/spec.md`. It exists at the pin and is not self or duplicate. The Related list holds only the area README, so the patch is correct and the diff hunk matches L17.
  - L19, L23 and L36 preserve as wrapper lineage or snapshot provenance. The successor note `runner/decisions/h-aabefc85f0c9.md` is a valid exact target.
  - The snapshot-internal links `../vision.md`, `../history/...` and `canonical-concepts.md` resolve natively to live candidate files, because the wrapper Provenance names a candidate path. They are correctly not edges.
- **inbound ovm-map**
  - Same Related patch and preserves as above.
  - The L275 JSON `contextRefs` string is a renamed path (renamed at `ba7b62ace` to `proposals/...`) in a History file, so preserve is true.
  - The added edges at L301, L1067, L1070 and L1071 are correct preserves.
  - L1068 `agent-team-dispatch-and-herdr-stability.md` is correctly not an edge: the real file has a `-2026-08-27` suffix.
  - L976 and L1069 `step-00-team-dispatch-v1-overview.md` exist in neither tree, so they are correctly not edges.
  - `../../vocabulary/` (L52, L740) resolves to the live vocabulary directory via the wrapper provenance coordinates, so it is not an edge.
- **legacy/README.md**
  - My scan of every link and backticked token finds 13 retiring-only resolutions (L56, 65, 68, 99, 113, 116, 147-149, 163, 186, 256 plus L116's directory form). All are covered by edges, together with L208 `vision.md`.
  - Links that resolve natively to a live file are correctly excluded: `vision.md`, `intent-preservation-ledger.md`, `architecture/system-context.md`, `vocabulary/README.md` and the `proposals/` links.
  - The two inventory edges L9 and L222 are provenance, preserved.
  - L240 (the decision 0062 note) is a dated 2026-10-14 upstream snapshot passage, so preserve is right.
  - The patch, diff and unit all match.
- **subcomponents/README.md**
  - L18 preserves (see Lead question 1). L35 is a Provenance line, preserved, with a valid successor note to `history/documentation-migration/documentation-standardization-plan.md`.
  - The 19 table-row and Related-files edges (06463-06481) sit inside the literal `~~~~text` snapshot of a History file, so preserve is the correct disposition.
  - Rows share one unit per row and one disposition per unit, as required.
  - There are no missed references: the `../../host-invocation-routing/` and `../../packaging-distribution/` links are live, and the `plans/` paths are not legacy roots.
- **proposals/README.md and verification/README.md**
  - The Related patch is correct in both. The files are live candidate files, not carriage, and the diff hunk matches L17.
  - proposals L30 `docs/architect/agent-coordination/proposals/` sits under "Migration Status" as migration-origin lineage. Preserve is acceptable.
  - verification L31-47 are sibling-directory links that resolve to live candidate directories (all 17 exist and are non-empty at the pin). Preserve is correct. The `docs/architect/.../verification/<name>` mirrors are not being linked.
  - The `../../system-architecture/...` and `../../proposals/...` links in proposals resolve natively to live files, so they are not edges.

## Record-text notes (not rework)

1. **subcomponents 06463-06481 (19 edges) record a false target fact.**
   - The reason and targetFacts say "source path absent / never existed" for `docs/platform/agent-coordination/architect/agent-coordination/...`. That path is an artifact of resolving the snapshot's `../../../architect/...` links from the carrier directory.
   - The snapshot's own Provenance is `docs/platform/agent-coordination/subcomponents/README.md`. From that location the same links resolve to `docs/architect/agent-coordination/...`.
   - All 20 distinct targets exist at the pin (vision, system-context, contracts, ADR-002/003/008/009/011, work-integration, evidence-and-results, visibility-and-herdr, dispatch-control-plane, the two verification files, dag-request-scheduler, documentation-standardization-plan).
   - Disposition (preserve) and absence of any diff are unaffected. The reason should say "exists at author pin; tree retires at Phase 9; preserved as literal snapshot link" and drop the never-existed claim.
2. **Misquoted framing sentences.** The added edges in legacy/README (14 of them) and in the ovm-map file quote "Original source metadata and text follow" / "Full source text follows". Neither sentence exists in those files. The true framing is the `# Historical File` title, `Document type: History` and `## Literal Snapshot`. The preserve is correct.
3. **proposals 06514** quotes "This directory has been promoted from". The file says "This target directory preserves the proposal frontier from". Preserve is unaffected.
4. **legacy/README legacyScan exclusions** for `vision.md` (L46, 63, 109, 189, 246) say the link binds to `.../legacy/vision.md`, "a candidate/retained path". That file does not exist at the pin. The real native holder is `docs/platform/agent-coordination/vision.md`. The exclusion is correct, only the stated path is wrong.
5. **legacy/README L240** has the successor note `runner/spec.md`. The exact live holder of "decision 0062" is `docs/platform/runner/decisions/h-36d872fbb0e5.md`, heading `### 0062`. Preserve is unaffected.

## Lead-judgment questions

1. **"Superseded by: Current execution ownership in docs/specs/runner.md" (wrapper header) is preserved in 15 edges across the retired-engine wrappers.**
   - Four are in my part: 06281, 06378, 06417 and 06461 (the last reads "owners in").
   - The line is not Related and not Provenance, so L12-34(4) does not directly cover it. It is a present-tense "current owner" pointer to a path Phase 9 deletes.
   - Options: keep the preserve with a successor note, which is consistent set-wide, or patch or park it like the Related line.
   - Earlier reviewer p01 accepted this line as lineage.
2. **Snapshot-internal relative links resolve differently under wrapper provenance and source provenance.** The checker binds source-area coordinates only from the first Provenance block. In files/vocabulary and in the inbound ovm-map, snapshot links such as `../vision.md` and `../../vocabulary/` therefore resolve to live candidates and are not edges. Under the inner "Retained from docs/architect/..." provenance they would resolve to retiring files. I treated the checker's reading as correct, since it matches L12-34(5) (native first). Please confirm.

Status: DONE
Summary: All six files (73 edges) are ok with no outcome defects. The notes cover 19 subcomponents edges whose recorded target facts are false (disposition unaffected), a few misquoted framing sentences, and two judgment questions for the Lead.
