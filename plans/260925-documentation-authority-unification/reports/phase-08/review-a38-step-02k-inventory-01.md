# Review a38 step-02k inventory 01 (mechanical only)

Input commit 42edba2b08d26ab8dcabe4859a301e1589fa8e6b. Worktree cbe5a6571 (read-only). Scratch: .../review-7/w-p01/.

## Verdict: REWORK (narrow, one defect class)

Replay, hashes, existence, spans, partition and class-4 delta all verify. The one defect: the lexer never emits backslash-escaped legacy-root literals (`docs\/<root>\/` inside regex literals). 0 edges across classes 4/5/6 contain `\/`. The author's `grep_audit` uses an unescaped `docs/` grammar, so it cannot see them. Each is a docs-root reference in committed code that sits in no class and no dynamic list.

## Replay, hashes, existence, spans

- Worktree and /tmp cwd replays both exit 0 and are cmp-identical. Output 63,767 B, sha256 3b25e472...aff2, equal to `verification.replays`. Receipt status PASS, failures [].
- `--review-view`: 48,077 B, sha256 63a78e9f...e7228, equal to verification. Human bundle total 205,845 B, under 400 KB.
- Independent sha256sum matches verification pins for all four code files (inventory a6a96861, parser 1e5a9cb9, probes f39f8bc2, replay d09a8285) and all census files and the delta file:
  - class4 2cbf234e...
  - class5 ab50b295...
  - class6 2614ad91...
  - class4-delta a93505d4...
- Probes: regressionCount 222 (192 inherited + 30 added), status PASS. Negative-record probes were run by the replay (wrong digest/target/class rejected), 9 of them.
- My own pass over every census file entry: all 1,426 file paths exist as blobs in `git ls-tree -r -t` at the input commit. Zero missing. nonTextFiles is [] in all three classes.

## 30 spot-check edges (check 1)

Seed ranking recomputed independently: sha256(seed NUL edgeId) ascending, tie edgeId, first 10 per class. It matches the replay's samples. For each edge I checked, from `git show <commit>:<path>`:
- file digest
- every physical span against line and column
- joined spans equal to matchedExpression
- checkedPath, literalTargetExists and kind against the Git tree
- patternOrPlaceholder, and the historyFile flag recomputed

All 30 are OK.

- Class 4: 003275, 001636, 002332, 002039 (wrapped-token, multi-span OK), 000257, 003242, 000467, 000927, 001724, 000548.
- Class 5: 000628, 000159, 000298 (pattern; prefix-lookup exists, literal does not), 000639, 000580, 000528, 000401, 000800, 000905, 000544.
- Class 6: 000064, 000471, 000448 (wrapped-comment-token), 000235 (pattern, prefix exists, literal not), 000468 (same), 000243, 000400, 000134, 000330, 000464.

Carriage/history flags: 25 flagged edges (1 carriageRegion, 24 historyHeading) all trace to a "history" heading line.
- NOTE: for `.sh`/`Cargo.toml` files (close.sh:4, rename.sh:4/22/89, fgos-shell-integration.sh:13/25, herdr-cockpit.sh:24, Cargo.toml:48-57) the "heading" is a `#` shell/TOML comment line. This is a mechanical over-flag, advisory only.

## Check 2: surface population and class-4 delta

- Candidate set: my own `git ls-tree` enumeration of scripts/, src/report/, .agents/skills/, plugins/fgOS/skills/, .claude/skills/*/tools, generate-/check-/render- names and registry/index files gives 277. Census class 4 is 225, with no census file outside my set.
- The 52 differences are zero-edge, zero-dynamic files, which the code deliberately omits (except initial-seed files). Re-grepping their bytes shows no docs-root hit: 21 `.agents/skills`, 25 `plugins/fgOS`, 5 `.claude/skills`, 1 `scripts/`.
- Class 5: my candidate set (937) is a superset of census 712, and census minus mine is empty. The rest are zero-hit files.
- Class 6: covers src/, apps/gateway, bin/, setup/doctor, packages, .github and the other rule-listed roots. No class-6 file was found with a legacy-root hit and no census row, except the items in the defect list.
- Delta reconciliation:
  - Initial census (c5efdf00): 53 files, 1207 edges. Current: 225 files, 3330 edges.
  - edgeDelta 2123 = edgeDeltaReconciled 2123. I recomputed the per-file sum independently over 94 changed paths: 2123.
  - 172 added files + 53 retained = 225. Removed files: 0.
  - Two initial files changed digest. `git diff --stat` c5efdf..42edba confirms both are real edits: scripts/check-legacy-docs-ratchet.exceptions.json (+334) and src/report/decision-index.mjs (28 lines).
  - 15 initial files changed edge count. All are explained by lexer expansion or current bytes.

## Check 3: independent grep (my own boundary-aware regex over every non-excluded blob, streamed through git cat-file --batch)

Grammar: `docs\\?/<legacy roots>` with `(?![\w-])` (so docs/reference-learning-system.md is not a match), ROOTFILES names, `join|resolve|joinpath(` with `'docs'` in any quote style and across newlines, split segments `'docs','<root>'`, `'docs' +`, `docs/${`, bare `'docs/'`, `docsDir`/`docsRoot` identifiers, and `docs\/`.

Defect: escaped-slash legacy-root literals missing from every class.

Class 6:
- src/runner/merge.mjs:409 `/^docs\/decisions\/(\d{4})-...\.md$/`

Class 4:
- scripts/doc-link-pass.mjs:10 (`docs\/architect\/`)
- scripts/propose-doc-decisions.mjs:172 (`docs\/history\/`)
- scripts/check-doc-inventory-gates.mjs:1010 (`docs\/(?:architect|platform)\/...verification`)

Class 5:
- test/docs/decisions-corpus-retired.test.mjs:87, 94
- test/runner/assignment.test.mjs:150
- test/runner/dispatch.test.mjs:230, 280
- test/runner/worktree.test.mjs:768
- test/scripts/check-doc-constitution.test.mjs:660
- test/scripts/knowledge-migration.test.mjs:155
- test/state/knowledge-bootstrap.test.mjs:115 (two occurrences), 296

Not defects (not legacy roots): `docs\/old.md`, `docs\/platform\/`, `docs\/knowledge\/`, `docs\/wip.md`, `docs\/guide.md` in tests; generic `startsWith('docs/')` in bin/fgos.mjs:4725, src/setup/registrations.mjs:4012/4113, src/state/knowledge-registry.mjs:77, scripts/build-rust-distribution.mjs:93, src/runner/dispatch/write-scope.mjs:21.

Notes (population, outside classes 4/5/6 by rule):
- `.gitignore:1` is a comment mentioning `docs/distillery/`. It is a non-md text file in no class. NOTE; the author should decide whether to list it.
- archive/plans/** json/xml/log (13 files) contain docs-root text. Not in any class; presumably archived history. NOTE.
- 1,119 md files with hits are prose classes, not this step.
- domains/coding/compiled.json:116 and packages/observe/contracts/observe.friction.v1.json:59 contain the JSON enum value `"docs"`. Unrelated.
- scripts/generate-shipped-path-inventory.mjs:41 `'docs',` inside `ALLOWED_ROOTS` is a config root list. The dynamic call-site list covers line 39 but not 41. NOTE.
- `docsDir` consumer lines (src/setup/registrations.mjs:4004-4019, scripts/knowledge-classifier.mjs:116-189, many tests) are uses of variables whose construction sites are already inventoried. NOTE.

## Check 4: dynamic constructions

- No joins, resolves, joinpath calls, template strings (`docs/${`), `'docs' +` concatenations or split segments are uncovered. Every independently found construction maps to a call site or edge span, multi-line included.
- Dynamic gaps: none, apart from the escaped-regex static gap above and the NOTE at generate-shipped-path-inventory.mjs:41.

## Check 5: partition of classes 4/5/6

- File sets are 225 / 712 / 489 (1,426 total). Pairwise overlaps: 4-5 = 0, 4-6 = 0, 5-6 = 0. This is a strict partition by construction, since `surface()` returns one class.
- Class 4 includes generated render surfaces: 101 of 225 files are under `.agents/skills/**` or `plugins/fgOS/skills/**`.
- Class 5 contains 1 file under a render-prefix path; class 6 contains 0. NOTE: render inclusion is per the recorded definition (class-3 projection overlap is advisory, no hand-edit authorized). No edge is missing from every class apart from the escaped-slash defect above.

## Concerns

- The review-view `independentGrep` reports uncoveredLines [] for all classes only because its grammar shares the author's blind spot for `docs\/`. The "gate" is therefore not a proof against escaped forms.
- Dynamic call sites remain conservative and untraced as designed.

Status: DONE_WITH_CONCERNS
Summary: Replay, hashes, existence, spans, the 30 sampled edges, the partition and the delta (2123 = 2123) all verify. Verdict REWORK for one defect: about 15 escaped-slash `docs\/<legacy-root>\/` regex-literal lines (src/runner/merge.mjs:409, scripts/doc-link-pass.mjs:10, scripts/propose-doc-decisions.mjs:172, scripts/check-doc-inventory-gates.mjs:1010, plus tests) are in no class.
