# Step 3 wave 4d review, Part 01

Pin `ae141550c`; worktree `forgentX-s8-review` at `bb4b304e9`. Read-only. No checker or probe run. Every edge reviewed against the whole pinned source, the complete diff and the target passages.

## Verdicts

| # | File (short) | Set | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | `how-to-recover-a-blocked-item-with-fgos-catchup-from-inside/...-its-own-worktree.md` | batch-073 | patched-seeded | 4 | ok |
| 2 | `how-to-register-a-fixable-doctor-check-in-fgos/register-a-fixable-doctor-check-in-fgos.md` | batch-073 | unpatched-seeded | 6 | ok |
| 3 | `how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md` | batch-073 | patched-seeded | 3 | ok |
| 4 | `how-to-wait-out-a-genuinely-active-main-checkout-lock-holder/wait-out-an-active-main-checkout-lock-holder.md` | batch-073 | patched-seeded | 7 | ok |
| 5 | `produce-failing-test-first-proof-for-an-iron-law-gated-diff/...diff.md` | batch-074 | unpatched-seeded | 3 | ok |
| 6 | `spec-docs-drift-silently-when-only-the-code-has-an-exact-mat/...-match-test.md` | batch-074 | unpatched-seeded | 4 | ok |

Outcome defects: none.

## Per-file notes

1. maps-j-04403: patches `docs/specs/work-state.md` to `docs/platform/work-state/spec.md#11-business-rules`. The `## 11. Business Rules` heading exists. RUL33 (blocked to awaiting-approval, never through doing) and RUL34 exist there and match the sentence. maps-j-04404/04405/04406: patch targets (approve-diagnosis guide, merge-conflict catchup guide) exist at the pin, and their content matches each adjacent description. Both wrapped-path spans are rewritten whole, so the diff leaves no stale tail. No missed legacy reference.
2. All six edges preserve and the diff is empty. maps-j-04418, 04419, 04422 and 04423 point at `docs/history/...` files that exist. 04421 is the retained `docs/distribution-vision.md`. 04419 sits in a blockquote that quotes a code capture, so it is evidence. maps-j-04420 is a past-tense "deliberate reversal of `docs/specs/distribution.md`'s RUL9/RUL11" quoting the old rule text. The candidate packaging-distribution spec has since rewritten both rules (RUL9 is now "default path never writes", RUL11 is now "doctor --fix exists and is real"). A patch would therefore falsify the quoted old wording, so preserve with the successor note `docs/platform/packaging-distribution/spec.md` is truthful. See Q1.
3. maps-j-04474 preserves a retained `docs/history/` path. maps-j-04475 patches the elided 0021 decision file to `h-36d872fbb0e5.md#0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence`. The deleted file's own title is "0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence", so number and title match. Heading is at line 211 of the holder file. The adjacent "different-purpose, guards concurrent commits" text is not contradicted. maps-j-04476 patches to the clear-a-stuck-lock guide, which exists. The "stuck lock rather than destructive reset" description matches.
4. maps-j-04502, 04505, 04506 patch to the clear-a-stuck-lock guide. maps-j-04503 adds the anchor `#steps`; target `## Steps` item 3 is the "live-held refusal, check the lock's age" step that the source points to ("step 3"). The match is exact. maps-j-04504 is a blockquoted captured root-cause quote, preserved. maps-j-04507 and 04508 are `docs/history/` Related items that exist and stay literal.
5. maps-j-04539 preserves a real `docs/history/tsk-62v/iron-law-evidence.md`. maps-j-04540 preserves the `<id>` placeholder. maps-j-04541: the elided file `0028-doi-ten-orchestrator-thanh-launcher.md` was removed at `4722361ae` (confirmed). Its own title is "0028 — Đổi tên pinned term `orchestrator` thành `launcher`", which matches the only `### 0028` heading (`h-36d872fbb0e5.md` line 757). The successor note is correct. The sentence narrates a past event (the record was still uncommitted), so preserve is right.
6. maps-j-04551/04552 preserve past-event narration about the old Data Dictionary #7 row and the tsk-4y2 guard, each with the holder note. maps-j-04553 preserves a blockquoted verbatim commit message. maps-j-04554 preserves an existing `docs/history/.../plan.md`. The only other `distribution.md` occurrence (line 73) is a bare grep needle covered by a contextual exclusion; see Q2.

## Record-text notes (not rework)

- maps-j-04553 (file 6) quotes a verbatim commit message that names `docs/specs/distribution.md`. It carries no successor note, while 04551 and 04552 in the same file do. L12-40(1) says "with a successor note when a holder exists". Optional improvement; `docs/platform/packaging-distribution/spec.md` is the holder.
- maps-j-04419 and 04553 cite "L12-39(6) Document history" in their reasons, but the regions are blockquoted captured text, not a Document history heading. L12-40 is the right basis; the citation text is imprecise.
- maps-j-04418, 04421 and 04422 reasons say "retained source/provenance/illustrative convention" for what are plain retained-path citations. The edges are correct, only the boilerplate wording is loose.
- File 6 contextual exclusion for line 73 `distribution.md` says "resolved readings [docs/knowledge/.../distribution.md]" and "Bare code/config/artifact names are not unrelated legacy documents". The needle is the basename of a retiring doc, so the second sentence is loosely worded. See Q2.

## Lead-judgment questions

- Q1: maps-j-04420/04421 (file 2) and 04551/04552 (file 6) preserve `docs/specs/distribution.md` in live `docs/knowledge/**` prose. Reading them as past-event or quoted-old-text, as L12-38(1) and L12-41(2) allow, I judge preserve correct. The alternative is to patch to the holder, which would falsify what the passage quotes ("doctor --fix does not exist yet", "Data Dictionary #7 ... had no equivalent guard"). No change recommended.
- Q2: the bare needle `distribution.md` in "grepping `test/` for `distribution.md`" (file 6, line 73) is a completed-grep description. L12-40 calls such descriptions captured evidence. It could be recorded as a preserve edge rather than a contextual exclusion. Harmless either way. Not rework.

## Counts

| Set | Stratum | Reviewed in Part 01 | Rework |
|---|---|---:|---:|
| batch-073 | patched | 3 | 0 |
| batch-073 | unpatched | 1 | 0 |
| batch-073 (set total) | | 4 | 0 |
| batch-074 | patched | 0 | 0 |
| batch-074 | unpatched | 2 | 0 |
| batch-074 (set total) | | 2 | 0 |

Edges reviewed: 27 of 27 (4 + 6 + 3 + 7 + 3 + 4).

This Part 01 contributes 0 rework. Whole-set rework denominators depend on the other parts (Part 02: batch-074 patched gateway findings file and the batch-073 lead-ruling file).
