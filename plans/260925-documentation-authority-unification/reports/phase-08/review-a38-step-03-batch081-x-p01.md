# Review a38 step-03 batch-081 expansion, part x-p01

Worktree 18824b36a, author pin ae141550c. Records: step-03-records/batch-081.jsonl (each file's line selected by "file"). Per-field extraction only; no checker or probe run; pin-side facts checked with `git show/cat-file/grep` at ae141550c.

Result: 6 files, 50 edges (3+20+4+9+8+6), all edges read, full pinned source read for every file (all under 60 KB). Verdicts: 6 ok, 0 rework. No outcome defects.

## Per-file verdicts

### 1. why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md (corrected 04939 targeted re-review)
Path: docs/knowledge/why-src-runner-dispatch-mjs-s-capacity-executor-layer-was-re/why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md
Set batch-081, stratum targeted supplement. Verdict ok. 3 edges, empty diff.
- 04937 L16 `docs/specs/runner.md`, preserve. Inside the dated "Removed door (2026-10-14)" notice, past-tense removal narration ("kept as history"). Same class as the batch-064/065 dated retirement preserves (03810 etc.). ok.
- 04938 L20 `docs/history/task-dispatch-unification/CONTEXT.md`, preserve. Path exists at the pin and is retained. ok.
- 04939 L94, parked description-rewrite (the L12-49 correction). Verified at the pin that the source line attributes the `<scope>#p<n>` / ID_PATTERN id shape to the classify-step how-to. The registry knowledge-tree holder (docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-...md) has no `#p`, `ID_PATTERN` or "ad-hoc" text. The shape is at core/skills/_shared/executor-dispatch-fallback.md:168 and :280. Park category, blockedReason and dependency agree, and there is no executable diff or target, matching the 04485 class. The adjacent `_shared/executor-dispatch-fallback.md` mention at L95 is a retained non-legacy path and is not an edge. The rename fact (47703ebf0) is recorded. ok.

### 2. why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md
Path: docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md
Set batch-081, stratum patched expansion. Verdict ok. 20 edges (04941-04960), one-hunk diff.
- 04948 patch (the only diff hunk, L192-193) `docs/explanation/why-fgos-citations-carry-...md` -> knowledge holder `.../why-fgos-s-d-id-rul-id-adr-citations-must-carry-a-one-line-g/...`. Target exists at the pin. Its text covers tsk-1lv scope split, gloss enforcement and baseline ratchet, so the adjacent "this doc's own sibling ... tsk-37i ... bare-citation-gloss/baseline-ratchet" description is true. The diff keeps the existing line wrap inside the backticks. ok.
- 04941 (L6 frontmatter `docs/decisions/index.md`) preserve and 04942 (same line `docs/specs/<area>.md`) parked description-rewrite. The record has a `Distinct claim:` and the claims differ: the retained generated index versus a generic narrative-authority contract. ok.
- 04946 (L162 `docs/specs/<area>.md ... absorbs the long narrative`) parked description-rewrite. This is a present-tense location claim and a template path, so the park is right. 04947 (L165 `docs/decisions/index.md`, retained generated projection) preserve with note to docs/knowledge/decisions-index. ok.
- 04943-04945 (L144 `docs/specs`; L157-158 `docs/decisions/*.md`, `docs/specs/<area>.md...`) are verbatim D3/D5 blockquotes, preserved as captured evidence (L12-40). ok.
- 04949/04950 (L220, L223) are the tsk-1fp-6 past-event narration. `docs/decisions/00NN-*.md` is an illustrative pattern. Preserve ok.
- 04951/04952 (L235), 04953/04954 (L241-242), 04955-04958 (L258-262), 04959/04960 (L305) are completed-action paragraphs ("shipped", "were retired", "fixed"), preserved. ok. docs/decisions/ and docs/decisions/index.md exist at the pin.
- Scan: no missed legacy path. The one legacy-scan candidate (L261 `index.md`) is excluded with a truthful reason.

### 3. why-state-json-became-an-incrementally-read-snapshot.md
Path: docs/knowledge/why-state-json-became-an-incrementally-read-snapshot/why-state-json-became-an-incrementally-read-snapshot.md
Set batch-081, stratum patched expansion. Verdict ok. 4 edges (04961-04964), two-hunk diff.
- 04961 (L17-18) and 04962 (L90 Related) both patch to the knowledge holder of the tsk-4mx atomic-write explanation. Target exists at the pin, and the old docs/explanation path does not exist at the pin. The adjacent description ("atomic-write fix landing first", "the dependency this item required") matches the target, which is the tsk-4mx atomic-write item that tsk-49e depends on. Related lists are navigation, so the patch is correct per L12-34(4). ok.
- 04963/04964 are docs/history paths that exist, preserved. ok.

### 4. multi-domain-status-category-schema.md
Path: docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md
Set batch-081, stratum patched expansion. Verdict ok. 9 edges (04966-04974), one-hunk diff.
- 04969 patch (L311-312) `docs/how-to/write-verify-for-a-skill-prose-change.md` -> knowledge holder `.../vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`. Target exists at the pin. It catalogs the grep-weakness, branch and wrong-surface traps, which supports the source's "same category of trap" analogy. ok.
- 04970 (L317) preserve with `historyRegion` (heading line 315, marker "so it shipped as its own" at L322). This is a completed-child-task section (L12-46), the rename to docs/knowledge/fgos-triage-table-columns is recorded, and a successor note is given. ok.
- 04968 (L206), 04971 (L318), 04972 (L331) preserve elided `docs/decisions/0027`, all inside completed-task sections. The deleted file was removed at 4722361ae with no successor. I confirmed docs/decisions/0027-domain-so-huu-status-...md is in the tree at 4722361ae^. ok.
- 04973 (L383) and 04974 (L386-387) are the `**Source:**` provenance line (L12-47). Preserve, original spelling kept. ok.
- 04966 (L145) preserve; see record-text note R1. 04967 (L165) parked phase9-carry; see Lead question Q1.

### 5. merge-auto-resolves-decision-id-collision.md
Path: docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md
Set batch-081, stratum patched expansion. Verdict ok. 8 edges (04978-04985), three-hunk diff.
- Patches 04978 (L14), 04983 (L98 Related) and 04985 (L106 Related) all land on knowledge holders that exist at the pin. The descriptions ("already documents by hand (tsk-66l's real occurrence)", "prior fix ... isAlreadyMerged") match the targets and are cited as historical occurrences or precedent. ok.
- 04979 (L22) and 04981 (L73) `docs/decisions/0000-index.md`, parked step5-parity. The file was removed at 4722361ae with no successor, and the prose describes the classifier/auto-resolver operating on it in the present tense. The same blocker is stated on both, consistently. ok.
- 04980 (L46-47 docs/history plan.md) and 04984 (L100 CONTEXT.md) exist at the pin, preserved. ok.
- 04982 (L81 `docs/specs/runner.md`) preserve with successor note docs/platform/runner/spec.md; see Lead question Q2.

### 6. why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md
Path: docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md
Set batch-081, stratum patched expansion. Verdict ok. 6 edges (04986-04991), one-hunk diff.
- 04991 patch (L123) docs/explanation/why-plugin-only-installs-... -> knowledge holder. The holder exists and its "Why this belongs to mission #1/#2, not #3" section matches the claim. ok.
- 04986 (L13 `docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) parked GAP-02. The file was removed at 4722361ae. At the pin, the full 0014 narrative is in docs/specs/platform-foundations.md (anchor `#0014--kiến-trúc-giao-tiếp-người--fgos`), and the knowledge hits are citations or implementation accounts. This is the L12-41 class. ok.
- 04989 (L70 `docs/specs/runner.md` "RUL40 stays as-is ... purely PaneOrchestrator") parked description-rewrite. The candidate holders record a 2026-09-06 "RUL40 re-scope" that permits the herdr agent API as transport. The gloss would be false after a path-only patch. ok.
- 04987 (L16 docs/backlog.md) and 04988 (L18 docs/history/.../CONTEXT.md) are retained paths, preserved. 04990 (L90 `docs/distribution-vision.md:112`) preserve; the file exists at the pin and line 112 is the section-5 open-questions heading. ok.

## Outcome defects
None. No wrong disposition, target, anchor or diff, no false adjacent description, no missed reference found in the 6 files / 50 edges.

## Record-text notes (not rework)
- R1 04966 (L145 `docs/decisions/0027-...md`): the reason and targetFacts say "never existed in author-pin ancestry / never-existed". L12-41/L12-47 resolve an elided decision filename against the deleted full name (0027-domain-so-huu-status-...-d1-d3.md, removed at 4722361ae), exactly as the sibling edges 04968/04971/04972/04974 do. The disposition (preserve, past-event) is unaffected; only the stated target fact is inconsistent with the siblings.
- R2 04937: the reason calls the "Removed door (2026-10-14)" notice "captured source/output identity". It is a dated removal notice in the file's own voice rather than captured output. The preserve outcome (dated retirement narrative) is still right.

## Lead-judgment questions
- Q1 (multi-domain-status-category-schema.md, 04967 L165 vs 04968 L206/04971 L318/04972 L331): all four cite `docs/decisions/0027`'s audit. Only L165, whose text names the record's own "Audit" section as a locator ("`docs/decisions/0027`'s own 'Audit' section"), is parked phase9-carry (the audit survives only in retiring docs/specs/work-state.md). The other three are completed-task narration and are preserved. This is defensible as a locator-versus-past-event split in a live knowledge file, and the park is the conservative direction, but L165 sits in a non-completed-task section ("The decision record itself narrowed the scope it formalizes") next to the preserved 04966. Lead to confirm that the split is the intended application of L12-39 and L12-46. I did not mark it rework.
- Q2 (merge-auto-resolves..., 04982 L81 "RUL34/RUL37, `docs/specs/runner.md`"): preserved with only an area-spec successor note, as a dated explanation (frontmatter timestamp 2026-07-30). RUL34 and RUL37 have live holders at the pin: runner/subcomponents/h-6979005beaf7/spec.md:63 and runner/decisions/h-36d872fbb0e5.md:1179-1190. Under L12-37/L12-38, an undated live citation would patch to the exact heading. If "frontmatter timestamp" does not count as a dated explanation, this edge would become a patch. Consistent with the batch-064/065 dated-explanation preserves, so not marked rework.

## Counts
- Set batch-081 (this part): 6 files reviewed, 0 rework, 50 edges.
- Stratum patched-expansion (L12-49): 5 files reviewed in this part, 0 rework (files 2-6, 47 edges).
- Corrected-04939 targeted supplement: 1 file, 0 rework, 3 edges. It is outside the patched-stratum denominator because its diff is now empty.
- No overlap with wave5a membership is introduced by this part.
