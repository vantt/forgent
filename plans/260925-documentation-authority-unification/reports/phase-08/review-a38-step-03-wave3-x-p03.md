# Review a38 step-03 wave3 expansion, Part 03

Pin ae141550c. Worktree 5a4ca0621. Set batch-061, stratum full-set-expansion. Records read per edge; sources read whole or by full legacy-token scan (porting-log, inventory, both deep-dives scanned line by line for every path/link token; work-item-management 72 KB: all 46 edge lines plus every non-edge token line read). No step-03 check/probe scripts run. Read-only helper used: listAnchors from the worktree to confirm the extractor anchor of the 0020/0021 headings.

## Per-file verdicts

| File | Edges | Verdict |
|---|---:|---|
| docs/distillery/deep-dives/work-item-management.md | 46 | ok |
| docs/distillery/deep-dives/work-item-schema-and-io-contracts.md | 5 | ok |
| docs/distillery/intake.md | 0 | ok |
| docs/distillery/porting-log.md | 11 | ok (one Lead-judgment question, Q1) |
| docs/distillery/reports/distill-bee-inventory-2026-07-18.md | 9 | ok on outcome; one false record-text reason (note N1) |

### work-item-management.md (46 edges, empty diff)
All 46 are Markdown links `../sources/{beads,beads-rust,beads-viewer-rust,repository-harness}.md#anchor` in a dated deep-dive. Every source file exists at the pin (targetFacts state exists). Preserve is right (retained distillery tree). Every matched expression matches its source span. Full-file token scan: the non-edge tokens are sibling retained deep-dives (`state.md`, `routing.md`), `docs/plans/active|completed/` (not a legacy root), `PHASE-N.md`, a bare `AGENTS.md`, and bare decision numbers (0019/0020/0022). None is an edge by L12-38(5/7). Legacy scan has 0 candidates; none missed.

### work-item-schema-and-io-contracts.md (5 edges, empty diff)
Five links into retained `sources/beads*.md` and `sources/repository-harness.md` (all exist). Preserve is right. Other tokens: `plans/reports/...` (retained), sibling deep-dives, `engdocs/COLLISION_MATH.md` (upstream), bare decision 0022. No missed reference.

### intake.md (0 edges)
509 bytes. The only path-like text is the placeholder `sources/<name>.md` (relative to the retained distillery root). Zero edges and an empty scan are correct.

### porting-log.md (11 edges; one-line diff at L105)
- 01694, 01695: retained `docs/distillery/...` paths, exist. Preserve ok.
- 01696: `docs/history/pi-executor-runtime-capacity/RESEARCH.md` exists, and docs/history stays a retained history root per plan.md L86. Preserve ok.
- 01697: `docs/history/pr-lifecycle/reports/validation-s1-gate.md` never existed. It is quoted from a source-code comment inside a dated "Sửa 2026-08-05" correction, and no holder exists (searched tree at the pin). Preserve ok.
- 01699 (patch, Phase 9): the target `docs/platform/runner/decisions/h-36d872fbb0e5.md` is a valid decision record (the same record L12-26 names for 0062). The anchor `0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập` is the exact extractor anchor of "### 0020 — Chặn `.fgos/` khỏi worktree worker" (confirmed with listAnchors; the plain backticked citation correctly uses the extractor anchor, not the GitHub slug with the double hyphen). The adjacent description "(chặn-cây: không symlink, không copy)" matches the target's decision. The diff changes only that path, and the label form is kept. The undated "xem ..." citation in a live candidate row is navigation, so patch is right under L12-38(1). Ok.
- 01700: `./repo` is a workshop-topology token and not a doc path. Preserve ok (the edge is superfluous but harmless).
- 01701: dated "Superseded by ... (2026-07-28)" in a rejected row. Preserve with a non-executable successor note to `h-36d872fbb0e5.md#0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence`; the anchor equals the extractor anchor of the 0021 heading. Removal fact (4722361ae, no rename) recorded. Meets L12-38(3). Ok.
- 01702 (parked, description-rewrite): Đích column names the removed hand-maintained `docs/decisions/0000-index.md` while the comparison describes a generated index. Category equals blockedCategory equals dependencyCategory. Meets L12-38(3). The unit-level distinct-claim exception to 01703 is true (01703 is beehive's upstream index, 01702 is fgOS's removed file). Ok.
- 01703: preserve of beehive's upstream generated `docs/decisions/index.md` coordinate. Ok.
- 01704 (parked, description-rewrite): proposes a new `docs/specs/` note as a port destination in a live candidate row. Ok.
- Scan for missed references: other path-like tokens are `docs/plans/completed/...`, `docs/research/...`, relative `../../plans/reports/...` links, `specs/learnings/distillery-index` (category list), `knowledge/memory` (concept), and bare decision numbers. None is a legacy-root path or link target.

### distill-bee-inventory-2026-07-18.md (9 edges, empty diff)
- 01706 to 01713 (`docs/history/<feature>/...`, `docs/backlog.md`, `docs/specs/<area>.md`, `docs/history/learnings/YYYYMMDD-<slug>.md`, `docs/history/research/<topic-slug>.md`): each quotes the upstream bee skills' own output paths inside the extraction description (verified at lines 37, 42, 47, 136, 145, 155, 245, 260). Preserve and the "upstream coordinates" reason are true. Ok.
- 01705 (L5, `docs/distillery/sources/bee.md`): preserve is right, because this is a dated extraction report (history). The reason is false (see N1).

## Outcome defects
None.

## Record-text notes (not rework)
- N1 maps-j-01705 (inventory, L5): the reason says "upstream source coordinates, not fgOS documentation ownership". That is false. `docs/distillery/sources/bee.md` was an fgOS distillery file, added at 456f62866 and deleted at dd4816c0f ("merge bee.md and beegog.md into beehive.md", plain deletion, no rename). The sentence names it as "the distillery source". Correct the reason to the true target state (removed at dd4816c0f, no same-commit rename), add `targetFacts` with state removed and that commit, and add the record-only successor note `docs/distillery/sources/beehive.md` (exists at the pin). The disposition (preserve) and the empty diff stay unchanged. L12-32 and L12-34(8) require true history facts, and the checker does not detect this because targetFacts are absent.
- N2 maps-j-01694 to 01698 and 01701 (porting-log): the reasons say "dated learning-source/deep-dive citation", which is generic boilerplate. It is acceptable, but for the live candidate rows 01694 to 01696 it would be truer to say "retained path". Cosmetic only.

## Lead-judgment questions
- Q1 maps-j-01698 (porting-log L93, candidate row): `docs/history/learnings` names a directory with no tracked descendants. Its last child, `20260714-phase-1-review-fixes.md`, was removed at e9999863 with no rename. The row is a live candidate row ("tầng compound-learning của forgent (bee-compounding + docs/history/learnings)") and not a dated "Sửa" note. The edge is preserved with the removal fact but no successor note. Under L12-26(2) removed docs/history targets get a record-only note, and L12-30(5) says live navigation to a dead target parks. Options: (a) keep preserve, which is defensible because this is a conceptual layer label in a row that is not navigation; (b) park as dead-link with no successor. I judge (a) acceptable and did not count it as rework.
- Q2 maps-j-01701 versus 01699: both cite removed decision files, but 0020 ("xem ...", undated) is patched and 0021 ("Superseded by ... (2026-07-28)", dated) is preserved with a successor note. This is consistent with L12-38(1) (dated is history, undated is navigation); I flag it only so the Lead confirms the dated-in-a-live-row reading.
- Minor: porting-log L130 contains the list "skills/specs/CONTEXT.md" (skills, specs, CONTEXT.md). Lexically it looks like a partial `specs/<name>.md`, but it is an enumeration, not a path. The checker has 0 candidates; I agree it is not a reference.

## Counts
- batch-061, full-set-expansion: 5 files reviewed, 0 rework (0%). 71 edges reviewed (46 + 5 + 0 + 11 + 9), 0 outcome defects, 1 record-text defect (N1), 1 note on boilerplate wording (N2), 2 Lead-judgment questions.
