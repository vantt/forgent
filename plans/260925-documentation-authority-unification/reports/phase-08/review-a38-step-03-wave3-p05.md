# Step 3 wave 3 review, Part 05

Pin: ae141550c2e022310de7a0efea757580c0b2479f (worktree feeeeee92, read-only). Records: step-03-records/batch-061.jsonl. Checker and probes were not run.

## Method

- Loaded each record by `file` with Python and printed per-edge fields (edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency categories, targetFacts) plus `diff`, `checks.coverage` and the legacy-scan candidates. No full record line was printed.
- Read each pinned source with `git show <pin>:<path>` into scratch. The three files are 82 KB, 118 KB and 70 KB. I read the header and outline of each and the full text of every edge line and neighbouring line. I did not read every line of group-a and group-b in sequence.
- Whole-file scan of each source for legacy and path-like tokens (`docs/specs|architect|decisions|history|backlog`, `specs/`, `architect/`, `reading-map`, `system-overview`, `platform-foundations`, `index.md`, `README`, `.fgos`, `*.md`). I compared every hit to the edge spans and the legacy-scan exclusions.
- Span check: for all 84 edges, `sourceSpans.text` equals the source text at the stated line and column. Columns are 1-based. No mismatches.
- Hashes (sha256 prefix, from batch-061.jsonl):

| File | Record line | Digest (= inventoryFileDigest) | Diff |
|---|---|---|---|
| group-a | 1388c33dfde8bfcc | c5c67cdbf031fab5 | empty (e3b0c44298fc) |
| group-b | 82562830a82f3ba1 | 98b8c6afb863bf9a | empty (e3b0c44298fc) |
| group-c | 1d536954d1a4e0a9 | b70260067ae69bbd | empty (e3b0c44298fc) |

## Per-file verdicts

### docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md

- Set batch-061, stratum mandatory-threshold, verdict **ok**, 31/31 edges reviewed (maps-j-01714..01744).
- All 31 are `preserve`, with no diff and no target. The record carries no author-added edges, one-to-one coverage, and 5 legacy-scan candidates (bare `index.md` L44, `reading-map.md` L46 and L247, `system-overview.md` L46), all excluded as upstream basenames.
- The file is a mechanical extraction of the upstream bee skills. The header names the source ("Source snapshot: `/home/vantt/projects/forgentX/upstreams/bee/skills/` (bee v1.18.3)"). Every `docs/history/…`, `docs/specs/…`, `docs/backlog.md` and `docs/decisions/index.md` token is a path inside the bee repository quoted from SKILL.md text. L45 and L247 say outright that `docs/specs/` is a legacy compatibility surface in bee. Preserving them as upstream coordinates is correct under L12-10, L12-26(3,5) and L12-31.
- The preserve reasons state no target-existence fact and no successor. They do not say "retained" for the retiring `docs/specs/**` tokens. This matches L12-35(4) and L12-31(2).
- Units: L45 has 4 edges and L247 has 3, all preserve. L37, L40 and the other multi-edge lines are uniform. The only edge with a different reason is 01732 (see record-text notes).
- Missed references: none. The uncovered hits are bee-internal (`docs/knowledge/…`, `docs/09`, `docs/**`, `docs/`, `docs/spec/README/sample-only`). None is a retiring or legacy fgOS path.
- 01732 targetFacts (`docs/backlog.md` exists) is true: the file is in the pin tree.

### docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md

- Set batch-061, stratum mandatory-threshold, verdict **ok**, 44/44 edges reviewed (maps-j-01745..01788).
- All 44 are `preserve`, with no diff and no target. 3 legacy-scan candidates (`system-overview.md` L201 and L247, `reading-map.md` L201) are excluded.
- Same upstream-extraction framing. The header says "Source snapshot: `/home/vantt/projects/forgentX/upstreams/bee/skills/` (bee v1.18.3)".
- `docs/specs/doctrine-layer.md` (01749 L30, 01756 L174) is cited as "R17" of bee's own spec in bee-validating and bee-executing text. It is an upstream citation. The preserve is correct and I did not need to resolve it to an fgOS target.
- L197, L201, L219, L227, L228 and L243 describe bee's no-bundle `docs/specs/…` topology. These are quotations of upstream behaviour (L227 itself says "never write the image into the retired tree"), so preserve is right. The edge counts per line (L197 x4, L219 x2, L283 x3, and so on) match the source tokens.
- Bare "reading-map" and "system-overview" prose without `.md` (L198, L228, L246) are upstream prose, not path tokens, and are outside the legacy path-edge scope (L12-32(6)).
- Missed references: none.

### docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md

- Set batch-061, stratum mandatory-threshold, verdict **ok**, 9/9 edges reviewed (maps-j-01789..01797).
- All 9 are `preserve`, with no diff and no target. 2 legacy-scan candidates (`README.md` L10 and L314) are excluded because they are bee-herding's own README.
- The title and header name the source ("snapshot v1.18.3, 2026-07-28", "Source root: `/home/vantt/projects/forgentX/upstreams/bee/skills/`"). The tokens at L108, L113, L193, L200, L204, L205, L300 and L304 are all quoted bee SKILL.md text (bee-herding and bee-qualifying flow steps).
- Missed references: none. One non-path prose hit is noted below.

## Outcome defects (rework)

None. 84/84 edges reviewed and 84 judged correct (disposition preserve, no target, no anchor, no diff).

## Record-text notes (not rework)

1. 01732 (group-a L170) and 01777 (group-b L274) and 01792 (group-c L193) use a different reason from the other 81 edges. It says "Source path exists at author pin: docs/backlog.md; current retained path stays literal" and "dated learning-source/deep-dive citation and its dated comparison context". Both quote a truncated bullet that stops mid-sentence ("the backlog row is th'" in 01732, "(no `behavior_change` " in 01777). Their targetFacts say `exists`. The facts are true. The wording is a different template from the sibling `docs/backlog.md` edges (01724, 01731, 01734, 01770, 01781, 01791, 01794, 01795), which use the upstream-coordinate reason. This is only an inconsistency in prose, and the disposition is the same.
2. group-c L193: "related code/docs/specs" at column 83 is the prose list "code, docs, specs", not a path. It is not an edge and not in the exclusions. This is harmless. A scan exclusion for it would only tidy the record.
3. Unit ids are per line (`item-L45` and so on) and not per list item. This is advisory under L12-35(1), and every edge in a computed unit shares one disposition.

## Lead-judgment questions

None. No new Lead-ruling gaps. Preserving upstream bee coordinates, including the retiring-tree `docs/specs/…` tokens, follows L12-10, L12-26(3,5) and L12-31 as already ruled for distillery upstream sources.

## Counts

| Set | Stratum | Reviewed files | Rework |
|---|---|---|---|
| batch-061 | mandatory-threshold | 3 (this part) | 0 |
| batch-061 | patched | 0 | 0 |
| batch-061 | unpatched-seeded | 0 (this part) | 0 |

Edges reviewed in this part: 84 (31 + 44 + 9), outcome defects 0.
