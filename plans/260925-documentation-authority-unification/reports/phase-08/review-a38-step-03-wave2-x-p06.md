# Review a38 step-03 wave-2 expansion, Part 06

Pin: author `ae141550c2e022310de7a0efea757580c0b2479f`; read-only worktree at `feeeeee92`. Records: `step-03-records/batch-038.jsonl`, one line per file, extracted per field with python (no checker or probes run). Each consumer was read at the pin; I read it whole by grep for every retiring-tree/path reference plus the surrounding passages. Anchor check: `node scripts/list-doc-anchors.mjs` on the target, read-only.

## Per-file verdicts

All six files are in set batch-038, stratum full-set-expansion.

| File | Edges | Verdict |
|---|---:|---|
| playbooks/architecture-advisory-artifact-templates.md (45 KB) | 2 (06495, 06496) | ok |
| playbooks/architecture-advisory-evaluation-rubric.md (22 KB) | 2 (06497, 06498) | ok |
| playbooks/architecture-advisory-role-doctrine.md (82 KB; every reference line read, plus the wrapper and L29) | 2 (06499, 06500) | ok |
| playbooks/coordination-operating-harness.md (16 KB) | 6 (06501-06506) | ok |
| playbooks/prompts/architecture-advisory-coordinator.md (4 KB) | 3 (06507-06509) | ok (06509 is the earlier rework edge, now correct) |
| playbooks/prompts/master-coordinator.md (28 KB) | 3 (06510-06512) | ok, with one Lead-judgment question on 06511 |

All paths are under `docs/platform/agent-coordination/`. Edges reviewed: 18 of 18.

## Edge notes

- **06495, 06497, 06499, 06501, 06510 (L17 Related `docs/specs/runner.md`).** Patch to `docs/platform/runner/spec.md`, Phase 9, whole-file. This follows L12-34(4) and L12-37(1). The target exists at the pin. It is not already listed in the Related block, which holds only README.md and the runner entry. The diff is a one-line swap at `@@ -14,7 +14,7 @@`, and the diff hunk matches the unit.
- **06496, 06498, 06500 (L48, L29 and L29).** These are dated retirement framing: "former engine was retired in 2180b4e7...; see `docs/specs/runner.md`'s historical CoordinationSession section". Preserve plus a non-executable successor note `runner/decisions/h-aabefc85f0c9.md`. This is correct under L12-35(3) and L12-37(5), and the note target exists. There is no in-file note, per L12-37(6).
- **06502 (coordination-operating-harness L33).** "not the frozen `docs/architect/` tree" is a live sentence that names a retiring tree as an object. Parked as description-rewrite, with equal blocked and dependency categories and a search witness. This follows L12-37(4) and matches the 06502 precedent. `docs/architect` exists at the pin, so the target fact is true.
- **06503-06506 (verification `<track>/` placeholders, L125, L421, L474, L475).** Preserve as illustrative patterns. These sit under the live `docs/platform/agent-coordination/verification/` directory, which exists with files at the pin. They are not retiring paths, so the preserve outcome is correct. The L474 and L475 lines are `test -s` commands on `<selected-track>` placeholders, so no literal file is asserted. I checked that the `test/architect/coordination-trace.test.mjs` hit (L468) is a test path, not `docs/architect`.
- **06507 (coordinator L9).** Provenance line "Retained from docs/architect/..." is preserved as lineage. Correct.
- **06508 (coordinator L35).** Dated retirement framing with a successor note. Same as 06496. Correct.
- **06509 (coordinator L40).** This is the earlier 06509 rework item.
  - It is an undated present-tense decision citation, "decision 0062 in `docs/specs/runner.md`".
  - It is patched, Phase 9, to `docs/platform/runner/decisions/h-36d872fbb0e5.md#0062-xoá-cửa-thô-...-capability`, which follows L12-37(3).
  - The `list-doc-anchors.mjs` output at the pin gives exactly this anchor for heading line 1716 ("### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work ..."). The recorded target lines 1718-1725 are inside that section.
  - The adjacent claim ("removed the raw `dispatch execute` door") is true for 0062. The decision body says it removes `dispatch execute`, `dispatch log` and `dispatch fanout-batch`.
  - The diff keeps the backtick form and the `)`.
- **06512 (master-coordinator L159).** `/docs/platform/agent-coordination/verification/<TRACK>/` is a placeholder pattern under a live directory. Preserve is correct.

## Outcome defects (rework)

None.

## Record-text notes (not rework)

- The 06511 reason asserts that the line is "a target-project repository convention, not a fixed fgOS source-checkout reader". Nothing in the source states that; see the Lead question.
- The legacy-scan exclusions in this part are all illustrative basenames (`session.md`, `intake.md`, `current-cell.md`, `index.md` and similar) and sibling playbook names. They resolve to no retiring path. 06509's file has 0 scan candidates, as expected. These look accurate, and I found no missed legacy reference in the six files' source.

## Lead-judgment question (needs ruling, not counted as rework)

**06511 (`prompts/master-coordinator.md` L105).** The prompt says "read `docs/specs/reading-map.md` and the owning area spec before touching an area's code". The record preserves it with a successor note `docs/reading-map.md`.

- **For the record's reading.** The line sits in a pasteable prompt introduced as "the repository's own agent instructions ... when present", which is generic. L12-10 keeps external-project conventions unchanged.
- **Against it.**
  - The same prompt is explicitly fgOS-aware. L96-97 says "nothing here forbids changing fgOS itself", and it has a SELF-HOSTED HOOK HAZARD section.
  - The sentence is fgOS's own AGENTS.md rule in miniature, next to the `## [Unreleased]` CHANGELOG line and the setup/doctor registration line.
  - On fgOS after Phase 9, both `docs/specs/reading-map.md` and "owning area spec" under `docs/specs/` dangle. The area specs move to `docs/platform/<area>/spec.md`.
- **My lean.** The preserve is defensible, but the "target-project convention" justification is the author's inference, not source-bound. If the Lead rules this live navigation, the correct outcome is a Phase 9 park as description-rewrite. The path and "owning area spec" must change together, and a patch to `docs/reading-map.md` alone would leave the area-spec half false. If L12-10 covers it, keep it as authored. I did not mark it rework because L12-10 gives a plausible basis and no rule here settles it.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-038, full-set-expansion | 6 | 0 |

Part 06 total: 6 files reviewed, 0 rework, 18 of 18 edges read.

Status: DONE
Summary: All 18 edges across the six batch-038 files are correct and I found no outcome defects. The 06509 anchor (decision 0062) is verified at the pin. One Lead-judgment question: whether the master-coordinator L105 reading-map preserve (06511) should be a description-rewrite park instead.
