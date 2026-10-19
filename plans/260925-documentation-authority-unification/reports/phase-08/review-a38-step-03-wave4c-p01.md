# Step 3 wave 4c, Part 01 review

Pin ae141550c. 6 files, 30 edges. No checker or probe run. Anchors were recomputed with the pinned `listAnchors` through a scratch wrapper. Source, targets, diffs, exclusions and search groups were read for every file.

## Verdicts

| # | File | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/distillery/porting-log.md | batch-061 | Part-A-outcome-change | 13 (11 inventory + 2 author-added) | ok |
| 2 | docs/knowledge/a-decision-doc-can-be-superseded-twice-.../...-becomes-a-list.md | batch-070 | Part-A-outcome-change | 10 (8 + 2 added) | ok |
| 3 | docs/knowledge/fgos-sync-root-s-real-guards-and-outcome-shape/fgos-sync-root-outcome-shape.md | batch-071 | patched-seeded | 1 | ok |
| 4 | docs/knowledge/fgos-version-cli-verb-output-shape-.../fgos-version-verb-output-fields.md | batch-071 | unpatched-seeded | 1 | ok |
| 5 | docs/knowledge/how-fgos-s-event-log-is-allowed-to-evolve-.../event-log-evolution-discipline.md | batch-071 | Part-A-outcome-change | 2 (1 + 1 added) | ok |
| 6 | docs/knowledge/how-to-add-a-drift-guard-for-cli-registry-help-prose/add-a-drift-guard-for-cli-registry-help-prose.md | batch-071 | Part-A-outcome-change | 3 | ok |

## Outcome defects

None. Every edge disposition, target, anchor and diff is correct.

Per-file evidence:

1. **porting-log.md**
   - Preserves 01694 to 01698 and 01700: the paths exist at the pin (or are `./repo`, a topology token). 01698 and 01697 name removed or never-existing paths with no live holder, so they carry no successor note. I confirmed that no holder exists: commit e99998633 untracked the workshop tree, and `validation-s1-gate.md` appears only in carriage and in `src/runner/merge.mjs`.
   - 01699 patches 0020 to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập`. The anchor equals the `listAnchors` output for the `### 0020 — Chặn .fgos/ ...` heading at L102. The row's description ("no symlink, no copy; narrow scope settled, broad axis still candidate") matches the 0020 Decision text. The diff is that single hunk and nothing else.
   - 01701 preserves a dated "Superseded by (2026-07-28)" marker with a number-and-title-matched note: 0021 "Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence". That is correct per L12-39(3).
   - 01702 and the two added edges (L129 col 650 and col 803) park as description-rewrite. The live row's Đích column and its "hiện tại của fgOS" comparison name the deleted manual `0000-index.md`. The removed state and commit 4722361ae are correct.
   - 01703 preserves beehive's upstream `docs/decisions/index.md` coordinate. The distinct claim is real: the clause contrasts it with fgOS's hand-written index. The retained generated index is Step 5.
   - 01704 parks `docs/specs/` as a proposed destination (description-rewrite). That is correct per L12-38(6) and L12-30(1).
   - My own scan found no missed legacy reference in the file. `specs/CONTEXT.md` in L130 is a slash list; the `deep-dives/` and `../../plans/reports/` links are not legacy. The legacyScan candidates (two) match the two added edges one to one.
2. **superseded-twice**
   - 04117 preserves the elided `docs/decisions/0026-...md` in past-tense narrative with a title-matched note: `h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity`. The 0026 heading at L583 matches the removed file's title.
   - 04118, 04120 and 04122 preserve `docs/history/tsk-55h/CONTEXT.md` inside blockquoted captured text. The path exists at the pin.
   - 04119, 04121 and 04124 preserve narrative or illustrative `docs/decisions/` forms in prose. The L134 `NNNN-*.md` is an illustrative pattern. The same-unit "distinct claim" for 04124 is genuine (a past `ls` command versus the Related link).
   - 04123 patches the Related entry to the docs/knowledge how-to at `#why-this-exists`. The target exists at the pin and the anchor equals the `listAnchors` output at L85. The section says next-free-integer IDs have no cross-branch coordination, which matches the source description. The 0029 example is untouched.
   - The added edges at L108 and L122 preserve `0000-index.md` as completed checker-output and fix evidence, with the note `docs/decisions/index.md`. That is correct per L12-40(1) and the digest ("completed past actions"). The legacy scan covers both.
3. **sync-root-outcome-shape**
   - 04258 patches the `docs/explanation/why-merge-next-auto-syncs-blockedonsync-roots.md` citation to its docs/knowledge holder `#implementation-commit-363c615`.
   - That section is where tsk-66t adds the no-parent dirty-tree refusal. It reports `blocked: 'dirty-tree'`, and the source adjacent text says the same. The anchor is correct.
   - There are no other legacy references.
4. **fgos-version-verb-output-fields**
   - 04259 preserves `docs/history/fgos-global-install-stage-verb-skew/plan.md`. The path exists at the pin, so the preserve is correct. The empty diff is correct, and there are no other references.
5. **event-log-evolution-discipline**
   - 04293 preserves a removed-path Source attribution (`docs/history/learnings/critical-patterns.md`) with no holder.
   - The added 0001 edge parks as dead-link: deleted `0001-event-log-la-su-that.md`, a basename scan hit, with a title-search witness and category `partial-holder`. This follows L12-39(7) and L12-38 on removed ids and dead links. See Lead question 1.
6. **add-a-drift-guard-for-cli-registry-help-prose**
   - 04295 to 04297 preserve the old `docs/how-to/...` spelling at L123, L125 and L133. All three sit inside the explicit `## Document history (compound-learn capture linkage)` heading at L120, including the quoted `work.outcome` JSON. L12-39(6) and L12-40(1) cover them.

## Record-text notes (not rework)

- 01694 and 01695 (and 01696 to 01698) use the boilerplate "dated learning-source/deep-dive citation and its dated comparison context". That is inaccurate for L3 (a live intro line), L12 and L13 (live table rows). The disposition is right; only the wording is loose.
- 01699's reason text is accurate. Its preface cites L12-26 and L12-30 labels, which is harmless.
- The 0001 edge's reason says existing discussions are "principles or incidental citations". `docs/specs/platform-foundations.md` L103 does hold a heading `### 0001 — Nhật ký sự kiện là sự thật; store/DB là bản chiếu dựng lại được`, in the retiring tree. The reason could say so; the searchWitness already records a `partial-holder` hit group.

## Lead-judgment questions

1. **Category for the 0001 park (event-log edge).** The only title-matched holder of 0001 is the retiring `docs/specs/platform-foundations.md` L103. `docs/platform/platform-foundations.md` has L1 and L3 laws but no 0001 narrative heading.
   - L12-39(1) maps 0035 to "platform-foundations narrative / GAP-02". By analogy this 0001 park could be GAP-02 rather than dead-link.
   - L12-39(7) explicitly ruled dead-link unless a title-search holder is found, and the author searched. I treat it as acceptable as authored.
   - The category choice is the Lead's call.
2. The three open lead-ruling edges (04320, 04345, 04353) are not in this part. Nothing in these six files is a lead-ruling park.

## Counts

| Set | Files in Part 01 | Reviewed | Rework | Strata |
|---|---:|---:|---:|---|
| batch-061 | 1 | 1 | 0 | Part-A-outcome-change 1/0 |
| batch-070 | 1 | 1 | 0 | Part-A-outcome-change 1/0 |
| batch-071 | 4 | 4 | 0 | patched-seeded 1/0, unpatched-seeded 1/0, Part-A-outcome-change 2/0 |

- Total: 6 files and 30 edges reviewed, 0 rework.
- No file appears in two strata within this part. The seeded counts for batch-071 (patched 1, unpatched 1) are the Part 01 share of the frozen set denominators. Part 02 holds the rest.

Status: DONE
Summary: All 6 files and 30 edges in Part 01 are ok, with 0 outcome defects. Anchors were verified against `listAnchors`, and the targets and headings were read at the pin. Only record-text wording notes and one Lead question about the 0001 park category (dead-link versus GAP-02) remain.
