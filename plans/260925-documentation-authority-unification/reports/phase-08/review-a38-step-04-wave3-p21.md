# Review a38 — Step 4 wave 3, part 21 (set step04-025)

Pin dc24ce645. Read-only. Payload step-04-wave3-p21.json. Sources read whole (merge.mjs 1778 lines, the three small promote/work-compat files whole; worktree.mjs source streamed here, its record belongs to p22 and was reviewed from step04-025.jsonl).

## Per file

| path | set | stratum | verdict | slots |
|---|---|---|---|---|
| src/runner/merge.mjs | step04-025 | A | ok | 19 slots (1 parked, 5 patch entries over 4 distinct references incl. dup 000307 pair, 12 preserve incl. wrapped 215-216) + 12 Step 5 exclusions |
| src/runner/promote-engine.mjs | step04-025 | B | ok | 1 (preserve) |
| src/runner/promote-preflight.mjs | step04-025 | B | ok | 2 (preserve) |
| src/runner/work-compat.mjs | step04-025 | B | ok | 2 entries for 1 wrapped ref (preserve) |
| src/runner/worktree.mjs | step04-025 | A | ok (record is p22's; source read here, 12 slots checked) | 12 (2 patch, 10 preserve) + 2 Step 5 exclusions |

## merge.mjs details
- Never-existed see-pointer park (class6-l-000293, line 17 `docs/history/pr-lifecycle/reports/validation-s1-gate.md`): ok. `git log --all --diff-filter=AD -- docs/history/pr-lifecycle` returns nothing, so the path never existed; the only other citations are the retiring docs/specs/runner.md:422 and its derivative docs/platform/runner/operations/h-51f5cd7279fd.md:330, which repeat the same dead pointer. Passage-content search for the spike proof (`--no-commit --no-ff`, `nocommit-probe`, `merge-abort-probe`) finds only command mentions in unrelated knowledge docs and the h-51f5 derivative; none holds the spike evidence. Park with own-passage quote is correct.
- Wrapped slot lines 215-216 (`docs/` + `architect/doing-coordination-redesign.md`, edgeId null): ok. Preserve as design-origin provenance (tsk-40m), consistent with L12-62 ruling 2 and the sibling slot 000316 (line 1243). Both halves are covered by one slot.
- Six-precedent scope (000307, lines 676-677 wrapped): ok. Target is the whole fix-fgos-write-rejected-merge-block.md with no anchor; the doc contains all six named precedents as example sections (n4i-1 under "real before/after", 5vf, 4eu, 5ge, 28o, 3v2; 53n is a seventh and not cited by the source). A single-example anchor would have dropped five, so no-anchor is right. The diff rewraps the replacement across the original line break (`how-` / `to-fix-...`); remains a comment.
- 000294 anchor `before-you-start` exists (L18) and its text (independent next-free ids, same-position collision) matches the comment. 000313 anchor example-tsk-3v2-... exists (L339) and the passage describes restoring paths to the target branch's own frozen versions, matching the comment. 000317 anchor the-fix-a-separate-lockroot-parameter exists ("The fix — a separate `lockRoot` parameter", L47) and explains the lockRoot/repoRoot split, matching.
- Behavior: all 5 diff hunks (lines 393, 676-677, 927, 1366) edit only `//` or ` * ` comment text; the tail-of-hunk code context is unchanged. No behavior change. Runtime strings (408, 409, 536, 562, 565, 638, 640, 996) are correctly Step 5 excluded. All docs/ occurrences in the file (grep) are accounted for; bare `CONTEXT.md` mentions are not edges.
- Preserved slots (decisions/0000-index.md x7 with successor note docs/decisions/index.md, decisions/index.md x3, backlog.md, history/tsk-516, history/merge-verify-only-false-done, architect/...): all preserve literals; history dirs exist at pin (L12-10 conventions).

## Small files
promote-engine.mjs:2, promote-preflight.mjs:3 and :56, work-compat.mjs:136-137 (wrapped, listed twice) point at docs/history/promote-to-component/* and docs/history/tsk-3xd-decompose-child-directive-prose/*, which exist at the pin; named history evidence, preserve correct. Empty diffs. No missed references (grep of all docs/*.md patterns in the three files and paths.mjs; paths.mjs is in the set record and has only `docs/history/<feature>/` convention text).

## worktree.mjs details (source read here)
- 000328 (line 756) patch to docs/platform/git/spec.md#7-hardened-git-backend-parsers-and-hook-contract: heading `## 7. Hardened Git backend, parsers and hook contract` slug matches; §7 L315 contains literal "No hardcoded trunk"; G-018/G-044 (createBranchRef from detected trunk) in Appendix A. Correct current owner; comment-only.
- 000332 (line 1051) patch to safely-reset-the-main-checkout.md#before-you-start: anchor exists (L17), content matches the "full status before reset" discipline. Comment-only.
- Other slots: history-dir preserves and wrapped refs (991-992, 1121-1122, 1392-1393, 1404-1405, 1479-1480) preserve; 926 `docs/decisions/0022` preserve with a successor note; 1088 runtime string Step 5.

## Outcome defects
None. Rework count 0.

## Record-text notes (not rework)
- Anchors in patches use the repo extractor slug (single hyphen across the em dash, e.g. `the-fix-a-separate-lockroot-parameter`); GitHub's native slug would be `the-fix--a-separate-...`. This is the repo's accepted convention (slugText/githubSlugText both collapse whitespace) and consistent with prior waves.
- 000293 reason text repeats "L12-62: L12-62:" (cosmetic).

## Lead-judgment questions
None.

## Counts
step04-025, stratum A: merge.mjs, worktree.mjs reviewed 2 / rework 0. Stratum B: promote-engine, promote-preflight, work-compat reviewed 3 / rework 0. Total 5 / 0.

Status: DONE
