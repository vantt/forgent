# A38 independent review: Step 9 closing, own current-candidate sets (01)

Reviewer: `reviewer:sonnet-session:ad59bc41268f23170@2026-10-18`
Author sessions: `codex-session:fgos-run_unit-run-179225dfe65eba@2026-10-18` (current-candidate rows, N1 queue); accounting author `codex-session:fgos-run_unit-run-179229832261fa@2026-10-18` (not part of these sets)
Review mode: ordinary
Reviewed commit: `9ac0f42fb` (read-only worktree `/home/vantt/projects/forgentX-s8-review`, content commit `e6b7efeec`)
Request: `step-09-package-02` under owner answer A46 (scope file `review-scope-step-09-phase7-own.json`)

## 1. Result

- Mechanical auth: exit 0 over the whole index. checked 7702; counts current 1237, displaced 869, routing-binding 31, decision 2128, native-change 1164, A34-join 15, identical-owner-join 7, candidate-list-rebind 823, candidate-current 565, N2 3, native-document 48, native-metadata 1, historical 3, candidate-authority-exclusion 324, N1-native-recarry 3, N1-gap-decision 1, N1-document 1, native-inventory-gap 6, global-candidate-mismatch 21, accounting-row 452. Output says mechanicalOnly and semantic review pending.
- Deep reads: 199 (unheaded block 145/522, heading 53/73, file block 1/1). Verdict: 199 ok, 0 rework, 0 rationale-only wording items.
- Rework rate per set: 0 of 145 (0%), 0 of 53 (0%), 0 of 1 (0%). The 3% expansion trigger is not reached.
- Findings that are not rework: (a) one open comparator row, current-0877 (section 5); (b) all 32 files are `candidate/candidate` under the unchanged status function; (c) 74 of 596 units differ from the pre-change base text and every one of them was deep-read.

## 2. Seed and draw

- Seed string (held by this reviewer, chosen here): `a38-own-current-candidate-01:2026-10-18:k7q4m9`.
- Generator: first 8 hex of sha256(seed) as 32-bit state of mulberry32; ids of one set sorted ascending, Fisher-Yates from the end, first n kept (script `draw.mjs` in the reviewer scratchpad; rerun gives the same ids).
- Seeded draw: 79 of 522 (15.1%), 11 of 73 (15.1%), 1 of 1. Mandatory/high-risk/parked added on top: the one mandatory row (current-0877), all 74 units whose text differs from base, all 50 rows carrying a lineage `needs-review` or an identity note (44 + 6). Union = 199 deep reads.

Drawn ids, `current-unheaded-block-candidate` (79): current-0242 current-0246 current-0260 current-0275 current-0281 current-0288 current-0289 current-0296 current-0298 current-0336 current-0339 current-0340 current-0341 current-0343 current-0349 current-0351 current-0353 current-0358 current-0362 current-0364 current-0369 current-0371 current-0372 current-0373 current-0382 current-0384 current-0387 current-0406 current-0407 current-0423 current-0429 current-0430 current-0435 current-0441 current-0445 current-0451 current-0461 current-0465 current-0471 current-0482 current-0492 current-0495 current-0503 current-0506 current-0512 current-0513 current-0517 current-0537 current-0540 current-0542 current-0851 current-0860 current-0879 current-0897 current-0906 current-0911 current-0913 current-0921 current-0922 current-0928 current-0931 current-0941 current-0957 current-0964 current-0973 current-0980 current-0981 current-0985 current-1041 current-1047 current-1051 current-1055 current-1058 current-1079 current-1084 current-1091 current-1120 current-1131 current-1135

Drawn ids, `current-heading-candidate` (11): current-0315 current-0318 current-0840 current-0841 current-0850 current-0854 current-0937 current-0944 current-0948 current-1134 current-1138

Drawn ids, `current-file-block-candidate` (1): current-0543

## 3. Method per entry

Evidence codes used in the table:
- T: line range and unit digest recomputed independently from `git show e6b7efeec:<path>`. Blocks: sha256 of the trimmed line range (all 521 block rows match, not only the drawn ones). Headings: composite digest `heading/level/title/sha256(section payload)/following block digest` recomputed for all 73 headings (73 of 73 match). File block: sha256 of the whole file. Adjacent-context digests and extractor tuple were authenticated by the portable script.
- N: registry unit (claim id) has the same path, anchor, unitKind and source digest as the entry; one claim per (path, anchor); no duplicate claim id; `reviewStatus` of the queue entry is `pending`; no reviewedBy/reviewReport/seed or other approval key on the registry unit (the 44 `needs-review` lineage units carry a lineage record, which is not an approval).
- U: text found verbatim in the pre-change base (`6f0f39ca1`), so no change to conserve; whole-file diff base to `e6b7efeec` is also 0 removed/0 added versus the registry pin `8b2ee4dd9` for all 32 files.
- C: text differs from base; the file diff was read in both directions (additions and deletions), relative links of the unit checked against the tree at `e6b7efeec` (125 links, 0 real misses).
- L: lineage verified: `toSourceUnitDigest` equals the current digest and `fromSourceUnitDigest` exists in the file at `3baafff4d` (44 of 44).

## 4. Per-entry verdicts

Mode is `deep` for every row. Src: D drawn, C changed vs base, L lineage/identity-note, M mandatory.

| Entry | Set | Src | Path:lines | Anchor | Evidence | Verdict | Note |
|---|---|---|---|---|---|---|---|
| current-0224 | unheaded-block | C | README.md:43-64 | unheaded-block-6 | T N C | ok |  |
| current-0228 | unheaded-block | C | README.md:78-88 | unheaded-block-8 | T N C | ok |  |
| current-0229 | unheaded-block | C | README.md:90-94 | unheaded-block-9 | T N C | ok |  |
| current-0235 | unheaded-block | C | agent-confinement/history/rollout-and-settled-facts.md:43-49 | unheaded-block-6 | T N C | ok | item 7 rewritten for the A45 CTR011 renumber; content otherwise kept |
| current-0239 | unheaded-block | C | agent-coordination/contracts/assignment-run-runresult.md:44-47 | unheaded-block-5 | T N C | ok |  |
| current-0242 | unheaded-block | D | agent-coordination/contracts/assignment-run-runresult.md:61-61 | unheaded-block-8 | T N U | ok |  |
| current-0246 | unheaded-block | D | agent-coordination/contracts/assignment-run-runresult.md:81-81 | unheaded-block-12 | T N U | ok |  |
| current-0260 | unheaded-block | D | agent-coordination/contracts/assignment-run-runresult.md:164-176 | unheaded-block-26 | T N U | ok |  |
| current-0275 | unheaded-block | D | agent-coordination/contracts/assignment-run-runresult.md:292-292 | unheaded-block-41 | T N U | ok |  |
| current-0281 | unheaded-block | D | agent-coordination/contracts/assignment-run-runresult.md:340-341 | unheaded-block-47 | T N U | ok |  |
| current-0284 | unheaded-block | C | agent-coordination/contracts/workflow-stage-operation.md:27-29 | unheaded-block-3 | T N C | ok |  |
| current-0288 | unheaded-block | D | agent-coordination/contracts/workflow-stage-operation.md:45-45 | unheaded-block-7 | T N U | ok |  |
| current-0289 | unheaded-block | D | agent-coordination/contracts/workflow-stage-operation.md:47-50 | unheaded-block-8 | T N U | ok |  |
| current-0296 | unheaded-block | D | agent-coordination/contracts/workflow-stage-operation.md:79-80 | unheaded-block-15 | T N U | ok |  |
| current-0298 | unheaded-block | D | agent-coordination/contracts/workflow-stage-operation.md:90-95 | unheaded-block-17 | T N U | ok |  |
| current-0302 | unheaded-block | C | architecture-map.md:395-412 | unheaded-block-55 | T N C | ok | CTR010 to CTR011 relabel for confinement; sibling rows kept |
| current-0304 | unheaded-block | C | architecture-map.md:416-421 | unheaded-block-56 | T N C | ok |  |
| current-0309 | unheaded-block | C | architecture-map.md:444-458 | unheaded-block-59 | T N C | ok | registry: CTR010 now Gateway REST row, old confinement row preserved verbatim under CTR011 (all columns compared), CTR012/CTR013 added |
| current-0312 | unheaded-block | C | component-boundary.md:3-24 | unheaded-block-1 | T N C | ok |  |
| current-0317 | unheaded-block | C | component-boundary.md:66-85 | unheaded-block-11 | T N C | ok |  |
| current-0321 | unheaded-block | C | component-boundary.md:96-104 | unheaded-block-13 | T N C | ok |  |
| current-0325 | unheaded-block | C | component-boundary.md:182-186 | unheaded-block-27 | T N C | ok |  |
| current-0336 | unheaded-block | D | component-boundary.md:244-247 | unheaded-block-38 | T N U | ok |  |
| current-0339 | unheaded-block | D | component-boundary.md:264-264 | unheaded-block-41 | T N U | ok |  |
| current-0340 | unheaded-block | D | component-boundary.md:266-287 | unheaded-block-42 | T N U | ok |  |
| current-0341 | unheaded-block | D | component-boundary.md:289-294 | unheaded-block-43 | T N U | ok |  |
| current-0343 | unheaded-block | D | component-boundary.md:301-303 | unheaded-block-45 | T N U | ok |  |
| current-0349 | unheaded-block | D | component-boundary.md:359-362 | unheaded-block-51 | T N U | ok |  |
| current-0351 | unheaded-block | D | component-boundary.md:367-387 | unheaded-block-53 | T N U | ok |  |
| current-0353 | unheaded-block | D | component-boundary.md:394-396 | unheaded-block-55 | T N U | ok |  |
| current-0358 | unheaded-block | D | component-boundary.md:430-430 | unheaded-block-60 | T N U | ok |  |
| current-0362 | unheaded-block | D | component-boundary.md:467-468 | unheaded-block-64 | T N U | ok |  |
| current-0364 | unheaded-block | D | component-boundary.md:472-497 | unheaded-block-66 | T N U | ok |  |
| current-0369 | unheaded-block | D | component-boundary.md:557-571 | unheaded-block-71 | T N U | ok |  |
| current-0371 | unheaded-block | D | component-boundary.md:580-582 | unheaded-block-73 | T N U | ok |  |
| current-0372 | unheaded-block | D | component-boundary.md:584-584 | unheaded-block-74 | T N U | ok |  |
| current-0373 | unheaded-block | D | component-boundary.md:586-592 | unheaded-block-75 | T N U | ok |  |
| current-0382 | unheaded-block | D | component-boundary.md:676-682 | unheaded-block-84 | T N U | ok |  |
| current-0384 | unheaded-block | D | component-boundary.md:687-687 | unheaded-block-86 | T N U | ok |  |
| current-0387 | unheaded-block | D | component-boundary.md:704-717 | unheaded-block-89 | T N U | ok |  |
| current-0398 | unheaded-block | C | component-boundary.md:775-779 | unheaded-block-99 | T N C | ok |  |
| current-0406 | unheaded-block | D | component-boundary.md:819-821 | unheaded-block-107 | T N U | ok |  |
| current-0407 | unheaded-block | D | component-boundary.md:825-826 | unheaded-block-108 | T N U | ok |  |
| current-0423 | unheaded-block | D | component-boundary.md:912-914 | unheaded-block-124 | T N U | ok |  |
| current-0429 | unheaded-block | D | component-boundary.md:978-996 | unheaded-block-130 | T N U | ok |  |
| current-0430 | unheaded-block | D | component-boundary.md:998-1000 | unheaded-block-131 | T N U | ok |  |
| current-0435 | unheaded-block | D | component-boundary.md:1022-1022 | unheaded-block-136 | T N U | ok |  |
| current-0441 | unheaded-block | D | component-boundary.md:1049-1049 | unheaded-block-142 | T N U | ok |  |
| current-0445 | unheaded-block | D | component-boundary.md:1069-1069 | unheaded-block-146 | T N U | ok |  |
| current-0451 | unheaded-block | D | component-boundary.md:1104-1106 | unheaded-block-152 | T N U | ok |  |
| current-0461 | unheaded-block | D | component-boundary.md:1180-1182 | unheaded-block-162 | T N U | ok |  |
| current-0465 | unheaded-block | D | component-boundary.md:1199-1199 | unheaded-block-166 | T N U | ok |  |
| current-0471 | unheaded-block | D | component-boundary.md:1226-1226 | unheaded-block-172 | T N U | ok |  |
| current-0480 | unheaded-block | L | component-boundary.md:1271-1271 | unheaded-block-181 | T N U L | ok | identity note ambiguous (4 identical "Use this document when deciding:" blocks); each has its own claim id and anchor 181/186/189/192, context differs |
| current-0482 | unheaded-block | D | component-boundary.md:1281-1284 | unheaded-block-183 | T N U | ok |  |
| current-0485 | unheaded-block | L | component-boundary.md:1295-1295 | unheaded-block-186 | T N U L | ok | twin of 0480 group, own claim id and anchor |
| current-0488 | unheaded-block | L | component-boundary.md:1308-1308 | unheaded-block-189 | T N U L | ok | twin of 0480 group, own claim id and anchor |
| current-0491 | unheaded-block | L | component-boundary.md:1323-1323 | unheaded-block-192 | T N U L | ok | twin of 0480 group, own claim id and anchor |
| current-0492 | unheaded-block | D | component-boundary.md:1325-1330 | unheaded-block-193 | T N U | ok |  |
| current-0495 | unheaded-block | D | component-boundary.md:1345-1359 | unheaded-block-196 | T N U | ok |  |
| current-0503 | unheaded-block | D | component-boundary.md:1419-1421 | unheaded-block-204 | T N U | ok |  |
| current-0506 | unheaded-block | D | component-boundary.md:1431-1445 | unheaded-block-207 | T N U | ok |  |
| current-0512 | unheaded-block | D | component-boundary.md:1470-1471 | unheaded-block-213 | T N U | ok |  |
| current-0513 | unheaded-block | D | component-boundary.md:1473-1474 | unheaded-block-214 | T N U | ok |  |
| current-0517 | unheaded-block | D | component-boundary.md:1486-1486 | unheaded-block-218 | T N U | ok |  |
| current-0537 | unheaded-block | D | component-boundary.md:1593-1604 | unheaded-block-238 | T N U | ok |  |
| current-0540 | unheaded-block | D | component-boundary.md:1612-1617 | unheaded-block-241 | T N U | ok |  |
| current-0542 | unheaded-block | D | component-boundary.md:1625-1630 | unheaded-block-243 | T N U | ok |  |
| current-0839 | unheaded-block | C | host-invocation-routing/architecture/host-use-cases.md:46-52 | unheaded-block-5 | T N C | ok | link repaired to archive path; target path matches the sibling column |
| current-0842 | unheaded-block | C | observe/decisions/observe-component-architecture.md:28-28 | unheaded-block-3 | T N C | ok |  |
| current-0847 | unheaded-block | C | observe/spec.md:35-39 | unheaded-block-5 | T N C | ok |  |
| current-0851 | unheaded-block | DC | observe/spec.md:60-62 | unheaded-block-8 | T N C | ok |  |
| current-0856 | unheaded-block | C | packaging-distribution/architecture/runtime-identity-and-activation.md:313-340 | unheaded-block-49 | T N C | ok |  |
| current-0860 | unheaded-block | D | packaging-distribution/contracts/activation-binding.md:124-127 | unheaded-block-12 | T N U | ok |  |
| current-0862 | unheaded-block | C | packaging-distribution/contracts/activation-binding.md:159-168 | unheaded-block-15 | T N C | ok |  |
| current-0866 | unheaded-block | C | packaging-distribution/contracts/instruction-composition-and-projection.md:36-42 | unheaded-block-4 | T N C | ok |  |
| current-0867 | unheaded-block | C | packaging-distribution/contracts/instruction-composition-and-projection.md:44-44 | unheaded-block-5 | T N C | ok |  |
| current-0871 | unheaded-block | C | packaging-distribution/contracts/repository-runtime-layout.md:38-82 | unheaded-block-4 | T N C | ok |  |
| current-0872 | unheaded-block | C | packaging-distribution/contracts/repository-runtime-layout.md:84-84 | unheaded-block-5 | T N C | ok |  |
| current-0877 | unheaded-block | LM | packaging-distribution/contracts/repository-runtime-layout.md:104-114 | unheaded-block-9 | T N U L | ok | mandatory (global comparator row). Tuple and native binding exact. Twin of current-0897 (identical text, different position and context, own claim id). Comparator reports "candidate union missing" for this tuple: a declared open set (global-candidate-mismatch), not a defect of this binding. No fix by this review. |
| current-0879 | unheaded-block | D | packaging-distribution/contracts/repository-runtime-layout.md:120-124 | unheaded-block-11 | T N U | ok |  |
| current-0892 | unheaded-block | C | packaging-distribution/contracts/repository-runtime-layout.md:200-247 | unheaded-block-23 | T N C | ok |  |
| current-0893 | unheaded-block | C | packaging-distribution/contracts/repository-runtime-layout.md:249-250 | unheaded-block-24 | T N C | ok |  |
| current-0897 | unheaded-block | DL | packaging-distribution/contracts/repository-runtime-layout.md:274-284 | unheaded-block-28 | T N U L | ok | lineage needs-review (twin of 0877, distinct context and claim id); from-digest verified at 3baafff4d |
| current-0906 | unheaded-block | D | packaging-distribution/contracts/repository-runtime-layout.md:330-331 | unheaded-block-37 | T N U | ok |  |
| current-0911 | unheaded-block | D | packaging-distribution/contracts/setup-doctor-registry.md:141-164 | unheaded-block-21 | T N U | ok |  |
| current-0913 | unheaded-block | DC | packaging-distribution/contracts/setup-doctor-registry.md:168-200 | unheaded-block-22 | T N C | ok |  |
| current-0917 | unheaded-block | C | packaging-distribution/spec.md:201-201 | unheaded-block-43 | T N C | ok |  |
| current-0921 | unheaded-block | D | packaging-distribution/spec.md:459-459 | unheaded-block-80 | T N U | ok |  |
| current-0922 | unheaded-block | DC | packaging-distribution/spec.md:461-467 | unheaded-block-81 | T N C | ok |  |
| current-0926 | unheaded-block | C | packaging-distribution/spec.md:517-534 | unheaded-block-85 | T N C | ok |  |
| current-0928 | unheaded-block | D | packaging-distribution/spec.md:599-606 | unheaded-block-88 | T N U | ok |  |
| current-0931 | unheaded-block | D | packaging-distribution/spec.md:682-705 | unheaded-block-91 | T N U | ok |  |
| current-0932 | unheaded-block | C | packaging-distribution/spec.md:707-710 | unheaded-block-92 | T N C | ok |  |
| current-0934 | unheaded-block | C | packaging-distribution/spec.md:714-714 | unheaded-block-93 | T N C | ok |  |
| current-0935 | unheaded-block | C | packaging-distribution/spec.md:716-716 | unheaded-block-94 | T N C | ok |  |
| current-0936 | unheaded-block | C | packaging-distribution/spec.md:719-722 | unheaded-block-95 | T N C | ok |  |
| current-0941 | unheaded-block | D | packaging-distribution/spec.md:780-780 | unheaded-block-99 | T N U | ok |  |
| current-0945 | unheaded-block | C | packaging-distribution/verification/install-and-release-proof.md:165-165 | unheaded-block-20 | T N C | ok |  |
| current-0946 | unheaded-block | C | packaging-distribution/verification/install-and-release-proof.md:167-180 | unheaded-block-21 | T N C | ok |  |
| current-0949 | unheaded-block | C | platform-foundations.md:46-58 | unheaded-block-6 | T N C | ok |  |
| current-0955 | unheaded-block | C | platform-foundations.md:186-186 | unheaded-block-30 | T N C | ok |  |
| current-0957 | unheaded-block | D | platform-foundations.md:197-198 | unheaded-block-32 | T N U | ok |  |
| current-0964 | unheaded-block | D | platform-foundations.md:230-231 | unheaded-block-39 | T N U | ok |  |
| current-0973 | unheaded-block | D | platform-foundations.md:271-277 | unheaded-block-48 | T N U | ok |  |
| current-0980 | unheaded-block | D | platform-foundations.md:307-307 | unheaded-block-55 | T N U | ok |  |
| current-0981 | unheaded-block | D | platform-foundations.md:311-311 | unheaded-block-56 | T N U | ok |  |
| current-0985 | unheaded-block | D | platform-foundations.md:330-334 | unheaded-block-60 | T N U | ok |  |
| current-0994 | unheaded-block | C | platform-foundations.md:383-383 | unheaded-block-68 | T N C | ok |  |
| current-0995 | unheaded-block | C | platform-foundations.md:385-385 | unheaded-block-69 | T N C | ok |  |
| current-1029 | unheaded-block | C | proposals/README.md:60-61 | unheaded-block-9 | T N C | ok |  |
| current-1030 | unheaded-block | C | proposals/README.md:63-76 | unheaded-block-10 | T N C | ok |  |
| current-1031 | unheaded-block | C | proposals/README.md:78-82 | unheaded-block-11 | T N C | ok |  |
| current-1034 | unheaded-block | C | proposals/component-authority-boundary-map.md:429-431 | unheaded-block-53 | T N C | ok |  |
| current-1041 | unheaded-block | D | proposals/component-authority-boundary-map.md:470-489 | unheaded-block-60 | T N U | ok |  |
| current-1047 | unheaded-block | D | proposals/component-authority-boundary-map.md:538-559 | unheaded-block-66 | T N U | ok |  |
| current-1051 | unheaded-block | D | proposals/component-authority-boundary-map.md:592-592 | unheaded-block-70 | T N U | ok |  |
| current-1055 | unheaded-block | D | proposals/component-authority-boundary-map.md:634-645 | unheaded-block-74 | T N U | ok |  |
| current-1058 | unheaded-block | D | proposals/component-authority-boundary-map.md:655-656 | unheaded-block-77 | T N U | ok |  |
| current-1068 | unheaded-block | C | runner/README.md:66-68 | unheaded-block-9 | T N C | ok |  |
| current-1069 | unheaded-block | C | runner/README.md:70-70 | unheaded-block-10 | T N C | ok |  |
| current-1074 | unheaded-block | C | runner/architecture/h-69197b459754.md:91-91 | unheaded-block-12 | T N C | ok |  |
| current-1078 | unheaded-block | C | runner/architecture/h-7af1f0242611.md:31-45 | unheaded-block-4 | T N C | ok |  |
| current-1079 | unheaded-block | DC | runner/architecture/h-7af1f0242611.md:47-55 | unheaded-block-5 | T N C | ok |  |
| current-1083 | unheaded-block | C | runner/architecture/h-e53a3a9829a8.md:35-48 | unheaded-block-4 | T N C | ok |  |
| current-1084 | unheaded-block | D | runner/architecture/h-e53a3a9829a8.md:50-54 | unheaded-block-5 | T N U | ok |  |
| current-1087 | unheaded-block | C | runner/decisions/h-36d872fbb0e5.md:1757-1769 | unheaded-block-190 | T N C | ok |  |
| current-1090 | unheaded-block | C | runner/operations/h-51f5cd7279fd.md:456-467 | unheaded-block-26 | T N C | ok |  |
| current-1091 | unheaded-block | D | runner/operations/h-51f5cd7279fd.md:469-532 | unheaded-block-27 | T N U | ok |  |
| current-1095 | unheaded-block | C | runner/operations/h-51f5cd7279fd.md:664-721 | unheaded-block-33 | T N C | ok |  |
| current-1099 | unheaded-block | C | runner/operations/h-51f5cd7279fd.md:753-758 | unheaded-block-37 | T N C | ok |  |
| current-1103 | unheaded-block | C | runner/operations/h-51f5cd7279fd.md:783-812 | unheaded-block-40 | T N C | ok |  |
| current-1108 | unheaded-block | C | runner/spec.md:58-76 | unheaded-block-7 | T N C | ok |  |
| current-1113 | unheaded-block | C | runner/spec.md:160-214 | unheaded-block-13 | T N C | ok |  |
| current-1118 | unheaded-block | C | runner/subcomponents/h-6979005beaf7/spec.md:80-87 | unheaded-block-7 | T N C | ok |  |
| current-1120 | unheaded-block | D | runner/subcomponents/h-6979005beaf7/spec.md:164-164 | unheaded-block-35 | T N U | ok |  |
| current-1121 | unheaded-block | C | runner/subcomponents/h-6979005beaf7/spec.md:166-194 | unheaded-block-36 | T N C | ok | one false link hit: "](a)" is code-literal prose present in the base text too |
| current-1122 | unheaded-block | C | runner/subcomponents/h-6979005beaf7/spec.md:196-201 | unheaded-block-37 | T N C | ok |  |
| current-1125 | unheaded-block | C | system-architecture/architecture/architecture-intent.md:409-412 | unheaded-block-60 | T N C | ok |  |
| current-1126 | unheaded-block | C | system-architecture/architecture/architecture-intent.md:414-424 | unheaded-block-61 | T N C | ok |  |
| current-1127 | unheaded-block | C | system-architecture/architecture/architecture-intent.md:426-428 | unheaded-block-62 | T N C | ok |  |
| current-1131 | unheaded-block | DC | ui-spec/README.md:56-60 | unheaded-block-7 | T N C | ok |  |
| current-1132 | unheaded-block | C | ui-spec/README.md:62-62 | unheaded-block-8 | T N C | ok |  |
| current-1135 | unheaded-block | DC | work-state/README.md:38-46 | unheaded-block-4 | T N C | ok |  |
| current-1139 | unheaded-block | C | work-state/spec.md:1041-1094 | unheaded-block-93 | T N C | ok |  |
| current-0222 | heading | L | README.md:39-39 | 2-area-registry | T N U L | ok |  |
| current-0227 | heading | L | README.md:76-76 | 4-how-to-change-platform-docs | T N U L | ok |  |
| current-0233 | heading | L | agent-confinement/history/rollout-and-settled-facts.md:39-39 | 13-kết-quả-giải-quyết-rủi-ro-v | T N U L | ok |  |
| current-0238 | heading | L | agent-coordination/contracts/assignment-run-runresult.md:42-42 | assignment | T N U L | ok |  |
| current-0283 | heading | L | agent-coordination/contracts/workflow-stage-operation.md:25-25 | contract | T N U L | ok |  |
| current-0301 | heading | L | architecture-map.md:393-393 | component-live-1414-file-có-th | T N U L | ok |  |
| current-0303 | heading | L | architecture-map.md:414-414 | slice-live-tính-năng-xuyên-tần | T N U L | ok |  |
| current-0307 | heading | L | architecture-map.md:437-437 | 7-sổ-đăng-ký-contract | T N U L | ok |  |
| current-0311 | heading | L | component-boundary.md:1-1 | component-boundary | T N U L | ok |  |
| current-0315 | heading | DL | component-boundary.md:62-62 | 4-current-high-level-component | T N U L | ok |  |
| current-0318 | heading | D | component-boundary.md:86-86 | 5-how-to-change | T N U | ok |  |
| current-0320 | heading | L | component-boundary.md:94-94 | 6-related-files | T N U L | ok |  |
| current-0324 | heading | L | component-boundary.md:180-180 | 3-recommended-responsibility-c | T N U L | ok |  |
| current-0397 | heading | L | component-boundary.md:773-773 | 13-team-cognition-and-protocol | T N U L | ok |  |
| current-0838 | heading | L | host-invocation-routing/architecture/host-use-cases.md:44-44 | 4-related-files | T N U L | ok |  |
| current-0840 | heading | D | observe/decisions/observe-component-architecture.md:24-24 | 6-lịch-sử-quyết-định | T N U | ok |  |
| current-0841 | heading | DC | observe/decisions/observe-component-architecture.md:26-26 | 2026-10-16-store-lock-chuyển-s | T N C | ok |  |
| current-0846 | heading | L | observe/spec.md:34-34 | owns | T N U L | ok |  |
| current-0850 | heading | DL | observe/spec.md:58-58 | 3-storage-model | T N U L | ok |  |
| current-0854 | heading | DL | packaging-distribution/architecture/runtime-identity-and-activation.md:309-309 | 14-walking-skeleton | T N U L | ok |  |
| current-0859 | heading | L | packaging-distribution/contracts/activation-binding.md:122-122 | 6-workspaceactivationbinding | T N U L | ok |  |
| current-0865 | heading | L | packaging-distribution/contracts/instruction-composition-and-projection.md:34-34 | 2-boundary | T N U L | ok |  |
| current-0870 | heading | L | packaging-distribution/contracts/repository-runtime-layout.md:36-36 | 2-minimum-layout | T N U L | ok |  |
| current-0890 | heading | L | packaging-distribution/contracts/repository-runtime-layout.md:194-194 | 3-roots-and-on-disk-shape | T N U L | ok |  |
| current-0912 | heading | L | packaging-distribution/contracts/setup-doctor-registry.md:166-166 | setup | T N U L | ok |  |
| current-0916 | heading | L | packaging-distribution/spec.md:199-199 | 9-instruction-composition-and- | T N U L | ok |  |
| current-0920 | heading | L | packaging-distribution/spec.md:457-457 | retained-distribution-source-d | T N U L | ok |  |
| current-0925 | heading | L | packaging-distribution/spec.md:515-515 | data-dictionary | T N U L | ok |  |
| current-0929 | heading | L | packaging-distribution/spec.md:608-608 | business-rules | T N U L | ok |  |
| current-0933 | heading | L | packaging-distribution/spec.md:712-712 | lịch-sử-quyết-định | T N U L | ok |  |
| current-0937 | heading | D | packaging-distribution/spec.md:724-724 | edge-cases-settled | T N U | ok |  |
| current-0944 | heading | DC | packaging-distribution/verification/install-and-release-proof.md:163-163 | added-in-candidate-main-instal | T N C | ok |  |
| current-0948 | heading | DL | platform-foundations.md:44-44 | 3-law-summary | T N U L | ok |  |
| current-0952 | heading | L | platform-foundations.md:165-165 | l3-luật-store-truth-ở-jsonl-db | T N U L | ok |  |
| current-0993 | heading | C | platform-foundations.md:381-381 | added-in-candidate-main-projec | T N C | ok |  |
| current-1028 | heading | C | proposals/README.md:58-58 | added-in-candidate-candidate-c | T N C | ok |  |
| current-1033 | heading | L | proposals/component-authority-boundary-map.md:427-427 | 11-four-coordination-rings | T N U L | ok |  |
| current-1067 | heading | C | runner/README.md:64-64 | added-in-candidate-cross-area- | T N C | ok |  |
| current-1071 | heading | L | runner/architecture/h-69197b459754.md:25-25 | dispatch-operability-implement | T N U L | ok |  |
| current-1077 | heading | L | runner/architecture/h-7af1f0242611.md:29-29 | bảng-đối-chiếu-từ-vựng-dispatc | T N U L | ok |  |
| current-1081 | heading | L | runner/architecture/h-e53a3a9829a8.md:27-27 | guard-reconciliation | T N U L | ok |  |
| current-1086 | heading | L | runner/decisions/h-36d872fbb0e5.md:1755-1755 | 0064-hook-commit-để-lại-đèn-ho | T N U L | ok |  |
| current-1089 | heading | L | runner/operations/h-51f5cd7279fd.md:454-454 | gate-a-xếp-hạng-candidate-bắc- | T N U L | ok |  |
| current-1093 | heading | L | runner/operations/h-51f5cd7279fd.md:649-649 | phiên-checkout-đa-phiên-sessio | T N U L | ok |  |
| current-1096 | heading | L | runner/operations/h-51f5cd7279fd.md:723-723 | bảo-vệ-approve-khỏi-lồng-phiên | T N U L | ok |  |
| current-1101 | heading | L | runner/operations/h-51f5cd7279fd.md:775-775 | khóa-hoạt-động-cây-chính-chặn- | T N U L | ok |  |
| current-1106 | heading | L | runner/spec.md:54-54 | historical-source-section-552e | T N U L | ok |  |
| current-1111 | heading | L | runner/spec.md:156-156 | historical-source-section-4efe | T N U L | ok |  |
| current-1115 | heading | L | runner/subcomponents/h-6979005beaf7/spec.md:25-25 | business-rules | T N U L | ok |  |
| current-1124 | heading | L | system-architecture/architecture/architecture-intent.md:407-407 | 11-current-system-fit-and-conf | T N U L | ok |  |
| current-1130 | heading | C | ui-spec/README.md:54-54 | added-in-candidate-cross-area- | T N C | ok |  |
| current-1134 | heading | DL | work-state/README.md:36-36 | 2-read-first | T N U L | ok |  |
| current-1138 | heading | DL | work-state/spec.md:1039-1039 | 11-business-rules | T N U L | ok |  |
| current-0543 | file-block | DC | contracts/architecture-manifest.json:1-289 | file-block | T N C | ok | whole-file digest recomputed; JSON parses; removed manifest key src/runner/main-checkout-lock.mjs is absent at e6b7efeec (file deleted), added keys exist |

## 5. Rework items and observations

Rework items: none.

Observations (no change requested of the author for these sets):
1. current-0877: the comparator names the tuple `claim_c720bd70f59b11b1018475ef957bdfd2` / `repository-runtime-layout.md` / `unheaded-block-9` / `e6ea7ecd...` as "candidate union missing". The row is correctly bound; the open item belongs to the declared global-candidate-mismatch set and the A46 recorded open sets, to be closed in the Phase 9 accounting step. Its identical twin current-0897 (lines 274-284) is distinct by position, context and claim id.
2. Identical-text duplicates: two groups (current-0480/0485/0488/0491 and current-0877/0897). Occurrence is 1 in each because the content+context key already separates them; claim ids and anchors are distinct and match the file positions.
3. All 522+73+1 rows are native-candidate units of files that are `candidate/candidate` under `classifyDocumentStatus` and the inventory path classification at `e6b7efeec`. They are not on the candidate-unverified list by design (that list holds the 565 authored candidate-unverified claims); nothing in these sets was relabeled.
4. Predecessor identity: the 74 changed units carry new claim ids (origin `added-since-3baafff4d...`); their old claims sit in the displaced sets (disposition historical or "current text must be reviewed"), reviewed by the displaced-set reviewer, not here. No unit of these sets lost text relative to base: every deletion in the 32-file diff is a replacement that keeps the old fact in updated form (CTR010 to CTR011 renumber under A45, observe/activation/install lock rewrites, retired-engine table rows labelled historical).

Status: DONE
Summary: 199 deep reads (145 unheaded block, 53 heading, 1 file block), 199 ok and 0 rework (0% per set); auth exit 0 over 7,702 rows; independent digest recomputation matched all 596 rows of the three sets; only open item is the already-declared comparator row current-0877.
