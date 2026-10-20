# Step 3 wave 5e, part p02 review (a38)

Pin ae141550c. All six files are in batch-087. Each was read whole at the pin, with every edge, the full diff, and my own scan of each source for legacy references (`docs/specs`, `docs/architect`, relative links, bare names). I did not run the checker or any probe.

Edge counts match the index: 14 + 6 + 9 + 11 + 32 + 4 = 76. Every inventory edge id is covered by a record edge, and no inventory edge is missing.

## Per file

| # | Path (under docs/platform/agent-coordination/history/) | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | proposals-redesigns/group-thinking-plan-loop.md | batch-087 | unpatched-seeded | 14 | ok |
| 2 | retired-engine/files/architecture/coordination-continuation-recovery.md | batch-087 | patched-seeded | 6 | ok |
| 3 | retired-engine/files/architecture/runtime-model.md | batch-087 | patched-seeded | 9 | ok |
| 4 | retired-engine/files/contracts/assignment-run-runresult.md | batch-087 | patched-seeded | 11 | ok |
| 5 | retired-engine/files/contracts/coordination-session.md | batch-087 | mandatory-threshold | 32 | ok |
| 6 | retired-engine/files/decisions/ADR-004-reserve-job.md | batch-087 | patched-seeded | 4 | ok |

### Files 2-6 (retired-engine wrappers)

All five share one pattern. Every non-self edge is correct under the rules below.

- **Related entry (line 17).** `docs/specs/runner.md` is patched to `docs/platform/runner/spec.md` at Phase 9. This is correct under L12-34(4), because a wrapper's Related list is live navigation and the retiring target gets its live holder.
  - The diff is exactly that one hunk.
  - The Related list does not already contain the holder, and the target is not the consumer itself.
  - The adjacent text is a bare path list, so no description goes stale.
  - The runner spec exists at the pin.
- **Superseded-by (line 19).** Preserved with the successor note `docs/platform/runner/spec.md`. This is correct under L12-35(3): the file declares `Document type: History`, and the reason quotes that header.
- **CoordinationSession retirement sentence (line 23).** Preserved with the successor note `docs/platform/runner/decisions/h-aabefc85f0c9.md`. This matches L12-37 and L12-35(3). The note target exists at the pin.
- **Literal Snapshot edges.** Preserved, citing "inside literal carriage" and quoting the declaration `## Literal Snapshot`. These are the legacy-root Provenance line, in-file anchors, relative links and verification paths. They state no existence facts and carry no successor notes, as L12-35(3-5) requires.

### File 5 (coordination-session.md) scan detail

I ran my own scan over all 1,200+ lines: every `](...)` link, every `docs/(specs|architect)` path, and every partial `specs/` or `architect/` form.

- All 32 edges are accounted for. Three are the line 17/19/23 pointers. The other 29 are carriage preserves, including the nine in-file `#anchor` links (L231-236 and the like) and the `../../../architect/proposals/...` link at L256.
- Bare names (`P10-KERNEL-FIX.md`, `phase-10-...md`, `synthesis.md`) and `plans/...` paths are outside the L12-38 coverage scope for carriage, so they are rightly not edges.

### File 1 (group-thinking-plan-loop.md)

- L9 Provenance preserves, citing L12-47 (lineage input identity).
- L17 Related names the file's own original source, `docs/architect/proposals/group-thinking-plan-loop.md`, whose only surviving holder is this carrier. It parks as description-rewrite, with a legitimate category and reason. This matches L12-34(4), which parks a self or carriage-only holder. The witness is citation-only with counts of 2 and 2.
- L24 ("Source relationship") and the L48-53 Related links to legacy-root siblings preserve. The Added-in-candidate sentence frames everything after it as original source text, and the reason quotes that declaration. The how-to targets are retained paths. The L87, L123, L131, L135 and L143 references are inside that carriage and preserve. Bare references such as `runner.md:1279`, `master-coordinator.md` and `phase-02-...md` are exempt.
- There is no diff, which is right for an all-preserve plus park file.

## Outcome defects

None.

## Record-text notes (not rework)

- File 1, edge 05711 (L24) and the L48-53 edges: the quoted "declaration" is a long Added-in-candidate sentence. The checker accepts it. A reader may find the framing weaker than a heading such as `## Literal Snapshot`, since there is no explicit carriage heading in this file. The outcome is still preserve, which is correct for a History-typed snapshot.
- File 1, edge 05710: the reason text appends "Source path exists at author pin ... tree retires at Phase 9" after a description-rewrite explanation. It is harmless.

## Lead-judgment questions

- File 1, L17: the same-shape self-Related entry in a History wrapper is parked rather than patched or preserved. L12-34(4) supports parking. This is the only parked edge in the part. Please confirm it fits the set-wide convention on how self-Related pointers in History wrappers are handled.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-087 patched stratum (files 2, 3, 4, 6 patched-seeded, plus 5 mandatory) | 5 files / 62 edges | 0 |
| batch-087 unpatched stratum (file 1) | 1 file / 14 edges | 0 |
| Part total | 6 files / 76 edges | 0 |

Status: DONE
Summary: All 6 files (76 edges) in batch-087 are ok, with no outcome defects and 0 rework. One Lead-judgment question is raised on the parked self-Related edge in group-thinking-plan-loop.md.
