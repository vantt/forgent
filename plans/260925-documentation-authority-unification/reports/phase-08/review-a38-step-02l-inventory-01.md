# Review a38 step-02l inventory 01 (mechanical only)

Input commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b. Worktree bf67c9c17 (read-only, no writes). Scratch: .../review-7/w-p02/.

## Verdict: PASS

No defect found. Every line the step-02k review named now has an escaped edge, and my independent grep found no committed line in classes 4/5/6 that matches a legacy root and is in no edge or dynamic call site.

## 1. Replay and hashes
- Worktree and /tmp-cwd replays both exit 0 and are cmp-identical. Output 77,095 B, sha256 deb7261a71c5c9dfec38e3750bee6a5c3ff2d5aa3fa081f3f623d83da44096b8, status PASS, failures [].
- `--review-view`: exit 0, 60,455 B, sha256 e97492ca...8ce5. It equals `reviewViewSha256` in the receipt and `humanReviewBundle.generatedViewSha256` in the verification.
- Human payload: code, request and verification 104,849 B plus view 60,455 B is 165,304 B. That equals the recorded `totalBytes` and is under 400,000.
- I re-hashed every pin in the verification (artifactPins, codePins, inheritedDependencyPins, frozenStep02kPins). Mismatches: 0. The replay's outputSha256 for the three census files, reconciliation and exclusions equals the artifactPins.
- Counts match between verification and replay:

| class | files | edges | edge files | dynamic constructions | dynamic files |
|---|---|---|---|---|---|
| 4 | 225 | 3334 | 122 | 3542 | 176 |
| 5 | 712 | 1379 | 149 | 25339 | 696 |
| 6 | 490 | 494 | 118 | 10980 | 468 |

- Class 3 historical check at 1a0f61ac5: escapedLiteralEdgesFound 0, absent 0, no addendum emitted. This is consistent with the rule that zero absent edges needs no addendum.
- Probes: PASS, inheritedRegressionCount 222, inventoryRuleProbes 121 (97 new + 24 prior retained), negativeRecordProbes 9. All 121 are correctPassed and wrongConstructionRejected. The 192 older labels stay "class unspecified".

## 2. Escaped coverage
- All required lines have an `escaped-root-literal` edge:
  - class 4: doc-link-pass:10, propose-doc-decisions:172, check-doc-inventory-gates:1010. The census also adds check-doc-inventory-gates:794.
  - class 5: decisions-corpus-retired:87 and 94, assignment:150, dispatch:230 and 280, worktree:768, check-doc-constitution:660, knowledge-migration:155, knowledge-bootstrap:115 (both occurrences, `one\.md` and `moved\.md`) and 296. The census also adds dead-vocabulary-guard:560, which the 02k review did not list.
  - class 6: merge.mjs:409.
- Spans and existence for these edges verified against git (see sample check below).
- The step-02k to step-02l delta is exactly the escaped edges plus the two rulings:
  - class 4: +4 edges, +1 dynamic (generate-shipped-path-inventory:41).
  - class 5: +12 edges.
  - class 6: +2 edges (.gitignore:1, merge.mjs:409), +1 file.
  - 0 edges removed. Only the history flag changed on retained edges, as noted in section 3.

Independent grep. I wrote my own grammar at /scratchpad/.../w-p02/grep.py. It streams every committed text blob at the input commit through `git cat-file --batch`, skipping only .fgos, node_modules, .git, target and .bee.
- Roots: `docs` then 0 or more backslashes then `/`, then specs, architect, ui-spec, contracts, history, how-to, explanation, decisions, reference, tutorials or distillery. The boundary is the next char being not [\w.-], or `\*/`, or a dot not followed by a word char, or end of line.
- Also covered: `docs\/(...|...)` alternations, `docs/{...}`, ROOTFILES names with an escaped dot, `\ndocs\/root`, split forms (`'docs','root'`, `'docs' + '/root'`, `'docs/' + 'root'`) across lines.
- I then compared every hit to the union of edge spans and dynamic call-site lines in the three census files.
- Result:
  - hits in the 1,426 census-class files but in no edge or call site: 0
  - non-Markdown hits outside the census classes: all in plans/ (2,188,048 lines), docs/{architect,platform}/**/verification/** (1,620) and docs/history/** (365). These are excluded by the recorded surface rule. They are not in the 13-file exclusion list, because that list covers archive/plans only.
  - non-Markdown hits in archive/plans: exactly the 13 listed files.
  - Markdown hits outside classes 4-6: docs/ (9,504), CHANGELOG, AGENTS.md, README.md, core/*, domains/coding, .claude/skills references. These are prose populations for other classes.
- Gaps against the author's grep: none.

## 3. Four Lead rulings
1. ALLOWED_ROOTS bare `'docs'`: present in class 4 `dynamicConstructions` as `[41,3,41,9,"'docs'","config/default-root",true,"reader"]` for generate-shipped-path-inventory.mjs. No static edge was guessed. PASS.
2. `.gitignore:1`: class 6 edge class6-l-000013, token `docs/distillery/`, file counted (+1 file). PASS.
3. Exclusions: exactly 13 files. My independent grep of non-Markdown archive/plans files with a root hit gives the identical 13 paths. The set difference is empty. For every file, the git blob sha256 and bytes match the recorded values, 0 bad. Each has an explicit archived-history reason and surfaceClass null. PASS.
4. History flags: before 24 historyHeading, after 13 (11 changed). All 11 changed are `.sh` (7) or `.toml` (4), True to False, carriageRegion unchanged. Remaining flags are 13 historyHeading plus 1 carriageRegion, all in `.md` files. I traced all 13 historyHeading edges to a preceding `#` heading line. Each class's before/after counts and deltas match the reconciliation file (`historyFlagFix` and class deltas). PASS.

## 4. Probe
- The witness `escaped-literal-fails-02k-passes-02l` loads the real step-02k extractor and asserts it fails, then passes step-02l.
- Present probes cover:
  - authority levels with 1, 2 and 3 backslash separators for every legacy root and every ROOTFILES entry
  - delimiters `/docs\/decisions\//`, `\n` before the root, `"docs\\/architect\\/x.md"`, escaped dot in `architecture-manifest\.json`
  - shell and TOML comment-not-heading probes
  - gitignore consumer, archive exclusion, bare-docs default root
- PASS.

## 5. Fresh sample (seed A51-step02l-recheck-20261019-escaped-73c8)
I recomputed the ranking independently, and it equals the replay's samples in the view. For each edge I checked file digest, every physical span against line and column, and Git-tree existence of checkedPath.

Class 4: 002072, 002233, 002804, 000245, 001332, 000793, 000006, 002480, 002774, 002320.
Class 5: 000897, 000452, 000446 (wrapped-comment-token, multi-span OK), 000170, 001089, 000704, 000454, 000665, 000484 (split-path-construction), 000455.
Class 6: 000382, 000068 (wrapped-comment-token), 000021, 000146, 000087, 000279, 000160, 000201, 000099, 000263.

All 30 verified. class5-l-000897 and class6-l-000021 first showed a mismatch in my script. That was because their checked path has a trailing slash (`docs/specs/`, `docs/history/fgos-interface-daemon/`) and my tree set had no slash. `git ls-tree -d` confirms both are trees, and the census records kind tree, exists true. This is not an inventory defect. Class 5 sample 000452 is an escaped edge (`docs\/history\/my-feature\/plan\.md`, nonexistent, as expected for a regex prefix).

## Concerns (not defects)
- The author's `grep_audit` still shares a lexical family with the extractor, but my independent grammar gives the same result, so the proof now holds.
- Non-Markdown evidence under plans/, docs/history/ and docs/*/verification/** carries legacy-root text and is excluded by the surface rule, with no explicit exclusion listing (unlike archive/plans). The author may list it for symmetry.
- All dynamic constructions remain untraced, as designed.

Status: DONE
Summary: Replay is byte-identical in both cwd runs, all pins and the exclusions digest match, and every previously missed escaped line now has an edge. My independent boundary-aware grep found zero unclassified matching lines in classes 4/5/6, and all four rulings, the probes and the 30 fresh edges verify. Verdict PASS.
