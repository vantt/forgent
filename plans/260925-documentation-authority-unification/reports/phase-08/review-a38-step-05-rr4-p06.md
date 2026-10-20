# Review a38 step-05 rr4 p06 (s4-src-p06)

Payload: s4-src-p06.json, 35 file entries, pin 95301cb9a. Items reviewed: 107 (22 literal ADMIT, 13 dynamic ADMIT, 72 dynamic REJECT) plus 6 author-added parked backlog slots and 4 source diffs.

## Verdicts

| File | Verdict | Items |
|---|---|---|
| docs/backlog.md | REWORK | 6 author-added parks (author-s4-...) |
| core/skills/distill/scripts/migrate-porting-state-backfill.mjs | ok | 13 |
| core/skills/instruction-audit/scripts/instruction-audit.mjs | ok (1 question) | 49 |
| domains/coding/harness/enrich-and-validate-contract.mjs | ok | 7 |
| domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md | ok (diff reviewed) | 0 |
| domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md | ok (diff reviewed) | 0 |
| domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md | ok (diff reviewed) | 2 |
| domains/coding/skills/fgos-coding-shaping/SKILL.md | ok (diff reviewed; 1 record-text note) | 0 |
| domains/coding/skills/fgos-coding-planning/SKILL.md, fgos-coding-validating/SKILL.md, references/gate-auto-approve-mechanics.md, task-specs/shape-plan.md | ok | 2 / 1 / 3 / 1 |
| four domains/marketing/agents/*.yaml | ok | 1 each |
| plugins/dogfood-fixture/skills/list/SKILL.md | ok (1 question) | 1 |
| plugins/fgOS/skills/* (answer, approve, ask, cleanup-next, conflicts, discover-next, discover, goal, graph, list, merge-list) | ok | 1/3/1/6/1/3/5/1/1/1/1 |
| core/skills/fgos-routing/SKILL.md, _shared/coding-cell-policy.md, fgos-coding-exploring/SKILL.md, fgos-coding-implement/SKILL.md, implement-and-collaboration.md, worker-contract-and-orient.md, approach-and-shape.md | ok, no items and no diff in this payload | 0 |

## OUTCOME defects

### D1 docs/backlog.md: six author-added parks have the wrong outcome and a false blocker (R4, R7, inheritance of Step 3 dispositions)

Slots: author-s4-08912b8301b10321 (L29 `docs/specs/distribution.md`), author-s4-a20431be6e7a6997 (L44 `docs/specs/work-state.md:647-675`), author-s4-f02a917bdfe98c52 (L107 `docs/specs/runner.md`), author-s4-033b8befd0b861df (L116 `docs/specs/*.md`), author-s4-84005ca08befe2c0 (L123 `docs/specs/`), author-s4-26fc8d2f9269bc9a (L130 `docs/specs`).

All six carry the same blockedReason: "requires Step 3 retained backlog header packet composition in Step 7; six source passages belong to that single hand-maintained header correction". That is false. The header packet (cutover patch 12) edits only lines 1-11, the GENERATED FILE comment. None of these six passages is in it. The sentence is a shared boilerplate blocker, which R4 rules out. These are the same passages as Step 3 records in step-03-records/batch-126.jsonl, with the line numbers shifted by +5 at the new pin:

- L107 / maps-j-01295 (old L102): Step 3 preserve. The row is STR47, ends "— done", and sits under "## Done / Declined". The Step 3 reason keeps the original completed source identity.
- L116 / maps-j-01303 (old L111): Step 3 preserve. The row is STR57, "— done".
- L123 / maps-j-01314 (old L118): Step 3 preserve. The row is STR64, "— done".
- L130 / maps-j-01319 (old L125): Step 3 preserve. The row is STR72, "— done".
- L29 / maps-j-01280: Step 3 park with a specific blocker. The complete js-yaml upgrade procedure sits only in carriage text (packaging-distribution/spec.md line 723, Retained Distribution Source Detail), so there is no live holder to redirect to.
- L44 / maps-j-01282: Step 3 park with a specific blocker. The legacy line-range precedent in work-state at 647-675 is not established in the candidate work-state, so the description needs a rewrite first.

Correction: carry the Step 3 outcome for each, since Step 5 inherits Step 3 dispositions for joined ids and the passage text is unchanged.
- L107, L116, L123, L130 become preserve, as dated Done/Declined row provenance with an explicit "docs/specs tree retires at Phase 9" witness. They must not rest on a "retained" witness.
- L29 and L44 keep their Step 3 passage-specific blockedReason and dependency (phase9-carry and description-rewrite).
- Add physicalPriorJoins to the six slots. They currently have none.

If Lead thinks the four done rows should park because a preserve may not point into docs/specs, that is a change to the Step 3 outcome. It then needs a passage-specific blocker, not the header sentence. Record-text note: the six slots also have an empty `currentLine`.

## Record-text notes (outcome fine)

- instruction-audit dynamic-001837 (L278, `.claude/settings.json` join): nonDocumentUse "scalar-pass-through" is wrong. The true use is hook-settings config, so it should be `config-or-metadata`. 001830 (L159, directory-walk recursion) is also labelled scalar-pass-through. A more accurate name is directory traversal, not a document path. Both rejections are correct.
- migrate-porting-state-backfill reference-000289, 000290 and 000291 are labelled role "navigation". 000289 and 000290 are the L21-22 code literals, the same passage as the admitted path.join operands 001817 to 001819. The role should be a code path operand. Admission and preserve are right and consistent.
- fgos-coding-shaping SKILL L73 patch: the anchor `#business-rules` is the whole Business Rules section of h-6979005beaf7/spec.md. The "untrusted-input" invariant lives in RUL6 (the item's proof field is run as a shell command; items come only from the user), which has no heading anchor. The anchor is live and acceptable. Naming RUL6 in the record would be clearer.
- Shaping co-cut list: it includes recorded fixtures (legacy-derivation.json, real-shapes 09/10, pi-multiturn-normal.jsonl) that only contain the old string. Their per-file decisions are already park or preserve, so there is no outcome change.

## Lead-judgment questions

1. instruction-audit dynamic-001834 (L239, `${rel(p.file)}:${p.line}`) and 001853 (L395, `${f.file}`) are rejected as caller-data formatting. The printed paths derive from discovered instruction files such as CLAUDE.md and AGENTS.md, which come from fixed root literals joined with ROOT (admitted at 001827 to 001832). Under R6, a message that prints a fixed-root document path is an admit. The files are retained root instruction docs, not moving, and every neighbouring operand is preserve, so no outcome changes. Please confirm the intended R6 reading for this report-output class.
2. plugins/dogfood-fixture/skills/list/SKILL.md reference-002304 cites the retired `docs/decisions/0018-moc-mvp2-fgos.md` as a preserved prose pointer, with a successorNote to `docs/platform/system-overview/spec.md#0018--mốc-mvp2-của-fgos`. I verified that heading exists ("### 0018 — Mốc MVP2 của fgOS"). R8 allows preserve with a successorNote. R8 also says a navigation pointer with a live holder gets a patch. Confirm preserve is intended for a skill-body parenthetical, as opposed to a module header.

## Checks passed

- Every admitted dynamic tuple names a pathOperand that really yields a document path:
  - backfill 001817 to 001819 (LOG_FILE and STORE_DIR joins)
  - instruction-audit 001825 to 001829, 001831, 001832, 001869 (@import HOME and relative resolve, root instruction files, `.claude/rules`, AGENTS.md discovery, `at(f)`, listDir)
  - enrich-and-validate 002092 and 002093 (docsRef plan.md and CONTEXT.md into contextRefs)
- Every rejected tuple's nonDocumentUse is true in its window. Examples:
  - ROOT, cwd and `.git` probes
  - `process.argv` root
  - `.fgos` fgosDir
  - `git-common-dir` root derivation
  - `${CLAUDE_PROJECT_DIR}` text
  - the marketing `tool-scope:` false lexical hit
  - the const `'scope: repository (read-only)'`
  - label and summary joins
  - finding `path: m[1]` fields
  - caller-data error strings
  - the `refusing to run from "<path>"` message
- Same-passage agreement holds: backfill L21 and L22 literal with operand, enrich L128 both operands, and instruction-audit L298 items 001840 and 001841.
- All 22 literal refs are preserve. They cite the docs/history and docs/distillery conventions, which exist at the pin and are not under retiring docs/specs or docs/architect. 002304 carries a valid successorNote. No admitted item in this part is parked.
- Three of the four source diffs are patches with live targets, each on a SOURCE file.
  - scope-and-reclaim L49 and the two verify-commit and verify-sync passages point at docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md and docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md.
  - Both targets exist, and the enduser index lists the old docs/how-to paths as their aliases. The old docs/how-to paths do not exist at the pin, so the patch fixes dangling pointers.
  - The wrapped-path directory splits ("how-" and "to-preserve", "when-" and "transcribing") rejoin to the exact directory name.
  - The fourth diff, shaping L73, patches `docs/specs/runner.md` to the live `h-6979005beaf7/spec.md#business-rules` (heading exists), as noted above.
  - Each rollbackDiff is the exact inverse (minus lines equal plus lines).
  - Generated copies follow source and receive no hand-authored diff.

Counts: files 35, items 107 (22 ref ADMIT, 13 dyn ADMIT, 72 dyn REJECT), author-added parks 6 (all 6 defective), OUTCOME defects 1 (D1, six slots), record-text notes 4, Lead questions 2.

Status: DONE_WITH_CONCERNS
