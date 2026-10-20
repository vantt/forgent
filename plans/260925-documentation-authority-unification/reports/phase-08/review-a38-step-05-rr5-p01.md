# Review a38 Step 5 seams 1-4 re-review, part p01

Reviewer: independent read-only semantic review. Payload `s4-src-p01.json` (11 file entries). Scope: items whose disposition, diff or slots changed (R10, R11, R16 and L12-72 extra checks).

## Per-file verdicts

| File | Verdict | Items reviewed | Notes |
|---|---|---|---|
| bin/fgos.mjs | rework (one anchor, one Lead question) | 1 changed item (000277) + 1 diff hunk | see D1, Q1 |
| src/cli/command-registry.mjs | ok, with Lead questions | 0 payload items; diff (2 hunks) + 9 parked ids checked against the pinned records | Q2, Q3 |
| src/report/decision-index.mjs | ok | 2 (009761, 009767) | parked to preserve |
| src/report/enduser-index-generate.mjs | ok | 14 changed + parked 009788 | Q4 |
| src/report/knowledge-resolver.mjs | ok | 3 (009810-009812) | Q5 |
| src/setup/instruction-projections.mjs | ok | 9 | R14 preserve |
| .agents/skills/distill/scripts/distill.mjs | ok | 40 | render-join |
| .agents/skills/distill/scripts/migrate-porting-state-backfill.mjs | ok | 3 | render-join |
| .claude/skills/distill/scripts/distill.mjs | ok | 40 | render-join |
| .claude/skills/distill/scripts/migrate-porting-state-backfill.mjs | ok | 3 | render-join |
| docs/backlog.md | ok, record-text note | 0 payload items; 2 parked slots checked | N3 |

Counts: 115 payload items reviewed (1 + 0 + 2 + 14 + 3 + 9 + 40 + 3 + 40 + 3 + 0), plus 1 parked dynamic tuple, 9 parked ids in command-registry and 2 parked backlog slots read from the committed records.

## OUTCOME defects

### D1. bin/fgos.mjs, source line 5108: wrong anchor in the ADR0020 patch (rework)

- Rule: R8 and the live-holder rule. A patch must name a target that resolves.
- The diff replaces the retired `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` with `docs/platform/runner/decisions/h-36d872fbb0e5.md#0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập`.
- The live heading is `### 0020 — Chặn \`.fgos/\` khỏi worktree worker (không khóa, không cô lập)`, on line 102 of that file.
- The repo's own `githubSlug` (`scripts/list-doc-anchors.mjs`) gives `0020--chặn-fgos-...`, with two hyphens after `0020`. It removes the em dash but keeps both surrounding spaces. The sibling 0018 anchor in this plan, `#0018--mốc-mvp2-của-fgos`, is double-hyphen for a heading of the same shape.
- The diff and the five other 0020 uses in `cli-help-messages.jsonl` have a single hyphen.
- Correction: use `#0020--chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập` in the diff, rollbackDiff and all five records. Or show that the checker's extractor slug is the intended one; the file comment in `githubSlug` says the two differ for punctuated headings. The target file and heading do exist and the output delta is otherwise right.
- This is an emitted runtime message, so a wrong anchor is user-visible.

## Lead-judgment questions

- Q1. bin/fgos.mjs reference-000277 (line 3064, `<docs/quadrant-dir>`): ADMIT/parked became REJECT/preserve with nonDocumentUse `caller-data-formatting`.
  - The printed string is a fixed literal inside the usage message, not a path taken from caller data (R6).
  - The same quadrant-dir concept is still ADMIT/parked in command-registry 003641, 003652, 003653 and the new slots 28be8 and eeb16.
  - Reject is defensible: `docs/quadrant-dir` is a placeholder and can never resolve to a document.
  - But the label `caller-data-formatting` is not literally true, and the flip leaves the `--quadrant` usage hint unaligned with the parked help text for the same flag.
  - Options: keep REJECT with the label corrected to something like `placeholder-example`, or restore ADMIT/park following dynamic-009788.
  - Recommendation: restore for consistency, since R16 treats a message printing a fixed doc literal or fixed doc root as admit.
- Q2. command-registry, R7 on shared lines. Dispositions differ on the same line or passage, in three places:
  - Line 846: 003646 (`docs/decisions/index.md`) is preserve, while 003643 and 003666 (`docs/specs/<area>.md`, `docs/specs/`) are parked.
  - Line 1725: new slot 4c3ad (`docs/<quadrant>/`) is parked, while slot 284fae (`docs/enduser-docs-index.json`) is preserve.
  - Line 2075: 003647 (`docs/history/...`) is preserve, while 003649 and 003664 (`docs/specs/distribution.md`) are patch.
  - The line-2075 split is the usual single-path patch, with the Step 4 precedent.
  - For 846 and 1725 the paths have different futures: the generated index and the manifest are retained, while the area-spec and quadrant-enumeration paths depend on Phase 9. These look like independent operands within one string. Confirm that one parked operand beside a preserved operand on the same line is acceptable under R7, or park the whole passage.
- Q3. command-registry, R12 on blockers. The four blockers 003641, 003652, 003653 and 003659, plus the three new quadrant slots (4c3ad, eeb16, 28be8), share one dependency: the enduser-index-generate 009788 and enduser-index 009791 alias scan. They differ only in the trailing phrase ("description", "CLI example for lookup", "CLI example for filtering", "synthetic --doc-path example"). After normalisation they are close to templated. The dependency is genuine and named, but 003659 (`docs/how-to/example.md`, a compound `--doc-path` example) names a single file, not a quadrant scan. Consider whether it could instead follow the 003655 pattern (patch to a live docs/knowledge holder) or be preserved as a synthetic example, like the `docs/ast.md` and `docs/worktree/guide.md` slots which are preserved as synthetic.
- Q4. enduser-index-generate: 009787 (line 92, `docs/<quadrant>`) is preserve and 009788 (line 94, `docs/<alias>`) is parked, inside one loop with overlapping passage context. They are separate scanDirAsQuadrant calls and the park blocker is specific (the explanation quadrant still enumerates the decisions alias after the numbered decisions retired; Phase 9 must decide whether the surviving index.md stays in the scan). Accepted; flagging only so Lead confirms it against R7.
- Q5. knowledge-resolver 009810 to 009812: the operand `path` is only compared with `d.currentPath` and `d.aliases` in registry state. It reads no filesystem path, so R16 could read it as a pure predicate (reject). Admission was unchanged this round (R10), so it is out of scope. Preserve is correct either way.

## Record-text notes

- N1. command-registry 003643 and 003666 (line 846, the `scope` parameter of `decision`): the blockedReason talks about "Authoring scope ... the authoring request forbids generic docs/specs to docs/platform conversion". The passage is the decision-scope area-slug help, not an authoring scope. The park itself is plausible, because slug-to-holder mapping is not one-to-one (`distribution` maps to `packaging-distribution`), but the wording is copied from another passage. Rewrite it to name this passage's dependency.
- N2. The render-join reasons for 6 items per distill.mjs copy do not name the source owner file. These are 000009 (R7 overlap with 001671) and the five emitted-document-message items (000014, 000017, 000053, 000054, 000093, and their .claude twins). The source owner `core/skills/distill/scripts/distill.mjs` is correct and is a byte-identical copy at the pin (sha 3119c407...; backfill sha c5237254...). Add the owner path for uniformity.
- N3. docs/backlog.md slots 08912 (`docs/specs/distribution.md`) and a2043 (`docs/specs/work-state.md:647-675`). The Step 3 batch-126 parks are real, and I checked them:
  - 08912: the js-yaml upgrade procedure exists live at `docs/platform/packaging-distribution/spec.md` line 723, but inside Retained Distribution Source Detail. Step 3 judged it literal carriage that cannot be a patch destination.
  - a2043: the 647-675 line range has no established correspondence.
  - The Step 5 blockers ("no live holder for the exact backlog claim; Step 3 batch-126 must conserve ...") paraphrase this loosely. Quote the Step 3 reason (promote the full upgrade procedure to a live holder first; reconcile the line-range precedent) so the park does not read as "no holder exists". The inherited parks are correct under the inheritance rule.

## Checks passed

- decision-index 009761 and 009767: `docs/decisions/index.md` is a retained generated path (L12-72 p07 successor, AGENTS.md). Preserve is right. The generated content is state-derived, but the operations here only read or write the fixed path, so this is not the instruction-registry R15 comparison.
- enduser-index-generate: every `pathOperand` yields a document path (manifest, quadrant dirs, docs/knowledge), and `docs/knowledge` and `docs/enduser-docs-index.json` are retained (package.json files). Preserve is right.
- instruction-projections: `PORTABLE_AGENTS_DESTINATION` is `AGENTS.md` and the ledger is `.fgos/...`. These are fixed non-docs roots, so R14 preserve is right. Nothing touches docs/specs or docs/architect.
- Generated distill copies: the source slot is ADMIT/preserve for every changed item, so render-join is right under R2. The mixed ADMIT/REJECT source keys keep the ADMIT join. All four generated files carry no diff and no own park.
- command-registry diff: it patches only the admitted passages, 003655 (`docs/how-to/check-rollup-progress.md` to the existing docs/knowledge alias target) and 003649 and 003664 (`docs/specs/distribution.md` to `docs/platform/packaging-distribution/spec.md`). Both target files exist, the inverse rollback is exact, and the file is a source file. Only the two quoted passages change, and `CHANGELOG.md` and the two test files are listed as co-cut.
- No plans/** operations appear in this payload (R11 not engaged).
- No retired-decision citation in this payload lacks a holder, other than the D1 anchor.

Status: DONE_WITH_CONCERNS
Summary: 10 of 11 files are ok. bin/fgos.mjs has one correctable defect, the ADR0020 anchor slug (D1), and Q1 on 000277. command-registry carries three Lead questions (R7 mixed lines, R12 template-like blockers) and two record-text notes.
