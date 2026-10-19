# Step 3 wave 3 expansion review, Part 06

Pin ae141550c. Records: batch-061 (full-set-expansion). 6 files, 11 edges. Every file was read via git grep/sed at the pin (largest herdr.md is 60 KB: full pattern scans plus every edge region and all relative-path/legacy-root/retiring-basename hits; the other files fully scanned). No checker or probe was run.

## Per-file verdicts

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/distillery/sources/claudekit-engineer.md | batch-061 | full-set-expansion | 0 | ok |
| docs/distillery/sources/compound-engineering-plugin.md | batch-061 | full-set-expansion | 6 | ok |
| docs/distillery/sources/council-of-high-intelligence.md | batch-061 | full-set-expansion | 1 | ok |
| docs/distillery/sources/herdr.md | batch-061 | full-set-expansion | 4 | ok |
| docs/distillery/sources/learn-harness-engineering.md | batch-061 | full-set-expansion | 0 | ok |
| docs/distillery/sources/marketing-cockpit.md | batch-061 | full-set-expansion | 0 | ok |

Counts: batch-061 / full-set-expansion: 6 reviewed, 0 rework. Edges reviewed 11 (all preserve), diffs empty everywhere, no authorAddedEdges.

## Zero-edge files (missed-reference check)
- claudekit-engineer, marketing-cockpit, learn-harness-engineering: no `docs/specs`, `docs/architect`, `specs/<x>.md`, `architect/<x>.md`, no markdown links, no relative `./` / `../` paths. A basename scan against all 627 file names under docs/specs and docs/architect (excluding README/SKILL/AGENTS/CLAUDE) hit only `index.md` inside the upstream pattern `docs/{topic}/index.md` and `hydration-workflow.md`/`workflow.md` as a substring of an upstream reference path; both are upstream coordinates, not forgent legacy references. The `docs/research/*`, `docs/02-design/*`, `docs/_agents/*` mentions are upstream repo paths. learn-harness-engineering is a 12-line unanalysed stub. Zero edges is correct.

## Edge review
- 01870, 01871, 01872, 01873, 01874 (compound-engineering-plugin L58, L59, L64, L65 x2): `docs/specs/codex.md`, `docs/specs/<platform>.md`, `docs/specs/`, `docs/specs/claude-code.md`, `docs/specs/opencode.md` are the upstream plugin repo's own spec paths (the "Where" lines and "spec là INPUT của converter" prose), not fgOS references. Preserve is correct; same-unit L65 edges share disposition.
- 01875 (L66): "cùng vai với docs/specs/ của forgent" is a dated distillery analysis comparison naming fgOS's tree. Preserve is the accepted-as-authored case (L12-38(7), 01875/01841); no description is made false by leaving it. ok.
- 01876 (council L118 `./.council.yaml`): upstream skill's project-level override file; preserve correct.
- 01877 (herdr L13): retained docs/distillery/reports path exists at the pin; retained-path preserve per L12-26 class 3. ok.
- 01878, 01879, 01880 (herdr L443, L446): `../herdr`, `../herdr-worktrees/<task-slug>`, `<slug>` are upstream maintainer checkout layout examples; preserve correct.

Legacy scan candidates (README.md tokens: council L21/L82/L127, compound L49, herdr L215/L366) are upstream README/bare-name mentions inside dated carriage; the exclusion under L12-38(5) is correct (not links, not explicit legacy-root forms). Other non-edge relative strings, `../../etc/passwd` and `../../` (compound L34), are an upstream path-traversal example, resolve to nothing legacy, correctly not edges.

## Outcome defects
None.

## Record-text notes (not rework)
- 01876 and 01878 reasons state "Source path never existed in author-pin ancestry: docs/distillery/sources/.council.yaml" / "docs/distillery/herdr", resolving upstream-relative strings against the consumer's directory. True but beside the point; the real reason is that they are upstream project/maintainer-layout coordinates. Harmless.
- 01870-01874 carry no `targetFacts` and no existence claim; consistent with the carriage-wording rule.

## Lead-judgment questions
None.

Status: DONE
