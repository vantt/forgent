# Step 4 wave 2 — independent A51 source-file review

Author input: `d4a07d57c4d146b482d4a9e632dc02d8df42af79`. Batches step04-017 through step04-033 in order; 94 canonical source records, 106 edge-bearing physical files, 291 frozen slots. Records only under L12-58: Phase 9 exact patch specifications and preserve/park joins; no source/render bytes applied. Dispositions: `{'preserve': 224, 'parked': 47, 'patch': 20}`.

Frozen inputs and per-record/payload hashes: `step-04-wave2-manifest.json`. Per-set seeds/ranks/threshold witnesses: `step-04-wave2-selection.json`. Actual payload sizes and output assignments: `step-04-wave2-review-index.json`. There are 17 parts; every part ≤60 joined slots and 400,000 UTF-8 bytes, including full source context and record/proof context. A streamed source has ONE logical file verdict across all its parts.

**Reviewers never run checker, probes, resolver or author scripts.** Lead starts fresh-context reviewers under A38; author has started/accepted none. Read the full assigned pinned source (included in payload), its complete record/diff, every mandatory provenance join, and independently read target passages from the same pin. Full target files are available through `git show <pin>:<target>`; continue through EOF where needed. Never treat census advisory labels or checker green as semantic acceptance.

A51 review unit is the source file. Per frozen set select ceil(15% of non-empty-diff files) by `sha256("A51-step04-file-v1" + NUL + pin + NUL + batch + NUL + source path)`, ascending hash then path, union every size/slot/prepared mandatory file. The inherited L12-34 unpatched stratum excludes already-selected mandatory files and uses the distinct recorded `-unpatched` seed. This request covers only the newly authored sets. Wave 1 retains custody of its root projections, 22 L12-10 controls and headerless witnesses; none of those earlier records/requests is rewritten. Every new mandatory source, changed binding and render join is included here. A file with any semantic correction counts once; ≤3% rework per set/stratum passes, >3% expands to EVERY file in that set (including preserve/park). Do not pool sets, replace sample members or silently reseed. Numerators/denominators remain null pending independent review.

L12-57 changed bindings in the authored sets are mandatory and have no carried approval. The six L12-44 Step 3 records and later overlap rebindings stay immutable until Step 7 atomic assembly (L12-58(1)); `step-04-l12-44-rebind-report.json` and `step-00-l12-57-tier2-population-drift.json` are required handoff references, not new accepted bindings in this wave. New records preserve portable CONTEXT/RESEARCH/DISCUSSION conventions. All ten supplemental slots in 032/033 are parked lead-ruling pending census admission, with exact tuples and no invented ids; these sets cannot close. The author has not admitted them to the accepted Step 2 census.

Additional uncensused wrapped 0026 decision references in the clarifying source and its two renders are recorded in `step-04-wave2-population-gaps.json`. They are not invented edge ids or admitted census records; review their included whole-file context and return admission/authoring to Lead. Frozen coverage remains 833 slots, not a claim that the earlier census contains these newly noticed occurrences.

No separate pair-accounting review parts: this wave changes plan reports only, per L12-58(4). Ordinary L12-11 committed-byte accounting and real runner author commit belong to Lead. No author commit id is guessed. No generator, installed-link, source/render determinism, Phase 9 application or post-commit reproduction acceptance is claimed.

Report each file as ok/rework, quote the exact source/target passage for findings, and identify source owner, disposition/target/anchor/diff consequence. Return unresolved product rulings to Lead while unrelated sets continue. Reviewer time is pending Lead allocation; no measured review throughput or approved remaining budget is invented. Author elapsed/proof and the stop boundary are in verification/progress.

| Part | Set | Files | Slots | Bytes | Payload | Reviewer output |
| --- | --- | ---: | ---: | ---: | --- | --- |
| 01 | step04-017 | 1 | 1 | 379790 | `step-04-wave2-p01.json` | `review-a38-step-04-wave2-p01.md` |
| 02 | step04-018 | 2 | 2 | 31335 | `step-04-wave2-p02.json` | `review-a38-step-04-wave2-p02.md` |
| 03 | step04-019 | 3 | 4 | 150403 | `step-04-wave2-p03.json` | `review-a38-step-04-wave2-p03.md` |
| 04 | step04-020 | 2 | 4 | 85134 | `step-04-wave2-p04.json` | `review-a38-step-04-wave2-p04.md` |
| 05 | step04-021 | 1 | 1 | 46456 | `step-04-wave2-p05.json` | `review-a38-step-04-wave2-p05.md` |
| 06 | step04-022 | 2 | 2 | 155681 | `step-04-wave2-p06.json` | `review-a38-step-04-wave2-p06.md` |
| 07 | step04-023 | 4 | 10 | 283607 | `step-04-wave2-p07.json` | `review-a38-step-04-wave2-p07.md` |
| 08 | step04-024 | 3 | 11 | 202508 | `step-04-wave2-p08.json` | `review-a38-step-04-wave2-p08.md` |
| 09 | step04-025 | 3 | 32 | 338429 | `step-04-wave2-p09.json` | `review-a38-step-04-wave2-p09.md` |
| 10 | step04-026 | 3 | 12 | 94779 | `step-04-wave2-p10.json` | `review-a38-step-04-wave2-p10.md` |
| 11 | step04-027 | 2 | 22 | 229634 | `step-04-wave2-p11.json` | `review-a38-step-04-wave2-p11.md` |
| 12 | step04-028 | 1 | 2 | 9586 | `step-04-wave2-p12.json` | `review-a38-step-04-wave2-p12.md` |
| 13 | step04-029 | 1 | 8 | 76128 | `step-04-wave2-p13.json` | `review-a38-step-04-wave2-p13.md` |
| 14 | step04-030 | 3 | 8 | 127522 | `step-04-wave2-p14.json` | `review-a38-step-04-wave2-p14.md` |
| 15 | step04-031 | 2 | 7 | 91386 | `step-04-wave2-p15.json` | `review-a38-step-04-wave2-p15.md` |
| 16 | step04-032 | 1 | 3 | 31458 | `step-04-wave2-p16.json` | `review-a38-step-04-wave2-p16.md` |
| 17 | step04-033 | 5 | 7 | 118150 | `step-04-wave2-p17.json` | `review-a38-step-04-wave2-p17.md` |

Per-set A51 accounting (`step-04-wave2-review-accounting.json` also carries exact seeds/ranks, threshold witnesses, byte/part and pending time/rework fields):

| Set | Files | Patched population / sample | Mandatory | Unpatched eligible / sample | Distinct selected | Parts / bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| step04-017 | 1 | 0/0 | 1 | 0/0 | 1 | 1/379790 |
| step04-018 | 9 | 0/0 | 0 | 9/2 | 2 | 1/31335 |
| step04-019 | 5 | 1/1 | 1 | 3/1 | 3 | 1/150403 |
| step04-020 | 2 | 1/1 | 0 | 1/1 | 2 | 1/85134 |
| step04-021 | 1 | 0/0 | 0 | 1/1 | 1 | 1/46456 |
| step04-022 | 7 | 0/0 | 1 | 6/1 | 2 | 1/155681 |
| step04-023 | 10 | 3/1 | 2 | 5/1 | 4 | 1/283607 |
| step04-024 | 8 | 0/0 | 2 | 6/1 | 3 | 1/202508 |
| step04-025 | 6 | 2/1 | 2 | 4/1 | 3 | 1/338429 |
| step04-026 | 16 | 3/1 | 0 | 13/2 | 3 | 1/94779 |
| step04-027 | 4 | 0/0 | 1 | 3/1 | 2 | 1/229634 |
| step04-028 | 2 | 0/0 | 0 | 2/1 | 1 | 1/9586 |
| step04-029 | 4 | 0/0 | 0 | 4/1 | 1 | 1/76128 |
| step04-030 | 8 | 1/1 | 0 | 7/2 | 3 | 1/127522 |
| step04-031 | 5 | 1/1 | 0 | 4/1 | 2 | 1/91386 |
| step04-032 | 1 | 0/0 | 1 | 0/0 | 1 | 1/31458 |
| step04-033 | 5 | 0/0 | 5 | 0/0 | 5 | 1/118150 |
