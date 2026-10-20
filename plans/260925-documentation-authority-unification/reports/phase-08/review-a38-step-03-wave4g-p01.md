# Review a38 step-03 wave 4g, Part 01

Reviewer: independent read-only semantic review. Pin `ae141550c2e022310de7a0efea757580c0b2479f`; worktree `/home/vantt/projects/forgentX-s8-review` (0d7121589). Records read through a per-field extractor (scratch `w-p01/ex.py`); every consumer read whole at the pin (all six are under 220 lines); targets and holders read at the pin. No checker or probe was run. Digests quoted are the records' own `digest` fields (equal to `inventoryFileDigest`).

## Verdicts

| # | File (docs/knowledge/...) | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | why-fgos-add-items-landed-.../why-fgos-add-defaulted-new-items-to-stage-executing-with-no-way-back.md (digest 1e88735e...) | batch-077 | unpatched-seeded | 2 (04719, 04720) | ok |
| 2 | why-fgos-checks-repo-invariants-.../why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md (45f94e96...) | batch-077 | patched-seeded | 3 (04730-04732) | ok |
| 3 | why-fgos-coding-planning-s-mode-gate-.../why-fgos-planning-moved-mode-gate-to-fgos-routing.md (28d6d89b...) | batch-077 | patched-seeded | 3 (04745-04747) | ok |
| 4 | why-fgos-coding-planning-writes-docsref-.../why-fgos-coding-planning-writes-docsref-when-it-self-creates-a-feature-dir.md (5cdead6f...) | batch-077 | unpatched-seeded | 7 (04748-04754) | ok |
| 5 | why-fgos-install-moved-.../why-fgos-install-is-pinned-to-a-semver-tag-instead-of-main-head.md (b29c111e...) | batch-078 | patched-seeded | 2 (04784, 04785) | ok |
| 6 | why-fgos-main-checkout-lock-.../main-checkout-lock-toctou-race.md (5719baf6...) | batch-078 | patched-seeded | 3 (04794-04796) | ok |

Total 6 files / 20 edges reviewed; 0 outcome defects, 0 rework.

## Evidence per file

1. 04719/04720: both `docs/history/<x>/CONTEXT.md` citations ("Full decision record") exist at the pin and `docs/history` is a retained root; preserve is right. Legacy scan (0 candidates) agrees with a full read: no other legacy path in the file. Empty diff is consistent.
2. 04730: `docs/architecture-manifest.json` in a past-tense incident narration (the `tsk-1m0` regression); preserve is consistent with the 12 other records of this expression (all preserve). 04731 preserve of the retained history record. 04732 patch to `docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md`: the old `docs/how-to/...` path is absent at the pin, the holder exists (registry alias), and the gloss "the existing manual playbook this item's fix now partially automates" is true for that guide (L12-42 / sibling patches). Diff replaces exactly that one path, same line shape.
3. 04745 patch to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, anchor `0025-thứ-tự-ưu-tiên-sản-phẩm-chi-tiết-hoá-0023-nạp-always-loaded-qua-agentsmd`. Verified heading `### 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md` at the pin, and that the 0025 section holds both Ship Faster and the "Làm rõ phạm vi" scope note (speed of the project using fgOS, not fgOS's own build speed) that the source's "that decision's own scope note" names. This matches the 04745 check in the request: both claims sit under 0025, not the later 0030. Slug transform is correct (`/` and `.` removed). Diff is the single code span, bare "(0025)" on line 73 is not an edge (L12-38(7)). 04746 preserve (never-existed Source path in a provenance line) and 04747 preserve (exists): see Lead note 1. No further legacy references.
4. Seven preserves, no diff. 04748/04749/04752/04754 are `<feature>`/`<id>` placeholders under retained `docs/history`. 04750 (wrapped path `.../tsk-49i-iron-law-port-followup-audit/\nplan.md`, never existed, no name-drift holder under docs/history, past-tense incident narration) correct. 04751 is inside the fenced captured error output (L12-40). 04753 is the past-event workaround naming an existing path. No unlisted reference (`.agents/skills/...`, `src/...` are not legacy docs).
5. 04784 preserve: the quoted words attributed to `docs/specs/distribution.md` ("no tagged or pinned release exists yet") are a past-event quotation (L12-42(3), as 04420/04421); successor note `docs/platform/packaging-distribution/spec.md` exists at the pin. 04785 patch to `docs/knowledge/how-to-cut-a-fgos-release-tag/cut-a-fgos-release-tag.md`: old path absent at pin, holder exists and is a manual owner-initiated tag procedure, so "runbook ... left tag-cutting manual (D1)" stays true. Root `README.md` mentions correctly excluded as the repo-root README.
6. 04794 preserve (exists, retained history). 04795 patch to the clear-a-stuck-lock guide: holder covers lock-held/lock-ambiguous, corrupt-content reclaim and live-holder refusal, so the gloss "recovery path for a genuinely AMBIGUOUS lock" holds. 04796 patch to runner decisions heading `0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence`: elided deleted filename `0021-wire-main-checkout-hook-qua-doctor-setup.md` resolves uniquely by number and slug fragment (L12-41), anchor slug correct, Context cites the STR65 concurrent-writer class, so the gloss is true.

## Outcome defects

None.

## Record-text notes (not rework)

- 04730 reason says "tree retires at Phase 9" for `docs/architecture-manifest.json`, which is a root authority (frozen area map places it to `docs/platform/contracts/architecture-manifest.json`), not a `docs/specs`/`docs/architect` tree. The preserve is right; the wording is imprecise. Same wording appears in the earlier records of that expression.
- 04746 preserve carries no pointer to the name-drifted holder `docs/history/fgos-planning-mode-gate-and-gate-traceability/CONTEXT.md` (pre-rename spelling, exists at the pin). Not required for a preserve; an optional record-only successor note would help Step 4/Phase 10 readers.
- 04784 successor note names `docs/platform/packaging-distribution/spec.md`; that holder does not contain the quoted "no tagged or pinned release exists yet" text. Acceptable for a non-executable successor (04553 precedent), just not a verbatim holder of the quote.
- 04730's reason text prefaces a preserve with "Preserve retained source/evidence or illustrative writer convention" boilerplate; the true role (dated incident narration) is only implicit.

## Lead-judgment questions

1. 04746 (and 04747): a `**Source:**` provenance line citing a path that never existed in the pin ancestry, in a live-class `docs/knowledge` file. Preserved as provenance, consistent with accepted batch-075 04615 (identical shape, no holder). But 04595/04693 (live pointers with a name-drifted holder) park dead-link with a successor note. Here a name-drifted holder does exist. I judge preserve correct (Source lines are lineage, L12-34(4)) and consistent with 04615; flagging only so the Lead can confirm the provenance-vs-pointer line is applied uniformly in later waves.

## Accounting (Part 01 only)

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-077 patched-seeded | 2 files (2 and 3) | 0 |
| batch-077 unpatched-seeded | 2 files (1 and 4) | 0 |
| batch-078 patched-seeded | 2 files (5 and 6) | 0 |
| batch-078 unpatched-seeded | 0 (none assigned here) | 0 |
| Part total | 6 files / 20 edges | 0 |

The batch-077 open-Lead supplement (04741-04744, file in Part 02) is not in this part.
