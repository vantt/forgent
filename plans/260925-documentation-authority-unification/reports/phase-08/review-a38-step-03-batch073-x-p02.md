# Review a38 step-03 batch-073 expansion, Part 02

Pin: `ae141550c2e022310de7a0efea757580c0b2479f` (author pin, sources and targets read through `git show` at it). Worktree detached at 63952951a, read-only. Records: `step-03-records/batch-073.jsonl` (loaded per field with python3; no whole-record dumps; each file's diff printed separately). Checker and probes were not run. I did not run step-03-resolve.py.

Reading method: each of the 6 consumers was read whole from the pin (165-197 lines, all under 60 KB). For every edge I read edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency category, targetFacts and the unit-disposition reason, plus the coverage, anchors, relativeResolution, labelForm and legacy-scan fields. Every patch target was read at the pin and compared with the complete adjacent source paragraph, item or row. Each file's own diff hunks were compared to its patch edges. Every file's legacy references were grepped independently of the record's scan.

## Per-file verdicts

| # | File | Set | Stratum (inclusion) | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | docs/knowledge/how-to-register-a-fixable-doctor-check-in-fgos/register-a-fixable-doctor-check-in-fgos.md | batch-073 | full-set-expansion + historical-unpatched-selected | 6 | ok |
| 2 | docs/knowledge/how-to-resolve-a-git-merge-conflict-on-fgos-events-jsonl-wit/resolve-an-events-jsonl-merge-conflict.md | batch-073 | full-set-expansion | 11 | ok |
| 3 | docs/knowledge/how-to-resolve-ambiguous-multi-target-errors-from-an-impact/resolve-ambiguous-multi-target-errors-from-an-impact-analysis-provider.md | batch-073 | full-set-expansion (zero-edge) | 0 | ok |
| 4 | docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md | batch-073 | full-set-expansion + corrected-lead-supplement | 16 | ok |
| 5 | docs/knowledge/how-to-respond-when-fgos-doctor-reports-a-shared-fgos-events/resolve-an-events-jsonl-truncation.md | batch-073 | full-set-expansion | 6 | ok |
| 6 | docs/knowledge/how-to-reuse-the-shared-executor-dispatch-fallback-fragment/reuse-the-shared-executor-dispatch-fallback-fragment.md | batch-073 | full-set-expansion | 6 | ok |

Edges reviewed: 6 + 11 + 0 + 16 + 6 + 6 = 45 of 45. No outcome defects found.

### 1. register-a-fixable-doctor-check-in-fgos.md (6 edges, empty diff)

- 04418 (L9), 04422 (L164), 04423 (L190): all preserve. They name retained `docs/history/**` directories or CONTEXT.md files that exist at the pin, in lineage or "records a real bug" prose.
- 04419 (L26): preserve. It sits inside the blockquote of a captured `registrations.mjs` comment (L12-40).
- 04420 (L126) and 04421 (L129): preserve with a successor note `docs/platform/packaging-distribution/spec.md`. They quote a deliberate reversal of the old RUL9 and RUL11 claims. L12-42 says quoted old text and past-event distribution citations preserve, so this is correct. `docs/distribution-vision.md` is `retained-source` in the switchboard, so its preserve is correct. The successor note names the target spec, which exists at the pin.
- Missed references: none. The only `docs/` tokens in the file are these six.

### 2. resolve-an-events-jsonl-merge-conflict.md (11 edges, 3 patches)

- 04424 (L22-23) patch: the wrapped path points to the events-jsonl lost-update explanation. The target's supersession header describes the frozen baseline, the per-writer shards and the deleted contiguity script, which is the same mechanism the source header names ("for the current mechanism"). The patch is correct.
- 04427 (L98) patch: points to `fix-fgos-write-rejected-merge-block.md#why-this-is-rejected-not-just-a-warning`. The heading exists at target line 23. Its text gives the one-write-door rule and the `fgos-write-rejected` outcome, which matches the source gloss ("full reasoning ... fgos merge rejects it outright").
- 04429 (L133, Related) patch, whole file: the target introduction is "fgos merge refuses ... fgw/<id> committed a change under .fgos/", which matches the source gloss. The deleted-script bullet next to it is a separate unit.
- 04425 (L23), 04431 (L140), 04430 (L138): preserve for the retained `docs/history/tsk-3tp-worker-write-events-tang-b/` and `docs/history/live-events-seq-corruption/` paths. These exist at the pin.
- 04426 (L47) and 04428 (L122): preserve, as blockquoted captured evidence (L12-40).
- 04432, 04433, 04434 (L145, L147, L155): preserve the self-alias, with the original spelling kept. They sit under the explicit `## Document history (compound-learn capture linkage)` heading and in a quoted `work.outcome` capture, so L12-39(6) and L12-40 apply. Correctly no self-patch.
- Missed references: none. The `scripts/*.mjs` and `src/*` paths are outside the docs-authority scope. Bare ADR0020 (L96) and ADR-0019 (L120) are decision ids, not inventoried paths (see Lead question 3).

### 3. resolve-ambiguous-multi-target-errors... (0 edges, empty diff)

I read all 82 lines. They contain no reference to a legacy path, retiring path, decision filename or `docs/` tree. Only `CLAUDE.md` is named, and that is a root file. Zero edges and an empty diff are correct.

### 4. resolve-a-decision-id-collision-merge-conflict-on-approve.md (16 edges, 2 patches)

This is the corrected Lead-supplement file. I read the whole file and compared both patches with their targets.

- 04449 (L157, Related): whole-file patch to `docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md`. I compared the complete adjacent gloss ("the sibling how-to for approve's other common blocked reason (verify-fail-post-merge), including the same blocked -> proposed recovery edge used in step 5 here") with target step 5 and its note.
  - Target step 5 documents the `blocked -> proposed` recovery door and `fgos move <id> --to proposed` followed by `fgos approve <id> [--acknowledge-iron-law]`. This matches source step 5.
  - The target's 2026-08-01 note says the status is now named `awaiting-approval`. The source step 5 comment already hedges ("whichever string main's CURRENTLY-merged code actually expects"), so the two are compatible.
  - The target's title and opening paragraph match "verify-fail-post-merge" exactly.
  - The patch is correct and the gloss is true. It is not a path-only redirect that falsifies the gloss.
- 04447 (L134) patch: points to `merge-auto-resolves-decision-id-collision.md#the-shape-being-auto-resolved`. The heading exists, and its text says "requiring: the ONLY conflicted path is the index file". The source says the auto-resolver's "own precondition requires the only conflicted path to be the index file". The patch is correct. The old filenames and the 0032 collision evidence in that source unit are untouched.
- 04435 (L14) parked, description-rewrite. The live entry condition names the removed hand-edited `0000-index.md`. Correct.
- 04439 (L58) and 04440 (L60) parked, step5-parity. They are the operative scratch-merge recipe that edits and `git add`s the removed index. Category and reason are consistent.
- 04450 (L163) parked, description-rewrite. The STR72 supersession convention is attributed to the removed manual index. Correct.
- 04436 (L14) preserve of the `docs/decisions/NNNN-*.md` placeholder pattern, a distinct claim from 04435 on the same line. It carries a "Distinct claim:" reason and the pattern asserts no file, so I accept it. See Lead question 4.
- 04437 (L40) and 04438 (L41): preserve the `docs/decisions/` directory and the `^docs/decisions/00` regex prefix inside the fenced grep recipe. L12-42 explicitly carries these stale grep docs/decisions recipes to Phase 9 step-10 semantic search with no consumer edit, so preserve is correct. 04448 (L152, the grep-sweep prose) is the same class and is correct.
- 04441 and 04442 (L98, L100): preserve with a successor note to runner `h-36d872fbb0e5.md`, heading `### 0023 — Thứ tự ưu tiên sản phẩm`. This heading exists at line 469 of that file. See record-text note 1.
- 04443 (L106): preserve, a completed historical conflict narrative with the successor note `docs/decisions/index.md`. This is a past-event narrative with a real existing successor.
- 04444 (L124): preserve. I independently resolved the elided `0032-iron-law-...md` against the deleted full name `0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md`. It matches uniquely by number and slug fragment. The note is runner `h-36d872fbb0e5.md#0032-cổng-iron-law-...`, and the heading at line 1095 is "0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người". The sibling Team Harness holder was not borrowed, as L12-41 and the request require.
- 04445 (L125): the multi-role-team-harness `0032` resolves to a distinct deleted decision. The note `work-state/decisions/retired-decision-history.md#13-adr-0032-multi-role-team-harness` matches the heading `## 13. ADR 0032 Multi-Role Team Harness` at line 767.
- 04446 (L130): preserve of `docs/specs/distribution.md` inside the list of conflicted files in the 2026-08-16 audit, with the successor note `docs/platform/packaging-distribution/spec.md`. This is a past-event citation (L12-42).
- Missed references: none. `CHANGELOG.md`, `bin/fgos.mjs` and `src/*` are retained or out of scope.

### 5. resolve-an-events-jsonl-truncation.md (6 edges, 1 patch)

- 04453 (L62-63) patch: the wrapped explanation path becomes the knowledge holder. The adjacent gloss says the sibling `events-jsonl-contiguous` check was retired with `tsk-3tp` once the baseline became frozen. The target supersession header says exactly that. Correct.
- 04451 (L18) and 04455 (L88) parked, description-rewrite. The source calls the seq merge runbook a recoverable sibling procedure. Its holder says the whole procedure is historical (frozen baseline, scripts deleted). A path-only redirect would leave a false description. This is the real adjacent-description mismatch that L12-37(1) allows to park. Correct.
- 04452 (L30), 04454 (L77), 04456 (L92): preserve of retained `docs/history/events-jsonl-git-tracked-truncation/**` paths. These exist at the pin.
- Missed references: none.

### 6. reuse-the-shared-executor-dispatch-fallback-fragment.md (6 edges, 4 patches)

- 04457 (L29) and 04460 (L118) patch to `wire-a-skills-classify-step-through-an-agent-executor-executor.md#steps`. The source says "steps 1-3 ... add a runner.executors.<id> entry, declare a capability field on the same entry, confirm with fgos dispatch decide followed by fgos run --provider <id>". Target Steps 1-3 contain exactly these (the `runner.executors` entry, the capability field on the same entry per tsk-in1-1 D1, and `fgos dispatch decide` then `fgos run ... --provider`). The `## Steps` heading anchor exists.
- 04461 (L121) whole-file patch. The target (headings Decision Call, Branching, Reuse The Shared Fragment) matches the gloss "Step B's own dispatch-decision mechanism in more depth".
- 04462 (L123) patch to `h-36d872fbb0e5.md#0026-native-first-dispatch-doctrine-launcherroottaskcapacity`. The heading at line 583 is "0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity", the same name the source gloss uses ("Native-First Dispatch Doctrine, the governing rules behind Step B").
- 04458 (L85) preserve: `docs/how-to/` is a retained directory in a "stays out of docs/how-to/" clause, and 34 files remain in it at the pin.
- 04459 (L116) preserve of a retained `docs/history` path.
- Missed references: none. The `.agents/skills/_shared/...` render path is not a legacy path, and its own text is unpatched. The source's remaining Step-B `execute` prose is a separate pre-existing text unit, not an edge defect.

## Defects

Outcome defects (wrong disposition, target, anchor, diff, false adjacent description, missed reference): none.

## Record-text notes (not rework)

1. 04441 (`docs/decisions/0023-*.md`, tsk-66l's own draft decision): the attached successor note is the 0023 product-priority narrative, with a caveat that it applies only to the contrasted main-branch record. The tsk-66l draft was later renumbered to 0024. The caveat makes the note truthful. A reader could still be misled about which 0023 is meant.
2. 04436 and 04435 sit on the same line with different dispositions. The distinct-claim text for 04436 is just the preserve reason prefixed with "Distinct claim:" and does not explain why the pattern differs. It is acceptable because the placeholder asserts no file.
3. 04426, 04428 and 04434 reasons quote the whole blockquote as the unit. Their unit scope is accurate.

## Lead-judgment questions

1. Line-wrapped patched paths (04424 in file 2, 04453 in file 5): the patched path inherits the source's mid-path line breaks inside an inline code span, which markdown renders as a space in the middle of the path. The original text had the same property, so I did not call it rework. It could be unified when the real patches are written, or you may want a one-line-path rule.
2. ADR0020 and ADR-0019 in file 2 (L96, L120) are bare decision ids and are not inventoried. The census is path-based. Please confirm that L12-38's removed-decision-id note applies only to inventoried references.
3. 04443's successor note is `docs/decisions/index.md`, a generator-owned index that is not a hand-edited "0000-index.md" successor. The successor note is non-executable and the file is a past-event narrative, so I think it is fine. Flagging it only because L12-42(2) names "successor note" strictness.

## Counts

- Per set, batch-073 (this part): reviewed 6, rework 0.
- Per stratum, with overlaps shown:
  - full-set-expansion: 6 files reviewed, 0 rework (all six are members).
  - historical-unpatched-selected: 1 reviewed (file 1), 0 rework. This is an overlap with full-set-expansion.
  - corrected-lead-supplement: 1 reviewed (file 4), 0 rework. This is an overlap with full-set-expansion.
  - historical-patched-selected: 0 in this part.
- Edges: 45 reviewed. Patch 10 (3 + 2 + 1 + 4 in files 2, 4, 5, 6), parked 7 (4435, 4439, 4440, 4450, 4451, 4455 = 6; recount below), preserve the rest.
  - Parked: 04435, 04439, 04440, 04450 (file 4), 04451, 04455 (file 5) = 6.
  - Patch: 04424, 04427, 04429 (file 2); 04447, 04449 (file 4); 04453 (file 5); 04457, 04460, 04461, 04462 (file 6) = 10.
  - Preserve: 45 - 10 - 6 = 29.
- No acceptance, dispatch, repair or checker run was done.

Status: DONE
Summary: All 6 files and 45 edges in Part 02 are ok: 0 outcome defects, 0 rework. This includes the corrected 04449 whole-guide patch and the independently title-matched 04444 Iron Law note. I raised three record-text notes and three Lead questions, none blocking.
