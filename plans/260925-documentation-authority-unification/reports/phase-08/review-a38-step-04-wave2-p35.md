# Review a38 — Step 4 wave 2, part 35 (set step04-025, runner comments)

Pin dc24ce645. Payload `step-04-wave2-p35.json`. All 31 joined slots reviewed, 3 files. Read method: pinned source for the three files grepped for every `docs/`, `.md`, ADR and plan reference plus a wrapped-path scan; each edge region and each diff hunk read in context; the five patch targets read at the pin. Large files were not read line-by-line to EOF. merge.mjs and worktree.mjs were read by outline plus every edge region and every reference hit. I did not run any step-03/04 script.

Counts: set step04-025 reviewed 3, outcome rework 2 (merge.mjs, worktree.mjs). paths.mjs ok.
Slots: merge.mjs 18 (17 distinct edge ids; class6-l-000307 is a two-line wrapped path held as two physical slots), paths.mjs 1, worktree.mjs 12 (class6-l-000338 is two physical slots).
Dispositions seen: preserve 23, patch 5 (4 patch slots in merge.mjs, counting 000307 twice, plus 1 in worktree.mjs), parked 1. Step 5 exclusions: 9 in merge.mjs and 1 in worktree.mjs. All checked and correct; they are runtime strings or code constants.

## src/runner/merge.mjs — verdict: rework

OUTCOME defects

1. **Wrong disposition — class6-l-000293, source line 17.**
   - Source: `// MERGE MECHANICS (spike-proven, .bee/spikes/pr-lifecycle, see` / `// docs/history/pr-lifecycle/reports/validation-s1-gate.md): \`git merge`.
   - The record preserves it as "External-project history convention or named history evidence stays literal".
   - Fact at the pin: `docs/history/pr-lifecycle/` does not exist. `git ls-tree dc24ce645 docs/history/pr-lifecycle` is empty, no path anywhere is named `validation-s1-gate`, and `git log --all -- docs/history/pr-lifecycle` is empty. The path never existed in git history.
   - Rule: owner-answers L12-60 / L314 and L327. A present-tense "see X" pointer to a never-existing path parks as a dead link, and a preserve or park reason must state the true target state. There is no dated past-action marker, so the example/history exception does not apply.
   - Correction: disposition `parked`, blockedCategory dead-link, reason "target never existed in git history". The other history preserves in this part (tsk-516, merge-verify-only-false-done, and all of worktree.mjs) exist at the pin and are correct.

2. **Missed reference — merge.mjs lines 215-216.**
   - Source: `* Resolve the pull-door take/return head pair for \`item\` — tsk-40m (docs/` newline `* architect/doing-coordination-redesign.md): \`headAtTake\`...`.
   - It is a wrapped path (`docs/` at the end of line 215, `architect/...` on 216, a ` * ` prefix). It has no slot. It is not in the census (class6 has no edge near line 215) and not in the sweep deadPathScan. The same path at line 1243 is slotted as class6-l-000316.
   - Rule: L12-60 "wrapped dead paths". The path exists at the pin (`docs/architect/doing-coordination-redesign.md`), so it is not a dead link.
   - Correction: add a slot for this path. The line-1243 outcome is the natural precedent (preserve as original implementation evidence, retiring tree, no current-authority acceptance), unless the Lead finds a live holder. This is also a checker and census population gap: wrapped paths with a ` * ` comment prefix after the line break are not joined.

3. **Anchor too narrow — class6-l-000307 (two physical slots), source lines 676-677.**
   - Source: "Cross-checked against `docs/how-to/fix-fgos-` / `write-rejected-merge-block.md`'s own documented precedent (tsk-n4i-1/tsk-5vf/tsk-4eu/tsk-5ge/tsk-28o/tsk-3v2 -- six independent real occurrences ...)".
   - The patch anchors only `#example-tsk-3v2-the-block-triggers-from-merging-main-in-not-from-your-own-commit` (target line 339), a section about one of the six precedents. The claim cited is the set of six occurrences. They sit in separate sections: tsk-n4i-1 at lines 119-139, tsk-5vf at 140, tsk-4eu at 188, tsk-5ge at 223, tsk-28o at 259, tsk-3v2 at 339.
   - Rule: L12-30/31/32 and the passage-must-contain-the-cited-claim rule. A reader following the patched pointer lands on one precedent and loses the other five.
   - Correction: target the same file with no anchor (whole document), or anchor on a section that carries the full set. After the fix the patched comment text still reads correctly as "documented precedent (...six...)".

Checked, no defect

- class6-l-000294 (line 393) patches to `docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md#before-you-start`. The target exists and the anchor resolves. The section (lines 18-27) holds both "next free" id independence and "content-agnostic conflict", matching the comment's "content-agnostic conflict shape".
- class6-l-000313 (line 927) anchors the tsk-3v2 example. It describes restoring the target branch's own frozen pre-merge `.fgos/` versions, which matches the comment's "documented recovery ... restoring .fgos/ paths to the branch's own frozen pre-merge versions". Accept.
- class6-l-000317 (line 1366) anchors `#the-fix-a-separate-lockroot-parameter`. The target section (line 47) contains the code comment that worktrees strip `.fgos/` (ADR0020) and that `lockRoot` stays the real checkout. Accept.
- Preserves hold, with the reason-text notes below: `docs/decisions/index.md` (live generated projection), `docs/backlog.md`, tsk-516 and merge-verify-only-false-done (both exist), and `docs/architect/...` at line 1243.
- All 4 hunks change comment lines only. No code token, string or regex is touched. The runtime lines (408, 409, 536, 562, 565, 638, 640, 996) are untouched and correctly listed in stepFiveExcluded. Patched paths and fragments contain no `*/` or backtick breakage.

## src/runner/paths.mjs — verdict: ok

1 slot (class6-l-000318, line 123, `docs/history/<feature>/` preserve). This is the L12-10 external-project convention and a pattern placeholder. The diff is empty. No other `docs/` reference exists in the file; the bare `CONTEXT.md` and `plan.md` mentions are not edges.

## src/runner/worktree.mjs — verdict: rework

OUTCOME defect

1. **Parked where a live holder exists — class6-l-000328, source line 756.**
   - Source (createBranchRef JSDoc): `baseRef` default `detectTrunk(repoRoot)` — "a host project whose trunk is `master` would otherwise fail ... per `docs/distribution-vision.md`'s 'installed into other repos' story".
   - The record parks it as "phase9-carry ... current generic platform vision alone does not prove this exact external-host trunk claim".
   - Live (non-carriage) holder of the same passage in `docs/platform/**`: `docs/platform/git/spec.md` §7 "Hardened Git backend, parsers and hook contract" (line 315): "No hardcoded trunk: explicit consumer target, remote default, then validated main attached branch; ambiguity/missing target is named." That file is "Status: Accepted G0, canonical", signed D-ADR0057, not carriage. The carry rows G-018 (trunk from `origin/HEAD`, else local `main`/`master`) and G-044 (`createBranchRef` initialised from a given base or the detected trunk) hold the same claim.
   - The comment's own claim is the no-hardcoded-main / host-trunk behavior. The cited `docs/distribution-vision.md` is only the motivation (reuse in other projects, its lines 24-25). Its promoted copy, `docs/platform/packaging-distribution/vision.md` §1/§4, is carriage-provenance.
   - Rule: the part assignment's park check, L12-30 to L12-32.
   - Correction: change to a Phase 9 patch of the pointer. Preferred target is `docs/platform/git/spec.md` with the anchor of heading "7. Hardened Git backend, parsers and hook contract". Keep the label and backticks. Replace only the citation and keep the surrounding words ("installed into other repos" story) as the Lead's patch text decides. Alternative: if the Lead rules that the vision story, not the trunk rule, is the cited claim, keep the park but record the git-spec holder explicitly instead of saying no exact holder exists.

Checked, no defect

- class6-l-000332 (line 1051) patches to `docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md#before-you-start`. The section (line 17) says never run a raw `git reset --hard` without a full `git status` first, which matches "never resets blind, the same discipline". The source already distinguishes the different target. Accept. The diff is a JSDoc comment only.
- class6-l-000329 (line 926) preserves `docs/decisions/0022` with a non-executable successor note `docs/platform/runner/decisions/h-36d872fbb0e5.md#0022-...`. The holder heading "### 0022 — Khảo sát choke-point fgOS ..." exists at line 295 of that file and matches the decision. Accept.
- All 9 `docs/history/...` preserves (lines 693, 991, 1037, 1099, 1121-22, 1392-93, 1404-05, 1479-80) point to paths that exist at the pin and are L12-10 history. Wrapped spans are held as split physical slots. Accept.
- class6-l-000333 (line 1088) is a runtime error-message string, correctly excluded to Step 5. The diff changes comment lines only.

## Record-text notes (not rework)

- merge.mjs preserve reasons for `docs/decisions/0000-index.md` (class6-l-000295/298/302/309/315) say "Retained native path". That file is not in the tree at the pin; only `docs/decisions/index.md` exists. The preserve is still right: the comments describe a runtime path constant that Step 5 owns, and the retired-corpus case is stated in the text. L12-60/314 asks for the true target state, so the reason should read "target removed, runtime literal owned by Step 5".
- Patched anchors use the repo extractor form with single hyphens (`tsk-3v2-the-block...`, `the-fix-a-separate-lockroot-parameter`). GitHub's own slug of those em-dash headings has a double hyphen (`tsk-3v2--the-block`, `the-fix--a-separate-lockroot-parameter`). `scripts/list-doc-anchors.mjs` accepts both forms, so this is consistent with the plan's anchor convention. Rendering the fragment on GitHub is not claimed.
- merge.mjs line 927 patched text puts `...-own-commit:` before "restoring .fgos/" in the comment. It is cosmetic, but the colon now follows a fragment.

## Lead-judgment questions

1. worktree.mjs line 756: is the cited passage the distribution-vision "reuse in other projects" story (keeps the park on the carry) or the host-trunk behavior (git spec §7 is the live holder, so patch)? I recommend patch to git spec §7, since the comment states a behavior and not a vision.
2. merge.mjs line 17: confirm park as dead link. The `.bee/spikes/pr-lifecycle` citation in the same comment is outside the repo docs and is untouched.
3. merge.mjs lines 215-216: add a slot. If the Lead extends the wrapped-path scan to ` * ` and `//` continuation prefixes, other wrapped `docs/` plus `architect/` splits in the other comment files may exist (not checked here).

Status: DONE_WITH_CONCERNS
Summary: 31 slots reviewed across 3 files; merge.mjs and worktree.mjs need rework (dead-link park, missed wrapped path, narrow anchor, live-holder park). paths.mjs is ok, and all patches change comments only.
