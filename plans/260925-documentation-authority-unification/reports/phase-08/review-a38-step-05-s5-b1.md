# Review s5b1 (Step 5, seam 5 batch 1 + residual files) - payload s4-src-p01

Reviewer: independent semantic, read-only. Pins: prompt unit 5eb9dc609; bin and registry aa8d34374.

## Per file

### src/runner/prompt-templates/worker-prompt-skill-pointer.txt - verdict ok (3 items)
- 003778 (L31) and 003779 (L48): admit/patch to the same live holder `docs/knowledge/produce-failing-test-first-proof-.../produce-failing-test-first-proof-....md`. Holder exists at pin, sha 59693d42 matches the witness, the "Watch out for" section the prompt quotes exists, and the old how-to path does not exist at the pin (dead pointer), so a patch is right.
- 003777 (L55) `docs/history/<your item id>/iron-law-evidence.md`: admit/preserve, a writer convention pattern. The matchedExpression is truncated at the space (record-text note below).
- The forward and inverse diffs change only L31 and L48, one token each, and invert each other exactly.

### test/runner/prompt-templates.test.mjs - verdict ok (9 items: 7 references, 2 dynamic tuples)
- 004566 (L198) and 004567 (L215): admit/patch, the same target as the source. The diff edits only those two golden lines.
- The source L31/L48 and golden L198/L215 pair up exactly: same old and new strings, with the backtick escaping accounted for in the test file. Delta is +63 bytes per pointer. The source file goes 5196 to 5322 (+126). The rendered prompt goes 5235 to 5361 (+126), and the receipt carries both complete output hashes. The only other consumer of the template, test/runner/spawn-worker.test.mjs:118, asserts the template name only, so nothing else breaks.
- The receipt (real-file-tests-goldens-prompt-batch-1) names atomicUnit prompt-skill-pointer-atomic with both files, the complete current and candidate rendered prompt output sets, and a git-grep proof that only the golden's L198/L215 carry the old pointer.
- 004561-004565 `docs/specs/widget.md` synthetic fixture refs: admit/preserve. The witness is existsAtPin false with an explicit "tree retires" note, not a retained witness. The passages at L74/L93/L162/L190 agree. 004563 (L222) `docs/history/<your` is preserve, same as 003777.
- dynamic-029245 (skillPath fixture): admit/preserve. dynamic-029246 (assertion label): reject `text-label-join`, true. Its enclosing test has no census-root literal, so the mechanical rule holds.

### bin/fgos.mjs - verdict ok (6 items)
- 000228 (L5108) ADR0020 message: admit/patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0020--chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập`. The heading `### 0020 — Chặn \`.fgos/\` khỏi worktree worker (không khóa, không cô lập)` exists at L102. `githubSlug()` from scripts/list-doc-anchors.mjs gives exactly this slug (two spaces collapse to `--`). The forward and inverse diffs change only the path token. No test asserts the old string; the only other `0020-chan-fgos` hit is the source line itself.
- 000277 (L3064) `<docs/quadrant-dir>`: reject `usage-placeholder`. This is true: a usage metavariable that reads or builds no path. It is not a boilerplate park. L12-76 states the decision directly.
- 001601, 001602, 001606, 001607 (help/usage formatting): reject `caller-data-formatting`. The printed strings contain no document path.

### src/cli/command-registry.mjs - verdict ok (40 items, plus the 8 author-added slots read from the record)
- 003655 (L1746): patch to the registry currentPath. docs/doc-registry.json lists docs/how-to/check-rollup-progress.md as an alias. The old file still exists at the pin, but an approved alias retires it, which the "unless an alias retires it" ruling allows. `doc-sources` resolves through the registry as well.
- 003649 and 003664 (L2075) `docs/specs/distribution.md`: both admit/patch to the same target, one outcome. The RUL9 and RUL11 text is at spec.md L644/L659, and the L12-62 ruling maps those rules to packaging-distribution/spec.md. The diff replaces only that path token and leaves the neighbouring docs/history token (003647, preserve) alone.
- 003643 and 003666 (L846) `docs/specs/<area>.md` and `docs/specs/`: same token, both park. The blocker is specific: the slug-to-holder mapping is not one to one (distribution maps to packaging-distribution). This fits L12-74 and L12-76.
- 003641 (L1760), 003652 (L1767), 003653 (L1768), and the author slots at L1725, L1756, L1760: all park, citing enduser-index-generate dynamic-009788 and enduser-index dynamic-009791. I checked both cited records and both are really parked with the explanation/decisions alias blockers. The slot on the L1760 line (`docs/<quadrant>`) agrees with 003641.
- 003659 (L638) `docs/how-to/example.md`: admit/preserve, a synthetic example with existsAtPin false. This is true.
- L846 independent tokens: 003646 `docs/decisions/index.md` is preserve (retained projection) and 003665 `docs/**+src/**+plugins/**` is preserve (a scan-scope glob). Tokens inside one string literal may differ, per L12-74.
- 003658, 003661, 003662 (docs/history/tsk-19j/...): preserve, synthetic gate-check example with a nonexistent path and an honest witness.
- 003657 (L7 comment about docs/architecture-manifest.json): reject, preserve.
- dynamic-009294 to 009307: 14 rejects of schema/help-data property tokens (`path: {type...`, `dir:`, `scope:`, and the like). No path is built, so the rejects are true.
- Author-added slots (read from the record, not in the payload items): L1415 README.md, L1416 docs/ast.md, L1725 enduser-docs-index.json, L1828 and L1849 synthetic worktree guide paths are all preserve. These are fine.
- The diff covers only L1746 and L2075, both admitted patches. Rollback is the exact inverse. It is on a source file.

## Counts
- Items reviewed in the payload: 3 + 9 + 6 + 40 = 58, plus 8 author-added registry slots read from the record.
- OUTCOME defects: 0.
- Mechanical rejects reported separately: dynamic-029246 (test file), plus the pure-formatting and schema-token rejects in bin and the registry (4 + 14).

## OUTCOME defects
None.

## Record-text notes (no outcome change)
1. 003777 and 004563: matchedExpression `docs/history/<your` is truncated at the space. The real operand is `docs/history/<your item id>/iron-law-evidence.md`. Label only.
2. dynamic-029245: `.claude/skills/fgos-code-implement/SKILL.md` is admitted with a pathOperand. It is a fixture scalar rendered into the golden, and `.claude/skills` is not a legacy census root. The preserve outcome is unaffected. A reject would be more accurate, but R19 forbids a mechanical reject here because the enclosing test contains docs/specs/widget.md, so it would need a judgment label.
3. command-registry nonDocumentUse labels differ across identical schema-property tokens: `path: {type...` is finding-path-field, `dir:` and `root:` are config-or-metadata, `paths:` and `direct:` are scalar-pass-through. All are help-data rejects and all preserve.
4. 003657: the REJECT carries no nonDocumentUse. It is a comment citing a retained real file (exists true). It is outcome-neutral, but admit/preserve would be uniform with the other comment pointers.
5. 003655's reason string claims "the exact registry alias names currentPath". This is true, but the how-to copy also still exists at the pin. Phase 9 must delete or redirect it, or the example would point at a retired path.

## Lead-judgment questions
1. bin 000277 is rejected (usage placeholder), while registry L1760 `docs/<quadrant>` and `e.g. docs/how-to` are parked for the same quadrant-under-docs concept. The text differs: bin is a metavariable, the registry is a real example. The reject is accepted per L12-74 ("patch or reject"). Confirm the asymmetry is intended.
2. The quadrant parks (003641, 003652, 003653) name an explanation/decisions alias dependency, but the cited tokens are `docs/how-to`. This follows the explicit L12-74 ruling ("park citing the parked enduser-index generator record"). The link is real only if the how-to quadrant scan shares that alias enumeration. Accepted as ruled.
3. bin/fgos.mjs has many other docs refs at the pin: `docs/history/${id}/iron-law-evidence.md` at L224, `docs/doc-registry.md|json` reads at L1758/L1759, CONTEXT.md joins, and docs/architect and docs/specs comments. This record (seam cli-help-messages) owns only the L5108 and L3064 literals plus 4 formatting tuples. step-05-population-files.jsonl lists bin/fgos.mjs for later authoring. Confirm those refs are owned by a later seam record, not dropped.
4. coCutPaths lists CHANGELOG.md on the prompt and bin records, and the registry record also lists the enduser-index test and fixture. No CHANGELOG diff appears in this batch, so it is deferred to the Step 7 composition.

Status: DONE
Summary: All 58 payload items plus 8 registry author slots reviewed, and no outcome defects found. The prompt source/golden atomic unit is exact (same two pointers, +126 bytes in both the file and the rendered prompt), and the bin ADR0020 anchor matches `githubSlug`. Only label and record-text notes remain, plus four Lead-judgment questions.
