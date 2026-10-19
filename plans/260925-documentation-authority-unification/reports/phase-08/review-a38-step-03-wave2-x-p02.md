# Step 3 wave 2 expansion review, Part 02 (batch-037, 6 files, 11 edges)

Reviewer read every source file whole at ae141550c and every record field (disposition, target, anchor, reason, categories, diff). Target and holder existence was checked with git at the pin and against docs/doc-registry.json. No checker or probe script was run.

## Summary

| Set | Reviewed files | Rework files | Edges reviewed | Edge outcome defects |
|---|---:|---:|---:|---:|
| batch-037 (full-set-expansion) | 6 | 2 | 11 | 2 (plus 1 judgment) |

Stratum split: files 1-4 have empty diffs (preserve only), file 5 is patched, file 6 has zero edges.

## Per file

### 1. docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md
Verdict: **rework**. 3 edges reviewed. The whole file was read (184 lines) and the legacy-path scan found nothing beyond these 3 edges.

- **maps-j-04596 (source L88), wrong disposition.**
  - The source reads "Theo mẫu `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`: thêm một item chore...". This is a live present-tense instruction to follow a template.
  - The record preserves it with "never existed in author-pin ancestry" and the boilerplate "retained citation/convention spelling".
  - The cited path never existed. A live holder exists, though. It is `docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md`, and it is the same document: title "How to smoke-test fgos-coding-implement with a trivial verify=true item", registry topicId contains "coding".
  - The spelling drifted from "coding" to "code" in the filename. The registry aliases list only the "executing" and "code" spellings, not this exact "coding" path.
  - Rule: L12-30(5), L12-31(3), L12-26 class 2 (name drift). Live navigation to a never-existing path must not be preserved.
  - Correction: patch to that knowledge file (Phase 9, whole-file; the label is a path). The fallback is a dead-link park with the holder named as a successor note. Either way the "retained citation" preserve is wrong.
- **maps-j-04595 (L54): Lead-judgment question, not counted as a defect.**
  - The path `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md` never existed.
  - The directory `docs/history/rename-fgos-executing-to-fgos-code-implement/` exists with CONTEXT.md. This is the same "coding" vs "code" drift.
  - The citation is an evidence pointer for a past event ("bắt được ở vòng dispute thứ tư của tsk-f38"), with no date marker. Under L12-30(5) an example or history citation is preserved. Under L12-31(3) only an explicit dated past-action marker is preserved.
  - Question: is this an undated historical evidence citation (preserve plus a successor note naming the "code" directory), or live pointer navigation (patch to the existing directory)?
  - Whichever way it goes, the record text is a notable gap. It says nothing about the real successor, and the reason is generic.
- maps-j-04597 (L168-169, wrapped path): OK. docs/history/judge-verify-check-missing-stage-context/CONTEXT.md exists at the pin. The wrapped span matches.

### 2. docs/knowledge/why-a-repo-that-only-installs-fgos-as-a-claude-code-plugin-g/why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md
Verdict: **ok**. 2 edges reviewed. The whole file was read.

- maps-j-04625 (`docs/distribution-vision.md`, wrapped L80-81): preserve is correct. The path exists and is not a retiring tree.
- maps-j-04626 (`docs/specs/distribution.md`): preserve with a successor note is acceptable. The sentence is a dated explanation (tsk-32b, reproduced 2026-08-12) of a completed fix: "now state the posture... before this fix ... after, a plugin-only install works too". The successor note `docs/platform/packaging-distribution/spec.md` does hold the plugin-only posture (rows 4b and L192).
  - The two edges sit in one sentence, and both preserve, so unit consistency holds.
  - See question Q2 below.

### 3. docs/knowledge/why-a-work-item-title-s-object-action-scope-rule-lives-in-th/title-semantic-contract-lives-in-submitting-skills.md
Verdict: **ok**. 2 edges reviewed. The whole file was read.

- maps-j-04641 and maps-j-04642: both cite docs/history/work-item-title-contract/ and its CONTEXT.md. Both exist at the pin and are retained history, so preserve is correct. No other legacy reference is in the file.

### 4. docs/knowledge/why-docs-enduser-docs-index-json-needed-a-doctor-check-not-j/why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md
Verdict: **rework**. 3 edges reviewed. The whole file was read.

- **maps-j-04693 (L93), wrong disposition.**
  - The source is a body `## Related` list entry: "`docs/history/tsk-1m0/plan.md` — full plan and locked decisions."
  - The path never existed. `docs/history/tsk-1m0/` contains only `iron-law-evidence.md`.
  - Under L12-37(1) and L12-34(4), a body Related list is navigation. A never-existing target in live navigation must not be preserved (L12-31(3)).
  - A live holder exists: `docs/history/doctor-check-enduser-docs-index-stale/plan.md`. Its H1 is "plan: enduser-docs-index-stale doctor check + fix (tsk-1m0)", so it is the plan for tsk-1m0. CONTEXT.md in the same directory carries the same tsk-1m0 label.
  - Correction: patch the Related entry to that plan.md (Phase 9, whole-file). The fallback is a dead-link park with a successor note. The current "retained citation" preserve is wrong.
- maps-j-04692 (wrapped L82-83) and maps-j-04694 (L96): OK. docs/history/compound-learn-artifact-registry/DISCUSSION.md exists at the pin. Both preserve, which is consistent.

### 5. docs/knowledge/why-fgos-coding-driving-s-pick-through-approve-skills-instru/why-skill-prose-had-to-match-the-worktree-isolated-environment-it-runs-in.md
Verdict: **ok**. 1 edge reviewed. The whole file was read.

- maps-j-04735 (L75), patch: OK.
  - The registry alias maps `docs/explanation/why-createdetachedmergeworktree-crashed-for-session-driven-roots.md` to the exact knowledge file used as the target, so the disposition is correct.
  - Anchor `the-same-root-cause-one-call-site-earlier-tsk-5zg` equals the heading "The same root cause, one call site earlier (`tsk-5zg`)" in the target (L71). That section holds the claim "approve crashing with a raw git fatal error".
  - The diff keeps the "see `...`" backtick form and appends the anchor. The adjacent description is true for the target section.
  - The diff is a single hunk at L75, correct.

### 6. docs/knowledge/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal/why-fgos-discover-embeds-repo-layout-in-its-verify-proposal-prompt.md
Verdict: **ok**. 0 edges. The whole file was read (93 lines) and holds no legacy doc path. `dogfood-fixture/` paths are fixture directories, not legacy roots. The empty edge set and empty diff are correct.

## Outcome defects

| edgeId | Source line | Rule | Correction |
|---|---:|---|---|
| maps-j-04596 | 88 | L12-30(5), L12-31(3), L12-26 class 2 | Preserve to a never-existing live-navigation path is wrong. Patch to `docs/knowledge/how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md` (Phase 9), or park as a dead link with that successor. |
| maps-j-04693 | 93 | L12-37(1), L12-34(4), L12-31(3) | Patch the Related entry to `docs/history/doctor-check-enduser-docs-index-stale/plan.md` (Phase 9), or park as a dead link with that successor. |

## Record-text notes (not rework)

- The three "never existed" preserves (04595, 04596, 04693) use the same boilerplate "Preserve retained citation/convention spelling". It is false for a path that never existed, and it names no successor.
- 04595 should name the existing `rename-fgos-executing-to-fgos-code-implement` directory as a non-executable successor note if it stays a preserve.

## Lead-judgment questions

- **Q1.** Is the citation at maps-j-04595 (L54, `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md`) a preserved historical evidence citation or live navigation that needs a patch? See file 1.
- **Q2.** For maps-j-04626, the sentence "docs/distribution-vision.md and docs/specs/distribution.md now state the posture explicitly" sits in a dated explanation. The record treats it as a completed-adoption claim and preserves it. I accepted that. If the Lead reads "now state" as live navigation to the specs file, 04625 and 04626 would flip together.

Status: DONE
Summary: 6 files, 11 edges reviewed in batch-037. 4 files ok. 2 files rework: write-verify-for-a-skill-prose-change.md (maps-j-04596) and why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md (maps-j-04693). Both are preserves of never-existing live-navigation paths that have a live name-drifted holder. One further judgment question (maps-j-04595) is open.
