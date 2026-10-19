# Step 3 pilot round 2, semantic review g01

Pin `ae141550c`, worktree read-only at `d7c4a0cba`. Read: the r2 request g01 section, A51, L12-26, L12-30, the round-1 g01 review, and all six g01 records. Every consumer file was grepped at the pin for legacy-root tokens to confirm that edges cover them all.

I read `docs/reading-map.md` lines 14-20, 34-37, 78-86, 120-126 and 135-184 at the pin. I read the rest of the file only as far as the record diff covers it. The other five files are small and I read their legacy-token lines plus the passages around them.

Target passages read at the pin:
- `packaging-distribution/spec.md`: §3.3, §6 and §9.
- `agent-confinement/spec.md`: §9.2 and the §13 headings.
- `work-state/spec.md`: headings, RUL10, RUL45 and RUL60.
- `work-state/contracts/cli-io-contract.md`: headings.
- `runner/subcomponents/h-6979005beaf7/spec.md`: RUL53, RUL84, RUL89 and RUL93.
- `runner/decisions/h-36d872fbb0e5.md`: the 0005 section, including its D3/D4 text.
- Candidate headers: `claude-plugin`, `observe`, `herdr-web-dashboard`, `decision-citation-drift`, `system-architecture` architecture-intent and architect-readme, `domainization`, and `documentation-system-design`.
- The doc-registry entry for the herdr layout document.

I ran the resolver once, for 07998. It confirmed the registry alias hit and the successor path.

## Per-file verdicts

### batch-001

`docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` — batch-001 — **ok**
- Round-1 defects 07239 (false reason, unrelated GAP-01) are fixed.
- 07239 is patched to `docs/platform/packaging-distribution/spec.md#9-instruction-composition-and-projection`.
  - §9 at line 201 states the RUL102 boundary: composition and registry belong to the Agent Context Engine, and packaging owns discovery, install, rendering and health.
  - The description "Agent Context Engine (RUL102, ...)" stays true for the new target.
  - The "RUL102," locator text is retained.
  - GAP-01 is no longer cited.
  - The §9-to-contract mutual pointer is not a self-reference, so I accept it.
- 07240 is preserved. `docs/architecture-manifest.json` exists, and the reason states that fact.
- The record diff shows only the line 39 hunk and matches the record.

### batch-002

`README.md` — **ok**
- Records 00001..00003 preserve retained how-to and explanation paths. They exist at the pin, and the alias table is empty.
- The diff is empty, so the file is byte-identical.

`docs/doc-governance.md` — **ok**, with Lead question Q1.
- Preserves 01902, 01903, 01907 and 01908 are correct.
- 01905 and 01906 form one shared row flip for the "During migration…" paragraph. The replacement text is post-flip, names the retained switchboard, and keeps the original until cutover.
- 01904 (Related list) and 01909 (the "source design discussion" row):
  - Both now record the carriage fact: candidate `documentation-system-design.md` declares "Source snapshot retained" and is not a patch target. The reason wording is a round-1 non-blocking defect, now fixed.
  - Preserve is acceptable. Line 475 is a "source …" provenance cell under L12-26(8), and the plain-navigation question for line 20 is in Q1.

`docs/platform-foundations.md` — **ok**
- 05086..05090 are retained distillery paths and globs.
- 05091 is preserved with the factual reason "target never existed in Git ancestry". `git log -S` and the add-filter on `docs/history/phase-3-compound-learning` return nothing outside the plan's own record commits.
- The passage is a dated "Claimed. F4 — 2026-07-16" evidence line, so preserve is correct under L12-30(5).
- Round-1 note on 05091 is fixed.

`docs/routing-handoff-contract.md` — **ok**
- Round-1 defect 08056 is fixed. It is patched to `runner/decisions/h-36d872fbb0e5.md#0005-runner-cô-lập-worker`. Section 0005 exists and contains the D3/D4 text (`per D3`, `per D4`). The "ADR-0005 … D3/D4" label stays true.
- 08053 patches to `docs/platform/work-state/spec.md`. The "(schema work)" gloss is true because §3 is the Work Item Data Dictionary.
- 08054 patches to `agent-confinement/spec.md` §9.2, the hostRead-blind section, and keeps the §9.2 text.
- 08052 and 08055 preserve the retained `docs/platform-foundations.md`.
- Diff hunks match their records.

`docs/reading-map.md` — **ok**, with Lead question Q2. 89 edges: 34 patch, 16 parked, 7 row-flip, 32 preserve. This matches the claimed 34/16/7/32.

Round-1 defects confirmed fixed:
- 08010 and 08033: bare runner pointers are patched to `runner/spec.md`.
- 08008, 08009, 08016 and 08017: RUL53, RUL93, RUL89 and RUL84 are patched to `h-6979005beaf7/spec.md`.
  - The four rules sit at lines 90, 187, 183 and 178.
  - The `#added-in-candidate-runner-business-rules` anchor is that file's H1 slug. Weak, but valid.
- 07994 and 08031: patched to `work-state/spec.md#11-business-rules`. `## 11. Business Rules` exists at line 1039, RUL45 at 1077 and RUL60 at 1089.
- 07992 and 07993: patched to `cli-io-contract.md` §3 (unified envelope) and §7 (verb registry).
- 07995: patched to `runner/spec.md`. This is a gloss pointer.
- 07996: patched to `claude-plugin/spec.md`. The header "Carriage only" is candidate status, not a snapshot header.
- 07985: patched to `decision-citation-drift/spec.md`.
- 07998: patched to the registry successor under `docs/knowledge/…`. The target exists, and the doc-registry alias is verified by the resolver.
- 07977: patched to `packaging-distribution/spec.md#33-dev-checkout-channel`. §3.3 documents `source …/scripts/fgos-shell-integration.sh`, so the translated heading is correct and the §Dev-checkout label text stays.
- 07979: parked on a real "description needs rewrite" blocker.
  - The source says "legacy spec", and a path-only patch would leave that gloss false.
  - The park names live §6 "Doctor, Fix, And Legacy Setup" and `contracts/setup-doctor-registry.md`.
  - The witness shows alias-table and registry both with 0 matches.
- 07981, 08028 and 08029: parked on P8-DOC-GAP-02.
  - The only live hits are the switchboard row and `knowledge-registry-redesign.md` citations, which are not holders.
  - This is a real blocker, not boilerplate.
- 08013: parked.
  - The only holder is `system-architecture/history/architect-readme.md`, a "Document type: History" carriage file.
  - The live hits are history and proof logs.
- 08015: parked.
  - `domainization/architecture/domainization.md` declares "Source snapshot retained".
  - It is the only holder.
- 08014: parked with 08015.
  - The architecture-intent candidate is a whole-source carriage ("Preserve the complete … source", "current source remains docs/architect/architecture-intent.md").
  - L12-30(3) pairs it with domainization.
  - The only live hit is its own provenance line.
- 08019: parked on "5 tệp" description. The source lists files such as `host-invocation-provider-routing.md` that are absent from the candidate directory, which has different names.
- 08018: parked, and aligned with its specs-map twin 08193. Both park on "description needs rewrite".
- 08012: parked.
  - The §13.1 recipe holder is `agent-confinement/history/rollout-and-settled-facts.md`, carriage.
  - Live spec has §13.2 but no §13.1, and the `private-home` live hits are unrelated.
- 08011: patched to `agent-confinement/spec.md`. This is the first occurrence on line 159, which is the initial pointer. The second occurrence is the parked 08012, so the line is mixed until Phase 9 carry, which is acceptable.
- 07958..07961 are status-only row flips. All four directory paths are kept; only the lead-in sentence changes.
- 07955 is a Phase 9 row flip for the `docs/specs/<area>.md` migration template sentence.
- 07969 and 07970 are one row flip for line 135, the "legacy/generated-curated … during migration" claim.
- 07972 and 08003 park the `docs/specs/` tree descriptions on whole-row rewrite.
- 07984 parks `docs/specs/*.md` (checker scan scope) on Step 5 default-root parity, per L12-30(8).
- 07965 parks the curated projection on GAP-02.
- Preserves 08037 and 08038 (line 181): the source itself says "path not present at this commit" inside a truth-correction. The target never existed in history, and this is a history passage.
- Line 19 and line 124 preserve `docs/specs/reading-map.md`. Line 124 is "Merged from" lineage, and line 19 would point at the consumer's own successor.

## New defects
None, no file needs rework.

## Lead-judgment questions
- **Q1.** Preserve reasons use "retained path exists at author pin" for paths under `docs/specs/**` and `docs/architect/**`, which Phase 9 step 6 deletes.
  - Affected edges: 07953, 07963, 01902, 01904 and 01909.
  - The statement is true at the pin, but the path is not retained after cutover.
  - For lineage cells (01902, 01909, 07963, 07953) preserve is correct.
  - 01904 is a header "Related:" entry that is not obviously lineage.
  - Options:
    - Accept as lineage.
    - Reword the reason to "exists at pin, retires with its root at Phase 9".
    - Park 01904 on "only holder is carriage".
  - I recommend rewording only, with no disposition change. This is non-blocking and does not change any diff.
- **Q2.** The `#added-in-candidate-runner-business-rules` anchor is the H1 of `h-6979005beaf7/spec.md`, not a rule heading. RUL53, RUL84, RUL89 and RUL93 sit in the `## Business Rules` section of the same file. The anchor is valid and the rule text is retained in the label. Using `#business-rules` would be more precise, but it is a stylistic choice.

## Locator flags (g01)
- 07977: confirmed.
- 07998: confirmed. The "decision 0014" mention is a separate non-path token.
- 08011: confirmed.
- 08056: confirmed. The D3/D4 labels are present in the ADR section.

## Denominators
| Set | Files reviewed | Rework |
|---|---|---|
| batch-001 | 1 | 0 (0%) |
| batch-002 | 5 | 0 (0%) |

Status: DONE
Summary: All six g01 files are ok under L12-30, and every round-1 defect is confirmed fixed. Two non-blocking Lead questions remain: wording of "retained path exists" for retiring roots, and the business-rules anchor choice.
