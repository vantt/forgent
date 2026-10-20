# Step 4 wave 1 — independent A51 source-file review

Author input: `ef62747ddb0952d3cf1a3558f5ea650e77fcbe7e`. Batches step04-001 through step04-016 in order; 174 canonical source records, 203 edge-bearing physical files, 542 frozen slots. Records only under L12-58: Phase 9 exact patch specifications and preserve/park joins; no source/render bytes applied. Dispositions: `{'preserve': 470, 'patch': 46, 'parked': 26}`.

Frozen inputs and per-record/payload hashes: `step-04-wave1-manifest.json`. Per-set seeds/ranks/threshold witnesses: `step-04-wave1-selection.json`. Actual payload sizes and output assignments: `step-04-wave1-review-index.json`. There are 21 parts; every part ≤60 joined slots and 400,000 UTF-8 bytes, including full source context and record/proof context. A streamed source has ONE logical file verdict across all its parts.

**Reviewers never run checker, probes, resolver or author scripts.** Lead starts fresh-context reviewers under A38; author has started/accepted none. Read the full assigned pinned source (included in payload), its complete record/diff, every mandatory provenance join, and independently read target passages from the same pin. Full target files are available through `git show <pin>:<target>`; continue through EOF where needed. Never treat census advisory labels or checker green as semantic acceptance.

A51 review unit is the source file. Per frozen set select ceil(15% of non-empty-diff files) by `sha256("A51-step04-file-v1" + NUL + pin + NUL + batch + NUL + source path)`, ascending hash then path, union every size/slot/prepared mandatory file. The inherited L12-34 unpatched stratum excludes already-selected mandatory files and uses the distinct recorded `-unpatched` seed. All root source/projection boundaries, all L12-10 controls and all 17 headerless witnesses are mandatory. A file with any semantic correction counts once; ≤3% rework per set/stratum passes, >3% expands to EVERY file in that set (including preserve/park). Do not pool sets, replace sample members or silently reseed. Numerators/denominators remain null pending independent review.

L12-57 changed bindings in the authored sets are mandatory and have no carried approval. The six L12-44 Step 3 records and later overlap rebindings stay immutable until Step 7 atomic assembly (L12-58(1)); `step-04-l12-44-rebind-report.json` and `step-00-l12-57-tier2-population-drift.json` are required handoff references, not new accepted bindings in this wave. L12-10 control payloads include all 22 complete files and their named CONTEXT/RESEARCH/DISCUSSION companions. The two executable headerless cases are mandatory ownership witnesses only; their behavior remains Step 5.

No separate pair-accounting review parts: this wave changes plan reports only, per L12-58(4). Ordinary L12-11 committed-byte accounting and real runner author commit belong to Lead. No author commit id is guessed. No generator, installed-link, source/render determinism, Phase 9 application or post-commit reproduction acceptance is claimed.

Report each file as ok/rework, quote the exact source/target passage for findings, and identify source owner, disposition/target/anchor/diff consequence. Return unresolved product rulings to Lead while unrelated sets continue. Reviewer time is pending Lead allocation; no measured review throughput or approved remaining budget is invented. Author elapsed/proof and the stop boundary are in verification/progress.

| Part | Set | Files | Slots | Bytes | Payload | Reviewer output |
| --- | --- | ---: | ---: | ---: | --- | --- |
| 01 | step04-001 | 3 | 26 | 178187 | `step-04-wave1-p01.json` | `review-a38-step-04-wave1-p01.md` |
| 02 | step04-002 | 4 | 31 | 209850 | `step-04-wave1-p02.json` | `review-a38-step-04-wave1-p02.md` |
| 03 | step04-003 | 7 | 9 | 102565 | `step-04-wave1-p03.json` | `review-a38-step-04-wave1-p03.md` |
| 04 | step04-004 | 6 | 8 | 73480 | `step-04-wave1-p04.json` | `review-a38-step-04-wave1-p04.md` |
| 05 | step04-005 | 2 | 17 | 92012 | `step-04-wave1-p05.json` | `review-a38-step-04-wave1-p05.md` |
| 06 | step04-006 | 3 | 5 | 66176 | `step-04-wave1-p06.json` | `review-a38-step-04-wave1-p06.md` |
| 07 | step04-007 | 2 | 2 | 298913 | `step-04-wave1-p07.json` | `review-a38-step-04-wave1-p07.md` |
| 08 | step04-008 | 15 | 31 | 226258 | `step-04-wave1-p08.json` | `review-a38-step-04-wave1-p08.md` |
| 09 | step04-009 | 3 | 27 | 233369 | `step-04-wave1-p09.json` | `review-a38-step-04-wave1-p09.md` |
| 10 | step04-009 | 1 | 24 | 177390 | `step-04-wave1-p10.json` | `review-a38-step-04-wave1-p10.md` |
| 11 | step04-010 | 1 | 0 | 224733 | `step-04-wave1-p11.json` | `review-a38-step-04-wave1-p11.md` |
| 12 | step04-010 | 1 | 0 | 81162 | `step-04-wave1-p12.json` | `review-a38-step-04-wave1-p12.md` |
| 13 | step04-010 | 1 | 36 | 154633 | `step-04-wave1-p13.json` | `review-a38-step-04-wave1-p13.md` |
| 14 | step04-011 | 1 | 15 | 218216 | `step-04-wave1-p14.json` | `review-a38-step-04-wave1-p14.md` |
| 15 | step04-012 | 4 | 22 | 222988 | `step-04-wave1-p15.json` | `review-a38-step-04-wave1-p15.md` |
| 16 | step04-013 | 1 | 2 | 14742 | `step-04-wave1-p16.json` | `review-a38-step-04-wave1-p16.md` |
| 17 | step04-014 | 1 | 1 | 10387 | `step-04-wave1-p17.json` | `review-a38-step-04-wave1-p17.md` |
| 18 | step04-015 | 2 | 11 | 136002 | `step-04-wave1-p18.json` | `review-a38-step-04-wave1-p18.md` |
| 19 | step04-016 | 2 | 4 | 60919 | `step-04-wave1-p19.json` | `review-a38-step-04-wave1-p19.md` |
| 20 | L12-10-mandatory-controls | 22 | 43 | 329663 | `step-04-wave1-p20.json` | `review-a38-step-04-wave1-p20.md` |
| 21 | L12-58-Step5-source-witnesses | 2 | 4 | 17422 | `step-04-wave1-p21.json` | `review-a38-step-04-wave1-p21.md` |

Per-set A51 accounting (`step-04-wave1-review-accounting.json` also carries exact seeds/ranks, threshold witnesses, byte/part and pending time/rework fields):

| Set | Files | Patched population / sample | Mandatory | Unpatched eligible / sample | Distinct selected | Parts / bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| step04-001 | 9 | 1/1 | 0 | 8/2 | 3 | 1/178187 |
| step04-002 | 6 | 1/1 | 2 | 3/1 | 4 | 1/209850 |
| step04-003 | 44 | 0/0 | 0 | 44/7 | 7 | 1/102565 |
| step04-004 | 40 | 0/0 | 0 | 40/6 | 6 | 1/73480 |
| step04-005 | 9 | 0/0 | 0 | 9/2 | 2 | 1/92012 |
| step04-006 | 19 | 0/0 | 0 | 19/3 | 3 | 1/66176 |
| step04-007 | 2 | 0/0 | 1 | 1/1 | 2 | 1/298913 |
| step04-008 | 15 | 0/0 | 15 | 0/0 | 15 | 1/226258 |
| step04-009 | 4 | 2/1 | 4 | 0/0 | 4 | 2/410759 |
| step04-010 | 1 | 1/1 | 1 | 0/0 | 1 | 3/460528 |
| step04-011 | 1 | 0/0 | 1 | 0/0 | 1 | 1/218216 |
| step04-012 | 15 | 1/1 | 1 | 13/2 | 4 | 1/222988 |
| step04-013 | 2 | 0/0 | 0 | 2/1 | 1 | 1/14742 |
| step04-014 | 1 | 0/0 | 0 | 1/1 | 1 | 1/10387 |
| step04-015 | 4 | 2/1 | 0 | 2/1 | 2 | 1/136002 |
| step04-016 | 2 | 0/0 | 1 | 1/1 | 2 | 1/60919 |
